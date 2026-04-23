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
    const { profile } = await requireUser(authHeader);

    if (!["company_admin", "platform_admin"].includes(profile.role)) {
      return json({ error: "Forbidden" }, 403, origin);
    }

    const body = await req.json();
    const { action, providerKey, credentials, settings } = body;

    if (!action || !providerKey) {
      return json({ error: "action and providerKey are required" }, 400, origin);
    }

    if (action === "validate_connection") {
      return json({
        ok: true,
        providerKey,
        status: "connected",
        normalized: {
          credentials: credentials || {},
          settings: settings || {},
        },
      }, 200, origin);
    }

    if (action === "sync_preview") {
      return json({
        ok: true,
        providerKey,
        items: [
          { id: "preview-1", name: `${providerKey} preview item 1` },
          { id: "preview-2", name: `${providerKey} preview item 2` },
        ],
      }, 200, origin);
    }

    return json({ error: "Unsupported action" }, 400, origin);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
      origin
    );
  }
});
