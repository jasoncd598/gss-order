# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Trade customers** — people at Australian businesses that buy from GSS. Each business is a company account with its own users in four roles: Admin (manages the team), Procurement Manager (orders and approves proofs), Finance (pays and views invoices) and Viewer. Their job: find a past job, reorder it with new quantities, approve artwork proofs, pay, and track the order — usually at a desk during work hours, often repeating something they ordered months ago.
- **GSS staff** — the people who run production and accounts. Their job: approve new company accounts and reorder requests, set per-customer prices, upload artwork and proofs, move orders through production, and see who has paid.
- **Other makers** (secondary) — suppliers evaluating the portal for their own trade customers via the paid plans on the public homepage.

## Product Purpose

GSS is a maker that sells to trade: cast brass and enamel plates, illuminated and LED signage, and hand-painted ceramics. The portal replaces email and phone ordering with one secure place per customer business to see every past order, reorder in a couple of clicks, approve proofs, pay and download invoices. Success means customers reorder without contacting GSS, proofs get approved faster, and orders are paid on time.

## Positioning

Reordering is built on the customer's own production history: the exact plate reference, approved artwork version, specs and price from their previous jobs — not a generic online shop. Prices are set per customer by GSS and calculated on the server, and each company only ever sees its own records.

## Operating Context

- Orders follow a production workflow: Pending Approval → In Production → Quality Check → Dispatched → Delivered (or Cancelled).
- Reorders are requests that GSS staff approve before production.
- Artwork lives in a per-company vault with versions; proofs are approved or sent back with change requests.
- Companies have payment terms (Prepaid, COD, Net 7–60) and credit limits. Prepaid customers pay by card at checkout; others can pay any unpaid order by card.
- Documents in use: purchase order (PO) references, tax invoices, order confirmations.
- Money is in AUD; GST (10%) is shown separately on orders and invoices; plan prices include GST.

## Capabilities and Constraints

- Existing, working functionality must be kept exactly: auth and invitations, company accounts and roles, catalog, cart and checkout, order history and detail, reorder requests, artwork vault and proof review, team management, notifications, search, account settings, invoices, staff admin (overview, companies, pricing, artwork upload, orders, reorders, subscriptions), Stripe card payments and Stripe Billing plans, and the public landing page.
- Stack is fixed by the codebase: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Supabase (Postgres + RLS, Auth, Storage), Stripe (Checkout, Billing, customer portal). Deployed on Vercel.
- Demo mode (`DEMO_MODE=true`) renders every screen with sample data for screenshots.
- Terminology to keep: plate ref (e.g. PLT-8812-B), proof, artwork vault, reorder request, PO reference, payment terms.

## Brand Commitments

- The name **GSS** is final. What it stands for is not recorded.
- No logo, colours or fonts exist; the redesign defines them (decision delegated by the owner).

## Evidence on Hand

- None. There are no real customer names, logos, testimonials or statistics. Future work must not invent any.
- Product photos in `public/demo/` are demo-only placeholders whose usage rights are unconfirmed; they must not appear on public marketing pages.

## Product Principles

1. **History first** — a customer's past jobs are the fastest path to their next order; surface them before anything else.
2. **Show the real thing** — product names, plate refs, specs, quantities and money are exact and never decorative.
3. **Trust is earned in the details** — clear status, clear prices with GST, clear ownership of every record.
4. **Staff move fast** — admin screens favour density and scanability over expression.
5. **Truthful selling** — public pages persuade with real capabilities only; no invented proof.
