export const instant = false;

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Order Detail | GSS Order Portal' };

import Link from 'next/link';
import {
  ArrowLeft, Package, Truck, FileText,
  RefreshCw, CheckCircle2, Clock, MapPin,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getOrderById } from '../../../lib/db';
import { formatAUD, formatDate, orderStatusStyles } from '../../../lib/utils';
import ReorderModal from '../../../component/modals/ReorderModal';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single();

  const order = await getOrderById(supabase, id, profile?.company_id ?? '');

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Order not found</h1>
        <Link href="/order" className="text-amber-600 hover:text-amber-800 text-sm underline">
          Back to Order History
        </Link>
      </div>
    );
  }

  const steps = [
    { label: 'Order Placed',  done: true },
    { label: 'In Production', done: ['In Production','Quality Check','Dispatched','Delivered'].includes(order.status) },
    { label: 'Quality Check', done: ['Quality Check','Dispatched','Delivered'].includes(order.status) },
    { label: 'Dispatched',    done: ['Dispatched','Delivered'].includes(order.status) },
    { label: 'Delivered',     done: order.status === 'Delivered' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/order" className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Order History</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-xl font-bold text-zinc-900 font-mono">{order.ref}</h1>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${orderStatusStyles(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Ordered {formatDate(order.date)}{order.invoiceRef ? ` · Invoice: ${order.invoiceRef}` : ''}
          </p>
        </div>
        <ReorderModal order={order} />
      </div>

      {/* Progress */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Order Progress</h2>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step.label} className="flex-1 flex flex-col items-center relative">
              {i < steps.length - 1 && (
                <div className={`absolute left-1/2 top-3.5 w-full h-0.5 ${step.done ? 'bg-amber-400' : 'bg-zinc-200'}`} />
              )}
              <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                step.done ? 'bg-amber-400 border-amber-400 text-zinc-950' : 'bg-white border-zinc-300 text-zinc-400'
              }`}>
                {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-semibold mt-2 text-center ${step.done ? 'text-zinc-800' : 'text-zinc-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Line items */}
        <div className="md:col-span-2 bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2">
            <Package className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Order Items</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4 text-left">Product</th>
                <th className="py-2.5 px-4 text-left">Specs</th>
                <th className="py-2.5 px-4 text-right">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit</th>
                <th className="py-2.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <tr key={item.skuId} className="hover:bg-zinc-50">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900">{item.productName}</div>
                    <div className="text-zinc-400 font-mono text-[10px]">{item.skuId}</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 font-mono text-[10px]">
                    <div>{item.dimensions}</div>
                    <div>{item.substrate}</div>
                    <div className="text-amber-600 font-semibold">Plate: {item.plateRef}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-700">{item.quantity.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-600">{formatAUD(item.unitPrice)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-zinc-900">{formatAUD(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                <td colSpan={4} className="py-3 px-4 font-bold text-zinc-700 text-right uppercase tracking-wider text-[10px]">Order Total</td>
                <td className="py-3 px-4 text-right font-black text-zinc-900 text-sm">{formatAUD(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {order.courier && (
            <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Truck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Delivery</h3>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Courier</span>
                  <span className="font-semibold text-zinc-800">{order.courier}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tracking</span>
                    <span className="font-semibold text-amber-600">{order.trackingNumber}</span>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ETA</span>
                    <span className="font-semibold text-zinc-800">{formatDate(order.estimatedDelivery)}</span>
                  </div>
                )}
              </div>
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-start space-x-1.5">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-500">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">References</h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {order.invoiceRef && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Invoice</span>
                  <span className="font-semibold text-indigo-600">{order.invoiceRef}</span>
                </div>
              )}
              {order.purchaseOrderRef && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">PO Ref</span>
                  <span className="font-semibold text-zinc-800">{order.purchaseOrderRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Order Date</span>
                <span className="font-semibold text-zinc-800">{formatDate(order.date)}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded transition-colors">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Download Invoice PDF</span>
              </button>
              <button className="w-full flex items-center space-x-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded transition-colors">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>View Artwork Proof</span>
              </button>
              <Link href="/catalog" className="w-full flex items-center space-x-2 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 px-3 py-2 rounded transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reorder This Product</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
