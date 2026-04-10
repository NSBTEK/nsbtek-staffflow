import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function listUsers(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, created_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function inviteUser(currentUser, payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session");
  }

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: {
      ...payload,
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login`,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function updateUserProfile(id, payload, currentUser) {
  const allowedKeys = ["full_name", "role", "status"];
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...cleanPayload,
      updated_by: currentUser.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
