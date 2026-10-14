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
