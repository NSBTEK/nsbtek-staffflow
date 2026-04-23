import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listAuditLogs() {
  return unwrap(
    await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100)
  );
}
