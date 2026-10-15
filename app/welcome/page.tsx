import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Building2, RefreshCw, FolderLock, CreditCard, ShieldCheck, Bell,
  UserPlus, MousePointerClick, PackageCheck, CheckCircle2,
} from 'lucide-react';
import { PLANS, TRIAL_DAYS, billingPortalUrl } from '../lib/billing';
import PricingSection from './PricingSection';

export const metadata: Metadata = {
  title: 'GSS Order Portal — B2B ordering & reordering for Australian suppliers',
  description:
    'Give your trade customers a secure portal to view orders, approve artwork and reorder in two clicks. Card payments, tax invoices and staff admin built in.',
};

const FEATURES = [
  { icon: Building2,   title: 'Company accounts & roles', body: 'Each customer business gets its own account with Admin, Procurement, Finance and Viewer roles. Their admins invite and manage their own team.' },
  { icon: RefreshCw,   title: 'Two-click reorders',       body: 'Customers see every past order — products, quantities, specs, PO refs — and repeat it with updated quantities. You approve before production.' },
  { icon: FolderLock,  title: 'Artwork & proof vault',    body: 'Plates, proofs and files in private per-company storage. Customers approve proofs or request changes, and every version is kept.' },
  { icon: CreditCard,  title: 'Card payments built in',   body: 'Prepaid customers pay by card at checkout through Stripe; account customers can pay any invoice online. Paid status updates automatically.' },
  { icon: ShieldCheck, title: 'Pricing you control',      body: 'Set per-customer prices and minimum quantities. Every order is priced on the server, so customers can never change what they pay.' },
  { icon: Bell,        title: 'Staff admin & alerts',     body: 'Approve companies and reorders, move orders through production, and keep customers informed with in-portal and email notifications.' },
];

const STEPS = [
  { icon: UserPlus,          title: 'Invite your customers',  body: 'Add a company, set their terms and prices, and send their team an invite link.' },
  { icon: MousePointerClick, title: 'They order & reorder',   body: 'Customers browse their approved products, reorder past jobs and pay by card or on account.' },
  { icon: PackageCheck,      title: 'You approve & dispatch', body: 'Approve in one click, update status as it moves through production, and get paid.' },
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
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur border-b border-zinc-900">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/welcome" className="flex items-center gap-2.5 shrink-0">
            <span className="bg-amber-400 text-zinc-950 font-black text-sm px-2 py-1 rounded">GSS</span>
            <span className="font-black tracking-tight text-sm sm:text-base">ORDER PORTAL</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm text-zinc-300 hover:text-white px-2 py-2">Sign in</Link>
            <a href="#pricing" className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm px-3.5 sm:px-4 py-2 rounded-lg whitespace-nowrap">Start free trial</a>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> B2B ordering portal for Australian suppliers
          </p>
          <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Let your trade customers <span className="text-amber-400">reorder in two clicks.</span>
          </h1>
          <p className="mt-6 text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            One secure portal for every customer account: order history, artwork approvals, reorders, card payments and tax invoices.
            Less email, fewer phone orders, faster payment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#pricing" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-3 rounded-lg">
              Start {TRIAL_DAYS}-day free trial <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-semibold px-6 py-3 rounded-lg">
              See how it works
            </a>
          </div>
          <p className="mt-5 text-xs text-zinc-500">No setup fee · Cancel anytime · Prices in AUD incl. GST</p>

          <div className="mt-14 relative mx-auto max-w-5xl">
            <div className="absolute -inset-x-10 -inset-y-6 bg-amber-400/10 blur-3xl rounded-full" aria-hidden />
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 h-9 border-b border-zinc-800 bg-zinc-900">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" /><span className="w-2.5 h-2.5 rounded-full bg-zinc-700" /><span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/dashboard.png" alt="Customer dashboard showing active orders, approved plates, spend and recent supply orders" className="w-full h-auto block" width={1440} height={1000} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-wider">Everything in one place</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Built for how B2B customers actually buy.</h2>
          <p className="mt-4 text-zinc-400">Repeat orders, approved artwork, purchase orders and account terms — not a shopping cart bolted onto a consumer store.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="mt-4 font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Staff split ── */}
      <section className="border-y border-zinc-900 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-amber-400 text-sm font-bold uppercase tracking-wider">For your team</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Every order, every customer, one screen.</h2>
            <ul className="mt-6 space-y-3 text-zinc-300">
              {[
                'See every order across all customers with live payment status',
                'Approve new companies and reorder requests in one click',
                'Upload proofs; customers approve or request changes',
                'Printable tax invoices for every order',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /><span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/admin-orders.png" alt="Staff view of all orders with status and payment columns" className="w-full h-auto block" width={1440} height={1000} loading="lazy" />
            </div>
            <div className="hidden sm:block absolute -bottom-8 -left-6 w-36 rounded-2xl border-4 border-zinc-800 overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/mobile-pay.png" alt="Customer paying an order by card on a phone" className="w-full h-auto block" width={390} height={844} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-wider">How it works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Live in an afternoon.</h2>
        </div>
        <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-400 text-zinc-950 font-black text-sm flex items-center justify-center">{i + 1}</span>
                <Icon className="w-5 h-5 text-zinc-500" />
              </div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="scroll-mt-20 border-t border-zinc-900 bg-gradient-to-b from-zinc-900/40 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-amber-400 text-sm font-bold uppercase tracking-wider">Pricing</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Simple plans. {TRIAL_DAYS} days free.</h2>
            <p className="mt-4 text-zinc-400">Pick a plan for the size of your customer base. Upgrade or cancel any time.</p>
          </div>
          <PricingSection plans={PLANS} trialDays={TRIAL_DAYS} portalUrl={portalUrl} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-20 max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-black tracking-tight text-center">Questions</h2>
        <div className="mt-10 divide-y divide-zinc-800 border-y border-zinc-800">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                {q}
                <span className="text-amber-400 text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl bg-amber-400 text-zinc-950 px-6 sm:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to stop taking orders by email?</h2>
            <p className="mt-2 text-zinc-800">Start your {TRIAL_DAYS}-day free trial today.</p>
          </div>
          <a href="#pricing" className="shrink-0 inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-amber-400 font-bold px-6 py-3 rounded-lg">
            Choose a plan <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <footer className="border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-zinc-950 font-black px-1.5 py-0.5 rounded text-[10px]">GSS</span>
            <span>© GSS Order Portal. Prices in AUD incl. GST.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-zinc-300">Customer sign in</Link>
            {portalUrl && <a href={portalUrl} className="hover:text-zinc-300">Manage billing</a>}
            <a href="#pricing" className="hover:text-zinc-300">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
