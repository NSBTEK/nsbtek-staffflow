create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text not null,
  auth_type text not null default 'oauth',
  supports_job_posting boolean not null default false,
  supports_applicant_sync boolean not null default false,
  supports_resume_sync boolean not null default false,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_providers
  add column if not exists auth_type text not null default 'oauth',
  add column if not exists supports_job_posting boolean not null default false,
  add column if not exists supports_applicant_sync boolean not null default false,
  add column if not exists supports_resume_sync boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider text not null,
  external_company_id text,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

alter table public.integration_connections
  add column if not exists external_company_id text,
  add column if not exists status text not null default 'pending',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'integration_connections_organization_id_provider_key'
  ) then
    alter table public.integration_connections
      add constraint integration_connections_organization_id_provider_key
      unique (organization_id, provider);
  end if;
end $$;

create table if not exists public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  credential_type text not null default 'oauth',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, credential_type)
);

create table if not exists public.external_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null,
  external_job_id text not null,
  internal_job_id uuid references public.jobs(id) on delete set null,
  title text,
  status text not null default 'draft',
  location_text text,
  employment_type text,
  department text,
  posted_at timestamptz,
  closed_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_job_id)
);

create table if not exists public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  provider text not null,
  event_type text,
  external_event_id text,
  signature text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'pending',
  processing_error text,
  unique (provider, external_event_id)
);

create table if not exists public.external_applicants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  provider text not null,
  external_applicant_id text not null,
  external_job_id text,
  internal_job_id uuid references public.jobs(id) on delete set null,
  email text,
  first_name text,
  last_name text,
  phone text,
  location_text text,
  resume_url text,
  source_label text,
  status text not null default 'new',
  raw_payload jsonb not null default '{}'::jsonb,
  synced_candidate_id uuid references public.candidates(id) on delete set null,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_applicant_id)
);

create table if not exists public.external_candidate_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider text not null,
  external_applicant_id text not null,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organization_id, provider, external_applicant_id),
  unique (organization_id, provider, candidate_id, external_applicant_id)
);

drop trigger if exists trg_integration_providers_updated_at on public.integration_providers;
create trigger trg_integration_providers_updated_at
before update on public.integration_providers
for each row execute function public.set_updated_at();

drop trigger if exists trg_integration_connections_updated_at on public.integration_connections;
create trigger trg_integration_connections_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();

drop trigger if exists trg_integration_credentials_updated_at on public.integration_credentials;
create trigger trg_integration_credentials_updated_at
before update on public.integration_credentials
for each row execute function public.set_updated_at();

drop trigger if exists trg_external_jobs_updated_at on public.external_jobs;
create trigger trg_external_jobs_updated_at
before update on public.external_jobs
for each row execute function public.set_updated_at();

drop trigger if exists trg_external_applicants_updated_at on public.external_applicants;
create trigger trg_external_applicants_updated_at
before update on public.external_applicants
for each row execute function public.set_updated_at();

insert into public.integration_providers
  (key, name, category, auth_type, supports_job_posting, supports_applicant_sync, supports_resume_sync, is_active, config)
values
  ('linkedin', 'LinkedIn', 'Job Boards', 'oauth', true, true, true, true, '{"description":"Post jobs, receive applicants, and sync candidate data from LinkedIn workflows."}'::jsonb),
  ('indeed', 'Indeed', 'Job Boards', 'oauth', true, true, true, true, '{"description":"Publish jobs and capture applicants from Indeed into your recruiting pipeline."}'::jsonb),
  ('dice', 'Dice', 'Job Boards', 'api_key', true, true, true, true, '{"description":"Post technology jobs and sync incoming applicants from Dice."}'::jsonb),
  ('ziprecruiter', 'ZipRecruiter', 'Job Boards', 'api_key', true, true, true, true, '{"description":"Distribute roles and bring candidate applications into your ATS."}'::jsonb),
  ('monster', 'Monster', 'Job Boards', 'api_key', true, true, true, true, '{"description":"Connect Monster job posting and applicant capture to your recruiting workflow."}'::jsonb),
  ('careerbuilder', 'CareerBuilder', 'Job Boards', 'api_key', true, true, true, true, '{"description":"Publish open roles and track inbound applications from CareerBuilder."}'::jsonb),
  ('glassdoor', 'Glassdoor', 'Job Boards', 'oauth', false, true, false, true, '{"description":"Support employer-brand-driven job distribution and candidate intake."}'::jsonb),
  ('naukri', 'Naukri', 'Job Boards', 'api_key', true, true, true, true, '{"description":"Sync hiring activity and candidate applications from Naukri."}'::jsonb),
  ('salesforce', 'Salesforce', 'CRM', 'oauth', false, false, false, true, '{"description":"Connect clients, contacts, and business development workflows."}'::jsonb),
  ('hubspot', 'HubSpot', 'CRM', 'oauth', false, false, false, true, '{"description":"Sync client records, contacts, activities, and sales pipeline context."}'::jsonb),
  ('zoho_crm', 'Zoho CRM', 'CRM', 'oauth', false, false, false, true, '{"description":"Link accounts, contacts, and relationship data with CRM workflows."}'::jsonb),
  ('gusto', 'Gusto', 'Payroll / HRIS', 'oauth', false, false, false, true, '{"description":"Sync payroll-related data and employee records."}'::jsonb),
  ('adp', 'ADP', 'Payroll / HRIS', 'oauth', false, false, false, true, '{"description":"Connect payroll and workforce data with ADP."}'::jsonb),
  ('deel', 'Deel', 'Payroll / HRIS', 'oauth', false, false, false, true, '{"description":"Support global workforce onboarding and payroll connectivity."}'::jsonb),
  ('rippling', 'Rippling', 'Payroll / HRIS', 'oauth', false, false, false, true, '{"description":"Connect HR, payroll, and employee lifecycle systems through Rippling."}'::jsonb),
  ('bamboohr', 'BambooHR', 'Payroll / HRIS', 'api_key', false, false, false, true, '{"description":"Sync employee records, HRIS details, and onboarding information."}'::jsonb),
  ('workday', 'Workday', 'Payroll / HRIS', 'oauth', false, false, false, true, '{"description":"Integrate workforce data and enterprise HR processes."}'::jsonb),
  ('google_workspace', 'Google Workspace', 'Productivity', 'oauth', false, false, false, true, '{"description":"Connect calendar, email, and workspace collaboration workflows."}'::jsonb),
  ('microsoft_365', 'Microsoft 365', 'Productivity', 'oauth', false, false, false, true, '{"description":"Integrate Outlook, calendar, Teams, and productivity workflows."}'::jsonb),
  ('slack', 'Slack', 'Productivity', 'oauth', false, false, false, true, '{"description":"Push workflow alerts and recruiting notifications into Slack."}'::jsonb),
  ('zoom', 'Zoom', 'Productivity', 'oauth', false, false, false, true, '{"description":"Coordinate interview links and video meeting workflows."}'::jsonb),
  ('dropbox', 'Dropbox', 'Storage', 'oauth', false, false, false, true, '{"description":"Access and sync files, resumes, and related documents."}'::jsonb),
  ('google_drive', 'Google Drive', 'Storage', 'oauth', false, false, false, true, '{"description":"Store and access resumes, contracts, and working documents."}'::jsonb),
  ('onedrive', 'OneDrive', 'Storage', 'oauth', false, false, false, true, '{"description":"Connect Microsoft cloud storage for recruiting and workforce files."}'::jsonb),
  ('docusign', 'DocuSign', 'Documents', 'oauth', false, false, false, true, '{"description":"Manage offer letters, contracts, and signature workflows."}'::jsonb),
  ('hellosign', 'Dropbox Sign', 'Documents', 'oauth', false, false, false, true, '{"description":"Handle digital signatures for contracts and onboarding paperwork."}'::jsonb),
  ('checkr', 'Checkr', 'Compliance', 'api_key', false, false, false, true, '{"description":"Run background checks and sync status updates."}'::jsonb),
  ('quickbooks', 'QuickBooks', 'Finance', 'oauth', false, false, false, true, '{"description":"Connect invoice, billing, and finance-side records."}'::jsonb),
  ('xero', 'Xero', 'Finance', 'oauth', false, false, false, true, '{"description":"Integrate accounting and billing data with financial workflows."}'::jsonb),
  ('rest_api', 'Custom REST API', 'Custom', 'api_key', false, true, true, true, '{"description":"Connect your own external service through API credentials and webhook mapping."}'::jsonb),
  ('webhook', 'Webhook', 'Custom', 'webhook', false, true, true, true, '{"description":"Receive applicant, workflow, or event data from external systems."}'::jsonb)
on conflict (key) do update
set
  name = excluded.name,
  category = excluded.category,
  auth_type = excluded.auth_type,
  supports_job_posting = excluded.supports_job_posting,
  supports_applicant_sync = excluded.supports_applicant_sync,
  supports_resume_sync = excluded.supports_resume_sync,
  is_active = excluded.is_active,
  config = excluded.config,
  updated_at = now();

alter table public.integration_providers enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.external_jobs enable row level security;
alter table public.integration_webhook_events enable row level security;
alter table public.external_applicants enable row level security;
alter table public.external_candidate_links enable row level security;