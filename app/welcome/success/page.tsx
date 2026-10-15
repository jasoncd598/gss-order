import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { getStripe } from '../../lib/stripe';
import { PLANS, billingPortalUrl, syncSubscriptionCheckout } from '../../lib/billing';
import { formatDate } from '../../lib/utils';

export const metadata: Metadata = { title: 'Welcome aboard | GSS Order Portal' };

/**
 * Stripe Checkout returns here after a plan sign-up. The subscription is
 * recorded now (the webhook does the same, idempotently) so it shows at once.
 */
export default async function SubscriptionSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  // Always render at request time: the Stripe SDK reads the clock, which can't happen during prerendering
  await connection();
  const { session_id: sessionId } = await searchParams;

  let result: { planName: string; email: string | null; trialEnd: string | null } | null = null;
  if (sessionId?.startsWith('cs_')) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.mode === 'subscription' && session.status === 'complete') {
        const synced = await syncSubscriptionCheckout(session);
        result = {
          planName: PLANS.find((p) => p.id === synced?.plan)?.name ?? 'your',
          email:    session.customer_details?.email ?? null,
          trialEnd: synced?.trialEnd ?? null,
        };
      }
    } catch (err) {
      console.error('Subscription success page:', (err as Error).message);
    }
  }
  const portalUrl = billingPortalUrl();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-10 text-center shadow-2xl">
        {result ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="mt-6 text-2xl font-black">You&apos;re on the {result.planName} plan</h1>
            <p className="mt-3 text-zinc-400 text-sm">
              {result.trialEnd ? <>Your free trial runs until <span className="text-white font-semibold">{formatDate(result.trialEnd)}</span>. You won&apos;t be charged before then.</> : 'Your subscription is active.'}
              {result.email && <> A receipt and confirmation will go to <span className="text-white font-semibold">{result.email}</span>.</>}
            </p>
            <div className="mt-6 text-left bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 text-sm">
              <p className="font-bold text-white mb-3">What happens next</p>
              <ol className="space-y-2 text-zinc-400 list-decimal list-inside">
                <li>We set up your portal and email your admin login within 1 business day.</li>
                <li>Add your customer companies, prices and artwork.</li>
                <li>Invite your customers — they can start reordering straight away.</li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="mt-6 text-2xl font-black">We couldn&apos;t find that sign-up</h1>
            <p className="mt-3 text-zinc-400 text-sm">If you completed checkout, your subscription is still being set up — check your email for Stripe&apos;s confirmation, or contact us.</p>
          </>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {portalUrl && result && (
            <a href={portalUrl} className="inline-flex items-center justify-center border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-semibold px-5 py-2.5 rounded-lg text-sm">Manage billing</a>
          )}
          <Link href="/welcome" className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">
            Back to home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
