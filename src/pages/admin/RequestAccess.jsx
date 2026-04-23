import AppLayout from "@/components/layout/AppLayout";
import AccessRequestReviewTable from "@/components/request-access/AccessRequestReviewTable";

export default function AdminRequestAccess() {
  return (
    <AppLayout>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <AccessRequestReviewTable />
      </div>
    </AppLayout>
  );
}