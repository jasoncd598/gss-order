'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Search,
  RefreshCw,
  X,
  ZoomIn,
} from 'lucide-react';
import { MOCK_ARTWORK } from '../../lib/mockData';
import { artworkStatusStyles } from '../../lib/utils';
import { useCart } from '../../lib/cartContext';
import type { ArtworkStatus, ArtworkFile } from '../../lib/types';

const UNIT_PRICE: Record<string, number> = {
  'art-001': 1.94,
  'art-002': 0.32,
  'art-003': 2.15,
  'art-004': 0.12,
  'art-005': 0.48,
  'art-006': 0.22,
};
const MIN_QTY: Record<string, number> = {
  'art-001': 1000,
  'art-002': 5000,
  'art-003': 2500,
  'art-004': 2500,
  'art-005': 1000,
  'art-006': 3000,
};

type FilterTab = 'All' | ArtworkStatus | 'Cartons & Boxes' | 'Labels & Seals';
const FILTERS: FilterTab[] = ['All', 'Approved', 'Pending Review', 'Revision Required', 'Cartons & Boxes', 'Labels & Seals'];

function ProofModal({ art, onClose }: { art: ArtworkFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm">{art.name}</h3>
            <p className="text-amber-600 font-mono text-[11px] mt-0.5">{art.plateRef} · {art.version} · {art.status}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.previewUrl.replace('w=400&h=300', 'w=800&h=600')}
          alt={art.name}
          className="w-full object-cover max-h-[60vh]"
        />
        <div className="px-5 py-4 bg-zinc-50 grid grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Dimensions</span>
            <span className="font-semibold text-zinc-800">{art.dimensions}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Substrate</span>
            <span className="font-semibold text-zinc-800">{art.substrate}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Colour Spec</span>
            <span className="font-semibold text-zinc-800">{art.colorProfile}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { addItem, isInCart, count } = useCart();
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [proofArt, setProofArt] = useState<ArtworkFile | null>(null);

  const filtered = MOCK_ARTWORK.filter((art) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || art.name.toLowerCase().includes(q) || art.plateRef.toLowerCase().includes(q);
    let matchesFilter = true;
    if (filter === 'Approved' || filter === 'Pending Review' || filter === 'Revision Required') {
      matchesFilter = art.status === filter;
    } else if (filter === 'Cartons & Boxes') {
      matchesFilter = art.name.toLowerCase().includes('box') || art.name.toLowerCase().includes('carton');
    } else if (filter === 'Labels & Seals') {
      matchesFilter = art.name.toLowerCase().includes('label') || art.name.toLowerCase().includes('tag');
    }
    return matchesSearch && matchesFilter;
  });

  function handleAddToCart(art: ArtworkFile) {
    const unitPrice = UNIT_PRICE[art.id] ?? 1.00;
    const minQty = MIN_QTY[art.id] ?? 1000;
    addItem({
      artId: art.id,
      name: art.name,
      plateRef: art.plateRef,
      substrate: art.substrate,
      dimensions: art.dimensions,
      colorProfile: art.colorProfile,
      unitPrice,
      minQty,
      previewUrl: art.previewUrl,
    });
    setJustAdded(art.id);
    setTimeout(() => setJustAdded(null), 2500);
  }

  return (
    <>
      {proofArt && <ProofModal art={proofArt} onClose={() => setProofArt(null)} />}

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Artwork &amp; Die-Line Catalog</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select an approved artwork master to initiate a production run or reorder instantly.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-zinc-900 text-amber-400 px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Net 30 Terms Enabled</span>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-3 py-1.5 rounded text-xs font-bold transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>View Cart ({count})</span>
            </Link>
          </div>
        </div>

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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === f ? 'bg-zinc-900 text-amber-400 shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-sm">No products match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((art) => {
              const unitPrice = UNIT_PRICE[art.id] ?? 1.00;
              const minQty    = MIN_QTY[art.id] ?? 1000;
              const inCart    = isInCart(art.id);
              const isJust    = justAdded === art.id;
              const orderable = art.status === 'Approved';

              return (
                <div
                  key={art.id}
                  className="bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                >
                  {/* Preview */}
                  <div className="relative h-44 bg-zinc-100 overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.previewUrl} alt={art.name} className="w-full h-full object-cover" loading="lazy" />
                    {/* Zoom overlay */}
                    <button
                      onClick={() => setProofArt(art)}
                      className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 transition-colors flex items-center justify-center"
                      aria-label="View proof"
                    >
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </button>
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 text-amber-400 backdrop-blur-sm">
                        {art.plateRef} · {art.version}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${artworkStatusStyles(art.status)}`}>
                        {art.status}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-zinc-900 text-sm leading-tight mb-2">{art.name}</h3>

                    <div className="bg-zinc-50 rounded-lg p-2.5 text-[10px] font-mono space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Dimensions</span>
                        <span className="text-zinc-700 font-semibold">{art.dimensions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Substrate</span>
                        <span className="text-zinc-700 font-semibold truncate max-w-[150px]" title={art.substrate}>{art.substrate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Colour</span>
                        <span className="text-zinc-700 font-semibold truncate max-w-[150px]">{art.colorProfile}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Min Qty</span>
                        <span className="font-bold text-zinc-900">{minQty.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Unit Rate</span>
                        <span className="font-bold text-emerald-600">${unitPrice.toFixed(2)} ea</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-auto gap-2">
                      <button
                        onClick={() => setProofArt(art)}
                        className="flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span>View Proof</span>
                      </button>

                      <button
                        onClick={() => orderable && handleAddToCart(art)}
                        disabled={!orderable}
                        className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          isJust
                            ? 'bg-emerald-500 text-white'
                            : inCart && orderable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : orderable
                            ? 'bg-amber-400 hover:bg-amber-500 text-zinc-950 shadow-sm'
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        }`}
                      >
                        {isJust ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /><span>Added!</span></>
                        ) : inCart && orderable ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /><span>In Cart</span></>
                        ) : orderable ? (
                          <><ShoppingCart className="w-3.5 h-3.5" /><span>Add to Cart</span></>
                        ) : (
                          <><RefreshCw className="w-3.5 h-3.5" /><span>Proof Pending</span></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
