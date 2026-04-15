import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return json({ ok: true });

    const body = await req.json();
    const { providerKey, action, credentials, settings } = body;

    if (!providerKey || !action) {
      return json({ error: "providerKey and action are required" }, 400);
    }

    switch (action) {
      case "validate_connection": {
        return json({
          ok: true,
          providerKey,
          status: "connected",
          normalized: {
            credentials: credentials || {},
            settings: settings || {},
          },
        });
      }
      case "sync_preview": {
        return json({
          ok: true,
          providerKey,
          items: [
            { id: "sample-1", title: `${providerKey} sample item 1` },
            { id: "sample-2", title: `${providerKey} sample item 2` },
          ],
        });
      }
      default:
        return json({ error: `Unsupported action: ${action}` }, 400);
    }
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});
