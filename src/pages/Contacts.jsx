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

const contactFields = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'title', label: 'Job Title' },
  { name: 'client_name', label: 'Client Company', required: true },
  { name: 'type', label: 'Type', type: 'select', default: 'hiring_manager', options: [
    { value: 'hiring_manager', label: 'Hiring Manager' }, { value: 'hr', label: 'HR' },
    { value: 'procurement', label: 'Procurement' }, { value: 'executive', label: 'Executive' },
    { value: 'technical', label: 'Technical' }, { value: 'other', label: 'Other' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'active', options: [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
  ]},
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const columns = [
  { header: 'Name', sortKey: 'first_name', render: (r) => <span className="font-medium">{r.first_name} {r.last_name}</span> },
  { header: 'Email', accessor: 'email' },
  { header: 'Phone', accessor: 'phone' },
  { header: 'Title', sortKey: 'title', accessor: 'title' },
  { header: 'Client', sortKey: 'client_name', accessor: 'client_name' },
  { header: 'Type', render: (r) => <StatusBadge status={r.type} /> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const filterDefs = [
  { key: 'type', label: 'Type', options: [
    { value: 'hiring_manager', label: 'Hiring Manager' }, { value: 'hr', label: 'HR' },
    { value: 'executive', label: 'Executive' }, { value: 'technical', label: 'Technical' },
  ]},
  { key: 'status', label: 'Status', options: [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
  ]},
];
const sortOptions = [
  { value: 'first_name_asc', label: 'Name A–Z' },
  { value: 'client_name_asc', label: 'Client A–Z' },
  { value: 'created_date_desc', label: 'Newest first' },
];

export default function Contacts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('first_name_asc');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const ownOnly = isOwnOnly(user, 'contacts');

  const { data: allContacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date'),
  });

  const contacts = ownOnly && user
    ? allContacts.filter(c => c.created_by === user.email)
    : allContacts;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setDialogOpen(false); setEditing(null); },
  });

  const filtered = useMemo(() => {
    let d = contacts;
    if (search) { const q = search.toLowerCase(); d = d.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.client_name?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(c => c[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
  }, [contacts, search, filterValues, sortValue]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader title="Contacts" subtitle={`${filtered.length} of ${contacts.length} contacts`}
        actionLabel="New Contact" onAction={() => { setEditing(null); setDialogOpen(true); }} />
      <FilterBar search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('first_name_asc'); }} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading}
        onRowClick={(r) => { setEditing(r); setDialogOpen(true); }} emptyMessage="No contacts found." />
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
        title={editing ? 'Edit Contact' : 'New Contact'} fields={contactFields}
        initialData={editing}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isSubmitting={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}