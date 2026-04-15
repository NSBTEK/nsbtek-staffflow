import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function safeJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

function extractStructuredFieldsFromText(text: string) {
  const normalized = text.replace(/\r/g, "");
  const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = normalized.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/);
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);

  const fullName = lines[0] || "";
  const [first_name = "", ...rest] = fullName.split(" ");
  const last_name = rest.join(" ");

  const skillsSection = lines.find((line) => /skills?/i.test(line)) || "";
  const locationLine = lines.find((line) => /,\s*[A-Z]{2}$/i.test(line) || /remote/i.test(line)) || "";
  const experienceLine = lines.find((line) => /years? of experience/i.test(line)) || "";
  const titleLine = lines.find((line) => /(engineer|developer|recruiter|manager|analyst|consultant|designer)/i.test(line)) || "";

  return {
    first_name,
    last_name,
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    location: locationLine,
    current_title: titleLine,
    experience_years: experienceLine.replace(/[^0-9.]/g, "") || "",
    skills: skillsSection
      .replace(/skills?\s*:?/i, "")
      .split(/,|\||•/)
      .map((item) => item.trim())
      .filter(Boolean),
    summary: lines.slice(0, 8).join(" "),
    raw_text: normalized,
  };
}

async function fetchTextFromUrl(fileUrl: string) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch uploaded file: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/plain") || contentType.includes("json")) {
    return await response.text();
  }

  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY is missing for document parsing");
  }

  const llmResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You extract structured candidate or job information from resumes and documents. Return only JSON with keys: first_name,last_name,email,phone,location,current_title,experience_years,skills,summary.",
        },
        {
          role: "user",
          content: `Read this document URL and extract structured data: ${fileUrl}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  const llmJson = await llmResponse.json();
  if (!llmResponse.ok) {
    throw new Error(JSON.stringify(llmJson));
  }

  return JSON.stringify(JSON.parse(llmJson.choices?.[0]?.message?.content || "{}"));
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return safeJson({ ok: true });

    const { fileUrl } = await req.json();
    if (!fileUrl) return safeJson({ error: "fileUrl is required" }, 400);

    const text = await fetchTextFromUrl(fileUrl);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = extractStructuredFieldsFromText(text);
    }

    return safeJson({ parsed });
  } catch (error) {
    return safeJson({ error: String(error) }, 500);
  }
});
