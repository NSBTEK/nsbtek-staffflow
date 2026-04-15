import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { getProfileOrThrow } from "@/lib/profile";
import RecordFormModal from "@/components/shared/RecordFormModal";
import AttachmentUploader from "@/components/shared/AttachmentUploader";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

async function listJobs(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export default function Jobs() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [attachmentRow, setAttachmentRow] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("jobs");

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["jobs", authUser?.id],
    queryFn: () => listJobs(authUser),
    enabled: !!authUser?.id,
  });

  const allowedKeys = useMemo(() => formColumns.map((f) => f.field_key), [formColumns]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const profile = await getProfileOrThrow(authUser.id);
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
      );

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          ...cleanPayload,
          organization_id: profile.organization_id,
          created_by: authUser.id,
          updated_by: authUser.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", authUser?.id] });
      setForm({});
      setEditingId(null);
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
      );

      const { data, error } = await supabase
        .from("jobs")
        .update({
          ...cleanPayload,
          updated_by: authUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", authUser?.id] });
      setForm({});
      setEditingId(null);
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", authUser?.id] });
    },
  });

  const openAddModal = () => {
    setForm({});
    setEditingId(null);
    setOpen(true);
  };

  const openEditModal = (job) => {
    setForm(job);
    setEditingId(job.id);
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const renderCellValue = (job, fieldKey) => {
    const value = job[fieldKey];
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage shared job records for your organization.</p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
        >
          + Add Job
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-6">Loading jobs...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-muted-foreground">No jobs yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((col) => (
                  <TableHead key={col.field_key} className="px-4 py-3 text-left">
                    {col.field_label}
                  </TableHead>
                ))}
                <TableHead className="px-4 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  {tableColumns.map((col) => (
                    <TableCell key={col.field_key} className="px-4 py-3">
                      {renderCellValue(job, col.field_key)}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => openEditModal(job)}
                        className="rounded-lg border px-3 py-1.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setAttachmentRow(job)}
                        className="rounded-lg border px-3 py-1.5"
                      >
                        Attachments
                      </button>
                      <button
                        onClick={() => {
                          const confirmed = window.confirm("Are you sure you want to delete this record?");
                          if (confirmed) {
                            deleteMutation.mutate(job.id);
                          }
                        }}
                        className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RecordFormModal
        open={open}
        onOpenChange={setOpen}
        title={editingId ? "Edit Job" : "Add Job"}
      >
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          {formColumns.map((field) => (
            <div
              key={field.field_key}
              className={field.field_type === "textarea" ? "md:col-span-2" : ""}
            >
              <label className="block text-sm mb-1">
                {field.field_label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <DynamicField
                field={field}
                value={form[field.field_key]}
                onChange={(key, value) =>
                  setForm((prev) => ({ ...prev, [key]: value }))
                }
              />
            </div>
          ))}

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-4 py-2"
            >
              {editingId ? "Update Job" : "Save Job"}
            </button>
          </div>
        </form>
      </RecordFormModal>

      <Dialog open={!!attachmentRow} onOpenChange={(value) => !value && setAttachmentRow(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Attachments</DialogTitle>
          </DialogHeader>
          {attachmentRow && (
            <AttachmentUploader module="jobs" recordId={attachmentRow.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
