import { supabase } from "@/lib/supabaseClient";

export async function sendNotificationEmail(payload) {
  const { data, error } = await supabase.functions.invoke("send-notification-email", {
    body: payload,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data;
}