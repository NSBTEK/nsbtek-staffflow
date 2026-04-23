import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listPlacements() {
  return unwrap(
    await supabase.from("placements").select("*").order("created_at", { ascending: false })
  );
}
