import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listCandidates() {
  return unwrap(
    await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

export async function createCandidate(payload) {
  return unwrap(
    await supabase
      .from("candidates")
      .insert(payload)
      .select()
      .single()
  );
}

export async function updateCandidate(id, payload) {
  return unwrap(
    await supabase
      .from("candidates")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
  );
}
