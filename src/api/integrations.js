import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

export async function listIntegrationProviders() {
  const { data, error } = await supabase
    .from("integration_providers")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listIntegrationConnections(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveIntegrationConnection(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("integration_connections")
    .upsert(
      {
        organization_id: profile.organization_id,
        provider: payload.provider,
        external_company_id: payload.external_company_id || null,
        status: payload.status || "pending",
        metadata: payload.metadata || {},
        created_by: currentUser.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,provider" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveIntegrationCredential(currentUser, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data: connection, error: connectionError } = await supabase
    .from("integration_connections")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("provider", payload.provider)
    .single();

  if (connectionError) throw connectionError;

  const { data, error } = await supabase
    .from("integration_credentials")
    .upsert(
      {
        connection_id: connection.id,
        credential_type: payload.credential_type || "oauth",
        access_token: payload.access_token || null,
        refresh_token: payload.refresh_token || null,
        token_expires_at: payload.token_expires_at || null,
        scopes: payload.scopes || [],
        metadata: payload.metadata || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "connection_id,credential_type" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listExternalApplicants(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("external_applicants")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listExternalJobs(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("external_jobs")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function validateIntegration(currentUser, payload) {
  const { data, error } = await supabase.functions.invoke("integration-proxy", {
    body: {
      action: "validate_connection",
      ...payload,
    },
  });

  if (error) throw error;
  return data;
}

export async function previewIntegrationSync(currentUser, payload) {
  const { data, error } = await supabase.functions.invoke("integration-proxy", {
    body: {
      action: "sync_preview",
      ...payload,
    },
  });

  if (error) throw error;
  return data;
}

export function useIntegrationConnections() {
  throw new Error("useIntegrationConnections is not a plain API function. Use a hook implementation instead.");
}