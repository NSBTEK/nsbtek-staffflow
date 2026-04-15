import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

async function getCurrentProfile(currentUser) {
  if (!currentUser?.id) throw new Error("Current user is missing");
  return getProfileOrThrow(currentUser.id);
}

async function getOrgId(currentUser) {
  const profile = await getCurrentProfile(currentUser);
  if (!profile?.organization_id) {
    throw new Error("Organization not found for current user");
  }
  return profile.organization_id;
}

export async function listRoleGroups(currentUser) {
  const organization_id = await getOrgId(currentUser);

  const { data, error } = await supabase
    .from("role_groups")
    .select("*")
    .eq("organization_id", organization_id)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createRoleGroup(payload, currentUser) {
  const organization_id = await getOrgId(currentUser);

  const cleanPayload = {
    organization_id,
    name: String(payload?.name || "").trim(),
    description: String(payload?.description || "").trim(),
    is_active: payload?.is_active ?? true,
  };

  if (!cleanPayload.name) throw new Error("Group name is required");

  const { data, error } = await supabase
    .from("role_groups")
    .insert(cleanPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRoleGroup(id, payload) {
  const cleanPayload = {
    name: String(payload?.name || "").trim(),
    description: String(payload?.description || "").trim(),
    is_active: payload?.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (!cleanPayload.name) throw new Error("Group name is required");

  const { data, error } = await supabase
    .from("role_groups")
    .update(cleanPayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoleGroup(id) {
  const { error } = await supabase.from("role_groups").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function listRoleGroupPermissions(roleGroupId) {
  if (!roleGroupId) return [];

  const { data, error } = await supabase
    .from("role_group_permissions")
    .select("*")
    .eq("role_group_id", roleGroupId)
    .order("module_key", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveRoleGroupPermissions(roleGroupId, permissions, currentUser) {
  if (!roleGroupId) throw new Error("Role group is required");

  const organization_id = await getOrgId(currentUser);

  const { error: deleteError } = await supabase
    .from("role_group_permissions")
    .delete()
    .eq("role_group_id", roleGroupId);

  if (deleteError) throw deleteError;

  const rows = (permissions || []).map((p) => ({
    organization_id,
    role_group_id: roleGroupId,
    module_key: p.module_key,
    permission_level: p.permission_level,
  }));

  if (!rows.length) return true;

  const { error } = await supabase
    .from("role_group_permissions")
    .insert(rows);

  if (error) throw error;

  return true;
}

export async function listProfiles(currentUser) {
  const organization_id = await getOrgId(currentUser);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, organization_id")
    .eq("organization_id", organization_id)
    .order("email", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listUserRoleGroups(currentUser) {
  const organization_id = await getOrgId(currentUser);

  const { data, error } = await supabase
    .from("user_role_groups")
    .select(`
      *,
      role_group:role_groups!inner(id, organization_id, name)
    `)
    .eq("role_group.organization_id", organization_id);

  if (error) throw error;
  return data || [];
}

export async function assignRoleGroupToUser(userId, roleGroupId, currentUser) {
  if (!userId) throw new Error("User is required");
  if (!roleGroupId) throw new Error("Role group is required");

  const organization_id = await getOrgId(currentUser);

  const { error: removeError } = await supabase
    .from("user_role_groups")
    .delete()
    .eq("user_id", userId);

  if (removeError) throw removeError;

  const { data, error } = await supabase
    .from("user_role_groups")
    .insert({
      organization_id,
      user_id: userId,
      role_group_id: roleGroupId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeRoleGroupFromUser(userRoleGroupId) {
  if (!userRoleGroupId) throw new Error("Assignment id is required");

  const { error } = await supabase
    .from("user_role_groups")
    .delete()
    .eq("id", userRoleGroupId);

  if (error) throw error;
  return true;
}