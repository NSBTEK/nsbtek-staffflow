import { useQuery } from "@tanstack/react-query";
import { listContracts } from "@/api/contracts";

export default function ContractsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contracts"],
    queryFn: listContracts,
  });

  if (isLoading) return <div className="p-6">Loading contracts...</div>;
  if (error) return <div className="p-6">Failed to load contracts.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Contracts</h1>
      {data?.map((contract) => (
        <div key={contract.id} className="border rounded-lg p-4">
          <div className="font-medium">{contract.title || contract.id}</div>
          <div className="text-sm text-muted-foreground">{contract.status || "No status"}</div>
        </div>
      ))}
    </div>
  );
}
