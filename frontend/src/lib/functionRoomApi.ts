import { FunctionRoom, FunctionBooking } from '@/types/hotel';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!API_BASE_URL) {
  console.error('❌ VITE_BACKEND_URL is not defined in environment variables');
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get authentication headers with token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.warn('⚠️ No auth token found in localStorage');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * ✅ NEW: Get current user's hotel ID
 */
const getCurrentHotelId = (): string | null => {
  try {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;
    
    const user = JSON.parse(currentUser);
    return user.hotel_id || user.hotelId || null;
  } catch (error) {
    console.error('❌ Error getting hotel ID:', error);
    return null;
  }
};

/**
 * ✅ FIXED: Build URL with hotel_id parameter - DON'T use window.location.origin
 */
const buildUrlWithHotelId = (baseUrl: string, params?: Record<string, any>): string => {
  const hotelId = getCurrentHotelId();
  
  // Start with the base URL
  let url = baseUrl;
  
  // Create URLSearchParams object
  const queryParams = new URLSearchParams();
  
  // Add hotel_id if available
  if (hotelId) {
    queryParams.append('hotel_id', hotelId);
  }
  
  // Add any additional params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  // Append query parameters to URL
  const queryString = queryParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  console.log('🔍 Built URL:', url); // Add this for debugging
  return url;
};

/**
 * Handle API response - FIXED to handle HTML responses
 */
const handleResponse = async (response: Response) => {
  // Check content type first
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    // Check if response is HTML (common for 404/500 errors)
    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('❌ Received HTML instead of JSON. URL might be wrong:', htmlText.substring(0, 200));
      
      // Check if it's a 404 page
      if (response.status === 404) {
        errorMessage = 'API endpoint not found. Please check your backend URL.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      
      // Check for hotel mismatch errors
      if (errorData.error === 'INVALID_HOTEL' || 
          errorData.code === 'WRONG_HOTEL' ||
          errorData.message?.includes('hotel')) {
        console.error('🚫 Hotel mismatch detected, clearing data...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('hotelLogo');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    } catch (e) {
      // If we can't parse JSON and it's not HTML, just use status text
      if (!contentType || !contentType.includes('text/html')) {
        errorMessage = response.statusText || errorMessage;
      }
    }
    
    // If unauthorized, clear storage and redirect to login
    if (response.status === 401) {
      console.error('🔐 Unauthorized - redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('hotelLogo');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    throw new Error(errorMessage);
  }
  
  // For successful responses, ensure it's JSON
  if (contentType && !contentType.includes('application/json')) {
    console.warn('⚠️ Response is not JSON:', contentType);
    const text = await response.text();
    console.log('Response text:', text.substring(0, 200));
    
    // Try to parse as JSON anyway
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Invalid response format from server');
    }
  }
  
  return response.json();
};

// ===========================================
// FUNCTION ROOM CRUD OPERATIONS
// ===========================================

/**
 * GET /function-rooms
 * Get all function rooms for current hotel
 */
export const getFunctionRooms = async (): Promise<FunctionRoom[]> => {
  try {
    console.log('📡 Fetching function rooms from API...');
    
    // ✅ FIXED: Build URL with hotel_id
    const url = buildUrlWithHotelId(`${API_BASE_URL}/function-rooms`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    console.log(`✅ Fetched ${result.data?.length || 0} function rooms`);
    
    return result.data || [];
  } catch (error) {
    console.error('❌ Error fetching function rooms:', error);
    throw error;
  }
};

/**
 * GET /function-rooms/:id
 * Get single function room by ID
 */
export const getFunctionRoomById = async (id: number | string): Promise<FunctionRoom | null> => {
  try {
    console.log(`📡 Fetching function room ${id}...`);
    
    // ✅ FIXED: Build URL with hotel_id
    const url = buildUrlWithHotelId(`${API_BASE_URL}/function-rooms/${id}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    return result.data || null;
  } catch (error) {
    console.error(`❌ Error fetching function room ${id}:`, error);
    throw error;
  }
};

/**
 * POST /function-rooms
 * Create new function room
 */
export const createFunctionRoom = async (roomData: Partial<FunctionRoom>): Promise<any> => {
  try {
    console.log('📡 Creating function room:', roomData);
    
    // ✅ FIXED: Get hotel ID and add to request body
    const hotelId = getCurrentHotelId();
    
    const response = await fetch(`${API_BASE_URL}/function-rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...roomData,
        hotel_id: hotelId // Add hotel_id to body
      }),
    });
    
    const result = await handleResponse(response);
    console.log('✅ Function room created:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating function room:', error);
    throw error;
  }
};

/**
 * POST /function-rooms/batch
 * Create multiple function rooms (range or batch)
 */
export const createMultipleFunctionRooms = async (batchData: any): Promise<any> => {
  try {
    console.log('📡 Creating multiple function rooms...');
    
    // ✅ FIXED: Get hotel ID and add to request body
    const hotelId = getCurrentHotelId();
    
    const response = await fetch(`${API_BASE_URL}/function-rooms/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...batchData,
        hotel_id: hotelId // Add hotel_id to body
      }),
    });
    
    const result = await handleResponse(response);
    console.log(`✅ Created ${result.createdRooms?.length || 0} function rooms`);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating multiple function rooms:', error);
    throw error;
  }
};

/**
 * DELETE /function-rooms/:id
 * Delete function room
 */
export const deleteFunctionRoom = async (id: number | string): Promise<any> => {
  try {
    console.log(`📡 Deleting function room ${id}...`);
    
    // ✅ FIXED: Build URL with hotel_id
    const url = buildUrlWithHotelId(`${API_BASE_URL}/function-rooms/${id}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    console.log(`✅ Function room ${id} deleted`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error deleting function room ${id}:`, error);
    throw error;
  }
};

// ===========================================
// FUNCTION BOOKING OPERATIONS
// ===========================================

/**
 * GET /function-rooms/bookings/with-rooms
 * Get all function bookings with associated room bookings
 */
export const getFunctionBookings = async (params?: { 
  date?: string; 
  status?: string; 
  room_id?: number | string;
}): Promise<FunctionBooking[]> => {
  try {
    // ✅ FIXED: Build URL with hotel_id AND other params
    const url = buildUrlWithHotelId(`${API_BASE_URL}/function-rooms/bookings/with-rooms`, params);
    
    console.log(`📡 Fetching function bookings from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    console.log(`✅ Fetched ${result.data?.length || 0} function bookings`);
    
    return result.data || [];
  } catch (error) {
    console.error('❌ Error fetching function bookings:', error);
    // Don't throw error, return empty array
    return [];
  }
};

/**
 * GET /function-rooms/bookings/:id/with-rooms
 * Get single function booking with associated room bookings
 */
export const getFunctionBookingById = async (id: number | string): Promise<FunctionBooking | null> => {
  try {
    console.log(`📡 Fetching function booking ${id}...`);
    
    // ✅ FIXED: Build URL with hotel_id
    const url = buildUrlWithHotelId(`${API_BASE_URL}/function-rooms/bookings/${id}/with-rooms`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    return result.data || null;
  } catch (error) {
    console.error(`❌ Error fetching function booking ${id}:`, error);
    throw error;
  }
};

/**
 * POST /function-rooms/bookings/with-rooms
 * Create function booking with optional room bookings
 */
export const createFunctionBooking = async (bookingData: any): Promise<any> => {
  try {
    console.log('📡 Creating function booking...');
    
    // ✅ FIXED: Get hotel ID and add to request body
    const hotelId = getCurrentHotelId();
    
    const response = await fetch(`${API_BASE_URL}/function-rooms/bookings/with-rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...bookingData,
        hotel_id: hotelId // Add hotel_id to body
      }),
    });
    
    const result = await handleResponse(response);
    console.log('✅ Function booking created:', result.data?.booking_reference);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating function booking:', error);
    throw error;
  }
};

// ===========================================
// AVAILABILITY & BLOCK OPERATIONS
// ===========================================

/**
 * POST /function-rooms/check-availability
 * Check if function room is available for specific date range and time
 */
export const checkFunctionRoomAvailability = async (
  roomId: number | string,
  checkInDate: string,
  checkOutDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: number | string
): Promise<boolean> => {
  try {
    console.log(`🔍 Checking function room ${roomId} availability:`, { 
      checkInDate, 
      checkOutDate, 
      startTime, 
      endTime 
    });
    
    // ✅ FIXED: Get hotel ID
    const hotelId = getCurrentHotelId();
    
    const response = await fetch(`${API_BASE_URL}/function-rooms/check-availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        room_id: roomId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        start_time: startTime,
        end_time: endTime,
        exclude_booking_id: excludeBookingId,
        hotel_id: hotelId // Add hotel_id to body
      }),
    });

    if (!response.ok) {
      console.error('❌ Function room availability check failed:', response.status);
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Function room availability result:', result);
    
    return result.data?.available === true;
    
  } catch (error) {
    console.error('❌ Error checking function room availability:', error);
    return false;
  }
};

/**
 * GET /function-rooms/stats
 * Get function room statistics
 */
export const getFunctionRoomStats = async (period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<any> => {
  try {
    console.log(`📡 Fetching function room stats for ${period}...`);
    
    // ✅ FIXED: Build URL with hotel_id AND period
    const url = buildUrlWithHotelId(`${API_BASE_URL}/function-rooms/stats`, { period });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    return result.data || null;
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
};

// import { FunctionRoom, FunctionBooking } from '@/types/hotel';

// const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// if (!API_BASE_URL) {
//   console.error('❌ VITE_BACKEND_URL is not defined in environment variables');
// }

// // ===========================================
// // HELPER FUNCTIONS
// // ===========================================

// /**
//  * Get authentication headers with token
//  */
// const getAuthHeaders = () => {
//   const token = localStorage.getItem('authToken');
  
//   if (!token) {
//     console.warn('⚠️ No auth token found in localStorage');
//   }
  
//   return {
//     'Authorization': `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };
// };

// /**
//  * Handle API response
//  */
// const handleResponse = async (response: Response) => {
//   if (!response.ok) {
//     let errorMessage = `HTTP error! status: ${response.status}`;
    
//     try {
//       const errorData = await response.json();
//       errorMessage = errorData.message || errorData.error || errorMessage;
//     } catch (e) {
//       // Ignore parse error
//     }
    
//     // If unauthorized, clear storage and redirect to login
//     if (response.status === 401) {
//       console.error('🔐 Unauthorized - redirecting to login');
//       localStorage.removeItem('authToken');
//       localStorage.removeItem('currentUser');
//       window.location.href = '/login';
//       throw new Error('Session expired. Please login again.');
//     }
    
//     throw new Error(errorMessage);
//   }
  
//   return response.json();
// };

// // ===========================================
// // FUNCTION ROOM CRUD OPERATIONS
// // ===========================================

// /**
//  * GET /function-rooms
//  * Get all function rooms for current hotel
//  */
// export const getFunctionRooms = async (): Promise<FunctionRoom[]> => {
//   try {
//     console.log('📡 Fetching function rooms from API...');
    
//     const response = await fetch(`${API_BASE_URL}/function-rooms`, {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     });
    
//     const result = await handleResponse(response);
//     console.log(`✅ Fetched ${result.data?.length || 0} function rooms`);
    
//     return result.data || [];
//   } catch (error) {
//     console.error('❌ Error fetching function rooms:', error);
//     throw error;
//   }
// };

// /**
//  * GET /function-rooms/:id
//  * Get single function room by ID
//  */
// export const getFunctionRoomById = async (id: number | string): Promise<FunctionRoom | null> => {
//   try {
//     console.log(`📡 Fetching function room ${id}...`);
    
//     const response = await fetch(`${API_BASE_URL}/function-rooms/${id}`, {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     });
    
//     const result = await handleResponse(response);
//     return result.data || null;
//   } catch (error) {
//     console.error(`❌ Error fetching function room ${id}:`, error);
//     throw error;
//   }
// };

// /**
//  * POST /function-rooms
//  * Create new function room
//  */
// export const createFunctionRoom = async (roomData: Partial<FunctionRoom>): Promise<any> => {
//   try {
//     console.log('📡 Creating function room:', roomData);
    
//     const response = await fetch(`${API_BASE_URL}/function-rooms`, {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify(roomData),
//     });
    
//     const result = await handleResponse(response);
//     console.log('✅ Function room created:', result);
    
//     return result;
//   } catch (error) {
//     console.error('❌ Error creating function room:', error);
//     throw error;
//   }
// };

// /**
//  * POST /function-rooms/batch
//  * Create multiple function rooms (range or batch)
//  */
// export const createMultipleFunctionRooms = async (batchData: any): Promise<any> => {
//   try {
//     console.log('📡 Creating multiple function rooms...');
    
//     const response = await fetch(`${API_BASE_URL}/function-rooms/batch`, {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify(batchData),
//     });
    
//     const result = await handleResponse(response);
//     console.log(`✅ Created ${result.createdRooms?.length || 0} function rooms`);
    
//     return result;
//   } catch (error) {
//     console.error('❌ Error creating multiple function rooms:', error);
//     throw error;
//   }
// };

// /**
//  * DELETE /function-rooms/:id
//  * Delete function room
//  */
// export const deleteFunctionRoom = async (id: number | string): Promise<any> => {
//   try {
//     console.log(`📡 Deleting function room ${id}...`);
    
//     const response = await fetch(`${API_BASE_URL}/function-rooms/${id}`, {
//       method: 'DELETE',
//       headers: getAuthHeaders(),
//     });
    
//     const result = await handleResponse(response);
//     console.log(`✅ Function room ${id} deleted`);
    
//     return result;
//   } catch (error) {
//     console.error(`❌ Error deleting function room ${id}:`, error);
//     throw error;
//   }
// };

// // ===========================================
// // ✅ FIXED: FUNCTION BOOKING OPERATIONS
// // ===========================================

// /**
//  * ✅ FIXED: GET /function-rooms/bookings/with-rooms
//  * Get all function bookings with associated room bookings
//  */
// export const getFunctionBookings = async (params?: { 
//   date?: string; 
//   status?: string; 
//   room_id?: number | string;
// }): Promise<FunctionBooking[]> => {
//   try {
//     // ✅ CORRECT URL - this is the specific route, not parameterized
//     let url = `${API_BASE_URL}/function-rooms/bookings/with-rooms`;
    
//     if (params) {
//       const queryParams = new URLSearchParams();
//       if (params.date) queryParams.append('date', params.date);
//       if (params.status) queryParams.append('status', params.status);
//       if (params.room_id) queryParams.append('room_id', params.room_id.toString());
      
//       if (queryParams.toString()) {
//         url += `?${queryParams.toString()}`;
//       }
//     }
    
//     console.log(`📡 Fetching function bookings from: ${url}`);
    
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     });
    
//     const result = await handleResponse(response);
//     console.log(`✅ Fetched ${result.data?.length || 0} function bookings`);
    
//     return result.data || [];
//   } catch (error) {
//     console.error('❌ Error fetching function bookings:', error);
//     // Don't throw error, return empty array
//     return [];
//   }
// };

// /**
//  * ✅ FIXED: GET /function-rooms/bookings/:id/with-rooms
//  * Get single function booking with associated room bookings
//  */
// export const getFunctionBookingById = async (id: number | string): Promise<FunctionBooking | null> => {
//   try {
//     console.log(`📡 Fetching function booking ${id}...`);
    
//     // ✅ This is the parameterized route with :id
//     const response = await fetch(`${API_BASE_URL}/function-rooms/bookings/${id}/with-rooms`, {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     });
    
//     const result = await handleResponse(response);
//     return result.data || null;
//   } catch (error) {
//     console.error(`❌ Error fetching function booking ${id}:`, error);
//     throw error;
//   }
// };

// /**
//  * ✅ FIXED: POST /function-rooms/bookings/with-rooms
//  * Create function booking with optional room bookings
//  */
// export const createFunctionBooking = async (bookingData: any): Promise<any> => {
//   try {
//     console.log('📡 Creating function booking...');
    
//     // ✅ Use the specific route for creating with rooms
//     const response = await fetch(`${API_BASE_URL}/function-rooms/bookings/with-rooms`, {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify(bookingData),
//     });
    
//     const result = await handleResponse(response);
//     console.log('✅ Function booking created:', result.data?.booking_reference);
    
//     return result;
//   } catch (error) {
//     console.error('❌ Error creating function booking:', error);
//     throw error;
//   }
// };

// // ===========================================
// // AVAILABILITY & BLOCK OPERATIONS
// // ===========================================

// /**
//  * POST /function-rooms/check-availability
//  * Check if function room is available for specific date/time
//  */
// // export const checkFunctionRoomAvailability = async (
// //   roomId: number | string,
// //   date: string,
// //   startTime: string,
// //   endTime: string,
// //   excludeBookingId?: number | string
// // ): Promise<boolean> => {
// //   try {
// //     console.log(`🔍 Checking function room ${roomId} availability:`, { date, startTime, endTime });
    
// //     const token = localStorage.getItem('authToken');
    
// //     const response = await fetch(`${API_BASE_URL}/function-rooms/check-availability`, {
// //       method: 'POST',
// //       headers: {
// //         'Authorization': `Bearer ${token}`,
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify({
// //         room_id: roomId,
// //         date,
// //         start_time: startTime,
// //         end_time: endTime,
// //         exclude_booking_id: excludeBookingId
// //       }),
// //     });

// //     if (!response.ok) {
// //       console.error('❌ Function room availability check failed:', response.status);
// //       return false;
// //     }
    
// //     const result = await response.json();
// //     console.log('✅ Function room availability result:', result);
    
// //     return result.data?.available === true;
    
// //   } catch (error) {
// //     console.error('❌ Error checking function room availability:', error);
// //     return false;
// //   }
// // };

// // ===========================================
// // AVAILABILITY & BLOCK OPERATIONS
// // ===========================================

// /**
//  * POST /function-rooms/check-availability
//  * Check if function room is available for specific date range and time
//  */
// export const checkFunctionRoomAvailability = async (
//   roomId: number | string,
//   checkInDate: string,
//   checkOutDate: string,
//   startTime: string,
//   endTime: string,
//   excludeBookingId?: number | string
// ): Promise<boolean> => {
//   try {
//     console.log(`🔍 Checking function room ${roomId} availability:`, { 
//       checkInDate, 
//       checkOutDate, 
//       startTime, 
//       endTime 
//     });
    
//     const token = localStorage.getItem('authToken');
    
//     const response = await fetch(`${API_BASE_URL}/function-rooms/check-availability`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         room_id: roomId,
//         check_in_date: checkInDate,
//         check_out_date: checkOutDate,
//         start_time: startTime,
//         end_time: endTime,
//         exclude_booking_id: excludeBookingId
//       }),
//     });

//     if (!response.ok) {
//       console.error('❌ Function room availability check failed:', response.status);
//       const errorText = await response.text();
//       console.error('❌ Error response:', errorText);
//       return false;
//     }
    
//     const result = await response.json();
//     console.log('✅ Function room availability result:', result);
    
//     return result.data?.available === true;
    
//   } catch (error) {
//     console.error('❌ Error checking function room availability:', error);
//     return false;
//   }
// };

// /**
//  * GET /function-rooms/stats
//  * Get function room statistics
//  */
// export const getFunctionRoomStats = async (period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<any> => {
//   try {
//     console.log(`📡 Fetching function room stats for ${period}...`);
    
//     const response = await fetch(
//       `${API_BASE_URL}/function-rooms/stats?period=${period}`,
//       {
//         method: 'GET',
//         headers: getAuthHeaders(),
//       }
//     );
    
//     const result = await handleResponse(response);
//     return result.data || null;
//   } catch (error) {
//     console.error('❌ Error fetching stats:', error);
//     throw error;
//   }
// };

