import { clearAllUserData } from './clearUserData';
import { handleSubscriptionExpired } from './subscription';

/** Public API paths that must work without login (registration, auth, etc.) */
const PUBLIC_API_PATHS = [
  '/auth/login',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-reset-token',
  '/users/check-duplicate',
  '/hotels/register',
  '/hotels/register-basic',
  '/hotels/send-pro-otp',
  '/hotels/send-pro-otp-whatsapp',
  '/hotels/verify-email-otp',
  '/hotels/registry',
  '/wallet/referral/validate',
];

export const isPublicApiUrl = (url: string): boolean =>
  PUBLIC_API_PATHS.some((path) => url.includes(path));

/**
 * Setup API interceptor to ensure hotel_id is always included
 * and to handle hotel mismatch errors
 */
export const setupApiInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options = {}] = args;
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Skip for login and public endpoints (registration, etc.)
    if (isPublicApiUrl(urlString)) {
      return originalFetch(...args);
    }

    // Get current user data
    const currentUserJson = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');

    // If no user or token, but trying to access protected route, clear and redirect
    if (!currentUserJson || !token) {
      if (!urlString.includes('/login')) {
        console.log('🚫 No user/token found in interceptor');
        clearAllUserData();
        window.location.href = '/login';
        throw new Error('No authenticated user');
      }
      return originalFetch(...args);
    }

    try {
      const currentUser = JSON.parse(currentUserJson);
      
      // Ensure hotel_id is in the URL for GET requests
      if (options.method === 'GET' || !options.method) {
        if (!urlString.includes('hotel_id=') && currentUser.hotel_id) {
          const separator = urlString.includes('?') ? '&' : '?';
          const newUrl = `${urlString}${separator}hotel_id=${currentUser.hotel_id}`;
          args[0] = newUrl;
        }
      }

      // Ensure hotel_id is in the body for POST/PUT requests
      if ((options.method === 'POST' || options.method === 'PUT') && options.body) {
        try {
          const body = JSON.parse(options.body as string);
          if (!body.hotel_id && currentUser.hotel_id) {
            body.hotel_id = currentUser.hotel_id;
            options.body = JSON.stringify(body);
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }

      const response = await originalFetch(...args);

      // Handle 403/401 responses
      if (response.status === 403 || response.status === 401) {
        const clonedResponse = response.clone();

        try {
          const errorData = await clonedResponse.json();
          const errorCode = String(errorData.error || errorData.code || '').toLowerCase();
          const errorMessage = String(errorData.message || '').toLowerCase();

          const isSubscriptionExpired =
            errorCode.includes('subscription_expired') ||
            errorCode.includes('trial_expired') ||
            errorMessage.includes('subscription expired') ||
            errorMessage.includes('trial expired') ||
            errorData.subscription_status === 'expired';

          if (isSubscriptionExpired) {
            handleSubscriptionExpired(errorData);
            return response;
          }

          // Check for hotel mismatch errors
          if (
            errorData.error === 'INVALID_HOTEL' ||
            errorData.code === 'WRONG_HOTEL' ||
            errorMessage.includes('hotel') ||
            errorMessage.includes('access denied')
          ) {
            console.log('🚫 Hotel mismatch detected, logging out...');
            clearAllUserData();
            window.location.href = '/login';
            throw new Error('Session expired due to hotel mismatch');
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('Session expired')) {
            throw e;
          }
          // Ignore JSON parse errors
        }
      }

      return response;
      
    } catch (error) {
      console.error('Error in API interceptor:', error);
      return originalFetch(...args);
    }
  };
};