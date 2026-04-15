import { supabase } from "@/lib/supabaseClient";

export async function inviteUser(payload) {
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: payload,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data;
}