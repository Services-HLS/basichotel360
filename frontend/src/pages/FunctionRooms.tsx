

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, QrCode, Info, ChevronRight, ChevronLeft, Check, User, CalendarRange, CalendarDays, Clock } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AddRoomModal from '@/components/AddRoomModal';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Calendar as CalendarIcon,
  Users,
  IndianRupee,
  Wifi,
  Utensils,
  ParkingCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  Smartphone,
  Mail,
  CreditCard,
  Eye,
  Hotel,
  Bed,
  MinusCircle,
  Percent,
  Edit,
  Save,
  Ban,
  TrendingUp,
} from 'lucide-react';

// Import API functions
import {
  getFunctionRooms,
  deleteFunctionRoom,
  getFunctionRoomStats,
  getFunctionBookings,
  getFunctionBookingById,
  createFunctionBooking,
  checkFunctionRoomAvailability
} from '@/lib/functionRoomApi';

import {
  getAvailableRooms,
  createBooking,
  checkRoomAvailability as checkStandardRoomAvailability,
  searchCustomersByPhone,
  createCustomer,
  getAvailableRoomsCorrectly,
} from '@/lib/bookingApi';

import { FunctionRoom, FunctionBooking } from '@/types/hotel';
import FunctionCheckoutModal from '@/components/FunctionCheckoutModal';
// import FunctionCancelModal from '@/components/FunctionCancelModal';

// ===========================================
// HELPER FUNCTIONS
// ===========================================

const getRoomIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'banquet': '🎉',
    'conference': '💼',
    'meeting': '🤝',
    'party': '🎊',
    'wedding': '💒',
    'seminar': '📚',
    'training': '📝',
    'other': '🏛️'
  };
  return icons[type] || '🏛️';
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; class: string }> = {
    'available': { label: 'Available', class: 'bg-green-100 text-green-800 border-green-200' },
    'booked': { label: 'Booked', class: 'bg-blue-100 text-blue-800 border-blue-200' },
    'maintenance': { label: 'Maintenance', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'blocked': { label: 'Blocked', class: 'bg-red-100 text-red-800 border-red-200' },
    'confirmed': { label: 'Confirmed', class: 'bg-green-100 text-green-800 border-green-200' },
    'pending': { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'cancelled': { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' },
    'completed': { label: 'Completed', class: 'bg-gray-100 text-gray-800 border-gray-200' }
  };
  const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
  return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
};

const getPaymentBadge = (status: string) => {
  const config: Record<string, { label: string; class: string }> = {
    'completed': { label: 'Paid', class: 'bg-green-100 text-green-800 border-green-200' },
    'partial': { label: 'Partial', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'pending': { label: 'Pending', class: 'bg-orange-100 text-orange-800 border-orange-200' },
    'refunded': { label: 'Refunded', class: 'bg-purple-100 text-purple-800 border-purple-200' }
  };
  const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
  return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
};

const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

interface SelectedRoom {
  room_id: number;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  isBlocked: true;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Validation function
const validateStep = (
  step: number,
  bookingForm: any,
  toast: any,
  paymentMethod?: 'online' | 'cash' | null
): boolean => {
  switch (step) {
    case 1:
      if (!bookingForm.event_name) {
        toast({ title: 'Event name required', variant: 'destructive' });
        return false;
      }
      if (!bookingForm.check_in_date || !bookingForm.check_out_date) {
        toast({ title: 'Event dates required', variant: 'destructive' });
        return false;
      }
      if (!bookingForm.start_time || !bookingForm.end_time) {
        toast({ title: 'Event times required', variant: 'destructive' });
        return false;
      }

      // Validate that check-out date is not before check-in date
      if (new Date(bookingForm.check_out_date) < new Date(bookingForm.check_in_date)) {
        toast({ title: 'Invalid Dates', description: 'Check-out date cannot be before check-in date', variant: 'destructive' });
        return false;
      }

      // If same day, validate end time after start time
      if (bookingForm.check_in_date === bookingForm.check_out_date) {
        const start = new Date(`2000-01-01T${bookingForm.start_time}`);
        const end = new Date(`2000-01-01T${bookingForm.end_time}`);
        if (end <= start) {
          toast({ title: 'Invalid Times', description: 'End time must be after start time', variant: 'destructive' });
          return false;
        }
      }
      return true;
    case 2:
      if (!bookingForm.customer_name) {
        toast({ title: 'Customer name required', variant: 'destructive' });
        return false;
      }
      if (!bookingForm.customer_phone || bookingForm.customer_phone.length < 10) {
        toast({ title: 'Valid phone number required', variant: 'destructive' });
        return false;
      }
      return true;
    case 3:
      if (!paymentMethod) {
        toast({
          title: 'Payment method required',
          description: 'Please select Cash or Online payment',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    default:
      return true;
  }
};

export default function FunctionRooms() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ===========================================
  // STATE
  // ===========================================

  // Main state
  const [rooms, setRooms] = useState<FunctionRoom[]>([]);
  const [bookings, setBookings] = useState<FunctionBooking[]>([]);
  const [standardRooms, setStandardRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Date selection for availability (single date for quick view)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Date range for statistics
  const [statsDateRange, setStatsDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(1)),
    to: new Date()
  });

  const [showStatsDatePicker, setShowStatsDatePicker] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean>>({});
  const [checkingAvailability, setCheckingAvailability] = useState<Record<number, boolean>>({});

  // Tabs
  const [activeTab, setActiveTab] = useState('rooms');

  // Booking form modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<FunctionRoom | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking details modal
  const [selectedBooking, setSelectedBooking] = useState<FunctionBooking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // Room accommodation selection - for BLOCKING only
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');

  // Customer search
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Date range for booking
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 1)
  });

  // Multi-day & pricing (for function room only)
  const [customBasePrice, setCustomBasePrice] = useState<number>(0);
  const [customGstPercentage, setCustomGstPercentage] = useState<number>(18);
  const [isEditingPrice, setIsEditingPrice] = useState<boolean>(false);
  const [isEditingGst, setIsEditingGst] = useState<boolean>(false);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [customDiscountType, setCustomDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [customOtherCharges, setCustomOtherCharges] = useState<number>(0);
  const [otherChargesDescription, setOtherChargesDescription] = useState<string>('');
  const [filteredBookingsByDate, setFilteredBookingsByDate] = useState<FunctionBooking[]>([]);

  // Payment QR Code states
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [hotelQRCode, setHotelQRCode] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  const [transactionId, setTransactionId] = useState<string>('');

  // Add these state declarations
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState<FunctionBooking | null>(null);

  // Add these state declarations with your other states
  // const [showCancelModal, setShowCancelModal] = useState(false);
  // const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<FunctionBooking | null>(null);


  // Add pagination state for bookings
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const resetBookingForm = () => {
    // Reset all form-related state
    setBookingForm({
      function_room_id: 0,
      event_name: '',
      event_type: '',
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      start_time: '10:00',
      end_time: '18:00',
      rate_type: 'full_day',
      guests_expected: 50,
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      customer_gst: '',
      billing_address: '',
      billing_state: '',
      billing_state_code: '',
      billing_city: '',
      billing_pincode: '',
      business_type: 'b2c',
      special_requests: '',
      catering_requirements: '',
      advance_paid: 0,
      payment_method: 'cash',
      has_room_bookings: false
    });

    // Reset customer-related state
    setSelectedCustomer(null);
    setFoundCustomers([]);
    setShowCustomerSearch(false);

    // Reset room blocking state
    setSelectedRooms([]);
    setRoomSearchTerm('');
    setRoomTypeFilter('all');

    // Reset price editing state
    setCustomBasePrice(0);
    setCustomGstPercentage(18);
    setCustomDiscount(0);
    setCustomOtherCharges(0);
    setOtherChargesDescription('');
    setIsEditingPrice(false);
    setIsEditingGst(false);

    // Reset payment state
    setPaymentMethod(null);
    setPaymentStatus('pending');
    setQrCodeData('');
    setTransactionId('');

    // Reset step
    setActiveStep(1);

    // Reset date range
    const today = new Date();
    const tomorrow = addDays(today, 1);
    setDateRange({
      from: today,
      to: tomorrow
    });
  };


  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    function_room_id: 0,
    event_name: '',
    event_type: '',
    check_in_date: format(new Date(), 'yyyy-MM-dd'),
    check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '18:00',
    rate_type: 'full_day',
    guests_expected: 50,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_gst: '',
    billing_address: '',
    billing_state: '',
    billing_state_code: '',
    billing_city: '',
    billing_pincode: '',
    business_type: 'b2c',
    special_requests: '',
    catering_requirements: '',
    advance_paid: 0,
    payment_method: 'cash',
    has_room_bookings: false
  });

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isProUser = currentUser?.plan === 'pro' && currentUser?.source === 'database';

  // ===========================================
  // CALCULATION FUNCTIONS FOR CARDS
  // ===========================================

  const calculateTotalRooms = () => {
    return rooms.length;
  };

  const calculateRoomsAvailableOnSelectedDate = () => {
    if (rooms.length === 0) return 0;

    const bookingsOnSelectedDate = bookings.filter(booking => {
      const bookingDate = format(new Date(booking.booking_date), 'yyyy-MM-dd');
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      return bookingDate === selectedDateStr &&
        ['confirmed', 'pending'].includes(booking.status);
    });

    const bookedRoomIdsOnSelectedDate = new Set(
      bookingsOnSelectedDate.map(booking => booking.function_room_id)
    );

    const availableCount = rooms.filter(room => {
      const isBookedOnDate = bookedRoomIdsOnSelectedDate.has(room.id);
      const canBeBooked = room.status !== 'maintenance' && room.status !== 'blocked';
      return !isBookedOnDate && canBeBooked;
    }).length;

    return availableCount;
  };

  const calculateEventsInPeriod = () => {
    if (!statsDateRange.from || !statsDateRange.to) return 0;

    const eventsInPeriod = bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= statsDateRange.from &&
        bookingDate <= statsDateRange.to &&
        ['confirmed', 'pending', 'completed'].includes(booking.status);
    });

    return eventsInPeriod.length;
  };

  const calculateRevenueInPeriod = () => {
    if (!statsDateRange.from || !statsDateRange.to) return 0;

    const revenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= statsDateRange.from &&
          bookingDate <= statsDateRange.to &&
          ['confirmed', 'completed'].includes(booking.status);
      })
      .reduce((sum, booking) => {
        const amount = typeof booking.total_amount === 'string'
          ? parseFloat(booking.total_amount) || 0
          : Number(booking.total_amount) || 0;
        return sum + amount;
      }, 0);

    return revenue;
  };

  const calculateAverageBookingValue = () => {
    const eventsCount = calculateEventsInPeriod();
    const revenue = calculateRevenueInPeriod();

    if (eventsCount === 0 || isNaN(revenue) || revenue === 0) return 0;

    const avg = revenue / eventsCount;
    return isNaN(avg) ? 0 : avg;
  };

  const formatCurrency = (amount: number): string => {
    if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate duration in days
  const calculateDurationDays = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  // Calculate hours for same-day events
  const calculateHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  // Add this handler function
  const handleCheckout = (booking: FunctionBooking) => {
    const remainingAmount = (booking.total_amount || 0) - (booking.advance_paid || 0);

    if (remainingAmount <= 0) {
      toast({
        title: "Info",
        description: "This booking is already fully paid",
      });
      return;
    }

    setSelectedBookingForCheckout(booking);
    setShowCheckoutModal(true);
  };

  // Handle checkout completion
  // Make sure this function exists and does this:
  const handleCheckoutComplete = () => {
    console.log('🔄 Checkout complete, refreshing bookings...');
    // Refresh both rooms and bookings
    fetchFunctionRooms();
    fetchFunctionBookings();

    toast({
      title: "Success",
      description: "Payment completed successfully",
    });
  };

  // Handle cancel button click
  // const handleCancelClick = (booking: FunctionBooking) => {
  //   setSelectedBookingForCancel(booking);
  //   setShowCancelModal(true);
  // };

  // Handle cancel complete
  // const handleCancelComplete = () => {
  //   console.log('🔄 Cancel complete, refreshing bookings...');
  //   fetchFunctionRooms();
  //   fetchFunctionBookings();

  //   toast({
  //     title: "Success",
  //     description: "Booking cancelled successfully",
  //   });
  // };

  // Update filtered bookings when date range changes
  useEffect(() => {
    if (bookings.length > 0 && statsDateRange.from && statsDateRange.to) {
      const filtered = bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= statsDateRange.from && bookingDate <= statsDateRange.to;
      });
      setFilteredBookingsByDate(filtered);
    }
  }, [bookings, statsDateRange.from, statsDateRange.to]);

  useEffect(() => {
    const fetchHotelQRCode = async () => {
      if (currentUser?.source === 'database' && paymentMethod === 'online') {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/hotels/settings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data?.qrcode_image) {
              setHotelQRCode(data.data.qrcode_image);
            }
          }
        } catch (error) {
          console.error('Error fetching hotel QR code:', error);
        }
      }
    };

    fetchHotelQRCode();
  }, [currentUser?.source, paymentMethod]);

  // Generate UPI QR Code
  // const generateUPIQrCode = async () => {
  //   setIsGeneratingQR(true);
  //   try {
  //     if (!hotelQRCode) {
  //       const upiId = 'hotel@upi';
  //       const merchantName = 'Hotel Management';
  //       const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  //       const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${calculateGrandTotal()}&cu=INR&tn=${encodeURIComponent(transactionId)}`;
  //       setQrCodeData(upiString);
  //     }

  //     localStorage.setItem('currentTransaction', JSON.stringify({
  //       id: `TXN${Date.now()}`,
  //       amount: calculateGrandTotal(),
  //       roomId: selectedRoom?.id,
  //       timestamp: Date.now()
  //     }));

  //     toast({
  //       title: "QR Code Generated",
  //       description: "Scan to pay",
  //     });

  //   } catch (error) {
  //     console.error('Error generating QR code:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to generate QR code",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setIsGeneratingQR(false);
  //   }
  // };

  // Generate UPI QR Code
  const generateUPIQrCode = async () => {
    setIsGeneratingQR(true);
    try {
      // Generate a transaction ID
      const newTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setTransactionId(newTransactionId); // <-- SET THE TRANSACTION ID HERE

      if (!hotelQRCode) {
        const upiId = 'hotel@upi';
        const merchantName = 'Hotel Management';

        const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${getCollectibleAmount()}&cu=INR&tn=${encodeURIComponent(newTransactionId)}`;
        setQrCodeData(upiString);
      }

      localStorage.setItem('currentTransaction', JSON.stringify({
        id: newTransactionId,
        amount: getCollectibleAmount(),
        roomId: selectedRoom?.id,
        timestamp: Date.now()
      }));

      toast({
        title: "QR Code Generated",
        description: "Scan to pay",
      });

    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Verify payment
  // const verifyPayment = async () => {
  //   setIsVerifyingPayment(true);
  //   setTimeout(() => {
  //     setPaymentStatus('completed');
  //     toast({
  //       title: "✅ Payment Successful",
  //       description: "Payment verified successfully!",
  //       variant: "default"
  //     });
  //     setIsVerifyingPayment(false);
  //   }, 2000);
  // };

  // Verify payment
  const verifyPayment = async () => {
    setIsVerifyingPayment(true);
    setTimeout(() => {
      setPaymentStatus('completed');

      // If we don't have a transaction ID, generate one
      if (!transactionId) {
        setTransactionId(`TXN${Date.now()}${Math.floor(Math.random() * 1000)}`);
      }

      toast({
        title: "✅ Payment Successful",
        description: "Payment verified successfully!",
        variant: "default"
      });
      setIsVerifyingPayment(false);
    }, 2000);
  };

  // ===========================================
  // FETCH DATA
  // ===========================================

  const fetchFunctionRooms = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🔄 Fetching function rooms...');
      const data = await getFunctionRooms();
      setRooms(data);

      await fetchFunctionBookings();

      if (isRefresh) {
        toast({
          title: 'Success',
          description: `Loaded ${data.length} function rooms`,
        });
      }

    } catch (error: any) {
      console.error('❌ Error fetching function rooms:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load function rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // const fetchFunctionBookings = async () => {
  //   try {
  //     console.log('📡 Fetching ALL function bookings...');
  //     const data = await getFunctionBookings({});
  //     console.log('✅ Received bookings data:', data);
  //     setBookings(data);
  //   } catch (error) {
  //     console.error('❌ Error fetching function bookings:', error);
  //     setBookings([]);
  //   }
  // };

  const fetchFunctionBookings = async () => {
    try {
      console.log('📡 Fetching ALL function bookings...');
      const data = await getFunctionBookings({});
      console.log('✅ Received bookings data:', data);

      // Get IDs of cancelled bookings to fetch refunds
      const cancelledBookingIds = data
        .filter((booking: any) => booking.status === 'cancelled')
        .map((booking: any) => booking.id);

      console.log('Cancelled function booking IDs:', cancelledBookingIds);

      // Fetch refunds for cancelled bookings
      let refundMap = new Map();
      if (cancelledBookingIds.length > 0) {
        refundMap = await fetchRefundsForFunctionBookings(cancelledBookingIds);
      }

      // Merge refund data with bookings
      const transformedData = data.map((booking: any) => {
        if (booking.status === 'cancelled') {
          const refund = refundMap.get(booking.id);
          if (refund) {
            return {
              ...booking,
              refund_amount: refund.refund_amount,
              refund_method: refund.refund_method,
              refund_status: refund.refund_status,
              refund_processed_at: refund.processed_at,
              refund_id: refund.id,
              cancellation_reason: booking.cancellation_reason || refund.refund_reason
            };
          }
        }
        return booking;
      });

      console.log('✅ Received bookings data with refunds:', transformedData);
      setBookings(transformedData);
    } catch (error) {
      console.error('❌ Error fetching function bookings:', error);
      setBookings([]);
    }
  };


  const fetchRefundsForFunctionBookings = async (bookingIds: number[]): Promise<Map<number, any>> => {
    if (bookingIds.length === 0) return new Map();

    try {
      const token = localStorage.getItem('authToken');
      const refundMap = new Map();

      const bookingIdsParam = bookingIds.join(',');
      const response = await fetch(
        `${API_BASE_URL}/refunds/refunds/history?booking_ids=${bookingIdsParam}&booking_type=function`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          result.data.forEach((refund: any) => {
            refundMap.set(refund.booking_id, refund);
          });
        }
      }

      return refundMap;
    } catch (error) {
      console.error('Error fetching refunds:', error);
      return new Map();
    }
  };

  // Add this function after your other helper functions

  const getRefundBadge = (booking: FunctionBooking) => {
    if (booking.status !== 'cancelled') return null;

    if (!booking.refund_amount || booking.refund_amount === 0) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          No Refund
        </Badge>
      );
    }

    const refundStatusConfig: Record<string, { label: string; class: string }> = {
      completed: { label: 'Refunded', class: 'bg-green-100 text-green-800 border-green-200' },
      pending: { label: 'Refund Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      failed: { label: 'Refund Failed', class: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = refundStatusConfig[booking.refund_status || 'pending'] ||
      { label: 'Refund Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' };

    return (
      <Badge
        variant="outline"
        className={`${config.class} cursor-pointer hover:opacity-80`}
        onClick={() => viewRefundDetails(booking)}
      >
        <IndianRupee className="h-3 w-3 mr-1" />
        Refund: ₹{booking.refund_amount} ({config.label})
      </Badge>
    );
  };

  // Add this function to view refund details
  const viewRefundDetails = (booking: FunctionBooking) => {
    if (booking.refund_id) {
      toast({
        title: "Refund Details",
        description: (
          <div className="mt-2 space-y-1">
            <p><strong>Refund Amount:</strong> ₹{booking.refund_amount}</p>
            <p><strong>Refund Method:</strong> {booking.refund_method || 'N/A'}</p>
            <p><strong>Refund Status:</strong> {booking.refund_status || 'N/A'}</p>
            {booking.cancellation_reason && (
              <p><strong>Cancellation Reason:</strong> {booking.cancellation_reason}</p>
            )}
            {booking.refund_processed_at && (
              <p><strong>Processed At:</strong> {new Date(booking.refund_processed_at).toLocaleString()}</p>
            )}
          </div>
        ),
        duration: 5000
      });
    }
  };

  const fetchStandardRooms = async () => {
    try {
      // Use the actual date range from booking form
      const checkInDate = bookingForm.check_in_date;
      const checkOutDate = bookingForm.check_out_date;

      if (!checkInDate || !checkOutDate) {
        console.log('❌ No dates selected');
        setStandardRooms([]);
        return;
      }

      console.log('🔍 Fetching rooms available from:', checkInDate, 'to:', checkOutDate);

      // Fetch rooms available for the ENTIRE date range
      const data = await getAvailableRoomsCorrectly({
        from_date: checkInDate,
        to_date: checkOutDate
      });

      console.log('✅ API returned rooms:', data.length);
      console.log('📋 Rooms from API:', data.map(r => ({ id: r.id, number: r.room_number, type: r.type })));

      // Check for advance bookings
      try {
        const token = localStorage.getItem('authToken');
        const advanceResponse = await fetch(`${API_BASE_URL}/advance-bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (advanceResponse.ok) {
          const advanceResult = await advanceResponse.json();

          let advanceData = [];
          if (advanceResult.success && Array.isArray(advanceResult.data)) {
            advanceData = advanceResult.data;
          } else if (Array.isArray(advanceResult)) {
            advanceData = advanceResult;
          } else if (advanceResult.data && Array.isArray(advanceResult.data)) {
            advanceData = advanceResult.data;
          }

          console.log('📦 Advance bookings for availability check:', advanceData.length);
          console.log('📋 Advance bookings:', advanceData.map(ab => ({
            id: ab.id,
            room: ab.room_id || ab.roomId || ab.room_number,
            from: ab.from_date || ab.fromDate,
            to: ab.to_date || ab.toDate,
            status: ab.status
          })));

          // Filter advance bookings that overlap with the selected date range
          const overlappingAdvanceBookings = advanceData.filter((ab: any) => {
            const status = ab.status || '';
            if (!['confirmed', 'pending'].includes(status.toLowerCase())) {
              return false;
            }

            const fromDate = ab.from_date || ab.fromDate || ab.checkIn;
            const toDate = ab.to_date || ab.toDate || ab.checkOut;

            if (!fromDate || !toDate) return false;

            const bookingFrom = new Date(fromDate);
            const bookingTo = new Date(toDate);
            const checkFrom = new Date(checkInDate);
            const checkTo = new Date(checkOutDate);

            // Reset time part
            bookingFrom.setHours(0, 0, 0, 0);
            bookingTo.setHours(0, 0, 0, 0);
            checkFrom.setHours(0, 0, 0, 0);
            checkTo.setHours(0, 0, 0, 0);

            // Check if the date ranges overlap
            const overlaps = (checkFrom <= bookingTo && checkTo >= bookingFrom);
            if (overlaps) {
              console.log(`⚠️ Advance booking overlap:`, {
                room: ab.room_id || ab.roomId,
                booking: `${format(bookingFrom, 'MMM d')} - ${format(bookingTo, 'MMM d')}`,
                selected: `${format(checkFrom, 'MMM d')} - ${format(checkTo, 'MMM d')}`
              });
            }
            return overlaps;
          });

          console.log('🎯 Advance bookings overlapping with selected range:', overlappingAdvanceBookings.length);

          const advanceBookedRoomIds = new Set(
            overlappingAdvanceBookings
              .map((ab: any) => {
                return ab.room_id || ab.roomId || ab.room_number || ab.roomNumber;
              })
              .filter((id: any) => id != null)
          );

          console.log('🚫 Rooms with advance bookings:', [...advanceBookedRoomIds]);

          const availableRooms = data.filter((room: any) => {
            const roomId = room.id || room.room_id;
            const roomNumber = room.room_number || room.number;

            const hasAdvanceBooking =
              advanceBookedRoomIds.has(roomId) ||
              advanceBookedRoomIds.has(roomNumber) ||
              advanceBookedRoomIds.has(roomId?.toString()) ||
              advanceBookedRoomIds.has(roomNumber?.toString());

            if (hasAdvanceBooking) {
              console.log(`❌ Room ${roomNumber} (ID: ${roomId}) has advance booking - excluding from list`);
              return false;
            }

            return true;
          });

          console.log('✅ Final available rooms after advance booking check:', availableRooms.length);
          console.log('📋 Available rooms:', availableRooms.map(r => ({ id: r.id, number: r.room_number })));
          setStandardRooms(availableRooms);
        } else {
          console.warn('⚠️ Could not fetch advance bookings, using regular availability only');
          setStandardRooms(data);
        }
      } catch (error) {
        console.error('❌ Error checking advance bookings:', error);
        setStandardRooms(data);
      }

    } catch (error) {
      console.error('Error fetching standard rooms:', error);
      setStandardRooms([]);
    }
  };

  // Sync payment method with booking form when user selects payment method
  useEffect(() => {
    if (paymentMethod) {
      setBookingForm(prev => ({
        ...prev,
        payment_method: paymentMethod
      }));
    }
  }, [paymentMethod]);

  // Basic plan: default to cash on payment step
  useEffect(() => {
    if (activeStep === 3 && !paymentMethod && !isProUser) {
      setPaymentMethod('cash');
    }
  }, [activeStep, isProUser, paymentMethod]);

  // Debug: Log standardRooms changes
  useEffect(() => {
    console.log('📊 standardRooms updated:', {
      count: standardRooms.length,
      rooms: standardRooms.map(r => ({ id: r.id, number: r.room_number }))
    });
  }, [standardRooms]);

  useEffect(() => {
    if (isProUser) {
      fetchFunctionRooms();
      fetchStandardRooms();
    }
  }, [selectedDate, isProUser]);

  useEffect(() => {
    if (isProUser && activeTab === 'bookings') {
      fetchFunctionBookings();
    }
  }, [selectedDate, activeTab]);

  // Update when either date changes or modal opens
  useEffect(() => {
    if (showBookingModal) {
      console.log('🔄 Dates changed or modal opened, refreshing standard rooms with:', {
        check_in: bookingForm.check_in_date,
        check_out: bookingForm.check_out_date
      });
      fetchStandardRooms();
    }
  }, [bookingForm.check_in_date, bookingForm.check_out_date, showBookingModal]);

  // ===========================================
  // CHECK AVAILABILITY FOR DATE RANGE
  // ===========================================

  // const checkRoomAvailability = async (roomId: number) => {
  //   try {
  //     setCheckingAvailability(prev => ({ ...prev, [roomId]: true }));

  //     const token = localStorage.getItem('authToken');
  //     const response = await fetch(`${API_BASE_URL}/function-rooms/check-availability`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         room_id: roomId,
  //         check_in_date: format(dateRange.from, 'yyyy-MM-dd'),
  //         check_out_date: format(dateRange.to, 'yyyy-MM-dd'),
  //         start_time: bookingForm.start_time,
  //         end_time: bookingForm.end_time
  //       })
  //     });

  //     if (!response.ok) {
  //       console.error('❌ Availability check failed:', response.status);
  //       setAvailabilityMap(prev => ({ ...prev, [roomId]: false }));
  //       return false;
  //     }

  //     const result = await response.json();
  //     const isAvailable = result.data?.available || false;

  //     setAvailabilityMap(prev => ({ ...prev, [roomId]: isAvailable }));
  //     return isAvailable;
  //   } catch (error) {
  //     console.error(`❌ Error checking availability for room ${roomId}:`, error);
  //     setAvailabilityMap(prev => ({ ...prev, [roomId]: false }));
  //     return false;
  //   } finally {
  //     setCheckingAvailability(prev => ({ ...prev, [roomId]: false }));
  //   }
  // };

  // ===========================================
  // CHECK AVAILABILITY FOR DATE RANGE
  // ===========================================

  const checkRoomAvailability = async (roomId: number) => {
    try {
      setCheckingAvailability(prev => ({ ...prev, [roomId]: true }));

      // Use the imported function instead of direct fetch
      const isAvailable = await checkFunctionRoomAvailability(
        roomId,
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd'),
        bookingForm.start_time,
        bookingForm.end_time
      );

      setAvailabilityMap(prev => ({ ...prev, [roomId]: isAvailable }));
      return isAvailable;
    } catch (error) {
      console.error(`❌ Error checking availability for room ${roomId}:`, error);
      setAvailabilityMap(prev => ({ ...prev, [roomId]: false }));
      return false;
    } finally {
      setCheckingAvailability(prev => ({ ...prev, [roomId]: false }));
    }
  };

  // useEffect(() => {
  //   const checkAllRoomsAvailability = async () => {
  //     if (rooms.length > 0 && dateRange.from && dateRange.to) {
  //       const availability: Record<number, boolean> = {};

  //       for (const room of rooms) {
  //         try {
  //           const token = localStorage.getItem('authToken');
  //           const response = await fetch(`${API_BASE_URL}/function-rooms/check-availability`, {
  //             method: 'POST',
  //             headers: {
  //               'Authorization': `Bearer ${token}`,
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify({
  //               room_id: room.id,
  //               check_in_date: format(dateRange.from, 'yyyy-MM-dd'),
  //               check_out_date: format(dateRange.to, 'yyyy-MM-dd'),
  //               start_time: bookingForm.start_time,
  //               end_time: bookingForm.end_time
  //             })
  //           });

  //           if (response.ok) {
  //             const result = await response.json();
  //             availability[room.id] = result.data?.available || false;
  //           } else {
  //             availability[room.id] = false;
  //           }
  //         } catch (error) {
  //           console.error(`Error checking availability for room ${room.id}:`, error);
  //           availability[room.id] = false;
  //         }
  //       }

  //       console.log('Final availability map:', availability);
  //       setAvailabilityMap(availability);
  //     }
  //   };

  //   if (rooms.length > 0 && showBookingModal) {
  //     checkAllRoomsAvailability();
  //   }
  // }, [dateRange.from, dateRange.to, bookingForm.start_time, bookingForm.end_time, rooms, showBookingModal]);

  // ===========================================
  // BOOKING FORM HANDLERS
  // ===========================================

  useEffect(() => {
    const checkAllRoomsAvailability = async () => {
      if (rooms.length > 0 && dateRange.from && dateRange.to && showBookingModal) {
        const availability: Record<number, boolean> = {};

        for (const room of rooms) {
          try {
            const isAvailable = await checkFunctionRoomAvailability(
              room.id,
              format(dateRange.from, 'yyyy-MM-dd'),
              format(dateRange.to, 'yyyy-MM-dd'),
              bookingForm.start_time,
              bookingForm.end_time
            );
            availability[room.id] = isAvailable;
          } catch (error) {
            console.error(`Error checking availability for room ${room.id}:`, error);
            availability[room.id] = false;
          }
        }

        console.log('Final availability map:', availability);
        setAvailabilityMap(availability);
      }
    };

    if (rooms.length > 0 && showBookingModal) {
      checkAllRoomsAvailability();
    }
  }, [dateRange.from, dateRange.to, bookingForm.start_time, bookingForm.end_time, rooms, showBookingModal]);


  // const handleOpenBookingModal = async (room: FunctionRoom) => {
  //   try {
  //     // Set initial date range
  //     const initialFrom = new Date();
  //     const initialTo = addDays(new Date(), 1);

  //     setDateRange({
  //       from: initialFrom,
  //       to: initialTo
  //     });

  //     // Update booking form with initial dates
  //     setBookingForm(prev => ({
  //       ...prev,
  //       check_in_date: format(initialFrom, 'yyyy-MM-dd'),
  //       check_out_date: format(initialTo, 'yyyy-MM-dd')
  //     }));

  //     // Check availability with the updated function
  //     const isAvailable = await checkRoomAvailability(room.id);

  //     if (isAvailable) {
  //       setSelectedRoom(room);
  //       setCustomBasePrice(room.base_price);
  //       setCustomGstPercentage(18);
  //       setCustomDiscount(0);
  //       setCustomOtherCharges(0);
  //       setSelectedRooms([]);
  //       setSelectedCustomer(null);
  //       setBookingForm(prev => ({
  //         ...prev,
  //         function_room_id: room.id,
  //         event_type: room.type,
  //         guests_expected: Math.min(room.capacity, 50),
  //       }));
  //       setShowBookingModal(true);

  //       // Fetch available rooms for the initial dates
  //       setTimeout(() => {
  //         fetchStandardRooms();
  //       }, 100);
  //     } else {
  //       toast({
  //         title: 'Not Available',
  //         description: `"${room.name}" is not available for the selected dates`,
  //         variant: 'destructive',
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error checking availability:', error);
  //   }
  // };

  const handleOpenBookingModal = async (room: FunctionRoom) => {
    try {
      // First, reset all form data
      resetBookingForm();

      // Set initial date range
      const today = new Date();
      const tomorrow = addDays(today, 1);

      setDateRange({
        from: today,
        to: tomorrow
      });

      // Update booking form with initial dates
      setBookingForm(prev => ({
        ...prev,
        check_in_date: format(today, 'yyyy-MM-dd'),
        check_out_date: format(tomorrow, 'yyyy-MM-dd')
      }));

      // Check availability
      const isAvailable = await checkRoomAvailability(room.id);

      if (isAvailable) {
        setSelectedRoom(room);
        setCustomBasePrice(room.base_price);
        setCustomGstPercentage(18);
        setCustomDiscount(0);
        setCustomOtherCharges(0);
        setSelectedRooms([]);
        setSelectedCustomer(null);
        setBookingForm(prev => ({
          ...prev,
          function_room_id: room.id,
          event_type: room.type,
          guests_expected: Math.min(room.capacity, 50),
        }));
        setShowBookingModal(true);

        // Fetch available rooms for the initial dates
        setTimeout(() => {
          fetchStandardRooms();
        }, 100);
      } else {
        toast({
          title: 'Not Available',
          description: `"${room.name}" is not available for the selected dates`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };


  const handleCustomerPhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawPhone = e.target.value;
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const limitedPhone = digitsOnly.slice(0, 10);

    setBookingForm({ ...bookingForm, customer_phone: limitedPhone });

    if (limitedPhone.length === 10) {
      console.log('🔍 Searching for customer with phone:', limitedPhone);
      try {
        const customers = await searchCustomersByPhone(limitedPhone);
        setFoundCustomers(customers || []);
        setShowCustomerSearch(customers && customers.length > 0);
      } catch (error) {
        console.error('❌ Error searching customers:', error);
        setFoundCustomers([]);
        setShowCustomerSearch(false);
      }
    } else {
      setShowCustomerSearch(false);
      setFoundCustomers([]);
      setSelectedCustomer(null);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBookingForm({
      ...bookingForm,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email || ''
    });
    setShowCustomerSearch(false);
    setFoundCustomers([]);
  };

  // ===========================================
  // ROOM SELECTION HANDLERS - BLOCK ONLY
  // ===========================================

  // const blockRoom = async (room: any) => {
  //   const checkIn = bookingForm.check_in_date;
  //   const checkOutDate = addDays(new Date(checkIn), 1);
  //   const checkOut = format(checkOutDate, 'yyyy-MM-dd');

  //   if (selectedRooms.some(r => r.room_id === room.id)) {
  //     toast({
  //       title: 'Room already selected',
  //       description: `Room ${room.room_number} is already in your selection`,
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   const isAvailable = await checkStandardRoomAvailability(room.id, checkIn, checkOut);

  //   if (!isAvailable) {
  //     toast({
  //       title: 'Room not available',
  //       description: `Room ${room.room_number} is already booked for the selected dates`,
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   setSelectedRooms([
  //     ...selectedRooms,
  //     {
  //       room_id: room.id,
  //       room_number: room.room_number,
  //       room_type: room.type,
  //       check_in: checkIn,
  //       check_out: checkOut,
  //       isBlocked: true
  //     }
  //   ]);

  //   setBookingForm({
  //     ...bookingForm,
  //     has_room_bookings: true
  //   });

  //   toast({
  //     title: 'Room Blocked',
  //     description: `Room ${room.room_number} will be blocked for the selected dates`
  //   });
  // };
  const blockRoom = async (room: any) => {
    const checkIn = bookingForm.check_in_date;
    const checkOut = bookingForm.check_out_date;

    if (selectedRooms.some(r => r.room_id === room.id)) {
      toast({
        title: 'Room already selected',
        description: `Room ${room.room_number} is already in your selection`,
        variant: 'destructive'
      });
      return;
    }

    // Check availability for the ENTIRE date range
    const isAvailable = await checkStandardRoomAvailability(room.id, checkIn, checkOut);

    if (!isAvailable) {
      toast({
        title: 'Room not available',
        description: `Room ${room.room_number} is already booked for ${format(new Date(checkIn), 'MMM d')} - ${format(new Date(checkOut), 'MMM d')}`,
        variant: 'destructive'
      });
      return;
    }

    setSelectedRooms([
      ...selectedRooms,
      {
        room_id: room.id,
        room_number: room.room_number,
        room_type: room.type,
        check_in: checkIn,
        check_out: checkOut,
        isBlocked: true
      }
    ]);

    setBookingForm({
      ...bookingForm,
      has_room_bookings: true
    });

    toast({
      title: 'Room Blocked',
      description: `Room ${room.room_number} will be blocked from ${format(new Date(checkIn), 'MMM d')} to ${format(new Date(checkOut), 'MMM d')}`
    });
  };

  const removeRoomFromSelection = (roomId: number) => {
    setSelectedRooms(selectedRooms.filter(r => r.room_id !== roomId));
    if (selectedRooms.length === 0) {
      setBookingForm({
        ...bookingForm,
        has_room_bookings: false
      });
    }
  };

  // ===========================================
  // PRICE CALCULATIONS
  // ===========================================

  useEffect(() => {
    if (selectedRoom) {
      const days = calculateDurationDays(bookingForm.check_in_date, bookingForm.check_out_date);
      let basePrice = selectedRoom.base_price * days;

      // For single day events, check for half-day or hourly rates
      if (bookingForm.check_in_date === bookingForm.check_out_date) {
        const hours = calculateHours(bookingForm.start_time, bookingForm.end_time);

        if (hours <= 4 && selectedRoom.half_day_price) {
          basePrice = Number(selectedRoom.half_day_price) || 0;
        } else if (hours <= 2 && selectedRoom.hourly_rate) {
          basePrice = Number(selectedRoom.hourly_rate) * hours || 0;
        }
      }

      setCustomBasePrice(basePrice);
    }
  }, [selectedRoom, bookingForm.check_in_date, bookingForm.check_out_date,
    bookingForm.start_time, bookingForm.end_time]);

  const calculateSubtotal = (): number => {
    return Number(customBasePrice) || 0;
  };

  const calculateGST = (): number => {
    const subtotal = calculateSubtotal();
    const gstPercent = Number(customGstPercentage) || 0;
    return (subtotal * gstPercent) / 100;
  };

  const calculateDiscount = (): number => {
    const subtotal = calculateSubtotal();
    const discountValue = Number(customDiscount) || 0;
    if (customDiscountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    } else {
      return discountValue;
    }
  };

  const calculateFunctionTotal = (): number => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST();
    const discount = calculateDiscount();
    const otherCharges = Number(customOtherCharges) || 0;
    return Number(subtotal) + Number(gst) - Number(discount) + Number(otherCharges);
  };

  const calculateGrandTotal = (): number => {
    return calculateFunctionTotal();
  };

  const getCollectibleAmount = (): number => {
    const advance = Number(bookingForm.advance_paid) || 0;
    const grandTotal = calculateGrandTotal();
    if (advance > 0) {
      return Math.min(advance, grandTotal);
    }
    return grandTotal;
  };

  const getBalanceDue = (): number =>
    Math.max(0, calculateGrandTotal() - getCollectibleAmount());

  const getResolvedPaymentMethod = (): 'cash' | 'online' =>
    (paymentMethod || bookingForm.payment_method || 'cash') as 'cash' | 'online';

  // const handleCloseBookingModal = () => {
  //   setShowBookingModal(false);
  //   setSelectedRoom(null);
  //   setSelectedRooms([]);
  //   setPaymentMethod(null);
  //   setPaymentStatus('pending');
  //   setQrCodeData('');
  //   setActiveStep(1);
  // };

  // ===========================================
  // BOOKING SUBMISSION
  // ===========================================

  // const handleBookingSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!selectedRoom) {
  //     toast({
  //       title: 'Error',
  //       description: 'No function room selected',
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   if (!bookingForm.event_name || !bookingForm.customer_name || !bookingForm.customer_phone) {
  //     toast({
  //       title: 'Validation Error',
  //       description: 'Event name, customer name and phone are required',
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   // Final availability check
  //   const isAvailable = await checkRoomAvailability(selectedRoom.id);

  //   if (!isAvailable) {
  //     toast({
  //       title: 'Not Available',
  //       description: `"${selectedRoom.name}" is no longer available for the selected dates`,
  //       variant: 'destructive'
  //     });
  //     setIsSubmitting(false);
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     const days = calculateDurationDays(bookingForm.check_in_date, bookingForm.check_out_date);

  //     // Determine rate type
  //     let rateType = 'full_day';
  //     if (bookingForm.check_in_date !== bookingForm.check_out_date) {
  //       rateType = 'multi_day';
  //     } else {
  //       const hours = calculateHours(bookingForm.start_time, bookingForm.end_time);
  //       if (hours <= 4 && selectedRoom.half_day_price) {
  //         rateType = 'half_day';
  //       } else if (hours <= 2 && selectedRoom.hourly_rate) {
  //         rateType = 'hourly';
  //       }
  //     }

  //     // Handle customer
  //     let customerId = null;
  //     const cleanPhone = bookingForm.customer_phone.replace(/\D/g, '');
  //     const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;

  //     if (selectedCustomer) {
  //       customerId = selectedCustomer.id;
  //     } else {
  //       try {
  //         const existingCustomers = await searchCustomersByPhone(formattedPhone);
  //         if (existingCustomers && existingCustomers.length > 0) {
  //           customerId = existingCustomers[0].id;
  //         } else {
  //           const newCustomer = await createCustomer({
  //             name: bookingForm.customer_name,
  //             phone: formattedPhone,
  //             email: bookingForm.customer_email || null
  //           });
  //           customerId = newCustomer?.data?.customerId || newCustomer?.customerId;
  //         }
  //       } catch (error) {
  //         console.error('❌ Customer handling error:', error);
  //       }
  //     }

  //     // Create BLOCKED room records
  //     const roomBookingIds: number[] = [];
  //     const blockedRooms = selectedRooms;

  //     if (blockedRooms.length > 0) {
  //       console.log('🔄 Attempting to create blocked rooms:', blockedRooms.length);

  //       for (const room of blockedRooms) {
  //         try {
  //           const blockRoomData = {
  //             roomId: room.room_id,
  //             roomNumber: room.room_number,
  //             fromDate: room.check_in,
  //             toDate: room.check_out,
  //             reason: `Blocked for function booking: ${bookingForm.event_name || 'Event'}`,
  //             blockedBy: currentUser?.name || 'Admin'
  //           };

  //           console.log('📤 Sending block room data to API:', blockRoomData);

  //           const token = localStorage.getItem('authToken');
  //           const response = await fetch(`${API_BASE_URL}/bookings/block-room`, {
  //             method: 'POST',
  //             headers: {
  //               'Authorization': `Bearer ${token}`,
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify(blockRoomData)
  //           });

  //           const blockRoomResult = await response.json();

  //           if (blockRoomResult && blockRoomResult.success) {
  //             if (blockRoomResult.data && blockRoomResult.data.bookingId) {
  //               roomBookingIds.push(blockRoomResult.data.bookingId);
  //               console.log(`✅ Blocked room created with ID: ${blockRoomResult.data.bookingId}`);
  //             }
  //           } else {
  //             console.error('❌ Block room failed:', blockRoomResult.error || blockRoomResult.message || 'Unknown error');
  //             toast({
  //               title: 'Warning',
  //               description: `Failed to block room ${room.room_number}: ${blockRoomResult.message || 'Unknown error'}`,
  //               variant: 'destructive'
  //             });
  //           }
  //         } catch (error) {
  //           console.error('❌ Error creating blocked room:', error);
  //         }
  //       }
  //     }

  //     // Create function booking
  //     const functionBookingData = {
  //       function_room_id: selectedRoom.id,
  //       event_name: bookingForm.event_name,
  //       event_type: bookingForm.event_type || selectedRoom.type,
  //       check_in_date: bookingForm.check_in_date,
  //       check_out_date: bookingForm.check_out_date,
  //       start_time: bookingForm.start_time,
  //       end_time: bookingForm.end_time,
  //       rate_type: rateType,
  //       rate_amount: customBasePrice,
  //       subtotal: customBasePrice,
  //       service_charge: 0,
  //       gst_percentage: customGstPercentage,
  //       gst: calculateGST(),
  //       discount: calculateDiscount(),
  //       discount_type: customDiscountType,
  //       other_charges: customOtherCharges,
  //       other_charges_description: otherChargesDescription || null,
  //       total_amount: calculateFunctionTotal(),
  //       advance_paid: Number(bookingForm.advance_paid) || 0,
  //       guests_expected: Number(bookingForm.guests_expected) || 1,
  //       payment_method: bookingForm.payment_method,
  //       payment_status: bookingForm.advance_paid > 0 ? 'partial' : 'pending',
  //       status: 'confirmed',

  //       customer_name: bookingForm.customer_name,
  //       customer_phone: bookingForm.customer_phone,
  //       customer_email: bookingForm.customer_email || null,
  //       customer_gst: bookingForm.customer_gst || null,
  //       billing_address: bookingForm.billing_address || null,
  //       billing_state: bookingForm.billing_state || null,
  //       billing_state_code: bookingForm.billing_state_code || null,
  //       billing_city: bookingForm.billing_city || null,
  //       billing_pincode: bookingForm.billing_pincode || null,
  //       business_type: bookingForm.business_type || 'b2c',

  //       customer_id: customerId,

  //       has_room_bookings: selectedRooms.length > 0,
  //       room_booking_ids: JSON.stringify(roomBookingIds),
  //       total_rooms_blocked: blockedRooms.length,
  //       total_room_amount: 0,
  //       total_room_gst: 0,

  //       special_requests: bookingForm.special_requests || null,
  //       catering_requirements: bookingForm.catering_requirements || null
  //     };

  //     console.log('📤 Creating function booking:', functionBookingData);
  //     const result = await createFunctionBooking(functionBookingData);

  //     if (result && result.success) {
  //       toast({
  //         title: '✅ Booking Created Successfully',
  //         description: `Booking reference: ${result.data.booking_reference}`,
  //       });

  //       handleCloseBookingModal();
  //       fetchFunctionRooms();
  //       fetchFunctionBookings();
  //     } else {
  //       throw new Error(result?.message || 'Failed to create booking');
  //     }

  //   } catch (error: any) {
  //     console.error('❌ Booking error:', error);
  //     toast({
  //       title: 'Error',
  //       description: error.message || 'Failed to create booking. Please try again.',
  //       variant: 'destructive'
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // const handleBookingSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!selectedRoom) {
  //     toast({
  //       title: 'Error',
  //       description: 'No function room selected',
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   if (!bookingForm.event_name || !bookingForm.customer_name || !bookingForm.customer_phone) {
  //     toast({
  //       title: 'Validation Error',
  //       description: 'Event name, customer name and phone are required',
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   // Final availability check
  //   const isAvailable = await checkRoomAvailability(selectedRoom.id);

  //   if (!isAvailable) {
  //     toast({
  //       title: 'Not Available',
  //       description: `"${selectedRoom.name}" is no longer available for the selected dates`,
  //       variant: 'destructive'
  //     });
  //     setIsSubmitting(false);
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     const days = calculateDurationDays(bookingForm.check_in_date, bookingForm.check_out_date);

  //     // Determine rate type
  //     let rateType = 'full_day';
  //     if (bookingForm.check_in_date !== bookingForm.check_out_date) {
  //       rateType = 'multi_day';
  //     } else {
  //       const hours = calculateHours(bookingForm.start_time, bookingForm.end_time);
  //       if (hours <= 4 && selectedRoom.half_day_price) {
  //         rateType = 'half_day';
  //       } else if (hours <= 2 && selectedRoom.hourly_rate) {
  //         rateType = 'hourly';
  //       }
  //     }

  //     // Handle customer
  //     let customerId = null;
  //     const cleanPhone = bookingForm.customer_phone.replace(/\D/g, '');
  //     const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;

  //     if (selectedCustomer) {
  //       customerId = selectedCustomer.id;
  //     } else {
  //       try {
  //         const existingCustomers = await searchCustomersByPhone(formattedPhone);
  //         if (existingCustomers && existingCustomers.length > 0) {
  //           customerId = existingCustomers[0].id;
  //         } else {
  //           const newCustomer = await createCustomer({
  //             name: bookingForm.customer_name,
  //             phone: formattedPhone,
  //             email: bookingForm.customer_email || null
  //           });
  //           customerId = newCustomer?.data?.customerId || newCustomer?.customerId;
  //         }
  //       } catch (error) {
  //         console.error('❌ Customer handling error:', error);
  //       }
  //     }

  //     // Create BLOCKED room records
  //     const roomBookingIds: number[] = [];
  //     const blockedRooms = selectedRooms;

  //     if (blockedRooms.length > 0) {
  //       console.log('🔄 Attempting to create blocked rooms:', blockedRooms.length);

  //       for (const room of blockedRooms) {
  //         try {
  //           const blockRoomData = {
  //             roomId: room.room_id,
  //             roomNumber: room.room_number,
  //             fromDate: room.check_in,
  //             toDate: room.check_out,
  //             reason: `Blocked for function booking: ${bookingForm.event_name || 'Event'}`,
  //             blockedBy: currentUser?.name || 'Admin'
  //           };

  //           console.log('📤 Sending block room data to API:', blockRoomData);

  //           const token = localStorage.getItem('authToken');
  //           const response = await fetch(`${API_BASE_URL}/bookings/block-room`, {
  //             method: 'POST',
  //             headers: {
  //               'Authorization': `Bearer ${token}`,
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify(blockRoomData)
  //           });

  //           const blockRoomResult = await response.json();

  //           if (blockRoomResult && blockRoomResult.success) {
  //             if (blockRoomResult.data && blockRoomResult.data.bookingId) {
  //               roomBookingIds.push(blockRoomResult.data.bookingId);
  //               console.log(`✅ Blocked room created with ID: ${blockRoomResult.data.bookingId}`);
  //             }
  //           } else {
  //             console.error('❌ Block room failed:', blockRoomResult.error || blockRoomResult.message || 'Unknown error');
  //             toast({
  //               title: 'Warning',
  //               description: `Failed to block room ${room.room_number}: ${blockRoomResult.message || 'Unknown error'}`,
  //               variant: 'destructive'
  //             });
  //           }
  //         } catch (error) {
  //           console.error('❌ Error creating blocked room:', error);
  //         }
  //       }
  //     }

  //     // ====== INSERT THE PAYMENT STATUS CODE HERE ======
  //     // Determine payment status based on advance payment
  //     const advancePaid = Number(bookingForm.advance_paid) || 0;
  //     const grandTotal = calculateGrandTotal();

  //     let paymentStatus = 'pending';
  //     if (advancePaid >= grandTotal) {
  //       paymentStatus = 'completed';
  //     } else if (advancePaid > 0) {
  //       paymentStatus = 'pending'; // or 'partial' if you have that
  //     }
  //     // ====== END OF INSERTED CODE ======

  //     // Create function booking data
  //     const functionBookingData = {
  //       function_room_id: selectedRoom.id,
  //       event_name: bookingForm.event_name,
  //       event_type: bookingForm.event_type || selectedRoom.type,
  //       check_in_date: bookingForm.check_in_date,
  //       check_out_date: bookingForm.check_out_date,
  //       start_time: bookingForm.start_time,
  //       end_time: bookingForm.end_time,
  //       rate_type: rateType,
  //       rate_amount: customBasePrice,
  //       subtotal: customBasePrice,
  //       service_charge: 0,
  //       gst_percentage: customGstPercentage,
  //       gst: calculateGST(),
  //       discount: calculateDiscount(),
  //       discount_type: customDiscountType,
  //       other_charges: customOtherCharges,
  //       other_charges_description: otherChargesDescription || null,
  //       total_amount: calculateFunctionTotal(),
  //       advance_paid: Number(bookingForm.advance_paid) || 0,
  //       guests_expected: Number(bookingForm.guests_expected) || 1,
  //       payment_method: bookingForm.payment_method,
  //       payment_status: paymentStatus, // Use determined status
  //       status: 'confirmed',

  //       customer_name: bookingForm.customer_name,
  //       customer_phone: bookingForm.customer_phone,
  //       customer_email: bookingForm.customer_email || null,
  //       customer_gst: bookingForm.customer_gst || null,
  //       billing_address: bookingForm.billing_address || null,
  //       billing_state: bookingForm.billing_state || null,
  //       billing_state_code: bookingForm.billing_state_code || null,
  //       billing_city: bookingForm.billing_city || null,
  //       billing_pincode: bookingForm.billing_pincode || null,
  //       business_type: bookingForm.business_type || 'b2c',

  //       customer_id: customerId,

  //       has_room_bookings: selectedRooms.length > 0,
  //       room_booking_ids: JSON.stringify(roomBookingIds),
  //       total_rooms_blocked: blockedRooms.length,
  //       total_room_amount: 0,
  //       total_room_gst: 0,

  //       // Add transaction ID if available
  //       transaction_id: paymentMethod === 'online' && transactionId ? transactionId : null,

  //       special_requests: bookingForm.special_requests || null,
  //       catering_requirements: bookingForm.catering_requirements || null
  //     };

  //     console.log('📤 Creating function booking:', functionBookingData);
  //     const result = await createFunctionBooking(functionBookingData);

  //     if (result && result.success) {
  //       toast({
  //         title: '✅ Booking Created Successfully',
  //         description: `Booking reference: ${result.data.booking_reference}`,
  //       });

  //       handleCloseBookingModal();
  //       fetchFunctionRooms();
  //       fetchFunctionBookings();
  //     } else {
  //       throw new Error(result?.message || 'Failed to create booking');
  //     }

  //   } catch (error: any) {
  //     console.error('❌ Booking error:', error);
  //     toast({
  //       title: 'Error',
  //       description: error.message || 'Failed to create booking. Please try again.',
  //       variant: 'destructive'
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    resetBookingForm(); // Reset when closing too
    setSelectedRoom(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoom) {
      toast({
        title: 'Error',
        description: 'No function room selected',
        variant: 'destructive'
      });
      return;
    }

    if (!bookingForm.event_name || !bookingForm.customer_name || !bookingForm.customer_phone) {
      toast({
        title: 'Validation Error',
        description: 'Event name, customer name and phone are required',
        variant: 'destructive'
      });
      return;
    }

    const resolvedPaymentMethod = getResolvedPaymentMethod();
    if (!paymentMethod) {
      toast({
        title: 'Payment method required',
        description: 'Please select Cash or Online on the payment step',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'online' && paymentStatus !== 'completed') {
      toast({
        title: 'Complete payment first',
        description: 'Verify online payment before confirming the booking',
        variant: 'destructive',
      });
      return;
    }

    const advancePaidAtBooking = Number(bookingForm.advance_paid) || 0;
    if (advancePaidAtBooking > calculateGrandTotal()) {
      toast({
        title: 'Invalid advance amount',
        description: 'Advance cannot be greater than the grand total',
        variant: 'destructive',
      });
      return;
    }

    // Final availability check
    const isAvailable = await checkRoomAvailability(selectedRoom.id);

    if (!isAvailable) {
      toast({
        title: 'Not Available',
        description: `"${selectedRoom.name}" is no longer available for the selected dates`,
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const days = calculateDurationDays(bookingForm.check_in_date, bookingForm.check_out_date);

      // Determine rate type
      let rateType = 'full_day';
      if (bookingForm.check_in_date !== bookingForm.check_out_date) {
        rateType = 'multi_day';
      } else {
        const hours = calculateHours(bookingForm.start_time, bookingForm.end_time);
        if (hours <= 4 && selectedRoom.half_day_price) {
          rateType = 'half_day';
        } else if (hours <= 2 && selectedRoom.hourly_rate) {
          rateType = 'hourly';
        }
      }

      // Handle customer
      let customerId = null;
      const cleanPhone = bookingForm.customer_phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;

      if (selectedCustomer) {
        customerId = selectedCustomer.id;
      } else {
        try {
          const existingCustomers = await searchCustomersByPhone(formattedPhone);
          if (existingCustomers && existingCustomers.length > 0) {
            customerId = existingCustomers[0].id;
          } else {
            const newCustomer = await createCustomer({
              name: bookingForm.customer_name,
              phone: formattedPhone,
              email: bookingForm.customer_email || null
            });
            customerId = newCustomer?.data?.customerId || newCustomer?.customerId;
          }
        } catch (error) {
          console.error('❌ Customer handling error:', error);
        }
      }

      // Create BLOCKED room records
      const roomBookingIds: number[] = [];
      const blockedRooms = selectedRooms;

      if (blockedRooms.length > 0) {
        console.log('🔄 Attempting to create blocked rooms:', blockedRooms.length);

        for (const room of blockedRooms) {
          try {
            const blockRoomData = {
              roomId: room.room_id,
              roomNumber: room.room_number,
              fromDate: room.check_in,
              toDate: room.check_out,
              reason: `Blocked for function booking: ${bookingForm.event_name || 'Event'}`,
              blockedBy: currentUser?.name || 'Admin'
            };

            console.log('📤 Sending block room data to API:', blockRoomData);

            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/bookings/block-room`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(blockRoomData)
            });

            const blockRoomResult = await response.json();

            if (blockRoomResult && blockRoomResult.success) {
              if (blockRoomResult.data && blockRoomResult.data.bookingId) {
                roomBookingIds.push(blockRoomResult.data.bookingId);
                console.log(`✅ Blocked room created with ID: ${blockRoomResult.data.bookingId}`);
              }
            } else {
              console.error('❌ Block room failed:', blockRoomResult.error || blockRoomResult.message || 'Unknown error');
              toast({
                title: 'Warning',
                description: `Failed to block room ${room.room_number}: ${blockRoomResult.message || 'Unknown error'}`,
                variant: 'destructive'
              });
            }
          } catch (error) {
            console.error('❌ Error creating blocked room:', error);
          }
        }
      }

      // ====== PAYMENT STATUS CODE ======
      // Determine payment status based on advance payment
      const advancePaid = Number(bookingForm.advance_paid) || 0;
      const grandTotal = calculateGrandTotal();

      let paymentStatusValue = 'pending';
      if (advancePaid >= grandTotal) {
        paymentStatusValue = 'completed';
      } else if (advancePaid > 0) {
        paymentStatusValue = 'pending';
      }

      // Create function booking data
      const functionBookingData = {
        function_room_id: selectedRoom.id,
        event_name: bookingForm.event_name,
        event_type: bookingForm.event_type || selectedRoom.type,
        check_in_date: bookingForm.check_in_date,
        check_out_date: bookingForm.check_out_date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        rate_type: rateType,
        rate_amount: customBasePrice,
        subtotal: customBasePrice,
        service_charge: 0,
        gst_percentage: customGstPercentage,
        gst: calculateGST(),
        discount: calculateDiscount(),
        discount_type: customDiscountType,
        other_charges: customOtherCharges,
        other_charges_description: otherChargesDescription || null,
        total_amount: calculateFunctionTotal(),
        advance_paid: advancePaid,
        guests_expected: Number(bookingForm.guests_expected) || 1,

        payment_method: resolvedPaymentMethod,

        payment_status: paymentStatusValue,
        status: 'confirmed',

        customer_name: bookingForm.customer_name,
        customer_phone: bookingForm.customer_phone,
        customer_email: bookingForm.customer_email || null,
        customer_gst: bookingForm.customer_gst || null,
        billing_address: bookingForm.billing_address || null,
        billing_state: bookingForm.billing_state || null,
        billing_state_code: bookingForm.billing_state_code || null,
        billing_city: bookingForm.billing_city || null,
        billing_pincode: bookingForm.billing_pincode || null,
        business_type: bookingForm.business_type || 'b2c',

        customer_id: customerId,

        has_room_bookings: selectedRooms.length > 0,
        room_booking_ids: JSON.stringify(roomBookingIds),
        total_rooms_blocked: blockedRooms.length,
        total_room_amount: 0,
        total_room_gst: 0,

        // Add transaction ID if available
        transaction_id: resolvedPaymentMethod === 'online' && transactionId ? transactionId : null,

        special_requests: bookingForm.special_requests || null,
        catering_requirements: bookingForm.catering_requirements || null
      };

      console.log('📤 Creating function booking with payment method:', resolvedPaymentMethod, functionBookingData);
      const result = await createFunctionBooking(functionBookingData);

      if (result && result.success) {
        toast({
          title: '✅ Booking Created Successfully',
          description: advancePaid > 0
            ? `Booking ${result.data.booking_reference} created. ₹${advancePaid.toLocaleString('en-IN')} advance recorded (${resolvedPaymentMethod}).`
            : `Booking reference: ${result.data.booking_reference}`,
        });

        handleCloseBookingModal();
        fetchFunctionRooms();
        fetchFunctionBookings();
      } else {
        throw new Error(result?.message || 'Failed to create booking');
      }

    } catch (error: any) {
      console.error('❌ Booking error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewBookingDetails = async (booking: FunctionBooking) => {
    try {
      const data = await getFunctionBookingById(booking.id);
      if (data) {
        setSelectedBooking(data);
        setShowBookingDetails(true);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load booking details',
        variant: 'destructive'
      });
    }
  };

  // Replace your current useEffect with this improved version
  useEffect(() => {
    const checkAvailabilityForSelectedDate = async () => {
      if (rooms.length > 0 && selectedDate) {
        console.log('🔍 Checking availability for date:', format(selectedDate, 'yyyy-MM-dd'));

        const availability: Record<number, boolean> = {};

        for (const room of rooms) {
          try {
            // For single day check, use same date for check-in and check-out
            // but with full day time range
            const isAvailable = await checkFunctionRoomAvailability(
              room.id,
              format(selectedDate, 'yyyy-MM-dd'), // check-in date
              format(selectedDate, 'yyyy-MM-dd'), // check-out date (same day)
              '00:00', // Start of day
              '23:59'  // End of day
            );

            console.log(`Room ${room.id} (${room.name}): ${isAvailable ? '✅ Available' : '❌ Booked'}`);
            availability[room.id] = isAvailable;
          } catch (error) {
            console.error(`Error checking availability for room ${room.id}:`, error);
            availability[room.id] = false;
          }
        }

        console.log('Setting availability map for selected date:', availability);
        setAvailabilityMap(availability);
      }
    };

    checkAvailabilityForSelectedDate();
  }, [rooms, selectedDate]); // Re-run when rooms or selected date changes

  // ===========================================
  // DELETE HANDLER
  // ===========================================

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteFunctionRoom(id);
      toast({
        title: 'Success',
        description: 'Function room deleted successfully',
      });
      fetchFunctionRooms();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete function room',
        variant: 'destructive',
      });
    }
  };

  // ===========================================
  // FILTERS
  // ===========================================

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStandardRooms = standardRooms
    .filter(room => {
      const matchesSearch = roomSearchTerm === '' ||
        room.room_number?.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
        room.type?.toLowerCase().includes(roomSearchTerm.toLowerCase());

      const matchesType = roomTypeFilter === 'all' || room.type === roomTypeFilter;

      return matchesSearch && matchesType;
    });

  const roomTypes = ['all', ...new Set(standardRooms.map(r => r.type).filter(Boolean))];

  const filteredBookings = bookings.filter(booking =>
    booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // Update total pages when filtered bookings change
  useEffect(() => {
    const total = Math.ceil(filteredBookings.length / bookingsPerPage);
    setTotalPages(total || 1);

    // Reset to first page when search term changes
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredBookings, bookingsPerPage, currentPage]);

  // Get current page bookings
  const getCurrentPageBookings = () => {
    const startIndex = (currentPage - 1) * bookingsPerPage;
    const endIndex = startIndex + bookingsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  };

  const currentPageBookings = getCurrentPageBookings();

  // Add these handler functions inside your component, before the return statement:

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setBookingForm(prev => ({ ...prev, start_time: newStartTime }));

    // Re-check availability for all rooms with new time
    if (rooms.length > 0 && dateRange.from && dateRange.to) {
      rooms.forEach(async (room) => {
        try {
          const isAvailable = await checkFunctionRoomAvailability(
            room.id,
            format(dateRange.from, 'yyyy-MM-dd'),
            format(dateRange.to, 'yyyy-MM-dd'),
            newStartTime,
            bookingForm.end_time
          );
          setAvailabilityMap(prev => ({ ...prev, [room.id]: isAvailable }));
        } catch (error) {
          console.error(`Error checking availability for room ${room.id}:`, error);
        }
      });
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setBookingForm(prev => ({ ...prev, end_time: newEndTime }));

    // Re-check availability for all rooms with new time
    if (rooms.length > 0 && dateRange.from && dateRange.to) {
      rooms.forEach(async (room) => {
        try {
          const isAvailable = await checkFunctionRoomAvailability(
            room.id,
            format(dateRange.from, 'yyyy-MM-dd'),
            format(dateRange.to, 'yyyy-MM-dd'),
            bookingForm.start_time,
            newEndTime
          );
          setAvailabilityMap(prev => ({ ...prev, [room.id]: isAvailable }));
        } catch (error) {
          console.error(`Error checking availability for room ${room.id}:`, error);
        }
      });
    }
  };

  // Custom Time Picker with Auto-close
  const CustomTimePicker = ({
    value,
    onChange,
    defaultTime
  }: {
    value: string;
    onChange: (time: string) => void;
    defaultTime: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Generate hours (00-23)
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

    // Generate minutes (00-59)
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    // Close when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTimeSelect = (hour: string, minute: string) => {
      const newTime = `${hour}:${minute}`;
      onChange(newTime);
      setIsOpen(false); // Auto-close when time is selected
    };

    return (
      <div className="relative" ref={pickerRef}>
        <Input
          type="text"
          value={value || defaultTime}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          className="pl-10 w-full cursor-pointer"
          placeholder={defaultTime}
        />

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg p-2">
            <div className="flex gap-2">
              {/* Hours Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
                  Hour
                </div>
                <div className="h-48 overflow-y-auto">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      className="w-full px-2 py-1 text-sm text-center hover:bg-primary hover:text-primary-foreground rounded"
                      onClick={() => {
                        const currentMinute = value?.split(':')[1] || defaultTime.split(':')[1];
                        handleTimeSelect(hour, currentMinute);
                      }}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
                  Minute
                </div>
                <div className="h-48 overflow-y-auto">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      className="w-full px-2 py-1 text-sm text-center hover:bg-primary hover:text-primary-foreground rounded"
                      onClick={() => {
                        const currentHour = value?.split(':')[0] || defaultTime.split(':')[0];
                        handleTimeSelect(currentHour, minute);
                      }}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick select buttons */}
            <div className="border-t mt-2 pt-2">
              <div className="text-xs font-medium mb-1 text-muted-foreground">
                Quick Select
              </div>
              <div className="flex gap-1">
                <button
                  className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => {
                    const currentHour = value?.split(':')[0] || defaultTime.split(':')[0];
                    handleTimeSelect(currentHour, '00');
                  }}
                >
                  :00
                </button>
                <button
                  className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => {
                    const currentHour = value?.split(':')[0] || defaultTime.split(':')[0];
                    handleTimeSelect(currentHour, '15');
                  }}
                >
                  :15
                </button>
                <button
                  className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => {
                    const currentHour = value?.split(':')[0] || defaultTime.split(':')[0];
                    handleTimeSelect(currentHour, '30');
                  }}
                >
                  :30
                </button>
                <button
                  className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => {
                    const currentHour = value?.split(':')[0] || defaultTime.split(':')[0];
                    handleTimeSelect(currentHour, '45');
                  }}
                >
                  :45
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===========================================
  // RENDER
  // ===========================================

  if (!isProUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">PRO Plan Feature</CardTitle>
              <p className="text-muted-foreground mt-2">
                Function room management is available exclusively for PRO plan users.
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4 pt-4">
              <Button
                onClick={() => navigate('/upgrade')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Upgrade to PRO
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Function Rooms
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage banquet halls, conference rooms, and event spaces
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              onClick={() => fetchFunctionRooms(true)}
              variant="outline"
              disabled={refreshing}
              className="h-9 flex-1 border-2 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="h-9 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        </div>

        {/* SECTION 1: STATISTICS SECTION */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="h-5 w-5 shrink-0 text-primary" />
            <h2 className="text-base font-semibold sm:text-lg">Statistics Overview</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              {statsDateRange.from && statsDateRange.to ? (
                <>Data from {format(statsDateRange.from, 'MMM d, yyyy')} to {format(statsDateRange.to, 'MMM d, yyyy')}</>
              ) : (
                'Select date range'
              )}
            </Badge>
          </div>

          {/* Statistics Period Selector */}
          <Card className="border-none shadow-md bg-gray-50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2 min-w-[180px]">
                  <CalendarRange className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Statistics Period:</span>
                </div>

                <Popover open={showStatsDatePicker} onOpenChange={setShowStatsDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-[300px] border-2 justify-start text-left font-normal bg-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {statsDateRange.from ? (
                        statsDateRange.to ? (
                          <>
                            {format(statsDateRange.from, 'MMM d, yyyy')} - {format(statsDateRange.to, 'MMM d, yyyy')}
                          </>
                        ) : (
                          format(statsDateRange.from, 'MMM d, yyyy')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={statsDateRange}
                      onSelect={(range: any) => {
                        if (range?.from && range?.to) {
                          setStatsDateRange({
                            from: range.from,
                            to: range.to
                          });
                          setShowStatsDatePicker(false);
                        }
                      }}
                      initialFocus
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                      setStatsDateRange({ from: firstDay, to: today });
                    }}
                  >
                    This Month
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      setStatsDateRange({ from: thirtyDaysAgo, to: today });
                    }}
                  >
                    Last 30 Days
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-purple-500 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-purple-500" />
                    <p className="text-sm font-medium text-muted-foreground">Total Function Rooms</p>
                  </div>
                  <p className="text-3xl font-bold">{calculateTotalRooms()}</p>
                  <p className="text-xs text-muted-foreground mt-1">All rooms in hotel</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{calculateEventsInPeriod()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statsDateRange.from && statsDateRange.to ? (
                      <>in selected period</>
                    ) : (
                      'Select date range'
                    )}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarIcon className="h-7 w-7 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">
                    {formatCurrency(calculateRevenueInPeriod())}
                  </p>
                  {calculateAverageBookingValue() > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg: {formatCurrency(calculateAverageBookingValue())} per event
                    </p>
                  )}
                </div>
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: AVAILABILITY SECTION */}
        <div className="space-y-3 mt-8">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Room Availability</h2>
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              Check availability for a specific date
            </Badge>
          </div>

          <Card className="border-none shadow-md bg-green-50/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2 min-w-[180px]">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Check Availability for:</span>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-[300px] border-2 border-green-300 bg-white justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-green-600" />
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2 ml-auto">
                  <div className="bg-white rounded-lg border border-green-200 px-4 py-2 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Available Rooms</p>
                      <p className="text-xl font-bold text-green-600">
                        {calculateRoomsAvailableOnSelectedDate()} / {rooms.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-md bg-white">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Available: {calculateRoomsAvailableOnSelectedDate()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Booked: {rooms.length - calculateRoomsAvailableOnSelectedDate()}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {calculateRoomsAvailableOnSelectedDate() === 0 ? (
                    <span className="text-red-600 font-medium">⚠️ No rooms available on this date</span>
                  ) : calculateRoomsAvailableOnSelectedDate() === 1 ? (
                    <span className="text-amber-600 font-medium">Only 1 room left!</span>
                  ) : (
                    <span className="text-green-600 font-medium">{calculateRoomsAvailableOnSelectedDate()} rooms available for booking</span>
                  )}
                </div>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(calculateRoomsAvailableOnSelectedDate() / rooms.length) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
            <TabsList className="inline-flex w-full min-w-[250px] sm:grid sm:grid-cols-2 gap-2 bg-transparent sm:bg-muted p-1">
              <TabsTrigger
                value="rooms"
                className={`
                  flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-md data-[state=active]:font-semibold
                  data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
                  hover:bg-gray-200 hover:text-gray-900
                  transition-all duration-200
                  rounded-md whitespace-nowrap
                  border-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent
                `}
              >
                <Building2 className={`h-4 w-4 ${activeTab === 'rooms' ? 'text-white' : 'text-gray-600'}`} />
                <span>Function Venues</span>
                {rooms.length > 0 && (
                  <Badge
                    variant="outline"
                    className={`
                      ml-1 px-1.5 py-0 text-xs
                      ${activeTab === 'rooms'
                        ? 'bg-primary-foreground text-primary border-primary-foreground'
                        : 'bg-gray-200 text-gray-700 border-gray-200'}
                    `}
                  >
                    {rooms.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="bookings"
                className={`
                  flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-md data-[state=active]:font-semibold
                  data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
                  hover:bg-gray-200 hover:text-gray-900
                  transition-all duration-200
                  rounded-md whitespace-nowrap
                  border-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent
                `}
              >
                <CalendarIcon className={`h-4 w-4 ${activeTab === 'bookings' ? 'text-white' : 'text-gray-600'}`} />
                <span>Event Bookings</span>
                {bookings.length > 0 && (
                  <Badge
                    variant="outline"
                    className={`
                      ml-1 px-1.5 py-0 text-xs
                      ${activeTab === 'bookings'
                        ? 'bg-primary-foreground text-primary border-primary-foreground'
                        : 'bg-gray-200 text-gray-700 border-gray-200'}
                    `}
                  >
                    {bookings.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ROOMS TAB */}
          <TabsContent value="rooms" className="space-y-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search function rooms by name, number, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading function rooms...</p>
                </div>
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-3xl">{getRoomIcon(room.type)}</span>
                              <div>
                                <h3 className="text-lg font-semibold">{room.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Room {room.room_number} • Floor {room.floor}
                                </p>
                              </div>
                              {/* {getStatusBadge(room.status)} */}
                              {/* In the room card where you show the availability badge */}
                              {availabilityMap[room.id] !== undefined && (
                                <Badge
                                  variant="outline"
                                  className={availabilityMap[room.id]
                                    ? 'bg-green-100 text-green-800 border-green-200 ml-2'
                                    : 'bg-red-100 text-red-800 border-red-200 ml-2'
                                  }
                                >
                                  {availabilityMap[room.id]
                                    ? `✓ Available for ${format(selectedDate, 'MMM d')}`
                                    : `✗ Booked on ${format(selectedDate, 'MMM d')}`
                                  }
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-muted-foreground block text-xs">Type</span>
                                <div className="font-medium capitalize">{room.type}</div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-muted-foreground block text-xs">Capacity</span>
                                <div className="font-medium flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {room.capacity}
                                </div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-muted-foreground block text-xs">Price/Day</span>
                                <div className="font-medium text-primary">₹{room.base_price.toLocaleString()}</div>
                              </div>
                              {room.area_sqft && (
                                <div className="bg-gray-50 p-2 rounded">
                                  <span className="text-muted-foreground block text-xs">Area</span>
                                  <div className="font-medium">{room.area_sqft} sq.ft</div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {room.has_ac && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  ❄️ AC
                                </Badge>
                              )}
                              {room.has_projector && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  📽️ Projector
                                </Badge>
                              )}
                              {room.has_sound_system && (
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  🎤 Sound
                                </Badge>
                              )}
                              {room.has_wifi && (
                                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                                  <Wifi className="h-3 w-3 mr-1" />
                                  WiFi
                                </Badge>
                              )}
                              {room.has_catering && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  <Utensils className="h-3 w-3 mr-1" />
                                  Catering
                                </Badge>
                              )}
                              {room.has_parking && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <ParkingCircle className="h-3 w-3 mr-1" />
                                  Parking
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={availabilityMap[room.id] ? "default" : "outline"}
                              onClick={() => handleOpenBookingModal(room)}
                              disabled={availabilityMap[room.id] === false || checkingAvailability[room.id]}
                              className={`
                                min-w-[120px]
                                ${availabilityMap[room.id] === true
                                  ? 'bg-primary text-white hover:bg-primary/90'
                                  : availabilityMap[room.id] === false
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                                    : 'border-primary text-primary hover:bg-primary hover:text-white'
                                }
                              `}
                            >
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {checkingAvailability[room.id]
                                ? 'Checking...'
                                : availabilityMap[room.id] === undefined
                                  ? 'Check'
                                  : availabilityMap[room.id]
                                    ? 'Book Now'
                                    : 'Not Available'
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDelete(room.id, room.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Building2 className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No function rooms found</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    {searchTerm
                      ? 'No rooms match your search criteria'
                      : 'Add your first function room to get started'}
                  </p>
                  {searchTerm ? (
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  ) : (
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Function Room
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* BOOKINGS TAB */}
          {/* BOOKINGS TAB */}
          {/* <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search bookings by event name, customer, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Results per page selector *
            {filteredBookings.length > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={bookingsPerPage.toString()}
                      onValueChange={(value) => {
                        setBookingsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * bookingsPerPage + 1, filteredBookings.length)} to {Math.min(currentPage * bookingsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {currentPageBookings.map((booking) => {
                  const remainingAmount = (booking.total_amount || 0) - (booking.advance_paid || 0);
                  const hasAdvancePayment = (booking.advance_paid || 0) > 0;
                  const hasBalanceDue = remainingAmount > 0;
                  const showCheckoutButton = hasAdvancePayment && hasBalanceDue &&
                    ['confirmed', 'pending'].includes(booking.status);
                  const canCancel = ['confirmed', 'pending'].includes(booking.status);

                  return (
                    <Card key={booking.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="bg-gray-100">
                                {booking.booking_reference}
                              </Badge>
                              {getStatusBadge(booking.status)}
                              {getPaymentBadge(booking.payment_status)}

                              {/* Show advance payment badge if applicable *
                              {hasAdvancePayment && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                  Advance: ₹{(booking.advance_paid).toLocaleString()}
                                </Badge>
                              )}

                              {/* Show balance due badge only for advance payment bookings *
                              {showCheckoutButton && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                                  Due: ₹{(remainingAmount).toLocaleString()}
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-semibold text-lg">{booking.event_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {booking.customer_name} • {booking.customer_phone}
                            </p>

                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Room:</span> {booking.room_name || 'N/A'} •
                                <span className="font-medium ml-1">From:</span> {format(new Date(booking.booking_date), 'MMM d, yyyy')} {formatTime(booking.start_time)} •
                                <span className="font-medium ml-1">To:</span> {format(new Date(booking.end_date || booking.booking_date), 'MMM d, yyyy')} {formatTime(booking.end_time)}
                              </p>

                              {booking.has_room_bookings && (
                                <div className="text-sm">
                                  {booking.total_rooms_blocked > 0 && (
                                    <span className="text-gray-600">
                                      <Ban className="h-3 w-3 inline mr-1" />
                                      {booking.total_rooms_blocked} room(s) blocked
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right min-w-[200px]">
                            <div className="text-xl font-bold text-primary">
                              {formatCurrency(booking.total_amount)}
                            </div>

                            {/* Show advance payment amount *
                            {hasAdvancePayment && (
                              <div className="text-sm text-blue-600 font-medium">
                                Advance: {formatCurrency(booking.advance_paid)}
                              </div>
                            )}

                            {/* Show remaining amount only for advance payment bookings *
                            {showCheckoutButton && (
                              <div className="text-sm font-bold text-orange-600 mb-2 bg-orange-50 px-2 py-1 rounded inline-block">
                                Balance: {formatCurrency(remainingAmount)}
                              </div>
                            )}

                            <div className="flex gap-2 justify-end mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => viewBookingDetails(booking)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Details
                              </Button>

                              {/* Cancel Button - Show for active bookings *
                              {/* {canCancel && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleCancelClick(booking)}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              )} */}

          {/* Checkout Button - ONLY SHOW FOR ADVANCE PAYMENT BOOKINGS WITH BALANCE DUE *
                              {showCheckoutButton && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700 relative overflow-hidden group"
                                  onClick={() => handleCheckout(booking)}
                                >
                                  <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay Balance (₹{(remainingAmount).toLocaleString()})
                                </Button>
                              )}

                              {/* Show "Fully Paid" badge for advance payment bookings that are fully paid *
                              {hasAdvancePayment && !hasBalanceDue && booking.status !== 'cancelled' && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 py-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fully Paid
                                </Badge>
                              )}

                              {/* Show "Refunded" badge for cancelled bookings with advance *
                              {booking.status === 'cancelled' && hasAdvancePayment && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 py-2">
                                  <IndianRupee className="h-3 w-3 mr-1" />
                                  Refunded
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No bookings found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm ? 'Try a different search term' : `No events booked`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls *
            {filteredBookings.length > 0 && totalPages > 1 && (
              <Card className="border-t pt-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                      Page {currentPage} of {totalPages}
                    </div>

                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">First page</span>
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent> */}



          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search bookings by event name, customer, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Results per page selector */}
            {filteredBookings.length > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={bookingsPerPage.toString()}
                      onValueChange={(value) => {
                        setBookingsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * bookingsPerPage + 1, filteredBookings.length)} to {Math.min(currentPage * bookingsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {currentPageBookings.map((booking) => {
                  const remainingAmount = (booking.total_amount || 0) - (booking.advance_paid || 0);
                  const hasAdvancePayment = (booking.advance_paid || 0) > 0;
                  const hasBalanceDue = remainingAmount > 0;
                  const showCheckoutButton = hasAdvancePayment && hasBalanceDue &&
                    ['confirmed', 'pending'].includes(booking.status);
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <Card key={booking.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="bg-gray-100">
                                {booking.booking_reference}
                              </Badge>
                              {getStatusBadge(booking.status)}
                              {/* {getPaymentBadge(booking.payment_status)} */}

                              {/* Show refund badge for cancelled bookings */}
                              {isCancelled && getRefundBadge(booking)}

                              {/* Show advance payment badge if applicable */}
                              {!isCancelled && hasAdvancePayment && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                  Advance: ₹{(booking.advance_paid).toLocaleString()}
                                </Badge>
                              )}

                              {/* Show balance due badge only for advance payment bookings */}
                              {!isCancelled && showCheckoutButton && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                                  Due: ₹{(remainingAmount).toLocaleString()}
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-semibold text-lg">{booking.event_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {booking.customer_name} • {booking.customer_phone}
                            </p>

                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Room:</span> {booking.room_name || 'N/A'} •
                                <span className="font-medium ml-1">From:</span> {format(new Date(booking.booking_date), 'MMM d, yyyy')} {formatTime(booking.start_time)} •
                                <span className="font-medium ml-1">To:</span> {format(new Date(booking.end_date || booking.booking_date), 'MMM d, yyyy')} {formatTime(booking.end_time)}
                              </p>

                              {booking.has_room_bookings && (
                                <div className="text-sm">
                                  {booking.total_rooms_blocked > 0 && (
                                    <span className="text-gray-600">
                                      <Ban className="h-3 w-3 inline mr-1" />
                                      {booking.total_rooms_blocked} room(s) blocked
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Show cancellation reason if available */}
                              {isCancelled && booking.cancellation_reason && (
                                <div className="mt-2 p-2 bg-red-50 rounded-md text-sm text-red-700">
                                  <span className="font-medium">Cancellation Reason:</span> {booking.cancellation_reason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right min-w-[200px]">
                            <div className="text-xl font-bold text-primary">
                              {formatCurrency(booking.total_amount)}
                            </div>

                            {/* Show advance payment amount for non-cancelled bookings */}
                            {!isCancelled && hasAdvancePayment && (
                              <div className="text-sm text-blue-600 font-medium">
                                Advance: {formatCurrency(booking.advance_paid)}
                              </div>
                            )}

                            {/* Show refund amount for cancelled bookings */}
                            {isCancelled && booking.refund_amount && booking.refund_amount > 0 && (
                              <div className="text-sm text-green-600 font-medium">
                                Refund Type: {(booking.refund_method)}
                              </div>
                            )}

                            {/* Show remaining amount only for advance payment bookings */}
                            {!isCancelled && showCheckoutButton && (
                              <div className="text-sm font-bold text-orange-600 mb-2 bg-orange-50 px-2 py-1 rounded inline-block">
                                Balance: {formatCurrency(remainingAmount)}
                              </div>
                            )}

                            <div className="flex gap-2 justify-end mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => viewBookingDetails(booking)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Details
                              </Button>

                              {/* Checkout Button - ONLY SHOW FOR ADVANCE PAYMENT BOOKINGS WITH BALANCE DUE (not cancelled) */}
                              {!isCancelled && showCheckoutButton && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700 relative overflow-hidden group"
                                  onClick={() => handleCheckout(booking)}
                                >
                                  <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay Balance (₹{(remainingAmount).toLocaleString()})
                                </Button>
                              )}

                              {/* Show "Fully Paid" badge for advance payment bookings that are fully paid */}
                              {!isCancelled && hasAdvancePayment && !hasBalanceDue && booking.status !== 'cancelled' && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 py-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fully Paid
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No bookings found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm ? 'Try a different search term' : `No events booked`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls */}
            {filteredBookings.length > 0 && totalPages > 1 && (
              <Card className="border-t pt-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                      Page {currentPage} of {totalPages}
                    </div>

                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">First page</span>
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>





      {/* BOOKING FORM MODAL */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto relative">
            <div className="sticky top-0 bg-white border-b p-6 z-10 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Book {selectedRoom.name}</h2>
                  <p className="text-muted-foreground">
                    Capacity: {selectedRoom.capacity} guests • {selectedRoom.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseBookingModal}
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between px-4 mt-4">
                {[
                  { number: 1, label: 'Event Details', icon: CalendarIcon },
                  { number: 2, label: 'Customer Info', icon: User },
                  { number: 3, label: 'Payment', icon: CreditCard }
                ].map((step) => (
                  <div key={step.number} className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${activeStep >= step.number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'}
                    `}>
                      {activeStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${activeStep >= step.number ? 'font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    {step.number < 3 && (
                      <div className={`h-0.5 w-16 mt-5 ${activeStep > step.number ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6 mt-2">
              {/* Step 1: Event Details */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Event Details */}
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Event Details</h3>
                        <div className="space-y-4">
                          <div>
                            <Label>Event Name *</Label>
                            <Input
                              value={bookingForm.event_name}
                              onChange={(e) => setBookingForm({ ...bookingForm, event_name: e.target.value })}
                              placeholder="e.g., Annual Conference, Wedding Reception"
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label>Event Dates *</Label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Check-in Date */}
                              <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-medium">Check-in Date</Label>
                                <div className="relative">
                                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                  <Input
                                    type="date"
                                    value={bookingForm.check_in_date}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                      const newCheckIn = e.target.value;
                                      setBookingForm(prev => ({
                                        ...prev,
                                        check_in_date: newCheckIn,
                                        // If check-out date is before new check-in, update it
                                        check_out_date: prev.check_out_date < newCheckIn ? newCheckIn : prev.check_out_date
                                      }));
                                      setDateRange({
                                        from: new Date(newCheckIn),
                                        to: bookingForm.check_out_date ? new Date(bookingForm.check_out_date) : new Date(newCheckIn)
                                      });
                                    }}
                                    className="pl-10 w-full"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Check-out Date */}
                              <div className="space-y-2">
                                <Label className="text-xs md:text-sm font-medium">Check-out Date</Label>
                                <div className="relative">
                                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                  <Input
                                    type="date"
                                    value={bookingForm.check_out_date}
                                    min={bookingForm.check_in_date || format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                      const newCheckOut = e.target.value;
                                      setBookingForm(prev => ({
                                        ...prev,
                                        check_out_date: newCheckOut
                                      }));
                                      setDateRange({
                                        from: new Date(bookingForm.check_in_date),
                                        to: new Date(newCheckOut)
                                      });
                                    }}
                                    className="pl-10 w-full"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Time Selection with Auto-close */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Time */}
                            <div className="space-y-2">
                              <Label className="text-xs md:text-sm font-medium">Start Time *</Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                <CustomTimePicker
                                  value={bookingForm.start_time}
                                  onChange={(time) => setBookingForm({ ...bookingForm, start_time: time })}
                                  defaultTime="10:00"
                                />
                              </div>
                            </div>

                            {/* End Time */}
                            <div className="space-y-2">
                              <Label className="text-xs md:text-sm font-medium">End Time *</Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                <CustomTimePicker
                                  value={bookingForm.end_time}
                                  onChange={(time) => setBookingForm({ ...bookingForm, end_time: time })}
                                  defaultTime="18:00"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label>Expected Guests</Label>
                            <Input
                              type="number"
                              min="1"
                              max={selectedRoom?.capacity || 100}
                              value={bookingForm.guests_expected}
                              onChange={(e) => setBookingForm({ ...bookingForm, guests_expected: Number(e.target.value) })}
                            />
                          </div>

                          <div>
                            <Label>Special Requests</Label>
                            <Input
                              value={bookingForm.special_requests}
                              onChange={(e) => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                              placeholder="e.g., Stage setup, specific seating arrangement"
                            />
                          </div>

                          {selectedRoom?.has_catering && (
                            <div>
                              <Label>Catering Requirements</Label>
                              <Input
                                value={bookingForm.catering_requirements}
                                onChange={(e) => setBookingForm({ ...bookingForm, catering_requirements: e.target.value })}
                                placeholder="e.g., Vegetarian for 30 people"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Accommodation Rooms */}
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4 flex items-center">
                          <Hotel className="h-5 w-5 mr-2" />
                          Block Accommodation Rooms (Optional)
                          {selectedRooms.length > 0 && (
                            <Badge className="ml-2 bg-gray-600">
                              {selectedRooms.length} Blocked
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('🔄 Manual refresh triggered');
                              fetchStandardRooms();
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh
                          </Button>
                        </h3>

                        <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-gray-600 mt-0.5" />
                            <p className="text-xs text-gray-700">
                              Rooms selected here will be <span className="font-semibold">blocked</span> for the event dates.
                              No charges apply for blocked rooms.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="Search rooms by number or type..."
                              value={roomSearchTerm}
                              onChange={(e) => setRoomSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          {/* {standardRooms.length > 0 && (
                            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="Filter by room type" />
                              </SelectTrigger>
                              <SelectContent>
                                {roomTypes.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type === 'all' ? 'All Types' : type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )} */}
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                          {standardRooms.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No rooms available for the selected dates</p>
                              <p className="text-sm mt-2">Try selecting different dates</p>
                            </div>
                          ) : filteredStandardRooms.length > 0 ? (
                            filteredStandardRooms.map((room) => {
                              const isSelected = selectedRooms.some(r => r.room_id === room.id);
                              return (
                                <div
                                  key={room.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${isSelected
                                    ? 'bg-gray-100 border-gray-400'
                                    : 'hover:bg-gray-50 border-gray-100'
                                    }`}
                                >
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      Room {room.room_number}
                                      {isSelected && (
                                        <Badge className="bg-gray-600 text-white text-xs">Blocked</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {room.type || 'Standard Room'} • {formatCurrency(room.price || 0)}/night
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isSelected ? "destructive" : "outline"}
                                    onClick={() => isSelected
                                      ? removeRoomFromSelection(room.id)
                                      : blockRoom(room)
                                    }
                                    className={isSelected ? "" : "border-gray-400 text-gray-600 hover:bg-gray-500 hover:text-white"}
                                  >
                                    {isSelected ? (
                                      <><MinusCircle className="h-4 w-4 mr-1" /> Remove</>
                                    ) : (
                                      <><Ban className="h-4 w-4 mr-1" /> Block</>
                                    )}
                                  </Button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No rooms match your search criteria</p>
                              {(roomSearchTerm || roomTypeFilter !== 'all') && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => {
                                    setRoomSearchTerm('');
                                    setRoomTypeFilter('all');
                                  }}
                                  className="mt-2"
                                >
                                  Clear filters
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedRooms.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <span>Blocked Rooms ({selectedRooms.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {selectedRooms.map((room) => (
                                <div key={room.room_id} className="p-3 rounded-lg bg-gray-100 border border-gray-300">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        Room {room.room_number}
                                        <Badge className="bg-gray-600 text-white text-xs">Blocked</Badge>
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {room.room_type}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {format(new Date(room.check_in), 'MMM d, yyyy')} - {format(new Date(room.check_out), 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 h-6 w-6 p-0"
                                      onClick={() => removeRoomFromSelection(room.room_id)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateStep(1, bookingForm, toast)) setActiveStep(2);
                      }}
                    >
                      Next: Customer Information
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Customer Information */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Customer Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Phone Number *</Label>
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={bookingForm.customer_phone}
                              onChange={handleCustomerPhoneChange}
                              placeholder="10-digit mobile number"
                              className="pl-10"
                              maxLength={10}
                              required
                            />
                          </div>
                          {showCustomerSearch && foundCustomers.length > 0 && (
                            <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                              {foundCustomers.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => selectCustomer(customer)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                                >
                                  <div>
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50">
                                    Existing Customer
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label>Full Name *</Label>
                          <Input
                            value={bookingForm.customer_name}
                            onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                            placeholder="Customer name"
                            required
                          />
                        </div>

                        <div>
                          <Label>Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              value={bookingForm.customer_email}
                              onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                              placeholder="customer@example.com"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* GST Information */}
                        <div className="border-t pt-4 mt-2">
                          <h4 className="font-medium mb-3 flex items-center">
                            <Percent className="h-4 w-4 mr-2" />
                            GST Information (Optional)
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm">GST Number</Label>
                              <Input
                                value={bookingForm.customer_gst || ''}
                                onChange={(e) => setBookingForm({ ...bookingForm, customer_gst: e.target.value })}
                                placeholder="e.g., 22AAAAA0000A1Z5"
                                className="font-mono text-sm"
                                maxLength={15}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                15-character GSTIN
                              </p>
                            </div>

                            <div>
                              <Label className="text-sm">Billing Address</Label>
                              <textarea
                                value={bookingForm.billing_address || ''}
                                onChange={(e) => setBookingForm({ ...bookingForm, billing_address: e.target.value })}
                                placeholder="Enter complete billing address"
                                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                              <div>
                                <Label className="text-sm">State</Label>
                                <Input
                                  value={bookingForm.billing_state || ''}
                                  onChange={(e) => setBookingForm({ ...bookingForm, billing_state: e.target.value })}
                                  placeholder="e.g., Maharashtra"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">State Code</Label>
                                <Input
                                  value={bookingForm.billing_state_code || ''}
                                  onChange={(e) => setBookingForm({ ...bookingForm, billing_state_code: e.target.value })}
                                  placeholder="e.g., 27"
                                  maxLength={2}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                              <div>
                                <Label className="text-sm">City</Label>
                                <Input
                                  value={bookingForm.billing_city || ''}
                                  onChange={(e) => setBookingForm({ ...bookingForm, billing_city: e.target.value })}
                                  placeholder="e.g., Mumbai"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Pincode</Label>
                                <Input
                                  value={bookingForm.billing_pincode || ''}
                                  onChange={(e) => setBookingForm({ ...bookingForm, billing_pincode: e.target.value })}
                                  placeholder="e.g., 400001"
                                  maxLength={6}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Price Summary</h3>

                        <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold flex items-center">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              Price Details
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingPrice(!isEditingPrice)}
                              className="h-7 px-2"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              {isEditingPrice ? 'Done' : 'Edit'}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              Function Room
                              {bookingForm.check_in_date === bookingForm.check_out_date
                                ? ` (${calculateHours(bookingForm.start_time, bookingForm.end_time).toFixed(1)} hours)`
                                : ` (${calculateDurationDays(bookingForm.check_in_date, bookingForm.check_out_date)} days)`
                              }
                            </span>
                            {isEditingPrice ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm">₹</span>
                                <Input
                                  type="number"
                                  value={customBasePrice}
                                  onChange={(e) => setCustomBasePrice(e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-24 h-7 text-right"
                                  min="0"
                                  step="100"
                                />
                              </div>
                            ) : (
                              <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="flex items-center text-sm">
                              <Percent className="h-3 w-3 mr-1" />
                              GST
                            </span>
                            <div className="flex items-center gap-2">
                              {isEditingGst ? (
                                <>
                                  <Input
                                    type="number"
                                    value={customGstPercentage}
                                    onChange={(e) => setCustomGstPercentage(e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="w-16 h-7 text-right"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                  <span className="text-sm">%</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingGst(false)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm">{customGstPercentage}%</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingGst(true)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <span className="font-medium">{formatCurrency(calculateGST())}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm">Discount</span>
                            <div className="flex items-center gap-2">
                              <Select
                                value={customDiscountType}
                                onValueChange={(v) => setCustomDiscountType(v as 'percentage' | 'fixed')}
                              >
                                <SelectTrigger className="w-24 h-7">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="fixed">₹</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                value={customDiscount}
                                onChange={(e) => setCustomDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-20 h-7 text-right"
                                min="0"
                                step={customDiscountType === 'percentage' ? '1' : '100'}
                              />
                            </div>
                          </div>
                          {customDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount Amount</span>
                              <span>- {formatCurrency(calculateDiscount())}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm">Other Charges</span>
                            <Input
                              type="number"
                              value={customOtherCharges}
                              onChange={(e) => setCustomOtherCharges(e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-24 h-7 text-right"
                              min="0"
                              step="100"
                            />
                          </div>
                          {customOtherCharges > 0 && otherChargesDescription && (
                            <div className="text-xs text-muted-foreground text-right">
                              {otherChargesDescription}
                            </div>
                          )}
                          {customOtherCharges > 0 && (
                            <Input
                              placeholder="Description for charges"
                              value={otherChargesDescription}
                              onChange={(e) => setOtherChargesDescription(e.target.value)}
                              className="text-xs h-7"
                            />
                          )}

                          {selectedRooms.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium flex items-center gap-2">
                                  <Ban className="h-4 w-4" />
                                  Blocked Rooms
                                </span>
                                <Badge className="bg-gray-600 text-white">
                                  {selectedRooms.length} Blocked
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                No charges for blocked rooms
                              </p>
                            </div>
                          )}

                          <div className="border-t-2 border-primary pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">Grand Total</span>
                              <span className="text-xl font-bold text-primary">
                                {formatCurrency(calculateGrandTotal())}
                              </span>
                            </div>
                            {bookingForm.advance_paid > 0 && (
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-muted-foreground">Advance Paid</span>
                                <span className="font-medium text-green-600">
                                  - {formatCurrency(bookingForm.advance_paid)}
                                </span>
                              </div>
                            )}
                            {bookingForm.advance_paid > 0 && (
                              <div className="flex justify-between text-sm font-medium mt-1">
                                <span>Balance Due</span>
                                <span>{formatCurrency(calculateGrandTotal() - bookingForm.advance_paid)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label>Advance Payment (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={bookingForm.advance_paid}
                            onChange={(e) => setBookingForm({ ...bookingForm, advance_paid: Number(e.target.value) })}
                            placeholder="Optional advance payment"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={() => setActiveStep(1)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Event Details
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateStep(2, bookingForm, toast)) setActiveStep(3);
                      }}
                    >
                      Next: Payment
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Select Payment Method</h3>
                    <Badge variant="outline" className={isProUser ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {isProUser ? 'Pro Plan' : 'Basic Plan'}
                    </Badge>
                  </div>

                  {Number(bookingForm.advance_paid) > 0 && (
                    <Alert className="bg-emerald-50 border-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-sm">
                        Collecting advance of{' '}
                        <strong>{formatCurrency(getCollectibleAmount())}</strong> via{' '}
                        {paymentMethod ? (paymentMethod === 'cash' ? 'Cash' : 'Online') : 'selected method'}.
                        Balance due: <strong>{formatCurrency(getBalanceDue())}</strong> at checkout/event.
                        This advance will appear in <strong>Collections</strong> after booking.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total amount</span>
                      <span className="font-semibold">{formatCurrency(calculateGrandTotal())}</span>
                    </div>
                    {Number(bookingForm.advance_paid) > 0 && (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Advance (pay now)</span>
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(getCollectibleAmount())}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="font-medium">Balance due</span>
                          <span className="text-lg font-bold text-orange-700">
                            {formatCurrency(getBalanceDue())}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {isProUser ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={paymentMethod === 'online' ? "default" : "outline"}
                        className="h-28 flex flex-col gap-2 py-4"
                        onClick={() => {
                          setPaymentMethod('online');
                          if (!qrCodeData) generateUPIQrCode();
                        }}
                        disabled={isGeneratingQR}
                      >
                        <div className="flex items-center gap-2">
                          <QrCode className="h-6 w-6" />
                          <span className="font-medium">Online Payment</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Pay now via UPI QR Code
                        </span>
                        {isGeneratingQR && (
                          <Loader2 className="h-4 w-4 animate-spin mt-1" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant={paymentMethod === 'cash' ? "default" : "outline"}
                        className="h-28 flex flex-col gap-2 py-4"
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="h-6 w-6" />
                          <span className="font-medium">Cash Payment</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Pay at hotel reception on arrival
                        </span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          Basic Plan: Online payments are available in Pro Plan.
                          Cash payment is automatically selected.
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="default"
                          className="h-28 w-full max-w-md flex flex-col gap-2 py-4"
                          onClick={() => setPaymentMethod('cash')}
                        >
                          <Wallet className="h-6 w-6" />
                          <span className="font-medium">Cash Payment</span>
                          <span className="text-sm text-muted-foreground">
                            Pay at hotel reception on arrival
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'online' && isProUser && (
                    <div className="space-y-6">
                      <div className="border rounded-xl p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-1/2 space-y-4">
                            <h4 className="font-semibold text-center">QR Code Payment</h4>

                            <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                              {hotelQRCode ? (
                                <>
                                  <img
                                    src={hotelQRCode}
                                    alt="Hotel UPI QR Code"
                                    className="w-48 h-48 object-contain mx-auto"
                                    onError={(e) => {
                                      console.error('Hotel QR code failed to load');
                                      e.currentTarget.src = 'https://via.placeholder.com/200x200?text=QR+Code';
                                    }}
                                  />
                                  <div className="mt-3 text-center space-y-1">
                                    <div className="text-sm font-medium">
                                      {Number(bookingForm.advance_paid) > 0 ? 'Advance' : 'Amount'}:{' '}
                                      <span className="text-lg font-bold text-green-600">
                                        ₹{getCollectibleAmount().toFixed(2)}
                                      </span>
                                    </div>
                                    {Number(bookingForm.advance_paid) > 0 && getBalanceDue() > 0 && (
                                      <div className="text-xs text-orange-700 font-medium">
                                        Balance due later: ₹{getBalanceDue().toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <QRCode
                                    value={`upi://pay?pa=hotel@upi&pn=Hotel&am=${getCollectibleAmount()}&cu=INR`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                    className="mx-auto"
                                  />
                                  <div className="mt-3 text-center space-y-1">
                                    <div className="text-sm font-medium">
                                      {Number(bookingForm.advance_paid) > 0 ? 'Advance' : 'Amount'}:{' '}
                                      <span className="text-lg font-bold text-green-600">
                                        ₹{getCollectibleAmount().toFixed(2)}
                                      </span>
                                    </div>
                                    {Number(bookingForm.advance_paid) > 0 && getBalanceDue() > 0 && (
                                      <div className="text-xs text-orange-700 font-medium">
                                        Balance due later: ₹{getBalanceDue().toFixed(2)}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-2">
                                      UPI ID: hotel@upi
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="md:w-1/2 space-y-4">
                            <h4 className="font-semibold">Payment Instructions</h4>
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">1</span>
                                </div>
                                <p className="text-sm">Scan QR Code with any UPI app</p>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">2</span>
                                </div>
                                <p className="text-sm">
                                  Enter amount: <strong>₹{getCollectibleAmount().toFixed(2)}</strong>
                                  {Number(bookingForm.advance_paid) > 0 && getBalanceDue() > 0 && (
                                    <span className="text-muted-foreground">
                                      {' '}(balance ₹{getBalanceDue().toFixed(2)} due later)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">3</span>
                                </div>
                                <p className="text-sm">Complete payment and verify</p>
                              </div>
                            </div>

                            <div className="space-y-4 mt-6">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Payment Status:</span>
                                <Badge variant="outline" className={
                                  paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                }>
                                  {paymentStatus === 'completed' ? '✅ Completed' :
                                    paymentStatus === 'failed' ? '❌ Failed' :
                                      '🔄 Pending'}
                                </Badge>
                              </div>

                              {paymentStatus === 'pending' ? (
                                <Button
                                  onClick={verifyPayment}
                                  className="w-full"
                                  disabled={isVerifyingPayment}
                                >
                                  {isVerifyingPayment ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      I have made the payment
                                    </>
                                  )}
                                </Button>
                              ) : paymentStatus === 'completed' && (
                                <Alert className="bg-green-50 border-green-200">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <AlertDescription>Payment Verified Successfully!</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="border rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Cash Payment at Hotel</h4>
                          <p className="text-sm text-muted-foreground">
                            Pay when you arrive
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Grand Total:</span>
                          <span className="text-lg font-bold text-blue-700">
                            ₹{calculateGrandTotal().toFixed(2)}
                          </span>
                        </div>
                        {Number(bookingForm.advance_paid) > 0 && (
                          <>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Collect now (advance):</span>
                              <span className="font-semibold text-emerald-700">
                                ₹{getCollectibleAmount().toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-blue-200 pt-2">
                              <span className="font-medium">Balance due:</span>
                              <span className="font-bold text-orange-700">
                                ₹{getBalanceDue().toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-medium">Instructions:</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Booking will be confirmed immediately</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Pay at hotel reception during check-in</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Receipt will be provided at reception</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep(2)}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Customer Info
                    </Button>

                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !paymentMethod ||
                        (paymentMethod === 'online' && paymentStatus !== 'completed')
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : paymentMethod === 'online' && paymentStatus !== 'completed' ? (
                        'Complete Payment First'
                      ) : (
                        'Confirm Booking'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowBookingDetails(false)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking Reference</p>
                    <p className="font-semibold">{selectedBooking.booking_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div>{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold text-lg">{selectedBooking.event_name}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p>{format(new Date(selectedBooking.booking_date), 'PPP')} {formatTime(selectedBooking.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p>{format(new Date(selectedBooking.end_date || selectedBooking.booking_date), 'PPP')} {formatTime(selectedBooking.end_time)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Function Room</p>
                  <p className="font-semibold">{selectedBooking.room_name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedBooking.customer_name}</p>
                  <p className="text-sm">{selectedBooking.customer_phone}</p>
                  {selectedBooking.customer_email && (
                    <p className="text-sm">{selectedBooking.customer_email}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Payment Details</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Room Charges:</span>
                      <span>{formatCurrency(selectedBooking.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({selectedBooking.gst_percentage || 18}%):</span>
                      <span>{formatCurrency(selectedBooking.gst || 0)}</span>
                    </div>
                    {selectedBooking.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedBooking.discount)}</span>
                      </div>
                    )}
                    {selectedBooking.other_charges > 0 && (
                      <div className="flex justify-between">
                        <span>Other Charges:</span>
                        <span>{formatCurrency(selectedBooking.other_charges)}</span>
                      </div>
                    )}
                    <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span className="text-primary">{formatCurrency(selectedBooking.total_amount)}</span>
                    </div>
                    {selectedBooking.advance_paid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Advance Paid:</span>
                        <span className="text-green-600">{formatCurrency(selectedBooking.advance_paid)}</span>
                      </div>
                    )}
                    {selectedBooking.advance_paid > 0 && selectedBooking.total_amount > selectedBooking.advance_paid && (
                      <div className="flex justify-between text-sm font-medium">
                        <span>Balance Due:</span>
                        <span>{formatCurrency(selectedBooking.total_amount - selectedBooking.advance_paid)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBooking.has_room_bookings && (
                  <div>
                    <p className="text-sm text-muted-foreground">Accommodation Rooms</p>
                    <div className="flex gap-3 mt-1">
                      {selectedBooking.total_rooms_blocked > 0 && (
                        <Badge className="bg-gray-100 text-gray-800">
                          <Ban className="h-3 w-3 mr-1" />
                          {selectedBooking.total_rooms_blocked} room(s) blocked
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {selectedBooking.special_requests && (
                  <div>
                    <p className="text-sm text-muted-foreground">Special Requests</p>
                    <p className="text-sm">{selectedBooking.special_requests}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowBookingDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Function Room Modal */}
      {showAddModal && (
        <AddRoomModal
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            fetchFunctionRooms();
          }}
          spreadsheetId={currentUser?.spreadsheetId}
          userSource={currentUser?.source}
          onRoomAdded={fetchFunctionRooms}
          roomType="function"
        />
      )}


      {/* Checkout Modal */}
      {showCheckoutModal && selectedBookingForCheckout && (
        <FunctionCheckoutModal
          open={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedBookingForCheckout(null);
          }}
          booking={selectedBookingForCheckout}
          onCheckoutComplete={handleCheckoutComplete}
        />
      )}


      {/* Cancel Modal */}
      {/* {showCancelModal && selectedBookingForCancel && (
        <FunctionCancelModal
          open={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedBookingForCancel(null);
          }}
          booking={selectedBookingForCancel}
          onCancelComplete={handleCancelComplete}
        />
      )} */}
    </Layout>
  );
}