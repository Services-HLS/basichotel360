// src/lib/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Wallet API calls
export const walletApi = {
  // Get wallet details
  getWallet: () => api.get('/wallet'),
  
  // Get transactions
  getTransactions: (params?: { limit?: number; offset?: number }) => 
    api.get('/wallet/transactions', { params }),
  
  // Create top-up order
  createTopupOrder: (amount: number) => 
    api.post('/wallet/topup/order', { amount }),
  
  // Verify top-up payment
  verifyTopupPayment: (data: any) => 
    api.post('/wallet/topup/verify', data),
  
  // Pay with wallet
  payWithWallet: (data: { amount: number; plan_type?: string; description?: string }) => 
    api.post('/wallet/pay', data),
  
  // Get referral stats
  getReferralStats: () => api.get('/wallet/referral/stats'),
  
  // Get leaderboard
  getLeaderboard: () => api.get('/wallet/referral/leaderboard'),
  
  // Validate referral code
  validateReferralCode: (code: string) => 
    api.get(`/wallet/referral/validate/${code}`),
};

export default api;