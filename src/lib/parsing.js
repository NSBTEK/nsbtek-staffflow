import { supabase } from "@/lib/supabaseClient";

export async function uploadDocumentToParser(file) {
  const fileExt = file.name.split(".").pop();
  const filePath = `documents/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);

  const { data: result, error } = await supabase.functions.invoke("parse-document", {
    body: {
      fileName: file.name,
      fileUrl: data.publicUrl,
      mimeType: file.type,
    },
  });

  if (error) throw error;
  return result;
}

export function mapParsedResumeToCandidate(parsed) {
  return {
    first_name: parsed.first_name || "",
    last_name: parsed.last_name || "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    location: parsed.location || "",
    skills: Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills || "",
    experience_years: parsed.experience_years || "",
    current_company: parsed.current_company || "",
    current_title: parsed.current_title || "",
    summary: parsed.summary || "",
  };
}
