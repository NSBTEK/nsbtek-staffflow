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

    const body = await req.json();
    const { document_id, parser = "default" } = body;

    if (!document_id) {
      return json({ error: "document_id is required" }, 400, origin);
    }

    await adminClient.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_user_id: profile.id,
      module: "documents",
      action: "parse_document_requested",
      entity_type: "document",
      entity_id: document_id,
      metadata: { parser },
    });

    return json({ ok: true, document_id, parser, status: "queued" }, 200, origin);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
      origin
    );
  }
});
