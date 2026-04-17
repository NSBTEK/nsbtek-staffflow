import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RecordFormModal from "@/components/shared/RecordFormModal";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canEdit } from "@/lib/permissions";
import { listModuleRows, createModuleRow, updateModuleRow, deleteModuleRow } from "@/lib/supabaseCrud";
import { toast } from "sonner";

export default function Activities() {
  const { authUser } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("activities");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["activities", authUser?.id],
    queryFn: () =>
      listModuleRows({
        table: "activities",
        module: "activities",
        currentUser: authUser,
      }),
    enabled: !!authUser?.id,
  });

  const allowedKeys = formColumns.map((f) => f.field_key);

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createModuleRow({
        table: "activities",
        module: "activities",
        payload,
        currentUser: authUser,
        allowedKeys,
      }),
    onSuccess: async () => {
      toast.success("Activity created");
      await queryClient.invalidateQueries({ queryKey: ["activities", authUser?.id] });
      setForm({});
      setEditingId(null);
      setOpen(false);
    },
    onError: (error) => toast.error(error.message || "Failed to create activity"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      updateModuleRow({
        table: "activities",
        module: "activities",
        id,
        payload,
        currentUser: authUser,
        allowedKeys,
      }),
    onSuccess: async () => {
      toast.success("Activity updated");
      await queryClient.invalidateQueries({ queryKey: ["activities", authUser?.id] });
      setForm({});
      setEditingId(null);
      setOpen(false);
    },
    onError: (error) => toast.error(error.message || "Failed to update activity"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      deleteModuleRow({
        table: "activities",
        module: "activities",
        id,
        currentUser: authUser,
      }),
    onSuccess: async () => {
      toast.success("Activity deleted");
      await queryClient.invalidateQueries({ queryKey: ["activities", authUser?.id] });
    },
    onError: (error) => toast.error(error.message || "Failed to delete activity"),
  });

  const openAddModal = () => {
    setEditingId(null);
    setForm({});
    setOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm(row);
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

  const renderCellValue = (row, fieldKey) => {
    const value = row[fieldKey];
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  if (userLoading) return <div className="p-6">Loading profile...</div>;

  const editable = canEdit(user, "activities");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-muted-foreground">Track follow-ups, tasks, and activity history.</p>
        </div>
        {editable && (
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
          >
            + Add Activity
          </button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-6">Loading activities...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-muted-foreground">No activity records found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((col) => (
                  <TableHead key={col.field_key} className="px-4 py-3 text-left">
                    {col.field_label}
                  </TableHead>
                ))}
                {editable && <TableHead className="px-4 py-3 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {tableColumns.map((col) => (
                    <TableCell key={col.field_key} className="px-4 py-3">
                      {renderCellValue(row, col.field_key)}
                    </TableCell>
                  ))}
                  {editable && (
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button onClick={() => openEditModal(row)} className="rounded-lg border px-3 py-1.5">
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this record?")) {
                              deleteMutation.mutate(row.id);
                            }
                          }}
                          className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Activity" : "Add Activity"}>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
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
          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2">
              {editingId ? "Update Activity" : "Save Activity"}
            </button>
          </div>
        </form>
      </RecordFormModal>
    </div>
  );
}