import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { isOwnOnly } from '@/lib/permissions';
import { format } from 'date-fns';

const activityFields = [
  { name: 'subject', label: 'Subject', required: true },
  { name: 'type', label: 'Type', type: 'select', default: 'note', required: true, options: [
    { value: 'call', label: 'Call' }, { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' }, { value: 'note', label: 'Note' },
    { value: 'task', label: 'Task' }, { value: 'follow_up', label: 'Follow Up' },
  ]},
  { name: 'related_to', label: 'Related To' },
  { name: 'related_type', label: 'Related Entity', type: 'select', default: 'candidate', options: [
    { value: 'candidate', label: 'Candidate' }, { value: 'client', label: 'Client' },
    { value: 'contact', label: 'Contact' }, { value: 'job', label: 'Job' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'pending', options: [
    { value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
  ]},
  { name: 'priority', label: 'Priority', type: 'select', default: 'medium', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ]},
  { name: 'due_date', label: 'Due Date', type: 'date' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

const columns = [
  { header: 'Subject', sortKey: 'subject', render: (r) => <span className="font-medium">{r.subject}</span> },
  { header: 'Type', render: (r) => <StatusBadge status={r.type} /> },
  { header: 'Related To', sortKey: 'related_to', accessor: 'related_to' },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
  { header: 'Due Date', sortKey: 'due_date', render: (r) => r.due_date ? format(new Date(r.due_date), 'MMM d, yyyy') : '-' },
];

const filterDefs = [
  { key: 'type', label: 'Type', options: [
    { value: 'call', label: 'Call' }, { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' }, { value: 'task', label: 'Task' }, { value: 'follow_up', label: 'Follow Up' },
  ]},
  { key: 'status', label: 'Status', options: [
    { value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
  ]},
  { key: 'priority', label: 'Priority', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ]},
];
const sortOptions = [
  { value: 'created_date_desc', label: 'Newest first' },
  { value: 'due_date_asc', label: 'Due Date: Soonest' },
  { value: 'priority_desc', label: 'Priority: High first' },
];

export default function Activities() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('created_date_desc');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const ownOnly = isOwnOnly(user, 'activities');

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date'),
  });

  const activities = ownOnly && user
    ? allActivities.filter(a => a.created_by === user.email)
    : allActivities;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); setDialogOpen(false); setEditing(null); },
  });

  const filtered = useMemo(() => {
    let d = activities;
    if (search) { const q = search.toLowerCase(); d = d.filter(a => a.subject?.toLowerCase().includes(q) || a.related_to?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(a => a[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; const cmp = String(av).localeCompare(String(bv)); return dir === 'asc' ? cmp : -cmp; });
  }, [activities, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Activities" subtitle={`${filtered.length} of ${activities.length} activities`}
        actionLabel="Log Activity" onAction={() => { setEditing(null); setDialogOpen(true); }} />
      <FilterBar search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('created_date_desc'); }} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditing(r); setDialogOpen(true); }} emptyMessage="No activities logged yet." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editing ? 'Edit Activity' : 'Log Activity'} fields={activityFields}
        initialData={editing}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}