import Link from 'next/link';

/** Plain reading layout for the privacy policy and terms — open to everyone, signed in or not. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-board text-zinc-950">
      <header className="bg-wall text-label border-b border-[#b38b3b]/50">
        <nav className="max-w-3xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/welcome" className="flex items-baseline gap-2.5">
            <span className="font-display text-[28px] leading-none tracking-tight">GSS</span>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
          </Link>
          <div className="flex items-center gap-5 text-sm text-blue-100">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </div>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <article className="legal space-y-4 text-[15px] leading-relaxed text-zinc-800">{children}</article>
      </main>
    </div>
  );
}
