import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function listInvoices(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createInvoice(payload, currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const cleanPayload = {
    invoice_number: payload.invoice_number,
    client_name: payload.client_name,
    amount: Number(payload.amount || 0),
    status: payload.status || "draft",
    due_date: payload.due_date || null,
    notes: payload.notes || null,
    organization_id: profile.organization_id,
    created_by: currentUser.id,
    updated_by: currentUser.id,
  };

  const { data, error } = await supabase
    .from("invoices")
    .insert(cleanPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInvoice(id, payload, currentUser) {
  const cleanPayload = {
    invoice_number: payload.invoice_number,
    client_name: payload.client_name,
    amount: Number(payload.amount || 0),
    status: payload.status || "draft",
    due_date: payload.due_date || null,
    notes: payload.notes || null,
    updated_by: currentUser.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("invoices")
    .update(cleanPayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInvoice(id) {
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}