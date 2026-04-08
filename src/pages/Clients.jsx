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

const clientFields = [
  { name: 'company_name', label: 'Company Name', required: true },
  { name: 'industry', label: 'Industry' },
  { name: 'website', label: 'Website' },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'type', label: 'Type', type: 'select', default: 'direct_client', options: [
    { value: 'direct_client', label: 'Direct Client' }, { value: 'vendor', label: 'Vendor' },
    { value: 'partner', label: 'Partner' }, { value: 'sub_vendor', label: 'Sub Vendor' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'prospect', options: [
    { value: 'prospect', label: 'Prospect' }, { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }, { value: 'lost', label: 'Lost' },
  ]},
  { name: 'payment_terms', label: 'Payment Terms', type: 'select', default: 'net_30', options: [
    { value: 'net_15', label: 'Net 15' }, { value: 'net_30', label: 'Net 30' },
    { value: 'net_45', label: 'Net 45' }, { value: 'net_60', label: 'Net 60' },
  ]},
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const columns = [
  { header: 'Company', sortKey: 'company_name', render: (r) => <span className="font-medium">{r.company_name}</span> },
  { header: 'Industry', sortKey: 'industry', accessor: 'industry' },
  { header: 'Location', render: (r) => [r.city, r.state].filter(Boolean).join(', ') || '-' },
  { header: 'Type', render: (r) => <StatusBadge status={r.type} /> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Payment Terms', render: (r) => <StatusBadge status={r.payment_terms} /> },
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'prospect', label: 'Prospect' }, { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }, { value: 'lost', label: 'Lost' },
  ]},
  { key: 'type', label: 'Type', options: [
    { value: 'direct_client', label: 'Direct Client' }, { value: 'vendor', label: 'Vendor' },
    { value: 'partner', label: 'Partner' },
  ]},
];
const sortOptions = [
  { value: 'company_name_asc', label: 'Company A–Z' },
  { value: 'created_date_desc', label: 'Newest first' },
  { value: 'industry_asc', label: 'Industry A–Z' },
];

export default function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('company_name_asc');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const ownOnly = isOwnOnly(user, 'clients');

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const clients = ownOnly && user
    ? allClients.filter(c => c.created_by === user.email)
    : allClients;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDialogOpen(false); setEditing(null); },
  });

  const filtered = useMemo(() => {
    let d = clients;
    if (search) { const q = search.toLowerCase(); d = d.filter(c => c.company_name?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(c => c[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; const cmp = String(av).localeCompare(String(bv)); return dir === 'asc' ? cmp : -cmp; });
  }, [clients, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Clients" subtitle={`${filtered.length} of ${clients.length} clients`}
        actionLabel="New Client" onAction={() => { setEditing(null); setDialogOpen(true); }} />
      <FilterBar search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('company_name_asc'); }} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditing(r); setDialogOpen(true); }} emptyMessage="No clients found." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editing ? 'Edit Client' : 'New Client'} fields={clientFields}
        initialData={editing}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}