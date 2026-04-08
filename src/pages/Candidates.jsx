import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';

const candidateFields = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'location', label: 'Location' },
  { name: 'current_title', label: 'Current Title' },
  { name: 'current_employer', label: 'Current Employer' },
  { name: 'skills', label: 'Skills', placeholder: 'e.g. Java, Python, AWS' },
  { name: 'experience_years', label: 'Years of Experience', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', default: 'new', options: [
    { value: 'new', label: 'New' }, { value: 'active', label: 'Active' },
    { value: 'passive', label: 'Passive' }, { value: 'placed', label: 'Placed' },
    { value: 'do_not_contact', label: 'Do Not Contact' },
  ]},
  { name: 'source', label: 'Source', type: 'select', default: 'direct', options: [
    { value: 'job_board', label: 'Job Board' }, { value: 'referral', label: 'Referral' },
    { value: 'linkedin', label: 'LinkedIn' }, { value: 'website', label: 'Website' },
    { value: 'agency', label: 'Agency' }, { value: 'direct', label: 'Direct' }, { value: 'other', label: 'Other' },
  ]},
  { name: 'visa_status', label: 'Visa Status', type: 'select', default: 'citizen', options: [
    { value: 'citizen', label: 'US Citizen' }, { value: 'green_card', label: 'Green Card' },
    { value: 'h1b', label: 'H1B' }, { value: 'opt', label: 'OPT' },
    { value: 'cpt', label: 'CPT' }, { value: 'ead', label: 'EAD' },
    { value: 'tn', label: 'TN' }, { value: 'other', label: 'Other' },
  ]},
  { name: 'availability', label: 'Availability', type: 'select', default: 'immediate', options: [
    { value: 'immediate', label: 'Immediate' }, { value: '2_weeks', label: '2 Weeks' },
    { value: '1_month', label: '1 Month' }, { value: 'not_available', label: 'Not Available' },
  ]},
  { name: 'expected_rate', label: 'Expected Rate ($/hr)', type: 'number' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const columns = [
  { header: 'Name', sortKey: 'first_name', render: (r) => <span className="font-medium">{r.first_name} {r.last_name}</span> },
  { header: 'Email', sortKey: 'email', accessor: 'email' },
  { header: 'Title', sortKey: 'current_title', accessor: 'current_title' },
  { header: 'Skills', render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{r.skills}</span> },
  { header: 'Exp', sortKey: 'experience_years', render: (r) => r.experience_years ? `${r.experience_years} yrs` : '-' },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Source', render: (r) => <StatusBadge status={r.source} /> },
  { header: 'Visa', render: (r) => <StatusBadge status={r.visa_status} /> },
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'new', label: 'New' }, { value: 'active', label: 'Active' },
    { value: 'passive', label: 'Passive' }, { value: 'placed', label: 'Placed' },
  ]},
  { key: 'source', label: 'Source', options: [
    { value: 'linkedin', label: 'LinkedIn' }, { value: 'referral', label: 'Referral' },
    { value: 'job_board', label: 'Job Board' }, { value: 'direct', label: 'Direct' },
  ]},
  { key: 'visa_status', label: 'Visa', options: [
    { value: 'citizen', label: 'Citizen' }, { value: 'green_card', label: 'Green Card' },
    { value: 'h1b', label: 'H1B' }, { value: 'opt', label: 'OPT' },
  ]},
  { key: 'availability', label: 'Availability', options: [
    { value: 'immediate', label: 'Immediate' }, { value: '2_weeks', label: '2 Weeks' },
    { value: '1_month', label: '1 Month' },
  ]},
];

const sortOptions = [
  { value: 'created_date_desc', label: 'Newest first' },
  { value: 'first_name_asc', label: 'Name A–Z' },
  { value: 'experience_years_desc', label: 'Most Experience' },
];

export default function Candidates() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('created_date_desc');
  const queryClient = useQueryClient();

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => base44.entities.Candidate.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Candidate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['candidates'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Candidate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['candidates'] }); setDialogOpen(false); setEditing(null); },
  });

  const filtered = useMemo(() => {
    let d = candidates;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.skills?.toLowerCase().includes(q) || c.current_title?.toLowerCase().includes(q));
    }
    Object.entries(filterValues).forEach(([k, v]) => {
      if (v && v !== 'all') d = d.filter(c => c[k] === v);
    });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => {
      const av = a[field] ?? ''; const bv = b[field] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [candidates, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Candidates" subtitle={`${filtered.length} of ${candidates.length} candidates`}
        actionLabel="New Candidate" onAction={() => { setEditing(null); setDialogOpen(true); }} />
      <FilterBar search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('created_date_desc'); }} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditing(r); setDialogOpen(true); }}
        emptyMessage="No candidates found." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editing ? 'Edit Candidate' : 'New Candidate'} fields={candidateFields}
        initialData={editing}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}