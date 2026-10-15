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
  ProductPricingRow, OrderDocument, DocumentKind,
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
  id, company_id, ref, date, status, total, courier, tracking_number,
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
  firstPlateRef: string | null;
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
    companyId: 'cmp-001', companyName: 'Acme Packaging Pty Ltd', firstProduct: o.items[0]?.productName ?? '—', firstPlateRef: o.items[0]?.plateRef ?? null,
  })),
  { id: 'ord-bb-01', ref: 'ORD-2026-8790', date: '2026-10-05', status: 'In Production',    total: 5700,  paymentStatus: 'Unpaid', companyId: 'cmp-002', companyName: 'BrightBox Retail Solutions', firstProduct: 'Hand-Painted Ceramic Plate – Lavender & Bees', firstPlateRef: 'PLT-3301-E' },
  { id: 'ord-ns-01', ref: 'ORD-2026-8655', date: '2026-09-30', status: 'Delivered',        total: 4160,  paymentStatus: 'Paid',   companyId: 'cmp-003', companyName: 'NorthShore Naturals',        firstProduct: 'Hand-Painted Ceramic Plate – Peacock', firstPlateRef: 'PLT-4470-G' },
  { id: 'ord-tl-01', ref: 'ORD-2026-8410', date: '2026-09-20', status: 'Pending Approval', total: 18000, paymentStatus: 'Unpaid', companyId: 'cmp-004', companyName: 'TradeLink Wholesale Group',  firstProduct: 'Cast Brass Works Plate – Blue Enamel', firstPlateRef: 'PLT-8812-B' },
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
    .select('id, ref, date, status, total, payment_status, company_id, companies ( name ), order_items ( product_name, plate_ref )')
    .order('date', { ascending: false });

  if (error) { console.error('getAllOrdersAdmin:', error.message); return []; }

  type Row = {
    id: string; ref: string; date: string; status: OrderStatus; total: number; payment_status: PaymentStatus | null; company_id: string;
    companies: { name: string } | { name: string }[] | null;
    order_items: { product_name: string; plate_ref: string | null }[] | null;
  };
  return (data as unknown as Row[]).map((r) => {
    const company = Array.isArray(r.companies) ? r.companies[0] : r.companies;
    return {
      id: r.id, ref: r.ref, date: r.date, status: r.status, total: r.total,
      paymentStatus: r.payment_status ?? undefined,
      companyId: r.company_id,
      companyName: company?.name ?? '—',
      firstProduct: r.order_items?.[0]?.product_name ?? '—',
      firstPlateRef: r.order_items?.[0]?.plate_ref ?? null,
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

// ─── Staff: portal subscriptions (Stripe Billing) ─────────────────────────────

export interface SubscriptionRow {
  id: string;
  companyName: string | null;
  email: string | null;
  plan: string;
  interval: 'month' | 'year';
  status: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

const MOCK_SUBSCRIPTIONS: SubscriptionRow[] = [
  { id: 'sub-1', companyName: 'Harbour Signs Co',        email: 'ops@harboursigns.test',     plan: 'growth',  interval: 'month', status: 'active',   cancelAtPeriodEnd: false, trialEnd: null,         currentPeriodEnd: '2026-11-02', createdAt: '2026-08-19' },
  { id: 'sub-2', companyName: 'Brassworks Foundry',      email: 'admin@brassworks.test',     plan: 'scale',   interval: 'year',  status: 'active',   cancelAtPeriodEnd: false, trialEnd: null,         currentPeriodEnd: '2027-07-01', createdAt: '2026-06-17' },
  { id: 'sub-3', companyName: 'Kiln & Glaze Studio',     email: 'hello@kilnglaze.test',      plan: 'starter', interval: 'month', status: 'trialing', cancelAtPeriodEnd: false, trialEnd: '2026-10-24', currentPeriodEnd: '2026-10-24', createdAt: '2026-10-10' },
  { id: 'sub-4', companyName: 'Southern Print Supplies', email: 'accounts@southernprint.test', plan: 'growth', interval: 'month', status: 'past_due', cancelAtPeriodEnd: false, trialEnd: null,         currentPeriodEnd: '2026-10-12', createdAt: '2026-04-03' },
  { id: 'sub-5', companyName: 'Metro Labels',            email: 'it@metrolabels.test',       plan: 'starter', interval: 'year',  status: 'active',   cancelAtPeriodEnd: true,  trialEnd: null,         currentPeriodEnd: '2026-12-15', createdAt: '2025-12-15' },
];

/** RLS: staff only. */
export async function getSubscriptions(supabase: SupabaseClient): Promise<SubscriptionRow[]> {
  if (isDemoMode) return MOCK_SUBSCRIPTIONS;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, company_name, email, plan, billing_interval, status, cancel_at_period_end, trial_end, current_period_end, created_at')
    .order('created_at', { ascending: false });
  if (error) { console.error('getSubscriptions:', error.message); return []; }

  return data.map((r) => ({
    id: r.id, companyName: r.company_name, email: r.email, plan: r.plan,
    interval: r.billing_interval === 'year' ? 'year' : 'month', status: r.status,
    cancelAtPeriodEnd: r.cancel_at_period_end, trialEnd: r.trial_end,
    currentPeriodEnd: r.current_period_end, createdAt: r.created_at,
  }));
}

// ─── Audit log (staff) ───────────────────────────────────────────────────────

export type AuditArea = 'product_prices' | 'orders' | 'companies' | 'profiles' | 'artwork_files' | 'company_invitations' | 'order_documents';

export interface AuditEntry {
  id: number;
  at: string;
  actorEmail: string | null;
  /** 'user' = a signed-in person; 'system' = the server (e.g. a Stripe payment webhook) */
  actorKind: 'user' | 'system';
  area: AuditArea;
  recordId: string | null;
  label: string | null;
  companyId: string | null;
  companyName: string | null;
  action: 'insert' | 'update' | 'delete';
  /** update: { column: { from, to } }; insert / delete: { column: value } */
  changes: Record<string, unknown>;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: 6, at: '2026-10-14T23:12:00Z', actorEmail: 'staff@gss.com.au', actorKind: 'user', area: 'orders', recordId: 'ord-1', label: 'ORD-29402', companyId: 'c1', companyName: 'Acme Packaging Pty Ltd', action: 'update', changes: { status: { from: 'In Production', to: 'Quality Check' } } },
  { id: 5, at: '2026-10-14T05:40:00Z', actorEmail: null, actorKind: 'system', area: 'orders', recordId: 'ord-2', label: 'ORD-29388', companyId: 'c1', companyName: 'Acme Packaging Pty Ltd', action: 'update', changes: { payment_status: { from: 'Unpaid', to: 'Paid' }, amount_paid: { from: null, to: 1840.5 } } },
  { id: 4, at: '2026-10-13T22:05:00Z', actorEmail: 'staff@gss.com.au', actorKind: 'user', area: 'product_prices', recordId: 'pp-1', label: 'PLT-4471', companyId: 'c1', companyName: 'Acme Packaging Pty Ltd', action: 'update', changes: { unit_price: { from: 1.25, to: 1.18 } } },
  { id: 3, at: '2026-10-12T01:30:00Z', actorEmail: 's.jenkins@gss-demo.com.au', actorKind: 'user', area: 'profiles', recordId: 'u-2', label: 'Tom Nguyen', companyId: 'c1', companyName: 'Acme Packaging Pty Ltd', action: 'update', changes: { role: { from: 'Viewer', to: 'Procurement Manager' } } },
  { id: 2, at: '2026-10-11T03:15:00Z', actorEmail: 'staff@gss.com.au', actorKind: 'user', area: 'companies', recordId: 'c2', label: 'Harbour Signs Co', companyId: 'c2', companyName: 'Harbour Signs Co', action: 'update', changes: { status: { from: 'Pending', to: 'Active' }, credit_limit: { from: 0, to: 10000 } } },
  { id: 1, at: '2026-10-10T00:48:00Z', actorEmail: 's.jenkins@gss-demo.com.au', actorKind: 'user', area: 'company_invitations', recordId: 'inv-1', label: 'accounts@acme.com.au', companyId: 'c1', companyName: 'Acme Packaging Pty Ltd', action: 'insert', changes: { email: 'accounts@acme.com.au', role: 'Finance', status: 'Pending' } },
];

/** Latest audit entries, newest first. Only staff can read them (RLS, migration 009). */
export async function getAuditLog(supabase: SupabaseClient, area?: AuditArea, limit = 200): Promise<AuditEntry[]> {
  if (isDemoMode) return area ? MOCK_AUDIT.filter((e) => e.area === area) : MOCK_AUDIT;

  let query = supabase
    .from('audit_log')
    .select('id, at, actor_email, actor_kind, table_name, record_id, label, company_id, action, changes')
    .order('at', { ascending: false })
    .limit(limit);
  if (area) query = query.eq('table_name', area);
  const { data, error } = await query;
  if (error) { console.error('getAuditLog:', error.message); return []; }

  // The log keeps no foreign keys (entries outlive deleted rows), so look names up
  const companyIds = [...new Set(data.map((r) => r.company_id).filter(Boolean))];
  const { data: companies } = companyIds.length
    ? await supabase.from('companies').select('id, name').in('id', companyIds)
    : { data: [] };
  const companyName = new Map((companies ?? []).map((c) => [c.id, c.name as string]));

  return data.map((r) => ({
    id: r.id, at: r.at, actorEmail: r.actor_email, actorKind: r.actor_kind === 'system' ? 'system' : 'user',
    area: r.table_name as AuditArea, recordId: r.record_id, label: r.label, companyId: r.company_id,
    companyName: companyName.get(r.company_id) ?? null,
    action: r.action as AuditEntry['action'], changes: (r.changes ?? {}) as Record<string, unknown>,
  }));
}

// ─── Order documents ─────────────────────────────────────────────────────────

export const DOCUMENTS_BUCKET = 'documents';

const MOCK_DOCUMENTS: OrderDocument[] = [
  { id: 'doc-1', orderId: 'ord-8812', kind: 'Delivery docket',        title: 'StarTrack delivery docket',        fileName: 'docket-ORD-2026-8812.pdf', mimeType: 'application/pdf', fileSize: 184_320, createdAt: '2026-10-02T03:10:00Z' },
  { id: 'doc-2', orderId: 'ord-8812', kind: 'Compliance certificate', title: 'Material certificate — cast brass', fileName: 'cert-brass-CZ121.pdf',     mimeType: 'application/pdf', fileSize: 412_000, createdAt: '2026-09-30T05:45:00Z' },
  { id: 'doc-3', orderId: 'ord-8740', kind: 'Signed quote',           title: 'Signed quote Q-2026-311',           fileName: 'Q-2026-311-signed.pdf',    mimeType: 'application/pdf', fileSize: 96_000,  createdAt: '2026-09-18T00:20:00Z' },
];

/** Documents on an order, newest first. RLS: own company or staff. */
export async function getOrderDocuments(supabase: SupabaseClient, orderId: string): Promise<OrderDocument[]> {
  if (isDemoMode) return MOCK_DOCUMENTS.filter((d) => d.orderId === orderId);
  if (!isUuid(orderId)) return [];

  const { data, error } = await supabase
    .from('order_documents')
    .select('id, order_id, kind, title, file_name, mime_type, file_size, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getOrderDocuments:', error.message); return []; }

  return data.map((d) => ({
    id: d.id, orderId: d.order_id, kind: d.kind as DocumentKind, title: d.title, fileName: d.file_name,
    mimeType: d.mime_type, fileSize: d.file_size, createdAt: d.created_at,
  }));
}
