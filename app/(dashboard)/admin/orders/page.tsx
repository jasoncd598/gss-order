import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'All Orders | GSS Admin' };

import Link from 'next/link';
import { ShieldCheck, Package } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getAllOrdersAdmin } from '../../../lib/db';
import { formatAUD, formatDate, paymentStatusStyles } from '../../../lib/utils';
import OrderStatusSelect from '../../../component/admin/OrderStatusSelect';
import Ledger from '../../../component/Ledger';
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
        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">STAFF ONLY</span>
      </div>

      <Ledger
        label="Orders by status"
        items={ALL_STATUSES.map((st) => ({ label: st, value: statusCount[st] ?? 0, warn: st === 'Pending Approval' && (statusCount[st] ?? 0) > 0 }))}
      />

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2 bg-zinc-50">
          <Package className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">All Orders</h2>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">No orders in the system yet.</div>
        ) : (
          <>
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-xs tracking-wider bg-zinc-50/50">
                  <th className="py-3 px-4">Order Ref / Date</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => {
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 font-mono text-xs">{row.ref}</div>
                        <div className="text-zinc-500 text-xs">{formatDate(row.date)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 font-medium max-w-[160px] truncate"><Link href={`/admin/companies/${row.companyId}`} className="hover:text-amber-700 hover:underline">{row.companyName}</Link></td>
                      <td className="py-3.5 px-4 text-zinc-700 max-w-[220px]">
                        <div className="truncate">{row.firstProduct}</div>
                        {row.firstPlateRef && <div className="accession text-xs text-amber-700">{row.firstPlateRef}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusSelect orderId={row.id} status={row.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-zinc-900 text-xs">
                        {formatAUD(row.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        {row.paymentStatus && (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${paymentStatusStyles(row.paymentStatus)}`}>
                            {row.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/order/${row.id}`} className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones and small tablets: stacked records, status still editable */}
          <ul className="xl:hidden divide-y divide-zinc-200">
            {rows.map((row) => (
              <li key={row.id} className="px-4 py-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/order/${row.id}`} className="accession font-bold text-zinc-950 text-[13px] hover:text-amber-700">{row.ref}</Link>
                  <span className="accession font-bold text-zinc-950 text-[13px]">{formatAUD(row.total)}</span>
                </div>
                <div className="text-[13px] text-zinc-800">
                  {row.firstProduct}
                  <div className="text-xs text-zinc-600">
                    {row.firstPlateRef && <span className="accession text-amber-700">{row.firstPlateRef} · </span>}
                    <Link href={`/admin/companies/${row.companyId}`} className="hover:text-amber-700">{row.companyName}</Link> · {formatDate(row.date)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusSelect orderId={row.id} status={row.status} />
                  {row.paymentStatus && <span className={paymentStatusStyles(row.paymentStatus)}>{row.paymentStatus}</span>}
                  <Link href={`/order/${row.id}`} className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 underline">View</Link>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>
    </div>
  );
}
