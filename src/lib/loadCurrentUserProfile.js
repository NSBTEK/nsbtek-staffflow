import { supabase } from "@/lib/supabaseClient";

function mergePermissionLevels(existing, incoming) {
  const rank = {
    none: 0,
    view: 1,
    view_own: 2,
    own: 3,
    edit: 4,
  };

  const existingRank = rank[existing] ?? 0;
  const incomingRank = rank[incoming] ?? 0;

  return incomingRank > existingRank ? incoming : existing;
}

export async function loadCurrentUserProfile(authUser) {
  if (!authUser?.id) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError) throw profileError;

  const { data: assignments, error: assignmentError } = await supabase
    .from("user_role_groups")
    .select("role_group_id")
    .eq("user_id", authUser.id);

  if (assignmentError) throw assignmentError;

  const roleGroupIds = (assignments || []).map((x) => x.role_group_id);

  let roleGroupPermissions = {};

  if (roleGroupIds.length > 0) {
    const { data: permissions, error: permissionsError } = await supabase
      .from("role_group_permissions")
      .select("role_group_id, module_key, permission_level")
      .in("role_group_id", roleGroupIds);

    if (permissionsError) throw permissionsError;

    for (const row of permissions || []) {
      const current = roleGroupPermissions[row.module_key];
      roleGroupPermissions[row.module_key] = mergePermissionLevels(current, row.permission_level);
    }
  }

  return {
    ...profile,
    role_group_ids: roleGroupIds,
    role_group_permissions: roleGroupPermissions,
  };
}