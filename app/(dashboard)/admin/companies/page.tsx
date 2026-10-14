import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Companies | GSS Admin' };

import Link from 'next/link';
import { Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MOCK_COMPANIES } from '../../../lib/mockData';
import { formatAUD } from '../../../lib/utils';
import type { Company } from '../../../lib/types';

const STATUS_COLORS: Record<Company['status'], string> = {
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
  Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-zinc-900">Internal Admin — Companies</h1>
          </div>
          <p className="text-xs text-zinc-500">{MOCK_COMPANIES.length} registered company accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
            STAFF ONLY
          </span>
          <button className="inline-flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 px-3.5 py-2 rounded text-xs font-bold transition-colors">
            <Building2 className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Companies',    value: MOCK_COMPANIES.length.toString(),                                                                          sub: 'All time' },
          { label: 'Active Accounts',    value: MOCK_COMPANIES.filter((c: Company) => c.status === 'Active').length.toString(),                            sub: 'Good standing' },
          { label: 'Total Outstanding',  value: formatAUD(MOCK_COMPANIES.reduce((s: number, c: Company) => s + c.currentOwing, 0)),                        sub: 'Across all accounts' },
          { label: 'Suspended',          value: MOCK_COMPANIES.filter((c: Company) => c.status === 'Suspended').length.toString(),                         sub: 'Requires attention', warn: true },
        ].map((k) => (
          <div key={k.label} className={`bg-white border rounded-lg p-4 shadow-sm ${k.warn ? 'border-red-200' : 'border-zinc-200'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{k.label}</span>
              {k.warn && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
            </div>
            <div className={`text-2xl font-black ${k.warn ? 'text-red-600' : 'text-zinc-900'}`}>{k.value}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Companies Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">ABN</th>
              <th className="py-3 px-4">Terms</th>
              <th className="py-3 px-4 text-right">Credit Limit</th>
              <th className="py-3 px-4 text-right">Outstanding</th>
              <th className="py-3 px-4 text-right">YTD Spend</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {MOCK_COMPANIES.map((co: Company) => {
              const utilizationPct = co.creditLimit > 0 ? (co.currentOwing / co.creditLimit) * 100 : 0;
              const isOverLimit = utilizationPct >= 100;
              return (
                <tr key={co.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900">{co.name}</div>
                    <div className="text-zinc-400 text-[10px] font-mono">{co.industry}</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{co.abn}</td>
                  <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px]">{co.paymentTerms}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-700">{formatAUD(co.creditLimit)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className={`font-bold font-mono text-[11px] ${isOverLimit ? 'text-red-600' : 'text-zinc-900'}`}>
                      {formatAUD(co.currentOwing)}
                    </div>
                    <div className="w-16 h-1 bg-zinc-100 rounded-full mt-1 ml-auto">
                      <div
                        className={`h-1 rounded-full ${isOverLimit ? 'bg-red-500' : utilizationPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-zinc-900 font-mono text-[11px]">
                    {formatAUD(co.totalSpend)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[co.status]}`}>
                      {co.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/companies/${co.id}`}
                      className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
