import BlockRoomForm from '@/components/BlockRoomForm';
import MaintenanceForm from '@/components/MaintenanceForm';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bed,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Database,
  Sheet,
  Download,
  Mail,
  FileImage,
  X,
  Eye,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  Bug,
  FileText,
  Clock,
  IndianRupee,
  Wrench,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BookingForm from '@/components/BookingForm';
import { Calendar } from '@/components/ui/calendar';
import QuotationForm from '@/components/QuotationForm';

// URLs
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface Room {
  roomId: string;
  number: string | number;
  type: string;
  floor: string | number;
  price: number;
  status: string;
  amenities: string;
  source?: string;
  maxOccupancy?: number;
  size?: string;
}

interface Booking {
  id: string;
  roomId: string;
  roomNumber: string;
  customerName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  idImage?: string;
  fromDate?: string;
  toDate?: string;
  isAdvanceBooking?: boolean;
  advanceAmount?: number;
  remainingAmount?: number;
  advanceExpiryDate?: string;
  bookingType?: 'regular' | 'advance' | 'maintenance' | 'blocked';
  maintenanceDetails?: {
    type?: string;
    description?: string;
    assignedTo?: string;
    estimatedCost?: number;
    priority?: string;
  };
  special_requests?: string;
}

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

// JSONP fetch for Google Sheets
function jsonpFetch<T>(src: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const callbackName = 'cb_' + String(Date.now()) + String(Math.floor(Math.random() * 10000));

    (window as any)[callbackName] = (data: T) => {
      console.log('📥 JSONP Callback received:', data);
      resolve(data);
      delete (window as any)[callbackName];
      const script = document.getElementById(callbackName);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const script = document.createElement('script');
    script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName + '&_=' + Date.now();
    script.id = callbackName;

    script.onerror = () => {
      console.error('❌ JSONP Script load error');
      reject(new Error('Failed to load script'));
      delete (window as any)[callbackName];
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    script.onload = () => {
      console.log('✅ JSONP Script loaded successfully');
    };

    document.body.appendChild(script);
  });
}

// Backend API fetch
async function fetchBackendData<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
  const token = localStorage.getItem('authToken');
  console.log(`🔍 [BACKEND] Fetching: ${endpoint}`);

  const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ [BACKEND] Response:`, result);
  return result;
}

// Fetch advance bookings from backend
async function fetchAdvanceBookings(): Promise<any[]> {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📦 Advance bookings API response:', result);

    let advanceData = [];
    if (result.success && Array.isArray(result.data)) {
      advanceData = result.data;
    } else if (Array.isArray(result)) {
      advanceData = result;
    } else if (result.data && Array.isArray(result.data)) {
      advanceData = result.data;
    }

    return advanceData.map(ab => ({
      ...ab,
      isAdvanceBooking: true,
      bookingType: 'advance'
    }));
  } catch (error) {
    console.error('Error fetching advance bookings:', error);
    return [];
  }
}

const RoomBooking = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [advanceBookings, setAdvanceBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingMode, setBookingMode] = useState<'book' | 'block' | 'maintenance'>('book');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationRoom, setQuotationRoom] = useState<Room | null>(null);
  const [quotationDateRange, setQuotationDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 1))
  });

  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [selectedAdvanceForBooking, setSelectedAdvanceForBooking] = useState<Booking | null>(null);

  // Calendar states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 1))
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('grid');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [roomViewMode, setRoomViewMode] = useState<'minimal' | 'detailed'>('minimal');
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState<boolean>(false);

  const [availabilityData, setAvailabilityData] = useState<{
    availableCount: number;
    bookedCount: number;
    advanceBookedCount: number;
    maintenanceCount: number;
    blockedCount: number;
    totalCount: number;
    availableRooms: Room[];
  }>({
    availableCount: 0,
    bookedCount: 0,
    advanceBookedCount: 0,
    maintenanceCount: 0,
    blockedCount: 0,
    totalCount: 0,
    availableRooms: []
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userSource = currentUser?.source;
  const userPlan = currentUser?.plan;

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  console.log('👤 Current User:', {
    source: userSource,
    plan: userPlan,
    spreadsheetId: currentUser?.spreadsheetId,
    hotelName: currentUser?.hotelName
  });

  // Helper function to format date as YYYY-MM-DD with error handling
  const formatDate = (date: Date | string): string => {
    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
          const parts = date.split(/[-/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else {
            console.warn('Invalid date format:', date);
            return '1970-01-01';
          }
        } else {
          dateObj = parsed;
        }
      } else {
        console.warn('Invalid date input:', date);
        return '1970-01-01';
      }

      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date object:', date);
        return '1970-01-01';
      }

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', date);
      return '1970-01-01';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const formatBookingId = (id: string | number): string => {
    const idStr = typeof id === 'string' ? id : String(id);
    return idStr.length > 8 ? `${idStr.slice(0, 8)}...` : idStr;
  };

  const isDateBooked = (date: Date, checkIn: string, checkOut: string, booking?: any): boolean => {
    try {
      const targetDate = formatDate(date);
      const fromDate = formatDate(new Date(checkIn));
      const toDate = formatDate(new Date(checkOut));

      if (fromDate === toDate) {
        return targetDate === fromDate;
      }

      return targetDate >= fromDate && targetDate <= toDate;
    } catch (error) {
      console.error('❌ Date comparison error:', error);
      return false;
    }
  };

  // Helper function to check if room has advance booking for selected date
  const getAdvanceBookingForRoom = (room: Room, date: Date): Booking | null => {
    const roomBookings = bookings.filter(booking => {
      const isMatch =
        booking.roomId === room.roomId ||
        booking.roomNumber === room.number.toString() ||
        booking.roomNumber === room.roomId ||
        String(booking.roomNumber) === String(room.number);

      if (!isMatch) return false;

      if (!booking.isAdvanceBooking) return false;

      if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;

      return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
    });

    return roomBookings.length > 0 ? roomBookings[0] : null;
  };

  const calculateAvailability = (date: Date | DateRange) => {
    try {
      console.log('📊 Calculating availability...');
      console.log('Rooms count:', rooms.length);
      console.log('Bookings count:', bookings.length);

      let checkDate: string;
      let checkDateEnd: string | undefined;

      if (date instanceof Date) {
        checkDate = formatDate(date);
        console.log('Single date check:', checkDate);
      } else {
        checkDate = date.from ? formatDate(date.from) : formatDate(new Date());
        checkDateEnd = date.to ? formatDate(date.to) : checkDate;
        console.log('Date range check:', checkDate, 'to', checkDateEnd);
      }

      let advanceBookedCount = 0;
      let maintenanceCount = 0;
      let blockedCount = 0;
      let regularBookedCount = 0;

      const bookedRooms = new Set<string>();

      rooms.forEach(room => {
        const roomBookings = bookings.filter(booking => {
          let isMatch = false;

          if (userSource === 'google_sheets') {
            isMatch =
              booking.roomId === room.roomId ||
              booking.roomNumber === room.number.toString() ||
              booking.roomNumber === room.roomId ||
              String(booking.roomNumber) === String(room.number);
          } else {
            isMatch =
              booking.roomId === room.roomId ||
              booking.roomNumber === room.number.toString() ||
              booking.roomNumber === room.roomId;
          }

          return isMatch;
        });

        const hasBooking = roomBookings.some(booking => {
          const isBookedStatus = booking.status && (
            booking.status.toLowerCase() === 'booked' ||
            booking.status.toLowerCase() === 'maintenance' ||
            booking.status.toLowerCase() === 'blocked' ||
            (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
          );

          if (!isBookedStatus) {
            return false;
          }

          try {
            const checkInDate = booking.checkIn || booking.fromDate;
            const checkOutDate = booking.checkOut || booking.toDate;

            if (!checkInDate || !checkOutDate) {
              return false;
            }

            return isDateBooked(selectedDate, checkInDate, checkOutDate, booking);
          } catch (error) {
            console.error(`❌ Error checking booking ${booking.id}:`, error);
            return false;
          }
        });
        if (hasBooking) {
          bookedRooms.add(room.roomId);
        }
      });

      console.log(`📊 Found ${bookedRooms.size} rooms with bookings on ${checkDate}`);

      bookedRooms.forEach(roomId => {
        const room = rooms.find(r => r.roomId === roomId);
        if (!room) return;

        const roomBookingsForDate = bookings.filter(booking => {
          let isMatch = false;

          if (userSource === 'google_sheets') {
            isMatch =
              booking.roomId === room.roomId ||
              booking.roomNumber === room.number.toString() ||
              booking.roomNumber === room.roomId ||
              String(booking.roomNumber) === String(room.number);
          } else {
            isMatch =
              booking.roomId === room.roomId ||
              booking.roomNumber === room.number.toString() ||
              booking.roomNumber === room.roomId;
          }

          if (!isMatch) return false;

          const isBookedStatus = booking.status && (
            booking.status.toLowerCase() === 'booked' ||
            booking.status.toLowerCase() === 'maintenance' ||
            booking.status.toLowerCase() === 'blocked' ||
            (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
          );

          if (!isBookedStatus) return false;

          try {
            const checkInDate = booking.checkIn || booking.fromDate;
            const checkOutDate = booking.checkOut || booking.toDate;

            if (!checkInDate || !checkOutDate) return false;

            const bookingFrom = formatDate(new Date(checkInDate));
            const bookingTo = formatDate(new Date(checkOutDate));

            return checkDate >= bookingFrom && checkDate <= bookingTo;
          } catch (error) {
            return false;
          }
        });

        const hasMaintenance = roomBookingsForDate.some(b => b.status.toLowerCase() === 'maintenance');
        const hasBlocked = !hasMaintenance && roomBookingsForDate.some(b => b.status.toLowerCase() === 'blocked');
        const hasAdvance = !hasMaintenance && !hasBlocked && roomBookingsForDate.some(b => b.isAdvanceBooking);

        if (hasMaintenance) {
          maintenanceCount++;
        } else if (hasBlocked) {
          blockedCount++;
        } else if (hasAdvance) {
          advanceBookedCount++;
        } else {
          regularBookedCount++;
        }
      });

      const availableRooms = rooms.filter(room => !bookedRooms.has(room.roomId));
      const availableCount = availableRooms.length;
      const bookedCount = bookedRooms.size;

      console.log('📈 Availability stats:', {
        totalRooms: rooms.length,
        availableCount: availableCount,
        bookedCount: bookedCount,
        regularBookedCount: regularBookedCount,
        advanceBookedCount: advanceBookedCount,
        maintenanceCount: maintenanceCount,
        blockedCount: blockedCount,
        checkDate: checkDate,
        availableRooms: availableRooms.map(r => r.number)
      });

      setAvailabilityData({
        availableCount: availableCount,
        bookedCount: regularBookedCount,
        advanceBookedCount: advanceBookedCount,
        maintenanceCount: maintenanceCount,
        blockedCount: blockedCount,
        totalCount: rooms.length,
        availableRooms: availableRooms
      });

    } catch (error) {
      console.error('❌ Availability calculation error:', error);
      setAvailabilityData({
        availableCount: rooms.length,
        bookedCount: 0,
        advanceBookedCount: 0,
        maintenanceCount: 0,
        blockedCount: 0,
        totalCount: rooms.length,
        availableRooms: rooms
      });
    }
  };

  const testGoogleSheetsConnection = async (spreadsheetId: string): Promise<boolean> => {
    try {
      console.log('🔗 Testing Google Sheets connection...');
      const testUrl = `${APPS_SCRIPT_URL}?action=test&spreadsheetid=${encodeURIComponent(spreadsheetId)}`;
      const result = await jsonpFetch<any>(testUrl);
      console.log('✅ Google Sheets test result:', result);
      return result.success !== false;
    } catch (error) {
      console.error('❌ Google Sheets connection test failed:', error);
      return false;
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let roomsData: Room[] = [];
      let bookingsData: any[] = [];

      console.log('🔄 Starting data fetch...');
      console.log('User source:', userSource);
      console.log('User plan:', userPlan);

      if (userSource === 'database' || userPlan === 'pro') {
        console.log('📊 Fetching from database backend...');

        try {
          const bookingsRes = await fetchBackendData<{ success: boolean; data: any[] }>('/bookings');
          bookingsData = bookingsRes.data || [];
          console.log('✅ Database bookings loaded:', bookingsData.length);
        } catch (error) {
          console.error('❌ Error fetching database bookings:', error);
          bookingsData = [];
        }

        try {
          const advanceBookingsData = await fetchAdvanceBookings();
          console.log('✅ Advance bookings loaded:', advanceBookingsData.length);

          const transformedAdvanceBookings = advanceBookingsData.map((ab: any) => {
            const roomNumber = ab.room_number || ab.roomNumber || '';

            return {
              id: `adv-${ab.id}`,
              roomId: ab.room_id?.toString() || ab.roomId?.toString() || '',
              roomNumber: roomNumber,
              customerName: ab.customer_name || ab.customerName || '',
              checkIn: ab.from_date || ab.fromDate || '',
              checkOut: ab.to_date || ab.toDate || '',
              status: ab.status || 'pending',
              totalAmount: Number(ab.total) || 0,
              paymentStatus: ab.payment_status || ab.paymentStatus || 'pending',
              idImage: ab.id_image || ab.idImage || null,
              isAdvanceBooking: true,
              bookingType: 'advance',
              advanceAmount: Number(ab.advance_amount) || 0,
              remainingAmount: Number(ab.remaining_amount) || 0,
              advanceExpiryDate: ab.advance_expiry_date || ab.advanceExpiryDate || null,
              fromDate: ab.from_date || ab.fromDate,
              toDate: ab.to_date || ab.toDate,
            };
          });

          bookingsData = [...bookingsData, ...transformedAdvanceBookings];
        } catch (error) {
          console.error('❌ Error fetching advance bookings:', error);
        }

        try {
          const roomsRes = await fetchBackendData<{ success: boolean; data: any[] }>('/rooms');

          if (roomsRes.success && roomsRes.data) {
            roomsData = roomsRes.data.map((room: any) => {
              const now = new Date();
              const todayStr = formatDate(now);

              const roomBookings = bookingsData.filter(
                (booking: any) => {
                  return booking.room_id === room.id ||
                    booking.room_id === room.room_number ||
                    booking.room_number === room.room_number;
                }
              );

              const isBookedToday = roomBookings.some((booking: any) => {
                if (booking.is_advance_booking) {
                  if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
                } else {
                  if (booking.status !== 'booked' &&
                    booking.status !== 'maintenance' &&
                    booking.status !== 'blocked') return false;
                }

                try {
                  const bookingFrom = formatDate(new Date(booking.from_date || booking.checkIn));
                  const bookingTo = formatDate(new Date(booking.to_date || booking.checkOut));
                  return todayStr >= bookingFrom && todayStr <= bookingTo;
                } catch (error) {
                  return false;
                }
              });

              return {
                roomId: room.id?.toString() || room.room_id?.toString() || `db-${room.room_number}`,
                number: room.room_number || room.number || 'Unknown',
                type: room.type || 'Standard',
                floor: room.floor || 1,
                price: Number(room.price) || 0,
                status: isBookedToday ? 'booked' : 'available',
                amenities: room.amenities || '',
                source: 'database',
                maxOccupancy: room.max_occupancy || room.maxOccupancy || 2,
                size: room.size || 'Standard',
              };
            });
            console.log('✅ Database rooms processed:', roomsData.length);
          }
        } catch (error) {
          console.error('❌ Error fetching database rooms:', error);
          roomsData = [];
        }
      } else {
        // Google Sheets user code (keep your existing code)
        console.log('📊 Fetching from Google Sheets...');
        // ... your existing Google Sheets code ...
      }

      const transformedBookings: Booking[] = bookingsData.map((booking: any, index: number) => {
        const normalizedBooking: any = {};
        Object.keys(booking).forEach(k => {
          if (k && typeof k === 'string') {
            const normalizedKey = k.trim().toLowerCase().replace(/\s+/g, '_');
            normalizedBooking[normalizedKey] = booking[k];
          }
        });

        const rawStatus = booking.status || normalizedBooking.status;
        const statusLower = rawStatus ? String(rawStatus).toLowerCase() : 'booked';

        const isMaintenance = statusLower === 'maintenance';
        const isBlocked = statusLower === 'blocked';
        const isAdvance = booking.isAdvanceBooking === true ||
          booking.is_advance_booking === true ||
          booking.bookingType === 'advance' ||
          normalizedBooking.is_advance_booking === 'true' ||
          normalizedBooking.is_advance === 'true';

        let bookingType: 'regular' | 'advance' | 'maintenance' | 'blocked' = 'regular';
        if (isAdvance) bookingType = 'advance';
        else if (isMaintenance) bookingType = 'maintenance';
        else if (isBlocked) bookingType = 'blocked';

        let roomNumber = '';
        const possibleRoomFields = [
          'room_number', 'roomnumber', 'room', 'roomno', 'room_no',
          'room_id', 'roomid', 'room_number', 'room_number'
        ];

        for (const field of possibleRoomFields) {
          if (normalizedBooking[field] && normalizedBooking[field] !== '') {
            roomNumber = String(normalizedBooking[field]);
            break;
          }
        }

        const roomId = normalizedBooking.room_id || normalizedBooking.roomid || roomNumber || `room-${index}`;
        const checkInDate = normalizedBooking.from_date || normalizedBooking.checkin || normalizedBooking.start_date || normalizedBooking.fromdate || booking.checkIn;
        const checkOutDate = normalizedBooking.to_date || normalizedBooking.checkout || normalizedBooking.end_date || normalizedBooking.todate || booking.checkOut;

        return {
          id: normalizedBooking.id || normalizedBooking.bookingid || booking.id || `booking-${Date.now()}-${index}`,
          roomId: roomId,
          roomNumber: roomNumber || 'Unknown',
          customerName: normalizedBooking.customer_name || normalizedBooking.customername || normalizedBooking.customer || booking.customerName || (isBlocked ? 'System Block' : 'N/A'),
          checkIn: checkInDate || new Date().toISOString(),
          checkOut: checkOutDate || new Date().toISOString(),
          status: statusLower,
          totalAmount: Number(normalizedBooking.total) || Number(normalizedBooking.amount) || Number(booking.totalAmount) || 0,
          paymentStatus: normalizedBooking.payment_status || normalizedBooking.paymentstatus || booking.paymentStatus || (isBlocked ? 'none' : 'pending'),
          idImage: normalizedBooking.id_image || normalizedBooking.idimage || booking.idImage || null,
          isAdvanceBooking: isAdvance,
          advanceAmount: Number(normalizedBooking.advance_amount) || Number(booking.advanceAmount) || 0,
          remainingAmount: Number(normalizedBooking.remaining_amount) || Number(booking.remainingAmount) || 0,
          advanceExpiryDate: normalizedBooking.advance_expiry_date || booking.advanceExpiryDate || null,
          bookingType: bookingType,
          fromDate: normalizedBooking.from_date,
          toDate: normalizedBooking.to_date
        };
      });

      setRooms(roomsData);
      setBookings(transformedBookings);

      calculateAvailability(new Date());

      if (roomsData.length > 0) {
        const advanceCount = transformedBookings.filter(b => b.isAdvanceBooking).length;
        const maintenanceCount = transformedBookings.filter(b => b.status === 'maintenance').length;
        const blockedCount = transformedBookings.filter(b => b.status === 'blocked').length;
        toast({
          title: "Data Loaded",
          description: `Loaded ${roomsData.length} rooms, ${transformedBookings.length} bookings (${advanceCount} advance, ${maintenanceCount} maintenance, ${blockedCount} blocked)`,
        });
      } else {
        toast({
          title: "No Rooms Found",
          description: "No rooms available in the system. Please add rooms to continue.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('❌ Error in fetchRooms:', error);
      toast({
        title: "Error Loading Data",
        description: error.message || "Failed to load room data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleBookingStatusChange = (event) => {
      console.log('🔄 Booking status changed, refreshing rooms data...', event.detail);
      fetchRooms();
    };

    window.addEventListener('booking-status-changed', handleBookingStatusChange);

    return () => {
      window.removeEventListener('booking-status-changed', handleBookingStatusChange);
    };
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [userSource, userPlan]);

  useEffect(() => {
    if (rooms.length > 0 && bookings.length > 0) {
      console.log('🔄 Recalculating availability...');
      calculateAvailability(selectedDate);
    }
  }, [rooms, bookings, selectedDate]);

  const filteredRooms = rooms.filter(room =>
    String(room.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(room.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(room.floor).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      calculateAvailability(date);
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange(range);
      calculateAvailability(range);
    }
  };

  const handleQuickAction = async (room: Room, mode: 'book' | 'block' | 'maintenance') => {
    const roomWithId = {
      ...room,
      roomId: room.roomId || `R-${room.number}`
    };

    const roomBookings = bookings.filter(booking =>
      booking.roomId === room.roomId ||
      booking.roomNumber === room.number.toString()
    );

    let isAvailable = true;
    let conflictMessage = '';
    let conflictType = '';

    if (mode === 'book') {
      const conflictingBooking = roomBookings.find(booking => {
        const isBookedStatus = booking.status && (
          booking.status.toLowerCase() === 'booked' ||
          booking.status.toLowerCase() === 'maintenance' ||
          booking.status.toLowerCase() === 'blocked' ||
          (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
        );

        if (!isBookedStatus) return false;

        return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
      });

      if (conflictingBooking) {
        isAvailable = false;

        if (conflictingBooking.status === 'maintenance') {
          conflictType = 'maintenance';
          conflictMessage = `Room ${room.number} is under maintenance for ${selectedDate.toLocaleDateString()}`;
        } else if (conflictingBooking.status === 'blocked') {
          conflictType = 'blocked';
          conflictMessage = `Room ${room.number} is blocked for ${selectedDate.toLocaleDateString()}`;
        } else if (conflictingBooking.isAdvanceBooking) {
          conflictType = 'advance';
          conflictMessage = `Room ${room.number} is advance booked for ${selectedDate.toLocaleDateString()}. Advance paid: ₹${conflictingBooking.advanceAmount}`;
        } else {
          conflictType = 'regular';
          conflictMessage = `Room ${room.number} is already booked for ${selectedDate.toLocaleDateString()}`;
        }
      }
    }

    if (!isAvailable) {
      toast({
        title: "Room Not Available",
        description: conflictMessage,
        variant: "destructive"
      });
      return;
    }

    setSelectedRoom(roomWithId);
    setBookingMode(mode);

    if (mode === 'book') {
      setShowBookingForm(true);
    } else if (mode === 'block') {
      setShowBlockForm(true);
    } else if (mode === 'maintenance') {
      setShowMaintenanceForm(true);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleViewID = (imageData: string) => {
    setShowImagePreview(imageData);
  };

  const handleSendReceipt = async (booking: Booking) => {
    try {
      toast({
        title: "Receipt Sent",
        description: "Booking receipt has been sent successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send receipt",
        variant: "destructive"
      });
    }
  };

  const handleDownloadReceipt = (booking: Booking) => {
    let receiptContent = `
      HOTEL BOOKING RECEIPT
      -----------------------
      Booking ID: ${booking.id}
      Room: ${booking.roomNumber}
      Customer: ${booking.customerName}
      Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
      Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
      Status: ${booking.status}
      Total Amount: ₹${booking.totalAmount}
      Payment Status: ${booking.paymentStatus}
    `;

    if (booking.isAdvanceBooking) {
      receiptContent += `\n      Advance Paid: ₹${booking.advanceAmount}\n      Remaining: ₹${booking.remainingAmount}`;
    }

    if (booking.status === 'maintenance' && booking.maintenanceDetails) {
      receiptContent += `\n      Maintenance: ${booking.maintenanceDetails.type || 'General'}\n      Description: ${booking.maintenanceDetails.description || ''}`;
    }

    if (booking.status === 'blocked') {
      receiptContent += `\n      Blocked Room - No Customer`;
    }

    receiptContent += `\n      -----------------------
      Thank you for your booking!
      Date: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Booking receipt has been downloaded"
    });
  };

  const getStatusBadge = (status: string, bookingType?: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      available: { label: 'Available', class: 'bg-green-100 text-green-800 border-green-200' },
      booked: { label: 'Booked', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      maintenance: { label: 'Maintenance', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      blocked: { label: 'Blocked', class: 'bg-gray-100 text-gray-800 border-gray-200' },
      pending: { label: 'Advance Pending', class: 'bg-orange-100 text-orange-800 border-orange-200' },
      confirmed: { label: 'Advance Confirmed', class: 'bg-purple-100 text-purple-800 border-purple-200' },
      converted: { label: 'Converted', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      expired: { label: 'Expired', class: 'bg-gray-100 text-gray-800 border-gray-200' },
      cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' }
    };

    if (bookingType === 'advance') {
      const advanceConfig = statusConfig[status.toLowerCase()] ||
        { label: `Advance ${status}`, class: 'bg-purple-100 text-purple-800 border-purple-200' };
      return (
        <Badge variant="outline" className={advanceConfig.class}>
          {advanceConfig.label}
        </Badge>
      );
    }

    const config = statusConfig[status.toLowerCase()] ||
      { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
      <Badge variant="outline" className={config.class}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const paymentConfig: Record<string, { label: string; class: string }> = {
      completed: { label: 'Paid', class: 'bg-green-100 text-green-800 border-green-200' },
      pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      failed: { label: 'Failed', class: 'bg-red-100 text-red-800 border-red-200' },
      paid: { label: 'Paid', class: 'bg-green-100 text-green-800 border-green-200' },
      partial: { label: 'Partial', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      none: { label: 'None', class: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

    const config = paymentConfig[status.toLowerCase()] ||
      { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
      <Badge variant="outline" className={config.class}>
        {config.label}
      </Badge>
    );
  };

  const getDayClassName = (date: Date): string => {
    const dateStr = formatDate(date);

    const dayBookings = bookings.filter(booking => {
      const isBookedStatus = booking.status && (
        booking.status.toLowerCase() === 'booked' ||
        booking.status.toLowerCase() === 'maintenance' ||
        booking.status.toLowerCase() === 'blocked' ||
        (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
      );

      if (!isBookedStatus) return false;
      return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
    });

    const hasAdvanceBookings = dayBookings.some(b => b.isAdvanceBooking);
    const hasMaintenance = dayBookings.some(b => b.status === 'maintenance');
    const hasBlocked = dayBookings.some(b => b.status === 'blocked');
    const bookedCount = dayBookings.length;
    const totalRooms = rooms.length || 1;
    const availabilityPercentage = ((totalRooms - bookedCount) / totalRooms) * 100;

    if (hasMaintenance) {
      return 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200';
    } else if (hasBlocked) {
      return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
    } else if (hasAdvanceBookings) {
      return 'bg-purple-100 text-purple-900 hover:bg-purple-200';
    } else if (availabilityPercentage >= 70) {
      return 'bg-green-100 text-green-900 hover:bg-green-200';
    } else if (availabilityPercentage >= 40) {
      return 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200';
    } else {
      return 'bg-red-100 text-red-900 hover:bg-red-200';
    }
  };


  // Add this function after handleDownloadReceipt or before the return statement
  // In RoomBooking.tsx - Update the handleConvertAndBook function
  const handleConvertAndBook = (room: Room, advanceBooking: any) => {
    console.log('🔄 Converting advance booking from room view:', advanceBooking);
    console.log('🔄 Room object:', room);

    // Show loading toast
    toast({
      title: "Loading",
      description: "Fetching advance booking details...",
    });

    // Fetch the full advance booking details from backend
    const fetchFullAdvanceBooking = async () => {
      try {
        const token = localStorage.getItem('authToken');
        // Extract the actual ID from the composite ID (remove 'adv-' prefix)
        let bookingId = advanceBooking.id;
        if (typeof bookingId === 'string' && bookingId.startsWith('adv-')) {
          bookingId = bookingId.replace('adv-', '');
        }

        console.log('🔍 Fetching advance booking details for ID:', bookingId);

        const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Full advance booking details fetched:', result.data);

        if (result.success && result.data) {
          console.log('📦 Setting selectedAdvanceForBooking with:', result.data);
          setSelectedAdvanceForBooking(result.data);
          setSelectedRoom(room);
          setDateRange({
            from: new Date(result.data.from_date || result.data.checkIn || advanceBooking.checkIn),
            to: new Date(result.data.to_date || result.data.checkOut || advanceBooking.checkOut)
          });

          // Small delay to ensure state updates before opening form
          setTimeout(() => {
            console.log('📦 Opening booking form with data:', result.data);
            setShowBookingForm(true);
          }, 100);

          toast({
            title: "✅ Advance Booking Loaded",
            description: `Details loaded for ${result.data.customer_name || result.data.customerName}`,
          });
        } else {
          throw new Error(result.message || 'Failed to fetch advance booking details');
        }
      } catch (error) {
        console.error('❌ Error fetching advance booking:', error);
        toast({
          title: "Error",
          description: "Failed to fetch advance booking details. Using local data.",
          variant: "destructive"
        });

        // Fallback: use the local advance booking data
        console.log('📦 Using fallback data:', advanceBooking);
        setSelectedAdvanceForBooking(advanceBooking);
        setSelectedRoom(room);
        setDateRange({
          from: new Date(advanceBooking.checkIn || advanceBooking.from_date),
          to: new Date(advanceBooking.checkOut || advanceBooking.to_date)
        });

        setTimeout(() => {
          setShowBookingForm(true);
        }, 100);
      }
    };

    fetchFullAdvanceBooking();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">Room Booking System</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {loading ? 'Loading data...' :
                `${rooms.length} rooms • ${bookings.length} bookings • ${bookings.filter(b => b.isAdvanceBooking).length} advance • ${bookings.filter(b => b.status === 'maintenance').length} maintenance • ${bookings.filter(b => b.status === 'blocked').length} blocked`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                console.log('🔍 DEBUG INFO:');
                console.log('Total bookings:', bookings.length);
                console.log('By status:', {
                  booked: bookings.filter(b => b.status === 'booked').length,
                  maintenance: bookings.filter(b => b.status === 'maintenance').length,
                  blocked: bookings.filter(b => b.status === 'blocked').length,
                  advance: bookings.filter(b => b.isAdvanceBooking).length
                });
                console.log('Selected date:', selectedDate.toLocaleDateString());
                console.log('Selected date formatted:', formatDate(selectedDate));

                bookings.forEach(b => {
                  const isForDate = isDateBooked(selectedDate, b.checkIn, b.checkOut, b);
                  if (isForDate) {
                    console.log(`✅ Booking ${b.id} (${b.status}) affects ${selectedDate.toLocaleDateString()}`);
                  }
                });
              }}
              variant="outline"
              size="sm"
            >
              Debug
            </Button>
            <Button onClick={fetchRooms} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error/Warning Messages */}
        {!loading && rooms.length === 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">No Rooms Found</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {userSource === 'google_sheets'
                      ? 'Your Google Sheets spreadsheet has no rooms defined or there was an error loading them. Please check your spreadsheet and ensure it has a "Rooms" sheet with room data.'
                      : 'No rooms available in the database. Please contact your administrator to add rooms.'}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      onClick={() => window.open('https://docs.google.com/spreadsheets', '_blank')}
                    >
                      Open Google Sheets
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      onClick={fetchRooms}
                    >
                      Retry Loading
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability Summary Card - Collapsible */}
        {rooms.length > 0 && (
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Room Availability
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isAvailabilityExpanded ? '▼' : '▶'}
                </Button>
              </div>
            </CardHeader>

            {isAvailabilityExpanded && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Calendar Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Select Date</h3>
                      <Badge variant="outline" className="bg-blue-50">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </Badge>
                    </div>

                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border"
                      modifiers={{
                        booked: (date) => {
                          return bookings.some(booking => {
                            const isBookedStatus = booking.status && (
                              booking.status.toLowerCase() === 'booked' ||
                              booking.status.toLowerCase() === 'maintenance' ||
                              booking.status.toLowerCase() === 'blocked' ||
                              (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
                            );
                            if (!isBookedStatus) return false;
                            return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                          });
                        },
                        advanceBooked: (date) => {
                          return bookings.some(booking => {
                            if (!booking.isAdvanceBooking) return false;
                            const isBookedStatus = booking.status &&
                              (booking.status === 'confirmed' || booking.status === 'pending');
                            if (!isBookedStatus) return false;
                            return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                          });
                        },
                        maintenance: (date) => {
                          return bookings.some(booking => {
                            if (booking.status !== 'maintenance') return false;
                            return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                          });
                        },
                        blocked: (date) => {
                          return bookings.some(booking => {
                            if (booking.status !== 'blocked') return false;
                            return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                          });
                        }
                      }}
                      modifiersClassNames={{
                        booked: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-red-500",
                        advanceBooked: "bg-purple-100 text-purple-900 font-semibold",
                        maintenance: "bg-yellow-100 text-yellow-900 font-semibold",
                        blocked: "bg-gray-100 text-gray-900 font-semibold border border-gray-400"
                      }}
                    />

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">



                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-100 rounded"></div>
                        <span>Advance Booked</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-100 rounded border border-yellow-300"></div>
                        <span>Maintenance</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-100 rounded border border-gray-400"></div>
                        <span>Blocked</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Stats */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Availability Stats</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-700">Available Rooms</p>
                              <p className="text-2xl font-bold text-green-900">
                                {availabilityData.availableCount > 0 ? availabilityData.availableCount : 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                              <Bed className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{
                                  width: `${Math.max(
                                    (availabilityData.availableCount / Math.max(availabilityData.totalCount, 1)) * 100,
                                    0
                                  )}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-purple-700">Advance Booked</p>
                              <p className="text-2xl font-bold text-purple-900">
                                {availabilityData.advanceBookedCount > 0 ? availabilityData.advanceBookedCount : 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                              <Clock className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{
                                  width: `${Math.max(
                                    ((availabilityData.advanceBookedCount || 0) / Math.max(availabilityData.totalCount, 1)) * 100,
                                    0
                                  )}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-yellow-700">Maintenance</p>
                              <p className="text-2xl font-bold text-yellow-900">
                                {availabilityData.maintenanceCount > 0 ? availabilityData.maintenanceCount : 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                              <Wrench className="h-6 w-6 text-yellow-600" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{
                                  width: `${Math.max(
                                    ((availabilityData.maintenanceCount || 0) / Math.max(availabilityData.totalCount, 1)) * 100,
                                    0
                                  )}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-700">Blocked Rooms</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {availabilityData.blockedCount > 0 ? availabilityData.blockedCount : 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <Eye className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-500 rounded-full"
                                style={{
                                  width: `${Math.max(
                                    ((availabilityData.blockedCount || 0) / Math.max(availabilityData.totalCount, 1)) * 100,
                                    0
                                  )}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-700">Booked Rooms</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {availabilityData.bookedCount > 0 ? availabilityData.bookedCount : 0}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <CalendarIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.max(
                                    (availabilityData.bookedCount / Math.max(availabilityData.totalCount, 1)) * 100,
                                    0
                                  )}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* <Button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'calendar' : 'grid')}
                      variant="outline"
                      className="w-full"
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {viewMode === 'grid' ? 'Switch to Calendar View' : 'Switch to Grid View'}
                    </Button> */}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {/* <TabsList className="inline-flex w-full min-w-[200px] sm:grid sm:grid-cols-2 gap-1 bg-transparent sm:bg-muted p-1">
              <TabsTrigger
                value="rooms"
                className={`
                  flex items-center justify-center gap-2 px-4 py-2 text-sm
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-sm
                  data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
                  hover:bg-gray-200 transition-all duration-200
                  rounded-md whitespace-nowrap
                `}
              >
                <Bed className="h-4 w-4" />
                <span>Rooms ({rooms.length})</span>

                {/* View toggle buttons *
                <div className="flex gap-1 ml-2 bg-gray-100 p-0.5 rounded-lg">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomViewMode('minimal');
                    }}
                    size="sm"
                    className={`
                      text-[10px] sm:text-xs h-6 px-2 rounded-md transition-all font-medium
                      ${roomViewMode === 'minimal'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    Mini
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomViewMode('detailed');
                    }}
                    size="sm"
                    className={`
                      text-[10px] sm:text-xs h-6 px-2 rounded-md transition-all font-medium
                      ${roomViewMode === 'detailed'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    Detail
                  </Button>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="bookings"
                className={`
                  flex items-center justify-center gap-2 px-4 py-2 text-sm
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-sm
                  data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
                  hover:bg-gray-200 transition-all duration-200
                  rounded-md whitespace-nowrap
                `}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Bookings ({bookings.length})</span>
              </TabsTrigger>
            </TabsList> */}

            <TabsList className="inline-flex w-full min-w-[200px] sm:grid sm:grid-cols-2 gap-1 bg-transparent sm:bg-muted p-1">
              <TabsTrigger
                value="rooms"
                className={`
      flex items-center justify-center gap-2 px-4 py-2 text-sm
      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
      data-[state=active]:shadow-sm
      data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
      hover:bg-gray-200 transition-all duration-200
      rounded-md whitespace-nowrap
    `}
              >
                <Bed className="h-4 w-4" />
                <span>Rooms ({rooms.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="bookings"
                className={`
      flex items-center justify-center gap-2 px-4 py-2 text-sm
      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
      data-[state=active]:shadow-sm
      data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
      hover:bg-gray-200 transition-all duration-200
      rounded-md whitespace-nowrap
    `}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Bookings ({bookings.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            {rooms.length > 0 ? (
              <>
                {/* Search */}
                {/* <Card>
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search rooms by number, type, or floor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card> */}

                {/* Search and View Toggle */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search rooms by number, type, or floor..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Grid/Calendar View Toggle */}
                      <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                        <Button
                          onClick={() => setViewMode('grid')}
                          size="sm"
                          className={`
            text-xs h-8 px-3 rounded-md transition-all font-medium
            ${viewMode === 'grid'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-transparent text-gray-600 hover:bg-gray-200'
                            }
          `}
                        >
                          <Bed className="h-3 w-3 mr-1" />
                          Grid
                        </Button>
                        <Button
                          onClick={() => setViewMode('calendar')}
                          size="sm"
                          className={`
            text-xs h-8 px-3 rounded-md transition-all font-medium
            ${viewMode === 'calendar'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-transparent text-gray-600 hover:bg-gray-200'
                            }
          `}
                        >
                          <CalendarDays className="h-3 w-3 mr-1" />
                          Calendar
                        </Button>
                      </div>

                      {/* Mini/Detail View Toggle (only shows when in grid mode) */}
                      {viewMode === 'grid' && (
                        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                          <Button
                            onClick={() => setRoomViewMode('minimal')}
                            size="sm"
                            className={`
              text-xs h-8 px-3 rounded-md transition-all font-medium
              ${roomViewMode === 'minimal'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-transparent text-gray-600 hover:bg-gray-200'
                              }
            `}
                          >
                            Mini
                          </Button>
                          <Button
                            onClick={() => setRoomViewMode('detailed')}
                            size="sm"
                            className={`
              text-xs h-8 px-3 rounded-md transition-all font-medium
              ${roomViewMode === 'detailed'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-transparent text-gray-600 hover:bg-gray-200'
                              }
            `}
                          >
                            Detail
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* View Mode Content */}
                {viewMode === 'grid' ? (
                  loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading rooms...</span>
                    </div>
                  ) : (
                    <>
                      {roomViewMode === 'minimal' ? (
                        /* MINIMALIST VIEW */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                          {filteredRooms.map((room) => {
                            // Find all bookings for this room
                            const roomBookings = bookings.filter(booking => {
                              const isMatch =
                                booking.roomId === room.roomId ||
                                booking.roomNumber === room.number.toString() ||
                                booking.roomNumber === room.roomId ||
                                String(booking.roomNumber) === String(room.number);
                              return isMatch;
                            });

                            // Check each booking type
                            const isMaintenance = roomBookings.some(booking => {
                              const isMaintenanceBooking = booking.status === 'maintenance';
                              if (!isMaintenanceBooking) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isBlocked = !isMaintenance && roomBookings.some(booking => {
                              const isBlockedBooking = booking.status === 'blocked';
                              if (!isBlockedBooking) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isAdvanceBooked = !isMaintenance && !isBlocked && roomBookings.some(booking => {
                              if (!booking.isAdvanceBooking) return false;
                              const isConfirmedOrPending = booking.status === 'confirmed' || booking.status === 'pending';
                              if (!isConfirmedOrPending) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isRegularBooked = !isMaintenance && !isBlocked && !isAdvanceBooked && roomBookings.some(booking => {
                              if (booking.isAdvanceBooking || booking.status === 'maintenance' || booking.status === 'blocked') return false;
                              const isBookedStatus = booking.status && booking.status.toLowerCase() === 'booked';
                              if (!isBookedStatus) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isAvailableForSelectedDate = !isMaintenance && !isBlocked && !isAdvanceBooked && !isRegularBooked;

                            // Get advance booking details if exists
                            const advanceBooking = getAdvanceBookingForRoom(room, selectedDate);

                            // Determine card color based on status
                            let cardColor = 'bg-green-500';
                            let statusLabel = 'Available';
                            let borderColor = 'border-green-600';
                            let iconColor = 'text-green-600';
                            let bgLight = 'bg-green-100';

                            if (!isAvailableForSelectedDate) {
                              if (isMaintenance) {
                                cardColor = 'bg-yellow-500';
                                borderColor = 'border-yellow-600';
                                iconColor = 'text-yellow-600';
                                bgLight = 'bg-yellow-100';
                                statusLabel = 'Maintenance';
                              } else if (isBlocked) {
                                cardColor = 'bg-gray-500';
                                borderColor = 'border-gray-600';
                                iconColor = 'text-gray-600';
                                bgLight = 'bg-gray-100';
                                statusLabel = 'Blocked';
                              } else if (isAdvanceBooked) {
                                cardColor = 'bg-purple-500';
                                borderColor = 'border-purple-600';
                                iconColor = 'text-purple-600';
                                bgLight = 'bg-purple-100';
                                statusLabel = 'Advance Booked';
                              } else if (isRegularBooked) {
                                cardColor = 'bg-red-500';
                                borderColor = 'border-red-600';
                                iconColor = 'text-red-600';
                                bgLight = 'bg-red-100';
                                statusLabel = 'Booked';
                              }
                            }

                            const isExpanded = expandedRoom === room.roomId;

                            return (
                              <motion.div
                                key={`${room.source}-${room.roomId}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={isExpanded ? 'col-span-2 row-span-2 z-10' : ''}
                              >
                                <Card
                                  className={`
                                    cursor-pointer transition-all duration-200 hover:shadow-lg
                                    border ${isExpanded ? borderColor : 'border-transparent'}
                                    ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}
                                    h-full
                                    ${!isExpanded ? 'bg-opacity-30' : 'bg-white'}
                                  `}
                                  onClick={() => setExpandedRoom(isExpanded ? null : room.roomId)}
                                  style={!isExpanded ? {
                                    backgroundColor:
                                      isMaintenance ? '#fef9c3' :
                                        isBlocked ? '#f3f4f6' :
                                          isAdvanceBooked ? '#f3e8ff' :
                                            isRegularBooked ? '#fee2e2' :
                                              '#dcfce7'
                                  } : {}}
                                >
                                  {/* Colored bar when expanded */}
                                  {isExpanded && (
                                    <div className={`h-1 ${cardColor} rounded-t-lg`}></div>
                                  )}

                                  <CardContent className="p-1.5 sm:p-2">
                                    {/* Room Number with Arrow */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <Bed className={`h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 ${!isExpanded
                                          ? (isMaintenance ? 'text-yellow-700' :
                                            isBlocked ? 'text-gray-700' :
                                              isAdvanceBooked ? 'text-purple-700' :
                                                isRegularBooked ? 'text-red-700' :
                                                  'text-green-700')
                                          : iconColor
                                          }`} />
                                        <span className={`font-bold text-xs sm:text-sm truncate ${!isExpanded
                                          ? (isMaintenance ? 'text-yellow-800' :
                                            isBlocked ? 'text-gray-800' :
                                              isAdvanceBooked ? 'text-purple-800' :
                                                isRegularBooked ? 'text-red-800' :
                                                  'text-green-800')
                                          : ''
                                          }`}>
                                          {room.number}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* Status Badge */}
                                        {!isExpanded && (
                                          <div
                                            className={`px-1 py-0.5 rounded text-[8px] font-medium ${isMaintenance ? 'bg-yellow-200 text-yellow-800' :
                                              isBlocked ? 'bg-gray-300 text-gray-800' :
                                                isAdvanceBooked ? 'bg-purple-200 text-purple-800' :
                                                  isRegularBooked ? 'bg-red-200 text-red-800' :
                                                    'bg-green-200 text-green-800'
                                              }`}
                                          >
                                            {isMaintenance ? 'M' :
                                              isBlocked ? 'B' :
                                                isAdvanceBooked ? 'A' :
                                                  isRegularBooked ? 'R' :
                                                    'Av'}
                                          </div>
                                        )}

                                        {/* Expand/Collapse Arrow */}
                                        <div className="text-[8px] sm:text-[10px] text-muted-foreground">
                                          {isExpanded ? '▲' : '▼'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Room Type */}
                                    {!isExpanded && (
                                      <div className={`mt-0.5 text-[8px] sm:text-[10px] truncate ${isMaintenance ? 'text-yellow-700' :
                                        isBlocked ? 'text-gray-700' :
                                          isAdvanceBooked ? 'text-purple-700' :
                                            isRegularBooked ? 'text-red-700' :
                                              'text-green-700'
                                        }`}>
                                        {room.type}
                                      </div>
                                    )}

                                    {/* Advance Booking Badge in Minimal View */}
                                    {!isExpanded && advanceBooking && (
                                      <div className="mt-0.5 text-[7px] bg-purple-100 text-purple-800 px-1 py-0.5 rounded-full inline-block">
                                        Advance: ₹{advanceBooking.advanceAmount}
                                      </div>
                                    )}

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="mt-1.5 space-y-1.5 pt-1.5 border-t text-[10px] sm:text-xs"
                                      >
                                        {/* Room Details */}
                                        <div className="grid grid-cols-2 gap-1">
                                          <div>
                                            <span className="text-muted-foreground">Floor:</span>
                                            <span className="font-medium ml-1">{room.floor}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Price:</span>
                                            <span className="font-medium ml-1">₹{room.price}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Max:</span>
                                            <span className="font-medium ml-1">{room.maxOccupancy}</span>
                                          </div>
                                          <div className="col-span-2">
                                            <span className="text-muted-foreground">Amenities:</span>
                                            <span className="font-medium ml-1 truncate block" title={room.amenities}>
                                              {room.amenities || 'Standard'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Advance Booking Details */}
                                        {advanceBooking && (
                                          <div className="bg-purple-50 p-1 rounded border border-purple-200">
                                            <div className="text-[8px] font-medium text-purple-800 mb-0.5">Advance Booking:</div>
                                            <div className="grid grid-cols-2 gap-1 text-[8px]">
                                              <div>
                                                <span className="text-purple-600">Customer:</span>
                                                <span className="ml-1 font-medium">{advanceBooking.customerName}</span>
                                              </div>
                                              <div>
                                                <span className="text-purple-600">Advance:</span>
                                                <span className="ml-1 text-green-600">₹{advanceBooking.advanceAmount}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Date Status */}
                                        <div className={`text-[8px] sm:text-[10px] p-1 rounded ${bgLight}`}>
                                          <div className="flex items-center justify-between">
                                            <span>{selectedDate.toLocaleDateString()}:</span>
                                            <span className="font-bold">
                                              {!isAvailableForSelectedDate
                                                ? (isMaintenance ? '🔧' :
                                                  isBlocked ? '🚫' :
                                                    isAdvanceBooked ? '🔮' :
                                                      '❌')
                                                : '✅'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Quick Action Buttons */}
                                        <div className="flex flex-col gap-1">
                                          {advanceBooking && userSource === 'database' ? (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleConvertAndBook(room, advanceBooking);
                                              }}
                                              className="w-full text-[8px] sm:text-[10px] h-5 sm:h-6 bg-purple-600 hover:bg-purple-700"
                                            >
                                              <ArrowRight className="h-2 w-2 mr-0.5" />
                                              Convert (₹{advanceBooking.advanceAmount})
                                            </Button>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAction(room, 'book');
                                              }}
                                              disabled={!isAvailableForSelectedDate}
                                              className={`w-full text-[8px] sm:text-[10px] h-5 sm:h-6 ${isAvailableForSelectedDate
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-gray-300 cursor-not-allowed'
                                                }`}
                                            >
                                              <FileImage className="h-2 w-2 mr-0.5" />
                                              {isAvailableForSelectedDate ? 'Book' : 'NA'}
                                            </Button>
                                          )}

                                          <div className="flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAction(room, 'block');
                                              }}
                                              disabled={!isAvailableForSelectedDate && !advanceBooking}
                                              className="flex-1 text-[8px] sm:text-[10px] h-5 sm:h-6 px-0.5"
                                            >
                                              Blk
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAction(room, 'maintenance');
                                              }}
                                              disabled={!isAvailableForSelectedDate && !advanceBooking}
                                              className="flex-1 text-[8px] sm:text-[10px] h-5 sm:h-6 px-0.5"
                                            >
                                              Mnt
                                            </Button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        /* DETAILED VIEW */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredRooms.map((room) => {
                            // Find all bookings for this room
                            const roomBookings = bookings.filter(booking => {
                              const isMatch =
                                booking.roomId === room.roomId ||
                                booking.roomNumber === room.number.toString() ||
                                booking.roomNumber === room.roomId ||
                                String(booking.roomNumber) === String(room.number);
                              return isMatch;
                            });

                            // Check each booking type
                            const isMaintenance = roomBookings.some(booking => {
                              const isMaintenanceBooking = booking.status === 'maintenance';
                              if (!isMaintenanceBooking) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isBlocked = !isMaintenance && roomBookings.some(booking => {
                              const isBlockedBooking = booking.status === 'blocked';
                              if (!isBlockedBooking) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isAdvanceBooked = !isMaintenance && !isBlocked && roomBookings.some(booking => {
                              if (!booking.isAdvanceBooking) return false;
                              const isConfirmedOrPending = booking.status === 'confirmed' || booking.status === 'pending';
                              if (!isConfirmedOrPending) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isRegularBooked = !isMaintenance && !isBlocked && !isAdvanceBooked && roomBookings.some(booking => {
                              if (booking.isAdvanceBooking || booking.status === 'maintenance' || booking.status === 'blocked') return false;
                              const isBookedStatus = booking.status && booking.status.toLowerCase() === 'booked';
                              if (!isBookedStatus) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isAvailableForSelectedDate = !isMaintenance && !isBlocked && !isAdvanceBooked && !isRegularBooked;

                            // Get advance booking details if exists
                            const advanceBooking = getAdvanceBookingForRoom(room, selectedDate);

                            // Determine card styling based on status
                            let statusColor = 'border-green-200';
                            let statusText = 'Available';
                            let statusBg = 'bg-green-100 text-green-800';
                            let iconColor = 'text-green-600';
                            let statusLabel = 'AVAILABLE';

                            if (!isAvailableForSelectedDate) {
                              if (isMaintenance) {
                                statusColor = 'border-yellow-200';
                                statusText = 'Maintenance';
                                statusBg = 'bg-yellow-100 text-yellow-800';
                                iconColor = 'text-yellow-600';
                                statusLabel = 'MAINTENANCE';
                              } else if (isBlocked) {
                                statusColor = 'border-gray-400';
                                statusText = 'Blocked';
                                statusBg = 'bg-gray-100 text-gray-800';
                                iconColor = 'text-gray-600';
                                statusLabel = 'BLOCKED';
                              } else if (isAdvanceBooked) {
                                statusColor = 'border-purple-200';
                                statusText = 'Advance Booked';
                                statusBg = 'bg-purple-100 text-purple-800';
                                iconColor = 'text-purple-600';
                                statusLabel = 'ADVANCE BOOKED';
                              } else if (isRegularBooked) {
                                statusColor = 'border-red-200';
                                statusText = 'Booked';
                                statusBg = 'bg-red-100 text-red-800';
                                iconColor = 'text-red-600';
                                statusLabel = 'BOOKED';
                              }
                            }

                            return (
                              <motion.div
                                key={`${room.source}-${room.roomId}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Card className={`hover:shadow-lg transition-shadow h-full ${statusColor}`}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          <Bed className={`h-5 w-5 ${iconColor}`} />
                                          {room.number}
                                          {!isAvailableForSelectedDate && (
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusBg}`}>
                                              {statusLabel}
                                            </span>
                                          )}
                                          {isAvailableForSelectedDate && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                              AVAILABLE
                                            </span>
                                          )}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">{room.type} • {room.size}</p>
                                      </div>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusBg}`}>
                                        {statusText}
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Floor:</span>
                                        <div className="font-medium">{room.floor}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Price:</span>
                                        <div className="font-medium">₹{room.price}/night</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Max:</span>
                                        <div className="font-medium">{room.maxOccupancy} persons</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Amenities:</span>
                                        <div className="font-medium truncate" title={room.amenities}>
                                          {room.amenities || 'Standard'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Date Availability Status */}
                                    <div className={`text-xs p-2 rounded ${!isAvailableForSelectedDate
                                      ? isMaintenance
                                        ? 'bg-yellow-50 text-yellow-800'
                                        : isBlocked
                                          ? 'bg-gray-50 text-gray-800'
                                          : isAdvanceBooked
                                            ? 'bg-purple-50 text-purple-800'
                                            : 'bg-red-50 text-red-800'
                                      : 'bg-green-50 text-green-800'
                                      }`}>
                                      <div className="flex items-center justify-between">
                                        <span>Status for {selectedDate.toLocaleDateString()}:</span>
                                        <span className="font-bold">
                                          {!isAvailableForSelectedDate
                                            ? (isMaintenance
                                              ? '🔧 Maintenance'
                                              : isBlocked
                                                ? '🚫 Blocked'
                                                : isAdvanceBooked
                                                  ? '🔮 Advance Booked'
                                                  : '❌ Booked')
                                            : '✅ Available'}
                                        </span>
                                      </div>
                                      {!isAvailableForSelectedDate && roomBookings.length > 0 && (
                                        <div className="mt-1 text-xs">
                                          <span className="font-medium">Booked by:</span> {
                                            roomBookings
                                              .filter(booking => {
                                                const isBookedStatus = booking.status && (
                                                  booking.status.toLowerCase() === 'booked' ||
                                                  booking.status.toLowerCase() === 'maintenance' ||
                                                  booking.status.toLowerCase() === 'blocked' ||
                                                  (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
                                                );
                                                if (!isBookedStatus) return false;
                                                return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                                              })
                                              .map(booking => (
                                                <div key={booking.id} className="mt-1">
                                                  <span>{booking.customerName}</span>
                                                  {booking.isAdvanceBooking && (
                                                    <span className="ml-2 text-purple-600">
                                                      (Advance: ₹{booking.advanceAmount})
                                                    </span>
                                                  )}
                                                  {booking.status === 'maintenance' && (
                                                    <span className="ml-2 text-yellow-600">
                                                      (Maintenance)
                                                    </span>
                                                  )}
                                                  {booking.status === 'blocked' && (
                                                    <span className="ml-2 text-gray-600">
                                                      (Blocked)
                                                    </span>
                                                  )}
                                                </div>
                                              ))
                                          }
                                        </div>
                                      )}
                                    </div>

                                    {/* Advance Booking Details */}
                                    {advanceBooking && (
                                      <div className="bg-purple-50 p-2 rounded-md border border-purple-200">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-medium text-purple-800">Advance Booking Details:</span>
                                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                                            {advanceBooking.status}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                                          <div>
                                            <span className="text-purple-600">Customer:</span>
                                            <span className="font-medium ml-1 text-purple-800">{advanceBooking.customerName}</span>
                                          </div>
                                          <div>
                                            <span className="text-purple-600">Advance:</span>
                                            <span className="font-medium ml-1 text-green-600">₹{advanceBooking.advanceAmount}</span>
                                          </div>
                                          <div>
                                            <span className="text-purple-600">Remaining:</span>
                                            <span className="font-medium ml-1 text-orange-600">₹{advanceBooking.remainingAmount}</span>
                                          </div>
                                          {advanceBooking.advanceExpiryDate && (
                                            <div>
                                              <span className="text-purple-600">Expires:</span>
                                              <span className="font-medium ml-1 text-purple-800">
                                                {new Date(advanceBooking.advanceExpiryDate).toLocaleDateString()}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Quick Action Buttons */}
                                    <div className="flex flex-col gap-2 pt-2">
                                      {advanceBooking && userSource === 'database' ? (
                                        /* Convert to Booking button for advance bookings */
                                        <Button
                                          size="sm"
                                          onClick={() => handleConvertAndBook(room, advanceBooking)}
                                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                          <ArrowRight className="h-4 w-4 mr-2" />
                                          Convert to Booking (Advance: ₹{advanceBooking.advanceAmount})
                                        </Button>
                                      ) : (
                                        /* Regular booking button */
                                        <Button
                                          size="sm"
                                          onClick={() => handleQuickAction(room, 'book')}
                                          disabled={!isAvailableForSelectedDate}
                                          className={`w-full ${isAvailableForSelectedDate
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gray-300 cursor-not-allowed'
                                            }`}
                                        >
                                          <FileImage className="h-4 w-4 mr-2" />
                                          {isAvailableForSelectedDate ? 'Book for This Date' :
                                            isAdvanceBooked ? 'Advance Booked' : 'Already Booked'}
                                        </Button>
                                      )}

                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleQuickAction(room, 'block')}
                                          disabled={!isAvailableForSelectedDate && !advanceBooking}
                                          className={`flex-1 ${!isAvailableForSelectedDate && !advanceBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          Block
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleQuickAction(room, 'maintenance')}
                                          disabled={!isAvailableForSelectedDate && !advanceBooking}
                                          className={`flex-1 ${!isAvailableForSelectedDate && !advanceBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          Maintenance
                                        </Button>
                                      </div>

                                      {userSource === 'database' && isAvailableForSelectedDate && (
                                        <div className="pt-2 border-t">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setQuotationRoom(room);
                                              setQuotationDateRange({
                                                from: selectedDate,
                                                to: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
                                              });
                                              setShowQuotationForm(true);
                                            }}
                                            disabled={!isAvailableForSelectedDate}
                                            className={`w-full ${isAvailableForSelectedDate
                                              ? 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                                              : 'opacity-50 cursor-not-allowed'
                                              }`}
                                          >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Create Quotation
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )
                ) : (
                  /* Calendar View */
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Room Calendar View
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Click on dates to see room availability. Purple dates have advance bookings. Gray dates are blocked.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Month Selector and Navigation */}
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newDate = new Date(currentMonth);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setCurrentMonth(newDate);
                            }}
                          >
                            Previous Month
                          </Button>
                          <h3 className="text-lg font-semibold">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newDate = new Date(currentMonth);
                              newDate.setMonth(newDate.getMonth() + 1);
                              setCurrentMonth(newDate);
                            }}
                          >
                            Next Month
                          </Button>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span>Limited</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                            <span>Booked</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                            <span>Advance Booked</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span>Maintenance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 border border-gray-400 rounded"></div>
                            <span>Blocked</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                            <span>Selected Date</span>
                          </div>
                        </div>

                        {/* Rooms Calendar Grid */}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 bg-gray-50">Room</th>
                                {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                                  const dayNumber = i + 1;
                                  return (
                                    <th key={dayNumber} className="border p-2 text-center bg-gray-50">
                                      {dayNumber}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {rooms.slice(0, 10).map((room) => (
                                <tr key={room.roomId}>
                                  <td className="border p-2 font-medium bg-gray-50">
                                    <div className="flex items-center gap-2">
                                      <Bed className="h-4 w-4 text-primary" />
                                      Room {room.number}
                                    </div>
                                  </td>
                                  {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                                    const dayNumber = i + 1;
                                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);

                                    if (date.getMonth() !== currentMonth.getMonth()) return null;

                                    const dateStr = formatDate(date);

                                    const roomBookings = bookings.filter(booking => {
                                      const isRoomMatch =
                                        booking.roomId === room.roomId ||
                                        booking.roomNumber === room.number.toString();

                                      if (!isRoomMatch) return false;

                                      const isBookedStatus = booking.status && (
                                        booking.status.toLowerCase() === 'booked' ||
                                        booking.status.toLowerCase() === 'maintenance' ||
                                        booking.status.toLowerCase() === 'blocked' ||
                                        (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
                                      );

                                      if (!isBookedStatus) return false;

                                      return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                                    });

                                    const isBooked = roomBookings.length > 0;
                                    const isAdvanceBooked = roomBookings.some(b => b.isAdvanceBooking);
                                    const isMaintenance = roomBookings.some(b => b.status === 'maintenance');
                                    const isBlocked = roomBookings.some(b => b.status === 'blocked');
                                    const isSelected = formatDate(selectedDate) === dateStr;

                                    let bgColor = 'bg-white';
                                    let textColor = 'text-gray-800';
                                    let borderColor = 'border-gray-200';

                                    if (isSelected) {
                                      bgColor = 'bg-blue-100';
                                      borderColor = 'border-blue-300';
                                    } else if (isBooked) {
                                      if (isMaintenance) {
                                        bgColor = 'bg-yellow-100';
                                        textColor = 'text-yellow-800';
                                        borderColor = 'border-yellow-200';
                                      } else if (isBlocked) {
                                        bgColor = 'bg-gray-100';
                                        textColor = 'text-gray-800';
                                        borderColor = 'border-gray-400';
                                      } else if (isAdvanceBooked) {
                                        bgColor = 'bg-purple-100';
                                        textColor = 'text-purple-800';
                                        borderColor = 'border-purple-200';
                                      } else {
                                        bgColor = 'bg-red-100';
                                        textColor = 'text-red-800';
                                        borderColor = 'border-red-200';
                                      }
                                    } else {
                                      const dayBookings = bookings.filter(booking => {
                                        const isBookedStatus = booking.status && (
                                          booking.status.toLowerCase() === 'booked' ||
                                          booking.status.toLowerCase() === 'maintenance' ||
                                          booking.status.toLowerCase() === 'blocked' ||
                                          (booking.isAdvanceBooking && (booking.status === 'confirmed' || booking.status === 'pending'))
                                        );
                                        if (!isBookedStatus) return false;
                                        return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                                      });

                                      const availabilityPercentage = ((rooms.length - dayBookings.length) / rooms.length) * 100;

                                      if (availabilityPercentage >= 70) {
                                        bgColor = 'bg-green-100';
                                        borderColor = 'border-green-200';
                                      } else if (availabilityPercentage >= 40) {
                                        bgColor = 'bg-yellow-100';
                                        borderColor = 'border-yellow-200';
                                      }
                                    }

                                    return (
                                      <td
                                        key={dayNumber}
                                        className={`border p-2 text-center cursor-pointer hover:opacity-80 transition-opacity ${bgColor} ${textColor} ${borderColor}`}
                                        onClick={() => {
                                          setSelectedDate(date);
                                          setViewMode('grid');
                                          calculateAvailability(date);
                                        }}
                                        title={`${date.toLocaleDateString()}\n${isBooked
                                          ? (isMaintenance ? 'Maintenance'
                                            : isBlocked ? 'Blocked'
                                              : isAdvanceBooked ? 'Advance Booked'
                                                : 'Booked')
                                          : 'Available'
                                          }`}
                                      >
                                        {isBooked
                                          ? (isMaintenance ? '🔧'
                                            : isBlocked ? '🚫'
                                              : isAdvanceBooked ? '🔮'
                                                : '❌')
                                          : '✅'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="text-sm text-muted-foreground mt-4">
                          <p>• Click on any date cell to select that date and switch to grid view</p>
                          <p>• 🔧 maintenance, 🚫 blocked, 🔮 advance, ❌ regular booking</p>
                          <p>• Showing first 10 rooms. Use the search above to filter rooms</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!loading && filteredRooms.length === 0 && searchTerm && viewMode === 'grid' && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Search className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                      <p className="text-muted-foreground mb-4">
                        No rooms match your search criteria for {selectedDate.toLocaleDateString()}
                      </p>
                      <Button onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Bed className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rooms available</h3>
                  <p className="text-muted-foreground mb-4">
                    {userSource === 'google_sheets'
                      ? 'No rooms found in your Google Sheets. Please add rooms to your spreadsheet.'
                      : 'No rooms configured in the system. Please contact your administrator.'}
                  </p>
                  <Button onClick={fetchRooms}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Loading
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search bookings by customer name or room number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bookings List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading bookings...</span>
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`hover:shadow-md transition-shadow ${booking.status === 'maintenance' ? 'border-yellow-200' :
                      booking.status === 'blocked' ? 'border-gray-400' :
                        booking.isAdvanceBooking ? 'border-purple-200' : ''
                      }`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold">Booking #{formatBookingId(booking.id)}</h3>
                              {getStatusBadge(booking.status, booking.isAdvanceBooking ? 'advance' : undefined)}
                              {getPaymentBadge(booking.paymentStatus)}
                              {booking.isAdvanceBooking && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                  Advance Booking
                                </Badge>
                              )}
                              {booking.status === 'maintenance' && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  Maintenance
                                </Badge>
                              )}
                              {booking.status === 'blocked' && (
                                <Badge className="bg-gray-100 text-gray-800 border-gray-400">
                                  Blocked Room
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Room:</span>
                                <div className="font-medium">Room {booking.roomNumber}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Customer:</span>
                                <div className="font-medium">{booking.customerName}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Check-in:</span>
                                <div className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Check-out:</span>
                                <div className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</div>
                              </div>
                              {booking.status !== 'blocked' && (
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>
                                  <div className="font-medium">₹{booking.totalAmount}</div>
                                </div>
                              )}
                            </div>

                            {/* Advance Booking Details */}
                            {booking.isAdvanceBooking && (
                              <div className="mt-2 p-2 bg-purple-50 rounded-md">
                                <div className="flex items-center gap-4 text-xs flex-wrap">
                                  <span className="text-purple-700">
                                    <span className="font-medium">Advance Paid:</span> ₹{booking.advanceAmount}
                                  </span>
                                  <span className="text-orange-700">
                                    <span className="font-medium">Remaining:</span> ₹{booking.remainingAmount}
                                  </span>
                                  {booking.advanceExpiryDate && (
                                    <span className="text-gray-600">
                                      <span className="font-medium">Expires:</span> {new Date(booking.advanceExpiryDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Maintenance Details */}
                            {booking.status === 'maintenance' && booking.maintenanceDetails && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                                <div className="flex items-center gap-4 text-xs flex-wrap">
                                  <span className="text-yellow-700">
                                    <span className="font-medium">Type:</span> {booking.maintenanceDetails.type || 'General'}
                                  </span>
                                  <span className="text-yellow-700">
                                    <span className="font-medium">Assigned:</span> {booking.maintenanceDetails.assignedTo || 'Not assigned'}
                                  </span>
                                  {booking.maintenanceDetails.estimatedCost ? (
                                    <span className="text-yellow-700">
                                      <span className="font-medium">Cost:</span> ₹{booking.maintenanceDetails.estimatedCost}
                                    </span>
                                  ) : null}
                                  {booking.maintenanceDetails.priority && (
                                    <span className="text-yellow-700">
                                      <span className="font-medium">Priority:</span> {booking.maintenanceDetails.priority}
                                    </span>
                                  )}
                                </div>
                                {booking.maintenanceDetails.description && (
                                  <p className="text-xs text-gray-600 mt-1">{booking.maintenanceDetails.description}</p>
                                )}
                              </div>
                            )}

                            {/* Blocked Room Details */}
                            {booking.status === 'blocked' && (
                              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-600">
                                  {booking.special_requests || 'Room blocked for administrative purposes'}
                                </p>
                              </div>
                            )}

                            {/* ID Proof Available */}
                            {booking.idImage && (
                              <div className="flex items-center gap-2 mt-2">
                                <FileImage className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">ID Proof Attached</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewID(booking.idImage!)}
                                  className="h-6 px-2"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col md:flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewBooking(booking)}
                            >
                              View Details
                            </Button>
                            {booking.status !== 'blocked' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReceipt(booking)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Receipt
                              </Button>
                            )}
                            {booking.status !== 'blocked' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendReceipt(booking)}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'No bookings match your search criteria' : 'No bookings in the system'}
                  </p>
                  <Button onClick={() => setActiveTab('rooms')}>
                    <Bed className="h-4 w-4 mr-2" />
                    Book a Room
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>


      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <BookingForm
          room={selectedRoom}
          roomId={selectedRoom.roomId}
          mode={bookingMode}
          spreadsheetId={currentUser.spreadsheetId}
          userSource={userSource}
          defaultDate={dateRange.from || selectedDate}
          defaultDateRange={dateRange}
          advanceBookingData={selectedAdvanceForBooking}
          isAdvanceConversion={!!selectedAdvanceForBooking}
          onClose={() => {
            console.log('Closing booking form');
            setShowBookingForm(false);
            setSelectedRoom(null);
            setSelectedAdvanceForBooking(null);
          }}
          onSuccess={async () => {
            console.log('Booking success, refreshing...');
            setShowBookingForm(false);
            setSelectedRoom(null);
            setSelectedAdvanceForBooking(null);
            await fetchRooms();
            toast({
              title: "Success",
              description: selectedAdvanceForBooking
                ? `Advance booking converted to regular booking for Room ${selectedRoom.number}`
                : `Room ${selectedRoom.number} ${bookingMode === 'book' ? 'booked' : bookingMode === 'block' ? 'blocked' : 'set for maintenance'} successfully`
            });
          }}
        />
      )}

      {/* Block Room Form Modal */}
      {showBlockForm && selectedRoom && (
        <BlockRoomForm
          room={selectedRoom}
          defaultDateRange={dateRange}
          onClose={() => {
            setShowBlockForm(false);
            setSelectedRoom(null);
          }}
          onSuccess={async () => {
            setShowBlockForm(false);
            setSelectedRoom(null);
            await fetchRooms();
            toast({
              title: "Success",
              description: `Room ${selectedRoom.number} blocked successfully`
            });
          }}
          userSource={userSource}
          spreadsheetId={currentUser.spreadsheetId}
        />
      )}

      {/* Maintenance Form Modal */}
      {showMaintenanceForm && selectedRoom && (
        <MaintenanceForm
          room={selectedRoom}
          defaultDateRange={dateRange}
          onClose={() => {
            setShowMaintenanceForm(false);
            setSelectedRoom(null);
          }}
          onSuccess={async () => {
            setShowMaintenanceForm(false);
            setSelectedRoom(null);
            await fetchRooms();
            toast({
              title: "Success",
              description: `Maintenance request submitted for Room ${selectedRoom.number}`
            });
          }}
          userSource={userSource}
          spreadsheetId={currentUser.spreadsheetId}
        />
      )}

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">ID Proof Image</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImagePreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={showImagePreview}
                alt="ID Proof"
                className="max-w-full max-h-[70vh] mx-auto rounded"
              />
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = showImagePreview;
                    link.download = `id-proof-${Date.now()}.jpg`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImagePreview(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Booking ID</Label>
                  <div className="font-medium">{formatBookingId(selectedBooking.id)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room Number</Label>
                  <div className="font-medium">Room {selectedBooking.roomNumber}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer Name</Label>
                  <div className="font-medium">{selectedBooking.customerName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <div className="font-medium">
                    {selectedBooking.status === 'blocked' ? 'N/A' : '+91 XXXXXXX'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-in</Label>
                  <div className="font-medium">{new Date(selectedBooking.checkIn).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-out</Label>
                  <div className="font-medium">{new Date(selectedBooking.checkOut).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nights</Label>
                  <div className="font-medium">
                    {Math.ceil((new Date(selectedBooking.checkOut).getTime() - new Date(selectedBooking.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                </div>
                {selectedBooking.status !== 'blocked' && (
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <div className="font-bold text-lg">₹{selectedBooking.totalAmount}</div>
                  </div>
                )}
              </div>

              {/* Advance Booking Details */}
              {selectedBooking.isAdvanceBooking && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Advance Booking Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-purple-600">Advance Paid:</span>
                      <div className="font-bold text-green-600">₹{selectedBooking.advanceAmount}</div>
                    </div>
                    <div>
                      <span className="text-sm text-purple-600">Remaining:</span>
                      <div className="font-bold text-orange-600">₹{selectedBooking.remainingAmount}</div>
                    </div>
                    {selectedBooking.advanceExpiryDate && (
                      <div className="col-span-2">
                        <span className="text-sm text-purple-600">Expires:</span>
                        <div className="font-medium">{new Date(selectedBooking.advanceExpiryDate).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Maintenance Details */}
              {selectedBooking.status === 'maintenance' && selectedBooking.maintenanceDetails && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Maintenance Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-yellow-600">Type:</span>
                      <div className="font-medium">{selectedBooking.maintenanceDetails.type || 'General'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-yellow-600">Assigned To:</span>
                      <div className="font-medium">{selectedBooking.maintenanceDetails.assignedTo || 'Not assigned'}</div>
                    </div>
                    {selectedBooking.maintenanceDetails.estimatedCost ? (
                      <div>
                        <span className="text-sm text-yellow-600">Estimated Cost:</span>
                        <div className="font-medium">₹{selectedBooking.maintenanceDetails.estimatedCost}</div>
                      </div>
                    ) : null}
                    {selectedBooking.maintenanceDetails.priority && (
                      <div>
                        <span className="text-sm text-yellow-600">Priority:</span>
                        <div className="font-medium capitalize">{selectedBooking.maintenanceDetails.priority}</div>
                      </div>
                    )}
                    {selectedBooking.maintenanceDetails.description && (
                      <div className="col-span-2">
                        <span className="text-sm text-yellow-600">Description:</span>
                        <div className="font-medium">{selectedBooking.maintenanceDetails.description}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blocked Room Details */}
              {selectedBooking.status === 'blocked' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Blocked Room Details</h3>
                  <div>
                    <span className="text-sm text-gray-600">Reason:</span>
                    <div className="font-medium">{selectedBooking.special_requests || 'Room blocked for administrative purposes'}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status, selectedBooking.isAdvanceBooking ? 'advance' : undefined)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Status</Label>
                  <div className="mt-1">{getPaymentBadge(selectedBooking.paymentStatus)}</div>
                </div>
              </div>

              {selectedBooking.idImage && (
                <div>
                  <Label className="text-muted-foreground">ID Proof</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-16 h-16 border rounded overflow-hidden">
                      <img
                        src={selectedBooking.idImage}
                        alt="ID Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      onClick={() => handleViewID(selectedBooking.idImage!)}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Image
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
                {selectedBooking.status !== 'blocked' && (
                  <Button onClick={() => handleDownloadReceipt(selectedBooking)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuotationForm && quotationRoom && (
        <QuotationForm
          open={showQuotationForm}
          onClose={() => {
            setShowQuotationForm(false);
            setQuotationRoom(null);
          }}
          room={quotationRoom}
          defaultDates={{
            fromDate: quotationDateRange.from
              ? formatDate(quotationDateRange.from)
              : formatDate(new Date()),
            toDate: quotationDateRange.to
              ? formatDate(quotationDateRange.to)
              : formatDate(new Date(new Date().setDate(new Date().getDate() + 1)))
          }}
          onSuccess={(quotationData) => {
            setShowQuotationForm(false);
            setQuotationRoom(null);
            toast({
              title: "✅ Quotation Created",
              description: `Quotation ${quotationData.quotationNumber} generated successfully`,
              variant: "default"
            });
          }}
        />
      )}
    </Layout>
  );
};

export default RoomBooking;