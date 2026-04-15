import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const RESET_PASSWORD_URL = `${APP_URL}/reset-password`;
const INVITE_FUNCTION_SECRET = import.meta.env.VITE_INVITE_FUNCTION_SECRET || "";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

export async function listUsers(currentUser) {
  if (!currentUser?.id) {
    throw new Error("Current user is missing.");
  }

  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function callInviteFunction(currentUser, payload) {
  if (!currentUser?.id) {
    throw new Error("Current user is missing.");
  }

  if (!SUPABASE_URL) {
    throw new Error("Supabase URL is missing in .env");
  }

  if (!INVITE_FUNCTION_SECRET) {
    throw new Error("Invite function secret is missing in .env");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-invite-secret": INVITE_FUNCTION_SECRET,
    },
    body: JSON.stringify({
      currentUserId: currentUser.id,
      email: String(payload?.email || "").trim().toLowerCase(),
      full_name: String(payload?.full_name || "").trim(),
      role: String(payload?.role || "").trim(),
      manager_id: payload?.manager_id || null,
      redirectTo: payload?.redirectTo || RESET_PASSWORD_URL,
    }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function inviteUser(currentUser, payload) {
  if (!payload?.email) {
    throw new Error("Email is required");
  }

  if (!payload?.role) {
    throw new Error("Role is required");
  }

  if (!payload?.full_name || !String(payload.full_name).trim()) {
  throw new Error("Full name is required");
}

  return callInviteFunction(currentUser, {
    ...payload,
    redirectTo: payload?.redirectTo || RESET_PASSWORD_URL,
  });
}

export async function resendInvite(currentUser, payload) {
  if (!payload?.email) {
    throw new Error("Email is required");
  }

  if (!payload?.role) {
    throw new Error("Role is required");
  }

  if (!payload?.full_name || !String(payload.full_name).trim()) {
  throw new Error("Full name is required");
}

  return callInviteFunction(currentUser, {
    ...payload,
    redirectTo: payload?.redirectTo || RESET_PASSWORD_URL,
  });
}

export async function updateUserProfile(id, payload, currentUser) {
  if (!currentUser?.id) {
    throw new Error("Current user is missing.");
  }

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