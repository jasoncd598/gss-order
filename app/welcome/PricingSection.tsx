'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { startTrialAction } from '../lib/billingActions';
import type { Plan, BillingInterval, PlanId } from '../lib/billing';

const aud = (n: number) => `A$${n.toLocaleString('en-AU')}`;

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
      {/* Interval toggle */}
      <div className="flex justify-center mb-10">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-1">
          {(['month', 'year'] as const).map((i) => (
            <button
              key={i}
              role="radio"
              aria-checked={interval === i}
              onClick={() => setBillingInterval(i)}
              className={`px-4 sm:px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                interval === i ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {i === 'month' ? 'Monthly' : 'Yearly'}
              {i === 'year' && <span className={`ml-2 text-[11px] font-semibold ${interval === i ? 'text-zinc-800' : 'text-emerald-400'}`}>2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {plans.map((p) => {
          const price = interval === 'month' ? p.monthly : p.yearly;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl p-6 sm:p-7 border ${
                p.highlighted ? 'bg-zinc-900 border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_20px_60px_-20px_rgba(251,191,36,0.25)]' : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-6 bg-amber-400 text-zinc-950 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Most popular</span>
              )}
              <h3 className="text-white font-black text-xl">{p.name}</h3>
              <p className="text-zinc-400 text-sm mt-1 min-h-[40px]">{p.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white tracking-tight">{aud(price)}</span>
                <span className="text-zinc-500 text-sm">/{interval === 'month' ? 'month' : 'year'}</span>
              </div>
              <p className="text-zinc-500 text-xs mt-1">
                incl. GST{interval === 'year' ? ` · ${aud(Math.round(price / 12))}/mo billed yearly` : ''}
              </p>

              <button
                onClick={() => start(p.id)}
                disabled={busy !== null}
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60 ${
                  p.highlighted ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950' : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {busy === p.id ? 'Opening secure checkout…' : <>Start {trialDays}-day free trial <ArrowRight className="w-4 h-4" /></>}
              </button>

              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-zinc-300">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-6 text-center text-sm text-red-400">{error}</p>}

      <p className="mt-8 text-center text-xs text-zinc-500 max-w-xl mx-auto">
        {trialDays} days free, then billed {interval === 'month' ? 'monthly' : 'yearly'}. Cancel before the trial ends and you won&apos;t be charged.
        Payments are processed securely by Stripe.
        {portalUrl && <> Already subscribed? <a href={portalUrl} className="text-amber-400 hover:text-amber-300 underline">Manage billing</a>.</>}
      </p>
    </div>
  );
}
