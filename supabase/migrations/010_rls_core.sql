alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.feature_flags enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.role_groups enable row level security;
alter table public.role_group_permissions enable row level security;
alter table public.profile_role_groups enable row level security;
alter table public.audit_logs enable row level security;

create policy organizations_select_same_org
on public.organizations
for select
to authenticated
using (
  id = public.current_org_id() or public.is_platform_admin()
);

create policy profiles_select_same_org
on public.profiles
for select
to authenticated
using (
  organization_id = public.current_org_id()
);

create policy profiles_update_self_or_admin
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or (
    organization_id = public.current_org_id()
    and public.is_company_admin()
  )
)
with check (
  organization_id = public.current_org_id()
);

create policy feature_flags_select_same_org
on public.feature_flags
for select
to authenticated
using (
  organization_id = public.current_org_id()
);

create policy tenant_settings_select_same_org
on public.tenant_settings
for select
to authenticated
using (
  organization_id = public.current_org_id()
);

create policy tenant_settings_update_admin
on public.tenant_settings
for update
to authenticated
using (
  organization_id = public.current_org_id()
  and public.is_company_admin()
)
with check (
  organization_id = public.current_org_id()
);

create policy role_groups_select_same_org
on public.role_groups
for select
to authenticated
using (
  organization_id = public.current_org_id()
);

create policy role_groups_manage_admin
on public.role_groups
for all
to authenticated
using (
  organization_id = public.current_org_id()
  and public.is_company_admin()
)
with check (
  organization_id = public.current_org_id()
  and public.is_company_admin()
);

create policy role_group_permissions_select_same_org
on public.role_group_permissions
for select
to authenticated
using (
  exists (
    select 1 from public.role_groups rg
    where rg.id = role_group_permissions.role_group_id
      and rg.organization_id = public.current_org_id()
  )
);

create policy role_group_permissions_manage_admin
on public.role_group_permissions
for all
to authenticated
using (
  exists (
    select 1 from public.role_groups rg
    where rg.id = role_group_permissions.role_group_id
      and rg.organization_id = public.current_org_id()
      and public.is_company_admin()
  )
)
with check (
  exists (
    select 1 from public.role_groups rg
    where rg.id = role_group_permissions.role_group_id
      and rg.organization_id = public.current_org_id()
      and public.is_company_admin()
  )
);

create policy profile_role_groups_select_same_org
on public.profile_role_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_role_groups.profile_id
      and p.organization_id = public.current_org_id()
  )
);

create policy profile_role_groups_manage_admin
on public.profile_role_groups
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_role_groups.profile_id
      and p.organization_id = public.current_org_id()
      and public.is_company_admin()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_role_groups.profile_id
      and p.organization_id = public.current_org_id()
      and public.is_company_admin()
  )
);

create policy audit_logs_select_same_org
on public.audit_logs
for select
to authenticated
using (
  organization_id = public.current_org_id() or public.is_platform_admin()
);

create policy audit_logs_insert_same_org
on public.audit_logs
for insert
to authenticated
with check (
  organization_id = public.current_org_id() or public.is_platform_admin()
);
