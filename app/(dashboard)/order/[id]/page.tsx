export const instant = false;

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Order Detail | GSS Order Portal' };

import Link from 'next/link';
import {
  ArrowLeft, Package, Truck, FileText,
  RefreshCw, CheckCircle2, Clock, MapPin, CreditCard,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getOrderById } from '../../../lib/db';
import { formatAUD, formatDate, orderStatusStyles, paymentStatusStyles } from '../../../lib/utils';
import ReorderModal from '../../../component/modals/ReorderModal';
import OrderStatusSelect from '../../../component/admin/OrderStatusSelect';
import { isDemoMode } from '../../../lib/demo';
import { syncCheckoutSession, GST_RATE } from '../../../lib/stripe';
import PayOrderButton from '../../../component/PayOrderButton';
import { queueEmailDelivery } from '../../../lib/email';

const PAYING_ROLES = ['Admin', 'Procurement Manager', 'Finance'];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId, payment } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_staff, role')
    .eq('id', user!.id)
    .single();
  const isStaff = isDemoMode || (profile?.is_staff ?? false);
  const canPay  = isStaff || PAYING_ROLES.includes(profile?.role ?? '');

  // Back from Stripe Checkout: record the payment now rather than waiting for
  // the webhook (which still runs, and is idempotent with this).
  let paymentNotice: 'paid' | 'processing' | 'cancelled' | null = payment === 'cancelled' ? 'cancelled' : null;
  if (sessionId && !isDemoMode) {
    try {
      const result = await syncCheckoutSession(sessionId);
      if (result === 'Paid')       paymentNotice = 'paid';
      if (result === 'Processing') paymentNotice = 'processing';
      queueEmailDelivery();
    } catch (err) {
      console.error('Order page payment sync:', (err as Error).message);
    }
  }

  const order = await getOrderById(supabase, id);

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
        <div className="flex items-center gap-3 flex-wrap">
          {isStaff && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Staff · Status</span>
              <OrderStatusSelect orderId={order.id} status={order.status} />
            </div>
          )}
          <ReorderModal order={order} />
        </div>
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
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-xs">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {order.paymentStatus && (
            <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Payment</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${paymentStatusStyles(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {paymentNotice === 'paid' && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-2 mb-3">Payment received — thank you.</p>
              )}
              {paymentNotice === 'processing' && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-2 mb-3">Your payment is processing. We&apos;ll notify you when it clears.</p>
              )}
              {paymentNotice === 'cancelled' && order.paymentStatus === 'Unpaid' && (
                <p className="text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-200 rounded px-2.5 py-2 mb-3">Payment cancelled — nothing was charged.</p>
              )}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total inc. GST</span>
                  <span className="font-semibold text-zinc-800">{formatAUD(order.total * (1 + GST_RATE))}</span>
                </div>
                {order.paymentStatus === 'Paid' && order.amountPaid !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Paid</span>
                    <span className="font-semibold text-emerald-600">{formatAUD(order.amountPaid)}{order.paidAt ? ` · ${formatDate(order.paidAt)}` : ''}</span>
                  </div>
                )}
              </div>
              {order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled' && canPay && (
                <div className="mt-3">
                  <PayOrderButton orderId={order.id} />
                </div>
              )}
            </div>
          )}

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
              <Link href={`/invoice/${order.id}`} target="_blank" className="w-full flex items-center space-x-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded transition-colors">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{order.invoiceRef ? 'Download Invoice PDF' : 'Print Order Confirmation'}</span>
              </Link>
              {!isStaff && order.items[0]?.plateRef && (
                <Link href={`/vault?q=${encodeURIComponent(order.items[0].plateRef)}`} className="w-full flex items-center space-x-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded transition-colors">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Artwork Proof</span>
                </Link>
              )}
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
