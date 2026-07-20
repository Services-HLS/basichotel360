
// src/pages/RoomBooking.tsx

import { useNavigate } from 'react-router-dom';
import {
  isBookingBlockingRoom,
  isBookingOccupyingDate,
  isPendingCheckoutBooking,
  BOOKINGS_UPDATED_EVENT,
  type BookingLike,
} from '@/lib/bookingCheckoutUtils';
import { compareRoomNumbers } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  User,
  Phone,
  CreditCard,
  Wallet,
  CheckCircle,
  Loader2,
  Trash2,
  CheckSquare,
  Square,
  Pencil,
} from 'lucide-react';

// Import Components
import BookingForm from '@/components/BookingForm';
import BlockRoomForm from '@/components/BlockRoomForm';
import MaintenanceForm from '@/components/MaintenanceForm';
import QuotationForm from '@/components/QuotationForm';
import AddRoomModal from '@/components/AddRoomModal';
import MultiRoomBookingForm from '@/components/MultiRoomBookingForm';
import CustomTimePicker from '@/components/CustomTimePicker';

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
  customerPhone?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  amount?: number;
  service?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gst?: number;
  originalAmount?: number;
  advanceAmountPaid?: number;
  paymentStatus: string;
  idImage?: string;
  fromDate?: string;
  toDate?: string;
  isAdvanceBooking?: boolean;
  advanceAmount?: number;
  remainingAmount?: number;
  advanceExpiryDate?: string;
  bookingType?: 'regular' | 'advance' | 'maintenance' | 'blocked';
  groupBookingId?: string;
  /** Check-in time (HH:MM) from API — used with dates for availability */
  checkInTime?: string;
  /** Check-out time (HH:MM) */
  checkOutTime?: string;
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
  const navigate = useNavigate();

  // ========== STATE VARIABLES ==========
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
  const [editingOccupyingBooking, setEditingOccupyingBooking] = useState<Booking | null>(null);
  const [editOccupyingForm, setEditOccupyingForm] = useState({
    checkInDate: '',
    checkOutDate: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
  });
  const [savingOccupyingEdit, setSavingOccupyingEdit] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationRoom, setQuotationRoom] = useState<Room | null>(null);
  const [quotationDateRange, setQuotationDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 1))
  });

  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [selectedAdvanceForBooking, setSelectedAdvanceForBooking] = useState<Booking | null>(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  // Calendar states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 1))
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('grid');
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => new Date());
  const [calendarWeekCount, setCalendarWeekCount] = useState<1 | 2 | 3 | 4>(1);
  const CALENDAR_WEEK_DAYS = 7;
  const [roomViewMode, setRoomViewMode] = useState<'minimal' | 'detailed'>('minimal');
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState<boolean>(false);
  const [showCalendarHelp, setShowCalendarHelp] = useState(false);
  /** Bumps every minute so rooms free up when checkout time passes */
  const [availabilityClock, setAvailabilityClock] = useState(0);

  // Calendar drag-to-select for booking dates
  const [isDraggingDates, setIsDraggingDates] = useState(false);
  const [dragAnchorDate, setDragAnchorDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [calendarDragRoom, setCalendarDragRoom] = useState<Room | null>(null);
  const calendarDragRef = useRef({
    isDragging: false,
    moved: false,
    skipBook: false,
    anchor: null as Date | null,
    end: null as Date | null,
    room: null as Room | null,
  });
  /** Suppress grid click after drag-to-book (mouseup runs before click) */
  const calendarDragJustBookedRef = useRef(false);
  const [activeRoomType, setActiveRoomType] = useState<string>('all');
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingListFilter, setBookingListFilter] = useState<
    'all' | 'active' | 'completed' | 'advance' | 'overdue'
  >('all');
  const recordsPerPage = 10;

  // ========== MULTI-SELECT STATES ==========
  const [selectedRoomsForMulti, setSelectedRoomsForMulti] = useState<Room[]>([]);
  const [showMultiBookingForm, setShowMultiBookingForm] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Group bookings view
  const [showGroupBookings, setShowGroupBookings] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupBookings, setGroupBookings] = useState<Booking[]>([]);

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

  // ========== HELPER FUNCTIONS ==========
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

  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const getCalendarWeekDays = (weekStart: Date, weekCount: number): Date[] => {
    const today = startOfDay(new Date());
    const anchor = startOfDay(weekStart).getTime() < today.getTime() ? today : startOfDay(weekStart);
    const weeks = Math.min(4, Math.max(1, weekCount));
    const totalDays = weeks * CALENDAR_WEEK_DAYS;
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  /** Match booking to room whether API used room id or room number */
  const bookingMatchesRoom = (booking: Booking, room: Room): boolean => {
    const rid = String(room.roomId ?? '');
    const rn = String(room.number ?? '');
    const bRoomId = String(booking.roomId ?? '');
    const bRoomNum = String(booking.roomNumber ?? '');
    return (
      (bRoomId && bRoomId === rid) ||
      (bRoomNum && bRoomNum === rn) ||
      (bRoomId && bRoomId === rn) ||
      (bRoomNum && bRoomNum === rid)
    );
  };

  const getRoomBookingsForRoom = (room: Room) =>
    bookings.filter((booking) => bookingMatchesRoom(booking, room));

  const isRoomDateOccupied = (room: Room, date: Date): boolean => {
    const roomBookings = getRoomBookingsForRoom(room);
    return roomBookings.some((booking) => {
      if (!isBookingBlockingRoom(booking)) return false;
      return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
    });
  };

  const getDatesBetweenInclusive = (start: Date, end: Date): Date[] => {
    const from = startOfDay(start);
    const to = startOfDay(end);
    const minTime = Math.min(from.getTime(), to.getTime());
    const maxTime = Math.max(from.getTime(), to.getTime());
    const dates: Date[] = [];
    const cursor = new Date(minTime);
    while (cursor.getTime() <= maxTime) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const isDateInDragSelection = (date: Date, room: Room): boolean => {
    if (!isDraggingDates || !dragAnchorDate || !dragEndDate || !calendarDragRoom) return false;
    if (calendarDragRoom.roomId !== room.roomId) return false;
    const t = startOfDay(date).getTime();
    const min = Math.min(dragAnchorDate.getTime(), dragEndDate.getTime());
    const max = Math.max(dragAnchorDate.getTime(), dragEndDate.getTime());
    return t >= min && t <= max;
  };

  const openBookingWithDateRange = (room: Room, checkIn: Date, checkOut: Date) => {
    const roomWithId = {
      ...room,
      roomId: room.roomId || `R-${room.number}`,
    };

    const rangeDates = getDatesBetweenInclusive(checkIn, checkOut);
    const blocked = rangeDates.find((d) => isRoomDateOccupied(roomWithId, d));
    if (blocked) {
      toast({
        title: 'Dates not available',
        description: `Room ${room.number} is not available for the full selected range.`,
        variant: 'destructive',
      });
      return;
    }

    const checkInNorm = startOfDay(checkIn);
    const lastNight = startOfDay(checkOut);
    const checkOutNorm = new Date(
      lastNight.getTime() <= checkInNorm.getTime() ? checkInNorm : lastNight
    );
    // Selected day(s) = night(s) stayed; checkout is the morning after the last night
    checkOutNorm.setDate(checkOutNorm.getDate() + 1);

    setDateRange({ from: checkInNorm, to: checkOutNorm });
    setSelectedDate(checkInNorm);
    setSelectedRoom(roomWithId);
    setBookingMode('book');
    setSelectedAdvanceForBooking(null);
    setShowBookingForm(true);

    toast({
      title: 'Dates selected',
      description: `Check-in ${formatDate(checkInNorm)} → Check-out ${formatDate(checkOutNorm)}`,
    });
  };

  const resetCalendarDrag = () => {
    calendarDragRef.current = {
      isDragging: false,
      moved: false,
      skipBook: false,
      anchor: null,
      end: null,
      room: null,
    };
    setIsDraggingDates(false);
    setDragAnchorDate(null);
    setDragEndDate(null);
    setCalendarDragRoom(null);
  };

  useEffect(() => {
    const onMouseUp = () => {
      const drag = calendarDragRef.current;
      if (!drag.skipBook && drag.isDragging && drag.anchor && drag.end && drag.room) {
        const from =
          drag.anchor.getTime() <= drag.end.getTime() ? drag.anchor : drag.end;
        const to =
          drag.anchor.getTime() <= drag.end.getTime() ? drag.end : drag.anchor;
        openBookingWithDateRange(drag.room, from, to);
        calendarDragJustBookedRef.current = true;
      }
      resetCalendarDrag();
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatBookingId = (id: string | number): string => {
    const idStr = typeof id === 'string' ? id : String(id);
    return idStr.length > 8 ? `${idStr.slice(0, 8)}...` : idStr;
  };

  /** Normalize HH:MM or HH:MM:SS from API / Sheets */
  const normalizeBookingTime = (t?: string | null, fallback = '12:00'): string => {
    if (t === undefined || t === null || String(t).trim() === '') return fallback;
    const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return fallback;
    return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
  };

  /** Calendar date YYYY-MM-DD in local timezone (avoids UTC off-by-one from API ISO strings). */
  const toCalendarDateString = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '';
    if (value instanceof Date && !isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const formatDateForInput = (value?: string | null): string => toCalendarDateString(value);

  const getMinCheckoutDate = (checkInDate: string): string => toCalendarDateString(checkInDate);

  const isCheckoutOnOrAfterCheckin = (checkInDate: string, checkOutDate: string): boolean => {
    const from = toCalendarDateString(checkInDate);
    const to = toCalendarDateString(checkOutDate);
    if (!from || !to) return false;
    return to >= from;
  };

  const formatBookingDateTime = (dateStr?: string, timeStr?: string, fallbackTime = '12:00'): string => {
    const calendar = toCalendarDateString(dateStr);
    if (!calendar) return '—';
    const [year, month, day] = calendar.split('-').map(Number);
    const datePart = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${datePart} ${normalizeBookingTime(timeStr, fallbackTime)}`;
  };

  const roundMoney = (value: number) => Math.round(value * 100) / 100;

  const calculateStayNights = (fromDate: string, toDate: string): number => {
    const from = toCalendarDateString(fromDate);
    const to = toCalendarDateString(toDate);
    if (!from || !to) return 1;
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);
    const diffDays = Math.round(
      (new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 0 ? diffDays : 1;
  };

  const canRecalculateBookingAmount = (booking: Booking | null): boolean => {
    if (!booking || booking.isAdvanceBooking) return false;
    return String(booking.status || '').toLowerCase() === 'booked';
  };

  const recalculateBookingAmounts = (
    booking: Booking,
    newCheckIn: string,
    newCheckOut: string
  ) => {
    const oldNights = calculateStayNights(
      booking.fromDate || booking.checkIn,
      booking.toDate || booking.checkOut
    );
    const newNights = calculateStayNights(newCheckIn, newCheckOut);

    const baseAmount = Number(booking.amount) || Number(booking.totalAmount) || 0;
    const service = Number(booking.service) || 0;
    const cgst = Number(booking.cgst) || 0;
    const sgst = Number(booking.sgst) || 0;
    const igst = Number(booking.igst) || 0;
    const gst = Number(booking.gst) || cgst + sgst + igst;
    const previousTotal =
      Number(booking.totalAmount) || roundMoney(baseAmount + service + cgst + sgst + igst);
    const advancePaid = Number(booking.advanceAmountPaid ?? booking.advanceAmount) || 0;
    const originalAmount = Number(booking.originalAmount) || baseAmount;

    if (newNights === oldNights) {
      const remaining = Math.max(0, roundMoney(previousTotal - advancePaid));
      return {
        oldNights,
        newNights,
        amount: baseAmount,
        service,
        cgst,
        sgst,
        igst,
        gst,
        total: previousTotal,
        original_amount: originalAmount,
        remaining_amount: remaining,
        previousTotal,
        changed: false,
        delta: 0,
      };
    }

    const scale = (value: number) =>
      oldNights > 0 ? roundMoney((value / oldNights) * newNights) : value;

    const amount = scale(baseAmount);
    const nextService = scale(service);
    const nextCgst = scale(cgst);
    const nextSgst = scale(sgst);
    const nextIgst = scale(igst);
    const nextGst = scale(gst);
    const total = roundMoney(amount + nextService + nextCgst + nextSgst + nextIgst);
    const nextOriginal = scale(originalAmount);
    const remaining_amount = Math.max(0, roundMoney(total - advancePaid));

    return {
      oldNights,
      newNights,
      amount,
      service: nextService,
      cgst: nextCgst,
      sgst: nextSgst,
      igst: nextIgst,
      gst: nextGst,
      total,
      original_amount: nextOriginal,
      remaining_amount,
      previousTotal,
      changed: true,
      delta: roundMoney(total - previousTotal),
    };
  };

  const renderStayCheckoutLine = (booking: Booking | null, className = '') => {
    if (!booking) return null;
    return (
      <div className={`flex items-center gap-1 truncate ${className}`} title={`Checkout: ${formatBookingDateTime(booking.checkOut, booking.checkOutTime)}`}>
        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate">
          Out: {formatBookingDateTime(booking.checkOut, booking.checkOutTime)}
        </span>
      </div>
    );
  };

  /** Map local booking to shared checkout/availability helpers */
  const toBookingLike = (booking: Booking): BookingLike => ({
    ...booking,
    fromTime: booking.checkInTime,
    toTime: booking.checkOutTime,
    checkInTime: booking.checkInTime,
    checkOutTime: booking.checkOutTime,
    rawFromDate: booking.checkIn,
    rawToDate: booking.checkOut,
    fromDate: booking.fromDate || booking.checkIn,
    toDate: booking.toDate || booking.checkOut,
  });

  const isDateBooked = (date: Date, checkIn: string, checkOut: string, booking?: Booking | any): boolean => {
    try {
      if (booking) {
        return isBookingOccupyingDate(
          {
            ...toBookingLike(booking as Booking),
            checkIn: checkIn || booking.checkIn,
            checkOut: checkOut || booking.checkOut,
            rawFromDate: booking.checkIn || checkIn,
            rawToDate: booking.checkOut || checkOut,
          },
          date
        );
      }

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

  type RoomCalendarCellStatus = 'available' | 'booked' | 'advance' | 'maintenance' | 'blocked' | 'pending_checkout';

  const ROOM_CALENDAR_STATUS_STYLE: Record<
    RoomCalendarCellStatus,
    { cell: string; dot: string; label: string }
  > = {
    available: {
      cell: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/80 text-emerald-900',
      dot: 'bg-emerald-500',
      label: 'Available',
    },
    booked: {
      cell: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-900',
      dot: 'bg-rose-500',
      label: 'Booked',
    },
    pending_checkout: {
      cell: 'bg-orange-50 hover:bg-orange-100/80 border-orange-300 text-orange-950',
      dot: 'bg-orange-500',
      label: 'Pending Checkout',
    },
    advance: {
      cell: 'bg-violet-50 hover:bg-violet-100/80 border-violet-200 text-violet-900',
      dot: 'bg-violet-500',
      label: 'Advance',
    },
    maintenance: {
      cell: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-950',
      dot: 'bg-amber-500',
      label: 'Maintenance',
    },
    blocked: {
      cell: 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-800',
      dot: 'bg-slate-500',
      label: 'Blocked',
    },
  };

  const isPastCalendarDate = (date: Date) =>
    startOfDay(date).getTime() < startOfDay(new Date()).getTime();

  const isTodayCalendarDate = (date: Date) =>
    formatDate(date) === formatDate(new Date());

  const getRoomCalendarCellStatus = (room: Room, date: Date): RoomCalendarCellStatus => {
    const roomBookings = getRoomBookingsForRoom(room).filter((booking) => {
      if (!isBookingBlockingRoom(booking)) return false;
      return isBookingOccupyingDate(toBookingLike(booking), date);
    });

    if (roomBookings.some((b) => b.status?.toLowerCase() === 'maintenance')) return 'maintenance';
    if (roomBookings.some((b) => b.status?.toLowerCase() === 'blocked')) return 'blocked';
    if (
      roomBookings.some(
        (b) =>
          b.isAdvanceBooking &&
          ['confirmed', 'pending'].includes(String(b.status || '').toLowerCase())
      )
    ) {
      return 'advance';
    }
    if (roomBookings.length > 0) return 'booked';
    return 'available';
  };

  const getAdvanceBookingForRoom = (room: Room, date: Date): Booking | null => {
    const roomBookings = bookings.filter(booking => {
      if (!bookingMatchesRoom(booking, room)) return false;
      if (!booking.isAdvanceBooking) return false;
      if (!['confirmed', 'pending'].includes(String(booking.status || '').toLowerCase())) return false;
      return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
    });

    return roomBookings.length > 0 ? roomBookings[0] : null;
  };

  const getOccupyingBookingForRoom = (room: Room, date: Date): Booking | null => {
    const roomBookings = bookings.filter((b) => bookingMatchesRoom(b, room));
    const onDate = roomBookings.filter((b) =>
      isDateBooked(date, b.checkIn, b.checkOut, b)
    );
    const maintenance = onDate.find((b) => b.status?.toLowerCase() === 'maintenance');
    if (maintenance) return maintenance;
    const blocked = onDate.find((b) => b.status?.toLowerCase() === 'blocked');
    if (blocked) return blocked;
    const advance = onDate.find(
      (b) =>
        b.isAdvanceBooking &&
        ['confirmed', 'pending'].includes(String(b.status || '').toLowerCase())
    );
    if (advance) return advance;
    const booked = onDate.find((b) => isBookingBlockingRoom(b));
    return booked || null;
  };

  const canEditOccupyingBooking = (booking: Booking | null): boolean => {
    if (!booking || booking.isAdvanceBooking) return false;
    const s = String(booking.status || '').toLowerCase();
    return s === 'booked' || s === 'blocked' || s === 'maintenance';
  };

  const getBookingIdForEdit = (booking: Booking): string => {
    const id = String(booking.id || '');
    return id.startsWith('adv-') ? id.replace('adv-', '') : id;
  };

  const openOccupyingBookingEdit = (booking: Booking) => {
    if (booking.isAdvanceBooking) {
      toast({
        title: 'Advance booking',
        description: 'Use Advance Bookings to change this reservation.',
      });
      navigate('/advance-bookings');
      return;
    }
    if (!canEditOccupyingBooking(booking)) {
      toast({
        title: 'Cannot edit',
        description: 'This booking cannot be edited (already checked out).',
        variant: 'destructive',
      });
      return;
    }
    if (userSource !== 'database' && userPlan !== 'pro') {
      toast({
        title: 'Edit unavailable',
        description: 'Checkout dates can only be edited for database bookings.',
        variant: 'destructive',
      });
      return;
    }
    setEditingOccupyingBooking(booking);
    setEditOccupyingForm({
      checkInDate: toCalendarDateString(booking.fromDate || booking.checkIn),
      checkOutDate: toCalendarDateString(booking.toDate || booking.checkOut),
      checkInTime: normalizeBookingTime(booking.checkInTime, '14:00'),
      checkOutTime: normalizeBookingTime(booking.checkOutTime, '12:00'),
    });
  };

  const navigateToBookingCheckout = () => {
    if (!editingOccupyingBooking) return;

    const status = String(editingOccupyingBooking.status || '').toLowerCase();
    if (status && status !== 'booked') {
      toast({
        title: 'Checkout unavailable',
        description: 'This booking is not an active stay.',
        variant: 'destructive',
      });
      return;
    }

    if (userSource !== 'database' && userPlan !== 'pro') {
      toast({
        title: 'Checkout unavailable',
        description: 'Open the Checkout tab for database bookings.',
        variant: 'destructive',
      });
      return;
    }

    const bookingId = getBookingIdForEdit(editingOccupyingBooking);
    closeOccupyingBookingEdit();
    navigate(`/bookings?checkout=${bookingId}`);
  };

  const closeOccupyingBookingEdit = () => {
    setEditingOccupyingBooking(null);
    setEditOccupyingForm({
      checkInDate: '',
      checkOutDate: '',
      checkInTime: '14:00',
      checkOutTime: '12:00',
    });
  };

  const saveOccupyingBookingEdit = async () => {
    if (!editingOccupyingBooking) return;
    if (!editOccupyingForm.checkInDate || !editOccupyingForm.checkOutDate) {
      toast({
        title: 'Missing dates',
        description: 'Please enter both check-in and checkout dates.',
        variant: 'destructive',
      });
      return;
    }
    if (!isCheckoutOnOrAfterCheckin(editOccupyingForm.checkInDate, editOccupyingForm.checkOutDate)) {
      toast({
        title: 'Invalid dates',
        description: 'Checkout date cannot be before check-in date.',
        variant: 'destructive',
      });
      return;
    }

    const bookingId = getBookingIdForEdit(editingOccupyingBooking);
    setSavingOccupyingEdit(true);
    try {
      const token = localStorage.getItem('authToken');
      const checkResponse = await fetch(`${NODE_BACKEND_URL}/bookings/check-availability`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: editingOccupyingBooking.roomId,
          from_date: editOccupyingForm.checkInDate,
          to_date: editOccupyingForm.checkOutDate,
          exclude_booking_id: bookingId,
        }),
      });
      const checkData = await checkResponse.json();
      if (!checkData.success || !checkData.data?.available) {
        toast({
          title: 'Room not available',
          description: 'This room is already booked for the selected dates.',
          variant: 'destructive',
        });
        return;
      }

      const amountUpdate =
        canRecalculateBookingAmount(editingOccupyingBooking)
          ? recalculateBookingAmounts(
              editingOccupyingBooking,
              editOccupyingForm.checkInDate,
              editOccupyingForm.checkOutDate
            )
          : null;

      const updatePayload: Record<string, string | number> = {
        from_date: editOccupyingForm.checkInDate,
        to_date: editOccupyingForm.checkOutDate,
        from_time: editOccupyingForm.checkInTime,
        to_time: editOccupyingForm.checkOutTime,
      };

      if (amountUpdate?.changed) {
        updatePayload.amount = amountUpdate.amount;
        updatePayload.service = amountUpdate.service;
        updatePayload.cgst = amountUpdate.cgst;
        updatePayload.sgst = amountUpdate.sgst;
        updatePayload.igst = amountUpdate.igst;
        updatePayload.gst = amountUpdate.gst;
        updatePayload.total = amountUpdate.total;
        updatePayload.original_amount = amountUpdate.original_amount;
        updatePayload.remaining_amount = amountUpdate.remaining_amount;
        if (
          amountUpdate.remaining_amount > 0 &&
          editingOccupyingBooking.paymentStatus === 'completed'
        ) {
          updatePayload.payment_status = 'pending';
        }
      }

      const response = await fetch(`${NODE_BACKEND_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Update failed');
      }

      toast({
        title: 'Updated',
        description: amountUpdate?.changed
          ? `Checkout updated. New total ₹${amountUpdate.total.toLocaleString('en-IN')}${
              amountUpdate.delta > 0
                ? ` (+₹${amountUpdate.delta.toLocaleString('en-IN')} for ${amountUpdate.newNights - amountUpdate.oldNights} extra night${amountUpdate.newNights - amountUpdate.oldNights === 1 ? '' : 's'})`
                : amountUpdate.delta < 0
                  ? ` (−₹${Math.abs(amountUpdate.delta).toLocaleString('en-IN')})`
                  : ''
            }`
          : `Checkout set to ${formatBookingDateTime(editOccupyingForm.checkOutDate, editOccupyingForm.checkOutTime)}`,
      });
      closeOccupyingBookingEdit();
      window.dispatchEvent(new Event(BOOKINGS_UPDATED_EVENT));
      await fetchRooms();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not save checkout date/time.',
        variant: 'destructive',
      });
    } finally {
      setSavingOccupyingEdit(false);
    }
  };

  const handleEditOccupyingBooking = openOccupyingBookingEdit;

  const editStayAmountPreview = useMemo(() => {
    if (!editingOccupyingBooking || !editOccupyingForm.checkInDate || !editOccupyingForm.checkOutDate) {
      return null;
    }
    if (!canRecalculateBookingAmount(editingOccupyingBooking)) return null;
    return recalculateBookingAmounts(
      editingOccupyingBooking,
      editOccupyingForm.checkInDate,
      editOccupyingForm.checkOutDate
    );
  }, [editingOccupyingBooking, editOccupyingForm.checkInDate, editOccupyingForm.checkOutDate]);

  // ========== MULTI-SELECT FUNCTIONS ==========
  const toggleRoomSelection = (room: Room) => {
    setSelectedRoomsForMulti(prev => {
      const exists = prev.find(r => r.roomId === room.roomId);
      if (exists) {
        return prev.filter(r => r.roomId !== room.roomId);
      } else {
        return [...prev, room];
      }
    });
  };

  // const toggleSelectAll = () => {
  //   if (selectAll) {
  //     setSelectedRoomsForMulti([]);
  //   } else {
  //     setSelectedRoomsForMulti(filteredRooms);
  //   }
  //   setSelectAll(!selectAll);
  // };


  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRoomsForMulti([]);
    } else {
      // Only select rooms that are available for the selected date
      const availableRoomsOnly = filteredRooms.filter(room => {
        const roomBookings = getRoomBookingsForRoom(room);

        const isMaintenance = roomBookings.some(booking =>
          booking.status?.toLowerCase() === 'maintenance' && isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking)
        );

        const isBlocked = !isMaintenance && roomBookings.some(booking =>
          booking.status?.toLowerCase() === 'blocked' && isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking)
        );

        const isAdvanceBooked = !isMaintenance && !isBlocked && roomBookings.some(booking =>
          booking.isAdvanceBooking &&
          ['confirmed', 'pending'].includes(String(booking.status || '').toLowerCase()) &&
          isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking)
        );

        const isRegularBooked = !isMaintenance && !isBlocked && !isAdvanceBooked && roomBookings.some(booking => {
          if (booking.isAdvanceBooking) return false;
          if (!isBookingBlockingRoom(booking)) return false;
          return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
        });

        return !isMaintenance && !isBlocked && !isAdvanceBooked && !isRegularBooked;
      });

      setSelectedRoomsForMulti(availableRoomsOnly);
    }
    setSelectAll(!selectAll);
  };

  const clearRoomSelection = () => {
    setSelectedRoomsForMulti([]);
    setMultiSelectMode(false);
    setSelectAll(false);
  };

  const handleMultiBookingSuccess = () => {
    setShowMultiBookingForm(false);
    setSelectedRoomsForMulti([]);
    setMultiSelectMode(false);
    setSelectAll(false);
    fetchRooms();
    toast({
      title: "Success",
      description: `Multiple rooms booked successfully`,
    });
  };

  // ========== GROUP BOOKING FUNCTIONS ==========
  const fetchGroupBookings = async (groupId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/bookings/group/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setGroupBookings(result.data);
        setSelectedGroupId(groupId);
        setShowGroupBookings(true);
      }
    } catch (error) {
      console.error('Error fetching group bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch group bookings",
        variant: "destructive"
      });
    }
  };

  // ========== AVAILABILITY CALCULATION ==========
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

      const dateToCheck = new Date(`${checkDate}T12:00:00`);

      rooms.forEach(room => {
        const roomBookings = bookings.filter((booking) => bookingMatchesRoom(booking, room));

        const hasBooking = roomBookings.some(booking => {
          if (!isBookingBlockingRoom(booking)) {
            return false;
          }

          try {
            const checkInDate = booking.checkIn || booking.fromDate;
            const checkOutDate = booking.checkOut || booking.toDate;

            if (!checkInDate || !checkOutDate) {
              return false;
            }

            if (checkDateEnd && checkDateEnd !== checkDate) {
              const rangeStart = new Date(`${checkDate}T12:00:00`);
              const rangeEnd = new Date(`${checkDateEnd}T12:00:00`);
              const cursor = new Date(rangeStart);
              while (cursor.getTime() <= rangeEnd.getTime()) {
                if (isDateBooked(cursor, checkInDate, checkOutDate, booking)) {
                  return true;
                }
                cursor.setDate(cursor.getDate() + 1);
              }
              return false;
            }

            return isDateBooked(dateToCheck, checkInDate, checkOutDate, booking);
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
          if (!bookingMatchesRoom(booking, room)) return false;
          if (!isBookingBlockingRoom(booking)) return false;

          try {
            const checkInDate = booking.checkIn || booking.fromDate;
            const checkOutDate = booking.checkOut || booking.toDate;

            if (!checkInDate || !checkOutDate) return false;

            return isDateBooked(dateToCheck, checkInDate, checkOutDate, booking);
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

  // ========== DATA FETCHING ==========
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
              customerPhone: ab.customer_phone || ab.customerPhone || '',
              checkIn: toCalendarDateString(ab.from_date || ab.fromDate) || '',
              checkOut: toCalendarDateString(ab.to_date || ab.toDate) || '',
              status: ab.status || 'pending',
              totalAmount: Number(ab.total) || 0,
              paymentStatus: ab.payment_status || ab.paymentStatus || 'pending',
              idImage: ab.id_image || ab.idImage || null,
              isAdvanceBooking: true,
              bookingType: 'advance',
              advanceAmount: Number(ab.advance_amount) || 0,
              remainingAmount: Number(ab.remaining_amount) || 0,
              advanceExpiryDate: ab.advance_expiry_date || ab.advanceExpiryDate || null,
              fromDate: toCalendarDateString(ab.from_date || ab.fromDate),
              toDate: toCalendarDateString(ab.to_date || ab.toDate),
              checkInTime: ab.from_time || ab.fromTime || '14:00',
              checkOutTime: ab.to_time || ab.toTime || '12:00',
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
              const roomBookings = bookingsData.filter(
                (booking: any) => {
                  return booking.room_id === room.id ||
                    booking.room_id === room.room_number ||
                    booking.room_number === room.room_number;
                }
              );

              const isBookedToday = roomBookings.some((booking: any) => {
                const mapped: Booking = {
                  id: String(booking.id),
                  roomId: String(booking.room_id ?? booking.roomId ?? ''),
                  roomNumber: String(booking.room_number ?? booking.roomNumber ?? ''),
                  customerName: booking.customer_name || '',
                  checkIn: booking.from_date || booking.checkIn || '',
                  checkOut: booking.to_date || booking.checkOut || '',
                  checkInTime: booking.from_time || booking.fromTime || '14:00',
                  checkOutTime: booking.to_time || booking.toTime || '12:00',
                  status: booking.status || 'booked',
                  totalAmount: Number(booking.total) || 0,
                  paymentStatus: booking.payment_status || 'pending',
                  isAdvanceBooking: !!(booking.is_advance_booking || booking.isAdvanceBooking),
                };
                if (!isBookingBlockingRoom(mapped)) return false;
                return isBookingOccupyingDate(toBookingLike(mapped), new Date());
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

        const roomId = String(
          booking.room_id ??
            normalizedBooking.room_id ??
            normalizedBooking.roomid ??
            roomNumber ??
            `room-${index}`
        );
        const checkInDate = toCalendarDateString(
          normalizedBooking.from_date ||
            normalizedBooking.checkin ||
            normalizedBooking.start_date ||
            normalizedBooking.fromdate ||
            booking.checkIn
        );
        const checkOutDate = toCalendarDateString(
          normalizedBooking.to_date ||
            normalizedBooking.checkout ||
            normalizedBooking.end_date ||
            normalizedBooking.todate ||
            booking.checkOut
        );

        return {
          id: normalizedBooking.id || normalizedBooking.bookingid || booking.id || `booking-${Date.now()}-${index}`,
          roomId: roomId,
          roomNumber: String(booking.room_number ?? normalizedBooking.room_number ?? roomNumber ?? 'Unknown'),
          customerName: normalizedBooking.customer_name || normalizedBooking.customername || normalizedBooking.customer || booking.customerName || (isBlocked ? 'System Block' : 'N/A'),
          customerPhone:
            normalizedBooking.customer_phone ||
            normalizedBooking.customerphone ||
            booking.customer_phone ||
            booking.customerPhone ||
            '',
          checkIn: checkInDate || toCalendarDateString(new Date()),
          checkOut: checkOutDate || toCalendarDateString(new Date()),
          checkInTime: normalizedBooking.from_time || booking.from_time || '14:00',
          checkOutTime: normalizedBooking.to_time || booking.to_time || '12:00',
          status: statusLower,
          amount: Number(normalizedBooking.amount) || Number(booking.amount) || 0,
          service: Number(normalizedBooking.service) || Number(booking.service) || 0,
          cgst: Number(normalizedBooking.cgst) || Number(booking.cgst) || 0,
          sgst: Number(normalizedBooking.sgst) || Number(booking.sgst) || 0,
          igst: Number(normalizedBooking.igst) || Number(booking.igst) || 0,
          gst: Number(normalizedBooking.gst) || Number(booking.gst) || 0,
          originalAmount:
            Number(normalizedBooking.original_amount) ||
            Number(booking.original_amount) ||
            Number(normalizedBooking.amount) ||
            0,
          totalAmount: Number(normalizedBooking.total) || Number(normalizedBooking.amount) || Number(booking.totalAmount) || 0,
          paymentStatus: normalizedBooking.payment_status || normalizedBooking.paymentstatus || booking.paymentStatus || (isBlocked ? 'none' : 'pending'),
          idImage: normalizedBooking.id_image || normalizedBooking.idimage || booking.idImage || null,
          isAdvanceBooking: isAdvance,
          advanceAmountPaid:
            Number(normalizedBooking.advance_amount_paid) ||
            Number(booking.advance_amount_paid) ||
            0,
          advanceAmount:
            Number(normalizedBooking.advance_amount_paid) ||
            Number(booking.advance_amount_paid) ||
            Number(normalizedBooking.advance_amount) ||
            Number(booking.advanceAmount) ||
            0,
          remainingAmount:
            Number(normalizedBooking.remaining_amount) ||
            Number(booking.remaining_amount) ||
            Number(booking.remainingAmount) ||
            0,
          advanceExpiryDate: normalizedBooking.advance_expiry_date || booking.advanceExpiryDate || null,
          bookingType: bookingType,
          fromDate: checkInDate,
          toDate: checkOutDate,
          groupBookingId: normalizedBooking.group_booking_id || booking.groupBookingId
        };
      });

      roomsData.sort((a, b) => compareRoomNumbers(a.number, b.number));
      setRooms(roomsData);
      setBookings(transformedBookings);

      calculateAvailability(new Date());

      if (roomsData.length > 0) {
        const advanceCount = transformedBookings.filter(b => b.isAdvanceBooking).length;
        const maintenanceCount = transformedBookings.filter(b => b.status === 'maintenance').length;
        const blockedCount = transformedBookings.filter(b => b.status === 'blocked').length;
        const groupCount = transformedBookings.filter(b => b.groupBookingId).length;
        toast({
          title: "Data Loaded",
          description: `Loaded ${roomsData.length} rooms, ${transformedBookings.length} bookings (${groupCount} group bookings)`,
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

  // ========== EFFECTS ==========
  useEffect(() => {
    const handleBookingStatusChange = (event: Event) => {
      console.log('🔄 Booking status changed, refreshing rooms data...', (event as CustomEvent).detail);
      fetchRooms();
    };
    const handleBookingsUpdated = () => {
      console.log('🔄 Bookings updated (checkout), refreshing rooms...');
      fetchRooms();
    };

    window.addEventListener('booking-status-changed', handleBookingStatusChange);
    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleBookingsUpdated);

    return () => {
      window.removeEventListener('booking-status-changed', handleBookingStatusChange);
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleBookingsUpdated);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setAvailabilityClock((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [userSource, userPlan]);

  useEffect(() => {
    if (rooms.length > 0 && bookings.length > 0) {
      console.log('🔄 Recalculating availability...');
      calculateAvailability(selectedDate);
    }
  }, [rooms, bookings, selectedDate, availabilityClock]);

  useEffect(() => {
    setBookingPage(1);
  }, [searchTerm, bookingListFilter]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      setCalendarWeekStart(startOfDay(new Date()));
    }
  }, [viewMode]);

  const calendarWeekDays = useMemo(
    () => getCalendarWeekDays(calendarWeekStart, calendarWeekCount),
    [calendarWeekStart, calendarWeekCount]
  );

  const calendarDaySpan = calendarWeekCount * CALENDAR_WEEK_DAYS;

  const canGoPrevCalendarWeek =
    startOfDay(calendarWeekStart).getTime() > startOfDay(new Date()).getTime();

  const calendarWeekRangeLabel =
    calendarWeekDays.length > 0
      ? `${calendarWeekDays[0].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – ${calendarWeekDays[calendarWeekDays.length - 1].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`
      : '';

  // ========== FILTERING ==========
  const roomTypes = ['all', ...new Set(rooms.map(room => room.type))];

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = String(room.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(room.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(room.floor).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = activeRoomType === 'all' || room.type === activeRoomType;

    return matchesSearch && matchesType;
  });

  const bookingMatchesListFilter = (booking: Booking): boolean => {
    if (bookingListFilter === 'all') return true;
    if (bookingListFilter === 'advance') return !!booking.isAdvanceBooking;
    if (bookingListFilter === 'active') return canEditOccupyingBooking(booking);
    if (bookingListFilter === 'completed') {
      const s = String(booking.status || '').toLowerCase();
      return s === 'completed' || s === 'checked_out' || s === 'cancelled';
    }
    if (bookingListFilter === 'overdue') {
      return isPendingCheckoutBooking(toBookingLike(booking));
    }
    return true;
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customerPhone || '').includes(searchTerm);
    return matchesSearch && bookingMatchesListFilter(booking);
  });

  const totalPagesForBookings = Math.ceil(filteredBookings.length / recordsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * recordsPerPage,
    bookingPage * recordsPerPage
  );

  // ========== DATE HANDLERS ==========
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

  // ========== ACTION HANDLERS ==========
  const handleQuickAction = async (room: Room, mode: 'book' | 'block' | 'maintenance') => {
    const roomWithId = {
      ...room,
      roomId: room.roomId || `R-${room.number}`
    };

    const roomBookings = getRoomBookingsForRoom(roomWithId);

    let isAvailable = true;
    let conflictMessage = '';
    let conflictType = '';

    if (mode === 'book') {
      const conflictingBooking = roomBookings.find(booking => {
        if (!isBookingBlockingRoom(booking)) return false;
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

    if (booking.groupBookingId) {
      receiptContent += `\n      Group Booking ID: ${booking.groupBookingId}`;
    }

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

  const handleConvertAndBook = (room: Room, advanceBooking: any) => {
    console.log('🔄 Converting advance booking from room view:', advanceBooking);
    console.log('🔄 Room object:', room);

    toast({
      title: "Loading",
      description: "Fetching advance booking details...",
    });

    const fetchFullAdvanceBooking = async () => {
      try {
        const token = localStorage.getItem('authToken');
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

  const handleClearHoldRoom = async (room: Room, holdBooking: Booking) => {
    if (!holdBooking) {
      toast({
        title: "Error",
        description: "No block/maintenance record found for this room on selected date",
        variant: "destructive"
      });
      return;
    }

    const isMaintenanceHold = String(holdBooking.status || '').toLowerCase() === 'maintenance';

    try {
      setLoading(true);

      if (userSource === 'database') {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${NODE_BACKEND_URL}/bookings/${holdBooking.id}/unblock`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          toast({
            title: isMaintenanceHold ? '✅ Maintenance Ended' : '✅ Room Unblocked',
            description: isMaintenanceHold
              ? `Room ${room.number} is available again`
              : `Room ${room.number} has been unblocked successfully`,
          });

          await fetchRooms();

          window.dispatchEvent(new CustomEvent('booking-status-changed', {
            detail: {
              roomId: room.roomId,
              action: isMaintenanceHold ? 'maintenance_ended' : 'unblocked',
            }
          }));
        } else {
          throw new Error(result.message || (isMaintenanceHold ? 'Failed to end maintenance' : 'Failed to unblock room'));
        }
      } else {
        toast({
          title: "Coming Soon",
          description: "This action for Google Sheets will be available soon",
        });
      }
    } catch (error) {
      console.error('❌ Error clearing room hold:', error);
      toast({
        title: "Error",
        description: error.message || (isMaintenanceHold ? 'Failed to end maintenance' : 'Failed to unblock room'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /** @deprecated Use handleClearHoldRoom */
  const handleUnblockRoom = handleClearHoldRoom;

  // ========== STATUS BADGE HELPERS ==========
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
      if (!isBookingBlockingRoom(booking)) return false;
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

  // ========== RENDER ==========
  return (
    <Layout>
      <div className="page-shell space-y-2.5 sm:space-y-4">
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
                      ? 'Your Google Sheets spreadsheet has no rooms defined. Please add rooms to continue.'
                      : 'No rooms available in the database. Please add rooms to continue.'}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      onClick={() => setShowAddRoomModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rooms
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      onClick={fetchRooms}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Loading
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability Summary Card */}
        {rooms.length > 0 && (
          <Card className="shadow-sm border-border/80 overflow-hidden">
            <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 space-y-1.5 border-b border-transparent">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  className="flex items-center gap-1.5 min-w-0 flex-1 text-left active:bg-muted/60 rounded-md py-0.5 pr-1"
                  onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
                >
                  <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold leading-tight truncate">
                      Room Availability
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-0.5 shrink-0 rounded-lg border border-border/60 bg-muted/30 p-0.5">
                  <Button
                    onClick={() => setMultiSelectMode(!multiSelectMode)}
                    variant={multiSelectMode ? 'default' : 'ghost'}
                    size="icon"
                    className={`h-7 w-7 ${multiSelectMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'h-7 w-7'}`}
                    title={multiSelectMode ? 'Exit multi-select' : 'Multi-select'}
                  >
                    {multiSelectMode ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    onClick={fetchRooms}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={loading}
                    aria-label="Refresh"
                    title="Refresh"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
                    title={isAvailabilityExpanded ? 'Hide' : 'View'}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {multiSelectMode && selectedRoomsForMulti.length > 0 && (
                <Button
                  onClick={() => setShowMultiBookingForm(true)}
                  size="sm"
                  className="w-full h-7 text-[11px] bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-3 w-3 mr-1 shrink-0" />
                  Book {selectedRoomsForMulti.length} room{selectedRoomsForMulti.length > 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {isAvailabilityExpanded && (
              <CardContent className="px-2 pb-3 pt-0 sm:px-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="mx-auto w-full max-w-[min(100%,20rem)] overflow-hidden rounded-lg border bg-background p-1">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        className="w-full p-2"
                      modifiers={{
                        booked: (date) => {
                          return bookings.some(booking => {
                            if (!isBookingBlockingRoom(booking)) return false;
                            if (booking.isAdvanceBooking) return false;
                            const s = booking.status?.toLowerCase();
                            if (s === 'maintenance' || s === 'blocked') return false;
                            return isDateBooked(date, booking.checkIn, booking.checkOut, booking);
                          });
                        },
                        advanceBooked: (date) => {
                          return bookings.some(booking => {
                            if (!booking.isAdvanceBooking) return false;
                            if (booking.status === 'blocked' || booking.status === 'maintenance') return false;
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
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-100 rounded" />Advance</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-100 border border-yellow-300 rounded" />Maint.</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-100 border border-gray-400 rounded" />Blocked</span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
                      <div className="rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] text-green-700 font-medium">Available</p>
                        <p className="text-base font-bold text-green-900 leading-none mt-0.5">
                          {availabilityData.availableCount || 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] text-purple-700 font-medium">Advance</p>
                        <p className="text-base font-bold text-purple-900 leading-none mt-0.5">
                          {availabilityData.advanceBookedCount || 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] text-yellow-700 font-medium">Maint.</p>
                        <p className="text-base font-bold text-yellow-900 leading-none mt-0.5">
                          {availabilityData.maintenanceCount || 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] text-gray-700 font-medium">Blocked</p>
                        <p className="text-base font-bold text-gray-900 leading-none mt-0.5">
                          {availabilityData.blockedCount || 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] text-blue-700 font-medium">Booked</p>
                        <p className="text-base font-bold text-blue-900 leading-none mt-0.5">
                          {availabilityData.bookedCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full h-9 p-0.5 gap-1 rounded-lg bg-muted/70 mb-2">
              <TabsTrigger
                value="rooms"
                className="h-8 text-xs font-medium rounded-md px-2 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
              >
                <Bed className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Rooms ({rooms.length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="bookings"
                className="h-8 text-xs font-medium rounded-md px-2 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
              >
                <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Bookings ({bookings.length})</span>
              </TabsTrigger>
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="mt-0 space-y-2.5 sm:space-y-4">
            {rooms.length > 0 ? (
              <>
                {/* Search and Filters */}
                <Card className="shadow-sm border-border/80">
                  <CardContent className="p-2 sm:p-3 space-y-1.5">
                    <div className="flex flex-row gap-1.5 items-center">
                      <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 pointer-events-none" />
                        <Input
                          placeholder="Search…"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 h-8 text-xs sm:text-sm"
                        />
                      </div>
                      <Select value={activeRoomType} onValueChange={setActiveRoomType}>
                        <SelectTrigger className="h-8 w-[6.5rem] sm:w-32 shrink-0 text-xs sm:text-sm px-2">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === 'all' ? 'All Types' : type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2 w-full">
                      <div className="flex gap-0.5 bg-muted/60 p-0.5 rounded-md w-full sm:flex-1">
                        <Button
                          onClick={() => setViewMode('grid')}
                          size="sm"
                          className={`
                            flex-1 min-w-0 text-[11px] sm:text-xs h-7 sm:h-8 px-1 rounded-[5px] font-medium
                            ${viewMode === 'grid'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-transparent text-muted-foreground'
                            }
                          `}
                        >
                          <Bed className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0 hidden sm:block" />
                          Grid
                        </Button>
                        <Button
                          onClick={() => {
                            setCalendarWeekStart(startOfDay(new Date()));
                            setViewMode('calendar');
                          }}
                          size="sm"
                          className={`
                            flex-1 min-w-0 text-[11px] sm:text-xs h-7 sm:h-8 px-1 rounded-[5px] font-medium
                            ${viewMode === 'calendar'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-transparent text-muted-foreground'
                            }
                          `}
                        >
                          <span className="sm:hidden">Cal</span>
                          <span className="hidden sm:inline">Calendar</span>
                        </Button>
                      </div>

                      {viewMode === 'grid' && (
                        <div className="flex gap-0.5 bg-muted/60 p-0.5 rounded-md w-full sm:flex-1 sm:max-w-[10rem]">
                          <Button
                            onClick={() => setRoomViewMode('minimal')}
                            size="sm"
                            className={`
                              flex-1 min-w-0 text-[11px] sm:text-xs h-7 sm:h-8 px-1 rounded-[5px] font-medium
                              ${roomViewMode === 'minimal'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-transparent text-muted-foreground'
                              }
                            `}
                          >
                            Mini
                          </Button>
                          <Button
                            onClick={() => setRoomViewMode('detailed')}
                            size="sm"
                            className={`
                              flex-1 min-w-0 text-[11px] sm:text-xs h-7 sm:h-8 px-1 rounded-[5px] font-medium
                              ${roomViewMode === 'detailed'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-transparent text-muted-foreground'
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

                {multiSelectMode && (
                  <div className="px-2.5 py-1.5 bg-blue-50/90 border border-blue-200/80 rounded-lg flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckSquare className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-700 truncate">
                        <strong>{selectedRoomsForMulti.length}</strong> selected
                        {selectedRoomsForMulti.length > 0 && (
                          <> · ₹{selectedRoomsForMulti.reduce((sum, r) => sum + r.price, 0).toFixed(0)}/night</>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleSelectAll}
                        className="h-7 text-[11px] border-blue-300 flex-1 sm:flex-none px-2"
                      >
                        {selectAll ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearRoomSelection}
                        className="h-7 text-[11px] border-blue-300 px-2"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

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
                              if (booking.isAdvanceBooking) return false;
                              const s = String(booking.status || '').toLowerCase();
                              if (s === 'maintenance' || s === 'blocked') return false;
                              if (!isBookingBlockingRoom(booking)) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isPendingCheckout = !isMaintenance && !isBlocked && !isAdvanceBooked && roomBookings.some(booking => {
                              if (!isBookingBlockingRoom(booking)) return false;
                              if (!isPendingCheckoutBooking(toBookingLike(booking))) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isAvailableForSelectedDate = !isMaintenance && !isBlocked && !isAdvanceBooked && !isRegularBooked;

                            // Get advance booking details if exists
                            const advanceBooking = getAdvanceBookingForRoom(room, selectedDate);
                            const occupyingBooking = getOccupyingBookingForRoom(room, selectedDate);
                            const showEditBooking =
                              !isAvailableForSelectedDate &&
                              !isMaintenance &&
                              !isBlocked &&
                              canEditOccupyingBooking(occupyingBooking);

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
                              } else if (isPendingCheckout) {
                                cardColor = 'bg-orange-500';
                                borderColor = 'border-orange-600';
                                iconColor = 'text-orange-600';
                                bgLight = 'bg-orange-100';
                                statusLabel = 'Pending Checkout';
                              } else if (isRegularBooked) {
                                cardColor = 'bg-red-500';
                                borderColor = 'border-red-600';
                                iconColor = 'text-red-600';
                                bgLight = 'bg-red-100';
                                statusLabel = 'Booked';
                              }
                            }

                            const isExpanded = expandedRoom === room.roomId;
                            const isSelected = selectedRoomsForMulti.some(r => r.roomId === room.roomId);

                            return (
                              <motion.div
                                key={`${room.source}-${room.roomId}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`relative ${multiSelectMode ? 'cursor-pointer' : ''} ${isExpanded ? 'col-span-2 row-span-2 z-10' : ''}`}
                                onClick={() => {
                                  if (multiSelectMode && isAvailableForSelectedDate) {
                                    toggleRoomSelection(room);
                                  }
                                }}
                              >
                                {/* Selection Checkbox - only shown in multi-select mode */}
                                {multiSelectMode && (
                                  <div className="absolute top-1 left-1 z-20">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleRoomSelection(room)}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={!isAvailableForSelectedDate}
                                      className={`
                  h-5 w-5 rounded border-gray-300 focus:ring-blue-500
                  ${!isAvailableForSelectedDate
                                          ? 'cursor-not-allowed opacity-50 bg-gray-200'
                                          : 'text-blue-600 cursor-pointer'
                                        }
                `}
                                    />
                                  </div>
                                )}

                                {/* Selected Count Badge */}
                                {isSelected && multiSelectMode && (
                                  <div className="absolute top-1 right-1 z-20 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    {selectedRoomsForMulti.findIndex(r => r.roomId === room.roomId) + 1}
                                  </div>
                                )}

                                <Card
                                  className={`
                                    cursor-pointer transition-all duration-200 hover:shadow-lg
                                    border ${isExpanded ? borderColor : 'border-transparent'}
                                    ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}
                                    h-full flex flex-col min-h-[58px] sm:min-h-[64px]
                                    ${!isExpanded ? 'bg-opacity-30' : 'bg-white'}
                                    ${isSelected && multiSelectMode ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
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

                                    {/* Room Type & Advance Amount */}
                                    {!isExpanded && (
                                      <div className={`mt-1 flex flex-col gap-0.5 ${isMaintenance ? 'text-yellow-700' :
                                        isBlocked ? 'text-gray-700' :
                                          isAdvanceBooked ? 'text-purple-700' :
                                            isRegularBooked ? 'text-red-700' :
                                              'text-green-700'
                                        }`}>
                                        <div className="text-[9px] sm:text-[11px] font-medium truncate leading-tight">
                                          {room.type}
                                        </div>
                                        {advanceBooking ? (
                                          <div className="text-[8px] sm:text-[10px] font-bold text-purple-700 truncate leading-tight">
                                            ₹{advanceBooking.advanceAmount}
                                          </div>
                                        ) : occupyingBooking && !isAvailableForSelectedDate ? (
                                          renderStayCheckoutLine(
                                            occupyingBooking,
                                            'text-[8px] sm:text-[10px] font-semibold leading-tight'
                                          )
                                        ) : (
                                          <div className="text-[8px] sm:text-[10px] invisible leading-tight">0</div>
                                        )}
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
                                          {occupyingBooking && !isAvailableForSelectedDate && (
                                            <div className="mt-1 space-y-0.5 border-t border-black/5 pt-1">
                                              <div className="truncate">
                                                In: {formatBookingDateTime(occupyingBooking.checkIn, occupyingBooking.checkInTime, '14:00')}
                                              </div>
                                              <div className="font-semibold truncate">
                                                Out: {formatBookingDateTime(occupyingBooking.checkOut, occupyingBooking.checkOutTime)}
                                              </div>
                                            </div>
                                          )}
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
                                              Convert (₹{advanceBooking.advanceAmount})
                                            </Button>
                                          ) : isBlocked ? (
                                            <>
                                              <Button
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleClearHoldRoom(room, roomBookings.find(b =>
                                                    isDateBooked(selectedDate, b.checkIn, b.checkOut, b) && b.status === 'blocked'
                                                  ));
                                                }}
                                                className="w-full text-[8px] sm:text-[10px] h-5 sm:h-6 bg-green-600 hover:bg-green-700"
                                              >
                                                <RefreshCw className="h-2 w-2 mr-0.5" />
                                                Unblock
                                              </Button>
                                              {occupyingBooking && userSource === 'database' && (
                                                <Button
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditOccupyingBooking(occupyingBooking);
                                                  }}
                                                  className="w-full text-[8px] sm:text-[10px] h-5 sm:h-6 bg-blue-600 hover:bg-blue-700"
                                                >
                                                  <Pencil className="h-2 w-2 mr-0.5" />
                                                  Edit
                                                </Button>
                                              )}
                                            </>
                                          ) : isMaintenance ? (
                                            <>
                                              <Button
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleClearHoldRoom(room, roomBookings.find(b =>
                                                    isDateBooked(selectedDate, b.checkIn, b.checkOut, b) && b.status === 'maintenance'
                                                  ));
                                                }}
                                                className="w-full text-[8px] sm:text-[10px] h-5 sm:h-6 bg-green-600 hover:bg-green-700"
                                              >
                                                <RefreshCw className="h-2 w-2 mr-0.5" />
                                                End Mnt
                                              </Button>
                                              {occupyingBooking && userSource === 'database' && (
                                                <Button
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditOccupyingBooking(occupyingBooking);
                                                  }}
                                                  className="w-full text-[8px] sm:text-[10px] h-5 sm:h-6 bg-blue-600 hover:bg-blue-700"
                                                >
                                                  <Pencil className="h-2 w-2 mr-0.5" />
                                                  Edit
                                                </Button>
                                              )}
                                            </>
                                          ) : showEditBooking && occupyingBooking ? (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditOccupyingBooking(occupyingBooking);
                                              }}
                                              className="w-full text-[8px] sm:text-[10px] h-5 sm:h-6 bg-blue-600 hover:bg-blue-700"
                                            >
                                              <Pencil className="h-2 w-2 mr-0.5" />
                                              Checkout
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
                                              disabled={(!isAvailableForSelectedDate && !isBlocked) && !advanceBooking}
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
                                              disabled={!isAvailableForSelectedDate && !advanceBooking && !isBlocked}
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
                              if (booking.isAdvanceBooking) return false;
                              const s = String(booking.status || '').toLowerCase();
                              if (s === 'maintenance' || s === 'blocked') return false;
                              if (!isBookingBlockingRoom(booking)) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isPendingCheckout = !isMaintenance && !isBlocked && !isAdvanceBooked && roomBookings.some(booking => {
                              if (!isBookingBlockingRoom(booking)) return false;
                              if (!isPendingCheckoutBooking(toBookingLike(booking))) return false;
                              return isDateBooked(selectedDate, booking.checkIn, booking.checkOut, booking);
                            });

                            const isAvailableForSelectedDate = !isMaintenance && !isBlocked && !isAdvanceBooked && !isRegularBooked;

                            // Get advance booking details if exists
                            const advanceBooking = getAdvanceBookingForRoom(room, selectedDate);
                            const occupyingBooking = getOccupyingBookingForRoom(room, selectedDate);
                            const showEditBooking =
                              !isAvailableForSelectedDate &&
                              !isMaintenance &&
                              !isBlocked &&
                              canEditOccupyingBooking(occupyingBooking);

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
                              } else if (isPendingCheckout) {
                                statusColor = 'border-orange-300';
                                statusText = 'Pending Checkout';
                                statusBg = 'bg-orange-100 text-orange-900';
                                iconColor = 'text-orange-600';
                                statusLabel = 'PENDING CHECKOUT';
                              } else if (isRegularBooked) {
                                statusColor = 'border-red-200';
                                statusText = 'Booked';
                                statusBg = 'bg-red-100 text-red-800';
                                iconColor = 'text-red-600';
                                statusLabel = 'BOOKED';
                              }
                            }

                            const isSelected = selectedRoomsForMulti.some(r => r.roomId === room.roomId);

                            return (
                              <motion.div
                                key={`${room.source}-${room.roomId}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`relative ${multiSelectMode ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                  if (multiSelectMode && isAvailableForSelectedDate) {
                                    toggleRoomSelection(room);
                                  }
                                }}
                              >
                                {/* Selection Checkbox */}
                                {multiSelectMode && (
                                  <div className="absolute top-2 left-2 z-20">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleRoomSelection(room)}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={!isAvailableForSelectedDate} // 👈 DISABLE for unavailable rooms
                                      className={`
                  h-5 w-5 rounded border-gray-300 focus:ring-blue-500
                  ${!isAvailableForSelectedDate
                                          ? 'cursor-not-allowed opacity-50 bg-gray-200'
                                          : 'text-blue-600 cursor-pointer'
                                        }
                `}
                                    />
                                  </div>
                                )}

                                {/* Selected Badge */}
                                {isSelected && multiSelectMode && isAvailableForSelectedDate && (
                                  <div className="absolute top-2 right-2 z-20 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {selectedRoomsForMulti.findIndex(r => r.roomId === room.roomId) + 1}
                                  </div>
                                )}

                                <Card className={`hover:shadow-lg transition-shadow h-full ${statusColor} ${isSelected && multiSelectMode ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                          <Bed className={`h-5 w-5 ${iconColor}`} />
                                          {room.number}
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
                                                  ? 'Advance Booked'
                                                  : '❌ Booked')
                                            : '✅ Available'}
                                        </span>
                                      </div>
                                      {occupyingBooking && !isAvailableForSelectedDate && (
                                        <div className="mt-2 rounded-md border border-red-200 bg-white/70 p-2 text-xs">
                                          <div className="font-semibold text-red-900 mb-1 flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Stay schedule
                                          </div>
                                          <div className="grid grid-cols-1 gap-1">
                                            <div>
                                              <span className="text-muted-foreground">Check-in:</span>{' '}
                                              <span className="font-medium">
                                                {formatBookingDateTime(occupyingBooking.checkIn, occupyingBooking.checkInTime, '14:00')}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Checkout:</span>{' '}
                                              <span className="font-semibold text-red-800">
                                                {formatBookingDateTime(occupyingBooking.checkOut, occupyingBooking.checkOutTime)}
                                              </span>
                                            </div>
                                            {occupyingBooking.customerName && (
                                              <div>
                                                <span className="text-muted-foreground">Guest:</span>{' '}
                                                <span className="font-medium">{occupyingBooking.customerName}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
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
                                                  {booking.groupBookingId && (
                                                    <Badge className="ml-2 text-[8px] bg-blue-100 text-blue-800">
                                                      Group
                                                    </Badge>
                                                  )}
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
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleConvertAndBook(room, advanceBooking);
                                          }}
                                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                          Convert to Booking (Adv: ₹{advanceBooking.advanceAmount})
                                        </Button>
                                      ) : isBlocked ? (
                                        <>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleClearHoldRoom(room, roomBookings.find(b =>
                                                isDateBooked(selectedDate, b.checkIn, b.checkOut, b) && b.status === 'blocked'
                                              ));
                                            }}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Unblock Room
                                          </Button>
                                          {occupyingBooking && userSource === 'database' && (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditOccupyingBooking(occupyingBooking);
                                              }}
                                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                              <Pencil className="h-4 w-4 mr-2" />
                                              Edit Dates
                                            </Button>
                                          )}
                                        </>
                                      ) : isMaintenance ? (
                                        <>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleClearHoldRoom(room, roomBookings.find(b =>
                                                isDateBooked(selectedDate, b.checkIn, b.checkOut, b) && b.status === 'maintenance'
                                              ));
                                            }}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            End Maintenance
                                          </Button>
                                          {occupyingBooking && userSource === 'database' && (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditOccupyingBooking(occupyingBooking);
                                              }}
                                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                              <Pencil className="h-4 w-4 mr-2" />
                                              Edit Dates
                                            </Button>
                                          )}
                                        </>
                                      ) : showEditBooking && occupyingBooking ? (
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditOccupyingBooking(occupyingBooking);
                                          }}
                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Checkout
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickAction(room, 'book');
                                          }}
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickAction(room, 'block');
                                          }}
                                          disabled={!isAvailableForSelectedDate && !advanceBooking && !isBlocked}
                                          className={`flex-1 ${(!isAvailableForSelectedDate && !advanceBooking && !isBlocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          Block
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickAction(room, 'maintenance');
                                          }}
                                          disabled={!isAvailableForSelectedDate && !advanceBooking && !isBlocked}
                                          className={`flex-1 ${(!isAvailableForSelectedDate && !advanceBooking && !isBlocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          Maintenance
                                        </Button>
                                      </div>

                                      {userSource === 'database' && isAvailableForSelectedDate && (
                                        <div className="pt-2 border-t">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
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
                  <Card className="overflow-hidden border shadow-sm">
                    <CardHeader className="border-b bg-muted/30 px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2 min-w-0 w-full">
                          <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                          <p className="text-sm sm:text-base font-semibold truncate flex-1 min-w-0">
                            Room calendar
                            {filteredRooms.length > 0 && (
                              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">
                                ({filteredRooms.length})
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 w-full">
                          <div className="flex gap-0.5 bg-muted/60 p-0.5 rounded-md shrink-0">
                            {([1, 2, 3, 4] as const).map((w) => (
                              <Button
                                key={w}
                                type="button"
                                variant={calendarWeekCount === w ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-7 px-2 text-[10px] sm:text-xs min-w-[2.25rem] ${calendarWeekCount === w ? '' : 'text-muted-foreground'}`}
                                onClick={() => setCalendarWeekCount(w)}
                              >
                                {w}w
                              </Button>
                            ))}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 sm:w-auto sm:px-2 sm:gap-1"
                            onClick={() => setShowCalendarHelp((v) => !v)}
                            aria-expanded={showCalendarHelp}
                            aria-label={showCalendarHelp ? 'Hide calendar tips' : 'Show calendar tips'}
                            title={showCalendarHelp ? 'Hide tips' : 'Tips'}
                          >
                            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden sm:inline text-xs">
                              {showCalendarHelp ? 'Hide' : 'Tips'}
                            </span>
                            <ChevronDown
                              className={`hidden sm:block h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${showCalendarHelp ? 'rotate-180' : ''}`}
                            />
                          </Button>

                          <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5 flex-1 min-w-[10rem] justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              disabled={!canGoPrevCalendarWeek}
                              onClick={() => {
                                const prev = new Date(calendarWeekStart);
                                prev.setDate(prev.getDate() - calendarDaySpan);
                                const today = startOfDay(new Date());
                                setCalendarWeekStart(
                                  startOfDay(prev).getTime() < today.getTime() ? today : startOfDay(prev)
                                );
                              }}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="min-w-0 flex-1 px-0.5 text-center text-[10px] sm:text-xs font-semibold leading-tight">
                              <span className="block sm:hidden">
                                {calendarWeekCount}w · {calendarDaySpan}d
                              </span>
                              <span className="block sm:hidden text-[9px] font-normal text-muted-foreground truncate px-0.5">
                                {calendarWeekRangeLabel}
                              </span>
                              <span className="hidden sm:block truncate">{calendarWeekRangeLabel}</span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                const next = new Date(calendarWeekStart);
                                next.setDate(next.getDate() + calendarDaySpan);
                                setCalendarWeekStart(startOfDay(next));
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isDraggingDates && dragAnchorDate && dragEndDate && (
                        <div className="mt-2 flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs text-indigo-900">
                          <span className="font-medium">Selecting stay:</span>
                          <span>
                            {formatDate(dragAnchorDate <= dragEndDate ? dragAnchorDate : dragEndDate)}
                            {' → '}
                            {formatDate(dragAnchorDate <= dragEndDate ? dragEndDate : dragAnchorDate)}
                          </span>
                          {calendarDragRoom && (
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-[10px]">
                              Room {calendarDragRoom.number}
                            </Badge>
                          )}
                        </div>
                      )}

                      {showCalendarHelp && (
                        <div className="mt-2 space-y-2 pt-2 border-t border-border/60">
                          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                            Choose 1–4 weeks (from today). Rooms turn green after checkout date/time even if checkout is not completed in the Checkout tab yet.
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(ROOM_CALENDAR_STATUS_STYLE) as RoomCalendarCellStatus[]).map((key) => (
                              <div
                                key={key}
                                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[10px] sm:text-xs font-medium text-foreground"
                              >
                                <span className={`h-2 w-2 rounded-full shrink-0 ${ROOM_CALENDAR_STATUS_STYLE[key].dot}`} />
                                {ROOM_CALENDAR_STATUS_STYLE[key].label}
                              </div>
                            ))}
                            <div className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-sky-900">
                              <span className="h-2 w-2 rounded-full ring-2 ring-sky-500 ring-offset-1 bg-sky-100 shrink-0" />
                              Today
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-indigo-900">
                              <span className="h-2 w-2 rounded-sm bg-indigo-400 shrink-0" />
                              Drag selection
                            </div>
                          </div>

                          <div className="text-[10px] sm:text-[11px] text-muted-foreground space-y-1">
                            <p>
                              <strong className="text-foreground">One night:</strong> click once on an emerald cell for that room (check-in that day, check-out next day).
                            </p>
                            <p>
                              <strong className="text-foreground">Multiple nights:</strong> drag across emerald cells on the same room row.
                            </p>
                            <p>
                              <strong className="text-foreground">Grid view:</strong> Alt+click today or a future day, or click a booked/blocked day (not past dates).
                            </p>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-0 sm:p-0">
                      {filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                          <Search className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="font-medium">No rooms to display</p>
                          <p className="text-sm text-muted-foreground mt-1">Adjust search or add rooms.</p>
                        </div>
                      ) : (
                        <div className="overflow-auto max-h-[min(70vh,720px)] isolate">
                          <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm min-w-max">
                            <thead className="sticky top-0 z-20">
                              <tr>
                                <th className="sticky left-0 z-[50] w-[3.5rem] min-w-[3.5rem] max-w-[3.5rem] border-b border-r border-border bg-muted px-1 py-1.5 text-center text-[10px] font-semibold uppercase text-muted-foreground shadow-[2px_0_6px_-2px_rgba(0,0,0,0.1)]">
                                  Rm
                                </th>
                                {calendarWeekDays.map((date, dayIndex) => {
                                  const dayOfWeek = date.getDay();
                                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                  const isToday = isTodayCalendarDate(date);
                                  const isWeekBoundary = dayIndex > 0 && dayIndex % 7 === 0;
                                  return (
                                    <th
                                      key={date.toISOString()}
                                      className={`min-w-[2.25rem] sm:min-w-[2.5rem] border-b border-border bg-muted px-0.5 py-1 text-center font-medium ${
                                        isWeekBoundary ? 'border-l-2 border-l-primary/25' : ''
                                      } ${
                                        isToday
                                          ? 'bg-sky-100 text-sky-900'
                                          : isWeekend
                                            ? 'bg-muted text-muted-foreground'
                                            : 'text-foreground'
                                      }`}
                                    >
                                      <div className="text-[10px] font-normal uppercase opacity-70">
                                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                      </div>
                                      <div className={isToday ? 'font-bold' : ''}>
                                        {date.getDate()}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRooms.map((room, rowIndex) => {
                                const rowStripeBg =
                                  rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted';
                                return (
                                <tr key={room.roomId}>
                                  <td
                                    className={`sticky left-0 z-[40] w-[3.5rem] min-w-[3.5rem] max-w-[3.5rem] border-b border-r border-border px-1 py-1 font-medium shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] ${rowStripeBg}`}
                                    title={`Room ${room.number} · ${room.type}`}
                                  >
                                    <div className="leading-none text-center">
                                      <div className="font-bold text-xs">#{room.number}</div>
                                      <div className="text-[8px] text-muted-foreground truncate mt-0.5 max-w-[3.25rem] mx-auto">
                                        {room.type}
                                      </div>
                                    </div>
                                  </td>
                                  {calendarWeekDays.map((date, dayIndex) => {
                                    const cellStatus = getRoomCalendarCellStatus(room, date);
                                    const style = ROOM_CALENDAR_STATUS_STYLE[cellStatus];
                                    const isAvailableCell = cellStatus === 'available';
                                    const inDragSelection = isDateInDragSelection(date, room);
                                    const isPast = isPastCalendarDate(date);
                                    const isToday = isTodayCalendarDate(date);
                                    const statusLabel = style.label;

                                    const isWeekBoundary = dayIndex > 0 && dayIndex % 7 === 0;

                                    let cellClass = `relative z-0 h-8 w-8 sm:h-9 sm:w-9 border-b border-r border-border p-0 select-none transition-colors ${style.cell} ${isWeekBoundary ? 'border-l-2 border-l-primary/25' : ''}`;

                                    if (inDragSelection) {
                                      cellClass =
                                        `relative h-8 w-8 sm:h-9 sm:w-9 border-b border-r p-0 select-none bg-indigo-200 border-indigo-400 text-indigo-950 ring-2 ring-inset ring-indigo-500 shadow-inner ${isWeekBoundary ? 'border-l-2 border-l-indigo-400' : ''}`;
                                    } else if (isToday && isAvailableCell) {
                                      cellClass += ' ring-2 ring-sky-400 ring-inset';
                                    }

                                    if (isPast) {
                                      cellClass += ' opacity-55 saturate-50';
                                    }

                                    if (isAvailableCell && !isPast) {
                                      cellClass += ' cursor-crosshair';
                                    } else {
                                      cellClass += ' cursor-default';
                                    }

                                    return (
                                      <td
                                        key={date.toISOString()}
                                        className={cellClass}
                                        onMouseDown={(e) => {
                                          if (!isAvailableCell || isPast || e.button !== 0) return;
                                          e.preventDefault();
                                          const day = startOfDay(date);
                                          calendarDragRef.current = {
                                            isDragging: true,
                                            moved: false,
                                            skipBook: e.altKey,
                                            anchor: day,
                                            end: day,
                                            room,
                                          };
                                          setIsDraggingDates(true);
                                          setDragAnchorDate(day);
                                          setDragEndDate(day);
                                          setCalendarDragRoom(room);
                                        }}
                                        onMouseEnter={() => {
                                          if (!calendarDragRef.current.isDragging) return;
                                          if (calendarDragRef.current.room?.roomId !== room.roomId) return;
                                          if (!isAvailableCell || isPast) return;
                                          calendarDragRef.current.moved = true;
                                          calendarDragRef.current.end = startOfDay(date);
                                          setDragEndDate(startOfDay(date));
                                        }}
                                        onClick={(e) => {
                                          if (calendarDragJustBookedRef.current) {
                                            calendarDragJustBookedRef.current = false;
                                            return;
                                          }
                                          if (isPast) {
                                            toast({
                                              title: 'Past date',
                                              description:
                                                'Bookings start from today. Use today or a future date in the calendar.',
                                            });
                                            return;
                                          }
                                          if (isAvailableCell && !e.altKey) return;
                                          setSelectedDate(date);
                                          setViewMode('grid');
                                          calculateAvailability(date);
                                        }}
                                        title={`${date.toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                        })}\nRoom ${room.number}: ${statusLabel}${
                                          isPast
                                            ? '\nPast date — cannot book'
                                            : isAvailableCell
                                              ? '\nClick = 1 night · Drag = more nights · Alt+click = grid'
                                              : '\nClick = open grid for this date'
                                        }`}
                                      >
                                        <span
                                          className={`absolute bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full ${
                                            inDragSelection ? 'bg-indigo-600' : style.dot
                                          }`}
                                          aria-hidden
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
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
          <TabsContent value="bookings" className="mt-0 space-y-2.5 sm:space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search bookings by customer name or room number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={bookingListFilter}
                    onValueChange={(value) =>
                      setBookingListFilter(
                        value as 'all' | 'active' | 'completed' | 'advance' | 'overdue'
                      )
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter records" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All records</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="overdue">Overdue checkout</SelectItem>
                      <SelectItem value="advance">Advance bookings</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bookingListFilter !== 'all' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing {filteredBookings.length} of {bookings.length} bookings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Group Bookings Summary */}
            {/* {bookings.filter(b => b.groupBookingId).length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600">Group Bookings</Badge>
                    <span className="text-sm text-blue-700">
                      {bookings.filter(b => b.groupBookingId).length} bookings in groups
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(bookings.map(b => b.groupBookingId).filter(Boolean))].map(groupId => (
                      <Button
                        key={groupId}
                        size="sm"
                        variant="outline"
                        onClick={() => fetchGroupBookings(groupId!)}
                        className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        View Group {groupId?.slice(-6)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Bookings List — compact table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading bookings...</span>
              </div>
            ) : bookings.length > 0 ? (
              filteredBookings.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-auto rounded-md border bg-background">
                  <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                      <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="p-2 w-[38%] min-w-[140px]">Customer</th>
                        <th className="p-2 w-[18%] min-w-[100px]">Action</th>
                        <th className="p-2 w-[18%]">Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((booking) => {
                        const overdue = isPendingCheckoutBooking(toBookingLike(booking));
                        const checkInLabel = booking.checkIn
                          ? new Date(booking.checkIn).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—';
                        return (
                        <tr
                          key={booking.id}
                          className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${overdue ? 'bg-orange-50/60' : ''}`}
                        >
                          <td className="p-2 align-middle min-w-[140px]">
                            <div
                              className="font-medium text-sm truncate"
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
                                In: {checkInLabel}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 align-middle">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs shrink-0"
                                onClick={() => handleViewBooking(booking)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                              {canEditOccupyingBooking(booking) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs shrink-0"
                                  onClick={() => handleEditOccupyingBooking(booking)}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap text-xs">
                            {booking.checkOut
                              ? formatBookingDateTime(booking.checkOut, booking.checkOutTime)
                              : '—'}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPagesForBookings > 1 && (
                  <div className="flex items-center justify-between border-t transition-all pt-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(bookingPage - 1) * recordsPerPage + 1} to {Math.min(bookingPage * recordsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookingPage(prev => Math.max(1, prev - 1))}
                        disabled={bookingPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPagesForBookings }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={bookingPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBookingPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBookingPage(prev => Math.min(totalPagesForBookings, prev + 1))}
                        disabled={bookingPage === totalPagesForBookings}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No matching bookings</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || bookingListFilter !== 'all'
                      ? 'Try a different search or filter.'
                      : 'No bookings match your criteria'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setBookingListFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
              )
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

      {/* Group Bookings Modal */}
      {showGroupBookings && selectedGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Group Booking Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowGroupBookings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">Group ID</Badge>
                  <span className="font-mono">{selectedGroupId}</span>
                </div>

                <div className="grid gap-4">
                  {groupBookings.map((booking, index) => (
                    <Card key={booking.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Room {booking.roomNumber}</Badge>
                              {getStatusBadge(booking.status)}
                              {getPaymentBadge(booking.paymentStatus)}
                            </div>
                            <p className="text-sm">
                              <span className="font-medium">Customer:</span> {booking.customerName}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Check-in:</span> {new Date(booking.checkIn).toLocaleDateString()}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Check-out:</span> {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">₹{booking.totalAmount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Group Total:</span>
                    <span className="text-green-600">
                      ₹{groupBookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          preSelectedDateRange={
            dateRange.from
              ? {
                  from: formatDate(dateRange.from),
                  to: dateRange.to
                    ? formatDate(dateRange.to)
                    : (() => {
                        const d = new Date(dateRange.from!);
                        d.setDate(d.getDate() + 1);
                        return formatDate(d);
                      })(),
                }
              : null
          }
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

      {/* Multi-Room Booking Modal */}
      {showMultiBookingForm && (
        <MultiRoomBookingForm
          open={showMultiBookingForm}
          onClose={() => {
            setShowMultiBookingForm(false);
            setSelectedRoomsForMulti([]);
            setMultiSelectMode(false);
            setSelectAll(false);
          }}
          onSuccess={handleMultiBookingSuccess}
          selectedRooms={selectedRoomsForMulti}
          userSource={userSource}
          spreadsheetId={currentUser?.spreadsheetId}
          // defaultDate={new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)}
          defaultDate={selectedDate}
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

      {/* Edit checkout modal — stays on Book a Room tab */}
      {editingOccupyingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    {['maintenance', 'blocked'].includes(String(editingOccupyingBooking.status || '').toLowerCase())
                      ? 'Edit Dates'
                      : 'Edit Checkout'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Room {editingOccupyingBooking.roomNumber}
                    {editingOccupyingBooking.customerName ? ` · ${editingOccupyingBooking.customerName}` : ''}
                    {String(editingOccupyingBooking.status || '').toLowerCase() === 'maintenance' ? ' · Maintenance' : ''}
                    {String(editingOccupyingBooking.status || '').toLowerCase() === 'blocked' ? ' · Blocked' : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeOccupyingBookingEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Check-in date</Label>
                  <Input
                    type="date"
                    value={editOccupyingForm.checkInDate}
                    onChange={(e) => {
                      const checkInDate = e.target.value;
                      setEditOccupyingForm((prev) => {
                        const next = { ...prev, checkInDate };
                        if (prev.checkOutDate && !isCheckoutOnOrAfterCheckin(checkInDate, prev.checkOutDate)) {
                          next.checkOutDate = getMinCheckoutDate(checkInDate);
                        }
                        return next;
                      });
                    }}
                  />
                </div>
                <CustomTimePicker
                  label="Check-in time"
                  value={editOccupyingForm.checkInTime}
                  onChange={(checkInTime) =>
                    setEditOccupyingForm((prev) => ({ ...prev, checkInTime }))
                  }
                  defaultTime="14:00"
                />
                <div className="space-y-1.5">
                  <Label>Checkout date</Label>
                  <Input
                    type="date"
                    value={editOccupyingForm.checkOutDate}
                    min={getMinCheckoutDate(editOccupyingForm.checkInDate) || undefined}
                    onChange={(e) =>
                      setEditOccupyingForm((prev) => ({ ...prev, checkOutDate: e.target.value }))
                    }
                  />
                </div>
                <CustomTimePicker
                  label="Checkout time"
                  value={editOccupyingForm.checkOutTime}
                  onChange={(checkOutTime) =>
                    setEditOccupyingForm((prev) => ({ ...prev, checkOutTime }))
                  }
                  defaultTime="12:00"
                />
              </div>

              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
                Room will show available after{' '}
                <span className="font-semibold">
                  {formatBookingDateTime(editOccupyingForm.checkOutDate, editOccupyingForm.checkOutTime)}
                </span>
              </div>

              {editStayAmountPreview && (
                <div
                  className={`rounded-md border p-3 text-sm ${
                    editStayAmountPreview.changed
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4" />
                    Payment summary
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between gap-3">
                      <span>Nights</span>
                      <span>
                        {editStayAmountPreview.oldNights} → {editStayAmountPreview.newNights}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Current total</span>
                      <span>₹{editStayAmountPreview.previousTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between gap-3 font-semibold">
                      <span>New total</span>
                      <span>₹{editStayAmountPreview.total.toLocaleString('en-IN')}</span>
                    </div>
                    {editStayAmountPreview.changed && editStayAmountPreview.delta !== 0 && (
                      <div className="flex justify-between gap-3 text-amber-800">
                        <span>{editStayAmountPreview.delta > 0 ? 'Added to bill' : 'Reduced from bill'}</span>
                        <span>
                          {editStayAmountPreview.delta > 0 ? '+' : '−'}₹
                          {Math.abs(editStayAmountPreview.delta).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {editStayAmountPreview.remaining_amount > 0 && (
                      <div className="flex justify-between gap-3 pt-1 border-t border-amber-200/80">
                        <span>Balance due at checkout</span>
                        <span className="font-bold">
                          ₹{editStayAmountPreview.remaining_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                  {editStayAmountPreview.changed && (
                    <p className="mt-2 text-xs text-amber-800">
                      Extra nights are charged at the same per-night rate (room + tax). Collect the balance due at checkout.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button variant="outline" onClick={closeOccupyingBookingEdit} disabled={savingOccupyingEdit}>
                  Cancel
                </Button>
                {(userSource === 'database' || userPlan === 'pro') &&
                  String(editingOccupyingBooking.status || 'booked').toLowerCase() === 'booked' && (
                    <Button
                      type="button"
                      onClick={navigateToBookingCheckout}
                      disabled={savingOccupyingEdit}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                  )}
                <Button
                  onClick={saveOccupyingBookingEdit}
                  disabled={savingOccupyingEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingOccupyingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {['maintenance', 'blocked'].includes(String(editingOccupyingBooking.status || '').toLowerCase())
                        ? 'Save dates'
                        : 'Save checkout'}
                    </>
                  )}
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
                  <div className="font-medium">
                    {formatBookingDateTime(selectedBooking.checkIn, selectedBooking.checkInTime, '14:00')}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Checkout</Label>
                  <div className="font-medium">
                    {formatBookingDateTime(selectedBooking.checkOut, selectedBooking.checkOutTime)}
                  </div>
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

              {/* Group Booking Info */}
              {selectedBooking.groupBookingId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Group Booking Details</h3>
                  <div>
                    <span className="text-sm text-blue-600">Group ID:</span>
                    <div className="font-medium font-mono">{selectedBooking.groupBookingId}</div>
                  </div>
                </div>
              )}

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
                {canEditOccupyingBooking(selectedBooking) && (
                  <Button
                    onClick={() => {
                      handleEditOccupyingBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Checkout
                  </Button>
                )}
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

      {/* Quotation Form Modal */}
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

      {/* Add Room Modal */}
      <AddRoomModal
        open={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        spreadsheetId={currentUser?.spreadsheetId || ''}
        userSource={userSource}
        onRoomAdded={async () => {
          await fetchRooms();
          toast({
            title: "Success",
            description: "Rooms added successfully. Refreshing data...",
          });
        }}
        roomType="standard"
      />
    </Layout>
  );
};

export default RoomBooking;