import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { json } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200, origin);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { profile, adminClient } = await requireUser(authHeader);

    if (!["company_admin", "platform_admin"].includes(profile.role)) {
      return json({ error: "Forbidden" }, 403, origin);
    }

    const body = await req.json();
    const { run_type = "manual" } = body;

    await adminClient.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_user_id: profile.id,
      module: "payroll",
      action: "payroll_sync_requested",
      entity_type: "payroll_sync",
      metadata: { run_type },
    });

    return json({ ok: true, status: "queued", run_type }, 200, origin);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
      origin
    );
  }
});
