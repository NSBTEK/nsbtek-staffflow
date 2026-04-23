import { useQuery } from "@tanstack/react-query";
import { loadClients } from "@/features/crm/services/clients.service";

export default function ClientsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: loadClients,
  });

  if (isLoading) return <div className="p-6">Loading clients...</div>;
  if (error) return <div className="p-6">Failed to load clients.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <div className="space-y-2">
        {data?.map((client) => (
          <div key={client.id} className="border rounded-lg p-4">
            <div className="font-medium">{client.name}</div>
            <div className="text-sm text-muted-foreground">{client.email || "No email"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
