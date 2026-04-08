// src/pages/Submissions.jsx
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

const submissionFields = [
  { name: 'candidate_name', label: 'Candidate Name', required: true },
  { name: 'candidate_email', label: 'Candidate Email', type: 'email' },
  { name: 'job_title', label: 'Job Title', required: true },
  { name: 'client_name', label: 'Client' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    default: 'submitted',
    options: [
      { value: 'submitted', label: 'Submitted' },
      { value: 'client_review', label: 'Client Review' },
      { value: 'interview_scheduled', label: 'Interview Scheduled' },
      { value: 'interview_completed', label: 'Interview Completed' },
      { value: 'offered', label: 'Offered' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'withdrawn', label: 'Withdrawn' },
    ],
  },
  { name: 'submitted_rate', label: 'Submitted Rate ($/hr)', type: 'number' },
  { name: 'submission_date', label: 'Submission Date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const columns = [
  {
    header: 'Candidate',
    sortKey: 'candidate_name',
    render: (r) => <span className="font-medium">{r.candidate_name}</span>,
  },
  { header: 'Job', sortKey: 'job_title', accessor: 'job_title' },
  { header: 'Client', sortKey: 'client_name', accessor: 'client_name' },
  {
    header: 'Rate',
    sortKey: 'submitted_rate',
    render: (r) => (r.submitted_rate ? `$${r.submitted_rate}/hr` : '-'),
  },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  {
    header: 'Date',
    sortKey: 'submission_date',
    render: (r) =>
      r.submission_date
        ? format(new Date(r.submission_date), 'MMM d, yyyy')
        : '-',
  },
];

const filterDefs = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'submitted', label: 'Submitted' },
      { value: 'client_review', label: 'Client Review' },
      { value: 'interview_scheduled', label: 'Interview Scheduled' },
      { value: 'offered', label: 'Offered' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'rejected', label: 'Rejected' },
    ],
  },
];

const sortOptions = [
  { value: 'created_date_desc', label: 'Newest first' },
  { value: 'candidate_name_asc', label: 'Candidate A–Z' },
  { value: 'client_name_asc', label: 'Client A–Z' },
  { value: 'submitted_rate_desc', label: 'Highest Rate' },
];

export default function Submissions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('created_date_desc');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.Submission.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Submission.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setDialogOpen(false);
      notifyChange({
        module: 'Submission',
        action: 'created',
        record,
        user,
        notifyEmails: [record.candidate_email],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Submission.update(id, data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setDialogOpen(false);
      setEditing(null);
      notifyChange({
        module: 'Submission',
        action: 'updated',
        record,
        user,
        notifyEmails: [record.candidate_email],
      });
    },
  });

  const filtered = useMemo(() => {
    let d = submissions;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(
        (s) =>
          s.candidate_name?.toLowerCase().includes(q) ||
          s.job_title?.toLowerCase().includes(q) ||
          s.client_name?.toLowerCase().includes(q)
      );
    }
    Object.entries(filterValues).forEach(([k, v]) => {
      if (v && v !== 'all') d = d.filter((s) => s[k] === v);
    });
    const [field, dir] = sortValue.endsWith('_asc')
      ? [sortValue.slice(0, -4), 'asc']
      : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      const cmp =
        typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [submissions, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader
        title="Submissions"
        subtitle={`${filtered.length} of ${submissions.length} submissions`}
        actionLabel="New Submission"
        onAction={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />
      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={filterDefs}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues((p) => ({ ...p, [k]: v }))}
        sortOptions={sortOptions}
        sortValue={sortValue}
        onSortChange={setSortValue}
        onClear={() => {
          setSearch('');
          setFilterValues({});
          setSortValue('created_date_desc');
        }}
      />
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={(r) => {
          setEditing(r);
          setDialogOpen(true);
        }}
        emptyMessage="No submissions yet."
      />
      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit Submission' : 'New Submission'}
        fields={submissionFields}
        initialData={editing}
        onSubmit={(data) =>
          editing
            ? updateMutation.mutate({ id: editing.id, data })
            : createMutation.mutate(data)
        }
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}