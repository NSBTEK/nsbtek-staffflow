import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

function sanitizeFileName(name) {
  return String(name || "file")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

export async function uploadDocumentForParsing({
  currentUser,
  file,
  moduleTarget = "candidates",
}) {
  if (!currentUser?.id) {
    throw new Error("User is not authenticated");
  }

  if (!file) {
    throw new Error("No file selected");
  }

  const profile = await getProfileOrThrow(currentUser.id);

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${profile.organization_id}/${currentUser.id}/${Date.now()}_${safeName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) throw uploadError;

  const { data: ingestion, error: ingestionError } = await supabase
    .from("document_ingestions")
    .insert({
      organization_id: profile.organization_id,
      module_target: moduleTarget,
      storage_path: uploadData?.path || storagePath,
      original_filename: file.name,
      mime_type: file.type || "application/octet-stream",
      status: "uploaded",
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (ingestionError) throw ingestionError;

  return ingestion;
}

export async function runDocumentParse(ingestionId) {
  if (!ingestionId) {
    throw new Error("Missing ingestionId");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/document-ingestions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ ingestionId }),
    }
  );

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  // Treat queued/rate-limited response as usable instead of throwing generic error
  if (!response.ok) {
    if (response.status === 429) {
      return {
        success: false,
        status: body?.status || "queued",
        ingestionId,
        message:
          body?.error ||
          "Parser is temporarily rate-limited. Your file was uploaded and marked as queued.",
        raw: body,
      };
    }

    throw new Error(
      body?.error ||
        body?.message ||
        `Document parse failed with status ${response.status}`
    );
  }

  return body;
}