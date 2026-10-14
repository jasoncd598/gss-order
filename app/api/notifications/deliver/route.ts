import { deliverPendingEmails, emailEnabled } from '../../../lib/email';

/**
 * Sends any notification emails that are still pending. Emails normally go out
 * straight after each action (queueEmailDelivery); this catches the rest —
 * e.g. "invitation accepted", which is created during sign-up.
 *
 * Called by Vercel Cron (GET, vercel.json) and optionally by a Supabase
 * Database Webhook on notifications INSERT (POST). Both must send
 * `Authorization: Bearer <CRON_SECRET>`. Excluded from the auth proxy (proxy.ts).
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response('CRON_SECRET is not set', { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!emailEnabled()) return Response.json({ enabled: false });

  try {
    return Response.json({ enabled: true, ...(await deliverPendingEmails()) });
  } catch (err) {
    console.error('Notification delivery:', (err as Error).message);
    return new Response('Delivery failed', { status: 500 });
  }
}

export const GET  = handle;
export const POST = handle;
