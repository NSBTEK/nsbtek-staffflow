import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listOnboardingItems() {
  return unwrap(
    await supabase.from("onboarding").select("*").order("created_at", { ascending: false })
  );
}
