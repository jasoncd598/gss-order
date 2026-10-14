'use client';

import { Package, RefreshCw, FileCheck, DollarSign, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { MOCK_ORDERS } from '../lib/mockData';
import { formatAUD, formatDate, orderStatusStyles } from '../lib/utils';

const RECENT = MOCK_ORDERS.slice(0, 4);

export default function OverviewPage() {
  const ytdSpend = 84910;
  const creditUsed = 14250;
  const creditLimit = 35000;
  const creditPct = Math.round((creditUsed / creditLimit) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Account Portal</h1>
          <p className="text-xs text-zinc-500">Welcome back, <span className="font-semibold text-zinc-700">Acme Packaging Pty Ltd</span></p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Quick Reorder Catalog</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Orders</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900">3</div>
          <p className="text-[11px] text-emerald-600 mt-1 font-mono">1 Dispatched via TNT</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved Plates</span>
            <FileCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900">12</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">Ready for instant run</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">YTD Spend</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900">{formatAUD(ytdSpend)}</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">FY2025/26 Account</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net 30 Credit</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900">{formatAUD(creditUsed)}</div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Used</span>
              <span>{creditPct}% of {formatAUD(creditLimit)}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full">
              <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${creditPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/order" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-4 flex items-center space-x-3 transition-colors group">
          <div className="bg-amber-400/10 text-amber-400 p-2 rounded">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Order History</div>
            <div className="text-zinc-400 text-[11px]">View all {MOCK_ORDERS.length} orders</div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 ml-auto transition-colors" />
        </Link>
        <Link href="/vault" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-4 flex items-center space-x-3 transition-colors group">
          <div className="bg-amber-400/10 text-amber-400 p-2 rounded">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Artwork Vault</div>
            <div className="text-zinc-400 text-[11px]">6 files · 4 approved</div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 ml-auto transition-colors" />
        </Link>
        <Link href="/team" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-4 flex items-center space-x-3 transition-colors group">
          <div className="bg-amber-400/10 text-amber-400 p-2 rounded">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Team & Permissions</div>
            <div className="text-zinc-400 text-[11px]">5 users · 1 pending</div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 ml-auto transition-colors" />
        </Link>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Recent Supply Orders</h2>
          </div>
          <Link href="/order" className="text-xs text-amber-600 hover:text-amber-800 flex items-center space-x-1 font-semibold">
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">Order Ref</th>
              <th className="py-2.5 px-4">Product</th>
              <th className="py-2.5 px-4">Plate Ref</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Total (AUD)</th>
              <th className="py-2.5 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {RECENT.map((order) => (
              <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-zinc-900 font-mono text-[11px]">{order.ref}</td>
                <td className="py-3.5 px-4 font-medium text-zinc-800 max-w-[180px] truncate">{order.items[0]?.productName}</td>
                <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{order.items[0]?.plateRef}</td>
                <td className="py-3.5 px-4 text-zinc-500 text-[11px]">{formatDate(order.date)}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${orderStatusStyles(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-zinc-900 font-mono text-[11px]">
                  {formatAUD(order.total)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link href={`/order/${order.id}`} className="text-[10px] font-semibold text-amber-600 hover:text-amber-800 underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
