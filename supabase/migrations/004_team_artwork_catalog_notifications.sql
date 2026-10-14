-- ════════════════════════════════════════════════════════════════════════════
-- 004 — Team invitations, artwork storage & proof approval, server-priced
--       cart orders, and event notifications.
--
-- Requires 003. Idempotent: safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Deactivated users lose company access ────────────────────────────────
-- (my_role() already required status = 'Active'; now data visibility does too)

create or replace function public.my_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid() and status = 'Active'
$$;

-- ─── 2. Invitations ───────────────────────────────────────────────────────────

create table if not exists public.company_invitations (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  email        text not null,
  role         text not null check (role in ('Admin','Procurement Manager','Finance','Viewer')),
  token        uuid not null unique default uuid_generate_v4(),
  invited_by   uuid references public.profiles(id),
  status       text not null default 'Pending' check (status in ('Pending','Accepted','Revoked')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_at  timestamptz
);

create index if not exists company_invitations_company_idx on public.company_invitations (company_id, status);

alter table public.company_invitations enable row level security;
drop policy if exists invitations_select on public.company_invitations;
create policy invitations_select on public.company_invitations for select
  using (
    public.is_staff()
    or (company_id = public.my_company_id() and public.my_role() = 'Admin')
  );
-- Writes only through the functions below.

-- Company Admin invites to their own company; staff may invite to any company.
create or replace function public.create_invitation(
  p_email      text,
  p_role       text,
  p_company_id uuid default null
) returns public.company_invitations
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
  v_email   text := lower(trim(p_email));
  v_row     public.company_invitations;
begin
  if public.is_staff() and p_company_id is not null then
    v_company := p_company_id;
  elsif public.my_role() = 'Admin' then
    v_company := public.my_company_id();
  else
    raise exception 'Only company admins can invite users';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address';
  end if;
  if p_role not in ('Admin','Procurement Manager','Finance','Viewer') then
    raise exception 'Invalid role';
  end if;
  if exists (select 1 from public.profiles where lower(email) = v_email) then
    raise exception 'That email already has a portal account';
  end if;

  -- One live invite per email per company
  update public.company_invitations
  set status = 'Revoked'
  where company_id = v_company and lower(email) = v_email and status = 'Pending';

  insert into public.company_invitations (company_id, email, role, invited_by)
  values (v_company, v_email, p_role, auth.uid())
  returning * into v_row;

  return v_row;
end $$;

create or replace function public.revoke_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.company_invitations
  set status = 'Revoked'
  where id = p_id and status = 'Pending'
    and (public.is_staff() or (company_id = public.my_company_id() and public.my_role() = 'Admin'));
  if not found then raise exception 'Invitation not found'; end if;
end $$;

-- Public lookup used by the registration page (token is an unguessable uuid)
create or replace function public.get_invitation(p_token uuid)
returns table (company_name text, email text, role text)
language sql stable security definer set search_path = public as $$
  select c.name, i.email, i.role
  from public.company_invitations i
  join public.companies c on c.id = i.company_id
  where i.token = p_token and i.status = 'Pending' and i.expires_at > now()
$$;

-- Signup: a valid invite token joins the inviting company with the invited
-- role; otherwise the registrant creates a new (Pending) company as its Admin.
create or replace function public.handle_new_user_with_company()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_invite    public.company_invitations;
  v_company   uuid;
  v_role      text;
begin
  if coalesce(meta->>'invite_token', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into v_invite
    from public.company_invitations
    where token = (meta->>'invite_token')::uuid
      and status = 'Pending'
      and expires_at > now()
      and lower(email) = lower(new.email)
    for update;
  end if;

  if v_invite.id is not null then
    v_company := v_invite.company_id;
    v_role    := v_invite.role;
    update public.company_invitations
    set status = 'Accepted', accepted_at = now()
    where id = v_invite.id;
  else
    insert into public.companies (name, abn, industry, address, contact_phone, status)
    values (
      coalesce(nullif(meta->>'company_name', ''), 'Unnamed Company'),
      meta->>'abn', meta->>'industry', meta->>'address', meta->>'phone',
      'Pending'
    )
    returning id into v_company;
    v_role := 'Admin';
  end if;

  insert into public.profiles (id, first_name, last_name, email, role, status, is_staff, company_id)
  values (new.id, meta->>'first_name', meta->>'last_name', new.email, v_role, 'Active', false, v_company)
  on conflict (id) do update set
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name  = coalesce(public.profiles.last_name,  excluded.last_name),
    email      = excluded.email,
    company_id = coalesce(public.profiles.company_id, excluded.company_id),
    role       = excluded.role,
    is_staff   = false;

  if v_invite.id is not null and v_invite.invited_by is not null then
    perform public.notify_user(
      v_invite.invited_by, 'team',
      'Invitation accepted',
      coalesce(nullif(trim(concat_ws(' ', meta->>'first_name', meta->>'last_name')), ''), new.email)
        || ' joined as ' || v_role || '.',
      '/team');
  end if;

  return new;
end $$;

-- ─── 3. Notifications ─────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,   -- order | reorder | artwork | team | account
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_delete on public.notifications;
create policy notifications_select on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete using (user_id = auth.uid());
-- Rows are created only by the trigger functions below.

create or replace function public.notify_user(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link)
$$;

-- p_roles null = every active user of the company
create or replace function public.notify_company(p_company uuid, p_roles text[], p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link
  from public.profiles
  where company_id = p_company and status = 'Active' and not is_staff
    and (p_roles is null or role = any(p_roles))
$$;

create or replace function public.notify_staff(p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link
  from public.profiles where is_staff and status = 'Active'
$$;

revoke all on function public.notify_user(uuid, text, text, text, text)            from public, anon, authenticated;
revoke all on function public.notify_company(uuid, text[], text, text, text, text) from public, anon, authenticated;
revoke all on function public.notify_staff(text, text, text, text)                 from public, anon, authenticated;

-- Orders: new customer order → staff; status change → the customer company
create or replace function public.on_order_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company text;
begin
  if tg_op = 'INSERT' then
    if new.source_reorder_id is null then
      select name into v_company from public.companies where id = new.company_id;
      perform public.notify_staff('order', 'New order ' || new.ref,
        coalesce(v_company, 'A customer') || ' placed an order for review.', '/order/' || new.id);
    end if;
  elsif new.status is distinct from old.status then
    perform public.notify_company(new.company_id, null, 'order',
      'Order ' || new.ref || ' — ' || new.status,
      case new.status
        when 'In Production' then 'Your order is now in production.'
        when 'Quality Check' then 'Your order is in final quality checks.'
        when 'Dispatched'    then 'Your order has been dispatched' || coalesce(' via ' || new.courier, '') || '.'
        when 'Delivered'     then 'Your order has been delivered.'
        when 'Cancelled'     then 'Your order has been cancelled. Contact us if this is unexpected.'
        else 'Order status updated.'
      end,
      '/order/' || new.id);
  end if;
  return new;
end $$;

drop trigger if exists order_events on public.orders;
create trigger order_events after insert or update of status on public.orders
  for each row execute function public.on_order_event();

-- Reorders: new → staff; decided → requester
create or replace function public.on_reorder_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company text;
begin
  if tg_op = 'INSERT' then
    select name into v_company from public.companies where id = new.company_id;
    perform public.notify_staff('reorder', 'Reorder request ' || new.ref,
      coalesce(v_company, 'A customer') || ' requested a reorder.', '/admin/reorders');
  elsif new.status is distinct from old.status and new.status in ('Approved', 'Rejected') then
    perform public.notify_user(new.requested_by, 'reorder',
      'Reorder ' || new.ref || case new.status when 'Approved' then ' approved' else ' declined' end,
      case new.status
        when 'Approved' then 'Production has been scheduled.'
        else coalesce('Reason: ' || new.rejection_reason, 'Contact us for details.')
      end,
      case when new.created_order_id is not null then '/order/' || new.created_order_id else '/order' end);
  end if;
  return new;
end $$;

drop trigger if exists reorder_events on public.reorder_requests;
create trigger reorder_events after insert or update of status on public.reorder_requests
  for each row execute function public.on_reorder_event();

-- Company approved / suspended → its admins
create or replace function public.on_company_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('Active', 'Suspended') then
    perform public.notify_company(new.id, array['Admin'], 'account',
      case new.status when 'Active' then 'Account approved' else 'Account on hold' end,
      case new.status when 'Active' then 'You can now place orders and reorders.'
                      else 'Ordering is paused. Please contact our accounts team.' end,
      '/');
  end if;
  return new;
end $$;

drop trigger if exists company_status_events on public.companies;
create trigger company_status_events after update of status on public.companies
  for each row execute function public.on_company_status();

-- ─── 4. Artwork files + private storage + proof approval ─────────────────────

alter table public.artwork_files add column if not exists storage_path   text;
alter table public.artwork_files add column if not exists file_name      text;
alter table public.artwork_files add column if not exists mime_type      text;
alter table public.artwork_files add column if not exists order_id       uuid references public.orders(id) on delete set null;
alter table public.artwork_files add column if not exists review_comment text;
alter table public.artwork_files add column if not exists reviewed_by    uuid references public.profiles(id);
alter table public.artwork_files add column if not exists reviewed_at    timestamptz;
alter table public.artwork_files add column if not exists created_at     timestamptz not null default now();

-- Proof uploaded → customer approvers; customer decision → staff
create or replace function public.on_artwork_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company text;
begin
  if tg_op = 'INSERT' and new.status = 'Pending Review' then
    perform public.notify_company(new.company_id, array['Admin','Procurement Manager'], 'artwork',
      'Proof ready for review',
      new.name || coalesce(' (' || new.plate_ref || ' ' || new.version || ')', '') || ' is awaiting your approval.',
      '/vault');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status
        and new.reviewed_by is not null and new.reviewed_by is distinct from old.reviewed_by then
    select name into v_company from public.companies where id = new.company_id;
    perform public.notify_staff('artwork',
      case new.status when 'Approved' then 'Proof approved' else 'Changes requested' end,
      coalesce(v_company, 'Customer') || ' · ' || new.name || coalesce(' — ' || new.review_comment, ''),
      '/admin/companies/' || new.company_id);
  end if;
  return new;
end $$;

drop trigger if exists artwork_events on public.artwork_files;
create trigger artwork_events after insert or update of status on public.artwork_files
  for each row execute function public.on_artwork_event();

-- Customer approvers (Admin / Procurement Manager) sign off a pending proof.
create or replace function public.review_artwork(p_id uuid, p_decision text, p_comment text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_art public.artwork_files;
begin
  if p_decision not in ('Approved', 'Revision Required') then raise exception 'Invalid decision'; end if;
  if public.my_role() not in ('Admin', 'Procurement Manager') then
    raise exception 'Only Admins and Procurement Managers can approve proofs';
  end if;

  select * into v_art from public.artwork_files
  where id = p_id and company_id = public.my_company_id() for update;
  if v_art.id is null then raise exception 'Artwork not found'; end if;
  if v_art.status <> 'Pending Review' then raise exception 'This proof is no longer awaiting review'; end if;
  if p_decision = 'Revision Required' and nullif(trim(p_comment), '') is null then
    raise exception 'Describe the changes you need';
  end if;

  -- An approved new version supersedes older approved versions of the same plate
  if p_decision = 'Approved' and v_art.plate_ref is not null then
    update public.artwork_files set status = 'Superseded'
    where company_id = v_art.company_id and plate_ref = v_art.plate_ref
      and status = 'Approved' and id <> v_art.id;
  end if;

  update public.artwork_files
  set status = p_decision, review_comment = nullif(trim(p_comment), ''),
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_id;
end $$;

-- Private bucket, one folder per company: artwork/<company_id>/<file>
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('artwork', 'artwork', false)
    on conflict (id) do nothing;

    drop policy if exists artwork_read  on storage.objects;
    drop policy if exists artwork_write on storage.objects;
    drop policy if exists artwork_update on storage.objects;
    drop policy if exists artwork_delete on storage.objects;

    create policy artwork_read on storage.objects for select
      using (bucket_id = 'artwork'
             and ((storage.foldername(name))[1] = public.my_company_id()::text or public.is_staff()));
    create policy artwork_write  on storage.objects for insert with check (bucket_id = 'artwork' and public.is_staff());
    create policy artwork_update on storage.objects for update using (bucket_id = 'artwork' and public.is_staff());
    create policy artwork_delete on storage.objects for delete using (bucket_id = 'artwork' and public.is_staff());
  end if;
end $$;

-- ─── 5. Cart orders priced in the database ───────────────────────────────────
-- Customers can no longer insert orders directly (that trusted client prices).
-- place_order prices each plate from the company's most recent order of it.

drop policy if exists orders_insert      on public.orders;
drop policy if exists order_items_insert on public.order_items;
drop policy if exists orders_staff_insert      on public.orders;
drop policy if exists order_items_staff_insert on public.order_items;
create policy orders_staff_insert      on public.orders      for insert with check (public.is_staff());
create policy order_items_staff_insert on public.order_items for insert with check (public.is_staff());

-- Catalog = approved artwork + the price/qty of its latest order line
create or replace function public.get_catalog()
returns table (
  artwork_id uuid, name text, plate_ref text, version text, status text,
  dimensions text, substrate text, color_profile text, preview_url text,
  storage_path text, mime_type text,
  sku_id text, product_name text, unit_price numeric, last_quantity int, last_ordered date
)
language sql stable security definer set search_path = public as $$
  select a.id, a.name, a.plate_ref, a.version, a.status,
         a.dimensions, a.substrate, a.color_profile, a.preview_url,
         a.storage_path, a.mime_type,
         li.sku_id, li.product_name, li.unit_price, li.quantity, li.date
  from public.artwork_files a
  left join lateral (
    select oi.sku_id, oi.product_name, oi.unit_price, oi.quantity, o.date
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.company_id = a.company_id and oi.plate_ref = a.plate_ref and o.status <> 'Cancelled'
    order by o.date desc, o.created_at desc
    limit 1
  ) li on true
  where a.company_id = public.my_company_id()
    and a.status in ('Approved', 'Pending Review', 'Revision Required')
  order by a.status = 'Approved' desc, a.name
$$;

-- p_items: [{"plate_ref": "PLT-8812-B", "quantity": 2500}, ...]
create or replace function public.place_order(p_items jsonb, p_po_ref text default null, p_notes text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.my_company_id();
  v_order   public.orders;
  v_item    jsonb;
  v_qty     int;
  v_line    record;
  v_count   int := 0;
begin
  if not public.can_order() then
    raise exception 'Your account is not permitted to place orders';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  insert into public.orders (company_id, created_by, ref, date, status, total, purchase_order_ref, notes)
  values (v_company, auth.uid(),
          'ORD-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
          current_date, 'Pending Approval', 0,
          nullif(trim(p_po_ref), ''), nullif(trim(p_notes), ''))
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'Invalid quantity'; end if;

    if not exists (select 1 from public.artwork_files
                   where company_id = v_company and plate_ref = v_item->>'plate_ref' and status = 'Approved') then
      raise exception 'Artwork % is not approved for ordering', v_item->>'plate_ref';
    end if;

    select oi.sku_id, oi.product_name, oi.dimensions, oi.substrate, oi.unit_price into v_line
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.company_id = v_company and oi.plate_ref = v_item->>'plate_ref' and o.status <> 'Cancelled'
      and o.id <> v_order.id
    order by o.date desc, o.created_at desc
    limit 1;

    if v_line.unit_price is null then
      raise exception 'No price on file for % — please request a quote', v_item->>'plate_ref';
    end if;

    insert into public.order_items (order_id, sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total)
    values (v_order.id, v_line.sku_id, v_line.product_name, v_line.dimensions, v_line.substrate,
            v_item->>'plate_ref', v_qty, v_line.unit_price, round(v_qty * v_line.unit_price, 2));
    v_count := v_count + 1;
  end loop;

  update public.orders
  set total = (select coalesce(sum(line_total), 0) from public.order_items where order_id = v_order.id)
  where id = v_order.id
  returning * into v_order;

  return v_order;
end $$;

-- ─── 6. Grants ────────────────────────────────────────────────────────────────

revoke all on function public.create_invitation(text, text, uuid)       from public, anon;
revoke all on function public.revoke_invitation(uuid)                   from public, anon;
revoke all on function public.review_artwork(uuid, text, text)          from public, anon;
revoke all on function public.get_catalog()                             from public, anon;
revoke all on function public.place_order(jsonb, text, text)            from public, anon;
grant execute on function public.create_invitation(text, text, uuid)    to authenticated;
grant execute on function public.revoke_invitation(uuid)                to authenticated;
grant execute on function public.review_artwork(uuid, text, text)       to authenticated;
grant execute on function public.get_catalog()                          to authenticated;
grant execute on function public.place_order(jsonb, text, text)         to authenticated;
grant execute on function public.get_invitation(uuid)                   to anon, authenticated;
