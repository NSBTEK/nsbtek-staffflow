import { useAuth } from "./AuthContext";

export function useCurrentUser() {
  const { user } = useAuth();
  return { user };
}