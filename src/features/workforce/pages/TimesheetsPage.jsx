import { useQuery } from "@tanstack/react-query";
import { listTimesheets } from "@/api/timesheets";

export default function TimesheetsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["timesheets"],
    queryFn: listTimesheets,
  });

  if (isLoading) return <div className="p-6">Loading timesheets...</div>;
  if (error) return <div className="p-6">Failed to load timesheets.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Timesheets</h1>
      {data?.map((timesheet) => (
        <div key={timesheet.id} className="border rounded-lg p-4">
          <div className="font-medium">Week: {timesheet.week_start}</div>
          <div className="text-sm text-muted-foreground">Hours: {timesheet.total_hours}</div>
        </div>
      ))}
    </div>
  );
}
