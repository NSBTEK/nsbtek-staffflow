import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { canEdit, canView } from "@/lib/permissions";

const FULL_WORKFORCE_ROLES = [
  "admin",
  "company_admin",
  "platform_admin",
  "hr",
  "hr_admin",
  "workforce_manager",
];

const MANAGER_ROLES = ["manager"];

const HR_ADMIN_ONLY_ROLES = [
  "admin",
  "company_admin",
  "platform_admin",
  "hr",
  "hr_admin",
];

export function hasFullWorkforceAccess(profile) {
  return (
    FULL_WORKFORCE_ROLES.includes(profile?.role) ||
    canEdit(profile, "timesheets") ||
    canEdit(profile, "expenses") ||
    canEdit(profile, "contracts")
  );
}

export function hasManagerWorkforceAccess(profile) {
  return (
    MANAGER_ROLES.includes(profile?.role) ||
    hasFullWorkforceAccess(profile)
  );
}

export function isEmployeeWorkforceRestricted(profile) {
  return profile?.role === "employee";
}

export function hasHRAdminOnlyAccess(profile) {
  return (
    HR_ADMIN_ONLY_ROLES.includes(profile?.role) ||
    canEdit(profile, "onboarding") ||
    canEdit(profile, "payroll")
  );
}

export async function listDirectReportIds(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("manager_id", currentUser.id);

  if (error) throw error;
  return (data || []).map((row) => row.id);
}

export async function getWorkforceVisibleUserIds(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  if (hasFullWorkforceAccess(profile)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", profile.organization_id);

    if (error) throw error;
    return (data || []).map((row) => row.id);
  }

  if (MANAGER_ROLES.includes(profile.role)) {
    const directReportIds = await listDirectReportIds(currentUser);
    return Array.from(new Set([currentUser.id, ...directReportIds]));
  }

  return [currentUser.id];
}

export async function assertHRAdminOnlyModuleAccess(currentUser, moduleKey = "onboarding") {
  const profile = await getProfileOrThrow(currentUser.id);

  if (
    !hasHRAdminOnlyAccess(profile) &&
    !canView(profile, moduleKey) &&
    !canEdit(profile, moduleKey)
  ) {
    throw new Error("You do not have access to this module.");
  }

  return true;
}

export async function buildWorkforceScopedListQuery({
  query,
  currentUser,
  employeeColumn = "employee_id",
  orgColumn = "organization_id",
}) {
  const profile = await getProfileOrThrow(currentUser.id);

  let scoped = query.eq(orgColumn, profile.organization_id);

  if (hasFullWorkforceAccess(profile)) {
    return scoped;
  }

  const visibleUserIds = await getWorkforceVisibleUserIds(currentUser);
  scoped = scoped.in(employeeColumn, visibleUserIds);

  return scoped;
}

export async function buildHRAdminOnlyListQuery({
  query,
  currentUser,
  orgColumn = "organization_id",
  moduleKey = "onboarding",
}) {
  const profile = await getProfileOrThrow(currentUser.id);
  await assertHRAdminOnlyModuleAccess(currentUser, moduleKey);
  return query.eq(orgColumn, profile.organization_id);
}