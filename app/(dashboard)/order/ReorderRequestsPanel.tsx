'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { RefreshCw, Loader2 } from 'lucide-react';
import { formatAUD, formatDate } from '../../lib/utils';
import type { ReorderRequest, ReorderStatus } from '../../lib/types';
import { cancelReorderRequestAction } from '../../lib/actions';

const STATUS_STYLES: Record<ReorderStatus, string> = {
  Pending:   'stamp stamp-ochre',
  Approved:  'stamp stamp-green',
  Rejected:  'stamp stamp-red',
  Cancelled: 'stamp stamp-grey',
};

const STATUS_LABEL: Record<ReorderStatus, string> = {
  Pending:   'Awaiting review',
  Approved:  'Approved',
  Rejected:  'Declined',
  Cancelled: 'Cancelled',
};

/** Customer view of their company's reorder requests (most recent first). */
export default function ReorderRequestsPanel({ requests: initial }: { requests: ReorderRequest[] }) {
  const [requests, setRequests] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) { setLastInitial(initial); setRequests(initial); }

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (requests.length === 0) return null;

  function cancel(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await cancelReorderRequestAction(id);
      setBusyId(null);
      if (result.success) setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'Cancelled' } : r)));
      else setError(result.error ?? 'Could not cancel request');
    });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 text-amber-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Reorder Requests</h2>
        <span className="text-xs text-zinc-400">
          {requests.filter((r) => r.status === 'Pending').length} awaiting review
        </span>
      </div>
      {error && <div className="px-5 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">{error}</div>}
      <ul className="divide-y divide-zinc-100">
        {requests.slice(0, 5).map((r) => (
          <li key={r.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-2 sm:w-56 shrink-0">
              <span className="font-mono font-bold text-zinc-900">{r.ref}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_STYLES[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-zinc-800 font-medium truncate">
                {r.items[0]?.productName}{r.items.length > 1 ? ` + ${r.items.length - 1} more` : ''}
              </div>
              <div className="text-xs text-zinc-400">
                Repeat of {r.sourceOrderRef} · {formatDate(r.requestedAt)} · {r.requestedBy}
                {r.rejectionReason && <span className="text-red-600"> · {r.rejectionReason}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <span className="font-mono font-bold text-zinc-900">{formatAUD(r.total)}</span>
              {r.status === 'Approved' && r.createdOrderId && (
                <Link href={`/order/${r.createdOrderId}`} className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline">
                  Track order
                </Link>
              )}
              {r.status === 'Pending' && (
                <button
                  onClick={() => cancel(r.id)}
                  disabled={busyId === r.id}
                  className="text-xs font-semibold text-zinc-500 hover:text-red-600 inline-flex items-center gap-1"
                >
                  {busyId === r.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  Cancel
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
