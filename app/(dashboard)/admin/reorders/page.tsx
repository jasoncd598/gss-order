'use client';

import { useState } from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import { MOCK_ORDERS } from '../../../lib/mockData';
import { formatAUD, formatDate, orderStatusStyles } from '../../../lib/utils';
import type { OrderStatus } from '../../../lib/types';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Production';

interface ReorderRequest {
  id: string;
  orderRef: string;
  company: string;
  productName: string;
  plateRef: string;
  quantity: number;
  unitPrice: number;
  total: number;
  requestedBy: string;
  requestedAt: string;
  poRef?: string;
  notes?: string;
  status: RequestStatus;
}

const MOCK_REQUESTS: ReorderRequest[] = [
  {
    id: 'rr-001',
    orderRef: 'RRQ-2026-0091',
    company: 'Acme Packaging Pty Ltd',
    productName: 'Flexo Printed Poly Mailer Bags (Large)',
    plateRef: 'PLT-5510-A',
    quantity: 10000,
    unitPrice: 0.32,
    total: 3200,
    requestedBy: 'James Wu',
    requestedAt: '2026-10-13',
    poRef: 'PO-ACME-0039',
    status: 'In Production',
  },
  {
    id: 'rr-002',
    orderRef: 'RRQ-2026-0088',
    company: 'BrightBox Retail Solutions',
    productName: 'Custom Corrugated Shipping Box',
    plateRef: 'PLT-8812-B',
    quantity: 5000,
    unitPrice: 1.94,
    total: 9700,
    requestedBy: 'Daniel Park',
    requestedAt: '2026-10-12',
    poRef: 'PO-BB-0021',
    status: 'Pending',
  },
  {
    id: 'rr-003',
    orderRef: 'RRQ-2026-0085',
    company: 'NorthShore Naturals',
    productName: 'Premium Retail Swing Tag',
    plateRef: 'PLT-3301-E',
    quantity: 3000,
    unitPrice: 0.48,
    total: 1440,
    requestedBy: 'Lara Nguyen',
    requestedAt: '2026-10-10',
    notes: 'Please use the new Pantone ref from the updated brief.',
    status: 'Pending',
  },
  {
    id: 'rr-004',
    orderRef: 'RRQ-2026-0081',
    company: 'Acme Packaging Pty Ltd',
    productName: 'Roll Labels – Tamper Evident Security Seal',
    plateRef: 'PLT-1140-D',
    quantity: 13000,
    unitPrice: 0.12,
    total: 1560,
    requestedBy: 'Sarah Jenkins',
    requestedAt: '2026-10-08',
    poRef: 'PO-ACME-0037',
    status: 'Approved',
  },
  {
    id: 'rr-005',
    orderRef: 'RRQ-2026-0074',
    company: 'TradeLink Wholesale Group',
    productName: 'Custom Corrugated Shipping Box',
    plateRef: 'PLT-8812-B',
    quantity: 10000,
    unitPrice: 1.80,
    total: 18000,
    requestedBy: 'Chris Mercer',
    requestedAt: '2026-10-02',
    notes: 'Account suspended — credit limit exceeded.',
    status: 'Rejected',
  },
];

const STATUS_STYLES: Record<RequestStatus, string> = {
  'Pending':      'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Approved':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Production':'bg-blue-50 text-blue-700 border-blue-200',
  'Rejected':     'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICON: Record<RequestStatus, React.ReactNode> = {
  'Pending':       <Clock className="w-3.5 h-3.5" />,
  'Approved':      <CheckCircle2 className="w-3.5 h-3.5" />,
  'In Production': <RefreshCw className="w-3.5 h-3.5" />,
  'Rejected':      <XCircle className="w-3.5 h-3.5" />,
};

export default function AdminReordersPage() {
  const [requests, setRequests] = useState<ReorderRequest[]>(MOCK_REQUESTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestStatus | 'All'>('All');

  function updateStatus(id: string, status: RequestStatus) {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
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

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['All', 'Pending', 'Approved', 'In Production', 'Rejected'] as const).slice(0, 4).map((s) => {
          const count = s === 'All' ? requests.length : requests.filter((r) => r.status === s).length;
          const style = s === 'Pending' ? 'border-yellow-200' : s === 'Rejected' ? 'border-red-200' : 'border-zinc-200';
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`bg-white border rounded-lg p-4 shadow-sm text-left transition-all hover:shadow-md ${style} ${filter === s ? 'ring-2 ring-amber-400' : ''}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{s === 'All' ? 'Total' : s}</div>
              <div className={`text-2xl font-black ${s === 'Pending' ? 'text-yellow-600' : s === 'Rejected' ? 'text-red-600' : 'text-zinc-900'}`}>{count}</div>
            </button>
          );
        })}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {filtered.map((req) => {
          const expanded = expandedId === req.id;
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
                      <span className="font-bold text-zinc-900 text-sm font-mono">{req.orderRef}</span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLES[req.status]}`}>
                        {STATUS_ICON[req.status]}
                        <span className="ml-1">{req.status}</span>
                      </span>
                    </div>
                    <div className="text-xs text-zinc-700 font-medium mt-0.5 truncate">{req.productName}</div>
                    <div className="flex items-center gap-3 flex-wrap mt-1 text-[11px] text-zinc-400 font-mono">
                      <span>{req.company}</span>
                      <span>·</span>
                      <span>{req.plateRef}</span>
                      <span>·</span>
                      <span>{req.quantity.toLocaleString()} units</span>
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
                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Date</span>
                      <span className="font-semibold text-zinc-800">{formatDate(req.requestedAt)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">PO Reference</span>
                      <span className="font-semibold text-zinc-800">{req.poRef ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Unit Price</span>
                      <span className="font-semibold text-emerald-600">{formatAUD(req.unitPrice)} ea</span>
                    </div>
                  </div>
                  {req.notes && (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600">
                      <span className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider block mb-1">Notes</span>
                      {req.notes}
                    </div>
                  )}

                  {/* Action buttons */}
                  {req.status === 'Pending' && (
                    <div className="flex items-center space-x-3 pt-1">
                      <button
                        onClick={() => updateStatus(req.id, 'Approved')}
                        className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve &amp; Schedule</span>
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, 'Rejected')}
                        className="flex items-center space-x-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                  {req.status === 'Approved' && (
                    <div className="flex items-center space-x-3 pt-1">
                      <button
                        onClick={() => updateStatus(req.id, 'In Production')}
                        className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Mark In Production</span>
                      </button>
                    </div>
                  )}
                  {(req.status === 'Approved' || req.status === 'In Production') && (
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Status updated · Notification sent to {req.requestedBy}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
