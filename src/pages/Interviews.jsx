import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { notifyChange } from '@/lib/notifications';

const interviewFields = [
  { name: 'candidate_name', label: 'Candidate Name', required: true },
  { name: 'candidate_email', label: 'Candidate Email', type: 'email' },
  { name: 'job_title', label: 'Job Title', required: true },
  { name: 'client_name', label: 'Client' },
  { name: 'interview_date', label: 'Interview Date & Time', type: 'datetime-local', required: true },
  { name: 'interview_type', label: 'Type', type: 'select', default: 'phone_screen', options: [
    { value: 'phone_screen', label: 'Phone Screen' }, { value: 'video', label: 'Video' },
    { value: 'in_person', label: 'In Person' }, { value: 'technical', label: 'Technical' },
    { value: 'panel', label: 'Panel' }, { value: 'final', label: 'Final' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'scheduled', options: [
    { value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }, { value: 'no_show', label: 'No Show' }, { value: 'rescheduled', label: 'Rescheduled' },
  ]},
  { name: 'interviewer', label: 'Interviewer' },
  { name: 'rating', label: 'Rating (1-5)', type: 'number' },
  { name: 'feedback', label: 'Feedback', type: 'textarea' },
];

const columns = [
  { header: 'Candidate', sortKey: 'candidate_name', render: (r) => <span className="font-medium">{r.candidate_name}</span> },
  { header: 'Job', sortKey: 'job_title', accessor: 'job_title' },
  { header: 'Client', sortKey: 'client_name', accessor: 'client_name' },
  { header: 'Date', sortKey: 'interview_date', render: (r) => r.interview_date ? format(new Date(r.interview_date), 'MMM d, yyyy h:mm a') : '-' },
  { header: 'Type', render: (r) => <StatusBadge status={r.interview_type} /> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Rating', sortKey: 'rating', render: (r) => r.rating ? `${r.rating}/5 ⭐` : '-' },
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }, { value: 'no_show', label: 'No Show' },
  ]},
  { key: 'interview_type', label: 'Type', options: [
    { value: 'phone_screen', label: 'Phone Screen' }, { value: 'video', label: 'Video' },
    { value: 'technical', label: 'Technical' }, { value: 'in_person', label: 'In Person' },
  ]},
];
const sortOptions = [
  { value: 'interview_date_asc', label: 'Date: Soonest' },
  { value: 'interview_date_desc', label: 'Date: Latest' },
  { value: 'candidate_name_asc', label: 'Candidate A–Z' },
  { value: 'rating_desc', label: 'Highest Rating' },
];

export default function Interviews() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('interview_date_asc');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => base44.entities.Interview.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Interview.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setDialogOpen(false);
      notifyChange({ module: 'Interview', action: 'scheduled', record, actor: user, notifyEmails: [record.candidate_email] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Interview.update(id, data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setDialogOpen(false);
      setEditing(null);
      notifyChange({ module: 'Interview', action: 'updated', record, actor: user, notifyEmails: [record.candidate_email] });
    },
  });

  const filtered = useMemo(() => {
    let d = interviews;
    if (search) { const q = search.toLowerCase(); d = d.filter(i => i.candidate_name?.toLowerCase().includes(q) || i.job_title?.toLowerCase().includes(q) || i.client_name?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(i => i[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv)); return dir === 'asc' ? cmp : -cmp; });
  }, [interviews, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Interviews" subtitle={`${filtered.length} of ${interviews.length} interviews`}
        actionLabel="Schedule Interview" onAction={() => { setEditing(null); setDialogOpen(true); }} />
      <FilterBar search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('interview_date_asc'); }} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditing(r); setDialogOpen(true); }} emptyMessage="No interviews scheduled." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editing ? 'Edit Interview' : 'Schedule Interview'} fields={interviewFields}
        initialData={editing}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}