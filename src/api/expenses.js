import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listExpenses() {
  return unwrap(
    await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

export async function createExpense(payload) {
  return unwrap(
    await supabase
      .from("expenses")
      .insert(payload)
      .select()
      .single()
  );
}

export async function approveExpense(id) {
  return unwrap(
    await supabase
      .from("expenses")
      .update({ status: "approved" })
      .eq("id", id)
      .select()
      .single()
  );
}
