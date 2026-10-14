import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'All Orders | GSS Admin' };

import Link from 'next/link';
import { ShieldCheck, Package } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getAllOrdersAdmin } from '../../../lib/db';
import { formatAUD, formatDate, orderStatusStyles } from '../../../lib/utils';
import type { OrderStatus } from '../../../lib/types';

const ALL_STATUSES: OrderStatus[] = [
  'Pending Approval', 'In Production', 'Quality Check',
  'Dispatched', 'Delivered', 'Cancelled',
];

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const rows     = await getAllOrdersAdmin(supabase);

  // Count by status
  const statusCount = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = rows.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-zinc-900">Admin — All Orders</h1>
          </div>
          <p className="text-xs text-zinc-500">{rows.length} orders across all companies</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">STAFF ONLY</span>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
            <div className={`text-xl font-black ${s === 'Pending Approval' ? 'text-yellow-600' : s === 'Cancelled' ? 'text-red-600' : 'text-zinc-900'}`}>
              {statusCount[s] ?? 0}
            </div>
            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2 bg-zinc-50">
          <Package className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">All Orders</h2>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">No orders in the system yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider bg-zinc-50/50">
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => {
                  const companyName = Array.isArray(row.companies)
                    ? row.companies[0]?.name ?? '—'
                    : row.companies?.name ?? '—';
                  // Support both raw DB rows (order_items) and mock mapped rows (items)
                  const rawRow = row as unknown as Record<string, unknown>;
                  const orderItems = (rawRow.order_items as { product_name?: string }[] | undefined);
                  const mappedItems = (rawRow.items as { productName?: string }[] | undefined);
                  const firstProductName = orderItems?.[0]?.product_name ?? mappedItems?.[0]?.productName ?? '—';
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 font-mono text-[11px]">{row.ref}</td>
                      <td className="py-3.5 px-4 text-zinc-700 font-medium max-w-[160px] truncate">{companyName}</td>
                      <td className="py-3.5 px-4 text-zinc-600 max-w-[180px] truncate">
                        {firstProductName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">{formatDate(row.date)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${orderStatusStyles(row.status as OrderStatus)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-zinc-900 text-[11px]">
                        {formatAUD(row.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/order/${row.id}`} className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
