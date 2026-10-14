// Opt out of static prerendering — params is runtime data in Next.js 16
export const instant = false;

import Link from 'next/link';
import { ArrowLeft, Building2, DollarSign, Package, Users, AlertTriangle } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_ORDERS, MOCK_TEAM } from '../../../../lib/mockData';
import { formatAUD, formatDate, orderStatusStyles } from '../../../../lib/utils';
import type { Company } from '../../../../lib/types';

// In Next.js 16, params is a Promise — must be awaited
export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = MOCK_COMPANIES.find((c) => c.id === id) ?? MOCK_COMPANIES[0];
  const utilizationPct = company.creditLimit > 0 ? (company.currentOwing / company.creditLimit) * 100 : 0;

  const STATUS_COLORS: Record<Company['status'], string> = {
    Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    Suspended: 'bg-red-50 text-red-700 border-red-200',
    Pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/admin/companies"
        className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Companies</span>
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
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[company.status]}`}>
                {company.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">ABN: {company.abn} · {company.industry}</p>
            <p className="text-xs text-zinc-500">Member since {formatDate(company.memberSince)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {company.status === 'Suspended' && (
            <button className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold transition-colors">
              Reinstate Account
            </button>
          )}
          {company.status === 'Active' && (
            <button className="inline-flex items-center space-x-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded text-xs font-semibold transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspend Account</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Contact Details</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px]">Primary Contact</span>
                <span className="font-semibold text-zinc-800">{company.contactName}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Email</span>
                <span className="text-indigo-600 font-medium">{company.contactEmail}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Phone</span>
                <span className="font-semibold text-zinc-800 font-mono">{company.contactPhone}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Address</span>
                <span className="font-semibold text-zinc-800">{company.address}</span>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Financial Standing</h3>
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Payment Terms</span>
                <span className="font-bold text-zinc-800">{company.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Credit Limit</span>
                <span className="font-bold text-zinc-800">{formatAUD(company.creditLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Outstanding</span>
                <span className={`font-bold ${utilizationPct >= 100 ? 'text-red-600' : 'text-zinc-800'}`}>
                  {formatAUD(company.currentOwing)}
                </span>
              </div>
              {/* Credit bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-zinc-400">Credit Utilisation</span>
                  <span className={`font-bold ${utilizationPct >= 100 ? 'text-red-600' : 'text-zinc-600'}`}>
                    {Math.round(utilizationPct)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full">
                  <div
                    className={`h-2 rounded-full transition-all ${utilizationPct >= 100 ? 'bg-red-500' : utilizationPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-100">
                <span className="text-zinc-400">YTD Spend</span>
                <span className="font-bold text-zinc-900">{formatAUD(company.totalSpend)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-4">
          {/* Recent Orders */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2">
              <Package className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Recent Orders</h3>
            </div>
            <table className="w-full text-xs">
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
                {MOCK_ORDERS.slice(0, 4).map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 text-[11px]">{order.ref}</td>
                    <td className="py-3 px-4 text-zinc-700 max-w-[160px] truncate">{order.items[0]?.productName}</td>
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

          {/* Users */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Portal Users</h3>
              </div>
              <button className="text-[11px] font-semibold text-amber-600 hover:text-amber-800">+ Add User</button>
            </div>
            <div className="divide-y divide-zinc-100">
              {MOCK_TEAM.slice(0, 3).map((member) => (
                <div key={member.id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50">
                  <div className="flex items-center space-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatarUrl ?? `https://i.pravatar.cc/150?u=${member.id}`}
                      alt={member.name}
                      className="w-7 h-7 rounded-full object-cover border border-zinc-200"
                    />
                    <div>
                      <div className="font-semibold text-zinc-900 text-xs">{member.name}</div>
                      <div className="text-zinc-400 text-[10px] font-mono">{member.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
