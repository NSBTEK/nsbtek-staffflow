import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "../../lib/base44Stub";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, EyeOff, Plus, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { toast } from 'sonner';

const SECTIONS = [
  {
    label: 'ATS',
    modules: [
      { key: 'jobs', label: 'Jobs', defaultColumns: [
        { key: 'title', label: 'Title', visible: true },
        { key: 'client', label: 'Client', visible: true },
        { key: 'location', label: 'Location', visible: true },
        { key: 'job_type', label: 'Type', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'priority', label: 'Priority', visible: true },
        { key: 'positions', label: 'Positions', visible: true },
        { key: 'created_date', label: 'Created', visible: true },
      ]},
      { key: 'candidates', label: 'Candidates', defaultColumns: [
        { key: 'name', label: 'Name', visible: true },
        { key: 'email', label: 'Email', visible: true },
        { key: 'current_title', label: 'Title', visible: true },
        { key: 'skills', label: 'Skills', visible: true },
        { key: 'experience_years', label: 'Experience', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'source', label: 'Source', visible: true },
        { key: 'visa_status', label: 'Visa', visible: true },
      ]},
      { key: 'submissions', label: 'Submissions', defaultColumns: [
        { key: 'candidate_name', label: 'Candidate', visible: true },
        { key: 'job_title', label: 'Job', visible: true },
        { key: 'client_name', label: 'Client', visible: true },
        { key: 'submitted_rate', label: 'Rate', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'submission_date', label: 'Date', visible: true },
      ]},
      { key: 'interviews', label: 'Interviews', defaultColumns: [
        { key: 'candidate_name', label: 'Candidate', visible: true },
        { key: 'job_title', label: 'Job', visible: true },
        { key: 'client_name', label: 'Client', visible: true },
        { key: 'interview_date', label: 'Date', visible: true },
        { key: 'interview_type', label: 'Type', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'rating', label: 'Rating', visible: true },
      ]},
      { key: 'placements', label: 'Placements', defaultColumns: [
        { key: 'candidate_name', label: 'Candidate', visible: true },
        { key: 'job_title', label: 'Job', visible: true },
        { key: 'client_name', label: 'Client', visible: true },
        { key: 'start_date', label: 'Start', visible: true },
        { key: 'end_date', label: 'End', visible: true },
        { key: 'bill_rate', label: 'Bill Rate', visible: true },
        { key: 'placement_type', label: 'Type', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ]},
    ]
  },
  {
    label: 'CRM',
    modules: [
      { key: 'clients', label: 'Clients', defaultColumns: [
        { key: 'company_name', label: 'Company', visible: true },
        { key: 'industry', label: 'Industry', visible: true },
        { key: 'city', label: 'City', visible: true },
        { key: 'state', label: 'State', visible: true },
        { key: 'type', label: 'Type', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'payment_terms', label: 'Payment Terms', visible: true },
      ]},
      { key: 'contacts', label: 'Contacts', defaultColumns: [
        { key: 'name', label: 'Name', visible: true },
        { key: 'email', label: 'Email', visible: true },
        { key: 'phone', label: 'Phone', visible: true },
        { key: 'title', label: 'Title', visible: true },
        { key: 'client_name', label: 'Client', visible: true },
        { key: 'type', label: 'Type', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ]},
      { key: 'activities', label: 'Activities', defaultColumns: [
        { key: 'subject', label: 'Subject', visible: true },
        { key: 'type', label: 'Type', visible: true },
        { key: 'related_to', label: 'Related To', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'priority', label: 'Priority', visible: true },
        { key: 'due_date', label: 'Due Date', visible: true },
      ]},
    ]
  },
  {
    label: 'Workforce',
    modules: [
      { key: 'timesheets', label: 'Timesheets', defaultColumns: [
        { key: 'employee_name', label: 'Employee', visible: true },
        { key: 'client_name', label: 'Client', visible: true },
        { key: 'week_start', label: 'Week Of', visible: true },
        { key: 'total_hours', label: 'Total Hours', visible: true },
        { key: 'bill_rate', label: 'Bill Rate', visible: true },
        { key: 'pay_rate', label: 'Pay Rate', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ]},
      { key: 'expenses', label: 'Expenses', defaultColumns: [
        { key: 'employee_name', label: 'Employee', visible: true },
        { key: 'expense_date', label: 'Date', visible: true },
        { key: 'category', label: 'Category', visible: true },
        { key: 'description', label: 'Description', visible: true },
        { key: 'amount', label: 'Amount', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ]},
      { key: 'contracts', label: 'Contracts', defaultColumns: [
        { key: 'employee_name', label: 'Employee', visible: true },
        { key: 'client_name', label: 'Client', visible: true },
        { key: 'job_title', label: 'Job Title', visible: true },
        { key: 'contract_type', label: 'Type', visible: true },
        { key: 'start_date', label: 'Start', visible: true },
        { key: 'end_date', label: 'End', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ]},
      { key: 'onboarding', label: 'Onboarding', defaultColumns: [
        { key: 'employee_name', label: 'Employee', visible: true },
        { key: 'task_name', label: 'Task', visible: true },
        { key: 'category', label: 'Category', visible: true },
        { key: 'due_date', label: 'Due Date', visible: true },
        { key: 'assigned_to', label: 'Assigned To', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ]},
    ]
  }
];

const ALL_MODULES = SECTIONS.flatMap(s => s.modules);

function ColumnEditor({ module, config, onChange }) {
  const cols = config || module.defaultColumns;

  const [dragIndex, setDragIndex] = React.useState(null);

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // required to allow drop
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;

    const newCols = [...cols];
    const [moved] = newCols.splice(dragIndex, 1);
    newCols.splice(index, 0, moved);

    setDragIndex(null);
    onChange(newCols);
  };

  const toggle = (i) =>
    onChange(cols.map((c, idx) => (idx === i ? { ...c, visible: !c.visible } : c)));

  const rename = (i, label) =>
    onChange(cols.map((c, idx) => (idx === i ? { ...c, label } : c)));

  const remove = (i) =>
    onChange(cols.filter((_, idx) => idx !== i));

  const addColumn = () =>
    onChange([
      ...cols,
      {
        key: `custom_${Date.now()}`,
        label: "New Column",
        visible: true,
        custom: true,
      },
    ]);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {cols.map((col, i) => (
          <div
            key={col.key}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(i)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border bg-background transition-all",
              dragIndex === i && "opacity-30",
              !col.visible && "opacity-50"
            )}
          >
            {/* Drag Handle */}
            <div className="cursor-grab text-muted-foreground">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="5" r="1" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="5" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="19" r="1" />
              </svg>
            </div>

            <Input
              value={col.label}
              onChange={(e) => rename(i, e.target.value)}
              className="h-7 text-sm flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <span className="text-[10px] text-muted-foreground/40 font-mono hidden sm:block">
              {col.key}
            </span>

            <button
              onClick={() => toggle(i)}
              className={cn(
                "p-1 rounded",
                col.visible ? "text-primary" : "text-muted-foreground/40"
              )}
            >
              {col.visible ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
            </button>

            {col.custom && (
              <button
                onClick={() => remove(i)}
                className="p-1 rounded text-destructive/60 hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addColumn}
        className="gap-1.5 text-xs"
      >
        <Plus className="w-3.5 h-3.5" /> Add Column
      </Button>
    </div>
  );
}

export default function ColumnSettings() {
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('ATS');
  const [activeModule, setActiveModule] = useState('jobs');
  const [localConfigs, setLocalConfigs] = useState({});

  const { data: savedConfigs = [] } = useQuery({
    queryKey: ['ats-column-configs'],
    queryFn: () => base44.entities.ATSColumnConfig.list(),
  });

  useEffect(() => {
    const map = {};
    savedConfigs.forEach(c => {
      try { map[c.module] = { id: c.id, columns: JSON.parse(c.columns || '[]') }; } catch {}
    });
    setLocalConfigs(map);
  }, [savedConfigs]);

  const saveMutation = useMutation({
    mutationFn: async ({ module, columns, existingId }) => {
      const payload = { module, columns: JSON.stringify(columns) };
      if (existingId) return base44.entities.ATSColumnConfig.update(existingId, payload);
      return base44.entities.ATSColumnConfig.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ats-column-configs'] });
      toast.success('Column settings saved');
    },
  });

  const handleSave = () => {
    const mod = ALL_MODULES.find(m => m.key === activeModule);
    const cols = localConfigs[activeModule]?.columns || mod.defaultColumns;
    saveMutation.mutate({ module: activeModule, columns: cols, existingId: localConfigs[activeModule]?.id });
  };

  const handleReset = () => {
    const mod = ALL_MODULES.find(m => m.key === activeModule);
    setLocalConfigs(p => ({ ...p, [activeModule]: { ...p[activeModule], columns: mod.defaultColumns } }));
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only admins can configure column settings.</p>
      </div>
    );
  }

  const activeMod = ALL_MODULES.find(m => m.key === activeModule);
  const activeCols = localConfigs[activeModule]?.columns || activeMod?.defaultColumns || [];
  const currentSection = SECTIONS.find(s => s.label === activeSection);

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Column Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure columns for ATS, CRM, and Workforce modules. Drag to reorder, toggle visibility, rename, or add custom columns.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar: sections + modules */}
        <div className="w-48 shrink-0 space-y-3">
          {SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-1">{section.label}</p>
              <div className="space-y-0.5">
                {section.modules.map(m => (
                  <button
                    key={m.key}
                    onClick={() => { setActiveSection(section.label); setActiveModule(m.key); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeModule === m.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {m.label}
                    {localConfigs[m.key] && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide opacity-60">saved</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Column editor */}
        <Card className="flex-1">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{activeMod?.label} Columns</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{activeSection} module</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">Reset</Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" />
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ColumnEditor
              module={activeMod}
              config={activeCols}
              onChange={cols => setLocalConfigs(p => ({ ...p, [activeModule]: { ...p[activeModule], columns: cols } }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}