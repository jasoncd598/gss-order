-- 010 — Order documents: delivery dockets, compliance certificates, signed
-- quotes and other files staff attach to an order. Customers see their own
-- company's; only staff add or remove them. Safe to run more than once.

create table if not exists public.order_documents (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  kind         text not null default 'Other'
                 check (kind in ('Delivery docket','Compliance certificate','Signed quote','Quote','Specification','Other')),
  title        text not null check (length(trim(title)) > 0),
  storage_path text not null unique,
  file_name    text not null,
  mime_type    text,
  file_size    bigint,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists order_documents_order_idx on public.order_documents (order_id, created_at desc);

alter table public.order_documents enable row level security;
drop policy if exists order_documents_select on public.order_documents;
drop policy if exists order_documents_insert on public.order_documents;
drop policy if exists order_documents_delete on public.order_documents;
create policy order_documents_select on public.order_documents for select
  using (company_id = public.my_company_id() or public.is_staff());
create policy order_documents_insert on public.order_documents for insert with check (public.is_staff());
create policy order_documents_delete on public.order_documents for delete using (public.is_staff());
-- No update policy: replace a document by removing it and adding the new file.

-- The company always comes from the order, and the file must sit in that
-- company's folder for that order: documents/<company_id>/<order_id>/<file>
create or replace function public.order_documents_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select company_id into new.company_id from public.orders where id = new.order_id;
  if new.company_id is null then
    raise exception 'Order not found';
  end if;
  if new.storage_path not like new.company_id::text || '/' || new.order_id::text || '/%' then
    raise exception 'File is not in this order''s folder';
  end if;
  new.uploaded_by := coalesce(auth.uid(), new.uploaded_by);
  new.created_at  := now();
  return new;
end $$;
drop trigger if exists order_documents_before_insert on public.order_documents;
create trigger order_documents_before_insert before insert on public.order_documents
  for each row execute function public.order_documents_before_insert();

-- Tell the company's users a document was added
create or replace function public.order_documents_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ref text;
begin
  select ref into v_ref from public.orders where id = new.order_id;
  perform public.notify_company(new.company_id, null, 'order',
    'New document on ' || v_ref, new.kind || ': ' || new.title, '/order/' || new.order_id);
  return null;
end $$;
drop trigger if exists order_documents_notify on public.order_documents;
create trigger order_documents_notify after insert on public.order_documents
  for each row execute function public.order_documents_notify();

-- Audit: adding and removing documents
drop trigger if exists audit_order_documents on public.order_documents;
create trigger audit_order_documents after insert or delete on public.order_documents
  for each row execute function public.audit_row('kind', 'title', 'file_name', 'order_id');

-- Label audit entries for documents with their title (extends 009's audit_row)
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
      when 'order_documents'     then row ->> 'title'
    end,
    case when tg_table_name = 'companies' then (row ->> 'id')::uuid else (row ->> 'company_id')::uuid end,
    lower(tg_op),
    diff
  );
  return null;
end $$;

-- Private bucket, one folder per company (then per order)
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
    on conflict (id) do nothing;

    drop policy if exists documents_read   on storage.objects;
    drop policy if exists documents_write  on storage.objects;
    drop policy if exists documents_delete on storage.objects;

    create policy documents_read on storage.objects for select
      using (bucket_id = 'documents'
             and ((storage.foldername(name))[1] = public.my_company_id()::text or public.is_staff()));
    create policy documents_write  on storage.objects for insert with check (bucket_id = 'documents' and public.is_staff());
    create policy documents_delete on storage.objects for delete using (bucket_id = 'documents' and public.is_staff());
  end if;
end $$;
