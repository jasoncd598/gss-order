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
  previewUrl: string;
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
