import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  recipient: string | null;
  balance_before: number | null;
  balance_after: number | null;
  amount: number;
  status: string;
  reference: string | null;
  provider_ref: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactions(filter?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (filter && filter !== "all") params.set("type", filter);
      return api.get<Transaction[]>(`/transactions?${params.toString()}`);
    },
    enabled: !!user,
  });
}
