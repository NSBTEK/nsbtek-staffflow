import { supabase } from "@/lib/supabaseClient";
import { canView, isOwnOnly } from "@/lib/permissions";
import { getProfileOrThrow } from "@/lib/profile";

async function getScopedModuleRows({ table, profile, module, ownerColumn = "created_by" }) {
  if (!canView(profile, module)) return [];

  let query = supabase
    .from(table)
    .select("*")
    .eq("organization_id", profile.organization_id);

  const recruitmentModules = ["jobs", "candidates", "submissions", "interviews", "placements"];

  if (!recruitmentModules.includes(module) && isOwnOnly(profile, module)) {
    query = query.eq(ownerColumn, profile.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listDashboardData(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const [
    jobs,
    candidates,
    clients,
    contacts,
    submissions,
    interviews,
    placements,
    timesheets,
    expenses,
    activities,
    users,
  ] = await Promise.all([
    getScopedModuleRows({ table: "jobs", profile, module: "jobs" }),
    getScopedModuleRows({ table: "candidates", profile, module: "candidates" }),
    getScopedModuleRows({ table: "clients", profile, module: "clients" }),
    getScopedModuleRows({ table: "contacts", profile, module: "contacts" }),
    getScopedModuleRows({ table: "submissions", profile, module: "submissions" }),
    getScopedModuleRows({ table: "interviews", profile, module: "interviews" }),
    getScopedModuleRows({ table: "placements", profile, module: "placements" }),
    getScopedModuleRows({ table: "timesheet_headers", profile, module: "timesheets", ownerColumn: "employee_id" }),
    getScopedModuleRows({ table: "expenses", profile, module: "expenses" }),
    getScopedModuleRows({ table: "activities", profile, module: "activities" }),
    profile.role === "admin"
      ? supabase
          .from("profiles")
          .select("id, role, created_at")
          .eq("organization_id", profile.organization_id)
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          })
      : [],
  ]);

  return {
    jobs,
    candidates,
    clients,
    contacts,
    submissions,
    interviews,
    placements,
    timesheets,
    expenses,
    activities,
    users,
  };
}
