import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function writeAuditLog({
  currentUser,
  moduleKey,
  tableName,
  recordId = null,
  action,
  beforeData = null,
  afterData = null,
  metadata = {},
}) {
  if (!currentUser?.id) return;

  const profile = await getProfileOrThrow(currentUser.id);

  const { error } = await supabase.from("audit_logs").insert({
    organization_id: profile.organization_id,
    module_key: moduleKey,
    table_name: tableName,
    record_id: recordId,
    action,
    actor_user_id: currentUser.id,
    actor_email: currentUser.email || profile.email || null,
    before_data: beforeData,
    after_data: afterData,
    metadata,
  });

  if (error) throw error;
}