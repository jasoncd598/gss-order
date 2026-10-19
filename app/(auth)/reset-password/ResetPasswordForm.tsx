'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, AlertCircle } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function ResetPasswordForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Use at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (demo) { router.push('/account'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  const inputClass = 'w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-zinc-500';

  return (
    <div className="min-h-screen bg-wall flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <Link href="/welcome" className="flex items-baseline justify-center gap-3 mb-8">
          <span className="font-display text-[40px] leading-none text-label tracking-tight">GSS</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
        </Link>

        <div className="bg-label rounded-sm p-8 sm:p-9 shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
          <div className="mb-6">
            <h1 className="text-zinc-950 font-semibold text-[26px] leading-tight mb-1">Choose a new password</h1>
            <p className="text-zinc-600 text-xs">Use at least 8 characters. You&apos;ll stay signed in on this device.</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start space-x-2.5 bg-red-50 border border-red-200 rounded-sm px-3.5 py-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">New Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Confirm New Password</label>
              <input
                required
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-sm text-sm transition-colors mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Saving…' : 'Save New Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
