create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select role = 'platform_admin' from public.profiles where id = auth.uid() limit 1), false);
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select role in ('company_admin', 'platform_admin') from public.profiles where id = auth.uid() limit 1), false);
$$;

create or replace function public.same_org(org_id uuid)
returns boolean
language sql
stable
as $$
  select org_id = public.current_org_id();
$$;

create or replace function public.can_access_employee(target_profile_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and p.organization_id = public.current_org_id()
      and (
        target_profile_id = auth.uid()
        or public.current_role() in ('company_admin', 'platform_admin')
        or p.manager_id = auth.uid()
      )
  );
$$;
