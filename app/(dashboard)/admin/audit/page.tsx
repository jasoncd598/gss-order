import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Audit log | GSS Admin' };

import Link from 'next/link';
import { ShieldCheck, History } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getAuditLog, type AuditArea, type AuditEntry } from '../../../lib/db';

const AREAS: { id: AuditArea; label: string; one: string }[] = [
  { id: 'orders',              label: 'Orders',      one: 'Order' },
  { id: 'product_prices',      label: 'Prices',      one: 'Price' },
  { id: 'companies',           label: 'Companies',   one: 'Company' },
  { id: 'profiles',            label: 'Users',       one: 'User' },
  { id: 'artwork_files',       label: 'Artwork',     one: 'Artwork' },
  { id: 'company_invitations', label: 'Invitations', one: 'Invitation' },
  { id: 'order_documents',     label: 'Documents',   one: 'Document' },
];
const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.id, a.one])) as Record<AuditArea, string>;

const FIELD: Record<string, string> = {
  status: 'Status', payment_status: 'Payment', amount_paid: 'Amount paid', courier: 'Courier',
  tracking_number: 'Tracking', estimated_delivery: 'Est. delivery', plate_ref: 'Plate', product_name: 'Product',
  sku_id: 'SKU', unit_price: 'Unit price', min_quantity: 'Min. qty', name: 'Name', payment_terms: 'Terms',
  credit_limit: 'Credit limit', abn: 'ABN', role: 'Role', is_staff: 'GSS staff', company_id: 'Company',
  review_comment: 'Comment', email: 'Email', kind: 'Type', title: 'Title', file_name: 'File', order_id: 'Order',
};

const ACTION: Record<AuditEntry['action'], string> = { insert: 'Added', update: 'Changed', delete: 'Removed' };
const ACTION_STAMP: Record<AuditEntry['action'], string> = { insert: 'stamp stamp-green', update: 'stamp stamp-blue', delete: 'stamp stamp-red' };

function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function when(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney',
  });
}

function Changes({ e }: { e: AuditEntry }) {
  return (
    <ul className="space-y-0.5">
      {Object.entries(e.changes).filter(([k]) => k !== 'order_id').map(([k, v]) => {
        const diff = e.action === 'update' && v !== null && typeof v === 'object' && 'to' in v ? (v as { from: unknown; to: unknown }) : null;
        return (
          <li key={k} className="text-xs text-zinc-700">
            <span className="text-zinc-500">{FIELD[k] ?? k}:</span>{' '}
            {diff ? (
              <><span className="line-through decoration-zinc-400 text-zinc-500">{show(diff.from)}</span> → <span className="font-semibold text-zinc-950">{show(diff.to)}</span></>
            ) : (
              <span className="font-semibold text-zinc-950">{show(v)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Subject({ e }: { e: AuditEntry }) {
  const label = e.label ?? '—';
  const isRef = e.area === 'product_prices' || e.area === 'artwork_files';
  return (
    <div>
      <div className="text-xs text-zinc-500">{AREA_LABEL[e.area]}</div>
      {e.area === 'orders' && e.recordId ? (
        <Link href={`/order/${e.recordId}`} className="accession font-bold text-zinc-950 hover:text-amber-700">{label}</Link>
      ) : e.area === 'order_documents' && typeof e.changes.order_id === 'string' ? (
        <Link href={`/order/${e.changes.order_id}`} className="font-semibold text-zinc-950 hover:text-amber-700">{label}</Link>
      ) : (
        <div className={`font-semibold ${isRef ? 'accession text-amber-700' : 'text-zinc-950'}`}>{label}</div>
      )}
      {e.companyName && e.area !== 'companies' && e.companyId && (
        <Link href={`/admin/companies/${e.companyId}`} className="block text-xs text-zinc-600 hover:text-amber-700">{e.companyName}</Link>
      )}
    </div>
  );
}

function Who({ e }: { e: AuditEntry }) {
  if (e.actorKind === 'system') return <span className="text-zinc-600">System <span className="text-zinc-500">(payment or server)</span></span>;
  return <span className="text-zinc-800 break-all">{e.actorEmail ?? 'Unknown user'}</span>;
}

/** Staff: who changed what — prices, statuses, approvals, roles. Append-only (migration 009). */
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area: areaParam } = await searchParams;
  const area = AREAS.find((a) => a.id === areaParam)?.id;
  const supabase = await createClient();
  const entries = await getAuditLog(supabase, area);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-sm text-xs font-semibold border ${active ? 'bg-wall text-label border-wall' : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500'}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-zinc-200">
        <div className="flex items-center space-x-2 mb-0.5">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-zinc-900">Admin — Audit Log</h1>
        </div>
        <p className="text-xs text-zinc-500">Who changed what, and when. The database records each entry; nobody can edit or delete them.</p>
      </div>

      <nav aria-label="Filter by area" className="flex flex-wrap gap-2">
        <Link href="/admin/audit" className={chip(!area)}>Everything</Link>
        {AREAS.map((a) => (
          <Link key={a.id} href={`/admin/audit?area=${a.id}`} className={chip(area === a.id)}>{a.label}</Link>
        ))}
      </nav>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2 bg-zinc-50">
          <History className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Latest {entries.length} changes</h2>
        </div>
        {entries.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">No changes recorded yet. Price edits, status changes, approvals and role changes appear here.</div>
        ) : (
          <>
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-500 font-semibold uppercase text-xs tracking-wider bg-zinc-50/50">
                    <th className="py-3 px-4 whitespace-nowrap">When</th>
                    <th className="py-3 px-4">Who</th>
                    <th className="py-3 px-4">What</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 align-top">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600">{when(e.at)}</td>
                      <td className="py-3.5 px-4 max-w-[220px]"><Who e={e} /></td>
                      <td className="py-3.5 px-4"><Subject e={e} /></td>
                      <td className="py-3.5 px-4"><span className={ACTION_STAMP[e.action]}>{ACTION[e.action]}</span></td>
                      <td className="py-3.5 px-4"><Changes e={e} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones: each entry as a stacked record */}
            <ul className="xl:hidden divide-y divide-zinc-200">
              {entries.map((e) => (
                <li key={e.id} className="px-4 py-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <Subject e={e} />
                    <span className={ACTION_STAMP[e.action]}>{ACTION[e.action]}</span>
                  </div>
                  <Changes e={e} />
                  <div className="text-xs text-zinc-500">{when(e.at)} · <Who e={e} /></div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
