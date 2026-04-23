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
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import { listModuleRows } from "@/lib/supabaseCrud";
import { createAuditedModuleRow, updateAuditedModuleRow, deleteAuditedModuleRow } from "@/lib/auditedCrud";

function makeInitialForm(formColumns, row = null) {
  const next = {};
  for (const field of formColumns || []) {
    next[field.field_key] = row?.[field.field_key] ?? "";
  }
  return next;
}

export default function Contacts() {
  const { authUser } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const { tableColumns = [], formColumns = [] } = useModuleColumns("contacts");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["contacts", authUser?.id],
    queryFn: () => listModuleRows({ table: "contacts", module: "contacts", currentUser: authUser }),
    enabled: !!authUser?.id,
  });

  const allowedKeys = useMemo(() => formColumns.map((f) => f.field_key), [formColumns]);
  const editable = canEdit(user, "contacts");

  const createMutation = useMutation({
    mutationFn: (payload) => createAuditedModuleRow({ table: "contacts", module: "contacts", payload, currentUser: authUser, allowedKeys }),
    onSuccess: async () => {
      toast.success("Contact created");
      await queryClient.invalidateQueries({ queryKey: ["contacts", authUser?.id] });
      setOpen(false); setEditingId(null); setForm({});
    },
    onError: (err) => toast.error(err?.message || "Failed to create contact"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAuditedModuleRow({ table: "contacts", module: "contacts", id, payload, currentUser: authUser, allowedKeys }),
    onSuccess: async () => {
      toast.success("Contact updated");
      await queryClient.invalidateQueries({ queryKey: ["contacts", authUser?.id] });
      setOpen(false); setEditingId(null); setForm({});
    },
    onError: (err) => toast.error(err?.message || "Failed to update contact"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAuditedModuleRow({ table: "contacts", module: "contacts", id, currentUser: authUser }),
    onSuccess: async () => {
      toast.success("Contact deleted");
      await queryClient.invalidateQueries({ queryKey: ["contacts", authUser?.id] });
    },
    onError: (err) => toast.error(err?.message || "Failed to delete contact"),
  });

  const handleOpenAdd = () => { setEditingId(null); setForm(makeInitialForm(formColumns)); setOpen(true); };
  const handleOpenEdit = (row) => { setEditingId(row.id); setForm(makeInitialForm(formColumns, row)); setOpen(true); };
  const handleView = (row) => { setSelectedRow(row); setViewOpen(true); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, payload: form });
    else createMutation.mutate(form);
  };

  return (
    <AppLayout heroRight={editable ? <Button onClick={handleOpenAdd} className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add Contact</Button> : null}>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {userLoading || isLoading ? <div className="p-6 text-sm text-slate-500">Loading contacts...</div> : error ? <div className="p-6 text-sm text-red-600">Failed to load contacts.</div> : rows.length === 0 ? <div className="p-6 text-sm text-slate-500">No contacts found.</div> : (
          <Table>
            <TableHeader><TableRow>{tableColumns.map((c) => <TableHead key={c.field_key}>{c.field_label}</TableHead>)}<TableHead className="w-[180px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {tableColumns.map((c) => <TableCell key={c.field_key}>{String(row?.[c.field_key] ?? "—")}</TableCell>)}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(row)}><Eye className="h-4 w-4" /></Button>
                      {editable ? <><Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button></> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Contact" : "Add Contact"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {formColumns.map((field) => (
              <div key={field.field_key} className={field.field_type === "textarea" ? "md:col-span-2" : ""}>
                <label className="mb-1 block text-sm">{field.field_label}{field.required ? <span className="ml-1 text-red-500">*</span> : null}</label>
                <DynamicField field={field} value={form[field.field_key]} onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? "Update Contact" : "Save Contact"}</Button></div>
        </form>
      </RecordFormModal>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Contact Details</DialogTitle></DialogHeader>{selectedRow ? <div className="grid gap-4 md:grid-cols-2">{tableColumns.map((c) => <div key={c.field_key} className="rounded-xl border border-slate-200 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.field_label}</div><div className="mt-2 text-sm text-slate-900">{String(selectedRow?.[c.field_key] ?? "—")}</div></div>)}</div> : null}</DialogContent></Dialog>
    </AppLayout>
  );
}
