import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { runPayrollSync } from "@/api/payroll";
import { listModuleRows } from "@/lib/supabaseCrud";

export default function Payroll() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading, error } = useQuery({
    queryKey: ["payroll-runs", authUser?.id],
    queryFn: () =>
      listModuleRows({
        table: "payroll_runs",
        module: "payroll",
        currentUser: authUser,
      }),
    enabled: !!authUser?.id,
  });

  const { data: syncJobs = [] } = useQuery({
    queryKey: ["payroll-sync-jobs", authUser?.id],
    queryFn: () =>
      listModuleRows({
        table: "payroll_sync_jobs",
        module: "payroll",
        currentUser: authUser,
      }),
    enabled: !!authUser?.id,
  });

  const syncMutation = useMutation({
    mutationFn: ({ runId, provider }) =>
      runPayrollSync({
        run_id: runId,
        provider,
        run_type: "manual",
      }),
    onSuccess: async () => {
      toast.success("Payroll sync requested");
      await queryClient.invalidateQueries({ queryKey: ["payroll-sync-jobs", authUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ["payroll-runs", authUser?.id] });
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to sync payroll");
    },
  });

  const latestSyncByRun = syncJobs.reduce((acc, row) => {
    if (!acc[row.payroll_run_id]) {
      acc[row.payroll_run_id] = row;
    }
    return acc;
  }, {});

  return (
    <AppLayout
      heroRight={
        <Button onClick={() => syncMutation.mutate({ runId: null, provider: "gusto" })}>
          Run Payroll Sync
        </Button>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading payroll...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">Failed to load payroll.</div>
        ) : runs.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No payroll runs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Run</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Pay Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latest Sync</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const latestSync = latestSyncByRun[run.id];

                  return (
                    <tr key={run.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{run.name || "-"}</td>
                      <td className="px-4 py-3">
                        {run.period_start || "-"} → {run.period_end || "-"}
                      </td>
                      <td className="px-4 py-3">{run.pay_date || "-"}</td>
                      <td className="px-4 py-3">{run.status || "-"}</td>
                      <td className="px-4 py-3">
                        {latestSync
                          ? `${latestSync.provider}: ${latestSync.status}`
                          : "Not synced"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => syncMutation.mutate({ runId: run.id, provider: "gusto" })}
                            className="rounded-lg border px-3 py-1.5"
                          >
                            Sync to Gusto
                          </button>
                          <button
                            onClick={() => syncMutation.mutate({ runId: run.id, provider: "adp" })}
                            className="rounded-lg border px-3 py-1.5"
                          >
                            Sync to ADP
                          </button>
                          <button
                            onClick={() => syncMutation.mutate({ runId: run.id, provider: "deel" })}
                            className="rounded-lg border px-3 py-1.5"
                          >
                            Sync to Deel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}