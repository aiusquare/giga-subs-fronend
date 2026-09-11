import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_global: boolean;
  is_sticky: boolean;
  created_at: string;
  created_by: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api.get<Notification[]>("/notifications?limit=50"),
    enabled: !!user,
    // Poll every 30 s as a lightweight realtime replacement
    refetchInterval: 30_000,
  });

  const unreadCount = query.data?.filter((n) => !n.is_read).length ?? 0;

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) =>
      api.post(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.post("/notifications/read/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return { ...query, unreadCount, markAsRead, markAllAsRead };
}

// Admin hook
export function useAdminNotifications() {
  const queryClient = useQueryClient();

  const allNotifications = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get<Notification[]>("/admin/notifications?limit=100"),
  });

  const sendNotification = useMutation({
    mutationFn: (payload: {
      title: string;
      message: string;
      type: string;
      is_global: boolean;
      is_sticky?: boolean;
      user_id?: string;
    }) => api.post("/admin/notifications", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => api.del(`/admin/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const updateNotification = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      title: string;
      message: string;
      type: string;
      is_sticky?: boolean;
    }) => api.put(`/admin/notifications/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  return {
    ...allNotifications,
    sendNotification,
    deleteNotification,
    updateNotification,
  };
}
