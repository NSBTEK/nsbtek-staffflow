import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const RESET_PASSWORD_URL = `${APP_URL}/reset-password`;

async function callInviteFunction(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: {
      ...payload,
      organization_id: profile.organization_id,
      redirectTo: payload?.redirectTo || RESET_PASSWORD_URL,
    },
  });

  if (error) throw error;
  return data;
}

export async function listUsers(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (usersError) throw usersError;

  const userIds = (users || []).map((u) => u.id);

  let assignments = [];
  if (userIds.length > 0) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("user_role_groups")
      .select("*")
      .in("user_id", userIds);

    if (assignmentError) throw assignmentError;
    assignments = assignmentRows || [];
  }

  const roleGroupIds = [...new Set(assignments.map((x) => x.role_group_id).filter(Boolean))];

  let roleGroups = [];
  if (roleGroupIds.length > 0) {
    const { data: groupRows, error: groupError } = await supabase
      .from("role_groups")
      .select("*")
      .in("id", roleGroupIds);

    if (groupError) throw groupError;
    roleGroups = groupRows || [];
  }

  const groupMap = Object.fromEntries(roleGroups.map((g) => [g.id, g]));
  const assignmentsByUser = assignments.reduce((acc, row) => {
    if (!acc[row.user_id]) acc[row.user_id] = [];
    acc[row.user_id].push({
      ...row,
      role_group: groupMap[row.role_group_id] || null,
    });
    return acc;
  }, {});

  return (users || []).map((user) => ({
    ...user,
    assigned_role_groups: assignmentsByUser[user.id] || [],
  }));
}

export async function inviteUser(currentUser, payload) {
  return callInviteFunction(currentUser, payload);
}

export async function resendInvite(currentUser, payload) {
  return callInviteFunction(currentUser, payload);
}

export async function updateUserProfile(id, payload, currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const cleanPayload = {
    full_name: payload?.full_name || "",
    role: payload?.role,
    status: payload?.status || "active",
    manager_id: payload?.manager_id || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(cleanPayload)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}