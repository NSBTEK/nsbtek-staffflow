import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function listAccessRequests(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAccessRequest(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("access_requests")
    .insert({
      organization_id: profile.organization_id,
      requested_by: currentUser.id,
      module_key: payload.module_key,
      reason: payload.reason || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reviewAccessRequest(currentUser, id, status) {
  const { data, error } = await supabase
    .from("access_requests")
    .update({
      status,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
