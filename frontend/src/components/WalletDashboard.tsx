
// src/components/WalletDashboard.tsx - SIMPLIFIED VERSION
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet as WalletIcon,
  IndianRupee,
  Users,
  Gift,
  Share2,
  Copy,
  Check,
  ArrowUpRight,
  Clock,
  CreditCard,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

const WalletDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

 const fetchWalletData = async () => {
  setLoading(true);
  try {
    console.log('🔄 Fetching wallet data...');
    
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    console.log('📡 Wallet API response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📦 Wallet API result:', result);
      
      if (result.success) {
        setWalletData(result.data);
        console.log('✅ Wallet data loaded:', result.data);
      } else {
        console.warn('⚠️ Wallet API returned success: false');
        // Set default wallet data
        setWalletData({
          balance: 0,
          referral_balance: 0,
          total_referrals: 0,
          earned_from_referrals: 0,
          referral_code: 'PENDING',
          signup_bonus_credited: false,
          recent_transactions: []
        });
      }
    } else if (response.status === 404) {
      console.log('ℹ️ Wallet not found (404) - creating one...');
      // Wallet doesn't exist yet, show default
      setWalletData({
        balance: 0,
        referral_balance: 0,
        total_referrals: 0,
        earned_from_referrals: 0,
        referral_code: 'CREATING...',
        signup_bonus_credited: false,
        recent_transactions: []
      });
      
      // Try to trigger wallet creation by refreshing after delay
      setTimeout(() => {
        fetchWalletData();
      }, 2000);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('❌ Error fetching wallet:', error);
    toast({
      title: 'Error',
      description: 'Failed to load wallet data. Please try again.',
      variant: 'destructive'
    });
    
    // Set fallback data
    setWalletData({
      balance: 0,
      referral_balance: 0,
      total_referrals: 0,
      earned_from_referrals: 0,
      referral_code: 'ERROR',
      signup_bonus_credited: false,
      recent_transactions: []
    });
  } finally {
    setLoading(false);
  }
};

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet/referral/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.data || result;
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
    return null;
  };

  const handleTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum top-up amount is ₹100',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        toast({
          title: 'Payment Error',
          description: 'Failed to load payment gateway',
          variant: 'destructive'
        });
        return;
      }

      // Create order
      const orderResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet/topup/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: topupAmount })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) throw new Error(orderData.message || 'Failed to create order');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'Hotel Management System',
        description: 'Wallet Top-up',
        order_id: orderData.data.id,
        handler: async (response: any) => {
          // Verify payment
          const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet/topup/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: topupAmount
            })
          });

          const verifyData = await verifyResponse.json();
          
          if (verifyData.success) {
            toast({
              title: 'Success!',
              description: `₹${topupAmount} added to your wallet`,
              variant: 'default'
            });
            fetchWalletData();
            setTopupAmount('');
          } else {
            throw new Error(verifyData.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || user?.adminName || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({
        title: 'Top-up Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const copyReferralLink = () => {
    const referralCode = walletData?.referral_code;
    if (referralCode) {
      const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && !walletData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading wallet...</span>
      </div>
    );
  }

  return (
    <Layout>
    <div className="space-y-6 p-4">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <WalletIcon className="h-5 w-5" />
            Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              <h2 className="text-3xl font-bold mt-1">
                ₹{walletData?.balance?.toLocaleString('en-IN') || '0'}
              </h2>
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <p className="text-xs opacity-80">Referral Earnings</p>
                  <p className="text-sm font-semibold">
                    ₹{walletData?.referral_balance?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-80">Total Referrals</p>
                  <p className="text-sm font-semibold">
                    {walletData?.total_referrals || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {user?.plan === 'pro' ? 'PRO Account' : 'Basic Account'}
              </Badge>
              {user?.plan === 'pro' && walletData?.signup_bonus_credited && (
                <div className="mt-2 text-xs opacity-80">
                  <Gift className="inline h-3 w-3 mr-1" />
                  Signup Bonus Claimed
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Referral & Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Referral Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Referral Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Total Referrals</p>
                  <p className="text-2xl font-bold">{walletData?.total_referrals || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Commission Earned</p>
                  <p className="text-2xl font-bold">
                    ₹{walletData?.earned_from_referrals?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
              </div>

              <div>
                <Label>Your Referral Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={walletData?.referral_code || ''}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    onClick={copyReferralLink}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this code with friends. Earn 10% commission when they upgrade to PRO!
                </p>
              </div>

              <div>
                <Label>Referral Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={`${window.location.origin}/register?ref=${walletData?.referral_code || ''}`}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    onClick={copyReferralLink}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletData?.recent_transactions?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {(walletData?.recent_transactions || []).map((txn: any) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{txn.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(txn.created_at)} • {txn.category?.replace('_', ' ') || 'transaction'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${txn.type === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                          {txn.type === 'credit' ? 'Credit' : 'Debit'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Top-up & Actions */}
        <div className="space-y-6">
          {/* Top-up Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add Money
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="100"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum ₹100
                </p>
              </div>

              <Button
                onClick={handleTopup}
                className="w-full"
                disabled={processing || !topupAmount}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Add Money
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Quick Top-up:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setTopupAmount(amount.toString())}
                      className="h-8"
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.plan !== 'pro' && (
                <Button
                  className="w-full justify-start"
                  onClick={() => navigate('/upgrade')}
                >
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Upgrade to PRO
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/referrals')}
              >
                <Users className="h-4 w-4 mr-2" />
                View Referral Stats
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/wallet/transactions')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Transaction History
              </Button>
            </CardContent>
          </Card>

          {/* Referral Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Referral Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <span>Earn 10% commission on friend's PRO payment</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <span>Get ₹100 signup bonus for PRO users</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <span>Max 10 referrals per user</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default WalletDashboard;