import { Package, RefreshCw, ArrowRight, Clock } from 'lucide-react';
import Ledger from '../component/Ledger';
import Link from 'next/link';
import { createClient } from '../lib/supabase/server';
import { getOrdersByCompany, getDashboardStats } from '../lib/db';
import { formatAUD, formatDate, orderStatusStyles } from '../lib/utils';
import { isDemoMode } from '../lib/demo';

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, companies(name, payment_terms, credit_limit, current_owing)')
    .eq('id', user!.id)
    .single();

  const company    = Array.isArray(profile?.companies) ? profile.companies[0] : profile?.companies;
  const companyId  = profile?.company_id ?? '';
  const companyName  = company?.name          ?? user?.user_metadata?.company_name ?? 'Your Company';
  const paymentTerms = company?.payment_terms ?? 'Net 30';
  const creditLimit  = company?.credit_limit  ?? (isDemoMode ? 35000 : 0);
  const creditUsed   = company?.current_owing ?? (isDemoMode ? 14250 : 0);
  const creditPct    = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  const [orders, stats] = await Promise.all([
    getOrdersByCompany(supabase, companyId),
    getDashboardStats(supabase, companyId),
  ]);

  const recent = orders.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Account Portal</h1>
          <p className="text-xs text-zinc-500">Welcome back, <span className="font-semibold text-zinc-700">{companyName}</span></p>
        </div>
        <Link href="/catalog" className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Quick Reorder Catalog</span>
        </Link>
      </div>

      <Ledger
        label="Account summary"
        items={[
          { label: 'Active orders', value: stats.activeOrders, note: `${stats.totalOrders} orders in total`, href: '/order' },
          { label: 'Approved plates', value: stats.approvedArtwork, note: 'Ready to reorder', href: '/vault' },
          { label: 'Spend this year', value: formatAUD(stats.ytdSpend), note: `FY${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(2)}` },
          creditLimit > 0
            ? { label: `${paymentTerms} credit used`, value: formatAUD(creditUsed), note: `${creditPct}% of ${formatAUD(creditLimit)}`, warn: creditPct >= 90 }
            : { label: 'Payment terms', value: paymentTerms, note: 'No credit limit set' },
        ]}
      />

      {/* Recent Orders */}
      {recent.length > 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Recent Supply Orders</h2>
            </div>
            <Link href="/order" className="text-xs text-amber-600 hover:text-amber-800 flex items-center space-x-1 font-semibold">
              <span>View All</span><ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 font-semibold uppercase text-xs tracking-wider">
                <th className="py-2.5 px-4">Order Ref</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Total (AUD)</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {recent.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 font-mono text-xs">{order.ref}</td>
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="font-medium text-zinc-800 truncate">{order.items[0]?.productName}</div>
                    {order.items[0]?.plateRef && <div className="accession text-xs text-amber-700">{order.items[0].plateRef}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 text-xs">{formatDate(order.date)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${orderStatusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-zinc-900 font-mono text-xs">{formatAUD(order.total)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href={`/order/${order.id}`} className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Phones: each order as a stacked record */}
          <ul className="sm:hidden divide-y divide-zinc-200">
            {recent.map((order) => (
              <li key={order.id}>
                <Link href={`/order/${order.id}`} className="block px-4 py-3.5 hover:bg-zinc-50">
                  <div className="flex items-center justify-between gap-3">
                    <span className="accession font-bold text-zinc-950 text-[13px]">{order.ref}</span>
                    <span className={orderStatusStyles(order.status)}>{order.status}</span>
                  </div>
                  <div className="mt-1.5 text-[13px] text-zinc-800">{order.items[0]?.productName}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
                    <span className="accession text-amber-700">{order.items[0]?.plateRef}</span>
                    <span className="accession font-bold text-zinc-950 text-[13px]">{formatAUD(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-12 text-center">
          <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-600 mb-1">No orders yet</h3>
          <p className="text-zinc-400 text-xs mb-4">Browse the catalog to place your first order.</p>
          <Link href="/catalog" className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      )}
    </div>
  );
}
