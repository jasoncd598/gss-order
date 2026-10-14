'use client';

import { useState } from 'react';
import { UserPlus, MoreHorizontal, ShieldCheck, Users } from 'lucide-react';
import { MOCK_TEAM } from '../../lib/mockData';
import { formatDate } from '../../lib/utils';
import InviteUserModal from '../../component/modals/InviteUserModal';
import type { UserRole } from '../../lib/types';

const ROLE_COLORS: Record<UserRole, string> = {
  'Admin':                'bg-amber-50 text-amber-700 border-amber-200',
  'Procurement Manager':  'bg-blue-50 text-blue-700 border-blue-200',
  'Finance':              'bg-purple-50 text-purple-700 border-purple-200',
  'Viewer':               'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const STATUS_COLORS = {
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Invited:   'bg-sky-50 text-sky-700 border-sky-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
};

export default function TeamPage() {
  const [showMenu, setShowMenu] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Team &amp; Permissions</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage users under your company account · Acme Packaging Pty Ltd
          </p>
        </div>
        <InviteUserModal />
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(ROLE_COLORS) as [UserRole, string][]).map(([role, style]) => {
          const count = MOCK_TEAM.filter((m) => m.role === role).length;
          return (
            <div key={role} className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
              <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${style}`}>
                {role}
              </div>
              <div className="text-2xl font-black text-zinc-900">{count}</div>
              <div className="text-[10px] text-zinc-400">users</div>
            </div>
          );
        })}
      </div>

      {/* Team Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Team Members</h2>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Login</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {MOCK_TEAM.map((member) => (
              <tr key={member.id} className="hover:bg-zinc-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatarUrl ?? `https://i.pravatar.cc/150?u=${member.id}`}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                    />
                    <div>
                      <div className="font-semibold text-zinc-900">{member.name}</div>
                      <div className="text-zinc-400 text-[10px] font-mono">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_COLORS[member.role]}`}>
                    {member.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[member.status]}`}>
                    {member.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                  {formatDate(member.lastLogin)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setShowMenu(showMenu === member.id ? null : member.id)}
                      className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {showMenu === member.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 w-40 py-1 text-xs">
                        <button className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-700">Edit Role</button>
                        <button className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 text-zinc-700">Resend Invite</button>
                        <button className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600">Suspend Access</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Permission Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-left">Feature</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Procurement</th>
                <th className="py-3 px-4 text-center">Finance</th>
                <th className="py-3 px-4 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-center">
              {[
                ['View Orders', '✅', '✅', '✅', '✅'],
                ['Place / Reorder', '✅', '✅', '❌', '❌'],
                ['View Invoices', '✅', '❌', '✅', '❌'],
                ['Manage Team', '✅', '❌', '❌', '❌'],
                ['Access Vault', '✅', '✅', '✅', '✅'],
                ['Approve Proofs', '✅', '✅', '❌', '❌'],
              ].map(([feature, ...cols]) => (
                <tr key={feature} className="hover:bg-zinc-50">
                  <td className="py-2.5 px-4 text-left font-medium text-zinc-700">{feature}</td>
                  {cols.map((v, i) => (
                    <td key={i} className="py-2.5 px-4 text-base">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
