

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Database, Sheet, Lock, Star } from 'lucide-react';
import BookingForm from './BookingForm';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel
} from '@/components/ui/alert-dialog';
import UpgradeModal from './UpgradeModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  roomId: string;
  spreadsheetId: string;
  userSource?: string; // 'database' or 'google_sheets'
  onClose: () => void;
}

type DailyStatusInfo = {
  status?: string;
  fromTime?: string;
  toTime?: string;
};

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzd7E4FNEstLaGqYv-YTB8IElh648K1oiQNPzWGQlsa_3DP8-Bno7OrPnL83XZ0bK7V/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

function getMonthDates(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_v, day) => {
    const date = new Date(year, month, day + 1);
    return date.toISOString().split('T')[0];
  });
}

const todayStr = new Date().toISOString().split('T')[0];

// JSONP for Google Sheets
function jsonpRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    (window as any)[callbackName] = (data: any) => {
      resolve(data);
      delete (window as any)[callbackName];
      const script = document.getElementById(callbackName);
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
    const script = document.createElement('script');
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
    script.id = callbackName;
    script.onerror = () => {
      reject(new Error('Failed to load script'));
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    document.body.appendChild(script);
  });
}

// Fetch for Backend Database
async function fetchBackendRequest(endpoint: string): Promise<any> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return await response.json();
}

// ✅ Status priority helper
function getStatusPriority(status: string): number {
  const priorities: Record<string, number> = {
    booked: 4,
    blocked: 3,
    maintenance: 2,
    available: 1,
  };
  return priorities[status] || 0;
}

// ✅ Helper function to build calendar status from bookings
function buildCalendarStatusFromBookings(bookings: any[]): Record<string, DailyStatusInfo> {
  const dailyStatus: Record<string, DailyStatusInfo> = {};

  bookings.forEach(booking => {
    try {
      const fromDate = new Date(booking.from_date);
      const toDate = new Date(booking.to_date);
      const status = (booking.status || 'booked').toLowerCase();

      // Add all dates between from_date (inclusive) and to_date (exclusive)
      const currentDate = new Date(fromDate);

      while (currentDate < toDate) {
        const dateKey = currentDate.toISOString().split('T')[0];

        // Only set status if it's higher priority or not already set
        const currentPriority = getStatusPriority(dailyStatus[dateKey]?.status || '');
        const newPriority = getStatusPriority(status);

        if (!dailyStatus[dateKey] || newPriority > currentPriority) {
          dailyStatus[dateKey] = {
            status: status,
            fromTime: booking.from_time || '12:00',
            toTime: booking.to_time || '11:00'
          };
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error("❌ Error processing booking:", booking, error);
    }
  });

  return dailyStatus;
}

// helper: add days to date string (YYYY-MM-DD)
function addDaysIso(dateIso: string, days: number) {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function RoomDetailsModal({
  open,
  roomId,
  spreadsheetId,
  userSource,
  onClose,
}: Props) {
  const isMobile = useIsMobile();
  const [room, setRoom] = useState<any>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingMode, setBookingMode] = useState<'book' | 'block' | 'maintenance'>('book');
  const [preSelectedDateRange, setPreSelectedDateRange] = useState<{ from?: string; to?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateActions, setShowDateActions] = useState(false);
  const [currentDateStatus, setCurrentDateStatus] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [calendarStatus, setCalendarStatus] = useState<Record<string, DailyStatusInfo>>({});
  // new: keep list of bookings for this room (raw booking objects)
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [canBook, setCanBook] = useState<boolean>(true);

  // debug UI toggle
  const [showDebug, setShowDebug] = useState<boolean>(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userPlan = currentUser?.plan || "basic"; // Default to basic if not specified
  const isBasicPlan = userPlan === 'basic';

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ✅ Fetch from Google Sheets (Basic Plan)
  const fetchFromGoogleSheets = async () => {
    try {
      // Fetch room details
      const roomData = await jsonpRequest(`${APPS_SCRIPT_URL}?action=getRooms&spreadsheetid=${encodeURIComponent(spreadsheetId)}`);
      const foundRoom = (roomData.rooms || []).find((r: any) => String(r.roomId) === String(roomId));

      // Fetch calendar status
      const calendarResult = await jsonpRequest(`${APPS_SCRIPT_URL}?action=getroomcalendarstatus&spreadsheetid=${encodeURIComponent(spreadsheetId)}&roomid=${encodeURIComponent(roomId)}`);

      // NEW: fetch bookings list (Apps Script must support action=getBookings)
      const allBookingsRes = await jsonpRequest(`${APPS_SCRIPT_URL}?action=getBookings&spreadsheetid=${encodeURIComponent(spreadsheetId)}`);
      let roomBookingsList: any[] = [];
      if (Array.isArray(allBookingsRes.bookings)) {
        roomBookingsList = allBookingsRes.bookings.filter((b: any) => {
          // normalize key names and match roomId
          const rec: any = {};
          Object.keys(b).forEach(k => rec[k.trim().toLowerCase()] = b[k]);
          return String(rec.roomid) === String(roomId);
        }).map((b: any) => {
          const rec: any = {};
          Object.keys(b).forEach(k => rec[k.trim().toLowerCase()] = b[k]);
          // normalize date strings to YYYY-MM-DD if possible
          try {
            // try common field names
            const rawFrom = rec.fromdate || rec.from_date || rec.from || rec.start;
            const rawTo = rec.todate || rec.to_date || rec.to || rec.end;
            rec.from_date = new Date(rawFrom).toISOString().split('T')[0];
            rec.to_date = new Date(rawTo).toISOString().split('T')[0];
          } catch (e) {
            rec.from_date = rec.fromdate || rec.from_date;
            rec.to_date = rec.todate || rec.to_date;
          }
          rec.status = (rec.status || '').toLowerCase();
          return rec;
        });
      }

      return {
        room: foundRoom || null,
        calendarStatus: calendarResult.dailyStatus || {},
        bookings: roomBookingsList
      };
    } catch (error) {
      console.error("❌ Error fetching from Google Sheets:", error);
      throw error;
    }
  };

  // ✅ Fetch from Backend Database (Pro Plan) - FIXED
  const fetchFromBackend = async () => {
    try {
      // Fetch room details
      const roomData = await fetchBackendRequest(`/rooms/${roomId}`);
      const foundRoom = roomData.data;

      // Fetch bookings for calendar status
      let calendarStatus = {};
      let roomBookingsList: any[] = [];
      try {
        const bookingsData = await fetchBackendRequest(`/bookings`);
        console.log("======== DEBUG: BACKEND RESPONSE ========");
        console.log("Full response:", bookingsData);

        // Check what status values are returned
        const allStatuses = (bookingsData.data || []).map((b: any) => b.status);
        console.log("All statuses in response:", allStatuses);
        console.log("Unique statuses:", [...new Set(allStatuses)]);
        console.log("========================================");
        const roomBookingsRaw = (bookingsData.data || []).filter((booking: any) =>
          String(booking.room_id) === String(roomId)
        );

        // normalize and build calendarStatus
        roomBookingsList = roomBookingsRaw.map((b: any) => {
          return {
            ...b,
            from_date: new Date(b.from_date).toISOString().split('T')[0],
            to_date: new Date(b.to_date).toISOString().split('T')[0],
            status: (b.status || '').toLowerCase()
          };
        });

        calendarStatus = buildCalendarStatusFromBookings(roomBookingsList.map(rb => ({
          from_date: rb.from_date,
          to_date: rb.to_date,
          status: rb.status,
          from_time: rb.from_time,
          to_time: rb.to_time
        })));
      } catch (error) {
        console.error("❌ Error fetching backend calendar data:", error);
      }

      // Transform backend data to match our interface
      const transformedRoom = foundRoom ? {
        roomId: foundRoom.id.toString(),
        number: foundRoom.room_number,
        type: foundRoom.type,
        floor: foundRoom.floor || 1,
        price: foundRoom.price || 0,
        amenities: foundRoom.amenities || '',
        status: foundRoom.status || 'available',
        source: 'database'
      } : null;

      return {
        room: transformedRoom,
        calendarStatus,
        bookings: roomBookingsList
      };
    } catch (error) {
      console.error("❌ Error in fetchFromBackend:", error);
      throw error;
    }
  };

  const fetchData = async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      let data;
      if (userSource === 'database') {
        data = await fetchFromBackend();
      } else {
        data = await fetchFromGoogleSheets();
      }
      setRoom(data.room);
      setCalendarStatus(data.calendarStatus);
      setRoomBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching room details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId && open) {
      fetchData();
      setMonthOffset(0);
      setActiveTab('overview');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, open, userSource]);

  // ---------------- Availability helpers ----------------
  function getDatesBetween(startStr: string, endStr: string) {
    const arr: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    const cur = new Date(start);
    while (cur < end) {
      arr.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }

  function isPastRange(from: string, to: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(to) <= today;
  }

  // Decide canBook: only disabled when an existing 'booked' booking exists with exactly same from/to
  useEffect(() => {
    const from = preSelectedDateRange?.from || todayStr;
    const to = preSelectedDateRange?.to || (() => {
      const d = new Date(from);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })();

    // Use console.log so it's visible by default in DevTools
    console.log(`[RoomDetailsModal] checking canBook for room ${roomId} range from=${from} to=${to}`);

    // If range is entirely in the past, disallow
    if (isPastRange(from, to)) {
      setCanBook(false);
      console.log('[RoomDetailsModal] disabled: range is in the past');
      return;
    }

    // If we have roomBookings, check for exact-match booked booking
    if (roomBookings && roomBookings.length > 0) {
      // compute to + 1 day to tolerate inclusive/exclusive differences in stored to_date
      const toPlusOne = addDaysIso(to, 1);

      const exactBooked = roomBookings.some(b => {
        const bFrom = b.from_date || b.fromdate || b.from || '';
        const bTo = b.to_date || b.todate || b.to || '';
        const status = (b.status || '').toLowerCase();

        try {
          const bFromIso = new Date(bFrom).toISOString().split('T')[0];
          const bToIso = new Date(bTo).toISOString().split('T')[0];

          // Consider exact-match if booking's from matches selected from AND
          // booking's to matches selected to OR booking's to matches selected to + 1 day.
          const toMatches = (bToIso === to) || (bToIso === toPlusOne);

          if (status === 'booked' && bFromIso === from && toMatches) {
            console.log(`[RoomDetailsModal] found exact booked booking blocking booking:`, b);
            return true;
          }
          return false;
        } catch (err) {
          // fallback string compare
          if (status === 'booked' && String(bFrom) === from && (String(bTo) === to || String(bTo) === toPlusOne)) {
            console.log(`[RoomDetailsModal] found exact booked booking (fallback string compare) blocking booking:`, b);
            return true;
          }
          return false;
        }
      });

      setCanBook(!exactBooked);
      if (exactBooked) {
        console.log('[RoomDetailsModal] disabled: exact matching booking exists');
      }
      return;
    }

    // Fallback: if we have calendarStatus only, keep previous behavior but less strict:
    // only disable if every date in range is marked booked and there is NO booking list to compare
    if (calendarStatus && Object.keys(calendarStatus).length > 0) {
      const dates = getDatesBetween(from, to);
      const allBooked = dates.every(d => (calendarStatus[d]?.status || '').toLowerCase() === 'booked');
      setCanBook(!allBooked);
      if (allBooked) {
        console.log('[RoomDetailsModal] disabled: all dates in range are marked booked in calendarStatus');
      }
      return;
    }

    // Final fallback: check room.status field
    const roomStatus = (room?.status || '').toLowerCase();
    const finalCan = room ? (roomStatus === 'available' || roomStatus === 'free' || roomStatus === '') : true;
    setCanBook(finalCan);
    if (!finalCan) {
      console.log('[RoomDetailsModal] disabled: room status indicates not available', roomStatus);
    }
  }, [calendarStatus, room, preSelectedDateRange, roomBookings]);

  // ✅ Mark available function for both sources
  const markAvailableForSelectedDate = async () => {
    if (!selectedDate) return;

    try {
      if (userSource === 'database') {
        // For database, update room status via backend API (requires endpoint)
        // Example (uncomment when endpoint is available):
        // await fetchBackendRequest(`/rooms/${roomId}/availability?date=${selectedDate}&status=available`);
      } else {
        // For Google Sheets, use JSONP method
        await jsonpRequest(`${APPS_SCRIPT_URL}?action=removeBooking&spreadsheetid=${encodeURIComponent(spreadsheetId)}&roomId=${encodeURIComponent(roomId)}&targetDate=${selectedDate}`);
      }

      await fetchData();
      setShowDateActions(false);
    } catch (error) {
      console.error('Error marking date as available:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!room && !loading) return null;

  // ------------------ Calendar Rendering Logic -------------------
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const allMonthDates = getMonthDates(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  type CalendarDayInfo = { date: string; day: number; status: string };
  const calendarDays: Array<null | CalendarDayInfo> = [];

  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);

  allMonthDates.forEach(dateStr => {
    const info: DailyStatusInfo = calendarStatus[dateStr] || {};
    calendarDays.push({
      date: dateStr,
      day: parseInt(dateStr.split("-")[2], 10),
      status: info.status || "available",
    });
  });

  function pastDate(dateStr: string) { return new Date(dateStr) < new Date(todayStr); }

  const handleDateClick = (date: string, status: string) => {
    if (isBasicPlan) return; // Basic plan users cannot click calendar
    setSelectedDate(date);
    setCurrentDateStatus(status);
    setShowDateActions(true);
  };

  const openBookingForm = (mode: 'book' | 'block' | 'maintenance', preFrom?: string, preTo?: string) => {
    setBookingMode(mode);
    setPreSelectedDateRange(preFrom || preTo ? { from: preFrom, to: preTo } : null);
    setShowBookingForm(true);
  };

  // Show storage info
  const storageInfo = userSource === 'database'
    ? { label: 'MySQL Database', icon: Database, color: 'text-green-600', bgColor: 'bg-green-100' }
    : { label: 'Google Sheets', icon: Sheet, color: 'text-blue-600', bgColor: 'bg-blue-100' };

  // trimmed calendarStatus for debug panel
  const calendarSnippet = Object.keys(calendarStatus).slice(0, 10).reduce((acc: any, k) => {
    acc[k] = calendarStatus[k];
    return acc;
  }, {});

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            'max-w-4xl max-h-[90vh] overflow-x-hidden overflow-y-auto',
            isMobile &&
              'fixed bottom-0 left-0 right-0 top-auto max-h-[92dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-b-0 p-4 pb-6'
          )}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="text-base sm:text-lg">
              Room {room?.number} - {room?.type}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Details and booking options for the selected room.
              {loading && <span className="ml-2 text-orange-600">Loading...</span>}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading room details...</span>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-0">
              <TabsList className="grid h-10 w-full grid-cols-2">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1 text-xs sm:text-sm">
                  Calendar {isBasicPlan && <Lock className="h-3 w-3 shrink-0" />}
                </TabsTrigger>
              </TabsList>

              {/* ---------------- OVERVIEW TAB ---------------- */}
              <TabsContent value="overview" className="mt-3 min-w-0">
                <Card>
                  <CardContent className="space-y-3 py-4">
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Number</p>
                        <p className="font-medium">{room?.number}</p>
                      </div>
                      <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium">{room?.type}</p>
                      </div>
                      <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Floor</p>
                        <p className="font-medium">{room?.floor}</p>
                      </div>
                      <div className="rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-medium">₹{room?.price}</p>
                      </div>
                      <div className="rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className="mt-0.5">{room?.status || 'available'}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                      <Button
                        onClick={() => openBookingForm('book')}
                        disabled={!canBook}
                        title={!canBook ? 'Room not available for the selected date range' : 'Book this room'}
                        className="w-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" /> Book
                      </Button>
                      <Button variant="outline" onClick={() => openBookingForm('block')} className="w-full">
                        Block
                      </Button>
                      <Button variant="outline" onClick={() => openBookingForm('maintenance')} className="w-full">
                        Maintenance
                      </Button>
                      <Button variant="ghost" onClick={() => setShowDebug(prev => !prev)} className="w-full">
                        {showDebug ? 'Hide debug' : 'Show debug'}
                      </Button>
                    </div>

                    {!canBook && (
                      <p className="text-sm text-muted-foreground mt-2">
                        This room is not available for the chosen date(s). Check calendar for details.
                      </p>
                    )}

                    {showDebug && (
                      <div className="mt-3 p-3 border rounded bg-gray-50 text-xs">
                        <div><strong>canBook:</strong> {String(canBook)}</div>
                        <div className="mt-2"><strong>preSelectedDateRange:</strong></div>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(preSelectedDateRange, null, 2)}</pre>
                        <div className="mt-2"><strong>roomBookings (first 10):</strong></div>
                        <pre className="whitespace-pre-wrap max-h-48 overflow-auto">{JSON.stringify(roomBookings.slice(0, 10), null, 2)}</pre>
                        <div className="mt-2"><strong>calendarStatus (snippet):</strong></div>
                        <pre className="whitespace-pre-wrap max-h-28 overflow-auto">{JSON.stringify(calendarSnippet, null, 2)}</pre>
                        <div className="mt-2 text-muted-foreground">Also check Network tab for getBookings or /bookings response.</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ---------------- CALENDAR TAB ---------------- */}
              <TabsContent value="calendar" className="mt-3 min-w-0">
                {isBasicPlan ? (
                  // Upgrade message for basic plan users
                  <Card className="border-2 border-dashed border-yellow-300">
                    <CardContent className="py-8 text-center sm:py-12">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 sm:mb-6 sm:h-20 sm:w-20">
                        <Star className="h-8 w-8 text-white sm:h-10 sm:w-10" fill="white" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-gray-800 sm:mb-3 sm:text-2xl">
                        Upgrade to Pro Plan
                      </h3>
                      <p className="mx-auto mb-5 max-w-md text-sm text-gray-600 sm:mb-6 sm:text-lg">
                        Unlock the powerful calendar view to manage your room bookings visually and efficiently.
                      </p>

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 sm:w-auto"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          <Star className="mr-2 h-5 w-5" />
                          Upgrade to Pro Now
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto"
                          onClick={() => setActiveTab('overview')}
                        >
                          Maybe Later
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Pro users see the full calendar
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-2 py-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMonthOffset(prev => prev - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="min-w-0 flex-1 truncate text-center text-sm font-semibold sm:text-base">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMonthOffset(prev => prev + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-1.5 sm:p-2">
                      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-1 sm:text-xs">
                        {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((d, i) => (
                          <div key={`${d}-${i}`} className="py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                        {calendarDays.map((day, idx) =>
                          day ? (
                            <button
                              key={idx}
                              type="button"
                              disabled={pastDate(day.date)}
                              onClick={() => handleDateClick(day.date, day.status)}
                              className={cn(
                                'flex min-h-[2.75rem] flex-col items-center justify-center rounded-md p-0.5 transition sm:min-h-[3.5rem] sm:p-1',
                                pastDate(day.date)
                                  ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                                  : day.status === 'booked'
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : day.status === 'blocked'
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : day.status === 'maintenance'
                                        ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                                        : 'border border-green-300 bg-green-100 text-green-800 hover:bg-green-200'
                              )}
                            >
                              <div className="text-xs font-bold leading-none sm:text-sm">{day.day}</div>
                              <div className="mt-0.5 hidden text-[9px] font-medium leading-tight sm:block">
                                {day.status === 'booked'
                                  ? 'Booked'
                                  : day.status === 'blocked'
                                    ? 'Blocked'
                                    : day.status === 'maintenance'
                                      ? 'Maint.'
                                      : 'Free'}
                              </div>
                            </button>
                          ) : (
                            <div key={idx} className="min-h-[2.75rem] sm:min-h-[3.5rem]" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Legend for status colors */}
                    <div className="flex flex-wrap justify-center gap-2 text-[11px] sm:gap-3 sm:text-sm">
                      <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1">
                        <div className="h-3 w-3 rounded border border-green-300 bg-green-100" />
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1">
                        <div className="h-3 w-3 rounded bg-blue-500" />
                        <span>Booked</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1">
                        <div className="h-3 w-3 rounded bg-red-500" />
                        <span>Blocked</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1">
                        <div className="h-3 w-3 rounded bg-yellow-500" />
                        <span>Maintenance</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-1">
                        <div className="h-3 w-3 rounded border border-gray-200 bg-gray-100" />
                        <span>Past</span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- Date Action Popup ---------------- */}
      {!isBasicPlan && (
        <AlertDialog open={showDateActions} onOpenChange={setShowDateActions}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Date Actions</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedDate} - {userSource === 'database' ? 'Database' : 'Google Sheets'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid gap-2 py-4">
              {currentDateStatus !== 'booked' && selectedDate && !pastDate(selectedDate) && (
                <>
                  <Button
                    onClick={() => {
                      const nextDay = new Date(selectedDate as string);
                      nextDay.setDate(nextDay.getDate() + 1);
                      openBookingForm('book', selectedDate as string, nextDay.toISOString().split('T')[0]);
                      setShowDateActions(false);
                    }}
                  > <CalendarIcon /> Book </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextDay = new Date(selectedDate as string);
                      nextDay.setDate(nextDay.getDate() + 1);
                      openBookingForm('block', selectedDate as string, nextDay.toISOString().split('T')[0]);
                      setShowDateActions(false);
                    }}
                  > Block </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextDay = new Date(selectedDate as string);
                      nextDay.setDate(nextDay.getDate() + 1);
                      openBookingForm('maintenance', selectedDate as string, nextDay.toISOString().split('T')[0]);
                      setShowDateActions(false);
                    }}
                  > Maintenance </Button>
                </>
              )}

              {['blocked', 'maintenance'].includes(currentDateStatus) && (
                <Button onClick={markAvailableForSelectedDate}>Mark Available</Button>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* ---------------- Booking Form ---------------- */}
      {showBookingForm && room && (
        <BookingForm
          room={room}
          mode={bookingMode}
          preSelectedDateRange={preSelectedDateRange}
          roomId={roomId}
          spreadsheetId={spreadsheetId}
          userSource={userSource}
          onClose={() => {
            setShowBookingForm(false);
            setPreSelectedDateRange(null);
          }}
          onSuccess={async () => {
            await fetchData();
            setShowBookingForm(false);
            setPreSelectedDateRange(null);
          }}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentHotel={{
            id: roomId,
            name: room?.hotelName || "Your Hotel",
            adminName: currentUser?.name || "",
            email: currentUser?.email || "",
            phone: currentUser?.phone || "",
          }}
        />
      )}
    </>
  );
}