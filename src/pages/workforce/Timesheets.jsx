import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';
import LeaveRequestDialog from '@/components/timesheets/LeaveRequestDialog';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { canEdit, isOwnOnly } from '@/lib/permissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertCircle, FileText, CalendarOff } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { notifyChange } from '@/lib/notifications';

const timesheetColumns = [
  { header: 'Employee', sortKey: 'employee_name', render: (r) => <span className="font-medium">{r.employee_name}</span> },
  { header: 'Client', sortKey: 'client_name', accessor: 'client_name' },
  { header: 'Week Of', sortKey: 'week_start', render: (r) => r.week_start ? format(new Date(r.week_start), 'MMM d, yyyy') : '-' },
  { header: 'Mon', render: (r) => <span className="text-muted-foreground">{r.monday_hours || 0}h</span> },
  { header: 'Tue', render: (r) => <span className="text-muted-foreground">{r.tuesday_hours || 0}h</span> },
  { header: 'Wed', render: (r) => <span className="text-muted-foreground">{r.wednesday_hours || 0}h</span> },
  { header: 'Thu', render: (r) => <span className="text-muted-foreground">{r.thursday_hours || 0}h</span> },
  { header: 'Fri', render: (r) => <span className="text-muted-foreground">{r.friday_hours || 0}h</span> },
  { header: 'Total', sortKey: 'total_hours', render: (r) => {
    const t = (r.monday_hours||0)+(r.tuesday_hours||0)+(r.wednesday_hours||0)+(r.thursday_hours||0)+(r.friday_hours||0)+(r.saturday_hours||0)+(r.sunday_hours||0);
    return <span className="font-semibold">{t}h</span>;
  }},
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const leaveColumns = [
  { header: 'Employee', sortKey: 'employee_name', render: (r) => <span className="font-medium">{r.employee_name}</span> },
  { header: 'Type', render: (r) => <StatusBadge status={r.leave_type} /> },
  { header: 'Start', sortKey: 'start_date', render: (r) => r.start_date ? format(new Date(r.start_date), 'MMM d, yyyy') : '-' },
  { header: 'End', sortKey: 'end_date', render: (r) => r.end_date ? format(new Date(r.end_date), 'MMM d, yyyy') : '-' },
  { header: 'Days', sortKey: 'days', render: (r) => r.days ? `${r.days}d` : '-' },
  { header: 'Reason', render: (r) => <span className="text-muted-foreground text-xs truncate max-w-[160px] block">{r.reason}</span> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const employeeFields = [
  { name: 'employee_name', label: 'Your Name', required: true },
  { name: 'employee_email', label: 'Your Email', type: 'email' },
  { name: 'client_name', label: 'Client' },
  { name: 'job_title', label: 'Job Title' },
  { name: 'week_start', label: 'Week Start (Monday)', type: 'date', required: true },
  { name: 'week_end', label: 'Week End (Friday)', type: 'date' },
  { name: 'monday_hours', label: 'Monday Hours', type: 'number', default: 0 },
  { name: 'tuesday_hours', label: 'Tuesday Hours', type: 'number', default: 0 },
  { name: 'wednesday_hours', label: 'Wednesday Hours', type: 'number', default: 0 },
  { name: 'thursday_hours', label: 'Thursday Hours', type: 'number', default: 0 },
  { name: 'friday_hours', label: 'Friday Hours', type: 'number', default: 0 },
  { name: 'saturday_hours', label: 'Saturday Hours', type: 'number', default: 0 },
  { name: 'sunday_hours', label: 'Sunday Hours', type: 'number', default: 0 },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const managerFields = [
  ...employeeFields,
  { name: 'bill_rate', label: 'Bill Rate ($/hr)', type: 'number' },
  { name: 'pay_rate', label: 'Pay Rate ($/hr)', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', default: 'draft', options: [
    { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'invoiced', label: 'Invoiced' },
  ]},
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
  ]},
];
const sortOptions = [
  { value: 'week_start_desc', label: 'Week: Latest' },
  { value: 'week_start_asc', label: 'Week: Oldest' },
  { value: 'employee_name_asc', label: 'Employee A–Z' },
];
const leaveFilterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }, { value: 'cancelled', label: 'Cancelled' },
  ]},
  { key: 'leave_type', label: 'Type', options: [
    { value: 'vacation', label: 'Vacation' }, { value: 'sick', label: 'Sick' },
    { value: 'personal', label: 'Personal' }, { value: 'maternity', label: 'Maternity' },
    { value: 'paternity', label: 'Paternity' }, { value: 'unpaid', label: 'Unpaid' },
  ]},
];

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState('timesheets');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('week_start_desc');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveFilters, setLeaveFilters] = useState({});
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const canWrite = canEdit(user, 'timesheets');
  const ownOnly = isOwnOnly(user, 'timesheets');
  // Admins, managers, workforce_managers and HR (manager role) can see all
  const canSeeAll = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'workforce_manager';
  const isManager = canSeeAll;
  const isAdmin = user?.role === 'admin';

  const { data: allTimesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.Timesheet.list('-created_date'),
  });
  const { data: allLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
  });

  const timesheets = useMemo(() => {
    if (canSeeAll) return allTimesheets;
    // Employees see only their own records
    if (user) return allTimesheets.filter(t => t.employee_email === user.email || t.created_by === user.email);
    return [];
  }, [allTimesheets, canSeeAll, user]);

  const leaves = useMemo(() => {
    if (canSeeAll) return allLeaves;
    if (user) return allLeaves.filter(l => l.employee_email === user.email || l.created_by === user.email);
    return [];
  }, [allLeaves, canSeeAll, user]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Timesheet.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      setDialogOpen(false);
      notifyChange({ module: 'Timesheet', action: 'submitted', record, actor: user });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Timesheet.update(id, data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      setDialogOpen(false);
      setEditing(null);
      notifyChange({ module: 'Timesheet', action: 'updated', record, actor: user });
    },
  });
  const createLeaveMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setLeaveOpen(false);
      toast.success('Leave request submitted');
      notifyChange({ module: 'LeaveRequest', action: 'submitted', record, actor: user });
    },
  });
  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setLeaveOpen(false);
      setEditingLeave(null);
      toast.success('Leave request updated');
      notifyChange({ module: 'LeaveRequest', action: 'updated', record, actor: user });
    },
  });

  const handleTimesheetSubmit = (data) => {
    const payload = ownOnly ? { ...data, status: 'submitted', employee_email: user?.email } : data;
    editing ? updateMutation.mutate({ id: editing.id, data: payload }) : createMutation.mutate(payload);
  };

  const handleLeaveSubmit = (data) => {
    const payload = ownOnly ? { ...data, employee_email: user?.email, status: 'pending' } : data;
    editingLeave ? updateLeaveMutation.mutate({ id: editingLeave.id, data: payload }) : createLeaveMutation.mutate(payload);
  };

  const filtered = useMemo(() => {
    let d = timesheets;
    if (search) { const q = search.toLowerCase(); d = d.filter(t => t.employee_name?.toLowerCase().includes(q) || t.client_name?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(t => t[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
  }, [timesheets, search, filterValues, sortValue]);

  const filteredLeaves = useMemo(() => {
    let d = leaves;
    if (leaveSearch) { const q = leaveSearch.toLowerCase(); d = d.filter(l => l.employee_name?.toLowerCase().includes(q)); }
    Object.entries(leaveFilters).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(l => l[k] === v); });
    return d;
  }, [leaves, leaveSearch, leaveFilters]);

  const stats = useMemo(() => ({
    total: timesheets.length,
    pending: timesheets.filter(t => t.status === 'submitted').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    totalHours: timesheets.reduce((s, t) => s + (t.monday_hours||0)+(t.tuesday_hours||0)+(t.wednesday_hours||0)+(t.thursday_hours||0)+(t.friday_hours||0)+(t.saturday_hours||0)+(t.sunday_hours||0), 0),
  }), [timesheets]);

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timesheets & Leave</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ownOnly ? "Track your hours and manage leave requests" : `${timesheets.length} timesheets · ${pendingLeaves} leave requests pending`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setEditingLeave(null); setLeaveOpen(true); }} className="gap-2">
            <CalendarOff className="w-4 h-4" />
            {ownOnly ? 'Apply for Leave' : 'New Leave Request'}
          </Button>
          {canWrite && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
              <Clock className="w-4 h-4" />
              {ownOnly ? 'Submit Timesheet' : 'New Timesheet'}
            </Button>
          )}
        </div>
      </div>

      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Sheets', value: stats.total, icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Pending Leave', value: pendingLeaves, icon: CalendarOff, color: 'text-rose-600 bg-rose-50' },
          ].map(s => (
            <Card key={s.label} className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="leave">
            Leave Requests
            {pendingLeaves > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingLeaves}</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'timesheets' && (
        <>
          <FilterBar
            search={search} onSearch={setSearch}
            filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
            sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
            onClear={() => { setSearch(''); setFilterValues({}); setSortValue('week_start_desc'); }}
          />
          <DataTable
            columns={isManager ? timesheetColumns : timesheetColumns.filter(c => c.header !== 'Employee')}
            data={filtered} isLoading={isLoading}
            onRowClick={canWrite ? (r) => { setEditing(r); setDialogOpen(true); } : undefined}
            emptyMessage={ownOnly ? "No timesheets yet. Submit your first timesheet." : "No timesheets found."}
          />
        </>
      )}

      {activeTab === 'leave' && (
        <>
          <FilterBar
            search={leaveSearch} onSearch={setLeaveSearch}
            filters={leaveFilterDefs} filterValues={leaveFilters} onFilterChange={(k, v) => setLeaveFilters(p => ({ ...p, [k]: v }))}
            onClear={() => { setLeaveSearch(''); setLeaveFilters({}); }}
          />
          <DataTable
            columns={isManager ? leaveColumns : leaveColumns.filter(c => c.header !== 'Employee')}
            data={filteredLeaves} isLoading={leavesLoading}
            onRowClick={isAdmin ? (r) => { setEditingLeave(r); setLeaveOpen(true); } : undefined}
            emptyMessage={ownOnly ? "No leave requests yet." : "No leave requests found."}
          />
        </>
      )}

      {canWrite && (
        <EntityFormDialog
          open={dialogOpen} onOpenChange={setDialogOpen}
          title={editing ? 'Edit Timesheet' : (ownOnly ? 'Submit Timesheet' : 'New Timesheet')}
          fields={ownOnly ? employeeFields : managerFields}
          initialData={editing || (ownOnly && user ? { employee_name: user.full_name, employee_email: user.email } : undefined)}
          onSubmit={handleTimesheetSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <LeaveRequestDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onSubmit={handleLeaveSubmit}
        initialData={editingLeave}
        user={user}
        isAdmin={isAdmin}
        isSubmitting={createLeaveMutation.isPending || updateLeaveMutation.isPending}
      />
    </div>
  );
}