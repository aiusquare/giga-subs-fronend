import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  has_pin: boolean;
  has_virtual_account: boolean;
  virtual_account_number: string | null;
  virtual_account_bank: string | null;
  virtual_account_name: string | null;
  wallet_balance: number;
  referral_code?: string | null;
  enabled_payment_gateways: Array<"topupmate" | "monnify">;
  virtual_accounts: VirtualAccount[];
  created_at?: string;
  updated_at?: string;
}

export interface VirtualAccount {
  id: string;
  gateway: "topupmate" | "monnify";
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string | null;
  is_primary: boolean;
}

export interface BvnVerificationResult {
  bvn: string;
  firstname: string | null;
  lastname: string | null;
  birthdate: string | null;
  phone: string | null;
  match_result: string | null;
  photo?: string | null;
  charged_amount?: number;
  new_balance?: number;
}

export interface NinVerificationResult {
  nin: string;
  firstname: string | null;
  lastname: string | null;
  middlename: string | null;
  phone: string | null;
  gender: string | null;
  birthdate: string | null;
  photo: string | null;
  residence: {
    address1: string | null;
    town: string | null;
    lga: string | null;
    state: string | null;
  };
}

export type NinSlipType = "regular" | "improved" | "premium";

export interface NinSlipDownloadResult {
  nin: string;
  slip_type: NinSlipType;
  filename: string;
  content_type: string;
  bytes: number;
  pdf_base64: string;
  auto_verified?: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get<Profile>("/profile");
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (
    updates: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>,
  ) => {
    const data = await api.put<Profile>("/profile", updates);
    setProfile(data);
    return data;
  };

  const updatePin = async (newPin: string) => {
    await api.post("/profile/pin", { pin: newPin });
    setProfile((prev) => (prev ? { ...prev, has_pin: true } : prev));
  };

  const verifyPin = async (inputPin: string): Promise<boolean> => {
    try {
      const data = await api.post<{ valid: boolean }>("/profile/pin/verify", {
        pin: inputPin,
      });
      return data.valid;
    } catch {
      return false;
    }
  };

  const hasPin = (): boolean => {
    return !!profile?.has_pin;
  };

  const generateVirtualAccount = async (
    bvn: string,
    gateway: "topupmate" | "monnify" = "topupmate",
  ): Promise<Profile> => {
    const data = await api.post<Profile>("/profile/virtual-account", {
      bvn,
      gateway,
    });
    setProfile(data);
    return data;
  };

  const verifyBvn = async (bvn: string): Promise<BvnVerificationResult> => {
    return api.post<BvnVerificationResult>("/profile/bvn/verify", { bvn });
  };

  const verifyNin = async (nin: string): Promise<NinVerificationResult> => {
    return api.post<NinVerificationResult>("/profile/nin/verify", { nin });
  };

  const downloadNinSlip = async (
    nin: string,
    slipType: NinSlipType,
  ): Promise<NinSlipDownloadResult> => {
    return api.post<NinSlipDownloadResult>("/profile/nin/slip-download", {
      nin,
      slip_type: slipType,
    });
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePin,
    verifyPin,
    hasPin,
    verifyBvn,
    verifyNin,
    downloadNinSlip,
    generateVirtualAccount,
    refetch: fetchProfile,
  };
}
