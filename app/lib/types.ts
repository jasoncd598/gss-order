// ─── Core Domain Types ────────────────────────────────────────────────────────

export type OrderStatus =
  | 'Pending Approval'
  | 'In Production'
  | 'Quality Check'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export type ArtworkStatus = 'Approved' | 'Pending Review' | 'Revision Required' | 'Superseded';

export type UserRole = 'Admin' | 'Procurement Manager' | 'Viewer' | 'Finance';

export interface OrderItem {
  /** order_items.id — present for DB orders, used to key reorder quantities */
  id?: string;
  skuId: string;
  productName: string;
  dimensions: string;
  substrate: string;
  plateRef: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  companyId?: string;
  ref: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  courier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  invoiceRef?: string;
  purchaseOrderRef?: string;
  notes?: string;
  /** Card payment via Stripe; undefined for mock data */
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  paidAt?: string;
}

export type PaymentStatus = 'Unpaid' | 'Processing' | 'Paid';

export type ReorderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ReorderRequest {
  id: string;
  ref: string;
  companyId: string;
  companyName: string;
  sourceOrderId: string;
  sourceOrderRef: string;
  createdOrderId?: string;
  status: ReorderStatus;
  items: OrderItem[];
  total: number;
  poRef?: string;
  notes?: string;
  rejectionReason?: string;
  requestedBy: string;
  requestedAt: string;
}

export const DOCUMENT_KINDS = ['Delivery docket', 'Compliance certificate', 'Signed quote', 'Quote', 'Specification', 'Other'] as const;
export type DocumentKind = typeof DOCUMENT_KINDS[number];

/** A file staff attached to an order (migration 010) */
export interface OrderDocument {
  id: string;
  orderId: string;
  kind: DocumentKind;
  title: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface ArtworkFile {
  id: string;
  name: string;
  plateRef: string;
  version: string;
  status: ArtworkStatus;
  dimensions: string;
  substrate: string;
  colorProfile: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  /** Image URL (signed, short-lived) — empty when there is no image preview */
  previewUrl: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  reviewComment?: string;
}

/** A reorderable product: approved artwork + the price/qty from its last order */
export interface CatalogItem {
  artworkId: string;
  name: string;
  plateRef: string;
  version: string;
  status: ArtworkStatus;
  dimensions: string;
  substrate: string;
  colorProfile: string;
  previewUrl: string;
  mimeType?: string;
  /** null = never ordered, price on request */
  unitPrice: number | null;
  lastQuantity: number | null;
  lastOrdered: string | null;
  /** Set when staff have fixed a price for this plate */
  minQuantity: number | null;
}

/** Staff pricing view: one row per plate a company has artwork or a price for */
export interface ProductPricingRow {
  plateRef: string;
  /** Artwork name, or the price's product name if no artwork exists */
  name: string;
  hasApprovedArtwork: boolean;
  fixed: { productName: string; skuId: string | null; unitPrice: number; minQuantity: number; updatedAt: string } | null;
  lastOrder: { unitPrice: number; date: string } | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: 'Pending' | 'Accepted' | 'Revoked';
  token: string;
  createdAt: string;
  expiresAt: string;
}

export type NotificationType = 'order' | 'reorder' | 'artwork' | 'team' | 'account';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  status: 'Active' | 'Invited' | 'Suspended';
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  abn: string;
  creditLimit: number;
  currentOwing: number;
  paymentTerms: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  memberSince: string;
  totalSpend: number;
  status: 'Active' | 'Suspended' | 'Pending';
}
