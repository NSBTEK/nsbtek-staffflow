import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function logAppEvent(currentUser, level, eventType, message, metadata = {}) {
  try {
    if (!currentUser?.id) return;
    const profile = await getProfileOrThrow(currentUser.id);

    await supabase.from("app_logs").insert({
      organization_id: profile.organization_id,
      user_id: currentUser.id,
      level,
      event_type: eventType,
      message,
      metadata,
    });
  } catch {
    // swallow logging failures
  }
}