import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/api/auditLogs";

export default function AuditLogsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: listAuditLogs,
  });

  if (isLoading) return <div className="p-6">Loading audit logs...</div>;
  if (error) return <div className="p-6">Failed to load audit logs.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      {data?.map((log) => (
        <div key={log.id} className="border rounded-lg p-4">
          <div className="font-medium">{log.action}</div>
          <div className="text-sm text-muted-foreground">{log.module} • {log.entity_type}</div>
        </div>
      ))}
    </div>
  );
}
