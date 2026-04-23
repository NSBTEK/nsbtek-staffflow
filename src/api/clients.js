import { supabase } from "@/lib/supabaseClient";
import { unwrap } from "@/api/_helpers";

export async function listClients() {
  return unwrap(
    await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

export async function getClientById(id) {
  return unwrap(
    await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single()
  );
}

export async function createClient(payload) {
  return unwrap(
    await supabase
      .from("clients")
      .insert(payload)
      .select()
      .single()
  );
}

export async function updateClient(id, payload) {
  return unwrap(
    await supabase
      .from("clients")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
  );
}

export async function deleteClient(id) {
  return unwrap(await supabase.from("clients").delete().eq("id", id));
}
