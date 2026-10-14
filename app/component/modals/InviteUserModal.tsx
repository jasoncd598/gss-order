'use client';

import { useState, useTransition } from 'react';
import { UserPlus, X, CheckCircle2, Mail, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { UserRole } from '../../lib/types';
import { createInvitationAction } from '../../lib/actions';

const ROLES: UserRole[] = ['Procurement Manager', 'Admin', 'Finance', 'Viewer'];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Admin:                'Full access — manage team, orders, and proofs',
  'Procurement Manager':'Can place orders and reorders, approve proofs',
  Finance:              'View orders and invoices, no ordering capability',
  Viewer:               'Read-only access to orders and artwork vault',
};

/**
 * Creates an invitation and shows the sign-up link to share. The link only
 * works for the invited email address and expires after 14 days.
 * Staff pass `companyId` to invite into any company.
 */
export default function InviteUserModal({
  companyId,
  companyName,
  variant = 'primary',
}: {
  companyId?: string;
  companyName?: string;
  variant?: 'primary' | 'link';
}) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('Procurement Manager');
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();

  function handleClose() {
    setOpen(false);
    setTimeout(() => { setLink(null); setEmailed(false); setEmail(''); setError(null); setCopied(false); }, 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createInvitationAction(email, role, companyId);
      if (result.success && result.link) { setLink(result.link); setEmailed(!!result.emailed); }
      else setError(result.error ?? 'Could not create invitation');
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the link is selectable in the input
    }
  }

  return (
    <>
      {variant === 'primary' ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 px-4 py-2 rounded text-xs font-bold transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Team Member</span>
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="text-[11px] font-semibold text-amber-600 hover:text-amber-800">
          + Add User
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <div className="bg-zinc-900 text-amber-400 p-1.5 rounded">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-sm">Invite Team Member</h2>
                  {companyName && <p className="text-[11px] text-zinc-400">{companyName}</p>}
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!link ? (
              <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      required
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com.au"
                      className="w-full border border-zinc-300 rounded pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-2">Assign Role</label>
                  <div className="space-y-2">
                    {ROLES.map((r) => (
                      <label
                        key={r}
                        className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          role === r ? 'border-amber-400 bg-amber-50' : 'border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r}
                          checked={role === r}
                          onChange={() => setRole(r)}
                          className="mt-0.5 text-amber-400"
                        />
                        <div>
                          <div className="font-semibold text-zinc-900 text-xs">{r}</div>
                          <div className="text-zinc-400 text-[10px]">{ROLE_DESCRIPTIONS[r]}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{pending ? 'Creating…' : 'Create Invitation'}</span>
                </button>
              </form>
            ) : (
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-base mb-1">Invitation created</h3>
                  <p className="text-zinc-500 text-xs">
                    {emailed ? 'We’ve emailed this link to' : 'Send this link to'} <strong>{email}</strong>. They&apos;ll join as <strong>{role}</strong> when they sign up with that address.
                  </p>
                </div>
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 border border-zinc-300 rounded px-3 py-2 text-[11px] font-mono text-zinc-700 bg-zinc-50"
                    aria-label="Invitation link"
                  />
                  <button
                    onClick={copy}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 px-3 rounded text-xs font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">Expires in 14 days. You can revoke it from the Team page.</p>
                <button
                  onClick={handleClose}
                  className="mt-5 w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2 rounded-lg text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
