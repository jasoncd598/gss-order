import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { PLANS, TRIAL_DAYS, billingPortalUrl } from '../lib/billing';
import PricingSection from './PricingSection';
import HeroCatalogue from './HeroCatalogue';

export const metadata: Metadata = {
  title: 'GSS Order Portal — every trade job catalogued and ready to reorder',
  description:
    'Give each trade customer their own catalogue of past jobs — plate refs, approved artwork, specs and price — reordered in two clicks, paid by card and invoiced automatically.',
};

/* What each mark on a catalogue label means — the product, explained by its own artifact */
const LABEL_PARTS = [
  { mark: 'A', title: 'Accession number', body: 'The plate reference from your production records, so every reorder points at exactly the right tooling and artwork.' },
  { mark: 'B', title: 'Provenance', body: 'The approved proof version. Customers approve or request changes in their artwork vault, and every version is kept.' },
  { mark: 'C', title: 'Last run', body: 'Quantity, date and the price you set for that customer. Orders are priced on the server, so nobody can edit what they pay.' },
  { mark: 'D', title: 'Registration stamp', body: 'Status set by the event that happened — approved, in production, dispatched, paid — never typed by hand.' },
];

const INDEX = [
  { term: 'Company accounts & roles', def: 'Each customer business gets its own account with Admin, Procurement, Finance and Viewer roles; their admins invite and manage their own team.' },
  { term: 'Reorder requests', def: 'Customers repeat a past job with new quantities; your staff approve it before it goes into production.' },
  { term: 'Artwork & proof vault', def: 'Plates, proofs and files in private per-company storage, with approvals and change requests.' },
  { term: 'Card payments', def: 'Prepaid customers pay by card at checkout through Stripe; account customers can pay any order online. Paid status updates automatically.' },
  { term: 'Per-customer pricing', def: 'Set a fixed unit price and minimum quantity for each customer and product, or fall back to their last order price.' },
  { term: 'Staff register & alerts', def: 'Approve companies and reorders, move orders through production, and keep customers informed in the portal and by email.' },
  { term: 'Tax invoices', def: 'A printable tax invoice or order confirmation for every order, with GST shown.' },
];

const STEPS = [
  { title: 'Hang the collection', body: 'Add a customer company, set their terms and prices, and invite their team.' },
  { title: 'They reorder from it', body: 'Customers open their catalogue, pick a past job, change the quantity and pay by card or on account.' },
  { title: 'You stamp it through', body: 'Approve in one click and move it through production to dispatch. The customer sees every stamp.' },
];

const FAQ = [
  { q: 'How does the free trial work?', a: `Every plan starts with ${TRIAL_DAYS} days free. We take card details at sign-up but won't charge you until the trial ends, and you can cancel any time before then from the billing page.` },
  { q: 'Are prices in Australian dollars?', a: 'Yes. All prices are in AUD and include GST. You receive a tax invoice for every payment.' },
  { q: 'Can I change or cancel my plan later?', a: 'Yes. Upgrade, downgrade or cancel from the self-service billing page. Changes are prorated, and cancellations take effect at the end of the current billing period.' },
  { q: 'How is customer data kept separate?', a: 'Every query runs through database-level row security, so a customer company can only ever see its own orders, artwork and invoices. Files use short-lived signed links.' },
  { q: 'Do my customers pay to use the portal?', a: 'No. Your plan covers your whole team and all the customer users within your plan’s company limit.' },
  { q: 'Can you import our existing customers and orders?', a: 'Yes. Scale includes assisted onboarding and data import; on other plans we can quote it separately.' },
];

export default function LandingPage() {
  const portalUrl = billingPortalUrl();

  return (
    <div className="min-h-screen bg-board text-zinc-950 overflow-x-hidden">
      {/* ── Gallery wall: nav + hero ── */}
      <div className="bg-wall text-label">
        <header className="border-b border-[#b38b3b]/50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
            <Link href="/welcome" className="flex items-baseline gap-2.5 shrink-0">
              <span className="font-display text-[28px] leading-none tracking-tight">GSS</span>
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm text-blue-100">
              <a href="#catalogue" className="hover:text-white">How it reads</a>
              <a href="#how" className="hover:text-white">How it works</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
              <a href="#faq" className="hover:text-white">FAQ</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login" className="text-sm text-blue-100 hover:text-white px-2 py-2">Sign in</Link>
              <a href="#pricing" className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-[2px] whitespace-nowrap transition-colors">Start free trial</a>
            </div>
          </nav>
        </header>

        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-end">
          <div className="lg:col-span-5">
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[1.02] tracking-[-0.02em] text-label [text-wrap:balance]">
              Every job you&apos;ve made, catalogued for reorder.
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-blue-100 max-w-[34rem]">
              Give each trade customer their own collection: every past order with its plate ref, approved artwork,
              specs and price. They reorder in two clicks, pay by card, and get a tax invoice. You approve and dispatch.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <a href="#pricing" className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold px-6 py-3.5 rounded-[2px] transition-colors">
                Start {TRIAL_DAYS}-day free trial <ArrowRight className="w-4 h-4" />
              </a>
              <Link href="/login" className="inline-flex items-center justify-center border border-blue-300/60 hover:border-label text-label font-medium px-6 py-3.5 rounded-[2px] transition-colors">
                Customer sign in
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-blue-200">No setup fee · cancel any time · AUD incl. GST</p>
          </div>
          <div className="lg:col-span-7">
            <HeroCatalogue />
          </div>
        </section>
      </div>

      {/* ── Reading room: how a label works ── */}
      <section id="catalogue" className="scroll-mt-6 max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display text-[34px] sm:text-[44px] leading-[1.05] tracking-[-0.015em] [text-wrap:balance]">
              Read a job the way your customers will.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-zinc-700 max-w-[36rem]">
              Each order a customer has placed with you becomes a catalogue entry. Nothing on it is decoration: every mark is
              a fact from your production records, and every action happens right on the label.
            </p>

            {/* Specimen label with lettered marks */}
            <div className="mt-10 relative bg-label rounded-[2px] p-6 ring-1 ring-[#b38b3b]/70 shadow-[0_14px_30px_-18px_rgba(19,18,15,0.45)] max-w-md">
              <div className="flex items-baseline justify-between">
                <p className="accession text-xs text-zinc-700"><Mark>A</Mark> Acc. PLT-5510-A</p>
                <span className="stamp stamp-blue relative">
                  <Mark className="absolute -left-6 top-1/2 -translate-y-1/2">D</Mark>In production
                </span>
              </div>
              <p className="font-display text-2xl leading-snug mt-3">Illuminated logo lightbox sign</p>
              <p className="text-[13px] text-zinc-600 mt-1">900 × 800 mm · aluminium tray, opal acrylic face</p>
              <p className="text-[13px] text-zinc-700 mt-3"><Mark>B</Mark> Proof v2 approved · 01 Aug 2026</p>
              <p className="text-[13px] text-zinc-700 mt-1.5"><Mark>C</Mark> Last run <span className="accession">2</span> · <span className="accession">A$1,450.00</span> ea</p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Example</p>
            </div>
          </div>

          <ol className="lg:col-span-7 lg:pt-3 divide-y divide-zinc-300 border-y border-zinc-300">
            {LABEL_PARTS.map((p) => (
              <li key={p.mark} className="py-6 grid grid-cols-[2.25rem_1fr] gap-4">
                <Mark large>{p.mark}</Mark>
                <div>
                  <h3 className="font-semibold text-[17px]">{p.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-700 max-w-[38rem]">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Staff register: a mounted print of the real screen ── */}
      <section className="bg-zinc-200/60 border-y border-zinc-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4">
            <h2 className="font-display text-[32px] sm:text-[40px] leading-[1.06] tracking-[-0.015em] [text-wrap:balance]">
              Behind the counter, one register.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-zinc-700">
              Your staff see every order from every customer with its production and payment stamps, approve new
              companies and reorder requests in one click, set prices, and upload proofs for approval.
            </p>
          </div>
          <figure className="lg:col-span-8">
            <div className="bg-label p-3 sm:p-5 rounded-[2px] ring-1 ring-zinc-300 shadow-[0_24px_50px_-24px_rgba(19,18,15,0.5)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/admin-orders.png" alt="The staff order register: every order with company, product, status and payment stamps" className="w-full h-auto block ring-1 ring-zinc-300" width={1440} height={1000} loading="lazy" />
            </div>
            <figcaption className="mt-3 text-[12px] text-zinc-600">
              <span className="accession">Fig. 1</span> — The staff order register, shown with sample data.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Index of everything else ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <h2 className="lg:col-span-4 font-display text-[32px] sm:text-[40px] leading-[1.06] tracking-[-0.015em] [text-wrap:balance]">
          Also in the collection.
        </h2>
        <dl className="lg:col-span-8 border-t border-zinc-400">
          {INDEX.map((i) => (
            <div key={i.term} className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-1 sm:gap-8 py-5 border-b border-zinc-300">
              <dt className="font-semibold text-[16px]">{i.term}</dt>
              <dd className="text-[15px] leading-relaxed text-zinc-700">{i.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── How it works: three steps on one rule ── */}
      <section id="how" className="scroll-mt-6 border-t border-zinc-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
          <h2 className="font-display text-[32px] sm:text-[40px] leading-[1.06] tracking-[-0.015em]">Live in an afternoon.</h2>
          <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
            <span aria-hidden className="hidden md:block absolute left-0 right-0 top-[15px] h-px bg-[#b38b3b]" />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="relative z-10 w-8 h-8 rounded-full bg-board ring-1 ring-[#b38b3b] text-amber-700 font-display text-lg flex items-center justify-center">{i + 1}</span>
                <h3 className="mt-5 font-semibold text-[17px]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-700 max-w-sm">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pricing room: back on the wall ── */}
      <section id="pricing" className="scroll-mt-0 bg-wall text-label">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.04] tracking-[-0.02em] [text-wrap:balance]">
              Three plans. {TRIAL_DAYS} days free.
            </h2>
            <p className="mt-4 text-[16px] text-blue-100">Pick the plan that fits the size of your customer base. Upgrade or cancel any time.</p>
          </div>
          <div className="mt-12">
            <PricingSection plans={PLANS} trialDays={TRIAL_DAYS} portalUrl={portalUrl} />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-6 max-w-4xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
        <h2 className="font-display text-[32px] sm:text-[40px] leading-[1.06] tracking-[-0.015em]">Questions</h2>
        <div className="mt-8 border-t border-zinc-400">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group border-b border-zinc-300">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-semibold text-[16px] hover:text-amber-700">
                {q}
                <Plus aria-hidden className="w-4 h-4 shrink-0 text-amber-700 transition-transform duration-200 group-open:rotate-45" strokeWidth={2} />
              </summary>
              <p className="pb-6 -mt-1 text-[15px] leading-relaxed text-zinc-700 max-w-[42rem]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Close ── */}
      <section className="bg-wall text-label">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <h2 className="font-display text-[34px] sm:text-[46px] leading-[1.04] tracking-[-0.02em] max-w-2xl [text-wrap:balance]">
            Stop taking reorders by email.
          </h2>
          <a href="#pricing" className="shrink-0 inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold px-6 py-3.5 rounded-[2px] transition-colors">
            Choose a plan <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <footer className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] text-blue-200">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-lg text-label leading-none">GSS</span>
              <span>Trade ordering portal · prices in AUD incl. GST</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-white">Customer sign in</Link>
              {portalUrl && <a href={portalUrl} className="hover:text-white">Manage billing</a>}
              <a href="#pricing" className="hover:text-white">Pricing</a>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

/** A lettered mark that ties a part of the specimen label to its explanation */
function Mark({ children, large = false, className = '' }: { children: React.ReactNode; large?: boolean; className?: string }) {
  return (
    <span
      aria-hidden={!large}
      className={`inline-flex items-center justify-center rounded-full border border-[#7c5f24] text-[#634b1b] font-semibold leading-none align-middle ${
        large ? 'w-8 h-8 text-sm' : 'w-[18px] h-[18px] text-[11px] mr-1.5'
      } ${className}`}
    >
      {children}
    </span>
  );
}
