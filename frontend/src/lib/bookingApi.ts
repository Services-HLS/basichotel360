



import { Booking } from '@/types/hotel';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {}
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
};

// ===========================================
// ROOM AVAILABILITY
// ===========================================

export const getAvailableRooms = async (params?: { from_date?: string; to_date?: string }): Promise<any[]> => {
  try {
    let url = `${API_BASE_URL}/rooms/available`;
    
    if (params && (params.from_date || params.to_date)) {
      const queryParams = new URLSearchParams();
      if (params.from_date) queryParams.append('from_date', params.from_date);
      if (params.to_date) queryParams.append('to_date', params.to_date);
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return [];
  }
};

// export const getAvailableRoomsCorrectly = async (params?: { from_date?: string; to_date?: string }): Promise<any[]> => {
//   try {
//     // Get auth token for headers
//     const token = localStorage.getItem('authToken');
//     const headers = {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
    
//     // 1. First, get all rooms for the hotel
//     const roomsResponse = await fetch(`${API_BASE_URL}/rooms`, {
//       method: 'GET',
//       headers: headers,
//     });
    
//     if (!roomsResponse.ok) {
//       console.error('❌ Failed to fetch rooms:', roomsResponse.status);
//       return [];
//     }
    
//     const roomsResult = await roomsResponse.json();
//     const allRooms = roomsResult.data || [];
    
//     // If no dates provided, return all rooms (or filter by non-permanent status)
//     if (!params?.from_date || !params?.to_date) {
//       // Return rooms that are not permanently blocked/maintenance
//       const availableByStatus = allRooms.filter(room => 
//         room.status !== 'maintenance' && room.status !== 'blocked'
//       );
//       return availableByStatus;
//     }
    
//     // 2. Get all bookings for the hotel to check availability
//     const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`, {
//       method: 'GET',
//       headers: headers,
//     });
    
//     if (!bookingsResponse.ok) {
//       console.error('❌ Failed to fetch bookings:', bookingsResponse.status);
//       return [];
//     }
    
//     const bookingsResult = await bookingsResponse.json();
//     const allBookings = bookingsResult.data || [];
    
//     // Parse the check dates
//     const checkFrom = new Date(params.from_date).getTime();
//     const checkTo = new Date(params.to_date).getTime();
    
//     // 3. Find all bookings that conflict with the requested dates
//     const conflictingRoomIds = new Set<number>();
    
//     for (const booking of allBookings) {
//       // Consider ALL statuses that make a room unavailable
//       const skipStatuses = ['available', 'completed', 'cancelled', 'checked_out', 'checked-out'];
//       if (skipStatuses.includes(booking.status?.toLowerCase())) {
//         continue;
//       }
      
//       // Also check special_requests for maintenance keywords
//       const isMaintenance = booking.special_requests?.toLowerCase().includes('maintenance') || 
//                            booking.special_requests?.toLowerCase().includes('repair') ||
//                            booking.special_requests?.toLowerCase().includes('fix');
      
//       // Skip if status is empty AND it's not maintenance
//       if (!booking.status && !isMaintenance) {
//         continue;
//       }
      
//       // Skip if missing dates
//       if (!booking.from_date || !booking.to_date) {
//         continue;
//       }
      
//       try {
//         const bookingFrom = new Date(booking.from_date).getTime();
//         const bookingTo = new Date(booking.to_date).getTime();
        
//         // Check if dates overlap
//         const hasOverlap = bookingTo > checkFrom && bookingFrom < checkTo;
        
//         if (hasOverlap) {
//           conflictingRoomIds.add(booking.room_id);
//         }
//       } catch (dateError) {
//         console.error('Error parsing dates for booking:', booking.id);
//       }
//     }
    
//     // 4. Filter rooms that are NOT in the conflicting list
//     const availableRooms = allRooms.filter(room => {
//       // Skip if room is permanently blocked/maintenance in its own status
//       if (room.status === 'maintenance' || room.status === 'blocked') {
//         return false;
//       }
      
//       // Skip if room has conflicting booking/maintenance
//       return !conflictingRoomIds.has(room.id);
//     });
    
//     return availableRooms;
    
//   } catch (error) {
//     console.error('❌ Error in getAvailableRoomsCorrectly:', error);
//     return [];
//   }
// };

// ===========================================
// BOOKING OPERATIONS
// ===========================================



// export const getAvailableRoomsCorrectly = async (params?: { from_date?: string; to_date?: string }): Promise<any[]> => {
//   try {
//     // Get auth token for headers
//     const token = localStorage.getItem('authToken');
//     const headers = {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
    
//     // 1. First, get all rooms for the hotel
//     const roomsResponse = await fetch(`${API_BASE_URL}/rooms`, {
//       method: 'GET',
//       headers: headers,
//     });
    
//     if (!roomsResponse.ok) {
//       console.error('❌ Failed to fetch rooms:', roomsResponse.status);
//       return [];
//     }
    
//     const roomsResult = await roomsResponse.json();
//     const allRooms = roomsResult.data || [];
    
//     // If no dates provided, return all rooms (or filter by non-permanent status)
//     if (!params?.from_date || !params?.to_date) {
//       // Return rooms that are not permanently blocked/maintenance
//       const availableByStatus = allRooms.filter(room => 
//         room.status !== 'maintenance' && room.status !== 'blocked'
//       );
//       return availableByStatus;
//     }
    
//     // 2. Get all bookings for the hotel to check availability
//     const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`, {
//       method: 'GET',
//       headers: headers,
//     });
    
//     if (!bookingsResponse.ok) {
//       console.error('❌ Failed to fetch bookings:', bookingsResponse.status);
//       return [];
//     }
    
//     const bookingsResult = await bookingsResponse.json();
//     const allBookings = bookingsResult.data || [];
    
//     // Parse the check dates - set to start and end of day for proper comparison
//     const checkFromDate = new Date(params.from_date);
//     checkFromDate.setHours(0, 0, 0, 0); // Start of day
    
//     const checkToDate = new Date(params.to_date);
//     checkToDate.setHours(23, 59, 59, 999); // End of day
    
//     console.log('🔍 Checking availability for:', {
//       from: checkFromDate.toISOString(),
//       to: checkToDate.toISOString(),
//       fromDateStr: params.from_date,
//       toDateStr: params.to_date
//     });
    
//     // 3. Find all bookings that conflict with the requested dates
//     const conflictingRoomIds = new Set<number>();
    
//     for (const booking of allBookings) {
//       // Consider ALL statuses that make a room unavailable
//       const unavailableStatuses = ['booked', 'blocked', 'maintenance'];
//       if (!unavailableStatuses.includes(booking.status?.toLowerCase())) {
//         continue;
//       }
      
//       // Skip if missing dates
//       if (!booking.from_date || !booking.to_date) {
//         continue;
//       }
      
//       try {
//         // Parse booking dates
//         const bookingFromDate = new Date(booking.from_date);
//         bookingFromDate.setHours(0, 0, 0, 0);
        
//         const bookingToDate = new Date(booking.to_date);
//         bookingToDate.setHours(23, 59, 59, 999);
        
//         console.log(`📅 Checking booking ${booking.id}:`, {
//           room_id: booking.room_id,
//           from: bookingFromDate.toISOString(),
//           to: bookingToDate.toISOString(),
//           status: booking.status
//         });
        
//         // Check if dates overlap using proper date comparison
//         // Overlap occurs when: bookingFrom <= checkTo AND bookingTo >= checkFrom
//         const hasOverlap = bookingFromDate <= checkToDate && bookingToDate >= checkFromDate;
        
//         if (hasOverlap) {
//           console.log(`❌ Conflict found: Room ${booking.room_id} is booked from ${booking.from_date} to ${booking.to_date}`);
//           conflictingRoomIds.add(booking.room_id);
//         }
//       } catch (dateError) {
//         console.error('Error parsing dates for booking:', booking.id, dateError);
//       }
//     }
    
//     console.log('🚫 Conflicting room IDs:', Array.from(conflictingRoomIds));
    
//     // 4. Filter rooms that are NOT in the conflicting list
//     const availableRooms = allRooms.filter(room => {
//       // Skip if room is permanently blocked/maintenance in its own status
//       if (room.status === 'maintenance' || room.status === 'blocked') {
//         console.log(`Room ${room.id} (${room.room_number}) excluded: status is ${room.status}`);
//         return false;
//       }
      
//       // Skip if room has conflicting booking/maintenance
//       if (conflictingRoomIds.has(room.id)) {
//         console.log(`Room ${room.id} (${room.room_number}) excluded: has conflicting booking`);
//         return false;
//       }
      
//       console.log(`✅ Room ${room.id} (${room.room_number}) is available`);
//       return true;
//     });
    
//     console.log(`📊 Final available rooms: ${availableRooms.length} out of ${allRooms.length}`);
    
//     return availableRooms;
    
//   } catch (error) {
//     console.error('❌ Error in getAvailableRoomsCorrectly:', error);
//     return [];
//   }
// };


/**
 * Get available rooms correctly checking both regular and blocked bookings
 */
export const getAvailableRoomsCorrectly = async (params: { 
  from_date: string; 
  to_date: string;
}): Promise<any[]> => {
  try {
    console.log('🔍 Checking availability for:', {
      from: params.from_date,
      to: params.to_date
    });
    
    const token = localStorage.getItem('authToken');
    
    // First get all rooms
    const roomsResponse = await fetch(`${API_BASE_URL}/rooms`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!roomsResponse.ok) {
      throw new Error(`Failed to fetch rooms: ${roomsResponse.status}`);
    }
    
    const roomsResult = await roomsResponse.json();
    const allRooms = roomsResult.data || [];
    
    console.log(`🏨 Total rooms in hotel: ${allRooms.length}`);
    
    // Get all bookings that might affect availability
    const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
    }
    
    const bookingsResult = await bookingsResponse.json();
    const allBookings = bookingsResult.data || [];
    
    console.log(`📅 Total bookings in system: ${allBookings.length}`);
    
    // Parse dates
    const checkFrom = new Date(params.from_date);
    const checkTo = new Date(params.to_date);
    
    // Reset time part for accurate date comparison
    checkFrom.setHours(0, 0, 0, 0);
    checkTo.setHours(0, 0, 0, 0);
    
    // Find rooms that have conflicting bookings in the date range
    const conflictingRoomIds = new Set();
    
    allBookings.forEach((booking: any) => {
      // Only consider bookings that make the room unavailable
      // BLOCKED and MAINTENANCE also make rooms unavailable, but only for their date range
      if (!['booked', 'blocked', 'maintenance'].includes(booking.status)) {
        return;
      }
      
      const bookingFrom = new Date(booking.from_date);
      const bookingTo = new Date(booking.to_date);
      
      bookingFrom.setHours(0, 0, 0, 0);
      bookingTo.setHours(0, 0, 0, 0);
      
      // Check if the booking overlaps with the requested date range
      const overlaps = (checkFrom <= bookingTo && checkTo >= bookingFrom);
      
      if (overlaps) {
        console.log(`⚠️ Conflicting booking found:`, {
          room_id: booking.room_id,
          status: booking.status,
          booking: `${booking.from_date} to ${booking.to_date}`,
          requested: `${params.from_date} to ${params.to_date}`,
          overlaps: true
        });
        conflictingRoomIds.add(booking.room_id);
      }
    });
    
    console.log('🚫 Conflicting room IDs for this date range:', [...conflictingRoomIds]);
    
    // Filter rooms - only exclude if they have a conflicting booking in THIS date range
    const availableRooms = allRooms.filter((room: any) => {
      if (conflictingRoomIds.has(room.id)) {
        console.log(`❌ Room ${room.id} (${room.room_number}) excluded - has booking in this date range`);
        return false;
      }
      console.log(`✅ Room ${room.id} (${room.room_number}) is available for ${params.from_date} to ${params.to_date}`);
      return true;
    });
    
    console.log(`📊 Final available rooms: ${availableRooms.length} out of ${allRooms.length}`);
    
    return availableRooms;
  } catch (error) {
    console.error('❌ Error in getAvailableRoomsCorrectly:', error);
    return [];
  }
};


export const createBooking = async (bookingData: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });
    
    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Error creating room booking:', error);
    throw error;
  }
};

// export const checkRoomAvailability = async (
//   roomId: number | string,
//   fromDate: string,
//   toDate: string
// ): Promise<boolean> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/bookings/check-availability`, {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify({
//         room_id: roomId,
//         from_date: fromDate,
//         to_date: toDate
//       }),
//     });
    
//     const result = await handleResponse(response);
//     return result.data?.available || false;
//   } catch (error) {
//     console.error('Error checking room availability:', error);
//     return false;
//   }
// };

// ===========================================
// CUSTOMER OPERATIONS
// ===========================================


export const checkRoomAvailability = async (
  roomId: number | string,
  fromDate: string,
  toDate: string,
  fromTime = '14:00',
  toTime = '12:00'
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/check-availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        room_id: roomId,
        from_date: fromDate,
        to_date: toDate,
        from_time: fromTime,
        to_time: toTime
      }),
    });
    
    const result = await handleResponse(response);
    
    // Log the result for debugging
    console.log(`🔍 Availability check for room ${roomId} from ${fromDate} ${fromTime} to ${toDate} ${toTime}:`, 
      result.data?.available ? '✅ Available' : '❌ Not Available');
    
    return result.data?.available || false;
  } catch (error) {
    console.error('Error checking room availability:', error);
    return false;
  }
};
export const searchCustomersByPhone = async (phone: string): Promise<any[]> => {
  try {
    if (!phone) {
      return [];
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${API_BASE_URL}/customers/search-by-phone?phone=${encodeURIComponent(cleanPhone)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }

    return [];
    
  } catch (error) {
    console.error('❌ Error in searchCustomersByPhone:', error);
    return [];
  }
};

export const createCustomer = async (customerData: any): Promise<any> => {
  try {
    // Validate required fields
    if (!customerData.name || !customerData.phone) {
      throw new Error('Name and phone are required');
    }
    
    // Standardize phone number
    const cleanPhone = customerData.phone.replace(/\D/g, '');
    const standardPhone = cleanPhone.replace(/^0+/, '');
    
    const cleanedData = {
      name: customerData.name.trim(),
      phone: standardPhone,
      email: customerData.email || null
    };
    
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData),
    });

    // Handle 400 error (usually means customer already exists)
    if (response.status === 400) {
      const errorData = await response.json();
      
      // Try to search for existing customer
      const existingCustomers = await searchCustomersByPhone(standardPhone);
      
      if (existingCustomers.length > 0) {
        return {
          success: true,
          customerId: existingCustomers[0].id,
          message: 'Customer already exists',
          data: existingCustomers[0]
        };
      }
      
      throw new Error(errorData.message || 'Failed to create customer');
    }
    
    // Handle successful response
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('❌ Error in createCustomer:', error);
    throw error;
  }
};

export const searchCustomers = async (query: string): Promise<any[]> => {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    
    const response = await fetch(
      `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    
    const result = await handleResponse(response);
    return result.data || [];
  } catch (error) {
    console.error('❌ Error searching customers:', error);
    return [];
  }
};


// bookingApi.ts
export const blockRoom = async (roomData: any): Promise<any> => {
  try {
    const blockData = {
      roomId: roomData.room_id,
      roomNumber: roomData.room_number,
      fromDate: roomData.from_date,
      toDate: roomData.to_date,
      reason: roomData.special_requests || roomData.reason || 'Room blocked',
      blockedBy: roomData.blockedBy || 'Admin'
    };

    const response = await fetch(`${API_BASE_URL}/bookings/block-room`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(blockData),
    });

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error('❌ Error blocking room:', error);
    throw error;
  }
};


// Add this to your bookingApi.ts file

/**
 * Create a blocked room booking (no charges)
 */
// export const blockRoom = async (roomData: any): Promise<any> => {
//   try {
//     const blockData = {
//       ...roomData,
//       amount: 0,
//       service: 0,
//       gst: 0,
//       total: 0,
//       status: 'blocked',
//       payment_method: 'none',
//       payment_status: 'none'
//     };

//     const response = await fetch(`${API_BASE_URL}/bookings`, {
//       method: 'POST',
//       headers: getAuthHeaders(),
//       body: JSON.stringify(blockData),
//     });

//     const result = await handleResponse(response);
//     return result;
//   } catch (error) {
//     console.error('❌ Error blocking room:', error);
//     throw error;
//   }
// };