import { useQuery } from "@tanstack/react-query";
import { listSubmissions } from "@/api/submissions";

export default function SubmissionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions"],
    queryFn: listSubmissions,
  });

  if (isLoading) return <div className="p-6">Loading submissions...</div>;
  if (error) return <div className="p-6">Failed to load submissions.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Submissions</h1>
      {data?.map((submission) => (
        <div key={submission.id} className="border rounded-lg p-4">
          <div className="font-medium">{submission.candidate?.first_name} {submission.candidate?.last_name}</div>
          <div className="text-sm text-muted-foreground">{submission.job?.title || "No job"}</div>
        </div>
      ))}
    </div>
  );
}
