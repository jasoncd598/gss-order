import Link from 'next/link';

/**
 * A register line: the figures a screen opens with, set in one hairline-ruled
 * strip like a ledger row instead of a grid of big-number tiles.
 */
export interface LedgerItem {
  label: string;
  value: React.ReactNode;
  note?: string;
  href?: string;
  /** Needs attention: the figure is set in ochre */
  warn?: boolean;
}

const COLS: Record<number, string> = {
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

export default function Ledger({ items, label }: { items: LedgerItem[]; label: string }) {
  return (
    <dl aria-label={label} className={`grid grid-cols-2 ${COLS[items.length] ?? 'sm:grid-cols-4'} gap-px bg-zinc-300 border border-zinc-300 rounded-sm overflow-hidden`}>
      {items.map((it) => {
        const body = (
          <>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">{it.label}</dt>
            <dd className={`accession mt-1.5 text-[22px] leading-none font-bold ${it.warn ? 'text-yellow-600' : 'text-zinc-950'}`}>{it.value}</dd>
            {it.note && <dd className="mt-1.5 text-xs text-zinc-600">{it.note}</dd>}
          </>
        );
        return it.href ? (
          <Link key={it.label} href={it.href} className="bg-white px-4 py-3.5 hover:bg-zinc-50 transition-colors focus-visible:relative">
            {body}
          </Link>
        ) : (
          <div key={it.label} className="bg-white px-4 py-3.5">{body}</div>
        );
      })}
    </dl>
  );
}
