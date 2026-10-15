'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { startTrialAction } from '../lib/billingActions';
import type { Plan, BillingInterval, PlanId } from '../lib/billing';

const aud = (n: number) => `A$${n.toLocaleString('en-AU')}`;

/** Plans hung on the pricing wall as catalogue labels; the featured plan hangs forward. */
export default function PricingSection({ plans, trialDays, portalUrl }: { plans: Plan[]; trialDays: number; portalUrl: string | null }) {
  const [interval, setBillingInterval] = useState<BillingInterval>('month');
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function start(plan: PlanId) {
    setError(null);
    setBusy(plan);
    startTransition(async () => {
      const result = await startTrialAction(plan, interval);
      if (result.url) { window.location.assign(result.url); return; }
      setBusy(null);
      setError(result.error ?? 'Something went wrong. Please try again.');
    });
  }

  return (
    <div>
      {/* Billing period */}
      <div role="radiogroup" aria-label="Billing period" className="inline-flex items-center border border-blue-300/50 rounded-[2px] p-1">
        {(['month', 'year'] as const).map((i) => (
          <button
            key={i}
            role="radio"
            aria-checked={interval === i}
            onClick={() => setBillingInterval(i)}
            className={`px-4 sm:px-5 py-2 rounded-[2px] text-sm font-semibold transition-colors ${
              interval === i ? 'bg-label text-zinc-950' : 'text-blue-100 hover:text-white'
            }`}
          >
            {i === 'month' ? 'Monthly' : 'Yearly'}
            {i === 'year' && <span className={`ml-2 text-xs font-medium ${interval === i ? 'text-emerald-700' : 'text-brass-light'}`}>2 months free</span>}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 items-end">
        {plans.map((p) => {
          const price = interval === 'month' ? p.monthly : p.yearly;
          const featured = p.highlighted;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col bg-label text-zinc-950 rounded-[2px] p-6 sm:p-7 ${
                featured
                  ? 'ring-2 ring-[#b38b3b] shadow-[0_30px_60px_-24px_rgba(5,10,28,0.95)] md:-translate-y-5'
                  : 'ring-1 ring-[#b38b3b]/50 shadow-[0_18px_40px_-20px_rgba(5,10,28,0.85)]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-[28px] leading-none">{p.name}</h3>
                {featured && <span className="stamp stamp-brass">Recommended</span>}
              </div>
              <p className="text-[14px] text-zinc-600 mt-2 min-h-[42px]">{p.tagline}</p>

              <div className="mt-5 pt-5 border-t border-zinc-300 flex items-baseline gap-1.5">
                <span className="accession text-[34px] leading-none font-bold tracking-tight">{aud(price)}</span>
                <span className="text-zinc-600 text-sm">/{interval === 'month' ? 'month' : 'year'}</span>
              </div>
              <p className="text-zinc-600 text-[13px] mt-1.5">
                incl. GST{interval === 'year' ? ` · ${aud(Math.round(price / 12))}/mo billed yearly` : ''}
              </p>

              <button
                onClick={() => start(p.id)}
                disabled={busy !== null}
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 font-semibold py-3 rounded-[2px] text-sm transition-colors disabled:opacity-60 ${
                  featured ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950' : 'bg-zinc-950 hover:bg-zinc-800 text-label'
                }`}
              >
                {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {busy === p.id ? 'Opening secure checkout…' : <>Start {trialDays}-day free trial <ArrowRight className="w-4 h-4" /></>}
              </button>

              <ul className="mt-6 space-y-2.5 text-[14px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-800">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.25} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-[#f0d5d1]">{error}</p>}

      <p className="mt-10 text-[13px] text-blue-200 max-w-2xl leading-relaxed">
        {trialDays} days free, then billed {interval === 'month' ? 'monthly' : 'yearly'}. Cancel before the trial ends and you won&apos;t be charged.
        Payments are processed securely by Stripe.
        {portalUrl && <> Already subscribed? <a href={portalUrl} className="text-brass-light hover:text-label underline">Manage billing</a>.</>}
      </p>
    </div>
  );
}
