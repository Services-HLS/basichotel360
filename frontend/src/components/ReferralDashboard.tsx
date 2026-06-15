// src/components/ReferralDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Gift,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Award,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from 'recharts';
import Layout from './Layout';

const ReferralDashboard = () => {
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchLeaderboard();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet/referral/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive'
      });
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet/referral/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referral_link) {
      navigator.clipboard.writeText(referralData.referral_link);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (referralData?.referral_link) {
      const message = `Join Hotel Management System using my referral link and get ₹100 bonus! ${referralData.referral_link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Refer & Earn</h1>
            <p className="text-muted-foreground">
              Share your referral code and earn rewards
            </p>
          </div>
          {/* <Button onClick={shareOnWhatsApp} className="bg-green-600 hover:bg-green-700">
            <Share2 className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </Button> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-3xl font-bold mt-2">
                    {referralData?.total_referrals || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commission Earned</p>
                  <p className="text-3xl font-bold mt-2">
                    ₹{referralData?.total_commission_earned?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful Referrals</p>
                  <p className="text-3xl font-bold mt-2">
                    {referralData?.successful_referrals || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-3xl font-bold mt-2">
                    ₹{referralData?.referral_balance?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referral Code Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="text-center">
                    <div className="inline-block bg-white border-2 border-dashed border-blue-300 rounded-lg px-8 py-4 mb-4">
                      <p className="text-3xl font-bold tracking-widest text-blue-600">
                        {referralData?.referral_code}
                      </p>
                    </div>
                    <p className="text-sm text-blue-700">
                      Share this code with friends to earn commissions
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Your Referral Link</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={referralData?.referral_link || ''}
                      readOnly
                      className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50"
                    />
                    <Button onClick={copyReferralLink} variant="default">
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => {
                    const text = `Use my referral code ${referralData?.referral_code} to get ₹100 bonus on Hotel Management System!`;
                    navigator.clipboard.writeText(text);
                    toast({ title: 'Message copied!' });
                  }}>
                    Copy Message
                  </Button>
                  <Button variant="outline" onClick={shareOnWhatsApp}>
                    Share on WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No leaderboard data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((user: any, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-100' :
                            index === 1 ? 'bg-gray-100' :
                              index === 2 ? 'bg-amber-100' :
                                'bg-blue-50'
                          }`}>
                          <span className={`font-bold ${index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-600' :
                                index === 2 ? 'text-amber-600' :
                                  'text-blue-600'
                            }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.successful_referrals} referrals
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{user.total_earnings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-bold mb-2">Share Your Code</h3>
                <p className="text-sm text-muted-foreground">
                  Share your unique referral code with friends and colleagues
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-bold mb-2">They Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  Friends sign up using your code and get ₹100 bonus
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-bold mb-2">Earn Commission</h3>
                <p className="text-sm text-muted-foreground">
                  Earn 10% commission when they upgrade to PRO plan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReferralDashboard;