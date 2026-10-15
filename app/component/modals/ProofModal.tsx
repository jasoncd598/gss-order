'use client';

import { useEffect, useState, useTransition } from 'react';
import { X, Download, CheckCircle2, MessageSquareWarning, Loader2, AlertCircle } from 'lucide-react';
import ArtworkThumb from '../ArtworkThumb';
import { formatDate, artworkStatusStyles } from '../../lib/utils';
import { getArtworkFileUrlAction, reviewArtworkAction } from '../../lib/actions';
import type { ArtworkStatus } from '../../lib/types';

export interface ProofArtwork {
  id: string;
  name: string;
  plateRef: string;
  version: string;
  status: ArtworkStatus;
  dimensions: string;
  substrate: string;
  colorProfile: string;
  previewUrl: string;
  mimeType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  fileSize?: string;
  reviewComment?: string;
}

/** Fetches a signed URL and starts the browser download. */
export async function downloadArtwork(id: string): Promise<string | null> {
  const result = await getArtworkFileUrlAction(id, true);
  if (!result.success || !result.url) return result.error ?? 'Download failed';
  window.location.assign(result.url);
  return null;
}

export default function ProofModal({
  art,
  canReview,
  onClose,
  onReviewed,
}: {
  art: ProofArtwork;
  canReview: boolean;
  onClose: () => void;
  onReviewed?: (status: ArtworkStatus, comment?: string) => void;
}) {
  const isPdf = art.mimeType === 'application/pdf';
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'changes'>('view');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const awaitingReview = art.status === 'Pending Review';

  // PDFs render inline from a short-lived signed URL
  useEffect(() => {
    if (!isPdf) return;
    let cancelled = false;
    getArtworkFileUrlAction(art.id, false).then((r) => { if (!cancelled && r.url) setPdfUrl(r.url); });
    return () => { cancelled = true; };
  }, [art.id, isPdf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function review(decision: 'Approved' | 'Revision Required') {
    setError(null);
    startTransition(async () => {
      const result = await reviewArtworkAction(art.id, decision, decision === 'Revision Required' ? comment : undefined);
      if (!result.success) { setError(result.error ?? 'Could not save your decision'); return; }
      onReviewed?.(decision, decision === 'Revision Required' ? comment : undefined);
      onClose();
    });
  }

  function download() {
    setError(null);
    startTransition(async () => {
      const err = await downloadArtwork(art.id);
      if (err) setError(err);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={art.name}>
      <div className="absolute inset-0 bg-wall-deep/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-5 py-3.5 border-b border-zinc-100 gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-zinc-900 text-sm truncate">{art.name}</h3>
            <p className="text-amber-600 font-mono text-xs mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{art.plateRef} · {art.version}</span>
              <span className={`px-1.5 py-0.5 rounded border font-sans font-bold text-xs ${artworkStatusStyles(art.status)}`}>{art.status}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-zinc-100 h-[45vh] sm:h-[52vh]">
            {isPdf && pdfUrl ? (
              <iframe src={pdfUrl} title={`${art.name} proof`} className="w-full h-full bg-white" />
            ) : isPdf ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading proof…
              </div>
            ) : (
              <ArtworkThumb name={art.name} plateRef={art.plateRef} previewUrl={art.previewUrl} mimeType={art.mimeType} className="object-contain" />
            )}
          </div>

          <div className="px-5 py-4 bg-zinc-50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {[['Dimensions', art.dimensions], ['Substrate', art.substrate], ['Colour', art.colorProfile]].map(([k, v]) => (
              <div key={k}>
                <span className="text-zinc-400 block text-xs uppercase tracking-wider mb-0.5">{k}</span>
                <span className="font-semibold text-zinc-800">{v || '—'}</span>
              </div>
            ))}
          </div>

          {art.status === 'Revision Required' && art.reviewComment && (
            <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <span className="font-semibold text-xs uppercase tracking-wider block mb-0.5">Changes requested</span>
              {art.reviewComment}
            </div>
          )}

          {awaitingReview && canReview && mode === 'changes' && (
            <div className="px-5 pt-4">
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">What needs to change?</label>
              <textarea
                autoFocus rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Logo needs to be 5 mm larger; use Pantone 123C for the band"
                className="w-full border border-zinc-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
              />
            </div>
          )}

          {error && (
            <div className="mx-5 mt-4 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">
            {[art.uploadedBy, art.uploadedAt && formatDate(art.uploadedAt), art.fileSize].filter(Boolean).join(' · ')}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={download} disabled={pending} className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium px-3 py-2 rounded-lg hover:bg-zinc-100">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            {awaitingReview && canReview && mode === 'view' && (
              <>
                <button onClick={() => setMode('changes')} className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-3 py-2 rounded-lg text-xs">
                  <MessageSquareWarning className="w-3.5 h-3.5" /> Request Changes
                </button>
                <button onClick={() => review('Approved')} disabled={pending} className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-xs">
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve Proof
                </button>
              </>
            )}
            {awaitingReview && canReview && mode === 'changes' && (
              <>
                <button onClick={() => setMode('view')} className="px-3 py-2 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100">Back</button>
                <button onClick={() => review('Revision Required')} disabled={pending || !comment.trim()} className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-xs">
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Send Change Request
                </button>
              </>
            )}
          </div>
        </div>
        {awaitingReview && !canReview && (
          <p className="px-5 pb-3 -mt-1 text-xs text-zinc-400">Only Admins and Procurement Managers can approve proofs.</p>
        )}
      </div>
    </div>
  );
}
