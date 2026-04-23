create table if not exists public.timesheet_headers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  placement_id uuid null references public.placements(id) on delete set null,
  week_start_date date not null,
  week_end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  total_hours numeric not null default 0,
  notes text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  expense_date date not null,
  category text,
  amount numeric not null default 0,
  currency_code text not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  receipt_url text,
  notes text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  candidate_id uuid null references public.candidates(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'expired', 'cancelled')),
  start_date date,
  end_date date,
  document_url text,
  notes text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  candidate_id uuid null references public.candidates(id) on delete set null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'blocked')),
  start_date date,
  completed_at timestamptz,
  notes text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_name text not null,
  pay_period_start date not null,
  pay_period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'cancelled')),
  total_gross numeric not null default 0,
  total_net numeric not null default 0,
  notes text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
