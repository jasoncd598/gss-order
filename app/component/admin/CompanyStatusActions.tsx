'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { setCompanyStatusAction } from '../../lib/actions';

/** Staff controls: approve a pending signup, suspend, or reinstate a company. */
export default function CompanyStatusActions({ companyId, status: initial }: { companyId: string; status: string }) {
  const [status, setStatus] = useState(initial);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await setCompanyStatusAction(companyId, next);
      if (result.success) { setStatus(next); setConfirming(false); }
      else setError(result.error ?? 'Update failed');
    });
  }

  const spinner = pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {status !== 'Active' && (
          <button
            onClick={() => apply('Active')}
            disabled={pending}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold transition-colors"
          >
            {spinner || <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{status === 'Pending' ? 'Approve Account' : 'Reinstate Account'}</span>
          </button>
        )}
        {status === 'Active' && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" /><span>Suspend Account</span>
          </button>
        )}
        {status === 'Active' && confirming && (
          <>
            <span className="text-xs text-zinc-500">Block all ordering for this company?</span>
            <button
              onClick={() => apply('Suspended')}
              disabled={pending}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold"
            >
              {spinner}<span>Suspend</span>
            </button>
            <button onClick={() => setConfirming(false)} className="px-3 py-2 rounded text-xs text-zinc-600 hover:bg-zinc-100">
              Cancel
            </button>
          </>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
