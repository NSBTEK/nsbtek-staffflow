import { supabase } from "@/lib/supabaseClient";

async function getOrgId(currentUser) {
  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", currentUser.id)
    .single();

  if (error) throw error;
  return data.organization_id;
}

export async function listRoleGroups() {
  const { data, error } = await supabase
    .from("role_groups")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listRoleGroupPermissions(roleGroupId) {
  const { data, error } = await supabase
    .from("role_group_permissions")
    .select("*")
    .eq("role_group_id", roleGroupId)
    .order("module_key", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createRoleGroup(payload, currentUser) {
  const organization_id = await getOrgId(currentUser);

  const { data, error } = await supabase
    .from("role_groups")
    .insert({
      organization_id,
      name: payload.name,
      description: payload.description || "",
      is_active: payload.is_active ?? true,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRoleGroup(id, payload, currentUser) {
  const { data, error } = await supabase
    .from("role_groups")
    .update({
      name: payload.name,
      description: payload.description || "",
      is_active: payload.is_active ?? true,
      updated_by: currentUser.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoleGroup(id) {
  const { error } = await supabase
    .from("role_groups")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function saveRoleGroupPermissions(roleGroupId, permissions, currentUser) {
  const organization_id = await getOrgId(currentUser);

  const { error: deleteError } = await supabase
    .from("role_group_permissions")
    .delete()
    .eq("role_group_id", roleGroupId);

  if (deleteError) throw deleteError;

  const rows = permissions
    .filter((p) => p.permission_level && p.permission_level !== "none")
    .map((p) => ({
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

export async function listProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .order("email", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listUserRoleGroups() {
  const { data, error } = await supabase
    .from("user_role_groups")
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function assignRoleGroupToUser(userId, roleGroupId, currentUser) {
  const organization_id = await getOrgId(currentUser);

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

export async function removeRoleGroupFromUser(userId, roleGroupId) {
  const { error } = await supabase
    .from("user_role_groups")
    .delete()
    .eq("user_id", userId)
    .eq("role_group_id", roleGroupId);

  if (error) throw error;
  return true;
}