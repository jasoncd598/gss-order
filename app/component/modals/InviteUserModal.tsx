'use client';

import { useState } from 'react';
import { UserPlus, X, CheckCircle2, Mail } from 'lucide-react';
import type { UserRole } from '../../lib/types';

const ROLES: UserRole[] = ['Procurement Manager', 'Admin', 'Finance', 'Viewer'];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Admin:                'Full access — manage team, orders, and invoices',
  'Procurement Manager':'Can place and reorder, access vault and orders',
  Finance:              'View orders and invoices, no ordering capability',
  Viewer:               'Read-only access to orders and artwork vault',
};

export default function InviteUserModal() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState<UserRole>('Procurement Manager');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  function handleClose() {
    setOpen(false);
    setTimeout(() => { setDone(false); setEmail(''); setName(''); }, 400);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 px-4 py-2 rounded text-xs font-bold transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Invite Team Member</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <div className="bg-zinc-900 text-amber-400 p-1.5 rounded">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-bold text-zinc-900 text-sm">Invite Team Member</h2>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!done ? (
              <form
                className="p-6 space-y-4"
                onSubmit={(e) => { e.preventDefault(); setDone(true); }}
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full border border-zinc-300 rounded px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      required
                      type="email"
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

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Invitation</span>
                </button>
              </form>
            ) : (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-bold text-zinc-900 text-base mb-1">Invitation Sent!</h3>
                <p className="text-zinc-500 text-xs mb-1">
                  An email has been sent to <strong>{email}</strong>.
                </p>
                <p className="text-zinc-400 text-[11px] mb-5">
                  They'll be prompted to create a password when they first sign in.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors"
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
