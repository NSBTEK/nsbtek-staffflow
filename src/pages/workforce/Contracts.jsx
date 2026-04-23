import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RecordFormModal from "@/components/shared/RecordFormModal";
import SearchableEntitySelect from "@/components/shared/SearchableEntitySelect";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { listOrganizationUserOptions, listClientOptions } from "@/lib/recruitmentOptions";
import { listWorkforceRows, createWorkforceRow, updateWorkforceRow, deleteWorkforceRow } from "@/lib/workforceCrud";
import { hasFullWorkforceAccess, hasManagerWorkforceAccess } from "@/lib/workforceAccess";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const HIDDEN_DUPLICATE_FIELDS = ["employee_id","employee_name","user_id","user_name","client_id","client_name"];

export default function Contracts() {
  const { authUser } = useAuth();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("contracts");

  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["contracts", authUser?.id], queryFn: () => listWorkforceRows({ table: "contracts", module: "contracts", currentUser: authUser, employeeColumn: "employee_id" }), enabled: !!authUser?.id });
  const { data: userOptions = [] } = useQuery({ queryKey: ["organization-user-options", authUser?.id], queryFn: () => listOrganizationUserOptions(authUser), enabled: !!authUser?.id });
  const { data: clientOptions = [] } = useQuery({ queryKey: ["client-options", authUser?.id], queryFn: () => listClientOptions(authUser), enabled: !!authUser?.id });
  const visibleFormColumns = useMemo(() => formColumns.filter((field) => !HIDDEN_DUPLICATE_FIELDS.includes(field.field_key)), [formColumns]);
  const allowedKeys = useMemo(() => formColumns.map((f) => f.field_key), [formColumns]);
  const canChooseOtherEmployees = hasFullWorkforceAccess(user) || hasManagerWorkforceAccess(user);

  const createMutation = useMutation({ mutationFn: (payload) => createWorkforceRow({ table: "contracts", module: "contracts", payload: { ...payload, employee_id: payload.employee_id || authUser.id }, currentUser: authUser, allowedKeys, employeeColumn: "employee_id" }), onSuccess: async () => { toast.success("Contract created"); await queryClient.invalidateQueries({ queryKey: ["contracts", authUser?.id] }); setForm({}); setEditingId(null); setOpen(false); }, onError: (error) => toast.error(error.message || "Failed to create contract") });
  const updateMutation = useMutation({ mutationFn: ({ id, payload }) => updateWorkforceRow({ table: "contracts", module: "contracts", id, payload, currentUser: authUser, allowedKeys, employeeColumn: "employee_id" }), onSuccess: async () => { toast.success("Contract updated"); await queryClient.invalidateQueries({ queryKey: ["contracts", authUser?.id] }); setForm({}); setEditingId(null); setOpen(false); }, onError: (error) => toast.error(error.message || "Failed to update contract") });
  const deleteMutation = useMutation({ mutationFn: (id) => deleteWorkforceRow({ table: "contracts", module: "contracts", id, currentUser: authUser, employeeColumn: "employee_id" }), onSuccess: async () => { toast.success("Contract deleted"); await queryClient.invalidateQueries({ queryKey: ["contracts", authUser?.id] }); }, onError: (error) => toast.error(error.message || "Failed to delete contract") });

  const handleOpenAdd = () => { setEditingId(null); setForm({}); setOpen(true); };
  const handleOpenEdit = (row) => { setEditingId(row.id); setForm(row); setOpen(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingId ? updateMutation.mutate({ id: editingId, payload: form }) : createMutation.mutate(form); };

  return (
    <AppLayout heroRight={<Button onClick={handleOpenAdd} className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add Contract</Button>}>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">{isLoading ? <div className="p-6 text-sm text-slate-500">Loading contracts...</div> : error ? <div className="p-6 text-sm text-red-600">Failed to load contracts.</div> : rows.length === 0 ? <div className="p-6 text-sm text-slate-500">No contracts found.</div> : (<Table><TableHeader><TableRow>{tableColumns.map((c) => <TableHead key={c.field_key}>{c.field_label}</TableHead>)}<TableHead className="w-[140px]">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}>{tableColumns.map((c) => <TableCell key={c.field_key}>{String(row?.[c.field_key] ?? "—")}</TableCell>)}<TableCell><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table>)}</div>
      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Contract" : "Add Contract"}><form onSubmit={handleSubmit} className="space-y-6">{canChooseOtherEmployees ? <SearchableEntitySelect label="Employee" value={form.employee_id} onChange={(value, option) => setForm((prev) => ({ ...prev, employee_id: value, employee_name: option?.label || "" }))} options={userOptions} placeholder="Select employee" /> : null}<SearchableEntitySelect label="Client" value={form.client_id} onChange={(value, option) => setForm((prev) => ({ ...prev, client_id: value, client_name: option?.label || "" }))} options={clientOptions} placeholder="Select client" /><div className="grid gap-4 md:grid-cols-2">{visibleFormColumns.map((field) => <div key={field.field_key} className={field.field_type === "textarea" ? "md:col-span-2" : ""}><label className="mb-1 block text-sm">{field.field_label}{field.required ? <span className="ml-1 text-red-500">*</span> : null}</label><DynamicField field={field} value={form[field.field_key]} onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))} /></div>)}</div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? "Update Contract" : "Save Contract"}</Button></div></form></RecordFormModal>
    </AppLayout>
  );
}
