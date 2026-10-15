'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-wall flex items-center justify-center p-4">
      

      <div className="relative w-full max-w-md">
        <Link href="/welcome" className="flex items-baseline justify-center gap-3 mb-8">
          <span className="font-display text-[40px] leading-none text-label tracking-tight">GSS</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
        </Link>

        {/* Card */}
        <div className="bg-label rounded-sm p-8 sm:p-9 shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
          <div className="mb-6">
            <h1 className="text-zinc-950 font-semibold text-[26px] leading-tight mb-1">Sign in to your account</h1>
            <p className="text-zinc-600 text-xs">Enter your credentials to access your company portal.</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start space-x-2.5 bg-red-50 border border-red-200 rounded-sm px-3.5 py-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-zinc-500"
                placeholder="you@company.com.au"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent pr-10 placeholder:text-zinc-500"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-950"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-zinc-600 cursor-pointer">
                <input type="checkbox" className="rounded border-zinc-600 bg-white text-amber-700" />
                <span>Remember this device</span>
              </label>
              <Link href="/forgot-password" className="text-amber-700 hover:text-amber-800 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-sm text-sm transition-colors mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Signing in…' : 'Sign In Securely'}</span>
            </button>
          </form>

          <p className="text-center text-zinc-600 text-[11px] mt-5">
            New to the portal?{' '}
            <Link href="/registration" className="text-amber-700 hover:text-amber-800 font-medium">
              Request access
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
