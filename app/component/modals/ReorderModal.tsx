'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, X, ShoppingCart, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import type { Order, OrderItem } from '../../lib/types';
import { formatAUD } from '../../lib/utils';
import { useUser } from '../../lib/userContext';
import { createReorderRequestAction } from '../../lib/actions';

// DB lines carry their order_items.id; mock lines fall back to SKU
const lineKey = (item: OrderItem) => item.id ?? item.skuId;

export default function ReorderModal({ order }: { order: Order }) {
  const { role, paymentTerms } = useUser();
  const canOrder = role === 'Admin' || role === 'Procurement Manager';
  const [open, setOpen] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [lineKey(i), i.quantity]))
  );
  const [poRef, setPoRef] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const qtyOf = (item: OrderItem) => quantities[lineKey(item)] ?? item.quantity;
  const setQty = (item: OrderItem, qty: number) =>
    setQuantities((q) => ({ ...q, [lineKey(item)]: Math.max(0, qty) }));

  const total = order.items.reduce((sum, item) => sum + qtyOf(item) * item.unitPrice, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createReorderRequestAction({ sourceOrderId: order.id, quantities, poRef, notes });
      if (result.success) setSubmittedRef(result.ref ?? '');
      else setError(result.error ?? 'Something went wrong. Please try again.');
    });
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => { setSubmittedRef(null); setError(null); }, 400);
  }

  if (!canOrder) {
    return (
      <span
        title="Only company Admins and Procurement Managers can reorder"
        className="inline-flex items-center space-x-2 bg-zinc-200 text-zinc-500 px-4 py-2 rounded text-xs font-bold cursor-not-allowed"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Reorder (no permission)</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Reorder This</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-wall-deep/70" onClick={handleClose} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2">
                <div className="bg-amber-400 text-zinc-950 p-1.5 rounded">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-sm">Reorder Request</h2>
                  <p className="text-xs text-zinc-400 font-mono">{order.ref}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedRef === null ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Items */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Adjust Quantities</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={lineKey(item)} className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-zinc-900 text-xs">{item.productName}</div>
                            <div className="text-zinc-400 text-xs font-mono">{item.plateRef} · {item.substrate}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-600 font-bold text-xs font-mono">{formatAUD(item.unitPrice)} ea</div>
                            <div className="text-xs text-zinc-400">last run {item.quantity.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Qty</label>
                          <div className="flex items-center border border-zinc-300 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setQty(item, qtyOf(item) - item.quantity)}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={qtyOf(item)}
                              onChange={(e) => setQty(item, parseInt(e.target.value) || 0)}
                              className="w-24 text-center text-xs font-mono font-bold py-1.5 bg-white border-x border-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => setQty(item, qtyOf(item) + item.quantity)}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-zinc-500 text-xs font-mono">
                            = {formatAUD(qtyOf(item) * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.items.length > 1 && (
                    <p className="text-xs text-zinc-400 mt-2">Set a line to 0 to leave it out of this reorder.</p>
                  )}
                </div>

                {/* Previous order details toggle */}
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-700 font-medium"
                >
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showDetails ? 'Hide' : 'Show'} previous order specs</span>
                </button>
                {showDetails && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-xs font-mono text-zinc-500 space-y-1">
                    <div>Original Date: {order.date}</div>
                    {order.purchaseOrderRef && <div>Previous PO: {order.purchaseOrderRef}</div>}
                    {order.items.map((i) => (
                      <div key={lineKey(i)}>{i.plateRef} · {i.dimensions} · {i.substrate}</div>
                    ))}
                  </div>
                )}

                {/* PO Reference */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                    Purchase Order Reference <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={poRef}
                    onChange={(e) => setPoRef(e.target.value)}
                    placeholder="e.g. PO-ACME-0042"
                    className="w-full border border-zinc-300 rounded px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                    Special Instructions <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Deliver to new address, packaging change…"
                    className="w-full border border-zinc-300 rounded px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Total */}
                <div className="bg-wall rounded-sm p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-blue-200 text-xs uppercase tracking-[0.12em] font-semibold">Estimated Total</div>
                    <div className="text-brass-light text-xl font-bold font-mono">{formatAUD(total)}</div>
                    <div className="text-blue-200 text-xs">{paymentTerms} terms · AUD excl. GST</div>
                  </div>
                  <button
                    type="submit"
                    disabled={pending || total <= 0}
                    className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-colors shrink-0"
                  >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    <span>{pending ? 'Submitting…' : 'Submit Reorder'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-2">Reorder Submitted!</h3>
                <p className="text-zinc-500 text-sm mb-1">
                  Request <span className="font-mono font-bold text-zinc-800">{submittedRef}</span> has been received.
                </p>
                <p className="text-zinc-400 text-xs mb-6">
                  Our team will review it and confirm production within 1 business day. Track it under Order History.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
