import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PlugZap,
  Database,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import {
  listIntegrationProviders,
  listIntegrationConnections,
  saveIntegrationConnection,
  saveIntegrationCredential,
  validateIntegration,
  previewIntegrationSync,
} from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORY_ORDER = ["job_boards", "hris", "payroll", "crm", "background_checks", "other"];

const CATEGORY_LABELS = {
  job_boards: "Job Boards",
  hris: "HRIS",
  payroll: "Payroll",
  crm: "CRM",
  background_checks: "Background Checks",
  other: "Other",
};

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "Other";
}

function providerIcon(category) {
  switch (category) {
    case "job_boards":
      return Briefcase;
    case "payroll":
      return Database;
    case "hris":
      return Users;
    case "crm":
      return PlugZap;
    default:
      return Database;
  }
}

function statusBadge(status) {
  const normalized = String(status || "unknown").toLowerCase();

  if (normalized === "connected" || normalized === "active" || normalized === "validated") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Connected
      </div>
    );
  }

  if (normalized === "pending") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <AlertCircle className="h-3.5 w-3.5" />
        Pending
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {status || "Not connected"}
    </div>
  );
}

function SectionCard({ title, subtitle, children, right = null }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function IntegrationConnectionCard({
  provider,
  connection,
  onConnect,
  onValidate,
  onPreview,
  pendingProvider,
}) {
  const Icon = providerIcon(provider.category);
  const busy = pendingProvider === provider.provider_key;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {provider.name || provider.provider_key}
              </h3>
              {statusBadge(connection?.status)}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {provider.description || "External provider connection"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <div className="rounded-full bg-slate-100 px-2.5 py-1">
                {categoryLabel(provider.category)}
              </div>
              {provider.supports_webhooks ? (
                <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
                  Webhooks
                </div>
              ) : null}
              {provider.supports_job_sync ? (
                <div className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                  Job Sync
                </div>
              ) : null}
              {provider.supports_applicant_sync ? (
                <div className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                  Applicant Sync
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-[220px] text-right text-xs text-slate-500">
          {connection?.external_company_id ? (
            <div>Company ID: {connection.external_company_id}</div>
          ) : (
            <div>No company linked yet</div>
          )}
          {connection?.updated_at ? (
            <div className="mt-1">
              Updated: {new Date(connection.updated_at).toLocaleString()}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          onClick={() => onConnect(provider)}
          disabled={busy}
          className="rounded-xl"
        >
          <Link2 className="mr-2 h-4 w-4" />
          {connection ? "Update Connection" : "Connect"}
        </Button>

        <Button
          variant="outline"
          onClick={() => onValidate(provider)}
          disabled={busy}
          className="rounded-xl"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Validate
        </Button>

        <Button
          variant="outline"
          onClick={() => onPreview(provider)}
          disabled={busy}
          className="rounded-xl"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Preview
        </Button>
      </div>
    </div>
  );
}

export default function Integrations() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pendingProvider, setPendingProvider] = useState(null);

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["integration-providers"],
    queryFn: () => listIntegrationProviders(),
    enabled: !!authUser?.id,
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["integration-connections", authUser?.id],
    queryFn: () => listIntegrationConnections(authUser),
    enabled: !!authUser?.id,
  });

  const connectionMap = useMemo(() => {
    return Object.fromEntries(
      connections.map((connection) => [connection.provider, connection])
    );
  }, [connections]);

  const filteredProviders = useMemo(() => {
    const q = search.trim().toLowerCase();

    let next = providers.filter((provider) => {
      if (selectedCategory !== "all" && provider.category !== selectedCategory) {
        return false;
      }

      if (!q) return true;

      return [provider.name, provider.provider_key, provider.description, provider.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });

    next = next.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.category);
      const bIndex = CATEGORY_ORDER.indexOf(b.category);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return next;
  }, [providers, search, selectedCategory]);

  const groupedProviders = useMemo(() => {
    const groups = {};
    filteredProviders.forEach((provider) => {
      const category = provider.category || "other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(provider);
    });
    return groups;
  }, [filteredProviders]);

  const saveConnectionMutation = useMutation({
    mutationFn: async (provider) => {
      setPendingProvider(provider.provider_key);

      const providerKey = provider.provider_key || provider.provider;
      const connection = await saveIntegrationConnection(authUser, {
        provider: providerKey,
        status: "pending",
        metadata: {
          provider_name: provider.name || providerKey,
          category: provider.category || "other",
          supports_job_sync: !!provider.supports_job_sync,
          supports_applicant_sync: !!provider.supports_applicant_sync,
          supports_webhooks: !!provider.supports_webhooks,
        },
      });

      await saveIntegrationCredential(authUser, {
        provider: providerKey,
        credential_type: "oauth",
        access_token: null,
        refresh_token: null,
        scopes: provider.default_scopes || [],
        metadata: {
          note: "Connection placeholder created from admin UI",
        },
      });

      return connection;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["integration-connections", authUser?.id],
      });
      toast.success("Integration connection saved");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to save connection");
    },
    onSettled: () => {
      setPendingProvider(null);
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (provider) => {
      setPendingProvider(provider.provider_key);

      return validateIntegration(authUser, {
        provider: provider.provider_key || provider.provider,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["integration-connections", authUser?.id],
      });
      toast.success("Validation completed");
    },
    onError: (err) => {
      toast.error(err?.message || "Validation failed");
    },
    onSettled: () => {
      setPendingProvider(null);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (provider) => {
      setPendingProvider(provider.provider_key);

      return previewIntegrationSync(authUser, {
        provider: provider.provider_key || provider.provider,
      });
    },
    onSuccess: (data) => {
      toast.success(
        data?.message || "Sync preview completed"
      );
    },
    onError: (err) => {
      toast.error(err?.message || "Sync preview failed");
    },
    onSettled: () => {
      setPendingProvider(null);
    },
  });

  const totalConnected = connections.filter((c) =>
    ["connected", "active", "validated"].includes(String(c.status || "").toLowerCase())
  ).length;

  const totalPending = connections.filter((c) =>
    String(c.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <AppLayout
      heroRight={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["integration-connections", authUser?.id],
              })
            }
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <SectionCard
          title="Integration Overview"
          subtitle="Manage external providers, connection state, sync readiness, and webhook-based ingestion."
          right={<PlugZap className="h-5 w-5 text-slate-400" />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Providers</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {providers.length}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Connected</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {totalConnected}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Pending</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {totalPending}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            This screen is designed to be the control center for job boards, HRIS, payroll, and webhook-driven ingestion into your consolidated ATS/CRM workflow.
          </div>
        </SectionCard>

        <SectionCard
          title="Provider Catalog"
          subtitle="Search providers and connect external systems."
          right={<Database className="h-5 w-5 text-slate-400" />}
        >
          <div className="mb-5 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job boards, HRIS, payroll, CRM..."
                className="pl-9"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">All categories</option>
              {CATEGORY_ORDER.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          {providersLoading || connectionsLoading ? (
            <div className="text-sm text-slate-500">Loading integrations...</div>
          ) : filteredProviders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No providers match your filters.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedProviders).map(([category, items]) => (
                <div key={category}>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {categoryLabel(category)}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {items.map((provider, index) => {
  const stableKey =
    provider.id ||
    provider.provider_key ||
    provider.provider ||
    `${provider.name || "provider"}-${provider.category || "other"}-${index}`;

  return (
    <IntegrationConnectionCard
      key={stableKey}
      provider={provider}
      connection={
        connectionMap[provider.provider_key] ||
        connectionMap[provider.provider] ||
        null
      }
      pendingProvider={pendingProvider}
      onConnect={(item) => saveConnectionMutation.mutate(item)}
      onValidate={(item) => validateMutation.mutate(item)}
      onPreview={(item) => previewMutation.mutate(item)}
    />
  );
})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppLayout>
  );
}