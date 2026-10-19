import type { Metadata } from 'next';
import Link from 'next/link';
import { BUSINESS } from '../../lib/business';
import { TRIAL_DAYS } from '../../lib/billing';
import { LegalTitle, H2, List, ContactLine } from '../parts';

export const metadata: Metadata = { title: 'Terms of Service · GSS Trade Orders' };

export default function TermsPage() {
  const { name, email, abn } = BUSINESS;
  const contact = <ContactLine email={email} name={name} />;

  return (
    <>
      <LegalTitle title="Terms of Service" updated="19 October 2026" />

      <p>
        These terms apply when you use the GSS Trade Orders portal, which is run by {name}{abn && ` (ABN ${abn})`}{' '}
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using the portal, you agree to them on behalf of
        yourself and the company you represent.
      </p>

      <H2>1. Accounts</H2>
      <List items={[
        'Company accounts are approved by our team before they can place orders.',
        'Your company administrator decides who joins your team and what they can do (Admin, Procurement, Finance or Viewer). Your company is responsible for everything done through its users’ accounts.',
        'Keep your password private, and tell us straight away if you think someone else has used your account. We recommend turning on two-factor sign-in under Account > Security.',
      ]} />

      <H2>2. Orders and pricing</H2>
      <List items={[
        'Prices are in Australian dollars and include GST. The price shown at checkout is set by us for your company and is the price you pay.',
        'An order or reorder request is an offer to buy. It becomes binding when we approve it.',
        'You are responsible for checking and approving proofs. Once you approve a proof, we produce exactly what was approved, so errors in an approved proof are your responsibility.',
        'Delivery dates are estimates. We will keep you informed through the portal if anything changes.',
      ]} />

      <H2>3. Payment</H2>
      <List items={[
        'Prepaid customers pay by card at checkout. Account customers pay within the terms agreed with their company, shown on each invoice.',
        'Card payments are processed by Stripe under its own terms.',
        'We issue a tax invoice for every order.',
      ]} />

      <H2>4. Portal subscriptions</H2>
      <p>
        If you subscribe to a paid plan, it starts with a {TRIAL_DAYS}-day free trial. Your card is first charged when
        the trial ends, then on each renewal until you cancel. You can change or cancel your plan at any time from the
        billing page. Changes are prorated, and a cancellation takes effect at the end of the current billing period.
      </p>

      <H2>5. Your artwork and files</H2>
      <List items={[
        'You keep ownership of the artwork and files you give us. You allow us to store, reproduce and print them to fulfil your orders.',
        'You promise you have the right to use everything you send us and that printing it won’t infringe anyone else’s rights.',
        'Your files are private to your company and our staff.',
      ]} />

      <H2>6. Acceptable use</H2>
      <p>Don&apos;t try to access another company&apos;s information, interfere with the portal or its security,
        upload anything harmful or unlawful, or use automated tools to overload it. We may suspend accounts that do.</p>

      <H2>7. Australian Consumer Law</H2>
      <p>
        Nothing in these terms excludes rights you have under the Australian Consumer Law that can&apos;t be excluded.
        To the extent the law allows, our liability for any problem with goods or the portal is limited to resupplying
        the goods or service, or paying the cost of doing so. We are not liable for indirect loss, such as lost profits.
      </p>

      <H2>8. Availability</H2>
      <p>
        We work to keep the portal running and your information backed up, but we can&apos;t promise it will never be
        interrupted. If it is, you can still order from us directly.
      </p>

      <H2>9. Privacy</H2>
      <p>
        How we handle personal information is explained in our{' '}
        <Link href="/privacy" className="text-amber-800 underline">Privacy Policy</Link>.
      </p>

      <H2>10. Changes and ending your account</H2>
      <p>
        We may update these terms and will tell you about significant changes before they apply. You can close your
        company&apos;s account at any time by asking us. Records we must keep by law, such as tax invoices, are kept for
        the time the law requires.
      </p>

      <H2>11. Contact and governing law</H2>
      <p>
        For questions about these terms, {contact}. These terms are governed by the laws of Australia.
      </p>
    </>
  );
}
