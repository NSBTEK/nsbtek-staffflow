import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  const location = useLocation();
  const module = location.state?.module;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-300">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-white/70">
          You do not have permission to access {module ? `the ${module} module` : "this page"}.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Go to dashboard
          </Link>
          <Link
            to="/request-access"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5"
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
}
