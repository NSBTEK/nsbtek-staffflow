import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function getDashboardMetrics(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);
  const orgId = profile.organization_id;

  const tables = [
    ["jobs", "jobs"],
    ["candidates", "candidates"],
    ["clients", "clients"],
    ["submissions", "submissions"],
    ["interviews", "interviews"],
    ["placements", "placements"],
    ["timesheets", "timesheets"],
    ["expenses", "expenses"],
    ["activities", "activities"],
  ];

  const counts = await Promise.all(
    tables.map(async ([key, table]) => {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);

      if (error) throw error;
      return [key, count || 0];
    })
  );

  const { data: jobs = [], error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (jobsError) throw jobsError;

  const { data: candidates = [], error: candidatesError } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, status, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (candidatesError) throw candidatesError;

  const { data: prefs } = await supabase
    .from("dashboard_preferences")
    .select("widgets")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  return {
    counts: Object.fromEntries(counts),
    recentJobs: jobs,
    recentCandidates: candidates,
    widgets: prefs?.widgets || [
      "jobs",
      "candidates",
      "clients",
      "submissions",
      "interviews",
      "placements",
    ],
  };
}

export async function saveDashboardPreferences(currentUser, widgets) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("dashboard_preferences")
    .upsert(
      {
        user_id: currentUser.id,
        organization_id: profile.organization_id,
        widgets,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
