'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
    >
      <Printer className="w-4 h-4" />
      <span>Print / Save as PDF</span>
    </button>
  );
}
