import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { buildScopedListQuery } from "@/lib/moduleAccess";

export async function listModuleRows({
  table,
  module,
  currentUser,
  select = "*",
  orderBy = "created_at",
  ascending = false,
  ownerColumn = "created_by",
  orgColumn = "organization_id",
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  let query = supabase
    .from(table)
    .select(select)
    .order(orderBy, { ascending });

  query = buildScopedListQuery(query, profile, module, {
    ownerColumn,
    orgColumn,
    userId: currentUser.id,
    organizationId: profile.organization_id,
  });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createModuleRow({
  table,
  payload,
  currentUser,
  allowedKeys,
  extra = {},
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from(table)
    .insert({
      ...cleanPayload,
      ...extra,
      organization_id: profile.organization_id,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateModuleRow({
  table,
  id,
  payload,
  currentUser,
  allowedKeys,
}) {
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from(table)
    .update({
      ...cleanPayload,
      updated_by: currentUser.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModuleRow({ table, id }) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
  return true;
}
