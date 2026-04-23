import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listContacts() {
  return unwrap(
    await supabase.from("contacts").select("*").order("created_at", { ascending: false })
  );
}
