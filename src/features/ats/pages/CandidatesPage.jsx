import { useQuery } from "@tanstack/react-query";
import { loadCandidates } from "@/features/ats/services/candidates.service";

export default function CandidatesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["candidates"],
    queryFn: loadCandidates,
  });

  if (isLoading) return <div className="p-6">Loading candidates...</div>;
  if (error) return <div className="p-6">Failed to load candidates.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Candidates</h1>
      {data?.map((candidate) => (
        <div key={candidate.id} className="border rounded-lg p-4">
          <div className="font-medium">{candidate.first_name} {candidate.last_name}</div>
          <div className="text-sm text-muted-foreground">{candidate.email || "No email"}</div>
        </div>
      ))}
    </div>
  );
}
