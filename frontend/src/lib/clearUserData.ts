/**
 * List of all localStorage keys that could contain user data
 */
export const USER_DATA_KEYS = [
  // Authentication
  'authToken',
  'currentUser',
  'user',
  'token',
  'refreshToken',
  
  // Permissions and roles
  'userPermissions',
  'userRole',
  'permissions',
  'roles',
  
  // Hotel data
  'hotelLogo',
  'currentHotel',
  'selectedHotel',
  'hotelData',
  'hotelSettings',
  'hotel_id',
  'hotelId',
  'spreadsheetId',
  
  // Feature flags
  'functionHallEnabled',
  'featureFlags',
  
  // Cached data
  'roomsCache',
  'bookingsCache',
  'customersCache',
  'dashboardCache',
  'lastView',
  'lastVisitedPage',
  'functionRoomsCache',
  
  // User preferences
  'theme',
  'sidebarState',
  'tablePreferences',
  
  // Form drafts
  'bookingFormDraft',
  'customerFormDraft'
];

/**
 * Clear all user data from localStorage and sessionStorage
 */
export const clearAllUserData = (): void => {
  console.log('🧹 Clearing ALL user data...');
  
  // Remove each key from USER_DATA_KEYS
  USER_DATA_KEYS.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      console.log(`   Removed: ${key}`);
    }
  });
  
  // Also remove any key that might have been missed
  const allKeys = Object.keys(localStorage);
  const extraKeys = allKeys.filter(key => 
    key.startsWith('temp_') || 
    key.startsWith('cache_') || 
    key.includes('draft') ||
    key.includes('booking') ||
    key.includes('room') ||
    key.includes('function')
  );
  
  extraKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`   Removed extra: ${key}`);
  });
  
  // Clear session storage
  sessionStorage.clear();
  console.log('   Session storage cleared');
  
  // Clear any cached data in memory
  if (window.caches) {
    caches.keys().then(keys => {
      keys.forEach(key => {
        if (key.includes('api') || key.includes('data')) {
          caches.delete(key);
        }
      });
    });
  }
  
  console.log('✅ All user data cleared');
  console.log('📦 Remaining localStorage keys:', Object.keys(localStorage));
};

/**
 * Check if user is logged in (has auth token)
 */
export const isUserLoggedIn = (): boolean => {
  return !!localStorage.getItem('authToken') && !!localStorage.getItem('currentUser');
};