import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listJobs() {
  return unwrap(
    await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

export async function createJob(payload) {
  return unwrap(
    await supabase
      .from("jobs")
      .insert(payload)
      .select()
      .single()
  );
}

export async function updateJob(id, payload) {
  return unwrap(
    await supabase
      .from("jobs")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
  );
}

export async function deleteJob(id) {
  return unwrap(await supabase.from("jobs").delete().eq("id", id));
}
