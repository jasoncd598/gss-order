/**
 * Supabase database helpers — server-side only.
 *
 * Every query runs with the signed-in user's session, so Row Level Security
 * (supabase/migrations/003_security_and_reorders.sql) decides what is visible.
 * Mock data is only ever returned in DEMO_MODE; in real mode an empty result
 * means the company genuinely has no records yet.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Order, ArtworkFile, TeamMember, ReorderRequest, OrderStatus, ArtworkStatus,
  CatalogItem, Invitation, AppNotification, NotificationType, UserRole, PaymentStatus,
  ProductPricingRow,
} from './types';
import {
  mapOrder, mapArtwork, mapTeamMember, mapReorderRequest,
  type DbOrder, type DbArtwork, type DbProfile, type DbReorderRequest,
} from './db.types';
import {
  MOCK_ORDERS, MOCK_ARTWORK, MOCK_TEAM, MOCK_REORDER_REQUESTS,
  MOCK_CATALOG, MOCK_INVITATIONS, MOCK_NOTIFICATIONS,
} from './mockData';
import { isDemoMode } from './demo';

const ORDER_COLUMNS = `
  id, ref, date, status, total, courier, tracking_number,
  estimated_delivery, invoice_ref, purchase_order_ref, notes,
  payment_status, amount_paid, paid_at,
  order_items ( id, sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total )
`;

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrdersByCompany(supabase: SupabaseClient, companyId: string): Promise<Order[]> {
  if (isDemoMode) return MOCK_ORDERS;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('company_id', companyId)
    .order('date', { ascending: false });

  if (error) { console.error('getOrdersByCompany:', error.message); return []; }
  return (data as DbOrder[]).map(mapOrder);
}

/** RLS limits customers to their own company; staff can open any order. */
export async function getOrderById(supabase: SupabaseClient, orderId: string): Promise<Order | null> {
  if (isDemoMode) return MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0];
  if (!isUuid(orderId)) return null;

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .maybeSingle();

  if (error) { console.error('getOrderById:', error.message); return null; }
  return data ? mapOrder(data as DbOrder) : null;
}

// ─── Artwork vault ────────────────────────────────────────────────────────────

export async function getArtworkByCompany(supabase: SupabaseClient, companyId: string): Promise<ArtworkFile[]> {
  if (isDemoMode) return MOCK_ARTWORK;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('artwork_files')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getArtworkByCompany:', error.message); return []; }
  return withSignedPreviews(supabase, (data as DbArtwork[]).map(mapArtwork));
}

export const ARTWORK_BUCKET = 'artwork';
const isImage = (mime?: string | null) => !!mime && mime.startsWith('image/');

/** Swap stored image paths for short-lived signed URLs (one batched request). */
async function withSignedPreviews<T extends { storagePath?: string; mimeType?: string; previewUrl: string }>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<T[]> {
  const paths = rows.filter((r) => r.storagePath && isImage(r.mimeType)).map((r) => r.storagePath!);
  if (paths.length === 0) return rows;

  const { data, error } = await supabase.storage.from(ARTWORK_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error || !data) { console.error('createSignedUrls:', error?.message); return rows; }

  const urls = new Map(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => (r.storagePath && urls.has(r.storagePath) ? { ...r, previewUrl: urls.get(r.storagePath)! } : r));
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export async function getCatalog(supabase: SupabaseClient): Promise<CatalogItem[]> {
  if (isDemoMode) return MOCK_CATALOG;

  const { data, error } = await supabase.rpc('get_catalog');
  if (error) { console.error('get_catalog:', error.message); return []; }

  type Row = {
    artwork_id: string; name: string; plate_ref: string; version: string; status: string;
    dimensions: string | null; substrate: string | null; color_profile: string | null; preview_url: string | null;
    storage_path: string | null; mime_type: string | null;
    unit_price: number | null; last_quantity: number | null; last_ordered: string | null;
    min_quantity: number | null;
  };
  const items = (data as Row[]).map((r) => ({
    artworkId:    r.artwork_id,
    name:         r.name,
    plateRef:     r.plate_ref ?? '',
    version:      r.version ?? '',
    status:       r.status as ArtworkStatus,
    dimensions:   r.dimensions ?? '',
    substrate:    r.substrate ?? '',
    colorProfile: r.color_profile ?? '',
    previewUrl:   r.preview_url ?? '',
    storagePath:  r.storage_path ?? undefined,
    mimeType:     r.mime_type ?? undefined,
    unitPrice:    r.unit_price === null ? null : Number(r.unit_price),
    lastQuantity: r.last_quantity,
    lastOrdered:  r.last_ordered,
    minQuantity:  r.min_quantity,
  }));
  return withSignedPreviews(supabase, items);
}

/** Staff: every plate a company has artwork or a fixed price for, with both price sources. */
export async function getProductPricing(supabase: SupabaseClient, companyId: string): Promise<ProductPricingRow[]> {
  if (isDemoMode) {
    return MOCK_CATALOG.map((c) => ({
      plateRef: c.plateRef, name: c.name, hasApprovedArtwork: c.status === 'Approved', fixed: null,
      lastOrder: c.unitPrice !== null && c.lastOrdered ? { unitPrice: c.unitPrice, date: c.lastOrdered } : null,
    }));
  }
  if (!isUuid(companyId)) return [];

  const [art, prices, lines] = await Promise.all([
    supabase.from('artwork_files').select('name, plate_ref, status').eq('company_id', companyId).neq('status', 'Superseded'),
    supabase.from('product_prices').select('plate_ref, product_name, sku_id, unit_price, min_quantity, updated_at').eq('company_id', companyId),
    supabase.from('order_items')
      .select('plate_ref, unit_price, orders!inner ( company_id, date, status, created_at )')
      .eq('orders.company_id', companyId)
      .neq('orders.status', 'Cancelled'),
  ]);
  for (const r of [art, prices, lines]) if (r.error) console.error('getProductPricing:', r.error.message);

  const rows = new Map<string, ProductPricingRow>();
  const row = (plateRef: string, name: string) => {
    if (!rows.has(plateRef)) rows.set(plateRef, { plateRef, name, hasApprovedArtwork: false, fixed: null, lastOrder: null });
    return rows.get(plateRef)!;
  };

  for (const a of art.data ?? []) {
    if (!a.plate_ref) continue;
    const r = row(a.plate_ref, a.name);
    if (a.status === 'Approved') { r.hasApprovedArtwork = true; r.name = a.name; }
  }
  for (const p of prices.data ?? []) {
    row(p.plate_ref, p.product_name).fixed = {
      productName: p.product_name, skuId: p.sku_id, unitPrice: Number(p.unit_price),
      minQuantity: p.min_quantity, updatedAt: p.updated_at,
    };
  }
  type Line = { plate_ref: string | null; unit_price: number; orders: { date: string; created_at: string } | { date: string; created_at: string }[] };
  for (const l of (lines.data ?? []) as unknown as Line[]) {
    const r = l.plate_ref ? rows.get(l.plate_ref) : undefined;
    const o = Array.isArray(l.orders) ? l.orders[0] : l.orders;
    if (!r || !o) continue;
    if (!r.lastOrder || o.date > r.lastOrder.date) r.lastOrder = { unitPrice: Number(l.unit_price), date: o.date };
  }

  return [...rows.values()].sort((a, b) => Number(b.hasApprovedArtwork) - Number(a.hasApprovedArtwork) || a.name.localeCompare(b.name));
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function getTeamByCompany(supabase: SupabaseClient, companyId: string): Promise<TeamMember[]> {
  if (isDemoMode) return MOCK_TEAM;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) { console.error('getTeamByCompany:', error.message); return []; }
  return (data as DbProfile[]).map((p) => mapTeamMember(p));
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders:     number;
  activeOrders:    number;
  ytdSpend:        number;
  approvedArtwork: number;
}

const ACTIVE_STATUSES: OrderStatus[] = ['Pending Approval', 'In Production', 'Quality Check', 'Dispatched'];

export async function getDashboardStats(supabase: SupabaseClient, companyId: string): Promise<DashboardStats> {
  if (isDemoMode) return { totalOrders: MOCK_ORDERS.length, activeOrders: 3, ytdSpend: 84910, approvedArtwork: 4 };
  if (!companyId) return { totalOrders: 0, activeOrders: 0, ytdSpend: 0, approvedArtwork: 0 };

  const [ordersResult, artworkResult] = await Promise.all([
    supabase.from('orders').select('status, total, date').eq('company_id', companyId),
    supabase.from('artwork_files').select('id', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'Approved'),
  ]);

  const orders   = (ordersResult.data ?? []) as { status: OrderStatus; total: number; date: string }[];
  const thisYear = new Date().getFullYear().toString();

  return {
    totalOrders:     orders.length,
    activeOrders:    orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    ytdSpend:        orders.filter((o) => o.date?.startsWith(thisYear)).reduce((s, o) => s + (o.total ?? 0), 0),
    approvedArtwork: artworkResult.count ?? 0,
  };
}

// ─── Reorder requests ─────────────────────────────────────────────────────────

const REORDER_COLUMNS = `
  id, ref, company_id, source_order_id, created_order_id, status, items, total,
  po_ref, notes, rejection_reason, created_at,
  companies ( name ),
  source:orders!reorder_requests_source_order_id_fkey ( ref ),
  requester:profiles!reorder_requests_requested_by_fkey ( first_name, last_name, email )
`;

export async function getReorderRequestsByCompany(supabase: SupabaseClient, companyId: string): Promise<ReorderRequest[]> {
  if (isDemoMode) return MOCK_REORDER_REQUESTS.filter((r) => r.companyId === 'cmp-001');
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('reorder_requests')
    .select(REORDER_COLUMNS)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getReorderRequestsByCompany:', error.message); return []; }
  return (data as unknown as DbReorderRequest[]).map(mapReorderRequest);
}

/** Staff only — RLS returns every company's requests to staff. */
export async function getAllReorderRequests(supabase: SupabaseClient): Promise<ReorderRequest[]> {
  if (isDemoMode) return MOCK_REORDER_REQUESTS;

  const { data, error } = await supabase
    .from('reorder_requests')
    .select(REORDER_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) { console.error('getAllReorderRequests:', error.message); return []; }
  return (data as unknown as DbReorderRequest[]).map(mapReorderRequest);
}

// ─── Admin helpers (staff only) ───────────────────────────────────────────────

// Mock records use ids like 'cmp-001'; never send those to Postgres.
export const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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

export interface AdminOrderRow {
  id: string;
  ref: string;
  date: string;
  status: OrderStatus;
  total: number;
  companyId: string;
  companyName: string;
  firstProduct: string;
  paymentStatus?: PaymentStatus;
}

export const MOCK_ADMIN_COMPANIES: AdminCompany[] = [
  { id: 'cmp-001', name: 'Acme Packaging Pty Ltd',      abn: '51 824 753 556', industry: 'Packaging & Manufacturing', address: '14 Industrial Ave, Wetherill Park NSW 2164', contact_phone: '+61 2 9055 7700', payment_terms: 'Net 30',  credit_limit: 35000, current_owing: 14250, total_spend: 84910,  status: 'Active',    created_at: '2022-03-14' },
  { id: 'cmp-002', name: 'BrightBox Retail Solutions',  abn: '72 918 441 203', industry: 'Retail & FMCG',           address: '5 Commerce St, Moorabbin VIC 3189',          contact_phone: '+61 3 9874 2200', payment_terms: 'Net 14',  credit_limit: 20000, current_owing: 8100,  total_spend: 42300,  status: 'Active',    created_at: '2023-07-01' },
  { id: 'cmp-003', name: 'NorthShore Naturals',         abn: '39 501 882 117', industry: 'Health & Beauty',         address: '8 Palm Grove, Fortitude Valley QLD 4006',    contact_phone: '+61 7 3055 8800', payment_terms: 'Prepaid', credit_limit: 15000, current_owing: 0,     total_spend: 18750,  status: 'Pending',   created_at: '2024-01-18' },
  { id: 'cmp-004', name: 'TradeLink Wholesale Group',   abn: '88 344 712 990', industry: 'Wholesale Distribution',  address: '22 Kewdale Rd, Kewdale WA 6105',             contact_phone: '+61 8 9211 4400', payment_terms: 'Net 30',  credit_limit: 50000, current_owing: 50000, total_spend: 127600, status: 'Suspended', created_at: '2021-09-05' },
];

const MOCK_ADMIN_ORDERS: AdminOrderRow[] = [
  ...MOCK_ORDERS.map((o) => ({
    id: o.id, ref: o.ref, date: o.date, status: o.status, total: o.total, paymentStatus: o.paymentStatus,
    companyId: 'cmp-001', companyName: 'Acme Packaging Pty Ltd', firstProduct: o.items[0]?.productName ?? '—',
  })),
  { id: 'ord-bb-01', ref: 'ORD-2026-8790', date: '2026-10-05', status: 'In Production',    total: 9700,  paymentStatus: 'Unpaid', companyId: 'cmp-002', companyName: 'BrightBox Retail Solutions', firstProduct: 'Custom Corrugated Shipping Box' },
  { id: 'ord-ns-01', ref: 'ORD-2026-8655', date: '2026-09-30', status: 'Delivered',        total: 1440,  paymentStatus: 'Paid',   companyId: 'cmp-003', companyName: 'NorthShore Naturals',        firstProduct: 'Premium Retail Swing Tag' },
  { id: 'ord-tl-01', ref: 'ORD-2026-8410', date: '2026-09-20', status: 'Pending Approval', total: 18000, paymentStatus: 'Unpaid', companyId: 'cmp-004', companyName: 'TradeLink Wholesale Group',  firstProduct: 'Custom Corrugated Shipping Box' },
];

const COMPANY_COLUMNS = 'id, name, abn, industry, address, contact_phone, payment_terms, credit_limit, current_owing, total_spend, status, created_at';

export async function getAllCompanies(supabase: SupabaseClient): Promise<AdminCompany[]> {
  if (isDemoMode) return MOCK_ADMIN_COMPANIES;

  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) { console.error('getAllCompanies:', error.message); return []; }
  return data as AdminCompany[];
}

export async function getCompanyById(supabase: SupabaseClient, id: string): Promise<AdminCompany | null> {
  if (isDemoMode) return MOCK_ADMIN_COMPANIES.find((c) => c.id === id) ?? null;
  if (!isUuid(id)) return null;

  const { data, error } = await supabase.from('companies').select(COMPANY_COLUMNS).eq('id', id).maybeSingle();
  if (error) { console.error('getCompanyById:', error.message); return null; }
  return data as AdminCompany | null;
}

export async function getOrdersByCompanyAdmin(supabase: SupabaseClient, companyId: string): Promise<Order[]> {
  if (isDemoMode) return MOCK_ORDERS.slice(0, 4);
  if (!isUuid(companyId)) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(5);

  if (error) { console.error('getOrdersByCompanyAdmin:', error.message); return []; }
  return (data as DbOrder[]).map(mapOrder);
}

export async function getAllOrdersAdmin(supabase: SupabaseClient): Promise<AdminOrderRow[]> {
  if (isDemoMode) return MOCK_ADMIN_ORDERS;

  const { data, error } = await supabase
    .from('orders')
    .select('id, ref, date, status, total, payment_status, company_id, companies ( name ), order_items ( product_name )')
    .order('date', { ascending: false });

  if (error) { console.error('getAllOrdersAdmin:', error.message); return []; }

  type Row = {
    id: string; ref: string; date: string; status: OrderStatus; total: number; payment_status: PaymentStatus | null; company_id: string;
    companies: { name: string } | { name: string }[] | null;
    order_items: { product_name: string }[] | null;
  };
  return (data as unknown as Row[]).map((r) => {
    const company = Array.isArray(r.companies) ? r.companies[0] : r.companies;
    return {
      id: r.id, ref: r.ref, date: r.date, status: r.status, total: r.total,
      paymentStatus: r.payment_status ?? undefined,
      companyId: r.company_id,
      companyName: company?.name ?? '—',
      firstProduct: r.order_items?.[0]?.product_name ?? '—',
    };
  });
}

export async function getUsersByCompany(supabase: SupabaseClient, companyId: string): Promise<TeamMember[]> {
  if (isDemoMode) return MOCK_TEAM;
  if (!isUuid(companyId)) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) { console.error('getUsersByCompany:', error.message); return []; }
  return (data as DbProfile[]).map((p) => mapTeamMember(p));
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export async function getInvitations(supabase: SupabaseClient, companyId: string): Promise<Invitation[]> {
  if (isDemoMode) return MOCK_INVITATIONS;
  if (!isUuid(companyId)) return [];

  const { data, error } = await supabase
    .from('company_invitations')
    .select('id, email, role, status, token, created_at, expires_at')
    .eq('company_id', companyId)
    .eq('status', 'Pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) { console.error('getInvitations:', error.message); return []; }
  return (data as { id: string; email: string; role: UserRole; status: Invitation['status']; token: string; created_at: string; expires_at: string }[])
    .map((r) => ({ id: r.id, email: r.email, role: r.role, status: r.status, token: r.token, createdAt: r.created_at, expiresAt: r.expires_at }));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(supabase: SupabaseClient, limit = 50): Promise<AppNotification[]> {
  if (isDemoMode) return MOCK_NOTIFICATIONS;

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('getNotifications:', error.message); return []; }
  return (data as { id: string; type: NotificationType; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }[])
    .map((r) => ({ id: r.id, type: r.type, title: r.title, body: r.body ?? '', link: r.link ?? '/', read: !!r.read_at, createdAt: r.created_at }));
}

// ─── Staff overview ───────────────────────────────────────────────────────────

export interface AdminOverview {
  pendingReorders:   number;
  pendingCompanies:  AdminCompany[];
  ordersByStatus:    Record<OrderStatus, number>;
  awaitingApproval:  AdminOrderRow[];
  recentReorders:    ReorderRequest[];
  activeCompanies:   number;
}

export async function getAdminOverview(supabase: SupabaseClient): Promise<AdminOverview> {
  const [companies, orders, reorders] = await Promise.all([
    getAllCompanies(supabase),
    getAllOrdersAdmin(supabase),
    getAllReorderRequests(supabase),
  ]);

  const ordersByStatus = {
    'Pending Approval': 0, 'In Production': 0, 'Quality Check': 0, 'Dispatched': 0, 'Delivered': 0, 'Cancelled': 0,
  } as Record<OrderStatus, number>;
  for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;

  return {
    pendingReorders:  reorders.filter((r) => r.status === 'Pending').length,
    pendingCompanies: companies.filter((c) => c.status === 'Pending'),
    ordersByStatus,
    awaitingApproval: orders.filter((o) => o.status === 'Pending Approval').slice(0, 8),
    recentReorders:   reorders.filter((r) => r.status === 'Pending').slice(0, 5),
    activeCompanies:  companies.filter((c) => c.status === 'Active').length,
  };
}

// ─── Global search ────────────────────────────────────────────────────────────

export interface SearchResults {
  orders:  { id: string; ref: string; date: string; status: OrderStatus; detail: string }[];
  artwork: { id: string; name: string; plateRef: string; version: string; status: ArtworkStatus }[];
}

/**
 * Searches orders (ref, PO, product, plate, SKU) and artwork (name, plate).
 * RLS scopes customers to their company; staff search everything.
 */
export async function searchPortal(supabase: SupabaseClient, rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (q.length < 2) return { orders: [], artwork: [] };

  if (isDemoMode) {
    const needle = q.toLowerCase();
    return {
      orders: MOCK_ORDERS
        .filter((o) => [o.ref, o.purchaseOrderRef ?? '', ...o.items.flatMap((i) => [i.productName, i.plateRef, i.skuId])]
          .some((v) => v.toLowerCase().includes(needle)))
        .map((o) => ({ id: o.id, ref: o.ref, date: o.date, status: o.status, detail: o.items[0]?.productName ?? '' })),
      artwork: MOCK_ARTWORK
        .filter((a) => a.name.toLowerCase().includes(needle) || a.plateRef.toLowerCase().includes(needle))
        .map((a) => ({ id: a.id, name: a.name, plateRef: a.plateRef, version: a.version, status: a.status })),
    };
  }

  // Strip characters that have meaning in PostgREST filter syntax
  const term = `%${q.replace(/[%_,()*\\]/g, ' ')}%`;

  const [byOrder, byLine, art] = await Promise.all([
    supabase.from('orders')
      .select('id, ref, date, status, order_items ( product_name )')
      .or(`ref.ilike.${term},purchase_order_ref.ilike.${term}`)
      .order('date', { ascending: false }).limit(20),
    supabase.from('order_items')
      .select('product_name, orders!inner ( id, ref, date, status )')
      .or(`product_name.ilike.${term},plate_ref.ilike.${term},sku_id.ilike.${term}`)
      .limit(40),
    supabase.from('artwork_files')
      .select('id, name, plate_ref, version, status')
      .or(`name.ilike.${term},plate_ref.ilike.${term}`)
      .limit(20),
  ]);

  type OrderHit = SearchResults['orders'][number];
  const orders = new Map<string, OrderHit>();
  for (const o of (byOrder.data ?? []) as { id: string; ref: string; date: string; status: OrderStatus; order_items: { product_name: string }[] }[]) {
    orders.set(o.id, { id: o.id, ref: o.ref, date: o.date, status: o.status, detail: o.order_items?.[0]?.product_name ?? '' });
  }
  for (const l of (byLine.data ?? []) as unknown as { product_name: string; orders: { id: string; ref: string; date: string; status: OrderStatus } | { id: string; ref: string; date: string; status: OrderStatus }[] }[]) {
    const o = Array.isArray(l.orders) ? l.orders[0] : l.orders;
    if (o && !orders.has(o.id)) orders.set(o.id, { ...o, detail: l.product_name });
  }

  return {
    orders: [...orders.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    artwork: ((art.data ?? []) as { id: string; name: string; plate_ref: string; version: string; status: ArtworkStatus }[])
      .map((a) => ({ id: a.id, name: a.name, plateRef: a.plate_ref, version: a.version, status: a.status })),
  };
}
