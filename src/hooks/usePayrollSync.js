import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { getProfileOrThrow } from "@/lib/profile";
import { toast } from "sonner";

async function listPayrollSyncJobs(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("payroll_sync_jobs")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function listIntegrationConnections(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function queuePayrollSync({ currentUser, payrollRunId, provider, companyId, employees }) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data: job, error: insertError } = await supabase
    .from("payroll_sync_jobs")
    .insert({
      organization_id: profile.organization_id,
      payroll_run_id: payrollRunId,
      provider,
      direction: "push",
      status: "queued",
      request_payload: {
        payrollRunId,
        companyId,
        employees,
      },
    })
    .select()
    .single();

  if (insertError) throw insertError;

  const { data, error } = await supabase.functions.invoke("payroll-sync", {
    body: {
      provider,
      payrollRunId,
      companyId,
      employees,
    },
  });

  if (error) {
    await supabase
      .from("payroll_sync_jobs")
      .update({
        status: "failed",
        error_message: error.message || "Payroll sync failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    throw error;
  }

  await supabase
    .from("payroll_sync_jobs")
    .update({
      status: data?.status || "queued",
      response_payload: data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  return data;
}

export function usePayrollSyncJobs() {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ["payroll-sync-jobs", authUser?.id],
    queryFn: () => listPayrollSyncJobs(authUser),
    enabled: !!authUser?.id,
  });
}

export function useIntegrationConnections() {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ["integration-connections", authUser?.id],
    queryFn: () => listIntegrationConnections(authUser),
    enabled: !!authUser?.id,
  });
}

export function useQueuePayrollSync() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payrollRunId, provider, companyId, employees }) =>
      queuePayrollSync({
        currentUser: authUser,
        payrollRunId,
        provider,
        companyId,
        employees,
      }),
    onSuccess: async () => {
      toast.success("Payroll sync queued");
      await queryClient.invalidateQueries({ queryKey: ["payroll-sync-jobs", authUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ["payroll-runs", authUser?.id] });
    },
    onError: (error) => toast.error(error.message || "Payroll sync failed"),
  });
}