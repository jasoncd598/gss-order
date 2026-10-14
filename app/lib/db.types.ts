/**
 * Maps Supabase snake_case DB rows → our app's camelCase types.
 */
import type { Order, OrderItem, ArtworkFile, TeamMember, OrderStatus, ArtworkStatus, UserRole } from './types';

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
  order_items: DbOrderItem[];
}

export interface DbOrderItem {
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
  preview_url: string;
}

export interface DbProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  created_at: string;
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
    items:             (row.order_items ?? []).map(mapOrderItem),
  };
}

function mapOrderItem(row: DbOrderItem): OrderItem {
  return {
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
    previewUrl:   row.preview_url,
  };
}

export function mapTeamMember(row: DbProfile, email?: string): TeamMember {
  const firstName = row.first_name ?? '';
  const lastName  = row.last_name  ?? '';
  return {
    id:        row.id,
    name:      `${firstName} ${lastName}`.trim() || email || 'Unknown',
    email:     email ?? '',
    role:      row.role as UserRole,
    lastLogin: row.created_at,
    status:    row.status as TeamMember['status'],
  };
}
