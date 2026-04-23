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

    if (profile.role !== "platform_admin") {
      return json({ error: "Forbidden" }, 403, origin);
    }

    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return json({ error: "name and slug are required" }, 400, origin);
    }

    const { data: organization, error } = await adminClient
      .from("organizations")
      .insert({ name, slug })
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 400, origin);
    }

    await adminClient.from("audit_logs").insert({
      organization_id: organization.id,
      actor_user_id: profile.id,
      module: "admin",
      action: "create_company",
      entity_type: "organization",
      entity_id: organization.id,
      metadata: { name, slug },
    });

    return json({ ok: true, organization }, 200, origin);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
      origin
    );
  }
});
