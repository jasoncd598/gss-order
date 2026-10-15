import type Stripe from 'stripe';
import { getStripe } from './stripe';
import { createAdminClient } from './supabase/admin';

/**
 * Paid plans for the portal itself (Stripe Billing) — server-side only.
 *
 * Prices live in Stripe and are found by lookup key (gss_<plan>_<monthly|yearly>),
 * so amounts can change in the Dashboard without a deploy. The `subscriptions`
 * table mirrors Stripe and is written only here, from the webhook and the
 * checkout success page; Stripe stays the source of truth.
 */

export type PlanId = 'starter' | 'growth' | 'scale';
export type BillingInterval = 'month' | 'year';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Display prices in AUD incl. GST — must match the Stripe prices */
  monthly: number;
  yearly: number;
  features: string[];
  highlighted?: boolean;
}

export const TRIAL_DAYS = 14;

export const PLANS: Plan[] = [
  {
    id: 'starter', name: 'Starter', tagline: 'For a small trade counter going online.',
    monthly: 79, yearly: 790,
    features: [
      'Up to 10 customer companies',
      '3 staff users',
      'Order history & one-click reorder',
      'Secure artwork & proof vault',
      'Printable tax invoices',
    ],
  },
  {
    id: 'growth', name: 'Growth', tagline: 'For suppliers with a busy reorder book.',
    monthly: 199, yearly: 1990, highlighted: true,
    features: [
      'Up to 50 customer companies',
      '10 staff users',
      'Everything in Starter',
      'Card payments via Stripe',
      'Email notifications',
      'Per-customer pricing & minimums',
    ],
  },
  {
    id: 'scale', name: 'Scale', tagline: 'For multi-site and high-volume operations.',
    monthly: 499, yearly: 4990,
    features: [
      'Unlimited customer companies',
      'Unlimited staff users',
      'Everything in Growth',
      'Priority support',
      'Assisted onboarding & data import',
    ],
  },
];

const lookupKey = (plan: PlanId, interval: BillingInterval) => `gss_${plan}_${interval === 'month' ? 'monthly' : 'yearly'}`;

export function isPlanId(v: unknown): v is PlanId {
  return v === 'starter' || v === 'growth' || v === 'scale';
}

/** Hosted Stripe page where subscribers sign in (by emailed code) to manage billing */
export function billingPortalUrl(): string | null {
  return process.env.STRIPE_BILLING_PORTAL_URL || null;
}

// Tags these sessions in the Stripe Dashboard
const SUBSCRIPTION_INTEGRATION_ID = 'gss-portal-plans-HVTRWQNB';

export async function createSubscriptionCheckout(plan: PlanId, interval: BillingInterval, origin: string): Promise<string> {
  const stripe = getStripe();
  const key = lookupKey(plan, interval);
  const prices = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) throw new Error(`No active Stripe price with lookup key ${key}`);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { plan, interval },
    },
    custom_fields: [
      { key: 'company', label: { type: 'custom', custom: 'Company name' }, type: 'text' },
    ],
    billing_address_collection: 'required',
    metadata: { plan, interval },
    success_url: `${origin}/welcome/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    integration_identifier: SUBSCRIPTION_INTEGRATION_ID,
  });
  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  return session.url;
}

/** Upserts our copy of a Stripe subscription. Safe to call repeatedly and out of order. */
export async function syncSubscription(subscriptionId: string, extra: { companyName?: string | null; email?: string | null } = {}) {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['customer'] });
  const item = sub.items.data[0];
  const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
  const customerId = customer.id;
  const plan = (item?.price.lookup_key ?? '').split('_')[1] || sub.metadata.plan || 'unknown';

  const row: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    stripe_customer_id:     customerId,
    plan,
    billing_interval:       item?.price.recurring?.interval ?? 'month',
    status:                 sub.status,
    // Newer API versions schedule a cancellation via cancel_at instead of the flag
    cancel_at_period_end:   sub.cancel_at_period_end || sub.cancel_at !== null,
    trial_end:              sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_end:     item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    updated_at:             new Date().toISOString(),
  };
  const email = extra.email ?? ('deleted' in customer ? null : customer.email);
  if (email) row.email = email;
  if (extra.companyName) row.company_name = extra.companyName;

  const { error } = await createAdminClient()
    .from('subscriptions')
    .upsert(row, { onConflict: 'stripe_subscription_id' });
  if (error) throw new Error(`syncSubscription: ${error.message}`);

  return { status: sub.status, plan, trialEnd: row.trial_end as string | null };
}

/** From a completed subscription Checkout Session (webhook or success page). */
export async function syncSubscriptionCheckout(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription) return null;
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const companyName = session.custom_fields?.find((f) => f.key === 'company')?.text?.value ?? null;
  return syncSubscription(subId, { companyName, email: session.customer_details?.email ?? null });
}

/** Subscription id an invoice belongs to, if any. */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const s = invoice.parent?.subscription_details?.subscription;
  if (!s) return null;
  return typeof s === 'string' ? s : s.id;
}
