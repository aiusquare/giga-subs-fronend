import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  badge_text: string | null;
  gradient: string | null;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  display_order: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Active promotions — for the home/dashboard carousel */
export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: () => api.get<Promotion[]>("/promotions"),
  });
}

/** All promotions (active + inactive) — for admin panel */
export function useAllPromotions() {
  return useQuery({
    queryKey: ["promotions-admin"],
    queryFn: () => api.get<Promotion[]>("/admin/promotions"),
  });
}
