'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, CheckCircle2, Eye, ShieldCheck, Search, RefreshCw, ZoomIn, Boxes, FolderLock } from 'lucide-react';
import { artworkStatusStyles, formatAUD, formatDate } from '../../lib/utils';
import { useCart } from '../../lib/cartContext';
import { useUser } from '../../lib/userContext';
import ArtworkThumb from '../../component/ArtworkThumb';
import ProofModal from '../../component/modals/ProofModal';
import type { ArtworkStatus, CatalogItem } from '../../lib/types';

type FilterTab = 'All' | 'Ready to Order' | ArtworkStatus;
const FILTERS: FilterTab[] = ['All', 'Ready to Order', 'Pending Review', 'Revision Required'];

export default function CatalogClient({ items }: { items: CatalogItem[] }) {
  const { addItem, isInCart, count } = useCart();
  const { role, paymentTerms } = useUser();
  const canOrder = role === 'Admin' || role === 'Procurement Manager';
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [proof, setProof] = useState<CatalogItem | null>(null);

  const orderable = (i: CatalogItem) => i.status === 'Approved' && i.unitPrice !== null;

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.name.toLowerCase().includes(q) || i.plateRef.toLowerCase().includes(q);
    const matchesFilter =
      filter === 'All' ? true :
      filter === 'Ready to Order' ? orderable(i) :
      i.status === filter;
    return matchesSearch && matchesFilter;
  });

  function add(i: CatalogItem) {
    addItem({
      artId: i.artworkId, name: i.name, plateRef: i.plateRef, substrate: i.substrate,
      dimensions: i.dimensions, colorProfile: i.colorProfile,
      unitPrice: i.unitPrice!, minQty: i.minQuantity ?? i.lastQuantity ?? 1, previewUrl: i.previewUrl,
    });
    setJustAdded(i.artworkId);
    setTimeout(() => setJustAdded(null), 2500);
  }

  return (
    <>
      {proof && (
        <ProofModal
          art={{ ...proof, id: proof.artworkId }}
          canReview={false}
          onClose={() => setProof(null)}
        />
      )}

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Reorder Catalog</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Your approved artwork, priced from your last order. Add to cart and adjust quantities at checkout.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-wall text-brass-light px-3 py-1.5 rounded-sm text-xs font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{paymentTerms} Terms</span>
            </div>
            <Link href="/cart" className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-3 py-1.5 rounded text-xs font-bold transition-colors">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>View Cart ({count})</span>
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-xl py-16 px-6 text-center">
            <Boxes className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h2 className="font-semibold text-zinc-700">Your catalog is empty</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Products appear here once our studio has uploaded and you&apos;ve approved their artwork.
              Already ordered with us? Reorder any past order from Order History.
            </p>
            <div className="flex justify-center gap-2 mt-5">
              <Link href="/order" className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5" /> Order History
              </Link>
              <Link href="/vault" className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded text-xs font-semibold">
                <FolderLock className="w-3.5 h-3.5" /> Artwork Vault
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product or plate ref…"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 text-zinc-800"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                      filter === f ? 'bg-wall text-brass-light shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-zinc-400 text-sm">No products match your search.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((i) => {
                  const inCart = isInCart(i.artworkId);
                  const isJust = justAdded === i.artworkId;
                  const ready  = orderable(i);
                  return (
                    <div key={i.artworkId} className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                      <button onClick={() => setProof(i)} className="relative h-44 bg-zinc-100 overflow-hidden group" aria-label={`View ${i.name}`}>
                        <ArtworkThumb name={i.name} plateRef={i.plateRef} previewUrl={i.previewUrl} mimeType={i.mimeType} />
                        <span className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </span>
                        <span className="absolute top-2 left-2 text-xs font-mono px-2 py-0.5 rounded-sm bg-wall text-brass-light">
                          {i.plateRef} · {i.version}
                        </span>
                        <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded border ${artworkStatusStyles(i.status)}`}>
                          {i.status}
                        </span>
                      </button>

                      <div className="p-4 flex flex-col flex-1">
                        <h2 className="font-bold text-zinc-900 text-sm leading-tight mb-2">{i.name}</h2>

                        <div className="bg-zinc-50 rounded-sm p-2.5 text-xs space-y-1 mb-3">
                          <div className="flex justify-between gap-2"><span className="text-zinc-500 shrink-0">Dimensions</span><span className="text-zinc-800 font-semibold text-right">{i.dimensions || '—'}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-zinc-500 shrink-0">Substrate</span><span className="text-zinc-800 font-semibold text-right">{i.substrate || '—'}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-zinc-500 shrink-0">Colour</span><span className="text-zinc-800 font-semibold text-right">{i.colorProfile || '—'}</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div>
                            <span className="text-xs text-zinc-400 block uppercase tracking-wider">Last Run</span>
                            <span className="accession font-bold text-zinc-900">{i.lastQuantity?.toLocaleString() ?? '—'}</span>
                            {i.lastOrdered && <span className="block text-xs text-zinc-500">{formatDate(i.lastOrdered)}</span>}
                          </div>
                          <div>
                            <span className="text-xs text-zinc-400 block uppercase tracking-wider">Unit Rate</span>
                            {i.unitPrice !== null
                              ? <span className="accession font-bold text-emerald-700">{formatAUD(i.unitPrice)} ea{i.minQuantity && i.minQuantity > 1 && <span className="block text-xs text-zinc-400 font-normal">Min {i.minQuantity.toLocaleString()}</span>}</span>
                              : <span className="font-semibold text-zinc-500">Price on request</span>}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-auto gap-2">
                          <button onClick={() => setProof(i)} className="flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" /><span>View Proof</span>
                          </button>

                          {!ready ? (
                            <span className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-400">
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>{i.status !== 'Approved' ? 'Proof Pending' : 'Request Quote'}</span>
                            </span>
                          ) : !canOrder ? (
                            <span className="text-xs text-zinc-400">View only</span>
                          ) : (
                            <button
                              onClick={() => add(i)}
                              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                isJust ? 'bg-emerald-500 text-white'
                                : inCart ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-400 hover:bg-amber-500 text-zinc-950 shadow-sm'
                              }`}
                            >
                              {isJust ? <><CheckCircle2 className="w-3.5 h-3.5" /><span>Added!</span></>
                               : inCart ? <><CheckCircle2 className="w-3.5 h-3.5" /><span>In Cart</span></>
                               : <><ShoppingCart className="w-3.5 h-3.5" /><span>Add to Cart</span></>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
