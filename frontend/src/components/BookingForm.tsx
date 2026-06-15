


// // src/components/BookingForm.tsx

// import { useNavigate } from 'react-router-dom';
// import { useState, useEffect, useRef } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useToast } from '@/hooks/use-toast';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import {
//   Upload,
//   X,
//   CreditCard,
//   Wallet,
//   QrCode,
//   CheckCircle,
//   AlertCircle,
//   Loader2,
//   FileImage,
//   User,
//   Phone,
//   Mail,
//   Calendar,
//   Clock,
//   Users,
//   MessageSquare,
//   ChevronRight,
//   ChevronLeft,
//   Check,
//   Database,
//   Sheet,
//   Info,
//   ChevronDown,
//   ChevronUp,
//   CalendarDays,
//   Percent,
//   IndianRupee,
//   Tag,
//   Gift,
// } from 'lucide-react';
// import { searchCustomersByPhone } from '@/lib/bookingApi';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// interface DateRange {
//   from: Date | undefined;
//   to?: Date | undefined;
// }

// interface DiscountInfo {
//   enabled: boolean;
//   percentage: number;
//   description: string | null;
//   originalPrice: number;
//   discountedPrice: number;
// }

// interface BookingFormProps {
//   roomId: string;
//   room: any;
//   preSelectedDateRange?: { from?: string; to?: string } | null;
//   spreadsheetId: string;
//   hotelId?: string;
//   customerId?: string;
//   userSource?: string;
//   onClose: () => void;
//   onSuccess: () => void;
//   mode?: 'book' | 'block' | 'maintenance';
//   defaultDate?: Date;
//   defaultDateRange?: DateRange;
//   advanceBookingData?: any;
//   isAdvanceConversion?: boolean;
//   conversionPaymentMethod?: 'cash' | 'online';
// }

// const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmzEN8dvGOZQKM4Dok-vf59Wvjg9uf3_hn7YWhn-WTaWL8TKl5YSSyFevYx9Ovucqb/exec';
// const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // JSONP fetch for Google Sheets
// function jsonpFetch<T>(url: string): Promise<T> {
//   return new Promise<T>((resolve, reject) => {
//     const callbackName = 'cb_' + Math.random().toString(36).substring(2, 15);

//     const existingScript = document.getElementById(callbackName);
//     if (existingScript && existingScript.parentNode) {
//       existingScript.parentNode.removeChild(existingScript);
//     }

//     const timeoutId = setTimeout(() => {
//       cleanup();
//       reject(new Error('JSONP request timeout (10 seconds)'));
//     }, 10000);

//     const cleanup = () => {
//       clearTimeout(timeoutId);
//       delete (window as any)[callbackName];
//       const script = document.getElementById(callbackName);
//       if (script && script.parentNode) {
//         script.parentNode.removeChild(script);
//       }
//     };

//     (window as any)[callbackName] = (data: T) => {
//       console.log('📥 JSONP Success callback:', data);
//       cleanup();
//       resolve(data);
//     };

//     const script = document.createElement('script');
//     script.id = callbackName;

//     script.onerror = () => {
//       console.error('❌ JSONP Script load error for URL:', url);
//       cleanup();
//       reject(new Error('JSONP request failed to load script'));
//     };

//     let finalUrl = url;
//     if (!url.includes('callback=')) {
//       finalUrl += (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
//     } else {
//       finalUrl = url.replace(/(callback=)[^&]*/, `$1${callbackName}`);
//     }

//     script.src = finalUrl;
//     document.body.appendChild(script);

//     console.log('📤 JSONP Request sent:', finalUrl);
//   });
// }

// // Convert image to Base64
// const convertToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = (error) => reject(error);
//   });
// };

// // Compress image
// const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();

//     img.onload = () => {
//       try {
//         const canvas = document.createElement('canvas');
//         let width = img.width;
//         let height = img.height;

//         if (width > height) {
//           if (width > maxWidth) {
//             height = Math.round((height * maxWidth) / width);
//             width = maxWidth;
//           }
//         } else {
//           if (height > maxHeight) {
//             width = Math.round((width * maxHeight) / height);
//             height = maxHeight;
//           }
//         }

//         canvas.width = width;
//         canvas.height = height;
//         const ctx = canvas.getContext('2d');
//         if (!ctx) {
//           reject(new Error('Could not get canvas context'));
//           return;
//         }

//         ctx.drawImage(img, 0, 0, width, height);
//         const compressed = canvas.toDataURL('image/jpeg', quality);

//         if (compressed && compressed.length > 100) {
//           resolve(compressed);
//         } else {
//           reject(new Error('Compression resulted in empty image'));
//         }
//       } catch (error) {
//         reject(error);
//       }
//     };

//     img.onerror = () => {
//       reject(new Error('Failed to load image'));
//     };

//     const cleanBase64 = base64Str.includes('base64,')
//       ? base64Str
//       : `data:image/jpeg;base64,${base64Str}`;

//     img.src = cleanBase64;
//   });
// };

// // Google Sheets specific functions
// async function saveCustomerToGoogleSheets(customerData: any, spreadsheetId: string): Promise<string> {
//   try {
//     console.log('📤 Saving customer to Google Sheets:', customerData);

//     const cleanData: any = {};
//     Object.keys(customerData).forEach(key => {
//       if (customerData[key] !== undefined && customerData[key] !== null) {
//         cleanData[key] = customerData[key];
//       }
//     });

//     console.log('📤 Clean customer data:', cleanData);

//     let url = `${APPS_SCRIPT_URL}?action=addCustomer`;
//     url += `&spreadsheetid=${encodeURIComponent(spreadsheetId)}`;
//     url += `&name=${encodeURIComponent(cleanData.name || '')}`;
//     url += `&phone=${encodeURIComponent(cleanData.phone || '')}`;
//     url += `&email=${encodeURIComponent(cleanData.email || '')}`;
//     url += `&idNumber=${encodeURIComponent(cleanData.idNumber || '')}`;
//     url += `&idType=${encodeURIComponent(cleanData.idType || '')}`;

//     if (cleanData.address) url += `&address=${encodeURIComponent(cleanData.address)}`;
//     if (cleanData.city) url += `&city=${encodeURIComponent(cleanData.city)}`;
//     if (cleanData.state) url += `&state=${encodeURIComponent(cleanData.state)}`;
//     if (cleanData.pincode) url += `&pincode=${encodeURIComponent(cleanData.pincode)}`;

//     url += `&_=${Date.now()}`;

//     console.log('📤 Calling Google Sheets API:', url);

//     const response = await jsonpFetch<any>(url);

//     console.log('✅ Customer save response:', response);

//     if (response.error) {
//       throw new Error(response.error);
//     }

//     return response.customerId || response.id || `GS-CUST-${Date.now()}`;
//   } catch (error: any) {
//     console.error('❌ Error saving customer to Google Sheets:', error);
//     throw error;
//   }
// }

// async function saveBookingToGoogleSheets(bookingData: any, spreadsheetId: string): Promise<any> {
//   try {
//     console.log('📤 Saving booking to Google Sheets:', bookingData);

//     const cleanBookingData: any = {};
//     Object.keys(bookingData).forEach(key => {
//       if (bookingData[key] !== undefined && bookingData[key] !== null) {
//         if (key === 'idImages') {
//           cleanBookingData[key] = Array.isArray(bookingData[key]) && bookingData[key].length > 0
//             ? bookingData[key][0]
//             : '';
//         } else {
//           cleanBookingData[key] = bookingData[key];
//         }
//       }
//     });

//     console.log('📤 Clean booking data:', cleanBookingData);

//     let url = `${APPS_SCRIPT_URL}?action=addBooking`;

//     const params = [
//       `spreadsheetid=${encodeURIComponent(spreadsheetId)}`,
//       `roomId=${encodeURIComponent(cleanBookingData.roomId || '')}`,
//       `customerName=${encodeURIComponent(cleanBookingData.customerName || '')}`,
//       `customerPhone=${encodeURIComponent(cleanBookingData.customerPhone || '')}`,
//       `customerEmail=${encodeURIComponent(cleanBookingData.customerEmail || '')}`,
//       `fromDate=${encodeURIComponent(cleanBookingData.fromDate || '')}`,
//       `fromTime=${encodeURIComponent(cleanBookingData.fromTime || '14:00')}`,
//       `toDate=${encodeURIComponent(cleanBookingData.toDate || '')}`,
//       `toTime=${encodeURIComponent(cleanBookingData.toTime || '12:00')}`,
//       `status=${encodeURIComponent(cleanBookingData.status || 'booked')}`,
//       `amount=${encodeURIComponent(cleanBookingData.amount || 0)}`,
//       `service=${encodeURIComponent(cleanBookingData.serviceCharge || 0)}`,
//       `cgst=${encodeURIComponent(cleanBookingData.cgst || 0)}`,
//       `sgst=${encodeURIComponent(cleanBookingData.sgst || 0)}`,
//       `gst=${encodeURIComponent((cleanBookingData.cgst || 0) + (cleanBookingData.sgst || 0))}`,
//       `total=${encodeURIComponent(cleanBookingData.total || 0)}`,
//       `guests=${encodeURIComponent(cleanBookingData.guests || 1)}`,
//       `paymentMethod=${encodeURIComponent(cleanBookingData.paymentMethod || 'cash')}`,
//       `paymentStatus=${encodeURIComponent(cleanBookingData.paymentStatus || 'pending')}`,
//       `idType=${encodeURIComponent(cleanBookingData.idType || '')}`,
//       `idNumber=${encodeURIComponent(cleanBookingData.idNumber || '')}`,
//       `referralBy=${encodeURIComponent(cleanBookingData.referralBy || '')}`,
//       `referralAmount=${encodeURIComponent(cleanBookingData.referralAmount || 0)}`
//     ];

//     url += '&' + params.join('&');
//     url += `&_=${Date.now()}`;

//     console.log('📤 Calling booking API:', url.substring(0, 200) + '...');

//     const response = await jsonpFetch<any>(url);

//     console.log('✅ Booking save response:', response);

//     if (response.error) {
//       throw new Error(response.error);
//     }

//     return response;
//   } catch (error: any) {
//     console.error('❌ Error saving booking to Google Sheets:', error);
//     throw error;
//   }
// }

// async function checkGoogleSheetsOverlap(spreadsheetId: string, roomId: string, fromDate: string, toDate: string, fromTime?: string, toTime?: string): Promise<{ hasOverlap: boolean, message?: string }> {
//   try {
//     console.log('🔍 Checking overlaps for room:', roomId, fromDate, toDate);

//     let url = `${APPS_SCRIPT_URL}?action=checkOverlap`;
//     url += `&spreadsheetid=${encodeURIComponent(spreadsheetId)}`;
//     url += `&roomId=${encodeURIComponent(roomId)}`;
//     url += `&fromDate=${encodeURIComponent(fromDate)}`;
//     url += `&toDate=${encodeURIComponent(toDate)}`;

//     if (fromTime) url += `&fromTime=${encodeURIComponent(fromTime)}`;
//     if (toTime) url += `&toTime=${encodeURIComponent(toTime)}`;

//     url += `&_=${Date.now()}`;

//     console.log('📤 Checking overlap URL:', url);

//     const response = await jsonpFetch<any>(url);
//     console.log('📥 Overlap check response:', response);

//     if (response.error) {
//       console.error('❌ Overlap check error:', response.error);
//       return { hasOverlap: false };
//     }

//     return response;
//   } catch (error) {
//     console.error('❌ Error checking overlaps:', error);
//     return { hasOverlap: false };
//   }
// }

// export default function BookingForm({
//   roomId,
//   room,
//   preSelectedDateRange,
//   spreadsheetId,
//   hotelId = "",
//   customerId = "",
//   userSource = 'google_sheets',
//   onClose,
//   onSuccess,
//   mode = 'book',
//   advanceBookingData,
//   isAdvanceConversion = false
// }: BookingFormProps) {
//   const { toast } = useToast();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//   const userPlan = currentUser?.plan || 'basic';

//   const navigate = useNavigate();

//   // Form steps
//   const [activeStep, setActiveStep] = useState(1);
//   const [idImages, setIdImages] = useState<string[]>([]);
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | null>(null);
//   const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
//   const [qrCodeData, setQrCodeData] = useState<string>('');
//   const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
//   const [isGeneratingQR, setIsGeneratingQR] = useState(false);
//   const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);

//   // ========== DISCOUNT STATE ==========
//   const [discountApplied, setDiscountApplied] = useState(false);
//   const [discountPercentage, setDiscountPercentage] = useState(10); // Default 10% discount
//   const [customDiscountPercentage, setCustomDiscountPercentage] = useState(10);
//   const [useCustomDiscount, setUseCustomDiscount] = useState(false);
//   const [discountDescription, setDiscountDescription] = useState('Special Discount');
//   const [originalRoomPrice, setOriginalRoomPrice] = useState(room?.price || 0);
//   const [showDiscountInput, setShowDiscountInput] = useState(false);

//   // ========== COLLAPSIBLE SECTIONS STATE ==========
//   const [expandedSections, setExpandedSections] = useState({
//     additionalDetails: false,
//     priceConfiguration: true,
//     priceSummary: true,
//     discountSection: false
//   });

//   // Toggle section function
//   const toggleSection = (section: keyof typeof expandedSections) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   };

//   // ========== PRICE EDITING STATE VARIABLES ==========
//   const [roomPriceEditable, setRoomPriceEditable] = useState(room?.price || 0);
//   const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
//   const [includeCGST, setIncludeCGST] = useState(true);
//   const [includeSGST, setIncludeSGST] = useState(true);
//   const [includeIGST, setIncludeIGST] = useState(false);
//   const [hotelQRCode, setHotelQRCode] = useState(null);
//   const [taxType, setTaxType] = useState<'cgst_sgst' | 'igst'>('cgst_sgst');

//   // Custom percentage states
//   const [customServicePercentage, setCustomServicePercentage] = useState(10.00);
//   const [customCgstPercentage, setCustomCgstPercentage] = useState(6.00);
//   const [customSgstPercentage, setCustomSgstPercentage] = useState(6.00);
//   const [customIgstPercentage, setCustomIgstPercentage] = useState(12.00);
//   const [useCustomPercentages, setUseCustomPercentages] = useState(false);

//   const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
//   const [showCustomerSearch, setShowCustomerSearch] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

//   const [idValidationError, setIdValidationError] = useState<string>('');

//   const defaultCheckIn = preSelectedDateRange?.from ?? '';
//   const defaultCheckOut = preSelectedDateRange?.to ?? '';

//   const [formData, setFormData] = useState({
//     customerName: '',
//     customerPhone: '',
//     customerEmail: '',
//     idType: 'aadhaar' as 'pan' | 'aadhaar' | 'passport' | 'driving',
//     idNumber: '',
//     checkInDate: defaultCheckIn,
//     checkInTime: '',
//     checkOutDate: defaultCheckOut,
//     checkOutTime: '',
//     guests: 1,
//     specialRequests: '',
//     address: '',
//     city: '',
//     state: '',
//     pincode: '',
//     customerGstNo: '',
//     purposeOfVisit: '',
//     otherExpenses: 0,
//     expenseDescription: '',
//     referralBy: '',
//     referralAmount: 0
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // ========== APPLY DISCOUNT FUNCTION ==========
//   const applyDiscount = () => {
//     const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;

//     if (discountPercent <= 0) {
//       toast({
//         title: "Invalid Discount",
//         description: "Discount percentage must be greater than 0",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (discountPercent > 100) {
//       toast({
//         title: "Invalid Discount",
//         description: "Discount percentage cannot exceed 100%",
//         variant: "destructive"
//       });
//       return;
//     }

//     const discountedPrice = originalRoomPrice - (originalRoomPrice * discountPercent / 100);
//     setRoomPriceEditable(discountedPrice);
//     setDiscountApplied(true);
//     setShowDiscountInput(false);

//     toast({
//       title: "🎉 Discount Applied!",
//       description: `${discountPercent}% discount applied. New price: ₹${discountedPrice.toFixed(2)}`,
//       variant: "default"
//     });
//   };

//   const removeDiscount = () => {
//     setRoomPriceEditable(originalRoomPrice);
//     setDiscountApplied(false);
//     setUseCustomDiscount(false);
//     setCustomDiscountPercentage(10);
//     setDiscountPercentage(10);

//     toast({
//       title: "Discount Removed",
//       description: "Original price has been restored",
//       variant: "default"
//     });
//   };

//   const handleAdvanceBookingRedirect = () => {
//     onClose();
//     navigate('/advance-bookings');
//   };

//   // Update dates when preSelectedDateRange changes
//   useEffect(() => {
//     setFormData((prev) => ({
//       ...prev,
//       checkInDate: preSelectedDateRange?.from || prev.checkInDate,
//       checkOutDate: preSelectedDateRange?.to || (preSelectedDateRange?.from ?
//         (() => {
//           const d = new Date(preSelectedDateRange.from!);
//           d.setDate(d.getDate() + 1);
//           return d.toISOString().split('T')[0];
//         })() : prev.checkOutDate),
//     }));
//   }, [preSelectedDateRange]);

//   useEffect(() => {
//     const fetchHotelQRCode = async () => {
//       if (userSource === 'database' && paymentMethod === 'online') {
//         try {
//           const token = localStorage.getItem('authToken');
//           const response = await fetch(`${NODE_BACKEND_URL}/hotels/settings`, {
//             headers: {
//               'Authorization': `Bearer ${token}`
//             }
//           });

//           if (response.ok) {
//             const data = await response.json();
//             if (data.data?.qrcode_image) {
//               setHotelQRCode(data.data.qrcode_image);
//             }
//           }
//         } catch (error) {
//           console.error('Error fetching hotel QR code:', error);
//         }
//       }
//     };

//     fetchHotelQRCode();
//   }, [userSource, paymentMethod]);

//   useEffect(() => {
//     if (activeStep === 3 && userPlan === 'basic' && !paymentMethod) {
//       setPaymentMethod('cash');
//     }
//   }, [activeStep, paymentMethod, userPlan]);

//   // Add this new useEffect
//   useEffect(() => {
//     // When cash is selected, automatically set payment status to completed
//     if (paymentMethod === 'cash') {
//       setPaymentStatus('completed');
//     }
//   }, [paymentMethod]);

//   // Reset checkboxes when tax type changes
//   useEffect(() => {
//     if (taxType === 'cgst_sgst') {
//       setIncludeCGST(true);
//       setIncludeSGST(true);
//       setIncludeIGST(false);
//     } else {
//       setIncludeCGST(false);
//       setIncludeSGST(false);
//       setIncludeIGST(true);
//     }
//   }, [taxType]);

//   // Recalculate when dates change
//   useEffect(() => {
//     calculateCharges();
//   }, [formData.checkInDate, formData.checkOutDate, roomPriceEditable,
//     includeServiceCharge, includeCGST, includeSGST, includeIGST,
//     useCustomPercentages, taxType,
//     customServicePercentage, customCgstPercentage, customSgstPercentage, customIgstPercentage]);

//   const fetchBackendRequest = async (
//     endpoint: string,
//     data: any,
//     method: string = 'POST'
//   ): Promise<any> => {
//     const token = localStorage.getItem('authToken');

//     if (!token && userSource === 'database') {
//       throw new Error('Authentication required');
//     }

//     const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
//       method: method,
//       headers: {
//         'Authorization': token ? `Bearer ${token}` : '',
//         'Content-Type': 'application/json',
//       },
//       body: method !== 'GET' ? JSON.stringify(data) : undefined,
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//     }

//     return await response.json();
//   };

//   // Calculate nights
//   const nights = (() => {
//     if (!formData.checkInDate || !formData.checkOutDate) return 0;

//     const checkIn = new Date(formData.checkInDate);
//     const checkOut = new Date(formData.checkOutDate);

//     checkIn.setHours(0, 0, 0, 0);
//     checkOut.setHours(0, 0, 0, 0);

//     const diffTime = checkOut.getTime() - checkIn.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 0) {
//       const checkInTime = formData.checkInTime || '14:00';
//       const checkOutTime = formData.checkOutTime || '12:00';

//       const [inHour, inMinute] = checkInTime.split(':').map(Number);
//       const [outHour, outMinute] = checkOutTime.split(':').map(Number);

//       const inMinutes = inHour * 60 + inMinute;
//       const outMinutes = outHour * 60 + outMinute;

//       if (outMinutes > inMinutes) {
//         return 1;
//       } else {
//         return 1;
//       }
//     }

//     return diffDays > 0 ? diffDays : 1;
//   })();

//   // ========== HOTEL SETTINGS STATE ==========
//   const [hotelSettings, setHotelSettings] = useState<{
//     gstPercentage: number;
//     cgstPercentage: number;
//     sgstPercentage: number;
//     igstPercentage: number;
//     serviceChargePercentage: number;
//     qrcode_image?: string;
//   }>({
//     gstPercentage: 12.00,
//     cgstPercentage: 6.00,
//     sgstPercentage: 6.00,
//     igstPercentage: 12.00,
//     serviceChargePercentage: 10.00
//   });

//   // Fetch hotel settings
//   useEffect(() => {
//     const fetchHotelSettings = async () => {
//       if (userSource === 'database') {
//         try {
//           const token = localStorage.getItem('authToken');
//           const response = await fetch(`${NODE_BACKEND_URL}/hotels/settings`, {
//             headers: {
//               'Authorization': `Bearer ${token}`
//             }
//           });

//           if (response.ok) {
//             const data = await response.json();
//             if (data.success && data.data) {
//               setHotelSettings({
//                 gstPercentage: data.data.gstPercentage || 12.00,
//                 cgstPercentage: data.data.cgstPercentage || (data.data.gstPercentage / 2) || 6.00,
//                 sgstPercentage: data.data.sgstPercentage || (data.data.gstPercentage / 2) || 6.00,
//                 igstPercentage: data.data.igstPercentage || data.data.gstPercentage || 12.00,
//                 serviceChargePercentage: data.data.serviceChargePercentage || 10.00,
//                 qrcode_image: data.data.qrcode_image
//               });
//               console.log('✅ Hotel tax settings loaded:', data.data);
//             }
//           }
//         } catch (error) {
//           console.error('Error fetching hotel settings:', error);
//         }
//       }
//     };

//     fetchHotelSettings();
//   }, [userSource]);

//   useEffect(() => {
//     if (!useCustomPercentages) {
//       setCustomServicePercentage(hotelSettings.serviceChargePercentage);
//       setCustomCgstPercentage(hotelSettings.cgstPercentage);
//       setCustomSgstPercentage(hotelSettings.sgstPercentage);
//       setCustomIgstPercentage(hotelSettings.igstPercentage);
//     }
//   }, [hotelSettings]);

//   // ========== PRE-FILL FORM FROM ADVANCE BOOKING ==========
//   useEffect(() => {
//     if (advanceBookingData && isAdvanceConversion) {
//       const advanceData = advanceBookingData;

//       console.log('📋 Pre-filling form with advance booking data:', advanceData);

//       const formatDateForInput = (dateStr: string) => {
//         if (!dateStr) return '';
//         try {
//           const date = new Date(dateStr);
//           return date.toISOString().split('T')[0];
//         } catch (e) {
//           return dateStr;
//         }
//       };

//       const customerName = advanceData.customer_name || advanceData.customerName || '';
//       const customerPhone = advanceData.customer_phone || advanceData.customerPhone || '';
//       const customerEmail = advanceData.customer_email || advanceData.customerEmail || '';
//       const idType = advanceData.id_type || advanceData.idType || 'aadhaar';
//       const idNumber = advanceData.id_number || advanceData.idNumber || '';

//       const fromDate = advanceData.from_date || advanceData.fromDate || advanceData.checkIn || '';
//       const toDate = advanceData.to_date || advanceData.toDate || advanceData.checkOut || '';

//       const fromTime = advanceData.from_time || advanceData.fromTime || advanceData.checkInTime || '14:00';
//       const toTime = advanceData.to_time || advanceData.toTime || advanceData.checkOutTime || '12:00';

//       const guests = advanceData.guests || 1;
//       const specialRequests = advanceData.special_requests || advanceData.specialRequests || '';

//       const address = advanceData.address || '';
//       const city = advanceData.city || '';
//       const state = advanceData.state || '';
//       const pincode = advanceData.pincode || '';
//       const customerGstNo = advanceData.customer_gst_no || advanceData.customerGstNo || '';
//       const purposeOfVisit = advanceData.purpose_of_visit || advanceData.purposeOfVisit || '';

//       const otherExpenses = advanceData.other_expenses || advanceData.otherExpenses || 0;
//       const expenseDescription = advanceData.expense_description || advanceData.expenseDescription || '';
//       const referralBy = advanceData.referral_by || advanceData.referralBy || '';
//       const referralAmount = advanceData.referral_amount || advanceData.referralAmount || 0;

//       setFormData({
//         customerName: customerName,
//         customerPhone: customerPhone,
//         customerEmail: customerEmail,
//         idType: idType,
//         idNumber: idNumber,
//         checkInDate: formatDateForInput(fromDate) || defaultCheckIn,
//         checkInTime: fromTime,
//         checkOutDate: formatDateForInput(toDate) || defaultCheckOut,
//         checkOutTime: toTime,
//         guests: guests,
//         specialRequests: specialRequests,
//         address: address,
//         city: city,
//         state: state,
//         pincode: pincode,
//         customerGstNo: customerGstNo,
//         purposeOfVisit: purposeOfVisit,
//         otherExpenses: otherExpenses,
//         expenseDescription: expenseDescription,
//         referralBy: referralBy,
//         referralAmount: referralAmount
//       });

//       const amount = advanceData.amount || advanceData.totalAmount || 0;
//       if (amount > 0 && !discountApplied) {
//         const nightsCalc = (() => {
//           if (!fromDate || !toDate) return 1;
//           const a = new Date(fromDate);
//           const b = new Date(toDate);
//           const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
//           return diff > 0 ? diff : 1;
//         })();

//         setRoomPriceEditable(amount / nightsCalc);
//         setOriginalRoomPrice(amount / nightsCalc);
//       }

//       const cgstVal = Number(advanceData.cgst) || 0;
//       const sgstVal = Number(advanceData.sgst) || 0;
//       const igstVal = Number(advanceData.igst) || 0;
//       const serviceVal = Number(advanceData.service) || 0;

//       if (cgstVal > 0 || sgstVal > 0) {
//         setTaxType('cgst_sgst');
//         setIncludeCGST(cgstVal > 0);
//         setIncludeSGST(sgstVal > 0);
//         setIncludeIGST(false);

//         const baseForTax = (Number(advanceData.amount) || 0) + (Number(advanceData.service) || 0);
//         if (baseForTax > 0) {
//           setCustomCgstPercentage((cgstVal / baseForTax) * 100);
//           setCustomSgstPercentage((sgstVal / baseForTax) * 100);
//           setUseCustomPercentages(true);
//         }
//       } else if (igstVal > 0) {
//         setTaxType('igst');
//         setIncludeCGST(false);
//         setIncludeSGST(false);
//         setIncludeIGST(true);

//         const baseForTax = (Number(advanceData.amount) || 0) + (Number(advanceData.service) || 0);
//         if (baseForTax > 0) {
//           setCustomIgstPercentage((igstVal / baseForTax) * 100);
//           setUseCustomPercentages(true);
//         }
//       }

//       if (serviceVal > 0) {
//         setIncludeServiceCharge(true);
//         const baseForService = Number(advanceData.amount) || 0;
//         if (baseForService > 0) {
//           setCustomServicePercentage((serviceVal / baseForService) * 100);
//           setUseCustomPercentages(true);
//         }
//       }

//       if (advanceData.payment_method) {
//         setPaymentMethod(advanceData.payment_method as 'cash' | 'online');
//       }

//       if (advanceData.id_image) {
//         setIdImages([advanceData.id_image]);
//       }
//       if (advanceData.id_image2) {
//         setIdImages(prev => [...prev, advanceData.id_image2]);
//       }

//       toast({
//         title: "📋 Advance Booking Loaded",
//         description: `Form pre-filled with advance booking data. Advance paid: ₹${advanceData.advance_amount || advanceData.advanceAmount || 0}`,
//         variant: "default"
//       });
//     }
//   }, [advanceBookingData, isAdvanceConversion]);

//   // ========== CALCULATE CHARGES ==========
//   const calculateCharges = () => {
//     const baseAmount = roomPriceEditable * nights;

//     const servicePercentage = useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage;

//     const serviceCharge = includeServiceCharge ?
//       (baseAmount * servicePercentage) / 100 : 0;

//     let cgst = 0, sgst = 0, igst = 0, totalGst = 0;
//     let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;

//     if (taxType === 'cgst_sgst') {
//       cgstPercentage = useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage;
//       sgstPercentage = useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage;

//       cgst = includeCGST ? ((baseAmount + serviceCharge) * cgstPercentage) / 100 : 0;
//       sgst = includeSGST ? ((baseAmount + serviceCharge) * sgstPercentage) / 100 : 0;
//       totalGst = cgst + sgst;
//     } else {
//       igstPercentage = useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage;

//       igst = includeIGST ? ((baseAmount + serviceCharge) * igstPercentage) / 100 : 0;
//       totalGst = igst;
//     }

//     const otherExpenses = parseFloat(String(formData.otherExpenses)) || 0;
//     const total = baseAmount + serviceCharge + cgst + sgst + igst + otherExpenses;

//     return {
//       baseAmount,
//       serviceCharge,
//       cgst,
//       sgst,
//       igst,
//       totalGst,
//       otherExpenses,
//       total,
//       roomPrice: roomPriceEditable,
//       includeServiceCharge,
//       includeCGST,
//       includeSGST,
//       includeIGST,
//       taxType,
//       cgstPercentage,
//       sgstPercentage,
//       igstPercentage,
//       serviceChargePercentage: servicePercentage,
//       useCustomPercentages
//     };
//   };

//   const charges = calculateCharges();

//   const handleChange = (field: string, value: string | number) => {
//     if (field === 'idNumber' && typeof value === 'string') {
//       let maxLength = 16;

//       if (formData.idType === 'aadhaar') {
//         maxLength = 12;
//       } else if (formData.idType === 'pan') {
//         maxLength = 10;
//       } else if (formData.idType === 'passport') {
//         maxLength = 8;
//       }

//       value = value.slice(0, maxLength);
//     }

//     setFormData((prev) => ({ ...prev, [field]: value }));

//     if (field === 'idNumber' && typeof value === 'string') {
//       if (value.trim()) {
//         const validation = validateIdNumber(formData.idType, value);
//         setIdValidationError(validation.isValid ? '' : validation.message);
//       } else {
//         setIdValidationError('');
//       }
//     }

//     if (field === 'idType') {
//       setIdValidationError('');
//     }
//   };

//   const isReactNativeWebView = (): boolean => {
//     return !!(window as any).ReactNativeWebView;
//   };

//   const isMobileApp = (): boolean => {
//     return isReactNativeWebView() ||
//       navigator.userAgent.includes('Mobile') ||
//       navigator.userAgent.includes('WebView');
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;

//     if (!files || files.length === 0) {
//       if (isMobileApp()) {
//         if (isReactNativeWebView()) {
//           (window as any).ReactNativeWebView.postMessage(JSON.stringify({
//             type: 'UPLOAD_IMAGE_REQUEST',
//             action: 'openPicker',
//             accept: 'image/*',
//             multiple: true
//           }));
//           return;
//         }

//         toast({
//           title: "Mobile Upload",
//           description: "Please use the camera or gallery buttons below",
//           variant: "default"
//         });
//       }
//       return;
//     }

//     setUploadingImage(true);

//     try {
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];

//         if (!file.type.match(/image\/(jpeg|png|jpg|webp|heic|heif)/i)) {
//           toast({
//             title: "Invalid file type",
//             description: `Please upload image files. Detected type: ${file.type}`,
//             variant: "destructive"
//           });
//           continue;
//         }

//         const maxSize = file.type.includes('heic') || file.type.includes('heif')
//           ? 15 * 1024 * 1024
//           : 10 * 1024 * 1024;

//         if (file.size > maxSize) {
//           toast({
//             title: "File too large",
//             description: `Please upload images smaller than ${maxSize / (1024 * 1024)}MB`,
//             variant: "destructive"
//           });
//           continue;
//         }

//         let base64;
//         try {
//           base64 = await convertToBase64(file);
//         } catch (convertError) {
//           console.error('Base64 conversion error:', convertError);
//           const objectUrl = URL.createObjectURL(file);
//           setIdImages(prev => [...prev, objectUrl]);

//           toast({
//             title: "Image added",
//             description: "Image added (mobile preview)",
//             variant: "default"
//           });
//           continue;
//         }

//         let finalImage = base64;
//         try {
//           const compressedImage = await compressImage(base64);
//           finalImage = compressedImage;
//         } catch (compressError) {
//           console.warn('Compression failed, using original:', compressError);
//         }

//         if (finalImage && finalImage.length > 100) {
//           setIdImages(prev => [...prev, finalImage]);
//         } else {
//           console.error('Invalid image data');
//           const fallbackUrl = URL.createObjectURL(file);
//           setIdImages(prev => [...prev, fallbackUrl]);
//         }
//       }

//       toast({
//         title: "Images uploaded",
//         description: `${files.length} image(s) added successfully`
//       });
//     } catch (error) {
//       console.error('Error uploading images:', error);
//       toast({
//         title: "Upload failed",
//         description: "Failed to upload images. Please try again.",
//         variant: "destructive"
//       });
//     } finally {
//       setUploadingImage(false);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//     }
//   };

//   const removeImage = (index: number) => {
//     const imageToRemove = idImages[index];

//     if (imageToRemove && imageToRemove.startsWith('blob:')) {
//       URL.revokeObjectURL(imageToRemove);
//     }

//     setIdImages(prev => prev.filter((_, i) => i !== index));
//   };

//   useEffect(() => {
//     return () => {
//       idImages.forEach(image => {
//         if (image && image.startsWith('blob:')) {
//           URL.revokeObjectURL(image);
//         }
//       });
//     };
//   }, [idImages]);

//   const generateUPIQrCode = async () => {
//     setIsGeneratingQR(true);
//     try {
//       const upiId = 'test@example';
//       const merchantName = 'Hotel Management';
//       const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

//       const amountToPay = totalAdvancePaid > 0
//         ? charges.total - Number(advanceBookingData.advance_amount)
//         : charges.total;

//       const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amountToPay}&cu=INR&tn=${encodeURIComponent(transactionId)}`;
//       setQrCodeData(upiString);

//       localStorage.setItem('currentTransaction', JSON.stringify({
//         id: transactionId,
//         amount: amountToPay,
//         roomId,
//         timestamp: Date.now(),
//         testMode: true
//       }));

//       toast({
//         title: "QR Code Generated",
//         description: `Scan to pay ₹${amountToPay.toFixed(2)} (Test Mode)`,
//       });

//     } catch (error) {
//       console.error('Error generating QR code:', error);
//       toast({
//         title: "Error",
//         description: "Failed to generate QR code",
//         variant: "destructive"
//       });
//     } finally {
//       setIsGeneratingQR(false);
//     }
//   };

//   const verifyPayment = async () => {
//     setIsVerifyingPayment(true);

//     setTimeout(() => {
//       setPaymentStatus('completed');

//       toast({
//         title: "✅ Payment Successful (Test)",
//         description: "Payment verified successfully!",
//         variant: "default"
//       });

//       setIsVerifyingPayment(false);
//     }, 2000);
//   };

//   const validateIdNumber = (idType: string, idNumber: string): { isValid: boolean; message: string } => {
//     if (!idNumber.trim()) {
//       return { isValid: true, message: '' };
//     }

//     const cleanId = idNumber.replace(/\s/g, '').toUpperCase();

//     switch (idType) {
//       case 'aadhaar':
//         const aadhaarRegex = /^\d{12}$/;
//         if (!aadhaarRegex.test(cleanId)) {
//           return {
//             isValid: false,
//             message: 'Aadhaar number must be exactly 12 digits'
//           };
//         }
//         break;

//       case 'pan':
//         const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
//         if (!panRegex.test(cleanId)) {
//           return {
//             isValid: false,
//             message: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)'
//           };
//         }
//         break;

//       case 'passport':
//         const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
//         if (!passportRegex.test(cleanId)) {
//           return {
//             isValid: false,
//             message: 'Passport number must be 1 letter followed by 7 digits'
//           };
//         }
//         break;

//       case 'driving':
//         const drivingRegex = /^[A-Z0-9]{8,16}$/;
//         if (!drivingRegex.test(cleanId)) {
//           return {
//             isValid: false,
//             message: 'Driving license must be 8-16 alphanumeric characters'
//           };
//         }
//         break;

//       default:
//         return { isValid: true, message: '' };
//     }

//     return { isValid: true, message: '' };
//   };

//   const validateStep = (step: number): boolean => {
//     switch (step) {
//       case 1:
//         if (mode === 'book') {
//           if (!formData.customerName.trim()) {
//             toast({ title: 'Name required', variant: 'destructive' });
//             return false;
//           }
//           if (!formData.customerPhone.trim() || formData.customerPhone.length < 10) {
//             toast({ title: 'Valid phone number required (10 digits)', variant: 'destructive' });
//             return false;
//           }

//           if (formData.idNumber.trim() && idValidationError) {
//             toast({
//               title: 'Invalid ID Number',
//               description: idValidationError,
//               variant: "destructive"
//             });
//             return false;
//           }

//           if (!formData.checkInDate || !formData.checkOutDate) {
//             toast({ title: 'Check-in and check-out dates required', variant: 'destructive' });
//             return false;
//           }
//         }
//         return true;

//       case 2:
//         if (mode === 'book') {
//           if (formData.idNumber.trim() && idValidationError) {
//             toast({
//               title: 'Invalid ID Number',
//               description: idValidationError,
//               variant: "destructive"
//             });
//             return false;
//           }
//         }
//         return true;

//       case 3:
//         if (mode === 'book' && !paymentMethod) {
//           toast({ title: 'Payment Method Required', variant: 'destructive' });
//           return false;
//         }

//         // For online payments, verify payment is completed
//         if (paymentMethod === 'online' && paymentStatus !== 'completed') {
//           toast({
//             title: 'Payment Pending',
//             description: 'Please complete online payment',
//             variant: "destructive"
//           });
//           return false;
//         }

//         // For cash payments, automatically set status to completed
//         if (paymentMethod === 'cash') {
//           setPaymentStatus('completed');
//         }

//         return true;

//       default:
//         return true;
//     }
//   };

//   const handleNextStep = () => {
//     if (validateStep(activeStep)) {
//       if (activeStep === 2 && paymentMethod === 'online' && !qrCodeData) {
//         generateUPIQrCode();
//       }
//       setActiveStep(activeStep + 1);
//     }
//   };

//   const handlePrevStep = () => {
//     setActiveStep(activeStep - 1);
//   };

//   const handleSubmitForGoogleSheets = async () => {
//     setIsSubmitting(true);

//     try {
//       console.log('🏨 Starting Google Sheets booking process');

//       const roomIdToUse = room.roomId || roomId || `R-${room.number}`;
//       console.log('🔍 Using roomId:', roomIdToUse);

//       console.log('🔍 Checking date overlap...');
//       const overlapCheck = await checkGoogleSheetsOverlap(
//         spreadsheetId,
//         roomIdToUse,
//         formData.checkInDate,
//         formData.checkOutDate,
//         formData.checkInTime,
//         formData.checkOutTime
//       );

//       if (overlapCheck.hasOverlap) {
//         toast({
//           title: "Room Already Booked",
//           description: overlapCheck.message || `Room ${room.number} is already booked for the selected dates`,
//           variant: "destructive"
//         });
//         setIsSubmitting(false);
//         return;
//       }

//       console.log('✅ No overlap found, proceeding with booking...');

//       let customerId = '';
//       try {
//         const customerData = {
//           name: formData.customerName,
//           phone: formData.customerPhone,
//           email: formData.customerEmail,
//           idNumber: formData.idNumber,
//           idType: formData.idType,
//           idImage: idImages.length > 0 ? idImages[0] : '',
//           address: formData.address,
//           city: formData.city,
//           state: formData.state,
//           pincode: formData.pincode,
//         };

//         customerId = await saveCustomerToGoogleSheets(customerData, spreadsheetId);
//         console.log('✅ Customer saved with ID:', customerId);
//       } catch (customerError) {
//         console.error('⚠️ Customer save failed, proceeding without customer ID:', customerError);
//         customerId = `TEMP-CUST-${Date.now()}`;
//       }

//       const bookingResponse = await saveBookingToGoogleSheets({
//         roomId: roomIdToUse,
//         roomNumber: room.number,
//         customerName: formData.customerName,
//         customerPhone: formData.customerPhone,
//         customerEmail: formData.customerEmail,
//         fromDate: formData.checkInDate,
//         fromTime: formData.checkInTime,
//         toDate: formData.checkOutDate,
//         toTime: formData.checkOutTime,
//         status: mode === 'book' ? 'booked' : mode,
//         amount: charges.baseAmount,
//         serviceCharge: includeServiceCharge ? charges.serviceCharge : 0,
//         cgst: includeCGST ? charges.cgst : 0,
//         sgst: includeSGST ? charges.sgst : 0,
//         total: charges.total,
//         guests: formData.guests,
//         paymentMethod: paymentMethod || 'cash',
//         paymentStatus: paymentStatus,
//         idType: formData.idType,
//         idNumber: formData.idNumber,
//         specialRequests: formData.specialRequests,
//         idImages: idImages,
//         referralBy: formData.referralBy,
//         referralAmount: formData.referralAmount
//       }, spreadsheetId);

//       console.log('✅ Booking saved:', bookingResponse);

//       toast({
//         title: "✅ Booking Confirmed",
//         description: `Room ${room.number} ${mode === 'book' ? 'booked' : mode === 'block' ? 'blocked' : 'set for maintenance'} successfully!`,
//         variant: "default"
//       });

//       localStorage.removeItem('currentTransaction');
//       onSuccess();

//     } catch (error: any) {
//       console.error('❌ Booking error:', error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to save booking to Google Sheets",
//         variant: "destructive"
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmitForDatabase = async () => {
//     setIsSubmitting(true);
//     try {
//       const totalAmount = charges.total;
//       const advancePaid = Number(advanceBookingData?.advance_amount) || 0;
//       const remainingAmount = totalAmount - advancePaid;

//       const discountPercentageApplied = discountApplied ? (useCustomDiscount ? customDiscountPercentage : discountPercentage) : 0;
//       const discountAmountCalculated = discountApplied ? (originalRoomPrice * discountPercentageApplied / 100) * nights : 0;
//       const originalTotalAmount = originalRoomPrice * nights;

//       const isConversion = isAdvanceConversion && advanceBookingData;

//       let endpoint = '/bookings';
//       let method = 'POST';

//       if (isConversion) {
//         endpoint = `/advance-bookings/${advanceBookingData.id}/convert`;
//         method = 'POST';
//       }

//       let finalPaymentStatus;
//       if (paymentMethod === 'cash') {
//         finalPaymentStatus = 'completed';  // Cash always completed
//       } else {
//         finalPaymentStatus = paymentStatus;  // Online uses actual status
//       }

//       const payload = {
//         ...(isConversion ? {} : {
//           room_id: parseInt(roomId),
//           customer_name: formData.customerName,
//           customer_phone: formData.customerPhone,
//           customer_email: formData.customerEmail,
//           from_date: formData.checkInDate,
//           to_date: formData.checkOutDate,
//           from_time: formData.checkInTime,
//           to_time: formData.checkOutTime,
//           status: mode === 'book' ? 'booked' : mode,
//           amount: charges.baseAmount,
//           service: includeServiceCharge ? charges.serviceCharge : 0,
//           cgst: (taxType === 'cgst_sgst' && includeCGST) ? charges.cgst : 0,
//           sgst: (taxType === 'cgst_sgst' && includeSGST) ? charges.sgst : 0,
//           igst: (taxType === 'igst' && includeIGST) ? charges.igst : 0,
//           gst: (taxType === 'cgst_sgst' ? charges.cgst + charges.sgst : charges.igst),
//           total: totalAmount,
//           payment_method: paymentMethod,
//           payment_status: finalPaymentStatus,
//           id_type: formData.idType,
//           id_number: formData.idNumber,
//           id_image: idImages.length > 0 ? idImages[0] : null,
//           guests: formData.guests,
//           special_requests: formData.specialRequests,
//           referral_by: formData.referralBy,
//           referral_amount: formData.referralAmount,
//           address: formData.address || '',
//           city: formData.city || '',
//           state: formData.state || '',
//           pincode: formData.pincode || '',
//           customer_gst_no: formData.customerGstNo || '',
//           purpose_of_visit: formData.purposeOfVisit || '',
//           other_expenses: formData.otherExpenses || 0,
//           expense_description: formData.expenseDescription || '',
//           gst_percentage: taxType === 'cgst_sgst' ?
//             (charges.cgstPercentage + charges.sgstPercentage) :
//             charges.igstPercentage,
//           service_charge_percentage: includeServiceCharge ? charges.serviceChargePercentage : 0,
//           discount_percentage: discountPercentageApplied,
//           discount_amount: discountAmountCalculated,
//           original_amount: originalTotalAmount
//         }),
//         advance_booking_id: advanceBookingData?.id || null,
//         advance_amount_paid: advancePaid,
//         remaining_amount: remainingAmount,
//         conversion_payment_method: paymentMethod,
//         conversion_payment_status: paymentStatus
//       };

//       console.log('Submitting to endpoint:', endpoint);
//       console.log('Payload:', payload);

//       const token = localStorage.getItem('authToken');
//       const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
//         method: method,
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//       }

//       const result = await response.json();

//       if (result.success) {
//         toast({
//           title: "✅ Booking Confirmed",
//           description: advancePaid > 0
//             ? `Room ${room.number} booked! Advance paid: ₹${advancePaid.toFixed(2)}, Balance: ₹${remainingAmount.toFixed(2)}`
//             : `Room ${room.number} booked successfully!`,
//           variant: "default"
//         });

//         if (isConversion) {
//           window.dispatchEvent(new CustomEvent('advance-booking-converted', {
//             detail: {
//               advanceBookingId: advanceBookingData.id,
//               bookingId: result.data?.booking_id
//             }
//           }));
//         }

//         onSuccess();
//       } else {
//         throw new Error(result.message || 'Booking failed');
//       }
//     } catch (error: any) {
//       console.error('Booking error:', error);
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to complete booking',
//         variant: 'destructive'
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!validateStep(activeStep)) return;

//     if (userSource === 'database') {
//       await handleSubmitForDatabase();
//     } else {
//       await handleSubmitForGoogleSheets();
//     }
//   };

//   const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const rawPhone = e.target.value;
//     const digitsOnly = rawPhone.replace(/\D/g, '');
//     const limitedPhone = digitsOnly.slice(0, 10);

//     setFormData({ ...formData, customerPhone: limitedPhone });

//     if (limitedPhone.length === 10) {
//       try {
//         const customers = await searchCustomersByPhone(limitedPhone);
//         setFoundCustomers(customers || []);
//         setShowCustomerSearch(customers && customers.length > 0);
//       } catch (error) {
//         console.error('Error searching customers:', error);
//         setFoundCustomers([]);
//         setShowCustomerSearch(false);
//       }
//     } else {
//       setShowCustomerSearch(false);
//       setFoundCustomers([]);
//       setSelectedCustomer(null);
//     }
//   };

//   const selectCustomer = (customer: any) => {
//     setSelectedCustomer(customer);
//     setFormData({
//       ...formData,
//       customerName: customer.name,
//       customerPhone: customer.phone,
//       customerEmail: customer.email || ''
//     });
//     setShowCustomerSearch(false);
//     setFoundCustomers([]);
//   };

//   const CustomTimePicker = ({
//     value,
//     onChange,
//     label,
//     defaultTime
//   }: {
//     value: string;
//     onChange: (time: string) => void;
//     label: string;
//     defaultTime: string;
//   }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [selectedHour, setSelectedHour] = useState(() => {
//       if (value) {
//         const [h] = value.split(':');
//         return h;
//       }
//       return defaultTime.split(':')[0];
//     });
//     const [selectedMinute, setSelectedMinute] = useState(() => {
//       if (value) {
//         const [, m] = value.split(':');
//         return m;
//       }
//       return defaultTime.split(':')[1];
//     });

//     const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
//     const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

//     const handleHourChange = (hour: string) => {
//       setSelectedHour(hour);
//     };

//     const handleMinuteChange = (minute: string) => {
//       setSelectedMinute(minute);
//       const newTime = `${selectedHour}:${minute}`;
//       onChange(newTime);
//       setIsOpen(false);
//     };

//     return (
//       <div className="relative">
//         <Label htmlFor={`time-${label}`} className="flex items-center gap-2">
//           <Clock className="h-4 w-4" />
//           {label}
//         </Label>
//         <div className="relative">
//           <Input
//             id={`time-${label}`}
//             value={value || defaultTime}
//             onClick={() => setIsOpen(!isOpen)}
//             readOnly
//             className="cursor-pointer"
//             placeholder={defaultTime}
//           />
//           {isOpen && (
//             <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg p-2">
//               <div className="flex gap-2">
//                 <div className="flex-1">
//                   <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
//                     Hour
//                   </div>
//                   <div className="h-48 overflow-y-auto">
//                     {hours.map((hour) => (
//                       <button
//                         key={hour}
//                         className={`w-full px-2 py-1 text-sm text-center hover:bg-primary hover:text-primary-foreground rounded ${selectedHour === hour ? 'bg-primary text-primary-foreground' : ''
//                           }`}
//                         onClick={() => handleHourChange(hour)}
//                       >
//                         {hour}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="flex-1">
//                   <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
//                     Minute
//                   </div>
//                   <div className="h-48 overflow-y-auto">
//                     {minutes.map((minute) => (
//                       <button
//                         key={minute}
//                         className={`w-full px-2 py-1 text-sm text-center hover:bg-primary hover:text-primary-foreground rounded ${selectedMinute === minute ? 'bg-primary text-primary-foreground' : ''
//                           }`}
//                         onClick={() => handleMinuteChange(minute)}
//                       >
//                         {minute}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t mt-2 pt-2">
//                 <div className="text-xs font-medium mb-1 text-muted-foreground">
//                   Quick Select
//                 </div>
//                 <div className="flex gap-1">
//                   <button
//                     className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
//                     onClick={() => handleMinuteChange('00')}
//                   >
//                     :00
//                   </button>
//                   <button
//                     className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
//                     onClick={() => handleMinuteChange('15')}
//                   >
//                     :15
//                   </button>
//                   <button
//                     className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
//                     onClick={() => handleMinuteChange('30')}
//                   >
//                     :30
//                   </button>
//                   <button
//                     className="flex-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
//                     onClick={() => handleMinuteChange('45')}
//                   >
//                     :45
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//         <p className="text-xs text-muted-foreground">Default: {defaultTime}</p>
//       </div>
//     );
//   };

//   const title = mode === 'book' ? 'Book Room' : mode === 'block' ? 'Block Room Dates' : 'Set Under Maintenance';

//   return (
//     <Dialog open={true} onOpenChange={onClose} aria-describedby="booking-form-description">
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <div id="booking-form-description" className="sr-only">
//           Booking form for room {room?.number}. Please fill in customer details, upload ID proof, and complete payment to confirm your reservation.
//         </div>
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             {title} - Room {room?.number}
//             <span className="text-sm font-normal text-muted-foreground">
//               (Step {activeStep}/3)
//             </span>
//           </DialogTitle>

//           <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={handleAdvanceBookingRedirect}
//               className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
//             >
//               <CalendarDays className="h-4 w-4" />
//               Create Advance Booking Instead
//             </Button>

//             {/* Discount Button */}
//             {!discountApplied ? (
//               <Button
//                 variant="default"
//                 size="sm"
//                 onClick={() => setShowDiscountInput(!showDiscountInput)}
//                 className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
//               >
//                 <Gift className="h-4 w-4" />
//                 Apply Discount
//               </Button>
//             ) : (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={removeDiscount}
//                 className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
//               >
//                 <X className="h-4 w-4" />
//                 Remove Discount ({discountApplied ? (useCustomDiscount ? customDiscountPercentage : discountPercentage) : 0}%)
//               </Button>
//             )}
//           </div>

//           {/* Discount Input Panel */}
//           {showDiscountInput && !discountApplied && (
//             <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
//               <div className="flex items-center gap-2 mb-3">
//                 <Gift className="h-5 w-5 text-green-600" />
//                 <h4 className="font-semibold text-green-800">Apply Discount</h4>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex gap-2">
//                   <Button
//                     type="button"
//                     variant={!useCustomDiscount && discountPercentage === 10 ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => {
//                       setUseCustomDiscount(false);
//                       setDiscountPercentage(10);
//                     }}
//                     className="flex-1"
//                   >
//                     10% OFF
//                   </Button>
//                   <Button
//                     type="button"
//                     variant={!useCustomDiscount && discountPercentage === 15 ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => {
//                       setUseCustomDiscount(false);
//                       setDiscountPercentage(15);
//                     }}
//                     className="flex-1"
//                   >
//                     15% OFF
//                   </Button>
//                   <Button
//                     type="button"
//                     variant={!useCustomDiscount && discountPercentage === 20 ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => {
//                       setUseCustomDiscount(false);
//                       setDiscountPercentage(20);
//                     }}
//                     className="flex-1"
//                   >
//                     20% OFF
//                   </Button>
//                   <Button
//                     type="button"
//                     variant={useCustomDiscount ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => {
//                       setUseCustomDiscount(true);
//                       setCustomDiscountPercentage(25);
//                     }}
//                     className="flex-1"
//                   >
//                     Custom
//                   </Button>
//                 </div>

//                 {useCustomDiscount && (
//                   <div className="flex items-center gap-3">
//                     <Label htmlFor="customDiscount" className="whitespace-nowrap">
//                       Discount Percentage:
//                     </Label>
//                     <div className="relative flex-1">
//                       <Input
//                         id="customDiscount"
//                         type="number"
//                         min="1"
//                         max="100"
//                         step="1"
//                         value={customDiscountPercentage}
//                         onChange={(e) => setCustomDiscountPercentage(parseInt(e.target.value) || 0)}
//                         className="pr-12"
//                       />
//                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                         <span className="text-muted-foreground">%</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-end gap-2 pt-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setShowDiscountInput(false)}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     variant="default"
//                     size="sm"
//                     onClick={applyDiscount}
//                     className="bg-green-600 hover:bg-green-700"
//                   >
//                     Apply Discount
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Discount Applied Badge */}
//           {discountApplied && (
//             <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-lg flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Percent className="h-4 w-4 text-green-600" />
//                 <span className="text-sm font-medium text-green-800">
//                   {useCustomDiscount ? customDiscountPercentage : discountPercentage}% Discount Applied!
//                 </span>
//                 <span className="text-xs text-green-600">
//                   Original: ₹{originalRoomPrice} → Now: ₹{roomPriceEditable}
//                 </span>
//               </div>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={removeDiscount}
//                 className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
//               >
//                 <X className="h-3 w-3" />
//               </Button>
//             </div>
//           )}
//         </DialogHeader>

//         {/* Progress Steps */}
//         <div className="flex items-center justify-between mb-6 px-4">
//           {[
//             { number: 1, label: 'Customer Details', icon: User },
//             { number: 2, label: 'ID Proof Upload', icon: FileImage },
//             { number: 3, label: 'Payment', icon: CreditCard }
//           ].map((step) => (
//             <div key={step.number} className="flex flex-col items-center">
//               <div className={`
//                 w-10 h-10 rounded-full flex items-center justify-center
//                 ${activeStep >= step.number
//                   ? 'bg-primary text-primary-foreground'
//                   : 'bg-muted text-muted-foreground'}
//               `}>
//                 {activeStep > step.number ? (
//                   <Check className="h-5 w-5" />
//                 ) : (
//                   <step.icon className="h-5 w-5" />
//                 )}
//               </div>
//               <span className={`text-xs mt-2 ${activeStep >= step.number ? 'font-medium' : 'text-muted-foreground'}`}>
//                 {step.label}
//               </span>
//               {step.number < 3 && (
//                 <div className={`h-0.5 w-16 mt-5 ${activeStep > step.number ? 'bg-primary' : 'bg-muted'}`} />
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Step 1: Customer Details */}
//         {activeStep === 1 && (
//           <div className="space-y-6">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="customerName" className="flex items-center gap-2">
//                   <User className="h-4 w-4" />
//                   Full Name <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="customerName"
//                   value={formData.customerName}
//                   onChange={e => handleChange('customerName', e.target.value)}
//                   placeholder="Enter full name as per ID"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="customerPhone" className="flex items-center gap-2">
//                   <Phone className="h-4 w-4" />
//                   Mobile Number <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="customerPhone"
//                     value={formData.customerPhone}
//                     onChange={handlePhoneChange}
//                     placeholder="10-digit mobile number"
//                     type="tel"
//                     maxLength={10}
//                     required
//                   />
//                 </div>

//                 {showCustomerSearch && foundCustomers.length > 0 && (
//                   <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
//                     {foundCustomers.map((customer) => (
//                       <button
//                         key={customer.id}
//                         type="button"
//                         onClick={() => selectCustomer(customer)}
//                         className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
//                       >
//                         <div>
//                           <div className="font-medium">{customer.name}</div>
//                           <div className="text-sm text-muted-foreground">{customer.phone}</div>
//                         </div>
//                         <Badge variant="outline" className="bg-green-50">
//                           Existing Customer
//                         </Badge>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="customerEmail" className="flex items-center gap-2">
//                   <Mail className="h-4 w-4" />
//                   Email Address <span className="text-xs text-muted-foreground">(Optional)</span>
//                 </Label>
//                 <Input
//                   id="customerEmail"
//                   value={formData.customerEmail}
//                   onChange={e => handleChange('customerEmail', e.target.value)}
//                   placeholder="email@example.com"
//                   type="email"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="guests" className="flex items-center gap-2">
//                   <Users className="h-4 w-4" />
//                   Number of Guests
//                 </Label>
//                 <Select
//                   value={formData.guests.toString()}
//                   onValueChange={(value) => handleChange('guests', parseInt(value))}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select guests" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {[1, 2, 3, 4].map(num => (
//                       <SelectItem key={num} value={num.toString()}>
//                         {num} {num === 1 ? 'Person' : 'Persons'}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="idType" className="flex items-center gap-2">
//                   ID Type
//                   <span className="text-xs text-muted-foreground">(Optional)</span>
//                 </Label>
//                 <Select
//                   value={formData.idType}
//                   onValueChange={(value: any) => {
//                     handleChange('idType', value);
//                     setIdValidationError('');
//                     if (formData.idNumber.trim()) {
//                       const validation = validateIdNumber(value, formData.idNumber);
//                       setIdValidationError(validation.isValid ? '' : validation.message);
//                     }
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select ID type (optional)" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
//                     <SelectItem value="pan">PAN Card</SelectItem>
//                     <SelectItem value="passport">Passport</SelectItem>
//                     <SelectItem value="driving">Driving License</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="idNumber" className="flex items-center gap-2">
//                   ID Number
//                   <span className="text-xs text-muted-foreground">(Optional)</span>
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="idNumber"
//                     value={formData.idNumber}
//                     onChange={e => handleChange('idNumber', e.target.value)}
//                     placeholder={
//                       formData.idType === 'pan' ? 'ABCDE1234F' :
//                         formData.idType === 'aadhaar' ? '123456789012' :
//                           formData.idType === 'passport' ? 'A1234567' :
//                             'Enter ID number'
//                     }
//                     maxLength={
//                       formData.idType === 'aadhaar' ? 12 :
//                         formData.idType === 'pan' ? 10 :
//                           formData.idType === 'passport' ? 8 :
//                             16
//                     }
//                     className={idValidationError ? 'border-red-500 pr-10' : ''}
//                   />
//                   {idValidationError && (
//                     <div className="absolute inset-y-0 right-0 flex items-center pr-3">
//                       <AlertCircle className="h-5 w-5 text-red-500" />
//                     </div>
//                   )}
//                 </div>

//                 {idValidationError ? (
//                   <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
//                     <AlertCircle className="h-3 w-3" />
//                     {idValidationError}
//                   </p>
//                 ) : formData.idNumber.trim() ? (
//                   <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
//                     <CheckCircle className="h-3 w-3" />
//                     Valid format
//                   </p>
//                 ) : (
//                   <p className="text-xs text-muted-foreground mt-1">
//                     {formData.idType === 'pan' && 'Format: ABCDE1234F (5 letters + 4 digits + 1 letter)'}
//                     {formData.idType === 'aadhaar' && 'Format: 12 digits (e.g., 123456789012)'}
//                     {formData.idType === 'passport' && 'Format: 1 letter + 7 digits (e.g., A1234567)'}
//                     {formData.idType === 'driving' && 'Format: 8-16 alphanumeric characters'}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {userSource === 'database' && (
//               <Collapsible
//                 open={expandedSections.additionalDetails}
//                 onOpenChange={() => toggleSection('additionalDetails')}
//                 className="border rounded-lg p-4 bg-green-50/30"
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <h4 className="font-medium text-green-800">Additional Details</h4>
//                     <Badge variant="outline" className="text-xs bg-green-50">
//                       Optional
//                     </Badge>
//                   </div>
//                   <CollapsibleTrigger asChild>
//                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                       {expandedSections.additionalDetails ? (
//                         <ChevronUp className="h-4 w-4" />
//                       ) : (
//                         <ChevronDown className="h-4 w-4" />
//                       )}
//                     </Button>
//                   </CollapsibleTrigger>
//                 </div>

//                 <CollapsibleContent className="space-y-4 mt-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="address">Address</Label>
//                       <Textarea
//                         id="address"
//                         value={formData.address}
//                         onChange={e => handleChange('address', e.target.value)}
//                         placeholder="Enter full address"
//                         className="min-h-[80px]"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="customerGstNo">Customer GST No</Label>
//                       <Input
//                         id="customerGstNo"
//                         value={formData.customerGstNo}
//                         onChange={e => handleChange('customerGstNo', e.target.value)}
//                         placeholder="GSTIN (e.g., 27AAACH1234M1Z5)"
//                       />
//                       <p className="text-xs text-muted-foreground">
//                         Format: 27AAACH1234M1Z5 (15 characters)
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-3 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="city">City</Label>
//                       <Input
//                         id="city"
//                         value={formData.city}
//                         onChange={e => handleChange('city', e.target.value)}
//                         placeholder="City"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="state">State</Label>
//                       <Input
//                         id="state"
//                         value={formData.state}
//                         onChange={e => handleChange('state', e.target.value)}
//                         placeholder="State"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="pincode">Pincode</Label>
//                       <Input
//                         id="pincode"
//                         value={formData.pincode}
//                         onChange={e => handleChange('pincode', e.target.value)}
//                         placeholder="6-digit pincode"
//                         maxLength={6}
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
//                     <Textarea
//                       id="purposeOfVisit"
//                       value={formData.purposeOfVisit}
//                       onChange={e => handleChange('purposeOfVisit', e.target.value)}
//                       placeholder="Enter purpose of visit (e.g., Business meeting, Vacation, Medical treatment, etc.)"
//                       className="min-h-[80px]"
//                       rows={2}
//                     />
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="otherExpenses" className="flex items-center gap-2">
//                         <span>Other Expenses (₹)</span>
//                         <Badge variant="outline" className="text-xs">
//                           Added to total
//                         </Badge>
//                       </Label>
//                       <div className="flex items-center gap-2">
//                         <Input
//                           id="otherExpenses"
//                           type="number"
//                           value={formData.otherExpenses}
//                           onChange={e => handleChange('otherExpenses', parseFloat(e.target.value) || 0)}
//                           placeholder="0.00"
//                           min="0"
//                           step="1"
//                           className="flex-1"
//                         />
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleChange('otherExpenses', 0)}
//                           className="whitespace-nowrap"
//                         >
//                           Clear
//                         </Button>
//                       </div>
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="expenseDescription">Expense Description</Label>
//                       <Input
//                         id="expenseDescription"
//                         value={formData.expenseDescription}
//                         onChange={e => handleChange('expenseDescription', e.target.value)}
//                         placeholder="e.g., Coffee, Snacks, Laundry, Extra Bed"
//                       />
//                     </div>
//                   </div>
//                 </CollapsibleContent>
//               </Collapsible>
//             )}

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="checkInDate" className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4" />
//                   Check-in Date <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   type="date"
//                   id="checkInDate"
//                   value={formData.checkInDate}
//                   min={new Date().toISOString().split('T')[0]}
//                   onChange={e => handleChange('checkInDate', e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <CustomTimePicker
//                   value={formData.checkInTime}
//                   onChange={(time) => handleChange('checkInTime', time)}
//                   label="Check-in Time *"
//                   defaultTime="14:00"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="checkOutDate" className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4" />
//                   Check-out Date <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   type="date"
//                   id="checkOutDate"
//                   value={formData.checkOutDate}
//                   min={formData.checkInDate || new Date().toISOString().split('T')[0]}
//                   onChange={e => handleChange('checkOutDate', e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <CustomTimePicker
//                   value={formData.checkOutTime}
//                   onChange={(time) => handleChange('checkOutTime', time)}
//                   label="Check-out Time *"
//                   defaultTime="12:00"
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4 mt-4">
//               <div className="space-y-2">
//                 <Label htmlFor="referralBy">Referral By</Label>
//                 <Input
//                   id="referralBy"
//                   value={formData.referralBy}
//                   onChange={e => handleChange('referralBy', e.target.value)}
//                   placeholder="Enter referral source (e.g., Friend, Agent, Website)"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="referralAmount">Referral Amount (₹)</Label>
//                 <Input
//                   id="referralAmount"
//                   type="number"
//                   value={formData.referralAmount}
//                   onChange={e => handleChange('referralAmount', parseFloat(e.target.value) || 0)}
//                   placeholder="0.00"
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="specialRequests" className="flex items-center gap-2">
//                 <MessageSquare className="h-4 w-4" />
//                 Special Requests
//               </Label>
//               <Textarea
//                 id="specialRequests"
//                 value={formData.specialRequests}
//                 onChange={e => handleChange('specialRequests', e.target.value)}
//                 placeholder="Any special requirements, dietary restrictions, early check-in/late check-out requests..."
//                 className="min-h-[100px]"
//               />
//             </div>

//             {/* ========== PRICE CONFIGURATION SECTION ========== */}
//             <Collapsible
//               open={expandedSections.priceConfiguration}
//               onOpenChange={() => toggleSection('priceConfiguration')}
//               className="border rounded-lg p-4 md:p-6 space-y-4 bg-blue-50/50"
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <h4 className="font-semibold text-lg">💰 Price Configuration</h4>
//                   <Badge variant="outline" className="text-xs bg-blue-100">
//                     Customizable
//                   </Badge>
//                 </div>
//                 <CollapsibleTrigger asChild>
//                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                     {expandedSections.priceConfiguration ? (
//                       <ChevronUp className="h-4 w-4" />
//                     ) : (
//                       <ChevronDown className="h-4 w-4" />
//                     )}
//                   </Button>
//                 </CollapsibleTrigger>
//               </div>

//               <CollapsibleContent className="space-y-4">
//                 {/* Room Price Editing */}
//                 <div className="space-y-3">
//                   <div className="space-y-2">
//                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
//                       <Label htmlFor="roomPrice" className="flex items-center gap-2 text-sm">
//                         <IndianRupee className="h-4 w-4" />
//                         Room Price per Night (₹)
//                       </Label>
//                       {discountApplied && (
//                         <Badge className="bg-green-500 text-white">
//                           {useCustomDiscount ? customDiscountPercentage : discountPercentage}% OFF Applied!
//                         </Badge>
//                       )}
//                     </div>
//                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
//                       <div className="flex-1">
//                         <Input
//                           id="roomPrice"
//                           type="number"
//                           min="0"
//                           step="0.01"
//                           value={roomPriceEditable}
//                           onChange={(e) => !discountApplied && setRoomPriceEditable(parseFloat(e.target.value) || 0)}
//                           placeholder="Enter room price per night"
//                           className={`text-base md:text-lg font-medium ${discountApplied ? 'bg-gray-100 text-gray-600' : ''}`}
//                           disabled={discountApplied}
//                         />
//                       </div>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={() => !discountApplied && setRoomPriceEditable(originalRoomPrice)}
//                         disabled={discountApplied}
//                         className="whitespace-nowrap w-full sm:w-auto"
//                       >
//                         Reset to Original
//                       </Button>
//                     </div>

//                     {/* Discount Applied Info */}
//                     {discountApplied && (
//                       <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
//                         <div className="flex items-center gap-2 mb-2">
//                           <Percent className="h-4 w-4 text-green-600" />
//                           <span className="font-medium text-green-800">Discount Applied!</span>
//                         </div>
//                         <div className="space-y-1 text-sm">
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Original Price:</span>
//                             <span className="line-through text-gray-500">₹{originalRoomPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="flex justify-between text-green-700">
//                             <span>Discount ({useCustomDiscount ? customDiscountPercentage : discountPercentage}%):</span>
//                             <span>- ₹{(originalRoomPrice * (useCustomDiscount ? customDiscountPercentage : discountPercentage) / 100).toFixed(2)}</span>
//                           </div>
//                           <div className="flex justify-between font-bold border-t border-green-200 pt-2">
//                             <span>Discounted Price:</span>
//                             <span className="text-green-700">₹{roomPriceEditable.toFixed(2)}</span>
//                           </div>
//                         </div>
//                         <p className="text-xs text-gray-500 mt-2">
//                           Price editing is disabled while discount is active.
//                         </p>
//                       </div>
//                     )}

//                     <p className="text-xs text-muted-foreground">
//                       Base price: ₹{roomPriceEditable} × {nights} night(s) = ₹{charges.baseAmount.toFixed(2)}
//                     </p>
//                   </div>

//                   {/* Tax Type Selection */}
//                   <div className="space-y-3 border-t pt-4">
//                     <Label className="text-sm font-medium">GST Type</Label>
//                     <div className="grid grid-cols-2 gap-2">
//                       <Button
//                         type="button"
//                         variant={taxType === 'cgst_sgst' ? "default" : "outline"}
//                         onClick={() => setTaxType('cgst_sgst')}
//                         className="h-auto py-2 px-2 text-xs sm:text-sm"
//                       >
//                         <div className="text-center">
//                           <div className="font-medium">CGST+SGST</div>
//                           <div className="text-[10px] sm:text-xs opacity-90">Local</div>
//                         </div>
//                       </Button>
//                       <Button
//                         type="button"
//                         variant={taxType === 'igst' ? "default" : "outline"}
//                         onClick={() => setTaxType('igst')}
//                         className="h-auto py-2 px-2 text-xs sm:text-sm"
//                       >
//                         <div className="text-center">
//                           <div className="font-medium">IGST</div>
//                           <div className="text-[10px] sm:text-xs opacity-90">Outside</div>
//                         </div>
//                       </Button>
//                     </div>
//                   </div>

//                   {/* Optional Charges */}
//                   <div className="space-y-3 pt-2">
//                     {/* Service Charge */}
//                     <div className="flex flex-col p-3 border rounded-lg bg-white">
//                       <div className="flex items-start gap-3">
//                         <div className="flex items-center h-5 pt-0.5">
//                           <input
//                             type="checkbox"
//                             id="includeServiceCharge"
//                             checked={includeServiceCharge}
//                             onChange={(e) => setIncludeServiceCharge(e.target.checked)}
//                             className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                           />
//                         </div>
//                         <div className="flex-1">
//                           <Label htmlFor="includeServiceCharge" className="font-medium text-sm cursor-pointer">
//                             Service Charge
//                           </Label>
//                           <p className="text-xs text-muted-foreground">
//                             Hotel service charge
//                           </p>
//                         </div>
//                       </div>

//                       {includeServiceCharge && (
//                         <div className="mt-2 ml-7 space-y-2">
//                           <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                             <div className="flex items-center gap-2 w-full xs:w-auto">
//                               <Input
//                                 type="number"
//                                 min="0"
//                                 max="100"
//                                 step="0.01"
//                                 value={useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage}
//                                 onChange={(e) => {
//                                   setUseCustomPercentages(true);
//                                   setCustomServicePercentage(parseFloat(e.target.value) || 0);
//                                 }}
//                                 className="w-20 text-sm"
//                                 placeholder="%"
//                               />
//                               <span className="text-sm">%</span>
//                             </div>
//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => {
//                                 setUseCustomPercentages(false);
//                                 setCustomServicePercentage(hotelSettings.serviceChargePercentage);
//                               }}
//                               className="text-xs h-8 px-2"
//                             >
//                               Reset
//                             </Button>
//                           </div>
//                           <div className="text-xs text-green-600 font-medium">
//                             + ₹{charges.serviceCharge.toFixed(2)}
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     {/* CGST + SGST Section */}
//                     {taxType === 'cgst_sgst' && (
//                       <>
//                         <div className="flex flex-col p-3 border rounded-lg bg-white">
//                           <div className="flex items-start gap-3">
//                             <div className="flex items-center h-5 pt-0.5">
//                               <input
//                                 type="checkbox"
//                                 id="includeCGST"
//                                 checked={includeCGST}
//                                 onChange={(e) => setIncludeCGST(e.target.checked)}
//                                 className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                               />
//                             </div>
//                             <div className="flex-1">
//                               <Label htmlFor="includeCGST" className="font-medium text-sm cursor-pointer">
//                                 CGST (Central)
//                               </Label>
//                               <p className="text-xs text-muted-foreground">
//                                 Central GST
//                               </p>
//                             </div>
//                           </div>

//                           {includeCGST && (
//                             <div className="mt-2 ml-7 space-y-2">
//                               <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                                 <div className="flex items-center gap-2 w-full xs:w-auto">
//                                   <Input
//                                     type="number"
//                                     min="0"
//                                     max="100"
//                                     step="0.01"
//                                     value={useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage}
//                                     onChange={(e) => {
//                                       setUseCustomPercentages(true);
//                                       setCustomCgstPercentage(parseFloat(e.target.value) || 0);
//                                     }}
//                                     className="w-20 text-sm"
//                                     placeholder="%"
//                                   />
//                                   <span className="text-sm">%</span>
//                                 </div>
//                                 <Button
//                                   type="button"
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => {
//                                     setUseCustomPercentages(false);
//                                     setCustomCgstPercentage(hotelSettings.cgstPercentage);
//                                   }}
//                                   className="text-xs h-8 px-2"
//                                 >
//                                   Reset
//                                 </Button>
//                               </div>
//                               <div className="text-xs text-green-600 font-medium">
//                                 + ₹{charges.cgst.toFixed(2)}
//                               </div>
//                             </div>
//                           )}
//                         </div>

//                         <div className="flex flex-col p-3 border rounded-lg bg-white">
//                           <div className="flex items-start gap-3">
//                             <div className="flex items-center h-5 pt-0.5">
//                               <input
//                                 type="checkbox"
//                                 id="includeSGST"
//                                 checked={includeSGST}
//                                 onChange={(e) => setIncludeSGST(e.target.checked)}
//                                 className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                               />
//                             </div>
//                             <div className="flex-1">
//                               <Label htmlFor="includeSGST" className="font-medium text-sm cursor-pointer">
//                                 SGST (State)
//                               </Label>
//                               <p className="text-xs text-muted-foreground">
//                                 State GST
//                               </p>
//                             </div>
//                           </div>

//                           {includeSGST && (
//                             <div className="mt-2 ml-7 space-y-2">
//                               <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                                 <div className="flex items-center gap-2 w-full xs:w-auto">
//                                   <Input
//                                     type="number"
//                                     min="0"
//                                     max="100"
//                                     step="0.01"
//                                     value={useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage}
//                                     onChange={(e) => {
//                                       setUseCustomPercentages(true);
//                                       setCustomSgstPercentage(parseFloat(e.target.value) || 0);
//                                     }}
//                                     className="w-20 text-sm"
//                                     placeholder="%"
//                                   />
//                                   <span className="text-sm">%</span>
//                                 </div>
//                                 <Button
//                                   type="button"
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => {
//                                     setUseCustomPercentages(false);
//                                     setCustomSgstPercentage(hotelSettings.sgstPercentage);
//                                   }}
//                                   className="text-xs h-8 px-2"
//                                 >
//                                   Reset
//                                 </Button>
//                               </div>
//                               <div className="text-xs text-green-600 font-medium">
//                                 + ₹{charges.sgst.toFixed(2)}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </>
//                     )}

//                     {/* IGST Section */}
//                     {taxType === 'igst' && (
//                       <div className="flex flex-col p-3 border rounded-lg bg-white">
//                         <div className="flex items-start gap-3">
//                           <div className="flex items-center h-5 pt-0.5">
//                             <input
//                               type="checkbox"
//                               id="includeIGST"
//                               checked={includeIGST}
//                               onChange={(e) => setIncludeIGST(e.target.checked)}
//                               className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                             />
//                           </div>
//                           <div className="flex-1">
//                             <Label htmlFor="includeIGST" className="font-medium text-sm cursor-pointer">
//                               IGST (Integrated)
//                             </Label>
//                             <p className="text-xs text-muted-foreground">
//                               For inter-state transactions
//                             </p>
//                           </div>
//                         </div>

//                         {includeIGST && (
//                           <div className="mt-2 ml-7 space-y-2">
//                             <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                               <div className="flex items-center gap-2 w-full xs:w-auto">
//                                 <Input
//                                   type="number"
//                                   min="0"
//                                   max="100"
//                                   step="0.01"
//                                   value={useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage}
//                                   onChange={(e) => {
//                                     setUseCustomPercentages(true);
//                                     setCustomIgstPercentage(parseFloat(e.target.value) || 0);
//                                   }}
//                                   className="w-20 text-sm"
//                                   placeholder="%"
//                                 />
//                                 <span className="text-sm">%</span>
//                               </div>
//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => {
//                                   setUseCustomPercentages(false);
//                                   setCustomIgstPercentage(hotelSettings.igstPercentage);
//                                 }}
//                                 className="text-xs h-8 px-2"
//                               >
//                                 Reset
//                               </Button>
//                             </div>
//                             <div className="text-xs text-green-600 font-medium">
//                               + ₹{charges.igst.toFixed(2)}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   {/* Quick Actions */}
//                   <div className="flex flex-col xs:flex-row gap-2 pt-2">
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={() => {
//                         setIncludeServiceCharge(true);
//                         if (taxType === 'cgst_sgst') {
//                           setIncludeCGST(true);
//                           setIncludeSGST(true);
//                           setIncludeIGST(false);
//                         } else {
//                           setIncludeCGST(false);
//                           setIncludeSGST(false);
//                           setIncludeIGST(true);
//                         }
//                         setUseCustomPercentages(false);
//                         setCustomServicePercentage(hotelSettings.serviceChargePercentage);
//                         setCustomCgstPercentage(hotelSettings.gstPercentage / 2);
//                         setCustomSgstPercentage(hotelSettings.gstPercentage / 2);
//                         setCustomIgstPercentage(hotelSettings.gstPercentage);
//                       }}
//                       className="flex-1 text-xs sm:text-sm"
//                     >
//                       Include All (Default)
//                     </Button>
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={() => {
//                         setIncludeServiceCharge(false);
//                         setIncludeCGST(false);
//                         setIncludeSGST(false);
//                         setIncludeIGST(false);
//                       }}
//                       className="flex-1 text-xs sm:text-sm"
//                     >
//                       Remove All
//                     </Button>
//                   </div>
//                 </div>
//               </CollapsibleContent>
//             </Collapsible>

//             {/* ========== PRICE SUMMARY ========== */}
//             <Collapsible
//               open={expandedSections.priceSummary}
//               onOpenChange={() => toggleSection('priceSummary')}
//               className="border rounded-lg p-6 space-y-3 bg-muted/50"
//             >
//               <div className="flex items-center justify-between">
//                 <h4 className="font-semibold text-lg">Price Summary</h4>
//                 <CollapsibleTrigger asChild>
//                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                     {expandedSections.priceSummary ? (
//                       <ChevronUp className="h-4 w-4" />
//                     ) : (
//                       <ChevronDown className="h-4 w-4" />
//                     )}
//                   </Button>
//                 </CollapsibleTrigger>
//               </div>

//               <CollapsibleContent className="space-y-2">
//                 <div className="flex justify-between">
//                   <span>Room Price (₹{roomPriceEditable.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'})</span>
//                   <span>₹{charges.baseAmount.toFixed(2)}</span>
//                 </div>

//                 {includeServiceCharge && (
//                   <div className="flex justify-between">
//                     <span className="flex items-center gap-2">
//                       Service Charge ({charges.serviceChargePercentage}%)
//                     </span>
//                     <span>₹{charges.serviceCharge.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {taxType === 'cgst_sgst' && (
//                   <>
//                     {includeCGST && (
//                       <div className="flex justify-between">
//                         <span className="flex items-center gap-2">
//                           CGST ({charges.cgstPercentage}%)
//                         </span>
//                         <span>₹{charges.cgst.toFixed(2)}</span>
//                       </div>
//                     )}

//                     {includeSGST && (
//                       <div className="flex justify-between">
//                         <span className="flex items-center gap-2">
//                           SGST ({charges.sgstPercentage}%)
//                         </span>
//                         <span>₹{charges.sgst.toFixed(2)}</span>
//                       </div>
//                     )}
//                   </>
//                 )}

//                 {taxType === 'igst' && includeIGST && (
//                   <div className="flex justify-between">
//                     <span className="flex items-center gap-2">
//                       IGST ({charges.igstPercentage}%)
//                     </span>
//                     <span>₹{charges.igst.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {formData.otherExpenses > 0 && (
//                   <div className="flex justify-between text-sm border-t pt-2 mt-2">
//                     <span className="flex items-center gap-1">
//                       Other Expenses
//                       {formData.expenseDescription && (
//                         <span className="text-xs text-muted-foreground">
//                           ({formData.expenseDescription})
//                         </span>
//                       )}
//                     </span>
//                     <span className="text-blue-600 font-medium">+ ₹{formData.otherExpenses.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {/* Advance Payment Section */}
//                 {totalAdvancePaid > 0 && (
//                   <>
//                     <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
//                       <span className="flex items-center gap-1">
//                         <CheckCircle className="h-4 w-4" />
//                         Advance Paid:
//                       </span>
//                       <span className="font-bold">- ₹{totalAdvancePaid.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between text-orange-600">
//                       <span className="flex items-center gap-1">
//                         Balance Due:
//                       </span>
//                       <span className="font-bold">₹{balanceDue.toFixed(2)}</span>
//                     </div>
//                   </>
//                 )}

//                 <div className="border-t pt-2 mt-2">
//                   <div className="flex justify-between font-bold text-lg">
//                     <span>Total Amount</span>
//                     <span className="text-green-600">₹{charges.total.toFixed(2)}</span>
//                   </div>
//                   <div className="text-sm text-muted-foreground mt-1">
//                     {!includeServiceCharge && !includeCGST && !includeSGST && !includeIGST && formData.otherExpenses === 0 ? "No additional charges" :
//                       `Includes: ${includeServiceCharge ? 'Service Charge ' : ''}${includeCGST ? 'CGST ' : ''}${includeSGST ? 'SGST ' : ''}${includeIGST ? 'IGST' : ''}`}
//                   </div>
//                 </div>
//               </CollapsibleContent>
//             </Collapsible>

//             <div className="flex justify-between gap-2 pt-4">
//               <Button variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>
//               <Button onClick={handleNextStep} disabled={isCheckingOverlap}>
//                 {isCheckingOverlap ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Checking Availability...
//                   </>
//                 ) : (
//                   <>
//                     Next: ID Proof Upload
//                     <ChevronRight className="ml-2 h-4 w-4" />
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Step 2: ID Proof Upload */}
//         {activeStep === 2 && (
//           <div className="space-y-6">
//             <Alert>
//               <FileImage className="h-4 w-4" />
//               <AlertDescription>
//                 Please upload clear images of your {formData.idType === 'pan' ? 'PAN Card' : 'Aadhaar Card'}.
//                 Upload front and back side if applicable.
//               </AlertDescription>
//             </Alert>

//             <div className="space-y-4">
//               <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-8 bg-primary/5 hover:border-primary/50 transition-colors">
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleFileUpload}
//                   accept="image/*"
//                   capture="environment"
//                   multiple
//                   className="hidden"
//                   id="file-upload-input"
//                 />

//                 <label
//                   htmlFor="file-upload-input"
//                   className="cursor-pointer flex flex-col items-center space-y-4"
//                 >
//                   <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
//                     {uploadingImage ? (
//                       <Loader2 className="h-8 w-8 text-primary animate-spin" />
//                     ) : (
//                       <Upload className="h-8 w-8 text-primary" />
//                     )}
//                   </div>
//                   <div className="text-center">
//                     <h3 className="font-semibold text-lg mb-2">Upload ID Proof Images</h3>
//                     <p className="text-sm text-muted-foreground">
//                       Tap to choose from gallery or take a photo
//                     </p>
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Supported formats: JPG, PNG, WebP
//                     </p>
//                   </div>
//                 </label>

//                 <div className="mt-4 flex gap-4">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       const cameraInput = document.createElement('input');
//                       cameraInput.type = 'file';
//                       cameraInput.accept = 'image/*';
//                       cameraInput.capture = 'environment';
//                       cameraInput.multiple = false;

//                       cameraInput.onchange = (e) => {
//                         const files = (e.target as HTMLInputElement).files;
//                         if (files && files.length > 0) {
//                           const event = {
//                             target: { files }
//                           } as React.ChangeEvent<HTMLInputElement>;
//                           handleFileUpload(event);
//                         }
//                       };

//                       cameraInput.click();
//                     }}
//                     className="text-sm"
//                   >
//                     📷 Take Photo
//                   </Button>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       const galleryInput = document.createElement('input');
//                       galleryInput.type = 'file';
//                       galleryInput.accept = 'image/*';
//                       galleryInput.multiple = true;

//                       galleryInput.onchange = (e) => {
//                         const files = (e.target as HTMLInputElement).files;
//                         if (files && files.length > 0) {
//                           const event = {
//                             target: { files }
//                           } as React.ChangeEvent<HTMLInputElement>;
//                           handleFileUpload(event);
//                         }
//                       };

//                       galleryInput.click();
//                     }}
//                     className="text-sm"
//                   >
//                     🖼️ Choose from Gallery
//                   </Button>
//                 </div>
//               </div>

//               {idImages.length > 0 && (
//                 <div className="space-y-3">
//                   <div className="flex items-center justify-between">
//                     <Label className="text-sm font-medium">
//                       Uploaded Images ({idImages.length})
//                     </Label>
//                     <div className="flex gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setIdImages([])}
//                         disabled={idImages.length === 0}
//                       >
//                         Clear All
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => fileInputRef.current?.click()}
//                       >
//                         Add More
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//                     {idImages.map((image, index) => (
//                       <div key={index} className="relative group">
//                         <div className="aspect-square rounded-lg border overflow-hidden bg-gray-100">
//                           {image.startsWith('data:image') ? (
//                             <img
//                               src={image}
//                               alt={`ID Proof ${index + 1}`}
//                               className="w-full h-full object-cover"
//                               onError={(e) => {
//                                 console.error('Image failed to load:', image.substring(0, 100));
//                                 e.currentTarget.src = '/images/placeholder.png';
//                                 e.currentTarget.alt = 'Image failed to load';
//                                 e.currentTarget.classList.add('bg-gray-100', 'p-4');
//                               }}
//                             />
//                           ) : (
//                             <div className="w-full h-full flex items-center justify-center">
//                               <FileImage className="h-8 w-8 text-gray-400" />
//                             </div>
//                           )}
//                         </div>
//                         <Button
//                           size="sm"
//                           variant="destructive"
//                           className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
//                           onClick={() => removeImage(index)}
//                         >
//                           <X className="h-3 w-3" />
//                         </Button>
//                         <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
//                           {index === 0 ? 'Front' : index === 1 ? 'Back' : `Image ${index + 1}`}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="bg-muted/30 rounded-lg p-4 space-y-2">
//               <h4 className="font-medium">📋 Upload Instructions:</h4>
//               <ul className="text-sm space-y-1">
//                 <li>• <strong>On Mobile:</strong> Use camera or gallery options</li>
//                 <li>• <strong>On Desktop:</strong> Drag & drop or click to browse</li>
//                 <li>• Upload clear, well-lit images of your ID proof</li>
//                 <li>• Ensure all details are visible and readable</li>
//                 <li>• For Aadhaar: Upload both front and back sides</li>
//                 <li>• For PAN: Upload the PAN card image</li>
//               </ul>
//             </div>

//             <div className="flex justify-between gap-2 pt-4">
//               <Button variant="outline" onClick={handlePrevStep}>
//                 <ChevronLeft className="mr-2 h-4 w-4" />
//                 Back
//               </Button>
//               <Button
//                 onClick={handleNextStep}
//                 disabled={mode === 'book' && idImages.length === 0}
//               >
//                 {idImages.length === 0 && mode === 'book' ? 'Upload ID First' : 'Next: Payment'}
//                 <ChevronRight className="ml-2 h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Step 3: Payment */}
//         {activeStep === 3 && (
//           <div className="space-y-6">
//             {/* Advance Booking Info Box */}
//             {isAdvanceConversion && advanceBookingData && (
//               <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
//                 <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-3">
//                   <CheckCircle className="h-4 w-4" />
//                   Advance Payment Details
//                 </h4>
//                 <div className="grid grid-cols-2 gap-3 text-sm">
//                   <div>
//                     <span className="text-purple-600">Advance Booking #:</span>
//                     <span className="font-medium ml-2">{advanceBookingData.invoice_number}</span>
//                   </div>
//                   <div>
//                     <span className="text-purple-600">Full Booking Amount:</span>
//                     <span className="font-bold ml-2">₹{charges.total.toFixed(2)}</span>
//                   </div>
//                   <div>
//                     <span className="text-purple-600">Advance Already Paid:</span>
//                     <span className="font-bold text-green-600 ml-2">
//                       - ₹{totalAdvancePaid.toFixed(2)}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-purple-600">Payment Method:</span>
//                     <span className="font-medium ml-2 capitalize">{advanceBookingData.payment_method}</span>
//                   </div>
//                   <div className="col-span-2 border-t border-purple-200 pt-2 mt-1">
//                     <div className="flex justify-between">
//                       <span className="font-medium text-purple-800">Balance Due at Check-in:</span>
//                       <span className="font-bold text-orange-600 text-lg">
//                         ₹{balanceDue.toFixed(2)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold">Select Payment Method</h3>
//               <Badge variant="outline" className={userPlan === 'pro' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
//                 {userPlan === 'pro' ? 'Pro Plan' : 'Basic Plan'}
//               </Badge>
//             </div>

//             {userPlan === 'pro' ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Button
//                   type="button"
//                   variant={paymentMethod === 'online' ? "default" : "outline"}
//                   className="h-28 flex flex-col gap-2 py-4"
//                   onClick={() => {
//                     setPaymentMethod('online');
//                     if (!qrCodeData) generateUPIQrCode();
//                   }}
//                   disabled={isGeneratingQR}
//                 >
//                   <div className="flex items-center gap-2">
//                     <QrCode className="h-6 w-6" />
//                     <span className="font-medium">Online Payment</span>
//                   </div>
//                   <span className="text-sm text-muted-foreground">
//                     Pay now via UPI QR Code
//                   </span>
//                   {isGeneratingQR && (
//                     <Loader2 className="h-4 w-4 animate-spin mt-1" />
//                   )}
//                 </Button>

//                 <Button
//                   type="button"
//                   variant={paymentMethod === 'cash' ? "default" : "outline"}
//                   className="h-28 flex flex-col gap-2 py-4"
//                   onClick={() => setPaymentMethod('cash')}
//                 >
//                   <div className="flex items-center gap-2">
//                     <Wallet className="h-6 w-6" />
//                     <span className="font-medium">Cash Payment</span>
//                   </div>
//                   <span className="text-sm text-muted-foreground">
//                     Pay at hotel reception on arrival
//                   </span>
//                 </Button>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <Alert className="bg-blue-50 border-blue-200">
//                   <div className="flex items-start gap-3">
//                     <Info className="h-5 w-5 text-blue-600 mt-0.5" />
//                     <div>
//                       <AlertDescription className="text-blue-700">
//                         <strong>Basic Plan:</strong> Online payments are available in Pro Plan.
//                         Cash payment is automatically selected.
//                       </AlertDescription>
//                     </div>
//                   </div>
//                 </Alert>

//                 <div className="flex justify-center">
//                   <Button
//                     type="button"
//                     variant="default"
//                     className="h-28 w-full max-w-md flex flex-col gap-2 py-4"
//                     onClick={() => setPaymentMethod('cash')}
//                   >
//                     <div className="flex items-center gap-2">
//                       <Wallet className="h-6 w-6" />
//                       <span className="font-medium">Cash Payment</span>
//                     </div>
//                     <span className="text-sm text-muted-foreground">
//                       Pay at hotel reception on arrival
//                     </span>
//                   </Button>
//                 </div>
//               </div>
//             )}

//             {paymentMethod === 'online' && userPlan === 'pro' && (
//               <div className="space-y-6">
//                 <div className="border rounded-xl p-6">
//                   <div className="flex flex-col md:flex-row gap-6">
//                     <div className="md:w-1/2 space-y-4">
//                       <h4 className="font-semibold text-center">QR Code Payment</h4>

//                       <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
//                         {hotelQRCode ? (
//                           <>
//                             <img
//                               src={hotelQRCode}
//                               alt="Hotel UPI QR Code"
//                               className="w-48 h-48 object-contain mx-auto"
//                               onError={(e) => {
//                                 console.error('Hotel QR code failed to load');
//                                 e.currentTarget.src = '/images/hithlakshsolutions-com-qr.png';
//                                 e.currentTarget.alt = 'UPI QR Code for Payment';
//                               }}
//                             />
//                             <div className="mt-3 text-center">
//                               <div className="text-sm font-medium mb-1">
//                                 {totalAdvancePaid > 0
//                                   ? 'Remaining Amount:'
//                                   : 'Amount:'}
//                                 <span className="text-lg font-bold text-green-600 ml-2">
//                                   ₹{totalAdvancePaid > 0
//                                     ? balanceDue.toFixed(2)
//                                     : charges.total.toFixed(2)}
//                                 </span>
//                               </div>
//                               <div className="text-xs text-gray-500 mt-2">
//                                 Scan to pay {totalAdvancePaid > 0 ? 'remaining amount' : 'to this hotel'}
//                               </div>
//                             </div>
//                           </>
//                         ) : (
//                           <>
//                             <img
//                               src="/images/hithlakshsolutions-com-qr.png"
//                               alt="UPI QR Code for Payment"
//                               className="w-48 h-48 object-contain mx-auto"
//                               onError={(e) => {
//                                 console.error('Default QR code also failed to load');
//                                 e.currentTarget.src = 'https://via.placeholder.com/200x200/2c3e50/ffffff?text=QR+Code';
//                                 e.currentTarget.alt = 'QR Code Placeholder';
//                               }}
//                             />
//                             <div className="mt-3 text-center">
//                               <div className="text-sm font-medium mb-1">
//                                 {totalAdvancePaid > 0
//                                   ? 'Remaining Amount:'
//                                   : 'Amount:'}
//                                 <span className="text-lg font-bold text-green-600 ml-2">
//                                   ₹{totalAdvancePaid > 0
//                                     ? balanceDue.toFixed(2)
//                                     : charges.total.toFixed(2)}
//                                 </span>
//                               </div>
//                               <div className="text-xs text-gray-500 mt-2">
//                                 Scan with any UPI app or pay to: <strong>hithlakshsolutions@okhdfcbank</strong>
//                               </div>
//                               <div className="text-xs text-gray-500 mt-1">
//                                 UPI ID: hithlakshsolutions@okhdfcbank
//                               </div>
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     </div>

//                     <div className="md:w-1/2 space-y-4">
//                       <h4 className="font-semibold">Payment Instructions</h4>
//                       <div className="space-y-3">
//                         <div className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                             <span className="text-xs font-medium text-primary">1</span>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Scan QR Code</p>
//                             <p className="text-xs text-muted-foreground mt-1">
//                               Use any UPI app to scan the QR code above
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                             <span className="text-xs font-medium text-primary">2</span>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Enter Amount</p>
//                             <p className="text-xs text-muted-foreground mt-1">
//                               Enter the exact amount shown: <strong>
//                                 ₹{totalAdvancePaid > 0
//                                   ? balanceDue.toFixed(2)
//                                   : charges.total.toFixed(2)}
//                               </strong>
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                             <span className="text-xs font-medium text-primary">3</span>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Complete Payment</p>
//                             <p className="text-xs text-muted-foreground mt-1">
//                               Enter your UPI PIN to complete the payment
//                             </p>
//                           </div>
//                         </div>
//                         <div className="flex items-start gap-3">
//                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                             <span className="text-xs font-medium text-primary">4</span>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium">Verify Payment</p>
//                             <p className="text-xs text-muted-foreground mt-1">
//                               Click "I have made the payment" below after payment
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="space-y-4 mt-6">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">Payment Status:</span>
//                           <div className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
//                             paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
//                               'bg-yellow-100 text-yellow-800'
//                             }`}>
//                             {paymentStatus === 'completed' ? '✅ Completed' :
//                               paymentStatus === 'failed' ? '❌ Failed' :
//                                 '🔄 Pending'}
//                           </div>
//                         </div>

//                         {paymentStatus === 'pending' ? (
//                           <Button
//                             onClick={verifyPayment}
//                             className="w-full"
//                             disabled={isVerifyingPayment}
//                           >
//                             {isVerifyingPayment ? (
//                               <>
//                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                 Verifying Payment...
//                               </>
//                             ) : (
//                               <>
//                                 <CheckCircle className="h-4 w-4 mr-2" />
//                                 I have made the payment
//                               </>
//                             )}
//                           </Button>
//                         ) : paymentStatus === 'completed' ? (
//                           <Alert className="bg-green-50 border-green-200">
//                             <CheckCircle className="h-4 w-4 text-green-600" />
//                             <AlertDescription className="text-green-700 font-medium">
//                               ✅ Payment Verified Successfully!
//                             </AlertDescription>
//                           </Alert>
//                         ) : (
//                           <Alert className="bg-red-50 border-red-200">
//                             <AlertCircle className="h-4 w-4 text-red-600" />
//                             <AlertDescription className="text-red-700">
//                               ❌ Payment Failed
//                             </AlertDescription>
//                           </Alert>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {paymentMethod === 'cash' && (
//               <div className="border rounded-xl p-6 space-y-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//                     <Wallet className="h-5 w-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold">Cash Payment at Hotel</h4>
//                     <p className="text-sm text-muted-foreground">
//                       Pay when you arrive at the reception
//                     </p>
//                   </div>
//                 </div>

//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">
//                       {totalAdvancePaid > 0
//                         ? 'Remaining Amount Due:'
//                         : 'Total Amount Due:'}
//                     </span>
//                     <span className="text-2xl font-bold text-blue-700">
//                       ₹{totalAdvancePaid > 0
//                         ? balanceDue.toFixed(2)
//                         : charges.total.toFixed(2)}
//                     </span>
//                   </div>
//                   {totalAdvancePaid > 0 && (
//                     <div className="flex justify-between text-sm text-green-600 mt-2 pt-2 border-t border-blue-200">
//                       <span>Advance already paid:</span>
//                       <span className="font-semibold">₹{totalAdvancePaid.toFixed(2)}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-3">
//                   <h5 className="font-medium">Instructions:</h5>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex items-start gap-2">
//                       <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
//                       <span>Booking will be confirmed immediately</span>
//                     </div>
//                     <div className="flex items-start gap-2">
//                       <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
//                       <span>Pay at hotel reception during check-in</span>
//                     </div>
//                     <div className="flex items-start gap-2">
//                       <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
//                       <span>Receipt will be provided at reception</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {!paymentMethod && userPlan === 'pro' && (
//               <Alert className="bg-yellow-50 border-yellow-200">
//                 <AlertCircle className="h-4 w-4 text-yellow-600" />
//                 <AlertDescription>
//                   Please select a payment method to continue
//                 </AlertDescription>
//               </Alert>
//             )}

//             {/* Final Booking Summary */}
//             <div className="border rounded-lg p-6 space-y-4">
//               <h4 className="font-semibold text-lg">Booking Summary</h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Customer:</span>
//                     <span className="font-medium">{formData.customerName}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Contact:</span>
//                     <span className="font-medium">{formData.customerPhone}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Room Price/Night:</span>
//                     <span className="font-medium">
//                       {discountApplied ? (
//                         <div className="flex flex-col items-end">
//                           <span className="line-through text-gray-400 text-xs">₹{originalRoomPrice.toFixed(2)}</span>
//                           <span className="text-green-600">₹{roomPriceEditable.toFixed(2)}</span>
//                         </div>
//                       ) : (
//                         `₹{roomPriceEditable.toFixed(2)}`
//                       )}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Duration:</span>
//                     <span className="font-medium">{nights} {nights === 1 ? 'night' : 'nights'}</span>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Check-in:</span>
//                     <span className="font-medium">
//                       {new Date(formData.checkInDate).toLocaleDateString()} at {formData.checkInTime}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Check-out:</span>
//                     <span className="font-medium">
//                       {new Date(formData.checkOutDate).toLocaleDateString()} at {formData.checkOutTime}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">ID Proof:</span>
//                     <span className="font-medium">
//                       {idImages.length} image(s) uploaded
//                     </span>
//                   </div>
//                   {formData.referralBy && (
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Referral:</span>
//                       <span className="font-medium">{formData.referralBy}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Price Breakdown */}
//               <div className="border-t pt-4 space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span>Base Amount (₹{roomPriceEditable.toFixed(2)} × {nights}):</span>
//                   <span>₹{charges.baseAmount.toFixed(2)}</span>
//                 </div>

//                 {includeServiceCharge && (
//                   <div className="flex justify-between text-sm">
//                     <span className="flex items-center gap-1">
//                       Service Charge ({charges.serviceChargePercentage}%)
//                       <Badge variant="outline" className="text-xs">Optional</Badge>
//                     </span>
//                     <span>₹{charges.serviceCharge.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {includeCGST && (
//                   <div className="flex justify-between text-sm">
//                     <span className="flex items-center gap-1">
//                       CGST ({charges.cgstPercentage}%)
//                       <Badge variant="outline" className="text-xs">Optional</Badge>
//                     </span>
//                     <span>₹{charges.cgst.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {includeSGST && (
//                   <div className="flex justify-between text-sm">
//                     <span className="flex items-center gap-1">
//                       SGST ({charges.sgstPercentage}%)
//                       <Badge variant="outline" className="text-xs">Optional</Badge>
//                     </span>
//                     <span>₹{charges.sgst.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {includeIGST && (
//                   <div className="flex justify-between text-sm">
//                     <span className="flex items-center gap-1">
//                       IGST ({charges.igstPercentage}%)
//                       <Badge variant="outline" className="text-xs">Optional</Badge>
//                     </span>
//                     <span>₹{charges.igst.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {totalAdvancePaid > 0 && (
//                   <>
//                     <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
//                       <span className="flex items-center gap-1">
//                         <CheckCircle className="h-4 w-4" />
//                         Advance Paid:
//                       </span>
//                       <span className="font-bold">₹{totalAdvancePaid.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between text-orange-600">
//                       <span className="flex items-center gap-1">
//                         Balance Due at Check-in:
//                       </span>
//                       <span className="font-bold">₹{balanceDue.toFixed(2)}</span>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {/* Payment Method Summary */}
//               <div className="border-t pt-4">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-muted-foreground">Payment Method:</span>
//                   <span className="font-medium">
//                     {paymentMethod === 'online' ? 'Online (QR Code)' : 'Cash at Hotel'}
//                   </span>
//                 </div>

//                 {/* Total Amount */}
//                 <div className="flex justify-between items-center border-t pt-3">
//                   <div>
//                     <div className="font-bold text-lg">Total Amount</div>
//                     <div className="text-sm text-muted-foreground">
//                       {paymentMethod === 'online' ? 'To be paid online' : 'To be paid at hotel'}
//                       {totalAdvancePaid > 0 && (
//                         <span className="block text-xs text-orange-600">
//                           (Advance paid: ₹{totalAdvancePaid.toFixed(2)})
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-2xl font-bold text-green-600">₹{charges.total.toFixed(2)}</div>
//                     <div className="text-sm text-muted-foreground">
//                       {!includeServiceCharge && !includeCGST && !includeSGST && !includeIGST ? "No additional charges" :
//                         `Includes: ${includeServiceCharge ? 'Service Charge ' : ''}${includeCGST ? 'CGST ' : ''}${includeSGST ? 'SGST ' : ''}${includeIGST ? 'IGST' : ''}`}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Navigation Buttons */}
//             <div className="flex justify-between gap-2 pt-4">
//               <Button
//                 variant="outline"
//                 onClick={handlePrevStep}
//                 className="min-w-[120px]"
//               >
//                 <ChevronLeft className="mr-2 h-4 w-4" />
//                 Back
//               </Button>

//               <Button
//                 onClick={handleSubmit}
//                 disabled={
//                   isSubmitting ||
//                   (paymentMethod === 'online' && paymentStatus !== 'completed')
//                 }
//                 className="min-w-[150px] bg-green-600 hover:bg-green-700"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     {userSource === 'database' ? 'Saving to Database...' : 'Saving to Google Sheets...'}
//                   </>
//                 ) : paymentMethod === 'online' && paymentStatus !== 'completed' ? (
//                   'Complete Payment First'
//                 ) : (
//                   'Confirm Booking'
//                 )}
//               </Button>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  X,
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Check,
  Database,
  Sheet,
  Info,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Percent,
  IndianRupee,
  Tag,
  Gift,
  Hash,
  FileText,
} from 'lucide-react';
import { searchCustomersByPhone } from '@/lib/bookingApi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  formatCheckInDisplay,
  formatCheckoutDisplay,
  notifyBookingsUpdated,
} from '@/lib/bookingCheckoutUtils';
import { notifyBookingCreated } from '@/lib/appNotifications';
import { isBasicDatabaseUser } from '@/lib/planUtils';

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DiscountInfo {
  enabled: boolean;
  percentage: number;
  description: string | null;
  originalPrice: number;
  discountedPrice: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

interface BookingFormProps {
  roomId: string;
  room: any;
  preSelectedDateRange?: { from?: string; to?: string } | null;
  spreadsheetId: string;
  hotelId?: string;
  customerId?: string;
  userSource?: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'book' | 'block' | 'maintenance';
  defaultDate?: Date;
  defaultDateRange?: DateRange;
  advanceBookingData?: any;
  isAdvanceConversion?: boolean;
  conversionPaymentMethod?: 'cash' | 'online';
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmzEN8dvGOZQKM4Dok-vf59Wvjg9uf3_hn7YWhn-WTaWL8TKl5YSSyFevYx9Ovucqb/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// JSONP fetch for Google Sheets
function jsonpFetch<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const callbackName = 'cb_' + Math.random().toString(36).substring(2, 15);

    const existingScript = document.getElementById(callbackName);
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP request timeout (10 seconds)'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      delete (window as any)[callbackName];
      const script = document.getElementById(callbackName);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    (window as any)[callbackName] = (data: T) => {
      console.log('📥 JSONP Success callback:', data);
      cleanup();
      resolve(data);
    };

    const script = document.createElement('script');
    script.id = callbackName;

    script.onerror = () => {
      console.error('❌ JSONP Script load error for URL:', url);
      cleanup();
      reject(new Error('JSONP request failed to load script'));
    };

    let finalUrl = url;
    if (!url.includes('callback=')) {
      finalUrl += (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
    } else {
      finalUrl = url.replace(/(callback=)[^&]*/, `$1${callbackName}`);
    }

    script.src = finalUrl;
    document.body.appendChild(script);

    console.log('📤 JSONP Request sent:', finalUrl);
  });
}

// Convert image to Base64
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Compress image
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);

        if (compressed && compressed.length > 100) {
          resolve(compressed);
        } else {
          reject(new Error('Compression resulted in empty image'));
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    const cleanBase64 = base64Str.includes('base64,')
      ? base64Str
      : `data:image/jpeg;base64,${base64Str}`;

    img.src = cleanBase64;
  });
};

// Google Sheets specific functions
async function saveCustomerToGoogleSheets(customerData: any, spreadsheetId: string): Promise<string> {
  try {
    console.log('📤 Saving customer to Google Sheets:', customerData);

    const cleanData: any = {};
    Object.keys(customerData).forEach(key => {
      if (customerData[key] !== undefined && customerData[key] !== null) {
        cleanData[key] = customerData[key];
      }
    });

    console.log('📤 Clean customer data:', cleanData);

    let url = `${APPS_SCRIPT_URL}?action=addCustomer`;
    url += `&spreadsheetid=${encodeURIComponent(spreadsheetId)}`;
    url += `&name=${encodeURIComponent(cleanData.name || '')}`;
    url += `&phone=${encodeURIComponent(cleanData.phone || '')}`;
    url += `&email=${encodeURIComponent(cleanData.email || '')}`;
    url += `&idNumber=${encodeURIComponent(cleanData.idNumber || '')}`;
    url += `&idType=${encodeURIComponent(cleanData.idType || '')}`;

    if (cleanData.address) url += `&address=${encodeURIComponent(cleanData.address)}`;
    if (cleanData.city) url += `&city=${encodeURIComponent(cleanData.city)}`;
    if (cleanData.state) url += `&state=${encodeURIComponent(cleanData.state)}`;
    if (cleanData.pincode) url += `&pincode=${encodeURIComponent(cleanData.pincode)}`;

    url += `&_=${Date.now()}`;

    console.log('📤 Calling Google Sheets API:', url);

    const response = await jsonpFetch<any>(url);

    console.log('✅ Customer save response:', response);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.customerId || response.id || `GS-CUST-${Date.now()}`;
  } catch (error: any) {
    console.error('❌ Error saving customer to Google Sheets:', error);
    throw error;
  }
}

async function saveBookingToGoogleSheets(bookingData: any, spreadsheetId: string): Promise<any> {
  try {
    console.log('📤 Saving booking to Google Sheets:', bookingData);

    const cleanBookingData: any = {};
    Object.keys(bookingData).forEach(key => {
      if (bookingData[key] !== undefined && bookingData[key] !== null) {
        if (key === 'idImages') {
          cleanBookingData[key] = Array.isArray(bookingData[key]) && bookingData[key].length > 0
            ? bookingData[key][0]
            : '';
        } else {
          cleanBookingData[key] = bookingData[key];
        }
      }
    });

    console.log('📤 Clean booking data:', cleanBookingData);

    let url = `${APPS_SCRIPT_URL}?action=addBooking`;

    const params = [
      `spreadsheetid=${encodeURIComponent(spreadsheetId)}`,
      `roomId=${encodeURIComponent(cleanBookingData.roomId || '')}`,
      `customerName=${encodeURIComponent(cleanBookingData.customerName || '')}`,
      `customerPhone=${encodeURIComponent(cleanBookingData.customerPhone || '')}`,
      `customerEmail=${encodeURIComponent(cleanBookingData.customerEmail || '')}`,
      `fromDate=${encodeURIComponent(cleanBookingData.fromDate || '')}`,
      `fromTime=${encodeURIComponent(cleanBookingData.fromTime || '14:00')}`,
      `toDate=${encodeURIComponent(cleanBookingData.toDate || '')}`,
      `toTime=${encodeURIComponent(cleanBookingData.toTime || '12:00')}`,
      `status=${encodeURIComponent(cleanBookingData.status || 'booked')}`,
      `amount=${encodeURIComponent(cleanBookingData.amount || 0)}`,
      `service=${encodeURIComponent(cleanBookingData.serviceCharge || 0)}`,
      `cgst=${encodeURIComponent(cleanBookingData.cgst || 0)}`,
      `sgst=${encodeURIComponent(cleanBookingData.sgst || 0)}`,
      `gst=${encodeURIComponent((cleanBookingData.cgst || 0) + (cleanBookingData.sgst || 0))}`,
      `total=${encodeURIComponent(cleanBookingData.total || 0)}`,
      `guests=${encodeURIComponent(cleanBookingData.guests || 1)}`,
      `paymentMethod=${encodeURIComponent(cleanBookingData.paymentMethod || 'cash')}`,
      `paymentStatus=${encodeURIComponent(cleanBookingData.paymentStatus || 'pending')}`,
      `idType=${encodeURIComponent(cleanBookingData.idType || '')}`,
      `idNumber=${encodeURIComponent(cleanBookingData.idNumber || '')}`,
      `referralBy=${encodeURIComponent(cleanBookingData.referralBy || '')}`,
      `referralAmount=${encodeURIComponent(cleanBookingData.referralAmount || 0)}`,
      `advanceAmountPaid=${encodeURIComponent(cleanBookingData.advanceAmountPaid || 0)}`,
      `remainingAmount=${encodeURIComponent(cleanBookingData.remainingAmount || 0)}`
    ];

    url += '&' + params.join('&');
    url += `&_=${Date.now()}`;

    console.log('📤 Calling booking API:', url.substring(0, 200) + '...');

    const response = await jsonpFetch<any>(url);

    console.log('✅ Booking save response:', response);

    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  } catch (error: any) {
    console.error('❌ Error saving booking to Google Sheets:', error);
    throw error;
  }
}

async function checkGoogleSheetsOverlap(spreadsheetId: string, roomId: string, fromDate: string, toDate: string, fromTime?: string, toTime?: string): Promise<{ hasOverlap: boolean, message?: string }> {
  try {
    console.log('🔍 Checking overlaps for room:', roomId, fromDate, toDate);

    let url = `${APPS_SCRIPT_URL}?action=checkOverlap`;
    url += `&spreadsheetid=${encodeURIComponent(spreadsheetId)}`;
    url += `&roomId=${encodeURIComponent(roomId)}`;
    url += `&fromDate=${encodeURIComponent(fromDate)}`;
    url += `&toDate=${encodeURIComponent(toDate)}`;

    if (fromTime) url += `&fromTime=${encodeURIComponent(fromTime)}`;
    if (toTime) url += `&toTime=${encodeURIComponent(toTime)}`;

    url += `&_=${Date.now()}`;

    console.log('📤 Checking overlap URL:', url);

    const response = await jsonpFetch<any>(url);
    console.log('📥 Overlap check response:', response);

    if (response.error) {
      console.error('❌ Overlap check error:', response.error);
      return { hasOverlap: false };
    }

    return response;
  } catch (error) {
    console.error('❌ Error checking overlaps:', error);
    return { hasOverlap: false };
  }
}

const formatDateForFormInput = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const resolveBookingFormDates = (
  preSelected?: { from?: string; to?: string } | null,
  defaultDateRange?: DateRange,
  defaultDate?: Date
) => {
  if (preSelected?.from) {
    const to =
      preSelected.to ||
      (() => {
        const d = new Date(preSelected.from!);
        d.setDate(d.getDate() + 1);
        return formatDateForFormInput(d);
      })();
    return { from: preSelected.from, to };
  }
  if (defaultDateRange?.from) {
    const to = defaultDateRange.to
      ? formatDateForFormInput(defaultDateRange.to)
      : (() => {
          const d = new Date(defaultDateRange.from!);
          d.setDate(d.getDate() + 1);
          return formatDateForFormInput(d);
        })();
    return { from: formatDateForFormInput(defaultDateRange.from), to };
  }
  if (defaultDate) {
    const next = new Date(defaultDate);
    next.setDate(next.getDate() + 1);
    return { from: formatDateForFormInput(defaultDate), to: formatDateForFormInput(next) };
  }
  return { from: '', to: '' };
};

const formatStayLabel = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

function StayDateField({
  id,
  label,
  value,
  min,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
      } catch {
        el.focus();
      }
    } else {
      el.focus();
      el.click();
    }
  };

  const inputH = compact ? 'h-8' : 'h-10';
  const btnSz = compact ? 'h-8 w-8' : 'h-10 w-10';
  const iconSz = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const dateInput = (
    <div className="relative min-w-0 flex-1">
      <Input
        ref={inputRef}
        type="date"
        id={id}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-label={label}
        className={`${inputH} cursor-pointer pr-8 text-xs sm:text-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
        onClick={openPicker}
      />
      <button
        type="button"
        onClick={openPicker}
        className={`absolute right-0 top-0 flex ${btnSz} items-center justify-center rounded-r-md text-primary hover:bg-primary/10`}
        aria-label={`Choose ${label}`}
        tabIndex={-1}
      >
        <Calendar className={iconSz} />
      </button>
    </div>
  );

  if (compact) {
    return dateInput;
  }

  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
        {label}
      </Label>
      {dateInput}
    </div>
  );
}

export default function BookingForm({
  roomId,
  room,
  preSelectedDateRange,
  spreadsheetId,
  hotelId = "",
  customerId = "",
  userSource = 'google_sheets',
  onClose,
  onSuccess,
  mode = 'book',
  defaultDate,
  defaultDateRange,
  advanceBookingData,
  isAdvanceConversion = false
}: BookingFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userPlan = currentUser?.plan || 'basic';

  const navigate = useNavigate();

  // Form steps
  const [activeStep, setActiveStep] = useState(1);
  const [idImages, setIdImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);

  // ========== DISCOUNT STATE - Updated for Percentage and Fixed Amount ==========
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [customDiscountPercentage, setCustomDiscountPercentage] = useState(10);
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState(0);
  const [useCustomDiscount, setUseCustomDiscount] = useState(false);
  const [discountDescription, setDiscountDescription] = useState('Special Discount');
  const [originalRoomPrice, setOriginalRoomPrice] = useState(room?.price || 0);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  // ========== COLLAPSIBLE SECTIONS STATE ==========
  const [expandedSections, setExpandedSections] = useState({
    additionalDetails: false,
    priceConfiguration: true,
    priceSummary: true,
    discountSection: false
  });

  // Toggle section function
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ========== PRICE EDITING STATE VARIABLES ==========
  const [roomPriceEditable, setRoomPriceEditable] = useState(room?.price || 0);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false);
  const [includeCGST, setIncludeCGST] = useState(true);
  const [includeSGST, setIncludeSGST] = useState(true);
  const [includeIGST, setIncludeIGST] = useState(false);
  const [hotelQRCode, setHotelQRCode] = useState(null);
  const [taxType, setTaxType] = useState<'cgst_sgst' | 'igst'>('cgst_sgst');

  // Custom percentage states
  const [customServicePercentage, setCustomServicePercentage] = useState(10.00);
  const [customCgstPercentage, setCustomCgstPercentage] = useState(6.00);
  const [customSgstPercentage, setCustomSgstPercentage] = useState(6.00);
  const [customIgstPercentage, setCustomIgstPercentage] = useState(12.00);
  const [useCustomPercentages, setUseCustomPercentages] = useState(false);

  // Advance payment at booking time (regular bookings)
  const [recordAdvancePayment, setRecordAdvancePayment] = useState(false);
  const [advanceAmountPaid, setAdvanceAmountPaid] = useState(0);
  const [advancePaymentMethodAtBooking, setAdvancePaymentMethodAtBooking] = useState<'cash' | 'online'>('cash');

  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [idValidationError, setIdValidationError] = useState<string>('');

  const initialDates = resolveBookingFormDates(preSelectedDateRange, defaultDateRange, defaultDate);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    idType: 'aadhaar' as 'pan' | 'aadhaar' | 'passport' | 'driving',
    idNumber: '',
    checkInDate: initialDates.from,
    checkInTime: '',
    checkOutDate: initialDates.to,
    checkOutTime: '',
    guests: 1,
    specialRequests: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    customerGstNo: '',
    purposeOfVisit: '',
    otherExpenses: 0,
    expenseDescription: '',
    referralBy: '',
    referralAmount: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========== APPLY DISCOUNT FUNCTION - Updated for Percentage and Fixed Amount ==========
  const applyDiscount = () => {
    let newPrice = originalRoomPrice;
    let discountValue = 0;

    if (discountType === 'percentage') {
      const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
      
      if (discountPercent <= 0) {
        toast({
          title: "Invalid Discount",
          description: "Discount percentage must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      if (discountPercent > 100) {
        toast({
          title: "Invalid Discount",
          description: "Discount percentage cannot exceed 100%",
          variant: "destructive"
        });
        return;
      }

      discountValue = (originalRoomPrice * discountPercent) / 100;
      newPrice = originalRoomPrice - discountValue;
      
      toast({
        title: "🎉 Percentage Discount Applied!",
        description: `${discountPercent}% discount applied. New price: ₹${newPrice.toFixed(2)}`,
        variant: "default"
      });
    } else {
      // Fixed amount discount
      if (fixedDiscountAmount <= 0) {
        toast({
          title: "Invalid Discount",
          description: "Discount amount must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      if (fixedDiscountAmount >= originalRoomPrice) {
        toast({
          title: "Invalid Discount",
          description: "Discount amount cannot exceed room price",
          variant: "destructive"
        });
        return;
      }

      discountValue = fixedDiscountAmount;
      newPrice = originalRoomPrice - fixedDiscountAmount;
      
      toast({
        title: "🎉 Fixed Amount Discount Applied!",
        description: `₹${fixedDiscountAmount} discount applied. New price: ₹${newPrice.toFixed(2)}`,
        variant: "default"
      });
    }

    setRoomPriceEditable(newPrice);
    setDiscountApplied(true);
    setShowDiscountInput(false);
  };

  const removeDiscount = () => {
    setRoomPriceEditable(originalRoomPrice);
    setDiscountApplied(false);
    setUseCustomDiscount(false);
    setCustomDiscountPercentage(10);
    setDiscountPercentage(10);
    setFixedDiscountAmount(0);
    setDiscountType('percentage');

    toast({
      title: "Discount Removed",
      description: "Original price has been restored",
      variant: "default"
    });
  };

  const handleAdvanceBookingRedirect = () => {
    onClose();
    navigate('/advance-bookings');
  };

  // Update dates when opened from calendar / room booking with a selected range
  useEffect(() => {
    const resolved = resolveBookingFormDates(preSelectedDateRange, defaultDateRange, defaultDate);
    if (!resolved.from) return;
    setFormData((prev) => ({
      ...prev,
      checkInDate: resolved.from,
      checkOutDate: resolved.to,
    }));
  }, [preSelectedDateRange, defaultDateRange, defaultDate]);

  useEffect(() => {
    const fetchHotelQRCode = async () => {
      if (userSource === 'database' && paymentMethod === 'online') {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${NODE_BACKEND_URL}/hotels/settings`, {
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
  }, [userSource, paymentMethod]);

  useEffect(() => {
    if (activeStep === 3 && userPlan === 'basic' && !paymentMethod) {
      setPaymentMethod('cash');
    }
  }, [activeStep, paymentMethod, userPlan]);

  // Add this new useEffect
  useEffect(() => {
    // When cash is selected, automatically set payment status to completed
    if (paymentMethod === 'cash') {
      setPaymentStatus('completed');
    }
  }, [paymentMethod]);

  // Reset checkboxes when tax type changes
  useEffect(() => {
    if (taxType === 'cgst_sgst') {
      setIncludeCGST(true);
      setIncludeSGST(true);
      setIncludeIGST(false);
    } else {
      setIncludeCGST(false);
      setIncludeSGST(false);
      setIncludeIGST(true);
    }
  }, [taxType]);

  // Recalculate when dates change
  useEffect(() => {
    calculateCharges();
  }, [formData.checkInDate, formData.checkOutDate, roomPriceEditable,
    includeServiceCharge, includeCGST, includeSGST, includeIGST,
    useCustomPercentages, taxType,
    customServicePercentage, customCgstPercentage, customSgstPercentage, customIgstPercentage]);

  const fetchBackendRequest = async (
    endpoint: string,
    data: any,
    method: string = 'POST'
  ): Promise<any> => {
    const token = localStorage.getItem('authToken');

    if (!token && userSource === 'database') {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
      method: method,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  };

  // Calculate nights
  const nights = (() => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);

    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const checkInTime = formData.checkInTime || '14:00';
      const checkOutTime = formData.checkOutTime || '12:00';

      const [inHour, inMinute] = checkInTime.split(':').map(Number);
      const [outHour, outMinute] = checkOutTime.split(':').map(Number);

      const inMinutes = inHour * 60 + inMinute;
      const outMinutes = outHour * 60 + outMinute;

      if (outMinutes > inMinutes) {
        return 1;
      } else {
        return 1;
      }
    }

    return diffDays > 0 ? diffDays : 1;
  })();

  // ========== HOTEL SETTINGS STATE ==========
  const [hotelSettings, setHotelSettings] = useState<{
    gstPercentage: number;
    cgstPercentage: number;
    sgstPercentage: number;
    igstPercentage: number;
    serviceChargePercentage: number;
    qrcode_image?: string;
  }>({
    gstPercentage: 12.00,
    cgstPercentage: 6.00,
    sgstPercentage: 6.00,
    igstPercentage: 12.00,
    serviceChargePercentage: 10.00
  });

  // Fetch hotel settings
  useEffect(() => {
    const fetchHotelSettings = async () => {
      if (userSource === 'database') {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${NODE_BACKEND_URL}/hotels/settings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setHotelSettings({
                gstPercentage: data.data.gstPercentage || 12.00,
                cgstPercentage: data.data.cgstPercentage || (data.data.gstPercentage / 2) || 6.00,
                sgstPercentage: data.data.sgstPercentage || (data.data.gstPercentage / 2) || 6.00,
                igstPercentage: data.data.igstPercentage || data.data.gstPercentage || 12.00,
                serviceChargePercentage: data.data.serviceChargePercentage || 10.00,
                qrcode_image: data.data.qrcode_image
              });
              console.log('✅ Hotel tax settings loaded:', data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching hotel settings:', error);
        }
      }
    };

    fetchHotelSettings();
  }, [userSource]);

  useEffect(() => {
    if (!useCustomPercentages) {
      setCustomServicePercentage(hotelSettings.serviceChargePercentage);
      setCustomCgstPercentage(hotelSettings.cgstPercentage);
      setCustomSgstPercentage(hotelSettings.sgstPercentage);
      setCustomIgstPercentage(hotelSettings.igstPercentage);
    }
  }, [hotelSettings]);

  // ========== PRE-FILL FORM FROM ADVANCE BOOKING ==========
  useEffect(() => {
    if (advanceBookingData && isAdvanceConversion) {
      const advanceData = advanceBookingData;

      console.log('📋 Pre-filling form with advance booking data:', advanceData);

      const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        } catch (e) {
          return dateStr;
        }
      };

      const customerName = advanceData.customer_name || advanceData.customerName || '';
      const customerPhone = advanceData.customer_phone || advanceData.customerPhone || '';
      const customerEmail = advanceData.customer_email || advanceData.customerEmail || '';
      const idType = advanceData.id_type || advanceData.idType || 'aadhaar';
      const idNumber = advanceData.id_number || advanceData.idNumber || '';

      const fromDate = advanceData.from_date || advanceData.fromDate || advanceData.checkIn || '';
      const toDate = advanceData.to_date || advanceData.toDate || advanceData.checkOut || '';

      const fromTime = advanceData.from_time || advanceData.fromTime || advanceData.checkInTime || '14:00';
      const toTime = advanceData.to_time || advanceData.toTime || advanceData.checkOutTime || '12:00';

      const guests = advanceData.guests || 1;
      const specialRequests = advanceData.special_requests || advanceData.specialRequests || '';

      const address = advanceData.address || '';
      const city = advanceData.city || '';
      const state = advanceData.state || '';
      const pincode = advanceData.pincode || '';
      const customerGstNo = advanceData.customer_gst_no || advanceData.customerGstNo || '';
      const purposeOfVisit = advanceData.purpose_of_visit || advanceData.purposeOfVisit || '';

      const otherExpenses = advanceData.other_expenses || advanceData.otherExpenses || 0;
      const expenseDescription = advanceData.expense_description || advanceData.expenseDescription || '';
      const referralBy = advanceData.referral_by || advanceData.referralBy || '';
      const referralAmount = advanceData.referral_amount || advanceData.referralAmount || 0;

      setFormData({
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        idType: idType,
        idNumber: idNumber,
        checkInDate: formatDateForInput(fromDate) || defaultCheckIn,
        checkInTime: fromTime,
        checkOutDate: formatDateForInput(toDate) || defaultCheckOut,
        checkOutTime: toTime,
        guests: guests,
        specialRequests: specialRequests,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        customerGstNo: customerGstNo,
        purposeOfVisit: purposeOfVisit,
        otherExpenses: otherExpenses,
        expenseDescription: expenseDescription,
        referralBy: referralBy,
        referralAmount: referralAmount
      });

      const amount = advanceData.amount || advanceData.totalAmount || 0;
      if (amount > 0 && !discountApplied) {
        const nightsCalc = (() => {
          if (!fromDate || !toDate) return 1;
          const a = new Date(fromDate);
          const b = new Date(toDate);
          const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
          return diff > 0 ? diff : 1;
        })();

        setRoomPriceEditable(amount / nightsCalc);
        setOriginalRoomPrice(amount / nightsCalc);
      }

      const cgstVal = Number(advanceData.cgst) || 0;
      const sgstVal = Number(advanceData.sgst) || 0;
      const igstVal = Number(advanceData.igst) || 0;
      const serviceVal = Number(advanceData.service) || 0;

      if (cgstVal > 0 || sgstVal > 0) {
        setTaxType('cgst_sgst');
        setIncludeCGST(cgstVal > 0);
        setIncludeSGST(sgstVal > 0);
        setIncludeIGST(false);

        const baseForTax = (Number(advanceData.amount) || 0) + (Number(advanceData.service) || 0);
        if (baseForTax > 0) {
          setCustomCgstPercentage((cgstVal / baseForTax) * 100);
          setCustomSgstPercentage((sgstVal / baseForTax) * 100);
          setUseCustomPercentages(true);
        }
      } else if (igstVal > 0) {
        setTaxType('igst');
        setIncludeCGST(false);
        setIncludeSGST(false);
        setIncludeIGST(true);

        const baseForTax = (Number(advanceData.amount) || 0) + (Number(advanceData.service) || 0);
        if (baseForTax > 0) {
          setCustomIgstPercentage((igstVal / baseForTax) * 100);
          setUseCustomPercentages(true);
        }
      }

      if (serviceVal > 0) {
        setIncludeServiceCharge(true);
        const baseForService = Number(advanceData.amount) || 0;
        if (baseForService > 0) {
          setCustomServicePercentage((serviceVal / baseForService) * 100);
          setUseCustomPercentages(true);
        }
      }

      if (advanceData.payment_method) {
        setPaymentMethod(advanceData.payment_method as 'cash' | 'online');
      }

      if (advanceData.id_image) {
        setIdImages([advanceData.id_image]);
      }
      if (advanceData.id_image2) {
        setIdImages(prev => [...prev, advanceData.id_image2]);
      }

      toast({
        title: "📋 Advance Booking Loaded",
        description: `Form pre-filled with advance booking data. Advance paid: ₹${advanceData.advance_amount || advanceData.advanceAmount || 0}`,
        variant: "default"
      });
    }
  }, [advanceBookingData, isAdvanceConversion]);

  // ========== CALCULATE CHARGES ==========
  const calculateCharges = () => {
    const baseAmount = roomPriceEditable * nights;

    const servicePercentage = useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage;

    const serviceCharge = includeServiceCharge ?
      (baseAmount * servicePercentage) / 100 : 0;

    let cgst = 0, sgst = 0, igst = 0, totalGst = 0;
    let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;

    if (taxType === 'cgst_sgst') {
      cgstPercentage = useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage;
      sgstPercentage = useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage;

      cgst = includeCGST ? ((baseAmount + serviceCharge) * cgstPercentage) / 100 : 0;
      sgst = includeSGST ? ((baseAmount + serviceCharge) * sgstPercentage) / 100 : 0;
      totalGst = cgst + sgst;
    } else {
      igstPercentage = useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage;

      igst = includeIGST ? ((baseAmount + serviceCharge) * igstPercentage) / 100 : 0;
      totalGst = igst;
    }

    const otherExpenses = parseFloat(String(formData.otherExpenses)) || 0;
    const total = baseAmount + serviceCharge + cgst + sgst + igst + otherExpenses;

    return {
      baseAmount,
      serviceCharge,
      cgst,
      sgst,
      igst,
      totalGst,
      otherExpenses,
      total,
      roomPrice: roomPriceEditable,
      includeServiceCharge,
      includeCGST,
      includeSGST,
      includeIGST,
      taxType,
      cgstPercentage,
      sgstPercentage,
      igstPercentage,
      serviceChargePercentage: servicePercentage,
      useCustomPercentages
    };
  };

  const charges = calculateCharges();

  const getTotalAdvancePaid = (): number => {
    if (isAdvanceConversion && advanceBookingData) {
      return Number(advanceBookingData.advance_amount) || 0;
    }
    if (recordAdvancePayment && advanceAmountPaid > 0) {
      return advanceAmountPaid;
    }
    return 0;
  };

  const getBalanceDue = (): number => {
    return Math.max(0, charges.total - getTotalAdvancePaid());
  };

  const totalAdvancePaid = getTotalAdvancePaid();
  const balanceDue = getBalanceDue();

  const handleChange = (field: string, value: string | number) => {
    if (field === 'idNumber' && typeof value === 'string') {
      let maxLength = 16;

      if (formData.idType === 'aadhaar') {
        maxLength = 12;
      } else if (formData.idType === 'pan') {
        maxLength = 10;
      } else if (formData.idType === 'passport') {
        maxLength = 8;
      }

      value = value.slice(0, maxLength);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'idNumber' && typeof value === 'string') {
      if (value.trim()) {
        const validation = validateIdNumber(formData.idType, value);
        setIdValidationError(validation.isValid ? '' : validation.message);
      } else {
        setIdValidationError('');
      }
    }

    if (field === 'idType') {
      setIdValidationError('');
    }
  };

  const isReactNativeWebView = (): boolean => {
    return !!(window as any).ReactNativeWebView;
  };

  const isMobileApp = (): boolean => {
    return isReactNativeWebView() ||
      navigator.userAgent.includes('Mobile') ||
      navigator.userAgent.includes('WebView');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      if (isMobileApp()) {
        if (isReactNativeWebView()) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'UPLOAD_IMAGE_REQUEST',
            action: 'openPicker',
            accept: 'image/*',
            multiple: true
          }));
          return;
        }

        toast({
          title: "Mobile Upload",
          description: "Please use the camera or gallery buttons below",
          variant: "default"
        });
      }
      return;
    }

    setUploadingImage(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.match(/image\/(jpeg|png|jpg|webp|heic|heif)/i)) {
          toast({
            title: "Invalid file type",
            description: `Please upload image files. Detected type: ${file.type}`,
            variant: "destructive"
          });
          continue;
        }

        const maxSize = file.type.includes('heic') || file.type.includes('heif')
          ? 15 * 1024 * 1024
          : 10 * 1024 * 1024;

        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `Please upload images smaller than ${maxSize / (1024 * 1024)}MB`,
            variant: "destructive"
          });
          continue;
        }

        let base64;
        try {
          base64 = await convertToBase64(file);
        } catch (convertError) {
          console.error('Base64 conversion error:', convertError);
          const objectUrl = URL.createObjectURL(file);
          setIdImages(prev => [...prev, objectUrl]);

          toast({
            title: "Image added",
            description: "Image added (mobile preview)",
            variant: "default"
          });
          continue;
        }

        let finalImage = base64;
        try {
          const compressedImage = await compressImage(base64);
          finalImage = compressedImage;
        } catch (compressError) {
          console.warn('Compression failed, using original:', compressError);
        }

        if (finalImage && finalImage.length > 100) {
          setIdImages(prev => [...prev, finalImage]);
        } else {
          console.error('Invalid image data');
          const fallbackUrl = URL.createObjectURL(file);
          setIdImages(prev => [...prev, fallbackUrl]);
        }
      }

      toast({
        title: "Images uploaded",
        description: `${files.length} image(s) added successfully`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = idImages[index];

    if (imageToRemove && imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }

    setIdImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      idImages.forEach(image => {
        if (image && image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }
      });
    };
  }, [idImages]);

  const generateUPIQrCode = async () => {
    setIsGeneratingQR(true);
    try {
      const upiId = 'test@example';
      const merchantName = 'Hotel Management';
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const amountToPay = balanceDue > 0 ? balanceDue : charges.total;

      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amountToPay}&cu=INR&tn=${encodeURIComponent(transactionId)}`;
      setQrCodeData(upiString);

      localStorage.setItem('currentTransaction', JSON.stringify({
        id: transactionId,
        amount: amountToPay,
        roomId,
        timestamp: Date.now(),
        testMode: true
      }));

      toast({
        title: "QR Code Generated",
        description: `Scan to pay ₹${amountToPay.toFixed(2)} (Test Mode)`,
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

  const verifyPayment = async () => {
    setIsVerifyingPayment(true);

    setTimeout(() => {
      setPaymentStatus('completed');

      toast({
        title: "✅ Payment Successful (Test)",
        description: "Payment verified successfully!",
        variant: "default"
      });

      setIsVerifyingPayment(false);
    }, 2000);
  };

  const validateIdNumber = (idType: string, idNumber: string): { isValid: boolean; message: string } => {
    if (!idNumber.trim()) {
      return { isValid: true, message: '' };
    }

    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();

    switch (idType) {
      case 'aadhaar':
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(cleanId)) {
          return {
            isValid: false,
            message: 'Aadhaar number must be exactly 12 digits'
          };
        }
        break;

      case 'pan':
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(cleanId)) {
          return {
            isValid: false,
            message: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)'
          };
        }
        break;

      case 'passport':
        const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
        if (!passportRegex.test(cleanId)) {
          return {
            isValid: false,
            message: 'Passport number must be 1 letter followed by 7 digits'
          };
        }
        break;

      case 'driving':
        const drivingRegex = /^[A-Z0-9]{8,16}$/;
        if (!drivingRegex.test(cleanId)) {
          return {
            isValid: false,
            message: 'Driving license must be 8-16 alphanumeric characters'
          };
        }
        break;

      default:
        return { isValid: true, message: '' };
    }

    return { isValid: true, message: '' };
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (mode === 'book') {
          if (!formData.customerName.trim()) {
            toast({ title: 'Name required', variant: 'destructive' });
            return false;
          }
          if (!formData.customerPhone.trim() || formData.customerPhone.length < 10) {
            toast({ title: 'Valid phone number required (10 digits)', variant: 'destructive' });
            return false;
          }

          if (formData.idNumber.trim() && idValidationError) {
            toast({
              title: 'Invalid ID Number',
              description: idValidationError,
              variant: "destructive"
            });
            return false;
          }

          if (!formData.checkInDate || !formData.checkOutDate) {
            toast({ title: 'Check-in and check-out dates required', variant: 'destructive' });
            return false;
          }
        }
        return true;

      case 2:
        if (roomPriceEditable <= 0) {
          toast({ title: 'Room price must be greater than 0', variant: 'destructive' });
          return false;
        }
        if (!isAdvanceConversion && recordAdvancePayment) {
          if (advanceAmountPaid <= 0) {
            toast({
              title: 'Advance amount required',
              description: 'Enter the advance amount the client has paid',
              variant: 'destructive'
            });
            return false;
          }
          if (advanceAmountPaid > charges.total) {
            toast({
              title: 'Invalid advance amount',
              description: 'Advance amount cannot exceed the total booking amount',
              variant: 'destructive'
            });
            return false;
          }
        }
        return true;

      case 3:
        if (mode === 'book' && balanceDue <= 0) {
          if (!paymentMethod) setPaymentMethod('cash');
          setPaymentStatus('completed');
          return true;
        }

        if (mode === 'book' && !paymentMethod) {
          toast({ title: 'Payment Method Required', variant: 'destructive' });
          return false;
        }

        // For online payments, verify payment is completed
        if (paymentMethod === 'online' && paymentStatus !== 'completed') {
          toast({
            title: 'Payment Pending',
            description: 'Please complete online payment',
            variant: "destructive"
          });
          return false;
        }

        // For cash payments, automatically set status to completed
        if (paymentMethod === 'cash') {
          setPaymentStatus('completed');
        }

        return true;

      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      if (activeStep === 2 && paymentMethod === 'online' && !qrCodeData) {
        generateUPIQrCode();
      }
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmitForGoogleSheets = async () => {
    setIsSubmitting(true);

    try {
      console.log('🏨 Starting Google Sheets booking process');

      const roomIdToUse = room.roomId || roomId || `R-${room.number}`;
      console.log('🔍 Using roomId:', roomIdToUse);

      console.log('🔍 Checking date overlap...');
      const overlapCheck = await checkGoogleSheetsOverlap(
        spreadsheetId,
        roomIdToUse,
        formData.checkInDate,
        formData.checkOutDate,
        formData.checkInTime,
        formData.checkOutTime
      );

      if (overlapCheck.hasOverlap) {
        toast({
          title: "Room Already Booked",
          description: overlapCheck.message || `Room ${room.number} is already booked for the selected dates`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ No overlap found, proceeding with booking...');

      let customerId = '';
      try {
        const customerData = {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail,
          idNumber: formData.idNumber,
          idType: formData.idType,
          idImage: idImages.length > 0 ? idImages[0] : '',
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        };

        customerId = await saveCustomerToGoogleSheets(customerData, spreadsheetId);
        console.log('✅ Customer saved with ID:', customerId);
      } catch (customerError) {
        console.error('⚠️ Customer save failed, proceeding without customer ID:', customerError);
        customerId = `TEMP-CUST-${Date.now()}`;
      }

      const bookingResponse = await saveBookingToGoogleSheets({
        roomId: roomIdToUse,
        roomNumber: room.number,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        fromDate: formData.checkInDate,
        fromTime: formData.checkInTime,
        toDate: formData.checkOutDate,
        toTime: formData.checkOutTime,
        status: mode === 'book' ? 'booked' : mode,
        amount: charges.baseAmount,
        serviceCharge: includeServiceCharge ? charges.serviceCharge : 0,
        cgst: includeCGST ? charges.cgst : 0,
        sgst: includeSGST ? charges.sgst : 0,
        total: charges.total,
        guests: formData.guests,
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: paymentStatus,
        idType: formData.idType,
        idNumber: formData.idNumber,
        specialRequests: formData.specialRequests,
        idImages: idImages,
        referralBy: formData.referralBy,
        referralAmount: formData.referralAmount,
        advanceAmountPaid: totalAdvancePaid,
        remainingAmount: balanceDue,
      }, spreadsheetId);

      console.log('✅ Booking saved:', bookingResponse);

      toast({
        title: "✅ Booking Confirmed",
        description: `Room ${room.number} ${mode === 'book' ? 'booked' : mode === 'block' ? 'blocked' : 'set for maintenance'} successfully!`,
        variant: "default"
      });

      localStorage.removeItem('currentTransaction');
      onSuccess();

    } catch (error: any) {
      console.error('❌ Booking error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save booking to Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForDatabase = async () => {
    setIsSubmitting(true);
    try {
      const totalAmount = charges.total;
      const advancePaid = getTotalAdvancePaid();
      const remainingAmount = getBalanceDue();

      // Calculate discount values
      let discountPercentageApplied = 0;
      let discountAmountCalculated = 0;
      let originalTotalAmount = originalRoomPrice * nights;

      if (discountApplied) {
        if (discountType === 'percentage') {
          discountPercentageApplied = useCustomDiscount ? customDiscountPercentage : discountPercentage;
          discountAmountCalculated = (originalRoomPrice * discountPercentageApplied / 100) * nights;
        } else {
          // Fixed amount discount
          discountAmountCalculated = fixedDiscountAmount * nights;
          discountPercentageApplied = (discountAmountCalculated / originalTotalAmount) * 100;
        }
      }

      const isConversion = isAdvanceConversion && advanceBookingData;

      let endpoint = '/bookings';
      let method = 'POST';

      if (isConversion) {
        endpoint = `/advance-bookings/${advanceBookingData.id}/convert`;
        method = 'POST';
      }

      let finalPaymentStatus;
      if (paymentMethod === 'cash') {
        finalPaymentStatus = 'completed';
      } else {
        finalPaymentStatus = paymentStatus;
      }

      const payload = {
        ...(isConversion ? {} : {
          room_id: parseInt(roomId),
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail,
          from_date: formData.checkInDate,
          to_date: formData.checkOutDate,
          from_time: formData.checkInTime,
          to_time: formData.checkOutTime,
          status: mode === 'book' ? 'booked' : mode,
          amount: charges.baseAmount,
          service: includeServiceCharge ? charges.serviceCharge : 0,
          cgst: (taxType === 'cgst_sgst' && includeCGST) ? charges.cgst : 0,
          sgst: (taxType === 'cgst_sgst' && includeSGST) ? charges.sgst : 0,
          igst: (taxType === 'igst' && includeIGST) ? charges.igst : 0,
          gst: (taxType === 'cgst_sgst' ? charges.cgst + charges.sgst : charges.igst),
          total: totalAmount,
          payment_method: paymentMethod,
          payment_status: finalPaymentStatus,
          id_type: formData.idType,
          id_number: formData.idNumber,
          id_image: idImages.length > 0 ? idImages[0] : null,
          guests: formData.guests,
          special_requests: formData.specialRequests,
          referral_by: formData.referralBy,
          referral_amount: formData.referralAmount,
          address: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || '',
          customer_gst_no: formData.customerGstNo || '',
          purpose_of_visit: formData.purposeOfVisit || '',
          other_expenses: formData.otherExpenses || 0,
          expense_description: formData.expenseDescription || '',
          gst_percentage: taxType === 'cgst_sgst' ?
            (charges.cgstPercentage + charges.sgstPercentage) :
            charges.igstPercentage,
          service_charge_percentage: includeServiceCharge ? charges.serviceChargePercentage : 0,
          discount_percentage: discountPercentageApplied,
          discount_amount: discountAmountCalculated,
          original_amount: originalTotalAmount,
          discount_type: discountType,
          advance_amount_paid: advancePaid,
          remaining_amount: remainingAmount,
        }),
        advance_booking_id: advanceBookingData?.id || null,
        advance_amount_paid: advancePaid,
        remaining_amount: remainingAmount,
        conversion_payment_method: paymentMethod,
        conversion_payment_status: paymentStatus
      };

      console.log('Submitting to endpoint:', endpoint);
      console.log('Payload with discount:', payload);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Booking Confirmed",
          description: advancePaid > 0
            ? `Room ${room.number} booked! Advance paid: ₹${advancePaid.toFixed(2)}, Balance: ₹${remainingAmount.toFixed(2)}`
            : `Room ${room.number} booked successfully!`,
          variant: "default"
        });

        if (mode === 'book' && isBasicDatabaseUser()) {
          const bookingId = String(
            result.data?.bookingId || result.data?.booking_id || ''
          );
          if (bookingId) {
            notifyBookingCreated({
              bookingId,
              customerName: formData.customerName,
              roomNumber: String(room.number || room.room_number || '—'),
              checkInLabel: formatCheckInDisplay({
                rawFromDate: formData.checkInDate,
                fromTime: formData.checkInTime,
              }),
              checkOutLabel: formatCheckoutDisplay({
                rawToDate: formData.checkOutDate,
                toTime: formData.checkOutTime,
              }),
              createdAt: new Date().toISOString(),
            });
          } else {
            notifyBookingsUpdated();
          }
        } else {
          notifyBookingsUpdated();
        }

        if (isConversion) {
          window.dispatchEvent(new CustomEvent('advance-booking-converted', {
            detail: {
              advanceBookingId: advanceBookingData.id,
              bookingId: result.data?.booking_id
            }
          }));
        }

        onSuccess();
      } else {
        throw new Error(result.message || 'Booking failed');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete booking',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    if (userSource === 'database') {
      await handleSubmitForDatabase();
    } else {
      await handleSubmitForGoogleSheets();
    }
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawPhone = e.target.value;
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const limitedPhone = digitsOnly.slice(0, 10);

    setFormData({ ...formData, customerPhone: limitedPhone });

    if (limitedPhone.length === 10) {
      try {
        const customers = await searchCustomersByPhone(limitedPhone);
        setFoundCustomers(customers || []);
        setShowCustomerSearch(customers && customers.length > 0);
      } catch (error) {
        console.error('Error searching customers:', error);
        setFoundCustomers([]);
        setShowCustomerSearch(false);
      }
    } else {
      setShowCustomerSearch(false);
      setFoundCustomers([]);
      setSelectedCustomer(null);
    }
  };

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || ''
    });
    setShowCustomerSearch(false);
    setFoundCustomers([]);
  };

  const CustomTimePicker = ({
    value,
    onChange,
    label,
    defaultTime,
    compact = false,
    hideLabel = false,
    minimal = false,
  }: {
    value: string;
    onChange: (time: string) => void;
    label: string;
    defaultTime: string;
    compact?: boolean;
    hideLabel?: boolean;
    minimal?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState(() => {
      if (value) {
        const [h] = value.split(':');
        return h;
      }
      return defaultTime.split(':')[0];
    });
    const [selectedMinute, setSelectedMinute] = useState(() => {
      if (value) {
        const [, m] = value.split(':');
        return m;
      }
      return defaultTime.split(':')[1];
    });

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const handleHourChange = (hour: string) => {
      setSelectedHour(hour);
    };

    const handleMinuteChange = (minute: string) => {
      setSelectedMinute(minute);
      const newTime = `${selectedHour}:${minute}`;
      onChange(newTime);
      setIsOpen(false);
    };

    return (
      <div className={`relative shrink-0 ${minimal ? 'w-[4.5rem]' : compact ? 'min-w-[5.5rem]' : ''}`}>
        {!hideLabel && !minimal && (
          <Label
            htmlFor={`time-${label}`}
            className={
              compact
                ? 'mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground'
                : 'flex items-center gap-2'
            }
          >
            <Clock className={compact ? 'h-3.5 w-3.5 shrink-0 text-primary' : 'h-4 w-4'} />
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            id={`time-${label}`}
            value={value || defaultTime}
            onClick={() => setIsOpen(!isOpen)}
            readOnly
            className={`cursor-pointer ${
              minimal
                ? 'h-8 pl-6 pr-1 text-xs'
                : compact
                  ? 'h-8 text-sm'
                  : ''
            }`}
            placeholder={defaultTime}
            aria-label={hideLabel || minimal ? label : undefined}
          />
          {minimal && (
            <Clock className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-primary" />
          )}
          {isOpen && (
            <div
              className={`absolute z-50 mt-1 w-56 overflow-hidden rounded-lg border bg-popover p-2 shadow-lg ${
                minimal || compact ? 'right-0' : 'left-0'
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <div className="mb-1 text-center text-xs font-medium text-muted-foreground">
                    Hour
                  </div>
                  <div className={`overflow-y-auto overscroll-contain ${minimal ? 'h-32' : 'h-40'}`}>
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        className={`w-full rounded px-1 py-1 text-center text-sm hover:bg-primary hover:text-primary-foreground ${
                          selectedHour === hour ? 'bg-primary text-primary-foreground' : ''
                        }`}
                        onClick={() => handleHourChange(hour)}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="mb-1 text-center text-xs font-medium text-muted-foreground">
                    Minute
                  </div>
                  <div className={`overflow-y-auto overscroll-contain ${minimal ? 'h-32' : 'h-40'}`}>
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        className={`w-full rounded px-1 py-1 text-center text-sm hover:bg-primary hover:text-primary-foreground ${
                          selectedMinute === minute ? 'bg-primary text-primary-foreground' : ''
                        }`}
                        onClick={() => handleMinuteChange(minute)}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t pt-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Quick select</div>
                <div className="grid grid-cols-4 gap-1">
                  {(['00', '15', '30', '45'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="min-w-0 rounded bg-muted px-1 py-1 text-center text-[11px] hover:bg-muted/80"
                      onClick={() => handleMinuteChange(m)}
                    >
                      :{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {!compact && !minimal && (
          <p className="text-xs text-muted-foreground">Default: {defaultTime}</p>
        )}
      </div>
    );
  };

  const title = mode === 'book' ? 'Book Room' : mode === 'block' ? 'Block Room Dates' : 'Set Under Maintenance';

  const stepFooterClass =
    'sticky bottom-0 z-10 -mx-4 mt-4 flex gap-2 border-t border-border/80 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-4 sm:backdrop-blur-none';

  return (
    <Dialog open={true} onOpenChange={onClose} aria-describedby="booking-form-description">
      <DialogContent
        className={cn(
          'flex w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl sm:gap-4 sm:p-6',
          'fixed inset-x-0 bottom-0 top-auto h-[min(100dvh,100%)] max-h-[100dvh] translate-x-0 translate-y-0',
          'rounded-t-2xl rounded-b-none border-b-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh]',
          'sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg'
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-2 sm:px-0 sm:pt-0">
        <div id="booking-form-description" className="sr-only">
          Booking form for room {room?.number}. Please fill in customer details, upload ID proof, and complete payment to confirm your reservation.
        </div>
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
              <span className="block">{title}</span>
              <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                Room #{room?.number} · Step {activeStep} of 3
              </span>
            </DialogTitle>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdvanceBookingRedirect}
              className="h-10 w-full justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 sm:w-auto"
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="truncate">Advance booking</span>
            </Button>

            {!discountApplied ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="h-10 w-full justify-center gap-2 bg-green-600 hover:bg-green-700 sm:w-auto"
              >
                <Gift className="h-4 w-4 shrink-0" />
                Apply discount
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={removeDiscount}
                className="h-10 w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 sm:w-auto"
              >
                <X className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  Remove discount
                  {discountApplied && (
                    <span className="ml-1">
                      ({discountType === 'percentage'
                        ? `${useCustomDiscount ? customDiscountPercentage : discountPercentage}%`
                        : `₹${fixedDiscountAmount}`})
                    </span>
                  )}
                </span>
              </Button>
            )}
          </div>

          {/* Discount Input Panel - Updated for Percentage and Fixed Amount */}
          {showDiscountInput && !discountApplied && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Apply Discount</h4>
              </div>

              {/* Discount Type Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={discountType === 'percentage' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscountType('percentage')}
                  className="flex-1"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Percentage %
                </Button>
                <Button
                  type="button"
                  variant={discountType === 'fixed' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscountType('fixed')}
                  className="flex-1"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Fixed Amount ₹
                </Button>
              </div>

              {discountType === 'percentage' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <Button
                      type="button"
                      variant={!useCustomDiscount && discountPercentage === 10 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseCustomDiscount(false);
                        setDiscountPercentage(10);
                      }}
                      className="flex-1 h-10"
                    >
                      10% OFF
                    </Button>
                    <Button
                      type="button"
                      variant={!useCustomDiscount && discountPercentage === 15 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseCustomDiscount(false);
                        setDiscountPercentage(15);
                      }}
                      className="flex-1 h-10"
                    >
                      15% OFF
                    </Button>
                    <Button
                      type="button"
                      variant={!useCustomDiscount && discountPercentage === 20 ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseCustomDiscount(false);
                        setDiscountPercentage(20);
                      }}
                      className="flex-1 h-10"
                    >
                      20% OFF
                    </Button>
                    <Button
                      type="button"
                      variant={useCustomDiscount ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseCustomDiscount(true);
                        setCustomDiscountPercentage(25);
                      }}
                      className="col-span-2 flex-1 h-10 sm:col-span-1"
                    >
                      Custom
                    </Button>
                  </div>

                  {useCustomDiscount && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Label htmlFor="customDiscount" className="text-sm">
                        Discount %
                      </Label>
                      <div className="relative flex-1">
                        <Input
                          id="customDiscount"
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          value={customDiscountPercentage}
                          onChange={(e) => setCustomDiscountPercentage(parseInt(e.target.value) || 0)}
                          className="pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Label htmlFor="fixedDiscount" className="text-sm">
                      Discount (₹)
                    </Label>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="fixedDiscount"
                        type="number"
                        min="1"
                        max={originalRoomPrice - 1}
                        step="10"
                        value={fixedDiscountAmount}
                        onChange={(e) => setFixedDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="pl-7"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Max discount: ₹{originalRoomPrice - 1} (Room price: ₹{originalRoomPrice})
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscountInput(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyDiscount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Apply Discount
                </Button>
              </div>
            </div>
          )}

          {/* Discount Applied Badge - Updated */}
          {discountApplied && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-green-300 bg-green-100 p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {discountType === 'percentage' ? (
                  <Percent className="h-4 w-4 text-green-600" />
                ) : (
                  <Tag className="h-4 w-4 text-green-600" />
                )}
                <span className="text-sm font-medium text-green-800">
                  {discountType === 'percentage' 
                    ? `${useCustomDiscount ? customDiscountPercentage : discountPercentage}% Discount Applied!`
                    : `₹${fixedDiscountAmount} Discount Applied!`
                  }
                </span>
                <span className="text-xs text-green-600">
                  Original: ₹{originalRoomPrice} → Now: ₹{roomPriceEditable}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeDiscount}
                className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-4 flex items-center justify-center gap-0.5 px-1 sm:mb-6 sm:gap-3 sm:px-2">
          {[
            { number: 1, label: 'Customer Details', shortLabel: 'Guest', icon: User },
            { number: 2, label: 'Pricing', shortLabel: 'Price', icon: IndianRupee },
            { number: 3, label: 'Payment', shortLabel: 'Pay', icon: CreditCard },
          ].map((step, index, steps) => (
            <div key={step.number} className="flex flex-1 items-center justify-center gap-0.5 sm:flex-none sm:gap-3">
              <div className="flex min-w-0 flex-col items-center sm:min-w-[72px]">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10',
                    activeStep >= step.number
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {activeStep > step.number ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 max-w-[4.5rem] text-center text-[10px] leading-tight sm:mt-2 sm:max-w-none sm:text-xs',
                    activeStep >= step.number ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <span className="sm:hidden">{step.shortLabel}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mb-5 h-0.5 flex-1 max-w-[2rem] sm:mb-6 sm:w-12 sm:flex-none lg:w-16',
                    activeStep > step.number ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Customer Details */}
        {activeStep === 1 && (
          <div className="space-y-4">
            {/* Stay Schedule — mobile-friendly */}
            <div className="rounded-xl border border-border/80 bg-muted/10 px-3 py-3">
              <div className="flex flex-col gap-3 sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xs font-semibold text-foreground sm:w-[4.25rem] sm:shrink-0 sm:text-[11px]">
                    Check-in<span className="text-red-500">*</span>
                  </span>
                  <div className="flex min-w-0 flex-1 gap-2">
                    <StayDateField
                      compact
                      id="checkInDate"
                      label="Check-in date"
                      value={formData.checkInDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(v) => handleChange('checkInDate', v)}
                    />
                    <CustomTimePicker
                      minimal
                      value={formData.checkInTime}
                      onChange={(time) => handleChange('checkInTime', time)}
                      label="Check-in time"
                      defaultTime="14:00"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xs font-semibold text-foreground sm:w-[4.5rem] sm:shrink-0 sm:text-[11px]">
                    Check-out<span className="text-red-500">*</span>
                  </span>
                  <div className="flex min-w-0 flex-1 gap-2">
                    <StayDateField
                      compact
                      id="checkOutDate"
                      label="Check-out date"
                      value={formData.checkOutDate}
                      min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                      onChange={(v) => handleChange('checkOutDate', v)}
                    />
                    <CustomTimePicker
                      minimal
                      value={formData.checkOutTime}
                      onChange={(time) => handleChange('checkOutTime', time)}
                      label="Check-out time"
                      defaultTime="12:00"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-1.5 border-t border-border/50 pt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
                {formData.checkInDate && formData.checkOutDate && nights > 0 ? (
                  <>
                    <span className="font-semibold text-primary">
                      {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="mx-1.5">·</span>
                    {formatStayLabel(formData.checkInDate)} {formData.checkInTime || '14:00'}
                    <span className="mx-1">→</span>
                    {formatStayLabel(formData.checkOutDate)} {formData.checkOutTime || '12:00'}
                  </>
                ) : (
                  'Tap date or calendar icon to select stay'
                )}
              </p>
            </div>

            {/* Client Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Client Details
              </h3>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-4 grid h-11 w-full grid-cols-2 rounded-lg p-1 sm:mb-6">
                  <TabsTrigger value="basic" className="text-xs font-semibold sm:text-sm">Basic</TabsTrigger>
                  <TabsTrigger value="additional" className="text-xs font-semibold sm:text-sm">More info</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-2 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-gray-500" />
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={e => handleChange('customerName', e.target.value)}
                        placeholder="Enter full name as per ID"
                        required
                        className="h-10"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-gray-500" />
                        Mobile Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="customerPhone"
                          value={formData.customerPhone}
                          onChange={handlePhoneChange}
                          placeholder="10-digit mobile number"
                          type="tel"
                          maxLength={10}
                          required
                          className="h-10"
                        />
                      </div>
                      {showCustomerSearch && foundCustomers.length > 0 && (
                        <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto bg-white z-10 relative shadow-sm">
                          {foundCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => selectCustomer(customer)}
                              className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-4"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{customer.name}</div>
                                <div className="text-xs text-muted-foreground">{customer.phone}</div>
                              </div>
                              <Badge variant="outline" className="w-fit shrink-0 bg-green-50 text-green-700 border-green-200 text-[10px]">
                                Existing
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ID Proof Type */}
                    <div className="space-y-2">
                      <Label htmlFor="idType" className="flex items-center gap-2 text-sm font-medium">
                        <Tag className="h-4 w-4 text-gray-500" />
                        ID Type <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Select
                        value={formData.idType}
                        onValueChange={(value: any) => {
                          handleChange('idType', value);
                          setIdValidationError('');
                          if (formData.idNumber.trim()) {
                            const validation = validateIdNumber(value, formData.idNumber);
                            setIdValidationError(validation.isValid ? '' : validation.message);
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select ID type (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                          <SelectItem value="pan">PAN Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="driving">Driving License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ID Proof Number */}
                    <div className="space-y-2">
                      <Label htmlFor="idNumber" className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="h-4 w-4 text-gray-500" />
                        ID Number <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="idNumber"
                          value={formData.idNumber}
                          onChange={e => handleChange('idNumber', e.target.value)}
                          placeholder={
                            formData.idType === 'pan' ? 'ABCDE1234F' :
                              formData.idType === 'aadhaar' ? '123456789012' :
                                formData.idType === 'passport' ? 'A1234567' :
                                  'Enter ID number'
                          }
                          maxLength={
                            formData.idType === 'aadhaar' ? 12 :
                              formData.idType === 'pan' ? 10 :
                                formData.idType === 'passport' ? 8 :
                                  16
                          }
                          className={`h-10 ${idValidationError ? 'border-red-500 pr-10' : ''}`}
                        />
                        {idValidationError && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                        )}
                      </div>
                      {idValidationError ? (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {idValidationError}
                        </p>
                      ) : formData.idNumber.trim() ? (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Valid format
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.idType === 'pan' && 'Format: ABCDE1234F (5 letters + 4 digits + 1 letter)'}
                          {formData.idType === 'aadhaar' && 'Format: 12 digits (e.g., 123456789012)'}
                          {formData.idType === 'passport' && 'Format: 1 letter + 7 digits (e.g., A1234567)'}
                          {formData.idType === 'driving' && 'Format: 8-16 alphanumeric characters'}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-6 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4 text-gray-500" />
                        Email Address <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="customerEmail"
                        value={formData.customerEmail}
                        onChange={e => handleChange('customerEmail', e.target.value)}
                        placeholder="email@example.com"
                        type="email"
                        className="h-10"
                      />
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                      <Label htmlFor="guests" className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-gray-500" />
                        Number of Guests
                      </Label>
                      <Select
                        value={formData.guests.toString()}
                        onValueChange={(value) => handleChange('guests', parseInt(value))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select guests" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Person' : 'Persons'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address & GST collapsible */}
                  {userSource === 'database' && (
                    <Collapsible
                      open={expandedSections.additionalDetails}
                      onOpenChange={() => toggleSection('additionalDetails')}
                      className="border rounded-lg p-4 bg-green-50/10 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-green-800 text-sm">Address & Billing Details</h4>
                          <Badge variant="outline" className="text-xs bg-green-50/50">
                            Optional
                          </Badge>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedSections.additionalDetails ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="space-y-4 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                              id="address"
                              value={formData.address}
                              onChange={e => handleChange('address', e.target.value)}
                              placeholder="Enter full address"
                              className="min-h-[80px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="customerGstNo">Customer GST No</Label>
                            <Input
                              id="customerGstNo"
                              value={formData.customerGstNo}
                              onChange={e => handleChange('customerGstNo', e.target.value)}
                              placeholder="GSTIN (e.g., 27AAACH1234M1Z5)"
                            />
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Format: 27AAACH1234M1Z5 (15 characters)
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={e => handleChange('city', e.target.value)}
                              placeholder="City"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={e => handleChange('state', e.target.value)}
                              placeholder="State"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                              id="pincode"
                              value={formData.pincode}
                              onChange={e => handleChange('pincode', e.target.value)}
                              placeholder="6-digit pincode"
                              maxLength={6}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                          <Textarea
                            id="purposeOfVisit"
                            value={formData.purposeOfVisit}
                            onChange={e => handleChange('purposeOfVisit', e.target.value)}
                            placeholder="Purpose of visit..."
                            className="min-h-[60px]"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="otherExpenses" className="flex items-center gap-2">
                              <span>Other Expenses (₹)</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="otherExpenses"
                                type="number"
                                value={formData.otherExpenses}
                                onChange={e => handleChange('otherExpenses', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                min="0"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleChange('otherExpenses', 0)}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expenseDescription">Expense Description</Label>
                            <Input
                              id="expenseDescription"
                              value={formData.expenseDescription}
                              onChange={e => handleChange('expenseDescription', e.target.value)}
                              placeholder="Coffee, Snacks, Laundry, etc."
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Referral Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="referralBy">Referral By</Label>
                      <Input
                        id="referralBy"
                        value={formData.referralBy}
                        onChange={e => handleChange('referralBy', e.target.value)}
                        placeholder="e.g., Friend, Agent, Website"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referralAmount">Referral Amount (₹)</Label>
                      <Input
                        id="referralAmount"
                        type="number"
                        value={formData.referralAmount}
                        onChange={e => handleChange('referralAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Special Requests <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={e => handleChange('specialRequests', e.target.value)}
                      placeholder="Any special requirements, dietary restrictions, early check-in/late check-out requests..."
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* ID Proof Upload Section (Moved from Step 2, Made Optional) */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FileImage className="h-4 w-4 text-primary" />
                        ID Proof Upload <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                    </div>
                    
                    <Alert className="bg-muted/40 border-muted">
                      <FileImage className="h-4 w-4" />
                      <AlertDescription className="text-xs text-muted-foreground">
                        Please upload clear images of your {formData.idType === 'pan' ? 'PAN Card' : 'Aadhaar Card'}.
                        Upload front and back side if applicable.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-6 bg-primary/5 hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          capture="environment"
                          multiple
                          className="hidden"
                          id="file-upload-input"
                        />

                        <label
                          htmlFor="file-upload-input"
                          className="cursor-pointer flex flex-col items-center space-y-3"
                        >
                          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            {uploadingImage ? (
                              <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            ) : (
                              <Upload className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="text-center">
                            <h4 className="font-semibold text-sm mb-1">Upload ID Proof Images</h4>
                            <p className="text-xs text-muted-foreground">
                              Tap to choose from gallery or take a photo
                            </p>
                          </div>
                        </label>

                        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const cameraInput = document.createElement('input');
                              cameraInput.type = 'file';
                              cameraInput.accept = 'image/*';
                              cameraInput.capture = 'environment';
                              cameraInput.multiple = false;

                              cameraInput.onchange = (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (files && files.length > 0) {
                                  const event = {
                                    target: { files }
                                  } as React.ChangeEvent<HTMLInputElement>;
                                  handleFileUpload(event);
                                }
                              };

                              cameraInput.click();
                            }}
                            className="h-10 w-full text-xs sm:w-auto"
                          >
                            📷 Take Photo
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const galleryInput = document.createElement('input');
                              galleryInput.type = 'file';
                              galleryInput.accept = 'image/*';
                              galleryInput.multiple = true;

                              galleryInput.onchange = (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (files && files.length > 0) {
                                  const event = {
                                    target: { files }
                                  } as React.ChangeEvent<HTMLInputElement>;
                                  handleFileUpload(event);
                                }
                              };

                              galleryInput.click();
                            }}
                            className="h-10 w-full text-xs sm:w-auto"
                          >
                            🖼️ Choose from Gallery
                          </Button>
                        </div>
                      </div>

                      {idImages.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">
                              Uploaded Images ({idImages.length})
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIdImages([])}
                                disabled={idImages.length === 0}
                                className="h-7 text-xs px-2"
                              >
                                Clear All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-7 text-xs px-2"
                              >
                                Add More
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {idImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg border overflow-hidden bg-gray-100">
                                  {image.startsWith('data:image') ? (
                                    <img
                                      src={image}
                                      alt={`ID Proof ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error('Image failed to load:', image.substring(0, 100));
                                        e.currentTarget.src = '/images/placeholder.png';
                                        e.currentTarget.alt = 'Image failed to load';
                                        e.currentTarget.classList.add('bg-gray-100', 'p-4');
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FileImage className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                  onClick={() => removeImage(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  {index === 0 ? 'Front' : index === 1 ? 'Back' : `Image ${index + 1}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/20 rounded-lg p-3 space-y-1 text-xs">
                      <h5 className="font-medium text-gray-700">📋 Upload Instructions:</h5>
                      <ul className="space-y-0.5 text-muted-foreground">
                        <li>• <strong>On Mobile:</strong> Use camera or gallery options</li>
                        <li>• <strong>On Desktop:</strong> Drag & drop or click to browse</li>
                        <li>• Upload clear, well-lit images of your ID proof</li>
                        <li>• For Aadhaar: Upload both front and back sides</li>
                        <li>• For PAN: Upload the PAN card image</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className={cn(stepFooterClass, 'justify-between')}>
              <Button variant="outline" onClick={onClose} className="h-11 flex-1 sm:flex-none sm:min-w-[7rem]">
                Cancel
              </Button>
              <Button onClick={handleNextStep} disabled={isCheckingOverlap} className="h-11 flex-1 sm:flex-none sm:min-w-[9rem]">
                {isCheckingOverlap ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="truncate">Checking…</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">Next: Price</span>
                    <ChevronRight className="ml-1 h-4 w-4 shrink-0" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm">Room rate & taxes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setIncludeServiceCharge(true);
                      if (taxType === 'cgst_sgst') {
                        setIncludeCGST(true);
                        setIncludeSGST(true);
                        setIncludeIGST(false);
                      } else {
                        setIncludeCGST(false);
                        setIncludeSGST(false);
                        setIncludeIGST(true);
                      }
                      setUseCustomPercentages(false);
                      setCustomServicePercentage(hotelSettings.serviceChargePercentage);
                      setCustomCgstPercentage(hotelSettings.gstPercentage / 2);
                      setCustomSgstPercentage(hotelSettings.gstPercentage / 2);
                      setCustomIgstPercentage(hotelSettings.gstPercentage);
                    }}
                  >
                    All taxes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setIncludeServiceCharge(false);
                      setIncludeCGST(false);
                      setIncludeSGST(false);
                      setIncludeIGST(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="p-3 space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[140px]">
                    <Label htmlFor="roomPrice" className="text-xs text-muted-foreground mb-1 block">
                      Rate / night (₹)
                    </Label>
                    <Input
                      id="roomPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={roomPriceEditable}
                      onChange={(e) => !discountApplied && setRoomPriceEditable(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={cn('h-9 font-medium tabular-nums', discountApplied && 'bg-muted')}
                      disabled={discountApplied}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground pb-2 tabular-nums">
                    × {nights} {nights === 1 ? 'night' : 'nights'} ={' '}
                    <span className="font-semibold text-foreground">₹{charges.baseAmount.toFixed(2)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => !discountApplied && setRoomPriceEditable(originalRoomPrice)}
                    disabled={discountApplied}
                  >
                    Reset
                  </Button>
                </div>

                {discountApplied && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50/80 px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-green-800 font-medium">
                      {discountType === 'percentage' ? (
                        <Percent className="h-3.5 w-3.5" />
                      ) : (
                        <Tag className="h-3.5 w-3.5" />
                      )}
                      {discountType === 'percentage'
                        ? `${useCustomDiscount ? customDiscountPercentage : discountPercentage}% off`
                        : `₹${fixedDiscountAmount} off`}
                    </div>
                    <div className="flex items-center gap-2 tabular-nums text-green-700">
                      <span className="line-through text-muted-foreground">₹{originalRoomPrice.toFixed(2)}</span>
                      <span className="font-semibold">₹{roomPriceEditable.toFixed(2)}/night</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">GST</span>
                  <div className="flex flex-1 gap-1 p-0.5 rounded-lg bg-muted max-w-xs">
                    <button
                      type="button"
                      onClick={() => setTaxType('cgst_sgst')}
                      className={cn(
                        'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                        taxType === 'cgst_sgst'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      CGST + SGST
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxType('igst')}
                      className={cn(
                        'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                        taxType === 'igst'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      IGST
                    </button>
                  </div>
                </div>

                {taxType === 'cgst_sgst' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        {
                          id: 'includeCGST',
                          label: 'CGST',
                          checked: includeCGST,
                          setChecked: setIncludeCGST,
                          pct: useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage,
                          setPct: setCustomCgstPercentage,
                          reset: () => {
                            setUseCustomPercentages(false);
                            setCustomCgstPercentage(hotelSettings.cgstPercentage);
                          },
                          amount: charges.cgst,
                        },
                        {
                          id: 'includeSGST',
                          label: 'SGST',
                          checked: includeSGST,
                          setChecked: setIncludeSGST,
                          pct: useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage,
                          setPct: setCustomSgstPercentage,
                          reset: () => {
                            setUseCustomPercentages(false);
                            setCustomSgstPercentage(hotelSettings.sgstPercentage);
                          },
                          amount: charges.sgst,
                        },
                      ] as const
                    ).map((tax) => (
                      <div
                        key={tax.id}
                        className={cn(
                          'rounded-lg border px-2.5 py-2 transition-colors',
                          tax.checked ? 'border-primary/25 bg-primary/5' : 'border-border bg-muted/20'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox
                              id={tax.id}
                              checked={tax.checked}
                              onCheckedChange={(v) => tax.setChecked(!!v)}
                              className="h-4 w-4 shrink-0"
                            />
                            <Label htmlFor={tax.id} className="text-xs font-medium cursor-pointer">
                              {tax.label}
                            </Label>
                          </div>
                          {tax.checked && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={tax.pct}
                                  onChange={(e) => {
                                    setUseCustomPercentages(true);
                                    tax.setPct(parseFloat(e.target.value) || 0);
                                  }}
                                  className="h-8 w-[4.5rem] pr-6 text-sm tabular-nums text-right"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                  %
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={tax.reset}
                                title="Reset to default"
                              >
                                <span className="text-sm leading-none">↺</span>
                              </Button>
                              <span className="text-xs font-semibold text-green-700 tabular-nums whitespace-nowrap min-w-[3rem] text-right">
                                +₹{tax.amount.toFixed(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {taxType === 'igst' && (
                  <div
                    className={cn(
                      'rounded-lg border px-2.5 py-2',
                      includeIGST ? 'border-primary/25 bg-primary/5' : 'border-border bg-muted/20'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="includeIGST"
                          checked={includeIGST}
                          onCheckedChange={(v) => setIncludeIGST(!!v)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="includeIGST" className="text-xs font-medium cursor-pointer">
                          IGST
                        </Label>
                      </div>
                      {includeIGST && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage}
                              onChange={(e) => {
                                setUseCustomPercentages(true);
                                setCustomIgstPercentage(parseFloat(e.target.value) || 0);
                              }}
                              className="h-8 w-[4.5rem] pr-6 text-sm tabular-nums text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              %
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => {
                              setUseCustomPercentages(false);
                              setCustomIgstPercentage(hotelSettings.igstPercentage);
                            }}
                            title="Reset to default"
                          >
                            <span className="text-sm leading-none">↺</span>
                          </Button>
                          <span className="text-xs font-semibold text-green-700 tabular-nums whitespace-nowrap min-w-[3rem] text-right">
                            +₹{charges.igst.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========== ADVANCE PAYMENT (optional at booking) ========== */}
            {!isAdvanceConversion && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Advance payment</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-100/80">Optional</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="recordAdvancePayment" className="text-sm cursor-pointer">
                      Client paid advance?
                    </Label>
                    <input
                      type="checkbox"
                      id="recordAdvancePayment"
                      checked={recordAdvancePayment}
                      onChange={(e) => {
                        setRecordAdvancePayment(e.target.checked);
                        if (!e.target.checked) {
                          setAdvanceAmountPaid(0);
                        }
                      }}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                  </div>
                </div>

                {recordAdvancePayment && (
                  <div className="space-y-3 pt-2 border-t border-amber-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="advanceAmountPaid" className="text-xs">Amount (₹) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            id="advanceAmountPaid"
                            type="number"
                            min="0"
                            max={charges.total}
                            step="100"
                            value={advanceAmountPaid || ''}
                            onChange={(e) => setAdvanceAmountPaid(parseFloat(e.target.value) || 0)}
                            placeholder="Enter advance amount"
                            className="pl-7"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Maximum: ₹{charges.total.toFixed(2)} (full booking total)
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Method</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button
                            type="button"
                            variant={advancePaymentMethodAtBooking === 'cash' ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setAdvancePaymentMethodAtBooking('cash')}
                          >
                            <Wallet className="h-4 w-4 mr-1" />
                            Cash
                          </Button>
                          <Button
                            type="button"
                            variant={advancePaymentMethodAtBooking === 'online' ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setAdvancePaymentMethodAtBooking('online')}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Online
                          </Button>
                        </div>
                      </div>
                    </div>

                    {advanceAmountPaid > 0 && (
                      <div className="rounded-lg bg-white border border-amber-200 p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Booking Amount:</span>
                          <span className="font-medium">₹{charges.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-700">
                          <span>Advance Paid ({advancePaymentMethodAtBooking === 'cash' ? 'Cash' : 'Online'}):</span>
                          <span className="font-bold">- ₹{advanceAmountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-orange-700 font-semibold border-t pt-2">
                          <span>Balance Due at Check-in / Payment Step:</span>
                          <span>₹{balanceDue.toFixed(2)}</span>
                        </div>
                        {balanceDue <= 0 && (
                          <p className="text-xs text-green-700">
                            Full amount covered by advance — no further payment required on the Payment step.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAdvanceConversion && advanceBookingData && totalAdvancePaid > 0 && (
              <div className="border rounded-lg p-4 bg-purple-50 border-purple-200 text-sm space-y-2">
                <h4 className="font-semibold text-purple-800">Advance from Advance Booking</h4>
                <div className="flex justify-between">
                  <span className="text-purple-700">Advance already paid:</span>
                  <span className="font-bold text-green-700">₹{totalAdvancePaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Balance due:</span>
                  <span className="font-bold text-orange-700">₹{balanceDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Price summary — always visible, compact */}
            <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5 text-sm">
              <h4 className="font-semibold text-sm mb-2">Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Room Price (₹{roomPriceEditable.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'})</span>
                  <span>₹{charges.baseAmount.toFixed(2)}</span>
                </div>

                {taxType === 'cgst_sgst' && (
                  <>
                    {includeCGST && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          CGST ({charges.cgstPercentage}%)
                        </span>
                        <span>₹{charges.cgst.toFixed(2)}</span>
                      </div>
                    )}

                    {includeSGST && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          SGST ({charges.sgstPercentage}%)
                        </span>
                        <span>₹{charges.sgst.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                {taxType === 'igst' && includeIGST && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      IGST ({charges.igstPercentage}%)
                    </span>
                    <span>₹{charges.igst.toFixed(2)}</span>
                  </div>
                )}

                {formData.otherExpenses > 0 && (
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      Other Expenses
                      {formData.expenseDescription && (
                        <span className="text-xs text-muted-foreground">
                          ({formData.expenseDescription})
                        </span>
                      )}
                    </span>
                    <span className="text-blue-600 font-medium">+ ₹{formData.otherExpenses.toFixed(2)}</span>
                  </div>
                )}

                {/* Discount Section in Summary - Updated */}
                {discountApplied && (
                  <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      {discountType === 'percentage' ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                      Discount Applied:
                    </span>
                    <span className="font-bold">
                      - ₹{discountType === 'percentage' 
                        ? ((originalRoomPrice * (useCustomDiscount ? customDiscountPercentage : discountPercentage) / 100) * nights).toFixed(2)
                        : (fixedDiscountAmount * nights).toFixed(2)
                      }
                    </span>
                  </div>
                )}

                {/* Advance Payment Section */}
                {totalAdvancePaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Advance Paid:
                      </span>
                      <span className="font-bold">- ₹{totalAdvancePaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span className="flex items-center gap-1">
                        Balance Due:
                      </span>
                      <span className="font-bold">₹{balanceDue.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="border-t pt-2 mt-1">
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-green-600 tabular-nums">₹{charges.total.toFixed(2)}</span>
                  </div>
                  {(includeCGST || includeSGST || includeIGST) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {[
                        includeCGST && 'CGST',
                        includeSGST && 'SGST',
                        includeIGST && 'IGST',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={cn(stepFooterClass, 'justify-between')}>
              <Button variant="outline" onClick={handlePrevStep} className="h-11 flex-1 sm:flex-none sm:min-w-[7rem]">
                <ChevronLeft className="mr-1 h-4 w-4 shrink-0" />
                Back
              </Button>
              <Button onClick={handleNextStep} className="h-11 flex-1 sm:flex-none sm:min-w-[9rem]">
                <span className="truncate">Next: Pay</span>
                <ChevronRight className="ml-1 h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {activeStep === 3 && (
          <div className="space-y-3">
            {/* Advance Booking Info Box */}
            {isAdvanceConversion && advanceBookingData && (
              <div className="border rounded-lg p-3 bg-purple-50 border-purple-200 text-sm">
                <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Advance Payment Details
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-3">
                  <div>
                    <span className="text-purple-600">Advance Booking #:</span>
                    <span className="font-medium ml-2">{advanceBookingData.invoice_number}</span>
                  </div>
                  <div>
                    <span className="text-purple-600">Full Booking Amount:</span>
                    <span className="font-bold ml-2">₹{charges.total.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-purple-600">Advance Already Paid:</span>
                    <span className="font-bold text-green-600 ml-2">
                      - ₹{totalAdvancePaid.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-600">Payment Method:</span>
                    <span className="font-medium ml-2 capitalize">{advanceBookingData.payment_method}</span>
                  </div>
                  <div className="col-span-2 border-t border-purple-200 pt-2 mt-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-purple-800">Balance Due at Check-in:</span>
                      <span className="font-bold text-orange-600 text-lg">
                        ₹{balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isAdvanceConversion && totalAdvancePaid > 0 && (
              <div className="border rounded-lg p-3 bg-amber-50 border-amber-200 text-sm">
                <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2 text-sm">
                  <Wallet className="h-4 w-4" />
                  Advance Received at Booking
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-3">
                  <div>
                    <span className="text-amber-700">Advance Paid:</span>
                    <span className="font-bold text-green-700 ml-2">₹{totalAdvancePaid.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-amber-700">Advance Method:</span>
                    <span className="font-medium ml-2 capitalize">{advancePaymentMethodAtBooking}</span>
                  </div>
                  <div className="col-span-2 border-t border-amber-200 pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-amber-900">Balance Due:</span>
                      <span className="font-bold text-orange-600 text-lg">₹{balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {balanceDue <= 0 && totalAdvancePaid > 0 ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Full amount paid as advance.</strong> No additional payment is required. Click Confirm Booking to complete.
                </AlertDescription>
              </Alert>
            ) : (
              <>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {totalAdvancePaid > 0 ? 'Pay remaining balance' : 'Payment method'}
              </h3>
              <Badge variant="outline" className={cn('text-[10px] h-5', userPlan === 'pro' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')}>
                {userPlan === 'pro' ? 'Pro' : 'Basic'}
              </Badge>
            </div>

            {userPlan === 'pro' ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'online' ? 'default' : 'outline'}
                  className="h-auto py-2.5 px-3 flex flex-row items-center justify-start gap-2"
                  onClick={() => {
                    setPaymentMethod('online');
                    if (!qrCodeData) generateUPIQrCode();
                  }}
                  disabled={isGeneratingQR}
                >
                  {isGeneratingQR ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <QrCode className="h-4 w-4 shrink-0" />
                  )}
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium leading-tight">Online</div>
                    <div className="text-[10px] opacity-80 font-normal">UPI QR</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-auto py-2.5 px-3 flex flex-row items-center justify-start gap-2"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium leading-tight">Cash</div>
                    <div className="text-[10px] opacity-80 font-normal">At reception</div>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Basic plan: cash only. Upgrade to Pro for online payments.
                </p>
                <Button
                  type="button"
                  variant="default"
                  className="w-full h-auto py-2.5 px-3 flex flex-row items-center justify-center gap-2"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Cash at reception</span>
                </Button>
              </div>
            )}

            {paymentMethod === 'online' && userPlan === 'pro' && (
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="sm:w-2/5 space-y-2">
                      <h4 className="font-semibold text-sm text-center">Scan QR</h4>

                      <div className="bg-white p-2 rounded-lg border flex flex-col items-center">
                        {hotelQRCode ? (
                          <>
                            <img
                              src={hotelQRCode}
                              alt="Hotel UPI QR Code"
                              className="w-32 h-32 object-contain mx-auto"
                              onError={(e) => {
                                console.error('Hotel QR code failed to load');
                                e.currentTarget.src = '/images/hithlakshsolutions-com-qr.png';
                                e.currentTarget.alt = 'UPI QR Code for Payment';
                              }}
                            />
                            <div className="mt-3 text-center">
                              <div className="text-sm font-medium mb-1">
                                {totalAdvancePaid > 0
                                  ? 'Remaining Amount:'
                                  : 'Amount:'}
                                <span className="text-lg font-bold text-green-600 ml-2">
                                  ₹{totalAdvancePaid > 0
                                    ? balanceDue.toFixed(2)
                                    : charges.total.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                Scan to pay {totalAdvancePaid > 0 ? 'remaining amount' : 'to this hotel'}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src="/images/hithlakshsolutions-com-qr.png"
                              alt="UPI QR Code for Payment"
                              className="w-32 h-32 object-contain mx-auto"
                              onError={(e) => {
                                console.error('Default QR code also failed to load');
                                e.currentTarget.src = 'https://via.placeholder.com/200x200/2c3e50/ffffff?text=QR+Code';
                                e.currentTarget.alt = 'QR Code Placeholder';
                              }}
                            />
                            <div className="mt-3 text-center">
                              <div className="text-sm font-medium mb-1">
                                {totalAdvancePaid > 0
                                  ? 'Remaining Amount:'
                                  : 'Amount:'}
                                <span className="text-lg font-bold text-green-600 ml-2">
                                  ₹{totalAdvancePaid > 0
                                    ? balanceDue.toFixed(2)
                                    : charges.total.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                Scan with any UPI app or pay to: <strong>hithlakshsolutions@okhdfcbank</strong>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                UPI ID: hithlakshsolutions@okhdfcbank
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sm:flex-1 space-y-2">
                      <h4 className="font-semibold text-sm">Instructions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">1</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Scan QR Code</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Use any UPI app to scan the QR code above
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">2</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Enter Amount</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the exact amount shown: <strong>
                                ₹{totalAdvancePaid > 0
                                  ? balanceDue.toFixed(2)
                                  : charges.total.toFixed(2)}
                              </strong>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">3</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Complete Payment</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter your UPI PIN to complete the payment
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">4</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Verify Payment</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click "I have made the payment" below after payment
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Payment Status:</span>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {paymentStatus === 'completed' ? '✅ Completed' :
                              paymentStatus === 'failed' ? '❌ Failed' :
                                '🔄 Pending'}
                          </div>
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
                                Verifying Payment...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                I have made the payment
                              </>
                            )}
                          </Button>
                        ) : paymentStatus === 'completed' ? (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 font-medium">
                              ✅ Payment Verified Successfully!
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">
                              ❌ Payment Failed
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="border rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-medium">Pay at reception</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700 tabular-nums">
                    ₹{totalAdvancePaid > 0 ? balanceDue.toFixed(2) : charges.total.toFixed(2)}
                  </span>
                </div>
                {totalAdvancePaid > 0 && (
                  <p className="text-xs text-green-700">
                    Advance paid: ₹{totalAdvancePaid.toFixed(2)} · Confirmed on submit
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Booking confirms now; pay cash when guest checks in.
                </p>
              </div>
            )}

            {!paymentMethod && userPlan === 'pro' && balanceDue > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Select a payment method to continue
              </p>
            )}
            </>
            )}

            {/* Final Booking Summary */}
            <div className="border rounded-lg p-3 space-y-2 text-sm">
              <h4 className="font-semibold text-sm">Booking summary</h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1.5">
                <div className="space-y-2 sm:space-y-1.5">
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="shrink-0 text-muted-foreground">Customer:</span>
                    <span className="text-right font-medium break-words">{formData.customerName}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="shrink-0 text-muted-foreground">Contact:</span>
                    <span className="font-medium tabular-nums">{formData.customerPhone}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="shrink-0 text-muted-foreground">Rate/night:</span>
                    <span className="font-medium">
                      {discountApplied ? (
                        <div className="flex flex-col items-end">
                          <span className="line-through text-gray-400 text-xs">₹{originalRoomPrice.toFixed(2)}</span>
                          <span className="text-green-600">₹{roomPriceEditable.toFixed(2)}</span>
                        </div>
                      ) : (
                        <>₹{roomPriceEditable.toFixed(2)}</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">
                      {new Date(formData.checkInDate).toLocaleDateString()} at {formData.checkInTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">
                      {new Date(formData.checkOutDate).toLocaleDateString()} at {formData.checkOutTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Proof:</span>
                    <span className="font-medium">
                      {idImages.length} image(s) uploaded
                    </span>
                  </div>
                  {formData.referralBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Referral:</span>
                      <span className="font-medium">{formData.referralBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Base Amount (₹{roomPriceEditable.toFixed(2)} × {nights}):</span>
                  <span>₹{charges.baseAmount.toFixed(2)}</span>
                </div>

                {includeServiceCharge && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      Service Charge ({charges.serviceChargePercentage}%)
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </span>
                    <span>₹{charges.serviceCharge.toFixed(2)}</span>
                  </div>
                )}

                {includeCGST && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      CGST ({charges.cgstPercentage}%)
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </span>
                    <span>₹{charges.cgst.toFixed(2)}</span>
                  </div>
                )}

                {includeSGST && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      SGST ({charges.sgstPercentage}%)
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </span>
                    <span>₹{charges.sgst.toFixed(2)}</span>
                  </div>
                )}

                {includeIGST && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      IGST ({charges.igstPercentage}%)
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </span>
                    <span>₹{charges.igst.toFixed(2)}</span>
                  </div>
                )}

                {/* Discount Display */}
                {discountApplied && (
                  <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      {discountType === 'percentage' ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                      Discount Applied:
                    </span>
                    <span className="font-bold">
                      - ₹{discountType === 'percentage' 
                        ? ((originalRoomPrice * (useCustomDiscount ? customDiscountPercentage : discountPercentage) / 100) * nights).toFixed(2)
                        : (fixedDiscountAmount * nights).toFixed(2)
                      }
                    </span>
                  </div>
                )}

                {totalAdvancePaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Advance Paid:
                      </span>
                      <span className="font-bold">₹{totalAdvancePaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span className="flex items-center gap-1">
                        Balance Due at Check-in:
                      </span>
                      <span className="font-bold">₹{balanceDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method Summary */}
              <div className="border-t pt-2">
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="font-medium">
                    {paymentMethod === 'online' ? 'Online (QR)' : 'Cash at hotel'}
                  </span>
                </div>

                {/* Total Amount */}
                <div className="flex justify-between items-center border-t pt-2">
                  <div>
                    <div className="font-bold text-base">Total</div>
                    <div className="text-xs text-muted-foreground">
                      {paymentMethod === 'online' ? 'To be paid online' : 'To be paid at hotel'}
                      {totalAdvancePaid > 0 && (
                        <span className="block text-xs text-orange-600">
                          (Advance paid: ₹{totalAdvancePaid.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600 tabular-nums">
                      ₹{totalAdvancePaid > 0 ? balanceDue.toFixed(2) : charges.total.toFixed(2)}
                    </div>
                    {totalAdvancePaid > 0 && (
                      <div className="text-xs text-muted-foreground line-through">
                        Total: ₹{charges.total.toFixed(2)}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {totalAdvancePaid > 0
                        ? (balanceDue > 0 ? 'Remaining balance to pay' : 'Fully paid via advance')
                        : (!includeServiceCharge && !includeCGST && !includeSGST && !includeIGST ? "No additional charges" :
                          `Includes: ${includeServiceCharge ? 'Service Charge ' : ''}${includeCGST ? 'CGST ' : ''}${includeSGST ? 'SGST ' : ''}${includeIGST ? 'IGST' : ''}`)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className={cn(stepFooterClass, 'justify-between')}>
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="h-11 flex-1 sm:flex-none sm:min-w-[7rem]"
              >
                <ChevronLeft className="mr-1 h-4 w-4 shrink-0" />
                Back
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (balanceDue > 0 && paymentMethod === 'online' && paymentStatus !== 'completed')
                }
                className="h-11 flex-1 bg-green-600 hover:bg-green-700 sm:flex-none sm:min-w-[10rem]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    <span className="truncate">Saving…</span>
                  </>
                ) : balanceDue > 0 && paymentMethod === 'online' && paymentStatus !== 'completed' ? (
                  <span className="truncate text-xs sm:text-sm">Pay first</span>
                ) : (
                  <span className="truncate">Confirm booking</span>
                )}
              </Button>
            </div>
          </div>
        )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}