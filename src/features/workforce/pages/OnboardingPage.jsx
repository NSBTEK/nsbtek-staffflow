import { useQuery } from "@tanstack/react-query";
import { listOnboardingItems } from "@/api/onboarding";

export default function OnboardingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["onboarding"],
    queryFn: listOnboardingItems,
  });

  if (isLoading) return <div className="p-6">Loading onboarding...</div>;
  if (error) return <div className="p-6">Failed to load onboarding.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      {data?.map((item) => (
        <div key={item.id} className="border rounded-lg p-4">
          <div className="font-medium">{item.title || item.id}</div>
          <div className="text-sm text-muted-foreground">{item.status || "Pending"}</div>
        </div>
      ))}
    </div>
  );
}
