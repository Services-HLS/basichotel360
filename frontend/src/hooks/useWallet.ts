// src/hooks/useWallet.ts
import { useState, useCallback } from 'react';
import { walletApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useWallet = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getWallet = useCallback(async () => {
    setLoading(true);
    try {
      const response = await walletApi.getWallet();
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load wallet',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getReferralStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await walletApi.getReferralStats();
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load referral stats',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const validateReferralCode = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const response = await walletApi.validateReferralCode(code);
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Invalid Code',
        description: error.response?.data?.message || 'Invalid referral code',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTopupOrder = useCallback(async (amount: number) => {
    setLoading(true);
    try {
      const response = await walletApi.createTopupOrder(amount);
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create order',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    getWallet,
    getReferralStats,
    validateReferralCode,
    createTopupOrder,
  };
};