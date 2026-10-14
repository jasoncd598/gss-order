# GSS Order Portal — Customer Ordering & Account Platform

> **Interview Demo — UI MVP**  
> A fully responsive B2B customer ordering portal built with Next.js 16, React 19, and Tailwind CSS v4.  
> **Pure UI only** — no backend, no database, no API calls. All data is mocked locally.

---

## Live Pages

| Route | Description |
|---|---|
| `/login` | Sign-in page with email/password and PIN option |
| `/registration` | Two-step company registration form |
| `/forgot-password` | Password reset with confirmation state |
| `/` | Dashboard — KPI cards, quick actions, recent orders |
| `/catalog` | Artwork & die-line catalog with instant reorder |
| `/order` | Full order history with search and status filters |
| `/order/[id]` | Order detail — line items, progress tracker, reorder modal |
| `/vault` | Artwork & proof vault with image previews |
| `/team` | Team members, roles, permissions matrix, invite modal |
| `/admin/companies` | Internal admin — all customer companies |
| `/admin/companies/[id]` | Company detail — financials, users, recent orders |

---

## Key Features Demonstrated

### Authentication
- Email/password login with show/hide password toggle
- Access PIN login option (UI only)
- Two-step company registration (Company Details → Account setup)
- Password reset flow with success confirmation state
- "Remember this device" checkbox

### Dashboard
- KPI summary cards: active orders, approved plates, YTD spend, Net 30 credit utilisation bar
- Quick action tiles linking to Order History, Vault, and Team
- Recent orders table with live status badges and direct links

### Order History & Reorder
- Searchable, filterable order history table (by order ref, product name, plate ref, SKU)
- Status filter tabs: All, Pending Approval, In Production, Quality Check, Dispatched, Delivered, Cancelled
- Order detail page with:
  - Visual 5-step progress tracker
  - Line item breakdown with specs (dimensions, substrate, plate ref)
  - Delivery info with courier and tracking number
  - Invoice and PO reference panel
  - **Reorder Modal** — adjust quantities, add PO reference, submit request with animated success state

### Artwork & Proof Vault
- Card grid with live Unsplash preview images
- Status badges: Approved, Pending Review, Revision Required, Superseded
- Searchable and filterable
- Per-card actions: View Proof, Download, Reorder (Approved only)

### Team & Permissions
- Team member list with avatars (pravatar.cc), roles, status, last login
- Role summary KPI cards
- Dropdown action menu (Edit Role, Resend Invite, Suspend)
- **Invite User Modal** — name, email, radio-button role selector with descriptions, success state
- Permission matrix table (Admin / Procurement / Finance / Viewer)

### Internal Admin
- Company list with credit utilisation bars, outstanding amounts, and status
- Suspended account warnings with visual callout
- Company detail: contact info, financial standing, credit bar, recent orders, portal users

---

## Tech Stack

| Technology | Version | Why |
|---|---|---|
| **Next.js** | 16.4.0 | App Router, RSC, file-based routing |
| **React** | 19.3.0 | Server & Client Components |
| **TypeScript** | 5 | Type safety across all mock data and components |
| **Tailwind CSS** | 4 | Utility-first styling, zero runtime |
| **Lucide React** | 1.56.0 | Consistent icon system |
| **League Spartan** | Google Fonts | Brand-aligned industrial sans-serif |

---

## Project Structure

```
app/
├── (auth)/                   # Auth route group (no dashboard nav)
│   ├── login/page.tsx
│   ├── registration/page.tsx
│   └── forgot-password/page.tsx
├── (dashboard)/              # Dashboard route group (with SideNav + Header)
│   ├── layout.tsx            # Shared shell: SideNav + top header
│   ├── page.tsx              # Dashboard overview
│   ├── catalog/page.tsx      # Product catalog + quick reorder
│   ├── order/
│   │   ├── page.tsx          # Order history list
│   │   └── [id]/page.tsx     # Order detail
│   ├── vault/page.tsx        # Artwork vault
│   ├── team/page.tsx         # Team & permissions
│   └── admin/
│       └── companies/
│           ├── page.tsx      # All companies (admin)
│           └── [id]/page.tsx # Company detail (admin)
├── component/
│   ├── navigation/
│   │   ├── SideNav.tsx       # Collapsible sidebar
│   │   └── NavBar.tsx        # Top header
│   ├── modals/
│   │   ├── ReorderModal.tsx  # Reorder flow with qty adjustment
│   │   └── InviteUserModal.tsx
│   └── ui/                   # (reserved for shared UI primitives)
└── lib/
    ├── types.ts              # TypeScript interfaces
    ├── mockData.ts           # All mock orders, artwork, team, companies
    └── utils.ts              # formatAUD, formatDate, status style helpers
```

---

## Glossary of Terms

These terms are used throughout the platform and reflect the B2B packaging industry.

| Term | Meaning |
|---|---|
| **Plate / Die-Line** | The physical printing plate or digital die-line used to reproduce a customer's artwork. Each product has a unique Plate Reference (e.g. `PLT-8812-B`). |
| **Plate Ref** | A unique identifier for a specific artwork plate. Ties an order to its approved artwork version. |
| **Artwork Proof** | A pre-production digital or physical sample sent to the customer for approval before a print run begins. |
| **Substrate** | The material being printed on — e.g. E-Flute Kraft board, 60mu Recycled LDPE, 300gsm SBS Board. |
| **Flexo / Flexographic Printing** | A high-speed printing method used for packaging, labels, and bags using flexible relief plates. |
| **CMYK** | Cyan, Magenta, Yellow, Key (Black) — standard four-colour process printing. |
| **Pantone** | A standardised colour matching system used to ensure brand colour accuracy across print runs. |
| **Net 30 Terms** | A credit payment arrangement where the invoice is due 30 days after the order date. Common in B2B trade. |
| **ABN** | Australian Business Number — an 11-digit identifier issued by the ATO, required for all Australian business entities. |
| **Reorder** | Placing a repeat production run of a previously ordered product, reusing existing approved artwork. |
| **SKU** | Stock Keeping Unit — a unique product identifier. In this context, tied to a specific die-line configuration. |
| **MOQ / Min Run Qty** | Minimum Order Quantity — the smallest quantity a supplier will produce in a single run. |
| **Vault** | Secure storage for approved artwork files, proofs, and die-line documents associated with a customer account. |
| **Role-Based Access Control (RBAC)** | A security model where a user's permissions are determined by their assigned role (Admin, Procurement Manager, Finance, Viewer). |
| **Multi-Tenancy** | A database and application architecture where multiple customer companies share the platform but their data is fully isolated. |
| **Xero** | Cloud-based accounting software. A planned integration for Phase 2 — syncing invoices, credit limits, and payment terms. |
| **PO Reference** | Purchase Order Reference — a number the customer generates internally to track their own procurement, linked to a supplier order. |
| **Courier / 3PL** | Third-Party Logistics provider (e.g. TNT, StarTrack, Toll) used to dispatch finished goods. |
| **Phase 1** | The MVP scope: auth, orders, reorder, vault, team management, admin. |
| **Phase 2** | Planned future scope: Xero integration, Stripe payments, QR codes, website embed, compliance reminders. |

---

## Design Decisions

- **Dark sidebar + light content area** — matches industrial B2B aesthetics while maintaining readability for dense data tables.
- **Amber (`#FBBF24`) as the primary action colour** — high contrast against the zinc dark backgrounds, energetic without being aggressive.
- **Monospace font for all references** — order refs, plate refs, tracking numbers, and prices use `font-mono` to visually separate data from labels.
- **No spinners or skeletons** — this is a UI demo; all data is synchronous mock data for clean, fast rendering.
- **Public image APIs used for demo only** — Unsplash (artwork previews) and Pravatar (user avatars) are used solely for visual fidelity in the demo. Production would use authenticated storage (e.g. AWS S3 + CloudFront).

---

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000/login](http://localhost:3000/login) to start from the login page.

> The `(auth)` and `(dashboard)` folders are Next.js **route groups** — the parentheses are a Next.js convention that groups routes without affecting the URL path.
