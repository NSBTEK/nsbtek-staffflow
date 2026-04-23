import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { loadCurrentUserProfile } from "@/lib/loadCurrentUserProfile";

export function useProfile() {
  const { authUser, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["profile", authUser?.id],
    enabled: !!authUser?.id && !authLoading,
    queryFn: () => loadCurrentUserProfile(authUser),
    retry: false,
    staleTime: 1000 * 30,
  });

  return {
    profile: query.data ?? null,
    profileLoading: authLoading || query.isLoading,
    loading: authLoading || query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}