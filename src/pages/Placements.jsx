import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';
import { format } from 'date-fns';

const placementFields = [
  { name: 'candidate_name', label: 'Candidate Name', required: true },
  { name: 'candidate_email', label: 'Candidate Email', type: 'email' },
  { name: 'job_title', label: 'Job Title', required: true },
  { name: 'client_name', label: 'Client', required: true },
  { name: 'start_date', label: 'Start Date', type: 'date', required: true },
  { name: 'end_date', label: 'End Date', type: 'date' },
  { name: 'bill_rate', label: 'Bill Rate ($/hr)', type: 'number' },
  { name: 'pay_rate', label: 'Pay Rate ($/hr)', type: 'number' },
  { name: 'placement_type', label: 'Type', type: 'select', default: 'contract', options: [
    { value: 'contract', label: 'Contract' }, { value: 'permanent', label: 'Permanent' },
    { value: 'contract_to_hire', label: 'Contract to Hire' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'active', options: [
    { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' },
    { value: 'terminated', label: 'Terminated' }, { value: 'on_hold', label: 'On Hold' },
  ]},
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const columns = [
  { header: 'Candidate', sortKey: 'candidate_name', render: (r) => <span className="font-medium">{r.candidate_name}</span> },
  { header: 'Job', sortKey: 'job_title', accessor: 'job_title' },
  { header: 'Client', sortKey: 'client_name', accessor: 'client_name' },
  { header: 'Start', sortKey: 'start_date', render: (r) => r.start_date ? format(new Date(r.start_date), 'MMM d, yyyy') : '-' },
  { header: 'End', render: (r) => r.end_date ? format(new Date(r.end_date), 'MMM d, yyyy') : <span className="text-emerald-600 text-xs font-medium">Ongoing</span> },
  { header: 'Bill Rate', sortKey: 'bill_rate', render: (r) => r.bill_rate ? `$${r.bill_rate}/hr` : '-' },
  { header: 'Type', render: (r) => <StatusBadge status={r.placement_type} /> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' },
    { value: 'terminated', label: 'Terminated' }, { value: 'on_hold', label: 'On Hold' },
  ]},
  { key: 'placement_type', label: 'Type', options: [
    { value: 'contract', label: 'Contract' }, { value: 'permanent', label: 'Permanent' },
    { value: 'contract_to_hire', label: 'C2H' },
  ]},
];
const sortOptions = [
  { value: 'start_date_desc', label: 'Start: Latest' },
  { value: 'start_date_asc', label: 'Start: Oldest' },
  { value: 'candidate_name_asc', label: 'Candidate A–Z' },
  { value: 'bill_rate_desc', label: 'Highest Bill Rate' },
];

export default function Placements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('start_date_desc');
  const queryClient = useQueryClient();

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['placements'],
    queryFn: () => base44.entities.Placement.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Placement.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['placements'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Placement.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['placements'] }); setDialogOpen(false); setEditing(null); },
  });

  const filtered = useMemo(() => {
    let d = placements;
    if (search) { const q = search.toLowerCase(); d = d.filter(p => p.candidate_name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q) || p.job_title?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(p => p[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv)); return dir === 'asc' ? cmp : -cmp; });
  }, [placements, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Placements" subtitle={`${filtered.length} of ${placements.length} placements`}
        actionLabel="New Placement" onAction={() => { setEditing(null); setDialogOpen(true); }} />
      <FilterBar search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('start_date_desc'); }} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditing(r); setDialogOpen(true); }} emptyMessage="No placements yet." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editing ? 'Edit Placement' : 'New Placement'} fields={placementFields}
        initialData={editing}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}