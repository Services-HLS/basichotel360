// utils/recordLimitCheck.ts
export interface RecordLimitCheck {
  isLimitReached: boolean;
  remaining: number;
  message: string;
  canProceed: boolean;
  currentCount: number;
}

/**
 * IMMEDIATE record limit check - pass current count as parameter
 */
export const checkRecordLimitImmediately = (currentRecordCount: number): RecordLimitCheck => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userPlan = user?.plan || 'basic';
  
  // Pro and Enterprise plans have unlimited records
  if (userPlan === 'pro' || userPlan === 'enterprise') {
    return {
      isLimitReached: false,
      remaining: Infinity,
      message: 'Unlimited records available',
      canProceed: true,
      currentCount: currentRecordCount
    };
  }

  // Free/Basic plan has 5000 record limit
  const isLimitReached = currentRecordCount >= 5000;
  const remaining = Math.max(0, 5000 - currentRecordCount);

  return {
    isLimitReached,
    remaining,
    message: isLimitReached 
      ? 'Record limit reached! Upgrade to Pro for unlimited records.' 
      : `${remaining} records remaining (${currentRecordCount}/5000 used)`,
    canProceed: !isLimitReached,
    currentCount: currentRecordCount
  };
};

/**
 * Check if we can add more records
 */
export const canAddRecords = (currentRecordCount: number, recordsToAdd: number = 1): boolean => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userPlan = user?.plan || 'basic';
  
  if (userPlan === 'pro' || userPlan === 'enterprise') return true;
  
  return (currentRecordCount + recordsToAdd) <= 5000;
};

/**
 * Get current record count from localStorage
 */
export const getCurrentRecordCount = (): number => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (user.source === 'database') {
      // For database users, you might need to fetch this from backend
      // For now, we'll count from localStorage
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
      return bookings.length + customers.length + rooms.length;
    } else {
      // Google Sheets users
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
      return bookings.length + customers.length + rooms.length;
    }
  } catch (error) {
    console.error('Error counting records:', error);
    return 0;
  }
};