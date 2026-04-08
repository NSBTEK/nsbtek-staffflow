import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import FilterBar from '@/components/shared/FilterBar';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { canEdit, isOwnOnly } from '@/lib/permissions';
import { Card } from '@/components/ui/card';
import { DollarSign, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const employeeFields = [
  { name: 'employee_name', label: 'Your Name', required: true },
  { name: 'employee_email', label: 'Your Email', type: 'email' },
  { name: 'client_name', label: 'Client' },
  { name: 'expense_date', label: 'Date', type: 'date', required: true },
  { name: 'category', label: 'Category', type: 'select', default: 'other', options: [
    { value: 'travel', label: 'Travel' }, { value: 'meals', label: 'Meals' },
    { value: 'equipment', label: 'Equipment' }, { value: 'training', label: 'Training' },
    { value: 'accommodation', label: 'Accommodation' }, { value: 'communication', label: 'Communication' }, { value: 'other', label: 'Other' },
  ]},
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const managerFields = [
  ...employeeFields,
  { name: 'status', label: 'Status', type: 'select', default: 'draft', options: [
    { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'reimbursed', label: 'Reimbursed' },
  ]},
];

const columns = [
  { header: 'Employee', sortKey: 'employee_name', render: (r) => <span className="font-medium">{r.employee_name}</span> },
  { header: 'Client', sortKey: 'client_name', accessor: 'client_name' },
  { header: 'Date', sortKey: 'expense_date', render: (r) => r.expense_date ? format(new Date(r.expense_date), 'MMM d, yyyy') : '-' },
  { header: 'Category', render: (r) => <StatusBadge status={r.category} /> },
  { header: 'Description', render: (r) => <span className="text-muted-foreground text-xs max-w-[160px] truncate block">{r.description}</span> },
  { header: 'Amount', sortKey: 'amount', render: (r) => <span className="font-semibold">${(r.amount||0).toFixed(2)}</span> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const filterDefs = [
  { key: 'status', label: 'Status', options: [
    { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' }, { value: 'reimbursed', label: 'Reimbursed' },
  ]},
  { key: 'category', label: 'Category', options: [
    { value: 'travel', label: 'Travel' }, { value: 'meals', label: 'Meals' },
    { value: 'equipment', label: 'Equipment' }, { value: 'training', label: 'Training' },
  ]},
];
const sortOptions = [
  { value: 'expense_date_desc', label: 'Date: Latest' },
  { value: 'expense_date_asc', label: 'Date: Oldest' },
  { value: 'amount_desc', label: 'Amount: Highest' },
  { value: 'employee_name_asc', label: 'Employee A–Z' },
];

export default function Expenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState('expense_date_desc');
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const canWrite = canEdit(user, 'expenses');
  const ownOnly = isOwnOnly(user, 'expenses');
  const isManager = !ownOnly;

  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date'),
  });

  const expenses = useMemo(() =>
    ownOnly && user
      ? allExpenses.filter(e => e.employee_email === user.email || e.created_by === user.email)
      : allExpenses,
    [allExpenses, ownOnly, user]
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setDialogOpen(false); setEditing(null); },
  });

  const handleSubmit = (data) => {
    const payload = ownOnly ? { ...data, status: 'submitted', employee_email: user?.email } : data;
    editing ? updateMutation.mutate({ id: editing.id, data: payload }) : createMutation.mutate(payload);
  };

  const filtered = useMemo(() => {
    let d = expenses;
    if (search) { const q = search.toLowerCase(); d = d.filter(e => e.employee_name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.client_name?.toLowerCase().includes(q)); }
    Object.entries(filterValues).forEach(([k, v]) => { if (v && v !== 'all') d = d.filter(e => e[k] === v); });
    const [field, dir] = sortValue.endsWith('_asc') ? [sortValue.slice(0, -4), 'asc'] : [sortValue.slice(0, -5), 'desc'];
    return [...d].sort((a, b) => { const av = a[field] ?? ''; const bv = b[field] ?? ''; const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv)); return dir === 'asc' ? cmp : -cmp; });
  }, [expenses, search, filterValues, sortValue]);

  const stats = useMemo(() => ({
    total: expenses.length,
    pending: expenses.filter(e => e.status === 'submitted').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    totalAmount: expenses.reduce((s, e) => s + (e.amount || 0), 0),
  }), [expenses]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader
        title="Expenses"
        subtitle={ownOnly ? `Your expenses · Total: $${stats.totalAmount.toFixed(2)}` : `${filtered.length} expenses · Total: $${filtered.reduce((s, e) => s + (e.amount || 0), 0).toFixed(2)}`}
        actionLabel={canWrite ? (ownOnly ? "Submit Expense" : "New Expense") : undefined}
        onAction={canWrite ? () => { setEditing(null); setDialogOpen(true); } : undefined}
      />

      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Expenses', value: stats.total, icon: DollarSign, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Total Amount', value: `$${stats.totalAmount.toFixed(0)}`, icon: TrendingUp, color: 'text-sky-600 bg-sky-50' },
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

      <FilterBar
        search={search} onSearch={setSearch}
        filters={filterDefs} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(p => ({ ...p, [k]: v }))}
        sortOptions={sortOptions} sortValue={sortValue} onSortChange={setSortValue}
        onClear={() => { setSearch(''); setFilterValues({}); setSortValue('expense_date_desc'); }}
      />

      <DataTable
        columns={isManager ? columns : columns.filter(c => c.header !== 'Employee')}
        data={filtered} isLoading={isLoading}
        onRowClick={canWrite ? (r) => { setEditing(r); setDialogOpen(true); } : undefined}
        emptyMessage={ownOnly ? "No expenses yet. Submit your first expense." : "No expenses found."}
      />

      {canWrite && (
        <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen}
          title={editing ? 'Edit Expense' : (ownOnly ? 'Submit Expense' : 'New Expense')}
          fields={ownOnly ? employeeFields : managerFields}
          initialData={editing || (ownOnly && user ? { employee_name: user.full_name, employee_email: user.email } : undefined)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}