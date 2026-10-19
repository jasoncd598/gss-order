import type { Metadata } from 'next';
import Link from 'next/link';
import { BUSINESS } from '../../lib/business';
import { LegalTitle, H2, List, ContactLine } from '../parts';

export const metadata: Metadata = { title: 'Privacy Policy · GSS Trade Orders' };

export default function PrivacyPage() {
  const { name, email } = BUSINESS;
  const contact = <ContactLine email={email} name={name} />;

  return (
    <>
      <LegalTitle title="Privacy Policy" updated="19 October 2026" />

      <p>
        This policy explains how {name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles personal information in the GSS
        Trade Orders portal. We follow the Australian Privacy Principles in the <em>Privacy Act 1988</em> (Cth).
      </p>

      <H2>What we collect</H2>
      <List items={[
        <><strong>Account details:</strong> your name, email address, job role and a password (stored only as a one-way hash by our sign-in provider; we can never see it).</>,
        <><strong>Business details:</strong> company name, ABN, address and phone number, entered when a company account is created.</>,
        <><strong>Orders and files:</strong> orders, reorder requests, prices, payment status, artwork, proofs, and documents such as delivery dockets.</>,
        <><strong>Payments:</strong> card payments are handled by Stripe. Card numbers go straight to Stripe and never reach our systems; we keep only Stripe&apos;s reference numbers and whether a payment succeeded.</>,
        <><strong>Security records:</strong> sign-in times, an audit log of important changes (such as price, status and role changes) with who made them, and technical details like IP address, which our hosting providers log to keep the service secure.</>,
      ]} />

      <H2>Why we use it</H2>
      <p>
        To run your account, take and fulfil orders, issue tax invoices, send order and proof notifications by email,
        keep the portal secure and fix faults. We don&apos;t sell personal information, use it for advertising, or
        share it with anyone except the service providers below.
      </p>

      <H2>Cookies</H2>
      <p>
        We use only the cookies needed to keep you signed in. There are no advertising or analytics cookies.
      </p>

      <H2>Who else handles it</H2>
      <p>We use these providers to run the portal. Each one only gets what it needs to do its job:</p>
      <List items={[
        <><strong>Supabase</strong>: database, sign-in and file storage, hosted in <strong>Tokyo, Japan</strong>.</>,
        <><strong>Vercel</strong>: website hosting. Pages are generated in <strong>Tokyo, Japan</strong> and delivered through a worldwide network.</>,
        <><strong>Stripe</strong>: card payments and subscription billing (Australia and the <strong>United States</strong>).</>,
        <><strong>Sentry</strong>: error reports that help us fix faults, which may include the page address and account ID (<strong>United States</strong>).</>,
        <><strong>Our email provider</strong>: sends order and proof notifications.</>,
      ]} />

      <H2>Information stored overseas</H2>
      <p>
        Because of the providers above, your information is stored and processed outside Australia, mainly in Japan
        and the United States. We choose providers that protect information to a standard comparable to the
        Australian Privacy Principles and bind them to that by contract.
      </p>

      <H2>How we protect it</H2>
      <List items={[
        'Information is encrypted in transit (HTTPS) and at rest.',
        'Each company can only see its own orders, prices, files and team. This is enforced by the database itself, not just by the website.',
        'Files are kept in private storage and opened through short-lived links.',
        'Staff accounts must use two-factor sign-in. Every account can turn it on under Account > Security.',
        'Important changes are written to a log that can’t be edited.',
        'Regular backups are kept so information can be recovered after an error.',
      ]} />

      <H2>How long we keep it</H2>
      <p>
        We keep account and order records while your company uses the portal. Tax invoices and payment records are
        kept for at least five years, as Australian tax law requires. When information is no longer needed, we delete
        it or make it anonymous.
      </p>

      <H2>Accessing or correcting your information</H2>
      <p>
        You can see and update your profile under Account in the portal, and company administrators can manage their
        team. To ask for a copy of your information, have it corrected or deleted, or ask a question, {contact}. We
        reply within 30 days.
      </p>

      <H2>Data breaches</H2>
      <p>
        If a breach is likely to cause serious harm, we will tell you and the Office of the Australian Information
        Commissioner, as the Notifiable Data Breaches scheme requires.
      </p>

      <H2>Complaints</H2>
      <p>
        If you&apos;re unhappy with how we&apos;ve handled your information, {contact} first. If we don&apos;t resolve it,
        you can complain to the Office of the Australian Information Commissioner at{' '}
        <a href="https://www.oaic.gov.au" className="text-amber-800 underline">oaic.gov.au</a>.
      </p>

      <p className="pt-4 text-sm text-zinc-600">
        See also our <Link href="/terms" className="text-amber-800 underline">Terms of Service</Link>.
      </p>
    </>
  );
}
