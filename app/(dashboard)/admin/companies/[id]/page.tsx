export const instant = false;

import Link from 'next/link';
import { ArrowLeft, Building2, DollarSign, Package, Users, FolderLock } from 'lucide-react';
import { createClient } from '../../../../lib/supabase/server';
import {
  getCompanyById,
  getOrdersByCompanyAdmin,
  getUsersByCompany,
  getArtworkByCompany,
} from '../../../../lib/db';
import { isDemoMode } from '../../../../lib/demo';
import { artworkStatusStyles } from '../../../../lib/utils';
import CompanyFormModal from '../../../../component/admin/CompanyFormModal';
import ArtworkUploadModal from '../../../../component/admin/ArtworkUploadModal';
import InviteUserModal from '../../../../component/modals/InviteUserModal';
import ArtworkThumb from '../../../../component/ArtworkThumb';
import { formatAUD, formatDate, orderStatusStyles } from '../../../../lib/utils';
import { redirect } from 'next/navigation';
import CompanyStatusActions from '../../../../component/admin/CompanyStatusActions';

const STATUS_COLORS: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [company, orders, users, artwork] = await Promise.all([
    getCompanyById(supabase, id),
    getOrdersByCompanyAdmin(supabase, id),
    getUsersByCompany(supabase, id),
    getArtworkByCompany(supabase, id),
  ]);

  if (!company) redirect('/admin/companies');

  const utilizationPct = company.credit_limit > 0
    ? (company.current_owing / company.credit_limit) * 100
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/companies" className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Companies</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-zinc-200">
        <div className="flex items-start space-x-3">
          <div className="bg-zinc-900 text-amber-400 p-2.5 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-0.5">
              <h1 className="text-xl font-bold text-zinc-900">{company.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[company.status] ?? ''}`}>
                {company.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              {company.abn ? `ABN: ${company.abn} · ` : ''}{company.industry ?? ''}
            </p>
            <p className="text-xs text-zinc-500">Member since {formatDate(company.created_at)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <CompanyFormModal company={company} />
          <CompanyStatusActions companyId={company.id} status={company.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Contact Details</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Phone',   value: company.contact_phone },
                { label: 'Address', value: company.address },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <span className="text-zinc-400 block text-[10px]">{label}</span>
                  <span className="font-semibold text-zinc-800">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Financial Standing</h3>
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Payment Terms</span>
                <span className="font-bold text-zinc-800">{company.payment_terms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Credit Limit</span>
                <span className="font-bold text-zinc-800">{formatAUD(company.credit_limit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Outstanding</span>
                <span className={`font-bold ${utilizationPct >= 100 ? 'text-red-600' : 'text-zinc-800'}`}>
                  {formatAUD(company.current_owing)}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Utilisation</span>
                  <span className={`font-bold ${utilizationPct >= 100 ? 'text-red-600' : 'text-zinc-600'}`}>
                    {Math.round(utilizationPct)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full">
                  <div
                    className={`h-2 rounded-full ${utilizationPct >= 100 ? 'bg-red-500' : utilizationPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-100">
                <span className="text-zinc-400">YTD Spend</span>
                <span className="font-bold text-zinc-900">{formatAUD(company.total_spend)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="md:col-span-2 space-y-4">
          {/* Recent Orders */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2">
              <Package className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Recent Orders</h3>
            </div>
            {orders.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] whitespace-nowrap text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4 text-left">Ref</th>
                    <th className="py-2.5 px-4 text-left">Product</th>
                    <th className="py-2.5 px-4 text-left">Date</th>
                    <th className="py-2.5 px-4 text-left">Status</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 text-[11px]">
                        <Link href={`/order/${order.id}`} className="hover:text-amber-700 hover:underline">{order.ref}</Link>
                      </td>
                      <td className="py-3 px-4 text-zinc-700 max-w-[160px] truncate">{order.items[0]?.productName ?? '—'}</td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">{formatDate(order.date)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${orderStatusStyles(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-zinc-900 text-[11px]">
                        {formatAUD(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Users */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Portal Users</h3>
              </div>
              <InviteUserModal variant="link" companyId={company.id} companyName={company.name} />
            </div>
            {users.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">No users yet.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {users.map((member) => (
                  <div key={member.id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 text-amber-400 text-[10px] font-bold flex items-center justify-center">
                        {member.name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 text-xs">{member.name}</div>
                        <div className="text-zinc-400 text-[10px] font-mono">{member.email || '—'}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${member.status === 'Suspended' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                      {member.status === 'Suspended' ? 'Deactivated' : member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Artwork */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderLock className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Artwork &amp; Proofs</h3>
                <span className="text-[10px] text-zinc-400">{artwork.length} files</span>
              </div>
              <ArtworkUploadModal companyId={company.id} demo={isDemoMode} />
            </div>
            {artwork.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">No artwork uploaded yet.</div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {artwork.map((a) => (
                  <li key={a.id} className="px-5 py-2.5 flex items-center gap-3 text-xs">
                    <div className="w-12 h-9 rounded overflow-hidden border border-zinc-200 shrink-0">
                      <ArtworkThumb name={a.name} previewUrl={a.previewUrl} mimeType={a.mimeType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-zinc-900 truncate">{a.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {a.plateRef} · {a.version} · {formatDate(a.uploadedAt)}
                        {a.reviewComment && <span className="text-red-600 font-sans"> · “{a.reviewComment}”</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${artworkStatusStyles(a.status)}`}>{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
