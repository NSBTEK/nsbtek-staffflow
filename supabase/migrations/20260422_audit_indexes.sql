create index if not exists idx_audit_logs_org_created_at
  on public.audit_logs (organization_id, created_at desc);

create index if not exists idx_audit_logs_actor_created_at
  on public.audit_logs (actor_user_id, created_at desc);
