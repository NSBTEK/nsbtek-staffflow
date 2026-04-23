import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return json({ ok: true }, 200, origin);

  try {
    const signature = req.headers.get("x-provider-signature");
    const payload = await req.text();

    if (!signature) {
      return json({ error: "Missing signature" }, 401, origin);
    }

    return json({ ok: true, received: true, bytes: payload.length }, 200, origin);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500, origin);
  }
});
