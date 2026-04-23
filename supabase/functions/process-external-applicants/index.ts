import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { json } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return json({ ok: true }, 200, origin);

  try {
    const { profile, adminClient } = await requireUser(req.headers.get("Authorization"));

    if (!["company_admin", "platform_admin"].includes(profile.role)) {
      return json({ error: "Forbidden" }, 403, origin);
    }

    const body = await req.json();
    const { source = "manual-import" } = body;

    await adminClient.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_user_id: profile.id,
      module: "candidates",
      action: "process_external_applicants_requested",
      entity_type: "external_applicant_batch",
      metadata: { source },
    });

    return json({ ok: true, status: "queued", source }, 200, origin);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500, origin);
  }
});
