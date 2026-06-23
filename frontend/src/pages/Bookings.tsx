



import PreviousBookingForm from '@/components/PreviousBookingForm';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Search,
  FileText,
  X,
  Loader2,
  Edit,
  Save,
  Ban,
  Wrench,
  RefreshCw,
  Calendar as CalendarIcon,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  Clock,
  Plus,
  BarChart,
  AlertCircle,
  Building2,
  Eye,
  Users,
  IndianRupee,
  Percent,
  Home,
  CalendarDays,
  Clock3,
  CreditCard,
  Smartphone,
  Mail,
  Phone,
  User,
  Hash,
  Tag,
  MapPin,
  FileText as FileTextIcon,
  Printer,
  Info,
  ChevronRight,
  ChevronLeft,
  XCircle,
  Layers,
  LayoutGrid,
  List,
  QrCode,
  Wallet,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import InvoiceModal from '@/components/InvoiceModal';
import QuotationForm from '@/components/QuotationForm';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { isAdmin } from '@/lib/permissions';
import { isBasicDatabaseUser } from '@/lib/planUtils';
import {
  isPendingCheckoutBooking,
  notifyBookingsUpdated,
} from '@/lib/bookingCheckoutUtils';

// URLs
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzd7E4FNEstLaGqYv-YTB8IElh648K1oiQNPzWGQlsa_3DP8-Bno7OrPnL83XZ0bK7V/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ===========================================
// INTERFACES
// ===========================================

interface Booking {
  id?: string;
  bookingId: string;
  roomId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  roomNumber: string | number;
  fromDate: string;
  toDate: string;
  status: string;
  amount: number;
  service: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  createdAt: string;
  fromTime?: string;
  toTime?: string;
  rawFromTime?: string;
  rawToTime?: string;
  source?: string;
  rawFromDate?: string;
  rawToDate?: string;
  invoiceNumber?: string;
  groupBookingId?: string;
  advance_amount_paid?: number;
  remaining_amount?: number;
  original_amount?: number;
  discount_amount?: number;
  discount_percentage?: number;
  // Refund fields
  cancellation_reason?: string;
  refund_amount?: number;
  refund_method?: string;
  refund_status?: string;
  refund_processed_at?: string;
  refund_id?: number;
  payment_method?: string;  // 'cash' or 'online'
  payment_status?: string;   // 'pending', 'completed', 'failed'
  transaction_id?: string;
  special_requests?: string;
}

interface FunctionBooking {
  id: number;
  booking_reference: string;
  event_name: string;
  event_type: string;
  booking_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  function_room_id: number;
  room_name: string;
  room_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  status: string;
  payment_status: string;
  guests_expected: number;
  has_room_bookings: boolean;
  total_rooms_booked: number;
  created_at: string;
  subtotal?: number;
  gst?: number;
  discount?: number;
  other_charges?: number;
  gst_percentage?: number;
  special_requests?: string;
  catering_requirements?: string;
  room_bookings?: any[];
}

interface Quotation {
  _uniqueRowId: string;
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone: string;
  room_number: string;
  from_date: string;
  to_date: string;
  nights: number;
  total_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'converted';
  expiry_date: string;
  created_at: string;
  room_type?: string;
  created_by_name?: string;
}

interface GroupInvoiceData {
  groupId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: {
    name: string;
    phone: string;
  };
  booking: {
    fromDate: string;
    toDate: string;
    nights: number;
  };
  rooms: Array<{
    roomNumber: string | number;
    amount: number;
    service: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    bookingId: string;
  }>;
  totals: {
    subtotal: number;
    serviceTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    totalGst: number;
    grandTotal: number;
  };
  roomCount: number;
}

// ===========================================
// MAIN COMPONENT
// ===========================================

const Bookings = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [currentUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  });

  const spreadsheetId = currentUser?.spreadsheetId;
  const userSource = currentUser?.source;
  const userPlan = currentUser?.plan;

  // ===========================================
  // STATE VARIABLES
  // ===========================================

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});
  const [editAmountBaseline, setEditAmountBaseline] = useState<{
    fromDate: string;
    toDate: string;
    amount: number;
    service: number;
    cgst: number;
    sgst: number;
    igst: number;
  } | null>(null);
  const [fromDateCalendarOpen, setFromDateCalendarOpen] = useState(false);
  const [toDateCalendarOpen, setToDateCalendarOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showPreviousBookingForm, setShowPreviousBookingForm] = useState(false);

  // View toggle & Checkout state
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [bookingModalView, setBookingModalView] = useState<'main' | 'edit'>('main');
  const [loadingCheckoutEdit, setLoadingCheckoutEdit] = useState(false);
  const [breakfastTaken, setBreakfastTaken] = useState(false);
  const [breakfastPrice, setBreakfastPrice] = useState(150);
  const [breakfastDays, setBreakfastDays] = useState(1);
  const [breakfastGuests, setBreakfastGuests] = useState(1);
  const [otherServiceCharges, setOtherServiceCharges] = useState(0);
  const [otherServiceDescription, setOtherServiceDescription] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [checkoutPaymentStatus, setCheckoutPaymentStatus] = useState<'completed' | 'partial' | 'pending'>('completed');
  const [checkoutTransactionId, setCheckoutTransactionId] = useState('');
  const [checkoutHotelQRCode, setCheckoutHotelQRCode] = useState<string | null>(null);
  const [checkoutQrCodeData, setCheckoutQrCodeData] = useState('');
  const [isGeneratingCheckoutQR, setIsGeneratingCheckoutQR] = useState(false);
  const [isVerifyingCheckoutPayment, setIsVerifyingCheckoutPayment] = useState(false);
  const [checkoutDiscountType, setCheckoutDiscountType] = useState<'none' | 'percentage' | 'amount'>('none');
  const [checkoutDiscountValue, setCheckoutDiscountValue] = useState(0);
  const [checkoutActiveTab, setCheckoutActiveTab] = useState<'services' | 'discount' | 'payment'>('services');
  const [checkoutAmountToPay, setCheckoutAmountToPay] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Function Bookings state
  const [functionBookings, setFunctionBookings] = useState<FunctionBooking[]>([]);
  const [loadingFunctionBookings, setLoadingFunctionBookings] = useState(false);
  const [functionSearchTerm, setFunctionSearchTerm] = useState('');
  const [selectedFunctionBooking, setSelectedFunctionBooking] = useState<FunctionBooking | null>(null);
  const [showFunctionBookingDetails, setShowFunctionBookingDetails] = useState(false);
  const [editingFunctionBookingId, setEditingFunctionBookingId] = useState<number | null>(null);
  const [functionEditForm, setFunctionEditForm] = useState<Partial<FunctionBooking>>({});
  const [showFunctionInvoiceModal, setShowFunctionInvoiceModal] = useState(false);
  const [selectedFunctionInvoiceData, setSelectedFunctionInvoiceData] = useState<any>(null);

  // Quotations state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationSearchTerm, setQuotationSearchTerm] = useState('');
  const [selectedQuotationStatus, setSelectedQuotationStatus] = useState<string>('all');

  // Tab state
  const [activeTab, setActiveTab] = useState<'bookings' | 'function-bookings' | 'quotations'>('bookings');

  // Calendar filter states for bookings
  const [dateFilter, setDateFilter] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: undefined,
    endDate: undefined
  });
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const focusBookingId = searchParams.get('focus');
  const editBookingId = searchParams.get('edit');

  // Report states
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Refund modal state
  const [showRefundDetails, setShowRefundDetails] = useState(false);
  const [selectedRefundData, setSelectedRefundData] = useState<any>(null);

  // Add these with your other state declarations (around line 200-250)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);
  // ===========================================
  // GROUP BOOKINGS STATE
  // ===========================================
  const [groupedBookings, setGroupedBookings] = useState<Map<string, Booking[]>>(new Map());
  const [showGroupBookingsPanel, setShowGroupBookingsPanel] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showGroupInvoiceModal, setShowGroupInvoiceModal] = useState(false);
  const [selectedGroupInvoiceData, setSelectedGroupInvoiceData] = useState<GroupInvoiceData | null>(null);
  const [groupInvoiceLoading, setGroupInvoiceLoading] = useState(false);

  // Check if current user is admin
  const isUserAdmin = isAdmin();
  const isBasicDbUser = isBasicDatabaseUser(currentUser);
  const isProUser = userSource === 'database' || userPlan === 'pro';
  const isDatabaseUser = userSource === 'database';

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  useEffect(() => {
    console.log('📊 Bookings updated - Total:', bookings.length);
    console.log('📊 Group bookings:', groupedBookings.size);
    console.log('📊 Completed bookings:', bookings.filter(b => b.status === 'completed').length);
    console.log('📊 Booked bookings:', bookings.filter(b => b.status === 'booked').length);
    console.log('📊 Current status filter:', selectedStatus);
  }, [bookings, groupedBookings, selectedStatus]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('🔍 Current auth token:', token ? `${token.substring(0, 20)}...` : 'No token');
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'pending_checkout') {
      setSelectedStatus('pending_checkout');
    }
  }, [searchParams]);

  const formatDate = (value: any) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return !isNaN(date.getTime())
        ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : value;
    } catch {
      return value;
    }
  };

  const formatTime = (value: any) => {
    if (!value) return '';
    try {
      const date = new Date(`2000-01-01T${formatTimeForInput(value)}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return value;
    } catch {
      return value;
    }
  };

  /** HH:mm for HTML time inputs (from DB TIME e.g. 14:00:00) */
  const formatTimeForInput = (value: any): string => {
    if (!value) return '';
    const str = String(value).trim();
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
    try {
      const date = new Date(`2000-01-01T${str}`);
      if (!isNaN(date.getTime())) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
    } catch {
      // ignore
    }
    return '';
  };

  const formatDateForInput = (value: any): string => {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return value;
    } catch {
      return value;
    }
  };

  const getMinCheckoutDate = (checkInDate: string): string => formatDateForInput(checkInDate);

  const isCheckoutOnOrAfterCheckin = (checkInDate: string, checkOutDate: string): boolean => {
    const from = formatDateForInput(checkInDate);
    const to = formatDateForInput(checkOutDate);
    if (!from || !to) return false;
    return to >= from;
  };

  const formatDateForDisplay = (value: any): string => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return !isNaN(date.getTime())
        ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : value;
    } catch {
      return value;
    }
  };

  /** Editable only before checkout is completed */
  const canEditBooking = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'booked' || s === 'blocked' || s === 'maintenance';
  };

  const parseAmount = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d.-]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + (amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const calculateNights = (fromDate: string, toDate: string): number => {
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  /** Scale room/service/tax amounts when stay dates change during edit */
  const recalculateEditAmountsForDates = (
    baseline: {
      fromDate: string;
      toDate: string;
      amount: number;
      service: number;
      cgst: number;
      sgst: number;
      igst: number;
    },
    newFromDate: string,
    newToDate: string
  ) => {
    const oldNights = Math.max(1, calculateNights(baseline.fromDate, baseline.toDate));
    const newNights = Math.max(1, calculateNights(newFromDate, newToDate));
    const ratio = newNights / oldNights;

    const amount = Math.round(baseline.amount * ratio * 100) / 100;
    const service = Math.round(baseline.service * ratio * 100) / 100;
    const cgst = Math.round(baseline.cgst * ratio * 100) / 100;
    const sgst = Math.round(baseline.sgst * ratio * 100) / 100;
    const igst = Math.round(baseline.igst * ratio * 100) / 100;
    const gst = Math.round((cgst + sgst + igst) * 100) / 100;
    const total = Math.round((amount + service + gst) * 100) / 100;

    return { amount, service, cgst, sgst, igst, gst, total, nights: newNights };
  };

  const normalizeCheckoutPaymentMethod = (method?: string): 'cash' | 'online' => {
    const value = (method || 'cash').toLowerCase();
    return value === 'online' || value === 'upi' || value === 'card' ? 'online' : 'cash';
  };

  const generateCheckoutUPIQrCode = async (amountToPay: number) => {
    setIsGeneratingCheckoutQR(true);
    try {
      const transactionId = checkoutTransactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const upiString = `upi://pay?pa=test@example&pn=${encodeURIComponent('Hotel Management')}&am=${amountToPay}&cu=INR&tn=${encodeURIComponent(transactionId)}`;
      setCheckoutQrCodeData(upiString);
      if (!checkoutTransactionId) {
        setCheckoutTransactionId(transactionId);
      }
    } catch (error) {
      console.error('Error generating checkout QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCheckoutQR(false);
    }
  };

  const verifyCheckoutPayment = async () => {
    setIsVerifyingCheckoutPayment(true);
    setTimeout(() => {
      setCheckoutPaymentStatus('completed');
      toast({
        title: 'Payment verified',
        description: 'Online payment marked as received.',
      });
      setIsVerifyingCheckoutPayment(false);
    }, 1500);
  };

  // ===========================================
  // REFUND FUNCTIONS
  // ===========================================

  // Fetch refunds for multiple bookings
  const fetchRefundsForBookings = async (bookingIds: string[]): Promise<Map<string, any>> => {
    if (bookingIds.length === 0) return new Map();

    try {
      const token = localStorage.getItem('authToken');
      const refundMap = new Map();

      const bookingIdsParam = bookingIds.join(',');
      const response = await fetch(
        `${NODE_BACKEND_URL}/refunds/refunds/history?booking_ids=${bookingIdsParam}&booking_type=room`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          result.data.forEach((refund: any) => {
            refundMap.set(String(refund.booking_id), refund);
          });
        }
      }

      return refundMap;
    } catch (error) {
      console.error('Error fetching refunds:', error);
      return new Map();
    }
  };

  // Get refund badge
  const getRefundBadge = (booking: Booking) => {
    if (booking.status !== 'cancelled') return null;

    if (!booking.refund_amount || booking.refund_amount === 0) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 cursor-pointer" onClick={() => viewRefundDetails(booking)}>
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

  // View refund details
  const viewRefundDetails = (booking: Booking) => {
    if (booking.refund_id) {
      setSelectedRefundData({
        refund_amount: booking.refund_amount,
        refund_method: booking.refund_method,
        refund_status: booking.refund_status,
        processed_at: booking.refund_processed_at,
        // transaction_id: booking.transaction_id,
        refund_reason: booking.cancellation_reason,
        booking_id: booking.bookingId,
        // invoice_number: booking.invoice_number,
        customer_name: booking.customerName,
        original_amount: booking.total,
        advance_paid: booking.advance_amount_paid || 0
      });
      setShowRefundDetails(true);
    }
  };

  // ===========================================
  // API FUNCTIONS
  // ===========================================

  // JSONP loader for Google Sheets
  const loadScript = (src: string) =>
    new Promise<any>((resolve, reject) => {
      const callbackName = 'cb_' + Date.now();
      (window as any)[callbackName] = (data: any) => {
        resolve(data);
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
      const script = document.createElement('script');
      script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
      script.id = callbackName;
      script.onerror = () => {
        reject(new Error('Failed to load script'));
        delete (window as any)[callbackName];
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
      document.body.appendChild(script);
    });

  // Backend request helper
  async function fetchBackendRequest(endpoint: string, data?: any, method: string = 'GET'): Promise<any> {
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  // ===========================================
  // FETCH BOOKINGS - WITH REFUND DATA
  // ===========================================

  const fetchFromBackend = async (): Promise<Booking[]> => {
    try {
      const data = await fetchBackendRequest('/bookings');

      console.log('🔍 Raw bookings data from backend:', data.data.map((b: any) => ({
        id: b.id,
        payment_method: b.payment_method,
        payment_status: b.payment_status
      })));

      // Transform basic booking data
      const baseBookings = data.data.map((booking: any) => {
        const amount = parseAmount(booking.amount);
        const service = parseAmount(booking.service);
        const gst = parseAmount(booking.gst);
        const cgst = parseAmount(booking.cgst);
        const sgst = parseAmount(booking.sgst);
        const igst = parseAmount(booking.igst);
        const total = parseAmount(booking.total) || Math.round((amount + service + gst + cgst + sgst + igst) * 100) / 100;

        const bookingId = booking?.id?.toString() || `booking-${Date.now()}-${Math.random()}`;
        const roomId = booking?.room_id?.toString() || '';
        const customerId = booking?.customer_id?.toString() || '';
        const roomNumber = booking?.room_number || '';

        let customerName = 'Unknown Customer';
        if (booking?.customer_name) {
          customerName = booking.customer_name;
        } else if (booking?.customerName) {
          customerName = booking.customerName;
        }
        console.log(`📝 Booking ${booking.id} - payment_method:`, booking.payment_method);

        return {
          id: bookingId,
          bookingId: bookingId,
          roomId: roomId,
          invoiceNumber: booking?.invoice_number || `INV-${Date.now().toString().slice(-6)}-${booking.id}`,
          customerId: customerId,
          customerName: customerName,
          customerPhone: booking?.customer_phone || booking?.phone || '',
          roomNumber: roomNumber,
          fromDate: formatDateForDisplay(booking?.from_date),
          toDate: formatDateForDisplay(booking?.to_date),
          fromTime: formatTimeForInput(booking?.from_time) || '14:00',
          toTime: formatTimeForInput(booking?.to_time) || '12:00',
          rawFromTime: booking?.from_time || '',
          rawToTime: booking?.to_time || '',
          status: booking?.status || 'booked',
          payment_method: booking.payment_method || 'cash', // ← Make sure this line exists
          payment_status: booking.payment_status || 'pending',
          amount,
          service,
          gst,
          cgst,
          sgst,
          igst,
          total,
          createdAt: formatDateForDisplay(booking?.created_at || new Date().toISOString()),
          source: 'database',
          rawFromDate: booking?.from_date,
          rawToDate: booking?.to_date,
          groupBookingId: booking?.group_booking_id || null,
          cancellation_reason: booking?.cancellation_reason || null,
          advance_amount_paid: parseAmount(booking.advance_amount_paid || 0),
          remaining_amount: parseAmount(booking.remaining_amount || 0),
          original_amount: parseAmount(booking.original_amount || 0),
          discount_amount: parseAmount(booking.discount_amount || 0),
          discount_percentage: parseAmount(booking.discount_percentage || 0),
          special_requests: booking?.special_requests || '',
        } as Booking;
      });

      // Get IDs of cancelled bookings to fetch refunds
      const cancelledBookingIds = baseBookings
        .filter((b: Booking) => b.status === 'cancelled')
        .map((b: Booking) => b.bookingId);

      console.log('Cancelled booking IDs:', cancelledBookingIds);

      // Fetch refunds for cancelled bookings
      let refundMap = new Map();
      if (cancelledBookingIds.length > 0) {
        refundMap = await fetchRefundsForBookings(cancelledBookingIds);
      }

      // Merge refund data with bookings
      const transformedBookings = baseBookings.map((booking: Booking) => {
        if (booking.status === 'cancelled') {
          const refund = refundMap.get(booking.bookingId);
          if (refund) {
            return {
              ...booking,
              refund_amount: refund.refund_amount,
              refund_method: refund.refund_method,
              refund_status: refund.refund_status,
              refund_processed_at: refund.processed_at,
              refund_id: refund.id
            };
          }
        }
        return booking;
      });

      return transformedBookings;
    } catch (error) {
      console.error('Error fetching from backend:', error);
      throw error;
    }
  };

  const fetchFromGoogleSheets = async (): Promise<Booking[]> => {
    if (!spreadsheetId) return [];

    try {
      const url = `${APPS_SCRIPT_URL}?action=getBookings&spreadsheetid=${encodeURIComponent(
        spreadsheetId
      )}`;
      const data = await loadScript(url);

      if (Array.isArray(data.bookings)) {
        const formatted = data.bookings.map((b: any) => {
          const record = Object.keys(b).reduce((acc: any, key: string) => {
            acc[key.trim().toLowerCase()] = b[key];
            return acc;
          }, {});

          const amount = parseAmount(record.amount);
          const service = parseAmount(record.service);
          const gst = parseAmount(record.gst);
          const cgst = parseAmount(record.cgst);
          const sgst = parseAmount(record.sgst);
          const igst = parseAmount(record.igst);
          const total =
            parseAmount(record.total) || Math.round((amount + service + gst + cgst + sgst + igst) * 100) / 100;

          return {
            id: record.bookingid,
            bookingId: record.bookingid,
            roomId: record.roomid,
            customerId: record.customerid,
            customerName: record.customername,
            customerPhone: record.customerphone?.toString(),
            roomNumber: record.roomnumber,
            fromDate: formatDate(record.fromdate),
            toDate: formatDate(record.todate),
            fromTime: formatTime(record.fromtime),
            toTime: formatTime(record.totime),
            status: record.status,
            amount,
            service,
            gst,
            cgst,
            sgst,
            igst,
            total,
            advance_amount_paid: parseAmount(record.advanceamountpaid || record.advance_amount_paid || 0),
            remaining_amount: parseAmount(record.remainingamount || record.remaining_amount || 0),
            createdAt: formatDate(record.createdat || record.created_at),
            source: 'google_sheets',
            groupBookingId: record.group_booking_id || null,
            cancellation_reason: record.cancellation_reason || null
          } as Booking;
        });

        return formatted;
      }
      return [];
    } catch (error) {
      console.error('❌ Error loading bookings from Google Sheets:', error);
      throw error;
    }
  };

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let bookingsData: Booking[] = [];

      if (isProUser) {
        bookingsData = await fetchFromBackend();
      } else {
        bookingsData = await fetchFromGoogleSheets();
      }

      setBookings(bookingsData);

      // Group bookings by group ID
      const grouped = new Map<string, Booking[]>();
      bookingsData.forEach((booking: Booking) => {
        if (booking.groupBookingId) {
          if (!grouped.has(booking.groupBookingId)) {
            grouped.set(booking.groupBookingId, []);
          }
          grouped.get(booking.groupBookingId)!.push(booking);
        }
      });

      setGroupedBookings(grouped);
      console.log('📦 Grouped bookings:', Object.fromEntries(grouped));
      notifyBookingsUpdated();

      if (isRefresh) {
        toast({
          title: "Success",
          description: `Bookings refreshed successfully (${bookingsData.length} bookings, ${grouped.size} groups)`
        });
      }

    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: `Failed to load bookings: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===========================================
  // FETCH FUNCTION BOOKINGS
  // ===========================================

  const fetchFunctionBookings = async () => {
    if (!isProUser) return;

    try {
      setLoadingFunctionBookings(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${NODE_BACKEND_URL}/function-rooms/bookings/with-rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        const transformedBookings = result.data.map((booking: any) => ({
          id: booking.id,
          booking_reference: booking.booking_reference,
          event_name: booking.event_name,
          event_type: booking.event_type,
          booking_date: formatDateForDisplay(booking.booking_date),
          end_date: formatDateForDisplay(booking.end_date || booking.booking_date),
          start_time: formatTime(booking.start_time),
          end_time: formatTime(booking.end_time),
          function_room_id: booking.function_room_id,
          room_name: booking.room_name || 'N/A',
          room_number: booking.room_number || 'N/A',
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email || '',
          total_amount: booking.total_amount,
          advance_paid: booking.advance_paid || 0,
          balance_due: (booking.total_amount - (booking.advance_paid || 0)),
          status: booking.status,
          payment_status: booking.payment_status,
          guests_expected: booking.guests_expected,
          has_room_bookings: booking.has_room_bookings || false,
          total_rooms_booked: booking.total_rooms_booked || 0,
          subtotal: booking.subtotal,
          gst: booking.gst,
          discount: booking.discount,
          other_charges: booking.other_charges,
          gst_percentage: booking.gst_percentage || 18,
          special_requests: booking.special_requests,
          catering_requirements: booking.catering_requirements,
          room_bookings: booking.room_bookings || [],
          created_at: formatDateForDisplay(booking.created_at)
        }));

        setFunctionBookings(transformedBookings);
      }
    } catch (error) {
      console.error('❌ Error fetching function bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load function bookings",
        variant: "destructive"
      });
    } finally {
      setLoadingFunctionBookings(false);
    }
  };

  // ===========================================
  // FETCH QUOTATIONS
  // ===========================================

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${NODE_BACKEND_URL}/quotations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Quotations response:', data);

      if (data.success && Array.isArray(data.data)) {
        const uniqueQuotations = [];
        const seenIds = new Set();

        data.data.forEach((quotation, index) => {
          const baseId = quotation.id || quotation.quotation_number || `quotation-${index}`;
          let uniqueId = baseId;

          if (seenIds.has(uniqueId)) {
            uniqueId = `${baseId}-dup-${Date.now()}-${index}`;
          }

          seenIds.add(uniqueId);
          uniqueQuotations.push({
            ...quotation,
            _uniqueRowId: uniqueId
          });
        });

        setQuotations(uniqueQuotations);
      } else {
        console.error('Failed to fetch quotations:', data);
        setQuotations([]);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive"
      });
    }
  };

  // ===========================================
  // FUNCTION BOOKING INVOICE FUNCTIONS
  // ===========================================

  const getFunctionBookingInvoiceData = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${NODE_BACKEND_URL}/function-rooms/bookings/${bookingId}/invoice/json`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching function invoice data:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice data",
        variant: "destructive"
      });
      return null;
    }
  };

  const downloadFunctionBookingInvoicePDF = async (bookingId: number, bookingReference: string) => {
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please login again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Generating Invoice",
        description: "Please wait while we generate the PDF...",
        duration: 2000
      });

      const url = `${NODE_BACKEND_URL}/function-rooms/bookings/${bookingId}/invoice/pdf`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.status}`);
      }

      const blob = await response.blob();
      const urlObject = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObject;
      link.download = `function-booking-invoice-${bookingReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObject);

      toast({
        title: "✅ Invoice Downloaded",
        description: "Function booking invoice has been downloaded successfully",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error downloading function booking invoice:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const downloadFunctionInvoiceHTML = async (bookingId, bookingReference) => {
    try {
      const token = localStorage.getItem('authToken');

      toast({
        title: "Generating Invoice",
        description: "Please wait while we generate the invoice...",
        duration: 2000
      });

      const response = await fetch(
        `${NODE_BACKEND_URL}/function-rooms/bookings/${bookingId}/invoice/html`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/html'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.status}`);
      }

      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `function-invoice-${bookingReference}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Invoice Downloaded",
        description: "Function booking invoice has been downloaded successfully as HTML",
        duration: 3000
      });

    } catch (error) {
      console.error('❌ Error downloading function invoice HTML:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const showFunctionInvoiceModalWithData = async (bookingId: number) => {
    const data = await getFunctionBookingInvoiceData(bookingId);
    if (data) {
      setSelectedFunctionInvoiceData(data);
      setShowFunctionInvoiceModal(true);
    }
  };

  // ===========================================
  // GROUP INVOICE FUNCTIONS
  // ===========================================

  const generateGroupInvoice = (groupId: string, groupRooms: Booking[]): GroupInvoiceData | null => {
    if (!groupRooms || groupRooms.length === 0) return null;

    const sortedRooms = [...groupRooms].sort((a, b) =>
      String(a.roomNumber).localeCompare(String(b.roomNumber))
    );

    const firstRoom = sortedRooms[0];
    const customerName = firstRoom.customerName;
    const customerPhone = firstRoom.customerPhone;
    const fromDate = firstRoom.fromDate;
    const toDate = firstRoom.toDate;

    const subtotal = sortedRooms.reduce((sum, room) => sum + room.amount, 0);
    const serviceTotal = sortedRooms.reduce((sum, room) => sum + (room.service || 0), 0);
    const cgstTotal = sortedRooms.reduce((sum, room) => sum + (room.cgst || 0), 0);
    const sgstTotal = sortedRooms.reduce((sum, room) => sum + (room.sgst || 0), 0);
    const igstTotal = sortedRooms.reduce((sum, room) => sum + (room.igst || 0), 0);
    const grandTotal = sortedRooms.reduce((sum, room) => sum + room.total, 0);

    return {
      groupId,
      invoiceNumber: `GRP-INV-${groupId.slice(-8)}`,
      invoiceDate: formatDateForDisplay(new Date().toISOString()),
      customer: {
        name: customerName,
        phone: customerPhone
      },
      booking: {
        fromDate,
        toDate,
        nights: sortedRooms.length > 0 ? calculateNights(fromDate, toDate) : 1
      },
      rooms: sortedRooms.map(room => ({
        roomNumber: room.roomNumber,
        amount: room.amount,
        service: room.service || 0,
        cgst: room.cgst || 0,
        sgst: room.sgst || 0,
        igst: room.igst || 0,
        total: room.total,
        bookingId: room.bookingId
      })),
      totals: {
        subtotal,
        serviceTotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        totalGst: cgstTotal + sgstTotal + igstTotal,
        grandTotal
      },
      roomCount: sortedRooms.length
    };
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const viewGroupInvoice = (groupId: string) => {
    const groupRooms = groupedBookings.get(groupId);
    if (!groupRooms || groupRooms.length === 0) {
      toast({
        title: "Error",
        description: "No bookings found for this group",
        variant: "destructive"
      });
      return;
    }

    const invoiceData = generateGroupInvoice(groupId, groupRooms);
    if (invoiceData) {
      setSelectedGroupInvoiceData(invoiceData);
      setSelectedGroupId(groupId);
      setShowGroupInvoiceModal(true);
    }
  };

  const downloadGroupInvoice = (groupId: string) => {
    const groupRooms = groupedBookings.get(groupId);
    if (!groupRooms || groupRooms.length === 0) {
      toast({
        title: "Error",
        description: "No bookings found for this group",
        variant: "destructive"
      });
      return;
    }

    const invoiceData = generateGroupInvoice(groupId, groupRooms);
    if (!invoiceData) return;

    const invoiceHTML = generateGroupInvoiceHTML(invoiceData);
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `group-invoice-${groupId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "✅ Invoice Downloaded",
      description: `Group invoice for ${groupRooms.length} rooms downloaded successfully`,
      duration: 3000
    });
  };
  // Add this function after openInvoiceBuilder function

  const openGroupInvoiceBuilder = async (groupId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login again",
          variant: "destructive"
        });
        return;
      }

      // Pass token as query parameter
      const url = `${NODE_BACKEND_URL}/bookings/group/${groupId}/invoice-builder?token=${encodeURIComponent(token)}`;

      // Open in new tab
      window.open(url, '_blank');

      toast({
        title: "Group Invoice Builder Opened",
        description: "Edit and customize your group invoice in the new tab. Click Save to download.",
        duration: 3000
      });
    } catch (error: any) {
      console.error('❌ Error opening group invoice builder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open group invoice builder",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const generateGroupInvoiceHTML = (invoiceData: GroupInvoiceData): string => {
    const { groupId, invoiceNumber, invoiceDate, customer, booking, rooms, totals, roomCount } = invoiceData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Group Invoice - ${groupId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
          .hotel-name { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .invoice-title { font-size: 20px; font-weight: bold; color: #3498db; margin-bottom: 20px; text-align: center; }
          .group-badge { background-color: #3498db; color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; font-size: 14px; margin-bottom: 15px; }
          .details-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .details-box { flex: 1; padding: 10px; background-color: #f8f9fa; border-radius: 4px; margin-right: 10px; }
          .details-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; display: block; border-bottom: 1px solid #3498db; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #2c3e50; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
          .total-row { font-weight: bold; background-color: #e8f4fd; }
          .summary { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { font-size: 18px; font-weight: bold; color: #27ae60; border-top: 2px solid #3498db; padding-top: 10px; margin-top: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px dashed #ddd; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hotel-name">Hotel Management System</div>
          <div>Date: ${invoiceDate}</div>
        </div>
        
        <div class="invoice-title">GROUP BOOKING INVOICE</div>
        <div class="group-badge">Group ID: ${groupId} | ${roomCount} Rooms | Invoice: ${invoiceNumber}</div>
        
        <div class="details-section">
          <div class="details-box">
            <span class="details-label">Customer Details</span>
            <div><strong>Name:</strong> ${customer.name}</div>
            <div><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
          </div>
          <div class="details-box">
            <span class="details-label">Booking Details</span>
            <div><strong>Check-in:</strong> ${booking.fromDate}</div>
            <div><strong>Check-out:</strong> ${booking.toDate}</div>
            <div><strong>Duration:</strong> ${booking.nights} night(s)</div>
          </div>
        </div>
        
        <h3>Room Details</h3>
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Amount</th>
              <th>Service</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Total</th>
             </tr>
          </thead>
          <tbody>
            ${rooms.map((room: any) => `
               <tr>
                <td>Room ${room.roomNumber}</td>
                <td>₹${room.amount.toLocaleString('en-IN')}</td>
                <td>₹${room.service.toLocaleString('en-IN')}</td>
                <td>₹${room.cgst.toLocaleString('en-IN')}</td>
                <td>₹${room.sgst.toLocaleString('en-IN')}</td>
                <td>₹${room.igst.toLocaleString('en-IN')}</td>
                <td><strong>₹${room.total.toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-row">
            <span>Subtotal (Room Charges):</span>
            <span>₹${totals.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row">
            <span>Service Charges:</span>
            <span>₹${totals.serviceTotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row">
            <span>CGST:</span>
            <span>₹${totals.cgstTotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row">
            <span>SGST:</span>
            <span>₹${totals.sgstTotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row">
            <span>IGST:</span>
            <span>₹${totals.igstTotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row grand-total">
            <span>GRAND TOTAL:</span>
            <span>₹${totals.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated invoice for group booking with ${roomCount} rooms.</p>
          <p>Thank you for choosing our hotel!</p>
        </div>
      </body>
      </html>
    `;
  };

  // ===========================================
  // VIEW FUNCTION BOOKING DETAILS
  // ===========================================

  const viewFunctionBookingDetails = (booking: FunctionBooking) => {
    setSelectedFunctionBooking(booking);
    setShowFunctionBookingDetails(true);
  };

  // ===========================================
  // DELETE BOOKING
  // ===========================================

  // const deleteBooking = async (bookingId: string) => {
  //   if (!isUserAdmin) {
  //     toast({
  //       title: "Access Denied",
  //       description: "Only administrators can delete bookings",
  //       variant: "destructive"
  //     });
  //     return false;
  //   }

  //   if (!isProUser) {
  //     toast({
  //       title: "Not Available",
  //       description: "Delete function is only available for Pro Plan users",
  //       variant: "destructive"
  //     });
  //     return false;
  //   }

  //   try {
  //     const result = await fetchBackendRequest(`/bookings/${bookingId}`, null, 'DELETE');

  //     if (result.success) {
  //       setBookings(prev => prev.filter(booking => booking.bookingId !== bookingId));
  //       return true;
  //     } else {
  //       throw new Error(result.message || 'Failed to delete booking');
  //     }
  //   } catch (error) {
  //     console.error('❌ Error deleting booking:', error);
  //     throw error;
  //   }
  // };

  // REPLACE the existing deleteBooking function with this:
  const deleteBooking = async (bookingId: string) => {
    if (!isUserAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete bookings",
        variant: "destructive"
      });
      return false;
    }

    if (!isProUser) {
      toast({
        title: "Not Available",
        description: "Delete function is only available for Pro Plan users",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await fetchBackendRequest(`/bookings/${bookingId}`, null, 'DELETE');

      if (result.success) {
        // Remove from local state
        setBookings(prev => prev.filter(booking => booking.bookingId !== bookingId));
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('❌ Error deleting booking:', error);
      throw error;
    }
  };

  // Add these new functions after deleteBooking
  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    setDeleting(true);

    try {
      const success = await deleteBooking(bookingToDelete.bookingId);
      if (success) {
        toast({
          title: "✅ Booking Deleted",
          description: `Booking for ${bookingToDelete.customerName} (Room ${bookingToDelete.roomNumber}) has been permanently deleted.`,
          duration: 4000
        });

        // Refresh bookings
        await fetchBookings(true);

        // Close modal
        setShowDeleteConfirm(false);
        setBookingToDelete(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setBookingToDelete(null);
  };

  const calculateCheckoutTotals = (booking: Booking) => {
    let extras = 0;
    if (breakfastTaken) {
      extras += breakfastPrice * breakfastDays * breakfastGuests;
    }
    extras += otherServiceCharges;

    const baseRoomAmount = booking.amount || 0;
    let discountAmount = 0;
    if (checkoutDiscountType === 'percentage') {
      discountAmount = (baseRoomAmount * checkoutDiscountValue) / 100;
    } else if (checkoutDiscountType === 'amount') {
      discountAmount = checkoutDiscountValue;
    }

    const newRoomAmount = baseRoomAmount - discountAmount;
    const totalService = (booking.service || 0) + extras;
    const baseForTax = newRoomAmount + totalService;

    const currentCgstRate = booking.cgst && baseRoomAmount > 0 ? (booking.cgst / baseRoomAmount) * 100 : 0;
    const currentSgstRate = booking.sgst && baseRoomAmount > 0 ? (booking.sgst / baseRoomAmount) * 100 : 0;
    const currentIgstRate = booking.igst && baseRoomAmount > 0 ? (booking.igst / baseRoomAmount) * 100 : 0;

    const cgst = currentCgstRate > 0 ? (baseForTax * Math.round(currentCgstRate)) / 100 : 0;
    const sgst = currentSgstRate > 0 ? (baseForTax * Math.round(currentSgstRate)) / 100 : 0;
    const igst = currentIgstRate > 0 ? (baseForTax * Math.round(currentIgstRate)) / 100 : 0;
    const gst = cgst + sgst + igst;
    const estimatedTotal = baseForTax + gst;

    const advancePaid = booking.advance_amount_paid || 0;
    const balanceDue = Math.max(0, estimatedTotal - advancePaid);

    return {
      discountAmount,
      newRoomAmount,
      totalService,
      cgst,
      sgst,
      igst,
      gst,
      estimatedTotal,
      advancePaid,
      balanceDue,
    };
  };

  const checkoutTotals = useMemo(() => {
    if (!checkoutBooking) return null;
    return calculateCheckoutTotals(checkoutBooking);
  }, [
    checkoutBooking,
    breakfastTaken,
    breakfastPrice,
    breakfastDays,
    breakfastGuests,
    otherServiceCharges,
    checkoutDiscountType,
    checkoutDiscountValue,
  ]);

  useEffect(() => {
    if (!checkoutModalOpen || checkoutPaymentMethod !== 'online' || !isProUser) return;

    const fetchHotelQRCode = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${NODE_BACKEND_URL}/hotels/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.qrcode_image) {
            setCheckoutHotelQRCode(data.data.qrcode_image);
          }
        }
      } catch (error) {
        console.error('Error fetching hotel QR code:', error);
      }
    };

    fetchHotelQRCode();
  }, [checkoutModalOpen, checkoutPaymentMethod, isProUser]);

  useEffect(() => {
    if (!checkoutModalOpen) return;
    if (checkoutPaymentMethod === 'cash') {
      setCheckoutPaymentStatus('completed');
      return;
    }
    if (checkoutPaymentMethod === 'online' && checkoutPaymentStatus === 'completed') {
      return;
    }
    if (checkoutPaymentMethod === 'online') {
      setCheckoutPaymentStatus('pending');
    }
  }, [checkoutPaymentMethod, checkoutModalOpen]);

  useEffect(() => {
    if (!checkoutModalOpen || checkoutPaymentMethod !== 'online' || !checkoutAmountToPay) return;
    generateCheckoutUPIQrCode(checkoutAmountToPay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutModalOpen, checkoutPaymentMethod, checkoutAmountToPay]);

  // Keep "amount to pay" in sync when bill changes (add-ons, discount)
  useEffect(() => {
    if (!checkoutModalOpen || !checkoutTotals) return;
    const target = checkoutTotals.advancePaid > 0
      ? checkoutTotals.balanceDue
      : checkoutTotals.estimatedTotal;
    setCheckoutAmountToPay(target);
  }, [
    checkoutModalOpen,
    checkoutTotals?.estimatedTotal,
    checkoutTotals?.balanceDue,
    checkoutTotals?.advancePaid,
  ]);

  const handleCheckoutClick = (booking: Booking) => {
    setCheckoutBooking(booking);
    setBreakfastTaken(false);
    setBreakfastPrice(150);
    const nights = calculateNights(booking.fromDate, booking.toDate) || 1;
    setBreakfastDays(nights);
    setBreakfastGuests(Number((booking as any).guests) || 1);
    setOtherServiceCharges(0);
    setOtherServiceDescription('');
    setCheckoutPaymentMethod(normalizeCheckoutPaymentMethod(booking.payment_method));
    setCheckoutPaymentStatus('completed');
    setCheckoutTransactionId(booking.transaction_id || '');
    setCheckoutHotelQRCode(null);
    setCheckoutQrCodeData('');
    setIsGeneratingCheckoutQR(false);
    setIsVerifyingCheckoutPayment(false);
    setCheckoutDiscountType('none');
    setCheckoutDiscountValue(0);
    setCheckoutActiveTab(isBasicDbUser ? 'payment' : 'services');

    const advancePaid = booking.advance_amount_paid || 0;
    const initialTotal = booking.total || 0;
    const initialPay = advancePaid > 0
      ? Math.max(0, initialTotal - advancePaid)
      : initialTotal;
    setCheckoutAmountToPay(initialPay);
    setBookingModalView('main');
    setCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setCheckoutModalOpen(false);
    setCheckoutBooking(null);
    setBookingModalView('main');
    setEditingBookingId(null);
    setEditForm({});
    setCheckoutHotelQRCode(null);
    setCheckoutQrCodeData('');
    setIsGeneratingCheckoutQR(false);
    setIsVerifyingCheckoutPayment(false);
  };

  const mapApiBookingToEditFields = (booking: Booking, api: any): Booking => ({
    ...booking,
    customerName: api.customer_name || api.customer?.name || booking.customerName,
    customerPhone: api.customer_phone || api.customer?.phone || booking.customerPhone,
    fromDate: formatDateForDisplay(api.from_date),
    toDate: formatDateForDisplay(api.to_date),
    rawFromDate: api.from_date,
    rawToDate: api.to_date,
    fromTime: formatTimeForInput(api.from_time) || '14:00',
    toTime: formatTimeForInput(api.to_time) || '12:00',
    rawFromTime: api.from_time || '',
    rawToTime: api.to_time || '',
    amount: parseAmount(api.amount),
    service: parseAmount(api.service),
    gst: parseAmount(api.gst),
    cgst: parseAmount(api.cgst),
    sgst: parseAmount(api.sgst),
    igst: parseAmount(api.igst),
    total: parseAmount(api.total),
    status: api.status || booking.status,
  });

  const startEditInModal = async (booking: Booking) => {
    if (!canEditBooking(booking.status)) {
      toast({
        title: 'Cannot edit',
        description: 'This booking is already checked out and cannot be edited.',
        variant: 'destructive',
      });
      return;
    }

    let bookingToEdit = booking;

    if (booking.source === 'database') {
      setLoadingCheckoutEdit(true);
      try {
        const res = await fetchBackendRequest(`/bookings/${booking.bookingId}`, null, 'GET');
        if (res?.success && res.data) {
          bookingToEdit = mapApiBookingToEditFields(booking, res.data);
          setCheckoutBooking((prev) =>
            prev?.bookingId === booking.bookingId ? bookingToEdit : prev
          );
        }
      } catch (error) {
        console.error('Failed to fetch booking times for edit:', error);
        toast({
          title: 'Could not refresh booking',
          description: 'Showing saved data. Times may need to be re-entered.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCheckoutEdit(false);
      }
    }

    handleEditStart(bookingToEdit);
    setBookingModalView('edit');
  };

  const handleEditSaveFromModal = async () => {
    if (!checkoutBooking) return;
    await handleEditSave(checkoutBooking.bookingId, closeCheckoutModal);
  };

  const runBookingAction = (action: () => void) => {
    closeCheckoutModal();
    action();
  };

  const openInvoiceView = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const renderBookingManageActions = (booking: Booking) => (
    <div className="flex flex-wrap gap-2">
      {booking.status !== 'blocked' && booking.status !== 'maintenance' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openInvoiceView(booking.bookingId)}
          className="h-8 text-xs"
          data-basic-plan-allow
          title="View invoice (read only on Basic plan)"
        >
          <FileText className="h-3.5 w-3.5 mr-1" />
          View Invoice
        </Button>
      )}
      {booking.status === 'blocked' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => runBookingAction(() => downloadBlockPDF(booking.bookingId))}
          className="h-8 text-xs bg-red-50 border-red-200 text-red-700"
        >
          <Ban className="h-3.5 w-3.5 mr-1" />
          Block PDF
        </Button>
      )}
      {booking.status === 'maintenance' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => runBookingAction(() => downloadMaintenancePDF(booking.bookingId))}
          className="h-8 text-xs bg-amber-50 border-amber-200 text-amber-700"
        >
          <Wrench className="h-3.5 w-3.5 mr-1" />
          Maint. PDF
        </Button>
      )}
      {booking.groupBookingId && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => runBookingAction(() => viewGroupInvoice(booking.groupBookingId!))}
          className="h-8 text-xs bg-indigo-50 border-indigo-200 text-indigo-700"
        >
          <Layers className="h-3.5 w-3.5 mr-1" />
          Group Invoice
        </Button>
      )}
      {booking.status !== 'cancelled' && (
        <Button
          size="sm"
          variant="outline"
          disabled={!canEditBooking(booking.status)}
          onClick={() => startEditInModal(booking)}
          className="h-8 text-xs"
          title={
            canEditBooking(booking.status)
              ? 'Edit booking details'
              : 'Editing disabled — checkout already completed'
          }
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit Booking
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={isBasicDbUser}
        onClick={() =>
          !isBasicDbUser && runBookingAction(() => openInvoiceBuilder(booking.bookingId))
        }
        className="h-8 text-xs bg-purple-50 border-purple-200 text-purple-700 disabled:opacity-50"
        title={isBasicDbUser ? 'Pro feature — upgrade to unlock' : 'Customize invoice layout'}
      >
        <Edit className="h-3.5 w-3.5 mr-1" />
        Customize Invoice
      </Button>
      {isUserAdmin && isProUser && booking.status !== 'cancelled' && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => runBookingAction(() => handleDeleteClick(booking))}
          className="h-8 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      )}
    </div>
  );

  const renderBookingEditForm = () => {
    if (!checkoutBooking) return null;
    return (
      <div className="space-y-3 p-3 overflow-y-auto flex-1 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Customer Name</Label>
            <Input
              value={editForm.customerName ?? ''}
              onChange={(e) => handleFieldChange('customerName', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input
              value={editForm.customerPhone ?? ''}
              onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <select
              value={editForm.status ?? checkoutBooking.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full h-9 border rounded-md px-2 text-sm bg-background"
            >
              <option value="booked">Booked</option>
              <option value="blocked">Blocked</option>
              <option value="maintenance">Maintenance</option>
              <option value="completed">Checkout</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Check-in Date</Label>
            <Input
              type="date"
              value={editForm.fromDate ?? ''}
              onChange={(e) => handleFieldChange('fromDate', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Check-out Date</Label>
            <Input
              type="date"
              value={editForm.toDate ?? ''}
              min={getMinCheckoutDate(editForm.fromDate ?? '') || undefined}
              onChange={(e) => handleFieldChange('toDate', e.target.value)}
              className="h-9"
            />
          </div>
          {editForm.fromDate && editForm.toDate && (
            <div className="sm:col-span-2 text-xs text-muted-foreground">
              Stay: {calculateNights(editForm.fromDate, editForm.toDate)} night
              {calculateNights(editForm.fromDate, editForm.toDate) !== 1 ? 's' : ''}
              {' · '}
              Amounts update automatically when dates change
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Check-in Time</Label>
            <Input
              type="time"
              value={editForm.fromTime ?? ''}
              onChange={(e) => handleFieldChange('fromTime', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Check-out Time</Label>
            <Input
              type="time"
              value={editForm.toTime ?? ''}
              onChange={(e) => handleFieldChange('toTime', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Room Amount (₹)</Label>
            <Input
              type="number"
              value={editForm.amount ?? ''}
              onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Service (₹)</Label>
            <Input
              type="number"
              value={editForm.service ?? ''}
              onChange={(e) => handleFieldChange('service', Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CGST (₹)</Label>
            <Input
              type="number"
              value={editForm.cgst ?? ''}
              onChange={(e) => handleFieldChange('cgst', Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SGST (₹)</Label>
            <Input
              type="number"
              value={editForm.sgst ?? ''}
              onChange={(e) => handleFieldChange('sgst', Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">IGST (₹)</Label>
            <Input
              type="number"
              value={editForm.igst ?? ''}
              onChange={(e) => handleFieldChange('igst', Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">Total (₹)</Label>
            <Input
              type="number"
              value={editForm.total ?? ''}
              readOnly
              className="h-9 bg-muted font-semibold"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleCheckoutSubmit = async () => {
    if (!checkoutBooking || !checkoutTotals) return;

    const {
      estimatedTotal,
      advancePaid,
      balanceDue,
      discountAmount,
      newRoomAmount,
      totalService,
      cgst,
      sgst,
      igst,
      gst,
    } = checkoutTotals;

    const maxPayable = advancePaid > 0 ? balanceDue : estimatedTotal;
    if (checkoutAmountToPay <= 0) {
      toast({
        title: 'Payment amount required',
        description: 'Enter the amount the client is paying at checkout',
        variant: 'destructive',
      });
      return;
    }
    if (checkoutPaymentMethod === 'online' && checkoutPaymentStatus !== 'completed') {
      toast({
        title: 'Verify online payment',
        description: 'Ask the guest to scan the QR code, then click "I have made the payment".',
        variant: 'destructive',
      });
      return;
    }
    if (checkoutAmountToPay > maxPayable + 0.01) {
      toast({
        title: 'Invalid payment amount',
        description: advancePaid > 0
          ? `Amount cannot exceed balance due (₹${balanceDue.toFixed(2)})`
          : `Amount cannot exceed total (₹${estimatedTotal.toFixed(2)})`,
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      let serviceDescription = '';

      if (breakfastTaken) {
        const bfAmount = breakfastPrice * breakfastDays * breakfastGuests;
        serviceDescription += `Breakfast (${breakfastGuests} pax x ${breakfastDays} days: ₹${bfAmount})`;
      }

      if (otherServiceCharges > 0) {
        if (serviceDescription) serviceDescription += ', ';
        serviceDescription += `${otherServiceDescription || 'Extra Services'}: ₹${otherServiceCharges}`;
      }

      const baseRoomAmount = checkoutBooking.amount || 0;
      let discountPercentage = 0;
      if (checkoutDiscountType === 'percentage') {
        discountPercentage = checkoutDiscountValue;
      } else if (checkoutDiscountType === 'amount' && baseRoomAmount > 0) {
        discountPercentage = (discountAmount / baseRoomAmount) * 100;
      }

      const totalPaid = advancePaid + checkoutAmountToPay;
      const newRemaining = Math.max(0, estimatedTotal - totalPaid);

      // Completing checkout = bill closed. If client paid anything at desk, mark completed.
      let finalPaymentStatus: 'completed' | 'partial' | 'pending' = 'completed';
      if (checkoutAmountToPay <= 0 && newRemaining > 0.01) {
        finalPaymentStatus =
          checkoutPaymentStatus === 'pending' ? 'pending' : 'partial';
      }

      const updates: any = {
        status: 'completed',
        amount: newRoomAmount,
        service: totalService,
        cgst,
        sgst,
        igst,
        gst,
        total: estimatedTotal,
        payment_method: checkoutPaymentMethod,
        payment_status: finalPaymentStatus,
        transaction_id: checkoutTransactionId,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        original_amount: baseRoomAmount,
        advance_amount_paid: totalPaid,
        remaining_amount: newRemaining,
        special_requests: checkoutBooking.special_requests 
          ? `${checkoutBooking.special_requests}\nCheckout: paid ₹${checkoutAmountToPay.toFixed(2)}${serviceDescription ? `; Add-ons: ${serviceDescription}` : ''}`.trim()
          : `Checkout: paid ₹${checkoutAmountToPay.toFixed(2)}${serviceDescription ? `; Add-ons: ${serviceDescription}` : ''}`.trim()
      };

      const success = await updateBooking(checkoutBooking.bookingId, updates);
      if (success) {
        setCheckoutModalOpen(false);
        setCheckoutBooking(null);
        await fetchBookings(true);
        notifyBookingsUpdated();
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error.message || "An error occurred during checkout",
        variant: "destructive"
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

    try {
      const success = await deleteBooking(bookingId);
      if (success) {
        toast({
          title: "Success",
          description: "Booking deleted successfully"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive"
      });
    }
  };

  // ===========================================
  // DOWNLOAD INVOICE
  // ===========================================

  // const downloadInvoice = async (bookingId: string) => {
  //   try {
  //     const token = localStorage.getItem('authToken');

  //     toast({
  //       title: "Generating Invoice",
  //       description: "Please wait while we generate your invoice...",
  //       duration: 2000
  //     });

  //     const response = await fetch(`${NODE_BACKEND_URL}/bookings/${bookingId}/invoice/download`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Accept': 'text/html'
  //       }
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to download invoice: ${response.status}`);
  //     }

  //     const htmlContent = await response.text();
  //     const blob = new Blob([htmlContent], { type: 'text/html' });
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `invoice-${bookingId}.html`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);

  //     toast({
  //       title: "✅ Invoice Downloaded",
  //       description: "Invoice has been downloaded successfully as HTML file",
  //       duration: 3000
  //     });

  //   } catch (error: any) {
  //     console.error('❌ Error downloading invoice:', error);
  //     toast({
  //       title: "Error",
  //       description: error.message || "Failed to download invoice",
  //       variant: "destructive",
  //       duration: 5000
  //     });
  //   }
  // };

  const downloadInvoice = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('authToken');

      toast({
        title: "Generating Invoice",
        description: "Please wait while we generate your invoice...",
        duration: 2000
      });

      const response = await fetch(`${NODE_BACKEND_URL}/bookings/${bookingId}/invoice/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.status}`);
      }

      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Invoice Downloaded",
        description: "Invoice has been downloaded successfully",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error downloading invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
        duration: 5000
      });
    }
  };


  const openInvoiceBuilder = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login again",
          variant: "destructive"
        });
        return;
      }

      // Pass token as query parameter
      const url = `${NODE_BACKEND_URL}/bookings/${bookingId}/invoice-builder?token=${encodeURIComponent(token)}`;

      // Open in new tab
      window.open(url, '_blank');

      toast({
        title: "Invoice Builder Opened",
        description: "Edit and customize your invoice in the new tab. Click Save to download.",
        duration: 3000
      });
    } catch (error: any) {
      console.error('❌ Error opening invoice builder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open invoice builder",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // ===========================================
  // BLOCK/MAINTENANCE REPORTS
  // ===========================================

  const downloadBlockPDF = async (bookingId: string) => {
    try {
      setReportLoading(true);
      const token = localStorage.getItem('authToken');

      toast({
        title: "Generating Block Report",
        description: "Please wait while we generate the block report...",
        duration: 2000
      });

      const response = await fetch(`${NODE_BACKEND_URL}/bookings/block/${bookingId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download block report: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `block-report-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Block Report Downloaded",
        description: "Block room report has been downloaded successfully",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error downloading block report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download block report",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setReportLoading(false);
    }
  };

  const downloadMaintenancePDF = async (bookingId: string) => {
    try {
      setReportLoading(true);
      const token = localStorage.getItem('authToken');

      toast({
        title: "Generating Maintenance Report",
        description: "Please wait while we generate the maintenance report...",
        duration: 2000
      });

      const response = await fetch(`${NODE_BACKEND_URL}/bookings/maintenance/${bookingId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download maintenance report: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-report-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Success",
        description: "Maintenance report downloaded successfully",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error downloading maintenance PDF:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download maintenance report: ${error.message}`,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setReportLoading(false);
    }
  };

  const downloadCombinedReport = async (startDate?: string, endDate?: string) => {
    try {
      setReportLoading(true);
      const token = localStorage.getItem('authToken');
      let url = `${NODE_BACKEND_URL}/bookings/combined-report/pdf`;

      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      toast({
        title: "Generating Combined Report",
        description: "Please wait while we generate the combined report...",
        duration: 2000
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download combined report: ${response.status}`);
      }

      const blob = await response.blob();
      const urlObject = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObject;
      link.download = startDate && endDate
        ? `room-status-report-${startDate}-to-${endDate}.pdf`
        : `room-status-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObject);

      toast({
        title: "✅ Combined Report Downloaded",
        description: "Combined report has been downloaded successfully",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error downloading combined report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download combined report",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setReportLoading(false);
    }
  };

  // ===========================================
  // UPDATE BOOKING
  // ===========================================

  const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      console.log('='.repeat(50));
      console.log('📤 SENDING UPDATE TO BACKEND');
      console.log('='.repeat(50));
      console.log('Booking ID:', bookingId);
      console.log('Updates being sent:', JSON.stringify(updates, null, 2));

      const currentBooking = bookings.find(b => b.bookingId === bookingId);

      const backendUpdates: any = {};

      if (updates.amount !== undefined) backendUpdates.amount = updates.amount;
      if (updates.service !== undefined) backendUpdates.service = updates.service;
      if (updates.cgst !== undefined) backendUpdates.cgst = updates.cgst;
      if (updates.sgst !== undefined) backendUpdates.sgst = updates.sgst;
      if (updates.igst !== undefined) backendUpdates.igst = updates.igst;
      if (updates.gst !== undefined) backendUpdates.gst = updates.gst;
      if (updates.total !== undefined) backendUpdates.total = updates.total;
      if (updates.status !== undefined) backendUpdates.status = updates.status;
      if ((updates as any).payment_method !== undefined) backendUpdates.payment_method = (updates as any).payment_method;
      if ((updates as any).payment_status !== undefined) backendUpdates.payment_status = (updates as any).payment_status;
      if ((updates as any).transaction_id !== undefined) backendUpdates.transaction_id = (updates as any).transaction_id;
      if ((updates as any).discount_percentage !== undefined) backendUpdates.discount_percentage = (updates as any).discount_percentage;
      if ((updates as any).discount_amount !== undefined) backendUpdates.discount_amount = (updates as any).discount_amount;
      if ((updates as any).original_amount !== undefined) backendUpdates.original_amount = (updates as any).original_amount;
      if ((updates as any).advance_amount_paid !== undefined) backendUpdates.advance_amount_paid = (updates as any).advance_amount_paid;
      if ((updates as any).remaining_amount !== undefined) backendUpdates.remaining_amount = (updates as any).remaining_amount;
      if (updates.special_requests !== undefined) backendUpdates.special_requests = updates.special_requests;

      if (updates.status === 'completed' || updates.status === 'cancelled') {
        backendUpdates.room_id = currentBooking?.roomId;
      }

      if (updates.fromDate !== undefined) {
        const date = new Date(updates.fromDate);
        if (!isNaN(date.getTime())) {
          backendUpdates.from_date = date.toISOString().split('T')[0];
        }
      }

      if (updates.toDate !== undefined) {
        const date = new Date(updates.toDate);
        if (!isNaN(date.getTime())) {
          backendUpdates.to_date = date.toISOString().split('T')[0];
        }
      }

      if (updates.fromTime !== undefined) backendUpdates.from_time = updates.fromTime;
      if (updates.toTime !== undefined) backendUpdates.to_time = updates.toTime;
      if (updates.customerName !== undefined) backendUpdates.customer_name = updates.customerName;
      if (updates.customerPhone !== undefined) backendUpdates.customer_phone = updates.customerPhone;

      let result;

      if (isProUser) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${NODE_BACKEND_URL}/bookings/${bookingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backendUpdates)
        });

        const responseData = await response.json();

        if (!response.ok) {
          if (responseData.error === 'DUPLICATE_BOOKING' || responseData.message?.includes('already exists')) {
            if (responseData.data) {
              toast({
                title: "Room Already Booked",
                description: `This room is already booked for ${responseData.data.from_date} to ${responseData.data.to_date} by ${responseData.data.customer_name || 'another customer'}`,
                variant: "destructive",
                duration: 5000
              });
            } else {
              toast({
                title: "Room Not Available",
                description: responseData.message || "This room is already booked for the selected dates",
                variant: "destructive"
              });
            }
            return false;
          }

          if (responseData.error === 'ROOM_NOT_AVAILABLE') {
            toast({
              title: "Room Not Available",
              description: responseData.message || "This room is already booked for the selected dates",
              variant: "destructive"
            });
            return false;
          }

          throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        result = responseData;
      } else {
        if (!spreadsheetId) throw new Error('No spreadsheet ID found');
        const url = `${APPS_SCRIPT_URL}?action=updatebooking&spreadsheetid=${encodeURIComponent(spreadsheetId)}`;
        const updateData = { bookingId, ...updates };
        result = await loadScript(url + '&' + new URLSearchParams(updateData as any).toString());
      }

      if (result.success) {
        setBookings(prev => prev.map(booking => {
          if (booking.bookingId === bookingId) {
            const updatedBooking = { ...booking, ...updates };

            if (updates.fromDate !== undefined) {
              updatedBooking.fromDate = formatDateForDisplay(updates.fromDate);
              updatedBooking.rawFromDate = updates.fromDate;
            }

            if (updates.toDate !== undefined) {
              updatedBooking.toDate = formatDateForDisplay(updates.toDate);
              updatedBooking.rawToDate = updates.toDate;
            }

            if (updates.customerName !== undefined) updatedBooking.customerName = updates.customerName;
            if (updates.customerPhone !== undefined) updatedBooking.customerPhone = updates.customerPhone;
            if (updates.fromTime !== undefined) updatedBooking.fromTime = updates.fromTime;
            if (updates.toTime !== undefined) updatedBooking.toTime = updates.toTime;
            if (updates.status !== undefined) updatedBooking.status = updates.status;
            if (updates.amount !== undefined) updatedBooking.amount = updates.amount;
            if (updates.service !== undefined) updatedBooking.service = updates.service;
            if (updates.cgst !== undefined) updatedBooking.cgst = updates.cgst;
            if (updates.sgst !== undefined) updatedBooking.sgst = updates.sgst;
            if (updates.igst !== undefined) updatedBooking.igst = updates.igst;
            if (updates.gst !== undefined) updatedBooking.gst = updates.gst;
            if (updates.total !== undefined) updatedBooking.total = updates.total;
            if ((updates as any).payment_status !== undefined) {
              updatedBooking.payment_status = (updates as any).payment_status;
            }
            if ((updates as any).payment_method !== undefined) {
              updatedBooking.payment_method = (updates as any).payment_method;
            }
            if ((updates as any).advance_amount_paid !== undefined) {
              updatedBooking.advance_amount_paid = (updates as any).advance_amount_paid;
            }
            if ((updates as any).remaining_amount !== undefined) {
              updatedBooking.remaining_amount = (updates as any).remaining_amount;
            }

            return updatedBooking;
          }
          return booking;
        }));

        if (updates.status === 'completed' || updates.status === 'cancelled') {
          toast({
            title: 'Success',
            description: `Booking marked as ${updates.status}. Room is now available.`,
          });

          window.dispatchEvent(new CustomEvent('booking-status-changed', {
            detail: {
              roomId: currentBooking?.roomId,
              status: updates.status
            }
          }));

          setSelectedStatus('all');
          await fetchBookings(true);
          setTimeout(() => {
            fetchBookings(true);
          }, 500);
        } else {
          toast({
            title: 'Success',
            description: 'Booking and customer details updated successfully.',
          });
        }

        return true;
      } else {
        throw new Error(result.error || 'Failed to update booking');
      }
    } catch (error: any) {
      console.error('❌ Error updating booking:', error);

      if (error.message?.includes('DUPLICATE_BOOKING') || error.message?.includes('already exists')) {
        toast({
          title: "Room Already Booked",
          description: "This room is already booked for the selected dates by another customer",
          variant: "destructive"
        });
      } else if (error.message?.includes('ROOM_NOT_AVAILABLE')) {
        toast({
          title: "Room Not Available",
          description: "This room is not available for the selected dates",
          variant: "destructive"
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update booking.',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  // ===========================================
  // UPDATE FUNCTION BOOKING
  // ===========================================

  const updateFunctionBooking = async (bookingId: number, updates: Partial<FunctionBooking>) => {
    try {
      const token = localStorage.getItem('authToken');

      toast({
        title: "Updating",
        description: "Updating function booking...",
        duration: 2000
      });

      const response = await fetch(`${NODE_BACKEND_URL}/function-rooms/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        setFunctionBookings(prev => prev.map(booking =>
          booking.id === bookingId
            ? { ...booking, ...updates }
            : booking
        ));

        toast({
          title: "✅ Success",
          description: "Function booking updated successfully",
          duration: 3000
        });

        return true;
      } else {
        throw new Error(result.message || 'Failed to update function booking');
      }
    } catch (error: any) {
      console.error('❌ Error updating function booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update function booking",
        variant: "destructive",
        duration: 5000
      });
      return false;
    }
  };

  const handleFunctionEditSave = async (bookingId: number) => {
    const success = await updateFunctionBooking(bookingId, functionEditForm);
    if (success) {
      setEditingFunctionBookingId(null);
      setFunctionEditForm({});
    }
  };

  // ===========================================
  // UPDATE INVOICE NUMBER
  // ===========================================

  const updateInvoiceNumber = async (bookingId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`${NODE_BACKEND_URL}/bookings/${bookingId}/invoice-number`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_number: invoiceNumber }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Invoice number updated successfully"
        });

        setBookings(prev => prev.map(booking =>
          booking.bookingId === bookingId
            ? { ...booking, invoiceNumber: data.data.invoice_number }
            : booking
        ));

        return true;
      } else {
        throw new Error(data.message || 'Failed to update invoice number');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice number",
        variant: "destructive"
      });
      return false;
    }
  };

  // ===========================================
  // DOWNLOAD QUOTATION
  // ===========================================

  const downloadQuotation = async (quotationId: string, autoPrint: boolean = false) => {
    try {
      const token = localStorage.getItem('authToken');

      toast({
        title: "Downloading Quotation",
        description: "Please wait...",
        duration: 2000
      });

      const url = `${NODE_BACKEND_URL}/quotations/${quotationId}/download?autoprint=${autoPrint}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const html = await response.text();

      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `quotation-${quotationId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "✅ Success",
        description: "Quotation downloaded as HTML file",
        duration: 3000
      });

    } catch (error: any) {
      console.error('❌ Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download quotation",
        variant: "destructive"
      });
    }
  };

  // ===========================================
  // CONVERT QUOTATION TO BOOKING
  // ===========================================

  const convertQuotationToBooking = async (quotationId: string) => {
    if (!window.confirm('Convert this quotation to a booking?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${NODE_BACKEND_URL}/quotations/${quotationId}/convert-to-booking`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payment_method: 'cash',
            payment_status: 'pending'
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "✅ Success",
          description: "Quotation converted to booking successfully"
        });
        fetchBookings(true);
        fetchQuotations();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation",
        variant: "destructive"
      });
    }
  };

  // ===========================================
  // EDIT HANDLERS
  // ===========================================

  const handleEditStart = (booking: Booking) => {
    const fromDate = formatDateForInput(booking.rawFromDate || booking.fromDate);
    const toDate = formatDateForInput(booking.rawToDate || booking.toDate);
    setEditingBookingId(booking.bookingId);
    setEditAmountBaseline({
      fromDate,
      toDate,
      amount: booking.amount || 0,
      service: booking.service || 0,
      cgst: booking.cgst || 0,
      sgst: booking.sgst || 0,
      igst: booking.igst || 0,
    });
    setEditForm({
      amount: booking.amount,
      service: booking.service,
      gst: booking.gst,
      cgst: booking.cgst || 0,
      sgst: booking.sgst || 0,
      igst: booking.igst || 0,
      total: booking.total,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      fromDate,
      toDate,
      fromTime: formatTimeForInput(booking.rawFromTime) || formatTimeForInput(booking.fromTime) || '14:00',
      toTime: formatTimeForInput(booking.rawToTime) || formatTimeForInput(booking.toTime) || '12:00',
      status: booking.status
    });
  };

  const handleEditCancel = () => {
    setEditingBookingId(null);
    setEditForm({});
    setEditAmountBaseline(null);
  };

  const handleEditSave = async (bookingId: string, onSuccess?: () => void) => {
    const currentBooking = bookings.find(b => b.bookingId === bookingId);

    const fromDate = editForm.fromDate || formatDateForInput(currentBooking?.rawFromDate || currentBooking?.fromDate);
    const toDate = editForm.toDate || formatDateForInput(currentBooking?.rawToDate || currentBooking?.toDate);

    if (fromDate && toDate && !isCheckoutOnOrAfterCheckin(fromDate, toDate)) {
      toast({
        title: 'Invalid dates',
        description: 'Checkout date cannot be before check-in date.',
        variant: 'destructive',
      });
      return;
    }

    if (editForm.fromDate || editForm.toDate || editForm.roomNumber) {
      try {
        const checkResponse = await fetch(`${NODE_BACKEND_URL}/bookings/check-availability`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            room_id: editForm.roomNumber || currentBooking?.roomId,
            from_date: editForm.fromDate || currentBooking?.rawFromDate,
            to_date: editForm.toDate || currentBooking?.rawToDate,
            exclude_booking_id: bookingId
          })
        });

        const checkData = await checkResponse.json();
        console.log('📊 Availability check response:', checkData);

        if (!checkData.success || !checkData.data?.available) {
          toast({
            title: "Room Not Available",
            description: "This room is already booked for the selected dates",
            variant: "destructive"
          });
          return;
        }
        console.log('✅ Room is available - Proceeding with update');
      } catch (error) {
        console.error('❌ Availability check failed:', error);
      }
    }

    const success = await updateBooking(bookingId, editForm);
    if (success) {
      setEditingBookingId(null);
      setEditForm({});
      setEditAmountBaseline(null);
      onSuccess?.();
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };

      if ((field === 'fromDate' || field === 'toDate') && editAmountBaseline) {
        const newFrom =
          field === 'fromDate' ? String(value) : String(updated.fromDate ?? editAmountBaseline.fromDate);
        let newTo =
          field === 'toDate' ? String(value) : String(updated.toDate ?? editAmountBaseline.toDate);

        if (field === 'fromDate' && newTo && !isCheckoutOnOrAfterCheckin(newFrom, newTo)) {
          newTo = getMinCheckoutDate(newFrom);
          updated.toDate = newTo;
        }

        if (newFrom && newTo && isCheckoutOnOrAfterCheckin(newFrom, newTo)) {
          const recalculated = recalculateEditAmountsForDates(
            editAmountBaseline,
            newFrom,
            newTo
          );
          Object.assign(updated, recalculated);
        }
      }

      if (['amount', 'service', 'cgst', 'sgst', 'igst'].includes(field)) {
        const amount = parseAmount(field === 'amount' ? value : prev.amount);
        const service = parseAmount(field === 'service' ? value : prev.service);
        const cgst = parseAmount(field === 'cgst' ? value : prev.cgst);
        const sgst = parseAmount(field === 'sgst' ? value : prev.sgst);
        const igst = parseAmount(field === 'igst' ? value : prev.igst);

        const totalGst = (cgst || 0) + (sgst || 0) + (igst || 0);
        updated.gst = totalGst;
        updated.total = Math.round((amount + service + totalGst) * 100) / 100;
      }

      return updated;
    });
  };

  // ===========================================
  // DELETE FUNCTION BOOKING
  // ===========================================

  const deleteFunctionBooking = async (bookingId: number) => {
    if (!isUserAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete function bookings",
        variant: "destructive"
      });
      return false;
    }

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${NODE_BACKEND_URL}/function-rooms/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setFunctionBookings(prev => prev.filter(booking => booking.id !== bookingId));

        toast({
          title: "✅ Deleted Successfully",
          description: "Function booking has been deleted",
          duration: 3000
        });

        return true;
      } else {
        throw new Error(result.message || 'Failed to delete function booking');
      }
    } catch (error: any) {
      console.error('❌ Error deleting function booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete function booking",
        variant: "destructive",
        duration: 5000
      });
      return false;
    }
  };

  // ===========================================
  // CANCEL FUNCTION BOOKING - KEPT FOR REFERENCE BUT NOT USED IN UI
  // ===========================================

  // Note: This function is kept for reference but the cancel button is removed from UI
  // since cancellation is handled in the separate Cancellation & Refund Management page
  const cancelFunctionBooking = async (bookingId: number, reason: string = '') => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${NODE_BACKEND_URL}/function-rooms/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellation_reason: reason })
      });

      const result = await response.json();

      if (result.success) {
        setFunctionBookings(prev => prev.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        ));

        toast({
          title: "✅ Cancelled Successfully",
          description: "Function booking has been cancelled",
          duration: 3000
        });

        return true;
      } else {
        throw new Error(result.message || 'Failed to cancel function booking');
      }
    } catch (error: any) {
      console.error('❌ Error cancelling function booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel function booking",
        variant: "destructive",
        duration: 5000
      });
      return false;
    }
  };

  // ===========================================
  // HANDLE DELETE CONFIRMATION
  // ===========================================

  const handleDeleteFunctionBooking = (bookingId: number, eventName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY DELETE "${eventName}"?\n\nThis action CANNOT be undone. All associated data will be removed from the database.`
    );

    if (confirmDelete) {
      deleteFunctionBooking(bookingId);
    }
  };

  // ===========================================
  // FUNCTION BOOKING EDIT HANDLERS
  // ===========================================

  const handleFunctionEditStart = (booking: FunctionBooking) => {
    setEditingFunctionBookingId(booking.id);
    setFunctionEditForm({
      event_name: booking.event_name,
      event_type: booking.event_type,
      booking_date: booking.booking_date.split('T')[0],
      end_date: booking.end_date?.split('T')[0] || booking.booking_date.split('T')[0],
      start_time: booking.start_time,
      end_time: booking.end_time,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || '',
      total_amount: booking.total_amount,
      advance_paid: booking.advance_paid,
      guests_expected: booking.guests_expected,
      status: booking.status,
      payment_status: booking.payment_status,
      special_requests: booking.special_requests || '',
      catering_requirements: booking.catering_requirements || '',
      gst: booking.gst,
      discount: booking.discount,
      other_charges: booking.other_charges
    });
  };

  const handleFunctionEditCancel = () => {
    setEditingFunctionBookingId(null);
    setFunctionEditForm({});
  };

  const handleFunctionFieldChange = (field: string, value: any) => {
    setFunctionEditForm(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  // ===========================================
  // FILTERS
  // ===========================================

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon?: any; className?: string }> = {
      booked: { variant: 'default', label: 'Booked' },
      pending_checkout: {
        variant: 'outline',
        label: 'Pending Checkout',
        icon: AlertCircle,
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
      },
      blocked: {
        variant: 'destructive',
        label: 'Blocked',
        icon: Ban,
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
      },
      maintenance: {
        variant: 'outline',
        label: 'Maintenance',
        icon: Wrench,
        className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'
      },
      available: { variant: 'secondary', label: 'Available' },
      completed: { variant: 'secondary', label: 'Checkout' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status?.toLowerCase()] || { variant: 'outline', label: status || 'Unknown' };
    const IconComponent = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 ${config.className || ''}`}
      >
        {IconComponent && <IconComponent className="w-3 h-3" />}
        {config.label}
      </Badge>
    );
  };

  const getBookingStatusBadge = (booking: Booking) => {
    if (isPendingCheckoutBooking(booking)) {
      return getStatusBadge('pending_checkout');
    }
    return getStatusBadge(booking.status);
  };

  const getFunctionStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-800 border-green-200' },
      pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' },
      completed: { label: 'Completed', class: 'bg-blue-100 text-blue-800 border-blue-200' },
    };
    const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      completed: { label: 'Paid', class: 'bg-green-100 text-green-800 border-green-200' },
      partial: { label: 'Partial', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      pending: { label: 'Pending', class: 'bg-orange-100 text-orange-800 border-orange-200' },
      refunded: { label: 'Refunded', class: 'bg-purple-100 text-purple-800 border-purple-200' },
    };
    const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'booked', label: 'Booked' },
    { value: 'pending_checkout', label: 'Pending Checkout' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'completed', label: 'Checkout' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const pendingCheckoutCount = useMemo(
    () => bookings.filter((b) => isPendingCheckoutBooking(b)).length,
    [bookings]
  );

  const applyDateFilter = (bookings: Booking[]) => {
    if (!dateFilter.startDate && !dateFilter.endDate && selectedStatus === 'all') {
      return bookings;
    }

    return bookings.filter(booking => {
      let datePassed = true;
      if (dateFilter.startDate || dateFilter.endDate) {
        const bookingFromDate = new Date(booking.fromDate);
        const bookingToDate = new Date(booking.toDate);

        if (dateFilter.startDate && dateFilter.endDate) {
          datePassed = !(
            bookingToDate < dateFilter.startDate ||
            bookingFromDate > dateFilter.endDate
          );
        } else if (dateFilter.startDate) {
          datePassed = bookingFromDate >= dateFilter.startDate;
        } else if (dateFilter.endDate) {
          datePassed = bookingToDate <= dateFilter.endDate;
        }
      }

      let statusPassed = true;
      if (selectedStatus === 'pending_checkout') {
        statusPassed = isPendingCheckoutBooking(booking);
      } else if (selectedStatus === 'booked') {
        statusPassed =
          booking.status.toLowerCase() === 'booked' && !isPendingCheckoutBooking(booking);
      } else if (selectedStatus !== 'all') {
        statusPassed = booking.status.toLowerCase() === selectedStatus.toLowerCase();
      }

      return datePassed && statusPassed;
    });
  };

  const clearAllFilters = () => {
    setDateFilter({ startDate: undefined, endDate: undefined });
    setSelectedStatus('all');
    setSearchTerm('');
    toast({
      title: "Filters Cleared",
      description: "All filters have been cleared"
    });
  };

  // ===========================================
  // FILTERED DATA
  // ===========================================

  const filteredBookings = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let filtered = bookings.filter(
      (b) =>
        b.customerName?.toLowerCase().includes(term) ||
        (b.customerPhone || '').includes(term) ||
        (b.roomNumber || '').toString().includes(term)
    );

    filtered = applyDateFilter(filtered);

    return filtered;
  }, [bookings, searchTerm, dateFilter, selectedStatus]);

  useEffect(() => {
    if (!focusBookingId || filteredBookings.length === 0) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-booking-id="${focusBookingId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-orange-400', 'ring-inset');
        window.setTimeout(() => {
          el.classList.remove('ring-2', 'ring-orange-400', 'ring-inset');
        }, 3000);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [focusBookingId, filteredBookings.length]);

  useEffect(() => {
    if (!editBookingId || filteredBookings.length === 0) return;
    const booking = filteredBookings.find(
      (b) => b.bookingId === editBookingId || String(b.id) === editBookingId
    );
    if (!booking || !canEditBooking(booking.status)) return;
    const timer = window.setTimeout(() => handleEditStart(booking), 450);
    return () => window.clearTimeout(timer);
  }, [editBookingId, filteredBookings]);

  const filteredFunctionBookings = useMemo(() => {
    const term = functionSearchTerm.toLowerCase();
    return functionBookings.filter(b =>
      b.event_name?.toLowerCase().includes(term) ||
      b.customer_name?.toLowerCase().includes(term) ||
      b.booking_reference?.toLowerCase().includes(term) ||
      b.room_name?.toLowerCase().includes(term)
    );
  }, [functionBookings, functionSearchTerm]);

  const filteredQuotations = useMemo(() => {
    const term = quotationSearchTerm.toLowerCase();
    return quotations.filter(q =>
      (selectedQuotationStatus === 'all' || q.status === selectedQuotationStatus) &&
      (
        q.quotation_number?.toLowerCase().includes(term) ||
        q.customer_name?.toLowerCase().includes(term) ||
        q.customer_phone?.includes(term)
      )
    );
  }, [quotations, quotationSearchTerm, selectedQuotationStatus]);

  // ===========================================
  // USE EFFECTS
  // ===========================================

  useEffect(() => {
    fetchBookings();
    if (isProUser) {
      fetchQuotations();
      fetchFunctionBookings();
    }
  }, []);

  const handleRefresh = async () => {
    await fetchBookings(true);
    if (isProUser) {
      await fetchQuotations();
      await fetchFunctionBookings();
    }
  };

  // ===========================================
  // COLUMN DEFINITIONS
  // ===========================================

  // Bookings columns with tax fields and group indicator
  const bookingColumns: GridColDef<Booking>[] = [
    {
      field: 'bookingId',
      headerName: 'Booking ID',
      width: 120,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{params.value}</span>
          {params.row.groupBookingId && (
            <Badge
              className="ml-1 bg-blue-100 text-blue-800 border-blue-200 cursor-pointer text-[8px] px-1 py-0 hover:bg-blue-200"
              onClick={(e) => {
                e.stopPropagation();
                setShowGroupBookingsPanel(true);
                toggleGroupExpand(params.row.groupBookingId!);
              }}
              title="Show group bookings"
            >
              <Layers className="h-2 w-2 mr-0.5" />
              Group
            </Badge>
          )}
        </div>
      ),
    },
    {
      field: 'invoiceNumber',
      headerName: 'Invoice #',
      width: 150,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          {editingInvoiceId === params.row.bookingId ? (
            <div className="flex items-center gap-2">
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-32 h-8 text-xs"
                placeholder="INV-2024-0001"
              />
              <Button
                size="sm"
                variant="default"
                onClick={async () => {
                  const success = await updateInvoiceNumber(params.row.bookingId, invoiceNumber);
                  if (success) {
                    setEditingInvoiceId(null);
                    setInvoiceNumber('');
                  }
                }}
              >
                <Save className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingInvoiceId(null);
                  setInvoiceNumber('');
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{params.value || 'Not Set'}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingInvoiceId(params.row.bookingId);
                  setInvoiceNumber(params.value || '');
                }}
                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      ),
    },
    { field: 'roomNumber', headerName: 'Room', width: 100 },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 150,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            value={editForm.customerName ?? params.row.customerName}
            onChange={(e) => handleFieldChange('customerName', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          params.row.customerName
        )
      ),
    },
    {
      field: 'customerPhone',
      headerName: 'Phone',
      width: 130,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            value={editForm.customerPhone ?? params.row.customerPhone}
            onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          params.row.customerPhone
        )
      ),
    },
    {
      field: 'fromDate',
      headerName: 'Check-In',
      width: 140,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <div className="w-full">
            <div className="flex gap-2">
              <Input
                type="date"
                value={editForm.fromDate ?? formatDateForInput(params.row.rawFromDate || params.row.fromDate)}
                onChange={(e) => handleFieldChange('fromDate', e.target.value)}
                className="w-32 h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFromDateCalendarOpen(true)}
                className="h-8 px-2"
              >
                <CalendarIcon className="h-3 w-3" />
              </Button>
            </div>

            {fromDateCalendarOpen && (
              <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg">
                <Calendar
                  mode="single"
                  selected={editForm.fromDate ? new Date(editForm.fromDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      handleFieldChange('fromDate', formattedDate);
                    }
                    setFromDateCalendarOpen(false);
                  }}
                  initialFocus
                  className="p-2"
                />
              </div>
            )}
          </div>
        ) : (
          params.row.fromDate
        )
      ),
    },
    {
      field: 'toDate',
      headerName: 'Check-Out',
      width: 140,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <div className="w-full">
            <div className="flex gap-2">
              <Input
                type="date"
                value={editForm.toDate ?? formatDateForInput(params.row.rawToDate || params.row.toDate)}
                min={getMinCheckoutDate(
                  editForm.fromDate ?? formatDateForInput(params.row.rawFromDate || params.row.fromDate)
                ) || undefined}
                onChange={(e) => handleFieldChange('toDate', e.target.value)}
                className="w-32 h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setToDateCalendarOpen(true)}
                className="h-8 px-2"
              >
                <CalendarIcon className="h-3 w-3" />
              </Button>
            </div>

            {toDateCalendarOpen && (
              <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg">
                <Calendar
                  mode="single"
                  selected={editForm.toDate ? new Date(editForm.toDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      handleFieldChange('toDate', formattedDate);
                    }
                    setToDateCalendarOpen(false);
                  }}
                  initialFocus
                  className="p-2"
                />
              </div>
            )}
          </div>
        ) : (
          params.row.toDate
        )
      ),
    },
    {
      field: 'fromTime',
      headerName: 'From Time',
      width: 100,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="time"
            value={editForm.fromTime ?? params.row.fromTime}
            onChange={(e) => handleFieldChange('fromTime', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          params.row.fromTime ? formatTime(params.row.fromTime) : '—'
        )
      ),
    },
    {
      field: 'toTime',
      headerName: 'To Time',
      width: 100,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="time"
            value={editForm.toTime ?? params.row.toTime}
            onChange={(e) => handleFieldChange('toTime', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          params.row.toTime ? formatTime(params.row.toTime) : '—'
        )
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <div className="flex flex-col gap-1">
          {editingBookingId === params.row.bookingId ? (
            <select
              value={editForm.status ?? params.row.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full h-8 text-xs border rounded px-2"
            >
              <option value="booked">Booked</option>
              <option value="blocked">Blocked</option>
              <option value="maintenance">Maintenance</option>
              <option value="completed">Checkout</option>
              {/* <option value="cancelled">Cancelled</option> */}
            </select>
          ) : (
            <>
              {getBookingStatusBadge(params.row as Booking)}
              {params.row.status === 'cancelled' && getRefundBadge(params.row)}
            </>
          )}
        </div>
      ),
    },
    {
      field: 'amount',
      headerName: 'Room Amt',
      width: 100,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="number"
            value={editForm.amount ?? params.row.amount}
            onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
            className="w-20 h-8 text-xs"
          />
        ) : (
          `₹${parseAmount(params.row.amount).toLocaleString('en-IN')}`
        )
      ),
    },
    {
      field: 'service',
      headerName: 'Service',
      width: 90,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="number"
            value={editForm.service ?? params.row.service}
            onChange={(e) => handleFieldChange('service', Number(e.target.value))}
            className="w-20 h-8 text-xs"
          />
        ) : (
          `₹${parseAmount(params.row.service).toLocaleString('en-IN')}`
        )
      ),
    },
    {
      field: 'cgst',
      headerName: 'CGST',
      width: 90,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="number"
            value={editForm.cgst ?? params.row.cgst}
            onChange={(e) => handleFieldChange('cgst', Number(e.target.value))}
            className="w-20 h-8 text-xs"
          />
        ) : params.row.cgst > 0 ? (
          (() => {
            const taxBase = params.row.original_amount || params.row.amount;
            return (
              <div className="text-xs">
                <div>₹{parseAmount(params.row.cgst).toLocaleString('en-IN')}</div>
                {taxBase > 0 && (
                  <div className="text-[9px] text-blue-600">
                    ({((params.row.cgst / taxBase) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      field: 'sgst',
      headerName: 'SGST',
      width: 90,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="number"
            value={editForm.sgst ?? params.row.sgst}
            onChange={(e) => handleFieldChange('sgst', Number(e.target.value))}
            className="w-20 h-8 text-xs"
          />
        ) : params.row.sgst > 0 ? (
          (() => {
            const taxBase = params.row.original_amount || params.row.amount;
            return (
              <div className="text-xs">
                <div>₹{parseAmount(params.row.sgst).toLocaleString('en-IN')}</div>
                {taxBase > 0 && (
                  <div className="text-[9px] text-blue-600">
                    ({((params.row.sgst / taxBase) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      field: 'igst',
      headerName: 'IGST',
      width: 90,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="number"
            value={editForm.igst ?? params.row.igst}
            onChange={(e) => handleFieldChange('igst', Number(e.target.value))}
            className="w-20 h-8 text-xs"
          />
        ) : params.row.igst > 0 ? (
          (() => {
            const taxBase = params.row.original_amount || params.row.amount;
            return (
              <div className="text-xs">
                <div>₹{parseAmount(params.row.igst).toLocaleString('en-IN')}</div>
                {taxBase > 0 && (
                  <div className="text-[9px] text-purple-600">
                    ({((params.row.igst / taxBase) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      field: 'gst',
      headerName: 'Total GST',
      width: 100,
      renderCell: (params) => (
        editingBookingId === params.row.bookingId ? (
          <Input
            type="number"
            value={editForm.gst ?? params.row.gst}
            onChange={(e) => handleFieldChange('gst', Number(e.target.value))}
            className="w-20 h-8 text-xs"
          />
        ) : (
          <div className="font-semibold text-blue-600">
            ₹{parseAmount(params.row.cgst + params.row.sgst + params.row.igst).toLocaleString('en-IN')}
          </div>
        )
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 110,
      renderCell: (params) => (
        <div className="flex flex-col">
          {editingBookingId === params.row.bookingId ? (
            <span className="font-semibold">
              ₹{parseAmount(editForm.total ?? params.row.total).toLocaleString('en-IN')}
            </span>
          ) : (
            <>
              <span className="font-bold text-green-600">
                ₹{parseAmount(params.row.total).toLocaleString('en-IN')}
              </span>
              {(params.row.advance_amount_paid || 0) > 0 && (
                <>
                  <span className="text-xs text-green-700">
                    Adv: ₹{parseAmount(params.row.advance_amount_paid).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-orange-700 font-medium">
                    Due: ₹{(
                      params.row.remaining_amount != null && params.row.remaining_amount >= 0
                        ? parseAmount(params.row.remaining_amount)
                        : Math.max(0, parseAmount(params.row.total) - parseAmount(params.row.advance_amount_paid))
                    ).toLocaleString('en-IN')}
                  </span>
                </>
              )}
              {params.row.status === 'cancelled' && params.row.refund_amount && params.row.refund_amount > 0 && (
                <span className="text-xs text-blue-600">
                  Refund: ₹{params.row.refund_amount}
                </span>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      field: 'cancellation_reason',
      headerName: 'Cancel Reason',
      width: 180,
      renderCell: (params) => (
        params.row.status === 'cancelled' && params.row.cancellation_reason ? (
          <div className="text-xs text-red-600 truncate" title={params.row.cancellation_reason}>
            {params.row.cancellation_reason.length > 30
              ? `${params.row.cancellation_reason.substring(0, 30)}...`
              : params.row.cancellation_reason}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    { field: 'createdAt', headerName: 'Created At', width: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 500,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-1">
          {editingBookingId === params.row.bookingId ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleEditSave(params.row.bookingId)}
                className="h-7 px-2 min-w-[60px]"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditCancel}
                className="h-7 px-2 min-w-[40px]"
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <>
              {params.row.status === 'booked' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleCheckoutClick(params.row)}
                  title={isPendingCheckoutBooking(params.row) ? 'Complete overdue checkout' : 'Checkout customer'}
                  className={`h-7 px-2 min-w-[75px] text-white border-transparent ${
                    isPendingCheckoutBooking(params.row)
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {isPendingCheckoutBooking(params.row) ? 'Complete' : 'Checkout'}
                </Button>
              )}
              {params.row.status !== 'blocked' && params.row.status !== 'maintenance' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInvoiceView(params.row.bookingId)}
                  title="View invoice (read only on Basic plan)"
                  className="h-7 px-2 min-w-[80px]"
                  data-basic-plan-allow
                >
                  <FileText className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}

              {params.row.status === 'blocked' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadBlockPDF(params.row.bookingId)}
                  title="Download Block Room Report (PDF)"
                  className="h-7 px-2 min-w-[70px] bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800"
                >
                  <Ban className="w-3 h-3 mr-1" />
                  Block PDF
                </Button>
              )}

              {params.row.status === 'maintenance' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadMaintenancePDF(params.row.bookingId)}
                  title="Download Maintenance Report (PDF)"
                  className="h-7 px-2 min-w-[85px] bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:text-amber-800"
                >
                  <Wrench className="w-3 h-3 mr-1" />
                  Maint. PDF
                </Button>
              )}

              {params.row.groupBookingId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewGroupInvoice(params.row.groupBookingId!)}
                  title="View Group Invoice"
                  className="h-7 px-2 min-w-[70px] bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 hover:text-indigo-800"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Group
                </Button>
              )}

              {/* Edit button - disabled after checkout completed */}
              {params.row.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canEditBooking(params.row.status)}
                  onClick={() => {
                    if (canEditBooking(params.row.status)) handleEditStart(params.row);
                  }}
                  title={
                    canEditBooking(params.row.status)
                      ? 'Edit booking'
                      : 'Cannot edit after checkout is completed'
                  }
                  className="h-7 px-2 min-w-[40px]"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}

              {/* Delete button - Only show for non-cancelled bookings and admin */}
              {/* {isUserAdmin && isProUser && params.row.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteBooking(params.row.bookingId)}
                  title="Delete booking (Admin only)"
                  className="h-7 px-2 min-w-[40px] bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )} */}

              {isUserAdmin && isProUser && params.row.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClick(params.row)}
                  title="Permanently delete booking (Admin only)"
                  className="h-7 px-2 min-w-[40px] bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </>
          )},
          {/* NEW: Invoice Builder Button - Opens editable invoice */}
          <Button
            size="sm"
            variant="outline"
            disabled={isBasicDbUser}
            onClick={() => !isBasicDbUser && openInvoiceBuilder(params.row.bookingId)}
            title={isBasicDbUser ? 'Pro feature' : 'Open Invoice Builder - Edit & Customize'}
            className="h-7 px-2 min-w-[70px] bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-800 disabled:opacity-50"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit Invoice
          </Button>
        </div>
      ),
    }
  ];

  /** Compact list: name + room/phone/check-in, action, check-out */
  const compactBookingColumns: GridColDef<Booking>[] = [
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const overdue = isPendingCheckoutBooking(params.row);
        return (
        <div className="flex flex-col justify-center h-full leading-tight py-0.5">
          <span className="font-medium text-sm truncate">{params.row.customerName}</span>
          <span className="text-[11px] text-muted-foreground truncate">
            Rm {params.row.roomNumber}
            {params.row.groupBookingId && ' · Group'}
            {overdue && ' · Overdue'}
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            {params.row.customerPhone || '—'}
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            In: {params.row.fromDate}
          </span>
        </div>
        );
      },
    },
    {
      field: 'manage',
      headerName: 'Action',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const overdue = isPendingCheckoutBooking(params.row);
        return (
        <Button
          size="sm"
          onClick={() => handleCheckoutClick(params.row)}
          className={
            params.row.status === 'booked'
              ? overdue
                ? 'h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white'
                : 'h-8 text-xs bg-green-600 hover:bg-green-700 text-white'
              : 'h-8 text-xs'
          }
          variant={params.row.status === 'booked' ? 'default' : 'outline'}
        >
          {params.row.status === 'booked' ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              {overdue ? 'Complete Checkout' : 'Checkout'}
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Actions
            </>
          )}
        </Button>
        );
      },
    },
    {
      field: 'toDate',
      headerName: 'Check-out',
      width: 115,
      renderCell: (params) => (
        <span className="text-sm whitespace-nowrap">{params.row.toDate}</span>
      ),
    },
  ];

  // Function Bookings columns
  const functionBookingColumns: GridColDef<FunctionBooking>[] = [
    {
      field: 'booking_reference',
      headerName: 'Ref #',
      width: 130,
      renderCell: (params) => (
        <div className="font-mono font-medium text-xs">
          {params.value}
        </div>
      ),
    },
    {
      field: 'event_name',
      headerName: 'Event Name',
      width: 180,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <Input
            value={functionEditForm.event_name ?? params.row.event_name}
            onChange={(e) => handleFunctionFieldChange('event_name', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          <div>
            <div className="font-medium">{params.value}</div>
            <div className="text-xs text-gray-500">{params.row.event_type}</div>
          </div>
        )
      ),
    },
    {
      field: 'room_name',
      headerName: 'Function Room',
      width: 150,
      renderCell: (params) => (
        <div>
          <div>{params.row.room_name}</div>
          <div className="text-xs text-gray-500">Room {params.row.room_number}</div>
        </div>
      ),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 150,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <Input
            value={functionEditForm.customer_name ?? params.row.customer_name}
            onChange={(e) => handleFunctionFieldChange('customer_name', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          params.value
        )
      ),
    },
    {
      field: 'customer_phone',
      headerName: 'Phone',
      width: 120,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <Input
            value={functionEditForm.customer_phone ?? params.row.customer_phone}
            onChange={(e) => handleFunctionFieldChange('customer_phone', e.target.value)}
            className="w-full h-8 text-xs"
          />
        ) : (
          params.value
        )
      ),
    },
    {
      field: 'booking_date',
      headerName: 'Event Date',
      width: 150,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <div>
            <Input
              type="date"
              value={functionEditForm.booking_date ?? params.row.booking_date}
              onChange={(e) => handleFunctionFieldChange('booking_date', e.target.value)}
              className="w-full h-8 text-xs mb-1"
            />
            <div className="flex gap-1">
              <Input
                type="time"
                value={functionEditForm.start_time ?? params.row.start_time}
                onChange={(e) => handleFunctionFieldChange('start_time', e.target.value)}
                className="w-16 h-7 text-xs"
              />
              <span className="text-xs">-</span>
              <Input
                type="time"
                value={functionEditForm.end_time ?? params.row.end_time}
                onChange={(e) => handleFunctionFieldChange('end_time', e.target.value)}
                className="w-16 h-7 text-xs"
              />
            </div>
          </div>
        ) : (
          <div>
            <div>{params.value}</div>
            <div className="text-xs text-gray-500">
              {params.row.start_time} - {params.row.end_time}
            </div>
          </div>
        )
      ),
    },
    {
      field: 'guests_expected',
      headerName: 'Guests',
      width: 80,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <Input
            type="number"
            value={functionEditForm.guests_expected ?? params.row.guests_expected}
            onChange={(e) => handleFunctionFieldChange('guests_expected', parseInt(e.target.value))}
            className="w-16 h-8 text-xs"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-500" />
            {params.value || 'N/A'}
          </div>
        )
      ),
    },
    {
      field: 'total_amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <div className="space-y-1">
            <Input
              type="number"
              value={functionEditForm.total_amount ?? params.row.total_amount}
              onChange={(e) => handleFunctionFieldChange('total_amount', parseFloat(e.target.value))}
              className="w-20 h-7 text-xs"
              placeholder="Total"
            />
            <Input
              type="number"
              value={functionEditForm.advance_paid ?? params.row.advance_paid}
              onChange={(e) => handleFunctionFieldChange('advance_paid', parseFloat(e.target.value))}
              className="w-20 h-7 text-xs"
              placeholder="Advance"
            />
          </div>
        ) : (
          <div>
            <div className="font-medium">{formatCurrency(params.value)}</div>
            {params.row.advance_paid > 0 && (
              <div className="text-xs text-green-600">
                Paid: {formatCurrency(params.row.advance_paid)}
              </div>
            )}
          </div>
        )
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        editingFunctionBookingId === params.row.id ? (
          <select
            value={functionEditForm.status ?? params.row.status}
            onChange={(e) => handleFunctionFieldChange('status', e.target.value)}
            className="w-full h-8 text-xs border rounded px-2"
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        ) : (
          getFunctionStatusBadge(params.value)
        )
      ),
    },
    // {
    //   field: 'payment_status',
    //   headerName: 'Payment',
    //   width: 110,
    //   renderCell: (params) => (
    //     editingFunctionBookingId === params.row.id ? (
    //       <select
    //         value={functionEditForm.payment_status ?? params.row.payment_status}
    //         onChange={(e) => handleFunctionFieldChange('payment_status', e.target.value)}
    //         className="w-full h-8 text-xs border rounded px-2"
    //       >
    //         <option value="pending">Pending</option>
    //         <option value="partial">Partial</option>
    //         <option value="completed">Completed</option>
    //         <option value="refunded">Refunded</option>
    //       </select>
    //     ) : (
    //       getPaymentStatusBadge(params.value)
    //     )
    //   ),
    // },
    {
      field: 'has_room_bookings',
      headerName: 'Accommodation',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Home className="w-3 h-3 mr-1" />
            {params.row.total_rooms_booked} Room(s)
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 500,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-2">
          {editingFunctionBookingId === params.row.id ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleFunctionEditSave(params.row.id)}
                className="h-7 px-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFunctionEditCancel}
                className="h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* Edit button - Only show for non-cancelled bookings */}
              {params.row.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFunctionEditStart(params.row)}
                  title="Edit booking"
                  className="h-7 px-2"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => showFunctionInvoiceModalWithData(params.row.id)}
                title="View Invoice Data"
                className="h-7 px-2"
              >
                <FileText className="h-3 w-3 mr-1" />
                View
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadFunctionInvoiceHTML(params.row.id, params.row.booking_reference)}
                title="Download HTML Invoice"
                className="h-7 px-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => viewFunctionBookingDetails(params.row)}
                title="View Details"
                className="h-7 px-2"
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>

              {/* Cancel button - REMOVED - Use separate Cancellation & Refund Management page */}

              {/* Delete button - Only show for non-cancelled bookings and admin */}
              {/* {isUserAdmin && params.row.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteFunctionBooking(params.row.id, params.row.event_name)}
                  title="Permanently delete booking (Admin only)"
                  className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )} */}
            </>
          )}
        </div>
      ),
    },
  ];

  // Quotations columns
  const quotationColumns: GridColDef<Quotation>[] = [
    {
      field: 'quotation_number',
      headerName: 'Quotation #',
      width: 150,
      renderCell: (params) => (
        <div className="font-mono font-medium">
          {params.value}
        </div>
      ),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 150,
    },
    {
      field: 'customer_phone',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'room_number',
      headerName: 'Room',
      width: 100,
    },
    {
      field: 'dates',
      headerName: 'Dates',
      width: 180,
      renderCell: (params) => {
        const formatQuotationDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            });
          } catch {
            return dateStr;
          }
        };

        return (
          <div className="text-sm">
            {formatQuotationDate(params.row.from_date)} - {formatQuotationDate(params.row.to_date)}
            <div className="text-xs text-gray-500">{params.row.nights} night(s)</div>
          </div>
        );
      },
    },
    {
      field: 'total_amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <div className="font-medium">
          ₹{parseFloat(params.value.toString()).toLocaleString('en-IN')}
        </div>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const getQuotationStatusBadge = (status: string) => {
          const config: Record<string, { label: string; class: string }> = {
            pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            accepted: { label: 'Accepted', class: 'bg-green-100 text-green-800 border-green-200' },
            rejected: { label: 'Rejected', class: 'bg-red-100 text-red-800 border-red-200' },
            expired: { label: 'Expired', class: 'bg-gray-100 text-gray-800 border-gray-200' },
            converted: { label: 'Converted', class: 'bg-blue-100 text-blue-800 border-blue-200' },
          };
          const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
          return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
        };
        return getQuotationStatusBadge(params.value);
      },
    },
    {
      field: 'expiry_date',
      headerName: 'Valid Until',
      width: 130,
      renderCell: (params) => {
        const formatQuotationDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            });
          } catch {
            return dateStr;
          }
        };

        const isExpired = new Date(params.value) < new Date();

        return (
          <div className="text-sm">
            {formatQuotationDate(params.value)}
            <div className={`text-xs ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
              {isExpired ? 'Expired' : 'Valid'}
            </div>
          </div>
        );
      },
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 130,
      renderCell: (params) => {
        try {
          return new Date(params.value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          });
        } catch {
          return params.value;
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadQuotation(params.row.id)}
            title="Download Quotation"
            className="h-7 px-2"
          >
            <Download className="h-3 w-3 mr-1" />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadQuotation(params.row.id, true)}
            title="Print Quotation"
            className="h-7 px-2"
          >
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
        </div>
      ),
    },
  ];

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <Layout>
      <div className="page-shell md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Bookings Management</h1>
              {isUserAdmin && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {isUserAdmin
                ? 'Administrator view with full access'
                : isProUser
                  ? 'Pro plan with function room bookings'
                  : 'Free plan with basic bookings'}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || loadingFunctionBookings}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            {isProUser && (
              <Button
                variant="default"
                onClick={() => setShowPreviousBookingForm(true)}
                className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Add Previous Booking
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b relative">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 rounded-full flex-shrink-0"
              onClick={() => {
                const container = document.getElementById('tabs-container');
                if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <nav
              id="tabs-container"
              className="flex space-x-4 overflow-x-auto pb-2 px-2 scroll-smooth scrollbar-hide flex-1"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-md flex-shrink-0 ${activeTab === 'bookings'
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Room Bookings ({bookings.length})
                  {groupedBookings.size > 0 && (
                    <Badge className="ml-1 bg-blue-500 text-white text-[10px] px-1 py-0">
                      {groupedBookings.size} groups
                    </Badge>
                  )}
                </span>
              </button>

              {isProUser && (
                <button
                  onClick={() => setActiveTab('function-bookings')}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-md flex-shrink-0 ${activeTab === 'function-bookings'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Function Bookings ({functionBookings.length})
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('quotations')}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-md flex-shrink-0 ${activeTab === 'quotations'
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quotations ({quotations.length})
                </span>
              </button>
            </nav>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 rounded-full flex-shrink-0"
              onClick={() => {
                const container = document.getElementById('tabs-container');
                if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* =========================================== */}
        {/* ROOM BOOKINGS TAB */}
        {/* =========================================== */}
        {activeTab === 'bookings' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex items-center gap-3 w-full md:max-w-xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by customer, phone, or room..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                    
                    <div className="flex items-center border rounded-md p-1 bg-muted/20">
                      <Button
                        size="sm"
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('list')}
                        className="h-8 w-8 p-0"
                        title="List View"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'card' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('card')}
                        className="h-8 w-8 p-0"
                        title="Card View"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {filteredBookings.length} of {bookings.length} bookings
                    {groupedBookings.size > 0 && ` • ${groupedBookings.size} groups`}
                  </div>
                </div>

                {/* =========================================== */}
                {/* GROUP BOOKINGS SUMMARY */}
                {/* =========================================== */}
                {/* {groupedBookings.size > 0 && (
                  <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-600 text-white px-3 py-1">
                        <Layers className="h-3 w-3 mr-1" />
                        Group Bookings
                      </Badge>
                      <span className="text-sm text-blue-700">
                        {Array.from(groupedBookings.values()).reduce((sum, rooms) => sum + rooms.length, 0)} rooms in {groupedBookings.size} groups
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from(groupedBookings.entries()).map(([groupId, rooms]) => {
                        const totalAmount = rooms.reduce((sum, r) => sum + r.total, 0);
                        const customerName = rooms[0]?.customerName || 'Unknown';
                        const roomNumbers = rooms.map(r => r.roomNumber).join(', ');

                        return (
                          <div
                            key={groupId}
                            className="bg-white rounded-lg border border-blue-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => viewGroupInvoice(groupId)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                Group #{groupId.slice(-6)}
                              </Badge>
                              <span className="text-xs text-gray-500">{rooms.length} rooms</span>
                            </div>

                            <p className="text-sm font-medium truncate">{customerName}</p>
                            <p className="text-xs text-gray-500 mb-2">Rooms: {roomNumbers}</p>

                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-green-600">
                                ₹{totalAmount.toLocaleString('en-IN')}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewGroupInvoice(groupId);
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="View Group Invoice"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadGroupInvoice(groupId);
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Download Group Invoice"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )} */}

                {/* Group Bookings — collapsible panel */}
                {groupedBookings.size > 0 && (
                  <div className="mt-2 border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100/80 hover:to-indigo-100/80 transition-colors text-left"
                      onClick={() => setShowGroupBookingsPanel((open) => !open)}
                    >
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Layers className="h-4 w-4 text-blue-700 shrink-0" />
                        <span className="font-semibold text-blue-900">Group Bookings</span>
                        <Badge className="bg-blue-600 text-white text-xs">
                          {groupedBookings.size} {groupedBookings.size === 1 ? 'group' : 'groups'}
                        </Badge>
                        <span className="text-sm text-blue-700">
                          {Array.from(groupedBookings.values()).reduce((sum, rooms) => sum + rooms.length, 0)} rooms total
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 shrink-0 hidden sm:inline">
                        {showGroupBookingsPanel ? 'Click to hide' : 'Click to show'}
                      </span>
                      {showGroupBookingsPanel ? (
                        <ChevronUp className="h-5 w-5 text-blue-700 shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-700 shrink-0" />
                      )}
                    </button>

                    {showGroupBookingsPanel && (
                      <div className="p-3 space-y-2 border-t border-blue-100 bg-slate-50/50 max-h-[420px] overflow-y-auto">
                        {Array.from(groupedBookings.entries()).map(([groupId, rooms]) => {
                          const isExpanded = expandedGroupIds.has(groupId);
                          const totalAmount = rooms.reduce((sum, r) => sum + r.total, 0);
                          const totalAdvance = rooms.reduce((sum, r) => sum + (r.advance_amount_paid || 0), 0);
                          const balanceDue = Math.max(0, totalAmount - totalAdvance);
                          const customerName = rooms[0]?.customerName || 'Unknown';

                          return (
                            <div key={groupId} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between gap-2 p-3 hover:bg-blue-50/50 transition-colors text-left"
                                onClick={() => toggleGroupExpand(groupId)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                      Group #{groupId.slice(-6)}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{rooms.length} rooms</span>
                                  </div>
                                  <p className="text-sm font-medium truncate mt-1">{customerName}</p>
                                  <p className="text-xs text-green-700 font-semibold mt-0.5">
                                    Total ₹{totalAmount.toLocaleString('en-IN')}
                                    {totalAdvance > 0 && (
                                      <span className="text-blue-600 font-normal ml-2">
                                        · Adv ₹{totalAdvance.toLocaleString('en-IN')} · Due ₹{balanceDue.toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-blue-600 shrink-0" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-blue-600 shrink-0" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="border-t border-blue-100 px-3 pb-3 pt-2 space-y-2">
                                  {rooms.map((room) => {
                                    const roomAdvance = room.advance_amount_paid || 0;
                                    const roomDue = room.remaining_amount != null && room.remaining_amount >= 0
                                      ? room.remaining_amount
                                      : Math.max(0, room.total - roomAdvance);
                                    return (
                                      <div
                                        key={room.bookingId}
                                        className="flex flex-wrap items-center justify-between gap-2 text-xs p-2 rounded-md bg-blue-50/40 border border-blue-100"
                                      >
                                        <div>
                                          <span className="font-medium">Room {room.roomNumber}</span>
                                          <span className="text-muted-foreground mx-1">·</span>
                                          <span>#{room.bookingId}</span>
                                          <div className="text-muted-foreground mt-0.5">
                                            {room.fromDate} → {room.toDate}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-semibold text-green-700">₹{room.total.toLocaleString('en-IN')}</div>
                                          {roomAdvance > 0 && (
                                            <div className="text-blue-600">Adv ₹{roomAdvance.toLocaleString('en-IN')} · Due ₹{roomDue.toLocaleString('en-IN')}</div>
                                          )}
                                          {getStatusBadge(room.status)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => viewGroupInvoice(groupId)}
                                      className="h-7 text-xs"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Invoice
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openGroupInvoiceBuilder(groupId)}
                                      className="h-7 text-xs bg-purple-50 border-purple-200 text-purple-700"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit Invoice
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCalendarFilter(!showCalendarFilter)}
                      className="flex items-center gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Date Filter
                      {showCalendarFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    <div className="w-full md:w-48">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full h-10 px-3 text-sm border rounded-md bg-background"
                      >
                        {statusOptions.map(option => (
                          <option key={`status-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(dateFilter.startDate || dateFilter.endDate || selectedStatus !== 'all') && (
                      <Button
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {(selectedStatus === 'all' || selectedStatus === 'pending_checkout') && pendingCheckoutCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStatus('pending_checkout');
                        toast({
                          title: 'Filter Applied',
                          description: 'Showing overdue checkouts — complete checkout to free the room.',
                          duration: 3000,
                        });
                      }}
                      className={`flex items-center gap-1 h-8 px-3 text-xs ${selectedStatus === 'pending_checkout' ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      Pending Checkout ({pendingCheckoutCount})
                    </Button>
                  )}

                  {(selectedStatus === 'all' || selectedStatus === 'blocked') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStatus('blocked');
                        toast({
                          title: "Filter Applied",
                          description: "Showing blocked rooms only. Click 'Generate Report' for PDF.",
                          duration: 3000
                        });
                      }}
                      className={`flex items-center gap-1 h-8 px-3 text-xs ${selectedStatus === 'blocked' ? 'bg-red-50 border-red-200 text-red-700' : ''}`}
                    >
                      <Ban className="w-3 h-3" />
                      Blocked Rooms ({bookings.filter(b => b.status === 'blocked').length})
                    </Button>
                  )}

                  {(selectedStatus === 'all' || selectedStatus === 'maintenance') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStatus('maintenance');
                        toast({
                          title: "Filter Applied",
                          description: "Showing maintenance rooms only. Click 'Generate Report' for PDF.",
                          duration: 3000
                        });
                      }}
                      className={`flex items-center gap-1 h-8 px-3 text-xs ${selectedStatus === 'maintenance' ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}`}
                    >
                      <Wrench className="w-3 h-3" />
                      Maintenance ({bookings.filter(b => b.status === 'maintenance').length})
                    </Button>
                  )}

                  {(selectedStatus === 'blocked' || selectedStatus === 'maintenance') && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        const filtered = bookings.filter(b => b.status === selectedStatus);
                        if (filtered.length > 0) {
                          const type = selectedStatus === 'blocked' ? 'Block' : 'Maintenance';
                          downloadCombinedReport();
                          toast({
                            title: "Report Generation Started",
                            description: `${type} rooms report is being generated...`,
                            duration: 2000
                          });
                        } else {
                          toast({
                            title: "No Data",
                            description: `No ${selectedStatus} rooms found for report generation`,
                            variant: "destructive"
                          });
                        }
                      }}
                      className="flex items-center gap-1 h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                      disabled={reportLoading}
                    >
                      <FileText className="w-3 h-3" />
                      {reportLoading ? 'Generating...' : `Generate ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Report`}
                    </Button>
                  )}
                </div>

                {showCalendarFilter && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateFilter.startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFilter.startDate ? (
                                format(dateFilter.startDate, "PPP")
                              ) : (
                                <span>Pick a start date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateFilter.startDate}
                              onSelect={(date) => setDateFilter(prev => ({ ...prev, startDate: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateFilter.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFilter.endDate ? (
                                format(dateFilter.endDate, "PPP")
                              ) : (
                                <span>Pick an end date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateFilter.endDate}
                              onSelect={(date) => setDateFilter(prev => ({ ...prev, endDate: date }))}
                              disabled={(date) => dateFilter.startDate ? date < dateFilter.startDate : false}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {(dateFilter.startDate || dateFilter.endDate) && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Active Filters:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {dateFilter.startDate && (
                                <Badge variant="outline" className="gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  From: {format(dateFilter.startDate, "MMM dd, yyyy")}
                                </Badge>
                              )}
                              {dateFilter.endDate && (
                                <Badge variant="outline" className="gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  To: {format(dateFilter.endDate, "MMM dd, yyyy")}
                                </Badge>
                              )}
                              {selectedStatus !== 'all' && (
                                <Badge variant="outline">
                                  Status: {statusOptions.find(s => s.value === selectedStatus)?.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </CardHeader>

            <CardContent className={`relative px-0 md:px-6 min-h-[400px] w-full ${viewMode === 'card' ? 'flex items-center justify-center' : ''}`}>
              {(loading || refreshing) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground font-medium text-base">
                    {loading ? 'Loading bookings data...' : 'Refreshing bookings...'}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {!loading && !refreshing && (
                  <motion.div
                    key="data-grid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full"
                    style={{ height: isMobile ? 400 : 600 }}
                  >
                    {filteredBookings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <CalendarIcon className="w-12 h-12 mb-4" />
                        <p className="text-lg mb-2">No bookings found</p>
                        <p className="text-sm mb-4 text-center">
                          {searchTerm || dateFilter.startDate || dateFilter.endDate || selectedStatus !== 'all'
                            ? 'Try adjusting your search terms or filters'
                            : 'No bookings available in the system'}
                        </p>
                        {(dateFilter.startDate || dateFilter.endDate || selectedStatus !== 'all') && (
                          <Button onClick={clearAllFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    ) : viewMode === 'list' ? (
                      <div
                        className="w-full overflow-auto rounded-md border bg-background"
                        style={{ maxHeight: isMobile ? 420 : 560 }}
                      >
                        <table className="w-full min-w-[420px] border-collapse text-sm">
                          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                            <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <th className="p-2 w-[38%] min-w-[140px]">Customer</th>
                              <th className="p-2 w-[20%] min-w-[96px] text-left">Action</th>
                              <th className="p-2 w-[18%]">Check-out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBookings.map((booking) => {
                              const overdue = isPendingCheckoutBooking(booking);
                              return (
                              <tr
                                key={`${booking.source}-${booking.bookingId}`}
                                data-booking-id={booking.bookingId}
                                className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${overdue ? 'bg-orange-50/60' : ''}`}
                              >
                                <td className="p-2 align-middle min-w-[140px]">
                                  <div
                                    className="font-medium text-foreground text-sm leading-tight truncate"
                                    title={booking.customerName}
                                  >
                                    {booking.customerName}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                                    <div className="truncate">
                                      Rm {booking.roomNumber}
                                      {booking.groupBookingId ? ' · Grp' : ''}
                                      {overdue ? ' · Overdue' : ''}
                                    </div>
                                    <div className="truncate">
                                      {booking.customerPhone || '—'}
                                    </div>
                                    <div className="truncate">
                                      In: {booking.fromDate}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2 align-middle">
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckoutClick(booking)}
                                    className={
                                      booking.status === 'booked'
                                        ? overdue
                                          ? 'h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white shrink-0'
                                          : 'h-8 text-xs bg-green-600 hover:bg-green-700 text-white shrink-0'
                                        : 'h-8 text-xs shrink-0'
                                    }
                                    variant={booking.status === 'booked' ? 'default' : 'outline'}
                                  >
                                    {booking.status === 'booked' ? (
                                      <>
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                        {overdue ? 'Complete Checkout' : 'Checkout'}
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        Actions
                                      </>
                                    )}
                                  </Button>
                                </td>
                                <td className="p-2 align-middle whitespace-nowrap text-xs">
                                  {booking.toDate}
                                  {booking.toTime ? ` ${booking.toTime}` : ''}
                                </td>
                              </tr>
                            );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full overflow-y-auto pb-4 p-1">
                        {filteredBookings.map((booking) => {
                          const nights = calculateNights(booking.fromDate, booking.toDate) || 1;
                          const roomAmt = parseAmount(booking.amount);
                          const serviceAmt = parseAmount(booking.service);
                          const cgstAmt = parseAmount(booking.cgst);
                          const sgstAmt = parseAmount(booking.sgst);
                          const igstAmt = parseAmount(booking.igst);
                          const totalAmt = parseAmount(booking.total);
                          const advancePaid = parseAmount(booking.advance_amount_paid || 0);
                          const balanceDue = booking.remaining_amount != null && booking.remaining_amount >= 0
                            ? parseAmount(booking.remaining_amount)
                            : Math.max(0, totalAmt - advancePaid);

                          return (
                            <Card key={`${booking.source}-${booking.bookingId}`} className="shadow hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary flex flex-col justify-between">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-[10px] text-muted-foreground font-mono">#{booking.bookingId}</div>
                                    <h3 className="font-bold text-lg text-primary flex items-center gap-1.5 mt-0.5">
                                      <Home className="h-4.5 w-4.5" />
                                      Room {booking.roomNumber}
                                    </h3>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {getBookingStatusBadge(booking)}
                                    {advancePaid > 0 && (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] py-0">
                                        <IndianRupee className="h-3 w-3 mr-0.5" />
                                        Adv ₹{advancePaid.toLocaleString('en-IN')}
                                      </Badge>
                                    )}
                                    {booking.status === 'cancelled' && getRefundBadge && getRefundBadge(booking)}
                                    {booking.groupBookingId && (
                                      <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0 cursor-pointer hover:bg-blue-100"
                                        onClick={() => {
                                          setShowGroupBookingsPanel(true);
                                          toggleGroupExpand(booking.groupBookingId!);
                                        }}
                                        title="Show group in panel"
                                      >
                                        <Layers className="h-3 w-3 mr-0.5" /> Group
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="space-y-3 pb-3 text-sm flex-grow">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4 shrink-0 text-gray-500" />
                                    <span className="font-medium text-foreground">{booking.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4 shrink-0 text-gray-500" />
                                    <span>{booking.customerPhone}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md text-xs">
                                    <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <div>
                                      <div className="font-medium">{booking.fromDate}</div>
                                      <div className="text-[10px] text-muted-foreground">to {booking.toDate} ({nights} {nights === 1 ? 'night' : 'nights'})</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t pt-2 space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Room Price:</span>
                                    <span>₹{roomAmt.toLocaleString('en-IN')}</span>
                                  </div>
                                  {serviceAmt > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Services:</span>
                                      <span>₹{serviceAmt.toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                  {(cgstAmt > 0 || sgstAmt > 0 || igstAmt > 0) && (
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                      <span>Taxes (GST):</span>
                                      <span>₹{(cgstAmt + sgstAmt + igstAmt).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1 text-green-600">
                                    <span>Total:</span>
                                    <span>₹{totalAmt.toLocaleString('en-IN')}</span>
                                  </div>
                                  {advancePaid > 0 && (
                                    <>
                                      <div className="flex justify-between text-green-700 font-medium">
                                        <span>Advance Paid:</span>
                                        <span>- ₹{advancePaid.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between font-semibold text-orange-700 bg-orange-50/80 -mx-1 px-1 py-0.5 rounded">
                                        <span>Balance Due:</span>
                                        <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {booking.groupBookingId && groupedBookings.has(booking.groupBookingId) && (
                                  <div className="border-t pt-2">
                                    <button
                                      type="button"
                                      className="w-full flex items-center justify-between gap-2 text-xs text-blue-800 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-md px-2 py-1.5 transition-colors"
                                      onClick={() => toggleGroupExpand(booking.groupBookingId!)}
                                    >
                                      <span className="flex items-center gap-1 font-medium">
                                        <Layers className="h-3.5 w-3.5" />
                                        {expandedGroupIds.has(booking.groupBookingId)
                                          ? 'Hide group rooms'
                                          : `Show group (${groupedBookings.get(booking.groupBookingId)!.length} rooms)`}
                                      </span>
                                      {expandedGroupIds.has(booking.groupBookingId) ? (
                                        <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                                      ) : (
                                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                      )}
                                    </button>
                                    {expandedGroupIds.has(booking.groupBookingId) && (
                                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                                        {groupedBookings.get(booking.groupBookingId)!.map((gr) => (
                                          <div
                                            key={gr.bookingId}
                                            className={`text-[11px] p-2 rounded border ${gr.bookingId === booking.bookingId ? 'bg-blue-100 border-blue-300' : 'bg-white border-blue-100'}`}
                                          >
                                            <div className="flex justify-between gap-2">
                                              <span className="font-medium">
                                                Room {gr.roomNumber}
                                                {gr.bookingId === booking.bookingId && (
                                                  <span className="text-blue-600 ml-1">(this)</span>
                                                )}
                                              </span>
                                              <span className="text-green-700 font-semibold">₹{gr.total.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="text-muted-foreground mt-0.5">
                                              {gr.fromDate} – {gr.toDate}
                                            </div>
                                          </div>
                                        ))}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="w-full h-7 text-xs text-blue-700"
                                          onClick={() => viewGroupInvoice(booking.groupBookingId!)}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          View group invoice
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>

                              <div className="border-t p-3 bg-muted/10 flex flex-wrap gap-1.5 justify-end">
                                {booking.status === 'booked' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckoutClick(booking)}
                                    className={`h-8 text-xs text-white font-medium flex items-center gap-1 ${
                                      isPendingCheckoutBooking(booking)
                                        ? 'bg-orange-600 hover:bg-orange-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    {isPendingCheckoutBooking(booking) ? 'Complete Checkout' : 'Checkout'}
                                  </Button>
                                )}

                                {booking.status !== 'blocked' && booking.status !== 'maintenance' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openInvoiceView(booking.bookingId)}
                                    className="h-8 text-xs"
                                    data-basic-plan-allow
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                    View Invoice
                                  </Button>
                                )}

                                {booking.status !== 'cancelled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!canEditBooking(booking.status)}
                                    onClick={() => {
                                      if (canEditBooking(booking.status)) handleEditStart(booking);
                                    }}
                                    className="h-8 text-xs"
                                    title={
                                      canEditBooking(booking.status)
                                        ? 'Edit Booking'
                                        : 'Cannot edit after checkout is completed'
                                    }
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {isUserAdmin && isProUser && booking.status !== 'cancelled' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteClick(booking)}
                                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                                    title="Delete Booking"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBasicDbUser}
                                  onClick={() => !isBasicDbUser && openInvoiceBuilder(booking.bookingId)}
                                  className="h-8 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-800 disabled:opacity-50"
                                  title={isBasicDbUser ? 'Pro feature' : 'Customize invoice'}
                                >
                                  Customize
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}

        {/* =========================================== */}
        {/* FUNCTION BOOKINGS TAB */}
        {/* =========================================== */}
        {activeTab === 'function-bookings' && isProUser && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by event, customer, or reference..."
                      value={functionSearchTerm}
                      onChange={(e) => setFunctionSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredFunctionBookings.length} of {functionBookings.length} function bookings
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative px-0 md:px-6 min-h-[400px] flex items-center justify-center">
              {loadingFunctionBookings && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground font-medium text-base">
                    Loading function bookings...
                  </p>
                </div>
              )}

              <AnimatePresence>
                {!loadingFunctionBookings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full"
                    style={{ height: isMobile ? 400 : 600 }}
                  >
                    {functionBookings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Building2 className="w-12 h-12 mb-4" />
                        <p className="text-lg mb-2">No function bookings found</p>
                        <p className="text-sm mb-4 text-center">
                          {functionSearchTerm
                            ? 'Try adjusting your search terms'
                            : 'No event or function bookings available'}
                        </p>
                      </div>
                    ) : (
                      <DataGrid
                        rows={filteredFunctionBookings}
                        columns={functionBookingColumns}
                        getRowId={(row) => `func-${row.id}-${row.booking_reference}`}
                        initialState={{
                          pagination: {
                            paginationModel: { page: 0, pageSize: isMobile ? 5 : 10 },
                          },
                        }}
                        pageSizeOptions={isMobile ? [5, 10] : [5, 10, 25]}
                        disableRowSelectionOnClick
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}

        {/* =========================================== */}
        {/* QUOTATIONS TAB */}
        {/* =========================================== */}
        {activeTab === 'quotations' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search quotations by number, customer, or phone..."
                      value={quotationSearchTerm}
                      onChange={(e) => setQuotationSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-full md:w-40">
                      <select
                        value={selectedQuotationStatus}
                        onChange={(e) => setSelectedQuotationStatus(e.target.value)}
                        className="w-full h-10 px-3 text-sm border rounded-md bg-background"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                        <option value="converted">Converted</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {filteredQuotations.length} of {quotations.length} quotations
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative px-0 md:px-6 min-h-[400px] flex items-center justify-center">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="w-full"
                  style={{ height: isMobile ? 400 : 600 }}
                >
                  {quotations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <FileText className="w-12 h-12 mb-4" />
                      <p className="text-lg mb-2">No quotations found</p>
                      <p className="text-sm mb-4 text-center">
                        Create your first quotation to get started
                      </p>
                      <Button
                        onClick={() => setShowQuotationForm(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Create Quotation
                      </Button>
                    </div>
                  ) : (
                    <DataGrid
                      rows={filteredQuotations}
                      columns={quotationColumns}
                      getRowId={(row) => row._uniqueRowId || `quotation-${row.id || row.quotation_number}-${Math.random().toString(36).substr(2, 9)}`}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: isMobile ? 5 : 10 },
                        },
                      }}
                      pageSizeOptions={isMobile ? [5, 10] : [5, 10, 25]}
                      disableRowSelectionOnClick
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        )}

        {/* =========================================== */}
        {/* FOOTER STATS CARDS */}
        {/* =========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Card 1: Total Bookings */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Active Bookings */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'booked').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Blocked Rooms */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Rooms</p>
                  <p className="text-2xl font-bold text-red-600">
                    {bookings.filter(b => b.status === 'blocked').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Maintenance Rooms */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {bookings.filter(b => b.status === 'maintenance').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Group Bookings */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Group Bookings</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {groupedBookings.size}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Array.from(groupedBookings.values()).reduce((sum, rooms) => sum + rooms.length, 0)} total rooms
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Tax Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tax Collection</p>
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between text-xs">
                      <span>CGST:</span>
                      <span className="font-medium text-blue-600">
                        ₹{bookings.reduce((sum, b) => sum + (b.cgst || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>SGST:</span>
                      <span className="font-medium text-blue-600">
                        ₹{bookings.reduce((sum, b) => sum + (b.sgst || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>IGST:</span>
                      <span className="font-medium text-purple-600">
                        ₹{bookings.reduce((sum, b) => sum + (b.igst || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="border-t pt-1 mt-1 flex justify-between text-xs font-semibold">
                      <span>Total GST:</span>
                      <span className="text-green-600">
                        ₹{bookings.reduce((sum, b) => sum + (b.cgst || 0) + (b.sgst || 0) + (b.igst || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =========================================== */}
        {/* GROUP INVOICE MODAL */}
        {/* =========================================== */}
        {showGroupInvoiceModal && selectedGroupInvoiceData && (
          <div className="mobile-modal-overlay">
            <div className="mobile-modal-panel max-w-4xl">
              <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b bg-background p-4 sm:items-center sm:p-6">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold sm:text-2xl">Group Invoice</h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Group ID: {selectedGroupInvoiceData.groupId} • {selectedGroupInvoiceData.roomCount} Rooms
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGroupInvoiceModal(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
                {/* Invoice Header */}
                <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-primary sm:text-lg">
                      Invoice #{selectedGroupInvoiceData.invoiceNumber}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Date: {selectedGroupInvoiceData.invoiceDate}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Group Booking
                  </Badge>
                </div>

                {/* Customer & Booking Details */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-semibold mb-2">Customer Details</p>
                    <p className="text-sm">{selectedGroupInvoiceData.customer.name}</p>
                    <p className="text-sm">{selectedGroupInvoiceData.customer.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-semibold mb-2">Booking Details</p>
                    <p className="text-sm">Check-in: {selectedGroupInvoiceData.booking.fromDate}</p>
                    <p className="text-sm">Check-out: {selectedGroupInvoiceData.booking.toDate}</p>
                    <p className="text-sm">Duration: {selectedGroupInvoiceData.booking.nights} night(s)</p>
                  </div>
                </div>

                {/* Rooms Table */}
                <div>
                  <p className="font-semibold mb-2">Room Details</p>
                  <div className="mobile-table-wrap rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Room</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Service</th>
                          <th className="p-2 text-right">CGST</th>
                          <th className="p-2 text-right">SGST</th>
                          <th className="p-2 text-right">IGST</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGroupInvoiceData.rooms.map((room: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">Room {room.roomNumber}</td>
                            <td className="p-2 text-right">₹{room.amount.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{room.service.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{room.cgst.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{room.sgst.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{room.igst.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-medium">₹{room.total.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal (Room Charges):</span>
                      <span>₹{selectedGroupInvoiceData.totals.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service Charges:</span>
                      <span>₹{selectedGroupInvoiceData.totals.serviceTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CGST:</span>
                      <span>₹{selectedGroupInvoiceData.totals.cgstTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SGST:</span>
                      <span>₹{selectedGroupInvoiceData.totals.sgstTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IGST:</span>
                      <span>₹{selectedGroupInvoiceData.totals.igstTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>GRAND TOTAL:</span>
                        <span className="text-green-600">
                          ₹{selectedGroupInvoiceData.totals.grandTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t p-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGroupInvoiceModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    downloadGroupInvoice(selectedGroupInvoiceData.groupId);
                    setShowGroupInvoiceModal(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* REFUND DETAILS MODAL */}
        {/* =========================================== */}
        {showRefundDetails && selectedRefundData && (
          <div className="mobile-modal-overlay">
            <div className="mobile-modal-panel max-w-md">
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold sm:text-xl">Refund Details</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowRefundDetails(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Booking Reference</p>
                    <p className="font-mono text-sm">{selectedRefundData.invoice_number}</p>
                    <p className="text-sm font-medium mt-1">{selectedRefundData.customer_name}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Refund Amount</p>
                      <p className="text-lg font-bold text-green-600">₹{selectedRefundData.refund_amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Original Total</p>
                      <p className="text-sm font-medium">₹{selectedRefundData.original_amount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Refund Method</p>
                      <p className="font-medium capitalize">{selectedRefundData.refund_method || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Refund Status</p>
                      <Badge className={
                        selectedRefundData.refund_status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedRefundData.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                      }>
                        {selectedRefundData.refund_status?.toUpperCase() || 'PENDING'}
                      </Badge>
                    </div>
                  </div>

                  {selectedRefundData.advance_paid > 0 && (
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-blue-600">Advance Paid: ₹{selectedRefundData.advance_paid}</p>
                    </div>
                  )}

                  {selectedRefundData.processed_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Processed At</p>
                      <p className="text-sm">{formatDate(selectedRefundData.processed_at)}</p>
                    </div>
                  )}

                  {selectedRefundData.transaction_id && (
                    <div>
                      <p className="text-xs text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-xs break-all">{selectedRefundData.transaction_id}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Cancellation Reason</p>
                    <p className="text-sm bg-red-50 p-2 rounded">{selectedRefundData.refund_reason || 'No reason provided'}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setShowRefundDetails(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* OTHER MODALS */}
        {/* =========================================== */}

        {/* Invoice Modal */}
        {selectedBookingId && (
          <InvoiceModal
            bookingId={selectedBookingId}
            source={isDatabaseUser ? 'database' : 'google_sheets'}
            bookingData={bookings.find(b => b.bookingId === selectedBookingId)}
            userData={currentUser}
            onClose={() => setSelectedBookingId(null)}
            allowPrint={!isBasicDbUser}
            allowDownload={!isBasicDbUser}
            onDownload={
              !isBasicDbUser
                ? () => downloadInvoice(selectedBookingId)
                : undefined
            }
          />
        )}

        {/* Function Booking Details Modal */}
        {showFunctionBookingDetails && selectedFunctionBooking && (
          <div className="mobile-modal-overlay">
            <div className="mobile-modal-panel max-w-3xl">
              <div className="sticky top-0 z-10 shrink-0 border-b bg-background p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold sm:text-2xl">Function Booking Details</h2>
                    <p className="text-muted-foreground">
                      Reference: {selectedFunctionBooking.booking_reference}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFunctionBookingDetails(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Event Information
                      </h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Event Name:</span>
                          <span className="text-sm font-medium">{selectedFunctionBooking.event_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Event Type:</span>
                          <span className="text-sm capitalize">{selectedFunctionBooking.event_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Expected Guests:</span>
                          <span className="text-sm flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {selectedFunctionBooking.guests_expected || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mt-4">
                        <MapPin className="h-4 w-4" />
                        Venue Details
                      </h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Function Room:</span>
                          <span className="text-sm font-medium">{selectedFunctionBooking.room_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Room Number:</span>
                          <span className="text-sm">{selectedFunctionBooking.room_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Date & Time
                      </h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Event Date:</span>
                          <span className="text-sm font-medium">{selectedFunctionBooking.booking_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Event Time:</span>
                          <span className="text-sm">
                            {selectedFunctionBooking.start_time} - {selectedFunctionBooking.end_time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mt-4">
                        <User className="h-4 w-4" />
                        Customer Information
                      </h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <span className="text-sm font-medium">{selectedFunctionBooking.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Phone:</span>
                          <span className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedFunctionBooking.customer_phone}
                          </span>
                        </div>
                        {selectedFunctionBooking.customer_email && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <span className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedFunctionBooking.customer_email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Rooms */}
                {selectedFunctionBooking.has_room_bookings && selectedFunctionBooking.room_bookings && selectedFunctionBooking.room_bookings.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Home className="h-4 w-4" />
                      Accommodation Rooms ({selectedFunctionBooking.total_rooms_booked})
                    </h3>
                    <div className="space-y-2">
                      {selectedFunctionBooking.room_bookings.map((room: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="font-medium">Room {room.room_number}</span>
                            <span className="text-sm text-muted-foreground ml-2">({room.room_type})</span>
                          </div>
                          <div className="text-sm">
                            {formatDateForDisplay(room.from_date)} - {formatDateForDisplay(room.to_date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                {selectedFunctionBooking.special_requests && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Special Requests</h3>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedFunctionBooking.special_requests}
                    </p>
                  </div>
                )}

                {selectedFunctionBooking.catering_requirements && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Catering Requirements</h3>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedFunctionBooking.catering_requirements}
                    </p>
                  </div>
                )}

                {/* Payment Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4" />
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Subtotal:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedFunctionBooking.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">GST ({selectedFunctionBooking.gst_percentage || 18}%):</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedFunctionBooking.gst || 0)}</span>
                    </div>
                    {selectedFunctionBooking.discount && selectedFunctionBooking.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">Discount:</span>
                        <span className="text-sm font-medium">-{formatCurrency(selectedFunctionBooking.discount)}</span>
                      </div>
                    )}
                    {selectedFunctionBooking.other_charges && selectedFunctionBooking.other_charges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm">Other Charges:</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedFunctionBooking.other_charges)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total Amount:</span>
                        <span className="text-primary">{formatCurrency(selectedFunctionBooking.total_amount)}</span>
                      </div>
                      {selectedFunctionBooking.advance_paid > 0 && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Advance Paid:</span>
                          <span className="font-medium text-green-600">{formatCurrency(selectedFunctionBooking.advance_paid)}</span>
                        </div>
                      )}
                      {selectedFunctionBooking.advance_paid > 0 && selectedFunctionBooking.total_amount > selectedFunctionBooking.advance_paid && (
                        <div className="flex justify-between text-sm font-medium mt-1">
                          <span>Balance Due:</span>
                          <span>{formatCurrency(selectedFunctionBooking.balance_due)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Payment Status:</span>
                      {getPaymentStatusBadge(selectedFunctionBooking.payment_status)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowFunctionBookingDetails(false)}
                  >
                    Close
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => {
                      downloadFunctionBookingInvoicePDF(selectedFunctionBooking.id, selectedFunctionBooking.booking_reference);
                      setShowFunctionBookingDetails(false);
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Booking Form Modal */}
        {showPreviousBookingForm && (
          <PreviousBookingForm
            open={showPreviousBookingForm}
            onClose={() => setShowPreviousBookingForm(false)}
            onSuccess={() => {
              fetchBookings();
              toast({
                title: "Previous Booking Added",
                description: "The booking has been recorded successfully",
                variant: "default"
              });
            }}
          />
        )}

        {/* Quotation Form Modal */}
        {showQuotationForm && (
          <QuotationForm
            open={showQuotationForm}
            onClose={() => setShowQuotationForm(false)}
            onSuccess={(quotationData) => {
              fetchQuotations();
              toast({
                title: "✅ Quotation Created",
                description: `Quotation ${quotationData.quotationNumber} generated successfully`,
                variant: "default"
              });
            }}
          />
        )}

        {/* Function Invoice Modal */}
        {showFunctionInvoiceModal && selectedFunctionInvoiceData && (
          <div className="mobile-modal-overlay">
            <div className="mobile-modal-panel max-w-4xl">
              <div className="sticky top-0 z-10 shrink-0 border-b bg-background p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold sm:text-xl">Function Booking Invoice</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFunctionInvoiceModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {selectedFunctionInvoiceData.data && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          Invoice #{selectedFunctionInvoiceData.data.invoiceNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Date: {selectedFunctionInvoiceData.data.invoiceDate}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ref: {selectedFunctionInvoiceData.data.bookingReference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{selectedFunctionInvoiceData.data.hotel.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedFunctionInvoiceData.data.hotel.phone}</p>
                        <p className="text-sm text-muted-foreground">{selectedFunctionInvoiceData.data.hotel.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold mb-2">Customer Details</p>
                        <p className="text-sm">{selectedFunctionInvoiceData.data.customer.name}</p>
                        <p className="text-sm">{selectedFunctionInvoiceData.data.customer.phone}</p>
                        {selectedFunctionInvoiceData.data.customer.email && (
                          <p className="text-sm">{selectedFunctionInvoiceData.data.customer.email}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold mb-2">Event Details</p>
                        <p className="text-sm font-medium">{selectedFunctionInvoiceData.data.event.name}</p>
                        <p className="text-sm">Type: {selectedFunctionInvoiceData.data.event.type}</p>
                        <p className="text-sm">Date: {selectedFunctionInvoiceData.data.event.date}</p>
                        <p className="text-sm">Time: {selectedFunctionInvoiceData.data.event.startTime} - {selectedFunctionInvoiceData.data.event.endTime}</p>
                        <p className="text-sm">Guests: {selectedFunctionInvoiceData.data.event.guestsExpected}</p>
                      </div>
                    </div>

                    {selectedFunctionInvoiceData.data.accommodation && selectedFunctionInvoiceData.data.accommodation.length > 0 && (
                      <div>
                        <p className="font-semibold mb-2">Accommodation Rooms</p>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left">Room</th>
                                <th className="p-2 text-left">Check-in</th>
                                <th className="p-2 text-left">Check-out</th>
                                <th className="p-2 text-left">Nights</th>
                                <th className="p-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedFunctionInvoiceData.data.accommodation.map((room: any, index: number) => (
                                <tr key={index} className="border-t">
                                  <td className="p-2">Room {room.roomNumber}</td>
                                  <td className="p-2">{room.fromDate}</td>
                                  <td className="p-2">{room.toDate}</td>
                                  <td className="p-2">{room.nights}</td>
                                  <td className="p-2 text-right">₹{room.amount.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold mb-2">Charges Breakdown</p>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Description</th>
                              <th className="p-2 text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedFunctionInvoiceData.data.charges.map((charge: any, index: number) => (
                              <tr key={index} className="border-t">
                                <td className="p-2">{charge.description}</td>
                                <td className={`p-2 text-right ${charge.amount < 0 ? 'text-green-600' : ''}`}>
                                  {charge.amount < 0 ? '-' : ''}₹{Math.abs(charge.amount).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t font-semibold bg-gray-50">
                              <td className="p-2">Total Amount</td>
                              <td className="p-2 text-right text-primary">
                                ₹{selectedFunctionInvoiceData.data.totalAmount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">Payment Summary</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium capitalize">{selectedFunctionInvoiceData.data.payment.method}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Status</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              selectedFunctionInvoiceData.data.payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                selectedFunctionInvoiceData.data.payment.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-orange-100 text-orange-800'
                            )}
                          >
                            {selectedFunctionInvoiceData.data.payment.status.toUpperCase()}
                          </Badge>
                        </div>
                        {selectedFunctionInvoiceData.data.advancePaid > 0 && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Advance Paid</p>
                              <p className="font-medium text-green-600">₹{selectedFunctionInvoiceData.data.advancePaid.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Balance Due</p>
                              <p className="font-medium">₹{selectedFunctionInvoiceData.data.balanceDue.toLocaleString('en-IN')}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {selectedFunctionInvoiceData.data.specialRequests && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-semibold mb-1">Special Requests</p>
                        <p className="text-sm">{selectedFunctionInvoiceData.data.specialRequests}</p>
                      </div>
                    )}

                    <div className="text-center text-xs text-muted-foreground border-t pt-4">
                      <p>{selectedFunctionInvoiceData.data.footer.note}</p>
                      <p className="mt-1">{selectedFunctionInvoiceData.data.footer.terms}</p>
                      <p className="mt-2">Generated by {selectedFunctionInvoiceData.data.footer.companyName}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t p-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFunctionInvoiceModal(false)}>
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    downloadFunctionBookingInvoicePDF(
                      selectedFunctionInvoiceData.data.bookingReference,
                      selectedFunctionInvoiceData.data.bookingReference
                    );
                    setShowFunctionInvoiceModal(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && bookingToDelete && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-600">Permanent Deletion</h2>
                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-700">
                    Are you sure you want to permanently delete this booking?
                  </p>

                  {/* Booking Details Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{bookingToDelete.customerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">Room {bookingToDelete.roomNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="font-medium">{bookingToDelete.fromDate} - {bookingToDelete.toDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span className="font-medium capitalize">{bookingToDelete.payment_method || 'cash'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-bold text-green-600">₹{bookingToDelete.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Warning for related records */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        This will also permanently delete:
                        <ul className="list-disc list-inside mt-1 ml-2 space-y-0.5">
                          {bookingToDelete.payment_method === 'cash' && (
                            <li>Collection records for this booking</li>
                          )}
                          {bookingToDelete.payment_method === 'online' && (
                            <li>Transaction records for this booking</li>
                          )}
                          <li>Any related payment history</li>
                        </ul>
                      </span>
                    </p>
                  </div>

                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ This action is PERMANENT and cannot be reversed!
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={cancelDelete}
                    className="flex-1"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Permanently Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {checkoutModalOpen && checkoutBooking && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden shadow-2xl">
              <div className="bg-primary/5 px-3 py-2 border-b flex justify-between items-center gap-2 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <h2 className="text-base font-bold text-primary shrink-0">
                      {bookingModalView === 'edit'
                        ? 'Edit Booking'
                        : checkoutBooking.status === 'booked'
                          ? 'Checkout'
                          : 'Actions'}
                    </h2>
                    <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                      {checkoutBooking.customerName}
                    </span>
                    {getBookingStatusBadge(checkoutBooking)}
                  </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {checkoutBooking.customerPhone} · Rm {checkoutBooking.roomNumber} ·{' '}
                    {checkoutBooking.fromDate} {checkoutBooking.fromTime || '14:00'} →{' '}
                    {checkoutBooking.toDate} {checkoutBooking.toTime || '12:00'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeCheckoutModal} className="h-8 w-8 p-0 rounded-full shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {bookingModalView === 'edit' ? (
                <>
                  <div className="px-4 py-2 border-b bg-amber-50/80 shrink-0 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Edit booking details</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        handleEditCancel();
                        setBookingModalView('main');
                      }}
                    >
                      ← Back to actions
                    </Button>
                  </div>
                  {loadingCheckoutEdit ? (
                    <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading booking details…
                    </div>
                  ) : (
                    renderBookingEditForm()
                  )}
                  <div className="border-t p-4 bg-gray-50 flex justify-end gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleEditCancel();
                        setBookingModalView('main');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleEditSaveFromModal} className="bg-primary text-primary-foreground">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </>
              ) : (
                <>
              <div className="px-3 py-2 border-b bg-muted/20 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Invoice, edit &amp; more
                </p>
                {renderBookingManageActions(checkoutBooking)}
              </div>

              {isBasicDbUser && checkoutBooking.status === 'booked' && (
                <p className="px-4 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-200 shrink-0">
                  Basic plan: Payment checkout only. Invoice is view-only. Upgrade to Pro for services, discounts, print/download &amp; customize invoice.
                </p>
              )}

              {checkoutBooking.status === 'booked' && (
              <>
              {/* Tabs for checkout options */}
              <div className="flex border-b text-sm shrink-0">
                <button
                  type="button"
                  disabled={isBasicDbUser}
                  className={cn(
                    "flex-1 py-3 text-center font-medium border-b-2 transition-colors",
                    isBasicDbUser && "opacity-50 cursor-not-allowed",
                    checkoutActiveTab === 'services' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    if (isBasicDbUser) {
                      toast({
                        title: 'Pro feature',
                        description: 'Additional services are available on the Pro plan.',
                      });
                      return;
                    }
                    setCheckoutActiveTab('services');
                  }}
                  title={isBasicDbUser ? 'Pro feature — upgrade to unlock' : undefined}
                >
                  Additional Services
                </button>
                <button
                  type="button"
                  disabled={isBasicDbUser}
                  className={cn(
                    "flex-1 py-3 text-center font-medium border-b-2 transition-colors",
                    isBasicDbUser && "opacity-50 cursor-not-allowed",
                    checkoutActiveTab === 'discount' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    if (isBasicDbUser) {
                      toast({
                        title: 'Pro feature',
                        description: 'Checkout discounts are available on the Pro plan.',
                      });
                      return;
                    }
                    setCheckoutActiveTab('discount');
                  }}
                  title={isBasicDbUser ? 'Pro feature — upgrade to unlock' : undefined}
                >
                  Discount
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-3 text-center font-medium border-b-2 transition-colors",
                    checkoutActiveTab === 'payment' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setCheckoutActiveTab('payment')}
                >
                  Payment
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
                {checkoutActiveTab === 'services' && (
                  <div className="space-y-4">
                    <div className="space-y-2 border p-4 rounded-lg bg-gray-50/55">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="breakfastTaken"
                          checked={breakfastTaken}
                          onChange={(e) => setBreakfastTaken(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="breakfastTaken" className="font-semibold text-sm cursor-pointer select-none">
                          Client had Breakfast
                        </Label>
                      </div>

                      {breakfastTaken && (
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                          <div className="space-y-1">
                            <Label className="text-xs">Price/Pax/Day</Label>
                            <Input
                              type="number"
                              value={breakfastPrice}
                              onChange={(e) => setBreakfastPrice(Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Guests</Label>
                            <Input
                              type="number"
                              value={breakfastGuests}
                              onChange={(e) => setBreakfastGuests(Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Days</Label>
                            <Input
                              type="number"
                              value={breakfastDays}
                              onChange={(e) => setBreakfastDays(Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border p-4 rounded-lg bg-gray-50/55">
                      <h4 className="font-semibold text-sm">Other Service Charges</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            type="text"
                            placeholder="e.g. Laundry, Extra Bed"
                            value={otherServiceDescription}
                            onChange={(e) => setOtherServiceDescription(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={otherServiceCharges || ''}
                            onChange={(e) => setOtherServiceCharges(Number(e.target.value))}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutActiveTab === 'discount' && (
                  <div className="space-y-4">
                    <div className="space-y-2 border p-4 rounded-lg bg-gray-50/55">
                      <Label className="font-semibold text-sm">Discount Configuration</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Button
                          type="button"
                          variant={checkoutDiscountType === 'none' ? 'default' : 'outline'}
                          onClick={() => { setCheckoutDiscountType('none'); setCheckoutDiscountValue(0); }}
                          className="h-9 text-xs animate-none"
                        >
                          No Discount
                        </Button>
                        <Button
                          type="button"
                          variant={checkoutDiscountType === 'percentage' ? 'default' : 'outline'}
                          onClick={() => { setCheckoutDiscountType('percentage'); setCheckoutDiscountValue(0); }}
                          className="h-9 text-xs animate-none"
                        >
                          Percentage (%)
                        </Button>
                        <Button
                          type="button"
                          variant={checkoutDiscountType === 'amount' ? 'default' : 'outline'}
                          onClick={() => { setCheckoutDiscountType('amount'); setCheckoutDiscountValue(0); }}
                          className="h-9 text-xs animate-none"
                        >
                          Fixed Amount (₹)
                        </Button>
                      </div>

                      {checkoutDiscountType !== 'none' && (
                        <div className="mt-4 space-y-1">
                          <Label className="text-xs">
                            {checkoutDiscountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                          </Label>
                          <Input
                            type="number"
                            placeholder={checkoutDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                            value={checkoutDiscountValue || ''}
                            onChange={(e) => setCheckoutDiscountValue(Number(e.target.value))}
                            className="h-9 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {checkoutActiveTab === 'payment' && checkoutTotals && (
                  <div className="space-y-4">
                    {checkoutTotals.advancePaid > 0 ? (
                      <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 space-y-3">
                        <h4 className="font-semibold text-sm text-amber-900 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Advance Already Paid
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-amber-700">Total Bill:</span>
                            <span className="font-bold ml-2">₹{checkoutTotals.estimatedTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-amber-700">Advance Paid:</span>
                            <span className="font-bold text-green-700 ml-2">₹{checkoutTotals.advancePaid.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="col-span-2 border-t border-amber-200 pt-2">
                            <div className="flex justify-between">
                              <span className="font-medium text-orange-800">Balance Due:</span>
                              <span className="font-bold text-orange-700 text-base">
                                ₹{checkoutTotals.balanceDue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-800 font-medium">Full Amount Due:</span>
                          <span className="font-bold text-blue-900 text-lg">
                            ₹{checkoutTotals.estimatedTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">No advance was recorded for this booking.</p>
                      </div>
                    )}

                    <div className="space-y-2 border p-4 rounded-lg bg-gray-50/55">
                      <Label className="text-sm font-semibold">
                        {checkoutTotals.advancePaid > 0
                          ? 'Amount Paying Now (₹) *'
                          : 'Amount to Pay at Checkout (₹) *'}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={checkoutTotals.advancePaid > 0 ? checkoutTotals.balanceDue : checkoutTotals.estimatedTotal}
                          step="1"
                          value={checkoutAmountToPay || ''}
                          onChange={(e) => setCheckoutAmountToPay(parseFloat(e.target.value) || 0)}
                          className="h-10"
                          placeholder="Enter amount"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap h-10"
                          onClick={() => setCheckoutAmountToPay(
                            checkoutTotals.advancePaid > 0
                              ? checkoutTotals.balanceDue
                              : checkoutTotals.estimatedTotal
                          )}
                        >
                          {checkoutTotals.advancePaid > 0 ? 'Pay Full Balance' : 'Pay Full Amount'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {checkoutTotals.advancePaid > 0
                          ? `Maximum: ₹${checkoutTotals.balanceDue.toLocaleString('en-IN')} (remaining after advance)`
                          : `Maximum: ₹${checkoutTotals.estimatedTotal.toLocaleString('en-IN')} (full bill)`}
                      </p>
                      {checkoutAmountToPay > 0 && (
                        <div className="text-xs rounded-md bg-white border p-2 space-y-1">
                          <div className="flex justify-between">
                            <span>Paying now:</span>
                            <span className="font-semibold text-green-700">₹{checkoutAmountToPay.toLocaleString('en-IN')}</span>
                          </div>
                          {checkoutTotals.advancePaid > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>After this payment, remaining:</span>
                              <span className="font-medium text-orange-600">
                                ₹{Math.max(0, checkoutTotals.estimatedTotal - checkoutTotals.advancePaid - checkoutAmountToPay).toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-semibold">Payment Method</Label>

                      {isProUser ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={checkoutPaymentMethod === 'cash' ? 'default' : 'outline'}
                            className="h-auto py-2.5 px-3 flex flex-row items-center justify-start gap-2"
                            onClick={() => setCheckoutPaymentMethod('cash')}
                          >
                            <Wallet className="h-4 w-4 shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="text-sm font-medium leading-tight">Cash</div>
                              <div className="text-[10px] opacity-80 font-normal">At reception</div>
                            </div>
                          </Button>

                          <Button
                            type="button"
                            variant={checkoutPaymentMethod === 'online' ? 'default' : 'outline'}
                            className="h-auto py-2.5 px-3 flex flex-row items-center justify-start gap-2"
                            onClick={() => {
                              setCheckoutPaymentMethod('online');
                              if (checkoutAmountToPay > 0) {
                                generateCheckoutUPIQrCode(checkoutAmountToPay);
                              }
                            }}
                            disabled={isGeneratingCheckoutQR}
                          >
                            {isGeneratingCheckoutQR ? (
                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            ) : (
                              <QrCode className="h-4 w-4 shrink-0" />
                            )}
                            <div className="text-left min-w-0">
                              <div className="text-sm font-medium leading-tight">Online</div>
                              <div className="text-[10px] opacity-80 font-normal">UPI QR</div>
                            </div>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            Basic plan: cash only at checkout.
                          </p>
                          <Button
                            type="button"
                            variant="default"
                            className="w-full h-auto py-2.5 px-3 flex flex-row items-center justify-center gap-2"
                            onClick={() => setCheckoutPaymentMethod('cash')}
                          >
                            <Wallet className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">Cash at reception</span>
                          </Button>
                        </div>
                      )}

                      {checkoutPaymentMethod === 'online' && isProUser && (
                        <div className="border rounded-lg p-3 space-y-3 bg-white">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="sm:w-2/5 space-y-2">
                              <h4 className="font-semibold text-sm text-center">Scan QR</h4>
                              <div className="bg-white p-2 rounded-lg border flex flex-col items-center">
                                {checkoutHotelQRCode ? (
                                  <img
                                    src={checkoutHotelQRCode}
                                    alt="Hotel UPI QR Code"
                                    className="w-32 h-32 object-contain mx-auto"
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/hithlakshsolutions-com-qr.png';
                                      e.currentTarget.alt = 'UPI QR Code for Payment';
                                    }}
                                  />
                                ) : (
                                  <img
                                    src="/images/hithlakshsolutions-com-qr.png"
                                    alt="UPI QR Code for Payment"
                                    className="w-32 h-32 object-contain mx-auto"
                                  />
                                )}
                                <div className="mt-3 text-center">
                                  <div className="text-sm font-medium mb-1">
                                    Amount:
                                    <span className="text-lg font-bold text-green-600 ml-2">
                                      ₹{checkoutAmountToPay.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    Scan with any UPI app to pay at checkout
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="sm:flex-1 space-y-3">
                              <h4 className="font-semibold text-sm">Instructions</h4>
                              <div className="space-y-2 text-xs text-muted-foreground">
                                <p>1. Guest scans the hotel QR code with PhonePe, GPay, or Paytm.</p>
                                <p>2. Enter the exact checkout amount shown above.</p>
                                <p>3. After payment succeeds, click the button below.</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Payment status:</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    checkoutPaymentStatus === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {checkoutPaymentStatus === 'completed' ? 'Verified' : 'Pending'}
                                </Badge>
                              </div>

                              {checkoutPaymentStatus !== 'completed' ? (
                                <Button
                                  type="button"
                                  onClick={verifyCheckoutPayment}
                                  className="w-full"
                                  disabled={isVerifyingCheckoutPayment}
                                >
                                  {isVerifyingCheckoutPayment ? (
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
                              ) : (
                                <Alert className="bg-green-50 border-green-200">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <AlertDescription className="text-green-700 font-medium">
                                    Online payment verified. You can complete checkout.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {checkoutPaymentMethod === 'cash' && (
                        <div className="border rounded-lg p-3 bg-blue-50/50 text-sm flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-blue-600 shrink-0" />
                            <span className="font-medium">Collect cash at reception</span>
                          </div>
                          <span className="text-lg font-bold text-blue-700 tabular-nums">
                            ₹{checkoutAmountToPay.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Transaction ID (optional)</Label>
                        <Input
                          type="text"
                          placeholder="e.g. TXN987654321 or UPI reference"
                          value={checkoutTransactionId}
                          onChange={(e) => setCheckoutTransactionId(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Final calculations section */}
                {checkoutTotals && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Amount Summary</h4>
                  <div className="bg-primary/5 rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Room Charge:</span>
                      <span>₹{(checkoutBooking.amount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {checkoutDiscountType !== 'none' && checkoutDiscountValue > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>
                          Discount {checkoutDiscountType === 'percentage' ? `(${checkoutDiscountValue}%)` : ''}:
                        </span>
                        <span>- ₹{checkoutTotals.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {breakfastTaken && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Breakfast Add-on:</span>
                        <span>₹{(breakfastPrice * breakfastDays * breakfastGuests).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {otherServiceCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{otherServiceDescription || 'Other Services'}:</span>
                        <span>₹{otherServiceCharges.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {checkoutTotals.gst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST:</span>
                        <span>₹{checkoutTotals.gst.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-sm border-t pt-2 mt-2 text-primary">
                      <span>Estimated Total Bill:</span>
                      <span>₹{checkoutTotals.estimatedTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {checkoutTotals.advancePaid > 0 && (
                      <>
                        <div className="flex justify-between text-green-700 font-medium">
                          <span>Advance Paid (at booking):</span>
                          <span>- ₹{checkoutTotals.advancePaid.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-orange-700 font-semibold">
                          <span>Balance Due:</span>
                          <span>₹{checkoutTotals.balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}

                    {checkoutAmountToPay > 0 && (
                      <div className="flex justify-between text-green-800 font-semibold border-t pt-2 bg-green-50/50 -mx-2 px-2 py-1 rounded">
                        <span>Paying at Checkout:</span>
                        <span>₹{checkoutAmountToPay.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              <div className="border-t p-4 bg-gray-50 flex justify-end gap-2 shrink-0">
                <Button variant="outline" onClick={closeCheckoutModal} disabled={isCheckingOut}>
                  Cancel
                </Button>
                <Button onClick={handleCheckoutSubmit} disabled={isCheckingOut} className="bg-green-600 hover:bg-green-700 text-white">
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Checkout
                    </>
                  )}
                </Button>
              </div>
              </>
              )}

              {checkoutBooking.status !== 'booked' && (
                <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
                  <Button variant="outline" onClick={closeCheckoutModal}>
                    Close
                  </Button>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Bookings;