import { useAuth } from "@/contexts/AuthContext";

/**
 * useAdminRole — reads the role already present in the AuthContext.
 * No extra API call is needed because login/me responses include the role.
 */
export function useAdminRole() {
  const { user, loading } = useAuth();

  return {
    isAdmin: user?.role === "admin",
    isLoading: loading,
  };
}
