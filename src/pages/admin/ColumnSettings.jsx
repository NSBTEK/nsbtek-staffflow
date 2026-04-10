import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnConfig,
  deleteColumnConfig,
  listColumnConfigs,
  updateColumnConfig,
} from "@/api/columnConfigs";
import RecordFormModal from "@/components/shared/RecordFormModal";

const MODULE_OPTIONS = [
  { value: "clients", label: "Clients" },
  { value: "contacts", label: "Contacts" },
  { value: "candidates", label: "Candidates" },
  { value: "jobs", label: "Jobs" },
  { value: "submissions", label: "Submissions" },
  { value: "interviews", label: "Interviews" },
  { value: "placements", label: "Placements" },
  { value: "timesheets", label: "Timesheets" },
  { value: "expenses", label: "Expenses" },
  { value: "contracts", label: "Contracts" },
  { value: "onboarding", label: "Onboarding" },
  { value: "payroll", label: "Payroll" },
];

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date Time" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "url", label: "URL" },
];

function makeFieldKey(label = "") {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function ColumnSettings() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedModule, setSelectedModule] = useState("clients");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    module: "clients",
    field_key: "",
    field_label: "",
    field_type: "text",
    visible_in_table: true,
    visible_in_form: true,
    required: false,
    is_system: false,
    is_active: true,
    sort_order: 0,
  });

  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["column-configs", selectedModule],
    queryFn: () => listColumnConfigs(selectedModule),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createColumnConfig(payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["column-configs", selectedModule] });
      resetForm();
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateColumnConfig(id, payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["column-configs", selectedModule] });
      resetForm();
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteColumnConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["column-configs", selectedModule] });
    },
  });

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [rows]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      module: selectedModule,
      field_key: "",
      field_label: "",
      field_type: "text",
      visible_in_table: true,
      visible_in_form: true,
      required: false,
      is_system: false,
      is_active: true,
      sort_order: sortedRows.length + 1,
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (row) => {
    setEditing(row);
    setForm({
      module: row.module,
      field_key: row.field_key || "",
      field_label: row.field_label || "",
      field_type: row.field_type || "text",
      visible_in_table: !!row.visible_in_table,
      visible_in_form: !!row.visible_in_form,
      required: !!row.required,
      is_system: !!row.is_system,
      is_active: !!row.is_active,
      sort_order: row.sort_order ?? 0,
    });
    setOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      field_key: form.field_key || makeFieldKey(form.field_label),
      sort_order: Number(form.sort_order || 0),
    };

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const moveRow = (row, direction) => {
    const currentIndex = sortedRows.findIndex((x) => x.id === row.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedRows.length) return;

    const current = sortedRows[currentIndex];
    const target = sortedRows[targetIndex];

    updateMutation.mutate({
      id: current.id,
      payload: { sort_order: target.sort_order },
    });

    updateMutation.mutate({
      id: target.id,
      payload: { sort_order: current.sort_order },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Column Settings</h1>
          <p className="text-muted-foreground">
            Manage visible fields, labels, order, and custom columns by module.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
        >
          + Add Column
        </button>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Module</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            {MODULE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-6">Loading column settings...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : sortedRows.length === 0 ? (
          <div className="p-6 text-muted-foreground">No column settings found for this module.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Table</th>
                <th className="px-4 py-3 text-left">Form</th>
                <th className="px-4 py-3 text-left">Required</th>
                <th className="px-4 py-3 text-left">System</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{row.sort_order}</td>
                  <td className="px-4 py-3">{row.field_label}</td>
                  <td className="px-4 py-3">{row.field_key}</td>
                  <td className="px-4 py-3 capitalize">{row.field_type}</td>
                  <td className="px-4 py-3">{row.visible_in_table ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{row.visible_in_form ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{row.required ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{row.is_system ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{row.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => moveRow(row, "up")}
                        className="rounded-lg border px-3 py-1.5"
                      >
                        Up
                      </button>
                      <button
                        onClick={() => moveRow(row, "down")}
                        className="rounded-lg border px-3 py-1.5"
                      >
                        Down
                      </button>
                      <button
                        onClick={() => openEditModal(row)}
                        className="rounded-lg border px-3 py-1.5"
                      >
                        Edit
                      </button>
                      {!row.is_system && (
                        <button
                          onClick={() => deleteMutation.mutate(row.id)}
                          className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5"
                        >
                          Delete
                        </button>
                      )}
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
        title={editing ? "Edit Column" : "Add Column"}
      >
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <select
            className="border rounded-lg px-3 py-2"
            value={form.module}
            onChange={(e) => setForm({ ...form, module: e.target.value })}
            disabled={!!editing}
          >
            {MODULE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Field Label"
            value={form.field_label}
            onChange={(e) =>
              setForm({
                ...form,
                field_label: e.target.value,
                field_key: editing ? form.field_key : makeFieldKey(e.target.value),
              })
            }
            required
          />

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Field Key"
            value={form.field_key}
            onChange={(e) => setForm({ ...form, field_key: makeFieldKey(e.target.value) })}
            required
            disabled={!!form.is_system}
          />

          <select
            className="border rounded-lg px-3 py-2"
            value={form.field_type}
            onChange={(e) => setForm({ ...form, field_type: e.target.value })}
          >
            {FIELD_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="border rounded-lg px-3 py-2"
            placeholder="Sort Order"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.visible_in_table}
              onChange={(e) => setForm({ ...form, visible_in_table: e.target.checked })}
            />
            Visible in Table
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.visible_in_form}
              onChange={(e) => setForm({ ...form, visible_in_form: e.target.checked })}
            />
            Visible in Form
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
            />
            Required
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>

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
              {editing ? "Update Column" : "Save Column"}
            </button>
          </div>
        </form>
      </RecordFormModal>
    </div>
  );
}