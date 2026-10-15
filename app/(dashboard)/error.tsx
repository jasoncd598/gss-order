'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { reportError } from '../lib/errorReport';

/** Shown when a dashboard page throws — keeps the sidebar and top bar usable. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Server errors (with a digest) were already reported by instrumentation.ts
  useEffect(() => {
    if (!error.digest) void reportError(error, { kind: 'browser', path: window.location.pathname }, process.env.NEXT_PUBLIC_SENTRY_DSN);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto mt-16 text-center bg-white border border-zinc-200 rounded-xl p-10 shadow-sm">
      <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h1 className="text-lg font-bold text-zinc-900 mb-1">Something went wrong</h1>
      <p className="text-sm text-zinc-500 mb-1">This page couldn&apos;t be loaded. Your data is safe.</p>
      {error.digest && <p className="text-xs text-zinc-400 font-mono mb-6">Reference: {error.digest}</p>}
      <div className="flex justify-center gap-2 mt-6">
        <button onClick={reset} className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm">
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        <Link href="/" className="px-5 py-2 rounded-lg text-sm border border-zinc-200 hover:bg-zinc-50 text-zinc-700">Dashboard</Link>
      </div>
    </div>
  );
}
