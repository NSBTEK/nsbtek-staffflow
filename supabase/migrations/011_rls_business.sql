alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.submissions enable row level security;
alter table public.interviews enable row level security;
alter table public.placements enable row level security;
alter table public.activities enable row level security;
alter table public.timesheet_headers enable row level security;
alter table public.expenses enable row level security;
alter table public.contracts enable row level security;
alter table public.onboarding_records enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.documents enable row level security;
alter table public.organization_integrations enable row level security;
alter table public.request_access_requests enable row level security;
alter table public.client_billing_records enable row level security;

create policy clients_select_same_org on public.clients
for select to authenticated
using (organization_id = public.current_org_id());
create policy clients_manage_admin on public.clients
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy contacts_select_same_org on public.contacts
for select to authenticated
using (organization_id = public.current_org_id());
create policy contacts_manage_admin on public.contacts
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy jobs_select_same_org on public.jobs
for select to authenticated
using (organization_id = public.current_org_id());
create policy jobs_manage_admin on public.jobs
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy candidates_select_same_org on public.candidates
for select to authenticated
using (organization_id = public.current_org_id());
create policy candidates_manage_team on public.candidates
for all to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy submissions_select_same_org on public.submissions
for select to authenticated
using (organization_id = public.current_org_id());
create policy submissions_manage_team on public.submissions
for all to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy interviews_select_same_org on public.interviews
for select to authenticated
using (organization_id = public.current_org_id());
create policy interviews_manage_team on public.interviews
for all to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy placements_select_same_org on public.placements
for select to authenticated
using (organization_id = public.current_org_id());
create policy placements_manage_admin on public.placements
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy activities_select_same_org on public.activities
for select to authenticated
using (organization_id = public.current_org_id());
create policy activities_insert_same_org on public.activities
for insert to authenticated
with check (organization_id = public.current_org_id() and created_by = auth.uid());

create policy timesheets_select_accessible on public.timesheet_headers
for select to authenticated
using (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
);
create policy timesheets_insert_accessible on public.timesheet_headers
for insert to authenticated
with check (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
);
create policy timesheets_update_accessible on public.timesheet_headers
for update to authenticated
using (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
)
with check (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
);

create policy expenses_select_accessible on public.expenses
for select to authenticated
using (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
);
create policy expenses_insert_accessible on public.expenses
for insert to authenticated
with check (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
);
create policy expenses_update_accessible on public.expenses
for update to authenticated
using (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
)
with check (
  organization_id = public.current_org_id()
  and public.can_access_employee(employee_id)
);

create policy contracts_select_same_org on public.contracts
for select to authenticated
using (organization_id = public.current_org_id());
create policy contracts_manage_admin on public.contracts
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy onboarding_select_same_org on public.onboarding_records
for select to authenticated
using (organization_id = public.current_org_id());
create policy onboarding_manage_team on public.onboarding_records
for all to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy payroll_select_admin on public.payroll_runs
for select to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin());
create policy payroll_manage_admin on public.payroll_runs
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy documents_select_same_org on public.documents
for select to authenticated
using (organization_id = public.current_org_id());
create policy documents_insert_same_org on public.documents
for insert to authenticated
with check (organization_id = public.current_org_id());
create policy documents_update_same_org on public.documents
for update to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy org_integrations_select_same_org on public.organization_integrations
for select to authenticated
using (organization_id = public.current_org_id());
create policy org_integrations_manage_admin on public.organization_integrations
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy request_access_select_same_org on public.request_access_requests
for select to authenticated
using (organization_id = public.current_org_id());
create policy request_access_insert_same_org on public.request_access_requests
for insert to authenticated
with check (organization_id = public.current_org_id());
create policy request_access_update_admin on public.request_access_requests
for update to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());

create policy client_billing_select_admin on public.client_billing_records
for select to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin());
create policy client_billing_manage_admin on public.client_billing_records
for all to authenticated
using (organization_id = public.current_org_id() and public.is_company_admin())
with check (organization_id = public.current_org_id() and public.is_company_admin());
