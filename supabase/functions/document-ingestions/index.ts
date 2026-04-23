import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ingestionId } = await req.json();

    if (!ingestionId) {
      return new Response(
        JSON.stringify({ error: "ingestionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: ingestion, error: ingestionError } = await supabase
      .from("document_ingestions")
      .select("*")
      .eq("id", ingestionId)
      .single();

    if (ingestionError || !ingestion) {
      return new Response(
        JSON.stringify({ error: "Ingestion not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("documents")
      .createSignedUrl(ingestion.storage_path, 60);

    if (signedError || !signedData?.signedUrl) {
      await supabase
        .from("document_ingestions")
        .update({
          status: "failed",
          error_message: "Unable to create signed URL",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ingestionId);

      return new Response(
        JSON.stringify({ error: "Unable to create signed URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fileRes = await fetch(signedData.signedUrl);

    if (!fileRes.ok) {
      await supabase
        .from("document_ingestions")
        .update({
          status: "failed",
          error_message: "Unable to download uploaded file",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ingestionId);

      return new Response(
        JSON.stringify({ error: "Unable to download uploaded file" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const prompt = `
Extract structured resume information and return JSON only.
Fields:
- full_name
- email
- phone
- skills (array)
- experience_summary
- education (array)
- work_history (array)
- certifications (array)
- parsed_text
`;

    const aiResp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              {
                type: "input_file",
                filename: ingestion.original_filename || "resume.pdf",
                file_data: `data:${ingestion.mime_type || "application/pdf"};base64,${base64}`,
              },
            ],
          },
        ],
      }),
    });

    const aiJson = await aiResp.json();

    if (!aiResp.ok) {
      const message = aiJson?.error?.message || "AI parse failed";

      await supabase
        .from("document_ingestions")
        .update({
          status: aiResp.status === 429 ? "queued" : "failed",
          error_message:
            aiResp.status === 429
              ? "Parser is temporarily rate-limited. Try again later."
              : message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ingestionId);

      return new Response(
        JSON.stringify({
          error:
            aiResp.status === 429
              ? "Parser is temporarily rate-limited. The document was uploaded and marked as queued."
              : message,
          status: aiResp.status === 429 ? "queued" : "failed",
          ingestionId,
          raw: aiJson,
        }),
        {
          status: aiResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const outputText =
      aiJson.output_text ||
      aiJson.output
        ?.map((x: any) => x?.content?.map((c: any) => c?.text).join(" "))
        .join("\n") ||
      "";

    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(outputText);
    } catch {
      parsedJson = { parsed_text: outputText };
    }

    await supabase
      .from("document_ingestions")
      .update({
        status: "processed",
        parsed_json: parsedJson,
        extracted_text: parsedJson?.parsed_text || outputText,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ingestionId);

    return new Response(
      JSON.stringify({
        success: true,
        status: "processed",
        ingestionId,
        parsed: parsedJson,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});