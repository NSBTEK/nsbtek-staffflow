import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import RecordFormModal from "@/components/shared/RecordFormModal";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { canEdit } from "@/lib/permissions";

async function listExpenses(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (profile.role === "employee") {
    query = query.eq("created_by", currentUser.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export default function Expenses() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("expenses");

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ["expenses", authUser?.id],
    queryFn: () => listExpenses(authUser),
    enabled: !!authUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const profile = await getProfileOrThrow(authUser.id);
      const allowedKeys = formColumns.map((f) => f.field_key);
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
      );

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...cleanPayload,
          organization_id: profile.organization_id,
          created_by: authUser.id,
          updated_by: authUser.id,
          status: cleanPayload.status || "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", authUser?.id] });
      setForm({});
      setEditingId(null);
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const allowedKeys = formColumns.map((f) => f.field_key);
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
      );

      const { data, error } = await supabase
        .from("expenses")
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
      queryClient.invalidateQueries({ queryKey: ["expenses", authUser?.id] });
      setForm({});
      setEditingId(null);
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", authUser?.id] });
    },
  });

  const openAddModal = () => {
    setForm({});
    setEditingId(null);
    setOpen(true);
  };

  const openEditModal = (row) => {
    setForm(row);
    setEditingId(row.id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Manage workforce expenses.</p>
        </div>
        {canEdit(authUser, "expenses") && (
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
          >
            + Add Expense
          </button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-6">Loading expenses...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : expenses.length === 0 ? (
          <div className="p-6 text-muted-foreground">No expenses yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((col) => (
                  <TableHead key={col.field_key}>{col.field_label}</TableHead>
                ))}
                {canEdit(authUser, "expenses") && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((row) => (
                <TableRow key={row.id}>
                  {tableColumns.map((col) => (
                    <TableCell key={col.field_key}>{renderCellValue(row, col.field_key)}</TableCell>
                  ))}
                  {canEdit(authUser, "expenses") && (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(row)} className="rounded-lg border px-3 py-1.5">
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this expense?")) deleteMutation.mutate(row.id);
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

      <RecordFormModal open={open} onOpenChange={setOpen} title={editingId ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          {formColumns.map((field) => (
            <div key={field.field_key} className={field.field_type === "textarea" ? "md:col-span-2" : ""}>
              <label className="block text-sm mb-1">{field.field_label}</label>
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
              {editingId ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </RecordFormModal>
    </div>
  );
}
