import { useQuery } from "@tanstack/react-query";
import { loadJobs } from "@/features/ats/services/jobs.service";

export default function JobsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs"],
    queryFn: loadJobs,
  });

  if (isLoading) return <div className="p-6">Loading jobs...</div>;
  if (error) return <div className="p-6">Failed to load jobs.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      <div className="space-y-2">
        {data?.map((job) => (
          <div key={job.id} className="border rounded-lg p-4">
            <div className="font-medium">{job.title}</div>
            <div className="text-sm text-muted-foreground">{job.status || "Unknown status"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
