import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

async function listOrgTable(table, profile) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("organization_id", profile.organization_id);

  if (error) throw error;
  return data || [];
}

export async function listDashboardData(authUser) {
  const profile = await getProfileOrThrow(authUser.id);

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
    listOrgTable("jobs", profile),
    listOrgTable("candidates", profile),
    listOrgTable("clients", profile),
    listOrgTable("contacts", profile),
    listOrgTable("submissions", profile),
    listOrgTable("interviews", profile),
    listOrgTable("placements", profile),
    listOrgTable("timesheets", profile),
    listOrgTable("expenses", profile),
    listOrgTable("activities", profile),
    listOrgTable("profiles", profile),
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