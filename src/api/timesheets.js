import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listTimesheets() {
  return unwrap(
    await supabase
      .from("timesheets")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

export async function createTimesheet(payload) {
  return unwrap(
    await supabase
      .from("timesheets")
      .insert(payload)
      .select()
      .single()
  );
}

export async function approveTimesheet(id) {
  return unwrap(
    await supabase
      .from("timesheets")
      .update({ status: "approved" })
      .eq("id", id)
      .select()
      .single()
  );
}
