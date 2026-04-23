import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listSubmissions() {
  return unwrap(
    await supabase
      .from("submissions")
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .order("created_at", { ascending: false })
  );
}

export async function createSubmission(payload) {
  return unwrap(
    await supabase
      .from("submissions")
      .insert(payload)
      .select()
      .single()
  );
}

export async function updateSubmission(id, payload) {
  return unwrap(
    await supabase
      .from("submissions")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
  );
}
