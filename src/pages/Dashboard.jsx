import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import {
  Briefcase, Users, Building2, Award, Calendar, DollarSign,
  FileText, UserCheck, Activity, Send, Settings2, TrendingUp,
  Clock, CalendarOff, BarChart2, PieChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart as HBarChart } from 'recharts';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';

import { useCurrentUser } from '@/lib/useCurrentUser';
import { canView } from '@/lib/permissions';

const COLORS = ['hsl(238,75%,56%)', 'hsl(172,66%,40%)', 'hsl(38,90%,52%)', 'hsl(4,74%,54%)', 'hsl(270,60%,56%)'];

// All possible widgets with access control
const getAvailableWidgets = (user) => {
  const widgets = [];

  // ATS Stats
  if (canView(user, 'jobs')) widgets.push({ id: 'stat_jobs', label: 'Open Jobs', group: 'stat' });
  if (canView(user, 'candidates')) widgets.push({ id: 'stat_candidates', label: 'Total Candidates', group: 'stat' });
  if (canView(user, 'placements')) widgets.push({ id: 'stat_placements', label: 'Active Placements', group: 'stat' });
  if (canView(user, 'submissions')) widgets.push({ id: 'stat_submissions', label: 'Submissions', group: 'stat' });

  // CRM Stats
  if (canView(user, 'clients')) widgets.push({ id: 'stat_clients', label: 'Active Clients', group: 'stat' });
  if (canView(user, 'contacts')) widgets.push({ id: 'stat_contacts', label: 'Contacts', group: 'stat' });
  if (canView(user, 'activities')) widgets.push({ id: 'stat_activities', label: 'Pending Activities', group: 'stat' });

  // Workforce Stats
  if (canView(user, 'timesheets')) widgets.push({ id: 'stat_timesheets', label: 'Timesheets Pending', group: 'stat' });
  if (canView(user, 'expenses')) widgets.push({ id: 'stat_expenses', label: 'Expenses Pending', group: 'stat' });

  // Admin stat
  if (user?.role === 'admin') widgets.push({ id: 'stat_users', label: 'Total Users', group: 'stat' });

  // Charts
  if (canView(user, 'submissions')) widgets.push({ id: 'chart_pipeline', label: 'Submission Pipeline', group: 'chart' });
  if (canView(user, 'jobs')) widgets.push({ id: 'chart_jobtypes', label: 'Jobs by Type', group: 'chart' });
  if (canView(user, 'clients')) widgets.push({ id: 'chart_clients', label: 'Clients by Status', group: 'chart' });
  if (canView(user, 'expenses')) widgets.push({ id: 'chart_expenses', label: 'Expenses by Category', group: 'chart' });

  // Lists
  if (canView(user, 'submissions')) widgets.push({ id: 'list_submissions', label: 'Recent Submissions', group: 'list' });
  if (canView(user, 'interviews')) widgets.push({ id: 'list_interviews', label: 'Upcoming Interviews', group: 'list' });
  if (canView(user, 'activities')) widgets.push({ id: 'list_activities', label: 'Recent Activities', group: 'list' });
  if (canView(user, 'timesheets')) widgets.push({ id: 'list_timesheets', label: 'Recent Timesheets', group: 'list' });

  return widgets;
};

export default function Dashboard() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState([]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [chartTypes, setChartTypes] = useState({});
  const [prefId, setPrefId] = useState(null);
  const [prefLoaded, setPrefLoaded] = useState(false);

  const availableWidgets = useMemo(() => getAvailableWidgets(user), [user]);
  const defaultOrder = useMemo(() => availableWidgets.map(w => w.id), [availableWidgets]);

  // Fetch all data (will be empty/filtered by permissions in the pages themselves)
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => base44.entities.Job.list(), enabled: canView(user, 'jobs') });
  const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: () => base44.entities.Candidate.list(), enabled: canView(user, 'candidates') });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), enabled: canView(user, 'clients') });
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: () => base44.entities.Contact.list(), enabled: canView(user, 'contacts') });
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions'], queryFn: () => base44.entities.Submission.list(), enabled: canView(user, 'submissions') });
  const { data: interviews = [] } = useQuery({ queryKey: ['interviews'], queryFn: () => base44.entities.Interview.list(), enabled: canView(user, 'interviews') });
  const { data: placements = [] } = useQuery({ queryKey: ['placements'], queryFn: () => base44.entities.Placement.list(), enabled: canView(user, 'placements') });
  const { data: timesheets = [] } = useQuery({ queryKey: ['timesheets'], queryFn: () => base44.entities.Timesheet.list(), enabled: canView(user, 'timesheets') });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => base44.entities.Expense.list(), enabled: canView(user, 'expenses') });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.Activity.list(), enabled: canView(user, 'activities') });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), enabled: user?.role === 'admin' });
  const { data: prefs = [] } = useQuery({
    queryKey: ['dashboard-prefs', user?.email],
    queryFn: () => Promise.resolve([]),
    enabled: !!user?.email,
  });

  // Load preferences
  useEffect(() => {
    if (!user?.email || prefLoaded) return;
    const mine = prefs.find(p => p.user_email === user.email);
    if (mine) {
    setPrefId(mine.id);
    try {
      const order = JSON.parse(mine.widget_order || 'null');
      const hidden = JSON.parse(mine.hidden_widgets || '[]');
      const ct = JSON.parse(mine.chart_types || '{}');
      const validIds = availableWidgets.map(w => w.id);
      if (order) setWidgetOrder(order.filter(id => validIds.includes(id)));
      if (hidden) setHiddenWidgets(hidden.filter(id => validIds.includes(id)));
      if (ct) setChartTypes(ct);
      setPrefLoaded(true);
    } catch {}
    } else if (prefs !== undefined) {
      // prefs loaded but none found — use defaults
      setWidgetOrder(defaultOrder);
      setPrefLoaded(true);
    }
  }, [prefs, user?.email, availableWidgets, defaultOrder, prefLoaded]);

  // Initialize with defaults if no prefs yet
  useEffect(() => {
    if (!prefLoaded && availableWidgets.length > 0 && widgetOrder.length === 0) {
      setWidgetOrder(defaultOrder);
    }
  }, [availableWidgets, defaultOrder, prefLoaded, widgetOrder.length]);

  const saveMutation = useMutation({
    mutationFn: ({ order, hidden, ct }) => {
      const payload = { user_email: user.email, widget_order: JSON.stringify(order), hidden_widgets: JSON.stringify(hidden), chart_types: JSON.stringify(ct || chartTypes) };
      return prefId
        ? base44.entities.DashboardPreference.update(prefId, payload)
        : Promise.resolve(payload);
    },
    onSuccess: (data) => {
      if (!prefId && data?.id) setPrefId(data.id);
      queryClient.invalidateQueries({ queryKey: ['dashboard-prefs', user?.email] });
    },
  });

  const handleOrderChange = (newOrder) => {
    setWidgetOrder(newOrder);
    saveMutation.mutate({ order: newOrder, hidden: hiddenWidgets, ct: chartTypes });
  };

  const handleToggleHidden = (id) => {
    const newHidden = hiddenWidgets.includes(id)
      ? hiddenWidgets.filter(h => h !== id)
      : [...hiddenWidgets, id];
    setHiddenWidgets(newHidden);
    saveMutation.mutate({ order: widgetOrder, hidden: newHidden, ct: chartTypes });
  };

  const handleChartTypeChange = (widgetId, type) => {
    const newCt = { ...chartTypes, [widgetId]: type };
    setChartTypes(newCt);
    saveMutation.mutate({ order: widgetOrder, hidden: hiddenWidgets, ct: newCt });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = [...widgetOrder];
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    handleOrderChange(newOrder);
  };

  // Derived stats
  const stats = useMemo(() => ({
    open_jobs: jobs.filter(j => j.status === 'open').length,
    total_candidates: candidates.length,
    active_clients: clients.filter(c => c.status === 'active').length,
    total_contacts: contacts.length,
    active_placements: placements.filter(p => p.status === 'active').length,
    total_submissions: submissions.length,
    pending_timesheets: timesheets.filter(t => t.status === 'submitted').length,
    pending_expenses: expenses.filter(e => e.status === 'submitted').length,
    pending_activities: activities.filter(a => a.status === 'pending').length,
    total_users: users.filter(u => (u.status || 'active') === 'active').length,
  }), [jobs, candidates, clients, contacts, placements, submissions, timesheets, expenses, activities, users]);

  const submissionsByStatus = ['submitted', 'client_review', 'interview_scheduled', 'offered', 'accepted', 'rejected'].map(s => ({
    name: s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: submissions.filter(sub => sub.status === s).length
  }));

  const jobsByType = ['full_time', 'contract', 'contract_to_hire', 'part_time', 'temporary']
    .map(t => ({ name: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: jobs.filter(j => j.job_type === t).length }))
    .filter(d => d.value > 0);

  const clientsByStatus = ['active', 'prospect', 'inactive', 'lost']
    .map(s => ({ name: s.replace(/\b\w/g, l => l.toUpperCase()), value: clients.filter(c => c.status === s).length }))
    .filter(d => d.value > 0);

  const expensesByCategory = ['travel', 'meals', 'equipment', 'training', 'accommodation', 'other']
    .map(c => ({ name: c.replace(/\b\w/g, l => l.toUpperCase()), value: expenses.filter(e => e.category === c).length }))
    .filter(d => d.value > 0);

  const visibleOrder = (widgetOrder.length > 0 ? widgetOrder : defaultOrder).filter(id => !hiddenWidgets.includes(id));
  const statWidgetIds = visibleOrder.filter(id => id.startsWith('stat_'));
  const nonStatIds = visibleOrder.filter(id => !id.startsWith('stat_'));

  const renderStatWidget = (id) => {
    const iconMap = {
      stat_jobs: { icon: Briefcase, label: 'Open Jobs', value: stats.open_jobs, link: '/jobs', color: 'text-indigo-600 bg-indigo-50' },
      stat_candidates: { icon: Users, label: 'Candidates', value: stats.total_candidates, link: '/candidates', color: 'text-violet-600 bg-violet-50' },
      stat_clients: { icon: Building2, label: 'Active Clients', value: stats.active_clients, link: '/clients', color: 'text-sky-600 bg-sky-50' },
      stat_contacts: { icon: UserCheck, label: 'Contacts', value: stats.total_contacts, link: '/contacts', color: 'text-cyan-600 bg-cyan-50' },
      stat_placements: { icon: Award, label: 'Active Placements', value: stats.active_placements, link: '/placements', color: 'text-emerald-600 bg-emerald-50' },
      stat_submissions: { icon: Send, label: 'Submissions', value: stats.total_submissions, link: '/submissions', color: 'text-amber-600 bg-amber-50' },
      stat_timesheets: { icon: Clock, label: 'Timesheets Pending', value: stats.pending_timesheets, link: '/workforce/timesheets', color: 'text-orange-600 bg-orange-50' },
      stat_expenses: { icon: DollarSign, label: 'Expenses Pending', value: stats.pending_expenses, link: '/workforce/expenses', color: 'text-rose-600 bg-rose-50' },
      stat_activities: { icon: Activity, label: 'Pending Activities', value: stats.pending_activities, link: '/activities', color: 'text-teal-600 bg-teal-50' },
      stat_users: { icon: Users, label: 'Active Users', value: stats.total_users, link: '/admin/users', color: 'text-purple-600 bg-purple-50' },
    };
    const s = iconMap[id];
    if (!s) return null;
    const Icon = s.icon;
    return (
      <Link key={id} to={s.link} className="block hover:no-underline group">
        <Card className="hover:shadow-md transition-all group-hover:ring-1 group-hover:ring-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'chart_pipeline': {
        const ct = chartTypes['chart_pipeline'] || 'bar';
        return (
          <Card key={id}>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart2 className="w-4 h-4 text-muted-foreground" />Submission Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  {ct === 'line' ? (
                    <LineChart data={submissionsByStatus} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={48} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(238,75%,56%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  ) : ct === 'horizontal_bar' ? (
                    <BarChart data={submissionsByStatus} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(238,75%,56%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={submissionsByStatus} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={48} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(238,75%,56%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      }
      case 'chart_jobtypes': {
        const ct = chartTypes['chart_jobtypes'] || 'pie';
        return (
          <Card key={id}>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-muted-foreground" />Jobs by Type</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {jobsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {ct === 'bar' ? (
                      <BarChart data={jobsByType} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(238,75%,56%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : ct === 'horizontal_bar' ? (
                      <BarChart data={jobsByType} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(238,75%,56%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie data={jobsByType} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                          {jobsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No jobs yet</div>}
              </div>
              {jobsByType.length > 0 && ct === 'pie' && (
  <div className="flex flex-wrap gap-2 mt-2 justify-center">
    {jobsByType.map((item, i) => (
      <div key={item.name} className="flex items-center gap-1.5 text-xs">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: COLORS[i % COLORS.length] }}
        />
        <span className="text-muted-foreground">
          {item.name} ({item.value})
        </span>
      </div>
    ))}
  </div>
)}
            </CardContent>
          </Card>
        );
      }
      case 'chart_clients': {
        const ct = chartTypes['chart_clients'] || 'pie';
        return (
          <Card key={id}>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />Clients by Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {clientsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {ct === 'bar' ? (
                      <BarChart data={clientsByStatus} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(172,66%,40%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : ct === 'horizontal_bar' ? (
                      <BarChart data={clientsByStatus} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(172,66%,40%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie data={clientsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                          {clientsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No clients yet</div>}
              </div>
              {clientsByStatus.length > 0 && ct === 'pie' && (
  <div className="flex flex-wrap gap-2 mt-2 justify-center">
    {clientsByStatus.map((item, i) => (
      <div key={item.name} className="flex items-center gap-1.5 text-xs">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: COLORS[i % COLORS.length] }}
        />
        <span className="text-muted-foreground">
          {item.name} ({item.value})
        </span>
      </div>
    ))}
  </div>
)}
            </CardContent>
          </Card>
        );
      }
      case 'chart_expenses':
        return (
          <Card key={id}>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" />Expenses by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesByCategory} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(172,66%,40%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No expenses yet</div>}
              </div>
            </CardContent>
          </Card>
        );
      case 'list_submissions':
        return (
          <Card key={id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
                <Link to="/submissions" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {submissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sub.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{sub.job_title} · {sub.client_name}</p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              ))}
              {submissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No submissions yet</p>}
            </CardContent>
          </Card>
        );
      case 'list_interviews':
        return (
          <Card key={id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Upcoming Interviews</CardTitle>
                <Link to="/interviews" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {interviews.filter(i => i.status === 'scheduled').slice(0, 5).map(iv => (
                <div key={iv.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{iv.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{iv.job_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{iv.interview_date ? format(new Date(iv.interview_date), 'MMM d, h:mm a') : '-'}</p>
                    <StatusBadge status={iv.interview_type} />
                  </div>
                </div>
              ))}
              {interviews.filter(i => i.status === 'scheduled').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No upcoming interviews</p>
              )}
            </CardContent>
          </Card>
        );
      case 'list_activities':
        return (
          <Card key={id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
                <Link to="/activities" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {activities.filter(a => a.status === 'pending').slice(0, 5).map(act => (
                <div key={act.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{act.subject}</p>
                    <p className="text-xs text-muted-foreground">{act.related_to}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={act.type} />
                    <p className="text-xs text-muted-foreground mt-1">{act.due_date ? format(new Date(act.due_date), 'MMM d') : ''}</p>
                  </div>
                </div>
              ))}
              {activities.filter(a => a.status === 'pending').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No pending activities</p>
              )}
            </CardContent>
          </Card>
        );
      case 'list_timesheets':
        return (
          <Card key={id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Timesheets</CardTitle>
                <Link to="/workforce/timesheets" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {timesheets.slice(0, 5).map(ts => {
                const total = (ts.monday_hours||0)+(ts.tuesday_hours||0)+(ts.wednesday_hours||0)+(ts.thursday_hours||0)+(ts.friday_hours||0)+(ts.saturday_hours||0)+(ts.sunday_hours||0);
                return (
                  <div key={ts.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{ts.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{ts.week_start ? format(new Date(ts.week_start), 'MMM d') : ''} · {total}h</p>
                    </div>
                    <StatusBadge status={ts.status} />
                  </div>
                );
              })}
              {timesheets.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No timesheets yet</p>}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
  <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}. Here's your overview.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCustomizerOpen(true)}
        className="gap-2"
      >
        <Settings2 className="w-4 h-4" />
        Customize
      </Button>
    </div>

    {/* Stat cards */}
    {statWidgetIds.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statWidgetIds.map((id) => (
          <div key={id}>
            {renderStatWidget(id)}
          </div>
        ))}
      </div>
    )}

    {/* Charts & Lists */}
    {nonStatIds.length > 0 && (
      <div className="grid lg:grid-cols-2 gap-5">
        {nonStatIds.map((id) => (
          <div key={id}>
            {renderWidget(id)}
          </div>
        ))}
      </div>
    )}

    {availableWidgets.length === 0 && (
      <Card className="p-12 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          No widgets available for your role.
        </p>
      </Card>
    )}

    <DashboardCustomizer
      open={customizerOpen}
      onOpenChange={setCustomizerOpen}
      widgets={availableWidgets}
      order={widgetOrder.length > 0 ? widgetOrder : defaultOrder}
      hidden={hiddenWidgets}
      onOrderChange={handleOrderChange}
      onToggleHidden={handleToggleHidden}
      chartTypes={chartTypes}
      onChartTypeChange={handleChartTypeChange}
    />
  </div>
);
}