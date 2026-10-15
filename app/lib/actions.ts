'use server';

import { refresh } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from './supabase/server';
import { ARTWORK_BUCKET, isUuid } from './db';
import { isDemoMode } from './demo';
import { CURRENCY, getStripe, orderChargeCents, recordCheckoutSession } from './stripe';
import { queueEmailDelivery, sendInvitationEmail } from './email';
import type { ArtworkStatus, OrderStatus, UserRole } from './types';

/**
 * Server Actions. Every write runs as the signed-in user, so the database
 * (RLS + SECURITY DEFINER functions in migration 003) is the real gatekeeper;
 * the checks here exist to return friendly messages.
 */

export interface ActionResult {
  success: boolean;
  ref?: string;
  error?: string;
}

const ORDERING_ROLES = ['Admin', 'Procurement Manager'];

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, is_staff, companies ( status )')
    .eq('id', user.id)
    .single();

  return { supabase, user, profile };
}

function companyStatusOf(profile: { companies: unknown } | null): string | undefined {
  const c = profile?.companies as { status: string } | { status: string }[] | null | undefined;
  return Array.isArray(c) ? c[0]?.status : c?.status;
}

/** Returns an error message if this user may not order, otherwise null. */
function orderingBlockedReason(profile: Awaited<ReturnType<typeof getContext>>['profile']): string | null {
  if (!profile?.company_id) return 'Your account is not linked to a company yet. Please contact support.';
  if (!ORDERING_ROLES.includes(profile.role)) return 'Your role does not allow placing orders. Ask your company admin.';
  const status = companyStatusOf(profile);
  if (status === 'Pending')   return 'Your company account is awaiting approval by our team.';
  if (status === 'Suspended') return 'Your company account is on hold. Please contact accounts.';
  return null;
}

const demoRef = (prefix: string) => `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

// ─── Customer: place order from cart ─────────────────────────────────────────

export interface PlaceOrderInput {
  /** Only plate + quantity are sent; the database prices each line */
  items: { plateRef: string; quantity: number }[];
  poRef?: string;
  notes?: string;
}

export interface PlaceOrderResult extends ActionResult {
  orderId?: string;
  total?: number;
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (isDemoMode) return { success: true, ref: demoRef('ORD') };

  const { supabase, user, profile } = await getContext();
  if (!user) return { success: false, error: 'Not authenticated' };

  const blocked = orderingBlockedReason(profile);
  if (blocked) return { success: false, error: blocked };

  const { data, error } = await supabase.rpc('place_order', {
    p_items:  input.items.map((i) => ({ plate_ref: i.plateRef, quantity: Math.floor(i.quantity) })),
    p_po_ref: input.poRef ?? null,
    p_notes:  input.notes ?? null,
  });
  if (error) {
    console.error('place_order:', error.message);
    return { success: false, error: error.message };
  }

  queueEmailDelivery();
  refresh();
  const order = data as { id: string; ref: string; total: number };
  return { success: true, orderId: order.id, ref: order.ref, total: Number(order.total) };
}

// ─── Customer: pay an order by card (Stripe Checkout) ────────────────────────

const PAYING_ROLES = ['Admin', 'Procurement Manager', 'Finance'];

// Tags these sessions in the Stripe Dashboard
const CHECKOUT_INTEGRATION_ID = 'gss-order-pay-KQZRWMTB';

export interface CheckoutResult extends ActionResult {
  /** Stripe-hosted payment page to redirect to */
  url?: string;
}

export async function createOrderCheckoutAction(orderId: string): Promise<CheckoutResult> {
  if (isDemoMode) return { success: false, error: 'Card payments are disabled in demo mode.' };
  if (!isUuid(orderId)) return { success: false, error: 'Order not found' };

  const { supabase, user, profile } = await getContext();
  if (!user) return { success: false, error: 'Not authenticated' };
  if (!profile?.is_staff && !PAYING_ROLES.includes(profile?.role)) {
    return { success: false, error: 'Your role does not allow paying orders. Ask your company admin.' };
  }

  // RLS: customers only see their own company's orders
  const { data: order } = await supabase
    .from('orders')
    .select('id, ref, total, status, payment_status, stripe_checkout_session_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { success: false, error: 'Order not found' };
  if (order.status === 'Cancelled')         return { success: false, error: 'This order has been cancelled.' };
  if (order.payment_status === 'Paid')       return { success: false, error: 'This order is already paid.' };
  if (order.payment_status === 'Processing') return { success: false, error: 'A payment for this order is already processing.' };

  const charge = orderChargeCents(Number(order.total));
  if (charge.total < 50) return { success: false, error: 'This order total is too small to pay by card.' };

  try {
    const stripe = getStripe();

    // Reuse an open session so one order isn't paid twice from two tabs
    if (order.stripe_checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      if (existing.status === 'open') {
        if (existing.amount_total === charge.total && existing.url) return { success: true, url: existing.url };
        await stripe.checkout.sessions.expire(existing.id);
      }
    }

    const base = await origin();
    const metadata = { order_id: order.id, order_ref: order.ref };
    const lineItems = [{
      quantity: 1,
      price_data: { currency: CURRENCY, unit_amount: charge.net, product_data: { name: `Order ${order.ref}`, description: 'Trade order (excl. GST)' } },
    }];
    if (charge.gst > 0) {
      lineItems.push({ quantity: 1, price_data: { currency: CURRENCY, unit_amount: charge.gst, product_data: { name: 'GST (10%)', description: 'Goods and Services Tax' } } });
    }

    const session = await stripe.checkout.sessions.create({
      mode:                   'payment',
      line_items:             lineItems,
      client_reference_id:    order.id,
      customer_email:         user.email,
      metadata,
      payment_intent_data:    { metadata, description: `GSS order ${order.ref}` },
      success_url:            `${base}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:             `${base}/order/${order.id}?payment=cancelled`,
      integration_identifier: CHECKOUT_INTEGRATION_ID,
    });
    if (!session.url) return { success: false, error: 'Could not start checkout. Please try again.' };

    await recordCheckoutSession(order.id, session.id);
    return { success: true, url: session.url };
  } catch (err) {
    console.error('createOrderCheckoutAction:', (err as Error).message);
    return { success: false, error: 'Could not start card payment. Please try again or contact accounts.' };
  }
}

// ─── Customer: reorder a previous order ──────────────────────────────────────

export interface ReorderInput {
  sourceOrderId: string;
  /** order_items.id → new quantity (0 drops the line) */
  quantities: Record<string, number>;
  poRef?: string;
  notes?: string;
}

export async function createReorderRequestAction(input: ReorderInput): Promise<ActionResult> {
  if (isDemoMode) return { success: true, ref: demoRef('RRQ') };

  const { supabase, user, profile } = await getContext();
  if (!user) return { success: false, error: 'Not authenticated' };

  const blocked = orderingBlockedReason(profile);
  if (blocked) return { success: false, error: blocked };

  const quantities = Object.fromEntries(
    Object.entries(input.quantities).filter(([, q]) => Number.isInteger(q) && q > 0),
  );
  if (Object.keys(quantities).length === 0) {
    return { success: false, error: 'Choose a quantity for at least one item.' };
  }

  const { data, error } = await supabase.rpc('create_reorder_request', {
    p_source_order_id: input.sourceOrderId,
    p_quantities:      quantities,
    p_po_ref:          input.poRef ?? null,
    p_notes:           input.notes ?? null,
  });

  if (error) {
    console.error('create_reorder_request:', error.message);
    return { success: false, error: error.message };
  }

  queueEmailDelivery();
  refresh();
  return { success: true, ref: (data as { ref: string }).ref };
}

export async function cancelReorderRequestAction(requestId: string): Promise<ActionResult> {
  if (isDemoMode) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc('close_reorder_request', { p_request_id: requestId, p_status: 'Cancelled' });
  if (error) return { success: false, error: error.message };

  queueEmailDelivery();
  refresh();
  return { success: true };
}

// ─── Staff: reorder review ───────────────────────────────────────────────────

export async function approveReorderRequestAction(requestId: string): Promise<ActionResult> {
  if (isDemoMode) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc('approve_reorder_request', { p_request_id: requestId });
  if (error) {
    console.error('approve_reorder_request:', error.message);
    return { success: false, error: error.message };
  }

  queueEmailDelivery();
  refresh();
  return { success: true };
}

export async function rejectReorderRequestAction(requestId: string, reason: string): Promise<ActionResult> {
  if (isDemoMode) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc('close_reorder_request', {
    p_request_id: requestId,
    p_status:     'Rejected',
    p_reason:     reason,
  });
  if (error) return { success: false, error: error.message };

  queueEmailDelivery();
  refresh();
  return { success: true };
}

// ─── Staff: order + company management ───────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = ['Pending Approval', 'In Production', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'];

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<ActionResult> {
  if (!ORDER_STATUSES.includes(status)) return { success: false, error: 'Invalid status' };
  if (isDemoMode) return { success: true };

  const { supabase, profile } = await getContext();
  if (!profile?.is_staff) return { success: false, error: 'Staff only' };

  // RLS: only staff can update orders; .select() lets us detect a silent no-op
  const { data, error } = await supabase
    .from('orders')
    .update({ status, status_updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('id');

  if (error || !data?.length) return { success: false, error: error?.message ?? 'Order not found' };

  queueEmailDelivery();
  refresh();
  return { success: true };
}

const COMPANY_STATUSES = ['Active', 'Pending', 'Suspended'];

export async function setCompanyStatusAction(companyId: string, status: string): Promise<ActionResult> {
  if (!COMPANY_STATUSES.includes(status)) return { success: false, error: 'Invalid status' };
  if (isDemoMode) return { success: true };

  const { supabase, profile } = await getContext();
  if (!profile?.is_staff) return { success: false, error: 'Staff only' };

  const { data, error } = await supabase.from('companies').update({ status }).eq('id', companyId).select('id');
  if (error || !data?.length) return { success: false, error: error?.message ?? 'Company not found' };

  queueEmailDelivery();
  refresh();
  return { success: true };
}

// ─── Team management ─────────────────────────────────────────────────────────

const ROLES: UserRole[] = ['Admin', 'Procurement Manager', 'Finance', 'Viewer'];

async function origin() {
  const h = await headers();
  return h.get('origin') ?? `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
}

export interface InviteResult extends ActionResult {
  link?: string;
  /** True when the invite link was also emailed to the invitee */
  emailed?: boolean;
}

/** Company Admin invites to own company; staff pass companyId to invite anywhere. */
export async function createInvitationAction(email: string, role: UserRole, companyId?: string): Promise<InviteResult> {
  if (!ROLES.includes(role)) return { success: false, error: 'Invalid role' };
  const base = await origin();
  if (isDemoMode) return { success: true, link: `${base}/registration?invite=00000000-0000-4000-8000-000000000001` };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_invitation', {
    p_email: email, p_role: role, p_company_id: companyId && isUuid(companyId) ? companyId : null,
  });
  if (error) return { success: false, error: error.message };

  const invite = data as { token: string; company_id: string };
  const link = `${base}/registration?invite=${invite.token}`;
  const { data: company } = await supabase.from('companies').select('name').eq('id', invite.company_id).maybeSingle();
  const emailed = await sendInvitationEmail(email, link, role, company?.name);
  refresh();
  return { success: true, link, emailed };
}

export async function revokeInvitationAction(id: string): Promise<ActionResult> {
  if (isDemoMode) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.rpc('revoke_invitation', { p_id: id });
  if (error) return { success: false, error: error.message };
  refresh();
  return { success: true };
}

/** RLS + guard trigger restrict this to the company's Admin (never on themselves) or staff. */
export async function updateTeamMemberAction(
  userId: string,
  changes: { role?: UserRole; status?: 'Active' | 'Suspended' },
): Promise<ActionResult> {
  if (changes.role && !ROLES.includes(changes.role)) return { success: false, error: 'Invalid role' };
  if (changes.status && !['Active', 'Suspended'].includes(changes.status)) return { success: false, error: 'Invalid status' };
  if (isDemoMode) return { success: true };

  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').update(changes).eq('id', userId).select('id');
  if (error) return { success: false, error: error.message };
  if (!data?.length) return { success: false, error: 'You do not have permission to change this user' };

  refresh();
  return { success: true };
}

export async function updateProfileAction(firstName: string, lastName: string): Promise<ActionResult> {
  const first = firstName.trim(), last = lastName.trim();
  if (!first) return { success: false, error: 'First name is required' };
  if (isDemoMode) return { success: true };

  const { supabase, user } = await getContext();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('profiles').update({ first_name: first, last_name: last }).eq('id', user.id);
  if (error) return { success: false, error: error.message };

  refresh();
  return { success: true };
}

// ─── Artwork ─────────────────────────────────────────────────────────────────

export async function reviewArtworkAction(
  artworkId: string,
  decision: 'Approved' | 'Revision Required',
  comment?: string,
): Promise<ActionResult> {
  if (isDemoMode) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc('review_artwork', { p_id: artworkId, p_decision: decision, p_comment: comment ?? null });
  if (error) return { success: false, error: error.message };

  queueEmailDelivery();
  refresh();
  return { success: true };
}

export interface FileUrlResult extends ActionResult {
  url?: string;
}

/**
 * Short-lived signed URL for an artwork file. Storage RLS decides access, so a
 * customer can only sign files in their own company's folder.
 */
export async function getArtworkFileUrlAction(artworkId: string, download = true): Promise<FileUrlResult> {
  if (isDemoMode || !isUuid(artworkId)) return { success: false, error: 'Sample artwork has no file attached.' };

  const supabase = await createClient();
  const { data: art } = await supabase
    .from('artwork_files')
    .select('storage_path, file_name')
    .eq('id', artworkId)
    .maybeSingle();
  if (!art?.storage_path) return { success: false, error: 'No file has been uploaded for this artwork yet.' };

  const { data, error } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .createSignedUrl(art.storage_path, 5 * 60, download ? { download: art.file_name ?? true } : undefined);
  if (error || !data) return { success: false, error: error?.message ?? 'Could not create download link' };

  return { success: true, url: data.signedUrl };
}

export interface NewArtworkInput {
  companyId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  name: string;
  plateRef: string;
  version: string;
  dimensions?: string;
  substrate?: string;
  colorProfile?: string;
  status: ArtworkStatus;
}

/** Staff: record a file that the browser has already uploaded to storage. */
export async function createArtworkRecordAction(input: NewArtworkInput): Promise<ActionResult> {
  if (isDemoMode) return { success: true };

  const { supabase, user, profile } = await getContext();
  if (!profile?.is_staff) return { success: false, error: 'Staff only' };
  if (!input.storagePath.startsWith(`${input.companyId}/`)) return { success: false, error: 'File is not in this company\'s folder' };

  const { data: me } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', user!.id).single();
  const uploader = [me?.first_name, me?.last_name].filter(Boolean).join(' ') || me?.email || 'GSS Studio';
  const mb = input.fileSize / (1024 * 1024);

  const { error } = await supabase.from('artwork_files').insert({
    company_id:    input.companyId,
    name:          input.name.trim(),
    plate_ref:     input.plateRef.trim() || null,
    version:       input.version.trim() || 'v1',
    status:        input.status,
    dimensions:    input.dimensions?.trim() || null,
    substrate:     input.substrate?.trim() || null,
    color_profile: input.colorProfile?.trim() || null,
    uploaded_by:   uploader,
    uploaded_at:   new Date().toISOString().slice(0, 10),
    file_size:     mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(input.fileSize / 1024))} KB`,
    storage_path:  input.storagePath,
    file_name:     input.fileName,
    mime_type:     input.mimeType,
  });
  if (error) return { success: false, error: error.message };

  queueEmailDelivery();
  refresh();
  return { success: true };
}

// ─── Staff: companies ────────────────────────────────────────────────────────

export interface CompanyInput {
  id?: string;
  name: string;
  abn?: string;
  industry?: string;
  address?: string;
  contactPhone?: string;
  paymentTerms: string;
  creditLimit: number;
  status: string;
}

export interface SaveCompanyResult extends ActionResult {
  id?: string;
}

export async function saveCompanyAction(input: CompanyInput): Promise<SaveCompanyResult> {
  if (!input.name.trim()) return { success: false, error: 'Company name is required' };
  if (!COMPANY_STATUSES.includes(input.status)) return { success: false, error: 'Invalid status' };
  if (!(input.creditLimit >= 0)) return { success: false, error: 'Credit limit must be zero or more' };
  if (isDemoMode) return { success: true, id: input.id ?? 'cmp-001' };

  const { supabase, profile } = await getContext();
  if (!profile?.is_staff) return { success: false, error: 'Staff only' };

  const row = {
    name:          input.name.trim(),
    abn:           input.abn?.trim() || null,
    industry:      input.industry?.trim() || null,
    address:       input.address?.trim() || null,
    contact_phone: input.contactPhone?.trim() || null,
    payment_terms: input.paymentTerms,
    credit_limit:  input.creditLimit,
    status:        input.status,
  };

  const query = input.id
    ? supabase.from('companies').update(row).eq('id', input.id).select('id').single()
    : supabase.from('companies').insert(row).select('id').single();
  const { data, error } = await query;
  if (error || !data) return { success: false, error: error?.message ?? 'Save failed' };

  queueEmailDelivery();
  refresh();
  return { success: true, id: data.id };
}

// ─── Staff: product pricing ──────────────────────────────────────────────────

export interface ProductPriceInput {
  companyId: string;
  plateRef: string;
  productName: string;
  skuId?: string;
  unitPrice: number;
  minQuantity: number;
}

/** Sets (or replaces) a company's fixed price for one plate. RLS: staff only. */
export async function saveProductPriceAction(input: ProductPriceInput): Promise<ActionResult> {
  const plateRef = input.plateRef.trim();
  const productName = input.productName.trim();
  if (!isUuid(input.companyId)) return { success: false, error: 'Company not found' };
  if (!plateRef)    return { success: false, error: 'Plate reference is required' };
  if (!productName) return { success: false, error: 'Product name is required' };
  if (!(input.unitPrice > 0) || input.unitPrice > 1_000_000) return { success: false, error: 'Unit price must be more than $0' };
  if (!Number.isInteger(input.minQuantity) || input.minQuantity < 1) return { success: false, error: 'Minimum quantity must be a whole number of at least 1' };
  if (isDemoMode) return { success: true };

  const { supabase, user, profile } = await getContext();
  if (!profile?.is_staff) return { success: false, error: 'Staff only' };

  const { error } = await supabase.from('product_prices').upsert({
    company_id:   input.companyId,
    plate_ref:    plateRef,
    product_name: productName,
    sku_id:       input.skuId?.trim() || null,
    unit_price:   Math.round(input.unitPrice * 10000) / 10000,
    min_quantity: input.minQuantity,
    updated_at:   new Date().toISOString(),
    updated_by:   user!.id,
  }, { onConflict: 'company_id,plate_ref' });
  if (error) return { success: false, error: error.message };

  refresh();
  return { success: true };
}

/** Removes a fixed price; the plate falls back to its last order price. */
export async function deleteProductPriceAction(companyId: string, plateRef: string): Promise<ActionResult> {
  if (!isUuid(companyId)) return { success: false, error: 'Company not found' };
  if (isDemoMode) return { success: true };

  const { supabase, profile } = await getContext();
  if (!profile?.is_staff) return { success: false, error: 'Staff only' };

  const { data, error } = await supabase.from('product_prices').delete()
    .eq('company_id', companyId).eq('plate_ref', plateRef).select('id');
  if (error) return { success: false, error: error.message };
  if (!data?.length) return { success: false, error: 'Price not found' };

  refresh();
  return { success: true };
}

// ─── Notifications ───────────────────────────────────────────────────────────

/** Marks the given notifications (or all unread) as read for the current user. */
export async function markNotificationsReadAction(ids?: string[]): Promise<ActionResult> {
  if (isDemoMode) return { success: true };

  const supabase = await createClient();
  let query = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (ids?.length) query = query.in('id', ids);
  const { error } = await query;
  if (error) return { success: false, error: error.message };

  refresh();
  return { success: true };
}
