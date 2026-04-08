import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { canEdit } from '@/lib/permissions';

const fields = [
  { name: 'employee_name', label: 'Employee Name', required: true },
  { name: 'employee_email', label: 'Employee Email', type: 'email' },
  { name: 'client_name', label: 'Client', required: true },
  { name: 'job_title', label: 'Job Title' },
  { name: 'contract_type', label: 'Contract Type', type: 'select', default: 'w2', options: [
    { value: 'w2', label: 'W2' },
    { value: '1099', label: '1099' },
    { value: 'c2c', label: 'Corp-to-Corp (C2C)' },
    { value: 'full_time', label: 'Full Time' },
  ]},
  { name: 'start_date', label: 'Start Date', type: 'date', required: true },
  { name: 'end_date', label: 'End Date', type: 'date' },
  { name: 'bill_rate', label: 'Bill Rate ($/hr)', type: 'number' },
  { name: 'pay_rate', label: 'Pay Rate ($/hr)', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', default: 'draft', options: [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'signed', label: 'Signed' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' },
  ]},
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const columns = [
  { header: 'Employee', render: (r) => <span className="font-medium">{r.employee_name}</span> },
  { header: 'Client', accessor: 'client_name' },
  { header: 'Job Title', accessor: 'job_title' },
  { header: 'Type', render: (r) => <StatusBadge status={r.contract_type} /> },
  { header: 'Start', render: (r) => r.start_date ? format(new Date(r.start_date), 'MMM d, yyyy') : '-' },
  { header: 'End', render: (r) => r.end_date ? format(new Date(r.end_date), 'MMM d, yyyy') : 'Open' },
  { header: 'Bill Rate', render: (r) => r.bill_rate ? `$${r.bill_rate}/hr` : '-' },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

export default function Contracts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const canWrite = canEdit(user, 'contracts');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); setDialogOpen(false); setEditing(null); },
  });

  const handleSubmit = (data) => {
    editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data);
  };

  const filtered = statusFilter === 'all' ? contracts : contracts.filter(c => c.status === statusFilter);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader
        title="Contracts"
        subtitle={`${contracts.length} total contracts`}
        actionLabel={canWrite ? "New Contract" : undefined}
        onAction={canWrite ? () => { setEditing(null); setDialogOpen(true); } : undefined}
      >
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={canWrite ? (r) => { setEditing(r); setDialogOpen(true); } : undefined}
        emptyMessage="No contracts found."
      />

      {canWrite && (
        <EntityFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editing ? 'Edit Contract' : 'New Contract'}
          fields={fields}
          initialData={editing}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}