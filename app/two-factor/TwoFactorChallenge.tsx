'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

/** The code step after a password sign-in, for accounts with two-factor on. */
export default function TwoFactorChallenge({ next }: { next: string }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    createClient().auth.mfa.listFactors().then(({ data }) => {
      setFactorId(data?.totp.find((f) => f.status === 'verified')?.id ?? null);
    });
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError('');
    setLoading(true);
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setLoading(false);
    if (verifyError) {
      setError('That code did not match. Use the newest code from your authenticator app.');
      setCode('');
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-wall flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <Link href="/welcome" className="flex items-baseline justify-center gap-3 mb-8">
          <span className="font-display text-[40px] leading-none text-label tracking-tight">GSS</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
        </Link>

        <div className="bg-label rounded-sm p-8 sm:p-9 shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
          <div className="mb-6">
            <h1 className="text-zinc-950 font-semibold text-[26px] leading-tight mb-1">Enter your sign-in code</h1>
            <p className="text-zinc-600 text-xs">Open your authenticator app and type the six-digit code for GSS Trade Orders.</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start space-x-2.5 bg-red-50 border border-red-200 rounded-sm px-3.5 py-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={verify}>
            <div>
              <label htmlFor="code" className="block text-xs font-semibold text-zinc-700 mb-1.5">Six-digit code</label>
              <input
                id="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-zinc-300 text-zinc-950 text-lg accession tracking-[0.4em] text-center px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-zinc-400"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !factorId || code.length !== 6}
              className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-sm text-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Checking…' : 'Verify and continue'}</span>
            </button>
          </form>

          <p className="text-center text-zinc-600 text-[11px] mt-5">
            Lost your phone? Ask GSS to reset two-factor on your account.{' '}
            <button onClick={signOut} className="text-amber-700 hover:text-amber-800 font-medium underline">Sign out</button>
          </p>
        </div>
      </div>
    </div>
  );
}
