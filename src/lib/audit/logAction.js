37.1 Create src/lib/audit/logAction.js
import { supabase } from "@/lib/supabaseClient";

export async function logAction(input) {
  const { error } = await supabase.from("audit_logs").insert({
    organization_id: input.organization_id,
    actor_user_id: input.actor_user_id,
    module: input.module,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}
