-- Test data for trying card payments end to end. Development / test projects only.
--
-- 1. Sign up in the portal first (/registration) and confirm your email.
-- 2. Put that email below, then run this whole file in the Supabase SQL editor.
--
-- It makes you staff + Admin of your company, approves the company on Prepaid
-- terms, and adds one approved artwork with a price on file ($1.50/unit) so it
-- appears in the Catalog and can be ordered. Safe to run more than once.

do $$
declare
  v_email   text := 'you@example.com';   -- ← your portal login email
  v_user    uuid;
  v_company uuid;
  v_order   uuid;
begin
  select id, company_id into v_user, v_company
  from public.profiles where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'No portal user with email % — sign up in the portal first', v_email;
  end if;

  update public.profiles  set is_staff = true, role = 'Admin', status = 'Active' where id = v_user;
  update public.companies set status = 'Active', payment_terms = 'Prepaid' where id = v_company;

  if not exists (select 1 from public.artwork_files where company_id = v_company and plate_ref = 'PLT-TEST-1') then
    insert into public.artwork_files (company_id, name, plate_ref, version, status, dimensions, substrate, uploaded_by)
    values (v_company, 'Test Shipping Box', 'PLT-TEST-1', 'v1', 'Approved', '300×200×150mm', 'C-flute kraft', 'Seed data');
  end if;

  -- place_order() prices each plate from its most recent order, so add one
  if not exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
                 where o.company_id = v_company and oi.plate_ref = 'PLT-TEST-1') then
    insert into public.orders (company_id, created_by, ref, date, status, total, payment_status)
    values (v_company, v_user, 'ORD-TEST-0001', current_date - 30, 'Delivered', 150, 'Paid')
    returning id into v_order;
    insert into public.order_items (order_id, sku_id, product_name, dimensions, substrate, plate_ref, quantity, unit_price, line_total)
    values (v_order, 'SKU-TEST-1', 'Test Shipping Box', '300×200×150mm', 'C-flute kraft', 'PLT-TEST-1', 100, 1.50, 150);
  end if;
end $$;
