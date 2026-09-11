/**
 * useVerification.ts
 * 
 * React hook for BVN and NIN verification via the API gateway.
 * Provides methods to verify identity documents and download NIN slips.
 * 
 * Usage:
 *   const { verifyBVN, verifyNIN, downloadNINSlip, isLoading, error } = useVerification();
 *   
 *   const result = await verifyBVN('12345678901');
 */

import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export interface VerificationResult {
  bvn?: string;
  nin?: string;
  firstname?: string;
  lastname?: string;
  middlename?: string;
  phone?: string;
  gender?: string;
  birthdate?: string;
  photo?: string;
  residence?: {
    address1?: string;
    town?: string;
    lga?: string;
    state?: string;
  };
}

export interface UseVerificationReturn {
  verifyBVN: (bvn: string) => Promise<VerificationResult>;
  verifyNIN: (nin: string) => Promise<VerificationResult>;
  downloadNINSlip: (nin: string, slipType?: 'regular' | 'improved' | 'premium') => Promise<any>;
  isLoading: boolean;
  error: string | null;
}

export function useVerification(): UseVerificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const verifyBVN = async (bvn: string): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const bvnTrimmed = bvn.trim();

      if (!bvnTrimmed) {
        throw new Error('BVN is required');
      }

      if (!/^\d{11}$/.test(bvnTrimmed)) {
        throw new Error('BVN must be exactly 11 digits');
      }

      const result = await api.post<VerificationResult>('/gateway', {
        service_type: 'bvn',
        action: 'verify',
        payload: { bvn: bvnTrimmed },
      });

      toast({
        title: 'BVN Verified',
        description: `Successfully verified BVN for ${result.firstname} ${result.lastname}`,
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'BVN verification failed';
      setError(errorMsg);
      toast({
        title: 'Verification Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyNIN = async (nin: string): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const ninTrimmed = nin.trim();

      if (!ninTrimmed) {
        throw new Error('NIN is required');
      }

      if (!/^\d{11}$/.test(ninTrimmed)) {
        throw new Error('NIN must be exactly 11 digits');
      }

      const result = await api.post<VerificationResult>('/gateway', {
        service_type: 'nin',
        action: 'verify',
        payload: { nin: ninTrimmed },
      });

      toast({
        title: 'NIN Verified',
        description: `Successfully verified NIN for ${result.firstname} ${result.lastname}`,
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'NIN verification failed';
      setError(errorMsg);
      toast({
        title: 'Verification Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadNINSlip = async (
    nin: string,
    slipType: 'regular' | 'improved' | 'premium' = 'improved'
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const ninTrimmed = nin.trim();

      if (!ninTrimmed) {
        throw new Error('NIN is required');
      }

      if (!/^\d{11}$/.test(ninTrimmed)) {
        throw new Error('NIN must be exactly 11 digits');
      }

      const validTypes = ['regular', 'improved', 'premium'];
      if (!validTypes.includes(slipType)) {
        throw new Error(`slip_type must be one of: ${validTypes.join(', ')}`);
      }

      const result = await api.post('/gateway', {
        service_type: 'nin',
        action: 'download_slip',
        payload: { nin: ninTrimmed, slip_type: slipType },
      });

      toast({
        title: 'Slip Downloaded',
        description: 'NIN slip downloaded successfully',
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Slip download failed';
      setError(errorMsg);
      toast({
        title: 'Download Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    verifyBVN,
    verifyNIN,
    downloadNINSlip,
    isLoading,
    error,
  };
}
