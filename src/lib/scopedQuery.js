import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function getScopedContext(currentUser) {
  if (!currentUser?.id) {
    throw new Error("No authenticated user");
  }

  const profile = await getProfileOrThrow(currentUser.id);

  if (!profile?.organization_id) {
    throw new Error("Current user profile is missing organization_id");
  }

  return {
    userId: currentUser.id,
    organizationId: profile.organization_id,
    profile,
  };
}

export async function listScopedRows({
  table,
  currentUser,
  orderBy = "created_at",
  ascending = false,
  select = "*",
}) {
  const { organizationId } = await getScopedContext(currentUser);

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("organization_id", organizationId)
    .order(orderBy, { ascending });

  if (error) throw error;
  return data || [];
}

export async function createScopedRow({
  table,
  currentUser,
  payload,
  allowedKeys,
}) {
  const { organizationId, userId } = await getScopedContext(currentUser);

  const cleanPayload = Object.fromEntries(
    Object.entries(payload || {}).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from(table)
    .insert({
      ...cleanPayload,
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateScopedRow({
  table,
  id,
  currentUser,
  payload,
  allowedKeys,
}) {
  const { userId } = await getScopedContext(currentUser);

  const cleanPayload = Object.fromEntries(
    Object.entries(payload || {}).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from(table)
    .update({
      ...cleanPayload,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteScopedRow({ table, id }) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}