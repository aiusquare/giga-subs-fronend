import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";
import { useProfile } from "./useProfile";

export interface ApiSubscription {
  id: string;
  user_id: string;
  api_key: string;
  is_active: boolean;
  tier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiPricingTier {
  id: string;
  tier_name: string;
  min_balance: number;
  discount_percent: number;
  display_order: number | null;
}

export function useApiSubscription() {
  const { profile } = useProfile();
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null);
  const [tiers, setTiers] = useState<ApiPricingTier[]>([]);
  const [currentTier, setCurrentTier] = useState<ApiPricingTier | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const data = await api.get("/api-subscription");
      setSubscription(data.subscription ?? null);
      setTiers(data.tiers ?? []);
    } catch {
      // not yet subscribed or unauthenticated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // Determine current tier based on wallet balance
  useEffect(() => {
    if (!profile || tiers.length === 0) { setCurrentTier(null); return; }
    const balance = profile.wallet_balance ?? 0;
    const matched = tiers
      .filter((t) => balance >= t.min_balance)
      .sort((a, b) => b.min_balance - a.min_balance)[0];
    setCurrentTier(matched ?? null);
  }, [profile, tiers]);

  const subscribe = async () => {
    const data = await api.post("/api-subscription", {});
    setSubscription(data.subscription);
    return data.subscription;
  };

  const regenerateKey = async () => {
    const data = await api.post("/api-subscription/key", {});
    await fetchSubscription();
    return data.api_key as string;
  };

  const toggleActive = async (active: boolean) => {
    await api.put("/api-subscription", { is_active: active });
    await fetchSubscription();
  };

  return {
    subscription,
    tiers,
    currentTier,
    loading,
    subscribe,
    regenerateKey,
    toggleActive,
    refetch: fetchSubscription,
  };
}
