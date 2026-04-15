import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function listAccessRequests(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  let query = supabase
    .from("access_requests")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (!["admin", "manager"].includes(profile.role)) {
    query = query.eq("requested_by", profile.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAccessRequest(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("access_requests")
    .insert({
      organization_id: profile.organization_id,
      requested_by: profile.id,
      requested_module: payload.requested_module,
      requested_level: payload.requested_level,
      reason: payload.reason || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reviewAccessRequest(
  currentUser,
  requestId,
  decision,
  reviewNotes = null
) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError) throw requestError;

  const { error: updateError } = await supabase
    .from("access_requests")
    .update({
      status: decision,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) throw updateError;

  if (decision === "approved") {
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, permissions")
      .eq("id", request.requested_by)
      .single();

    if (profileError) throw profileError;

    const nextPermissions = {
      ...(targetProfile.permissions || {}),
      [request.requested_module]: request.requested_level,
    };

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ permissions: nextPermissions })
      .eq("id", targetProfile.id);

    if (profileUpdateError) throw profileUpdateError;
  }

  return true;
}