-- 009 — Security: rate limits, an audit log, and two-factor sign-in for staff.
-- Safe to run more than once.

-- ─── 1. Rate limits ─────────────────────────────────────────────────────────
-- Fixed-window counters. Only the server (service role) touches them; the app
-- calls hit_rate_limit() before sign-up checkouts, payments, invites and orders.
create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  hits         int         not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Returns true while the caller is under the limit (and counts this hit).
create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, w, 1)
    on conflict (key, window_start) do update set hits = r.hits + 1
    returning hits into n;
  -- Housekeeping: now and then, drop windows older than a day
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return n <= p_limit;
end $$;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- ─── 2. Staff need two-factor sign-in ────────────────────────────────────────
-- Staff powers apply only to a session that passed a second factor (aal2).
-- A staff member signed in with just a password is treated as a customer
-- until they complete the code step.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_staff from public.profiles where id = auth.uid()), false)
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

-- ─── 3. Audit log ────────────────────────────────────────────────────────────
-- Who changed what: prices, order and payment statuses, company approval and
-- terms, user roles and access, artwork decisions. Append-only; staff read it.
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,
  actor_email text,
  actor_kind  text not null,           -- 'user' | 'system' (server / Stripe webhook)
  table_name  text not null,
  record_id   text,
  label       text,                    -- what the row is: order ref, plate ref, company or person
  company_id  uuid,
  action      text not null,           -- 'insert' | 'update' | 'delete'
  changes     jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_company_idx on public.audit_log (company_id, at desc);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
revoke update, delete, truncate on public.audit_log from service_role;
grant select on public.audit_log to authenticated;

drop policy if exists "audit_log: staff read" on public.audit_log;
create policy "audit_log: staff read" on public.audit_log
  for select to authenticated using (public.is_staff());

-- Records the listed columns (TG_ARGV) that changed, as {"col": {"from": .., "to": ..}}.
-- On insert / delete, records those columns' values.
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  row jsonb := coalesce(n, o);
  diff jsonb := '{}'::jsonb;
  col text;
  uid uuid := auth.uid();
begin
  foreach col in array tg_argv loop
    if tg_op = 'UPDATE' then
      if (o -> col) is distinct from (n -> col) then
        diff := diff || jsonb_build_object(col, jsonb_build_object('from', o -> col, 'to', n -> col));
      end if;
    elsif row ? col then
      diff := diff || jsonb_build_object(col, row -> col);
    end if;
  end loop;

  if tg_op = 'UPDATE' and diff = '{}'::jsonb then
    return null;  -- nothing we track changed
  end if;

  insert into public.audit_log (actor_id, actor_email, actor_kind, table_name, record_id, label, company_id, action, changes)
  values (
    uid,
    (select email from auth.users where id = uid),
    case when uid is null then 'system' else 'user' end,
    tg_table_name,
    row ->> 'id',
    case tg_table_name
      when 'orders'              then row ->> 'ref'
      when 'product_prices'      then row ->> 'plate_ref'
      when 'companies'           then row ->> 'name'
      when 'profiles'            then coalesce(nullif(trim(concat_ws(' ', row ->> 'first_name', row ->> 'last_name')), ''), row ->> 'email')
      when 'artwork_files'       then concat_ws(' ', row ->> 'plate_ref', row ->> 'version')
      when 'company_invitations' then row ->> 'email'
    end,
    case when tg_table_name = 'companies' then (row ->> 'id')::uuid else (row ->> 'company_id')::uuid end,
    lower(tg_op),
    diff
  );
  return null;
end $$;

drop trigger if exists audit_product_prices on public.product_prices;
create trigger audit_product_prices after insert or update or delete on public.product_prices
  for each row execute function public.audit_row('plate_ref', 'product_name', 'sku_id', 'unit_price', 'min_quantity');

drop trigger if exists audit_orders on public.orders;
create trigger audit_orders after update on public.orders
  for each row execute function public.audit_row('status', 'payment_status', 'amount_paid', 'courier', 'tracking_number', 'estimated_delivery');

drop trigger if exists audit_companies on public.companies;
create trigger audit_companies after update on public.companies
  for each row execute function public.audit_row('name', 'status', 'payment_terms', 'credit_limit', 'abn');

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles
  for each row execute function public.audit_row('role', 'status', 'is_staff', 'company_id');

drop trigger if exists audit_artwork on public.artwork_files;
create trigger audit_artwork after update on public.artwork_files
  for each row execute function public.audit_row('status', 'review_comment');

drop trigger if exists audit_invitations on public.company_invitations;
create trigger audit_invitations after insert or update on public.company_invitations
  for each row execute function public.audit_row('email', 'role', 'status');
