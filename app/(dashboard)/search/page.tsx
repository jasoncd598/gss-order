import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Search | GSS Order Portal' };

import Link from 'next/link';
import { Search, Package, FolderLock } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { searchPortal } from '../../lib/db';
import { formatDate, orderStatusStyles, artworkStatusStyles } from '../../lib/utils';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const supabase = await createClient();
  const { orders, artwork } = await searchPortal(supabase, q);
  const total = orders.length + artwork.length;
  const tooShort = q.trim().length < 2;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-amber-500" /> Search
        </h1>
        <form action="/search" className="mt-3 relative max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Order number, PO, product, plate ref or SKU"
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </form>
        {!tooShort && <p className="text-xs text-zinc-500 mt-2">{total} result{total === 1 ? '' : 's'} for “{q}”</p>}
      </div>

      {tooShort ? (
        <p className="text-sm text-zinc-400 text-center py-12">Type at least two characters to search.</p>
      ) : total === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl py-14 text-center">
          <h3 className="font-semibold text-zinc-600 text-sm">Nothing found</h3>
          <p className="text-xs text-zinc-400 mt-1">Try an order number like ORD-2026-8812 or a plate ref like PLT-8812.</p>
        </div>
      ) : (
        <>
          {orders.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
              <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Orders ({orders.length})</h2>
              </header>
              <ul className="divide-y divide-zinc-100">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/order/${o.id}`} className="px-5 py-3 flex items-center gap-4 text-xs hover:bg-zinc-50">
                      <span className="font-mono font-bold text-zinc-900 w-32 shrink-0">{o.ref}</span>
                      <span className="flex-1 min-w-0 truncate text-zinc-700">{o.detail}</span>
                      <span className="text-zinc-400 hidden sm:inline">{formatDate(o.date)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border shrink-0 ${orderStatusStyles(o.status)}`}>{o.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {artwork.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
              <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Artwork ({artwork.length})</h2>
              </header>
              <ul className="divide-y divide-zinc-100">
                {artwork.map((a) => (
                  <li key={a.id}>
                    <Link href={`/vault?q=${encodeURIComponent(a.plateRef)}`} className="px-5 py-3 flex items-center gap-4 text-xs hover:bg-zinc-50">
                      <span className="font-mono text-amber-700 w-32 shrink-0">{a.plateRef} · {a.version}</span>
                      <span className="flex-1 min-w-0 truncate text-zinc-800 font-medium">{a.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border shrink-0 ${artworkStatusStyles(a.status)}`}>{a.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
