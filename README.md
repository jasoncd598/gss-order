# GSS Order Portal — Customer Ordering & Account Platform

> A fully responsive B2B customer ordering portal built with Next.js 16, React 19, Tailwind CSS v4 and Supabase (Postgres + Auth).
> Company data is isolated with Postgres Row Level Security; reorders are priced and approved server-side.

---

## Setup

1. **Environment** — create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...     # server only — records Stripe payments on orders
   STRIPE_SECRET_KEY=sk_test_...     # or a restricted key (rk_test_...) — see Payments below
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_BILLING_PORTAL_URL=https://billing.stripe.com/p/login/...   # Stripe customer-portal login link (plans)
   # Email notifications — off until EMAIL_FROM + either SMTP_* or RESEND_API_KEY is set.
   # SMTP wins when set. Gmail: smtp.gmail.com / 465 / your address / a Google App Password.
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=you@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   # RESEND_API_KEY=re_...           # alternative once you own a domain
   EMAIL_FROM="GSS Orders <you@gmail.com>"
   # EMAIL_REPLY_TO=accounts@your-domain.com.au
   CRON_SECRET=...                   # any long random string — protects /api/notifications/deliver
   SITE_URL=https://portal.your-domain.com.au   # links in emails (Vercel production URL is used if unset)
   BUSINESS_NAME="GSS Pty Ltd"       # supplier details printed on invoices
   BUSINESS_ABN="12 345 678 901"
   BUSINESS_ADDRESS="..."
   BUSINESS_EMAIL=accounts@your-domain.com.au
   BUSINESS_PHONE="..."
   BUSINESS_BANK_DETAILS="BSB 000-000 · Acc 0000 0000"
   # Error tracking (optional) — a Sentry project DSN; without it errors only go to the Vercel logs
   # SENTRY_DSN=https://<key>@o0.ingest.sentry.io/<project>
   # NEXT_PUBLIC_SENTRY_DSN=https://<key>@o0.ingest.sentry.io/<project>   # same DSN, for browser errors
   # DEMO_MODE=true   # optional: skip login and show sample data (screenshots / tests; ignored on Vercel production)
   ```
2. **Database** — run the files in `supabase/migrations/` in order in the Supabase SQL editor
   (`000` → `010`). They are idempotent. `003` is the core security layer; `004` adds invitations,
   the private `artwork` storage bucket, proof approval, server-priced ordering and notifications.
3. **First staff user** — sign up in the portal, then in the SQL editor:
   ```sql
   update public.profiles set is_staff = true where email = 'you@example.com';
   ```
   Staff must then turn on two-factor sign-in (**Account → Security**) before the admin pages open.
4. `npm install && npm run dev`

### How accounts work
- Registering creates a **new company** (status `Pending`) and makes the registrant its **Admin**.
  Roles and staff access are never taken from the signup form.
- Company Admins (or staff) **invite colleagues** from the Team page. The invite link
  (`/registration?invite=…`) only works for the invited email, expires after 14 days, and
  joins that company with the chosen role. Admins can change roles and deactivate users.
- Staff approve the company under **Admin → Companies**; until then the customer can browse but not order.
- Only `Admin` and `Procurement Manager` users of an `Active` company can place orders or reorders.
- Company Admins can change their own team's roles; nobody can change their own role, company or staff flag.

### Reorder workflow
Customer clicks **Reorder This** on a past order → adjusts quantities → `reorder_requests` row (`Pending`, priced from the
original order lines in the database) → staff **Approve** (creates a real order, `In Production`) or **Reject** with a reason →
customer sees the outcome under Order History.

### Artwork & proofs
Staff upload files from **Admin → Companies → (company) → Upload Artwork**. Files go to the private
`artwork` bucket under `<company_id>/`; customers can only read their own company's folder, and
downloads/previews use 5-minute signed URLs. Uploading as *Needs customer approval* notifies the
company's Admins/Procurement Managers, who approve or request changes in the vault. Approving a new
version supersedes the previous one.

### Ordering & catalog
The catalog is the company's approved artwork. Each plate is priced from its **fixed price**, set by staff
under *Admin → Companies → (company) → Products & Pricing* (unit price ex GST, minimum quantity, product
name, SKU), or, if none is set, from its most recent order. Cart orders send only plate + quantity;
`place_order()` prices every line in the database and enforces the minimum. Plates with neither show
*Price on request*.

### Notifications
Database triggers create in-portal notifications for: new orders and reorder requests (staff),
order status changes (customer), reorder decisions (requester), proofs ready / reviewed, invitations
accepted, account approval, and payments received / failed.

**Email:** every notification is also emailed to its recipient (via SMTP, e.g. Gmail, or [Resend](https://resend.com)), and
team invitations email the sign-up link to the invitee. Emails go out right after the action that
caused them (Next.js `after()`), so pages never wait on email. `/api/notifications/deliver` re-sends
anything still pending — Vercel Cron calls it daily (`vercel.json`), and a Supabase Database Webhook on
`notifications` INSERT can call it instantly. Undelivered rows are claimed atomically (no duplicate
emails), retried up to 3 times, and failures are kept in `notifications.email_error`. Email is a no-op
until `EMAIL_FROM` and either the `SMTP_*` variables or `RESEND_API_KEY` are set.

### Order documents
Staff attach files to an order — delivery dockets, compliance certificates, signed quotes, quotes,
specifications — from the **Documents** panel on the order page. Files go to a private `documents` bucket
(`documents/<company_id>/<order_id>/…`); everyone at that company can view and download them through
5-minute signed links, and is notified when one is added. Only staff can add or remove documents, and
each add/remove is in the audit log (migration `010`).

### Invoices
Each order has a printable page at `/invoice/<order id>` (order page → *Download Invoice PDF*; the
browser's *Save as PDF* produces the file). It's a **Tax Invoice** once staff set an invoice number,
otherwise an **Order Confirmation**. Supplier details come from the `BUSINESS_*` variables.

### Payments (Stripe)
Orders can be paid by card through Stripe Checkout (hosted page, AUD, GST as its own line).
- **Prepaid** companies are sent to Checkout straight after placing an order; everyone else can pay any
  unpaid order from its order page (Admin, Procurement Manager and Finance roles).
- The amount is always computed on the server from the order total in the database.
- `POST /api/stripe/webhook` marks the order **Paid** (or **Processing** for delayed bank payments) and
  notifies staff and the customer. The checkout return page runs the same idempotent sync so the
  customer sees the result immediately. Customers can't change payment fields (no UPDATE on orders).
- Register the webhook in the Stripe Dashboard → Developers → Webhooks for
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  and use the `whsec_…` it prints.
- Restricted key permissions needed: Checkout Sessions (write).
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

### Landing page & paid plans (Stripe Billing)
Signed-out visitors at `/` see the marketing page (`app/welcome`, rewritten by the auth proxy, so the URL
stays `/`); signed-in users still get their dashboard. The page sells the portal on three plans —
**Starter A$79/mo, Growth A$199/mo, Scale A$499/mo** (incl. GST; yearly = 2 months free) — each with a
14-day free trial.
- Plan cards call `startTrialAction` → Stripe Checkout in `subscription` mode. Prices are found by
  lookup key (`gss_<plan>_<monthly|yearly>`), so amounts can change in Stripe without a deploy — keep
  `PLANS` in `app/lib/billing.ts` in step for display.
- The webhook and `/welcome/success` upsert the `subscriptions` table (service role only; staff read it
  under **Admin → Subscriptions**, with MRR). Subscribers manage card, plan, invoices and cancellation in
  Stripe's customer portal (`STRIPE_BILLING_PORTAL_URL`).
- Webhook events needed in addition to the payment ones: `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- Provisioning a portal for a new subscriber is manual for now (the success page promises it within
  1 business day).

### Security
- **Staff two-factor sign-in** — authenticator-app codes (Supabase Auth MFA, TOTP). Staff rights in the
  database (`is_staff()`) only apply to a session that passed the code step (`aal2`), so a stolen staff
  password alone opens nothing. Staff without two-factor are sent to **Account → Security** to set it up;
  customers can turn it on too, and are then asked for a code at every sign-in (`/two-factor`).
- **Audit log** — database triggers record who changed prices, order and payment statuses, company approval
  and terms, user roles and access, proof decisions and invitations, with old → new values. Append-only
  (nobody, including the server, can edit or delete entries). Staff read it at **Admin → Audit Log**.
- **Rate limits** — Postgres-backed counters (they hold across serverless instances) on plan sign-up checkout
  (per IP), card payment sessions, orders, reorder requests and invitations (per user). Sign-in, sign-up and
  password-reset attempts are limited by Supabase Auth (**Authentication → Rate Limits**).
- **Hardening** — security headers on every response (no framing, `nosniff`, HSTS, referrer and permissions
  policies); sign-in redirects only to same-site paths; payment and invite links are built only for this
  site's own hosts; demo mode can't switch on in a Vercel production deployment; the cron secret is
  compared in constant time.

### Hosting regions
The Supabase database is in Tokyo (`ap-northeast-1`), so `vercel.json` runs the server functions in Tokyo
too (`hnd1`) — every page makes several database queries, and each one would otherwise cross the Pacific.
GSS's customers are in Australia: before launch, consider moving both to Sydney (a new Supabase project in
`ap-southeast-2` with the data migrated, and `"regions": ["syd1"]`).

### Tests, CI and monitoring
- `npm run test:db` runs the migrations against an in-memory Postgres and checks company separation, privilege
  escalation guards, reorders, invitations, storage access, proof approval, server pricing and
  notifications, payment state, email delivery, product pricing, subscriptions, staff two-factor,
  rate limits, the audit log and order documents (181 checks).
- `npm run test:e2e` runs Playwright browser tests of the key flows on desktop, tablet (portrait and
  landscape) and phone sizes, in demo mode: landing page and sign-in, reorder from the catalogue to a placed order, card payment and tax
  invoice, order documents, proof approval, staff reorder approval, admin pages and the audit log, and the security headers.
- **GitHub Actions** (`.github/workflows/ci.yml`) runs on every push and pull request: lint, type check,
  database tests, production build, browser tests (report uploaded on failure). No secrets needed.
- **Error tracking** — `instrumentation.ts` reports every uncaught server error (pages, server actions,
  route handlers, proxy) and `instrumentation-client.ts` / the error boundary report browser errors, to
  Sentry when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set (no SDK; only the error, path and route are
  sent — never headers, cookies or form data). Without a DSN they still appear in the Vercel logs.

---

## Requirements Coverage (Phase 1 brief)

| Requirement | Where |
|---|---|
| Secure customer login | Supabase Auth email/password + password reset; invite-only joining via expiring, email-bound links |
| Company accounts, multiple users | `companies` ↔ `profiles`; Team page |
| Roles; company admins manage their users | Admin / Procurement Manager / Finance / Viewer; invite, change role, deactivate (guarded in DB) |
| Order history (products, qty, dates, artwork, specs, refs, status) | Order History + Order detail; plate refs link to proofs in the vault |
| One-click reorder with new quantities | *Reorder This* → reorder request → staff approve → new order (priced in DB) |
| Secure artwork / proofs / documents | Private storage buckets, per-company folders, signed URLs, proof approval + versioning; order documents (dockets, certificates, quotes) |
| Admin dashboard | Admin → overview, companies, orders, reorder requests, artwork upload |
| Order status workflow | Staff status changes → customer notifications |
| Email notifications | Every notification + invitations, via Resend (see Notifications) |
| Responsive | Phone, tablet and desktop layouts (tested in CI at each size), print-friendly invoices |
| Data separation between companies | Postgres RLS; `npm run test:db` proves it (181 checks) |
| Security | Staff two-factor, audit log, rate limits, security headers (see Security) |
| Testing and monitoring | DB tests + Playwright browser tests in GitHub Actions CI; Sentry error tracking |
| Third-party integrations | Stripe card payments (Phase 2 item, done); Resend email |
| Built for future integrations | `invoice_ref` / payment fields ready for Xero sync; per-order pages ready for QR codes |

---

## Owner Setup Checklist

Everything in code is done. These steps need your accounts, data or decisions:

1. **Supabase** — run migrations `000` → `010` in the SQL editor; promote the first staff user (see Setup).
   After `009`, staff rights need two-factor: each staff member signs in, opens **Account → Security** and
   sets up an authenticator app. Check **Authentication → Rate Limits** (sign-in / sign-up / reset attempts).
   Set **Authentication → SMTP** to your email provider so sign-up / password-reset emails come from your domain,
   and set **Authentication → URL Configuration → Site URL** to the production URL.
2. **Stripe** — create the webhook destination (`https://<domain>/api/stripe/webhook`, the three
   `checkout.session.*` events) and copy its signing secret. Before going live, switch to live keys
   (ideally a restricted key) and complete Stripe account activation.
3. **Email** — now: Gmail SMTP with an App Password, in both Supabase (Auth → SMTP) and the app (`SMTP_*`).
   Before launch: buy a domain, verify it in Resend (or any SMTP provider) and switch `EMAIL_FROM` / credentials.
4. **Vercel** — deploy, then add every variable from Setup step 1 (including `CRON_SECRET`) and redeploy.
   Optional: a Supabase **Database Webhook** on `notifications` INSERT → `POST https://<domain>/api/notifications/deliver`
   with header `Authorization: Bearer <CRON_SECRET>` for instant delivery of sign-up-time notifications.
5. **Business details** — fill in the `BUSINESS_*` variables (ABN is required on tax invoices).
6. **Data migration** — review the existing Airtable base and map its customers, orders and artwork
   onto these tables (needs access to the base).
7. **Monitoring** — create a free Sentry project (platform: Next.js) and add its DSN as `SENTRY_DSN` and
   `NEXT_PUBLIC_SENTRY_DSN` in Vercel. In GitHub, make the **CI** check required on `master` (Settings → Branches).
8. **Backups** — open Supabase **Database → Backups** and confirm what your plan keeps. The Pro plan includes
   daily backups (Point-in-Time Recovery is an add-on); on the Free plan, take your own regular dump
   (`supabase db dump`) and store it somewhere private. Do a test restore into a spare project once.
9. **Test pass** — place a Prepaid-company order and pay with `4242 4242 4242 4242`; confirm the order
   shows **Paid** and the emails arrive.

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
| **Supabase** | Postgres + Auth + Storage | Row Level Security for company separation; private artwork bucket |
| **Stripe** | `stripe` 22.6.0 | Hosted Checkout for card payments; signed webhooks |
| **Nodemailer / Resend** | SMTP or HTTP API | Transactional email for notifications and invitations |
| **Vercel** | Hosting + Cron | Zero-config Next.js hosting; daily email backstop |
| **League Spartan** | Google Fonts | Brand-aligned industrial sans-serif |

---

## Project Structure

```
app/
├── (auth)/                     # Login, registration (incl. invite links), password reset
├── (dashboard)/                # Signed-in shell: SideNav + TopBar
│   ├── page.tsx                # Dashboard overview
│   ├── catalog/                # Approved artwork priced from last order → cart
│   ├── cart/page.tsx           # Review, place order, prepaid → Stripe Checkout
│   ├── order/                  # Order history, reorder requests, order detail + payment panel
│   ├── vault/                  # Artwork & proofs (signed URLs, proof approval)
│   ├── team/                   # Invite users, change roles, deactivate
│   ├── notifications/          # In-portal notifications
│   ├── search/                 # Orders + artwork search
│   └── admin/                  # Staff: overview, companies, orders, reorder requests
├── invoice/[id]/               # Printable tax invoice / order confirmation
├── api/
│   ├── stripe/webhook/         # Signed Stripe events → order payment state
│   └── notifications/deliver/  # Cron / DB-webhook email backstop
├── auth/callback/              # Supabase email-link callback
├── component/                  # Modals, navigation, admin widgets, PayOrderButton
└── lib/
    ├── actions.ts              # Server Actions (all writes)
    ├── db.ts / db.types.ts     # Queries + row mapping
    ├── stripe.ts               # Checkout + idempotent payment sync
    ├── email.ts                # Notification + invitation emails (Resend)
    ├── business.ts             # Supplier details for invoices
    └── supabase/               # Browser, server, middleware and service-role clients
supabase/
├── migrations/                 # 000 → 006, idempotent
└── tests/rls.test.mjs          # Security test suite (PGlite)
proxy.ts                        # Auth gate (skips signed machine routes)
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
- **Loading skeletons per route** — each data page streams in behind a `loading.tsx` skeleton.
- **The database is the gatekeeper** — prices, permissions and payment state are enforced in Postgres (RLS + `SECURITY DEFINER` functions), so a bug in the UI can't leak another company's data or under-price an order.
- **Public image APIs used for demo data only** — Unsplash and Pravatar appear only in `DEMO_MODE`; real artwork lives in the private Supabase Storage bucket behind 5-minute signed URLs.

---

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000/login](http://localhost:3000/login) to start from the login page.

> The `(auth)` and `(dashboard)` folders are Next.js **route groups** — the parentheses are a Next.js convention that groups routes without affecting the URL path.
