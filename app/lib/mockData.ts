import type { Order, ArtworkFile, TeamMember, Company, ReorderRequest, OrderItem, CatalogItem, Invitation, AppNotification } from './types';

// ─── Orders ───────────────────────────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-8812',
    ref: 'ORD-2026-8812',
    paymentStatus: 'Paid',
    date: '2026-10-02',
    status: 'Dispatched',
    courier: 'TNT Express',
    trackingNumber: 'TNT9284710482',
    estimatedDelivery: '2026-10-07',
    invoiceRef: 'INV-26-8812',
    purchaseOrderRef: 'PO-ACME-0041',
    total: 4850.0,
    notes: 'Deliver to Warehouse B — Dock 3',
    items: [
      {
        skuId: 'ART-SKU-350',
        productName: 'Custom Corrugated Shipping Box',
        dimensions: '350 x 250 x 150 mm',
        substrate: 'E-Flute White Kraft (350gsm)',
        plateRef: 'PLT-8812-B',
        quantity: 2500,
        unitPrice: 1.94,
        lineTotal: 4850.0,
      },
    ],
  },
  {
    id: 'ord-8740',
    ref: 'ORD-2026-8740',
    paymentStatus: 'Unpaid',
    date: '2026-09-18',
    status: 'In Production',
    invoiceRef: 'INV-26-8740',
    purchaseOrderRef: 'PO-ACME-0039',
    total: 3200.0,
    items: [
      {
        skuId: 'ART-SKU-551',
        productName: 'Flexo Printed Poly Mailer Bags (Large)',
        dimensions: '400 x 550 mm + 50mm Lip',
        substrate: '60mu Recycled LDPE',
        plateRef: 'PLT-5510-A',
        quantity: 10000,
        unitPrice: 0.32,
        lineTotal: 3200.0,
      },
    ],
  },
  {
    id: 'ord-8600',
    ref: 'ORD-2026-8600',
    paymentStatus: 'Paid',
    date: '2026-08-05',
    status: 'Delivered',
    courier: 'StarTrack',
    trackingNumber: 'ST1029384756',
    invoiceRef: 'INV-26-8600',
    purchaseOrderRef: 'PO-ACME-0035',
    total: 5375.0,
    items: [
      {
        skuId: 'ART-SKU-992',
        productName: 'Custom Foil-Stamped Product Carton',
        dimensions: '120 x 120 x 45 mm',
        substrate: '300gsm SBS Board + Matte Lam',
        plateRef: 'PLT-9921-C',
        quantity: 2500,
        unitPrice: 2.15,
        lineTotal: 5375.0,
      },
    ],
  },
  {
    id: 'ord-8421',
    ref: 'ORD-2026-8421',
    paymentStatus: 'Paid',
    date: '2026-07-14',
    status: 'Delivered',
    courier: 'Toll Priority',
    trackingNumber: 'TL8821049302',
    invoiceRef: 'INV-26-8421',
    purchaseOrderRef: 'PO-ACME-0031',
    total: 1560.0,
    items: [
      {
        skuId: 'ART-SKU-114',
        productName: 'Roll Labels – Tamper Evident Security Seal',
        dimensions: '100 x 50 mm (Die-Cut Roll)',
        substrate: 'Gloss Vinyl Permanent Adhesive',
        plateRef: 'PLT-1140-D',
        quantity: 13000,
        unitPrice: 0.12,
        lineTotal: 1560.0,
      },
    ],
  },
  {
    id: 'ord-8102',
    ref: 'ORD-2026-8102',
    paymentStatus: 'Paid',
    date: '2026-05-22',
    status: 'Delivered',
    courier: 'TNT Express',
    trackingNumber: 'TNT7738291900',
    invoiceRef: 'INV-26-8102',
    purchaseOrderRef: 'PO-ACME-0028',
    total: 8200.0,
    items: [
      {
        skuId: 'ART-SKU-350',
        productName: 'Custom Corrugated Shipping Box',
        dimensions: '350 x 250 x 150 mm',
        substrate: 'E-Flute White Kraft (350gsm)',
        plateRef: 'PLT-8812-B',
        quantity: 5000,
        unitPrice: 1.64,
        lineTotal: 8200.0,
      },
    ],
  },
  {
    id: 'ord-7890',
    ref: 'ORD-2025-7890',
    paymentStatus: 'Paid',
    date: '2025-12-09',
    status: 'Delivered',
    courier: 'StarTrack',
    invoiceRef: 'INV-25-7890',
    purchaseOrderRef: 'PO-ACME-0022',
    total: 6450.0,
    items: [
      {
        skuId: 'ART-SKU-551',
        productName: 'Flexo Printed Poly Mailer Bags (Large)',
        dimensions: '400 x 550 mm + 50mm Lip',
        substrate: '60mu Recycled LDPE',
        plateRef: 'PLT-5510-A',
        quantity: 20000,
        unitPrice: 0.3225,
        lineTotal: 6450.0,
      },
    ],
  },
];

// ─── Artwork Vault ────────────────────────────────────────────────────────────

export const MOCK_ARTWORK: ArtworkFile[] = [
  {
    id: 'art-001',
    name: 'Custom Corrugated Shipping Box',
    plateRef: 'PLT-8812-B',
    version: 'v3',
    status: 'Approved',
    dimensions: '350 x 250 x 150 mm',
    substrate: 'E-Flute White Kraft (350gsm)',
    colorProfile: 'CMYK + Pantone 123C Gold',
    uploadedBy: 'Sarah Jenkins',
    uploadedAt: '2026-09-15',
    fileSize: '4.2 MB',
    previewUrl: '',
  },
  {
    id: 'art-002',
    name: 'Eco-Mailer Poly Bag (Branded Monocolor)',
    plateRef: 'PLT-5510-A',
    version: 'v2',
    status: 'Approved',
    dimensions: '400 x 550 mm + 50mm Lip',
    substrate: '60mu Recycled LDPE',
    colorProfile: 'Black Flexo Ink',
    uploadedBy: 'James Wu',
    uploadedAt: '2026-08-01',
    fileSize: '1.8 MB',
    previewUrl: '',
  },
  {
    id: 'art-003',
    name: 'Custom Foil-Stamped Product Carton',
    plateRef: 'PLT-9921-C',
    version: 'v4',
    status: 'Pending Review',
    dimensions: '120 x 120 x 45 mm',
    substrate: '300gsm SBS Board + Matte Lam',
    colorProfile: 'CMYK + Hot Foil Stamp',
    uploadedBy: 'Sarah Jenkins',
    uploadedAt: '2026-10-01',
    fileSize: '6.1 MB',
    previewUrl: '',
  },
  {
    id: 'art-004',
    name: 'Roll Labels – Tamper Evident Security Seal',
    plateRef: 'PLT-1140-D',
    version: 'v1',
    status: 'Approved',
    dimensions: '100 x 50 mm (Die-Cut Roll)',
    substrate: 'Gloss Vinyl Permanent Adhesive',
    colorProfile: 'CMYK Digital Plate',
    uploadedBy: 'James Wu',
    uploadedAt: '2026-06-20',
    fileSize: '2.3 MB',
    previewUrl: '',
  },
  {
    id: 'art-005',
    name: 'Premium Retail Swing Tag',
    plateRef: 'PLT-3301-E',
    version: 'v2',
    status: 'Approved',
    dimensions: '55 x 85 mm (Die-Cut)',
    substrate: '350gsm Matte Art Board',
    colorProfile: 'CMYK + Soft Touch Lam',
    uploadedBy: 'Sarah Jenkins',
    uploadedAt: '2026-07-10',
    fileSize: '3.5 MB',
    previewUrl: '',
  },
  {
    id: 'art-006',
    name: 'Tissue Wrap – Brand Pattern',
    plateRef: 'PLT-7720-F',
    version: 'v1',
    status: 'Revision Required',
    dimensions: '500 x 700 mm (Flat Sheet)',
    substrate: '17gsm MF Tissue',
    colorProfile: '2-Color Flexo',
    uploadedBy: 'James Wu',
    uploadedAt: '2026-09-28',
    fileSize: '2.9 MB',
    previewUrl: '',
  },
];

// ─── Team Members ─────────────────────────────────────────────────────────────

export const MOCK_TEAM: TeamMember[] = [
  {
    id: 'usr-001',
    name: 'Sarah Jenkins',
    email: 's.jenkins@gss-demo.com.au',
    role: 'Admin',
    lastLogin: '2026-10-14',
    status: 'Active',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'usr-002',
    name: 'James Wu',
    email: 'j.wu@gss-demo.com.au',
    role: 'Procurement Manager',
    lastLogin: '2026-10-13',
    status: 'Active',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: 'usr-003',
    name: 'Priya Sharma',
    email: 'p.sharma@gss-demo.com.au',
    role: 'Finance',
    lastLogin: '2026-10-10',
    status: 'Active',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: 'usr-004',
    name: 'Tom Bradley',
    email: 't.bradley@gss-demo.com.au',
    role: 'Viewer',
    lastLogin: '2026-09-30',
    status: 'Active',
    avatarUrl: 'https://i.pravatar.cc/150?img=60',
  },
  {
    id: 'usr-005',
    name: 'Mia Chen',
    email: 'm.chen@gss-demo.com.au',
    role: 'Procurement Manager',
    lastLogin: '2026-10-12',
    status: 'Active',
    avatarUrl: 'https://i.pravatar.cc/150?img=49',
  },
];

// ─── Companies (Admin) ────────────────────────────────────────────────────────

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'cmp-001',
    name: 'Acme Packaging Pty Ltd',
    abn: '51 824 753 556',
    creditLimit: 35000,
    currentOwing: 14250,
    paymentTerms: 'Net 30',
    industry: 'Packaging & Manufacturing',
    contactName: 'Sarah Jenkins',
    contactEmail: 'sarah.jenkins@acmepackaging.com.au',
    contactPhone: '+61 2 9055 7700',
    address: '14 Industrial Ave, Wetherill Park NSW 2164',
    memberSince: '2022-03-14',
    totalSpend: 84910,
    status: 'Active',
  },
  {
    id: 'cmp-002',
    name: 'BrightBox Retail Solutions',
    abn: '72 918 441 203',
    creditLimit: 20000,
    currentOwing: 8100,
    paymentTerms: 'Net 14',
    industry: 'Retail & FMCG',
    contactName: 'Daniel Park',
    contactEmail: 'd.park@brightbox.com.au',
    contactPhone: '+61 3 9874 2200',
    address: '5 Commerce St, Moorabbin VIC 3189',
    memberSince: '2023-07-01',
    totalSpend: 42300,
    status: 'Active',
  },
  {
    id: 'cmp-003',
    name: 'NorthShore Naturals',
    abn: '39 501 882 117',
    creditLimit: 15000,
    currentOwing: 0,
    paymentTerms: 'Prepaid',
    industry: 'Health & Beauty',
    contactName: 'Lara Nguyen',
    contactEmail: 'lara@northshorenaturals.com.au',
    contactPhone: '+61 7 3055 8800',
    address: '8 Palm Grove, Fortitude Valley QLD 4006',
    memberSince: '2024-01-18',
    totalSpend: 18750,
    status: 'Active',
  },
  {
    id: 'cmp-004',
    name: 'TradeLink Wholesale Group',
    abn: '88 344 712 990',
    creditLimit: 50000,
    currentOwing: 50000,
    paymentTerms: 'Net 30',
    industry: 'Wholesale Distribution',
    contactName: 'Chris Mercer',
    contactEmail: 'c.mercer@tradelink.com.au',
    contactPhone: '+61 8 9211 4400',
    address: '22 Kewdale Rd, Kewdale WA 6105',
    memberSince: '2021-09-05',
    totalSpend: 127600,
    status: 'Suspended',
  },
];

// ─── Reorder requests ─────────────────────────────────────────────────────────

const line = (skuId: string, productName: string, plateRef: string, substrate: string, quantity: number, unitPrice: number): OrderItem => ({
  skuId, productName, plateRef, substrate, dimensions: '', quantity, unitPrice, lineTotal: Math.round(quantity * unitPrice * 100) / 100,
});

export const MOCK_REORDER_REQUESTS: ReorderRequest[] = [
  { id: 'rr-001', ref: 'RRQ-2026-0091', companyId: 'cmp-001', companyName: 'Acme Packaging Pty Ltd',     sourceOrderId: 'ord-8740', sourceOrderRef: 'ORD-2026-8740', createdOrderId: 'ord-8740', status: 'Approved',
    items: [line('PLY-MAIL-L', 'Flexo Printed Poly Mailer Bags (Large)', 'PLT-5510-A', '60mu Recycled LDPE', 10000, 0.32)], total: 3200,  requestedBy: 'James Wu',      requestedAt: '2026-10-13', poRef: 'PO-ACME-0039' },
  { id: 'rr-002', ref: 'RRQ-2026-0088', companyId: 'cmp-002', companyName: 'BrightBox Retail Solutions', sourceOrderId: 'ord-bb-01', sourceOrderRef: 'ORD-2026-8790', status: 'Pending',
    items: [line('ART-SKU-350', 'Custom Corrugated Shipping Box', 'PLT-8812-B', 'E-Flute White Kraft', 5000, 1.94)], total: 9700,    requestedBy: 'Daniel Park',   requestedAt: '2026-10-12', poRef: 'PO-BB-0021' },
  { id: 'rr-003', ref: 'RRQ-2026-0085', companyId: 'cmp-001', companyName: 'Acme Packaging Pty Ltd',     sourceOrderId: 'ord-8421', sourceOrderRef: 'ORD-2026-8421', status: 'Pending',
    items: [line('LBL-TAMPER', 'Roll Labels – Tamper Evident Security Seal', 'PLT-1140-D', 'Gloss Vinyl', 13000, 0.12)], total: 1560, requestedBy: 'Sarah Jenkins', requestedAt: '2026-10-10', notes: 'Please use the updated Pantone ref from the latest brief.' },
  { id: 'rr-004', ref: 'RRQ-2026-0081', companyId: 'cmp-003', companyName: 'NorthShore Naturals',        sourceOrderId: 'ord-ns-01', sourceOrderRef: 'ORD-2026-8655', status: 'Pending',
    items: [line('TAG-SWING', 'Premium Retail Swing Tag', 'PLT-3301-E', '350gsm Matte Art Board', 3000, 0.48)], total: 1440,          requestedBy: 'Lara Nguyen',   requestedAt: '2026-10-08' },
  { id: 'rr-005', ref: 'RRQ-2026-0074', companyId: 'cmp-004', companyName: 'TradeLink Wholesale Group',  sourceOrderId: 'ord-tl-01', sourceOrderRef: 'ORD-2026-8410', status: 'Rejected',
    items: [line('ART-SKU-350', 'Custom Corrugated Shipping Box', 'PLT-8812-B', 'E-Flute White Kraft', 10000, 1.80)], total: 18000,  requestedBy: 'Chris Mercer',  requestedAt: '2026-10-02', rejectionReason: 'Account on hold — credit limit exceeded.' },
];

// ─── Catalog (artwork + last order pricing) ───────────────────────────────────

const LAST_PRICE: Record<string, [number, number, string]> = {
  'art-001': [1.94, 2500,  '2026-10-02'],
  'art-002': [0.32, 10000, '2026-09-18'],
  'art-003': [2.15, 2500,  '2026-08-05'],
  'art-004': [0.12, 13000, '2026-07-14'],
  'art-005': [0.48, 1000,  '2026-06-20'],
};

export const MOCK_CATALOG: CatalogItem[] = MOCK_ARTWORK
  .filter((a) => a.status !== 'Superseded')
  .map((a) => ({
    artworkId: a.id, name: a.name, plateRef: a.plateRef, version: a.version, status: a.status,
    dimensions: a.dimensions, substrate: a.substrate, colorProfile: a.colorProfile, previewUrl: a.previewUrl,
    unitPrice: LAST_PRICE[a.id]?.[0] ?? null,
    lastQuantity: LAST_PRICE[a.id]?.[1] ?? null,
    lastOrdered: LAST_PRICE[a.id]?.[2] ?? null,
    minQuantity: null,
  }));

// ─── Invitations ──────────────────────────────────────────────────────────────

export const MOCK_INVITATIONS: Invitation[] = [
  { id: 'inv-001', email: 'l.nguyen@gss-demo.com.au', role: 'Viewer', status: 'Pending',
    token: '00000000-0000-4000-8000-000000000001', createdAt: '2026-10-12', expiresAt: '2026-10-26' },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'order',   title: 'Order ORD-2026-8812 — Dispatched', body: 'Your order has been dispatched via TNT Express.', link: '/order/ord-8812', read: false, createdAt: '2026-10-14T09:14:00' },
  { id: 'n2', type: 'reorder', title: 'Reorder RRQ-2026-0091 approved',   body: 'Production has been scheduled.',                   link: '/order/ord-8740', read: false, createdAt: '2026-10-13T15:45:00' },
  { id: 'n3', type: 'artwork', title: 'Proof ready for review',           body: 'Custom Foil-Stamped Product Carton (PLT-9921-C v4) is awaiting your approval.', link: '/vault', read: false, createdAt: '2026-10-13T08:03:00' },
  { id: 'n4', type: 'team',    title: 'Invitation accepted',              body: 'Priya Sharma joined as Finance.',                  link: '/team',           read: true,  createdAt: '2026-10-10T11:20:00' },
  { id: 'n5', type: 'order',   title: 'Order ORD-2026-8600 — Delivered',  body: 'Your order has been delivered.',                   link: '/order/ord-8600', read: true,  createdAt: '2026-08-05T11:00:00' },
];
