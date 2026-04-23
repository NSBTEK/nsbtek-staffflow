import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { listModuleRows } from "@/lib/supabaseCrud";
import {
  createAuditedModuleRow,
  updateAuditedModuleRow,
  deleteAuditedModuleRow,
} from "@/lib/auditedCrud";
import RecordFormModal from "@/components/shared/RecordFormModal";
import SearchableEntitySelect from "@/components/shared/SearchableEntitySelect";
import AppLayout from "@/components/layout/AppLayout";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { listCandidateOptions, listJobOptions, listClientOptions } from "@/lib/recruitmentOptions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

function buildRelatedOptions(candidateOptions, jobOptions, clientOptions) {
  const candidates = candidateOptions.map((item) => ({
    ...item,
    label: `${item.label} (Candidate)`,
    description: item.description || "Candidate",
    keywords: `${item.keywords || ""} candidate`,
  }));

  const jobs = jobOptions.map((item) => ({
    ...item,
    label: `${item.label} (Job)`,
    description: item.description || "Job",
    keywords: `${item.keywords || ""} job`,
  }));

  const clients = clientOptions.map((item) => ({
    ...item,
    label: `${item.label} (Client)`,
    description: item.description || "Client",
    keywords: `${item.keywords || ""} client`,
  }));

  return [...candidates, ...jobs, ...clients];
}

export default function Activities() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns = [], formColumns = [] } = useModuleColumns("activities");

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

  const { data: candidateOptions = [] } = useQuery({
    queryKey: ["candidate-options", authUser?.id],
    queryFn: () => listCandidateOptions(authUser),
    enabled: !!authUser?.id,
  });

  const { data: jobOptions = [] } = useQuery({
    queryKey: ["job-options", authUser?.id],
    queryFn: () => listJobOptions(authUser),
    enabled: !!authUser?.id,
  });

  const { data: clientOptions = [] } = useQuery({
    queryKey: ["client-options", authUser?.id],
    queryFn: () => listClientOptions(authUser),
    enabled: !!authUser?.id,
  });

  const relatedOptions = useMemo(
    () => buildRelatedOptions(candidateOptions, jobOptions, clientOptions),
    [candidateOptions, jobOptions, clientOptions]
  );

  const allowedKeys = useMemo(
    () => formColumns.map((field) => field.field_key),
    [formColumns]
  );

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createAuditedModuleRow({
        table: "activities",
        module: "activities",
        payload,
        currentUser: authUser,
        allowedKeys,
      }),
    onSuccess: async () => {
      toast.success("Activity created");
      await queryClient.invalidateQueries({ queryKey: ["activities", authUser?.id] });
      setOpen(false);
      setEditingId(null);
      setForm({});
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create activity");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      updateAuditedModuleRow({
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
      setOpen(false);
      setEditingId(null);
      setForm({});
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update activity");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      deleteAuditedModuleRow({
        table: "activities",
        module: "activities",
        id,
        currentUser: authUser,
      }),
    onSuccess: async () => {
      toast.success("Activity deleted");
      await queryClient.invalidateQueries({ queryKey: ["activities", authUser?.id] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete activity");
    },
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({});
    setOpen(true);
  };

  const handleOpenEdit = (row) => {
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

  return (
    <AppLayout
      heroRight={
        <Button onClick={handleOpenAdd} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading activities...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Failed to load activities.</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No activities found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((column) => (
                  <TableHead key={column.field_key}>{column.field_label}</TableHead>
                ))}
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {tableColumns.map((column) => (
                    <TableCell key={column.field_key}>
                      {String(row?.[column.field_key] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(row.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        title={editingId ? "Edit Activity" : "Add Activity"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <SearchableEntitySelect
            label="Related Record"
            value={form.related_entity_id}
            onChange={(value, option) =>
              setForm((prev) => ({
                ...prev,
                related_entity_id: value,
                related_entity_name: option?.label || "",
              }))
            }
            options={relatedOptions}
            placeholder="Choose candidate, job, or client"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {formColumns.map((field) => (
              <div
                key={field.field_key}
                className={field.field_type === "textarea" ? "md:col-span-2" : ""}
              >
                <label className="mb-1 block text-sm">
                  {field.field_label}
                  {field.required ? <span className="ml-1 text-red-500">*</span> : null}
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
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? "Update Activity" : "Save Activity"}
            </Button>
          </div>
        </form>
      </RecordFormModal>
    </AppLayout>
  );
}