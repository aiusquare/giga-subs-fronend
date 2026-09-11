import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export function useServiceStatus(serviceType: string) {
  return useQuery({
    queryKey: ["service-status", serviceType],
    queryFn: async () => {
      const data = await api.get<{ is_active: boolean }>(
        `/services?type=${encodeURIComponent(serviceType)}`
      );
      return data.is_active ?? true;
    },
    staleTime: 60_000,
  });
}
