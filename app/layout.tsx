import './globals.css';
import type { Metadata } from 'next';
import { Bodoni_Moda, Hanken_Grotesk, Courier_Prime } from 'next/font/google';

// Collection Catalogue type: Bodoni for titles, Hanken Grotesk for all UI text,
// Courier Prime for plate refs, order refs, quantities and money.
const display = Bodoni_Moda({ subsets: ['latin'], variable: '--font-bodoni', display: 'swap' });
const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });
const mono = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-courier', display: 'swap' });

export const metadata: Metadata = {
  title: 'GSS Order Portal',
  description: 'Secure trade ordering for GSS customers — order history, reorders, proofs, payments and invoices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-zinc-100 text-zinc-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
