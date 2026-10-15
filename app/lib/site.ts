import { headers } from 'next/headers';
import { siteUrl } from './email';

/** Hosts we will build absolute links for. Anything else falls back to SITE_URL. */
function trustedHosts(): string[] {
  const hosts = ['localhost:3000', '127.0.0.1:3000'];
  for (const v of [process.env.SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (!v) continue;
    try { hosts.push(new URL(v.includes('://') ? v : `https://${v}`).host); } catch { /* ignore malformed */ }
  }
  return hosts;
}

/**
 * The site's own origin for redirect and invite links (Stripe success URLs,
 * invite links). Uses the request's host only when it is one of ours, so a
 * forged Host / Origin header can't point a payment redirect at another site.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host && trustedHosts().includes(host)) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return siteUrl();
}

/** A same-site path to send the user to after sign-in. Rejects absolute and protocol-relative URLs. */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
