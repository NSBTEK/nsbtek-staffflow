import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getProfileOrThrow } from "@/lib/profile";

async function listProviders() {
  const { data, error } = await supabase
    .from("integration_providers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function listConnections(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);
  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", profile.organization_id);
  if (error) throw error;
  return data || [];
}

async function saveConnection(currentUser, providerKey, payload) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data: validation, error: functionError } = await supabase.functions.invoke("integration-proxy", {
    body: {
      providerKey,
      action: "validate_connection",
      credentials: payload.credentials,
      settings: payload.settings,
    },
  });

  if (functionError) throw functionError;
  if (!validation?.ok) throw new Error(validation?.error || "Connection failed");

  const { error } = await supabase.from("integration_connections").upsert(
    {
      organization_id: profile.organization_id,
      provider_key: providerKey,
      status: validation.status || "connected",
      credentials: validation.normalized?.credentials || {},
      settings: validation.normalized?.settings || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,provider_key" }
  );

  if (error) throw error;
  return true;
}

function ProviderCard({ provider, connection, onConnect }) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{provider.name}</h3>
          <p className="text-sm text-muted-foreground">{provider.category} · {provider.auth_type}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${connection?.status === "connected" ? "border-green-200 text-green-700" : "border-muted text-muted-foreground"}`}>
          {connection?.status || "disconnected"}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">API Key / Token</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder={`Enter ${provider.name} token`} />
        </div>
        <div>
          <label className="block text-sm mb-1">Base URL / Tenant</label>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="Optional base URL" />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => onConnect(provider.key, { credentials: { apiKey }, settings: { baseUrl } })} className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium">
          {connection?.status === "connected" ? "Update Connection" : "Connect"}
        </button>
      </div>
    </div>
  );
}

export default function Integrations() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: providers = [], isLoading, error } = useQuery({ queryKey: ["integration-providers"], queryFn: listProviders });
  const { data: connections = [] } = useQuery({
    queryKey: ["integration-connections", authUser?.id],
    queryFn: () => listConnections(authUser),
    enabled: !!authUser?.id,
  });

  const saveMutation = useMutation({
    mutationFn: ({ providerKey, payload }) => saveConnection(authUser, providerKey, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integration-connections", authUser?.id] }),
  });

  const categories = useMemo(() => ["all", ...new Set(providers.map((p) => p.category))], [providers]);
  const filteredProviders = filter === "all" ? providers : providers.filter((p) => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Provider-driven integrations catalog with organization-level connections.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border px-3 py-2">
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-6">Loading integrations...</div>
      ) : error ? (
        <div className="rounded-2xl border bg-card p-6 text-red-600">{error.message}</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => {
            const connection = connections.find((item) => item.provider_key === provider.key);
            return <ProviderCard key={provider.id} provider={provider} connection={connection} onConnect={(providerKey, payload) => saveMutation.mutate({ providerKey, payload })} />;
          })}
        </div>
      )}
    </div>
  );
}
