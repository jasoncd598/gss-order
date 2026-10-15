import { Suspense } from 'react';
import type { Metadata } from 'next';
import TwoFactorChallenge from './TwoFactorChallenge';
import { safeNextPath } from '../lib/site';

export const metadata: Metadata = { title: 'Sign-in code · GSS Trade Orders' };

async function Challenge({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <TwoFactorChallenge next={safeNextPath(next)} />;
}

/** Reached via the auth proxy when a signed-in account with two-factor on hasn't entered its code yet. */
export default function TwoFactorPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-wall" />}>
      <Challenge searchParams={searchParams} />
    </Suspense>
  );
}
