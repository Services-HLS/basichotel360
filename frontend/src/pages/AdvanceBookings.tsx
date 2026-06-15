import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AdvanceBookingForm from '@/components/AdvanceBookingForm';
import MultiAdvanceBookingForm from '@/components/MultiAdvanceBookingForm';
import {
    CalendarDays,
    RefreshCw,
    Search,
    IndianRupee,
    Clock,
    User,
    Phone,
    Mail,
    CheckCircle,
    AlertCircle,
    XCircle,
    ArrowRight,
    Download,
    Eye,
    Loader2,
    Calendar as CalendarIcon,
    X,
    Layers,
    Plus,
    Home,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileImage
} from 'lucide-react';
import { format } from 'date-fns';
import BookingForm from '@/components/BookingForm';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import MultiRoomBookingForm from '@/components/MultiRoomBookingForm';

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface Room {
    id?: number;
    roomId?: string;
    number: string | number;
    type: string;
    floor?: string | number;
    price: number;
    maxOccupancy?: number;
    status?: string;
}

interface AdvanceBooking {
    id: number;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    room_number: string;
    room_type: string;
    from_date: string;
    to_date: string;
    total: number;
    advance_amount: number;
    remaining_amount: number;
    payment_method: string;
    payment_status: string;
    status: string;
    advance_expiry_date: string;
    created_at: string;
    transaction_id: string;
    room_id?: number;
    group_booking_id?: string;
    cancellation_reason?: string;
    refund_amount?: number;
    refund_method?: string;
    refund_status?: string;
    refund_processed_at?: string;
    refund_id?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    id_type?: string;
    id_number?: string;
    amount?: number;
}

const AdvanceBookings = () => {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [bookings, setBookings] = useState<AdvanceBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Date range state
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const [dateFilterType, setDateFilterType] = useState<'created' | 'booking' | 'expiry'>('created');

    const [showForm, setShowForm] = useState(false);
    const [showMultiForm, setShowMultiForm] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedAdvanceForBooking, setSelectedAdvanceForBooking] = useState<any>(null);

    // Group bookings state
    const [groupedAdvanceBookings, setGroupedAdvanceBookings] = useState<Map<string, AdvanceBooking[]>>(new Map());
    const [showGroupAdvanceModal, setShowGroupAdvanceModal] = useState(false);
    const [selectedGroupAdvance, setSelectedGroupAdvance] = useState<any>(null);

    // Refresh trigger state
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Refund details modal state
    const [showRefundDetails, setShowRefundDetails] = useState(false);
    const [selectedRefundData, setSelectedRefundData] = useState<any>(null);

    const [showMultiBookingFromGroup, setShowMultiBookingFromGroup] = useState(false);
    const [groupRoomsForConversion, setGroupRoomsForConversion] = useState<any[]>([]);
    const [groupCustomerData, setGroupCustomerData] = useState<any>(null);

    // ===== Helper function to get current user's hotel ID =====
    const getCurrentHotelId = (): string | null => {
        try {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) return null;
            const user = JSON.parse(currentUser);
            return user.hotel_id || user.hotelId || null;
        } catch (error) {
            console.error('Error getting hotel ID:', error);
            return null;
        }
    };

    // ===== Build URL with hotel_id =====
    const buildUrlWithHotelId = (baseUrl: string): string => {
        const hotelId = getCurrentHotelId();
        if (!hotelId) return baseUrl;

        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}hotel_id=${hotelId}`;
    };

    const clearDateFilter = () => {
        setDateRange({ from: undefined, to: undefined });
    };

    const filterByDateRange = (booking: AdvanceBooking) => {
        if (!dateRange?.from && !dateRange?.to) return true;

        let bookingDate: Date | null = null;

        switch (dateFilterType) {
            case 'created':
                bookingDate = booking.created_at ? new Date(booking.created_at) : null;
                break;
            case 'booking':
                bookingDate = booking.from_date ? new Date(booking.from_date) : null;
                break;
            case 'expiry':
                bookingDate = booking.advance_expiry_date ? new Date(booking.advance_expiry_date) : null;
                break;
        }

        if (!bookingDate) return false;

        bookingDate.setHours(0, 0, 0, 0);

        if (dateRange.from && dateRange.to) {
            const from = new Date(dateRange.from);
            from.setHours(0, 0, 0, 0);
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999);
            return bookingDate >= from && bookingDate <= to;
        } else if (dateRange.from) {
            const from = new Date(dateRange.from);
            from.setHours(0, 0, 0, 0);
            return bookingDate >= from;
        } else if (dateRange.to) {
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999);
            return bookingDate <= to;
        }

        return true;
    };

    // Filtered bookings
    const filteredBookings = bookings
        .filter(booking =>
            booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customer_phone?.includes(searchTerm) ||
            booking.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(filterByDateRange);

    // Pagination calculations
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBookings = filteredBookings.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange, dateFilterType]);

    // Function to group bookings
    const groupBookings = (bookingsData: AdvanceBooking[]) => {
        const grouped = new Map<string, AdvanceBooking[]>();
        bookingsData.forEach(booking => {
            if (booking.group_booking_id) {
                if (!grouped.has(booking.group_booking_id)) {
                    grouped.set(booking.group_booking_id, []);
                }
                grouped.get(booking.group_booking_id)!.push(booking);
            }
        });
        setGroupedAdvanceBookings(grouped);
        console.log('📦 Grouped advance bookings:', Object.fromEntries(grouped));
    };

    // ===== fetchBookings function with refund data =====
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            console.log('Fetching advance bookings...', new Date().toLocaleTimeString());

            const baseUrl = buildUrlWithHotelId(`${NODE_BACKEND_URL}/advance-bookings`);
            const url = `${baseUrl}&_t=${Date.now()}`;
            console.log('Fetching from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw API response:', data);

            // Transform basic booking data
            const baseBookings = (data.data || []).map((item: any) => ({
                id: item.id,
                invoice_number: item.invoice_number || `ADV-${item.id}`,
                customer_name: item.customer_name || 'Unknown',
                customer_phone: item.customer_phone || 'N/A',
                customer_email: item.customer_email || '',
                room_number: item.room_number || 'Not assigned',
                room_type: item.room_type || 'Standard',
                from_date: item.from_date,
                to_date: item.to_date,
                total: parseFloat(item.total || 0),
                advance_amount: parseFloat(item.advance_amount || 0),
                remaining_amount: parseFloat(item.remaining_amount || 0),
                payment_method: item.payment_method || 'cash',
                payment_status: item.payment_status || 'pending',
                status: item.status || 'pending',
                advance_expiry_date: item.advance_expiry_date,
                created_at: item.created_at || new Date().toISOString(),
                transaction_id: item.transaction_id,
                room_id: item.room_id,
                group_booking_id: item.group_booking_id || null,
                cancellation_reason: item.cancellation_reason || null
            }));

            // Get IDs of cancelled bookings to fetch refunds
            const cancelledBookingIds = baseBookings
                .filter((b: AdvanceBooking) => b.status === 'cancelled')
                .map((b: AdvanceBooking) => b.id);

            console.log('Cancelled booking IDs:', cancelledBookingIds);

            // Fetch refunds for cancelled bookings from the correct endpoint
            let refundMap = new Map();
            if (cancelledBookingIds.length > 0) {
                try {
                    // Build query string for multiple booking IDs
                    const bookingIdsParam = cancelledBookingIds.join(',');
                    const refundUrl = `${NODE_BACKEND_URL}/refunds/refunds/history?booking_ids=${bookingIdsParam}&booking_type=advance`;
                    console.log('Fetching refunds from:', refundUrl);

                    const refundResponse = await fetch(refundUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (refundResponse.ok) {
                        const refundResult = await refundResponse.json();
                        console.log('Refund data:', refundResult);

                        if (refundResult.success && refundResult.data) {
                            refundResult.data.forEach((refund: any) => {
                                refundMap.set(refund.booking_id, refund);
                            });
                        }
                    } else {
                        console.log('Refund endpoint returned:', refundResponse.status);
                    }
                } catch (refundError) {
                    console.error('Error fetching refunds:', refundError);
                }
            }

            // Merge refund data with bookings
            const transformedData = baseBookings.map((booking: AdvanceBooking) => {
                if (booking.status === 'cancelled') {
                    const refund = refundMap.get(booking.id);
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

            console.log('Transformed bookings with refund data:', transformedData);
            setBookings(transformedData);
            groupBookings(transformedData);

            // Fetch stats
            const statsBaseUrl = buildUrlWithHotelId(`${NODE_BACKEND_URL}/advance-bookings/stats`);
            const statsUrl = `${statsBaseUrl}&_t=${Date.now()}`;

            const statsRes = await fetch(statsUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                console.log('Stats data:', statsData);
                setStats(statsData.data || {});
            }

        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast({
                title: "Error",
                description: "Failed to load advance bookings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // View refund details
    const viewRefundDetails = (booking: AdvanceBooking) => {
        if (booking.refund_id) {
            setSelectedRefundData({
                refund_amount: booking.refund_amount,
                refund_method: booking.refund_method,
                refund_status: booking.refund_status,
                processed_at: booking.refund_processed_at,
                transaction_id: booking.transaction_id,
                refund_reason: booking.cancellation_reason,
                booking_id: booking.id,
                invoice_number: booking.invoice_number,
                customer_name: booking.customer_name
            });
            setShowRefundDetails(true);
        }
    };

    // Get refund badge
    const getRefundBadge = (booking: AdvanceBooking) => {
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

    // Handle advance booking success
    const handleAdvanceBookingSuccess = async () => {
        console.log('Advance booking created, refreshing...');

        toast({
            title: "Processing",
            description: "Creating advance booking...",
        });

        setTimeout(async () => {
            try {
                await fetchBookings();
                setRefreshTrigger(prev => prev + 1);
                setShowForm(false);
                setShowMultiForm(false);

                toast({
                    title: "✅ Success",
                    description: "Advance booking created successfully",
                    variant: "default"
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to refresh bookings",
                    variant: "destructive"
                });
            }
        }, 500);
    };

    // fetchRooms function
    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem('authToken');
            console.log('Fetching rooms...');

            const url = buildUrlWithHotelId(`${NODE_BACKEND_URL}/rooms`);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            let roomsData = [];
            if (data.success && Array.isArray(data.data)) {
                roomsData = data.data;
            } else if (Array.isArray(data)) {
                roomsData = data;
            } else if (data.data && Array.isArray(data.data)) {
                roomsData = data.data;
            } else {
                roomsData = [];
            }

            const transformedRooms = roomsData.map((room: any) => ({
                id: room.id || room.room_id,
                roomId: room.id?.toString() || room.room_id?.toString() || `room-${room.room_number}`,
                number: room.room_number || room.number || 'N/A',
                type: room.type || 'Standard',
                price: parseFloat(room.price) || 0,
                maxOccupancy: room.max_occupancy || room.maxOccupancy || 2,
                floor: room.floor || 1,
                status: room.status || 'available'
            }));

            console.log('Transformed rooms:', transformedRooms);
            setRooms(transformedRooms);

        } catch (error) {
            console.error('Error fetching rooms:', error);
            toast({
                title: "Error",
                description: "Failed to load rooms. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Use refreshTrigger in useEffect
    useEffect(() => {
        fetchBookings();
    }, [refreshTrigger]);

    // Initial fetch for rooms
    useEffect(() => {
        fetchRooms();
    }, []);

    // Event listener for conversions
    useEffect(() => {
        const handleAdvanceBookingConverted = (event: CustomEvent) => {
            console.log('Advance booking converted, refreshing list...', event.detail);
            setRefreshTrigger(prev => prev + 1);
            toast({
                title: "✅ Advance Booking Converted",
                description: `Booking has been converted to regular booking`,
                variant: "default"
            });
        };

        window.addEventListener('advance-booking-converted', handleAdvanceBookingConverted as EventListener);

        return () => {
            window.removeEventListener('advance-booking-converted', handleAdvanceBookingConverted as EventListener);
        };
    }, []);

    const handleConvertAndBook = (booking: AdvanceBooking) => {
        console.log('🔄 ===== CONVERT AND BOOK DEBUG =====');
        console.log('🔄 Original booking data:', JSON.stringify(booking, null, 2));
        console.log('🔄 Booking dates:', {
            from_date: booking.from_date,
            to_date: booking.to_date,
            from_date_type: typeof booking.from_date,
            to_date_type: typeof booking.to_date
        });

        const bookingCopy = { ...booking };

        // FIX: Handle timezone correctly
        if (bookingCopy.from_date) {
            if (bookingCopy.from_date.includes('T')) {
                const date = new Date(bookingCopy.from_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                bookingCopy.from_date = `${year}-${month}-${day}`;
                console.log('🔄 Converted from_date:', {
                    original: booking.from_date,
                    parsed: date.toString(),
                    localDate: `${year}-${month}-${day}`
                });
            }
        }

        if (bookingCopy.to_date) {
            if (bookingCopy.to_date.includes('T')) {
                const date = new Date(bookingCopy.to_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                bookingCopy.to_date = `${year}-${month}-${day}`;
                console.log('🔄 Converted to_date:', {
                    original: booking.to_date,
                    parsed: date.toString(),
                    localDate: `${year}-${month}-${day}`
                });
            }
        }

        console.log('🔄 Processed booking copy:', {
            from_date: bookingCopy.from_date,
            to_date: bookingCopy.to_date
        });

        setSelectedAdvanceForBooking(bookingCopy);
        setShowBookingForm(true);
    };


    // Handle converting entire group to multi-room booking
    // const handleConvertGroupToMultiBooking = async (groupId: string, rooms: AdvanceBooking[]) => {
    //     try {
    //         setLoading(true);

    //         // Get all pending rooms in the group
    //         const pendingRooms = rooms.filter(room => room.status === 'pending');

    //         if (pendingRooms.length === 0) {
    //             toast({
    //                 title: "No Pending Rooms",
    //                 description: "All rooms in this group have already been converted",
    //                 variant: "destructive"
    //             });
    //             return;
    //         }

    //         // Get customer details from first room
    //         const customer = {
    //             name: rooms[0]?.customer_name,
    //             phone: rooms[0]?.customer_phone,
    //             email: rooms[0]?.customer_email,
    //             address: rooms[0]?.address,
    //             city: rooms[0]?.city,
    //             state: rooms[0]?.state,
    //             pincode: rooms[0]?.pincode,
    //             idType: rooms[0]?.id_type,
    //             idNumber: rooms[0]?.id_number
    //         };

    //         // Get room details for each pending booking
    //         const roomsForBooking = await Promise.all(pendingRooms.map(async (room) => {
    //             // Find the actual room details from rooms list
    //             const roomDetail = (window as any).tempRooms?.find((r: any) => 
    //             r.id?.toString() === room.room_id?.toString() || 
    //             r.number?.toString() === room.room_number?.toString()
    //         );

    //             return {
    //                 roomId: room.room_id?.toString() || '',
    //                 number: room.room_number,
    //                 type: room.room_type || 'Standard',
    //                  floor: roomDetail?.floor || 1,
    //                 price: room.amount || (room.total / (Math.ceil((new Date(room.to_date).getTime() - new Date(room.from_date).getTime()) / (1000 * 60 * 60 * 24)) || 1)),
    //                 maxOccupancy: 2
    //             };
    //         }));

    //         setGroupRoomsForConversion(roomsForBooking);
    //         setGroupCustomerData(customer);
    //         setShowMultiBookingFromGroup(true);

    //         toast({
    //             title: "Group Conversion",
    //             description: `Preparing ${pendingRooms.length} rooms for conversion. You can modify booking details before confirming.`,
    //         });

    //     } catch (error) {
    //         console.error('Error preparing group conversion:', error);
    //         toast({
    //             title: "Error",
    //             description: "Failed to prepare group conversion",
    //             variant: "destructive"
    //         });
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    const handleConvertGroupToMultiBooking = async (groupId: string, advanceRooms: AdvanceBooking[]) => {
        try {
            setLoading(true);

            // Get all pending rooms in the group
            const pendingRooms = advanceRooms.filter(room => room.status === 'pending');

            if (pendingRooms.length === 0) {
                toast({
                    title: "No Pending Rooms",
                    description: "All rooms in this group have already been converted",
                    variant: "destructive"
                });
                return;
            }

            // Get customer details from first room
            const firstRoom = pendingRooms[0];
            const customer = {
                name: firstRoom?.customer_name || '',
                phone: firstRoom?.customer_phone || '',
                email: firstRoom?.customer_email || '',
                address: firstRoom?.address || '',
                city: firstRoom?.city || '',
                state: firstRoom?.state || '',
                pincode: firstRoom?.pincode || '',
                idType: firstRoom?.id_type || 'aadhaar',
                idNumber: firstRoom?.id_number || ''
            };

            // Convert UTC dates to local dates properly
            const convertToLocalDateString = (dateStr: string): string => {
                if (!dateStr) return '';
                const utcDate = new Date(dateStr);
                const year = utcDate.getFullYear();
                const month = String(utcDate.getMonth() + 1).padStart(2, '0');
                const day = String(utcDate.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            let checkInDate = firstRoom?.from_date ? convertToLocalDateString(firstRoom.from_date) : '';
            let checkOutDate = firstRoom?.to_date ? convertToLocalDateString(firstRoom.to_date) : '';

            console.log('📅 Group dates (converted to local):', {
                originalFromDate: firstRoom?.from_date,
                originalToDate: firstRoom?.to_date,
                checkInDate,
                checkOutDate
            });

            // Prepare rooms for conversion with their advance data
            const roomsForBooking = pendingRooms.map((room) => {
                const matchedRoom = rooms.find(r =>
                    r.id?.toString() === room.room_id?.toString() ||
                    r.number?.toString() === room.room_number?.toString()
                );

                // Calculate price per night
                let pricePerNight = room.amount || 0;
                if (!pricePerNight && room.total && room.from_date && room.to_date) {
                    const checkIn = new Date(room.from_date);
                    const checkOut = new Date(room.to_date);
                    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                    pricePerNight = room.total / nights;
                }

                return {
                    roomId: room.room_id?.toString() || '',
                    number: room.room_number,
                    type: room.room_type || matchedRoom?.type || 'Standard',
                    floor: matchedRoom?.floor || 1,
                    price: pricePerNight || matchedRoom?.price || 0,
                    maxOccupancy: matchedRoom?.maxOccupancy || 2,
                    advanceData: {
                        id: room.id,  // Advance booking ID
                        advance_amount: room.advance_amount || 0,
                        total: room.total,
                        room_number: room.room_number,
                        room_id: room.room_id,
                        from_date: room.from_date,
                        to_date: room.to_date,
                        customer_name: room.customer_name,
                        customer_phone: room.customer_phone,
                        customer_email: room.customer_email,
                        invoice_number: room.invoice_number
                    }
                };
            });

            console.log('📦 Rooms for conversion with advance data:', roomsForBooking);

            setGroupRoomsForConversion(roomsForBooking);
            setGroupCustomerData(customer);
            setShowMultiBookingFromGroup(true);

            toast({
                title: "Group Conversion",
                description: `Preparing ${pendingRooms.length} rooms for conversion. Check-in: ${checkInDate}, Check-out: ${checkOutDate}`,
            });

        } catch (error) {
            console.error('Error preparing group conversion:', error);
            toast({
                title: "Error",
                description: "Failed to prepare group conversion",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = async (booking: AdvanceBooking) => {
        // Only allow deletion for pending or expired bookings
        if (booking.status !== 'pending' && booking.status !== 'expired') {
            toast({
                title: "Cannot Delete",
                description: `Cannot delete booking with status: ${booking.status}. Only pending or expired bookings can be deleted.`,
                variant: "destructive"
            });
            return;
        }

        // Confirm deletion
        const confirmed = window.confirm(
            `Are you sure you want to delete advance booking for ${booking.customer_name} (Room ${booking.room_number})?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${booking.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Advance booking for ${booking.customer_name} deleted successfully`,
                    variant: "default"
                });

                // Refresh the bookings list
                setRefreshTrigger(prev => prev + 1);
            } else {
                throw new Error(result.message || 'Failed to delete booking');
            }

        } catch (error: any) {
            console.error('Delete error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete advance booking",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };


    // View group details
    const viewGroupDetails = (groupId: string, rooms: AdvanceBooking[]) => {
        const totalAmount = rooms.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalAdvance = rooms.reduce((sum, r) => sum + (r.advance_amount || 0), 0);
        const totalRemaining = rooms.reduce((sum, r) => sum + (r.remaining_amount || 0), 0);

        setSelectedGroupAdvance({
            groupId,
            rooms,
            totalAmount,
            totalAdvance,
            totalRemaining,
            customerName: rooms[0]?.customer_name || 'Unknown',
            customerPhone: rooms[0]?.customer_phone || 'N/A'
        });
        setShowGroupAdvanceModal(true);
    };

    // getStatusBadge function
    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; class: string }> = {
            pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-800 border-green-200' },
            cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' },
            expired: { label: 'Expired', class: 'bg-gray-100 text-gray-800 border-gray-200' },
            converted: { label: 'Converted', class: 'bg-blue-100 text-blue-800 border-blue-200' }
        };
        const c = config[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
        return <Badge variant="outline" className={c.class}>{c.label}</Badge>;
    };

    // getPaymentBadge function
    const getPaymentBadge = (status: string) => {
        const config: Record<string, { label: string; class: string }> = {
            pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
            partial: { label: 'Partial', class: 'bg-blue-100 text-blue-800' },
            completed: { label: 'Paid', class: 'bg-green-100 text-green-800' }
        };
        const c = config[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
        return <Badge className={c.class}>{c.label}</Badge>;
    };

    // handleViewInvoice function
    //     const handleViewInvoice = async (booking: AdvanceBooking) => {
    //         try {
    //             setLoading(true);
    //             const token = localStorage.getItem('authToken');
    //             const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${booking.id}/invoice`, {
    //                 headers: { 'Authorization': `Bearer ${token}` }
    //             });

    //             const result = await response.json();

    //             if (result.success) {
    //                 const invoiceWindow = window.open('', '_blank');
    //                 if (invoiceWindow) {
    //                     invoiceWindow.document.write(`
    //                     <html>
    //                         <head>
    //                             <title>Invoice - ${result.data.invoiceNumber}</title>
    //                             <style>
    //                                 body { font-family: Arial, sans-serif; padding: 20px; }
    //                                 .invoice-container { max-width: 800px; margin: 0 auto; }
    //                                 .header { text-align: center; margin-bottom: 30px; }
    //                                 .hotel-logo { max-width: 150px; max-height: 80px; }
    //                                 table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    //                                 th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    //                                 th { background-color: #f2f2f2; }
    //                                 .total { font-weight: bold; font-size: 18px; }
    //                                 .footer { margin-top: 30px; text-align: center; }
    //                             </style>
    //                         </head>
    //                         <body>
    //                             <div class="invoice-container">
    //                                 <div class="header">
    //                                     ${result.data.hotel.logo ?
    //                             `<img src="${result.data.hotel.logo}" class="hotel-logo" alt="Hotel Logo">` : ''}
    //                                     <h2>${result.data.hotel.name}</h2>
    //                                     <p>${result.data.hotel.address}</p>
    //                                     <p>Phone: ${result.data.hotel.phone} | Email: ${result.data.hotel.email}</p>
    //                                     ${result.data.hotel.gstin ? `<p>GSTIN: ${result.data.hotel.gstin}</p>` : ''}
    //                                     <h3>Advance Booking Invoice</h3>
    //                                     <p>Invoice #: ${result.data.invoiceNumber}</p>
    //                                     <p>Date: ${result.data.invoiceDate}</p>
    //                                     ${result.data.expiryDate ? `<p>Valid Until: ${result.data.expiryDate}</p>` : ''}
    //                                 </div>

    //                                 <div style="margin: 20px 0;">
    //                                     <h4>Customer Details:</h4>
    //                                     <p><strong>${result.data.customer.name}</strong><br>
    //                                     Phone: ${result.data.customer.phone}<br>
    //                                     ${result.data.customer.email ? `Email: ${result.data.customer.email}<br>` : ''}
    //                                     ${result.data.customer.address ? `Address: ${result.data.customer.address}` : ''}</p>
    //                                 </div>

    //                                 <div style="margin: 20px 0;">
    //                                     <h4>Booking Details:</h4>
    //                                     <p><strong>Room:</strong> ${result.data.booking.roomNumber} (${result.data.booking.roomType})<br>
    //                                     <strong>Check-in:</strong> ${result.data.booking.fromDate} ${result.data.booking.fromTime}<br>
    //                                     <strong>Check-out:</strong> ${result.data.booking.toDate} ${result.data.booking.toTime}<br>
    //                                     <strong>Nights:</strong> ${result.data.booking.nights}<br>
    //                                     <strong>Guests:</strong> ${result.data.booking.guests}</p>
    //                                 </div>

    //                                  <table>
    //                                     <thead>
    //                                          <tr>
    //                                             <th>Description</th>
    //                                             <th style="text-align: right;">Amount (₹)</th>
    //                                          </tr>
    //                                     </thead>
    //                                     <tbody>
    //                                         ${result.data.charges.map(charge => `
    //                                              <tr>
    //                                                 <td>${charge.description}</td>
    //                                                 <td style="text-align: right;">₹${charge.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                                              </tr>
    //                                         `).join('')}
    //                                     </tbody>
    //                                     <tfoot>
    //                                          <tr>
    //                                             <td style="text-align: right;"><strong>Subtotal:</strong></td>
    //                                             <td style="text-align: right;">₹${result.data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                                          </tr>
    //                                         <tr class="total-row">
    //                                             <td style="text-align: right;"><strong>TOTAL:</strong></td>
    //                                             <td style="text-align: right;">₹${result.data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                                          </tr>
    //                                         <tr style="background-color: #e8f4fd;">
    //                                             <td style="text-align: right;"><strong>Advance Paid:</strong></td>
    //                                             <td style="text-align: right;">₹${result.data.advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                                          </tr>
    //                                         ${result.data.remainingDue > 0 ? `
    //                                             <tr style="background-color: #fff3cd;">
    //                                                 <td style="text-align: right;"><strong>Remaining Due:</strong></td>
    //                                                 <td style="text-align: right;">₹${result.data.remainingDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                                              </tr>
    //                                         ` : ''}
    //                                     </tfoot>
    //                                  </table>

    //                                 <div style="margin: 20px 0;">
    //                                     <p><strong>Payment Method:</strong> ${result.data.payment.method}<br>
    //                                     <strong>Payment Status:</strong> ${result.data.payment.status}<br>
    //                                     ${result.data.payment.transactionId ? `<strong>Transaction ID:</strong> ${result.data.payment.transactionId}<br>` : ''}
    //                                     <strong>Booking Status:</strong> ${result.data.status}</p>
    //                                 </div>

    //                                 ${result.data.notes ? `
    //                                     <div style="margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
    //                                         <p><strong>Notes:</strong> ${result.data.notes}</p>
    //                                     </div>
    //                                 ` : ''}

    //                                 <div class="footer">
    //                                     <p>${result.data.footer.note}</p>
    //                                     <p><strong>${result.data.footer.terms}</strong></p>
    //                                     <p>${result.data.footer.companyName}</p>
    //                                 </div>
    //                             </div>
    //                         </body>
    //                     </html>
    //                 `);
    //                     invoiceWindow.document.close();
    //                 }
    //             } else {
    //                 toast({
    //                     title: "Error",
    //                     description: result.message || "Failed to generate invoice",
    //                     variant: "destructive"
    //                 });
    //             }
    //         } catch (error) {
    //             console.error('Invoice generation error:', error);
    //             toast({
    //                 title: "Error",
    //                 description: "Failed to generate invoice",
    //                 variant: "destructive"
    //             });
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     // handleDownloadInvoice function
    //     const handleDownloadInvoice = async (booking: AdvanceBooking) => {
    //         try {
    //             setLoading(true);
    //             const token = localStorage.getItem('authToken');
    //             const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${booking.id}/invoice`, {
    //                 headers: { 'Authorization': `Bearer ${token}` }
    //             });

    //             const result = await response.json();

    //             if (result.success) {
    //                 const invoiceData = result.data;

    //                 const htmlContent = `
    // <!DOCTYPE html>
    // <html>
    // <head>
    //     <meta charset="UTF-8">
    //     <title>Invoice - ${invoiceData.invoiceNumber}</title>
    //     <style>
    //         body { 
    //             font-family: 'Arial', sans-serif; 
    //             margin: 30px; 
    //             color: #333;
    //             line-height: 1.4;
    //         }
    //         .invoice-container {
    //             max-width: 800px;
    //             margin: 0 auto;
    //             padding: 20px;
    //             border: 1px solid #ddd;
    //             box-shadow: 0 0 10px rgba(0,0,0,0.1);
    //         }
    //         .header {
    //             display: flex;
    //             justify-content: space-between;
    //             align-items: center;
    //             border-bottom: 2px solid #2c3e50;
    //             padding-bottom: 20px;
    //             margin-bottom: 20px;
    //         }
    //         .hotel-logo {
    //             max-width: 150px;
    //             max-height: 80px;
    //             object-fit: contain;
    //         }
    //         .hotel-details {
    //             text-align: right;
    //         }
    //         .hotel-name {
    //             font-size: 24px;
    //             font-weight: bold;
    //             color: #2c3e50;
    //             margin-bottom: 5px;
    //         }
    //         .invoice-title {
    //             font-size: 20px;
    //             font-weight: bold;
    //             color: #3498db;
    //             margin: 20px 0;
    //             text-align: center;
    //         }
    //         .details-section {
    //             display: grid;
    //             grid-template-columns: 1fr 1fr;
    //             gap: 20px;
    //             margin-bottom: 30px;
    //         }
    //         .details-box {
    //             padding: 15px;
    //             background-color: #f8f9fa;
    //             border-radius: 5px;
    //             border-left: 4px solid #3498db;
    //         }
    //         .details-label {
    //             font-weight: bold;
    //             color: #2c3e50;
    //             margin-bottom: 10px;
    //             font-size: 16px;
    //         }
    //         table {
    //             width: 100%;
    //             border-collapse: collapse;
    //             margin: 20px 0;
    //         }
    //         th {
    //             background-color: #2c3e50;
    //             color: white;
    //             padding: 12px;
    //             text-align: left;
    //         }
    //         td {
    //             padding: 10px;
    //             border-bottom: 1px solid #ddd;
    //         }
    //         .total-row {
    //             font-weight: bold;
    //             background-color: #e8f4fd;
    //         }
    //         .total-row td {
    //             border-top: 2px solid #3498db;
    //         }
    //         .footer {
    //             margin-top: 40px;
    //             text-align: center;
    //             font-size: 14px;
    //             color: #666;
    //             border-top: 1px dashed #ddd;
    //             padding-top: 20px;
    //         }
    //         .payment-status {
    //             display: inline-block;
    //             padding: 5px 10px;
    //             border-radius: 3px;
    //             font-weight: bold;
    //         }
    //         .status-pending { background-color: #fff3cd; color: #856404; }
    //         .status-partial { background-color: #cce5ff; color: #004085; }
    //         .status-completed { background-color: #d4edda; color: #155724; }
    //         .status-confirmed { background-color: #d1ecf1; color: #0c5460; }
    //         @media print {
    //             body { margin: 0; }
    //             .invoice-container { border: none; box-shadow: none; }
    //         }
    //     </style>
    // </head>
    // <body>
    //     <div class="invoice-container">
    //         <!-- Header with Logo -->
    //         <div class="header">
    //             <div>
    //                 ${invoiceData.hotel.logo ?
    //                         `<img src="${invoiceData.hotel.logo}" class="hotel-logo" alt="Hotel Logo">` :
    //                         `<h1 class="hotel-name">${invoiceData.hotel.name}</h1>`
    //                     }
    //             </div>
    //             <div class="hotel-details">
    //                 <div class="hotel-name">${invoiceData.hotel.name}</div>
    //                 <p>${invoiceData.hotel.address || ''}<br>
    //                 Phone: ${invoiceData.hotel.phone || 'N/A'}<br>
    //                 Email: ${invoiceData.hotel.email || 'N/A'}<br>
    //                 ${invoiceData.hotel.gstin ? `GSTIN: ${invoiceData.hotel.gstin}` : ''}</p>
    //             </div>
    //         </div>

    //         <!-- Invoice Title -->
    //         <div class="invoice-title">
    //             ADVANCE BOOKING INVOICE
    //         </div>

    //         <!-- Invoice Number and Date -->
    //         <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    //             <div><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</div>
    //             <div><strong>Date:</strong> ${invoiceData.invoiceDate}</div>
    //             <div><strong>Valid Until:</strong> ${invoiceData.expiryDate || 'N/A'}</div>
    //         </div>

    //         <!-- Customer and Booking Details -->
    //         <div class="details-section">
    //             <div class="details-box">
    //                 <div class="details-label">Bill To:</div>
    //                 <p><strong>${invoiceData.customer.name}</strong><br>
    //                 Phone: ${invoiceData.customer.phone}<br>
    //                 ${invoiceData.customer.email ? `Email: ${invoiceData.customer.email}<br>` : ''}
    //                 ${invoiceData.customer.address ? `Address: ${invoiceData.customer.address}` : ''}</p>
    //             </div>

    //             <div class="details-box">
    //                 <div class="details-label">Booking Details:</div>
    //                 <p><strong>Room:</strong> ${invoiceData.booking.roomNumber} (${invoiceData.booking.roomType})<br>
    //                 <strong>Check-in:</strong> ${invoiceData.booking.fromDate} ${invoiceData.booking.fromTime}<br>
    //                 <strong>Check-out:</strong> ${invoiceData.booking.toDate} ${invoiceData.booking.toTime}<br>
    //                 <strong>Nights:</strong> ${invoiceData.booking.nights}<br>
    //                 <strong>Guests:</strong> ${invoiceData.booking.guests}</p>
    //             </div>
    //         </div>

    //         <!-- Charges Table -->
    //         <table>
    //             <thead>
    //                 <tr>
    //                     <th>Description</th>
    //                     <th style="text-align: right;">Amount (₹)</th>
    //                 </tr>
    //             </thead>
    //             <tbody>
    //                 ${invoiceData.charges.map(charge => `
    //                     <tr>
    //                         <td>${charge.description}</td>
    //                         <td style="text-align: right;">₹${charge.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                     </tr>
    //                 `).join('')}
    //             </tbody>
    //             <tfoot>
    //                 <tr>
    //                     <td style="text-align: right;"><strong>Subtotal:</strong></td>
    //                     <td style="text-align: right;">₹${invoiceData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                 </tr>
    //                 <tr class="total-row">
    //                     <td style="text-align: right;"><strong>TOTAL:</strong></td>
    //                     <td style="text-align: right;">₹${invoiceData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                 </tr>
    //                 <tr style="background-color: #e8f4fd;">
    //                     <td style="text-align: right;"><strong>Advance Paid:</strong></td>
    //                     <td style="text-align: right;">₹${invoiceData.advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                 </tr>
    //                 ${invoiceData.remainingDue > 0 ? `
    //                     <tr style="background-color: #fff3cd;">
    //                         <td style="text-align: right;"><strong>Remaining Due:</strong></td>
    //                         <td style="text-align: right;">₹${invoiceData.remainingDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    //                     </tr>
    //                 ` : ''}
    //             </tfoot>
    //         </table>

    //         <!-- Payment Details -->
    //         <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
    //             <div style="display: flex; justify-content: space-between; align-items: center;">
    //                 <div>
    //                     <strong>Payment Method:</strong> ${invoiceData.payment.method}<br>
    //                     <strong>Payment Status:</strong> 
    //                     <span class="payment-status status-${invoiceData.payment.status}">
    //                         ${invoiceData.payment.status}
    //                     </span><br>
    //                     ${invoiceData.payment.transactionId ? `<strong>Transaction ID:</strong> ${invoiceData.payment.transactionId}<br>` : ''}
    //                     <strong>Booking Status:</strong> 
    //                     <span class="payment-status status-${invoiceData.status}">
    //                         ${invoiceData.status}
    //                     </span>
    //                 </div>
    //             </div>
    //         </div>

    //         <!-- Notes -->
    //         ${invoiceData.notes ? `
    //             <div style="margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
    //                 <strong>Notes:</strong> ${invoiceData.notes}
    //             </div>
    //         ` : ''}

    //         <!-- Footer -->
    //         <div class="footer">
    //             <p>${invoiceData.footer.note}</p>
    //             <p><strong>${invoiceData.footer.terms}</strong></p>
    //             <p>${invoiceData.footer.companyName}</p>
    //         </div>
    //     </div>
    // </body>
    // </html>
    //                 `;

    //                 const blob = new Blob([htmlContent], { type: 'text/html' });
    //                 const url = window.URL.createObjectURL(blob);
    //                 const link = document.createElement('a');
    //                 link.href = url;
    //                 link.download = `invoice-${booking.invoice_number}.html`;
    //                 document.body.appendChild(link);
    //                 link.click();
    //                 document.body.removeChild(link);
    //                 window.URL.revokeObjectURL(url);

    //                 toast({
    //                     title: "Success",
    //                     description: "Invoice downloaded successfully"
    //                 });
    //             } else {
    //                 toast({
    //                     title: "Error",
    //                     description: result.message || "Failed to download invoice",
    //                     variant: "destructive"
    //                 });
    //             }
    //         } catch (error) {
    //             console.error('Download error:', error);
    //             toast({
    //                 title: "Error",
    //                 description: "Failed to download invoice",
    //                 variant: "destructive"
    //             });
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     // Add this function to AdvanceBookings.tsx

    //     const handleDownloadGroupInvoice = async (groupId: string, rooms: AdvanceBooking[]) => {
    //         try {
    //             setLoading(true);
    //             const token = localStorage.getItem('authToken');

    //             // Calculate group totals
    //             const totalAmount = rooms.reduce((sum, r) => sum + r.total, 0);
    //             const totalAdvance = rooms.reduce((sum, r) => sum + r.advance_amount, 0);
    //             const totalRemaining = totalAmount - totalAdvance;

    //             // Get first room's customer details (same for all rooms in group)
    //             const customerName = rooms[0]?.customer_name || 'Unknown';
    //             const customerPhone = rooms[0]?.customer_phone || 'N/A';
    //             const customerEmail = rooms[0]?.customer_email || '';

    //             // Create combined invoice HTML
    //             const htmlContent = `
    // <!DOCTYPE html>
    // <html>
    // <head>
    //     <meta charset="UTF-8">
    //     <title>Group Invoice - ${groupId}</title>
    //     <style>
    //         body { 
    //             font-family: 'Arial', sans-serif; 
    //             margin: 30px; 
    //             color: #333;
    //             line-height: 1.4;
    //         }
    //         .invoice-container {
    //             max-width: 1000px;
    //             margin: 0 auto;
    //             padding: 20px;
    //             border: 1px solid #ddd;
    //             box-shadow: 0 0 10px rgba(0,0,0,0.1);
    //         }
    //         .header {
    //             display: flex;
    //             justify-content: space-between;
    //             align-items: center;
    //             border-bottom: 2px solid #2c3e50;
    //             padding-bottom: 20px;
    //             margin-bottom: 20px;
    //         }
    //         .hotel-name {
    //             font-size: 24px;
    //             font-weight: bold;
    //             color: #2c3e50;
    //             margin-bottom: 5px;
    //         }
    //         .invoice-title {
    //             font-size: 20px;
    //             font-weight: bold;
    //             color: #3498db;
    //             margin: 20px 0;
    //             text-align: center;
    //         }
    //         .details-section {
    //             display: grid;
    //             grid-template-columns: 1fr 1fr;
    //             gap: 20px;
    //             margin-bottom: 30px;
    //         }
    //         .details-box {
    //             padding: 15px;
    //             background-color: #f8f9fa;
    //             border-radius: 5px;
    //             border-left: 4px solid #3498db;
    //         }
    //         .details-label {
    //             font-weight: bold;
    //             color: #2c3e50;
    //             margin-bottom: 10px;
    //             font-size: 16px;
    //         }
    //         table {
    //             width: 100%;
    //             border-collapse: collapse;
    //             margin: 20px 0;
    //         }
    //         th {
    //             background-color: #2c3e50;
    //             color: white;
    //             padding: 12px;
    //             text-align: left;
    //         }
    //         td {
    //             padding: 10px;
    //             border-bottom: 1px solid #ddd;
    //         }
    //         .total-row {
    //             font-weight: bold;
    //             background-color: #e8f4fd;
    //         }
    //         .total-row td {
    //             border-top: 2px solid #3498db;
    //         }
    //         .group-total {
    //             background-color: #f0f0f0;
    //             font-weight: bold;
    //         }
    //         .footer {
    //             margin-top: 40px;
    //             text-align: center;
    //             font-size: 14px;
    //             color: #666;
    //             border-top: 1px dashed #ddd;
    //             padding-top: 20px;
    //         }
    //         @media print {
    //             body { margin: 0; }
    //             .invoice-container { border: none; box-shadow: none; }
    //         }
    //     </style>
    // </head>
    // <body>
    //     <div class="invoice-container">
    //         <!-- Header -->
    //         <div class="header">
    //             <div>
    //                 <div class="hotel-name">Hotel Management System</div>
    //                 <p>Your Hotel Address<br>Phone: +91 XXXXXXXXXX<br>Email: hotel@example.com</p>
    //             </div>
    //             <div>
    //                 <div class="hotel-name">GROUP INVOICE</div>
    //                 <p>Group ID: ${groupId.slice(-12)}<br>
    //                 Date: ${new Date().toLocaleDateString('en-IN')}<br>
    //                 Rooms: ${rooms.length}</p>
    //             </div>
    //         </div>

    //         <!-- Customer Details -->
    //         <div class="details-section">
    //             <div class="details-box">
    //                 <div class="details-label">Customer Details</div>
    //                 <p><strong>${customerName}</strong><br>
    //                 Phone: ${customerPhone}<br>
    //                 ${customerEmail ? `Email: ${customerEmail}` : ''}</p>
    //             </div>
    //             <div class="details-box">
    //                 <div class="details-label">Group Summary</div>
    //                 <p><strong>Total Rooms:</strong> ${rooms.length}<br>
    //                 <strong>Check-in Date:</strong> ${rooms[0]?.from_date || 'N/A'}<br>
    //                 <strong>Status:</strong> ${rooms[0]?.status?.toUpperCase() || 'PENDING'}</p>
    //             </div>
    //         </div>

    //         <!-- Rooms Table -->
    //         <h3>Room Details</h3>
    //         </table>
    //             <thead>
    //                 <tr>
    //                     <th>Room No.</th>
    //                     <th>Room Type</th>
    //                     <th>Dates</th>
    //                     <th style="text-align: right;">Total (₹)</th>
    //                     <th style="text-align: right;">Advance (₹)</th>
    //                     <th style="text-align: right;">Due (₹)</th>
    //                     <th>Status</th>
    //                 </tr>
    //             </thead>
    //             <tbody>
    //                 ${rooms.map(room => `
    //                     <tr>
    //                         <td>${room.room_number || 'N/A'}</td>
    //                         <td>${room.room_type || 'Standard'}</td>
    //                         <td>${room.from_date || ''} to ${room.to_date || ''}</td>
    //                         <td style="text-align: right;">₹${room.total.toLocaleString('en-IN')}</td>
    //                         <td style="text-align: right;">₹${room.advance_amount.toLocaleString('en-IN')}</td>
    //                         <td style="text-align: right;">₹${room.remaining_amount.toLocaleString('en-IN')}</td>
    //                         <td>${room.status.toUpperCase()}</td>
    //                     </tr>
    //                 `).join('')}
    //             </tbody>
    //             <tfoot>
    //                 <tr class="group-total">
    //                     <td colspan="3" style="text-align: right;"><strong>Group Total:</strong></td>
    //                     <td style="text-align: right;"><strong>₹${totalAmount.toLocaleString('en-IN')}</strong></td>
    //                     <td style="text-align: right;"><strong>₹${totalAdvance.toLocaleString('en-IN')}</strong></td>
    //                     <td style="text-align: right;"><strong>₹${totalRemaining.toLocaleString('en-IN')}</strong></td>
    //                     <td></td>
    //                 </tr>
    //             </tfoot>
    //         </table>

    //         <!-- Payment Summary -->
    //         <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
    //             <h4>Payment Summary</h4>
    //             <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
    //                 <span>Total Booking Value:</span>
    //                 <span><strong>₹${totalAmount.toLocaleString('en-IN')}</strong></span>
    //             </div>
    //             <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: green;">
    //                 <span>Total Advance Paid:</span>
    //                 <span><strong>₹${totalAdvance.toLocaleString('en-IN')}</strong></span>
    //             </div>
    //             <div style="display: flex; justify-content: space-between; color: orange;">
    //                 <span>Total Balance Due:</span>
    //                 <span><strong>₹${totalRemaining.toLocaleString('en-IN')}</strong></span>
    //             </div>
    //         </div>

    //         <!-- Footer -->
    //         <div class="footer">
    //             <p>This is a group advance booking invoice.</p>
    //             <p><strong>Terms & Conditions Apply</strong></p>
    //             <p>Thank you for choosing us!</p>
    //         </div>
    //     </div>
    // </body>
    // </html>
    //         `;

    //             // Download the invoice
    //             const blob = new Blob([htmlContent], { type: 'text/html' });
    //             const url = window.URL.createObjectURL(blob);
    //             const link = document.createElement('a');
    //             link.href = url;
    //             link.download = `group-invoice-${groupId.slice(-8)}.html`;
    //             document.body.appendChild(link);
    //             link.click();
    //             document.body.removeChild(link);
    //             window.URL.revokeObjectURL(url);

    //             toast({
    //                 title: "Success",
    //                 description: `Group invoice downloaded for ${rooms.length} rooms`
    //             });

    //         } catch (error) {
    //             console.error('Group invoice error:', error);
    //             toast({
    //                 title: "Error",
    //                 description: "Failed to generate group invoice",
    //                 variant: "destructive"
    //             });
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    // Replace handleViewInvoice function
    const handleViewInvoice = async (booking: AdvanceBooking) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${booking.id}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                const invoiceWindow = window.open('', '_blank');
                if (invoiceWindow) {
                    invoiceWindow.document.write(result.data.html);
                    invoiceWindow.document.close();
                }
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to generate invoice",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Invoice generation error:', error);
            toast({
                title: "Error",
                description: "Failed to generate invoice",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Replace handleDownloadInvoice function
    const handleDownloadInvoice = async (booking: AdvanceBooking) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${booking.id}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                const blob = new Blob([result.data.html], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${booking.invoice_number}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast({
                    title: "Success",
                    description: "Invoice downloaded successfully"
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to download invoice",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: "Error",
                description: "Failed to download invoice",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Add group invoice handler
    // const handleDownloadGroupInvoice = async (groupId: string, rooms: AdvanceBooking[]) => {
    //     try {
    //         setLoading(true);
    //         const token = localStorage.getItem('authToken');
    //         const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/group/${groupId}/invoice`, {
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });

    //         const result = await response.json();

    //         if (result.success) {
    //             const blob = new Blob([result.data.html], { type: 'text/html' });
    //             const url = window.URL.createObjectURL(blob);
    //             const link = document.createElement('a');
    //             link.href = url;
    //             link.download = `group-invoice-${groupId.slice(-8)}.html`;
    //             document.body.appendChild(link);
    //             link.click();
    //             document.body.removeChild(link);
    //             window.URL.revokeObjectURL(url);

    //             toast({
    //                 title: "Success",
    //                 description: `Group invoice downloaded for ${result.data.roomCount} rooms`
    //             });
    //         } else {
    //             toast({
    //                 title: "Error",
    //                 description: result.message || "Failed to generate group invoice",
    //                 variant: "destructive"
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Group invoice error:', error);
    //         toast({
    //             title: "Error",
    //             description: "Failed to generate group invoice",
    //             variant: "destructive"
    //         });
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Replace the existing handleDownloadGroupInvoice with this:
const handleDownloadGroupInvoice = async (groupId: string, rooms: AdvanceBooking[]) => {
    try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/group/${groupId}/invoice`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            // Open new window with HTML invoice
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(result.data.html);
                printWindow.document.close();
                // Automatically open print dialog (user can Save as PDF)
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
            toast({
                title: "Success",
                description: "Invoice opened. Press Save as PDF in print dialog.",
            });
        } else {
            toast({
                title: "Error",
                description: result.message || "Failed to generate invoice",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error('Group invoice error:', error);
        toast({
            title: "Error",
            description: "Failed to generate invoice",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
};

    // Add this helper function at the top of the component
    const isMobileApp = (): boolean => {
        return !!(window as any).ReactNativeWebView ||
            navigator.userAgent.includes('Mobile') ||
            navigator.userAgent.includes('WebView');
    };

    // Add PDF download handler for single invoice
    const handleDownloadInvoicePDF = async (booking: AdvanceBooking) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${booking.id}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('PDF generation failed');
            }

            const blob = await response.blob();

            // For React Native WebView, send base64 data
            if (isMobileApp() && (window as any).ReactNativeWebView) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    (window as any).ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DOWNLOAD_PDF',
                        data: base64Data,
                        filename: `invoice-${booking.invoice_number}.pdf`
                    }));
                };
                reader.readAsDataURL(blob);

                toast({
                    title: "Processing",
                    description: "Preparing PDF for download..."
                });
            } else {
                // For web browser
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${booking.invoice_number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast({
                    title: "Success",
                    description: "PDF downloaded successfully"
                });
            }
        } catch (error) {
            console.error('PDF download error:', error);
            toast({
                title: "Error",
                description: "Failed to download PDF",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Add PDF download handler for group invoice
    const handleDownloadGroupInvoicePDF = async (groupId: string, rooms: AdvanceBooking[]) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/group/${groupId}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('PDF generation failed');
            }

            const blob = await response.blob();

            // For React Native WebView
            if (isMobileApp() && (window as any).ReactNativeWebView) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    (window as any).ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DOWNLOAD_PDF',
                        data: base64Data,
                        filename: `group-invoice-${groupId.slice(-8)}.pdf`
                    }));
                };
                reader.readAsDataURL(blob);

                toast({
                    title: "Processing",
                    description: `Preparing group PDF for ${rooms.length} rooms...`
                });
            } else {
                // For web browser
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `group-invoice-${groupId.slice(-8)}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast({
                    title: "Success",
                    description: `Group PDF downloaded for ${rooms.length} rooms`
                });
            }
        } catch (error) {
            console.error('Group PDF download error:', error);
            toast({
                title: "Error",
                description: "Failed to download group PDF",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Pagination component
    const PaginationControls = () => {
        if (filteredBookings.length === 0) return null;

        return (
            <div className="flex flex-col gap-3 px-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                        {startIndex + 1}–{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length}
                    </span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs sm:text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-center justify-between gap-1 sm:justify-end sm:gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs sm:text-sm whitespace-nowrap px-1">
                        {currentPage}/{totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Advance Bookings</h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            {loading ? 'Loading...' : `${filteredBookings.length} bookings`}
                            {groupedAdvanceBookings.size > 0 && ` · ${groupedAdvanceBookings.size} groups`}
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
                        <Button
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            variant="outline"
                            disabled={loading}
                            size="sm"
                            className="h-9 px-2 text-xs sm:px-3 sm:text-sm"
                        >
                            <RefreshCw className={cn('h-4 w-4 sm:mr-2', loading && 'animate-spin')} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                        <Button
                            onClick={() => setShowMultiForm(true)}
                            variant="default"
                            className="h-9 bg-purple-600 px-2 text-xs hover:bg-purple-700 sm:px-3 sm:text-sm"
                            size="sm"
                        >
                            <Layers className="h-4 w-4 sm:mr-2" />
                            <span className="truncate">Multi</span>
                        </Button>
                        <Button
                            onClick={() => setShowForm(true)}
                            variant="default"
                            size="sm"
                            className="h-9 px-2 text-xs sm:px-3 sm:text-sm"
                        >
                            <CalendarDays className="h-4 w-4 sm:mr-2" />
                            <span className="truncate">Single</span>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground sm:text-sm">Today&apos;s Total</p>
                                        <p className="text-xl font-bold sm:text-2xl">{stats.total || 0}</p>
                                    </div>
                                    <CalendarDays className="h-7 w-7 shrink-0 text-blue-500 opacity-50 sm:h-8 sm:w-8" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground sm:text-sm">Advance Collected</p>
                                        <p className="text-lg font-bold tabular-nums sm:text-2xl">
                                            ₹{(stats.total_advance_collected || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <IndianRupee className="h-7 w-7 shrink-0 text-green-500 opacity-50 sm:h-8 sm:w-8" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Group Bookings Summary */}
                {groupedAdvanceBookings.size > 0 && (
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge className="bg-purple-600 text-white px-3 py-1">
                                    <Layers className="h-3 w-3 mr-1" />
                                    Group Advance Bookings
                                </Badge>
                                <span className="text-sm text-purple-700">
                                    {Array.from(groupedAdvanceBookings.values()).reduce((sum, rooms) => sum + rooms.length, 0)} rooms in {groupedAdvanceBookings.size} groups
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Array.from(groupedAdvanceBookings.entries()).map(([groupId, rooms]) => {
                                    const totalAmount = rooms.reduce((sum, r) => sum + (r.total || 0), 0);
                                    const totalAdvance = rooms.reduce((sum, r) => sum + (r.advance_amount || 0), 0);
                                    const customerName = rooms[0]?.customer_name || 'Unknown';
                                    const roomNumbers = rooms.map(r => r.room_number).join(', ');

                                    return (
                                        <div
                                            key={groupId}
                                            className="bg-white rounded-lg border border-purple-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => viewGroupDetails(groupId, rooms)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                    Group #{groupId.slice(-8)}
                                                </Badge>
                                                <span className="text-xs text-gray-500">{rooms.length} rooms</span>
                                            </div>

                                            <p className="text-sm font-medium truncate">{customerName}</p>
                                            <p className="text-xs text-gray-500 mb-2">Rooms: {roomNumbers}</p>

                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-xs text-green-600 block">Adv: ₹{totalAdvance.toLocaleString('en-IN')}</span>
                                                    <span className="text-xs text-orange-600">Due: ₹{(totalAmount - totalAdvance).toLocaleString('en-IN')}</span>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search and Filter Section */}
                <Card>
                    <CardContent className="space-y-3 p-3 sm:space-y-4 sm:p-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search name, phone, room, invoice…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-10 pl-10 text-sm"
                            />
                        </div>

                        {/* Calendar Filter */}
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {/* Date Filter Type Selector */}
                            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-2">
                                <Button
                                    variant={dateFilterType === 'created' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilterType('created')}
                                    className="h-8 px-2 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
                                >
                                    Created
                                </Button>
                                <Button
                                    variant={dateFilterType === 'booking' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilterType('booking')}
                                    className="h-8 px-2 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
                                >
                                    Booking
                                </Button>
                                <Button
                                    variant={dateFilterType === 'expiry' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilterType('expiry')}
                                    className="h-8 px-2 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
                                >
                                    Expiry
                                </Button>
                            </div>

                            {/* Date Range Picker */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'h-10 w-full justify-start text-left text-sm font-normal sm:w-[300px]',
                                                !dateRange?.from && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                                        {format(dateRange.to, "dd/MM/yyyy")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "dd/MM/yyyy")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={isMobile ? 1 : 2}
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Clear Filter Button */}
                                {(dateRange?.from || dateRange?.to) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearDateFilter}
                                        className="h-8 px-2"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Active Filter Indicator */}
                        {(dateRange?.from || dateRange?.to || searchTerm) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <span className="shrink-0">Filters:</span>
                                {searchTerm && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Search: "{searchTerm}"
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setSearchTerm('')}
                                        />
                                    </Badge>
                                )}
                                {dateRange?.from && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        {dateFilterType === 'created' ? 'Created' :
                                            dateFilterType === 'booking' ? 'Booking' : 'Expiry'}:
                                        {format(dateRange.from, "dd/MM/yyyy")}
                                        {dateRange.to && ` - ${format(dateRange.to, "dd/MM/yyyy")}`}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={clearDateFilter}
                                        />
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bookings List */}
                <Tabs defaultValue="all" key={refreshTrigger}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4 mt-4">
                        {loading ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">Loading bookings...</span>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {/* ============================================ */}
                                {/* STEP 1: Show GROUPED bookings (multi-room) */}
                                {/* ============================================ */}
                                {Array.from(groupedAdvanceBookings.entries()).map(([groupId, rooms]) => {
                                    const totalAmount = rooms.reduce((sum, r) => sum + (r.total || 0), 0);
                                    const totalAdvance = rooms.reduce((sum, r) => sum + (r.advance_amount || 0), 0);
                                    const totalRemaining = totalAmount - totalAdvance;
                                    const customerName = rooms[0]?.customer_name || 'Unknown';
                                    const customerPhone = rooms[0]?.customer_phone || 'N/A';
                                    const anyPending = rooms.some(r => r.status === 'pending');
                                    const allConverted = rooms.every(r => r.status === 'converted');

                                    return (
                                        <Card key={groupId} className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                                            <CardContent className="p-4">
                                                {/* Group Header */}
                                                <div className="mb-4 flex flex-col gap-3 border-b pb-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                                            <Badge className="bg-purple-600 text-white text-xs">
                                                                <Layers className="mr-1 h-3 w-3" />
                                                                Group ({rooms.length})
                                                            </Badge>
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                                                                {groupId.slice(-12)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-4">
                                                            <span className="flex items-center gap-1 truncate">
                                                                <User className="h-3 w-3 shrink-0" />
                                                                {customerName}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 shrink-0" />
                                                                {customerPhone}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownloadGroupInvoice(groupId, rooms)}
                                                            className="h-8 flex-1 border-purple-300 text-purple-700 sm:flex-none"
                                                        >
                                                            <Download className="mr-1 h-4 w-4" />
                                                            <span className="text-xs sm:text-sm">Invoice</span>
                                                        </Button>
                                                        {/* <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownloadGroupInvoicePDF(groupId, rooms)}
                                                            className="border-purple-300 text-purple-700 bg-purple-50"
                                                        >
                                                            <FileImage className="h-4 w-4 mr-1" />
                                                            PDF
                                                        </Button> */}

                                                        {/* {anyPending && !allConverted && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => {
                                                                    rooms.forEach(room => {
                                                                        if (room.status === 'pending') {
                                                                            handleConvertAndBook(room);
                                                                        }
                                                                    });
                                                                }}
                                                            >
                                                                <ArrowRight className="h-4 w-4 mr-2" />
                                                                Convert All ({rooms.filter(r => r.status === 'pending').length} rooms)
                                                            </Button>
                                                        )} */}
                                                        {anyPending && !allConverted && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 flex-1 bg-green-600 hover:bg-green-700 sm:flex-none"
                                                                onClick={() => handleConvertGroupToMultiBooking(groupId, rooms)}
                                                            >
                                                                <ArrowRight className="mr-1 h-4 w-4" />
                                                                <span className="text-xs sm:text-sm">
                                                                    Convert ({rooms.filter(r => r.status === 'pending').length})
                                                                </span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Rooms Table */}
                                                <div className="-mx-1 overflow-x-auto sm:mx-0">
                                                    <table className="w-full min-w-[640px] text-xs sm:text-sm">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="p-2 text-left">Room</th>
                                                                <th className="p-2 text-left">Dates</th>
                                                                <th className="p-2 text-right">Total</th>
                                                                <th className="p-2 text-right">Advance</th>
                                                                <th className="p-2 text-right">Due</th>
                                                                <th className="p-2 text-center">Status</th>
                                                                <th className="p-2 text-center">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rooms.map((room) => (
                                                                <tr key={room.id} className="border-t hover:bg-gray-50">
                                                                    <td className="p-2">
                                                                        <div className="font-medium">Room {room.room_number}</div>
                                                                        <div className="text-xs text-muted-foreground">{room.room_type}</div>
                                                                    </td>
                                                                    <td className="p-2">
                                                                        {room.from_date && format(new Date(room.from_date), 'dd MMM')} -
                                                                        {room.to_date && format(new Date(room.to_date), 'dd MMM')}
                                                                    </td>
                                                                    <td className="p-2 text-right font-medium">₹{room.total.toLocaleString('en-IN')}</td>
                                                                    <td className="p-2 text-right text-green-600">₹{room.advance_amount.toLocaleString('en-IN')}</td>
                                                                    <td className="p-2 text-right text-orange-600">₹{room.remaining_amount.toLocaleString('en-IN')}</td>
                                                                    <td className="p-2 text-center">
                                                                        {getStatusBadge(room.status)}
                                                                    </td>
                                                                    <td className="p-2 text-center">
                                                                        <div className="flex gap-1 justify-center">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleViewInvoice(room)}
                                                                                className="h-7 w-7 p-0"
                                                                                title="View Invoice"
                                                                            >
                                                                                <Eye className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleDownloadInvoice(room)}
                                                                                className="h-7 w-7 p-0"
                                                                                title="Download Invoice"
                                                                            >
                                                                                <Download className="h-3 w-3" />
                                                                            </Button>
                                                                            {room.status === 'pending' && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-7 w-7 p-0 text-green-600"
                                                                                    onClick={() => handleConvertAndBook(room)}
                                                                                    title="Convert to Booking"
                                                                                >
                                                                                    <ArrowRight className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                            {(room.status === 'pending' || room.status === 'expired') && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-7 w-7 p-0 text-red-600"
                                                                                    onClick={() => handleDeleteBooking(room)}
                                                                                    title="Delete"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50">
                                                            <tr className="border-t font-bold">
                                                                <td colSpan={2} className="p-2">Group Total</td>
                                                                <td className="p-2 text-right">₹{totalAmount.toLocaleString('en-IN')}</td>
                                                                <td className="p-2 text-right text-green-600">₹{totalAdvance.toLocaleString('en-IN')}</td>
                                                                <td className="p-2 text-right text-orange-600">₹{totalRemaining.toLocaleString('en-IN')}</td>
                                                                <td colSpan={2}></td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* ============================================ */}
                                {/* STEP 2: Show INDIVIDUAL bookings (single-room) */}
                                {/* ============================================ */}
                                {filteredBookings.filter(b => !b.group_booking_id).map((booking) => (
                                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs sm:text-sm">
                                                            {booking.invoice_number}
                                                        </span>
                                                        {getStatusBadge(booking.status)}
                                                        {booking.status === 'cancelled' && getRefundBadge(booking)}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                                                        <div className="min-w-0">
                                                            <span className="text-xs text-muted-foreground">Customer</span>
                                                            <div className="flex items-center gap-1 font-medium truncate">
                                                                <User className="h-3 w-3 shrink-0" />
                                                                {booking.customer_name}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <Phone className="h-3 w-3 shrink-0" />
                                                                {booking.customer_phone}
                                                            </div>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <span className="text-xs text-muted-foreground">Room</span>
                                                            <div className="font-medium">
                                                                {booking.room_number || 'Not assigned'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {booking.from_date && format(new Date(booking.from_date), 'dd MMM')} – {booking.to_date && format(new Date(booking.to_date), 'dd MMM')}
                                                            </div>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <span className="text-xs text-muted-foreground">Payment</span>
                                                            <div className="font-medium">
                                                                {booking.status === 'cancelled' ? (
                                                                    booking.refund_amount && booking.refund_amount > 0 ? (
                                                                        <span className="text-green-600">Refund ₹{booking.refund_amount}</span>
                                                                    ) : (
                                                                        <span className="text-red-600">No Refund</span>
                                                                    )
                                                                ) : (
                                                                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-x-2">
                                                                        <span className="text-green-600 tabular-nums">Adv ₹{booking.advance_amount}</span>
                                                                        {booking.remaining_amount > 0 && (
                                                                            <span className="text-orange-600 tabular-nums">Due ₹{booking.remaining_amount}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground tabular-nums">
                                                                Total ₹{booking.total}
                                                            </div>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <span className="text-xs text-muted-foreground">Expires</span>
                                                            <div className="font-medium">
                                                                {booking.advance_expiry_date ? format(new Date(booking.advance_expiry_date), 'dd MMM yyyy') : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {booking.status === 'cancelled' && booking.cancellation_reason && (
                                                        <div className="mt-2 p-2 bg-red-50 rounded-md text-sm text-red-700">
                                                            <span className="font-medium">Cancellation Reason:</span> {booking.cancellation_reason}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 md:max-w-xs md:shrink-0 lg:max-w-none">
                                                    <Button size="sm" variant="outline" onClick={() => handleViewInvoice(booking)}>
                                                        <Eye className="h-4 w-4 md:mr-2" />
                                                        <span className="hidden md:inline">View</span>
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(booking)}>
                                                        <Download className="h-4 w-4 md:mr-2" />
                                                        <span className="hidden md:inline">Invoice</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadInvoicePDF(booking)}
                                                        className="border-blue-300 text-blue-700"
                                                    >
                                                        <FileImage className="h-4 w-4 md:mr-2" />
                                                        <span className="hidden md:inline">PDF</span>
                                                    </Button>
                                                    {booking.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleConvertAndBook(booking)}
                                                        >
                                                            <ArrowRight className="h-4 w-4 md:mr-2" />
                                                            <span className="hidden md:inline">Convert & Book</span>
                                                            <span className="md:hidden">Convert</span>
                                                        </Button>
                                                    )}
                                                    {(booking.status === 'pending' || booking.status === 'expired') && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteBooking(booking)}
                                                        >
                                                            <X className="h-4 w-4 md:mr-2" />
                                                            <span className="hidden md:inline">Delete</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Empty State */}
                                {filteredBookings.length === 0 && (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No advance bookings found</h3>
                                            <p className="text-muted-foreground mb-4">
                                                {searchTerm || dateRange?.from ? 'Try adjusting your filters' : 'Create your first advance booking'}
                                            </p>
                                            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                                                <Button onClick={() => setShowMultiForm(true)} variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
                                                    <Layers className="mr-2 h-4 w-4" />
                                                    Multi-Room
                                                </Button>
                                                <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
                                                    Single-Room
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Pagination */}
                                {filteredBookings.length > 0 && <PaginationControls />}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Group Advance Details Modal */}
            {showGroupAdvanceModal && selectedGroupAdvance && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
                    <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white sm:max-h-[90vh] sm:rounded-xl">
                        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b bg-white p-4 sm:p-6">
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold sm:text-2xl">Group Advance Booking</h2>
                                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                    {selectedGroupAdvance.groupId} · {selectedGroupAdvance.rooms.length} rooms
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowGroupAdvanceModal(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
                            {/* Customer Summary */}
                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 sm:p-4">
                                <h3 className="mb-2 font-semibold text-purple-800 text-sm sm:text-base">Customer Summary</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                                    <div>
                                        <p className="text-sm text-purple-600">Name</p>
                                        <p className="font-medium">{selectedGroupAdvance.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-600">Phone</p>
                                        <p className="font-medium">{selectedGroupAdvance.customerPhone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rooms Table */}
                            <div>
                                <h3 className="font-semibold mb-3">Room Details</h3>
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full min-w-[520px] text-xs sm:text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-left">Room</th>
                                                <th className="p-2 text-left">Dates</th>
                                                <th className="p-2 text-right">Amount</th>
                                                <th className="p-2 text-right">Advance</th>
                                                <th className="p-2 text-right">Due</th>
                                                <th className="p-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedGroupAdvance.rooms.map((room: any) => (
                                                <tr key={room.id} className="border-t">
                                                    <td className="p-2">
                                                        Room {room.room_number}
                                                        <div className="text-xs text-gray-500">{room.room_type}</div>
                                                    </td>
                                                    <td className="p-2">
                                                        {room.from_date && format(new Date(room.from_date), 'dd MMM')} - {room.to_date && format(new Date(room.to_date), 'dd MMM')}
                                                    </td>
                                                    <td className="p-2 text-right">₹{room.total.toLocaleString('en-IN')}</td>
                                                    <td className="p-2 text-right text-green-600">₹{room.advance_amount.toLocaleString('en-IN')}</td>
                                                    <td className="p-2 text-right text-orange-600">₹{room.remaining_amount.toLocaleString('en-IN')}</td>
                                                    <td className="p-2 text-center">
                                                        {getStatusBadge(room.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr className="border-t">
                                                <td colSpan={2} className="p-2 font-bold">Total</td>
                                                <td className="p-2 text-right font-bold">₹{selectedGroupAdvance.totalAmount.toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-right font-bold text-green-600">₹{selectedGroupAdvance.totalAdvance.toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-right font-bold text-orange-600">₹{selectedGroupAdvance.totalRemaining.toLocaleString('en-IN')}</td>
                                                <td className="p-2"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 justify-end border-t p-3 sm:p-4">
                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowGroupAdvanceModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Details Modal */}
            {showRefundDetails && selectedRefundData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Refund Details</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowRefundDetails(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Refund Amount</p>
                                        <p className="text-lg font-bold text-green-600">₹{selectedRefundData.refund_amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Refund Method</p>
                                        <p className="font-medium capitalize">{selectedRefundData.refund_method}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Refund Status</p>
                                        <Badge className={
                                            selectedRefundData.refund_status === 'completed' ? 'bg-green-100 text-green-800' :
                                                selectedRefundData.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                        }>
                                            {selectedRefundData.refund_status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Processed At</p>
                                        <p className="font-medium">{selectedRefundData.processed_at ? format(new Date(selectedRefundData.processed_at), 'dd MMM yyyy HH:mm') : 'N/A'}</p>
                                    </div>
                                </div>

                                {selectedRefundData.transaction_id && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                                        <p className="font-mono text-sm">{selectedRefundData.transaction_id}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-muted-foreground">Refund Reason</p>
                                    <p className="text-sm">{selectedRefundData.refund_reason || 'Cancellation refund processed'}</p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Original Advance</p>
                                    <p className="font-medium">₹{selectedRefundData.original_amount || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={() => setShowRefundDetails(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Form for Conversion */}
            {showBookingForm && selectedAdvanceForBooking && (
                <BookingForm
                    roomId={selectedAdvanceForBooking.room_id?.toString() || ''}
                    room={rooms.find(r => r.id?.toString() === selectedAdvanceForBooking.room_id?.toString())}
                    spreadsheetId=""
                    userSource="database"
                    onClose={() => {
                        setShowBookingForm(false);
                        setSelectedAdvanceForBooking(null);
                    }}
                    onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setShowBookingForm(false);
                        setSelectedAdvanceForBooking(null);
                    }}
                    advanceBookingData={selectedAdvanceForBooking}
                    isAdvanceConversion={true}
                />
            )}

            {/* Single Advance Booking Form */}
            <AdvanceBookingForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={handleAdvanceBookingSuccess}
                rooms={rooms}
                userSource="database"
            />

            {/* Multi-Room Advance Booking Form */}
            <MultiAdvanceBookingForm
                open={showMultiForm}
                onClose={() => setShowMultiForm(false)}
                onSuccess={handleAdvanceBookingSuccess}
                rooms={rooms}
                userSource="database"
            />
            {/* Multi-Room Booking Form for Group Conversion */}


            {showMultiBookingFromGroup && groupRoomsForConversion.length > 0 && (
                <MultiRoomBookingForm
                    open={showMultiBookingFromGroup}
                    onClose={() => {
                        setShowMultiBookingFromGroup(false);
                        setGroupRoomsForConversion([]);
                        setGroupCustomerData(null);
                    }}
                    onSuccess={async () => {
                        setShowMultiBookingFromGroup(false);
                        setGroupRoomsForConversion([]);
                        setGroupCustomerData(null);

                        // Refresh the advance bookings list
                        await fetchBookings();
                        setRefreshTrigger(prev => prev + 1);

                        toast({
                            title: "✅ Group Converted Successfully!",
                            description: `All pending rooms have been converted to regular bookings. Advance payments have been applied.`,
                            variant: "default"
                        });
                    }}
                    selectedRooms={groupRoomsForConversion}
                    userSource="database"
                    isGroupConversion={true}  // ← Pass this prop
                    groupId={groupRoomsForConversion[0]?.advanceData?.group_booking_id}  // ← Pass group ID if available
                    defaultDate={(() => {
                        if (groupRoomsForConversion.length > 0 && groupRoomsForConversion[0]?.advanceData?.from_date) {
                            const dateStr = groupRoomsForConversion[0].advanceData.from_date;
                            const utcDate = new Date(dateStr);
                            const year = utcDate.getFullYear();
                            const month = utcDate.getMonth();
                            const day = utcDate.getDate();
                            return new Date(year, month, day);
                        }
                        return new Date();
                    })()}
                    initialCustomerData={groupCustomerData}
                    existingAdvanceBookings={(() => {
                        const advanceData = groupRoomsForConversion
                            .filter(room => room.advanceData?.advance_amount > 0)
                            .map(room => ({
                                id: room.advanceData?.id,
                                advance_amount: room.advanceData?.advance_amount || 0,
                                total: room.advanceData?.total || 0,
                                room_number: room.number,
                                room_id: room.roomId,
                                from_date: room.advanceData?.from_date,
                                to_date: room.advanceData?.to_date,
                                customer_name: room.advanceData?.customer_name,
                                customer_phone: room.advanceData?.customer_phone,
                                customer_email: room.advanceData?.customer_email
                            }));

                        console.log('📦 Passing advance data to MultiRoomBookingForm:', advanceData);
                        return advanceData;
                    })()}
                />
            )}
        </Layout>
    );
};

export default AdvanceBookings;