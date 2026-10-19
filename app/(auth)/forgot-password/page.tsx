'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-wall flex items-center justify-center p-4">
      

      <div className="relative w-full max-w-md">
        <Link href="/welcome" className="flex items-baseline justify-center gap-3 mb-8">
          <span className="font-display text-[40px] leading-none text-label tracking-tight">GSS</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
        </Link>

        <div className="bg-label rounded-sm p-8 sm:p-9 shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-zinc-950 font-semibold text-[26px] leading-tight mb-1">Reset your password</h1>
                <p className="text-zinc-600 text-xs">Enter your work email and we&apos;ll send a secure reset link valid for 1 hour.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start space-x-2.5 bg-red-50 border border-red-200 rounded-sm px-3.5 py-3">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com.au"
                      className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm pl-10 pr-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-sm text-sm transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-zinc-950 font-bold text-lg mb-2">Check your inbox</h2>
              <p className="text-zinc-600 text-xs mb-4">
                A reset link has been sent to <span className="text-zinc-950 font-semibold">{email}</span>. It expires in 1 hour.
              </p>
              <p className="text-zinc-600 text-[11px]">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-amber-700 hover:text-amber-800 underline">try again</button>.
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-zinc-200">
            <Link href="/login" className="flex items-center justify-center space-x-2 text-zinc-600 hover:text-zinc-950 text-xs font-medium transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
