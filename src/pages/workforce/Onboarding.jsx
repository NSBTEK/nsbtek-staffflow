import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import RecordFormModal from "@/components/shared/RecordFormModal";
import SearchableEntitySelect from "@/components/shared/SearchableEntitySelect";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { listJobOptions, listClientOptions, listOrganizationUserOptions } from "@/lib/recruitmentOptions";
import { listHRAdminOnlyRows, createHRAdminOnlyRow, updateHRAdminOnlyRow, deleteHRAdminOnlyRow } from "@/lib/workforceCrud";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const HIDDEN_DUPLICATE_FIELDS = ["employee_id","employee_name","user_id","user_name","person_id","person_name","job_id","job_title","client_id","client_name"];

export default function Onboarding() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("onboarding");

  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["onboarding", authUser?.id], queryFn: () => listHRAdminOnlyRows({ table: "onboarding", module: "onboarding", currentUser: authUser }), enabled: !!authUser?.id });
  const { data: userOptions = [] } = useQuery({ queryKey: ["organization-user-options", authUser?.id], queryFn: () => listOrganizationUserOptions(authUser), enabled: !!authUser?.id });
  const { data: jobOptions = [] } = useQuery({ queryKey: ["job-options", authUser?.id], queryFn: () => listJobOptions(authUser), enabled: !!authUser?.id });
  const { data: clientOptions = [] } = useQuery({ queryKey: ["client-options", authUser?.id], queryFn: () => listClientOptions(authUser), enabled: !!authUser?.id });

  const visibleFormColumns = useMemo(() => formColumns.filter((field) => !HIDDEN_DUPLICATE_FIELDS.includes(field.field_key)), [formColumns]);
  const allowedKeys = useMemo(() => formColumns.map((f) => f.field_key), [formColumns]);

  const createMutation = useMutation({ mutationFn: (payload) => createHRAdminOnlyRow({ table: "onboarding", module: "onboarding", payload, currentUser: authUser, allowedKeys }), onSuccess: async () => { toast.success("Onboarding record created"); await queryClient.invalidateQueries({ queryKey: ["onboarding", authUser?.id] }); setOpen(false); setEditingId(null); setForm({}); }, onError: (err) => toast.error(err.message || "Failed to create onboarding record") });
  const updateMutation = useMutation({ mutationFn: ({ id, payload }) => updateHRAdminOnlyRow({ table: "onboarding", module: "onboarding", id, payload, currentUser: authUser, allowedKeys }), onSuccess: async () => { toast.success("Onboarding record updated"); await queryClient.invalidateQueries({ queryKey: ["onboarding", authUser?.id] }); setOpen(false); setEditingId(null); setForm({}); }, onError: (err) => toast.error(err.message || "Failed to update onboarding record") });
  const deleteMutation = useMutation({ mutationFn: (id) => deleteHRAdminOnlyRow({ table: "onboarding", module: "onboarding", id, currentUser: authUser }), onSuccess: async () => { toast.success("Onboarding record deleted"); await queryClient.invalidateQueries({ queryKey: ["onboarding", authUser?.id] }); }, onError: (err) => toast.error(err.message || "Failed to delete onboarding record") });

  const handleOpenAdd = () => { setEditingId(null); setForm({}); setOpen(true); };
  const handleOpenEdit = (row) => { setEditingId(row.id); setForm(row); setOpen(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingId ? updateMutation.mutate({ id: editingId, payload: form }) : createMutation.mutate(form); };

  return (
    <AppLayout heroRight={<Button onClick={handleOpenAdd} className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add Onboarding</Button>}>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">{isLoading ? <div className="p-6 text-sm text-slate-500">Loading onboarding...</div> : error ? <div className="p-6 text-sm text-red-600">Failed to load onboarding.</div> : rows.length === 0 ? <div className="p-6 text-sm text-slate-500">No onboarding records found.</div> : (<Table><TableHeader><TableRow>{tableColumns.map((c) => <TableHead key={c.field_key}>{c.field_label}</TableHead>)}<TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}>{tableColumns.map((c) => <TableCell key={c.field_key}>{String(row?.[c.field_key] ?? "—")}</TableCell>)}<TableCell><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table>)}</div>
      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Onboarding" : "Add Onboarding"}><form onSubmit={handleSubmit} className="space-y-6"><div className="grid gap-4 md:grid-cols-2"><SearchableEntitySelect label="Employee" value={form.employee_id || form.person_id} onChange={(value, option) => setForm((prev) => ({ ...prev, employee_id: value, person_id: value, employee_name: option?.label || "", person_name: option?.label || "" }))} options={userOptions} placeholder="Select employee" /><SearchableEntitySelect label="Job" value={form.job_id} onChange={(value, option) => setForm((prev) => ({ ...prev, job_id: value, job_title: option?.label || "" }))} options={jobOptions} placeholder="Select job" /><SearchableEntitySelect label="Client" value={form.client_id} onChange={(value, option) => setForm((prev) => ({ ...prev, client_id: value, client_name: option?.label || "" }))} options={clientOptions} placeholder="Select client" />{visibleFormColumns.map((field) => <div key={field.field_key} className={field.field_type === "textarea" ? "md:col-span-2" : ""}><label className="mb-1 block text-sm">{field.field_label}{field.required ? <span className="ml-1 text-red-500">*</span> : null}</label><DynamicField field={field} value={form[field.field_key]} onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))} /></div>)}</div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? "Update Onboarding" : "Save Onboarding"}</Button></div></form></RecordFormModal>
    </AppLayout>
  );
}
