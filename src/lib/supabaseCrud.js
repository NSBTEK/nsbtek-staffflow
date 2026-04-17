import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import {
  buildScopedListQuery,
  buildScopedWriteQuery,
  assertCanEditModule,
} from "@/lib/moduleAccess";

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
  module,
  payload,
  currentUser,
  allowedKeys,
  extra = {},
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  assertCanEditModule(profile, module);

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
  module,
  id,
  payload,
  currentUser,
  allowedKeys,
  ownerColumn = "created_by",
  orgColumn = "organization_id",
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  let query = supabase
    .from(table)
    .update({
      ...cleanPayload,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  query = buildScopedWriteQuery(query, profile, module, {
    ownerColumn,
    orgColumn,
    userId: currentUser.id,
    organizationId: profile.organization_id,
  });

  const { data, error } = await query.select().single();

  if (error) throw error;
  return data;
}

export async function deleteModuleRow({
  table,
  module,
  id,
  currentUser,
  ownerColumn = "created_by",
  orgColumn = "organization_id",
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  let query = supabase.from(table).delete().eq("id", id);

  query = buildScopedWriteQuery(query, profile, module, {
    ownerColumn,
    orgColumn,
    userId: currentUser.id,
    organizationId: profile.organization_id,
  });

  const { error } = await query;
  if (error) throw error;
  return true;
}