/**
 * Maps Supabase snake_case DB rows → our app's camelCase types.
 */
import type { Order, OrderItem, ArtworkFile, TeamMember, OrderStatus, ArtworkStatus, UserRole, ReorderRequest, ReorderStatus, PaymentStatus } from './types';

// ─── Raw DB row shapes ────────────────────────────────────────────────────────

export interface DbOrder {
  id: string;
  ref: string;
  date: string;
  status: string;
  total: number;
  courier?: string | null;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
  invoice_ref?: string | null;
  purchase_order_ref?: string | null;
  notes?: string | null;
  payment_status?: string | null;
  amount_paid?: number | null;
  paid_at?: string | null;
  order_items: DbOrderItem[];
}

export interface DbOrderItem {
  id?: string;
  sku_id: string;
  product_name: string;
  dimensions: string;
  substrate: string;
  plate_ref: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface DbArtwork {
  id: string;
  name: string;
  plate_ref: string;
  version: string;
  status: string;
  dimensions: string;
  substrate: string;
  color_profile: string;
  uploaded_by: string;
  uploaded_at: string;
  file_size: string;
  preview_url: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  review_comment?: string | null;
}

export interface DbProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  role: string;
  status: string;
  created_at: string;
}

type OneOrMany<T> = T | T[] | null;
const one = <T,>(v: OneOrMany<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export interface DbReorderRequest {
  id: string;
  ref: string;
  company_id: string;
  source_order_id: string;
  created_order_id: string | null;
  status: string;
  items: (DbOrderItem & { order_item_id?: string })[];
  total: number;
  po_ref: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  companies: OneOrMany<{ name: string }>;
  source: OneOrMany<{ ref: string }>;
  requester: OneOrMany<{ first_name: string | null; last_name: string | null; email: string | null }>;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapOrder(row: DbOrder): Order {
  return {
    id:                row.id,
    ref:               row.ref,
    date:              row.date,
    status:            row.status as OrderStatus,
    total:             row.total,
    courier:           row.courier           ?? undefined,
    trackingNumber:    row.tracking_number   ?? undefined,
    estimatedDelivery: row.estimated_delivery ?? undefined,
    invoiceRef:        row.invoice_ref        ?? undefined,
    purchaseOrderRef:  row.purchase_order_ref ?? undefined,
    notes:             row.notes              ?? undefined,
    paymentStatus:     (row.payment_status as PaymentStatus | null) ?? undefined,
    amountPaid:        row.amount_paid != null ? Number(row.amount_paid) : undefined,
    paidAt:            row.paid_at            ?? undefined,
    items:             (row.order_items ?? []).map(mapOrderItem),
  };
}

function mapOrderItem(row: DbOrderItem): OrderItem {
  return {
    id:          row.id,
    skuId:       row.sku_id,
    productName: row.product_name,
    dimensions:  row.dimensions,
    substrate:   row.substrate,
    plateRef:    row.plate_ref,
    quantity:    row.quantity,
    unitPrice:   row.unit_price,
    lineTotal:   row.line_total,
  };
}

export function mapArtwork(row: DbArtwork): ArtworkFile {
  return {
    id:           row.id,
    name:         row.name,
    plateRef:     row.plate_ref,
    version:      row.version,
    status:       row.status as ArtworkStatus,
    dimensions:   row.dimensions,
    substrate:    row.substrate,
    colorProfile: row.color_profile,
    uploadedBy:   row.uploaded_by,
    uploadedAt:   row.uploaded_at,
    fileSize:     row.file_size,
    previewUrl:   row.preview_url ?? '',
    storagePath:  row.storage_path ?? undefined,
    fileName:     row.file_name ?? undefined,
    mimeType:     row.mime_type ?? undefined,
    reviewComment: row.review_comment ?? undefined,
  };
}

export function mapReorderRequest(row: DbReorderRequest): ReorderRequest {
  const requester = one(row.requester);
  const name = `${requester?.first_name ?? ''} ${requester?.last_name ?? ''}`.trim();
  return {
    id:              row.id,
    ref:             row.ref,
    companyId:       row.company_id,
    companyName:     one(row.companies)?.name ?? '—',
    sourceOrderId:   row.source_order_id,
    sourceOrderRef:  one(row.source)?.ref ?? '—',
    createdOrderId:  row.created_order_id ?? undefined,
    status:          row.status as ReorderStatus,
    items:           (row.items ?? []).map((i) => ({ ...mapOrderItem(i), id: i.order_item_id })),
    total:           Number(row.total),
    poRef:           row.po_ref ?? undefined,
    notes:           row.notes ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    requestedBy:     name || requester?.email || 'Unknown',
    requestedAt:     row.created_at,
  };
}

export function mapTeamMember(row: DbProfile, email?: string): TeamMember {
  const firstName = row.first_name ?? '';
  const lastName  = row.last_name  ?? '';
  return {
    id:        row.id,
    name:      `${firstName} ${lastName}`.trim() || email || 'Unknown',
    email:     email ?? row.email ?? '',
    role:      row.role as UserRole,
    lastLogin: row.created_at,
    status:    row.status as TeamMember['status'],
  };
}
