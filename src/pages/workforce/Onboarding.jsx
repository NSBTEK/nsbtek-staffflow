import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityFormDialog from '@/components/shared/EntityFormDialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { canEdit } from '@/lib/permissions';

const fields = [
  { name: 'employee_name', label: 'Employee Name', required: true },
  { name: 'employee_email', label: 'Employee Email', type: 'email' },
  { name: 'task_name', label: 'Task Name', required: true },
  { name: 'category', label: 'Category', type: 'select', default: 'documents', options: [
    { value: 'documents', label: 'Documents' },
    { value: 'background_check', label: 'Background Check' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'training', label: 'Training' },
    { value: 'accounts', label: 'Accounts & Access' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' },
  ]},
  { name: 'status', label: 'Status', type: 'select', default: 'pending', options: [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' },
  ]},
  { name: 'due_date', label: 'Due Date', type: 'date' },
  { name: 'assigned_to', label: 'Assigned To' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const statusIcon = {
  pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  blocked: <AlertCircle className="w-4 h-4 text-red-500" />,
};

export default function Onboarding() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const canWrite = canEdit(user, 'onboarding');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => base44.entities.OnboardingTask.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingTask.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboarding'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingTask.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboarding'] }); setDialogOpen(false); setEditing(null); },
  });

  const handleSubmit = (data) => {
    editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data);
  };

  // Group tasks by employee
  const byEmployee = tasks.reduce((acc, task) => {
    const key = task.employee_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <PageHeader
        title="Onboarding"
        subtitle={`${tasks.length} tasks · ${completedCount} completed`}
        actionLabel={canWrite ? "Add Task" : undefined}
        onAction={canWrite ? () => { setEditing(null); setDialogOpen(true); } : undefined}
      />

      {isLoading ? (
        <div className="grid gap-4">
          {[1,2].map(i => <Card key={i} className="p-6 h-32 animate-pulse bg-muted" />)}
        </div>
      ) : Object.keys(byEmployee).length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No onboarding tasks yet.</Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byEmployee).map(([employee, employeeTasks]) => {
            const done = employeeTasks.filter(t => t.status === 'completed').length;
            const pct = Math.round((done / employeeTasks.length) * 100);
            return (
              <Card key={employee} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base">{employee}</h3>
                    <p className="text-xs text-muted-foreground">{done}/{employeeTasks.length} tasks complete</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold">{pct}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {employeeTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={canWrite ? () => { setEditing(task); setDialogOpen(true); } : undefined}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border bg-background hover:bg-muted/50 transition-colors ${canWrite ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {statusIcon[task.status] || <Circle className="w-4 h-4" />}
                        <div>
                          <p className="text-sm font-medium">{task.task_name}</p>
                          {task.assigned_to && <p className="text-xs text-muted-foreground">Assigned: {task.assigned_to}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{task.category?.replace(/_/g,' ')}</Badge>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">{format(new Date(task.due_date), 'MMM d')}</span>
                        )}
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {canWrite && (
        <EntityFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editing ? 'Edit Task' : 'Add Onboarding Task'}
          fields={fields}
          initialData={editing}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}