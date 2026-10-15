import Link from 'next/link';
import { Home, Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-wall flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-baseline gap-3 mb-8">
        <span className="font-display text-[40px] leading-none text-label tracking-tight">GSS</span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
      </Link>
      <div className="relative bg-label rounded-[2px] p-9 text-center max-w-md w-full shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
        <p className="accession text-sm text-zinc-600">Acc. 404 — not in the catalogue</p>
        <h1 className="mt-3 text-[30px] leading-tight text-zinc-950">Page not found</h1>
        <p className="mt-3 text-zinc-700 text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist, or you may not have permission to view it.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold px-5 py-2.5 rounded-[2px] text-sm transition-colors">
            <Home className="w-4 h-4" /><span>Back to dashboard</span>
          </Link>
          <Link href="/order" className="inline-flex items-center justify-center gap-2 border border-zinc-400 text-zinc-800 hover:border-zinc-950 font-medium px-5 py-2.5 rounded-[2px] text-sm transition-colors">
            <Package className="w-4 h-4" /><span>View orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
