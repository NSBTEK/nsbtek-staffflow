import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canEdit } from "@/lib/permissions";
import AppLayout from "@/components/layout/AppLayout";
import RecordFormModal from "@/components/shared/RecordFormModal";
import DynamicField from "@/components/shared/DynamicField";
import SearchableEntitySelect from "@/components/shared/SearchableEntitySelect";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import { listModuleRows } from "@/lib/supabaseCrud";
import { createAuditedModuleRow, updateAuditedModuleRow, deleteAuditedModuleRow } from "@/lib/auditedCrud";
import { listCandidateOptions, listJobOptions, listClientOptions, listOrganizationUserOptions } from "@/lib/recruitmentOptions";

const HIDDEN_DUPLICATE_FIELDS = ["candidate_id","candidate_name","job_id","job_title","client_id","client_name","interviewer_id","interviewer_name"];
function makeInitialForm(formColumns, row = null) { const next = {}; for (const field of formColumns || []) next[field.field_key] = row?.[field.field_key] ?? ""; return next; }

export default function Interviews() {
  const { authUser } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const { tableColumns = [], formColumns = [] } = useModuleColumns("interviews");

  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["interviews", authUser?.id], queryFn: () => listModuleRows({ table: "interviews", module: "interviews", currentUser: authUser }), enabled: !!authUser?.id });
  const { data: candidateOptions = [] } = useQuery({ queryKey: ["candidate-options", authUser?.id], queryFn: () => listCandidateOptions(authUser), enabled: !!authUser?.id });
  const { data: jobOptions = [] } = useQuery({ queryKey: ["job-options", authUser?.id], queryFn: () => listJobOptions(authUser), enabled: !!authUser?.id });
  const { data: clientOptions = [] } = useQuery({ queryKey: ["client-options", authUser?.id], queryFn: () => listClientOptions(authUser), enabled: !!authUser?.id });
  const { data: userOptions = [] } = useQuery({ queryKey: ["organization-user-options", authUser?.id], queryFn: () => listOrganizationUserOptions(authUser), enabled: !!authUser?.id });

  const allowedKeys = useMemo(() => formColumns.map((f) => f.field_key), [formColumns]);
  const visibleFormColumns = useMemo(() => formColumns.filter((f) => !HIDDEN_DUPLICATE_FIELDS.includes(f.field_key)), [formColumns]);
  const editable = canEdit(user, "interviews");

  const createMutation = useMutation({ mutationFn: (payload) => createAuditedModuleRow({ table: "interviews", module: "interviews", payload, currentUser: authUser, allowedKeys }), onSuccess: async () => { toast.success("Interview created"); await queryClient.invalidateQueries({ queryKey: ["interviews", authUser?.id] }); setOpen(false); setEditingId(null); setForm({}); }, onError: (err) => toast.error(err?.message || "Failed to create interview") });
  const updateMutation = useMutation({ mutationFn: ({ id, payload }) => updateAuditedModuleRow({ table: "interviews", module: "interviews", id, payload, currentUser: authUser, allowedKeys }), onSuccess: async () => { toast.success("Interview updated"); await queryClient.invalidateQueries({ queryKey: ["interviews", authUser?.id] }); setOpen(false); setEditingId(null); setForm({}); }, onError: (err) => toast.error(err?.message || "Failed to update interview") });
  const deleteMutation = useMutation({ mutationFn: (id) => deleteAuditedModuleRow({ table: "interviews", module: "interviews", id, currentUser: authUser }), onSuccess: async () => { toast.success("Interview deleted"); await queryClient.invalidateQueries({ queryKey: ["interviews", authUser?.id] }); }, onError: (err) => toast.error(err?.message || "Failed to delete interview") });

  const handleOpenAdd = () => { setEditingId(null); setForm(makeInitialForm(formColumns)); setOpen(true); };
  const handleOpenEdit = (row) => { setEditingId(row.id); setForm(makeInitialForm(formColumns, row)); setOpen(true); };
  const handleView = (row) => { setSelectedRow(row); setViewOpen(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingId ? updateMutation.mutate({ id: editingId, payload: form }) : createMutation.mutate(form); };

  return (
    <AppLayout heroRight={editable ? <Button onClick={handleOpenAdd} className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add Interview</Button> : null}>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {userLoading || isLoading ? <div className="p-6 text-sm text-slate-500">Loading interviews...</div> : error ? <div className="p-6 text-sm text-red-600">Failed to load interviews.</div> : rows.length === 0 ? <div className="p-6 text-sm text-slate-500">No interviews found.</div> : (
          <Table><TableHeader><TableRow>{tableColumns.map((c) => <TableHead key={c.field_key}>{c.field_label}</TableHead>)}<TableHead className="w-[180px]">Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}>{tableColumns.map((c) => <TableCell key={c.field_key}>{String(row?.[c.field_key] ?? "—")}</TableCell>)}<TableCell><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => handleView(row)}><Eye className="h-4 w-4" /></Button>{editable ? <><Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button></> : null}</div></TableCell></TableRow>)}</TableBody></Table>
        )}
      </div>
      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Interview" : "Add Interview"}><form onSubmit={handleSubmit} className="space-y-6"><div className="grid gap-4 md:grid-cols-2"><SearchableEntitySelect label="Candidate" value={form.candidate_id} onChange={(value, opt) => setForm((prev) => ({ ...prev, candidate_id: value, candidate_name: opt?.label || "" }))} options={candidateOptions} /><SearchableEntitySelect label="Job" value={form.job_id} onChange={(value, opt) => setForm((prev) => ({ ...prev, job_id: value, job_title: opt?.label || "" }))} options={jobOptions} /><SearchableEntitySelect label="Client" value={form.client_id} onChange={(value, opt) => setForm((prev) => ({ ...prev, client_id: value, client_name: opt?.label || "" }))} options={clientOptions} /><SearchableEntitySelect label="Interviewer" value={form.interviewer_id} onChange={(value, opt) => setForm((prev) => ({ ...prev, interviewer_id: value, interviewer_name: opt?.label || "" }))} options={userOptions} />{visibleFormColumns.map((field) => <div key={field.field_key} className={field.field_type === "textarea" ? "md:col-span-2" : ""}><label className="mb-1 block text-sm">{field.field_label}{field.required ? <span className="ml-1 text-red-500">*</span> : null}</label><DynamicField field={field} value={form[field.field_key]} onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))} /></div>)}</div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? "Update Interview" : "Save Interview"}</Button></div></form></RecordFormModal>
      <Dialog open={viewOpen} onOpenChange={setViewOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Interview Details</DialogTitle></DialogHeader>{selectedRow ? <div className="grid gap-4 md:grid-cols-2">{tableColumns.map((c) => <div key={c.field_key} className="rounded-xl border border-slate-200 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.field_label}</div><div className="mt-2 text-sm text-slate-900">{String(selectedRow?.[c.field_key] ?? "—")}</div></div>)}</div> : null}</DialogContent></Dialog>
    </AppLayout>
  );
}
