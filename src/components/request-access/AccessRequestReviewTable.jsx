export default function AccessRequestReviewTable() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Access Requests</h2>
      <p className="mt-1 text-sm text-slate-500">
        Review submitted access requests, requested modules, and approval decisions.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
        No access requests to review yet.
      </div>
    </div>
  );
}