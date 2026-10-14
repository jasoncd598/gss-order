/**
 * Supabase database helpers — server-side only.
 * All functions require a Supabase server client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrdersByCompany(supabase: SupabaseClient, companyId: string) {
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

  if (error) {
    console.error('getOrdersByCompany error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getOrderById(supabase: SupabaseClient, orderId: string) {
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
    .single();

  if (error) {
    console.error('getOrderById error:', error.message);
    return null;
  }
  return data;
}

// ─── Artwork vault ────────────────────────────────────────────────────────────

export async function getArtworkByCompany(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('artwork_files')
    .select('*')
    .eq('company_id', companyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('getArtworkByCompany error:', error.message);
    return [];
  }
  return data ?? [];
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function getTeamByCompany(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getTeamByCompany error:', error.message);
    return [];
  }
  return data ?? [];
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
      company_id:          companyId,
      created_by:          userId,
      ref,
      date:                new Date().toISOString().split('T')[0],
      status:              'Pending Approval',
      total,
      purchase_order_ref:  poRef ?? null,
      notes:               notes ?? null,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('placeOrder insert error:', orderError?.message);
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
    console.error('placeOrder items error:', itemsError.message);
    return { success: false, ref: null };
  }

  return { success: true, ref };
}
