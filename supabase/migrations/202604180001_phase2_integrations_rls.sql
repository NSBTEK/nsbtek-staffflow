create or replace function public.current_user_org_id()
returns uuid
language sql
stable
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

drop policy if exists "integration_providers_select_all_auth" on public.integration_providers;
create policy "integration_providers_select_all_auth"
on public.integration_providers
for select
to authenticated
using (true);

drop policy if exists "integration_connections_select_org" on public.integration_connections;
create policy "integration_connections_select_org"
on public.integration_connections
for select
to authenticated
using (organization_id = public.current_user_org_id());

drop policy if exists "integration_connections_insert_admin" on public.integration_connections;
create policy "integration_connections_insert_admin"
on public.integration_connections
for insert
to authenticated
with check (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "integration_connections_update_admin" on public.integration_connections;
create policy "integration_connections_update_admin"
on public.integration_connections
for update
to authenticated
using (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
)
with check (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "integration_connections_delete_admin" on public.integration_connections;
create policy "integration_connections_delete_admin"
on public.integration_connections
for delete
to authenticated
using (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "integration_credentials_select_admin_org" on public.integration_credentials;
create policy "integration_credentials_select_admin_org"
on public.integration_credentials
for select
to authenticated
using (
  exists (
    select 1
    from public.integration_connections c
    where c.id = connection_id
      and c.organization_id = public.current_user_org_id()
      and public.current_user_role() = 'admin'
  )
);

drop policy if exists "integration_credentials_write_admin_org" on public.integration_credentials;
create policy "integration_credentials_write_admin_org"
on public.integration_credentials
for all
to authenticated
using (
  exists (
    select 1
    from public.integration_connections c
    where c.id = connection_id
      and c.organization_id = public.current_user_org_id()
      and public.current_user_role() = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.integration_connections c
    where c.id = connection_id
      and c.organization_id = public.current_user_org_id()
      and public.current_user_role() = 'admin'
  )
);

drop policy if exists "external_jobs_select_org" on public.external_jobs;
create policy "external_jobs_select_org"
on public.external_jobs
for select
to authenticated
using (organization_id = public.current_user_org_id());

drop policy if exists "external_jobs_write_admin_org" on public.external_jobs;
create policy "external_jobs_write_admin_org"
on public.external_jobs
for all
to authenticated
using (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
)
with check (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "integration_webhook_events_select_admin_org" on public.integration_webhook_events;
create policy "integration_webhook_events_select_admin_org"
on public.integration_webhook_events
for select
to authenticated
using (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "external_applicants_select_org" on public.external_applicants;
create policy "external_applicants_select_org"
on public.external_applicants
for select
to authenticated
using (organization_id = public.current_user_org_id());

drop policy if exists "external_applicants_write_admin_org" on public.external_applicants;
create policy "external_applicants_write_admin_org"
on public.external_applicants
for all
to authenticated
using (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
)
with check (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);

drop policy if exists "external_candidate_links_select_org" on public.external_candidate_links;
create policy "external_candidate_links_select_org"
on public.external_candidate_links
for select
to authenticated
using (organization_id = public.current_user_org_id());

drop policy if exists "external_candidate_links_write_admin_org" on public.external_candidate_links;
create policy "external_candidate_links_write_admin_org"
on public.external_candidate_links
for all
to authenticated
using (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
)
with check (
  organization_id = public.current_user_org_id()
  and public.current_user_role() = 'admin'
);