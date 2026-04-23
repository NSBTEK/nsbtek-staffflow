import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listContracts() {
  return unwrap(
    await supabase.from("contracts").select("*").order("created_at", { ascending: false })
  );
}
