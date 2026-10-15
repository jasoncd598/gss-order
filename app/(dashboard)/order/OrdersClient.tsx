'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ChevronRight, Search, Filter, Package } from 'lucide-react';
import { formatAUD, formatDate, orderStatusStyles, paymentStatusStyles } from '../../lib/utils';
import type { Order, OrderStatus, ReorderRequest } from '../../lib/types';
import ReorderRequestsPanel from './ReorderRequestsPanel';

const ALL_STATUSES: OrderStatus[] = [
  'Pending Approval', 'In Production', 'Quality Check',
  'Dispatched', 'Delivered', 'Cancelled',
];

export default function OrdersClient({
  orders,
  reorders,
  companyName,
}: {
  orders: Order[];
  reorders: ReorderRequest[];
  companyName: string;
}) {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.ref.toLowerCase().includes(q) ||
      o.items.some((i) =>
        i.productName.toLowerCase().includes(q) ||
        i.plateRef.toLowerCase().includes(q) ||
        i.skuId.toLowerCase().includes(q)
      );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Order History</h1>
          <p className="text-xs text-zinc-500">{orders.length} total orders · {companyName}</p>
        </div>
        <Link href="/catalog" className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Quick Reorder Catalog</span>
        </Link>
      </div>

      <ReorderRequestsPanel requests={reorders} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, SKU, plate ref…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 text-zinc-800"
          />
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          {(['All', ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s ? 'bg-wall text-brass-light' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 && orders.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-12 text-center">
          <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-600 mb-1">No orders yet</h3>
          <p className="text-zinc-400 text-xs mb-4">Place your first order from the catalog.</p>
          <Link href="/catalog" className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-semibold uppercase text-xs tracking-wider">
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Plate Ref</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total (AUD)</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 text-xs">No orders match your search.</td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 font-mono text-xs">{order.ref}</td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-medium text-zinc-800 truncate">{order.items[0]?.productName}</div>
                      {order.items.length > 1 && <span className="text-zinc-400 text-xs">+{order.items.length - 1} more</span>}
                    </td>
                    <td className="py-3.5 px-4 accession text-amber-700 text-xs">{order.items[0]?.plateRef}</td>
                    <td className="py-3.5 px-4 text-zinc-700 font-mono text-xs">{order.items[0]?.quantity.toLocaleString()} units</td>
                    <td className="py-3.5 px-4 text-zinc-500 text-xs">{formatDate(order.date)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${orderStatusStyles(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-zinc-900 font-mono text-xs">{formatAUD(order.total)}</td>
                    <td className="py-3.5 px-4">
                      {order.paymentStatus && (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${paymentStatusStyles(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <Link href={`/order/${order.id}`} className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center space-x-1 underline">
                          <span>View</span><ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* Phones and small tablets: each order as a stacked record */}
          <ul className="md:hidden divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <li className="py-10 text-center text-zinc-500 text-xs">No orders match your search.</li>
            ) : filtered.map((order) => (
              <li key={order.id}>
                <Link href={`/order/${order.id}`} className="block px-4 py-3.5 hover:bg-zinc-50">
                  <div className="flex items-center justify-between gap-3">
                    <span className="accession font-bold text-zinc-950 text-[13px]">{order.ref}</span>
                    <span className={orderStatusStyles(order.status)}>{order.status}</span>
                  </div>
                  <div className="mt-1.5 text-[13px] text-zinc-800">
                    {order.items[0]?.productName}
                    {order.items.length > 1 && <span className="text-zinc-500 text-xs"> +{order.items.length - 1} more</span>}
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    <span className="accession text-amber-700">{order.items[0]?.plateRef}</span> · <span className="accession">{order.items[0]?.quantity.toLocaleString()}</span> units · {formatDate(order.date)}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {order.paymentStatus ? <span className={paymentStatusStyles(order.paymentStatus)}>{order.paymentStatus}</span> : <span />}
                    <span className="accession font-bold text-zinc-950 text-[13px]">{formatAUD(order.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-zinc-600 text-xs">
        Showing {filtered.length} of {orders.length} orders
      </p>
    </div>
  );
}
