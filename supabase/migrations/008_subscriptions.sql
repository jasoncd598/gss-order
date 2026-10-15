-- 008: Paid plans for the portal (Stripe Billing).
--
-- One row per Stripe subscription, kept in sync by the Stripe webhook (and the
-- checkout success page) using the service role. Customers of the portal never
-- read or write this table; staff can read it for the Admin → Subscriptions page.
-- Idempotent: safe to run more than once.

create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  stripe_subscription_id text not null unique,
  stripe_customer_id     text not null,
  email                  text,
  company_name           text,
  plan                   text not null,               -- starter | growth | scale
  billing_interval       text not null,               -- month | year
  status                 text not null,               -- Stripe status: trialing, active, past_due, canceled, …
  cancel_at_period_end   boolean not null default false,
  trial_end              timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_staff_select on public.subscriptions;
-- Read-only for staff; no insert/update/delete policies, so only the service role writes
create policy subscriptions_staff_select on public.subscriptions for select using (public.is_staff());
