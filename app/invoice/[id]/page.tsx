import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Invoice | GSS Order Portal' };

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { getOrderById, isUuid, MOCK_ADMIN_COMPANIES } from '../../lib/db';
import { formatAUD, formatDate } from '../../lib/utils';
import { isDemoMode } from '../../lib/demo';
import { GST_RATE } from '../../lib/stripe';
import { BUSINESS } from '../../lib/business';
import PrintButton from './PrintButton';

/**
 * Printable invoice for one order (browser "Save as PDF"). Outside the
 * dashboard layout so it prints without navigation. RLS limits customers to
 * their own company's orders.
 */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const order = await getOrderById(supabase, id);

  if (!order) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Invoice not found</h1>
        <Link href="/order" className="text-amber-600 hover:text-amber-800 text-sm underline">Back to Order History</Link>
      </div>
    );
  }

  type Customer = { name: string; abn: string | null; address: string | null; payment_terms: string };
  let customer: Customer | null = null;
  if (isDemoMode) {
    customer = MOCK_ADMIN_COMPANIES[0];
  } else if (isUuid(id)) {
    const { data } = await supabase
      .from('orders')
      .select('companies ( name, abn, address, payment_terms )')
      .eq('id', id)
      .maybeSingle();
    const c = data?.companies as unknown as Customer | Customer[] | null | undefined;
    customer = (Array.isArray(c) ? c[0] : c) ?? null;
  }

  const isTaxInvoice = !!order.invoiceRef;
  const gst = Math.round(order.total * GST_RATE * 100) / 100;
  const total = order.total + gst;
  const paid = order.paymentStatus === 'Paid';

  return (
    <div className="min-h-screen bg-zinc-100 print:bg-white py-6 print:py-0 px-4 print:px-0">
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href={`/order/${order.id}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /><span>Back to order</span>
        </Link>
        <PrintButton />
      </div>

      <article className="max-w-3xl mx-auto bg-white border border-zinc-200 print:border-0 rounded-lg print:rounded-none shadow-sm print:shadow-none p-6 sm:p-10 text-zinc-900">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b-2 border-zinc-900">
          <div>
            <div className="text-2xl font-black tracking-tight">{BUSINESS.name}</div>
            <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
              {BUSINESS.abn && <div>ABN {BUSINESS.abn}</div>}
              {BUSINESS.address && <div>{BUSINESS.address}</div>}
              {(BUSINESS.email || BUSINESS.phone) && <div>{[BUSINESS.email, BUSINESS.phone].filter(Boolean).join(' · ')}</div>}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-xl font-black uppercase tracking-wider">{isTaxInvoice ? 'Tax Invoice' : 'Order Confirmation'}</div>
            <dl className="text-xs mt-2 space-y-0.5 font-mono">
              {isTaxInvoice && <div><dt className="inline text-zinc-400">Invoice </dt><dd className="inline font-bold">{order.invoiceRef}</dd></div>}
              <div><dt className="inline text-zinc-400">Order </dt><dd className="inline font-bold">{order.ref}</dd></div>
              <div><dt className="inline text-zinc-400">Date </dt><dd className="inline">{formatDate(order.date)}</dd></div>
              {order.purchaseOrderRef && <div><dt className="inline text-zinc-400">Your PO </dt><dd className="inline">{order.purchaseOrderRef}</dd></div>}
            </dl>
          </div>
        </header>

        {!BUSINESS.abn && (
          <p className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 print:hidden">
            Supplier ABN isn&apos;t configured (BUSINESS_ABN). A tax invoice must show it.
          </p>
        )}

        {/* Bill to */}
        <section className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Bill to</div>
            <div className="font-bold text-sm">{customer?.name ?? '—'}</div>
            {customer?.abn && <div className="text-zinc-600">ABN {customer.abn}</div>}
            {customer?.address && <div className="text-zinc-600">{customer.address}</div>}
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Payment</div>
            <div className="font-bold text-sm">{paid ? 'Paid' : customer?.payment_terms ?? '—'}</div>
            {paid && order.paidAt && <div className="text-zinc-600">Paid by card {formatDate(order.paidAt)}</div>}
          </div>
        </section>

        {/* Lines */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="border-y border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-2 pr-2 text-left">Description</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-right">Unit (ex GST)</th>
                <th className="py-2 pl-2 text-right">Amount (ex GST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item, i) => (
                <tr key={item.id ?? i}>
                  <td className="py-2.5 pr-2">
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {[item.skuId, item.plateRef && `Plate ${item.plateRef}`, item.dimensions, item.substrate].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">{item.quantity.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-mono">{formatAUD(item.unitPrice)}</td>
                  <td className="py-2.5 pl-2 text-right font-mono font-semibold">{formatAUD(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <section className="mt-4 flex justify-end">
          <dl className="w-full sm:w-64 text-xs space-y-1.5">
            <div className="flex justify-between"><dt className="text-zinc-500">Subtotal (ex GST)</dt><dd className="font-mono">{formatAUD(order.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">GST (10%)</dt><dd className="font-mono">{formatAUD(gst)}</dd></div>
            <div className="flex justify-between border-t-2 border-zinc-900 pt-2 text-sm font-black"><dt>Total (AUD)</dt><dd className="font-mono">{formatAUD(total)}</dd></div>
            {paid && order.amountPaid !== undefined && (
              <>
                <div className="flex justify-between text-emerald-700"><dt>Paid</dt><dd className="font-mono">−{formatAUD(order.amountPaid)}</dd></div>
                <div className="flex justify-between font-bold"><dt>Balance due</dt><dd className="font-mono">{formatAUD(Math.max(0, total - order.amountPaid))}</dd></div>
              </>
            )}
          </dl>
        </section>

        {!paid && (BUSINESS.bankDetails || BUSINESS.email) && (
          <section className="mt-8 pt-4 border-t border-zinc-200 text-xs text-zinc-600">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">How to pay</div>
            <p>Pay by card from this order in the portal{BUSINESS.bankDetails ? `, or by bank transfer: ${BUSINESS.bankDetails}` : ''}. Please quote <span className="font-mono font-bold">{order.invoiceRef ?? order.ref}</span>.</p>
          </section>
        )}
      </article>
    </div>
  );
}
