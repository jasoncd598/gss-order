'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="bg-amber-400 text-zinc-950 font-black px-3 py-2 rounded text-lg tracking-widest shadow-lg">
            GSS
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide">ORDER PORTAL</h1>
            <p className="text-amber-400/70 text-[11px] font-mono">B2B Customer Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-white font-bold text-xl mb-1">Sign in to your account</h2>
            <p className="text-zinc-400 text-xs">Enter your credentials to access your company portal.</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                defaultValue="sarah.jenkins@acmepackaging.com.au"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-zinc-500"
                placeholder="you@company.com.au"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  defaultValue="••••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent pr-10"
                  placeholder="Your secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer">
                <input type="checkbox" className="rounded border-zinc-600 bg-zinc-800 text-amber-400" />
                <span>Remember this device</span>
              </label>
              <Link href="/forgot-password" className="text-amber-400 hover:text-amber-300 font-medium">
                Forgot password?
              </Link>
            </div>

            <Link
              href="/"
              className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In Securely</span>
            </Link>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center space-x-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-500 text-[10px] font-mono">OR</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* PIN Login Hint */}
          <button className="w-full flex items-center justify-center space-x-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white font-medium py-2.5 rounded-lg text-xs transition-colors">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Sign in with Access PIN</span>
          </button>

          <p className="text-center text-zinc-500 text-[11px] mt-5">
            New to the portal?{' '}
            <Link href="/registration" className="text-amber-400 hover:text-amber-300 font-medium">
              Request access
            </Link>
          </p>
        </div>

        {/* Security notice */}
        <p className="text-center text-zinc-600 text-[10px] mt-5 font-mono">
          🔒 256-bit TLS encrypted · Australian-hosted · SOC 2 compliant
        </p>
      </div>
    </div>
  );
}
