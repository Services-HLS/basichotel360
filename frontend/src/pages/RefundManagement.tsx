// // src/pages/RefundManagement.tsx - Updated with date filtering

// import { useState, useEffect } from 'react';
// import Layout from '@/components/Layout';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
// } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useToast } from '@/hooks/use-toast';
// import {
//     CalendarDays,
//     Search,
//     RefreshCw,
//     Ban,
//     IndianRupee,
//     Wallet,
//     CreditCard,
//     Landmark,
//     Loader2,
//     Info,
//     CheckCircle,
//     XCircle,
//     Eye,
//     FileText,
//     TrendingUp,
//     Building2,
//     Bed,
//     CalendarIcon,
//     Download,
//     Filter,
//     Clock,
//     AlertTriangle
// } from 'lucide-react';
// import { format, subDays, isAfter, isBefore } from 'date-fns';
// import { cn } from '@/lib/utils';

// interface Booking {
//     booking_id: number;
//     booking_type: 'room' | 'advance' | 'function';
//     invoice_number: string;
//     customer_name: string;
//     customer_phone: string;
//     customer_email?: string;
//     room_number: string;
//     from_date: string;
//     to_date: string;
//     total: number;
//     advance_paid: number;
//     remaining_amount: number;
//     payment_method: string;
//     payment_status: string;
//     status: string;
//     created_at: string;
//     cancellation_reason?: string;
//     days_since_created?: number;
// }

// interface Refund {
//     id: number;
//     booking_id: number;
//     booking_type: string;
//     refund_amount: number;
//     refund_method: string;
//     refund_status: string;
//     transaction_id?: string;
//     refund_reason: string;
//     processed_at: string;
//     created_at: string;
// }

// interface Summary {
//     total: number;
//     by_type: {
//         room: number;
//         advance: number;
//         function: number;
//     };
//     filter_applied: {
//         created_before_days: number | null;
//         created_before_date: string | null;
//         created_after_date: string | null;
//         show_all: boolean;
//         last_x_days?: number | null;      // 👈 ADD THIS
//         from_date?: string | null;        // 👈 ADD THIS
//         to_date?: string | null;          // 👈 ADD THIS
//     };
// }

// const RefundManagement = () => {
//     const { toast } = useToast();
//     const [loading, setLoading] = useState(false);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [activeTab, setActiveTab] = useState<'room' | 'advance' | 'function'>('room');
//     const [bookings, setBookings] = useState<Booking[]>([]);
//     const [refunds, setRefunds] = useState<Refund[]>([]);
//     const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
//     const [showCancelDialog, setShowCancelDialog] = useState(false);
//     const [cancellationData, setCancellationData] = useState<any>(null);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [showRefundHistory, setShowRefundHistory] = useState(false);
//     const [summary, setSummary] = useState<Summary | null>(null);

//     // Date filter states
//     const [showDateFilter, setShowDateFilter] = useState(false);
//     const [filterType, setFilterType] = useState<'before_days' | 'date_range' | 'show_all'>('before_days');
//     const [createdBeforeDays, setCreatedBeforeDays] = useState<number>(3); // Default to 3 days
//     const [startDate, setStartDate] = useState<string>('');
//     const [endDate, setEndDate] = useState<string>('');
//     const [showAll, setShowAll] = useState<boolean>(false);

//     // Cancellation form state
//     const [cancellationReason, setCancellationReason] = useState('');
//     const [processRefund, setProcessRefund] = useState(false);
//     const [refundAmount, setRefundAmount] = useState(0);
//     const [refundMethod, setRefundMethod] = useState<'cash' | 'online' | 'bank' | null>(null);
//     const [refundType, setRefundType] = useState<'full' | 'partial' | 'goodwill'>('full');
//     const [deductionReason, setDeductionReason] = useState('');
//     const [maxRefundAmount, setMaxRefundAmount] = useState(0);
//     const [recommendedRefund, setRecommendedRefund] = useState(0);
//     const [cancellationPolicy, setCancellationPolicy] = useState<any>(null);

//     const API_URL = import.meta.env.VITE_BACKEND_URL;

//     // Build query parameters for API
//     // const buildQueryParams = () => {
//     //     const params = new URLSearchParams();
//     //     params.append('type', activeTab);

//     //     console.log('🔍 Building query params - Current state:', {
//     //         filterType,
//     //         showAll,
//     //         createdBeforeDays,
//     //         startDate,
//     //         endDate
//     //     });

//     //     if (showAll) {
//     //         // Show all bookings - no date filter
//     //         params.append('show_all', 'true');
//     //         console.log('📡 Show All Bookings - no date filter');
//     //     } else if (filterType === 'before_days') {
//     //         // Filter by older than X days
//     //         params.append('created_before_days', createdBeforeDays.toString());
//     //         console.log(`📡 Filter: Bookings older than ${createdBeforeDays} days`);
//     //     } else if (filterType === 'date_range' && startDate && endDate) {
//     //         // Date range filter
//     //         params.append('from_created_date', startDate);
//     //         params.append('to_created_date', endDate);
//     //         console.log(`📡 Filter: Date range ${startDate} to ${endDate}`);
//     //     }

//     //     return params;
//     // };

//     // In RefundManagement.tsx - Fix buildQueryParams

//     const buildQueryParams = () => {
//         const params = new URLSearchParams();
//         params.append('type', activeTab);

//         console.log('🔍 Building query params - Current state:', {
//             filterType,
//             showAll,
//             createdBeforeDays,
//             startDate,
//             endDate
//         });

//         if (showAll) {
//             // Show all bookings - no date filter
//             params.append('show_all', 'true');
//             console.log('📡 Show All Bookings - no date filter');
//         } else if (filterType === 'before_days') {
//             // Filter by last X days
//             params.append('created_before_days', createdBeforeDays.toString());
//             console.log(`📡 Filter: Last ${createdBeforeDays} days`);
//         } else if (filterType === 'date_range') {
//             // Custom date range filter
//             if (startDate && endDate) {
//                 // Send as from_created_date and to_created_date for the backend
//                 params.append('from_created_date', startDate);
//                 params.append('to_created_date', endDate);
//                 console.log(`📡 Filter: Date range ${startDate} to ${endDate}`);
//             } else {
//                 console.log('⚠️ Date range selected but dates are missing');
//             }
//         }

//         return params;
//     };

//     // Fetch bookings based on active tab and date filters
//     const fetchBookings = async () => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem('authToken');
//             const params = buildQueryParams();
//             const url = `${API_URL}/refunds/cancellable-bookings?${params.toString()}`;

//             console.log('📡 Fetching bookings with filters:', url);

//             const response = await fetch(url, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             const result = await response.json();
//             if (result.success) {
//                 if (activeTab === 'room') {
//                     setBookings(result.data.room_bookings || []);
//                 } else if (activeTab === 'advance') {
//                     setBookings(result.data.advance_bookings || []);
//                 } else {
//                     setBookings(result.data.function_bookings || []);
//                 }
//                 setSummary(result.summary);

//                 // Show toast with filter info
//                 if (result.summary?.filter_applied?.created_before_days) {
//                     toast({
//                         title: "Filter Applied",
//                         description: `Showing bookings created before ${result.summary.filter_applied.created_before_days} days ago`,
//                         duration: 3000
//                     });
//                 }
//             }
//         } catch (error) {
//             console.error('Error fetching bookings:', error);
//             toast({
//                 title: "Error",
//                 description: "Failed to load bookings",
//                 variant: "destructive"
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Fetch refund history
//     const fetchRefundHistory = async () => {
//         try {
//             const token = localStorage.getItem('authToken');
//             // CORRECT URL - matches the backend route
//             const response = await fetch(`${API_URL}/refunds/refunds/history`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             const result = await response.json();
//             if (result.success) {
//                 setRefunds(result.data);
//                 console.log('✅ Refund history loaded:', result.data.length);
//             } else {
//                 console.error('❌ Failed to load refunds:', result);
//             }
//         } catch (error) {
//             console.error('Error fetching refunds:', error);
//             // Don't show toast for this - it's not critical
//         }
//     };

//     // Get cancellation details for a booking
//     const getCancellationDetails = async (booking: Booking) => {
//         try {
//             const token = localStorage.getItem('authToken');
//             const response = await fetch(
//                 `${API_URL}/refunds/${booking.booking_id}/cancellation-details?type=${booking.booking_type}`,
//                 { headers: { 'Authorization': `Bearer ${token}` } }
//             );

//             const result = await response.json();
//             if (result.success) {
//                 const data = result.data;
//                 setCancellationPolicy(data.cancellation_policy);
//                 setMaxRefundAmount(data.cancellation_policy.max_refund);
//                 setRecommendedRefund(data.cancellation_policy.recommended_refund);
//                 setRefundAmount(data.cancellation_policy.recommended_refund);
//                 setSelectedBooking(booking);
//                 setShowCancelDialog(true);
//             }
//         } catch (error) {
//             console.error('Error getting cancellation details:', error);
//             toast({
//                 title: "Error",
//                 description: "Failed to load cancellation details",
//                 variant: "destructive"
//             });
//         }
//     };

//     // Process cancellation
//     const processCancellation = async () => {
//         if (!cancellationReason.trim()) {
//             toast({
//                 title: "Error",
//                 description: "Please provide a cancellation reason",
//                 variant: "destructive"
//             });
//             return;
//         }

//         if (processRefund && !refundMethod) {
//             toast({
//                 title: "Error",
//                 description: "Please select a refund method",
//                 variant: "destructive"
//             });
//             return;
//         }

//         if (processRefund && refundAmount <= 0) {
//             toast({
//                 title: "Error",
//                 description: "Refund amount must be greater than 0",
//                 variant: "destructive"
//             });
//             return;
//         }

//         if (processRefund && refundAmount > maxRefundAmount) {
//             toast({
//                 title: "Error",
//                 description: `Refund amount cannot exceed ${formatCurrency(maxRefundAmount)}`,
//                 variant: "destructive"
//             });
//             return;
//         }

//         setIsProcessing(true);

//         try {
//             const token = localStorage.getItem('authToken');
//             const response = await fetch(`${API_URL}/refunds/${selectedBooking?.booking_id}/cancel`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     type: selectedBooking?.booking_type,
//                     cancellation_reason: cancellationReason,
//                     process_refund: processRefund,
//                     refund_amount: refundAmount,
//                     refund_method: refundMethod,
//                     refund_type: refundType,
//                     deduction_reason: deductionReason,
//                     deduction_amount: maxRefundAmount - refundAmount,
//                     refund_notes: `Cancelled by ${selectedBooking?.customer_name}. ${deductionReason ? `Deduction: ${deductionReason}` : ''}`
//                 })
//             });

//             const result = await response.json();

//             if (result.success) {
//                 toast({
//                     title: "✅ Booking Cancelled",
//                     description: result.message,
//                     variant: "default"
//                 });

//                 setShowCancelDialog(false);
//                 setCancellationReason('');
//                 setProcessRefund(false);
//                 setRefundAmount(0);
//                 setRefundMethod(null);
//                 setSelectedBooking(null);

//                 // Refresh data
//                 fetchBookings();
//                 fetchRefundHistory();
//             } else {
//                 throw new Error(result.message || 'Cancellation failed');
//             }
//         } catch (error: any) {
//             console.error('Cancellation error:', error);
//             toast({
//                 title: "Error",
//                 description: error.message || "Failed to cancel booking",
//                 variant: "destructive"
//             });
//         } finally {
//             setIsProcessing(false);
//         }
//     };

//     const formatCurrency = (amount: number) => {
//         return '₹' + (amount || 0).toLocaleString('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         });
//     };

//     const formatDate = (date: string) => {
//         if (!date) return 'N/A';
//         return format(new Date(date), 'dd MMM yyyy');
//     };

//     const getDaysSinceCreated = (createdAt: string) => {
//         const created = new Date(createdAt);
//         const now = new Date();
//         const diffTime = Math.abs(now.getTime() - created.getTime());
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//         return diffDays;
//     };

//     const getStatusBadge = (status: string) => {
//         const config: Record<string, { label: string; class: string }> = {
//             pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
//             confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-800 border-green-200' },
//             booked: { label: 'Booked', class: 'bg-blue-100 text-blue-800 border-blue-200' },
//             cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' },
//             completed: { label: 'Completed', class: 'bg-gray-100 text-gray-800 border-gray-200' }
//         };
//         const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
//         return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
//     };

//     const getPaymentBadge = (status: string) => {
//         const config: Record<string, { label: string; class: string }> = {
//             completed: { label: 'Paid', class: 'bg-green-100 text-green-800 border-green-200' },
//             partial: { label: 'Partial', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
//             pending: { label: 'Pending', class: 'bg-orange-100 text-orange-800 border-orange-200' },
//             none: { label: 'None', class: 'bg-gray-100 text-gray-800 border-gray-200' }
//         };
//         const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
//         return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
//     };

//     const getBookingIcon = (type: string) => {
//         switch (type) {
//             case 'room': return <Bed className="h-4 w-4" />;
//             case 'advance': return <CalendarDays className="h-4 w-4" />;
//             case 'function': return <Building2 className="h-4 w-4" />;
//             default: return <CalendarIcon className="h-4 w-4" />;
//         }
//     };

//     const getAgeBadge = (days: number) => {
//         if (days >= 30) {
//             return <Badge className="bg-red-100 text-red-800 border-red-200">+30 days</Badge>;
//         } else if (days >= 7) {
//             return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{days} days</Badge>;
//         } else if (days >= 3) {
//             return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{days} days</Badge>;
//         } else {
//             return <Badge className="bg-green-100 text-green-800 border-green-200">{days} days</Badge>;
//         }
//     };

//     const filteredBookings = bookings.filter(booking =>
//         booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         booking.customer_phone?.includes(searchTerm) ||
//         booking.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         booking.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     // Apply date filter reset
//     // const resetDateFilters = () => {
//     //     setFilterType('before_days');
//     //     setCreatedBeforeDays(3);
//     //     setStartDate('');
//     //     setEndDate('');
//     //     setShowAll(false);
//     //     setShowDateFilter(false);
//     // };
//     const resetDateFilters = () => {
//         console.log('🔄 Resetting all filters');
//         setFilterType('before_days');
//         setCreatedBeforeDays(3);
//         setStartDate('');
//         setEndDate('');
//         setShowAll(false);
//         setShowDateFilter(false);

//         // Force a refresh after reset
//         setTimeout(() => {
//             fetchBookings();
//         }, 100);
//     };

//     useEffect(() => {
//         fetchBookings();
//         fetchRefundHistory();
//     }, [activeTab, filterType, createdBeforeDays, startDate, endDate, showAll]);

//     return (
//         <Layout>
//             <div className="space-y-6">
//                 {/* Header */}
//                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//                     <div>
//                         <div className="flex items-center gap-3">
//                             <h1 className="text-2xl md:text-3xl font-bold">Cancellation & Refund Management</h1>
//                             {summary?.filter_applied?.created_before_days && !summary.filter_applied.show_all && (
//                                 <Badge className="bg-blue-100 text-blue-800 border-blue-200">
//                                     <Clock className="h-3 w-3 mr-1" />
//                                     {summary.filter_applied.created_before_days}+ days old
//                                 </Badge>
//                             )}
//                         </div>
//                         <p className="text-muted-foreground mt-1">
//                             Cancel bookings and process refunds for rooms, advance bookings, and function halls
//                         </p>
//                     </div>

//                     <div className="flex gap-2">
//                         {/* Date Filter Toggle Button */}
//                         <Button
//                             variant={showDateFilter ? "default" : "outline"}
//                             onClick={() => setShowDateFilter(!showDateFilter)}
//                             className={showDateFilter ? "bg-primary text-primary-foreground" : ""}
//                         >
//                             <Filter className="h-4 w-4 mr-2" />
//                             {showDateFilter ? "Hide Filters" : "Show Filters"}
//                         </Button>

//                         <Button
//                             variant="outline"
//                             onClick={() => {
//                                 fetchBookings();
//                                 fetchRefundHistory();
//                             }}
//                             disabled={loading}
//                         >
//                             <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
//                             Refresh
//                         </Button>

//                         <Button
//                             variant="outline"
//                             onClick={() => setShowRefundHistory(!showRefundHistory)}
//                         >
//                             <Eye className="h-4 w-4 mr-2" />
//                             {showRefundHistory ? 'Hide' : 'Show'} Refund History
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Date Filter Panel */}
//                 {showDateFilter && (
//                     <Card className="bg-blue-50 border-blue-200">
//                         <CardContent className="p-4">
//                             <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
//                                 <div className="flex items-center gap-2">
//                                     <Clock className="h-4 w-4 text-blue-600" />
//                                     <span className="text-sm font-medium">Filter by Creation Date:</span>
//                                 </div>



//                                 <div className="flex flex-wrap gap-4">
//                                     <label className="flex items-center gap-2">
//                                         <input
//                                             type="radio"
//                                             checked={filterType === 'before_days' && !showAll}
//                                             onChange={() => {
//                                                 console.log('🔘 Selected: Last X days');
//                                                 setFilterType('before_days');
//                                                 setShowAll(false);
//                                             }}
//                                             className="text-blue-600"
//                                         />
//                                         <span className="text-sm">Bookings from last</span>
//                                         <input
//                                             type="number"
//                                             min="1"
//                                             max="365"
//                                             value={createdBeforeDays}
//                                             onChange={(e) => {
//                                                 const newValue = parseInt(e.target.value) || 3;
//                                                 console.log(`📅 Changed days to: ${newValue}`);
//                                                 setCreatedBeforeDays(newValue);
//                                             }}
//                                             className="w-16 px-2 py-1 border rounded text-center"
//                                             disabled={filterType !== 'before_days' || showAll}
//                                         />
//                                         <span className="text-sm">days (including today)</span>
//                                     </label>

//                                     <label className="flex items-center gap-2">
//                                         <input
//                                             type="radio"
//                                             checked={filterType === 'date_range'}
//                                             onChange={() => {
//                                                 console.log('🔘 Selected: Custom Date Range');
//                                                 setFilterType('date_range');
//                                                 setShowAll(false);
//                                             }}
//                                             className="text-blue-600"
//                                         />
//                                         <span className="text-sm">Custom Date Range:</span>
//                                         <input
//                                             type="date"
//                                             value={startDate}
//                                             onChange={(e) => setStartDate(e.target.value)}
//                                             className="px-2 py-1 border rounded text-sm"
//                                             disabled={filterType !== 'date_range'}
//                                         />
//                                         <span className="text-sm">to</span>
//                                         <input
//                                             type="date"
//                                             value={endDate}
//                                             onChange={(e) => setEndDate(e.target.value)}
//                                             className="px-2 py-1 border rounded text-sm"
//                                             disabled={filterType !== 'date_range'}
//                                         />
//                                     </label>

//                                     <label className="flex items-center gap-2">
//                                         <input
//                                             type="radio"
//                                             checked={showAll}
//                                             onChange={() => {
//                                                 console.log('🔘 Selected: Show All Bookings');
//                                                 setShowAll(true);
//                                                 setFilterType('show_all');
//                                             }}
//                                             className="text-blue-600"
//                                         />
//                                         <span className="text-sm">Show All Bookings</span>
//                                     </label>
//                                 </div>

//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={resetDateFilters}
//                                     className="text-blue-600 hover:text-blue-700"
//                                 >
//                                     <XCircle className="h-4 w-4 mr-1" />
//                                     Reset
//                                 </Button>
//                             </div>

//                             {/* Filter Info */}

//                             {summary?.filter_applied && (
//                                 <div className="mt-3 pt-3 border-t border-blue-200">
//                                     <div className="text-xs text-blue-700">
//                                         <span className="font-medium">Active Filter:</span>{' '}
//                                         {summary.filter_applied.show_all ? (
//                                             'Showing all bookings'
//                                         ) : summary.filter_applied.last_x_days ? (
//                                             `Showing bookings from last ${summary.filter_applied.last_x_days} days (from ${summary.filter_applied.from_date} to ${summary.filter_applied.to_date})`
//                                         ) : summary.filter_applied.from_date ? (
//                                             `Showing bookings between ${summary.filter_applied.from_date} and ${summary.filter_applied.to_date}`
//                                         ) : (
//                                             'No date filter applied'
//                                         )}
//                                     </div>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* Summary Cards */}
//                 {/* {summary && (
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                         <Card>
//                             <CardContent className="p-4">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-muted-foreground">Total Cancellable</p>
//                                         <p className="text-2xl font-bold">{summary.total}</p>
//                                     </div>
//                                     <Ban className="h-8 w-8 text-red-500 opacity-50" />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="p-4">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-muted-foreground">Room Bookings</p>
//                                         <p className="text-2xl font-bold">{summary.by_type.room}</p>
//                                     </div>
//                                     <Bed className="h-8 w-8 text-blue-500 opacity-50" />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="p-4">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-muted-foreground">Advance Bookings</p>
//                                         <p className="text-2xl font-bold">{summary.by_type.advance}</p>
//                                     </div>
//                                     <CalendarDays className="h-8 w-8 text-purple-500 opacity-50" />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="p-4">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="text-sm text-muted-foreground">Function Bookings</p>
//                                         <p className="text-2xl font-bold">{summary.by_type.function}</p>
//                                     </div>
//                                     <Building2 className="h-8 w-8 text-green-500 opacity-50" />
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>
//                 )} */}


//                 {/* Refund History Section */}
//                 {showRefundHistory && (
//                     <Card>
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2">
//                                 <TrendingUp className="h-5 w-5 text-blue-600" />
//                                 Refund History
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             {refunds.length === 0 ? (
//                                 <div className="text-center py-8 text-muted-foreground">
//                                     No refund records found
//                                 </div>
//                             ) : (
//                                 <div className="space-y-4">
//                                     {refunds.map((refund) => (
//                                         <Card key={refund.id} className="border-l-4 border-l-blue-500">
//                                             <CardContent className="p-4">
//                                                 <div className="flex justify-between items-start">
//                                                     <div>
//                                                         <div className="flex items-center gap-2 mb-2">
//                                                             <Badge variant="outline" className="bg-blue-100 text-blue-800">
//                                                                 {refund.booking_type.toUpperCase()} #{refund.booking_id}
//                                                             </Badge>
//                                                             {/* UPDATE THIS BADGE - Always show COMPLETED in green */}
//                                                             <Badge variant="outline" className="bg-green-100 text-green-800">
//                                                                 COMPLETED
//                                                             </Badge>
//                                                         </div>

//                                                         {/* Rest of the refund details remain the same */}
//                                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Refund Amount:</span>
//                                                                 <div className="font-bold text-green-600">{formatCurrency(refund.refund_amount)}</div>
//                                                             </div>
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Method:</span>
//                                                                 <div className="font-medium capitalize">{refund.refund_method}</div>
//                                                             </div>
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Processed At:</span>
//                                                                 <div className="font-medium">{formatDate(refund.processed_at)}</div>
//                                                             </div>
//                                                             {refund.transaction_id && (
//                                                                 <div>
//                                                                     <span className="text-muted-foreground">Transaction ID:</span>
//                                                                     <div className="font-mono text-xs">{refund.transaction_id}</div>
//                                                                 </div>
//                                                             )}
//                                                         </div>

//                                                         <div className="mt-2 text-sm">
//                                                             <span className="text-muted-foreground">Reason:</span>
//                                                             <p className="text-sm">{refund.refund_reason}</p>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </CardContent>
//                                         </Card>
//                                     ))}
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* Tabs */}
//                 <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
//                     <TabsList className="grid w-full grid-cols-3">
//                         <TabsTrigger value="room" className="flex items-center gap-2">
//                             <Bed className="h-4 w-4" />
//                             Room Bookings
//                             {summary && (
//                                 <Badge className="ml-2 bg-blue-100 text-blue-800">
//                                     {summary.by_type.room}
//                                 </Badge>
//                             )}
//                         </TabsTrigger>
//                         <TabsTrigger value="advance" className="flex items-center gap-2">
//                             <CalendarDays className="h-4 w-4" />
//                             Advance Bookings
//                             {summary && (
//                                 <Badge className="ml-2 bg-purple-100 text-purple-800">
//                                     {summary.by_type.advance}
//                                 </Badge>
//                             )}
//                         </TabsTrigger>
//                         <TabsTrigger value="function" className="flex items-center gap-2">
//                             <Building2 className="h-4 w-4" />
//                             Function Bookings
//                             {summary && (
//                                 <Badge className="ml-2 bg-green-100 text-green-800">
//                                     {summary.by_type.function}
//                                 </Badge>
//                             )}
//                         </TabsTrigger>
//                     </TabsList>

//                     <TabsContent value={activeTab} className="space-y-4 mt-4">
//                         <Card>
//                             <CardContent className="p-4">
//                                 <div className="relative">
//                                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                                     <Input
//                                         placeholder="Search by customer name, phone, room, or invoice..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="pl-10"
//                                     />
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {loading ? (
//                             <div className="flex justify-center py-12">
//                                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                             </div>
//                         ) : filteredBookings.length === 0 ? (
//                             <Card>
//                                 <CardContent className="py-12 text-center">
//                                     {filterType === 'before_days' && !showAll ? (
//                                         <>
//                                             <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
//                                             <p className="text-lg font-medium">No old bookings found</p>
//                                             <p className="text-sm text-muted-foreground mt-1">
//                                                 No bookings created before {createdBeforeDays} days ago
//                                             </p>
//                                             <Button
//                                                 variant="outline"
//                                                 className="mt-4"
//                                                 onClick={() => setShowAll(true)}
//                                             >
//                                                 Show All Bookings
//                                             </Button>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//                                             <p className="text-lg font-medium">No bookings found</p>
//                                             <p className="text-sm text-muted-foreground mt-1">
//                                                 {searchTerm ? 'Try a different search term' : `No active ${activeTab} bookings to cancel`}
//                                             </p>
//                                         </>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         ) : (
//                             <div className="space-y-4">
//                                 {filteredBookings.map((booking) => {
//                                     const daysOld = booking.days_since_created || getDaysSinceCreated(booking.created_at);
//                                     const isOldBooking = daysOld >= (createdBeforeDays || 3);

//                                     return (
//                                         <Card
//                                             key={booking.booking_id}
//                                             className={`hover:shadow-md transition-shadow ${isOldBooking ? 'border-l-4 border-l-yellow-500' : ''
//                                                 }`}
//                                         >
//                                             <CardContent className="p-4">
//                                                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                                                     <div className="space-y-2 flex-1">
//                                                         <div className="flex items-center gap-2 flex-wrap">
//                                                             <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
//                                                                 {booking.invoice_number}
//                                                             </span>
//                                                             {getStatusBadge(booking.status)}
//                                                             {/* {getPaymentBadge(booking.payment_status)} */}
//                                                             {isOldBooking && (
//                                                                 <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
//                                                                     <Clock className="h-3 w-3 mr-1" />
//                                                                     {daysOld} days old
//                                                                 </Badge>
//                                                             )}
//                                                         </div>

//                                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Customer:</span>
//                                                                 <div className="font-medium">{booking.customer_name}</div>
//                                                                 <div className="text-xs">{booking.customer_phone}</div>
//                                                             </div>
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Room:</span>
//                                                                 <div className="font-medium">{booking.room_number || 'Not assigned'}</div>
//                                                                 <div className="text-xs">
//                                                                     {formatDate(booking.from_date)} - {formatDate(booking.to_date)}
//                                                                 </div>
//                                                             </div>
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Amount:</span>
//                                                                 <div className="font-bold">Total: {formatCurrency(booking.total)}</div>
//                                                                 {booking.advance_paid > 0 && (
//                                                                     <div className="text-xs text-green-600">
//                                                                         Advance: {formatCurrency(booking.advance_paid)}
//                                                                     </div>
//                                                                 )}
//                                                             </div>
//                                                             <div>
//                                                                 <span className="text-muted-foreground">Created:</span>
//                                                                 <div className="font-medium">{formatDate(booking.created_at)}</div>
//                                                                 <div className="text-xs text-muted-foreground">
//                                                                     {daysOld} days ago
//                                                                 </div>
//                                                             </div>
//                                                         </div>

//                                                         {booking.cancellation_reason && (
//                                                             <div className="mt-2 p-2 bg-red-50 rounded-md text-sm text-red-700">
//                                                                 <span className="font-medium">Previous Cancellation:</span> {booking.cancellation_reason}
//                                                             </div>
//                                                         )}
//                                                     </div>

//                                                     <div className="flex gap-2">
//                                                         <Button
//                                                             size="sm"
//                                                             variant="destructive"
//                                                             onClick={() => getCancellationDetails(booking)}
//                                                             className="bg-red-600 hover:bg-red-700"
//                                                         >
//                                                             <Ban className="h-4 w-4 mr-2" />
//                                                             Cancel Booking
//                                                         </Button>
//                                                     </div>
//                                                 </div>
//                                             </CardContent>
//                                         </Card>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </TabsContent>
//                 </Tabs>

//                 {/* Cancellation Dialog - Same as before */}
//                 <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
//                     <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
//                         <DialogHeader>
//                             <DialogTitle className="flex items-center gap-2 text-red-600">
//                                 <Ban className="h-5 w-5" />
//                                 Cancel Booking
//                             </DialogTitle>
//                         </DialogHeader>

//                         {selectedBooking && cancellationPolicy && (
//                             <div className="space-y-4">
//                                 {/* Booking Summary */}
//                                 <div className="bg-gray-50 p-3 rounded-lg">
//                                     <p className="text-sm font-semibold mb-2">Booking Details</p>
//                                     <div className="grid grid-cols-2 gap-2 text-sm">
//                                         <div>
//                                             <span className="text-muted-foreground">Type:</span>
//                                             <div className="font-medium capitalize">{selectedBooking.booking_type}</div>
//                                         </div>
//                                         <div>
//                                             <span className="text-muted-foreground">Invoice:</span>
//                                             <div className="font-medium">{selectedBooking.invoice_number}</div>
//                                         </div>
//                                         <div>
//                                             <span className="text-muted-foreground">Customer:</span>
//                                             <div className="font-medium">{selectedBooking.customer_name}</div>
//                                         </div>
//                                         <div>
//                                             <span className="text-muted-foreground">Room/Venue:</span>
//                                             <div className="font-medium">{selectedBooking.room_number}</div>
//                                         </div>
//                                         <div className="col-span-2">
//                                             <span className="text-muted-foreground">Dates:</span>
//                                             <div className="font-medium">
//                                                 {formatDate(selectedBooking.from_date)} - {formatDate(selectedBooking.to_date)}
//                                             </div>
//                                         </div>
//                                         <div className="col-span-2">
//                                             <span className="text-muted-foreground">Created:</span>
//                                             <div className="font-medium">
//                                                 {formatDate(selectedBooking.created_at)} ({selectedBooking.days_since_created || getDaysSinceCreated(selectedBooking.created_at)} days ago)
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Cancellation Policy Info */}
//                                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
//                                     <div className="flex items-center gap-2 mb-2">
//                                         <Info className="h-4 w-4 text-blue-600" />
//                                         <span className="text-sm font-semibold text-blue-800">Cancellation Policy</span>
//                                     </div>
//                                     <div className="text-sm space-y-1">
//                                         {/* <p>Days until check-in: <strong>{cancellationPolicy.days_until_checkin} days</strong></p>
//                                         <p>Refund percentage: <strong>{cancellationPolicy.refund_percentage}%</strong></p> */}
//                                         <p>Recommended refund: <strong className="text-green-600">{formatCurrency(cancellationPolicy.recommended_refund)}</strong></p>
//                                         <p className="text-xs text-blue-600 mt-1">Maximum refund: {formatCurrency(cancellationPolicy.max_refund)}</p>
//                                     </div>
//                                 </div>

//                                 {/* Cancellation Reason */}
//                                 <div>
//                                     <Label>Cancellation Reason *</Label>
//                                     <Textarea
//                                         value={cancellationReason}
//                                         onChange={(e) => setCancellationReason(e.target.value)}
//                                         placeholder="Please provide reason for cancellation..."
//                                         className="mt-1"
//                                         rows={3}
//                                     />
//                                 </div>

//                                 {/* Refund Section */}
//                                 <div className="border rounded-lg p-3 space-y-3">
//                                     <div className="flex items-center justify-between">
//                                         <Label className="flex items-center gap-2">
//                                             <Wallet className="h-4 w-4" />
//                                             Process Refund
//                                         </Label>
//                                         <div className="flex items-center gap-2">
//                                             <span className="text-sm text-muted-foreground">No</span>
//                                             <button
//                                                 type="button"
//                                                 onClick={() => setProcessRefund(!processRefund)}
//                                                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${processRefund ? 'bg-green-600' : 'bg-gray-300'
//                                                     }`}
//                                             >
//                                                 <span
//                                                     className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${processRefund ? 'translate-x-6' : 'translate-x-1'
//                                                         }`}
//                                                 />
//                                             </button>
//                                             <span className="text-sm text-muted-foreground">Yes</span>
//                                         </div>
//                                     </div>

//                                     {processRefund && (
//                                         <>
//                                             {/* ADD THIS SUCCESS MESSAGE HERE */}
//                                             <div className="bg-green-50 p-2 rounded-md border border-green-200 mt-2">
//                                                 <p className="text-xs text-green-700 flex items-center gap-1">
//                                                     <CheckCircle className="h-3 w-3" />
//                                                     Refund will be processed immediately
//                                                 </p>
//                                             </div>

//                                             <div className="space-y-3 pt-2">
//                                                 <div className="grid grid-cols-2 gap-3">
//                                                     <div>
//                                                         <Label>Refund Amount *</Label>
//                                                         <div className="relative mt-1">
//                                                             <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                                                             <Input
//                                                                 type="number"
//                                                                 value={refundAmount}
//                                                                 onChange={(e) => setRefundAmount(Number(e.target.value))}
//                                                                 min={0}
//                                                                 max={maxRefundAmount}
//                                                                 step={100}
//                                                                 className="pl-10"
//                                                             />
//                                                         </div>
//                                                         <p className="text-xs text-muted-foreground mt-1">
//                                                             Max: {formatCurrency(maxRefundAmount)}
//                                                         </p>
//                                                     </div>

//                                                     <div>
//                                                         <Label>Refund Method *</Label>
//                                                         <Select value={refundMethod || ''} onValueChange={(v) => setRefundMethod(v as any)}>
//                                                             <SelectTrigger className="mt-1">
//                                                                 <SelectValue placeholder="Select method" />
//                                                             </SelectTrigger>
//                                                             <SelectContent>
//                                                                 <SelectItem value="cash">Cash</SelectItem>
//                                                                 <SelectItem value="online">Online Transfer</SelectItem>
//                                                                 <SelectItem value="bank">Bank Transfer</SelectItem>
//                                                             </SelectContent>
//                                                         </Select>
//                                                     </div>
//                                                 </div>

//                                                 {refundAmount < maxRefundAmount && (
//                                                     <div>
//                                                         <Label>Deduction Reason</Label>
//                                                         <Input
//                                                             value={deductionReason}
//                                                             onChange={(e) => setDeductionReason(e.target.value)}
//                                                             placeholder="e.g., Cancellation fee, Service charge"
//                                                             className="mt-1"
//                                                         />
//                                                         <p className="text-xs text-red-600 mt-1">
//                                                             Deduction: {formatCurrency(maxRefundAmount - refundAmount)}
//                                                         </p>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </>
//                                     )}
//                                 </div>

//                                 <DialogFooter>
//                                     <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
//                                         Cancel
//                                     </Button>
//                                     <Button
//                                         variant="destructive"
//                                         onClick={processCancellation}
//                                         disabled={isProcessing || !cancellationReason.trim() || (processRefund && !refundMethod)}
//                                         className="bg-red-600 hover:bg-red-700"
//                                     >
//                                         {isProcessing ? (
//                                             <>
//                                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                                 Processing...
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Ban className="h-4 w-4 mr-2" />
//                                                 Confirm Cancellation
//                                             </>
//                                         )}
//                                     </Button>
//                                 </DialogFooter>
//                             </div>
//                         )}
//                     </DialogContent>
//                 </Dialog>
//             </div>
//         </Layout>
//     );
// };

// export default RefundManagement;

// src/pages/RefundManagement.tsx - Updated with responsive design

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    CalendarDays,
    Search,
    RefreshCw,
    Ban,
    IndianRupee,
    Wallet,
    CreditCard,
    Landmark,
    Loader2,
    Info,
    CheckCircle,
    XCircle,
    Eye,
    FileText,
    TrendingUp,
    Building2,
    Bed,
    CalendarIcon,
    Download,
    Filter,
    Clock,
    AlertTriangle,
    Menu
} from 'lucide-react';
import { format, subDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

interface Booking {
    booking_id: number;
    booking_type: 'room' | 'advance' | 'function';
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    room_number: string;
    from_date: string;
    to_date: string;
    total: number;
    advance_paid: number;
    remaining_amount: number;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
    cancellation_reason?: string;
    days_since_created?: number;
}

interface Refund {
    id: number;
    booking_id: number;
    booking_type: string;
    refund_amount: number;
    refund_method: string;
    refund_status: string;
    transaction_id?: string;
    refund_reason: string;
    processed_at: string;
    created_at: string;
}

interface Summary {
    total: number;
    by_type: {
        room: number;
        advance: number;
        function: number;
    };
    filter_applied: {
        created_before_days: number | null;
        created_before_date: string | null;
        created_after_date: string | null;
        show_all: boolean;
        last_x_days?: number | null;
        from_date?: string | null;
        to_date?: string | null;
    };
}

const RefundManagement = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'room' | 'advance' | 'function'>('room');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancellationData, setCancellationData] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRefundHistory, setShowRefundHistory] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);

    // Date filter states
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [filterType, setFilterType] = useState<'before_days' | 'date_range' | 'show_all'>('before_days');
    const [createdBeforeDays, setCreatedBeforeDays] = useState<number>(3);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showAll, setShowAll] = useState<boolean>(false);

    // Cancellation form state
    const [cancellationReason, setCancellationReason] = useState('');
    const [processRefund, setProcessRefund] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundMethod, setRefundMethod] = useState<'cash' | 'online' | 'bank' | null>(null);
    const [refundType, setRefundType] = useState<'full' | 'partial' | 'goodwill'>('full');
    const [deductionReason, setDeductionReason] = useState('');
    const [maxRefundAmount, setMaxRefundAmount] = useState(0);
    const [recommendedRefund, setRecommendedRefund] = useState(0);
    const [cancellationPolicy, setCancellationPolicy] = useState<any>(null);

    const API_URL = import.meta.env.VITE_BACKEND_URL;
    const isInitialMount = useRef(true);

    const buildQueryParams = () => {
        const params = new URLSearchParams();
        params.append('type', activeTab);

        if (showAll) {
            params.append('show_all', 'true');
        } else if (filterType === 'before_days') {
            params.append('created_before_days', createdBeforeDays.toString());
        } else if (filterType === 'date_range') {
            if (startDate && endDate) {
                params.append('from_created_date', startDate);
                params.append('to_created_date', endDate);
            }
        }

        return params;
    };

    // Fetch bookings based on active tab and date filters
    // const fetchBookings = async () => {
    //     setLoading(true);
    //     try {
    //         const token = localStorage.getItem('authToken');
    //         const params = buildQueryParams();
    //         const url = `${API_URL}/refunds/cancellable-bookings?${params.toString()}`;

    //         const response = await fetch(url, {
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });

    //         const result = await response.json();
    //         if (result.success) {
    //             if (activeTab === 'room') {
    //                 setBookings(result.data.room_bookings || []);
    //             } else if (activeTab === 'advance') {
    //                 setBookings(result.data.advance_bookings || []);
    //             } else {
    //                 setBookings(result.data.function_bookings || []);
    //             }
    //             setSummary(result.summary);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching bookings:', error);
    //         toast({
    //             title: "Error",
    //             description: "Failed to load bookings",
    //             variant: "destructive"
    //         });
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // // Fetch refund history
    // const fetchRefundHistory = async () => {
    //     try {
    //         const token = localStorage.getItem('authToken');
    //         const response = await fetch(`${API_URL}/refunds/refunds/history`, {
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });

    //         const result = await response.json();
    //         if (result.success) {
    //             setRefunds(result.data);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching refunds:', error);
    //     }
    // };


    // Add this useEffect to clear data when component mounts
    useEffect(() => {
        // Clear all state on mount to remove old data
        setBookings([]);
        setRefunds([]);
        setSummary(null);
        setSearchTerm('');

        // Force fetch fresh data
        fetchBookings();
        fetchRefundHistory();

        // Add cleanup function for unmount
        return () => {
            // Clear data when component unmounts
            setBookings([]);
            setRefunds([]);
            setSummary(null);
        };
    }, []); // Empty dependency array - runs only on mount

    // Add this to refetch when tab changes but ensure data is fresh
    useEffect(() => {
        if (!isInitialMount.current) {
            // Clear current bookings before fetching new ones
            setBookings([]);
            fetchBookings();
        }
        isInitialMount.current = false;
    }, [activeTab]);

    // Add this to refetch when filters change
    useEffect(() => {
        if (!isInitialMount.current) {
            fetchBookings();
        }
    }, [filterType, createdBeforeDays, startDate, endDate, showAll]);

    // Modify your fetchBookings function to add cache-busting
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');

            // Add cache-busting timestamp to prevent cached responses
            const params = buildQueryParams();
            params.append('_t', Date.now().toString()); // Cache buster

            const url = `${API_URL}/refunds/cancellable-bookings?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            const result = await response.json();
            if (result.success) {
                if (activeTab === 'room') {
                    setBookings(result.data.room_bookings || []);
                } else if (activeTab === 'advance') {
                    setBookings(result.data.advance_bookings || []);
                } else {
                    setBookings(result.data.function_bookings || []);
                }
                setSummary(result.summary);
            } else {
                // Handle error case - clear bookings
                setBookings([]);
                setSummary(null);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]); // Clear on error
            toast({
                title: "Error",
                description: "Failed to load bookings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Similarly update fetchRefundHistory
    const fetchRefundHistory = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/refunds/refunds/history?_t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            const result = await response.json();
            if (result.success) {
                setRefunds(result.data);
            } else {
                setRefunds([]);
            }
        } catch (error) {
            console.error('Error fetching refunds:', error);
            setRefunds([]);
        }
    };

    // Get cancellation details for a booking
    const getCancellationDetails = async (booking: Booking) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${API_URL}/refunds/${booking.booking_id}/cancellation-details?type=${booking.booking_type}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const result = await response.json();
            if (result.success) {
                const data = result.data;
                setCancellationPolicy(data.cancellation_policy);
                setMaxRefundAmount(data.cancellation_policy.max_refund);
                setRecommendedRefund(data.cancellation_policy.recommended_refund);
                setRefundAmount(data.cancellation_policy.recommended_refund);
                setSelectedBooking(booking);
                setShowCancelDialog(true);
            }
        } catch (error) {
            console.error('Error getting cancellation details:', error);
            toast({
                title: "Error",
                description: "Failed to load cancellation details",
                variant: "destructive"
            });
        }
    };

    // Process cancellation
    const processCancellation = async () => {
        if (!cancellationReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a cancellation reason",
                variant: "destructive"
            });
            return;
        }

        if (processRefund && !refundMethod) {
            toast({
                title: "Error",
                description: "Please select a refund method",
                variant: "destructive"
            });
            return;
        }

        if (processRefund && refundAmount <= 0) {
            toast({
                title: "Error",
                description: "Refund amount must be greater than 0",
                variant: "destructive"
            });
            return;
        }

        if (processRefund && refundAmount > maxRefundAmount) {
            toast({
                title: "Error",
                description: `Refund amount cannot exceed ${formatCurrency(maxRefundAmount)}`,
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/refunds/${selectedBooking?.booking_id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: selectedBooking?.booking_type,
                    cancellation_reason: cancellationReason,
                    process_refund: processRefund,
                    refund_amount: refundAmount,
                    refund_method: refundMethod,
                    refund_type: refundType,
                    deduction_reason: deductionReason,
                    deduction_amount: maxRefundAmount - refundAmount,
                    refund_notes: `Cancelled by ${selectedBooking?.customer_name}. ${deductionReason ? `Deduction: ${deductionReason}` : ''}`
                })
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "✅ Booking Cancelled",
                    description: result.message,
                    variant: "default"
                });

                setShowCancelDialog(false);
                setCancellationReason('');
                setProcessRefund(false);
                setRefundAmount(0);
                setRefundMethod(null);
                setSelectedBooking(null);

                fetchBookings();
                fetchRefundHistory();
            } else {
                throw new Error(result.message || 'Cancellation failed');
            }
        } catch (error: any) {
            console.error('Cancellation error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to cancel booking",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return '₹' + (amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (date: string) => {
        if (!date) return 'N/A';
        return format(new Date(date), 'dd MMM yyyy');
    };

    const getDaysSinceCreated = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; class: string }> = {
            pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-800 border-green-200' },
            booked: { label: 'Booked', class: 'bg-blue-100 text-blue-800 border-blue-200' },
            cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' },
            completed: { label: 'Completed', class: 'bg-gray-100 text-gray-800 border-gray-200' }
        };
        const cfg = config[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
        return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>;
    };

    const getBookingIcon = (type: string) => {
        switch (type) {
            case 'room': return <Bed className="h-4 w-4" />;
            case 'advance': return <CalendarDays className="h-4 w-4" />;
            case 'function': return <Building2 className="h-4 w-4" />;
            default: return <CalendarIcon className="h-4 w-4" />;
        }
    };

    const getAgeBadge = (days: number) => {
        if (days >= 30) {
            return <Badge className="bg-red-100 text-red-800 border-red-200">+30 days</Badge>;
        } else if (days >= 7) {
            return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{days} days</Badge>;
        } else if (days >= 3) {
            return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{days} days</Badge>;
        } else {
            return <Badge className="bg-green-100 text-green-800 border-green-200">{days} days</Badge>;
        }
    };

    const filteredBookings = bookings.filter(booking =>
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone?.includes(searchTerm) ||
        booking.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetDateFilters = () => {
        setFilterType('before_days');
        setCreatedBeforeDays(3);
        setStartDate('');
        setEndDate('');
        setShowAll(false);
        setShowDateFilter(false);

        setTimeout(() => {
            fetchBookings();
        }, 100);
    };

    useEffect(() => {
        fetchBookings();
        fetchRefundHistory();
    }, [activeTab, filterType, createdBeforeDays, startDate, endDate, showAll]);

    return (
        <Layout>
            <div className="page-shell md:space-y-6">
                {/* Header - Responsive */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Cancellation & Refund Management
                            </h1>
                            {summary?.filter_applied?.created_before_days && !summary.filter_applied.show_all && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 w-fit">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {summary.filter_applied.created_before_days}+ days old
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                            Cancel bookings and process refunds for rooms, advance bookings, and function halls
                        </p>
                    </div>

                    {/* Action Buttons - Responsive */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={showDateFilter ? "default" : "outline"}
                            onClick={() => setShowDateFilter(!showDateFilter)}
                            size="sm"
                            className="flex-1 sm:flex-none"
                        >
                            <Filter className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="text-xs md:text-sm">{showDateFilter ? "Hide" : "Show"} Filters</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                fetchBookings();
                                fetchRefundHistory();
                            }}
                            disabled={loading}
                            size="sm"
                            className="flex-1 sm:flex-none"
                        >
                            <RefreshCw className={`h-4 w-4 mr-1 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-xs md:text-sm">Refresh</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setShowRefundHistory(!showRefundHistory)}
                            size="sm"
                            className="flex-1 sm:flex-none"
                        >
                            <Eye className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="text-xs md:text-sm">{showRefundHistory ? 'Hide' : 'Show'} History</span>
                        </Button>
                    </div>
                </div>

                {/* Date Filter Panel - Responsive */}
                {showDateFilter && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-3 md:p-4">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium">Filter by Creation Date:</span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={filterType === 'before_days' && !showAll}
                                                onChange={() => {
                                                    setFilterType('before_days');
                                                    setShowAll(false);
                                                }}
                                                className="text-blue-600"
                                            />
                                            <span className="text-sm whitespace-nowrap">Last</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={createdBeforeDays}
                                                onChange={(e) => {
                                                    const newValue = parseInt(e.target.value) || 3;
                                                    setCreatedBeforeDays(newValue);
                                                }}
                                                className="w-16 px-2 py-1 border rounded text-center text-sm"
                                                disabled={filterType !== 'before_days' || showAll}
                                            />
                                            <span className="text-sm">days</span>
                                        </label>

                                        <label className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    checked={filterType === 'date_range'}
                                                    onChange={() => {
                                                        setFilterType('date_range');
                                                        setShowAll(false);
                                                    }}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm whitespace-nowrap">Custom:</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-32 sm:w-auto"
                                                    disabled={filterType !== 'date_range'}
                                                />
                                                <span className="text-sm">to</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-32 sm:w-auto"
                                                    disabled={filterType !== 'date_range'}
                                                />
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={showAll}
                                                onChange={() => {
                                                    setShowAll(true);
                                                    setFilterType('show_all');
                                                }}
                                                className="text-blue-600"
                                            />
                                            <span className="text-sm">Show All</span>
                                        </label>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetDateFilters}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                {/* Filter Info */}
                                {summary?.filter_applied && (
                                    <div className="pt-2 border-t border-blue-200">
                                        <div className="text-xs text-blue-700">
                                            <span className="font-medium">Active Filter:</span>{' '}
                                            {summary.filter_applied.show_all ? (
                                                'Showing all bookings'
                                            ) : summary.filter_applied.last_x_days ? (
                                                `Showing bookings from last ${summary.filter_applied.last_x_days} days`
                                            ) : summary.filter_applied.from_date ? (
                                                `Showing bookings between ${summary.filter_applied.from_date} and ${summary.filter_applied.to_date}`
                                            ) : (
                                                'No date filter applied'
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Refund History Section - Responsive */}
                {showRefundHistory && (
                    <Card>
                        <CardHeader className="p-3 md:p-4">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                Refund History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4">
                            {refunds.length === 0 ? (
                                <div className="text-center py-6 md:py-8 text-muted-foreground">
                                    No refund records found
                                </div>
                            ) : (
                                <div className="space-y-3 md:space-y-4">
                                    {refunds.map((refund) => (
                                        <Card key={refund.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="p-3 md:p-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                                                            {refund.booking_type.toUpperCase()} #{refund.booking_id}
                                                        </Badge>
                                                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                                            COMPLETED
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Refund Amount:</span>
                                                            <div className="font-bold text-green-600">{formatCurrency(refund.refund_amount)}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Method:</span>
                                                            <div className="font-medium capitalize">{refund.refund_method}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Processed At:</span>
                                                            <div className="font-medium">{formatDate(refund.processed_at)}</div>
                                                        </div>
                                                        {refund.transaction_id && (
                                                            <div className="col-span-2 md:col-span-1">
                                                                <span className="text-muted-foreground">Transaction ID:</span>
                                                                <div className="font-mono text-xs break-all">{refund.transaction_id}</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-xs md:text-sm">
                                                        <span className="text-muted-foreground">Reason:</span>
                                                        <p className="text-xs md:text-sm">{refund.refund_reason}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Tabs - Responsive */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1 sm:grid sm:grid-cols-3">
                        <TabsTrigger value="room" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-1.5 md:py-2">
                            <Bed className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden xs:inline">Room</span>
                            <span className="xs:hidden">R</span>
                            {summary && (
                                <Badge className="ml-1 bg-blue-100 text-blue-800 text-xs">
                                    {summary.by_type.room}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="advance" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-1.5 md:py-2">
                            <CalendarDays className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden xs:inline">Advance</span>
                            <span className="xs:hidden">A</span>
                            {summary && (
                                <Badge className="ml-1 bg-purple-100 text-purple-800 text-xs">
                                    {summary.by_type.advance}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="function" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-1.5 md:py-2">
                            <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden xs:inline">Function</span>
                            <span className="xs:hidden">F</span>
                            {summary && (
                                <Badge className="ml-1 bg-green-100 text-green-800 text-xs">
                                    {summary.by_type.function}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                        {/* Search Bar */}
                        <Card>
                            <CardContent className="p-3 md:p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search by customer name, phone, room, or invoice..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 text-sm"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {loading ? (
                            <div className="flex justify-center py-8 md:py-12">
                                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 md:py-12 text-center">
                                    {filterType === 'before_days' && !showAll ? (
                                        <>
                                            <AlertTriangle className="h-10 w-10 md:h-12 md:w-12 text-yellow-500 mx-auto mb-3 md:mb-4" />
                                            <p className="text-base md:text-lg font-medium">No old bookings found</p>
                                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                                No bookings created before {createdBeforeDays} days ago
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3 md:mt-4"
                                                onClick={() => setShowAll(true)}
                                            >
                                                Show All Bookings
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                                            <p className="text-base md:text-lg font-medium">No bookings found</p>
                                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                                {searchTerm ? 'Try a different search term' : `No active ${activeTab} bookings to cancel`}
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {filteredBookings.map((booking) => {
                                    const daysOld = booking.days_since_created || getDaysSinceCreated(booking.created_at);
                                    const isOldBooking = daysOld >= (createdBeforeDays || 3);

                                    return (
                                        <Card
                                            key={booking.booking_id}
                                            className={`hover:shadow-md transition-shadow ${isOldBooking ? 'border-l-4 border-l-yellow-500' : ''
                                                }`}
                                        >
                                            <CardContent className="p-3 md:p-4">
                                                <div className="space-y-3">
                                                    {/* Header Row */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {booking.invoice_number}
                                                        </span>
                                                        {getStatusBadge(booking.status)}
                                                        {isOldBooking && (
                                                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {daysOld} days old
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Details Grid - Responsive */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                        <div className="min-w-0">
                                                            <span className="text-muted-foreground text-xs">Customer:</span>
                                                            <div className="font-medium text-sm truncate">{booking.customer_name}</div>
                                                            <div className="text-xs text-muted-foreground truncate">{booking.customer_phone}</div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-muted-foreground text-xs">Room:</span>
                                                            <div className="font-medium text-sm truncate">{booking.room_number || 'Not assigned'}</div>
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                {formatDate(booking.from_date)} - {formatDate(booking.to_date)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Amount:</span>
                                                            <div className="font-bold text-sm">Total: {formatCurrency(booking.total)}</div>
                                                            {booking.advance_paid > 0 && (
                                                                <div className="text-xs text-green-600">
                                                                    Advance: {formatCurrency(booking.advance_paid)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground text-xs">Created:</span>
                                                            <div className="font-medium text-sm">{formatDate(booking.created_at)}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {daysOld} days ago
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Previous Cancellation */}
                                                    {booking.cancellation_reason && (
                                                        <div className="p-2 bg-red-50 rounded-md text-xs text-red-700">
                                                            <span className="font-medium">Previous Cancellation:</span> {booking.cancellation_reason}
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    <div className="flex justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => getCancellationDetails(booking)}
                                                            className="bg-red-600 hover:bg-red-700 text-xs md:text-sm"
                                                        >
                                                            <Ban className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                                            Cancel Booking
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Cancellation Dialog - Responsive */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent className="max-w-[95vw] md:max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600 text-base md:text-lg">
                                <Ban className="h-4 w-4 md:h-5 md:w-5" />
                                Cancel Booking
                            </DialogTitle>
                        </DialogHeader>

                        {selectedBooking && cancellationPolicy && (
                            <div className="space-y-3 md:space-y-4">
                                {/* Booking Summary */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm font-semibold mb-2">Booking Details</p>
                                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 md:text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Type:</span>
                                            <div className="font-medium capitalize">{selectedBooking.booking_type}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Invoice:</span>
                                            <div className="font-medium">{selectedBooking.invoice_number}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Customer:</span>
                                            <div className="font-medium">{selectedBooking.customer_name}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Room/Venue:</span>
                                            <div className="font-medium">{selectedBooking.room_number}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Dates:</span>
                                            <div className="font-medium">
                                                {formatDate(selectedBooking.from_date)} - {formatDate(selectedBooking.to_date)}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Created:</span>
                                            <div className="font-medium">
                                                {formatDate(selectedBooking.created_at)} ({selectedBooking.days_since_created || getDaysSinceCreated(selectedBooking.created_at)} days ago)
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cancellation Policy Info */}
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-800">Cancellation Policy</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p>Recommended refund: <strong className="text-green-600">{formatCurrency(cancellationPolicy.recommended_refund)}</strong></p>
                                        <p className="text-xs text-blue-600">Maximum refund: {formatCurrency(cancellationPolicy.max_refund)}</p>
                                    </div>
                                </div>

                                {/* Cancellation Reason */}
                                <div>
                                    <Label className="text-sm">Cancellation Reason *</Label>
                                    <Textarea
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="Please provide reason for cancellation..."
                                        className="mt-1 text-sm"
                                        rows={3}
                                    />
                                </div>

                                {/* Refund Section */}
                                <div className="border rounded-lg p-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2 text-sm">
                                            <Wallet className="h-4 w-4" />
                                            Process Refund
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">No</span>
                                            <button
                                                type="button"
                                                onClick={() => setProcessRefund(!processRefund)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${processRefund ? 'bg-green-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${processRefund ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className="text-xs text-muted-foreground">Yes</span>
                                        </div>
                                    </div>

                                    {processRefund && (
                                        <>
                                            <div className="bg-green-50 p-2 rounded-md border border-green-200">
                                                <p className="text-xs text-green-700 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Refund will be processed immediately
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-sm">Refund Amount *</Label>
                                                        <div className="relative mt-1">
                                                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={refundAmount}
                                                                onChange={(e) => setRefundAmount(Number(e.target.value))}
                                                                min={0}
                                                                max={maxRefundAmount}
                                                                step={100}
                                                                className="pl-10 text-sm"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Max: {formatCurrency(maxRefundAmount)}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <Label className="text-sm">Refund Method *</Label>
                                                        <Select value={refundMethod || ''} onValueChange={(v) => setRefundMethod(v as any)}>
                                                            <SelectTrigger className="mt-1 text-sm">
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="cash">Cash</SelectItem>
                                                                <SelectItem value="online">Online Transfer</SelectItem>
                                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {refundAmount < maxRefundAmount && (
                                                    <div>
                                                        <Label className="text-sm">Deduction Reason</Label>
                                                        <Input
                                                            value={deductionReason}
                                                            onChange={(e) => setDeductionReason(e.target.value)}
                                                            placeholder="e.g., Cancellation fee, Service charge"
                                                            className="mt-1 text-sm"
                                                        />
                                                        <p className="text-xs text-red-600 mt-1">
                                                            Deduction: {formatCurrency(maxRefundAmount - refundAmount)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button variant="outline" onClick={() => setShowCancelDialog(false)} size="sm" className="w-full sm:w-auto">
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={processCancellation}
                                        disabled={isProcessing || !cancellationReason.trim() || (processRefund && !refundMethod)}
                                        className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                        size="sm"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Ban className="h-4 w-4 mr-2" />
                                                Confirm Cancellation
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};

export default RefundManagement;