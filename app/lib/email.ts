import { after } from 'next/server';
import { createAdminClient } from './supabase/admin';

/**
 * Emails every in-portal notification to its recipient — server-side only.
 *
 * Notifications are created by database triggers (migration 004/005). After
 * each mutation the app calls `queueEmailDelivery()`, which sends whatever is
 * pending once the response has gone out. `/api/notifications/deliver` runs the
 * same delivery on a schedule as a backstop. Rows are claimed atomically, so
 * overlapping runs never send the same email twice.
 *
 * Sends through Resend's HTTP API. Disabled (no-op) until RESEND_API_KEY and
 * EMAIL_FROM are set.
 */

const MAX_ATTEMPTS = 3;
const BATCH_SIZE   = 25;
/** Don't email very old notifications if delivery was switched off for a while */
const MAX_AGE_MS   = 2 * 24 * 60 * 60 * 1000;

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

/** Absolute base URL for links in emails */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

/** Call after any write that may have created notifications. */
export function queueEmailDelivery() {
  if (!emailEnabled()) return;
  after(async () => {
    try {
      await deliverPendingEmails();
    } catch (err) {
      console.error('Email delivery:', (err as Error).message);
    }
  });
}

export interface DeliveryResult {
  sent: number;
  failed: number;
  skipped: number;
}

export async function deliverPendingEmails(): Promise<DeliveryResult> {
  const result: DeliveryResult = { sent: 0, failed: 0, skipped: 0 };
  if (!emailEnabled()) return result;

  const admin = createAdminClient();
  const { data: pending, error } = await admin
    .from('notifications')
    .select('id')
    .is('emailed_at', null)
    .lt('email_attempts', MAX_ATTEMPTS)
    .gte('created_at', new Date(Date.now() - MAX_AGE_MS).toISOString())
    .order('created_at')
    .limit(BATCH_SIZE);
  if (error) throw new Error(`deliverPendingEmails: ${error.message}`);
  if (!pending?.length) return result;

  // Claim: only rows still unclaimed come back, so a concurrent run skips them
  const { data: claimed, error: claimError } = await admin
    .from('notifications')
    .update({ emailed_at: new Date().toISOString() })
    .in('id', pending.map((n) => n.id))
    .is('emailed_at', null)
    .select('id');
  if (claimError) throw new Error(`deliverPendingEmails: ${claimError.message}`);
  if (!claimed?.length) return result;

  const { data: rows, error: rowsError } = await admin
    .from('notifications')
    .select('id, title, body, link, email_attempts, profiles ( email, first_name, status )')
    .in('id', claimed.map((n) => n.id));
  if (rowsError) throw new Error(`deliverPendingEmails: ${rowsError.message}`);

  for (const row of rows ?? []) {
    const p = row.profiles as unknown as { email: string | null; first_name: string | null; status: string } | null;
    if (!p?.email || p.status !== 'Active') {
      await admin.from('notifications').update({ email_error: 'No active recipient' }).eq('id', row.id);
      result.skipped++;
      continue;
    }

    try {
      await sendEmail({
        to:             p.email,
        subject:        row.title,
        idempotencyKey: `notification-${row.id}`,
        ...renderNotificationEmail({ firstName: p.first_name, title: row.title, body: row.body, link: row.link }),
      });
      await admin.from('notifications').update({ email_error: null }).eq('id', row.id);
      result.sent++;
    } catch (err) {
      // Release the claim so a later run retries, up to MAX_ATTEMPTS
      await admin.from('notifications').update({
        emailed_at:     null,
        email_attempts: row.email_attempts + 1,
        email_error:    (err as Error).message.slice(0, 500),
      }).eq('id', row.id);
      result.failed++;
    }
  }

  return result;
}

/** Emails a team invitation link. Returns false (never throws) if email is off or sending fails. */
export async function sendInvitationEmail(to: string, link: string, role: string, companyName?: string): Promise<boolean> {
  if (!emailEnabled()) return false;
  const company = companyName ? ` ${companyName}` : '';
  const title = `You're invited to join${company} on the GSS Order Portal`;
  try {
    await sendEmail({
      to,
      subject: title,
      idempotencyKey: `invite-${link}`,
      ...renderEmail({
        greeting: 'Hi,',
        title,
        body: `You've been invited as ${role}. Create your account with this email address to accept — the link expires in 14 days.`,
        url: link,
        cta: 'Accept invitation',
        footer: "If you weren't expecting this invitation, you can ignore this email.",
      }),
    });
    return true;
  } catch (err) {
    console.error('Invitation email:', (err as Error).message);
    return false;
  }
}

interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

async function sendEmail(email: Email) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:     `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':    'application/json',
      // Resend drops a repeat of the same key, so a retry can't double-send
      'Idempotency-Key': email.idempotencyKey,
    },
    body: JSON.stringify({
      from:    process.env.EMAIL_FROM,
      to:      [email.to],
      subject: email.subject,
      html:    email.html,
      text:    email.text,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function renderNotificationEmail(n: { firstName: string | null; title: string; body: string | null; link: string | null }) {
  // Links are app paths written by our own triggers; anything else is dropped
  const url = n.link?.startsWith('/') ? `${siteUrl()}${n.link}` : siteUrl();
  return renderEmail({
    greeting: n.firstName ? `Hi ${n.firstName},` : 'Hi,',
    title:    n.title,
    body:     n.body,
    url,
    cta:      'View in portal',
    footer:   "You're receiving this because you have an account on the GSS Order Portal.",
  });
}

function renderEmail(e: { greeting: string; title: string; body: string | null; url: string; cta: string; footer: string }) {
  const text = [e.greeting, '', e.title, e.body ?? '', '', `${e.cta}: ${e.url}`, '', '— GSS Order Portal'].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
        <tr><td style="background:#18181b;padding:14px 20px;color:#fbbf24;font-weight:800;font-size:14px;letter-spacing:.04em">GSS ORDER PORTAL</td></tr>
        <tr><td style="padding:24px 20px">
          <p style="margin:0 0 12px;font-size:14px;color:#52525b">${escapeHtml(e.greeting)}</p>
          <h1 style="margin:0 0 8px;font-size:18px;line-height:1.35;color:#18181b">${escapeHtml(e.title)}</h1>
          ${e.body ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#3f3f46">${escapeHtml(e.body)}</p>` : ''}
          <a href="${escapeHtml(e.url)}" style="display:inline-block;background:#fbbf24;color:#18181b;font-weight:700;font-size:14px;text-decoration:none;padding:10px 18px;border-radius:6px">${escapeHtml(e.cta)}</a>
        </td></tr>
        <tr><td style="padding:14px 20px;border-top:1px solid #f4f4f5;font-size:11px;color:#a1a1aa">${escapeHtml(e.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { html, text };
}
