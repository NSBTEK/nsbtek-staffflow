import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

async function uploadCandidateResume(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop();
  const path = `candidate-resumes/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  return { file_name: file.name, file_url: data.publicUrl };
}

export async function createCandidateWithResume(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);
  const uploadedResume = await uploadCandidateResume(payload.resumeFile);

  const { data: candidate, error } = await supabase
    .from("candidates")
    .insert({
      ...payload.form,
      organization_id: profile.organization_id,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;

  if (uploadedResume) {
    const { error: attachmentError } = await supabase.from("attachments").insert({
      organization_id: profile.organization_id,
      module_key: "candidates",
      record_id: candidate.id,
      file_name: uploadedResume.file_name,
      file_url: uploadedResume.file_url,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    });

    if (attachmentError) throw attachmentError;
  }

  return candidate;
}
