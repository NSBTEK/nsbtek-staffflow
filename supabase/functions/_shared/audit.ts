export async function writeAuditLog(adminClient: any, input: {
  organization_id?: string | null;
  actor_user_id?: string | null;
  module: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await adminClient.from("audit_logs").insert({
    organization_id: input.organization_id ?? null,
    actor_user_id: input.actor_user_id ?? null,
    module: input.module,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    metadata: input.metadata ?? {},
  });
}
