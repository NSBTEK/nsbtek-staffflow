import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import {
  Briefcase,
  Users,
  Building2,
  UserRound,
  Send,
  CalendarClock,
  BadgeCheck,
  Clock3,
  Receipt,
  Activity,
  Sparkles,
  EyeOff,
  GripVertical,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { listDashboardData } from "@/lib/dashboardScope";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

const PIE_COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444"];

function DashboardCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function KPIBox({ label, value, icon: Icon, subtitle, trend }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold">{value}</div>
          {subtitle ? <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div> : null}
          {trend ? <div className="mt-1 text-xs text-slate-500">{trend}</div> : null}
        </div>
        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ChartRenderer({ type, data }) {
  if (!data?.length) {
    return <div className="grid h-[280px] place-items-center text-sm text-slate-500">No data available</div>;
  }

  if (type === "pie") {
    return (
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "line") {
    return (
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "area") {
    return (
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#bfdbfe" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={24}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function sumCurrency(rows = [], field) {
  return rows.reduce((sum, row) => sum + Number(row?.[field] || 0), 0);
}

function groupByStatus(rows = []) {
  const map = {};
  rows.forEach((row) => {
    const key = String(row?.status || "unknown").trim() || "unknown";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function groupByMonth(rows = []) {
  const map = {};
  rows.forEach((row) => {
    const raw = row?.created_at || row?.updated_at;
    if (!raw) return;
    const d = new Date(raw);
    const name = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    map[name] = (map[name] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function getAvailableWidgets() {
  return [
    { id: "stat_jobs", label: "Open Jobs" },
    { id: "stat_candidates", label: "Candidates" },
    { id: "stat_clients", label: "Active Clients" },
    { id: "stat_contacts", label: "Contacts" },
    { id: "stat_submissions", label: "Submissions" },
    { id: "stat_interviews", label: "Interviews" },
    { id: "stat_placements", label: "Placements" },
    { id: "stat_timesheets", label: "Timesheets Pending" },
    { id: "stat_expenses", label: "Expenses" },
    { id: "stat_activities", label: "Pending Activities" },
    { id: "stat_users", label: "Users" },
    { id: "chart_pipeline", label: "Submission Pipeline" },
    { id: "chart_jobs", label: "Jobs by Month" },
    { id: "chart_candidates", label: "Candidates by Month" },
    { id: "chart_clients", label: "Clients by Status" },
    { id: "chart_expenses", label: "Expenses by Month" },
  ];
}

async function listDashboardPreferences(currentUser) {
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

export default function Dashboard() {
  const { authUser } = useAuth();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState([]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [chartTypes, setChartTypes] = useState({});
  const [prefLoaded, setPrefLoaded] = useState(false);

  const availableWidgets = useMemo(() => getAvailableWidgets(), []);
  const defaultOrder = useMemo(() => availableWidgets.map((w) => w.id), [availableWidgets]);

  useRealtimeInvalidate({
    enabled: !!authUser?.id && !!user?.organization_id,
    channelName: "rt-dashboard-jobs",
    table: "jobs",
    filter: `organization_id=eq.${user?.organization_id}`,
    queryKeys: [["dashboard-data", authUser?.id]],
  });

  useRealtimeInvalidate({
    enabled: !!authUser?.id && !!user?.organization_id,
    channelName: "rt-dashboard-candidates",
    table: "candidates",
    filter: `organization_id=eq.${user?.organization_id}`,
    queryKeys: [["dashboard-data", authUser?.id]],
  });

  useRealtimeInvalidate({
    enabled: !!authUser?.id && !!user?.organization_id,
    channelName: "rt-dashboard-submissions",
    table: "submissions",
    filter: `organization_id=eq.${user?.organization_id}`,
    queryKeys: [["dashboard-data", authUser?.id]],
  });

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-data", authUser?.id],
    queryFn: () => listDashboardData(authUser),
    enabled: !!authUser?.id,
  });

  const { data: prefs } = useQuery({
    queryKey: ["dashboard-prefs", authUser?.id],
    queryFn: () => listDashboardPreferences(authUser),
    enabled: !!authUser?.id,
  });

  const saveMutation = useMutation({
    mutationFn: ({ order, hidden, ct }) =>
      saveDashboardPreferences(authUser, {
        order,
        hidden,
        chartTypes: ct || chartTypes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-prefs", authUser?.id] });
    },
  });

  useEffect(() => {
    if (!authUser?.id || prefLoaded) return;

    const validIds = availableWidgets.map((w) => w.id);

    if (prefs?.widgets) {
      const savedOrder = Array.isArray(prefs.widgets.order)
        ? prefs.widgets.order
        : defaultOrder;
      const savedHidden = Array.isArray(prefs.widgets.hidden)
        ? prefs.widgets.hidden
        : [];
      const savedChartTypes = prefs.widgets.chartTypes || {};

      const finalOrder = savedOrder.filter((id) => validIds.includes(id));
      const missingIds = validIds.filter((id) => !finalOrder.includes(id));

      setWidgetOrder([...finalOrder, ...missingIds]);
      setHiddenWidgets(savedHidden.filter((id) => validIds.includes(id)));
      setChartTypes(savedChartTypes);
      setPrefLoaded(true);
      return;
    }

    setWidgetOrder(defaultOrder);
    setHiddenWidgets([]);
    setChartTypes({});
    setPrefLoaded(true);
  }, [prefs, authUser?.id, availableWidgets, defaultOrder, prefLoaded]);

  const jobs = dashboardData?.jobs || [];
  const candidates = dashboardData?.candidates || [];
  const clients = dashboardData?.clients || [];
  const contacts = dashboardData?.contacts || [];
  const submissions = dashboardData?.submissions || [];
  const interviews = dashboardData?.interviews || [];
  const placements = dashboardData?.placements || [];
  const timesheets = dashboardData?.timesheets || [];
  const expenses = dashboardData?.expenses || [];
  const activities = dashboardData?.activities || [];
  const users = dashboardData?.users || [];

  const stats = useMemo(() => {
    return {
      openJobs: jobs.filter((j) => String(j.status || "").toLowerCase() !== "closed").length,
      totalCandidates: candidates.length,
      activeClients: clients.filter((c) => String(c.status || "").toLowerCase() !== "inactive").length,
      totalContacts: contacts.length,
      totalSubmissions: submissions.length,
      scheduledInterviews: interviews.filter((i) =>
        ["scheduled", "pending"].includes(String(i.status || "").toLowerCase()))
        .length,
      totalPlacements: placements.length,
      pendingTimesheets: timesheets.filter(
        (t) => String(t.status || "").toLowerCase() === "submitted"
      ).length,
      totalExpenses: sumCurrency(expenses, "amount"),
      pendingActivities: activities.filter((a) =>
        ["open", "pending"].includes(String(a.status || "").toLowerCase()))
        .length,
      totalUsers: users.length,
    };
  }, [
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
  ]);

  const widgetMap = useMemo(
    () => ({
      stat_jobs: {
        render: () => (
          <KPIBox
            label="Open Jobs"
            value={stats.openJobs}
            icon={Briefcase}
            subtitle="Active hiring demand"
            trend={`${jobs.length} total jobs`}
          />
        ),
      },
      stat_candidates: {
        render: () => (
          <KPIBox
            label="Candidates"
            value={stats.totalCandidates}
            icon={Users}
            subtitle="Talent pool size"
            trend="Live from ATS"
          />
        ),
      },
      stat_clients: {
        render: () => (
          <KPIBox
            label="Active Clients"
            value={stats.activeClients}
            icon={Building2}
            subtitle="Current client base"
          />
        ),
      },
      stat_contacts: {
        render: () => (
          <KPIBox
            label="Contacts"
            value={stats.totalContacts}
            icon={UserRound}
            subtitle="Client relationships"
          />
        ),
      },
      stat_submissions: {
        render: () => (
          <KPIBox
            label="Submissions"
            value={stats.totalSubmissions}
            icon={Send}
            subtitle="Pipeline movement"
          />
        ),
      },
      stat_interviews: {
        render: () => (
          <KPIBox
            label="Interviews"
            value={stats.scheduledInterviews}
            icon={CalendarClock}
            subtitle="Upcoming and pending"
          />
        ),
      },
      stat_placements: {
        render: () => (
          <KPIBox
            label="Placements"
            value={stats.totalPlacements}
            icon={BadgeCheck}
            subtitle="Successful hires"
          />
        ),
      },
      stat_timesheets: {
        render: () => (
          <KPIBox
            label="Timesheets Pending"
            value={stats.pendingTimesheets}
            icon={Clock3}
            subtitle="Awaiting approval"
          />
        ),
      },
      stat_expenses: {
        render: () => (
          <KPIBox
            label="Expenses"
            value={`$${stats.totalExpenses.toLocaleString()}`}
            icon={Receipt}
            subtitle="Tracked costs"
          />
        ),
      },
      stat_activities: {
        render: () => (
          <KPIBox
            label="Pending Activities"
            value={stats.pendingActivities}
            icon={Activity}
            subtitle="Follow-ups and tasks"
          />
        ),
      },
      stat_users: {
        render: () => (
          <KPIBox
            label="Users"
            value={stats.totalUsers}
            icon={Sparkles}
            subtitle="Organization seats"
          />
        ),
      },
      chart_pipeline: {
        render: () => (
          <DashboardCard title="Submission Pipeline" subtitle="Submission status distribution">
            <ChartRenderer type={chartTypes.chart_pipeline || "pie"} data={groupByStatus(submissions)} />
          </DashboardCard>
        ),
      },
      chart_jobs: {
        render: () => (
          <DashboardCard title="Jobs by Month" subtitle="Recent trend">
            <ChartRenderer type={chartTypes.chart_jobs || "area"} data={groupByMonth(jobs)} />
          </DashboardCard>
        ),
      },
      chart_candidates: {
        render: () => (
          <DashboardCard title="Candidates by Month" subtitle="Talent acquisition trend">
            <ChartRenderer type={chartTypes.chart_candidates || "line"} data={groupByMonth(candidates)} />
          </DashboardCard>
        ),
      },
      chart_clients: {
        render: () => (
          <DashboardCard title="Clients by Status" subtitle="Relationship health">
            <ChartRenderer type={chartTypes.chart_clients || "pie"} data={groupByStatus(clients)} />
          </DashboardCard>
        ),
      },
      chart_expenses: {
        render: () => (
          <DashboardCard title="Expenses by Month" subtitle="Cost trend">
            <ChartRenderer type={chartTypes.chart_expenses || "bar"} data={groupByMonth(expenses)} />
          </DashboardCard>
        ),
      },
    }),
    [stats, jobs.length, submissions, chartTypes, jobs, candidates, clients, expenses]
  );

  const orderedVisibleWidgets = widgetOrder.filter((id) => !hiddenWidgets.includes(id));

  const moveWidget = (id, direction) => {
    const index = widgetOrder.indexOf(id);
    if (index < 0) return;

    const next = [...widgetOrder];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setWidgetOrder(next);
    saveMutation.mutate({ order: next, hidden: hiddenWidgets });
  };

  const toggleHidden = (id) => {
    const nextHidden = hiddenWidgets.includes(id)
      ? hiddenWidgets.filter((x) => x !== id)
      : [...hiddenWidgets, id];

    setHiddenWidgets(nextHidden);
    saveMutation.mutate({ order: widgetOrder, hidden: nextHidden });
  };

  const setChartType = (widgetId, type) => {
    const next = { ...chartTypes, [widgetId]: type };
    setChartTypes(next);
    saveMutation.mutate({ order: widgetOrder, hidden: hiddenWidgets, ct: next });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Customizable executive overview with live stats and charts.
            </p>
          </div>

          <button
            onClick={() => setCustomizerOpen((s) => !s)}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            {customizerOpen ? "Close Customize" : "Customize Dashboard"}
          </button>
        </div>

        {customizerOpen && (
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Customize widgets</h2>

            <div className="space-y-3">
              {widgetOrder.map((id) => {
                const widget = availableWidgets.find((w) => w.id === id);
                if (!widget) return null;

                const hidden = hiddenWidgets.includes(id);

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <span className={hidden ? "text-slate-400 line-through" : ""}>
                        {widget.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {id.startsWith("chart_") && (
                        <select
                          value={chartTypes[id] || "bar"}
                          onChange={(e) => setChartType(id, e.target.value)}
                          className="rounded-lg border px-2 py-1 text-sm"
                        >
                          <option value="bar">Bar</option>
                          <option value="line">Line</option>
                          <option value="area">Area</option>
                          <option value="pie">Pie</option>
                        </select>
                      )}

                      <button
                        onClick={() => moveWidget(id, "up")}
                        className="rounded-lg border px-2 py-1 text-sm"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveWidget(id, "down")}
                        className="rounded-lg border px-2 py-1 text-sm"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleHidden(id)}
                        className="rounded-lg border px-2 py-1 text-sm"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border bg-card p-6">Loading dashboard...</div>
        ) : error ? (
          <div className="rounded-2xl border bg-card p-6 text-red-600">{error.message}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {orderedVisibleWidgets.map((id) => (
              <div key={id} className={id.startsWith("chart_") ? "md:col-span-2" : ""}>
                {widgetMap[id]?.render?.()}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}