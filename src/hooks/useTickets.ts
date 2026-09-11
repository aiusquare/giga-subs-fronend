import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  is_staff: boolean;
  body: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  user_id?: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface TicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
}

// ── User hooks ──────────────────────────────────────────────────────────────

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: () => api.get<{ tickets: Ticket[]; total: number }>("/tickets"),
    refetchInterval: 20_000,
  });
}

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api.get<TicketDetail>(`/tickets/${id}`),
    enabled: !!id,
    refetchInterval: 4_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subject: string;
      message: string;
      category: string;
      priority: string;
    }) => api.post<{ ticket: Ticket }>("/tickets", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useReplyTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      api.post(`/tickets/${ticketId}/reply`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      api.post(`/tickets/${ticketId}/close`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

// ── Admin hooks ─────────────────────────────────────────────────────────────

export function useAdminTickets(status?: string) {
  return useQuery({
    queryKey: ["admin-tickets", status],
    queryFn: () =>
      api.get<{ tickets: Ticket[]; total: number }>(
        `/admin/tickets${status ? `?status=${status}` : ""}`,
      ),
    refetchInterval: 20_000,
  });
}

export function useAdminTicket(id: string | null) {
  return useQuery({
    queryKey: ["admin-ticket", id],
    queryFn: () => api.get<TicketDetail>(`/admin/tickets/${id}`),
    enabled: !!id,
    refetchInterval: 4_000,
  });
}

export function useAdminReplyTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      api.post(`/admin/tickets/${ticketId}/reply`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
  });
}

export function useAdminUpdateTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      api.post(`/admin/tickets/${ticketId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
  });
}
