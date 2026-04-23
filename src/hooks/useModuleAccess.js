import { useProfile } from "@/hooks/useProfile";
import { canView } from "@/lib/permissions";

export function useModuleAccess(moduleKey) {
  const { profile, loading, error } = useProfile();

  return {
    profile,
    loading,
    error,
    allowed: !!profile && canView(profile, moduleKey),
  };
}