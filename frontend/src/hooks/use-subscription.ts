// hooks/use-subscription.ts
import { useState, useEffect } from "react";

export interface Subscription {
  plan: 'free' | 'paid';
  status: string;
  features: string[];
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const parsed = JSON.parse(userData);
      setSubscription(parsed.subscription || { 
        plan: 'free', 
        status: 'active', 
        features: ['bookings', 'blocks'] 
      });
    }
  }, []);

  const hasFeature = (feature: string): boolean => {
    return subscription?.features.includes(feature) || false;
  };

  const isPaid = subscription?.plan === 'paid';

  return {
    subscription,
    hasFeature,
    isPaid,
    canBook: hasFeature('bookings'),
    canBlock: hasFeature('blocks'), 
    canMaintain: hasFeature('maintenance'),
    canExport: hasFeature('export'),
  };
}