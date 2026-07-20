// // src/lib/auth.ts
// // This is a NEW FILE - create it in the lib folder

// import { getCurrentUser } from './storage';

// const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// interface RefreshTokenResponse {
//   success: boolean;
//   token: string;
//   user?: any;
//   message?: string;
//   error?: string;
// }

// class AuthService {
//   private static refreshPromise: Promise<RefreshTokenResponse | null> | null = null;
//   private static lastRefreshTime = 0;
//   private static readonly REFRESH_COOLDOWN = 60 * 1000; // 1 minute cooldown

//   // Check if token needs refresh
//   static shouldRefreshToken(token: string): boolean {
//     try {
//       // Don't refresh too often (prevent loops)
//       if (Date.now() - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
//         console.log('⏳ Refresh on cooldown, skipping...');
//         return false;
//       }

//       const payload = JSON.parse(atob(token.split('.')[1]));
//       const expiryTime = payload.exp * 1000;
//       const currentTime = Date.now();

//       // Refresh if token expires in less than 5 minutes
//       // OR if token is already expired
//       const needsRefresh = expiryTime - currentTime < 5 * 60 * 1000;

//       if (needsRefresh) {
//         console.log(`⚠️ Token expires in ${Math.round((expiryTime - currentTime)/60000)} minutes, needs refresh`);
//       }

//       return needsRefresh;
//     } catch (error) {
//       console.error('❌ Error checking token expiry:', error);
//       return true;
//     }
//   }

//   // Single refresh attempt
//   static async refreshToken(): Promise<RefreshTokenResponse | null> {
//     // Prevent multiple simultaneous refresh attempts
//     if (this.refreshPromise) {
//       console.log('⏳ Refresh already in progress, returning existing promise');
//       return this.refreshPromise;
//     }

//     const currentToken = localStorage.getItem('authToken');
//     if (!currentToken) {
//       console.log('❌ No token found for refresh');
//       return null;
//     }

//     // Check if refresh is needed
//     if (!this.shouldRefreshToken(currentToken)) {
//       console.log('✅ Token still valid, no refresh needed');
//       return null;
//     }

//     console.log('🔄 Attempting token refresh...');
//     this.lastRefreshTime = Date.now();

//     this.refreshPromise = new Promise(async (resolve) => {
//       try {
//         const currentUser = getCurrentUser();
//         if (!currentUser) {
//           console.log('❌ No user found for refresh');
//           resolve(null);
//           return;
//         }

//         console.log('📤 Sending refresh request...');
//         const response = await fetch(`${NODE_BACKEND_URL}/auth/refresh-token`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${currentToken}`
//           },
//           body: JSON.stringify({
//             userId: currentUser.id || currentUser.id,
//             hotelId: currentUser.hotel_id
//           })
//         });

//         console.log('📥 Refresh response status:', response.status);

//         if (!response.ok) {
//           console.log('⚠️ Token refresh failed with status:', response.status);
//           resolve(null);
//           return;
//         }

//         const data = await response.json();
//         console.log('📦 Refresh response data:', data);

//         if (data.success && data.token) {
//           // Store new token
//           localStorage.setItem('authToken', data.token);

//           // Update user data if returned
//           if (data.user) {
//             const updatedUser = { ...currentUser, ...data.user };
//             localStorage.setItem('currentUser', JSON.stringify(updatedUser));
//           }

//           console.log('✅ Token refreshed successfully');
//           resolve(data);
//         } else {
//           console.log('❌ Refresh response indicated failure');
//           resolve(null);
//         }

//       } catch (error) {
//         console.error('❌ Token refresh error:', error);
//         resolve(null);
//       } finally {
//         this.refreshPromise = null;
//       }
//     });

//     return this.refreshPromise;
//   }

//   // Validate session - called on app load and route changes
//   static async validateSession(): Promise<boolean> {
//     console.log('🔍 Validating session...');

//     const token = localStorage.getItem('authToken');
//     const user = getCurrentUser();

//     if (!token || !user) {
//       console.log('❌ No token or user found');
//       return false;
//     }

//     // Check if token is clearly expired
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       const expiryTime = payload.exp * 1000;
//       const currentTime = Date.now();

//       console.log(`📅 Token expiry: ${new Date(expiryTime).toLocaleString()}`);

//       if (expiryTime < currentTime) {
//         console.log('⚠️ Token expired, attempting refresh...');
//         // Token expired, try one refresh
//         const refreshResult = await this.refreshToken();
//         return refreshResult !== null;
//       }

//       // Token still valid
//       console.log('✅ Token still valid');
//       return true;

//     } catch (error) {
//       console.error('❌ Error parsing token:', error);
//       return false;
//     }
//   }

//   // Clean logout
//   static logout(redirect = true) {
//     console.log('🚪 Logging out user...');

//     // Clear only auth data, keep other app data
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('currentUser');
//     localStorage.removeItem('hotelLogo');

//     // Clear refresh state
//     this.refreshPromise = null;
//     this.lastRefreshTime = 0;

//     if (redirect) {
//       window.location.href = '/login';
//     }
//   }

//   // Setup fetch interceptor for automatic token handling
//   static setupFetchInterceptor() {
//     console.log('🔧 Setting up fetch interceptor');
//     const originalFetch = window.fetch;

//     window.fetch = async (...args) => {
//       const [url, options = {}] = args;

//       // Skip auth endpoints to avoid loops
//       if (typeof url === 'string' && (
//         url.includes('/auth/login') || 
//         url.includes('/auth/refresh-token') ||
//         url.includes('/auth/forgot-password')
//       )) {
//         return originalFetch(...args);
//       }

//       // Try to refresh token before request if needed
//       const token = localStorage.getItem('authToken');
//       if (token) {
//         try {
//           await this.refreshToken(); // Will only refresh if needed
//         } catch {
//           // Silent fail - let the request proceed
//         }
//       }

//       // Add current token to request
//       const currentToken = localStorage.getItem('authToken');
//       if (currentToken) {
//         options.headers = {
//           ...options.headers,
//           'Authorization': `Bearer ${currentToken}`
//         };
//       }

//       // Make the request
//       let response = await originalFetch(url, options);

//       // Handle 401 responses (unauthorized)
//       if (response.status === 401) {
//         console.log('⚠️ Received 401, attempting token refresh...');

//         // Try one refresh
//         const refreshResult = await this.refreshToken();

//         if (refreshResult) {
//           console.log('✅ Token refreshed, retrying request...');
//           // Retry the request with new token
//           const newToken = localStorage.getItem('authToken');
//           options.headers = {
//             ...options.headers,
//             'Authorization': `Bearer ${newToken}`
//           };
//           response = await originalFetch(url, options);
//         } else {
//           console.log('❌ Token refresh failed, logging out...');
//           // Refresh failed, redirect to login
//           this.logout(true);
//           throw new Error('Session expired');
//         }
//       }

//       return response;
//     };
//   }
// }

// export default AuthService;

// src/lib/auth.ts
import { getCurrentUser } from './storage';
import { isPublicApiUrl } from './apiInterceptor';

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface RefreshTokenResponse {
  success: boolean;
  token: string;
  user?: any;
  message?: string;
  error?: string;
}

class AuthService {
  private static refreshPromise: Promise<RefreshTokenResponse | null> | null = null;
  private static lastRefreshTime = 0;
  private static readonly REFRESH_COOLDOWN = 60 * 1000; // 1 minute cooldown

  // ===== NEW METHOD: Clear ALL user data completely =====
  static clearAllUserData(): void {
    console.log('🧹 AuthService: Clearing ALL user data...');

    // List of ALL keys that might contain user data
    const keysToRemove = [
      // Authentication
      'authToken',
      'currentUser',
      'user',
      'token',

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
      'hotel_id',  // Add this
      'hotelId',   // Add this

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

      // User preferences
      'theme',
      'sidebarState',
      'tablePreferences',

      // Form data (if any)
      'bookingFormDraft',
      'customerFormDraft'
    ];

    // Remove each key
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        console.log(`   Removed: ${key}`);
      }
    });

    // Clear session storage completely
    sessionStorage.clear();
    console.log('   Session storage cleared');

    // Clear any cached data in memory
    this.refreshPromise = null;
    this.lastRefreshTime = 0;

    console.log('✅ AuthService: All user data cleared successfully');

    // Verify cleanup
    const remainingItems = { ...localStorage };
    console.log('📦 Remaining localStorage items:', Object.keys(remainingItems));
  }

  // ===== UPDATED: Check if token needs refresh =====
  static shouldRefreshToken(token: string): boolean {
    try {
      if (Date.now() - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
        console.log('⏳ Refresh on cooldown, skipping...');
        return false;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();

      const needsRefresh = expiryTime - currentTime < 5 * 60 * 1000;

      if (needsRefresh) {
        console.log(`⚠️ Token expires in ${Math.round((expiryTime - currentTime) / 60000)} minutes, needs refresh`);
      }

      return needsRefresh;
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
      return true;
    }
  }

  // ===== UPDATED: Refresh token =====
  static async refreshToken(): Promise<RefreshTokenResponse | null> {
    if (this.refreshPromise) {
      console.log('⏳ Refresh already in progress, returning existing promise');
      return this.refreshPromise;
    }

    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      console.log('❌ No token found for refresh');
      return null;
    }

    if (!this.shouldRefreshToken(currentToken)) {
      console.log('✅ Token still valid, no refresh needed');
      return null;
    }

    console.log('🔄 Attempting token refresh...');
    this.lastRefreshTime = Date.now();

    this.refreshPromise = new Promise(async (resolve) => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.log('❌ No user found for refresh');
          resolve(null);
          return;
        }

        console.log('📤 Sending refresh request...');
        const response = await fetch(`${NODE_BACKEND_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            userId: currentUser.id || currentUser.id,
            hotelId: currentUser.hotel_id
          })
        });

        console.log('📥 Refresh response status:', response.status);

        if (!response.ok) {
          console.log('⚠️ Token refresh failed with status:', response.status);
          resolve(null);
          return;
        }

        const data = await response.json();
        console.log('📦 Refresh response data:', data);

        if (data.success && data.token) {
          localStorage.setItem('authToken', data.token);

          if (data.user) {
            const updatedUser = { ...currentUser, ...data.user };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }

          console.log('✅ Token refreshed successfully');
          resolve(data);
        } else {
          console.log('❌ Refresh response indicated failure');
          resolve(null);
        }

      } catch (error) {
        console.error('❌ Token refresh error:', error);
        resolve(null);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  // ===== UPDATED: Validate session =====
  static async validateSession(): Promise<boolean> {
    console.log('🔍 Validating session...');

    const token = localStorage.getItem('authToken');
    const user = getCurrentUser();

    // Legacy Google Sheets session only (no JWT)
    if (user?.source === 'google_sheets' || localStorage.getItem('basicPlanSession') === 'true') {
      return !!user;
    }

    if (!token || !user) {
      console.log('❌ No token or user found');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();

      console.log(`📅 Token expiry: ${new Date(expiryTime).toLocaleString()}`);

      if (expiryTime < currentTime) {
        console.log('⚠️ Token expired, attempting refresh...');
        const refreshResult = await this.refreshToken();
        return refreshResult !== null;
      }

      console.log('✅ Token still valid');
      return true;

    } catch (error) {
      console.error('❌ Error parsing token:', error);
      return false;
    }
  }

  // ===== UPDATED: Clean logout =====
  static logout(redirect = true) {
    console.log('🚪 AuthService: Logging out user...');

    // Clear ALL user data using the new method
    this.clearAllUserData();

    if (redirect) {
      window.location.href = '/login';
    }
  }

  // ===== UPDATED: Setup fetch interceptor =====
  static setupFetchInterceptor() {
    console.log('🔧 Setting up fetch interceptor');
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options = {}] = args;

      if (typeof url === 'string' && isPublicApiUrl(url)) {
        return originalFetch(...args);
      }

      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await this.refreshToken();
        } catch {
          // Silent fail
        }
      }

      const currentToken = localStorage.getItem('authToken');
      if (currentToken) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${currentToken}`
        };
      }

      let response = await originalFetch(url, options);

      if (response.status === 401) {
        console.log('⚠️ Received 401, attempting token refresh...');

        const refreshResult = await this.refreshToken();

        if (refreshResult) {
          console.log('✅ Token refreshed, retrying request...');
          const newToken = localStorage.getItem('authToken');
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          };
          response = await originalFetch(url, options);
        } else {
          console.log('❌ Token refresh failed, logging out...');
          this.logout(true);
          throw new Error('Session expired');
        }
      }

      return response;
    };
  }
}

export default AuthService;