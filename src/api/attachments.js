import { supabase } from "@/lib/supabaseClient";

export async function listAttachments(module, recordId) {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("module", module)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadAttachment({ file, module, recordId, currentUser }) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", currentUser.id)
    .single();

  if (profileError) throw profileError;

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${profile.organization_id}/${module}/${recordId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      organization_id: profile.organization_id,
      module,
      record_id: recordId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAttachment(attachment) {
  const { error: storageError } = await supabase.storage
    .from("attachments")
    .remove([attachment.file_path]);

  if (storageError) throw storageError;

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachment.id);

  if (error) throw error;

  return true;
}

export async function getAttachmentSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(filePath, 60 * 10);

  if (error) throw error;
  return data?.signedUrl || "";
}