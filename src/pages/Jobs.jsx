import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import RecordFormModal from "@/components/shared/RecordFormModal";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";

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

async function createJobRecord(payload, currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const allowedKeys = [
    "title",
    "client_name",
    "location",
    "status",
    "job_type",
    "department",
    "openings",
    "salary",
    "description",
    "requirements",
    "notes",
  ];

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...cleanPayload,
      organization_id: profile.organization_id,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateJobRecord(id, payload, currentUser) {
  const allowedKeys = [
    "title",
    "client_name",
    "location",
    "status",
    "job_type",
    "department",
    "openings",
    "salary",
    "description",
    "requirements",
    "notes",
  ];

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from("jobs")
    .update({
      ...cleanPayload,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteJobRecord(id) {
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export default function Jobs() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("jobs");

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["jobs", authUser?.id],
    queryFn: () => listJobs(authUser),
    enabled: !!authUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createJobRecord(payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", authUser?.id] });
      resetForm();
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateJobRecord(id, payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", authUser?.id] });
      resetForm();
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", authUser?.id] });
    },
  });

  const resetForm = () => {
    setForm({});
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (job) => {
    setEditingId(job.id);
    setForm(job);
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">
            Manage shared job records for your organization.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
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
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {tableColumns.map((col) => (
                  <th key={col.field_key} className="px-4 py-3 text-left">
                    {col.field_label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  {tableColumns.map((col) => (
                    <td key={col.field_key} className="px-4 py-3">
                      {renderCellValue(job, col.field_key)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(job)}
                        className="rounded-lg border px-3 py-1.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Are you sure you want to delete this record?"
                          );
                          if (confirmed) {
                            deleteMutation.mutate(job.id);
                          }
                        }}
                        className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}