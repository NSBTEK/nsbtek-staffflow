create table if not exists public.role_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.role_group_permissions (
  id uuid primary key default gen_random_uuid(),
  role_group_id uuid not null references public.role_groups(id) on delete cascade,
  module_key text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  unique (role_group_id, module_key)
);

create table if not exists public.profile_role_groups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_group_id uuid not null references public.role_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, role_group_id)
);
