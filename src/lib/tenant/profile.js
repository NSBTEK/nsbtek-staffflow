import { supabase } from "@/lib/supabase/browserClient";

export async function getProfileOrThrow(userId) {
  if (!userId) throw new Error("Missing user id");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Profile not found");

  return data;
}