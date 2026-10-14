'use client';

import { useState } from 'react';
import { Download, Eye, RefreshCw, Search, FolderLock, CheckCircle2, X, ShoppingCart } from 'lucide-react';
import { MOCK_ARTWORK } from '../../lib/mockData';
import { formatDate, artworkStatusStyles } from '../../lib/utils';
import { useCart } from '../../lib/cartContext';
import type { ArtworkStatus, ArtworkFile } from '../../lib/types';

const UNIT_PRICE: Record<string, number> = {
  'art-001': 1.94, 'art-002': 0.32, 'art-003': 2.15,
  'art-004': 0.12, 'art-005': 0.48, 'art-006': 0.22,
};
const MIN_QTY: Record<string, number> = {
  'art-001': 1000, 'art-002': 5000, 'art-003': 2500,
  'art-004': 2500, 'art-005': 1000, 'art-006': 3000,
};

const STATUSES: ArtworkStatus[] = ['Approved', 'Pending Review', 'Revision Required', 'Superseded'];

function ProofModal({ art, onClose }: { art: ArtworkFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm">{art.name}</h3>
            <p className="text-amber-600 font-mono text-[11px] mt-0.5">
              {art.plateRef} · {art.version} ·{' '}
              <span className={`font-bold ${art.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {art.status}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.previewUrl.replace('w=400&h=300', 'w=800&h=600')}
          alt={art.name}
          className="w-full object-cover max-h-[55vh]"
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
            <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">Colour</span>
            <span className="font-semibold text-zinc-800">{art.colorProfile}</span>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-zinc-100 flex justify-between items-center">
          <span className="text-[11px] text-zinc-400 font-mono">
            Uploaded by {art.uploadedBy} · {formatDate(art.uploadedAt)} · {art.fileSize}
          </span>
          <button className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center space-x-1.5 font-medium">
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const { addItem, isInCart } = useCart();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ArtworkStatus | 'All'>('All');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [proofArt, setProofArt] = useState<ArtworkFile | null>(null);

  const filtered = MOCK_ARTWORK.filter((a) => {
    const matchesStatus = filter === 'All' || a.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.plateRef.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function handleReorder(art: ArtworkFile) {
    addItem({
      artId:        art.id,
      name:         art.name,
      plateRef:     art.plateRef,
      substrate:    art.substrate,
      dimensions:   art.dimensions,
      colorProfile: art.colorProfile,
      unitPrice:    UNIT_PRICE[art.id] ?? 1.00,
      minQty:       MIN_QTY[art.id] ?? 1000,
      previewUrl:   art.previewUrl,
    });
    setJustAdded(art.id);
    setTimeout(() => setJustAdded(null), 2500);
  }

  return (
    <>
      {proofArt && <ProofModal art={proofArt} onClose={() => setProofArt(null)} />}

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
              <FolderLock className="w-5 h-5 text-amber-500" />
              <span>Artwork &amp; Proof Vault</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {MOCK_ARTWORK.length} files stored · Secure access only · All revisions retained
            </p>
          </div>
          <button className="inline-flex items-center space-x-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3.5 py-2 rounded text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Download All Approved</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artwork name or plate ref…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 text-zinc-800"
            />
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto flex-wrap gap-1.5">
            {(['All', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  filter === s ? 'bg-zinc-900 text-amber-400' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">No artwork files match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((art) => {
              const inCart  = isInCart(art.id);
              const isJust  = justAdded === art.id;

              return (
                <div key={art.id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  {/* Preview */}
                  <div className="relative h-40 bg-zinc-100 overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.previewUrl} alt={art.name} className="w-full h-full object-cover" loading="lazy" />
                    <button
                      onClick={() => setProofArt(art)}
                      className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 flex items-center justify-center transition-colors"
                      aria-label="View proof"
                    >
                      <Eye className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </button>
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${artworkStatusStyles(art.status)}`}>
                        {art.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-2">
                      <h3 className="font-bold text-zinc-900 text-sm leading-tight">{art.name}</h3>
                      <p className="text-amber-600 text-[11px] font-mono mt-0.5">{art.plateRef} · {art.version}</p>
                    </div>

                    <div className="bg-zinc-50 rounded p-2.5 text-[10px] font-mono space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Dimensions</span>
                        <span className="text-zinc-700 font-semibold">{art.dimensions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Substrate</span>
                        <span className="text-zinc-700 font-semibold truncate max-w-[140px]" title={art.substrate}>{art.substrate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Colour</span>
                        <span className="text-zinc-700 font-semibold truncate max-w-[140px]">{art.colorProfile}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400 mb-3 mt-auto">
                      By <span className="text-zinc-600 font-semibold">{art.uploadedBy}</span> · {formatDate(art.uploadedAt)} · {art.fileSize}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
                      <button
                        onClick={() => setProofArt(art)}
                        className="flex-1 flex items-center justify-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-1.5 rounded text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Proof</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-1.5 rounded text-[11px] font-semibold transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      {art.status === 'Approved' && (
                        <button
                          onClick={() => handleReorder(art)}
                          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-[11px] font-bold transition-colors ${
                            isJust
                              ? 'bg-emerald-500 text-white'
                              : inCart
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-400 hover:bg-amber-500 text-zinc-950'
                          }`}
                        >
                          {isJust ? (
                            <><CheckCircle2 className="w-3.5 h-3.5" /><span>Added!</span></>
                          ) : inCart ? (
                            <><ShoppingCart className="w-3.5 h-3.5" /><span>In Cart</span></>
                          ) : (
                            <><RefreshCw className="w-3.5 h-3.5" /><span>Reorder</span></>
                          )}
                        </button>
                      )}
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
