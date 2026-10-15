'use client';

import { useState, useTransition } from 'react';
import { ShieldCheck, Users, Mail, Copy, Check, X, Loader2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import InviteUserModal from '../../component/modals/InviteUserModal';
import { updateTeamMemberAction, revokeInvitationAction } from '../../lib/actions';
import type { Invitation, TeamMember, UserRole } from '../../lib/types';

const ROLES: UserRole[] = ['Admin', 'Procurement Manager', 'Finance', 'Viewer'];

const ROLE_COLORS: Record<UserRole, string> = {
  'Admin':               'bg-amber-50 text-amber-700 border-amber-200',
  'Procurement Manager': 'bg-blue-50 text-blue-700 border-blue-200',
  'Finance':             'bg-purple-50 text-purple-700 border-purple-200',
  'Viewer':              'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const STATUS_COLORS: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Invited:   'bg-sky-50 text-sky-700 border-sky-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
};

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export default function TeamClient({
  members: initialMembers,
  invitations: initialInvites,
  companyName,
  currentUserId,
  canManage,
}: {
  members: TeamMember[];
  invitations: Invitation[];
  companyName: string;
  currentUserId: string;
  canManage: boolean;
}) {
  // Local copies so changes show instantly (and work in demo mode); refresh() resyncs
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [synced, setSynced] = useState({ initialMembers, initialInvites });
  if (synced.initialMembers !== initialMembers || synced.initialInvites !== initialInvites) {
    setSynced({ initialMembers, initialInvites });
    setMembers(initialMembers);
    setInvites(initialInvites);
  }

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function updateMember(id: string, changes: { role?: UserRole; status?: 'Active' | 'Suspended' }) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await updateTeamMemberAction(id, changes);
      setBusyId(null);
      if (result.success) setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...changes } : m)));
      else setError(result.error ?? 'Update failed');
    });
  }

  function revoke(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await revokeInvitationAction(id);
      setBusyId(null);
      if (result.success) setInvites((is) => is.filter((i) => i.id !== id));
      else setError(result.error ?? 'Could not revoke invitation');
    });
  }

  async function copyLink(inv: Invitation) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/registration?invite=${inv.token}`);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Clipboard unavailable — open the invite again to copy the link.');
    }
  }

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
            Manage users under your company account · {companyName}
          </p>
        </div>
        {canManage && <InviteUserModal />}
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((role) => {
          const count = members.filter((m) => m.role === role && m.status !== 'Suspended').length;
          return (
            <div key={role} className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border mb-1 ${ROLE_COLORS[role]}`}>{role}</div>
              <div className="text-2xl font-black text-zinc-900">{count}</div>
              <div className="text-xs text-zinc-400">active users</div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Team table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Team Members</h2>
        </div>
        {members.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No team members yet.{canManage && ' Invite someone to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  {canManage && <th className="py-3 px-4 text-right">Access</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((member) => {
                  const isSelf = member.id === currentUserId;
                  const editable = canManage && !isSelf;
                  const busy = busyId === member.id;
                  return (
                    <tr key={member.id} className={`transition-colors ${member.status === 'Suspended' ? 'bg-zinc-50/70 text-zinc-400' : 'hover:bg-zinc-50'}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-wall text-brass-light text-xs font-bold flex items-center justify-center shrink-0">
                            {initials(member.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900">
                              {member.name}{isSelf && <span className="ml-1.5 text-xs text-zinc-400 font-normal">(you)</span>}
                            </div>
                            <div className="text-zinc-400 text-xs font-mono">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {editable ? (
                          <select
                            value={member.role}
                            disabled={busy || member.status === 'Suspended'}
                            onChange={(e) => updateMember(member.id, { role: e.target.value as UserRole })}
                            aria-label={`Role for ${member.name}`}
                            className={`px-2 py-1 rounded text-xs font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 ${ROLE_COLORS[member.role]}`}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ROLE_COLORS[member.role] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_COLORS[member.status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-xs">{formatDate(member.lastLogin)}</td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 inline" />
                          ) : !editable ? null : member.status === 'Suspended' ? (
                            <button onClick={() => updateMember(member.id, { status: 'Active' })} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">
                              Reactivate
                            </button>
                          ) : member.status === 'Active' ? (
                            <button onClick={() => updateMember(member.id, { status: 'Suspended' })} className="text-xs font-semibold text-zinc-500 hover:text-red-600">
                              Deactivate
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {canManage && invites.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Pending Invitations</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {invites.map((inv) => (
              <li key={inv.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-900 font-mono truncate">{inv.email}</div>
                  <div className="text-xs text-zinc-400">{inv.role} · expires {formatDate(inv.expiresAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => copyLink(inv)} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900">
                    {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === inv.id ? 'Copied' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => revoke(inv.id)}
                    disabled={busyId === inv.id}
                    className="text-xs font-semibold text-zinc-500 hover:text-red-600"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Permission matrix */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Permission Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-xs tracking-wider">
                <th className="py-3 px-4 text-left">Feature</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Procurement</th>
                <th className="py-3 px-4 text-center">Finance</th>
                <th className="py-3 px-4 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-center">
              {[
                ['View orders & artwork', '✅', '✅', '✅', '✅'],
                ['Place orders / reorder', '✅', '✅', '❌', '❌'],
                ['Approve proofs',         '✅', '✅', '❌', '❌'],
                ['Invite & manage team',   '✅', '❌', '❌', '❌'],
              ].map(([feature, ...cols]) => (
                <tr key={feature} className="hover:bg-zinc-50">
                  <td className="py-2.5 px-4 text-left font-medium text-zinc-700">{feature}</td>
                  {cols.map((v, i) => <td key={i} className="py-2.5 px-4 text-base">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
