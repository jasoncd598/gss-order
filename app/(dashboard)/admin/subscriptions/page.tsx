import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Subscriptions | GSS Admin' };

import { ShieldCheck, CreditCard, ExternalLink } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getSubscriptions } from '../../../lib/db';
import { PLANS } from '../../../lib/billing';
import { formatAUD, formatDate } from '../../../lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active:             'stamp stamp-green',
  trialing:           'stamp stamp-blue',
  past_due:           'stamp stamp-red',
  unpaid:             'stamp stamp-red',
  incomplete:         'stamp stamp-ochre',
  canceled:           'stamp stamp-grey',
  incomplete_expired: 'stamp stamp-grey',
};
const statusLabel = (s: string) => s === 'past_due' ? 'Past due' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

/** Staff: everyone subscribed to a portal plan (mirrored from Stripe Billing). */
export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const rows = await getSubscriptions(supabase);

  const price = (plan: string, interval: string) => {
    const p = PLANS.find((x) => x.id === plan);
    return p ? (interval === 'year' ? p.yearly / 12 : p.monthly) : 0;
  };
  // Monthly recurring revenue from paying subscriptions (trials don't count yet)
  const mrr = rows.filter((r) => r.status === 'active' || r.status === 'past_due').reduce((sum, r) => sum + price(r.plan, r.interval), 0);
  const count = (pred: (s: string) => boolean) => rows.filter((r) => pred(r.status)).length;

  const kpis = [
    { label: 'MRR (incl. GST)', value: formatAUD(mrr) },
    { label: 'Active',          value: count((s) => s === 'active') },
    { label: 'In trial',        value: count((s) => s === 'trialing') },
    { label: 'Past due',        value: count((s) => s === 'past_due' || s === 'unpaid'), alert: true },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-zinc-900">Admin — Subscriptions</h1>
          </div>
          <p className="text-xs text-zinc-500">{rows.length} portal subscriptions · synced from Stripe Billing</p>
        </div>
        <a
          href="https://dashboard.stripe.com/subscriptions"
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-2 rounded text-xs font-semibold"
        >
          Open in Stripe <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <div className={`text-xl font-black ${k.alert && Number(k.value) > 0 ? 'text-red-600' : 'text-zinc-900'}`}>{k.value}</div>
            <div className="text-xs text-zinc-400 mt-0.5 uppercase tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2 bg-zinc-50">
          <CreditCard className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Subscribers</h2>
        </div>
        {rows.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">No subscriptions yet. They appear here when someone starts a plan from the homepage.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] whitespace-nowrap text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-xs tracking-wider bg-zinc-50/50">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Trial ends / renews</th>
                  <th className="py-3 px-4">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => {
                  const plan = PLANS.find((p) => p.id === r.plan);
                  const amount = plan ? (r.interval === 'year' ? plan.yearly : plan.monthly) : null;
                  const date = r.status === 'trialing' ? r.trialEnd : r.currentPeriodEnd;
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">{r.companyName ?? '—'}</div>
                        <div className="text-xs text-zinc-400 font-mono">{r.email ?? '—'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-700">{plan?.name ?? r.plan} <span className="text-zinc-400 font-normal">· {r.interval === 'year' ? 'yearly' : 'monthly'}</span></td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_STYLES[r.status] ?? 'stamp stamp-grey'}`}>{statusLabel(r.status)}</span>
                        {r.cancelAtPeriodEnd && r.status !== 'canceled' && <span className="ml-1.5 text-xs text-red-600 font-semibold">Cancels at period end</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">{amount !== null ? `${formatAUD(amount)}/${r.interval === 'year' ? 'yr' : 'mo'}` : '—'}</td>
                      <td className="py-3.5 px-4 text-zinc-500">{date ? `${r.status === 'trialing' ? 'Trial ends ' : r.cancelAtPeriodEnd ? 'Ends ' : 'Renews '}${formatDate(date)}` : '—'}</td>
                      <td className="py-3.5 px-4 text-zinc-500">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
