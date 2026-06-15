


// import { useMemo, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Layout from '@/components/Layout';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import {
//   Bed,
//   Calendar as CalendarIcon,
//   Users,
//   TrendingUp,
//   ArrowRight,
//   RefreshCw,
//   Ban,
//   Lock,
//   Zap,
//   MessageSquare,
//   Download,
//   UserPlus,
//   Shield,
//   DollarSign,
//   BarChart3,
//   PlusCircle,
//   ChevronDown,
//   ChevronUp,
//   IndianRupee,
//   Clock,
//   AlertTriangle,
//   AlertCircle,
//   Settings,
//   BadgeCheck,
//   CreditCard,
//   Loader2,
//   LogOut
// } from 'lucide-react';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { format } from 'date-fns';
// import { useIsMobile } from '@/hooks/use-mobile';
// import { useToast } from '@/hooks/use-toast';
// import { useFeatureFlag } from '@/hooks/use-feature-flag';
// import { UpgradePrompt } from '@/components/UpgradePrompt';
// import {
//   hasPermission,
//   getUserPermissions,
//   isAdmin,
//   getUserRole
// } from '@/lib/permissions';
// import { handleSubscriptionExpired } from '@/lib/subscription'



// // URLs
// const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
// const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // ---------------- Types ----------------
// type RawRoom = Record<string, any>;
// type RawBooking = Record<string, any>;
// type RawCustomer = Record<string, any>;

// interface Room {
//   roomId: string;
//   number: string | number;
//   type: string;
//   status: string;
// }

// interface Booking {
//   bookingId: string;
//   roomId: string;
//   customerId: string;
//   customerName: string;
//   fromDate: string;
//   toDate: string;
//   status: string;
//   total: number;
//   createdAt: string;
// }

// interface Customer {
//   customerId: string;
//   customerName: string;
// }

// // Stat Card Interface
// interface StatCard {
//   title: string;
//   value: string | number;
//   icon: React.ComponentType<any>;
//   color: string;
//   description: string;
//   available: boolean;
//   permission?: string;
//   onClick?: () => void;
// }

// // Type declaration for Razorpay
// interface RazorpayOptions {
//   key: string;
//   amount: number;
//   currency: string;
//   name: string;
//   description: string;
//   order_id: string;
//   handler: (response: any) => void;
//   prefill: {
//     name: string;
//     email: string;
//     contact: string;
//   };
//   notes: Record<string, string>;
//   theme: {
//     color: string;
//   };
//   modal?: {
//     ondismiss?: () => void;
//     confirm_close?: boolean;
//     escape?: boolean;
//   };
//   retry?: {
//     enabled: boolean;
//     max_count: number;
//   };
//   callback_url?: string;
//   redirect?: boolean;
//   image?: string;
// }

// declare global {
//   interface Window {
//     Razorpay: new (options: RazorpayOptions) => {
//       open: () => void;
//       on: (event: string, callback: (response: any) => void) => void;
//     };
//   }
// }

// // ------------- JSONP fetch util for Google Sheets -------------
// function jsonpFetch<T>(src: string): Promise<T> {
//   return new Promise<T>((resolve, reject) => {
//     const callbackName = 'cb_' + String(Date.now()) + String(Math.floor(Math.random() * 10000));
//     (window as any)[callbackName] = (data: T) => {
//       resolve(data);
//       delete (window as any)[callbackName];
//       const script = document.getElementById(callbackName);
//       if (script && script.parentNode) script.parentNode.removeChild(script);
//     };
//     const script = document.createElement('script');
//     script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
//     script.id = callbackName;
//     script.onerror = () => {
//       reject(new Error('Failed to load script'));
//       delete (window as any)[callbackName];
//       if (script && script.parentNode) script.parentNode.removeChild(script);
//     };
//     document.body.appendChild(script);
//   });
// }


// let lastDispatchTime = 0;
// const DISPATCH_DEBOUNCE_TIME = 10000;

// async function fetchBackendData<T>(endpoint: string, options?: {
//   skipExpiredRedirect?: boolean;
// }): Promise<T> {
//   const token = localStorage.getItem('authToken');

//   if (!token) {
//     console.error('❌ No auth token found');
//     window.location.href = '/login';
//     throw new Error('No authentication token');
//   }

//   const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
//     method: 'GET',
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   // Handle 403 errors - could be auth or subscription expired
//   if (response.status === 403) {
//     try {
//       const errorData = await response.json();
//       console.error('❌ 403 Error details:', errorData);

//       // MORE COMPREHENSIVE CHECK for subscription expired
//       // Check various possible error structures
//       const errorMessage = errorData.message?.toLowerCase() || '';
//       const errorCode = errorData.code?.toLowerCase() || '';
//       const error = errorData.error?.toLowerCase() || '';

//       const isSubscriptionExpired =
//         errorCode.includes('subscription_expired') ||
//         errorCode.includes('trial_expired') ||
//         errorMessage.includes('subscription expired') ||
//         errorMessage.includes('trial expired') ||
//         error.includes('subscription expired') ||
//         error.includes('trial expired') ||
//         errorData.status === 'suspended' ||
//         errorData.subscription_status === 'expired';



//       if (isSubscriptionExpired) {
//         console.log('⚠️ Trial expired detected in API response');

//         const now = Date.now();

//         // Only dispatch if we haven't dispatched recently
//         if (now - lastDispatchTime > DISPATCH_DEBOUNCE_TIME) {
//           lastDispatchTime = now;

//           // Handle subscription expiry - update localStorage but DON'T redirect
//           const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//           const updatedUser = {
//             ...currentUser,
//             isTrialExpired: true,
//             status: 'suspended',
//             trial_expiry_date: errorData.expiryDate || errorData.trial_expiry_date || currentUser.trial_expiry_date,
//             subscription_status: 'expired'
//           };
//           localStorage.setItem('currentUser', JSON.stringify(updatedUser));

//           // Dispatch custom event
//           window.dispatchEvent(new CustomEvent('subscription:expired', {
//             detail: { user: updatedUser }
//           }));
//         } else {
//           console.log('⏱️ Debouncing duplicate expired dispatch');
//         }
//         throw new Error('TRIAL_EXPIRED');
//       }
//       // Check if this is an authentication error (invalid token)
//       const isAuthError =
//         errorMessage.includes('unauthorized') ||
//         errorMessage.includes('unauthenticated') ||
//         errorMessage.includes('invalid token') ||
//         errorMessage.includes('token expired') ||
//         errorCode.includes('unauthorized') ||
//         errorCode.includes('invalid_token');

//       if (isAuthError) {
//         console.error('❌ Authentication failed - Token may be expired');
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('currentUser');
//         localStorage.removeItem('hotelLogo');

//         // Only redirect if not already on login page
//         if (!window.location.pathname.includes('/login')) {
//           window.location.href = '/login';
//         }

//         throw new Error('Session expired. Please login again.');
//       }

//       // If we get here, it's some other kind of 403 - maybe don't redirect
//       console.log('⚠️ Other 403 error, not redirecting:', errorData);
//       throw new Error('Access forbidden');

//     } catch (parseError) {
//       // If we can't parse the error response, check if it's HTML (maybe a server error page)
//       console.error('❌ Failed to parse error response', parseError);

//       // Don't automatically redirect - maybe it's a server error
//       throw new Error('Failed to process response');
//     }
//   }

//   if (!response.ok) {
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }

//   const data = await response.json();
//   return data;
// }
// // Load Razorpay script function
// const loadRazorpayScript = (): Promise<boolean> => {
//   return new Promise((resolve) => {
//     if (window.Razorpay) {
//       console.log('✅ Razorpay already loaded');
//       resolve(true);
//       return;
//     }

//     const script = document.createElement('script');
//     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//     script.onload = () => {
//       console.log('✅ Razorpay script loaded successfully');
//       resolve(true);
//     };
//     script.onerror = () => {
//       console.error('❌ Failed to load Razorpay script');
//       resolve(false);
//     };
//     document.body.appendChild(script);
//   });
// };

// // ---------------- Helper functions ----------------
// const parseAmount = (val: any): number => {
//   if (val === null || val === undefined) return 0;
//   if (typeof val === 'number' && !isNaN(val)) return val;
//   if (typeof val === 'string') {
//     const cleaned = val.replace(/[^\d.-]/g, '').trim();
//     const num = parseFloat(cleaned);
//     return isNaN(num) ? 0 : num;
//   }
//   return 0;
// };

// const formatISODate = (val: any): string => {
//   if (!val) return '';
//   if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
//     return val;
//   }
//   if (typeof val === 'string' && val.includes('T')) {
//     try {
//       const date = new Date(val);
//       if (!isNaN(date.getTime())) {
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const day = String(date.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//       }
//     } catch (e) {
//       console.warn('Failed to parse ISO date:', val, e);
//     }
//   }
//   return String(val || '');
// };

// // Helper function to display dates in DD/MM/YYYY format
// const formatDisplayDate = (dateStr: string): string => {
//   if (!dateStr) return 'Invalid date';
//   try {
//     if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
//       const [year, month, day] = dateStr.split('-');
//       return `${day}/${month}/${year}`;
//     }
//     return dateStr;
//   } catch {
//     return dateStr;
//   }
// };

// // ------------------ Dashboard --------------------
// const Dashboard = () => {
//   const navigate = useNavigate();
//   const isMobile = useIsMobile();
//   const { toast } = useToast();

//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [syncing, setSyncing] = useState(false);
//   const [showAllRecentBookings, setShowAllRecentBookings] = useState(false);
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [reactivationAmount, setReactivationAmount] = useState<number>(999);
//   // Check permissions
//   const userPermissions = getUserPermissions();
//   const userRole = getUserRole();
//   const isUserAdmin = isAdmin();

//   const canViewDashboard = hasPermission('view_dashboard');
//   const canViewRooms = hasPermission('view_rooms');
//   const canManageRooms = hasPermission('manage_rooms');
//   const canViewBookings = hasPermission('view_bookings');
//   const canCreateBooking = hasPermission('create_booking');
//   const canEditBooking = hasPermission('edit_booking');
//   const canViewCustomers = hasPermission('view_customers');
//   const canManageCustomers = hasPermission('manage_customers');
//   const canViewReports = hasPermission('view_reports');
//   const canManageStaff = hasPermission('manage_staff');
//   const canViewFinancial = hasPermission('view_financial');
//   const [showProBanner, setShowProBanner] = useState(true);

//   // Feature flags
//   const hasDailyRevenue = useFeatureFlag('daily_revenue');
//   const hasOccupancyRate = useFeatureFlag('occupancy_rate');
//   const hasFinancialReports = useFeatureFlag('financial_reports');
//   const hasAdvancedAnalytics = useFeatureFlag('advanced_analytics');
//   const hasExportData = useFeatureFlag('export_data');
//   const [lastExpiredEvent, setLastExpiredEvent] = useState<number>(0);


//   const [trialInfo, setTrialInfo] = useState<{
//     daysLeft: number;
//     isExpired: boolean;
//     expiryDate: string | null;
//     status: 'active' | 'warning' | 'expired';
//     originalExpiryDate?: Date;
//   }>({
//     daysLeft: 0,
//     isExpired: false,
//     expiryDate: null,
//     status: 'active'
//   });
//   // At the top of Dashboard component, after the imports
//   useEffect(() => {
//     // Override any potential redirects for suspended users
//     const checkUserStatus = () => {
//       const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
//       if (user.status === 'suspended' || user.isTrialExpired) {
//         console.log('🛡️ Suspended user detected, preventing redirects');
//         setShowPaymentModal(true);
//       }
//     };

//     checkUserStatus();

//     // Also check when storage changes
//     const handleStorageChange = () => {
//       checkUserStatus();
//     };

//     window.addEventListener('storage', handleStorageChange);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//     };
//   }, []);


//   // In Dashboard.tsx - Replace the existing subscription expired useEffect
//   // In Dashboard.tsx - Replace the existing subscription expired useEffect
//   useEffect(() => {
//     // Use a ref to track if we've shown the toast in this component instance
//     const toastShownRef = { current: false };
//     const TOAST_DEBOUNCE_TIME = 10000; // 10 seconds - longer debounce

//     const handleSubscriptionExpired = (event: any) => {
//       console.log('📢 Subscription expired event received in Dashboard');

//       const now = Date.now();

//       // Check if we've handled this recently (within 10 seconds)
//       if (now - lastExpiredEvent < TOAST_DEBOUNCE_TIME) {
//         console.log('⏱️ Debouncing duplicate expired event');
//         return;
//       }

//       // Update last event time
//       setLastExpiredEvent(now);

//       // Update current user state
//       if (event.detail?.user) {
//         setCurrentUser(event.detail.user);
//       }

//       // Show payment modal
//       setShowPaymentModal(true);

//       // Show toast only once EVER for this component instance
//       if (!toastShownRef.current) {
//         toastShownRef.current = true;
//         toast({
//           title: "Trial Expired",
//           description: "Your trial has expired. Please reactivate your account.",
//           variant: "destructive",
//         });
//       }
//     };

//     window.addEventListener('subscription:expired', handleSubscriptionExpired);

//     return () => {
//       window.removeEventListener('subscription:expired', handleSubscriptionExpired);
//     };
//   }, [toast, lastExpiredEvent]); // Remove toastShownRef from dependencies
//   // Check auth token on mount
//   useEffect(() => {
//     const token = localStorage.getItem('authToken');
//     console.log('🔑 Auth Token exists:', !!token);
//     if (token) {
//       try {
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const payload = JSON.parse(window.atob(base64));
//         console.log('📅 Token expiry:', new Date(payload.exp * 1000).toLocaleString());
//       } catch (e) {
//         console.log('Not a JWT token or cannot decode');
//       }
//     }
//   }, []);

//   // Setup user from localStorage once
//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
//     setCurrentUser(user);
//     if (user?.customReactivationAmount) {
//       setReactivationAmount(user.customReactivationAmount);
//     } else {
//       setReactivationAmount(999); // Default fallback
//     }
//     console.log("👤 Current user:", user);

//     if (canViewDashboard) {
//       fetchData();
//     }
//   }, []);

//   // Calculate trial status
//   useEffect(() => {
//     console.log('🔍 Checking trial status for user:', {
//       status: currentUser?.status,
//       plan: currentUser?.plan,
//       trial_expiry_date: currentUser?.trial_expiry_date,
//       isTrialExpired: currentUser?.isTrialExpired
//     });

//     if (currentUser) {
//       const checkTrialExpired = () => {
//         if (currentUser?.isTrialExpired === true) {
//           console.log('⚠️ Trial expired (from backend flag)');
//           setShowPaymentModal(true);
//           return;
//         }

//         if (currentUser?.status === 'suspended' && currentUser?.plan === 'pro') {
//           console.log('⚠️ User is suspended on PRO plan');
//           setShowPaymentModal(true);
//           return;
//         }

//         if (currentUser?.status === 'pending' && currentUser?.plan === 'pro') {
//           const expiryDate = currentUser.trialInfo?.expiryDate || currentUser.trial_expiry_date;

//           console.log('📅 Trial expiry date:', expiryDate);

//           if (!expiryDate) {
//             console.log('❌ No trial expiry date found');
//             return;
//           }

//           const now = new Date();
//           const expiry = new Date(expiryDate);
//           const timeDiff = expiry.getTime() - now.getTime();
//           const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

//           const isExpired = daysLeft <= 0;
//           let status: 'active' | 'warning' | 'expired' = 'active';

//           if (isExpired) {
//             status = 'expired';
//           } else if (daysLeft <= 2) {
//             status = 'warning';
//           }

//           console.log('📈 Trial calculation result:', {
//             daysLeft,
//             isExpired,
//             status
//           });

//           setTrialInfo({
//             daysLeft: Math.max(0, daysLeft),
//             isExpired,
//             expiryDate: expiry.toLocaleDateString('en-IN', {
//               day: 'numeric',
//               month: 'short',
//               year: 'numeric'
//             }),
//             status,
//             originalExpiryDate: expiry
//           });

//           if (isExpired) {
//             console.log('⚠️ Trial has expired, showing payment modal');
//             setShowPaymentModal(true);
//           }
//         }
//       };

//       checkTrialExpired();
//     }
//   }, [currentUser]);

//   // Check if trial has expired
//   // Check trial status on mount and when currentUser changes
//   useEffect(() => {
//     console.log('🔍 Checking trial status for user:', {
//       status: currentUser?.status,
//       plan: currentUser?.plan,
//       trial_expiry_date: currentUser?.trial_expiry_date,
//       isTrialExpired: currentUser?.isTrialExpired
//     });

//     if (currentUser) {
//       // Check if user is explicitly marked as expired
//       if (currentUser?.isTrialExpired === true) {
//         console.log('⚠️ Trial expired (from user flag)');
//         setShowPaymentModal(true);
//         return;
//       }

//       // Check if user is suspended
//       if (currentUser?.status === 'suspended' && currentUser?.plan === 'pro') {
//         console.log('⚠️ User is suspended on PRO plan');
//         setShowPaymentModal(true);
//         return;
//       }

//       // Check trial expiry date for pending users
//       if (currentUser?.status === 'pending' && currentUser?.plan === 'pro') {
//         const expiryDate = currentUser.trialInfo?.expiryDate ||
//           currentUser.trial_expiry_date ||
//           currentUser.trialExpiryDate;

//         console.log('📅 Trial expiry date:', expiryDate);

//         if (!expiryDate) {
//           console.log('❌ No trial expiry date found');
//           return;
//         }

//         const now = new Date();
//         const expiry = new Date(expiryDate);
//         const timeDiff = expiry.getTime() - now.getTime();
//         const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

//         const isExpired = daysLeft <= 0;
//         let status: 'active' | 'warning' | 'expired' = 'active';

//         if (isExpired) {
//           status = 'expired';
//         } else if (daysLeft <= 2) {
//           status = 'warning';
//         }

//         console.log('📈 Trial calculation result:', {
//           daysLeft,
//           isExpired,
//           status
//         });

//         setTrialInfo({
//           daysLeft: Math.max(0, daysLeft),
//           isExpired,
//           expiryDate: expiry.toLocaleDateString('en-IN', {
//             day: 'numeric',
//             month: 'short',
//             year: 'numeric'
//           }),
//           status,
//           originalExpiryDate: expiry
//         });

//         if (isExpired) {
//           console.log('⚠️ Trial has expired, showing payment modal');
//           setShowPaymentModal(true);
//         }
//       }
//     }
//   }, [currentUser]);

//   const isTrialUser = currentUser?.status === 'pending' && currentUser?.plan === 'pro';
//   const isActivePro = currentUser?.status === 'active' && currentUser?.plan === 'pro';
//   const isBasicPlan = currentUser?.plan === 'basic';

//   // ✅ Fetch from Google Sheets (Basic Plan)
//   const fetchFromGoogleSheets = async () => {
//     if (!currentUser?.spreadsheetId) return;
//     setLoading(true);
//     const spreadsheetid = encodeURIComponent(currentUser.spreadsheetId);
//     try {
//       console.log("📊 Fetching from Google Sheets...");
//       const [r, b, c] = await Promise.all([
//         jsonpFetch<{ rooms: RawRoom[] }>(`${APPS_SCRIPT_URL}?action=getRooms&spreadsheetid=${spreadsheetid}`),
//         jsonpFetch<{ bookings: RawBooking[] }>(`${APPS_SCRIPT_URL}?action=getBookings&spreadsheetid=${spreadsheetid}`),
//         jsonpFetch<{ customers: RawCustomer[] }>(`${APPS_SCRIPT_URL}?action=getCustomers&spreadsheetid=${spreadsheetid}`)
//       ]);

//       const normRooms: Room[] = Array.isArray(r.rooms)
//         ? r.rooms.map((raw: RawRoom): Room => {
//           const rec = {} as RawRoom;
//           Object.keys(raw).forEach(k => rec[k.trim().toLowerCase()] = raw[k]);
//           return {
//             roomId: rec.roomid?.toString() || '',
//             number: rec.number ?? rec.roomnumber ?? '',
//             type: rec.type?.toString() || '',
//             status: (rec.status || '').toString().toLowerCase()
//           };
//         })
//         : [];
//       setRooms(normRooms);

//       const normBookings: Booking[] = Array.isArray(b.bookings)
//         ? b.bookings.map((raw: RawBooking): Booking => {
//           const rec = {} as RawBooking;
//           Object.keys(raw).forEach(k => rec[k.trim().toLowerCase()] = raw[k]);

//           const fromDateRaw = rec.fromdate ?? rec.checkindate;
//           const toDateRaw = rec.todate ?? rec.checkoutdate;

//           const fromDate = formatISODate(fromDateRaw);
//           const toDate = formatISODate(toDateRaw);

//           return {
//             bookingId: rec.bookingid?.toString() || '',
//             roomId: rec.roomid?.toString() || '',
//             customerId: rec.customerid?.toString() || '',
//             customerName: rec.customername?.toString() || '',
//             fromDate: fromDate,
//             toDate: toDate,
//             status: (rec.status || '').toString().toLowerCase(),
//             total: parseAmount(rec.total),
//             createdAt: formatISODate(rec.createdat ?? rec.created_at),
//           };
//         })
//         : [];
//       setBookings(normBookings);

//       const normCustomers: Customer[] = Array.isArray(c.customers)
//         ? c.customers.map((raw: RawCustomer): Customer => {
//           const rec = {} as RawCustomer;
//           Object.keys(raw).forEach(k => rec[k.trim().toLowerCase()] = raw[k]);
//           return {
//             customerId: rec.customerid?.toString() || '',
//             customerName: (rec.name ?? rec.customername)?.toString() || ''
//           };
//         })
//         : [];
//       setCustomers(normCustomers);

//       console.log("✅ Google Sheets data loaded:", {
//         rooms: normRooms.length,
//         bookings: normBookings.length,
//         customers: normCustomers.length
//       });

//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: "Failed to load data from Google Sheets: " + error.message,
//         variant: "destructive"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };


//   const fetchFromBackend = async () => {
//     try {
//       setLoading(true);
//       console.log("📊 Fetching from Backend Database...");

//       const [roomsData, bookingsData, customersData] = await Promise.all([
//         fetchBackendData<{ success: boolean; data: any[] }>('/rooms'),
//         fetchBackendData<{ success: boolean; data: any[] }>('/bookings'),
//         fetchBackendData<{ success: boolean; data: any[] }>('/customers')
//       ]);

//       const normRooms: Room[] = roomsData.data.map((room: any) => ({
//         roomId: room.id.toString(),
//         number: room.room_number,
//         type: room.type,
//         status: room.status
//       }));

//       const normBookings: Booking[] = bookingsData.data.map((booking: any) => {
//         const customerName = booking.customer_name || booking.customer_name || 'Unknown Customer';
//         return {
//           bookingId: booking.id.toString(),
//           roomId: booking.room_id.toString(),
//           customerId: booking.customer_id?.toString() || '',
//           customerName: customerName,
//           fromDate: formatISODate(booking.from_date),
//           toDate: formatISODate(booking.to_date),
//           status: booking.status || 'booked',
//           total: parseAmount(booking.total),
//           createdAt: formatISODate(booking.created_at || new Date().toISOString())
//         };
//       });

//       const normCustomers: Customer[] = customersData.data.map((customer: any) => ({
//         customerId: customer.id.toString(),
//         customerName: customer.name || ''
//       }));

//       setRooms(normRooms);
//       setBookings(normBookings);
//       setCustomers(normCustomers);

//       console.log("✅ Backend Database data loaded:", {
//         rooms: normRooms.length,
//         bookings: normBookings.length,
//         customers: normCustomers.length
//       });

//     } catch (error: any) {
//       console.error('❌ Error in fetchFromBackend:', error);

//       // Handle trial expired specially - NO TOAST HERE
//       if (error.message === 'TRIAL_EXPIRED') {
//         console.log('🔄 Trial expired detected, showing payment modal only');

//         // Force a re-fetch of user data or update state
//         const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
//         setCurrentUser(prev => ({
//           ...prev,
//           ...user,
//           isTrialExpired: true,
//           status: 'suspended'
//         }));
//         if (user.customReactivationAmount) {
//           setReactivationAmount(user.customReactivationAmount);
//         }

//         // Show payment modal immediately
//         setShowPaymentModal(true);

//         // IMPORTANT: Return early without showing any toast
//         return;
//       }

//       // For network errors or other unexpected errors, show toast
//       // But check if it's not a subscription expired error
//       if (!error.message?.includes('TRIAL_EXPIRED')) {
//         toast({
//           title: "Error",
//           description: "Failed to load data from Database: " + (error.message || "Unknown error"),
//           variant: "destructive"
//         });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };
//   const fetchData = async () => {
//     if (!currentUser) return;
//     console.log("🔄 Fetching data for user:", {
//       source: currentUser.source,
//       plan: currentUser.plan
//     });

//     if (currentUser.source === 'database' || currentUser.plan === 'pro') {
//       await fetchFromBackend();
//     } else {
//       await fetchFromGoogleSheets();
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [currentUser]);

//   // Manual sync function (only for Google Sheets)
//   const syncRoomStatuses = async () => {
//     if (!currentUser?.spreadsheetId) {
//       toast({
//         title: "Info",
//         description: "Sync is only available for Basic Plan users",
//         variant: "default"
//       });
//       return;
//     }

//     try {
//       setSyncing(true);
//       await jsonpFetch(`${APPS_SCRIPT_URL}?action=syncroomstatuses&spreadsheetid=${encodeURIComponent(currentUser.spreadsheetId)}`);
//       await fetchData();
//       toast({
//         title: "Success",
//         description: "Room statuses synced successfully"
//       });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: "Failed to sync room statuses: " + error.message,
//         variant: "destructive"
//       });
//     } finally {
//       setSyncing(false);
//     }
//   };

//   // ============= PAYMENT HANDLER - UPDATED WITH OLD PROJECT LOGIC =============
//   const handleReactivatePayment = async () => {
//     try {
//       setIsProcessingPayment(true);

//       // Load Razorpay script
//       const scriptLoaded = await loadRazorpayScript();
//       if (!scriptLoaded) {
//         toast({
//           title: "Payment Error",
//           description: "Failed to load payment gateway. Please refresh and try again.",
//           variant: "destructive",
//         });
//         setIsProcessingPayment(false);
//         return;
//       }

//       const backendUrl = import.meta.env.VITE_BACKEND_URL;
//       const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
//       const token = localStorage.getItem('authToken');

//       console.log('🔧 Payment Config:', {
//         backendUrl,
//         razorpayKey: razorpayKey ? 'Present' : 'Missing',
//         hotelId: currentUser?.hotel_id,
//         email: currentUser?.email
//       });

//       if (!razorpayKey) {
//         toast({
//           title: "Configuration Error",
//           description: "Razorpay key is not configured",
//           variant: "destructive",
//         });
//         setIsProcessingPayment(false);
//         return;
//       }

//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "Please login again",
//           variant: "destructive",
//         });
//         navigate('/login');
//         return;
//       }

//       // Step 1: Create order in backend
//       console.log('📤 Creating reactivation order...');
//       const orderResponse = await fetch(`${backendUrl}/pro-payments/reactivate`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           hotel_id: currentUser?.hotel_id,
//           email: currentUser?.email,
//           name: currentUser?.name || currentUser?.adminName,
//           phone: currentUser?.phone
//         })
//       });

//       if (!orderResponse.ok) {
//         const errorData = await orderResponse.json().catch(() => ({}));
//         throw new Error(errorData.message || `Server error: ${orderResponse.status}`);
//       }

//       const orderData = await orderResponse.json();
//       console.log('✅ Order created:', orderData);

//       if (!orderData.success) {
//         throw new Error(orderData.message || 'Failed to create order');
//       }

//       // Step 2: Add small delay to ensure order propagates (like your old project)
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // Step 3: Open Razorpay checkout
//       const options: RazorpayOptions = {
//         key: razorpayKey,
//         amount: orderData.data.amount, // Already in paise (99900)
//         currency: orderData.data.currency || 'INR',
//         name: "Hotel Management System",
//         description: "PRO Plan Reactivation (6 Months Access)",
//         order_id: orderData.data.id,
//         handler: async (response: any) => {
//           console.log('✅ Payment success:', response);

//           try {
//             // Step 4: Verify payment with backend
//             const verifyResponse = await fetch(`${backendUrl}/pro-payments/verify-reactivation`, {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json',
//               },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 hotel_id: currentUser?.hotel_id
//               })
//             });

//             const verifyData = await verifyResponse.json();

//             if (verifyData.success) {
//               toast({
//                 title: "Payment Successful!",
//                 description: "Your account has been reactivated. Please login again.",
//                 variant: "default",
//               });

//               // Clear storage and redirect to login
//               setTimeout(() => {
//                 localStorage.removeItem('authToken');
//                 localStorage.removeItem('currentUser');
//                 navigate('/login');
//               }, 2000);
//             } else {
//               throw new Error(verifyData.message || 'Payment verification failed');
//             }
//           } catch (verifyError: any) {
//             console.error('❌ Verification error:', verifyError);
//             toast({
//               title: "Verification Failed",
//               description: verifyError.message,
//               variant: "destructive",
//             });
//           } finally {
//             setIsProcessingPayment(false);
//           }
//         },
//         prefill: {
//           name: currentUser?.name || currentUser?.adminName || '',
//           email: currentUser?.email || '',
//           contact: currentUser?.phone || '',
//         },
//         notes: {
//           type: 'reactivation',
//           hotel_id: String(currentUser?.hotel_id || ''),
//           hotel_name: currentUser?.hotelName || ''
//         },
//         theme: {
//           color: "#3b82f6"
//         },
//         modal: {
//           ondismiss: () => {
//             console.log("Payment modal closed");
//             setIsProcessingPayment(false);
//           },
//           confirm_close: true
//         },
//         // Add retry configuration (like your old project)
//         retry: {
//           enabled: true,
//           max_count: 3
//         }
//       };

//       console.log('🚀 Opening Razorpay with order_id:', options.order_id);
//       const razorpayInstance = new window.Razorpay(options);

//       razorpayInstance.on('payment.failed', (response: any) => {
//         console.error("❌ Payment failed:", response.error);
//         toast({
//           title: "Payment Failed",
//           description: response.error.description || "Payment could not be completed",
//           variant: "destructive",
//         });
//         setIsProcessingPayment(false);
//       });

//       razorpayInstance.open();

//     } catch (error: any) {
//       console.error("❌ Payment error:", error);
//       toast({
//         title: "Payment Error",
//         description: error.message || "Failed to process payment. Please try again.",
//         variant: "destructive",
//       });
//       setIsProcessingPayment(false);
//     }
//   };

//   // Stats calculations
//   const stats = useMemo(() => {
//     const selectedDateStr = selectedDate.toISOString().split('T')[0];

//     const activeBookingsForSelectedDate = bookings.filter(b => {
//       const isActive = selectedDateStr >= b.fromDate && selectedDateStr <= b.toDate;
//       return isActive;
//     });

//     const bookedBookings = activeBookingsForSelectedDate.filter(b =>
//       ['booked', 'confirmed', 'checked-in'].includes(b.status)
//     );
//     const blockedBookings = activeBookingsForSelectedDate.filter(b =>
//       b.status === 'blocked'
//     );
//     const maintenanceBookings = activeBookingsForSelectedDate.filter(b =>
//       b.status === 'maintenance'
//     );

//     const bookedRoomIds = [...new Set(bookedBookings.map(b => b.roomId))];
//     const blockedRoomIds = [...new Set(blockedBookings.map(b => b.roomId))];
//     const maintenanceRoomIds = [...new Set(maintenanceBookings.map(b => b.roomId))];

//     const availableRooms = rooms.length -
//       bookedRoomIds.length -
//       blockedRoomIds.length -
//       maintenanceRoomIds.length;

//     const dailyRevenue = hasDailyRevenue
//       ? bookedBookings.reduce((sum, b) => sum + Number(b.total || 0), 0)
//       : 0;

//     const occupancyRate = hasOccupancyRate && rooms.length > 0
//       ? (bookedRoomIds.length / rooms.length) * 100
//       : 0;

//     const averageRevenuePerRoom = hasDailyRevenue && bookedRoomIds.length > 0
//       ? dailyRevenue / bookedRoomIds.length
//       : 0;

//     return {
//       totalRooms: rooms.length,
//       availableRooms: Math.max(0, availableRooms),
//       bookedRooms: bookedRoomIds.length,
//       blockedRooms: blockedRoomIds.length,
//       maintenanceRooms: maintenanceRoomIds.length,
//       totalRevenue: dailyRevenue,
//       totalCustomers: customers.length,
//       occupancyRate: occupancyRate,
//       averageRevenuePerRoom: averageRevenuePerRoom,
//       totalRecords: rooms.length + bookings.length + customers.length
//     };
//   }, [rooms, bookings, customers, selectedDate, hasDailyRevenue, hasOccupancyRate]);

//   // Get recent bookings (last 5)
//   const recentBookings = useMemo(
//     () => bookings.filter(b => ['confirmed', 'booked', 'checked-in'].includes(b.status))
//       .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
//     [bookings]
//   );

//   // Get bookings to display based on showAllRecentBookings state
//   const displayRecentBookings = showAllRecentBookings
//     ? recentBookings
//     : recentBookings.slice(0, 5);

//   const bookingsForSelectedDate = useMemo(() => {
//     const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
//     console.log('Filtering bookings for date:', selectedDateStr);

//     const filteredBookings = bookings.filter((booking) => {
//       if (!booking.fromDate || !booking.toDate) return false;
//       const fromDate = booking.fromDate;
//       const toDate = booking.toDate;
//       const selected = selectedDateStr;
//       const isInRange = selected >= fromDate && selected < toDate;
//       const isValidStatus = ['booked', 'confirmed', 'checked-in'].includes(booking.status);
//       return isInRange && isValidStatus;
//     });

//     console.log('Final filtered count:', filteredBookings.length);
//     return filteredBookings;
//   }, [bookings, selectedDate]);

//   // Basic Plan stat cards (limited features) - with permission checks
//   const basicPlanStatCards: StatCard[] = [
//     {
//       title: 'Total Rooms',
//       value: stats.totalRooms,
//       icon: Bed,
//       color: 'bg-blue-500',
//       onClick: () => canViewRooms && navigate('/rooms'),
//       description: 'All rooms',
//       available: canViewRooms,
//       permission: 'view_rooms'
//     },
//     {
//       title: 'Available Today',
//       value: stats.availableRooms,
//       icon: Bed,
//       color: 'bg-green-500',
//       onClick: () => canViewRooms && navigate('/rooms'),
//       description: `on ${format(selectedDate, 'MMM dd')}`,
//       available: canViewRooms,
//       permission: 'view_rooms'
//     },
//     {
//       title: 'Booked Today',
//       value: stats.bookedRooms,
//       icon: CalendarIcon,
//       color: 'bg-purple-500',
//       onClick: () => canViewBookings && navigate('/bookings'),
//       description: `on ${format(selectedDate, 'MMM dd')}`,
//       available: canViewBookings,
//       permission: 'view_bookings'
//     },
//     {
//       title: 'Total Customers',
//       value: stats.totalCustomers,
//       icon: Users,
//       color: 'bg-indigo-500',
//       onClick: () => canViewCustomers && navigate('/customers'),
//       description: 'All time',
//       available: canViewCustomers,
//       permission: 'view_customers'
//     },
//   ];

//   // Pro Plan additional stat cards
//   const proPlanStatCards: StatCard[] = [
//     ...basicPlanStatCards,
//     {
//       title: 'Daily Revenue',
//       value: `₹${stats.totalRevenue.toLocaleString()}`,
//       icon: TrendingUp,
//       color: 'bg-orange-500',
//       description: `on ${format(selectedDate, 'MMM dd')}`,
//       available: hasDailyRevenue && canViewFinancial,
//       permission: 'view_financial'
//     },
//     {
//       title: 'Occupancy Rate',
//       value: `${stats.occupancyRate.toFixed(1)}%`,
//       icon: TrendingUp,
//       color: 'bg-teal-500',
//       description: `on ${format(selectedDate, 'MMM dd')}`,
//       available: hasOccupancyRate && canViewReports,
//       permission: 'view_reports'
//     },
//     {
//       title: 'Avg Revenue Per Room',
//       value: stats.bookedRooms > 0 ? `₹${stats.averageRevenuePerRoom.toFixed(0)}` : '₹0',
//       icon: IndianRupee,
//       color: 'bg-amber-500',
//       description: `on ${format(selectedDate, 'MMM dd')}`,
//       available: hasDailyRevenue && canViewFinancial,
//       permission: 'view_financial'
//     }
//   ];

//   const statCards: StatCard[] = currentUser?.plan === 'pro' ? proPlanStatCards : basicPlanStatCards;

//   // Handle data export
//   const handleExportData = () => {
//     if (!hasExportData || !canViewReports) {
//       toast({
//         title: "Pro Feature",
//         description: "Data export is available in Pro plan. Upgrade to export your data.",
//         action: (
//           <Button size="sm" onClick={() => navigate('/upgrade')}>
//             Upgrade Now
//           </Button>
//         ),
//       });
//       return;
//     }

//     toast({
//       title: "Export Started",
//       description: "Your data export has been initiated.",
//     });
//   };

//   // Toggle show all recent bookings
//   const toggleRecentBookings = () => {
//     setShowAllRecentBookings(!showAllRecentBookings);
//   };

//   // Handle logout
//   const handleLogout = () => {
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('currentUser');
//     navigate('/login');
//   };

//   // If user doesn't have dashboard permission
//   if (!canViewDashboard && !isUserAdmin) {
//     return (
//       <Layout>
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <Card className="w-full max-w-md">
//             <CardHeader className="text-center">
//               <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
//                 <Shield className="w-6 h-6 text-red-600" />
//               </div>
//               <CardTitle>Access Denied</CardTitle>
//               <p className="text-muted-foreground">
//                 You don't have permission to view the dashboard
//               </p>
//             </CardHeader>
//             <CardContent className="text-center">
//               <Button onClick={() => navigate('/')}>
//                 Return Home
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       {/* Trial Expired Modal - Blurred Overlay */}
//       {showPaymentModal && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
//           <div className="bg-white rounded-2xl p-6 w-[95%] max-w-[500px] shadow-2xl 
//                     max-h-[90vh] overflow-y-auto 
//                     animate-in zoom-in-95 duration-300
//                     border border-gray-200">
//             <div className="text-center">
//               {/* Header */}
//               <div className="mb-4">
//                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                   <AlertTriangle className="w-8 h-8 text-red-600" />
//                 </div>
//                 <h2 className="text-xl font-bold text-gray-900 mb-1">Trial Period Ended</h2>
//                 <p className="text-gray-600 text-sm">Your 30-day PRO trial has expired</p>
//               </div>

//               {/* Trial Details - Compact */}
//               <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
//                 <div className="grid grid-cols-2 gap-3 text-sm">
//                   <div className="text-left">
//                     <p className="text-xs text-gray-500 mb-1">Plan</p>
//                     <p className="font-semibold text-gray-900">PRO Plan</p>
//                   </div>
//                   <div className="text-left">
//                     <p className="text-xs text-gray-500 mb-1">Expired On</p>
//                     <p className="font-semibold text-gray-900">{trialInfo.expiryDate}</p>
//                   </div>
//                   <div className="text-left">
//                     <p className="text-xs text-gray-500 mb-1">Status</p>
//                     <Badge variant="destructive" className="px-2 py-0.5 text-xs">
//                       Suspended
//                     </Badge>
//                   </div>
//                   <div className="text-left">
//                     <p className="text-xs text-gray-500 mb-1">Hotel</p>
//                     <p className="font-semibold text-gray-900 truncate">{currentUser?.hotelName}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Payment Details - Compact */}
//               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
//                 <h3 className="font-bold text-base text-blue-900 mb-2">Reactivate Your Account</h3>
//                 <div className="flex items-center justify-between mb-3">
//                   <div>
//                     <p className="text-gray-700 text-sm">PRO Plan Reactivation</p>
//                     <p className="text-xs text-gray-500">one months access</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-xl font-bold text-blue-700">{reactivationAmount}</p>
//                     <p className="text-xs text-gray-500">One-time payment</p>
//                   </div>
//                 </div>

//                 <ul className="text-left text-xs text-gray-600 space-y-1.5 mb-3">
//                   <li className="flex items-start">
//                     <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
//                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
//                     </div>
//                     Full access to all PRO features
//                   </li>
//                   <li className="flex items-start">
//                     <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
//                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
//                     </div>
//                     Unlimited records and storage
//                   </li>
//                   <li className="flex items-start">
//                     <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
//                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
//                     </div>
//                     Advanced analytics and reports
//                   </li>
//                 </ul>
//               </div>

//               {/* Action Buttons */}
//               <div className="space-y-3">
//                 <Button
//                   className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
//                   onClick={handleReactivatePayment}
//                   disabled={isProcessingPayment}
//                 >
//                   {isProcessingPayment ? (
//                     <>
//                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                       Processing Payment...
//                     </>
//                   ) : (
//                     <>
//                       <CreditCard className="w-4 h-4 mr-2" />
//                       Pay ₹{reactivationAmount} to Reactivate
//                     </>
//                   )}
//                 </Button>

//                 <div className="flex gap-2">
//                   {/* <Button
//                     variant="outline"
//                     className="flex-1 h-10 border-gray-300 hover:bg-gray-50 text-sm"
//                     onClick={() => {
//                       setShowPaymentModal(false);
//                       toast({
//                         title: "Account Suspended",
//                         description: "You can make payment later to reactivate your account",
//                         variant: "destructive",
//                       });
//                     }}
//                   >
//                     Later
//                   </Button> */}
//                   <Button
//                     variant="outline"
//                     className="flex-1 h-10 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
//                     onClick={handleLogout}
//                   >
//                     <LogOut className="w-3.5 h-3.5 mr-1.5" />
//                     Logout
//                   </Button>
//                 </div>
//               </div>

//               {/* Footer Note */}
//               <p className="text-xs text-gray-500 mt-4">
//                 Need help? Contact support at services@hithlakshsolutions.com
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Dashboard Content - Rest of your UI remains same */}
//       <div className="space-y-4 md:space-y-6">
//         {/* Basic Plan Banner */}
//         {isBasicPlan && (
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1">
//                   <Zap className="w-4 h-4 text-blue-600" />
//                   <h3 className="font-semibold text-blue-800 text-sm">Basic Plan</h3>
//                   <Badge variant="outline" className="text-blue-600 bg-blue-100 text-xs">Essential Features</Badge>
//                 </div>
//                 <p className="text-blue-600 text-xs">
//                   You're on our Basic Plan with essential hotel management features.
//                   Upgrade to Pro for advanced analytics, financial reports, and revenue tracking.
//                 </p>
//                 <div className="flex items-center gap-3 mt-1 text-xs text-blue-600">
//                   <span>📊 {stats.totalRecords}/5,000 records</span>
//                   <span>🏨 {stats.totalRooms} rooms</span>
//                   <span>👥 {stats.totalCustomers} customers</span>
//                 </div>
//               </div>
//               <Button
//                 size="sm"
//                 onClick={() => navigate('/upgrade')}
//                 className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap text-xs h-8"
//               >
//                 <TrendingUp className="w-3 h-3 mr-1" />
//                 Upgrade to Pro
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Storage Limit Warning for Basic Plan */}
//         {isBasicPlan && stats.totalRecords > 4500 && (
//           <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
//             <div className="flex items-center gap-2">
//               <div className="flex-1">
//                 <p className="text-amber-800 text-xs font-medium">
//                   ⚠️ Approaching Basic Plan limit ({stats.totalRecords}/5,000 records)
//                 </p>
//                 <p className="text-amber-700 text-xs mt-0.5">
//                   Upgrade to Pro for unlimited records and enhanced performance.
//                 </p>
//               </div>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => navigate('/upgrade')}
//                 className="text-amber-800 border-amber-300 hover:bg-amber-100 text-xs h-7"
//               >
//                 Upgrade
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Trial Status Banner - Shows for PRO trial users */}
//         {isTrialUser && !showPaymentModal && (
//           <div className={`border rounded-lg p-3 ${trialInfo.status === 'expired'
//             ? 'bg-red-50 border-red-200'
//             : trialInfo.status === 'warning'
//               ? 'bg-amber-50 border-amber-200'
//               : 'bg-blue-50 border-blue-200'
//             }`}>
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1">
//                   {trialInfo.status === 'expired' ? (
//                     <AlertTriangle className="w-4 h-4 text-red-600" />
//                   ) : trialInfo.status === 'warning' ? (
//                     <AlertTriangle className="w-4 h-4 text-amber-600" />
//                   ) : (
//                     <Clock className="w-4 h-4 text-blue-600" />
//                   )}
//                   <h3 className="font-semibold text-sm">
//                     {trialInfo.status === 'expired'
//                       ? 'Trial Expired'
//                       : trialInfo.status === 'warning'
//                         ? 'Trial Ending Soon'
//                         : 'PRO Plan Trial'
//                     }
//                   </h3>
//                   <Badge variant="outline" className={`
//             text-xs ${trialInfo.status === 'expired'
//                       ? 'text-red-600 bg-red-100'
//                       : trialInfo.status === 'warning'
//                         ? 'text-amber-600 bg-amber-100'
//                         : 'text-blue-600 bg-blue-100'
//                     }`
//                   }>
//                     {trialInfo.status === 'expired' ? 'SUSPENDED' : 'TRIAL'}
//                   </Badge>
//                 </div>

//                 <p className={`text-xs ${trialInfo.status === 'expired'
//                   ? 'text-red-600'
//                   : trialInfo.status === 'warning'
//                     ? 'text-amber-600'
//                     : 'text-blue-600'
//                   }`}>
//                   {trialInfo.status === 'expired' ? (
//                     <>Your 30-day PRO trial has ended. Please make payment to reactivate your account.</>
//                   ) : trialInfo.status === 'warning' ? (
//                     <>Your PRO trial ends in {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''}. Upgrade now to avoid interruption.</>
//                   ) : (
//                     <>You're on a 30-day PRO trial. {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''} remaining.</>
//                   )}
//                 </p>

//                 <div className="flex items-center gap-3 mt-1 text-xs">
//                   <span className={`
//             ${trialInfo.status === 'expired'
//                       ? 'text-red-600'
//                       : trialInfo.status === 'warning'
//                         ? 'text-amber-600'
//                         : 'text-blue-600'
//                     }`
//                   }>
//                     <CalendarIcon className="inline w-3 h-3 mr-1" />
//                     {trialInfo.status === 'expired' ? 'Expired: ' : 'Expires: '}{trialInfo.expiryDate}
//                   </span>
//                   <span className={`
//             ${trialInfo.status === 'expired'
//                       ? 'text-red-600'
//                       : trialInfo.status === 'warning'
//                         ? 'text-amber-600'
//                         : 'text-blue-600'
//                     }`
//                   }>
//                     <Clock className="inline w-3 h-3 mr-1" />
//                     {trialInfo.status === 'expired'
//                       ? 'Account Suspended'
//                       : `${trialInfo.daysLeft} day${trialInfo.daysLeft !== 1 ? 's' : ''} left`
//                     }
//                   </span>
//                 </div>

//                 {/* Show payment button for expired trial */}
//                 {trialInfo.status === 'expired' && (
//                   <div className="mt-2">
//                     <Button
//                       size="sm"
//                       onClick={handleReactivatePayment}
//                       disabled={isProcessingPayment}
//                       className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
//                     >
//                       {isProcessingPayment ? (
//                         <>
//                           <Loader2 className="w-3 h-3 mr-1 animate-spin" />
//                           Processing...
//                         </>
//                       ) : (
//                         <>
//                           <CreditCard className="w-3 h-3 mr-1" />
//                           Pay ₹{reactivationAmount} to Reactivate
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 )}
//               </div>

//               {trialInfo.status !== 'expired' && (
//                 <Button
//                   size="sm"
//                   onClick={() => {
//                     if (trialInfo.status === 'warning') {
//                       handleReactivatePayment();
//                     } else {
//                       navigate('/upgrade');
//                     }
//                   }}
//                   className={`
//       whitespace-nowrap text-xs h-8
//       ${trialInfo.status === 'warning'
//                       ? 'bg-amber-600 hover:bg-amber-700 text-white'
//                       : 'bg-blue-600 hover:bg-blue-700 text-white'
//                     }`
//                   }
//                   disabled={isProcessingPayment}
//                 >
//                   {isProcessingPayment ? (
//                     <>
//                       <Loader2 className="w-3 h-3 mr-1 animate-spin" />
//                       Processing...
//                     </>
//                   ) : trialInfo.status === 'warning' ? (
//                     <>
//                       <CreditCard className="w-3 h-3 mr-1" />
//                       Pay ₹999 to Extend
//                     </>
//                   ) : (
//                     'Learn More'
//                   )}
//                 </Button>
//               )}
//             </div>
//           </div>
//         )}


//         {/* Active PRO Plan Banner */}

//         {isActivePro && showProBanner && (
//           <div className="bg-green-50 border border-green-200 rounded-lg p-3 relative">
//             {/* Close Button */}
//             <button
//               onClick={() => setShowProBanner(false)}
//               className="absolute top-3 right-3 p-1 rounded-full hover:bg-green-200 transition-colors"
//               aria-label="Close banner"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="16"
//                 height="16"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 className="text-green-700"
//               >
//                 <line x1="18" y1="6" x2="6" y2="18"></line>
//                 <line x1="6" y1="6" x2="18" y2="18"></line>
//               </svg>
//             </button>

//             <div className="flex items-center gap-2 pr-8"> {/* Added padding-right to prevent text overlap with close button */}
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1">
//                   <BadgeCheck className="w-4 h-4 text-green-600" />
//                   <h3 className="font-semibold text-green-800 text-sm">PRO Plan Active</h3>
//                   {/* <Badge variant="outline" className="text-green-600 bg-green-100 text-xs">Full Access</Badge> */}
//                 </div>
//                 <p className="text-green-600 text-xs">
//                   You have full access to all PRO features including advanced analytics, financial reports, and unlimited records.
//                 </p>
//               </div>

//             </div>
//           </div>
//         )}

//         {/* Header + Date Picker */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//           <div>
//             <div className="flex items-center gap-3">
//               <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
//               {currentUser && (
//                 <>
//                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${isTrialUser ? 'bg-amber-100 text-amber-800' :
//                     isActivePro ? 'bg-green-100 text-green-800' :
//                       'bg-blue-100 text-blue-800'
//                     }`}>
//                     {isTrialUser ? 'PRO Trial' :
//                       isActivePro ? 'PRO Active' :
//                         'Basic Plan'}
//                   </span>

//                   {isTrialUser && trialInfo.status === 'expired' && (
//                     <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
//                       <Ban className="w-3 h-3 mr-1" />
//                       Suspended
//                     </Badge>
//                   )}

//                   {isUserAdmin && (
//                     <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
//                       <Shield className="w-3 h-3 mr-1" />
//                       Admin
//                     </Badge>
//                   )}
//                 </>
//               )}
//             </div>
//             <p className="text-muted-foreground mt-1 text-xs md:text-sm">
//               Welcome back, {currentUser?.adminName || currentUser?.name || 'User'}
//               {isUserAdmin && ' (Administrator)'}
//               {!isUserAdmin && currentUser?.role && ` (${currentUser.role})`}

//               {/* Add trial info in subtitle */}
//               {isTrialUser && !trialInfo.isExpired && (
//                 <span className="ml-2 text-amber-600">
//                   • Trial: {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''} left
//                 </span>
//               )}
//               {isTrialUser && trialInfo.isExpired && (
//                 <span className="ml-2 text-red-600">
//                   • Trial expired
//                 </span>
//               )}
//             </p>
//           </div>

//           <div className="flex gap-2">
//             {currentUser?.source === 'google_sheets' && (
//               <Button
//                 variant="outline"
//                 onClick={syncRoomStatuses}
//                 disabled={syncing}
//                 className="flex items-center gap-2 text-xs h-8"
//               >
//                 <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
//                 {syncing ? 'Syncing...' : 'Sync Status'}
//               </Button>
//             )}

//             {/* Show Manage Staff button only for admins */}
//             {isUserAdmin && canManageStaff && currentUser?.source === 'database' && (
//               <Button
//                 variant="default"
//                 onClick={() => navigate('/staff')}
//                 className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-xs h-8"
//               >
//                 <UserPlus className="w-3 h-3" />
//                 Manage Staff
//               </Button>
//             )}

//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button variant="outline" className="text-xs h-8">
//                   <CalendarIcon className="mr-1 h-3 w-3" />
//                   {selectedDate ? format(selectedDate, 'PP') : 'Pick a date'}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="p-0" align="end">
//                 <Calendar
//                   mode="single"
//                   selected={selectedDate}
//                   onSelect={date => date && setSelectedDate(date)}
//                   className="rounded-md border"
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="flex justify-center items-center py-4">
//             <RefreshCw className="h-6 w-6 animate-spin text-primary" />
//             <span className="ml-2 text-sm">Loading data ...</span>
//           </div>
//         )}

//         {/* Stats Cards - Reduced Size */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//           {statCards.map((stat, idx) => {
//             const Icon = stat.icon;
//             const hasPerm = stat.available;

//             // For Basic Plan, show upgrade prompt for Pro features
//             if (isBasicPlan && !stat.available) {
//               return (
//                 <UpgradePrompt key={idx} feature={stat.title}>
//                   <Card className="hover:shadow transition-shadow opacity-50 cursor-pointer">
//                     <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3">
//                       <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
//                       <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
//                         <Icon className="w-4 h-4 text-white" />
//                       </div>
//                     </CardHeader>
//                     <CardContent className="px-3 pb-3">
//                       <div className="text-xl font-bold text-muted-foreground">
//                         {stat.title.includes('Revenue') ? '₹---' : '--%'}
//                       </div>
//                       {stat.description && (
//                         <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </UpgradePrompt>
//               );
//             }

//             return (
//               <Card
//                 key={idx}
//                 className={`hover:shadow transition-shadow ${hasPerm && stat.onClick ? 'cursor-pointer' : ''} ${!hasPerm ? 'opacity-50 cursor-not-allowed' : ''
//                   }`}
//                 onClick={hasPerm ? stat.onClick : undefined}
//               >
//                 <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3">
//                   <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
//                   <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
//                     <Icon className="w-4 h-4 text-white" />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="px-3 pb-3">
//                   <div className="text-xl font-bold">{stat.value}</div>
//                   {stat.description && (
//                     <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>

//         {/* Pro Features Section for Basic Plan Users - Smaller */}
//         {isBasicPlan && (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
//             {/* Financial Reports Card */}
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
//                 <CardTitle className="flex items-center gap-2 text-sm">
//                   Financial Reports
//                   <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
//                     PRO
//                   </Badge>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="px-4 pb-4">
//                 <UpgradePrompt feature="Financial Reports">
//                   <div className="space-y-2 p-3 rounded-lg border border-dashed border-gray-200 text-center">
//                     <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-1" />
//                     <h4 className="font-medium text-gray-600 text-sm">Advanced Financial Insights</h4>
//                     <p className="text-xs text-gray-500">
//                       Track revenue trends, profit margins, and financial performance
//                     </p>
//                     <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
//                       <div className="text-left">• Revenue Reports</div>
//                       <div className="text-left">• Profit Analysis</div>
//                       <div className="text-left">• Expense Tracking</div>
//                       <div className="text-left">• Tax Calculations</div>
//                     </div>
//                   </div>
//                 </UpgradePrompt>
//               </CardContent>
//             </Card>

//             {/* WhatsApp Reminders Card */}
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
//                 <CardTitle className="flex items-center gap-2 text-sm">
//                   WhatsApp Reminders
//                   <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
//                     PRO
//                   </Badge>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="px-4 pb-4">
//                 <UpgradePrompt feature="WhatsApp Reminders">
//                   <div className="space-y-2 p-3 rounded-lg border border-dashed border-gray-200 text-center">
//                     <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-1" />
//                     <h4 className="font-medium text-gray-600 text-sm">Automated Guest Communication</h4>
//                     <p className="text-xs text-gray-500">
//                       Send automatic check-in/check-out reminders via WhatsApp
//                     </p>
//                     <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
//                       <div className="text-left">• Auto Reminders</div>
//                       <div className="text-left">• Bulk Messaging</div>
//                       <div className="text-left">• Template Messages</div>
//                       <div className="text-left">• Delivery Reports</div>
//                     </div>
//                   </div>
//                 </UpgradePrompt>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* Recent Bookings & Quick Actions */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
//           {/* Recent Bookings Card */}
//           <Card>
//             <CardHeader className="flex items-center justify-between px-4 pt-4 pb-2">
//               <CardTitle className="text-base">Recent Bookings</CardTitle>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={toggleRecentBookings}
//                 className="flex items-center gap-1 text-xs h-7"
//               >
//                 {showAllRecentBookings ? (
//                   <>
//                     <ChevronUp className="w-3 h-3" />
//                     Show Less
//                   </>
//                 ) : (
//                   <>
//                     View All
//                     <ChevronDown className="w-3 h-3" />
//                   </>
//                 )}
//               </Button>
//             </CardHeader>
//             <CardContent className="px-4 pb-4">
//               {displayRecentBookings.length === 0 ? (
//                 <p className="text-muted-foreground text-center py-4 text-sm">No bookings yet</p>
//               ) : (
//                 <div className="space-y-2">
//                   {displayRecentBookings.map((b) => {
//                     const room = rooms.find((r) => r.roomId === b.roomId);
//                     return (
//                       <div
//                         key={b.bookingId}
//                         className="flex items-center justify-between p-2 rounded-md bg-secondary hover:bg-secondary/80 cursor-pointer text-sm"
//                         onClick={() => canViewBookings && navigate('/bookings')}
//                       >
//                         <div className="flex-1 min-w-0">
//                           <p className="font-medium truncate">{b.customerName}</p>
//                           <p className="text-xs text-muted-foreground truncate">
//                             Room {room?.number} • {formatDisplayDate(b.fromDate)}
//                           </p>
//                         </div>
//                         <div className="text-right ml-2">
//                           {/* Basic Plan: Hide revenue details */}
//                           {isBasicPlan ? (
//                             <Badge variant="outline" className="text-xs bg-blue-50 px-1.5 py-0.5">
//                               Booked
//                             </Badge>
//                           ) : (
//                             <>
//                               <p className="font-semibold text-sm">₹{Number(b.total).toLocaleString()}</p>
//                               <p className="text-xs text-muted-foreground capitalize">{b.status}</p>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Quick Actions Card */}
//           <Card>
//             <CardHeader className="px-4 pt-4 pb-2">
//               <CardTitle className="text-base">Quick Actions</CardTitle>
//             </CardHeader>
//             <CardContent className="px-4 pb-4 space-y-2">
//               <Button
//                 className="w-full justify-start text-sm h-9"
//                 variant="outline"
//                 onClick={() => canViewRooms && navigate('/rooms')}
//                 disabled={!canViewRooms}
//               >
//                 <Bed className="mr-2 w-4 h-4" />
//                 {canViewRooms ? 'Manage Rooms' : 'View Rooms'}
//               </Button>
//               <Button
//                 className="w-full justify-start text-sm h-9"
//                 variant="outline"
//                 onClick={() => canViewBookings && navigate('/bookings')}
//                 disabled={!canViewBookings}
//               >
//                 <CalendarIcon className="mr-2 w-4 h-4" />
//                 {canViewBookings ? 'View Bookings' : 'View Bookings'}
//               </Button>
//               <Button
//                 className="w-full justify-start text-sm h-9"
//                 variant="outline"
//                 onClick={() => canViewCustomers && navigate('/customers')}
//                 disabled={!canViewCustomers}
//               >
//                 <Users className="mr-2 w-4 h-4" />
//                 {canViewCustomers ? 'View Customers' : 'View Customers'}
//               </Button>

//               {canCreateBooking && (
//                 <Button
//                   className="w-full justify-start text-sm h-9"
//                   variant="outline"
//                   onClick={() => navigate('/roombooking')}
//                 >
//                   <PlusCircle className="mr-2 w-4 h-4" />
//                   New Booking
//                 </Button>
//               )}

//               {currentUser?.source === 'google_sheets' && (
//                 <Button
//                   className="w-full justify-start text-sm h-9"
//                   variant="outline"
//                   onClick={syncRoomStatuses}
//                   disabled={syncing}
//                 >
//                   <RefreshCw className={`mr-2 w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
//                   {syncing ? 'Syncing...' : 'Sync Room Status'}
//                 </Button>
//               )}

//               {isUserAdmin && canManageStaff && currentUser?.source === 'database' && (
//                 <Button
//                   className="w-full justify-start text-sm h-9 bg-purple-600 hover:bg-purple-700 text-white"
//                   onClick={() => navigate('/staff')}
//                 >
//                   <UserPlus className="mr-2 w-4 h-4" />
//                   Manage Staff
//                 </Button>
//               )}

//               {isBasicPlan && (
//                 <Button
//                   className="w-full justify-start text-sm h-9 bg-blue-600 hover:bg-blue-700 text-white"
//                   onClick={() => navigate('/upgrade')}
//                 >
//                   <Zap className="mr-2 w-4 h-4" />
//                   Upgrade to Pro
//                 </Button>
//               )}

//               {!isBasicPlan && canViewReports && (
//                 <Button
//                   className="w-full justify-start text-sm h-9"
//                   variant="outline"
//                   onClick={handleExportData}
//                 >
//                   <Download className="mr-2 w-4 h-4" />
//                   Export Data
//                 </Button>
//               )}

//               {/* Trial expired payment option */}
//               {isTrialUser && trialInfo.isExpired && (
//                 <Button
//                   className="w-full justify-start text-sm h-9 bg-red-600 hover:bg-red-700 text-white"
//                   onClick={handleReactivatePayment}
//                   disabled={isProcessingPayment}
//                 >
//                   {isProcessingPayment ? (
//                     <>
//                       <Loader2 className="mr-2 w-4 h-4 animate-spin" />
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <CreditCard className="mr-2 w-4 h-4" />
//                       Reactivate Account (₹{reactivationAmount})
//                     </>
//                   )}
//                 </Button>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Dashboard;


import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bed,
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Ban,
  Lock,
  Zap,
  MessageSquare,
  Download,
  UserPlus,
  Shield,
  DollarSign,
  BarChart3,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Clock,
  AlertTriangle,
  AlertCircle,
  Settings,
  BadgeCheck,
  CreditCard,
  Loader2,
  LogOut,
  LineChart,
  CalendarDays,
  Wrench,
  Building2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subMonths, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import {
  hasPermission,
  getUserPermissions,
  isAdmin,
  getUserRole
} from '@/lib/permissions';
import { handleSubscriptionExpired } from '@/lib/subscription';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// URLs
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ---------------- Types ----------------
type RawRoom = Record<string, any>;
type RawBooking = Record<string, any>;
type RawCustomer = Record<string, any>;

interface Room {
  roomId: string;
  number: string | number;
  type: string;
  status: string;
}

interface Booking {
  bookingId: string;
  roomId: string;
  customerId: string;
  customerName: string;
  fromDate: string;
  toDate: string;
  status: string;
  total: number;
  createdAt: string;
  isAdvanceBooking?: boolean;
  advanceAmount?: number;
  remainingAmount?: number;
  advanceExpiryDate?: string;
}

interface Customer {
  customerId: string;
  customerName: string;
}

// Chart Data Interface
interface ChartDataPoint {
  date: string;
  formattedDate: string;
  bookings: number;
}

// Stat Card Interface
interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  available: boolean;
  permission?: string;
  onClick?: () => void;
}

// Type declaration for Razorpay
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    escape?: boolean;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  callback_url?: string;
  redirect?: boolean;
  image?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

// ------------- JSONP fetch util for Google Sheets -------------
function jsonpFetch<T>(src: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const callbackName = 'cb_' + String(Date.now()) + String(Math.floor(Math.random() * 10000));
    (window as any)[callbackName] = (data: T) => {
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
}

let lastDispatchTime = 0;
const DISPATCH_DEBOUNCE_TIME = 10000;

async function fetchBackendData<T>(endpoint: string, options?: {
  skipExpiredRedirect?: boolean;
}): Promise<T> {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.error('❌ No auth token found');
    window.location.href = '/login';
    throw new Error('No authentication token');
  }

  const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle 403 errors - could be auth or subscription expired
  if (response.status === 403) {
    try {
      const errorData = await response.json();
      console.error('❌ 403 Error details:', errorData);

      // MORE COMPREHENSIVE CHECK for subscription expired
      // Check various possible error structures
      const errorMessage = errorData.message?.toLowerCase() || '';
      const errorCode = errorData.code?.toLowerCase() || '';
      const error = errorData.error?.toLowerCase() || '';

      const isSubscriptionExpired =
        errorCode.includes('subscription_expired') ||
        errorCode.includes('trial_expired') ||
        errorMessage.includes('subscription expired') ||
        errorMessage.includes('trial expired') ||
        error.includes('subscription expired') ||
        error.includes('trial expired') ||
        errorData.status === 'suspended' ||
        errorData.subscription_status === 'expired';

      if (isSubscriptionExpired) {
        console.log('⚠️ Trial expired detected in API response');

        const now = Date.now();

        // Only dispatch if we haven't dispatched recently
        if (now - lastDispatchTime > DISPATCH_DEBOUNCE_TIME) {
          lastDispatchTime = now;

          // Handle subscription expiry - update localStorage but DON'T redirect
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const updatedUser = {
            ...currentUser,
            isTrialExpired: true,
            status: 'suspended',
            trial_expiry_date: errorData.expiryDate || errorData.trial_expiry_date || currentUser.trial_expiry_date,
            subscription_status: 'expired'
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));

          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('subscription:expired', {
            detail: { user: updatedUser }
          }));
        } else {
          console.log('⏱️ Debouncing duplicate expired dispatch');
        }
        throw new Error('TRIAL_EXPIRED');
      }
      // Check if this is an authentication error (invalid token)
      const isAuthError =
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('unauthenticated') ||
        errorMessage.includes('invalid token') ||
        errorMessage.includes('token expired') ||
        errorCode.includes('unauthorized') ||
        errorCode.includes('invalid_token');

      if (isAuthError) {
        console.error('❌ Authentication failed - Token may be expired');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('hotelLogo');

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        throw new Error('Session expired. Please login again.');
      }

      // If we get here, it's some other kind of 403 - maybe don't redirect
      console.log('⚠️ Other 403 error, not redirecting:', errorData);
      throw new Error('Access forbidden');

    } catch (parseError) {
      // If we can't parse the error response, check if it's HTML (maybe a server error page)
      console.error('❌ Failed to parse error response', parseError);

      // Don't automatically redirect - maybe it's a server error
      throw new Error('Failed to process response');
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Load Razorpay script function
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      console.log('✅ Razorpay already loaded');
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// ---------------- Helper functions ----------------
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

const formatISODate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  if (typeof val === 'string' && val.includes('T')) {
    try {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn('Failed to parse ISO date:', val, e);
    }
  }
  return String(val || '');
};

// Helper function to display dates in DD/MM/YYYY format
// const formatDisplayDate = (dateStr: string): string => {
//   if (!dateStr) return 'Invalid date';
//   try {
//     if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
//       const [year, month, day] = dateStr.split('-');
//       return `${day}/${month}/${year}`;
//     }
//     return dateStr;
//   } catch {
//     return dateStr;
//   }
// };

// Helper function to display dates in DD/MM/YYYY format with proper timezone handling
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return 'Invalid date';
  try {
    // If it's in ISO format with Z (UTC)
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Convert to IST by adding 5.5 hours (19800000 ms)
        const istDate = new Date(date.getTime() + 19800000);
        const day = String(istDate.getUTCDate()).padStart(2, '0');
        const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const year = istDate.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    }

    // If it's in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  } catch {
    return dateStr;
  }
};

// Helper function to normalize date for comparison (removes timezone issues)
// const normalizeDate = (dateStr: string): string => {
//   if (!dateStr) return '';
//   // If it's in YYYY-MM-DD format, return as is
//   if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
//     return dateStr;
//   }
//   // Try to parse and format
//   try {
//     const date = new Date(dateStr);
//     if (!isNaN(date.getTime())) {
//       const year = date.getFullYear();
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const day = String(date.getDate()).padStart(2, '0');
//       return `${year}-${month}-${day}`;
//     }
//   } catch (e) {
//     console.warn('Failed to normalize date:', dateStr, e);
//   }
//   return dateStr;
// };

// Helper function to normalize date for comparison (handles timezone)
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';

  // If it's in ISO format with Z (UTC)
  if (dateStr.includes('T') && dateStr.includes('Z')) {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Convert to IST for comparison
        const istDate = new Date(date.getTime() + 19800000);
        const year = istDate.getUTCFullYear();
        const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn('Failed to normalize date:', dateStr, e);
    }
  }

  // If it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return dateStr;
};

// ------------------ Dashboard --------------------
const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [chartDateRange, setChartDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: subMonths(new Date(), 1),
    end: new Date()
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAllRecentBookings, setShowAllRecentBookings] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reactivationAmount, setReactivationAmount] = useState<number>(999);
  const [chartView, setChartView] = useState<'line' | 'bar'>('line');
  const [chartPeriod, setChartPeriod] = useState<'1month' | '3months' | '6months'>('1month');

  // Check permissions
  const userPermissions = getUserPermissions();
  const userRole = getUserRole();
  const isUserAdmin = isAdmin();

  const canViewDashboard = hasPermission('view_dashboard');
  const canViewRooms = hasPermission('view_rooms');
  const canManageRooms = hasPermission('manage_rooms');
  const canViewBookings = hasPermission('view_bookings');
  const canCreateBooking = hasPermission('create_booking');
  const canEditBooking = hasPermission('edit_booking');
  const canViewCustomers = hasPermission('view_customers');
  const canManageCustomers = hasPermission('manage_customers');
  const canViewReports = hasPermission('view_reports');
  const canManageStaff = hasPermission('manage_staff');
  const canViewFinancial = hasPermission('view_financial');
  const [showProBanner, setShowProBanner] = useState(true);

  // Feature flags
  const hasDailyRevenue = useFeatureFlag('daily_revenue');
  const hasOccupancyRate = useFeatureFlag('occupancy_rate');
  const hasFinancialReports = useFeatureFlag('financial_reports');
  const hasAdvancedAnalytics = useFeatureFlag('advanced_analytics');
  const hasExportData = useFeatureFlag('export_data');
  const [lastExpiredEvent, setLastExpiredEvent] = useState<number>(0);

  const [trialInfo, setTrialInfo] = useState<{
    daysLeft: number;
    isExpired: boolean;
    expiryDate: string | null;
    status: 'active' | 'warning' | 'expired';
    originalExpiryDate?: Date;
  }>({
    daysLeft: 0,
    isExpired: false,
    expiryDate: null,
    status: 'active'
  });

  // At the top of Dashboard component, after the imports
  useEffect(() => {
    // Override any potential redirects for suspended users
    const checkUserStatus = () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (user.status === 'suspended' || user.isTrialExpired) {
        console.log('🛡️ Suspended user detected, preventing redirects');
        setShowPaymentModal(true);
      }
    };

    checkUserStatus();

    // Also check when storage changes
    const handleStorageChange = () => {
      checkUserStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // In Dashboard.tsx - Replace the existing subscription expired useEffect
  useEffect(() => {
    // Use a ref to track if we've shown the toast in this component instance
    const toastShownRef = { current: false };
    const TOAST_DEBOUNCE_TIME = 10000; // 10 seconds - longer debounce

    const handleSubscriptionExpired = (event: any) => {
      console.log('📢 Subscription expired event received in Dashboard');

      const now = Date.now();

      // Check if we've handled this recently (within 10 seconds)
      if (now - lastExpiredEvent < TOAST_DEBOUNCE_TIME) {
        console.log('⏱️ Debouncing duplicate expired event');
        return;
      }

      // Update last event time
      setLastExpiredEvent(now);

      // Update current user state
      if (event.detail?.user) {
        setCurrentUser(event.detail.user);
      }

      // Show payment modal
      setShowPaymentModal(true);

      // Show toast only once EVER for this component instance
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast({
          title: "Trial Expired",
          description: "Your trial has expired. Please reactivate your account.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('subscription:expired', handleSubscriptionExpired);

    return () => {
      window.removeEventListener('subscription:expired', handleSubscriptionExpired);
    };
  }, [toast, lastExpiredEvent]);

  // Check auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Auth Token exists:', !!token);
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log('📅 Token expiry:', new Date(payload.exp * 1000).toLocaleString());
      } catch (e) {
        console.log('Not a JWT token or cannot decode');
      }
    }
  }, []);

  // Setup user from localStorage once
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    if (user?.customReactivationAmount) {
      setReactivationAmount(user.customReactivationAmount);
    } else {
      setReactivationAmount(999); // Default fallback
    }
    console.log("👤 Current user:", user);

    if (canViewDashboard) {
      fetchData();
    }
  }, []);


  // Add this with your other useState declarations in Dashboard.tsx
  const [functionHallEnabled, setFunctionHallEnabled] = useState<boolean>(() => {
    // Get saved preference from localStorage, default to true
    const saved = localStorage.getItem('functionHallEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Add effect to save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('functionHallEnabled', JSON.stringify(functionHallEnabled));

    // Dispatch custom event so other components (Layout, Reports) can listen
    window.dispatchEvent(new CustomEvent('functionHallToggle', {
      detail: { enabled: functionHallEnabled }
    }));
  }, [functionHallEnabled]);

  // Calculate trial status
  useEffect(() => {
    console.log('🔍 Checking trial status for user:', {
      status: currentUser?.status,
      plan: currentUser?.plan,
      trial_expiry_date: currentUser?.trial_expiry_date,
      isTrialExpired: currentUser?.isTrialExpired
    });

    if (currentUser) {
      const checkTrialExpired = () => {
        if (currentUser?.isTrialExpired === true) {
          console.log('⚠️ Trial expired (from backend flag)');
          setShowPaymentModal(true);
          return;
        }

        if (currentUser?.status === 'suspended' && currentUser?.plan === 'pro') {
          console.log('⚠️ User is suspended on PRO plan');
          setShowPaymentModal(true);
          return;
        }

        if (currentUser?.status === 'pending' && currentUser?.plan === 'pro') {
          const expiryDate = currentUser.trialInfo?.expiryDate || currentUser.trial_expiry_date;

          console.log('📅 Trial expiry date:', expiryDate);

          if (!expiryDate) {
            console.log('❌ No trial expiry date found');
            return;
          }

          const now = new Date();
          const expiry = new Date(expiryDate);
          const timeDiff = expiry.getTime() - now.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

          const isExpired = daysLeft <= 0;
          let status: 'active' | 'warning' | 'expired' = 'active';

          if (isExpired) {
            status = 'expired';
          } else if (daysLeft <= 2) {
            status = 'warning';
          }

          console.log('📈 Trial calculation result:', {
            daysLeft,
            isExpired,
            status
          });

          setTrialInfo({
            daysLeft: Math.max(0, daysLeft),
            isExpired,
            expiryDate: expiry.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            status,
            originalExpiryDate: expiry
          });

          if (isExpired) {
            console.log('⚠️ Trial has expired, showing payment modal');
            setShowPaymentModal(true);
          }
        }
      };

      checkTrialExpired();
    }
  }, [currentUser]);

  // Check if trial has expired
  // Check trial status on mount and when currentUser changes
  useEffect(() => {
    console.log('🔍 Checking trial status for user:', {
      status: currentUser?.status,
      plan: currentUser?.plan,
      trial_expiry_date: currentUser?.trial_expiry_date,
      isTrialExpired: currentUser?.isTrialExpired
    });

    if (currentUser) {
      // Check if user is explicitly marked as expired
      if (currentUser?.isTrialExpired === true) {
        console.log('⚠️ Trial expired (from user flag)');
        setShowPaymentModal(true);
        return;
      }

      // Check if user is suspended
      if (currentUser?.status === 'suspended' && currentUser?.plan === 'pro') {
        console.log('⚠️ User is suspended on PRO plan');
        setShowPaymentModal(true);
        return;
      }

      // Check trial expiry date for pending users
      if (currentUser?.status === 'pending' && currentUser?.plan === 'pro') {
        const expiryDate = currentUser.trialInfo?.expiryDate ||
          currentUser.trial_expiry_date ||
          currentUser.trialExpiryDate;

        console.log('📅 Trial expiry date:', expiryDate);

        if (!expiryDate) {
          console.log('❌ No trial expiry date found');
          return;
        }

        const now = new Date();
        const expiry = new Date(expiryDate);
        const timeDiff = expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const isExpired = daysLeft <= 0;
        let status: 'active' | 'warning' | 'expired' = 'active';

        if (isExpired) {
          status = 'expired';
        } else if (daysLeft <= 2) {
          status = 'warning';
        }

        console.log('📈 Trial calculation result:', {
          daysLeft,
          isExpired,
          status
        });

        setTrialInfo({
          daysLeft: Math.max(0, daysLeft),
          isExpired,
          expiryDate: expiry.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          status,
          originalExpiryDate: expiry
        });

        if (isExpired) {
          console.log('⚠️ Trial has expired, showing payment modal');
          setShowPaymentModal(true);
        }
      }
    }
  }, [currentUser]);

  const isTrialUser = currentUser?.status === 'pending' && currentUser?.plan === 'pro';
  const isActivePro = currentUser?.status === 'active' && currentUser?.plan === 'pro';
  const isBasicPlan = currentUser?.plan === 'basic';

  // ✅ Fetch from Google Sheets (Basic Plan)
  const fetchFromGoogleSheets = async () => {
    if (!currentUser?.spreadsheetId) return;
    setLoading(true);
    const spreadsheetid = encodeURIComponent(currentUser.spreadsheetId);
    try {
      console.log("📊 Fetching from Google Sheets...");
      const [r, b, c] = await Promise.all([
        jsonpFetch<{ rooms: RawRoom[] }>(`${APPS_SCRIPT_URL}?action=getRooms&spreadsheetid=${spreadsheetid}`),
        jsonpFetch<{ bookings: RawBooking[] }>(`${APPS_SCRIPT_URL}?action=getBookings&spreadsheetid=${spreadsheetid}`),
        jsonpFetch<{ customers: RawCustomer[] }>(`${APPS_SCRIPT_URL}?action=getCustomers&spreadsheetid=${spreadsheetid}`)
      ]);

      const normRooms: Room[] = Array.isArray(r.rooms)
        ? r.rooms.map((raw: RawRoom): Room => {
          const rec = {} as RawRoom;
          Object.keys(raw).forEach(k => rec[k.trim().toLowerCase()] = raw[k]);
          return {
            roomId: rec.roomid?.toString() || '',
            number: rec.number ?? rec.roomnumber ?? '',
            type: rec.type?.toString() || '',
            status: (rec.status || '').toString().toLowerCase()
          };
        })
        : [];
      setRooms(normRooms);

      const normBookings: Booking[] = Array.isArray(b.bookings)
        ? b.bookings.map((raw: RawBooking): Booking => {
          const rec = {} as RawBooking;
          Object.keys(raw).forEach(k => rec[k.trim().toLowerCase()] = raw[k]);

          const fromDateRaw = rec.fromdate ?? rec.checkindate;
          const toDateRaw = rec.todate ?? rec.checkoutdate;

          const fromDate = formatISODate(fromDateRaw);
          const toDate = formatISODate(toDateRaw);

          return {
            bookingId: rec.bookingid?.toString() || '',
            roomId: rec.roomid?.toString() || '',
            customerId: rec.customerid?.toString() || '',
            customerName: rec.customername?.toString() || '',
            fromDate: fromDate,
            toDate: toDate,
            status: (rec.status || '').toString().toLowerCase(),
            total: parseAmount(rec.total),
            createdAt: formatISODate(rec.createdat ?? rec.created_at),
          };
        })
        : [];
      setBookings(normBookings);

      const normCustomers: Customer[] = Array.isArray(c.customers)
        ? c.customers.map((raw: RawCustomer): Customer => {
          const rec = {} as RawCustomer;
          Object.keys(raw).forEach(k => rec[k.trim().toLowerCase()] = raw[k]);
          return {
            customerId: rec.customerid?.toString() || '',
            customerName: (rec.name ?? rec.customername)?.toString() || ''
          };
        })
        : [];
      setCustomers(normCustomers);

      console.log("✅ Google Sheets data loaded:", {
        rooms: normRooms.length,
        bookings: normBookings.length,
        customers: normCustomers.length
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data from Google Sheets: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFromBackend = async () => {
    try {
      setLoading(true);
      console.log("📊 Fetching from Backend Database...");

      // Fetch regular bookings, rooms, customers
      const [roomsData, bookingsData, customersData] = await Promise.all([
        fetchBackendData<{ success: boolean; data: any[] }>('/rooms?limit=1000'),
        fetchBackendData<{ success: boolean; data: any[] }>('/bookings?limit=1000'),
        fetchBackendData<{ success: boolean; data: any[] }>('/customers?limit=1000')
      ]);

      console.log("📥 Raw bookings data from API:", bookingsData);

      // 👇 FETCH ADVANCE BOOKINGS
      const advanceBookingsData = await fetchAdvanceBookingsForDashboard();
      console.log('✅ Advance bookings loaded for dashboard:', advanceBookingsData.length);

      // Transform regular bookings
      const normBookings: Booking[] = bookingsData.data.map((booking: any) => {
        const customerName = booking.customer_name || booking.customer_name || 'Unknown Customer';

        // Check if this is already marked as advance (unlikely in regular bookings)
        const isAdvance = booking.is_advance_booking === true ||
          booking.booking_type === 'advance';

        return {
          bookingId: booking.id.toString(),
          roomId: booking.room_id.toString(),
          customerId: booking.customer_id?.toString() || '',
          customerName: customerName,
          fromDate: booking.from_date,
          toDate: formatISODate(booking.to_date),
          status: booking.status || 'booked',
          total: parseAmount(booking.total),
          createdAt: formatISODate(booking.created_at || new Date().toISOString()),
          isAdvanceBooking: isAdvance,
          advanceAmount: parseAmount(booking.advance_amount),
          remainingAmount: parseAmount(booking.remaining_amount),
          advanceExpiryDate: booking.advance_expiry_date
        };
      });

      // Transform advance bookings to match Booking interface
      const transformedAdvanceBookings: Booking[] = advanceBookingsData.map((ab: any) => ({
        bookingId: `adv-${ab.id}`,
        roomId: ab.roomId || '',
        customerId: ab.customerId || '',
        customerName: ab.customerName || '',
        fromDate: ab.fromDate,
        toDate: ab.toDate,
        status: ab.status,
        total: ab.total,
        createdAt: ab.createdAt,
        isAdvanceBooking: true,
        advanceAmount: ab.advanceAmount,
        remainingAmount: ab.remainingAmount,
        advanceExpiryDate: ab.advanceExpiryDate
      }));

      // Combine regular and advance bookings
      const allBookings = [...normBookings, ...transformedAdvanceBookings];

      const normRooms: Room[] = roomsData.data.map((room: any) => ({
        roomId: room.id.toString(),
        number: room.room_number,
        type: room.type,
        status: room.status
      }));

      const normCustomers: Customer[] = customersData.data.map((customer: any) => ({
        customerId: customer.id.toString(),
        customerName: customer.name || ''
      }));

      setRooms(normRooms);
      setBookings(allBookings);
      setCustomers(normCustomers);

      console.log("✅ Backend Database data loaded:", {
        rooms: normRooms.length,
        regularBookings: normBookings.length,
        advanceBookings: transformedAdvanceBookings.length,
        totalBookings: allBookings.length,
        customers: normCustomers.length
      });

    } catch (error: any) {
      console.error('❌ Error in fetchFromBackend:', error);
      // Handle errors...
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    console.log("🔄 Fetching data for user:", {
      source: currentUser.source,
      plan: currentUser.plan
    });

    if (currentUser.source === 'database' || currentUser.plan === 'pro') {
      await fetchFromBackend();
    } else {
      await fetchFromGoogleSheets();
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Manual sync function (only for Google Sheets)
  const syncRoomStatuses = async () => {
    if (!currentUser?.spreadsheetId) {
      toast({
        title: "Info",
        description: "Sync is only available for Basic Plan users",
        variant: "default"
      });
      return;
    }

    try {
      setSyncing(true);
      await jsonpFetch(`${APPS_SCRIPT_URL}?action=syncroomstatuses&spreadsheetid=${encodeURIComponent(currentUser.spreadsheetId)}`);
      await fetchData();
      toast({
        title: "Success",
        description: "Room statuses synced successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sync room statuses: " + error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // ============= PAYMENT HANDLER - UPDATED WITH OLD PROJECT LOGIC =============
  const handleReactivatePayment = async () => {
    try {
      setIsProcessingPayment(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please refresh and try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const token = localStorage.getItem('authToken');

      console.log('🔧 Payment Config:', {
        backendUrl,
        razorpayKey: razorpayKey ? 'Present' : 'Missing',
        hotelId: currentUser?.hotel_id,
        email: currentUser?.email
      });

      if (!razorpayKey) {
        toast({
          title: "Configuration Error",
          description: "Razorpay key is not configured",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login again",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Step 1: Create order in backend
      console.log('📤 Creating reactivation order...');
      const orderResponse = await fetch(`${backendUrl}/pro-payments/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotel_id: currentUser?.hotel_id,
          email: currentUser?.email,
          name: currentUser?.name || currentUser?.adminName,
          phone: currentUser?.phone
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order created:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Step 2: Add small delay to ensure order propagates (like your old project)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: orderData.data.amount, // Already in paise (99900)
        currency: orderData.data.currency || 'INR',
        name: "Hotel Management System",
        description: "PRO Plan Reactivation (6 Months Access)",
        order_id: orderData.data.id,
        handler: async (response: any) => {
          console.log('✅ Payment success:', response);

          try {
            // Step 4: Verify payment with backend
            const verifyResponse = await fetch(`${backendUrl}/pro-payments/verify-reactivation`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                hotel_id: currentUser?.hotel_id
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast({
                title: "Payment Successful!",
                description: "Your account has been reactivated. Please login again.",
                variant: "default",
              });

              // Clear storage and redirect to login
              setTimeout(() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                navigate('/login');
              }, 2000);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (verifyError: any) {
            console.error('❌ Verification error:', verifyError);
            toast({
              title: "Verification Failed",
              description: verifyError.message,
              variant: "destructive",
            });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: currentUser?.name || currentUser?.adminName || '',
          email: currentUser?.email || '',
          contact: currentUser?.phone || '',
        },
        notes: {
          type: 'reactivation',
          hotel_id: String(currentUser?.hotel_id || ''),
          hotel_name: currentUser?.hotelName || ''
        },
        theme: {
          color: "#3b82f6"
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal closed");
            setIsProcessingPayment(false);
          },
          confirm_close: true
        },
        // Add retry configuration (like your old project)
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      console.log('🚀 Opening Razorpay with order_id:', options.order_id);
      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (response: any) => {
        console.error("❌ Payment failed:", response.error);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be completed",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
      });

      razorpayInstance.open();

    } catch (error: any) {
      console.error("❌ Payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  // Update chart date range based on selected period
  useEffect(() => {
    const end = new Date();
    let start = new Date();

    switch (chartPeriod) {
      case '1month':
        start = subMonths(end, 1);
        break;
      case '3months':
        start = subMonths(end, 3);
        break;
      case '6months':
        start = subMonths(end, 6);
        break;
    }

    setChartDateRange({ start, end });
  }, [chartPeriod]);



  // Fetch advance bookings from backend for dashboard
  const fetchAdvanceBookingsForDashboard = async (): Promise<any[]> => {
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
      console.log('📦 Advance bookings API response for dashboard:', result);

      // Handle different response formats
      let advanceData = [];
      if (result.success && Array.isArray(result.data)) {
        advanceData = result.data;
      } else if (Array.isArray(result)) {
        advanceData = result;
      } else if (result.data && Array.isArray(result.data)) {
        advanceData = result.data;
      }

      // Transform advance bookings to match dashboard's Booking format
      return advanceData.map((ab: any) => ({
        bookingId: `adv-${ab.id}`,
        roomId: ab.room_id?.toString() || '',
        customerId: ab.customer_id?.toString() || '',
        customerName: ab.customer_name || '',
        fromDate: ab.from_date || '',
        toDate: ab.to_date || '',
        status: ab.status || 'pending',
        total: Number(ab.total) || 0,
        createdAt: ab.created_at || new Date().toISOString(),
        isAdvanceBooking: true,
        advanceAmount: Number(ab.advance_amount) || 0,
        remainingAmount: Number(ab.remaining_amount) || 0,
        advanceExpiryDate: ab.advance_expiry_date || ''
      }));
    } catch (error) {
      console.error('Error fetching advance bookings for dashboard:', error);
      return [];
    }
  };

  // Stats calculations - SIMPLIFIED as per client request
  // const stats = useMemo(() => {
  //   const selectedDateStr = selectedDate.toISOString().split('T')[0];

  //   // Get active bookings for the selected date
  //   const activeBookingsForSelectedDate = bookings.filter(b => {
  //     const isActive = selectedDateStr >= b.fromDate && selectedDateStr <= b.toDate;
  //     return isActive && ['booked', 'confirmed', 'checked-in', 'blocked', 'maintenance'].includes(b.status);
  //   });

  //   // Categorize bookings by status
  //   const bookedBookings = activeBookingsForSelectedDate.filter(b =>
  //     ['booked', 'confirmed', 'checked-in'].includes(b.status)
  //   );
  //   const blockedBookings = activeBookingsForSelectedDate.filter(b =>
  //     b.status === 'blocked'
  //   );
  //   const maintenanceBookings = activeBookingsForSelectedDate.filter(b =>
  //     b.status === 'maintenance'
  //   );

  //   // Get unique room IDs for each category
  //   const bookedRoomIds = [...new Set(bookedBookings.map(b => b.roomId))];
  //   const blockedRoomIds = [...new Set(blockedBookings.map(b => b.roomId))];
  //   const maintenanceRoomIds = [...new Set(maintenanceBookings.map(b => b.roomId))];

  //   // Calculate available rooms
  //   const availableRooms = rooms.length -
  //     bookedRoomIds.length -
  //     blockedRoomIds.length -
  //     maintenanceRoomIds.length;

  //   // Calculate total records for basic plan limit warning
  //   const totalRecords = rooms.length + bookings.length + customers.length;

  //   return {
  //     totalRooms: rooms.length,
  //     availableRooms: Math.max(0, availableRooms),
  //     bookedRooms: bookedRoomIds.length,
  //     blockedRooms: blockedRoomIds.length,
  //     maintenanceRooms: maintenanceRoomIds.length,
  //     totalRecords: totalRecords
  //   };
  // }, [rooms, bookings, customers, selectedDate]);


  // const stats = useMemo(() => {
  //   // Fix timezone issue by using local date string
  //   const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  //   console.log('📅 SELECTED DATE:', selectedDateStr);
  //   console.log('📊 ALL BOOKINGS COUNT:', bookings.length);
  //   console.log('📊 ADVANCE BOOKINGS COUNT:', bookings.filter(b => b.isAdvanceBooking).length);

  //   // Get active bookings for the selected date
  //   const activeBookingsForSelectedDate = bookings.filter(b => {
  //     const isActive = selectedDateStr >= b.fromDate && selectedDateStr <= b.toDate;
  //     // Include all statuses that make a room occupied
  //     const isOccupiedStatus = ['booked', 'confirmed', 'checked-in', 'blocked', 'maintenance', 'pending'].includes(b.status);
  //     return isActive && isOccupiedStatus;
  //   });

  //   console.log('📊 ACTIVE BOOKINGS FOR DATE:', activeBookingsForSelectedDate.length);

  //   // Categorize bookings by type
  //   const bookedBookings = activeBookingsForSelectedDate.filter(b =>
  //     ['booked', 'confirmed', 'checked-in'].includes(b.status) && !b.isAdvanceBooking
  //   );

  //   const maintenanceBookings = activeBookingsForSelectedDate.filter(b =>
  //     b.status === 'maintenance'
  //   );

  //   // 👇 IMPORTANT: Count advance bookings
  //   const advanceBookings = activeBookingsForSelectedDate.filter(b =>
  //     b.isAdvanceBooking === true && (b.status === 'confirmed' || b.status === 'pending')
  //   );

  //   // Get unique room IDs for each category
  //   const bookedRoomIds = [...new Set(bookedBookings.map(b => b.roomId))];
  //   const maintenanceRoomIds = [...new Set(maintenanceBookings.map(b => b.roomId))];
  //   const advanceRoomIds = [...new Set(advanceBookings.map(b => b.roomId))];

  //   // Calculate available rooms (rooms not in any of the above categories)
  //   const allOccupiedRoomIds = new Set([
  //     ...bookedRoomIds,
  //     ...maintenanceRoomIds,
  //     ...advanceRoomIds
  //   ]);

  //   const availableRooms = rooms.length - allOccupiedRoomIds.size;

  //   // Calculate total records for basic plan limit warning
  //   const totalRecords = rooms.length + bookings.length + customers.length;

  //   console.log('📊 STATS RESULT:', {
  //     totalRooms: rooms.length,
  //     availableRooms,
  //     bookedRooms: bookedRoomIds.length,
  //     maintenanceRooms: maintenanceRoomIds.length,
  //     advanceRooms: advanceRoomIds.length,
  //     selectedDate: selectedDateStr
  //   });

  //   return {
  //     totalRooms: rooms.length,
  //     availableRooms: Math.max(0, availableRooms),
  //     bookedRooms: bookedRoomIds.length,
  //     maintenanceRooms: maintenanceRoomIds.length,
  //     advanceRooms: advanceRoomIds.length,
  //     totalRecords: totalRecords
  //   };
  // }, [rooms, bookings, customers, selectedDate]);


  const stats = useMemo(() => {
    // Fix timezone issue by using local date string
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    console.log('📅 SELECTED DATE:', selectedDateStr);
    console.log('📊 ALL BOOKINGS COUNT:', bookings.length);
    console.log('📊 ADVANCE BOOKINGS COUNT:', bookings.filter(b => b.isAdvanceBooking).length);

    // Get active bookings for the selected date
    // const activeBookingsForSelectedDate = bookings.filter(b => {
    //   const isActive = selectedDateStr >= b.fromDate && selectedDateStr <= b.toDate;
    //   // Include all statuses that make a room occupied
    //   const isOccupiedStatus = ['booked', 'confirmed', 'checked-in', 'blocked', 'maintenance', 'pending'].includes(b.status);
    //   return isActive && isOccupiedStatus;
    // });

    // console.log('📊 ACTIVE BOOKINGS FOR DATE:', activeBookingsForSelectedDate.length);


    const activeBookingsForSelectedDate = bookings.filter(b => {
      // Normalize booking dates for comparison
      const bookingFromDate = normalizeDate(b.fromDate);
      const bookingToDate = normalizeDate(b.toDate);

      const isActive = selectedDateStr >= bookingFromDate && selectedDateStr <= bookingToDate;
      const isOccupiedStatus = ['booked', 'confirmed', 'checked-in', 'blocked', 'maintenance', 'pending'].includes(b.status);

      return isActive && isOccupiedStatus;
    });

    console.log('📊 ACTIVE BOOKINGS FOR DATE:', activeBookingsForSelectedDate.length);

    // Categorize bookings by type
    const bookedBookings = activeBookingsForSelectedDate.filter(b =>
      ['booked', 'confirmed', 'checked-in'].includes(b.status) && !b.isAdvanceBooking
    );

    const maintenanceBookings = activeBookingsForSelectedDate.filter(b =>
      b.status === 'maintenance'
    );

    // 👇 ADD THIS: Count blocked bookings
    const blockedBookings = activeBookingsForSelectedDate.filter(b =>
      b.status === 'blocked'
    );

    // Count advance bookings
    const advanceBookings = activeBookingsForSelectedDate.filter(b =>
      b.isAdvanceBooking === true && (b.status === 'confirmed' || b.status === 'pending')
    );

    // Get unique room IDs for each category
    const bookedRoomIds = [...new Set(bookedBookings.map(b => b.roomId))];
    const maintenanceRoomIds = [...new Set(maintenanceBookings.map(b => b.roomId))];
    const blockedRoomIds = [...new Set(blockedBookings.map(b => b.roomId))]; // 👈 ADD THIS
    const advanceRoomIds = [...new Set(advanceBookings.map(b => b.roomId))];

    // Calculate available rooms (rooms not in any of the above categories)
    const allOccupiedRoomIds = new Set([
      ...bookedRoomIds,
      ...maintenanceRoomIds,
      ...blockedRoomIds, // 👈 ADD THIS
      ...advanceRoomIds
    ]);

    const availableRooms = rooms.length - allOccupiedRoomIds.size;

    // Calculate total records for basic plan limit warning
    const totalRecords = rooms.length + bookings.length + customers.length;

    console.log('📊 STATS RESULT:', {
      totalRooms: rooms.length,
      availableRooms,
      bookedRooms: bookedRoomIds.length,
      maintenanceRooms: maintenanceRoomIds.length,
      blockedRooms: blockedRoomIds.length, // 👈 ADD THIS
      advanceRooms: advanceRoomIds.length,
      selectedDate: selectedDateStr
    });

    return {
      totalRooms: rooms.length,
      availableRooms: Math.max(0, availableRooms),
      bookedRooms: bookedRoomIds.length,
      maintenanceRooms: maintenanceRoomIds.length,
      blockedRooms: blockedRoomIds.length, // 👈 ADD THIS
      advanceRooms: advanceRoomIds.length,
      totalRecords: totalRecords
    };
  }, [rooms, bookings, customers, selectedDate]);

  // Generate chart data for bookings over time (based on check-in dates) - FIXED TIMEZONE ISSUE
  // Generate chart data for bookings over time (based on check-in dates) - FIXED
  const chartData = useMemo((): ChartDataPoint[] => {
    const { start, end } = chartDateRange;
    const days = eachDayOfInterval({ start, end });

    // Debug: Log all bookings with their from_date
    console.log('📊 All bookings from database:', bookings.map(b => ({
      id: b.bookingId,
      fromDate: b.fromDate,
      status: b.status,
      isValid: ['booked', 'confirmed', 'checked-in'].includes(b.status)
    })));

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');

      // Count bookings that check-in on this date
      const checkInsOnDate = bookings.filter(booking => {
        // Only count bookings with valid status
        const isValidStatus = ['booked', 'confirmed', 'checked-in'].includes(booking.status);
        if (!isValidStatus) return false;

        // Get the fromDate - it should already be in YYYY-MM-DD format from your data
        const bookingDate = booking.fromDate;

        // Debug for the specific date
        if (dateStr === '2026-02-24') {
          console.log(`🔍 Checking booking ${booking.bookingId}:`, {
            bookingDate,
            matches: bookingDate === dateStr,
            status: booking.status
          });
        }

        return bookingDate === dateStr;
      });

      // Debug count for each date
      if (checkInsOnDate.length > 0) {
        console.log(`📅 ${dateStr}: ${checkInsOnDate.length} check-ins`,
          checkInsOnDate.map(b => ({ id: b.bookingId, status: b.status })));
      }

      return {
        date: dateStr,
        formattedDate: format(day, 'dd MMM'),
        bookings: checkInsOnDate.length
      };
    });
  }, [bookings, chartDateRange]);

  // Get recent bookings (last 5)
  const recentBookings = useMemo(
    () => bookings.filter(b => ['confirmed', 'booked', 'checked-in'].includes(b.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings]
  );

  // Get bookings to display based on showAllRecentBookings state
  const displayRecentBookings = showAllRecentBookings
    ? recentBookings
    : recentBookings.slice(0, 5);

  // SIMPLIFIED stat cards - Only Total Rooms, Available, Booked
  // const statCards: StatCard[] = [
  //   {
  //     title: 'Total Rooms',
  //     value: stats.totalRooms,
  //     icon: Bed,
  //     color: 'bg-blue-500',
  //     onClick: () => canViewRooms && navigate('/rooms'),
  //     description: 'All rooms in hotel',
  //     available: canViewRooms,
  //     permission: 'view_rooms'
  //   },
  //   {
  //     title: 'Available Today',
  //     value: stats.availableRooms,
  //     icon: CalendarDays,
  //     color: 'bg-green-500',
  //     onClick: () => canViewRooms && navigate('/rooms'),
  //     description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
  //     available: canViewRooms,
  //     permission: 'view_rooms'
  //   },
  //   {
  //     title: 'Booked Today',
  //     value: stats.bookedRooms,
  //     icon: CalendarIcon,
  //     color: 'bg-purple-500',
  //     onClick: () => canViewBookings && navigate('/bookings'),
  //     description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
  //     available: canViewBookings,
  //     permission: 'view_bookings'
  //   }
  // ];

  // SIMPLIFIED stat cards - Now with 5 cards
  // Stat cards - Now with 5 cards including Advance
  // Stat cards - Now with 6 cards including Advance and Blocked
  const statCards: StatCard[] = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Bed,
      color: 'bg-blue-500',
      onClick: () => canViewRooms && navigate('/rooms'),
      description: 'All rooms in hotel',
      available: canViewRooms,
      permission: 'view_rooms'
    },
    {
      title: 'Available Today',
      value: stats.availableRooms,
      icon: CalendarDays,
      color: 'bg-green-500',
      onClick: () => canViewRooms && navigate('/rooms'),
      description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
      available: canViewRooms,
      permission: 'view_rooms'
    },
    {
      title: 'Booked Today',
      value: stats.bookedRooms,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      onClick: () => canViewBookings && navigate('/bookings'),
      description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
      available: canViewBookings,
      permission: 'view_bookings'
    },
    // 👇 Advance Booked Card
    {
      title: 'Advance Booked',
      value: stats.advanceRooms,
      icon: Clock,
      color: 'bg-purple-500',
      onClick: () => canViewBookings && navigate('/advance-bookings'),
      description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
      available: canViewBookings,
      permission: 'view_bookings'
    },
    // 👇 Blocked Rooms Card - ADD THIS
    {
      title: 'Blocked Rooms',
      value: stats.blockedRooms,
      icon: Lock, // Import Lock from 'lucide-react' if not already imported
      color: 'bg-gray-500',
      onClick: () => canViewRooms && navigate('/rooms'),
      description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
      available: canViewRooms,
      permission: 'view_rooms'
    },
    // 👇 Maintenance Card
    {
      title: 'Maintenance',
      value: stats.maintenanceRooms,
      icon: Wrench,
      color: 'bg-yellow-500',
      onClick: () => canViewRooms && navigate('/rooms'),
      description: `on ${format(selectedDate, 'dd MMM yyyy')}`,
      available: canViewRooms,
      permission: 'view_rooms'
    }
  ];

  // Handle chart period change
  const handlePeriodChange = (period: '1month' | '3months' | '6months') => {
    setChartPeriod(period);
  };

  // Toggle chart view
  const toggleChartView = () => {
    setChartView(prev => prev === 'line' ? 'bar' : 'line');
  };

  // Handle data export
  const handleExportData = () => {
    if (!hasExportData || !canViewReports) {
      toast({
        title: "Pro Feature",
        description: "Data export is available in Pro plan. Upgrade to export your data.",
        action: (
          <Button size="sm" onClick={() => navigate('/upgrade')}>
            Upgrade Now
          </Button>
        ),
      });
      return;
    }

    toast({
      title: "Export Started",
      description: "Your data export has been initiated.",
    });
  };

  // Toggle show all recent bookings
  const toggleRecentBookings = () => {
    setShowAllRecentBookings(!showAllRecentBookings);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // If user doesn't have dashboard permission
  if (!canViewDashboard && !isUserAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Access Denied</CardTitle>
              <p className="text-muted-foreground">
                You don't have permission to view the dashboard
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/')}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Trial Expired Modal - Blurred Overlay */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl p-6 w-[95%] max-w-[500px] shadow-2xl 
                    max-h-[90vh] overflow-y-auto 
                    animate-in zoom-in-95 duration-300
                    border border-gray-200">
            <div className="text-center">
              {/* Header */}
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Trial Period Ended</h2>
                <p className="text-gray-600 text-sm">Your 30-day PRO trial has expired</p>
              </div>

              {/* Trial Details - Compact */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-left">
                    <p className="text-xs text-gray-500 mb-1">Plan</p>
                    <p className="font-semibold text-gray-900">PRO Plan</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 mb-1">Expired On</p>
                    <p className="font-semibold text-gray-900">{trialInfo.expiryDate}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                      Suspended
                    </Badge>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 mb-1">Hotel</p>
                    <p className="font-semibold text-gray-900 truncate">{currentUser?.hotelName}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details - Compact */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-base text-blue-900 mb-2">Reactivate Your Account</h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-gray-700 text-sm">PRO Plan Reactivation</p>
                    <p className="text-xs text-gray-500">one months access</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-700">{reactivationAmount}</p>
                    <p className="text-xs text-gray-500">One-time payment</p>
                  </div>
                </div>

                <ul className="text-left text-xs text-gray-600 space-y-1.5 mb-3">
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                    Full access to all PRO features
                  </li>
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                    Unlimited records and storage
                  </li>
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                    Advanced analytics and reports
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  onClick={handleReactivatePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ₹{reactivationAmount} to Reactivate
                    </>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-xs text-gray-500 mt-4">
                Need help? Contact support at services@hithlakshsolutions.com
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="space-y-4 md:space-y-6">
        {/* Basic Plan Banner */}
        {isBasicPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-800 text-sm">Basic Plan</h3>
                  <Badge variant="outline" className="text-blue-600 bg-blue-100 text-xs">Essential Features</Badge>
                </div>
                <p className="text-blue-600 text-xs">
                  You're on our Basic Plan with essential hotel management features.
                  Upgrade to Pro for advanced analytics and booking insights.
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-blue-600">
                  <span>📊 {stats.totalRecords}/5,000 records</span>
                  <span>🏨 {stats.totalRooms} rooms</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/upgrade')}
                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap text-xs h-8"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}

        {/* Storage Limit Warning for Basic Plan */}
        {isBasicPlan && stats.totalRecords > 4500 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-amber-800 text-xs font-medium">
                  ⚠️ Approaching Basic Plan limit ({stats.totalRecords}/5,000 records)
                </p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Upgrade to Pro for unlimited records and enhanced performance.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/upgrade')}
                className="text-amber-800 border-amber-300 hover:bg-amber-100 text-xs h-7"
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Trial Status Banner - Shows for PRO trial users */}
        {isTrialUser && !showPaymentModal && (
          <div className={`border rounded-lg p-3 ${trialInfo.status === 'expired'
            ? 'bg-red-50 border-red-200'
            : trialInfo.status === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {trialInfo.status === 'expired' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : trialInfo.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-600" />
                  )}
                  <h3 className="font-semibold text-sm">
                    {trialInfo.status === 'expired'
                      ? 'Trial Expired'
                      : trialInfo.status === 'warning'
                        ? 'Trial Ending Soon'
                        : 'PRO Plan Trial'
                    }
                  </h3>
                  <Badge variant="outline" className={`
            text-xs ${trialInfo.status === 'expired'
                      ? 'text-red-600 bg-red-100'
                      : trialInfo.status === 'warning'
                        ? 'text-amber-600 bg-amber-100'
                        : 'text-blue-600 bg-blue-100'
                    }`
                  }>
                    {trialInfo.status === 'expired' ? 'SUSPENDED' : 'TRIAL'}
                  </Badge>
                </div>

                <p className={`text-xs ${trialInfo.status === 'expired'
                  ? 'text-red-600'
                  : trialInfo.status === 'warning'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                  }`}>
                  {trialInfo.status === 'expired' ? (
                    <>Your 30-day PRO trial has ended. Please make payment to reactivate your account.</>
                  ) : trialInfo.status === 'warning' ? (
                    <>Your PRO trial ends in {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''}. Upgrade now to avoid interruption.</>
                  ) : (
                    <>You're on a 30-day PRO trial. {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''} remaining.</>
                  )}
                </p>

                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className={`
            ${trialInfo.status === 'expired'
                      ? 'text-red-600'
                      : trialInfo.status === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`
                  }>
                    <CalendarIcon className="inline w-3 h-3 mr-1" />
                    {trialInfo.status === 'expired' ? 'Expired: ' : 'Expires: '}{trialInfo.expiryDate}
                  </span>
                  <span className={`
            ${trialInfo.status === 'expired'
                      ? 'text-red-600'
                      : trialInfo.status === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`
                  }>
                    <Clock className="inline w-3 h-3 mr-1" />
                    {trialInfo.status === 'expired'
                      ? 'Account Suspended'
                      : `${trialInfo.daysLeft} day${trialInfo.daysLeft !== 1 ? 's' : ''} left`
                    }
                  </span>
                </div>

                {/* Show payment button for expired trial */}
                {trialInfo.status === 'expired' && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={handleReactivatePayment}
                      disabled={isProcessingPayment}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3 mr-1" />
                          Pay ₹{reactivationAmount} to Reactivate
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {trialInfo.status !== 'expired' && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (trialInfo.status === 'warning') {
                      handleReactivatePayment();
                    } else {
                      navigate('/upgrade');
                    }
                  }}
                  className={`
      whitespace-nowrap text-xs h-8
      ${trialInfo.status === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`
                  }
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : trialInfo.status === 'warning' ? (
                    <>
                      <CreditCard className="w-3 h-3 mr-1" />
                      Pay ₹999 to Extend
                    </>
                  ) : (
                    'Learn More'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Active PRO Plan Banner */}
        {isActivePro && showProBanner && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowProBanner(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-green-200 transition-colors"
              aria-label="Close banner"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-700"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="flex items-center gap-2 pr-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-green-800 text-sm">PRO Plan Active</h3>
                </div>
                <p className="text-green-600 text-xs">
                  You have full access to all PRO features including advanced analytics and booking insights.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header + Date Picker */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
              {currentUser && (
                <>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isTrialUser ? 'bg-amber-100 text-amber-800' :
                    isActivePro ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {isTrialUser ? 'PRO Trial' :
                      isActivePro ? 'PRO Active' :
                        'Basic Plan'}
                  </span>

                  {isTrialUser && trialInfo.status === 'expired' && (
                    <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
                      <Ban className="w-3 h-3 mr-1" />
                      Suspended
                    </Badge>
                  )}

                  {isUserAdmin && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-xs md:text-sm">
              Welcome back, {currentUser?.adminName || currentUser?.name || 'User'}
              {isUserAdmin && ' (Administrator)'}
              {!isUserAdmin && currentUser?.role && ` (${currentUser.role})`}

              {/* Add trial info in subtitle */}
              {isTrialUser && !trialInfo.isExpired && (
                <span className="ml-2 text-amber-600">
                  • Trial: {trialInfo.daysLeft} day{trialInfo.daysLeft !== 1 ? 's' : ''} left
                </span>
              )}
              {isTrialUser && trialInfo.isExpired && (
                <span className="ml-2 text-red-600">
                  • Trial expired
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {currentUser?.source === 'google_sheets' && (
              <Button
                variant="outline"
                onClick={syncRoomStatuses}
                disabled={syncing}
                className="flex items-center gap-2 text-xs h-8"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Status'}
              </Button>
            )}

            {/* Show Manage Staff button only for admins */}
            {isUserAdmin && canManageStaff && currentUser?.source === 'database' && (
              <Button
                variant="default"
                onClick={() => navigate('/staff')}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-xs h-8"
              >
                <UserPlus className="w-3 h-3" />
                Manage Staff
              </Button>
            )}

            {/* <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-xs h-8">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={date => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover> */}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-xs h-8">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="end"
                sideOffset={5}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={date => date && setSelectedDate(date)}
                  className="rounded-md border bg-white"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Loading data ...</span>
          </div>
        )}


        {/* Stats Cards - 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            const hasPerm = stat.available;

            return (
              <Card
                key={idx}
                className={`hover:shadow transition-shadow ${hasPerm && stat.onClick ? 'cursor-pointer' : ''} ${!hasPerm ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={hasPerm ? stat.onClick : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="text-xl font-bold">{stat.value}</div>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* LINE GRAPH - Bookings by Check-in Date (Only for Pro Plan) - FIXED TIMEZONE ISSUE */}
        {/* {!isBasicPlan && (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2 border-b">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-600" />
                  Bookings by Check-in Date
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Number of bookings based on check-in date
                </p>
              </div>
              <div className="flex items-center gap-2">
              
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-none px-3 py-1 h-7 text-xs ${chartPeriod === '1month' ? 'bg-blue-50 text-blue-600' : ''}`}
                    onClick={() => handlePeriodChange('1month')}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-none px-3 py-1 h-7 text-xs border-l border-r ${chartPeriod === '3months' ? 'bg-blue-50 text-blue-600' : ''}`}
                    onClick={() => handlePeriodChange('3months')}
                  >
                    3 Months
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-none px-3 py-1 h-7 text-xs ${chartPeriod === '6months' ? 'bg-blue-50 text-blue-600' : ''}`}
                    onClick={() => handlePeriodChange('6months')}
                  >
                    6 Months
                  </Button>
                </div>

               
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleChartView}
                  className="h-7 text-xs"
                >
                  {chartView === 'line' ? 'Bar Chart' : 'Line Chart'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 pb-2">
              {chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartView === 'line' ? (
                      <RechartsLineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 12 }}
                          interval={isMobile ? 'preserveStartEnd' : undefined}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: '12px' }}
                          formatter={(value: any) => [`${value} bookings`, 'Check-ins']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="bookings"
                          name="New Check-ins"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </RechartsLineChart>
                    ) : (
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 12 }}
                          interval={isMobile ? 'preserveStartEnd' : undefined}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: '12px' }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Bar
                          dataKey="bookings"
                          name="New Check-ins"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No booking data available for this period</p>
                </div>
              )}

              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-2 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Check-ins</p>
                  <p className="text-lg font-semibold">
                    {chartData.reduce((sum, item) => sum + item.bookings, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avg. Daily</p>
                  <p className="text-lg font-semibold">
                    {(chartData.reduce((sum, item) => sum + item.bookings, 0) / chartData.length).toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Peak Day</p>
                  <p className="text-lg font-semibold">
                    {Math.max(...chartData.map(d => d.bookings))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Date Range</p>
                  <p className="text-xs font-medium">
                    {format(chartDateRange.start, 'dd MMM')} - {format(chartDateRange.end, 'dd MMM')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Pro Features Section for Basic Plan Users - Updated to show chart preview */}
        {isBasicPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Chart Preview Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  Booking Analytics
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                    PRO
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <UpgradePrompt feature="Booking Analytics">
                  <div className="space-y-2 p-3 rounded-lg border border-dashed border-gray-200 text-center">
                    <LineChart className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <h4 className="font-medium text-gray-600 text-sm">Track Booking Trends</h4>
                    <p className="text-xs text-gray-500">
                      Visualize check-ins over time with interactive charts
                    </p>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
                      <div className="text-left">• Daily check-ins</div>
                      <div className="text-left">• Peak day analysis</div>
                      <div className="text-left">• 1, 3, 6 month views</div>
                      <div className="text-left">• Forecasting</div>
                    </div>
                  </div>
                </UpgradePrompt>
              </CardContent>
            </Card>

            {/* WhatsApp Reminders Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  WhatsApp Reminders
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                    PRO
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <UpgradePrompt feature="WhatsApp Reminders">
                  <div className="space-y-2 p-3 rounded-lg border border-dashed border-gray-200 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <h4 className="font-medium text-gray-600 text-sm">Automated Guest Communication</h4>
                    <p className="text-xs text-gray-500">
                      Send automatic check-in/check-out reminders via WhatsApp
                    </p>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
                      <div className="text-left">• Auto Reminders</div>
                      <div className="text-left">• Bulk Messaging</div>
                      <div className="text-left">• Template Messages</div>
                      <div className="text-left">• Delivery Reports</div>
                    </div>
                  </div>
                </UpgradePrompt>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Bookings & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Recent Bookings Card */}
          <Card>
            <CardHeader className="flex items-center justify-between px-4 pt-4 pb-2">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRecentBookings}
                className="flex items-center gap-1 text-xs h-7"
              >
                {showAllRecentBookings ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Show Less
                  </>
                ) : (
                  <>
                    View All
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {displayRecentBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">No bookings yet</p>
              ) : (
                <div className="space-y-2">
                  {/* {displayRecentBookings.map((b) => {
                    const room = rooms.find((r) => r.roomId === b.roomId);
                    return (
                      <div
                        key={b.bookingId}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary hover:bg-secondary/80 cursor-pointer text-sm"
                        onClick={() => canViewBookings && navigate('/bookings')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Room {room?.number} • Check-in: {formatDisplayDate(b.fromDate)}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 px-1.5 py-0.5">
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })} */}

                  {displayRecentBookings.map((b) => {
                    const room = rooms.find((r) => r.roomId === b.roomId);
                    return (
                      <div
                        key={b.bookingId}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary hover:bg-secondary/80 cursor-pointer text-sm"
                        onClick={() => canViewBookings && navigate('/bookings')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Room {room?.number} • Check-in: {formatDisplayDate(b.fromDate)}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 px-1.5 py-0.5">
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button
                className="w-full justify-start text-sm h-9"
                variant="outline"
                onClick={() => canViewRooms && navigate('/rooms')}
                disabled={!canViewRooms}
              >
                <Bed className="mr-2 w-4 h-4" />
                {canViewRooms ? 'Manage Rooms' : 'View Rooms'}
              </Button>
              <Button
                className="w-full justify-start text-sm h-9"
                variant="outline"
                onClick={() => canViewBookings && navigate('/bookings')}
                disabled={!canViewBookings}
              >
                <CalendarIcon className="mr-2 w-4 h-4" />
                {canViewBookings ? 'View Bookings' : 'View Bookings'}
              </Button>

              {canCreateBooking && (
                <Button
                  className="w-full justify-start text-sm h-9"
                  variant="outline"
                  onClick={() => navigate('/roombooking')}
                >
                  <PlusCircle className="mr-2 w-4 h-4" />
                  New Booking
                </Button>
              )}

              {currentUser?.source === 'google_sheets' && (
                <Button
                  className="w-full justify-start text-sm h-9"
                  variant="outline"
                  onClick={syncRoomStatuses}
                  disabled={syncing}
                >
                  <RefreshCw className={`mr-2 w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Room Status'}
                </Button>
              )}

              {isUserAdmin && canManageStaff && currentUser?.source === 'database' && (
                <Button
                  className="w-full justify-start text-sm h-9 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => navigate('/staff')}
                >
                  <UserPlus className="mr-2 w-4 h-4" />
                  Manage Staff
                </Button>
              )}

              {isBasicPlan && (
                <Button
                  className="w-full justify-start text-sm h-9 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate('/upgrade')}
                >
                  <Zap className="mr-2 w-4 h-4" />
                  Upgrade to Pro
                </Button>
              )}

              {!isBasicPlan && canViewReports && (
                <Button
                  className="w-full justify-start text-sm h-9"
                  variant="outline"
                  onClick={handleExportData}
                >
                  <Download className="mr-2 w-4 h-4" />
                  Export Data
                </Button>
              )}

              {/* Trial expired payment option */}
              {isTrialUser && trialInfo.isExpired && (
                <Button
                  className="w-full justify-start text-sm h-9 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleReactivatePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 w-4 h-4" />
                      Reactivate Account (₹{reactivationAmount})
                    </>
                  )}
                </Button>
              )}

              {/* Function Hall Toggle Button */}
              {/* Function Hall Toggle Button */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <Button
                  className={`w-full justify-start text-sm h-9 ${functionHallEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  onClick={() => setFunctionHallEnabled(!functionHallEnabled)}
                >
                  <Building2 className={`mr-2 w-4 h-4 ${functionHallEnabled ? 'text-white' : 'text-gray-600'}`} />
                  {functionHallEnabled ? 'Function Hall: ON' : 'Function Hall: OFF'}
                </Button>
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  When OFF, Function Hall menu appears grayed out in sidebar
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;