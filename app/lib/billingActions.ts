'use server';

import { headers } from 'next/headers';
import { createSubscriptionCheckout, isPlanId, type BillingInterval } from './billing';
import { isDemoMode } from './demo';

export interface StartTrialResult {
  url?: string;
  error?: string;
}

/** Public (no sign-in): starts a Stripe Checkout for a paid plan with a free trial. */
export async function startTrialAction(plan: string, interval: string): Promise<StartTrialResult> {
  if (!isPlanId(plan) || (interval !== 'month' && interval !== 'year')) return { error: 'Unknown plan' };
  if (isDemoMode) return { error: 'Sign-ups are disabled in demo mode.' };

  const h = await headers();
  const origin = h.get('origin') ?? `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  try {
    return { url: await createSubscriptionCheckout(plan, interval as BillingInterval, origin) };
  } catch (err) {
    console.error('startTrialAction:', (err as Error).message);
    return { error: 'Could not start checkout. Please try again in a moment.' };
  }
}
