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
  type ProBillingPeriod,
} from '@/lib/proUpgradePayment';

const UpgradeFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [billingPeriod, setBillingPeriod] = useState<ProBillingPeriod>('monthly');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem('authToken') && currentUser);
  const isSheetsBasic = isGoogleSheetsBasicUser(currentUser);
  const isDbBasic = isBasicDatabaseUser(currentUser);
  const canUpgrade = isLoggedIn && isDbBasic && !isSheetsBasic;

  const handlePay = async () => {
    if (!canUpgrade) {
      navigate('/login');
      return;
    }

    setIsPaying(true);
    try {
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
        description: `Pro plan active (${PRO_UPGRADE_PRICES[billingPeriod].label}). Enjoy full access!`,
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
              onClick={() => navigate(getPostLoginPath({ ...currentUser, plan: 'pro', hotelPlan: 'pro' }))}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Upgrade to Pro</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Pay securely with Razorpay — stay logged in, no re-registration.
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

        {isLoggedIn && !isDbBasic && !isSheetsBasic && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-sm text-green-900">
              You already have Pro access. Use the dashboard to manage your subscription.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['monthly', 'yearly'] as const).map((period) => {
            const p = PRO_UPGRADE_PRICES[period];
            const selected = billingPeriod === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setBillingPeriod(period)}
                className={`text-left rounded-xl border-2 p-5 transition-all ${
                  selected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-white hover:border-primary/40'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-lg capitalize">
                    {period === 'monthly' ? 'Monthly' : 'Yearly'}
                  </span>
                  {period === 'yearly' && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Best value
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-primary">
                  ₹{p.amountRupees.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per {p.label}</p>
              </button>
            );
          })}
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
          disabled={!canUpgrade || isPaying}
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
              Pay ₹{PRO_UPGRADE_PRICES[billingPeriod].amountRupees.toLocaleString('en-IN')} —{' '}
              {billingPeriod === 'monthly' ? '1 month' : '1 year'}
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
