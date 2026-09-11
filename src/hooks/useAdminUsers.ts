import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  wallet_balance: number;
  created_at: string;
  role: "admin" | "moderator" | "user" | null;
  permissions: string[];
}

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<UserWithRole[]>("/admin/users"),
  });

  const assignRole = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "moderator" | "user";
    }) => api.post(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role assigned successfully");
    },
    onError: () => toast.error("Failed to assign role"),
  });

  const removeRole = useMutation({
    mutationFn: (userId: string) => api.del(`/admin/users/${userId}/role`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role removed successfully");
    },
    onError: () => toast.error("Failed to remove role"),
  });

  const updatePermissions = useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: string[];
    }) => api.put(`/admin/users/${userId}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Page access updated successfully");
    },
    onError: () => toast.error("Failed to update page access"),
  });

  const fundWallet = useMutation({
    mutationFn: ({ userId, amount }: { userId: string; amount: number }) =>
      api.post(`/admin/users/${userId}/wallet/fund`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Wallet funded successfully");
    },
    onError: () => toast.error("Failed to fund wallet"),
  });

  const deductWallet = useMutation({
    mutationFn: ({ userId, amount }: { userId: string; amount: number }) =>
      api.post(`/admin/users/${userId}/wallet/deduct`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Wallet deducted successfully");
    },
    onError: () => toast.error("Failed to deduct from wallet"),
  });

  const resetWallet = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/admin/users/${userId}/wallet/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Wallet reset to ₦0");
    },
    onError: () => toast.error("Failed to reset wallet"),
  });

  return {
    users: users || [],
    isLoading,
    assignRole,
    removeRole,
    updatePermissions,
    fundWallet,
    deductWallet,
    resetWallet,
  };
}

export interface AdminUserDetail {
  profile: {
    user_id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    wallet_balance: number;
    role: string | null;
    has_pin: boolean;
    created_at: string;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string | null;
    reference: string | null;
    created_at: string;
  }>;
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${userId}`),
    enabled: !!userId,
  });
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.post(`/admin/users/${userId}/reset-password`, { password }),
    onSuccess: () => toast.success("Password reset successfully"),
    onError: () => toast.error("Failed to reset password"),
  });
}

export function useAdminResetPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post(`/admin/users/${userId}/reset-pin`, {}),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-user-detail", userId],
      });
      toast.success("PIN cleared — user must set a new PIN on next login");
    },
    onError: () => toast.error("Failed to reset PIN"),
  });
}
