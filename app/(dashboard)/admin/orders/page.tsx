import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'All Orders | GSS Admin' };

import Link from 'next/link';
import { ShieldCheck, Package } from 'lucide-react';
import { MOCK_ORDERS, MOCK_COMPANIES } from '../../../lib/mockData';
import { formatAUD, formatDate, orderStatusStyles } from '../../../lib/utils';
import type { Order } from '../../../lib/types';

// Cross-company orders view for internal admin
// In production each order would have a company_id; here we duplicate for demo
const ALL_ORDERS: (Order & { company: string })[] = [
  ...MOCK_ORDERS.map((o: Order) => ({ ...o, company: 'Acme Packaging Pty Ltd' })),
  { ...MOCK_ORDERS[0], id: 'ord-bb-01', ref: 'ORD-2026-8790', date: '2026-10-05', status: 'In Production' as const, company: 'BrightBox Retail Solutions', total: 9700 },
  { ...MOCK_ORDERS[2], id: 'ord-ns-01', ref: 'ORD-2026-8655', date: '2026-09-30', status: 'Delivered'     as const, company: 'NorthShore Naturals',         total: 1440 },
  { ...MOCK_ORDERS[3], id: 'ord-tl-01', ref: 'ORD-2026-8410', date: '2026-09-20', status: 'Pending Approval' as const, company: 'TradeLink Wholesale Group', total: 18000 },
];

const STATUS_COUNT = ALL_ORDERS.reduce((acc, o) => {
  acc[o.status] = (acc[o.status] ?? 0) + 1;
  return acc;
}, {} as Record<string, number>);

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-zinc-900">Admin — All Orders</h1>
          </div>
          <p className="text-xs text-zinc-500">{ALL_ORDERS.length} orders across {MOCK_COMPANIES.length} companies</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">STAFF ONLY</span>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {(['Pending Approval', 'In Production', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'] as const).map((s) => (
          <div key={s} className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
            <div className={`text-xl font-black ${s === 'Pending Approval' ? 'text-yellow-600' : s === 'Cancelled' ? 'text-red-600' : 'text-zinc-900'}`}>
              {STATUS_COUNT[s] ?? 0}
            </div>
            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2 bg-zinc-50">
          <Package className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">All Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
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
              {ALL_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 font-mono text-[11px]">{order.ref}</td>
                  <td className="py-3.5 px-4 text-zinc-700 font-medium max-w-[160px] truncate">{order.company}</td>
                  <td className="py-3.5 px-4 text-zinc-600 max-w-[180px] truncate">{order.items[0]?.productName}</td>
                  <td className="py-3.5 px-4 text-zinc-500 text-[11px]">{formatDate(order.date)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${orderStatusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold font-mono text-zinc-900 text-[11px]">{formatAUD(order.total)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href={`/order/${order.id}`} className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
