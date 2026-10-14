-- ─── Run this in Supabase SQL Editor ──────────────────────────────────────────

-- 1. Add is_staff to profiles
alter table public.profiles
  add column if not exists is_staff boolean not null default false;

-- 2. Orders table
create table if not exists public.orders (
  id                  uuid primary key default uuid_generate_v4(),
  company_id          uuid references public.companies(id) on delete cascade,
  created_by          uuid references public.profiles(id),
  ref                 text not null,
  date                date not null default current_date,
  status              text not null default 'Pending Approval'
                        check (status in ('Pending Approval','In Production','Quality Check','Dispatched','Delivered','Cancelled')),
  total               numeric not null default 0,
  courier             text,
  tracking_number     text,
  estimated_delivery  date,
  invoice_ref         text,
  purchase_order_ref  text,
  notes               text,
  created_at          timestamptz default now()
);

-- 3. Order items table
create table if not exists public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid references public.orders(id) on delete cascade,
  sku_id        text,
  product_name  text,
  dimensions    text,
  substrate     text,
  plate_ref     text,
  quantity      integer not null,
  unit_price    numeric not null,
  line_total    numeric not null
);

-- 4. Artwork files table
create table if not exists public.artwork_files (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid references public.companies(id) on delete cascade,
  name            text not null,
  plate_ref       text,
  version         text default 'v1',
  status          text default 'Pending Review'
                    check (status in ('Approved','Pending Review','Revision Required','Superseded')),
  dimensions      text,
  substrate       text,
  color_profile   text,
  uploaded_by     text,
  uploaded_at     date default current_date,
  file_size       text,
  preview_url     text
);

-- 5. Row Level Security for new tables
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.artwork_files enable row level security;

-- Users can only see their own company's orders
create policy "Company users see own orders"
  on public.orders for select
  using (
    company_id = (select company_id from public.profiles where id = auth.uid())
  );

create policy "Company users insert own orders"
  on public.orders for insert
  with check (
    company_id = (select company_id from public.profiles where id = auth.uid())
  );

-- Order items follow parent order
create policy "Order items via orders"
  on public.order_items for select
  using (
    order_id in (
      select id from public.orders
      where company_id = (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Order items insert via orders"
  on public.order_items for insert
  with check (
    order_id in (
      select id from public.orders
      where company_id = (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Artwork: company-scoped
create policy "Company users see own artwork"
  on public.artwork_files for select
  using (
    company_id = (select company_id from public.profiles where id = auth.uid())
  );

-- 6. Function: auto-create company + link profile on signup
create or replace function public.handle_new_user_with_company()
returns trigger as $$
declare
  new_company_id uuid;
begin
  -- Create the company row from signup metadata
  insert into public.companies (name, abn, industry, address, contact_phone, status)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Unnamed Company'),
    new.raw_user_meta_data->>'abn',
    new.raw_user_meta_data->>'industry',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'phone',
    'Pending'
  )
  returning id into new_company_id;

  -- Update the profile (already created by handle_new_user trigger)
  update public.profiles
  set
    company_id = new_company_id,
    role = coalesce(new.raw_user_meta_data->>'role', 'Procurement Manager')
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer;

-- Drop old trigger if it exists, replace with new one
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_with_company();

-- 7. Admin RLS policies (staff can see everything)
create policy "Staff see all orders"
  on public.orders for select
  using (
    (select is_staff from public.profiles where id = auth.uid()) = true
  );

create policy "Staff see all companies"
  on public.companies for select
  using (
    (select is_staff from public.profiles where id = auth.uid()) = true
  );

-- To make yourself staff, run this (replace with your user ID from Auth > Users):
-- update public.profiles set is_staff = true where id = 'your-user-uuid-here';
