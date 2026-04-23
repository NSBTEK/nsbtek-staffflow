create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_role_groups_org on public.role_groups(organization_id);
create index if not exists idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);

create index if not exists idx_clients_org on public.clients(organization_id);
create index if not exists idx_contacts_org on public.contacts(organization_id);
create index if not exists idx_jobs_org on public.jobs(organization_id);
create index if not exists idx_candidates_org on public.candidates(organization_id);
create index if not exists idx_submissions_org on public.submissions(organization_id);
create index if not exists idx_interviews_org on public.interviews(organization_id);
create index if not exists idx_placements_org on public.placements(organization_id);
create index if not exists idx_activities_org on public.activities(organization_id);

create index if not exists idx_timesheets_org on public.timesheet_headers(organization_id);
create index if not exists idx_expenses_org on public.expenses(organization_id);
create index if not exists idx_contracts_org on public.contracts(organization_id);
create index if not exists idx_onboarding_org on public.onboarding_records(organization_id);
create index if not exists idx_payroll_org on public.payroll_runs(organization_id);

create index if not exists idx_documents_org on public.documents(organization_id);
create index if not exists idx_org_integrations_org on public.organization_integrations(organization_id);
create index if not exists idx_request_access_org on public.request_access_requests(organization_id);
create index if not exists idx_client_billing_org on public.client_billing_records(organization_id);
