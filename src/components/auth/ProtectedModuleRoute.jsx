import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { canView } from "@/lib/permissions";

export default function ProtectedModuleRoute({ moduleKey, redirectTo = "/dashboard" }) {
  const { authUser, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Loading module...</div>;
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || !canView(profile, moduleKey)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
