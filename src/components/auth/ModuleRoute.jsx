import React from "react";
import { Navigate } from "react-router-dom";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import LoadingState from "@/components/common/LoadingState";

export default function ModuleRoute({ moduleKey, children }) {
  const { allowed, loading, error } = useModuleAccess(moduleKey);

  if (loading) return <LoadingState />;

  if (error) {
    return <Navigate to="/forbidden" replace />;
  }

  if (!allowed) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}