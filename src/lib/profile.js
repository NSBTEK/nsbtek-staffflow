import { supabase } from "@/lib/supabaseClient";

export async function getProfileOrThrow(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, organization_id, full_name")
    .eq("id", userId)
    .single();

  if (error) throw error;
  if (!data?.organization_id) {
    throw new Error("User profile is missing organization_id");
  }

  return data;
}