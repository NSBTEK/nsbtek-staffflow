create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid null references public.profiles(id) on delete set null,
  entity_type text,
  entity_id uuid,
  category text,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  extracted_text text,
  parsed_json jsonb,
  error_message text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_id uuid not null references public.integration_providers(id) on delete cascade,
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  settings jsonb not null default '{}'::jsonb,
  secret_refs jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider_id)
);

create table if not exists public.request_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_email text not null,
  requester_name text,
  module_key text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_billing_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  placement_id uuid null references public.placements(id) on delete set null,
  invoice_number text,
  invoice_date date,
  due_date date,
  amount numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),
  notes text,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
