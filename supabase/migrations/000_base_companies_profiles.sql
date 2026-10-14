-- ─── Base tables ──────────────────────────────────────────────────────────────
-- companies + profiles were originally created in the Supabase dashboard.
-- This file records their shape so a fresh project can be built from the
-- migrations alone. Safe to run on an existing project (no-ops).

create extension if not exists "uuid-ossp";

create table if not exists public.companies (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  abn            text,
  industry       text,
  address        text,
  contact_phone  text,
  payment_terms  text not null default 'Net 30',
  credit_limit   numeric not null default 0,
  current_owing  numeric not null default 0,
  total_spend    numeric not null default 0,
  status         text not null default 'Pending',
  created_at     timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  role        text not null default 'Viewer',
  status      text not null default 'Active',
  created_at  timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.profiles  enable row level security;
