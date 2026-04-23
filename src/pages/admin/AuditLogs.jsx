import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { getProfileOrThrow } from "@/lib/profile";

async function listAuditLogs(currentUser) {
  const profile = await getProfileOrThrow(currentUser.id);

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data || [];
}

export default function AuditLogs() {
  const { authUser } = useAuth();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["audit-logs", authUser?.id],
    queryFn: () => listAuditLogs(authUser),
    enabled: !!authUser?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track record changes, system actions, and admin operations.</p>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6">Loading audit logs...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error.message}</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-muted-foreground">No audit records found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Module</th>
                  <th className="text-left px-4 py-3">Table</th>
                  <th className="text-left px-4 py-3">Record</th>
                  <th className="text-left px-4 py-3">Actor</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{row.action}</td>
                    <td className="px-4 py-3">{row.module_key}</td>
                    <td className="px-4 py-3">{row.table_name}</td>
                    <td className="px-4 py-3">{row.record_id || "-"}</td>
                    <td className="px-4 py-3">{row.actor_email || row.actor_user_id || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}