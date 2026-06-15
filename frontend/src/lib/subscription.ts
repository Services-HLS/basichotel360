// src/lib/subscription.ts
export const handleSubscriptionExpired = (errorData?: any) => {
  console.log('⚠️ Handling subscription expiry');
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Extract expiry date from various possible locations
  const expiryDate = errorData?.expiryDate || 
                     errorData?.trial_expiry_date || 
                     errorData?.data?.expiryDate ||
                     currentUser.trial_expiry_date;
  
  // Update user data to reflect expired status
  const updatedUser = {
    ...currentUser,
    isTrialExpired: true,
    status: 'suspended',
    trial_expiry_date: expiryDate,
    subscription_status: 'expired'
  };
  
  // Save updated user
  localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  
  // Dispatch a custom event that components can listen to
  window.dispatchEvent(new CustomEvent('subscription:expired', { 
    detail: { user: updatedUser } 
  }));
  
  // Also set a flag in sessionStorage to prevent redirects
  sessionStorage.setItem('subscription_expired', 'true');
  
  return updatedUser;
};

export const isSubscriptionExpired = (user: any): boolean => {
  return user?.isTrialExpired === true || 
         user?.status === 'suspended' ||
         user?.subscription_status === 'expired' ||
         sessionStorage.getItem('subscription_expired') === 'true';
};