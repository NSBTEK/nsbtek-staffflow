import React, { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import { uploadAttachment } from "@/api/attachments";
import RecordFormModal from "@/components/shared/RecordFormModal";
import AttachmentUploader from "@/components/shared/AttachmentUploader";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";

async function listCandidates(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export default function Candidates() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const { tableColumns, formColumns } = useModuleColumns("candidates");
  const fileRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [pendingFile, setPendingFile] = useState(null);

  const { data: candidates = [], isLoading, error } = useQuery({
    queryKey: ["candidates", authUser?.id],
    queryFn: () => listCandidates(authUser),
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
        .from("candidates")
        .insert({
          ...cleanPayload,
          organization_id: profile.organization_id,
          created_by: authUser.id,
          updated_by: authUser.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (pendingFile) {
        await uploadAttachment({
          file: pendingFile,
          module: "candidates",
          recordId: data.id,
          currentUser: authUser,
        });
      }

      return data;
    },
    onSuccess: async (savedRow) => {
      toast.success("Candidate saved");
      if (pendingFile) toast.success("Resume uploaded");
      await queryClient.invalidateQueries({ queryKey: ["candidates", authUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ["attachments", "candidates", savedRow.id] });
      setEditingId(savedRow.id);
      setForm(savedRow);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to save candidate"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
      );

      const { data, error } = await supabase
        .from("candidates")
        .update({
          ...cleanPayload,
          updated_by: authUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (pendingFile) {
        await uploadAttachment({
          file: pendingFile,
          module: "candidates",
          recordId: data.id,
          currentUser: authUser,
        });
      }

      return data;
    },
    onSuccess: async (savedRow) => {
      toast.success("Candidate updated");
      if (pendingFile) toast.success("Resume uploaded");
      await queryClient.invalidateQueries({ queryKey: ["candidates", authUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ["attachments", "candidates", savedRow.id] });
      setEditingId(savedRow.id);
      setForm(savedRow);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to update candidate"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["candidates", authUser?.id] });
      toast.success("Candidate deleted");
    },
  });

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (candidate) => {
    setEditingId(candidate.id);
    setForm(candidate);
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const renderCellValue = (candidate, fieldKey) => {
    if (fieldKey === "first_name" || fieldKey === "last_name") {
      const fullName = [candidate.first_name, candidate.last_name].filter(Boolean).join(" ").trim();
      return fullName || "-";
    }

    const value = candidate[fieldKey];
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">Manage candidates and upload resumes in the same save flow.</p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
        >
          + Add Candidate
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-6">Loading candidates...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : candidates.length === 0 ? (
          <div className="p-6 text-muted-foreground">No candidates yet.</div>
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
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  {tableColumns.map((col) => (
                    <TableCell key={col.field_key} className="px-4 py-3">
                      {renderCellValue(candidate, col.field_key)}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button onClick={() => openEditModal(candidate)} className="rounded-lg border px-3 py-1.5">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this record?")) {
                            deleteMutation.mutate(candidate.id);
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

      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Candidate" : "Add Candidate"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {formColumns.map((field) => (
              <div key={field.field_key} className={field.field_type === "textarea" ? "md:col-span-2" : ""}>
                <label className="block text-sm mb-1">
                  {field.field_label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <DynamicField
                  field={field}
                  value={form[field.field_key]}
                  onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
                />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Resume / Candidate Documents</div>
            <p className="mt-1 text-xs text-slate-500">
              Select a resume before saving. It will upload automatically after the candidate record is created.
            </p>

            <div className="mt-4">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
                className="block w-full rounded-lg border bg-white px-3 py-2 text-sm"
              />
              {pendingFile ? (
                <div className="mt-2 text-sm text-slate-600">Selected: {pendingFile.name}</div>
              ) : null}
            </div>

            {editingId ? (
              <div className="mt-4">
                <AttachmentUploader module="candidates" recordId={editingId} />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-4 py-2"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingId
                ? "Update Candidate"
                : "Save Candidate"}
            </button>
          </div>
        </form>
      </RecordFormModal>
    </div>
  );
}