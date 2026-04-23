import AppLayout from "@/components/layout/AppLayout";
import AccessRequestForm from "@/components/request-access/AccessRequestForm";

export default function RequestAccess() {
  return (
    <AppLayout>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <AccessRequestForm />
      </div>
    </AppLayout>
  );
}