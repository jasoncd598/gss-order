/**
 * Supabase database helpers — server-side only.
 * Falls back to mock data when the DB returns nothing (new account / demo mode).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, ArtworkFile, TeamMember } from './types';
import { mapOrder, mapArtwork, mapTeamMember, type DbOrder, type DbArtwork, type DbProfile } from './db.types';
import { MOCK_ORDERS, MOCK_ARTWORK, MOCK_TEAM } from './mockData';

// ─── Admin types (declared early so mock data can use them) ──────────────────

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

// ─── Admin mock fallback data ─────────────────────────────────────────────────

export const MOCK_ADMIN_COMPANIES: AdminCompany[] = [
  { id: 'cmp-001', name: 'Acme Packaging Pty Ltd',      abn: '51 824 753 556', industry: 'Packaging & Manufacturing', address: '14 Industrial Ave, Wetherill Park NSW 2164', contact_phone: '+61 2 9055 7700', payment_terms: 'Net 30',  credit_limit: 35000, current_owing: 14250, total_spend: 84910,  status: 'Active',    created_at: '2022-03-14' },
  { id: 'cmp-002', name: 'BrightBox Retail Solutions',  abn: '72 918 441 203', industry: 'Retail & FMCG',           address: '5 Commerce St, Moorabbin VIC 3189',          contact_phone: '+61 3 9874 2200', payment_terms: 'Net 14',  credit_limit: 20000, current_owing: 8100,  total_spend: 42300,  status: 'Active',    created_at: '2023-07-01' },
  { id: 'cmp-003', name: 'NorthShore Naturals',         abn: '39 501 882 117', industry: 'Health & Beauty',         address: '8 Palm Grove, Fortitude Valley QLD 4006',    contact_phone: '+61 7 3055 8800', payment_terms: 'Prepaid', credit_limit: 15000, current_owing: 0,     total_spend: 18750,  status: 'Active',    created_at: '2024-01-18' },
  { id: 'cmp-004', name: 'TradeLink Wholesale Group',   abn: '88 344 712 990', industry: 'Wholesale Distribution',  address: '22 Kewdale Rd, Kewdale WA 6105',             contact_phone: '+61 8 9211 4400', payment_terms: 'Net 30',  credit_limit: 50000, current_owing: 50000, total_spend: 127600, status: 'Suspended', created_at: '2021-09-05' },
];

// Admin orders — cross-company flat view for mock fallback
export const MOCK_ADMIN_ORDERS = [
  ...MOCK_ORDERS.map((o) => ({ ...o, company_id: 'cmp-001', companies: { name: 'Acme Packaging Pty Ltd' } })),
  { ...MOCK_ORDERS[0], id: 'ord-bb-01', ref: 'ORD-2026-8790', date: '2026-10-05', status: 'In Production' as const, company_id: 'cmp-002', companies: { name: 'BrightBox Retail Solutions' }, total: 9700 },
  { ...MOCK_ORDERS[2], id: 'ord-ns-01', ref: 'ORD-2026-8655', date: '2026-09-30', status: 'Delivered'     as const, company_id: 'cmp-003', companies: { name: 'NorthShore Naturals' },         total: 1440 },
  { ...MOCK_ORDERS[3], id: 'ord-tl-01', ref: 'ORD-2026-8410', date: '2026-09-20', status: 'Pending Approval' as const, company_id: 'cmp-004', companies: { name: 'TradeLink Wholesale Group' }, total: 18000 },
];

// Mock records use ids like 'cmp-001'; skip the DB for those instead of
// letting Postgres reject them as invalid UUIDs.
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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

export async function getAllCompanies(supabase: SupabaseClient): Promise<AdminCompany[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, abn, industry, address, contact_phone, payment_terms, credit_limit, current_owing, total_spend, status, created_at')
    .order('created_at', { ascending: false });

  if (error) { console.error('getAllCompanies:', error.message); return MOCK_ADMIN_COMPANIES; }
  if (!data || data.length === 0) return MOCK_ADMIN_COMPANIES;
  return (data ?? []) as AdminCompany[];
}

export async function getCompanyById(supabase: SupabaseClient, id: string): Promise<AdminCompany | null> {
  if (!isUuid(id)) return MOCK_ADMIN_COMPANIES.find((c) => c.id === id) ?? null;

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, abn, industry, address, contact_phone, payment_terms, credit_limit, current_owing, total_spend, status, created_at')
    .eq('id', id)
    .single();

  if (error) {
    // Fall back to mock company matching the id, or first mock company
    return MOCK_ADMIN_COMPANIES.find((c) => c.id === id) ?? MOCK_ADMIN_COMPANIES[0];
  }
  return data as AdminCompany;
}

export async function getOrdersByCompanyAdmin(supabase: SupabaseClient, companyId: string) {
  if (!isUuid(companyId)) return MOCK_ORDERS.slice(0, 4);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, ref, date, status, total,
      order_items ( sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total )
    `)
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(5);

  if (error) { console.error('getOrdersByCompanyAdmin:', error.message); return MOCK_ORDERS.slice(0, 4); }
  if (!data || data.length === 0) return MOCK_ORDERS.slice(0, 4);
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

  if (error) { console.error('getAllOrdersAdmin:', error.message); return MOCK_ADMIN_ORDERS; }
  if (!data || data.length === 0) return MOCK_ADMIN_ORDERS;
  return (data ?? []) as unknown as (DbOrder & { company_id: string; companies: { name: string } | { name: string }[] | null })[];
}

export async function getUsersByCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  if (!isUuid(companyId)) return MOCK_TEAM;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) { console.error('getUsersByCompany:', error.message); return MOCK_TEAM; }
  if (!data || data.length === 0) return MOCK_TEAM;
  return (data as DbProfile[]).map((p) => mapTeamMember(p));
}
