/**
 * Supabase database helpers — server-side only.
 * Falls back to mock data when the DB returns nothing (new account / demo mode).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, ArtworkFile, TeamMember } from './types';
import { mapOrder, mapArtwork, mapTeamMember, type DbOrder, type DbArtwork, type DbProfile } from './db.types';
import { MOCK_ORDERS, MOCK_ARTWORK, MOCK_TEAM } from './mockData';

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrdersByCompany(
  supabase: SupabaseClient,
  companyId: string,
): Promise<Order[]> {
  if (!companyId) return MOCK_ORDERS;

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, ref, date, status, total, courier, tracking_number,
      estimated_delivery, invoice_ref, purchase_order_ref, notes,
      order_items (
        sku_id, product_name, dimensions, substrate,
        plate_ref, quantity, unit_price, line_total
      )
    `)
    .eq('company_id', companyId)
    .order('date', { ascending: false });

  if (error) { console.error('getOrdersByCompany:', error.message); return MOCK_ORDERS; }
  if (!data || data.length === 0) return MOCK_ORDERS; // new account — show demo data

  return (data as DbOrder[]).map(mapOrder);
}

export async function getOrderById(
  supabase: SupabaseClient,
  orderId: string,
  companyId: string,
): Promise<Order | null> {
  // Try DB first
  if (companyId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, ref, date, status, total, courier, tracking_number,
        estimated_delivery, invoice_ref, purchase_order_ref, notes,
        order_items (
          sku_id, product_name, dimensions, substrate,
          plate_ref, quantity, unit_price, line_total
        )
      `)
      .eq('id', orderId)
      .eq('company_id', companyId)
      .single();

    if (!error && data) return mapOrder(data as DbOrder);
  }

  // Fall back to mock data (covers demo orders like ord-8812)
  return MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0];
}

// ─── Artwork vault ────────────────────────────────────────────────────────────

export async function getArtworkByCompany(
  supabase: SupabaseClient,
  companyId: string,
): Promise<ArtworkFile[]> {
  if (!companyId) return MOCK_ARTWORK;

  const { data, error } = await supabase
    .from('artwork_files')
    .select('*')
    .eq('company_id', companyId)
    .order('uploaded_at', { ascending: false });

  if (error) { console.error('getArtworkByCompany:', error.message); return MOCK_ARTWORK; }
  if (!data || data.length === 0) return MOCK_ARTWORK;

  return (data as DbArtwork[]).map(mapArtwork);
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function getTeamByCompany(
  supabase: SupabaseClient,
  companyId: string,
): Promise<TeamMember[]> {
  if (!companyId) return MOCK_TEAM;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) { console.error('getTeamByCompany:', error.message); return MOCK_TEAM; }
  if (!data || data.length === 0) return MOCK_TEAM;

  return (data as DbProfile[]).map((p) => mapTeamMember(p));
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders:     number;
  activeOrders:    number;
  ytdSpend:        number;
  approvedArtwork: number;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  companyId: string,
): Promise<DashboardStats> {
  if (!companyId) {
    return { totalOrders: MOCK_ORDERS.length, activeOrders: 3, ytdSpend: 84910, approvedArtwork: 4 };
  }

  const [ordersResult, artworkResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total, date')
      .eq('company_id', companyId),
    supabase
      .from('artwork_files')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('status', 'Approved'),
  ]);

  const orders = ordersResult.data ?? [];
  const thisYear = new Date().getFullYear().toString();

  const activeStatuses = ['Pending Approval', 'In Production', 'Quality Check', 'Dispatched'];
  const activeOrders   = orders.filter((o: { status: string }) => activeStatuses.includes(o.status)).length;
  const ytdSpend       = orders
    .filter((o: { date: string }) => o.date?.startsWith(thisYear))
    .reduce((s: number, o: { total: number }) => s + (o.total ?? 0), 0);

  // Fall back to demo numbers if no real data yet
  return {
    totalOrders:     orders.length     || MOCK_ORDERS.length,
    activeOrders:    activeOrders      || 3,
    ytdSpend:        ytdSpend          || 84910,
    approvedArtwork: (artworkResult.data?.length ?? 0) || 4,
  };
}

// ─── Place order ──────────────────────────────────────────────────────────────

export interface NewOrderItem {
  skuId:       string;
  productName: string;
  dimensions:  string;
  substrate:   string;
  plateRef:    string;
  quantity:    number;
  unitPrice:   number;
  lineTotal:   number;
}

export async function placeOrder(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  items: NewOrderItem[],
  poRef?: string,
  notes?: string,
) {
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const ref   = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      company_id:         companyId,
      created_by:         userId,
      ref,
      date:               new Date().toISOString().split('T')[0],
      status:             'Pending Approval',
      total,
      purchase_order_ref: poRef  ?? null,
      notes:              notes  ?? null,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('placeOrder insert:', orderError?.message);
    return { success: false, ref: null };
  }

  const lineItems = items.map((i) => ({
    order_id:     order.id,
    sku_id:       i.skuId,
    product_name: i.productName,
    dimensions:   i.dimensions,
    substrate:    i.substrate,
    plate_ref:    i.plateRef,
    quantity:     i.quantity,
    unit_price:   i.unitPrice,
    line_total:   i.lineTotal,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(lineItems);
  if (itemsError) {
    console.error('placeOrder items:', itemsError.message);
    return { success: false, ref: null };
  }

  return { success: true, ref };
}

// ─── Admin helpers (staff only) ───────────────────────────────────────────────

export interface AdminCompany {
  id: string;
  name: string;
  abn: string | null;
  industry: string | null;
  address: string | null;
  contact_phone: string | null;
  payment_terms: string;
  credit_limit: number;
  current_owing: number;
  total_spend: number;
  status: string;
  created_at: string;
}

export async function getAllCompanies(supabase: SupabaseClient): Promise<AdminCompany[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, abn, industry, address, contact_phone, payment_terms, credit_limit, current_owing, total_spend, status, created_at')
    .order('created_at', { ascending: false });

  if (error) { console.error('getAllCompanies:', error.message); return []; }
  return (data ?? []) as AdminCompany[];
}

export async function getCompanyById(supabase: SupabaseClient, id: string): Promise<AdminCompany | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, abn, industry, address, contact_phone, payment_terms, credit_limit, current_owing, total_spend, status, created_at')
    .eq('id', id)
    .single();

  if (error) { console.error('getCompanyById:', error.message); return null; }
  return data as AdminCompany;
}

export async function getOrdersByCompanyAdmin(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, ref, date, status, total,
      order_items ( sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total )
    `)
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(5);

  if (error) { console.error('getOrdersByCompanyAdmin:', error.message); return []; }
  return ((data ?? []) as DbOrder[]).map(mapOrder);
}

export async function getAllOrdersAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, ref, date, status, total, company_id,
      order_items ( sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total ),
      companies ( name )
    `)
    .order('date', { ascending: false });

  if (error) { console.error('getAllOrdersAdmin:', error.message); return []; }
  return (data ?? []) as unknown as (DbOrder & { company_id: string; companies: { name: string } | { name: string }[] | null })[];
}

export async function getUsersByCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) { console.error('getUsersByCompany:', error.message); return []; }
  return ((data ?? []) as DbProfile[]).map((p) => mapTeamMember(p));
}
