import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser } from "../_shared/auth.ts";
import { json } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return json({ ok: true }, 200, origin);

  try {
    const { profile, adminClient } = await requireUser(req.headers.get("Authorization"));
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) return json({ error: "prompt is required" }, 400, origin);

    await adminClient.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_user_id: profile.id,
      module: "ai",
      action: "ai_prompt_requested",
      entity_type: "ai_request",
      metadata: { prompt_length: String(prompt).length },
    });

    return json({ ok: true, response: "AI response placeholder" }, 200, origin);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500, origin);
  }
});
