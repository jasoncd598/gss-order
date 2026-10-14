-- 005: Card payments for orders via Stripe Checkout.
--
-- Payment state lives on the order. Only the server (service role, from the
-- Stripe webhook / checkout return page) or staff can change it — customers
-- still have no UPDATE policy on orders. Idempotent: safe to run more than once.

-- ─── 1. Payment columns ──────────────────────────────────────────────────────

alter table public.orders add column if not exists payment_status             text not null default 'Unpaid';
alter table public.orders add column if not exists amount_paid                numeric;
alter table public.orders add column if not exists paid_at                    timestamptz;
alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists stripe_payment_intent_id   text;

-- Unpaid → (Processing, for delayed methods such as bank debits) → Paid
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('Unpaid', 'Processing', 'Paid'));

create index if not exists orders_stripe_session_idx on public.orders (stripe_checkout_session_id);

-- ─── 2. Notifications ────────────────────────────────────────────────────────

create or replace function public.on_order_payment_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company text;
begin
  if new.payment_status = 'Paid' then
    select name into v_company from public.companies where id = new.company_id;
    perform public.notify_staff('order', 'Payment received ' || new.ref,
      coalesce(v_company, 'A customer') || ' paid ' || to_char(coalesce(new.amount_paid, new.total), 'FM$999,999,990.00') || ' by card.',
      '/order/' || new.id);
    perform public.notify_company(new.company_id, array['Admin','Procurement Manager','Finance'], 'order',
      'Payment received for ' || new.ref, 'Thank you — your card payment has been received.', '/order/' || new.id);
  elsif old.payment_status = 'Processing' and new.payment_status = 'Unpaid' then
    perform public.notify_company(new.company_id, array['Admin','Procurement Manager','Finance'], 'order',
      'Payment failed for ' || new.ref, 'Your payment did not go through. Please try again from the order page.', '/order/' || new.id);
  end if;
  return new;
end $$;

drop trigger if exists order_payment_events on public.orders;
create trigger order_payment_events after update of payment_status on public.orders
  for each row when (new.payment_status is distinct from old.payment_status)
  execute function public.on_order_payment_event();
