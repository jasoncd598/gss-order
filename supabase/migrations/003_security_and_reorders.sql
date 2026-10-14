-- ════════════════════════════════════════════════════════════════════════════
-- 003 — Data separation, role enforcement, reorder workflow
--
-- Authoritative security layer for the portal. Idempotent: drops and recreates
-- every policy on the tables it manages, so it can be re-run safely.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Columns ───────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists is_staff   boolean not null default false;
alter table public.profiles add column if not exists company_id uuid references public.companies(id);
alter table public.profiles add column if not exists email      text;

-- Existing users without a status would otherwise lose ordering rights
update public.profiles set status = 'Active' where status is null;

-- Backfill emails for existing users (team page shows them)
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Order line items need a stable id so reorders can reference them
alter table public.order_items add column if not exists id uuid default uuid_generate_v4();

-- Staff-only workflow metadata on orders
alter table public.orders add column if not exists source_reorder_id uuid;
alter table public.orders add column if not exists status_updated_at timestamptz;

-- ─── 2. Helper functions ─────────────────────────────────────────────────────
-- SECURITY DEFINER so policies can read the caller's profile without
-- recursing into profiles' own RLS.

create or replace function public.my_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'Active'
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_staff from public.profiles where id = auth.uid()), false)
$$;

-- Roles allowed to place orders / reorders on behalf of their company
create or replace function public.can_order()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() in ('Admin', 'Procurement Manager')
     and exists (
       select 1 from public.companies c
       where c.id = public.my_company_id() and c.status = 'Active'
     )
$$;

-- ─── 3. Reset policies on managed tables ─────────────────────────────────────

do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('companies','profiles','orders','order_items','artwork_files','reorder_requests')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.companies     enable row level security;
alter table public.profiles      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.artwork_files enable row level security;

-- ─── 4. companies ─────────────────────────────────────────────────────────────

create policy companies_select on public.companies for select
  using (id = public.my_company_id() or public.is_staff());

create policy companies_staff_write on public.companies for all
  using (public.is_staff()) with check (public.is_staff());

-- ─── 5. profiles ──────────────────────────────────────────────────────────────

create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or (company_id is not null and company_id = public.my_company_id())
    or public.is_staff()
  );

-- Users edit themselves; company Admins edit their own company's users.
-- Which *columns* may change is enforced by the trigger below.
create policy profiles_update on public.profiles for update
  using (
    id = auth.uid()
    or (public.my_role() = 'Admin' and company_id = public.my_company_id())
    or public.is_staff()
  );

-- No client inserts/deletes: rows are created by the signup trigger.

create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Trusted contexts (SQL editor, service role, signup trigger) are unrestricted
  if auth.uid() is null or auth.role() = 'service_role' or public.is_staff() then
    return new;
  end if;

  if new.is_staff is distinct from old.is_staff
     or new.company_id is distinct from old.company_id
     or new.id is distinct from old.id
     or new.email is distinct from old.email then
    raise exception 'Not permitted to change these profile fields';
  end if;

  if (new.role is distinct from old.role or new.status is distinct from old.status) then
    if not (public.my_role() = 'Admin' and old.company_id = public.my_company_id()) then
      raise exception 'Only a company admin can change roles or user status';
    end if;
    if old.id = auth.uid() then
      raise exception 'Admins cannot change their own role or status';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ─── 6. orders / order_items ──────────────────────────────────────────────────

create policy orders_select on public.orders for select
  using (company_id = public.my_company_id() or public.is_staff());

create policy orders_insert on public.orders for insert
  with check (
    company_id = public.my_company_id()
    and created_by = auth.uid()
    and status = 'Pending Approval'
    and public.can_order()
  );

create policy orders_staff_update on public.orders for update
  using (public.is_staff()) with check (public.is_staff());

create policy orders_staff_delete on public.orders for delete
  using (public.is_staff());

create policy order_items_select on public.order_items for select
  using (
    exists (select 1 from public.orders o
            where o.id = order_id
              and (o.company_id = public.my_company_id() or public.is_staff()))
  );

-- Customers may only add lines to their own freshly-placed, unapproved order
create policy order_items_insert on public.order_items for insert
  with check (
    exists (select 1 from public.orders o
            where o.id = order_id
              and o.company_id = public.my_company_id()
              and o.created_by = auth.uid()
              and o.status = 'Pending Approval')
    or public.is_staff()
  );

create policy order_items_staff_write on public.order_items for update
  using (public.is_staff()) with check (public.is_staff());

create policy order_items_staff_delete on public.order_items for delete
  using (public.is_staff());

-- ─── 7. artwork_files ─────────────────────────────────────────────────────────

create policy artwork_select on public.artwork_files for select
  using (company_id = public.my_company_id() or public.is_staff());

create policy artwork_staff_write on public.artwork_files for all
  using (public.is_staff()) with check (public.is_staff());

-- ─── 8. Signup: new user → new company, user becomes its Admin ───────────────
-- Privileges are never taken from client-supplied metadata: the registrant is
-- Admin of the company they just created, is_staff is always false, and the
-- company starts 'Pending' until staff activate it.

create or replace function public.handle_new_user_with_company()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_company_id uuid;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.companies (name, abn, industry, address, contact_phone, status)
  values (
    coalesce(nullif(meta->>'company_name', ''), 'Unnamed Company'),
    meta->>'abn',
    meta->>'industry',
    meta->>'address',
    meta->>'phone',
    'Pending'
  )
  returning id into new_company_id;

  insert into public.profiles (id, first_name, last_name, email, role, status, is_staff, company_id)
  values (
    new.id,
    meta->>'first_name',
    meta->>'last_name',
    new.email,
    'Admin',
    'Active',
    false,
    new_company_id
  )
  on conflict (id) do update set
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name  = coalesce(public.profiles.last_name,  excluded.last_name),
    email      = excluded.email,
    company_id = coalesce(public.profiles.company_id, excluded.company_id),
    role       = 'Admin',
    is_staff   = false;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_with_company();

-- ─── 9. Reorder requests ──────────────────────────────────────────────────────

create table if not exists public.reorder_requests (
  id                uuid primary key default uuid_generate_v4(),
  ref               text not null unique,
  company_id        uuid not null references public.companies(id) on delete cascade,
  source_order_id   uuid not null references public.orders(id),
  requested_by      uuid not null references public.profiles(id),
  status            text not null default 'Pending'
                      check (status in ('Pending','Approved','Rejected','Cancelled')),
  -- Snapshot of requested lines: [{order_item_id, sku_id, product_name, dimensions,
  -- substrate, plate_ref, quantity, unit_price, line_total}]
  items             jsonb not null,
  total             numeric not null,
  po_ref            text,
  notes             text,
  created_order_id  uuid references public.orders(id),
  reviewed_by       uuid references public.profiles(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now()
);

create index if not exists reorder_requests_company_idx on public.reorder_requests (company_id, created_at desc);
create index if not exists reorder_requests_status_idx  on public.reorder_requests (status);

alter table public.reorder_requests enable row level security;

create policy reorder_select on public.reorder_requests for select
  using (company_id = public.my_company_id() or public.is_staff());

-- All writes go through the functions below (prices are read server-side,
-- never trusted from the client).

create sequence if not exists public.reorder_ref_seq;

-- Customer: request a repeat of a previous order with new quantities.
-- p_quantities: {"<order_item_id>": <qty>, ...}; lines with qty 0 are dropped.
create or replace function public.create_reorder_request(
  p_source_order_id uuid,
  p_quantities      jsonb,
  p_po_ref          text default null,
  p_notes           text default null
) returns public.reorder_requests
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.my_company_id();
  v_items   jsonb;
  v_total   numeric;
  v_row     public.reorder_requests;
begin
  if not public.can_order() then
    raise exception 'Your account is not permitted to place reorders';
  end if;

  if not exists (select 1 from public.orders
                 where id = p_source_order_id and company_id = v_company) then
    raise exception 'Order not found';
  end if;

  select
    coalesce(jsonb_agg(jsonb_build_object(
      'order_item_id', oi.id,
      'sku_id',        oi.sku_id,
      'product_name',  oi.product_name,
      'dimensions',    oi.dimensions,
      'substrate',     oi.substrate,
      'plate_ref',     oi.plate_ref,
      'quantity',      q.qty,
      'unit_price',    oi.unit_price,
      'line_total',    round(q.qty * oi.unit_price, 2)
    )), '[]'::jsonb),
    coalesce(sum(round(q.qty * oi.unit_price, 2)), 0)
  into v_items, v_total
  from public.order_items oi
  cross join lateral (select (p_quantities->>oi.id::text)::int as qty) q
  where oi.order_id = p_source_order_id
    and q.qty is not null and q.qty > 0;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'Choose a quantity for at least one item';
  end if;

  insert into public.reorder_requests
    (ref, company_id, source_order_id, requested_by, items, total, po_ref, notes)
  values (
    'RRQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.reorder_ref_seq')::text, 4, '0'),
    v_company, p_source_order_id, auth.uid(), v_items, v_total,
    nullif(trim(p_po_ref), ''), nullif(trim(p_notes), '')
  )
  returning * into v_row;

  return v_row;
end $$;

-- Staff: approve → creates a real order (+ lines) atomically.
create or replace function public.approve_reorder_request(p_request_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_req      public.reorder_requests;
  v_order_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Staff only';
  end if;

  select * into v_req from public.reorder_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'Request not found'; end if;
  if v_req.status <> 'Pending' then raise exception 'Request is already %', v_req.status; end if;

  insert into public.orders
    (company_id, created_by, ref, date, status, total, purchase_order_ref, notes, source_reorder_id, status_updated_at)
  values (
    v_req.company_id, v_req.requested_by,
    'ORD-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(v_req.id::text, '-', ''), 1, 6)),
    current_date, 'In Production', v_req.total, v_req.po_ref, v_req.notes, v_req.id, now()
  )
  returning id into v_order_id;

  insert into public.order_items
    (order_id, sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total)
  select v_order_id, i->>'sku_id', i->>'product_name', i->>'dimensions', i->>'substrate', i->>'plate_ref',
         (i->>'quantity')::int, (i->>'unit_price')::numeric, (i->>'line_total')::numeric
  from jsonb_array_elements(v_req.items) i;

  update public.reorder_requests
  set status = 'Approved', created_order_id = v_order_id,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;

  return v_order_id;
end $$;

-- Staff: reject with a reason. Requester (or their company admin): cancel while pending.
create or replace function public.close_reorder_request(
  p_request_id uuid,
  p_status     text,
  p_reason     text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_req public.reorder_requests;
begin
  select * into v_req from public.reorder_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'Request not found'; end if;
  if v_req.status <> 'Pending' then raise exception 'Request is already %', v_req.status; end if;

  if p_status = 'Rejected' and not public.is_staff() then
    raise exception 'Staff only';
  elsif p_status = 'Cancelled' and not (
        public.is_staff()
        or v_req.requested_by = auth.uid()
        or (public.my_role() = 'Admin' and v_req.company_id = public.my_company_id())) then
    raise exception 'Not permitted';
  elsif p_status not in ('Rejected', 'Cancelled') then
    raise exception 'Invalid status';
  end if;

  update public.reorder_requests
  set status = p_status, rejection_reason = nullif(trim(p_reason), ''),
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;
end $$;

revoke all on function public.create_reorder_request(uuid, jsonb, text, text) from public, anon;
revoke all on function public.approve_reorder_request(uuid)                   from public, anon;
revoke all on function public.close_reorder_request(uuid, text, text)         from public, anon;
grant execute on function public.create_reorder_request(uuid, jsonb, text, text) to authenticated;
grant execute on function public.approve_reorder_request(uuid)                   to authenticated;
grant execute on function public.close_reorder_request(uuid, text, text)         to authenticated;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Make a staff user:   update public.profiles set is_staff = true where email = 'you@example.com';
-- Activate a company:  update public.companies set status = 'Active' where name = '...';
