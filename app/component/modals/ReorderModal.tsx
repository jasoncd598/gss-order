'use client';

import { useState } from 'react';
import { RefreshCw, X, ShoppingCart, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Order } from '../../lib/types';
import { formatAUD } from '../../lib/utils';

export default function ReorderModal({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [i.skuId, i.quantity]))
  );
  const [poRef, setPoRef] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const total = order.items.reduce((sum, item) => {
    return sum + (quantities[item.skuId] ?? item.quantity) * item.unitPrice;
  }, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => setSubmitted(false), 400);
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
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            onClick={handleClose}
          />

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
                  <p className="text-[11px] text-zinc-400 font-mono">{order.ref}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Items */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Adjust Quantities</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.skuId} className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-zinc-900 text-xs">{item.productName}</div>
                            <div className="text-zinc-400 text-[10px] font-mono">{item.plateRef} · {item.substrate}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-600 font-bold text-xs font-mono">{formatAUD(item.unitPrice)} ea</div>
                            <div className="text-[10px] text-zinc-400">min {item.quantity.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Qty</label>
                          <div className="flex items-center border border-zinc-300 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setQuantities((q) => ({ ...q, [item.skuId]: Math.max(item.quantity, (q[item.skuId] ?? item.quantity) - item.quantity) }))}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold transition-colors"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={quantities[item.skuId] ?? item.quantity}
                              onChange={(e) => setQuantities((q) => ({ ...q, [item.skuId]: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="w-24 text-center text-xs font-mono font-bold py-1.5 bg-white border-x border-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantities((q) => ({ ...q, [item.skuId]: (q[item.skuId] ?? item.quantity) + item.quantity }))}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-zinc-500 text-[11px] font-mono">
                            = {formatAUD((quantities[item.skuId] ?? item.quantity) * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-[11px] font-mono text-zinc-500 space-y-1">
                    <div>Original Date: {order.date}</div>
                    <div>Artwork Approved: All plates confirmed</div>
                    <div>Delivery Address: Warehouse B, Dock 3</div>
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

                {/* Total */}
                <div className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">Estimated Total</div>
                    <div className="text-amber-400 text-xl font-black font-mono">{formatAUD(total)}</div>
                    <div className="text-zinc-500 text-[10px] font-mono">Net 30 Terms · AUD excl. GST</div>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Submit Reorder</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-2">Reorder Submitted!</h3>
                <p className="text-zinc-500 text-sm mb-1">Your reorder request has been received.</p>
                <p className="text-zinc-400 text-xs mb-6">
                  You'll receive a confirmation email shortly. Our team will review and confirm production within 1 business day.
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
