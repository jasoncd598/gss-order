'use client';

import { useState, useTransition } from 'react';
import { Download, Eye, RefreshCw, Search, FolderLock, CheckCircle2, ShoppingCart, Loader2, ClipboardCheck } from 'lucide-react';
import { formatDate, artworkStatusStyles } from '../../lib/utils';
import { useCart } from '../../lib/cartContext';
import ArtworkThumb from '../../component/ArtworkThumb';
import ProofModal, { downloadArtwork } from '../../component/modals/ProofModal';
import type { ArtworkStatus, ArtworkFile } from '../../lib/types';

const STATUSES: ArtworkStatus[] = ['Approved', 'Pending Review', 'Revision Required', 'Superseded'];

export interface VaultPrice { unitPrice: number; lastQuantity: number }

export default function VaultClient({
  artwork: initial,
  prices,
  canReview,
  canOrder,
  initialSearch = '',
}: {
  artwork: ArtworkFile[];
  prices: Record<string, VaultPrice>;
  canReview: boolean;
  canOrder: boolean;
  /** Pre-filled search, e.g. a plate ref linked from an order */
  initialSearch?: string;
}) {
  const { addItem, isInCart } = useCart();
  const [artwork, setArtwork]     = useState(initial);
  const [synced, setSynced]       = useState(initial);
  if (synced !== initial) { setSynced(initial); setArtwork(initial); }

  const awaiting = artwork.filter((a) => a.status === 'Pending Review').length;
  const [search, setSearch]       = useState(initialSearch);
  const [filter, setFilter]       = useState<ArtworkStatus | 'All'>('All');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [proofArt, setProofArt]   = useState<ArtworkFile | null>(null);
  const [busyId, setBusyId]       = useState<string | null>(null);
  const [notice, setNotice]       = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  const filtered = artwork.filter((a) => {
    const matchesStatus = filter === 'All' || a.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.plateRef.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function handleReorder(art: ArtworkFile) {
    const price = prices[art.id];
    if (!price) return;
    addItem({
      artId: art.id, name: art.name, plateRef: art.plateRef, substrate: art.substrate,
      dimensions: art.dimensions, colorProfile: art.colorProfile,
      unitPrice: price.unitPrice, minQty: price.lastQuantity, previewUrl: art.previewUrl,
    });
    setJustAdded(art.id);
    setTimeout(() => setJustAdded(null), 2500);
  }

  function download(id: string) {
    setBusyId(id);
    setNotice(null);
    startTransition(async () => {
      const err = await downloadArtwork(id);
      setBusyId(null);
      if (err) setNotice(err);
    });
  }

  function downloadAllApproved() {
    const approved = artwork.filter((a) => a.status === 'Approved' && a.storagePath);
    if (approved.length === 0) { setNotice('No approved files have been uploaded yet.'); return; }
    // One download at a time; browsers may ask once to allow multiple downloads
    approved.forEach((a, i) => setTimeout(() => download(a.id), i * 800));
  }

  return (
    <>
      {proofArt && (
        <ProofModal
          art={proofArt}
          canReview={canReview}
          onClose={() => setProofArt(null)}
          onReviewed={(status, comment) => setArtwork((as) => as.map((a) =>
            a.id === proofArt.id ? { ...a, status, reviewComment: comment }
            : status === 'Approved' && a.plateRef === proofArt.plateRef && a.status === 'Approved' ? { ...a, status: 'Superseded' }
            : a))}
        />
      )}
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
              <FolderLock className="w-5 h-5 text-amber-500" />
              <span>Artwork &amp; Proof Vault</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {artwork.length} files · private to your company · all revisions retained
            </p>
          </div>
          <button onClick={downloadAllApproved} className="inline-flex items-center space-x-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3.5 py-2 rounded text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /><span>Download All Approved</span>
          </button>
        </div>

        {canReview && awaiting > 0 && (
          <button
            onClick={() => setFilter('Pending Review')}
            className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left hover:bg-amber-100 transition-colors"
          >
            <ClipboardCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-900">
              <strong>{awaiting} proof{awaiting > 1 ? 's' : ''} awaiting your approval.</strong> Open a proof to approve it or request changes.
            </span>
          </button>
        )}

        {notice && (
          <div className="bg-wall text-blue-50 rounded-lg px-4 py-2.5 text-xs flex justify-between items-center">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white">Dismiss</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artwork name or plate ref…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 text-zinc-800"
            />
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            {(['All', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === s ? 'bg-wall text-brass-light' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-lg py-16 text-center">
            <FolderLock className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h2 className="font-semibold text-zinc-600 text-sm">
              {artwork.length === 0 ? 'Your vault is empty' : 'No artwork matches'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {artwork.length === 0
                ? 'Proofs, plates and print-ready files appear here as soon as our studio uploads them.'
                : 'Try a different search or status filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((art) => {
              const inCart = isInCart(art.id);
              const isJust = justAdded === art.id;
              const price  = prices[art.id];
              return (
                <div key={art.id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <button onClick={() => setProofArt(art)} className="relative h-40 bg-zinc-100 overflow-hidden group text-left" aria-label={`View ${art.name}`}>
                    <ArtworkThumb name={art.name} plateRef={art.plateRef} previewUrl={art.previewUrl} mimeType={art.mimeType} />
                    <span className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 flex items-center justify-center transition-colors">
                      <Eye className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </span>
                    <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${artworkStatusStyles(art.status)}`}>
                      {art.status}
                    </span>
                  </button>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-2">
                      <h2 className="font-bold text-zinc-900 text-sm leading-tight">{art.name}</h2>
                      <p className="accession text-amber-700 text-xs mt-0.5">{art.plateRef} · {art.version}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-sm p-2.5 text-xs space-y-1 mb-3">
                      <div className="flex justify-between gap-2"><span className="text-zinc-500 shrink-0">Dimensions</span><span className="text-zinc-800 font-semibold text-right">{art.dimensions || '—'}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-zinc-500 shrink-0">Substrate</span><span className="text-zinc-800 font-semibold text-right">{art.substrate || '—'}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-zinc-500 shrink-0">Colour</span><span className="text-zinc-800 font-semibold text-right">{art.colorProfile || '—'}</span></div>
                    </div>
                    {art.status === 'Revision Required' && art.reviewComment && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1.5 mb-3 line-clamp-2">“{art.reviewComment}”</p>
                    )}
                    <div className="text-xs text-zinc-500 mb-3 mt-auto">
                      By <span className="text-zinc-600 font-semibold">{art.uploadedBy}</span> · {formatDate(art.uploadedAt)}{art.fileSize ? ` · ${art.fileSize}` : ''}
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
                      <button onClick={() => setProofArt(art)} className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                        art.status === 'Pending Review' && canReview ? 'bg-amber-400 hover:bg-amber-500 text-zinc-950' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}>
                        <Eye className="w-3.5 h-3.5" /><span>{art.status === 'Pending Review' && canReview ? 'Review' : 'View'}</span>
                      </button>
                      <button onClick={() => download(art.id)} disabled={busyId === art.id} className="flex-1 flex items-center justify-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-1.5 rounded text-xs font-semibold transition-colors">
                        {busyId === art.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}<span>Download</span>
                      </button>
                      {art.status === 'Approved' && canOrder && price && (
                        <button
                          onClick={() => handleReorder(art)}
                          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-bold transition-colors ${
                            isJust ? 'bg-emerald-500 text-white' : inCart ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-400 hover:bg-amber-500 text-zinc-950'
                          }`}
                        >
                          {isJust ? <><CheckCircle2 className="w-3.5 h-3.5" /><span>Added!</span></> :
                           inCart ? <><ShoppingCart className="w-3.5 h-3.5" /><span>In Cart</span></> :
                                    <><RefreshCw className="w-3.5 h-3.5" /><span>Reorder</span></>}
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
