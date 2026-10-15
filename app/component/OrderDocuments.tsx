'use client';

import { useState, useTransition } from 'react';
import { FolderOpen, Download, Eye, Trash2, Upload, Loader2, AlertCircle, X } from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import { createOrderDocumentAction, deleteOrderDocumentAction, getOrderDocumentUrlAction } from '../lib/actions';
import { DOCUMENT_KINDS, type DocumentKind, type OrderDocument } from '../lib/types';
import { formatDate } from '../lib/utils';

const MAX_MB = 25;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt';
const field = 'w-full border border-zinc-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const safeName = (n: string) => n.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-80);

const KIND_STAMP: Record<DocumentKind, string> = {
  'Delivery docket':        'stamp stamp-green',
  'Compliance certificate': 'stamp stamp-blue',
  'Signed quote':           'stamp stamp-brass',
  'Quote':                  'stamp stamp-ochre',
  'Specification':          'stamp stamp-plum',
  'Other':                  'stamp stamp-grey',
};

function size(bytes: number | null) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const viewable = (mime: string | null) => !!mime && (mime === 'application/pdf' || mime.startsWith('image/'));

/**
 * Files attached to an order: delivery dockets, certificates, signed quotes.
 * Everyone in the company can view and download; GSS staff add and remove.
 * Stored privately in documents/<companyId>/<orderId>/… (migration 010).
 */
export default function OrderDocuments({
  orderId, companyId, documents, isStaff, demo,
}: { orderId: string; companyId: string | undefined; documents: OrderDocument[]; isStaff: boolean; demo: boolean }) {
  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<DocumentKind>('Delivery docket');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pick(f: File | null) {
    setError(null);
    if (f && f.size > MAX_MB * 1024 * 1024) { setError(`Files must be under ${MAX_MB} MB.`); return; }
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
  }

  function close() { setAdding(false); setFile(null); setTitle(''); setKind('Delivery docket'); setError(null); }

  function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Choose a file to upload.'); return; }
    if (!companyId && !demo) { setError('This order has no company.'); return; }
    setError(null);
    start(async () => {
      const storagePath = `${companyId ?? 'demo'}/${orderId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const mimeType = file.type || 'application/octet-stream';
      if (!demo) {
        const { error: upErr } = await createClient().storage.from('documents').upload(storagePath, file, { contentType: mimeType, upsert: false });
        if (upErr) { setError(`Upload failed: ${upErr.message}`); return; }
      }
      const r = await createOrderDocumentAction({ orderId, storagePath, fileName: file.name, mimeType, fileSize: file.size, kind, title });
      if (!r.success) {
        if (!demo) await createClient().storage.from('documents').remove([storagePath]); // don't orphan the file
        setError(r.error ?? 'Could not save the document');
        return;
      }
      close();
      setNotice(demo ? 'Document added (demo — nothing was saved).' : 'Document added. The customer has been notified.');
    });
  }

  async function open(doc: OrderDocument, download: boolean) {
    setNotice(null);
    setBusyId(doc.id);
    const r = await getOrderDocumentUrlAction(doc.id, download);
    setBusyId(null);
    if (!r.success || !r.url) { setNotice(r.error ?? 'Could not open the document'); return; }
    if (download) window.location.assign(r.url);
    else window.open(r.url, '_blank', 'noopener');
  }

  function remove(doc: OrderDocument) {
    if (!confirm(`Remove “${doc.title}” from this order? The customer will no longer see it.`)) return;
    setNotice(null);
    setBusyId(doc.id);
    start(async () => {
      const r = await deleteOrderDocumentAction(doc.id);
      setBusyId(null);
      setNotice(r.success ? (demo ? 'Removed (demo — nothing was changed).' : 'Document removed.') : (r.error ?? 'Could not remove it'));
    });
  }

  return (
    <section aria-labelledby="order-docs" className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <h2 id="order-docs" className="text-xs font-bold uppercase tracking-wider text-zinc-600">Documents</h2>
        </div>
        {isStaff && !adding && (
          <button onClick={() => { setAdding(true); setNotice(null); }} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
            <Upload className="w-3.5 h-3.5" /><span>Add document</span>
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={upload} className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Add a document to this order</h3>
            <button type="button" onClick={close} disabled={pending} className="p-1 rounded hover:bg-zinc-200 text-zinc-500" aria-label="Cancel"><X className="w-4 h-4" /></button>
          </div>
          <label className={`flex items-center gap-3 border-2 border-dashed rounded-sm px-4 py-3 cursor-pointer ${file ? 'border-amber-300 bg-amber-50' : 'border-zinc-300 bg-white hover:bg-zinc-50'}`}>
            <Upload className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-700 truncate">{file ? `${file.name} · ${size(file.size)}` : `Choose a file (PDF, image, Word or Excel, up to ${MAX_MB} MB)`}</span>
            <input type="file" accept={ACCEPT} className="sr-only" aria-label="Document file" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-kind" className="block text-xs font-semibold text-zinc-600 mb-1">Type</label>
              <select id="doc-kind" value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)} className={field}>
                {DOCUMENT_KINDS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="doc-title" className="block text-xs font-semibold text-zinc-600 mb-1">Title</label>
              <input id="doc-title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. StarTrack delivery docket" className={field} />
            </div>
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-700"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">Everyone at the customer&apos;s company can see it, and they&apos;re notified.</p>
            <button type="submit" disabled={pending || !file} className="shrink-0 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-4 py-2 rounded-sm text-xs">
              {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Upload
            </button>
          </div>
        </form>
      )}

      {notice && <p className="px-5 py-2 text-xs text-zinc-700 bg-amber-50 border-b border-amber-100">{notice}</p>}

      {documents.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs text-zinc-500">
          {isStaff ? 'No documents yet. Add delivery dockets, certificates or signed quotes for the customer.' : 'No documents yet. Delivery dockets, certificates and quotes for this order appear here.'}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {documents.map((d) => (
            <li key={d.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={KIND_STAMP[d.kind] ?? 'stamp stamp-grey'}>{d.kind}</span>
                  <span className="text-[13px] font-semibold text-zinc-900 break-words">{d.title}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500 truncate">
                  {[d.fileName, size(d.fileSize), formatDate(d.createdAt)].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {viewable(d.mimeType) && (
                  <button onClick={() => open(d, false)} disabled={busyId === d.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold text-zinc-700 hover:bg-zinc-100" aria-label={`View ${d.title}`}>
                    <Eye className="w-3.5 h-3.5" /><span>View</span>
                  </button>
                )}
                <button onClick={() => open(d, true)} disabled={busyId === d.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold text-zinc-700 hover:bg-zinc-100" aria-label={`Download ${d.title}`}>
                  {busyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}<span>Download</span>
                </button>
                {isStaff && (
                  <button onClick={() => remove(d)} disabled={busyId === d.id} className="p-1.5 rounded-sm text-zinc-400 hover:text-red-600 hover:bg-red-50" aria-label={`Remove ${d.title}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
