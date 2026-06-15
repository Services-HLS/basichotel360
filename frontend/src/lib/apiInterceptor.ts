import { clearAllUserData } from './clearUserData';

/**
 * Setup API interceptor to ensure hotel_id is always included
 * and to handle hotel mismatch errors
 */
export const setupApiInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options = {}] = args;
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Skip for login and public endpoints
    if (urlString.includes('/auth/login') || 
        urlString.includes('/auth/refresh-token') ||
        urlString.includes('/auth/forgot-password') ||
        urlString.includes('/hotels/registry')) {
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
          
          // Check for hotel mismatch errors
          if (errorData.error === 'INVALID_HOTEL' || 
              errorData.code === 'WRONG_HOTEL' ||
              errorData.message?.toLowerCase().includes('hotel') ||
              errorData.message?.toLowerCase().includes('access denied')) {
            
            console.log('🚫 Hotel mismatch detected, logging out...');
            clearAllUserData();
            window.location.href = '/login';
            throw new Error('Session expired due to hotel mismatch');
          }
        } catch (e) {
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