// export interface Hotel {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   address: string;
//   gstPercentage: number;
//   serviceChargePercentage: number;
//   adminName: string;
//   username: string;
//   password: string;
//   createdAt: string;
// }

// export interface Room {
//   id: string;
//   hotelId: string;
//   roomNumber: string;
//   roomType: string;
//   floor: number;
//   basePrice: number;
//   amenities: string[];
//   status: 'available' | 'booked' | 'blocked' | 'maintenance';
// }

// export interface Customer {
//   id: string;
//   hotelId: string;
//   name: string;
//   phone: string;
//   email: string;
//   idType: 'pan' | 'aadhaar';
//   idNumber: string;
//   totalBookings: number;
//   createdAt: string;
// }

// export interface Booking {
//   id: string;
//   hotelId: string;
//   roomId: string;
//   customerId: string;
//   customerName: string;
//   customerPhone: string;
//   customerEmail: string;
//   idType: 'pan' | 'aadhaar';
//   idNumber: string;
//   checkInDate: string;
//   checkOutDate: string;
//   baseAmount: number;
//   serviceCharge: number;
//   gst: number;
//   totalAmount: number;
//   status: 'confirmed' | 'cancelled' | 'completed';
//   createdAt: string;
// }

// export interface RoomCalendarDay {
//   date: string;
//   status: 'available' | 'booked' | 'blocked' | 'maintenance';
//   bookingId?: string;
// }


// types/hotel.ts - Updated version
export interface Hotel {
  logo_image: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstPercentage: number;
  serviceChargePercentage: number;
  adminName: string;
  username: string;
  password: string;
  createdAt: string;
  
  // Add these new properties for user management
  role?: string;  // 'admin' or 'staff'
  permissions?: string[]; // Array of permission strings
  hotel_id?: number; // For database users
  hotelName?: string; // Display name
  hotelPlan?: string; // 'basic' or 'pro'
  source?: 'database' | 'google_sheets'; // Where user data comes from
  spreadsheetId?: string; // For Google Sheets users
  token?: string; // JWT token
}

// Add new interfaces for user management
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'receptionist' | 'manager' | 'accountant';
  hotel_id: number;
  permissions: string[];
  created_at: string;
  last_login?: string;
  is_active: boolean;
  token: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

// Keep your existing interfaces...
export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  basePrice: number;
  amenities: string[];
  status: 'available' | 'booked' | 'blocked' | 'maintenance';
}

export interface Customer {
  id: string;
  hotelId: string;
  name: string;
  phone: string;
  email: string;
  idType: 'pan' | 'aadhaar';
  idNumber: string;
  totalBookings: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  idType: 'pan' | 'aadhaar';
  idNumber: string;
  checkInDate: string;
  checkOutDate: string;
  baseAmount: number;
  serviceCharge: number;
  gst: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface RoomCalendarDay {
  date: string;
  status: 'available' | 'booked' | 'blocked' | 'maintenance';
  bookingId?: string;
}

// ===========================================
// 🆕 NEW FUNCTION ROOM TYPES
// ===========================================

export interface FunctionRoom {
  id: number;
  hotel_id: number;
  room_number: string;
  name: string;
  type: 'banquet' | 'conference' | 'meeting' | 'party' | 'wedding' | 'seminar' | 'training' | 'other';
  capacity: number;
  floor: number;
  base_price: number;
  half_day_price: number | null;
  hourly_rate: number | null;
  amenities: string;
  dimensions: string | null;
  area_sqft: number | null;
  has_ac: boolean;
  has_projector: boolean;
  has_sound_system: boolean;
  has_wifi: boolean;
  has_catering: boolean;
  has_parking: boolean;
  has_stage: boolean;
  setup_options: string;
  status: 'available' | 'booked' | 'maintenance' | 'blocked';
  created_at?: string;
  updated_at?: string;
}

export interface FunctionBooking {
  id: number;
  hotel_id: number;
  function_room_id: number;
  customer_id?: number | null;
  booking_reference: string;
  event_name: string;
  event_type: string;
  booking_date: string;
  end_date?: string; // Add this for multi-day bookings
  booking_days?: number; // Add this for multi-day bookings
  start_time: string;
  end_time: string;
  setup_time?: string;
  breakdown_time?: string;
  total_hours: number;
  rate_type: 'full_day' | 'half_day' | 'hourly' | 'multi_day'; // Add multi_day
  rate_amount: number;
  subtotal: number;
  service_charge: number;
  gst_percentage?: number; // ADD THIS - GST percentage used
  gst: number;
  catering_charges: number;
  decoration_charges: number;
  other_charges: number;
  other_charges_description?: string; // ADD THIS
  discount: number;
  discount_type?: 'percentage' | 'fixed'; // ADD THIS
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  guests_expected: number;
  guests_attended?: number;
  payment_method: 'cash' | 'online' | 'cheque' | 'bank_transfer' | 'card';
  payment_status: 'pending' | 'partial' | 'completed' | 'refunded';
  transaction_id?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'rescheduled';
  cancellation_reason?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  special_requests?: string;
  catering_requirements?: string;
  setup_requirements?: string;
  has_room_bookings: boolean;
  room_booking_ids?: string;
  total_rooms_booked: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  
  // Joined fields
  room_name?: string;
  room_number?: string;
  capacity?: number;
  room_bookings?: any[];
  customer_gst?: string;
  billing_address?: string;
  billing_state?: string;
  billing_state_code?: string;
  billing_city?: string;
  billing_pincode?: string;
  business_type?: 'b2c' | 'b2b';
  total_room_amount?: number;
  total_room_gst?: number;
  total_room_gst_percentage?: number;
    total_rooms_blocked: number; 
 
  refund_amount?: number;
  refund_method?: string;
  refund_status?: string;
  refund_processed_at?: string;
  refund_id?: number;
}

export interface FunctionRoomBlock {
  id: number;
  hotel_id: number;
  function_room_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  type: 'maintenance' | 'blocked' | 'private_event';
  created_by?: number;
  created_at?: string;
}