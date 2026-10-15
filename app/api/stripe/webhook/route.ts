import type Stripe from 'stripe';
import { getStripe, markCheckoutFailed, syncCheckoutSession } from '../../../lib/stripe';
import { queueEmailDelivery } from '../../../lib/email';
import { invoiceSubscriptionId, syncSubscription, syncSubscriptionCheckout } from '../../../lib/billing';

/**
 * Stripe webhook. Register this URL in the Stripe Dashboard (or forward to it
 * with `stripe listen`) for these events:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 * and, for portal subscriptions (Stripe Billing):
 *   customer.subscription.created / .updated / .deleted
 *   invoice.paid / invoice.payment_failed
 * Excluded from the auth proxy (proxy.ts) — the signature is the authentication.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook not configured', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    // Must be the raw body — parsing it first breaks the signature
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.error('Stripe webhook: bad signature', (err as Error).message);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (event.data.object.mode === 'subscription') await syncSubscriptionCheckout(event.data.object);
        else await syncCheckoutSession(event.data.object.id);
        break;
      case 'checkout.session.async_payment_succeeded':
        await syncCheckoutSession(event.data.object.id);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object.id);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const subId = invoiceSubscriptionId(event.data.object);
        if (subId) await syncSubscription(subId);
        break;
      }
      case 'checkout.session.async_payment_failed':
        await markCheckoutFailed(event.data.object.id);
        break;
    }
  } catch (err) {
    // A 500 makes Stripe retry the delivery later
    console.error(`Stripe webhook: ${event.type} failed`, (err as Error).message);
    return new Response('Handler failed', { status: 500 });
  }

  // Payment notifications were just created by the database trigger
  queueEmailDelivery();
  return Response.json({ received: true });
}
