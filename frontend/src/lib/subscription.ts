export const handleSubscriptionExpired = (errorData?: any) => {
  console.log('⚠️ Handling subscription expiry');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const expiryDate =
    errorData?.expiryDate ||
    errorData?.trial_expiry_date ||
    errorData?.data?.expiryDate ||
    currentUser.trial_expiry_date;

  const updatedUser = {
    ...currentUser,
    isTrialExpired: true,
    status: 'suspended',
    trial_expiry_date: expiryDate,
    subscription_status: 'expired',
  };

  localStorage.setItem('currentUser', JSON.stringify(updatedUser));

  window.dispatchEvent(
    new CustomEvent('subscription:expired', {
      detail: { user: updatedUser },
    })
  );

  sessionStorage.setItem('subscription_expired', 'true');

  return updatedUser;
};

export const isSubscriptionExpired = (user: any): boolean => {
  return (
    user?.isTrialExpired === true ||
    user?.status === 'suspended' ||
    user?.subscription_status === 'expired' ||
    sessionStorage.getItem('subscription_expired') === 'true'
  );
};
