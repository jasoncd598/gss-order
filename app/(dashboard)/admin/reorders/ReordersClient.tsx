'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, CheckCircle2, XCircle, Clock, ChevronDown, Ban, Loader2, AlertCircle } from 'lucide-react';
import { formatAUD, formatDate } from '../../../lib/utils';
import type { ReorderRequest, ReorderStatus } from '../../../lib/types';
import { approveReorderRequestAction, rejectReorderRequestAction } from '../../../lib/actions';

const STATUS_STYLES: Record<ReorderStatus, string> = {
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  Approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected:  'bg-red-50 text-red-700 border-red-200',
  Cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

const STATUS_ICON: Record<ReorderStatus, React.ReactNode> = {
  Pending:   <Clock className="w-3.5 h-3.5" />,
  Approved:  <CheckCircle2 className="w-3.5 h-3.5" />,
  Rejected:  <XCircle className="w-3.5 h-3.5" />,
  Cancelled: <Ban className="w-3.5 h-3.5" />,
};

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;

export default function ReordersClient({ requests: initial }: { requests: ReorderRequest[] }) {
  // Local copy so demo mode (no DB) still reflects actions; real mode refreshes from the server
  const [requests, setRequests] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(initial.find((r) => r.status === 'Pending')?.id ?? null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Pick up fresh server data after refresh()
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) { setLastInitial(initial); setRequests(initial); }

  function run(id: string, action: () => Promise<{ success: boolean; error?: string }>, status: ReorderStatus, extra?: Partial<ReorderRequest>) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      setPendingId(null);
      if (!result.success) { setError({ id, message: result.error ?? 'Action failed' }); return; }
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status, ...extra } : r)));
      setRejectingId(null);
      setReason('');
    });
  }

  const filtered = filter === 'All' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-zinc-900">Reorder Requests</h1>
          </div>
          <p className="text-xs text-zinc-500">{requests.length} total requests · {pendingCount} awaiting action</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
          STAFF ONLY
        </span>
      </div>

      {/* KPI / filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {FILTERS.map((s) => {
          const count = s === 'All' ? requests.length : requests.filter((r) => r.status === s).length;
          const border = s === 'Pending' ? 'border-yellow-200' : s === 'Rejected' ? 'border-red-200' : 'border-zinc-200';
          const color  = s === 'Pending' ? 'text-yellow-600' : s === 'Rejected' ? 'text-red-600' : 'text-zinc-900';
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`bg-white border rounded-lg p-4 shadow-sm text-left transition-all hover:shadow-md ${border} ${filter === s ? 'ring-2 ring-amber-400' : ''}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{s === 'All' ? 'Total' : s}</div>
              <div className={`text-2xl font-black ${color}`}>{count}</div>
            </button>
          );
        })}
      </div>

      {/* Requests */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-sm text-zinc-400">
          No {filter === 'All' ? '' : filter.toLowerCase() + ' '}reorder requests.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const expanded = expandedId === req.id;
            const busy = pendingId === req.id;
            const first = req.items[0];
            return (
              <div key={req.id} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {/* Row */}
                <button
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-zinc-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : req.id)}
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="hidden sm:flex w-9 h-9 rounded-full bg-amber-50 border border-amber-100 items-center justify-center shrink-0">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 text-sm font-mono">{req.ref}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLES[req.status]}`}>
                          {STATUS_ICON[req.status]}
                          <span className="ml-1">{req.status}</span>
                        </span>
                      </div>
                      <div className="text-xs text-zinc-700 font-medium mt-0.5 truncate">
                        {first?.productName}{req.items.length > 1 ? ` + ${req.items.length - 1} more` : ''}
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-1 text-[11px] text-zinc-400 font-mono">
                        <span>{req.companyName}</span>
                        <span>·</span>
                        <span>{first?.plateRef}</span>
                        <span>·</span>
                        <span>{req.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} units</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ml-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="font-black text-zinc-900 font-mono text-sm">{formatAUD(req.total)}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{formatDate(req.requestedAt)}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-zinc-100 p-4 sm:p-5 bg-zinc-50 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Requested By</span>
                        <span className="font-semibold text-zinc-800">{req.requestedBy}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Repeat Of</span>
                        <Link href={`/order/${req.sourceOrderId}`} className="font-semibold text-amber-700 hover:underline">{req.sourceOrderRef}</Link>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">PO Reference</span>
                        <span className="font-semibold text-zinc-800">{req.poRef ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Total (excl. GST)</span>
                        <span className="font-semibold text-emerald-600">{formatAUD(req.total)}</span>
                      </div>
                    </div>

                    {/* Lines */}
                    <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
                      <table className="w-full min-w-[520px] whitespace-nowrap text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                            <th className="text-left py-2 px-3">Product</th>
                            <th className="text-left py-2 px-3">Plate</th>
                            <th className="text-right py-2 px-3">Qty</th>
                            <th className="text-right py-2 px-3">Unit</th>
                            <th className="text-right py-2 px-3">Line</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 font-mono">
                          {req.items.map((i, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-sans font-medium text-zinc-800">{i.productName}</td>
                              <td className="py-2 px-3 text-amber-700">{i.plateRef}</td>
                              <td className="py-2 px-3 text-right">{i.quantity.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right text-zinc-500">{formatAUD(i.unitPrice)}</td>
                              <td className="py-2 px-3 text-right font-bold">{formatAUD(i.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {req.notes && (
                      <div className="bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600">
                        <span className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider block mb-1">Customer Notes</span>
                        {req.notes}
                      </div>
                    )}
                    {req.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                        <span className="font-semibold text-[10px] uppercase tracking-wider block mb-1">Rejection Reason</span>
                        {req.rejectionReason}
                      </div>
                    )}
                    {req.createdOrderId && (
                      <div className="text-[11px] text-zinc-500">
                        Production order created —{' '}
                        <Link href={`/order/${req.createdOrderId}`} className="font-semibold text-amber-700 hover:underline">view order →</Link>
                      </div>
                    )}

                    {error?.id === req.id && (
                      <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error.message}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {req.status === 'Pending' && rejectingId !== req.id && (
                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        <button
                          disabled={busy}
                          onClick={() => run(req.id, () => approveReorderRequestAction(req.id), 'Approved')}
                          className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Approve &amp; Create Order</span>
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => { setRejectingId(req.id); setReason(''); }}
                          className="flex items-center space-x-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <span className="text-[11px] text-zinc-400">Approving creates an order in production for {req.companyName}.</span>
                      </div>
                    )}
                    {req.status === 'Pending' && rejectingId === req.id && (
                      <form
                        className="space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          run(req.id, () => rejectReorderRequestAction(req.id, reason), 'Rejected', { rejectionReason: reason });
                        }}
                      >
                        <label className="block text-xs font-semibold text-zinc-600">Reason (shown to the customer)</label>
                        <textarea
                          required
                          autoFocus
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Artwork needs updating before reprint"
                          className="w-full border border-zinc-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-red-300 resize-none bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={busy || !reason.trim()}
                            className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-xs"
                          >
                            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Confirm Reject</span>
                          </button>
                          <button type="button" onClick={() => setRejectingId(null)} className="px-4 py-2 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
