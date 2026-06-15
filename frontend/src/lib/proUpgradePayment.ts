export type ProBillingPeriod = 'monthly' | 'yearly';

export const PRO_UPGRADE_PRICES = {
  monthly: { amountRupees: 499, label: '1 month', billingPeriod: 'monthly' as const },
  yearly: { amountRupees: 4788, label: '1 year', billingPeriod: 'yearly' as const },
};

export const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function startProUpgradeCheckout(
  billingPeriod: ProBillingPeriod,
  user: {
    hotel_id?: number | string;
    hotelName?: string;
    name?: string;
    email?: string;
    phone?: string;
  }
): Promise<void> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('Please log in to upgrade your plan.');
  }
  if (!razorpayKey) {
    throw new Error('Payment gateway is not configured (Razorpay key missing).');
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Failed to load payment gateway. Please refresh and try again.');
  }

  const orderResponse = await fetch(`${backendUrl}/pro-payments/upgrade-order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ billing_period: billingPeriod }),
  });

  const orderData = await orderResponse.json().catch(() => ({}));
  if (!orderResponse.ok || !orderData.success) {
    throw new Error(orderData.message || 'Failed to create payment order');
  }

  await new Promise((r) => setTimeout(r, 400));

  const pricing = PRO_UPGRADE_PRICES[billingPeriod];

  return new Promise((resolve, reject) => {
    const options = {
      key: razorpayKey,
      amount: orderData.data.amount,
      currency: orderData.data.currency || 'INR',
      name: 'Hotel Management System',
      description: `Pro Plan — ${pricing.label} (₹${pricing.amountRupees})`,
      order_id: orderData.data.id,
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          const verifyResponse = await fetch(`${backendUrl}/pro-payments/verify-upgrade`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billing_period: billingPeriod,
            }),
          });
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
        name: user.name || '',
        email: user.email || '',
        contact: user.phone || '',
      },
      notes: {
        type: 'pro_upgrade',
        billing_period: billingPeriod,
        hotel_id: String(user.hotel_id || ''),
        hotel_name: user.hotelName || '',
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
}
