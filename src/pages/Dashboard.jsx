import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Settings2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardCustomizer from "@/components/dashboard/DashboardCustomizer";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { useCurrentUser } from "@/lib/useCurrentUser";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

async function listDashboardData(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);
  const orgId = profile.organization_id;

  const [
    jobsRes,
    candidatesRes,
    clientsRes,
    contactsRes,
    submissionsRes,
    interviewsRes,
    placementsRes,
    timesheetsRes,
    expensesRes,
    activitiesRes,
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("organization_id", orgId),
    supabase.from("candidates").select("*").eq("organization_id", orgId),
    supabase.from("clients").select("*").eq("organization_id", orgId),
    supabase.from("contacts").select("*").eq("organization_id", orgId),
    supabase.from("submissions").select("*").eq("organization_id", orgId),
    supabase.from("interviews").select("*").eq("organization_id", orgId),
    supabase.from("placements").select("*").eq("organization_id", orgId),
    supabase.from("timesheets").select("*").eq("organization_id", orgId),
    supabase.from("expenses").select("*").eq("organization_id", orgId),
    supabase.from("activities").select("*").eq("organization_id", orgId),
  ]);

  const results = [
    jobsRes,
    candidatesRes,
    clientsRes,
    contactsRes,
    submissionsRes,
    interviewsRes,
    placementsRes,
    timesheetsRes,
    expensesRes,
    activitiesRes,
  ];

  for (const res of results) {
    if (res.error) throw res.error;
  }

  return {
    jobs: jobsRes.data || [],
    candidates: candidatesRes.data || [],
    clients: clientsRes.data || [],
    contacts: contactsRes.data || [],
    submissions: submissionsRes.data || [],
    interviews: interviewsRes.data || [],
    placements: placementsRes.data || [],
    timesheets: timesheetsRes.data || [],
    expenses: expensesRes.data || [],
    activities: activitiesRes.data || [],
  };
}

async function listDashboardPreferences(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("dashboard_preferences")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function saveDashboardPreferences(currentUser, widgetsPayload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const payload = {
    user_id: currentUser.id,
    organization_id: profile.organization_id,
    widgets: widgetsPayload,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("dashboard_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function monthLabel(dateValue) {
  const d = new Date(dateValue);
  return d.toLocaleString("en-US", { month: "short" });
}

function groupByMonth(rows, dateKey = "created_at") {
  const map = new Map();

  rows.forEach((row) => {
    const raw = row?.[dateKey];
    if (!raw) return;
    const d = new Date(raw);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    map.set(key, { key, name: label, value: (map.get(key)?.value || 0) + 1 });
  });

  return Array.from(map.values()).slice(-6);
}

function groupByStatus(rows, field = "status") {
  const counts = {};
  rows.forEach((row) => {
    const key = row?.[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function MetricCard({ title, value, icon: Icon }) {
  return (
    <Card className="h-full">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
        </div>
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">{children}</CardContent>
    </Card>
  );
}

function ListCard({ title, items, emptyText, renderItem }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          items.map(renderItem)
        )}
      </CardContent>
    </Card>
  );
}

function RenderChart({ type, data }) {
  if (!data?.length) {
    return <div className="h-full grid place-items-center text-sm text-muted-foreground">No data available</div>;
  }

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "horizontal_bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState([]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [chartTypes, setChartTypes] = useState({});
  const [prefLoaded, setPrefLoaded] = useState(false);

  const {
    data: dashboardData = {
      jobs: [],
      candidates: [],
      clients: [],
      contacts: [],
      submissions: [],
      interviews: [],
      placements: [],
      timesheets: [],
      expenses: [],
      activities: [],
    },
    isLoading,
  } = useQuery({
    queryKey: ["dashboard-data", user?.id],
    queryFn: () => listDashboardData(user),
    enabled: !!user?.id,
  });

  const { data: prefs } = useQuery({
    queryKey: ["dashboard-prefs", user?.id],
    queryFn: () => listDashboardPreferences(user),
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: ({ order, hidden, ct }) =>
      saveDashboardPreferences(user, {
        order,
        hidden,
        chartTypes: ct || chartTypes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard-prefs", user?.id] });
    },
  });

  const {
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
  } = dashboardData;

  const stats = useMemo(() => {
    const approvedTimesheets = timesheets.filter((t) =>
      ["approved", "invoiced"].includes(String(t.status || "").toLowerCase())
    );

    const totalBillable = approvedTimesheets.reduce((sum, t) => {
      const hours = Number(t.hours || 0);
      const rate = Number(t.bill_rate || t.rate || 0);
      return sum + hours * rate;
    }, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      open_jobs: jobs.filter((j) => String(j.status || "").toLowerCase() !== "closed").length,
      total_candidates: candidates.length,
      active_clients: clients.filter((c) => String(c.status || "").toLowerCase() !== "inactive").length,
      total_contacts: contacts.length,
      total_submissions: submissions.length,
      scheduled_interviews: interviews.filter((i) =>
        ["scheduled", "pending"].includes(String(i.status || "").toLowerCase())
      ).length,
      total_placements: placements.length,
      approved_timesheets: approvedTimesheets.length,
      total_expenses: totalExpenses,
      total_billable: totalBillable,
      total_activities: activities.length,
    };
  }, [jobs, candidates, clients, contacts, submissions, interviews, placements, timesheets, expenses, activities]);

  const availableWidgets = useMemo(() => {
    return [
      {
        id: "open_jobs",
        label: "Open Jobs",
        group: "stat",
        render: () => <MetricCard title="Open Jobs" value={stats.open_jobs} icon={Briefcase} />,
      },
      {
        id: "total_candidates",
        label: "Candidates",
        group: "stat",
        render: () => <MetricCard title="Candidates" value={stats.total_candidates} icon={Users} />,
      },
      {
        id: "active_clients",
        label: "Active Clients",
        group: "stat",
        render: () => <MetricCard title="Active Clients" value={stats.active_clients} icon={Building2} />,
      },
      {
        id: "total_contacts",
        label: "Contacts",
        group: "stat",
        render: () => <MetricCard title="Contacts" value={stats.total_contacts} icon={UserRound} />,
      },
      {
        id: "total_submissions",
        label: "Submissions",
        group: "stat",
        render: () => <MetricCard title="Submissions" value={stats.total_submissions} icon={Send} />,
      },
      {
        id: "scheduled_interviews",
        label: "Scheduled Interviews",
        group: "stat",
        render: () => <MetricCard title="Scheduled Interviews" value={stats.scheduled_interviews} icon={CalendarClock} />,
      },
      {
        id: "total_placements",
        label: "Placements",
        group: "stat",
        render: () => <MetricCard title="Placements" value={stats.total_placements} icon={BadgeCheck} />,
      },
      {
        id: "approved_timesheets",
        label: "Approved Timesheets",
        group: "stat",
        render: () => <MetricCard title="Approved Timesheets" value={stats.approved_timesheets} icon={Clock3} />,
      },
      {
        id: "total_expenses",
        label: "Expenses",
        group: "stat",
        render: () => <MetricCard title="Expenses" value={formatMoney(stats.total_expenses)} icon={Receipt} />,
      },
      {
        id: "total_billable",
        label: "Billable Revenue",
        group: "stat",
        render: () => <MetricCard title="Billable Revenue" value={formatMoney(stats.total_billable)} icon={Building2} />,
      },
      {
        id: "jobs_by_month",
        label: "Jobs by Month",
        group: "chart",
        render: () => (
          <ChartCard title="Jobs by Month">
            <RenderChart type={chartTypes.jobs_by_month || "bar"} data={groupByMonth(jobs)} />
          </ChartCard>
        ),
      },
      {
        id: "candidates_by_month",
        label: "Candidates by Month",
        group: "chart",
        render: () => (
          <ChartCard title="Candidates by Month">
            <RenderChart type={chartTypes.candidates_by_month || "line"} data={groupByMonth(candidates)} />
          </ChartCard>
        ),
      },
      {
        id: "submissions_by_status",
        label: "Submissions by Status",
        group: "chart",
        render: () => (
          <ChartCard title="Submissions by Status">
            <RenderChart type={chartTypes.submissions_by_status || "pie"} data={groupByStatus(submissions)} />
          </ChartCard>
        ),
      },
      {
        id: "interviews_by_status",
        label: "Interviews by Status",
        group: "chart",
        render: () => (
          <ChartCard title="Interviews by Status">
            <RenderChart type={chartTypes.interviews_by_status || "horizontal_bar"} data={groupByStatus(interviews)} />
          </ChartCard>
        ),
      },
      {
        id: "recent_jobs",
        label: "Recent Jobs",
        group: "list",
        render: () => (
          <ListCard
            title="Recent Jobs"
            items={[...jobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)}
            emptyText="No jobs found."
            renderItem={(job) => (
              <div key={job.id} className="rounded-lg border p-3">
                <div className="font-medium">{job.title || job.job_title || "Untitled Job"}</div>
                <div className="text-sm text-muted-foreground">{job.status || "No status"}</div>
              </div>
            )}
          />
        ),
      },
      {
        id: "recent_candidates",
        label: "Recent Candidates",
        group: "list",
        render: () => (
          <ListCard
            title="Recent Candidates"
            items={[...candidates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)}
            emptyText="No candidates found."
            renderItem={(candidate) => (
              <div key={candidate.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  {candidate.full_name ||
                    `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() ||
                    "Unnamed Candidate"}
                </div>
                <div className="text-sm text-muted-foreground">{candidate.status || "No status"}</div>
              </div>
            )}
          />
        ),
      },
      {
        id: "recent_activities",
        label: "Recent Activities",
        group: "list",
        render: () => (
          <ListCard
            title="Recent Activities"
            items={[...activities].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)}
            emptyText="No activities found."
            renderItem={(activity) => (
              <div key={activity.id} className="rounded-lg border p-3">
                <div className="font-medium">{activity.subject || activity.title || "Activity"}</div>
                <div className="text-sm text-muted-foreground">
                  {activity.activity_type || activity.status || "No type"}
                </div>
              </div>
            )}
          />
        ),
      },
      {
        id: "recent_expenses",
        label: "Recent Expenses",
        group: "list",
        render: () => (
          <ListCard
            title="Recent Expenses"
            items={[...expenses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)}
            emptyText="No expenses found."
            renderItem={(expense) => (
              <div key={expense.id} className="rounded-lg border p-3">
                <div className="font-medium">{expense.category || expense.title || "Expense"}</div>
                <div className="text-sm text-muted-foreground">{formatMoney(expense.amount)}</div>
              </div>
            )}
          />
        ),
      },
      {
        id: "recent_timesheets",
        label: "Recent Timesheets",
        group: "list",
        render: () => (
          <ListCard
            title="Recent Timesheets"
            items={[...timesheets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)}
            emptyText="No timesheets found."
            renderItem={(timesheet) => (
              <div key={timesheet.id} className="rounded-lg border p-3">
                <div className="font-medium">{timesheet.employee_name || timesheet.title || "Timesheet"}</div>
                <div className="text-sm text-muted-foreground">
                  {Number(timesheet.hours || 0)} hrs · {timesheet.status || "No status"}
                </div>
              </div>
            )}
          />
        ),
      },
    ];
  }, [stats, jobs, candidates, submissions, interviews, activities, expenses, timesheets, chartTypes]);

  const defaultOrder = useMemo(() => availableWidgets.map((w) => w.id), [availableWidgets]);

  useEffect(() => {
    if (!defaultOrder.length) return;
    if (!widgetOrder.length) setWidgetOrder(defaultOrder);
  }, [defaultOrder, widgetOrder.length]);

  useEffect(() => {
    if (!user?.id || prefLoaded === true) return;

    const validIds = availableWidgets.map((w) => w.id);

    if (prefs?.widgets) {
      const savedOrder = Array.isArray(prefs.widgets.order) ? prefs.widgets.order : null;
      const savedHidden = Array.isArray(prefs.widgets.hidden) ? prefs.widgets.hidden : [];
      const savedChartTypes = prefs.widgets.chartTypes || {};

      setWidgetOrder(savedOrder ? savedOrder.filter((id) => validIds.includes(id)) : defaultOrder);
      setHiddenWidgets(savedHidden.filter((id) => validIds.includes(id)));
      setChartTypes(savedChartTypes);
      setPrefLoaded(true);
      return;
    }

    setWidgetOrder(defaultOrder);
    setHiddenWidgets([]);
    setChartTypes({});
    setPrefLoaded(true);
  }, [prefs, user?.id, availableWidgets, defaultOrder, prefLoaded]);

  const visibleWidgets = useMemo(() => {
    const map = new Map(availableWidgets.map((w) => [w.id, w]));
    return widgetOrder
      .map((id) => map.get(id))
      .filter(Boolean)
      .filter((w) => !hiddenWidgets.includes(w.id));
  }, [availableWidgets, widgetOrder, hiddenWidgets]);

  const handleOrderChange = (nextOrder) => {
    setWidgetOrder(nextOrder);
    saveMutation.mutate({ order: nextOrder, hidden: hiddenWidgets, ct: chartTypes });
  };

  const handleToggleHidden = (widgetId) => {
    const nextHidden = hiddenWidgets.includes(widgetId)
      ? hiddenWidgets.filter((id) => id !== widgetId)
      : [...hiddenWidgets, widgetId];

    setHiddenWidgets(nextHidden);
    saveMutation.mutate({ order: widgetOrder, hidden: nextHidden, ct: chartTypes });
  };

  const handleChartTypeChange = (widgetId, nextType) => {
    const nextChartTypes = { ...chartTypes, [widgetId]: nextType };
    setChartTypes(nextChartTypes);
    saveMutation.mutate({ order: widgetOrder, hidden: hiddenWidgets, ct: nextChartTypes });
  };

  const statWidgets = visibleWidgets.filter((w) => w.group === "stat");
  const chartWidgets = visibleWidgets.filter((w) => w.group === "chart");
  const listWidgets = visibleWidgets.filter((w) => w.group === "list");

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live metrics, charts, and lists from your organization data.
          </p>
        </div>

        <Button variant="outline" onClick={() => setCustomizerOpen(true)}>
          <Settings2 className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>

      {statWidgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statWidgets.map((widget) => (
            <div key={widget.id}>{widget.render()}</div>
          ))}
        </div>
      )}

      {chartWidgets.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          {chartWidgets.map((widget) => (
            <div key={widget.id}>{widget.render()}</div>
          ))}
        </div>
      )}

      {listWidgets.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          {listWidgets.map((widget) => (
            <div key={widget.id}>{widget.render()}</div>
          ))}
        </div>
      )}

      <DashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        widgets={availableWidgets}
        order={widgetOrder}
        hidden={hiddenWidgets}
        onOrderChange={handleOrderChange}
        onToggleHidden={handleToggleHidden}
        chartTypes={chartTypes}
        onChartTypeChange={handleChartTypeChange}
      />
    </div>
  );
}