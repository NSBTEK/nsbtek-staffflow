import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { listExternalJobs } from "@/api/integrations";

export default function ExternalJobs() {
  const { authUser } = useAuth();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["external-jobs", authUser?.id],
    queryFn: () => listExternalJobs(authUser),
    enabled: !!authUser?.id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading external jobs…</div>;
  if (error) return <div className="text-sm text-red-600">{error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-white shadow-lg sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">External Jobs</h1>
        <p className="mt-2 text-sm text-white/70">
          Imported or externally posted jobs connected through providers.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5">
          {data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No external jobs found.
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">{item.title || "Untitled Job"}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {item.provider} • {item.status} • {item.location_text || "No location"}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    External Job ID: {item.external_job_id}
                  </div>
                  {item.internal_job_id ? (
                    <div className="mt-2 text-xs text-emerald-700">
                      Internal Job ID: {item.internal_job_id}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}