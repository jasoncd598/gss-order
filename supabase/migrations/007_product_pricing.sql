-- 007: Staff-managed product pricing.
--
-- A fixed unit price (and minimum order quantity) per company per plate.
-- Keyed on plate_ref, not an artwork version, so a new proof version keeps
-- its price. When a plate has no fixed price, ordering falls back to the price
-- of its most recent order line (the original behaviour).
-- Idempotent: safe to run more than once.

-- ─── 1. Table ────────────────────────────────────────────────────────────────

create table if not exists public.product_prices (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  plate_ref    text not null,
  product_name text not null,
  sku_id       text,
  unit_price   numeric(12,4) not null check (unit_price > 0),
  min_quantity int not null default 1 check (min_quantity >= 1),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id) on delete set null,
  unique (company_id, plate_ref)
);

alter table public.product_prices enable row level security;

drop policy if exists product_prices_select       on public.product_prices;
drop policy if exists product_prices_staff_insert on public.product_prices;
drop policy if exists product_prices_staff_update on public.product_prices;
drop policy if exists product_prices_staff_delete on public.product_prices;
-- Customers see their own company's prices; only staff can change them
create policy product_prices_select       on public.product_prices for select
  using (company_id = public.my_company_id() or public.is_staff());
create policy product_prices_staff_insert on public.product_prices for insert with check (public.is_staff());
create policy product_prices_staff_update on public.product_prices for update using (public.is_staff()) with check (public.is_staff());
create policy product_prices_staff_delete on public.product_prices for delete using (public.is_staff());

-- ─── 2. Catalog: fixed price first, then last order price ───────────────────

-- Return columns change, so the function must be dropped first
drop function if exists public.get_catalog();
create function public.get_catalog()
returns table (
  artwork_id uuid, name text, plate_ref text, version text, status text,
  dimensions text, substrate text, color_profile text, preview_url text,
  storage_path text, mime_type text,
  sku_id text, product_name text, unit_price numeric, last_quantity int, last_ordered date,
  min_quantity int
)
language sql stable security definer set search_path = public as $$
  select a.id, a.name, a.plate_ref, a.version, a.status,
         a.dimensions, a.substrate, a.color_profile, a.preview_url,
         a.storage_path, a.mime_type,
         coalesce(pp.sku_id, li.sku_id),
         coalesce(pp.product_name, li.product_name),
         coalesce(pp.unit_price, li.unit_price),
         li.quantity, li.date,
         pp.min_quantity
  from public.artwork_files a
  left join public.product_prices pp
    on pp.company_id = a.company_id and pp.plate_ref = a.plate_ref
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

revoke all on function public.get_catalog() from public, anon;
grant execute on function public.get_catalog() to authenticated;

-- ─── 3. place_order: same pricing rule, enforce minimum quantity ────────────

create or replace function public.place_order(p_items jsonb, p_po_ref text default null, p_notes text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.my_company_id();
  v_order   public.orders;
  v_item    jsonb;
  v_plate   text;
  v_qty     int;
  v_art     record;
  v_price   record;
  v_line    record;
begin
  if not public.can_order() then
    raise exception 'Your account is not permitted to place orders';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  insert into public.orders (company_id, created_by, ref, date, status, total, purchase_order_ref, notes)
  values (v_company, auth.uid(),
          -- gen_random_uuid() is built in; uuid-ossp lives in a schema not on this search_path
          'ORD-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
          current_date, 'Pending Approval', 0,
          nullif(trim(p_po_ref), ''), nullif(trim(p_notes), ''))
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_plate := v_item->>'plate_ref';
    v_qty   := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'Invalid quantity'; end if;

    select name, dimensions, substrate into v_art
    from public.artwork_files
    where company_id = v_company and plate_ref = v_plate and status = 'Approved'
    order by uploaded_at desc nulls last
    limit 1;
    if not found then
      raise exception 'Artwork % is not approved for ordering', v_plate;
    end if;

    select * into v_price from public.product_prices
    where company_id = v_company and plate_ref = v_plate;

    if found then
      if v_qty < v_price.min_quantity then
        raise exception 'Minimum order for % is % units', v_price.product_name, v_price.min_quantity;
      end if;
      insert into public.order_items (order_id, sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total)
      values (v_order.id, v_price.sku_id, v_price.product_name, v_art.dimensions, v_art.substrate,
              v_plate, v_qty, v_price.unit_price, round(v_qty * v_price.unit_price, 2));
    else
      select oi.sku_id, oi.product_name, oi.dimensions, oi.substrate, oi.unit_price into v_line
      from public.order_items oi join public.orders o on o.id = oi.order_id
      where o.company_id = v_company and oi.plate_ref = v_plate and o.status <> 'Cancelled'
        and o.id <> v_order.id
      order by o.date desc, o.created_at desc
      limit 1;

      if v_line.unit_price is null then
        raise exception 'No price on file for % — please request a quote', v_plate;
      end if;

      insert into public.order_items (order_id, sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total)
      values (v_order.id, v_line.sku_id, v_line.product_name, v_line.dimensions, v_line.substrate,
              v_plate, v_qty, v_line.unit_price, round(v_qty * v_line.unit_price, 2));
    end if;
  end loop;

  update public.orders
  set total = (select coalesce(sum(line_total), 0) from public.order_items where order_id = v_order.id)
  where id = v_order.id
  returning * into v_order;

  return v_order;
end $$;
