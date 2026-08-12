import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Zap,
  Shield,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/storage';
import {
  isBasicDatabaseUser,
  isGoogleSheetsBasicUser,
  getPostLoginPath,
} from '@/lib/planUtils';
import {
  PRO_UPGRADE_PRICES,
  startProUpgradeCheckout,
  loadRazorpayScript,
  type ProBillingPeriod,
} from '@/lib/proUpgradePayment';
import { clearNotificationsOnLogout } from '@/lib/notificationStore';

const UpgradeFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [billingPeriod] = useState<ProBillingPeriod>('monthly');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem('authToken') && currentUser);
  const isSheetsBasic = isGoogleSheetsBasicUser(currentUser);
  const isDbBasic = isBasicDatabaseUser(currentUser);
  const needsReactivation =
    currentUser?.status === 'suspended' || currentUser?.isTrialExpired === true;
  const reactivationAmount =
    Number(currentUser?.customReactivationAmount) > 0
      ? Number(currentUser.customReactivationAmount)
      : 599;

  const canPayBasicUpgrade = isLoggedIn && isDbBasic && !isSheetsBasic;
  const canPayReactivation = isLoggedIn && needsReactivation && !isSheetsBasic;
  const canPay = canPayBasicUpgrade || canPayReactivation;
  const alreadyActivePro =
    isLoggedIn && !isDbBasic && !isSheetsBasic && !needsReactivation;

  const handleReactivatePayment = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const token = localStorage.getItem('authToken');

    if (!token || !razorpayKey) {
      throw new Error('Please log in again to continue payment.');
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load payment gateway. Please refresh and try again.');
    }

    const orderResponse = await fetch(`${backendUrl}/pro-payments/reactivate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hotel_id: currentUser?.hotel_id,
        email: currentUser?.email,
        name: currentUser?.name || currentUser?.adminName,
        phone: currentUser?.phone,
      }),
    });

    const orderData = await orderResponse.json().catch(() => ({}));
    if (!orderResponse.ok || !orderData.success) {
      throw new Error(orderData.message || 'Failed to create reactivation order');
    }

    await new Promise((r) => setTimeout(r, 400));

    return new Promise<void>((resolve, reject) => {
      const options = {
        key: razorpayKey,
        amount: orderData.data.amount,
        currency: orderData.data.currency || 'INR',
        name: 'Hotel Management System',
        description: `PRO Plan Reactivation (₹${reactivationAmount} / 1 month)`,
        order_id: orderData.data.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch(
              `${backendUrl}/pro-payments/verify-reactivation`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  hotel_id: currentUser?.hotel_id,
                }),
              }
            );
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        prefill: {
          name: currentUser?.name || currentUser?.adminName || '',
          email: currentUser?.email || '',
          contact: currentUser?.phone || '',
        },
        notes: {
          type: 'reactivation',
          hotel_id: String(currentUser?.hotel_id || ''),
          hotel_name: currentUser?.hotelName || '',
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
          confirm_close: true,
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
        reject(new Error(resp?.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  };

  const handlePay = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!canPay) {
      return;
    }

    setIsPaying(true);
    try {
      if (canPayReactivation) {
        await handleReactivatePayment();
        toast({
          title: 'Payment successful',
          description: 'Your PRO plan has been reactivated. Please log in again.',
        });
        setTimeout(() => {
          clearNotificationsOnLogout();
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          navigate('/login');
        }, 1500);
        return;
      }

      await startProUpgradeCheckout(billingPeriod, {
        hotel_id: currentUser?.hotel_id,
        hotelName: currentUser?.hotelName,
        name: currentUser?.name,
        email: currentUser?.email,
        phone: currentUser?.phone,
      });

      const updated = {
        ...currentUser,
        plan: 'pro',
        hotelPlan: 'pro',
      };
      localStorage.setItem('currentUser', JSON.stringify(updated));

      setPaymentDone(true);
      toast({
        title: 'Payment successful',
        description: `Pro plan active (${PRO_UPGRADE_PRICES.monthly.label}). Enjoy full access!`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment could not be completed';
      if (message !== 'Payment cancelled') {
        toast({
          title: 'Payment failed',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsPaying(false);
    }
  };

  const payAmount = canPayReactivation
    ? reactivationAmount
    : PRO_UPGRADE_PRICES.monthly.amountRupees;

  if (paymentDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-14 w-14 text-green-600 mb-2" />
            <CardTitle className="text-2xl">You&apos;re on Pro!</CardTitle>
            <CardDescription>Payment received. Your account has been upgraded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                navigate(
                  getPostLoginPath({ ...currentUser, plan: 'pro', hotelPlan: 'pro' })
                )
              }
            >
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {needsReactivation ? 'Reactivate Pro' : 'Upgrade to Pro'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {needsReactivation
              ? 'Your trial or subscription has ended. Pay ₹599 / month to continue using Pro.'
              : 'Pay securely with Razorpay — stay logged in, no re-registration.'}
          </p>
          {currentUser?.hotelName && (
            <p className="text-sm font-medium text-primary">{currentUser.hotelName}</p>
          )}
        </div>

        {!isLoggedIn && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-amber-900">Log in with your hotel account to upgrade.</p>
              <Button onClick={() => navigate('/login')}>Log in</Button>
            </CardContent>
          </Card>
        )}

        {isLoggedIn && isSheetsBasic && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 text-sm text-amber-900">
              Google Sheets (Basic) accounts cannot upgrade here. Register a Pro database account or contact support.
            </CardContent>
          </Card>
        )}

        {alreadyActivePro && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-sm text-green-900">
              You already have active Pro access. Use the dashboard to manage your subscription.
            </CardContent>
          </Card>
        )}

        {needsReactivation && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-sm text-red-900">
              Trial / subscription expired — status suspended. Pay below to reactivate for 1 month.
            </CardContent>
          </Card>
        )}

        <div className="max-w-md mx-auto">
          <div className="text-left rounded-xl border-2 border-primary bg-primary/5 shadow-md p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-lg">Monthly</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Excluding taxes
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">
              ₹{payAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per 1 month</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Pro includes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {[
                'Full booking & checkout actions',
                'Reports, exports & analytics',
                'Staff management',
                'Online payments & invoices',
                'WhatsApp reminders',
                'Unlimited rooms',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
          disabled={!canPay || isPaying}
          onClick={handlePay}
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Opening payment…
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              {needsReactivation
                ? `Pay ₹${payAmount.toLocaleString('en-IN')} to Reactivate`
                : `Pay ₹${payAmount.toLocaleString('en-IN')} — 1 month`}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Secured by Razorpay. UPI, cards, and net banking supported.
        </p>
      </div>
    </div>
  );
};

export default UpgradeFlow;
