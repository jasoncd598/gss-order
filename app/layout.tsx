import './globals.css';
import type { Metadata } from 'next';
import { League_Spartan } from 'next/font/google';

const spartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-spartan',
});

export const metadata: Metadata = {
  title: 'GSS Order Portal | Industrial B2B',
  description: 'Secure customer ordering and account portal for Australian businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spartan.variable}>
      <body className="bg-zinc-100 text-zinc-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
