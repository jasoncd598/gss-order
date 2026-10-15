import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { createAdminClient } from './supabase/admin';

/** Per-action limits: max hits per window. */
export const LIMITS = {
  trialCheckout: { limit: 5,  windowSeconds: 600 },   // public plan sign-up, per IP
  orderCheckout: { limit: 10, windowSeconds: 600 },   // card payment sessions, per user
  placeOrder:    { limit: 30, windowSeconds: 3600 },  // per user
  reorder:       { limit: 30, windowSeconds: 3600 },  // per user
  invite:        { limit: 20, windowSeconds: 3600 },  // invitation emails, per user
} as const;

export type LimitName = keyof typeof LIMITS;

export const RATE_LIMITED = 'Too many attempts. Please wait a few minutes and try again.';

/** The caller's IP, hashed — used to key limits on actions that need no sign-in. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  return 'ip:' + createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * Counts one hit and returns false once `who` is over the limit for `name`.
 * Counters live in Postgres (migration 009) so they hold across serverless
 * instances. If the limiter itself is unavailable the request is allowed —
 * the limit protects against abuse, it must not take the portal down.
 */
export async function underLimit(name: LimitName, who: string): Promise<boolean> {
  const { limit, windowSeconds } = LIMITS[name];
  try {
    const { data, error } = await createAdminClient().rpc('hit_rate_limit', {
      p_key: `${name}:${who}`, p_limit: limit, p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data !== false;
  } catch (err) {
    console.error('rate limit check failed:', (err as Error).message);
    return true;
  }
}
