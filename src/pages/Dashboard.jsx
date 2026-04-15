import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { listDashboardData } from "@/lib/dashboardScope";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

const DEFAULT_WIDGETS = [
  { key: "jobs", label: "Jobs", enabled: true },
  { key: "candidates", label: "Candidates", enabled: true },
  { key: "clients", label: "Clients", enabled: true },
  { key: "submissions", label: "Submissions", enabled: true },
  { key: "interviews", label: "Interviews", enabled: true },
  { key: "placements", label: "Placements", enabled: true },
  { key: "timesheets", label: "Timesheets", enabled: true },
  { key: "expenses", label: "Expenses", enabled: true },
  { key: "activities", label: "Activities", enabled: true },
  { key: "users", label: "Users", enabled: true },
];

async function getDashboardPreferences(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("dashboard_preferences")
    .select("*")
    .eq("user_id", profile.id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function saveDashboardPreferences(currentUser, widgets) {
  const profile = await getProfileOrThrow(currentUser.id);

  const payload = {
    user_id: profile.id,
    organization_id: profile.organization_id,
    widgets,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("dashboard_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
  return true;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCustomize, setShowCustomize] = useState(false);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["dashboard-data", authUser?.id],
    queryFn: () => listDashboardData(authUser),
    enabled: !!authUser?.id,
  });

  const { data: preferenceRow } = useQuery({
    queryKey: ["dashboard-preferences", authUser?.id],
    queryFn: () => getDashboardPreferences(authUser),
    enabled: !!authUser?.id,
  });

  const widgets = useMemo(() => {
    return preferenceRow?.widgets?.length ? preferenceRow.widgets : DEFAULT_WIDGETS;
  }, [preferenceRow]);

  const savePrefsMutation = useMutation({
    mutationFn: (nextWidgets) => saveDashboardPreferences(authUser, nextWidgets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-preferences", authUser?.id] });
      setShowCustomize(false);
    },
  });

  const visibleWidgetKeys = widgets.filter((w) => w.enabled).map((w) => w.key);

  const stats = {
    jobs: dashboardData?.jobs?.length || 0,
    candidates: dashboardData?.candidates?.length || 0,
    clients: dashboardData?.clients?.length || 0,
    submissions: dashboardData?.submissions?.length || 0,
    interviews: dashboardData?.interviews?.length || 0,
    placements: dashboardData?.placements?.length || 0,
    timesheets: dashboardData?.timesheets?.length || 0,
    expenses: dashboardData?.expenses?.length || 0,
    activities: dashboardData?.activities?.length || 0,
    users: dashboardData?.users?.length || 0,
  };

  const toggleWidget = (key) => {
    const nextWidgets = widgets.map((w) => (w.key === key ? { ...w, enabled: !w.enabled } : w));
    savePrefsMutation.mutate(nextWidgets);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Each user sees their own personalized dashboard and scoped data.
          </p>
        </div>
        <button
          onClick={() => setShowCustomize((s) => !s)}
          className="rounded-xl border px-4 py-2 text-sm font-medium"
        >
          {showCustomize ? "Close Customize" : "Customize Dashboard"}
        </button>
      </div>

      {showCustomize && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Choose widgets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {widgets.map((widget) => (
              <label key={widget.key} className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={widget.enabled}
                  onChange={() => toggleWidget(widget.key)}
                />
                <span>{widget.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-6">Loading dashboard...</div>
      ) : error ? (
        <div className="rounded-2xl border bg-card p-6 text-red-600">{error.message}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {visibleWidgetKeys.includes("jobs") && <StatCard label="Jobs" value={stats.jobs} />}
          {visibleWidgetKeys.includes("candidates") && <StatCard label="Candidates" value={stats.candidates} />}
          {visibleWidgetKeys.includes("clients") && <StatCard label="Clients" value={stats.clients} />}
          {visibleWidgetKeys.includes("submissions") && <StatCard label="Submissions" value={stats.submissions} />}
          {visibleWidgetKeys.includes("interviews") && <StatCard label="Interviews" value={stats.interviews} />}
          {visibleWidgetKeys.includes("placements") && <StatCard label="Placements" value={stats.placements} />}
          {visibleWidgetKeys.includes("timesheets") && <StatCard label="Timesheets" value={stats.timesheets} />}
          {visibleWidgetKeys.includes("expenses") && <StatCard label="Expenses" value={stats.expenses} />}
          {visibleWidgetKeys.includes("activities") && <StatCard label="Activities" value={stats.activities} />}
          {visibleWidgetKeys.includes("users") && <StatCard label="Users" value={stats.users} />}
        </div>
      )}
    </div>
  );
}
