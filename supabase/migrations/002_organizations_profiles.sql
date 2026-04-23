create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  timezone text not null default 'America/New_York',
  currency_code text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email text not null,
  full_name text,
  role text not null default 'employee' check (role in ('platform_admin', 'company_admin', 'manager', 'employee')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  manager_id uuid null references public.profiles(id) on delete set null,
  phone text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, flag_key)
);

create table if not exists public.tenant_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  brand_name text,
  support_email text,
  logo_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
