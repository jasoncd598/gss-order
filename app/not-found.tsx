import Link from 'next/link';
import { AlertTriangle, Home, Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative text-center max-w-md">
        <div className="w-20 h-20 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-9 h-9 text-amber-400" />
        </div>
        <div className="text-amber-400 font-black font-mono text-6xl mb-2">404</div>
        <h1 className="text-white font-bold text-xl mb-2">Page Not Found</h1>
        <p className="text-zinc-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or you may not have permission to view it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            href="/order"
            className="inline-flex items-center justify-center space-x-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-900 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>View Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
