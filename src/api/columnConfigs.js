import { supabase } from "@/lib/supabaseClient";

export async function listColumnConfigs(module) {
  let query = supabase
    .from("column_configs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (module) {
    query = query.eq("module", module);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createColumnConfig(payload, currentUser) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", currentUser.id)
    .single();

  if (profileError) throw profileError;

  const { data, error } = await supabase
    .from("column_configs")
    .insert({
      ...payload,
      organization_id: profile.organization_id,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateColumnConfig(id, payload, currentUser) {
  const { data, error } = await supabase
    .from("column_configs")
    .update({
      ...payload,
      updated_by: currentUser.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteColumnConfig(id) {
  const { error } = await supabase
    .from("column_configs")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}