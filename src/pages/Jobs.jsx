import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';
import { format } from 'date-fns';

const jobFields = [
  { name: 'title', label: 'Job Title', required: true, placeholder: 'e.g. Senior Software Engineer' },
  { name: 'client', label: 'Client', required: true },
  { name: 'location', label: 'Location' },
  { name: 'job_type', label: 'Job Type', type: 'select', default: 'full_time', options: [
    { value: 'full_time', label: 'Full Time' }, { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' }, { value: 'contract_to_hire', label: 'Contract to Hire' },
    { value: 'temporary', label: 'Temporary' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'open', options: [
    { value: 'open', label: 'Open' }, { value: 'on_hold', label: 'On Hold' },
    { value: 'filled', label: 'Filled' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'closed', label: 'Closed' },
  ]},
  { name: 'priority', label: 'Priority', type: 'select', default: 'medium', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
  ]},
  { name: 'positions', label: 'Positions', type: 'number', default: 1 },
  { name: 'bill_rate', label: 'Bill Rate ($/hr)', type: 'number' },
  { name: 'pay_rate', label: 'Pay Rate ($/hr)', type: 'number' },
  { name: 'skills', label: 'Required Skills', placeholder: 'e.g. React, Node.js' },
  { name: 'experience_min', label: 'Min Experience (years)', type: 'number' },
  { name: 'experience_max', label: 'Max Experience (years)', type: 'number' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

const columns = [
  { header: 'Title', sortKey: 'title', render: (r) => <span className="font-medium">{r.title}</span> },
  { header: 'Client', sortKey: 'client', accessor: 'client' },
  { header: 'Location', sortKey: 'location', accessor: 'location' },
  { header: 'Type', render: (r) => <StatusBadge status={r.job_type} /> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
  { header: 'Positions', sortKey: 'positions', accessor: 'positions' },
  { header: 'Created', sortKey: 'created_date', render: (r) => r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : '-' },
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'open', label: 'Open' }, { value: 'on_hold', label: 'On Hold' },
    { value: 'filled', label: 'Filled' }, { value: 'closed', label: 'Closed' },
  ]},
  { key: 'job_type', label: 'Type', options: [
    { value: 'full_time', label: 'Full Time' }, { value: 'contract', label: 'Contract' },
    { value: 'contract_to_hire', label: 'C2H' }, { value: 'temporary', label: 'Temporary' },
  ]},
  { key: 'priority', label: 'Priority', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
  ]},
];

const sortOptions = [
  { value: 'created_date_desc', label: 'Newest first' },
  { value: 'created_date_asc', label: 'Oldest first' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'client_asc', label: 'Client A–Z' },
];

export default function Jobs() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('created_date_desc');
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); setDialogOpen(false); setEditingJob(null); },
  });

  const handleFilterChange = (key, val) => setFilterValues(p => ({ ...p, [key]: val }));

  const filtered = useMemo(() => {
    let d = jobs;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(j => j.title?.toLowerCase().includes(q) || j.client?.toLowerCase().includes(q) || j.skills?.toLowerCase().includes(q));
    }
    Object.entries(filterValues).forEach(([k, v]) => {
      if (v && v !== 'all') d = d.filter(j => j[k] === v);
    });
    const [field, dir] = sortValue.split('_').reduce((acc, p, i, arr) => {
      if (p === 'asc' || p === 'desc') return [arr.slice(0, i).join('_'), p];
      return acc;
    }, [sortValue, 'asc']);
    d = [...d].sort((a, b) => {
      const av = a[field] ?? ''; const bv = b[field] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
    return d;
  }, [jobs, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Jobs" subtitle={`${filtered.length} of ${jobs.length} jobs`}
        actionLabel="New Job" onAction={() => { setEditingJob(null); setDialogOpen(true); }} />
      <FilterBar
        search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={handleFilterChange}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('created_date_desc'); }}
      />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditingJob(r); setDialogOpen(true); }}
        emptyMessage="No jobs found." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editingJob ? 'Edit Job' : 'New Job'} fields={jobFields}
        initialData={editingJob} onSubmit={(data) => editingJob ? updateMutation.mutate({ id: editingJob.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}