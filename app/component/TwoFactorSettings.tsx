'use client';

import { useEffect, useState, useTransition } from 'react';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

interface Enrolling { factorId: string; qr: string; secret: string }

const input = 'w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';

/**
 * Two-factor sign-in with an authenticator app (TOTP, Supabase Auth MFA).
 * Required for GSS staff — staff powers only apply to a session that passed
 * the code step (migration 009). Optional for customers.
 */
export default function TwoFactorSettings({ demo, isStaff, required }: { demo: boolean; isStaff: boolean; required: boolean }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(demo);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, start] = useTransition();

  useEffect(() => {
    if (demo) return;
    createClient().auth.mfa.listFactors().then(({ data }) => {
      setFactorId(data?.totp.find((f) => f.status === 'verified')?.id ?? null);
      setLoaded(true);
    });
  }, [demo]);

  function beginSetup() {
    setMsg({});
    if (demo) { setMsg({ ok: 'Two-factor sign-in is not available in demo mode.' }); return; }
    start(async () => {
      const mfa = createClient().auth.mfa;
      // Clear any half-finished setup first (an unverified factor blocks a new one)
      const { data: list } = await mfa.listFactors();
      for (const f of list?.all ?? []) {
        if (f.status === 'unverified') await mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' });
      if (error || !data) { setMsg({ error: error?.message ?? 'Could not start setup' }); return; }
      setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    });
  }

  function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setMsg({});
    start(async () => {
      const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enrolling.factorId, code: code.trim() });
      if (error) { setMsg({ error: 'That code did not match. Check the time on your phone and try the newest code.' }); return; }
      setFactorId(enrolling.factorId);
      setEnrolling(null);
      setCode('');
      setMsg({ ok: 'Two-factor sign-in is on. You will be asked for a code each time you sign in.' });
    });
  }

  function turnOff() {
    if (!factorId) return;
    if (isStaff && !confirm('Staff accounts need two-factor sign-in. Turning it off locks you out of GSS admin until you set it up again. Continue?')) return;
    setMsg({});
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) { setMsg({ error: error.message }); return; }
      await supabase.auth.refreshSession();
      setFactorId(null);
      setMsg({ ok: 'Two-factor sign-in is off.' });
    });
  }

  return (
    <div id="two-factor" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
      {required && !factorId && (
        <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-sm px-3.5 py-3 text-xs text-yellow-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>GSS staff accounts need two-factor sign-in before they can open the admin pages. Set it up below — it takes a minute.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
            Two-Factor Sign-In
            {loaded && <span className={factorId ? 'stamp stamp-green' : 'stamp stamp-grey'}>{factorId ? 'On' : 'Off'}</span>}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            A six-digit code from an authenticator app (Google Authenticator, 1Password, Authy) as well as your password.
            {isStaff && ' Required for GSS staff.'}
          </p>
        </div>
        {loaded && !enrolling && (
          factorId ? (
            <button onClick={turnOff} disabled={busy} className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-800 underline disabled:opacity-60">
              Turn off
            </button>
          ) : (
            <button onClick={beginSetup} disabled={busy} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 px-3 py-2 rounded-lg disabled:opacity-60">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Set up
            </button>
          )
        )}
      </div>

      {enrolling && (
        <form onSubmit={confirmSetup} className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start border-t border-zinc-200 pt-4">
          {/* Supabase returns the QR code as an SVG data URI */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qr} alt="QR code to scan with your authenticator app" width={168} height={168} className="bg-white border border-zinc-200 p-2 mx-auto sm:mx-0" />
          <div className="space-y-3">
            <ol className="text-xs text-zinc-700 space-y-1 list-decimal pl-4">
              <li>Open your authenticator app and scan the code.</li>
              <li>Can&apos;t scan? Enter this key instead: <span className="accession break-all text-zinc-950">{enrolling.secret}</span></li>
              <li>Type the six-digit code the app shows.</li>
            </ol>
            <input
              required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456" aria-label="Six-digit code" className={`${input} accession tracking-[0.3em] max-w-[180px]`}
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={busy || code.length !== 6} className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs">
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Turn on
              </button>
              <button type="button" onClick={() => { setEnrolling(null); setCode(''); }} className="text-xs text-zinc-600 hover:text-zinc-900">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {msg.error && <p className="flex items-center gap-1.5 text-red-600 text-xs font-semibold"><AlertCircle className="w-4 h-4" />{msg.error}</p>}
      {msg.ok && <p className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" />{msg.ok}</p>}
    </div>
  );
}
