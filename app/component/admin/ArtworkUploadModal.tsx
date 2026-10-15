'use client';

import { useState, useTransition } from 'react';
import { Upload, X, AlertCircle, Loader2, FileUp } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { createArtworkRecordAction } from '../../lib/actions';
import type { ArtworkStatus } from '../../lib/types';

const MAX_MB = 50;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.svg,.ai,.eps';
const field = 'w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const label = 'block text-xs font-semibold text-zinc-600 mb-1';

const safeName = (n: string) => n.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-80);

/**
 * Staff: upload a proof / plate / artwork file into the company's private
 * folder (artwork/<companyId>/…) and record it. "Pending Review" sends it to
 * the customer for approval.
 */
export default function ArtworkUploadModal({ companyId, demo = false }: { companyId: string; demo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [plateRef, setPlateRef] = useState('');
  const [version, setVersion] = useState('v1');
  const [dimensions, setDimensions] = useState('');
  const [substrate, setSubstrate] = useState('');
  const [colorProfile, setColorProfile] = useState('');
  const [status, setStatus] = useState<ArtworkStatus>('Pending Review');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setFile(null); setName(''); setPlateRef(''); setVersion('v1');
    setDimensions(''); setSubstrate(''); setColorProfile(''); setStatus('Pending Review');
    setError(null); setDone(false);
  }

  function pick(f: File | null) {
    setError(null);
    if (f && f.size > MAX_MB * 1024 * 1024) { setError(`Files must be under ${MAX_MB} MB.`); return; }
    setFile(f);
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Choose a file to upload.'); return; }
    setError(null);

    startTransition(async () => {
      const storagePath = `${companyId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const mimeType = file.type || 'application/octet-stream';

      if (!demo) {
        const { error: uploadError } = await createClient().storage
          .from('artwork')
          .upload(storagePath, file, { contentType: mimeType, upsert: false });
        if (uploadError) { setError(`Upload failed: ${uploadError.message}`); return; }
      }

      const result = await createArtworkRecordAction({
        companyId, storagePath, fileName: file.name, mimeType, fileSize: file.size,
        name, plateRef, version, dimensions, substrate, colorProfile, status,
      });
      if (!result.success) {
        if (!demo) await createClient().storage.from('artwork').remove([storagePath]); // don't orphan the file
        setError(result.error ?? 'Could not save artwork');
        return;
      }
      setDone(true);
    });
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true); }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-800"
      >
        <Upload className="w-3.5 h-3.5" /> Upload Artwork
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-wall-deep/70" onClick={() => !pending && setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-zinc-900 text-sm">Upload Artwork / Proof</h2>
              <button onClick={() => setOpen(false)} disabled={pending} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="p-10 text-center">
                <FileUp className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-900 mb-1">Uploaded</h3>
                <p className="text-xs text-zinc-500 mb-5">
                  {status === 'Pending Review'
                    ? 'The customer’s approvers have been notified to review this proof.'
                    : 'The file is now in the customer’s vault.'}
                </p>
                <div className="flex justify-center gap-2">
                  <button onClick={reset} className="px-4 py-2 rounded-lg text-xs border border-zinc-200 hover:bg-zinc-50">Upload another</button>
                  <button onClick={() => setOpen(false)} className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="p-6 space-y-4">
                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-6 cursor-pointer transition-colors ${file ? 'border-amber-300 bg-amber-50' : 'border-zinc-300 hover:bg-zinc-50'}`}>
                  <FileUp className="w-6 h-6 text-zinc-400 mb-1" />
                  <span className="text-xs font-semibold text-zinc-700">{file ? file.name : 'Choose a file'}</span>
                  <span className="text-xs text-zinc-400">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `PDF, PNG, JPG, SVG, AI, EPS · up to ${MAX_MB} MB`}</span>
                  <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={label}>Product / Artwork Name *</label>
                    <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
                  </div>
                  <div>
                    <label className={label}>Plate Ref</label>
                    <input value={plateRef} onChange={(e) => setPlateRef(e.target.value)} placeholder="PLT-8812-B" className={`${field} font-mono`} />
                  </div>
                  <div>
                    <label className={label}>Version</label>
                    <input value={version} onChange={(e) => setVersion(e.target.value)} className={`${field} font-mono`} />
                  </div>
                  <div>
                    <label className={label}>Dimensions</label>
                    <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="350 x 250 x 150 mm" className={field} />
                  </div>
                  <div>
                    <label className={label}>Substrate</label>
                    <input value={substrate} onChange={(e) => setSubstrate(e.target.value)} className={field} />
                  </div>
                  <div>
                    <label className={label}>Colour</label>
                    <input value={colorProfile} onChange={(e) => setColorProfile(e.target.value)} placeholder="CMYK + Pantone 123C" className={field} />
                  </div>
                  <div>
                    <label className={label}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as ArtworkStatus)} className={field}>
                      <option value="Pending Review">Needs customer approval</option>
                      <option value="Approved">Already approved</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={pending} className="w-full inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold py-2.5 rounded-lg text-sm">
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {pending ? 'Uploading…' : 'Upload'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
