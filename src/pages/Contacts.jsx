import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";
import RecordFormModal from "@/components/shared/RecordFormModal";
import { useModuleColumns } from "@/hooks/useModuleColumns";
import DynamicField from "@/components/shared/DynamicField";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

async function listContacts(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("contacts")
    .select(`
      *,
      client:clients(id, name)
    `)
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function listClientOptions(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", profile.organization_id)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function createContactRecord(payload, currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const allowedKeys = [
    "client_id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "title",
    "status",
    "notes",
  ];

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      ...cleanPayload,
      client_id: cleanPayload.client_id || null,
      organization_id: profile.organization_id,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select(`
      *,
      client:clients(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
}

async function updateContactRecord(id, payload, currentUser) {
  const allowedKeys = [
    "client_id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "title",
    "status",
    "notes",
  ];

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );

  const { data, error } = await supabase
    .from("contacts")
    .update({
      ...cleanPayload,
      client_id: cleanPayload.client_id || null,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      client:clients(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
}

async function deleteContactRecord(id) {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export default function Contacts() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const { tableColumns, formColumns } = useModuleColumns("contacts");

  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ["contacts", authUser?.id],
    queryFn: () => listContacts(authUser),
    enabled: !!authUser?.id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["client-options", authUser?.id],
    queryFn: () => listClientOptions(authUser),
    enabled: !!authUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createContactRecord(payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", authUser?.id] });
      resetForm();
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateContactRecord(id, payload, authUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", authUser?.id] });
      resetForm();
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContactRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", authUser?.id] });
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

  const openEditModal = (contact) => {
    setEditingId(contact.id);
    setForm({
      ...contact,
      client_id: contact.client_id || "",
    });
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

  const renderCellValue = (contact, fieldKey) => {
    if (fieldKey === "client_id") {
      return contact.client?.name || "-";
    }

    const value = contact[fieldKey];
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  };

  const renderField = (field) => {
    if (field.field_key === "client_id") {
      return (
        <select
          className="border rounded-lg px-3 py-2 w-full"
          value={form.client_id ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, client_id: e.target.value }))
          }
        >
          <option value="">Select Client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      );
    }

    return (
      <DynamicField
        field={field}
        value={form[field.field_key]}
        onChange={(key, value) =>
          setForm((prev) => ({ ...prev, [key]: value }))
        }
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage shared contact records for your organization.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium"
        >
          + Add Contact
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-6">Loading contacts...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-muted-foreground">No contacts yet.</div>
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
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  {tableColumns.map((col) => (
                    <TableCell key={col.field_key} className="px-4 py-3">
                      {renderCellValue(contact, col.field_key)}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(contact)}
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
                            deleteMutation.mutate(contact.id);
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
        title={editingId ? "Edit Contact" : "Add Contact"}
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
              {renderField(field)}
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
              {editingId ? "Update Contact" : "Save Contact"}
            </button>
          </div>
        </form>
      </RecordFormModal>
    </div>
  );
}
