import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { loadCurrentUserProfile } from "@/lib/loadCurrentUserProfile";

export function useCurrentUser() {
  const { authUser } = useAuth();

  const query = useQuery({
    queryKey: ["current-user-profile", authUser?.id],
    queryFn: () => loadCurrentUserProfile(authUser),
    enabled: !!authUser?.id,
    retry: false,
    staleTime: 1000 * 30,
  });

  return {
    user: query.data || null,
    isLoading: query.isLoading,
    error: query.error || null,
    refetch: query.refetch,
  };
}