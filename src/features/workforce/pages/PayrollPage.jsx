import { useMutation } from "@tanstack/react-query";
import { syncPayroll } from "@/features/workforce/services/payroll.service";

export default function PayrollPage() {
  const mutation = useMutation({
    mutationFn: syncPayroll,
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payroll</h1>
      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={() => mutation.mutate({ run_type: "manual" })}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Running..." : "Run Payroll Sync"}
      </button>
      {mutation.data && <div className="text-sm">Status: {mutation.data.status}</div>}
      {mutation.error && <div className="text-sm text-red-600">Failed to run payroll sync.</div>}
    </div>
  );
}
