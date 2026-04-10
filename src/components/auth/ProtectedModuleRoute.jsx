import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { canView } from "@/lib/permissions";

export default function ProtectedModuleRoute({ module }) {
  const { authUser, loading } = useAuth();
  const { user, isLoading, error } = useCurrentUser();
  const location = useLocation();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <div className="text-sm text-white/70">Loading access…</div>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white px-6">
        <div className="max-w-xl w-full rounded-2xl border border-red-500/20 bg-white/5 p-6">
          <h1 className="text-xl font-semibold text-red-300">Profile load failed</h1>
          <p className="mt-3 text-sm text-white/70">
            The app could not load your profile from the <code>profiles</code> table.
            This usually means your profile row is missing, blocked by RLS, or missing
            <code> organization_id</code>.
          </p>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-red-200">
            {String(error?.message || error)}
          </pre>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white px-6">
        <div className="max-w-xl w-full rounded-2xl border border-yellow-500/20 bg-white/5 p-6">
          <h1 className="text-xl font-semibold text-yellow-300">Profile not found</h1>
          <p className="mt-3 text-sm text-white/70">
            You are logged in, but no matching application profile was found in
            <code> public.profiles</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!canView(user, module)) {
    return <Navigate to="/unauthorized" replace state={{ from: location, module }} />;
  }

  return <Outlet />;
}