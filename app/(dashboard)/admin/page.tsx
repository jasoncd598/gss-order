import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Staff Overview | GSS Admin' };

import Link from 'next/link';
import { ShieldCheck, RefreshCw, Building2, Clock, Factory, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { getAdminOverview } from '../../lib/db';
import { formatAUD, formatDate } from '../../lib/utils';
import OrderStatusSelect from '../../component/admin/OrderStatusSelect';
import type { OrderStatus } from '../../lib/types';

const PIPELINE: OrderStatus[] = ['Pending Approval', 'In Production', 'Quality Check', 'Dispatched'];

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const o = await getAdminOverview(supabase);

  const kpis = [
    { label: 'Reorders to review',  value: o.pendingReorders,                    icon: RefreshCw, href: '/admin/reorders',  warn: o.pendingReorders > 0 },
    { label: 'Accounts to approve', value: o.pendingCompanies.length,            icon: Building2, href: '/admin/companies', warn: o.pendingCompanies.length > 0 },
    { label: 'Orders to confirm',   value: o.ordersByStatus['Pending Approval'], icon: Clock,     href: '/admin/orders',    warn: o.ordersByStatus['Pending Approval'] > 0 },
    { label: 'In production',       value: o.ordersByStatus['In Production'] + o.ordersByStatus['Quality Check'], icon: Factory, href: '/admin/orders' },
  ];
  const pipelineTotal = PIPELINE.reduce((s, k) => s + o.ordersByStatus[k], 0);
  const allClear = o.pendingReorders === 0 && o.pendingCompanies.length === 0 && o.awaitingApproval.length === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-zinc-900">Staff Overview</h1>
          </div>
          <p className="text-xs text-zinc-500">{o.activeCompanies} active customer accounts · what needs attention today</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">STAFF ONLY</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, href, warn }) => (
          <Link key={label} href={href} className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${warn ? 'border-amber-300' : 'border-zinc-200'}`}>
            <div className="flex justify-between items-center text-zinc-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${warn ? 'text-amber-500' : 'text-zinc-400'}`} />
            </div>
            <div className={`text-3xl font-black ${warn ? 'text-amber-600' : 'text-zinc-900'}`}>{value}</div>
          </Link>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3">Open Order Pipeline</h2>
        {pipelineTotal === 0 ? (
          <p className="text-xs text-zinc-400">No open orders.</p>
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden bg-zinc-100 gap-0.5">
              {PIPELINE.map((k, i) => o.ordersByStatus[k] > 0 && (
                <div key={k} title={`${k}: ${o.ordersByStatus[k]}`} style={{ flexGrow: o.ordersByStatus[k] }}
                  className={['bg-yellow-400', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500'][i]} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[11px] text-zinc-600">
              {PIPELINE.map((k, i) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${['bg-yellow-400', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500'][i]}`} />
                  {k} <strong className="text-zinc-900">{o.ordersByStatus[k]}</strong>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {allClear ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="font-semibold text-zinc-700">All caught up</h3>
          <p className="text-xs text-zinc-400">No reorders, account approvals or orders waiting on staff.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Orders awaiting confirmation */}
          <section className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden lg:col-span-2">
            <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Orders Awaiting Confirmation</h2>
              <Link href="/admin/orders" className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 inline-flex items-center gap-1">All orders <ArrowRight className="w-3 h-3" /></Link>
            </header>
            {o.awaitingApproval.length === 0 ? (
              <p className="px-5 py-6 text-xs text-zinc-400">Nothing waiting.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {o.awaitingApproval.map((r) => (
                  <li key={r.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                    <Link href={`/order/${r.id}`} className="font-mono font-bold text-zinc-900 hover:text-amber-700 sm:w-36 shrink-0">{r.ref}</Link>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-800 truncate">{r.companyName}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{r.firstProduct} · {formatDate(r.date)}</div>
                    </div>
                    <span className="font-mono font-bold text-zinc-900">{formatAUD(r.total)}</span>
                    <OrderStatusSelect orderId={r.id} status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Reorders */}
          <section className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Reorder Requests</h2>
              <Link href="/admin/reorders" className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 inline-flex items-center gap-1">Review <ArrowRight className="w-3 h-3" /></Link>
            </header>
            {o.recentReorders.length === 0 ? (
              <p className="px-5 py-6 text-xs text-zinc-400">No pending requests.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {o.recentReorders.map((r) => (
                  <li key={r.id} className="px-5 py-3 flex items-center gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-zinc-900">{r.ref}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{r.companyName} · {r.items[0]?.productName}</div>
                    </div>
                    <span className="font-mono font-bold">{formatAUD(r.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Accounts */}
          <section className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">New Accounts to Approve</h2>
            </header>
            {o.pendingCompanies.length === 0 ? (
              <p className="px-5 py-6 text-xs text-zinc-400">No accounts waiting.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {o.pendingCompanies.map((c) => (
                  <li key={c.id} className="px-5 py-3 flex items-center gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-zinc-900 truncate">{c.name}</div>
                      <div className="text-[11px] text-zinc-400">{c.industry ?? '—'} · registered {formatDate(c.created_at)}</div>
                    </div>
                    <Link href={`/admin/companies/${c.id}`} className="text-[11px] font-semibold text-amber-600 hover:text-amber-800">Review →</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
