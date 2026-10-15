'use client';

import { useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

/**
 * The hero's hang: three example catalogue labels on one sightline. The centre
 * label is live — change the quantity and press Reorder to see the request
 * stamped onto the label. All three share one baseline (the gallery sightline). Example data only; nothing is submitted.
 */

interface Label {
  acc: string;
  title: string;
  spec: string;
  lastRun: number;
  lastDate: string;
  price: number;
}

const SIDE_LEFT: Label = {
  acc: 'PLT-1140-D', title: 'Cast brass oval plate, black infill', spec: '450 × 280 mm · sand-cast brass',
  lastRun: 12, lastDate: '14 Jul 2026', price: 210,
};
const CENTRE: Label = {
  acc: 'PLT-8812-B', title: 'Cast brass works plate, blue enamel', spec: '380 × 270 mm oval · enamel infill',
  lastRun: 20, lastDate: '02 Oct 2026', price: 185,
};
const SIDE_RIGHT: Label = {
  acc: 'PLT-3301-E', title: 'Hand-painted ceramic plate', spec: 'Ø 200 mm · speckled stoneware',
  lastRun: 100, lastDate: '20 Jun 2026', price: 38,
};

const aud = (n: number) => `A$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function SideLabel({ l, className = '' }: { l: Label; className?: string }) {
  return (
    <div className={`relative bg-label text-zinc-950 rounded-[2px] p-5 pb-4 shadow-[0_18px_40px_-18px_rgba(5,10,28,0.85)] ring-1 ring-[#b38b3b]/60 ${className}`}>
      <p className="accession text-[11px] text-zinc-600">Acc. {l.acc}</p>
      <p className="font-display text-lg leading-snug mt-1.5">{l.title}</p>
      <p className="text-xs text-zinc-600 mt-1">{l.spec}</p>
      <div className="mt-4 pt-3 border-t border-zinc-300 flex justify-between text-[11px] text-zinc-600">
        <span>Last run <span className="accession text-zinc-950">{l.lastRun}</span></span>
        <span className="accession text-zinc-950">{aud(l.price)}</span>
      </div>
    </div>
  );
}

export default function HeroCatalogue() {
  const [qty, setQty] = useState(CENTRE.lastRun);
  const [stamped, setStamped] = useState(false);
  const today = '15 OCT 2026';

  return (
    <div className="relative" aria-label="Example catalogue labels">
      {/* One sightline: the labels share a baseline */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.25fr_1fr] gap-5 items-end">
        <SideLabel l={SIDE_LEFT} className="hidden md:block" />

        <div className="relative bg-label text-zinc-950 rounded-[2px] p-6 pb-5 shadow-[0_28px_60px_-22px_rgba(5,10,28,0.95)] ring-2 ring-[#b38b3b]">
              <div className="flex items-baseline justify-between gap-3">
            <p className="accession text-xs text-zinc-600">Acc. {CENTRE.acc}</p>
            <p className="text-[11px] text-zinc-600">Made by GSS</p>
          </div>
          <p className="font-display text-[26px] leading-[1.15] mt-2">{CENTRE.title}</p>
          <p className="text-[13px] text-zinc-600 mt-1.5">{CENTRE.spec}</p>

          <dl className="mt-5 grid grid-cols-2 gap-y-1.5 text-[12px] border-t border-zinc-300 pt-3">
            <dt className="text-zinc-600">Last run</dt><dd className="accession text-right">{CENTRE.lastRun} units</dd>
            <dt className="text-zinc-600">Last ordered</dt><dd className="accession text-right">{CENTRE.lastDate}</dd>
            <dt className="text-zinc-600">Unit price</dt><dd className="accession text-right">{aud(CENTRE.price)}</dd>
            <dt className="text-zinc-600">This run</dt><dd className="accession text-right font-bold">{aud(qty * CENTRE.price)}</dd>
          </dl>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center border border-zinc-400 rounded-[2px] bg-white">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 5))} disabled={stamped}
                className="p-2.5 text-zinc-700 hover:text-zinc-950 disabled:opacity-40" aria-label="Decrease quantity">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="accession w-10 text-center text-sm" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 5)} disabled={stamped}
                className="p-2.5 text-zinc-700 hover:text-zinc-950 disabled:opacity-40" aria-label="Increase quantity">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {!stamped ? (
              <button type="button" onClick={() => setStamped(true)}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm py-2.5 rounded-[2px] transition-colors">
                Reorder
              </button>
            ) : (
              <button type="button" onClick={() => { setStamped(false); setQty(CENTRE.lastRun); }} aria-label="Reset example"
                className="flex-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap border border-zinc-400 text-zinc-700 hover:text-zinc-950 text-sm py-2.5 rounded-[2px]">
                <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Reset
              </button>
            )}
          </div>

          {stamped && (
            <div role="status" className="hero-stamp pointer-events-none absolute right-5 top-[42%] text-center text-[#a5352a] border-[3px] border-double border-current rounded-[3px] px-3 py-1.5 bg-[#f4f2ec]/70">
              <span className="block text-[13px] font-bold tracking-[0.14em]">REORDER REQUESTED</span>
              <span className="accession block text-[11px] tracking-[0.08em]">{qty} UNITS · {today}</span>
            </div>
          )}
        </div>

        <SideLabel l={SIDE_RIGHT} className="hidden md:block" />
      </div>
      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-blue-300 md:text-center">Example catalogue · sample data</p>
    </div>
  );
}
