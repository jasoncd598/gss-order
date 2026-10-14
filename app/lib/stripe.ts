import Stripe from 'stripe';
import { createAdminClient } from './supabase/admin';

/**
 * Stripe card payments for orders — server-side only.
 *
 * A customer pays an order through Stripe Checkout. The order is marked paid by
 * `syncCheckoutSession`, which runs from the webhook (the source of truth) and
 * from the checkout return page (so the customer sees it straight away). It is
 * idempotent, so both can run for the same session in any order.
 */

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    stripe = new Stripe(key);
  }
  return stripe;
}

export const GST_RATE = 0.1;
export const CURRENCY = 'aud';

/** Order totals are stored ex-GST in dollars; Stripe wants integer cents. */
export function orderChargeCents(totalExGst: number) {
  const net = Math.round(totalExGst * 100);
  const gst = Math.round(totalExGst * GST_RATE * 100);
  return { net, gst, total: net + gst };
}

/** Points an order at its latest Checkout Session. */
export async function recordCheckoutSession(orderId: string, sessionId: string) {
  const { error } = await createAdminClient()
    .from('orders')
    .update({ stripe_checkout_session_id: sessionId })
    .eq('id', orderId);
  if (error) throw new Error(`recordCheckoutSession: ${error.message}`);
}

export type PaymentStatus = 'Unpaid' | 'Processing' | 'Paid';

/**
 * Brings an order's payment state in line with a Checkout Session.
 * Returns the order's resulting payment status, or null if the session isn't for an order.
 */
export async function syncCheckoutSession(sessionId: string): Promise<PaymentStatus | null> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.order_id;
  if (!orderId) return null;

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from('orders')
    .select('id, ref, total, payment_status, stripe_checkout_session_id')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw new Error(`syncCheckoutSession: ${error.message}`);
  if (!order) return null;

  if (order.payment_status === 'Paid') {
    if (session.payment_status === 'paid' && order.stripe_checkout_session_id !== session.id) {
      // Two sessions were paid for one order (e.g. two tabs) — needs a refund.
      console.error(`Duplicate payment for ${order.ref}: session ${session.id} — refund in the Stripe Dashboard`);
    }
    return 'Paid';
  }

  if (session.payment_status === 'paid') {
    const expected = orderChargeCents(Number(order.total)).total;
    if (session.amount_total !== expected || session.currency !== CURRENCY) {
      // The order changed after checkout started — leave it for staff to reconcile.
      console.error(`Payment amount mismatch for ${order.ref}: paid ${session.amount_total} ${session.currency}, expected ${expected} ${CURRENCY}`);
      return order.payment_status as PaymentStatus;
    }

    const pi = session.payment_intent;
    const { error: updateError } = await admin
      .from('orders')
      .update({
        payment_status:             'Paid',
        amount_paid:                session.amount_total / 100,
        paid_at:                    new Date().toISOString(),
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:   typeof pi === 'string' ? pi : pi?.id ?? null,
      })
      .eq('id', order.id)
      .neq('payment_status', 'Paid');
    if (updateError) throw new Error(`syncCheckoutSession: ${updateError.message}`);
    return 'Paid';
  }

  // Checkout finished but the funds are still on their way (delayed payment methods)
  if (session.status === 'complete' && order.payment_status === 'Unpaid') {
    const { error: updateError } = await admin
      .from('orders')
      .update({ payment_status: 'Processing', stripe_checkout_session_id: session.id })
      .eq('id', order.id)
      .eq('payment_status', 'Unpaid');
    if (updateError) throw new Error(`syncCheckoutSession: ${updateError.message}`);
    return 'Processing';
  }

  return order.payment_status as PaymentStatus;
}

/** A delayed payment failed — the order can be paid again. */
export async function markCheckoutFailed(sessionId: string) {
  const { error } = await createAdminClient()
    .from('orders')
    .update({ payment_status: 'Unpaid' })
    .eq('stripe_checkout_session_id', sessionId)
    .eq('payment_status', 'Processing');
  if (error) throw new Error(`markCheckoutFailed: ${error.message}`);
}
