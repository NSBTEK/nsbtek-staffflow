import { useQuery } from "@tanstack/react-query";
import { listPlacements } from "@/api/placements";

export default function PlacementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["placements"],
    queryFn: listPlacements,
  });

  if (isLoading) return <div className="p-6">Loading placements...</div>;
  if (error) return <div className="p-6">Failed to load placements.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Placements</h1>
      {data?.map((placement) => (
        <div key={placement.id} className="border rounded-lg p-4">
          <div className="font-medium">{placement.title || placement.id}</div>
          <div className="text-sm text-muted-foreground">{placement.status || "Unknown status"}</div>
        </div>
      ))}
    </div>
  );
}
