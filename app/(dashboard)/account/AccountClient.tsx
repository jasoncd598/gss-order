'use client';

import { useState, useTransition } from 'react';
import { UserCheck, Lock, CheckCircle2, Eye, EyeOff, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { useUser } from '../../lib/userContext';
import { updateProfileAction } from '../../lib/actions';
import { createClient } from '../../lib/supabase/client';

type Tab = 'profile' | 'security';

const input = 'w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const label = 'block text-xs font-semibold text-zinc-600 mb-1.5';

function Status({ ok, error }: { ok?: string | null; error?: string | null }) {
  if (error) return <span className="flex items-center gap-1.5 text-red-600 text-xs font-semibold"><AlertCircle className="w-4 h-4" />{error}</span>;
  if (ok) return <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" />{ok}</span>;
  return null;
}

export default function AccountClient({ demo }: { demo: boolean }) {
  const { displayName, firstName, lastName, email, role, companyName } = useUser();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [profileMsg, setProfileMsg] = useState<{ ok?: string; error?: string }>({});
  const [savingProfile, startProfile] = useTransition();

  // Password
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok?: string; error?: string }>({});
  const [savingPw, startPw] = useTransition();

  const [sessionsMsg, setSessionsMsg] = useState<{ ok?: string; error?: string }>({});
  const [signingOut, startSignOut] = useTransition();

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg({});
    startProfile(async () => {
      const r = await updateProfileAction(first, last);
      setProfileMsg(r.success ? { ok: 'Changes saved' } : { error: r.error });
    });
  }

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg({});
    if (next.length < 8) { setPwMsg({ error: 'Use at least 8 characters' }); return; }
    if (next !== confirm) { setPwMsg({ error: 'New passwords do not match' }); return; }
    if (demo) { setPwMsg({ ok: 'Password updated (demo)' }); return; }

    startPw(async () => {
      const supabase = createClient();
      // Re-authenticate so a borrowed, unlocked session can't change the password
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (authError) { setPwMsg({ error: 'Current password is incorrect' }); return; }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) { setPwMsg({ error: error.message }); return; }
      setCurrent(''); setNext(''); setConfirm('');
      setPwMsg({ ok: 'Password updated' });
    });
  }

  function signOutOthers() {
    setSessionsMsg({});
    if (demo) { setSessionsMsg({ ok: 'Other devices signed out (demo)' }); return; }
    startSignOut(async () => {
      const { error } = await createClient().auth.signOut({ scope: 'others' });
      setSessionsMsg(error ? { error: error.message } : { ok: 'All other devices have been signed out' });
    });
  }

  const initials = displayName.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',  label: 'Profile',  icon: UserCheck },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900">Account Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Manage your profile and sign-in security.</p>
      </div>

      {/* Identity card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
        <div className="w-14 h-14 rounded-full bg-wall text-brass-light text-lg font-black flex items-center justify-center border-2 border-amber-400 shrink-0">
          {initials || '?'}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-zinc-900 text-base truncate">{displayName}</div>
          <div className="text-xs text-zinc-500 font-mono truncate">{email}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">{role}</span>
            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-mono">{companyName}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl">
        {TABS.map(({ id, label: text, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /><span>{text}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-zinc-800">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>First Name</label>
              <input required value={first} onChange={(e) => setFirst(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Last Name</label>
              <input value={last} onChange={(e) => setLast(e.target.value)} className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Work Email</label>
              <input type="email" value={email} readOnly className={`${input} bg-zinc-50 text-zinc-500`} />
              <p className="text-xs text-zinc-400 mt-1">Your sign-in email. Ask your company admin or our team to change it.</p>
            </div>
            <div>
              <label className={label}>Role</label>
              <input value={role} readOnly className={`${input} bg-zinc-50 text-zinc-500`} />
            </div>
            <div>
              <label className={label}>Company</label>
              <input value={companyName} readOnly className={`${input} bg-zinc-50 text-zinc-500`} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 gap-3">
            <Status ok={profileMsg.ok} error={profileMsg.error} />
            <button type="submit" disabled={savingProfile} className="ml-auto inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm">
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <form onSubmit={changePassword} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-800">Change Password</h2>
            <div>
              <label className={label}>Current Password</label>
              <div className="relative">
                <input required type={showCurrent ? 'text' : 'password'} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={`${input} pr-10`} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-label="Show password">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={label}>New Password</label>
              <div className="relative">
                <input required type={showNew ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={next} onChange={(e) => setNext(e.target.value)} className={`${input} pr-10`} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-label="Show password">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={label}>Confirm New Password</label>
              <input required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
            </div>
            <div className="flex items-center justify-between pt-2 gap-3">
              <Status ok={pwMsg.ok} error={pwMsg.error} />
              <button type="submit" disabled={savingPw} className="ml-auto inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm">
                {savingPw && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
              </button>
            </div>
          </form>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-800">Other Devices</h2>
                <p className="text-xs text-zinc-500">Signed in on a shared or lost device? Sign out everywhere except here.</p>
              </div>
              <button onClick={signOutOthers} disabled={signingOut} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-wall text-brass-light px-3 py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-60">
                {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />} Sign out other devices
              </button>
            </div>
            <div className="mt-3"><Status ok={sessionsMsg.ok} error={sessionsMsg.error} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
