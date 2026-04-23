import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import {
  buildScopedListQuery,
  buildScopedWriteQuery,
  assertCanEditModule,
} from "@/lib/moduleAccess";

function sanitizePayload(payload, allowedKeys = []) {
  const clean = Object.fromEntries(
    Object.entries(payload || {}).filter(([key, value]) => {
      if (!allowedKeys.includes(key)) return false;
      return value !== undefined;
    })
  );

  return clean;
}

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
  if (!currentUser?.id) throw new Error("Missing authenticated user");

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
  if (!currentUser?.id) throw new Error("Missing authenticated user");

  const profile = await getProfileOrThrow(currentUser.id);
  assertCanEditModule(profile, module);

  const cleanPayload = sanitizePayload(payload, allowedKeys);

  const insertPayload = {
    ...cleanPayload,
    ...extra,
    organization_id: profile.organization_id,
    created_by: currentUser.id,
    updated_by: currentUser.id,
  };

  const { data, error } = await supabase
    .from(table)
    .insert(insertPayload)
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
  if (!currentUser?.id) throw new Error("Missing authenticated user");
  if (!id) throw new Error("Missing record id");

  const profile = await getProfileOrThrow(currentUser.id);
  const cleanPayload = sanitizePayload(payload, allowedKeys);

  if (Object.keys(cleanPayload).length === 0) {
    throw new Error("No valid fields to update");
  }

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
  if (!currentUser?.id) throw new Error("Missing authenticated user");
  if (!id) throw new Error("Missing record id");

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