import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { listExternalApplicants } from "@/api/integrations";

export default function ExternalApplicants() {
  const { authUser } = useAuth();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["external-applicants", authUser?.id],
    queryFn: () => listExternalApplicants(authUser),
    enabled: !!authUser?.id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading external applicants…</div>;
  if (error) return <div className="text-sm text-red-600">{error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-white shadow-lg sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">External Applicants</h1>
        <p className="mt-2 text-sm text-white/70">
          Raw applicants received from job boards and external providers.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5">
          {data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No external applicants found.
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">
                    {[item.first_name, item.last_name].filter(Boolean).join(" ") || item.email || "Unnamed Applicant"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {item.provider} • {item.email || "No email"} • {item.status}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    External Applicant ID: {item.external_applicant_id}
                  </div>
                  {item.synced_candidate_id ? (
                    <div className="mt-2 text-xs text-emerald-700">
                      Synced Candidate ID: {item.synced_candidate_id}
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