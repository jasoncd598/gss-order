'use client';

import { useState, useTransition } from 'react';
import { Tag, Plus, Pencil, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import { saveProductPriceAction, deleteProductPriceAction, type ProductPriceInput } from '../../lib/actions';
import { formatAUD, formatDate } from '../../lib/utils';
import type { ProductPricingRow } from '../../lib/types';

const field = 'w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const label = 'block text-xs font-semibold text-zinc-600 mb-1';

/**
 * Staff: fixed prices per plate for one company. A fixed price overrides the
 * last-order price in the catalog and when ordering (enforced in place_order).
 */
export default function ProductPricingPanel({ companyId, rows }: { companyId: string; rows: ProductPricingRow[] }) {
  const [editing, setEditing] = useState<ProductPriceInput | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const unpriced = rows.filter((r) => r.hasApprovedArtwork && !r.fixed && !r.lastOrder).length;

  function open(r?: ProductPricingRow) {
    setError(null);
    setIsNew(!r);
    setEditing({
      companyId,
      plateRef:    r?.plateRef ?? '',
      productName: r?.fixed?.productName ?? r?.name ?? '',
      skuId:       r?.fixed?.skuId ?? '',
      unitPrice:   r?.fixed?.unitPrice ?? r?.lastOrder?.unitPrice ?? 0,
      minQuantity: r?.fixed?.minQuantity ?? 1,
    });
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const result = await saveProductPriceAction(editing);
      if (!result.success) { setError(result.error ?? 'Save failed'); return; }
      setEditing(null);
    });
  }

  function remove(r: ProductPricingRow) {
    if (!confirm(`Remove the fixed price for ${r.fixed?.productName ?? r.plateRef}? It will fall back to its last order price${r.lastOrder ? '' : ' (none — it won’t be orderable)'}.`)) return;
    setRowError(null);
    startTransition(async () => {
      const result = await deleteProductPriceAction(companyId, r.plateRef);
      if (!result.success) setRowError(result.error ?? 'Remove failed');
    });
  }

  const set = <K extends keyof ProductPriceInput>(k: K, v: ProductPriceInput[K]) =>
    setEditing((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Products &amp; Pricing</h2>
          {unpriced > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">{unpriced} not priced</span>
          )}
        </div>
        <button onClick={() => open()} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
          <Plus className="w-3.5 h-3.5" /><span>Add price</span>
        </button>
      </div>

      {rowError && <p className="mx-5 mt-3 text-xs text-red-600">{rowError}</p>}

      {rows.length === 0 ? (
        <div className="py-8 text-center text-zinc-400 text-xs">No artwork or prices yet. Upload artwork, then set its price here.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-xs tracking-wider">
                <th className="py-2.5 px-4 text-left">Product</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Min Qty</th>
                <th className="py-2.5 px-4 text-left">Source</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r) => {
                const price = r.fixed?.unitPrice ?? r.lastOrder?.unitPrice;
                return (
                  <tr key={r.plateRef} className="hover:bg-zinc-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 truncate max-w-[220px]">{r.fixed?.productName ?? r.name}</div>
                      <div className="text-xs text-zinc-400 font-mono">
                        {r.plateRef}{r.fixed?.skuId ? ` · ${r.fixed.skuId}` : ''}
                        {!r.hasApprovedArtwork && <span className="text-amber-700 font-sans"> · no approved artwork</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {price !== undefined ? formatAUD(price) : <span className="text-amber-700 font-sans font-semibold">Not priced</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-600">{r.fixed ? r.fixed.minQuantity.toLocaleString() : '—'}</td>
                    <td className="py-3 px-4 text-xs text-zinc-500">
                      {r.fixed ? `Fixed · ${formatDate(r.fixed.updatedAt)}` : r.lastOrder ? `Last order · ${formatDate(r.lastOrder.date)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => open(r)} disabled={pending} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-zinc-700 hover:bg-zinc-100" aria-label={`Edit price for ${r.plateRef}`}>
                          <Pencil className="w-3 h-3" /><span>{r.fixed ? 'Edit' : 'Set price'}</span>
                        </button>
                        {r.fixed && (
                          <button onClick={() => remove(r)} disabled={pending} className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50" aria-label={`Remove fixed price for ${r.plateRef}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-wall-deep/70" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900 text-sm">{isNew ? 'Add Product Price' : 'Set Product Price'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={label}>Plate Reference *</label>
                <input
                  required readOnly={!isNew} value={editing.plateRef}
                  onChange={(e) => set('plateRef', e.target.value)}
                  placeholder="PLT-8812-B"
                  className={`${field} font-mono ${!isNew ? 'bg-zinc-50 text-zinc-500' : ''}`}
                />
                {isNew && <p className="text-xs text-zinc-400 mt-1">Must match the artwork&apos;s plate ref for the customer to order it.</p>}
              </div>
              <div className="col-span-2">
                <label className={label}>Product Name *</label>
                <input required value={editing.productName} onChange={(e) => set('productName', e.target.value)} className={field} />
              </div>
              <div className="col-span-2">
                <label className={label}>SKU</label>
                <input value={editing.skuId ?? ''} onChange={(e) => set('skuId', e.target.value)} className={`${field} font-mono`} />
              </div>
              <div>
                <label className={label}>Unit Price (AUD, ex GST) *</label>
                <input
                  required type="number" min={0.0001} step="any"
                  value={editing.unitPrice || ''}
                  onChange={(e) => set('unitPrice', Number(e.target.value))}
                  className={`${field} font-mono`}
                />
              </div>
              <div>
                <label className={label}>Minimum Qty *</label>
                <input
                  required type="number" min={1} step={1}
                  value={editing.minQuantity}
                  onChange={(e) => set('minQuantity', Math.floor(Number(e.target.value)))}
                  className={`${field} font-mono`}
                />
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

            <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100">Cancel</button>
              <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-5 py-2 rounded-lg text-xs">
                {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Price
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
