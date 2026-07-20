
// import { useState, useEffect } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { useToast } from '@/hooks/use-toast';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
// import { Badge } from '@/components/ui/badge';
// import {
//   Calendar,
//   User,
//   Phone,
//   Bed,
//   CalendarIcon,
//   Clock,
//   Users,
//   Loader2,
//   X,
//   Save,
//   Mail,
//   MapPin,
//   Building,
//   FileText,
//   Percent,
//   CreditCard,
//   CheckCircle,
//   ChevronDown,
//   ChevronUp,
//   Info
// } from 'lucide-react';

// interface PreviousBookingFormProps {
//   open: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   hotelId?: string;
// }

// const PreviousBookingForm = ({
//   open,
//   onClose,
//   onSuccess,
//   hotelId
// }: PreviousBookingFormProps) => {
//   const { toast } = useToast();
//   const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//   const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // ========== COLLAPSIBLE SECTIONS STATE ==========
//   const [expandedSections, setExpandedSections] = useState({
//     additionalDetails: false,
//     priceConfiguration: true,
//     priceSummary: true
//   });

//   // ========== PRICE EDITING STATE VARIABLES ==========
//   const [roomPriceEditable, setRoomPriceEditable] = useState(0);
//   const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
//   const [includeCGST, setIncludeCGST] = useState(true);
//   const [includeSGST, setIncludeSGST] = useState(true);
//   const [includeIGST, setIncludeIGST] = useState(false);
//   const [taxType, setTaxType] = useState<'cgst_sgst' | 'igst'>('cgst_sgst');

//   // Custom percentage states
//   const [customServicePercentage, setCustomServicePercentage] = useState(10.00);
//   const [customCgstPercentage, setCustomCgstPercentage] = useState(6.00);
//   const [customSgstPercentage, setCustomSgstPercentage] = useState(6.00);
//   const [customIgstPercentage, setCustomIgstPercentage] = useState(12.00);
//   const [useCustomPercentages, setUseCustomPercentages] = useState(false);

//   // ========== HOTEL SETTINGS STATE ==========
//   const [hotelSettings, setHotelSettings] = useState<{
//     gstPercentage: number;
//     cgstPercentage: number;
//     sgstPercentage: number;
//     igstPercentage: number;
//     serviceChargePercentage: number;
//   }>({
//     gstPercentage: 12.00,
//     cgstPercentage: 6.00,
//     sgstPercentage: 6.00,
//     igstPercentage: 12.00,
//     serviceChargePercentage: 10.00
//   });

//   const [formData, setFormData] = useState({
//     // Customer Information
//     customerName: '',
//     customerPhone: '',
//     customerEmail: '',
//     idNumber: '',
//     idType: 'aadhaar' as 'pan' | 'aadhaar' | 'passport' | 'driving',

//     // Address Fields
//     address: '',
//     city: '',
//     state: '',
//     pincode: '',
//     customerGstNo: '',

//     // Room Information
//     roomNumber: '',
//     guests: 1,

//     // Date Information
//     checkInDate: '',
//     checkInTime: '14:00',
//     checkOutDate: '',
//     checkOutTime: '12:00',

//     // Additional Fields
//     purposeOfVisit: '',
//     otherExpenses: 0,
//     expenseDescription: '',
//     referralBy: '',
//     referralAmount: 0
//   });

//   // Toggle section function
//   const toggleSection = (section: keyof typeof expandedSections) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   };

//   // Fetch hotel settings
//   useEffect(() => {
//     const fetchHotelSettings = async () => {
//       try {
//         const token = localStorage.getItem('authToken');
//         const response = await fetch(`${NODE_BACKEND_URL}/hotels/settings`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (response.ok) {
//           const data = await response.json();
//           if (data.success && data.data) {
//             setHotelSettings({
//               gstPercentage: data.data.gstPercentage || 12.00,
//               cgstPercentage: data.data.cgstPercentage || (data.data.gstPercentage / 2) || 6.00,
//               sgstPercentage: data.data.sgstPercentage || (data.data.gstPercentage / 2) || 6.00,
//               igstPercentage: data.data.igstPercentage || data.data.gstPercentage || 12.00,
//               serviceChargePercentage: data.data.serviceChargePercentage || 10.00
//             });
//             console.log('✅ Hotel tax settings loaded:', data.data);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching hotel settings:', error);
//       }
//     };

//     fetchHotelSettings();
//   }, [NODE_BACKEND_URL]);

//   // Update custom percentages when hotel settings change
//   useEffect(() => {
//     if (!useCustomPercentages) {
//       setCustomServicePercentage(hotelSettings.serviceChargePercentage);
//       setCustomCgstPercentage(hotelSettings.cgstPercentage);
//       setCustomSgstPercentage(hotelSettings.sgstPercentage);
//       setCustomIgstPercentage(hotelSettings.igstPercentage);
//     }
//   }, [hotelSettings, useCustomPercentages]);

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

//   // Calculate nights
//   const nights = (() => {
//     if (!formData.checkInDate || !formData.checkOutDate) return 0;

//     const checkIn = new Date(formData.checkInDate);
//     const checkOut = new Date(formData.checkOutDate);

//     checkIn.setHours(0, 0, 0, 0);
//     checkOut.setHours(0, 0, 0, 0);

//     const diffTime = checkOut.getTime() - checkIn.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     return diffDays > 0 ? diffDays : 1;
//   })();

//   // ========== CALCULATE CHARGES ==========
//   const calculateCharges = () => {
//     const baseAmount = roomPriceEditable * nights;
//     console.log('💰 DEBUG - Calculating charges:', {
//       roomPriceEditable,
//       nights,
//       baseAmount,
//       taxType,
//       includeServiceCharge,
//       includeCGST,
//       includeSGST,
//       includeIGST,
//       useCustomPercentages,
//       customServicePercentage,
//       customCgstPercentage,
//       customSgstPercentage,
//       customIgstPercentage
//     });

//     // Use custom percentages if enabled, otherwise use hotel settings
//     const servicePercentage = useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage;

//     const serviceCharge = includeServiceCharge ?
//       (baseAmount * servicePercentage) / 100 : 0;

//     // Calculate taxes based on selected tax type
//     let cgst = 0, sgst = 0, igst = 0;
//     let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;

//     if (taxType === 'cgst_sgst') {
//       cgstPercentage = useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage;
//       sgstPercentage = useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage;

//       cgst = includeCGST ? ((baseAmount + serviceCharge) * cgstPercentage) / 100 : 0;
//       sgst = includeSGST ? ((baseAmount + serviceCharge) * sgstPercentage) / 100 : 0;
//       console.log('🧮 CGST+SGST Calculation:', {
//         baseAmount,
//         serviceCharge,
//         taxableAmount: baseAmount + serviceCharge,
//         cgstPercentage,
//         sgstPercentage,
//         cgst,
//         sgst
//       });

//     } else {
//       igstPercentage = useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage;
//       igst = includeIGST ? ((baseAmount + serviceCharge) * igstPercentage) / 100 : 0;
//       console.log('🧮 IGST Calculation:', {
//         baseAmount,
//         serviceCharge,
//         taxableAmount: baseAmount + serviceCharge,
//         igstPercentage,
//         igst
//       });

//     }

//     const otherExpenses = parseFloat(String(formData.otherExpenses)) || 0;
//     const total = baseAmount + serviceCharge + cgst + sgst + igst + otherExpenses;
//     console.log('💰 FINAL CHARGES:', {
//       baseAmount,
//       serviceCharge,
//       cgst,
//       sgst,
//       igst,
//       totalGst: cgst + sgst + igst,
//       otherExpenses,
//       total,
//       roomPrice: roomPriceEditable
//     });
//     return {
//       baseAmount,
//       serviceCharge,
//       cgst,
//       sgst,
//       igst,
//       totalGst: cgst + sgst + igst,
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

//   const handleChange = (field: string, value: any) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const validateForm = () => {
//     // Basic validations
//     if (!formData.customerName.trim()) {
//       toast({ title: 'Name required', variant: 'destructive' });
//       return false;
//     }
//     if (!formData.customerPhone.trim() || formData.customerPhone.length < 10) {
//       toast({ title: 'Valid phone number required (10 digits)', variant: 'destructive' });
//       return false;
//     }
//     if (!formData.roomNumber.trim()) {
//       toast({ title: 'Room number required', variant: 'destructive' });
//       return false;
//     }
//     if (!formData.checkInDate || !formData.checkOutDate) {
//       toast({ title: 'Check-in and check-out dates required', variant: 'destructive' });
//       return false;
//     }

//     const checkIn = new Date(formData.checkInDate);
//     const checkOut = new Date(formData.checkOutDate);

//     if (checkOut <= checkIn) {
//       toast({
//         title: 'Invalid Dates',
//         description: 'Check-out date must be after check-in date',
//         variant: 'destructive'
//       });
//       return false;
//     }

//     if (charges.total <= 0) {
//       toast({
//         title: 'Invalid Amount',
//         description: 'Total amount must be greater than 0',
//         variant: 'destructive'
//       });
//       return false;
//     }

//     // GST Number validation (if provided)
//     if (formData.customerGstNo && formData.customerGstNo.trim() !== '') {
//       const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
//       if (!gstRegex.test(formData.customerGstNo.trim())) {
//         toast({
//           title: 'Invalid GST Number',
//           description: 'Please enter a valid 15-character GSTIN',
//           variant: 'destructive'
//         });
//         return false;
//       }
//     }

//     return true;
//   };

//   // const handleSubmit = async () => {
//   //   if (!validateForm()) return;

//   //   setIsSubmitting(true);

//   //   try {
//   //     const token = localStorage.getItem('authToken');

//   //     // First, get room_id from room number
//   //     const roomsResponse = await fetch(`${NODE_BACKEND_URL}/rooms`, {
//   //       headers: {
//   //         'Authorization': `Bearer ${token}`
//   //       }
//   //     });

//   //     const roomsData = await roomsResponse.json();
//   //     const room = roomsData.data?.find((r: any) =>
//   //       r.room_number?.toString() === formData.roomNumber.toString()
//   //     );

//   //     if (!room) {
//   //       toast({
//   //         title: 'Room Not Found',
//   //         description: `Room ${formData.roomNumber} does not exist`,
//   //         variant: 'destructive'
//   //       });
//   //       setIsSubmitting(false);
//   //       return;
//   //     }

//   //     // Create booking with all fields matching BookingForm structure
//   //     const bookingData = {
//   //       room_id: room.id,
//   //       customer_name: formData.customerName,
//   //       customer_phone: formData.customerPhone,
//   //       customer_email: formData.customerEmail || null,
//   //       from_date: formData.checkInDate,
//   //       to_date: formData.checkOutDate,
//   //       from_time: formData.checkInTime,
//   //       to_time: formData.checkOutTime,

//   //       // Amount fields - MATCHING BOOKINGFORM STRUCTURE
//   //       amount: charges.baseAmount,
//   //       service: charges.serviceCharge,

//   //       // Split tax fields - CRITICAL FOR DISPLAY
//   //       cgst: charges.cgst,  // ← This will be non-zero when CGST is included
//   //       sgst: charges.sgst,  // ← This will be non-zero when SGST is included
//   //       igst: charges.igst,  // ← This will be non-zero when IGST is included
//   //       gst: charges.totalGst, // Keep for backward compatibility

//   //       // Total
//   //       total: charges.total,

//   //       // Status and booking details
//   //       status: 'booked',
//   //       guests: formData.guests,
//   //       payment_method: 'cash',
//   //       payment_status: 'completed',

//   //       // Customer ID details
//   //       id_type: formData.idType,
//   //       id_number: formData.idNumber,

//   //       // Address fields
//   //       address: formData.address || null,
//   //       city: formData.city || null,
//   //       state: formData.state || null,
//   //       pincode: formData.pincode || null,
//   //       customer_gst_no: formData.customerGstNo || null,

//   //       // Additional fields
//   //       purpose_of_visit: formData.purposeOfVisit || null,
//   //       other_expenses: charges.otherExpenses || 0,
//   //       expense_description: formData.expenseDescription || null,
//   //       referral_by: formData.referralBy || null,
//   //       referral_amount: formData.referralAmount || 0,

//   //       // Tax metadata
//   //       tax_type: taxType,
//   //       include_service_charge: includeServiceCharge,
//   //       include_cgst: includeCGST,
//   //       include_sgst: includeSGST,
//   //       include_igst: includeIGST,
//   //       gst_percentage: taxType === 'cgst_sgst' ?
//   //         (charges.cgstPercentage + charges.sgstPercentage) :
//   //         charges.igstPercentage,
//   //       cgst_percentage: charges.cgstPercentage,
//   //       sgst_percentage: charges.sgstPercentage,
//   //       igst_percentage: charges.igstPercentage,
//   //       service_charge_percentage: charges.serviceChargePercentage,
//   //       use_custom_percentages: useCustomPercentages,
//   //       nights: nights,
//   //       room_price_per_night: roomPriceEditable
//   //     };

//   //     console.log('📤 Submitting previous booking with split taxes:', {
//   //       ...bookingData,
//   //       cgst: bookingData.cgst,
//   //       sgst: bookingData.sgst,
//   //       igst: bookingData.igst,
//   //       total: bookingData.total
//   //     });

//   //     // Use the /past-booking endpoint which is designed for past bookings
//   //     const response = await fetch(`${NODE_BACKEND_URL}/bookings/past-booking`, {
//   //       method: 'POST',
//   //       headers: {
//   //         'Authorization': `Bearer ${token}`,
//   //         'Content-Type': 'application/json'
//   //       },
//   //       body: JSON.stringify(bookingData)
//   //     });

//   //     const result = await response.json();

//   //     if (result.success) {
//   //       toast({
//   //         title: '✅ Previous Booking Added',
//   //         description: `Booking for ${formData.customerName} has been recorded with tax details`,
//   //         variant: 'default'
//   //       });

//   //       // Reset form to initial state
//   //       setFormData({
//   //         customerName: '',
//   //         customerPhone: '',
//   //         customerEmail: '',
//   //         idNumber: '',
//   //         idType: 'aadhaar',
//   //         address: '',
//   //         city: '',
//   //         state: '',
//   //         pincode: '',
//   //         customerGstNo: '',
//   //         roomNumber: '',
//   //         guests: 1,
//   //         checkInDate: '',
//   //         checkInTime: '14:00',
//   //         checkOutDate: '',
//   //         checkOutTime: '12:00',
//   //         purposeOfVisit: '',
//   //         otherExpenses: 0,
//   //         expenseDescription: '',
//   //         referralBy: '',
//   //         referralAmount: 0
//   //       });
//   //       setRoomPriceEditable(0);
//   //       setUseCustomPercentages(false);
//   //       setTaxType('cgst_sgst');
//   //       setIncludeServiceCharge(true);
//   //       setIncludeCGST(true);
//   //       setIncludeSGST(true);
//   //       setIncludeIGST(false);

//   //       onSuccess();
//   //       onClose();
//   //     } else {
//   //       throw new Error(result.message || 'Failed to create booking');
//   //     }
//   //   } catch (error: any) {
//   //     console.error('Error creating previous booking:', error);
//   //     toast({
//   //       title: 'Error',
//   //       description: error.message || 'Failed to create booking',
//   //       variant: 'destructive'
//   //     });
//   //   } finally {
//   //     setIsSubmitting(false);
//   //   }
//   // };


//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setIsSubmitting(true);

//     try {
//       const token = localStorage.getItem('authToken');

//       console.log('📋 FORM DATA:', {
//         customerName: formData.customerName,
//         customerPhone: formData.customerPhone,
//         roomNumber: formData.roomNumber,
//         checkInDate: formData.checkInDate,
//         checkOutDate: formData.checkOutDate,
//         nights: nights
//       });

//       console.log('💰 CHARGES FROM CALCULATION:', {
//         baseAmount: charges.baseAmount,
//         serviceCharge: charges.serviceCharge,
//         cgst: charges.cgst,
//         sgst: charges.sgst,
//         igst: charges.igst,
//         totalGst: charges.totalGst,
//         total: charges.total
//       });

//       // First, get room_id from room number
//       const roomsResponse = await fetch(`${NODE_BACKEND_URL}/rooms`, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const roomsData = await roomsResponse.json();
//       const room = roomsData.data?.find((r: any) =>
//         r.room_number?.toString() === formData.roomNumber.toString()
//       );

//       if (!room) {
//         toast({
//           title: 'Room Not Found',
//           description: `Room ${formData.roomNumber} does not exist`,
//           variant: 'destructive'
//         });
//         setIsSubmitting(false);
//         return;
//       }

//       console.log('✅ Found room:', { id: room.id, number: room.room_number });

//       // Create booking with all fields matching BookingForm structure
//       const bookingData = {
//         room_id: room.id,
//         customer_name: formData.customerName,
//         customer_phone: formData.customerPhone,
//         customer_email: formData.customerEmail || null,
//         from_date: formData.checkInDate,
//         to_date: formData.checkOutDate,
//         from_time: formData.checkInTime,
//         to_time: formData.checkOutTime,

//         // Amount fields
//         amount: charges.baseAmount,
//         service: charges.serviceCharge,

//         // Split tax fields - THESE SHOULD BE NON-ZERO
//         cgst: charges.cgst,
//         sgst: charges.sgst,
//         igst: charges.igst,
//         gst: charges.totalGst, // Keep for backward compatibility

//         // Total
//         total: charges.total,

//         // Status and booking details
//         status: 'booked',
//         guests: formData.guests,
//         payment_method: 'cash',
//         payment_status: 'completed',

//         // Customer ID details
//         id_type: formData.idType,
//         id_number: formData.idNumber,

//         // Address fields
//         address: formData.address || null,
//         city: formData.city || null,
//         state: formData.state || null,
//         pincode: formData.pincode || null,
//         customer_gst_no: formData.customerGstNo || null,

//         // Additional fields
//         purpose_of_visit: formData.purposeOfVisit || null,
//         other_expenses: charges.otherExpenses || 0,
//         expense_description: formData.expenseDescription || null,
//         referral_by: formData.referralBy || null,
//         referral_amount: formData.referralAmount || 0,

//         // Tax metadata
//         tax_type: taxType,
//         include_service_charge: includeServiceCharge,
//         include_cgst: includeCGST,
//         include_sgst: includeSGST,
//         include_igst: includeIGST,
//         gst_percentage: taxType === 'cgst_sgst' ?
//           (charges.cgstPercentage + charges.sgstPercentage) :
//           charges.igstPercentage,
//         cgst_percentage: charges.cgstPercentage,
//         sgst_percentage: charges.sgstPercentage,
//         igst_percentage: charges.igstPercentage,
//         service_charge_percentage: charges.serviceChargePercentage,
//         use_custom_percentages: useCustomPercentages,
//         nights: nights,
//         room_price_per_night: roomPriceEditable
//       };

//       console.log('📤 FINAL PAYLOAD TO SEND:', JSON.stringify(bookingData, null, 2));

//       // Specifically log tax fields
//       console.log('📊 TAX FIELDS BEING SENT:', {
//         cgst: bookingData.cgst,
//         sgst: bookingData.sgst,
//         igst: bookingData.igst,
//         gst: bookingData.gst,
//         total: bookingData.total
//       });

//       const response = await fetch(`${NODE_BACKEND_URL}/bookings/past-booking`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(bookingData)
//       });

//       const result = await response.json();
//       console.log('📥 SERVER RESPONSE:', result);

//       if (result.success) {
//         toast({
//           title: '✅ Previous Booking Added',
//           description: `Booking for ${formData.customerName} has been recorded with tax details`,
//           variant: 'default'
//         });

//         // Reset form...

//         onSuccess();
//         onClose();
//       } else {
//         throw new Error(result.message || 'Failed to create booking');
//       }
//     } catch (error: any) {
//       console.error('❌ ERROR:', error);
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to create booking',
//         variant: 'destructive'
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
//               <span>Add Previous Booking</span>
//             </div>
//             <span className="text-sm font-normal text-amber-600 sm:ml-2 sm:border-l sm:border-amber-200 sm:pl-2">
//               (For past dates - Includes tax details)
//             </span>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6">
//           {/* Customer Information */}
//           <div className="border rounded-lg p-6">
//             <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
//               <User className="h-5 w-5" />
//               Customer Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="customerName" className="flex items-center gap-1">
//                   <User className="h-4 w-4" />
//                   Full Name *
//                 </Label>
//                 <Input
//                   id="customerName"
//                   value={formData.customerName}
//                   onChange={e => handleChange('customerName', e.target.value)}
//                   placeholder="Enter full name"
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="customerPhone" className="flex items-center gap-1">
//                   <Phone className="h-4 w-4" />
//                   Phone Number *
//                 </Label>
//                 <Input
//                   id="customerPhone"
//                   value={formData.customerPhone}
//                   onChange={e => handleChange('customerPhone', e.target.value)}
//                   placeholder="10-digit mobile number"
//                   type="tel"
//                   maxLength={10}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="customerEmail" className="flex items-center gap-1">
//                   <Mail className="h-4 w-4" />
//                   Email Address
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
//                 <Label htmlFor="idType">ID Type</Label>
//                 <select
//                   id="idType"
//                   value={formData.idType}
//                   onChange={e => handleChange('idType', e.target.value as any)}
//                   className="w-full h-10 px-3 text-sm border rounded-md bg-background"
//                 >
//                   <option value="aadhaar">Aadhaar Card</option>
//                   <option value="pan">PAN Card</option>
//                   <option value="passport">Passport</option>
//                   <option value="driving">Driving License</option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="idNumber">ID Number</Label>
//                 <Input
//                   id="idNumber"
//                   value={formData.idNumber}
//                   onChange={e => handleChange('idNumber', e.target.value)}
//                   placeholder="ID number"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="customerGstNo" className="flex items-center gap-1">
//                   <FileText className="h-4 w-4" />
//                   Customer GST No
//                 </Label>
//                 <Input
//                   id="customerGstNo"
//                   value={formData.customerGstNo}
//                   onChange={e => handleChange('customerGstNo', e.target.value)}
//                   placeholder="GSTIN (e.g., 27AAACH1234M1Z5)"
//                   maxLength={15}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Address Information */}
//           <div className="border rounded-lg p-6 border-blue-100 bg-blue-50/30">
//             <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
//               <MapPin className="h-5 w-5 text-blue-600" />
//               Address Information
//             </h3>

//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="address">Full Address</Label>
//                 <Textarea
//                   id="address"
//                   value={formData.address}
//                   onChange={e => handleChange('address', e.target.value)}
//                   placeholder="Enter full address"
//                   className="min-h-[80px]"
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="city">City</Label>
//                   <Input
//                     id="city"
//                     value={formData.city}
//                     onChange={e => handleChange('city', e.target.value)}
//                     placeholder="City"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="state">State</Label>
//                   <Input
//                     id="state"
//                     value={formData.state}
//                     onChange={e => handleChange('state', e.target.value)}
//                     placeholder="State"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="pincode">Pincode</Label>
//                   <Input
//                     id="pincode"
//                     value={formData.pincode}
//                     onChange={e => handleChange('pincode', e.target.value)}
//                     placeholder="6-digit pincode"
//                     maxLength={6}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Room Information */}
//           <div className="border rounded-lg p-6">
//             <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
//               <Bed className="h-5 w-5" />
//               Room Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="roomNumber" className="flex items-center gap-1">
//                   <Building className="h-4 w-4" />
//                   Room Number *
//                 </Label>
//                 <Input
//                   id="roomNumber"
//                   value={formData.roomNumber}
//                   onChange={e => handleChange('roomNumber', e.target.value)}
//                   placeholder="e.g., 101, 202"
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="guests" className="flex items-center gap-1">
//                   <Users className="h-4 w-4" />
//                   Number of Guests
//                 </Label>
//                 <Input
//                   id="guests"
//                   type="number"
//                   min="1"
//                   max="10"
//                   value={formData.guests}
//                   onChange={e => handleChange('guests', parseInt(e.target.value) || 1)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Date Information - PAST DATES ALLOWED */}
//           <div className="border rounded-lg p-6 border-amber-200 bg-amber-50/30">
//             <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
//               <Calendar className="h-5 w-5 text-amber-600" />
//               Booking Dates (Past Dates Allowed)
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="checkInDate" className="flex items-center gap-1">
//                   <Calendar className="h-4 w-4" />
//                   Check-in Date *
//                 </Label>
//                 <Input
//                   type="date"
//                   id="checkInDate"
//                   value={formData.checkInDate}
//                   onChange={e => handleChange('checkInDate', e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="checkInTime" className="flex items-center gap-1">
//                   <Clock className="h-4 w-4" />
//                   Check-in Time
//                 </Label>
//                 <Input
//                   type="time"
//                   id="checkInTime"
//                   value={formData.checkInTime}
//                   onChange={e => handleChange('checkInTime', e.target.value)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="checkOutDate" className="flex items-center gap-1">
//                   <Calendar className="h-4 w-4" />
//                   Check-out Date *
//                 </Label>
//                 <Input
//                   type="date"
//                   id="checkOutDate"
//                   value={formData.checkOutDate}
//                   min={formData.checkInDate}
//                   onChange={e => handleChange('checkOutDate', e.target.value)}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="checkOutTime" className="flex items-center gap-1">
//                   <Clock className="h-4 w-4" />
//                   Check-out Time
//                 </Label>
//                 <Input
//                   type="time"
//                   id="checkOutTime"
//                   value={formData.checkOutTime}
//                   onChange={e => handleChange('checkOutTime', e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* ========== PRICE CONFIGURATION SECTION ========== */}
//           <Collapsible
//             open={expandedSections.priceConfiguration}
//             onOpenChange={() => toggleSection('priceConfiguration')}
//             className="border rounded-lg p-4 md:p-6 space-y-4 bg-blue-50/50"
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <h4 className="font-semibold text-lg">💰 Price Configuration</h4>
//                 <Badge variant="outline" className="text-xs bg-blue-100">
//                   Customizable
//                 </Badge>
//               </div>
//               <CollapsibleTrigger asChild>
//                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                   {expandedSections.priceConfiguration ? (
//                     <ChevronUp className="h-4 w-4" />
//                   ) : (
//                     <ChevronDown className="h-4 w-4" />
//                   )}
//                 </Button>
//               </CollapsibleTrigger>
//             </div>

//             <CollapsibleContent className="space-y-4">
//               {/* Room Price Editing */}
//               <div className="space-y-3">
//                 <div className="space-y-2">
//                   <Label htmlFor="roomPrice" className="flex items-center gap-2 text-sm">
//                     Room Price per Night (₹)
//                   </Label>
//                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
//                     <div className="flex-1">
//                       <Input
//                         id="roomPrice"
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={roomPriceEditable}
//                         onChange={(e) => setRoomPriceEditable(parseFloat(e.target.value) || 0)}
//                         placeholder="Enter room price per night"
//                         className="text-base md:text-lg font-medium w-full"
//                       />
//                     </div>
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     Base price: ₹{roomPriceEditable} × {nights} night(s) = ₹{charges.baseAmount.toFixed(2)}
//                   </p>
//                 </div>

//                 {/* Tax Type Selection */}
//                 <div className="space-y-3 border-t pt-4">
//                   <Label className="text-sm font-medium">GST Type</Label>
//                   <div className="grid grid-cols-2 gap-2">
//                     <Button
//                       type="button"
//                       variant={taxType === 'cgst_sgst' ? "default" : "outline"}
//                       onClick={() => setTaxType('cgst_sgst')}
//                       className="h-auto py-2 px-2 text-xs sm:text-sm"
//                     >
//                       <div className="text-center">
//                         <div className="font-medium">CGST+SGST</div>
//                         <div className="text-[10px] sm:text-xs opacity-90">Local</div>
//                       </div>
//                     </Button>
//                     <Button
//                       type="button"
//                       variant={taxType === 'igst' ? "default" : "outline"}
//                       onClick={() => setTaxType('igst')}
//                       className="h-auto py-2 px-2 text-xs sm:text-sm"
//                     >
//                       <div className="text-center">
//                         <div className="font-medium">IGST</div>
//                         <div className="text-[10px] sm:text-xs opacity-90">Outside</div>
//                       </div>
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Optional Charges */}
//                 <div className="space-y-3 pt-2">
//                   {/* Service Charge */}
//                   <div className="flex flex-col p-3 border rounded-lg bg-white">
//                     <div className="flex items-start gap-3">
//                       <div className="flex items-center h-5 pt-0.5">
//                         <input
//                           type="checkbox"
//                           id="includeServiceCharge"
//                           checked={includeServiceCharge}
//                           onChange={(e) => setIncludeServiceCharge(e.target.checked)}
//                           className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                         />
//                       </div>
//                       <div className="flex-1">
//                         <Label htmlFor="includeServiceCharge" className="font-medium text-sm cursor-pointer">
//                           Service Charge
//                         </Label>
//                         <p className="text-xs text-muted-foreground">
//                           Hotel service charge
//                         </p>
//                       </div>
//                     </div>

//                     {includeServiceCharge && (
//                       <div className="mt-2 ml-7 space-y-2">
//                         <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                           <div className="flex items-center gap-2 w-full xs:w-auto">
//                             <Input
//                               type="number"
//                               min="0"
//                               max="100"
//                               step="0.01"
//                               value={useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage}
//                               onChange={(e) => {
//                                 setUseCustomPercentages(true);
//                                 setCustomServicePercentage(parseFloat(e.target.value) || 0);
//                               }}
//                               className="w-20 text-sm"
//                               placeholder="%"
//                             />
//                             <span className="text-sm">%</span>
//                           </div>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => {
//                               setUseCustomPercentages(false);
//                               setCustomServicePercentage(hotelSettings.serviceChargePercentage);
//                             }}
//                             className="text-xs h-8 px-2"
//                           >
//                             Reset
//                           </Button>
//                         </div>
//                         <div className="text-xs text-green-600 font-medium">
//                           + ₹{charges.serviceCharge.toFixed(2)}
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* CGST + SGST Section */}
//                   {taxType === 'cgst_sgst' && (
//                     <>
//                       {/* CGST */}
//                       <div className="flex flex-col p-3 border rounded-lg bg-white">
//                         <div className="flex items-start gap-3">
//                           <div className="flex items-center h-5 pt-0.5">
//                             <input
//                               type="checkbox"
//                               id="includeCGST"
//                               checked={includeCGST}
//                               onChange={(e) => setIncludeCGST(e.target.checked)}
//                               className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                             />
//                           </div>
//                           <div className="flex-1">
//                             <Label htmlFor="includeCGST" className="font-medium text-sm cursor-pointer">
//                               CGST (Central)
//                             </Label>
//                             <p className="text-xs text-muted-foreground">
//                               Central GST
//                             </p>
//                           </div>
//                         </div>

//                         {includeCGST && (
//                           <div className="mt-2 ml-7 space-y-2">
//                             <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                               <div className="flex items-center gap-2 w-full xs:w-auto">
//                                 <Input
//                                   type="number"
//                                   min="0"
//                                   max="100"
//                                   step="0.01"
//                                   value={useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage}
//                                   onChange={(e) => {
//                                     setUseCustomPercentages(true);
//                                     setCustomCgstPercentage(parseFloat(e.target.value) || 0);
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
//                                   setCustomCgstPercentage(hotelSettings.cgstPercentage);
//                                 }}
//                                 className="text-xs h-8 px-2"
//                               >
//                                 Reset
//                               </Button>
//                             </div>
//                             <div className="text-xs text-green-600 font-medium">
//                               + ₹{charges.cgst.toFixed(2)}
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       {/* SGST */}
//                       <div className="flex flex-col p-3 border rounded-lg bg-white">
//                         <div className="flex items-start gap-3">
//                           <div className="flex items-center h-5 pt-0.5">
//                             <input
//                               type="checkbox"
//                               id="includeSGST"
//                               checked={includeSGST}
//                               onChange={(e) => setIncludeSGST(e.target.checked)}
//                               className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                             />
//                           </div>
//                           <div className="flex-1">
//                             <Label htmlFor="includeSGST" className="font-medium text-sm cursor-pointer">
//                               SGST (State)
//                             </Label>
//                             <p className="text-xs text-muted-foreground">
//                               State GST
//                             </p>
//                           </div>
//                         </div>

//                         {includeSGST && (
//                           <div className="mt-2 ml-7 space-y-2">
//                             <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                               <div className="flex items-center gap-2 w-full xs:w-auto">
//                                 <Input
//                                   type="number"
//                                   min="0"
//                                   max="100"
//                                   step="0.01"
//                                   value={useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage}
//                                   onChange={(e) => {
//                                     setUseCustomPercentages(true);
//                                     setCustomSgstPercentage(parseFloat(e.target.value) || 0);
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
//                                   setCustomSgstPercentage(hotelSettings.sgstPercentage);
//                                 }}
//                                 className="text-xs h-8 px-2"
//                               >
//                                 Reset
//                               </Button>
//                             </div>
//                             <div className="text-xs text-green-600 font-medium">
//                               + ₹{charges.sgst.toFixed(2)}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </>
//                   )}

//                   {/* IGST Section */}
//                   {taxType === 'igst' && (
//                     <div className="flex flex-col p-3 border rounded-lg bg-white">
//                       <div className="flex items-start gap-3">
//                         <div className="flex items-center h-5 pt-0.5">
//                           <input
//                             type="checkbox"
//                             id="includeIGST"
//                             checked={includeIGST}
//                             onChange={(e) => setIncludeIGST(e.target.checked)}
//                             className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
//                           />
//                         </div>
//                         <div className="flex-1">
//                           <Label htmlFor="includeIGST" className="font-medium text-sm cursor-pointer">
//                             IGST (Integrated)
//                           </Label>
//                           <p className="text-xs text-muted-foreground">
//                             For inter-state transactions
//                           </p>
//                         </div>
//                       </div>

//                       {includeIGST && (
//                         <div className="mt-2 ml-7 space-y-2">
//                           <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
//                             <div className="flex items-center gap-2 w-full xs:w-auto">
//                               <Input
//                                 type="number"
//                                 min="0"
//                                 max="100"
//                                 step="0.01"
//                                 value={useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage}
//                                 onChange={(e) => {
//                                   setUseCustomPercentages(true);
//                                   setCustomIgstPercentage(parseFloat(e.target.value) || 0);
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
//                                 setCustomIgstPercentage(hotelSettings.igstPercentage);
//                               }}
//                               className="text-xs h-8 px-2"
//                             >
//                               Reset
//                             </Button>
//                           </div>
//                           <div className="text-xs text-green-600 font-medium">
//                             + ₹{charges.igst.toFixed(2)}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Quick Actions */}
//                 <div className="flex flex-col xs:flex-row gap-2 pt-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setIncludeServiceCharge(true);
//                       if (taxType === 'cgst_sgst') {
//                         setIncludeCGST(true);
//                         setIncludeSGST(true);
//                         setIncludeIGST(false);
//                       } else {
//                         setIncludeCGST(false);
//                         setIncludeSGST(false);
//                         setIncludeIGST(true);
//                       }
//                       setUseCustomPercentages(false);
//                     }}
//                     className="flex-1 text-xs sm:text-sm"
//                   >
//                     Include All (Default)
//                   </Button>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setIncludeServiceCharge(false);
//                       setIncludeCGST(false);
//                       setIncludeSGST(false);
//                       setIncludeIGST(false);
//                     }}
//                     className="flex-1 text-xs sm:text-sm"
//                   >
//                     Remove All
//                   </Button>
//                 </div>
//               </div>
//             </CollapsibleContent>
//           </Collapsible>

//           {/* ========== PRICE SUMMARY ========== */}
//           <Collapsible
//             open={expandedSections.priceSummary}
//             onOpenChange={() => toggleSection('priceSummary')}
//             className="border rounded-lg p-6 space-y-3 bg-muted/50"
//           >
//             <div className="flex items-center justify-between">
//               <h4 className="font-semibold text-lg">Price Summary</h4>
//               <CollapsibleTrigger asChild>
//                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                   {expandedSections.priceSummary ? (
//                     <ChevronUp className="h-4 w-4" />
//                   ) : (
//                     <ChevronDown className="h-4 w-4" />
//                   )}
//                 </Button>
//               </CollapsibleTrigger>
//             </div>

//             <CollapsibleContent className="space-y-2">
//               <div className="flex justify-between">
//                 <span>Room Price (₹{roomPriceEditable.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'})</span>
//                 <span>₹{charges.baseAmount.toFixed(2)}</span>
//               </div>

//               {includeServiceCharge && (
//                 <div className="flex justify-between">
//                   <span className="flex items-center gap-2">
//                     Service Charge ({charges.serviceChargePercentage}%)
//                   </span>
//                   <span>₹{charges.serviceCharge.toFixed(2)}</span>
//                 </div>
//               )}

//               {/* Show CGST and SGST when taxType is cgst_sgst */}
//               {taxType === 'cgst_sgst' && (
//                 <>
//                   {includeCGST && (
//                     <div className="flex justify-between">
//                       <span className="flex items-center gap-2">
//                         CGST ({charges.cgstPercentage}%)
//                       </span>
//                       <span>₹{charges.cgst.toFixed(2)}</span>
//                     </div>
//                   )}

//                   {includeSGST && (
//                     <div className="flex justify-between">
//                       <span className="flex items-center gap-2">
//                         SGST ({charges.sgstPercentage}%)
//                       </span>
//                       <span>₹{charges.sgst.toFixed(2)}</span>
//                     </div>
//                   )}
//                 </>
//               )}

//               {/* Show IGST when taxType is igst */}
//               {taxType === 'igst' && includeIGST && (
//                 <div className="flex justify-between">
//                   <span className="flex items-center gap-2">
//                     IGST ({charges.igstPercentage}%)
//                   </span>
//                   <span>₹{charges.igst.toFixed(2)}</span>
//                 </div>
//               )}

//               {formData.otherExpenses > 0 && (
//                 <div className="flex justify-between text-sm border-t pt-2 mt-2">
//                   <span className="flex items-center gap-1">
//                     Other Expenses
//                     {formData.expenseDescription && (
//                       <span className="text-xs text-muted-foreground">
//                         ({formData.expenseDescription})
//                       </span>
//                     )}
//                   </span>
//                   <span className="text-blue-600 font-medium">+ ₹{formData.otherExpenses.toFixed(2)}</span>
//                 </div>
//               )}

//               <div className="border-t pt-2 mt-2">
//                 <div className="flex justify-between font-bold text-lg">
//                   <span>Total Amount</span>
//                   <span className="text-green-600">₹{charges.total.toFixed(2)}</span>
//                 </div>
//                 <div className="text-sm text-muted-foreground mt-1">
//                   {!includeServiceCharge && !includeCGST && !includeSGST && !includeIGST && formData.otherExpenses === 0 ? "No additional charges" :
//                     `Includes: ${includeServiceCharge ? 'Service Charge ' : ''}${includeCGST ? 'CGST ' : ''}${includeSGST ? 'SGST ' : ''}${includeIGST ? 'IGST' : ''}`}
//                 </div>
//               </div>
//             </CollapsibleContent>
//           </Collapsible>

//           {/* Additional Details */}
//           <div className="border rounded-lg p-6 border-green-100 bg-green-50/30">
//             <h3 className="font-semibold text-lg mb-4 text-green-800">
//               Additional Details
//             </h3>

//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
//                 <Textarea
//                   id="purposeOfVisit"
//                   value={formData.purposeOfVisit}
//                   onChange={e => handleChange('purposeOfVisit', e.target.value)}
//                   placeholder="Enter purpose of visit"
//                   className="min-h-[80px]"
//                   rows={2}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="otherExpenses">Other Expenses (₹)</Label>
//                   <Input
//                     id="otherExpenses"
//                     type="number"
//                     value={formData.otherExpenses}
//                     onChange={e => handleChange('otherExpenses', parseFloat(e.target.value) || 0)}
//                     placeholder="0.00"
//                     min="0"
//                     step="1"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="expenseDescription">Expense Description</Label>
//                   <Input
//                     id="expenseDescription"
//                     value={formData.expenseDescription}
//                     onChange={e => handleChange('expenseDescription', e.target.value)}
//                     placeholder="e.g., Coffee, Snacks, Laundry"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="referralBy">Referral By</Label>
//                   <Input
//                     id="referralBy"
//                     value={formData.referralBy}
//                     onChange={e => handleChange('referralBy', e.target.value)}
//                     placeholder="Referral source"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="referralAmount">Referral Amount (₹)</Label>
//                   <Input
//                     id="referralAmount"
//                     type="number"
//                     value={formData.referralAmount}
//                     onChange={e => handleChange('referralAmount', parseFloat(e.target.value) || 0)}
//                     placeholder="0.00"
//                     min="0"
//                     step="0.01"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Summary */}
//           <div className="border rounded-lg p-6 bg-gray-50">
//             <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-600">Customer:</p>
//                 <p className="font-medium">{formData.customerName || 'Not specified'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Phone:</p>
//                 <p className="font-medium">{formData.customerPhone || 'Not specified'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Room:</p>
//                 <p className="font-medium">{formData.roomNumber || 'Not specified'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Check-in:</p>
//                 <p className="font-medium">
//                   {formData.checkInDate} at {formData.checkInTime}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Check-out:</p>
//                 <p className="font-medium">
//                   {formData.checkOutDate} at {formData.checkOutTime}
//                 </p>
//               </div>
//               <div className="md:col-span-2">
//                 <p className="text-sm text-gray-600">Tax Breakdown:</p>
//                 <div className="grid grid-cols-3 gap-2 mt-1">
//                   {taxType === 'cgst_sgst' ? (
//                     <>
//                       <div className="text-sm">
//                         <span className="text-gray-500">CGST:</span>
//                         <span className="font-medium ml-1 text-blue-600">₹{charges.cgst.toFixed(2)}</span>
//                       </div>
//                       <div className="text-sm">
//                         <span className="text-gray-500">SGST:</span>
//                         <span className="font-medium ml-1 text-blue-600">₹{charges.sgst.toFixed(2)}</span>
//                       </div>
//                     </>
//                   ) : (
//                     <div className="text-sm col-span-2">
//                       <span className="text-gray-500">IGST:</span>
//                       <span className="font-medium ml-1 text-purple-600">₹{charges.igst.toFixed(2)}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <div className="md:col-span-2">
//                 <p className="text-sm text-gray-600">Total Amount:</p>
//                 <p className="font-bold text-2xl text-green-600">₹{charges.total.toFixed(2)}</p>
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-between gap-2 pt-4">
//             <Button
//               variant="outline"
//               onClick={onClose}
//               disabled={isSubmitting}
//               className="min-w-[120px]"
//             >
//               <X className="h-4 w-4 mr-2" />
//               Cancel
//             </Button>

//             <Button
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//               className="bg-amber-600 hover:bg-amber-700 min-w-[200px]"
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Creating Booking...
//                 </>
//               ) : (
//                 <>
//                   <Save className="h-4 w-4 mr-2" />
//                   Create Previous Booking
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default PreviousBookingForm;

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  formatCheckInDisplay,
  formatCheckoutDisplay,
  notifyBookingsUpdated,
} from '@/lib/bookingCheckoutUtils';
import { notifyBookingCreated } from '@/lib/appNotifications';
import { isBasicDatabaseUser } from '@/lib/planUtils';
import { UpiAppSelector } from '@/components/UpiAppSelector';
import { type UpiPaymentAppId } from '@/lib/upiPaymentApps';
import {
  Calendar,
  User,
  Phone,
  Bed,
  CalendarIcon,
  Clock,
  Users,
  Loader2,
  X,
  Save,
  Mail,
  MapPin,
  Building,
  FileText,
  Percent,
  CreditCard,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
  FileImage,
  AlertCircle,
  QrCode,
  Wallet,
} from 'lucide-react';

interface PreviousBookingFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hotelId?: string;
}

const PreviousBookingForm = ({
  open,
  onClose,
  onSuccess,
  hotelId
}: PreviousBookingFormProps) => {
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userPlan = currentUser?.plan;
  const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectAtCheckout, setCollectAtCheckout] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending'>('pending');
  const [transactionId, setTransactionId] = useState('');
  const [onlinePaymentApp, setOnlinePaymentApp] = useState<UpiPaymentAppId | ''>('');
  const [hotelQRCode, setHotelQRCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ID Images State
  const [idImages, setIdImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [idValidationError, setIdValidationError] = useState('');

  // ========== COLLAPSIBLE SECTIONS STATE ==========
  const [expandedSections, setExpandedSections] = useState({
    additionalDetails: false,
    priceConfiguration: false,
    priceSummary: true,
    idProofUpload: false,
    addressDetails: false,
  });

  // ========== PRICE EDITING STATE VARIABLES ==========
  const [roomPriceEditable, setRoomPriceEditable] = useState(0);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
  const [includeCGST, setIncludeCGST] = useState(true);
  const [includeSGST, setIncludeSGST] = useState(true);
  const [includeIGST, setIncludeIGST] = useState(false);
  const [taxType, setTaxType] = useState<'cgst_sgst' | 'igst'>('cgst_sgst');

  // Custom percentage states
  const [customServicePercentage, setCustomServicePercentage] = useState(10.00);
  const [customCgstPercentage, setCustomCgstPercentage] = useState(6.00);
  const [customSgstPercentage, setCustomSgstPercentage] = useState(6.00);
  const [customIgstPercentage, setCustomIgstPercentage] = useState(12.00);
  const [useCustomPercentages, setUseCustomPercentages] = useState(false);

  // ========== HOTEL SETTINGS STATE ==========
  const [hotelSettings, setHotelSettings] = useState<{
    gstPercentage: number;
    cgstPercentage: number;
    sgstPercentage: number;
    igstPercentage: number;
    serviceChargePercentage: number;
  }>({
    gstPercentage: 12.00,
    cgstPercentage: 6.00,
    sgstPercentage: 6.00,
    igstPercentage: 12.00,
    serviceChargePercentage: 10.00
  });

  const [formData, setFormData] = useState({
    // Customer Information
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    idNumber: '',
    idType: 'aadhaar' as 'pan' | 'aadhaar' | 'passport' | 'driving',

    // Address Fields
    address: '',
    city: '',
    state: '',
    pincode: '',
    customerGstNo: '',

    // Room Information
    roomNumber: '',
    guests: 1,

    // Date Information
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '12:00',

    // Additional Fields
    purposeOfVisit: '',
    otherExpenses: 0,
    expenseDescription: '',
    referralBy: '',
    referralAmount: 0
  });

  // ========== IMAGE UPLOAD HELPER FUNCTIONS ==========
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.match(/image\/(jpeg|png|jpg|webp)/i)) {
          toast({
            title: "Invalid file type",
            description: `Please upload image files.`,
            variant: "destructive"
          });
          continue;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `Please upload images smaller than 10MB`,
            variant: "destructive"
          });
          continue;
        }

        let base64 = await convertToBase64(file);
        let finalImage = base64;

        try {
          const compressedImage = await compressImage(base64);
          finalImage = compressedImage;
        } catch (compressError) {
          console.warn('Compression failed, using original:', compressError);
        }

        if (finalImage && finalImage.length > 100) {
          setIdImages(prev => [...prev, finalImage]);
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
    setIdImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validate ID number based on type
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

  // Toggle section function
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch hotel settings
  useEffect(() => {
    const fetchHotelSettings = async () => {
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
              serviceChargePercentage: data.data.serviceChargePercentage || 10.00
            });
            if (data.data.qrcode_image) {
              setHotelQRCode(data.data.qrcode_image);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching hotel settings:', error);
      }
    };

    if (open) {
      fetchHotelSettings();
    }
  }, [NODE_BACKEND_URL, open]);

  useEffect(() => {
    if (userPlan === 'basic') {
      setPaymentMethod('cash');
    }
  }, [userPlan, open]);

  useEffect(() => {
    if (collectAtCheckout) {
      setPaymentStatus('pending');
      return;
    }
    if (paymentMethod === 'cash') {
      setPaymentStatus('completed');
    }
  }, [paymentMethod, collectAtCheckout]);

  // Update custom percentages when hotel settings change
  useEffect(() => {
    if (!useCustomPercentages) {
      setCustomServicePercentage(hotelSettings.serviceChargePercentage);
      setCustomCgstPercentage(hotelSettings.cgstPercentage);
      setCustomSgstPercentage(hotelSettings.sgstPercentage);
      setCustomIgstPercentage(hotelSettings.igstPercentage);
    }
  }, [hotelSettings, useCustomPercentages]);

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

  // Calculate nights
  const nights = (() => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);

    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 1;
  })();

  // ========== CALCULATE CHARGES ==========
  const calculateCharges = () => {
    const baseAmount = roomPriceEditable * nights;
    
    const servicePercentage = useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage;
    const serviceCharge = includeServiceCharge ? (baseAmount * servicePercentage) / 100 : 0;

    let cgst = 0, sgst = 0, igst = 0;
    let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;

    if (taxType === 'cgst_sgst') {
      cgstPercentage = useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage;
      sgstPercentage = useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage;

      cgst = includeCGST ? ((baseAmount + serviceCharge) * cgstPercentage) / 100 : 0;
      sgst = includeSGST ? ((baseAmount + serviceCharge) * sgstPercentage) / 100 : 0;
    } else {
      igstPercentage = useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage;
      igst = includeIGST ? ((baseAmount + serviceCharge) * igstPercentage) / 100 : 0;
    }

    const otherExpenses = parseFloat(String(formData.otherExpenses)) || 0;
    const total = baseAmount + serviceCharge + cgst + sgst + igst + otherExpenses;

    return {
      baseAmount,
      serviceCharge,
      cgst,
      sgst,
      igst,
      totalGst: cgst + sgst + igst,
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

  const generateUPIQrCode = async () => {
    setIsGeneratingQR(true);
    try {
      const amountToPay = charges.total;
      const txnId = transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const upiString = `upi://pay?pa=test@example&pn=${encodeURIComponent('Hotel Management')}&am=${amountToPay}&cu=INR&tn=${encodeURIComponent(txnId)}`;
      setQrCodeData(upiString);
      if (!transactionId) {
        setTransactionId(txnId);
      }
      toast({
        title: 'QR Code ready',
        description: `Scan to pay ₹${amountToPay.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
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
        title: 'Payment verified',
        description: 'Online payment marked as received.',
      });
      setIsVerifyingPayment(false);
    }, 1500);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'idNumber') {
      const validation = validateIdNumber(formData.idType, value);
      setIdValidationError(validation.isValid ? '' : validation.message);
    }

    if (field === 'idType') {
      setIdValidationError('');
      if (formData.idNumber.trim()) {
        const validation = validateIdNumber(value, formData.idNumber);
        setIdValidationError(validation.isValid ? '' : validation.message);
      }
    }
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return false;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.length < 10) {
      toast({ title: 'Valid phone number required (10 digits)', variant: 'destructive' });
      return false;
    }
    if (!formData.roomNumber.trim()) {
      toast({ title: 'Room number required', variant: 'destructive' });
      return false;
    }
    if (!formData.checkInDate || !formData.checkOutDate) {
      toast({ title: 'Check-in and check-out dates required', variant: 'destructive' });
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

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);

    if (checkOut <= checkIn) {
      toast({
        title: 'Invalid Dates',
        description: 'Check-out date must be after check-in date',
        variant: 'destructive'
      });
      return false;
    }

    if (charges.total <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Total amount must be greater than 0',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.customerGstNo && formData.customerGstNo.trim() !== '') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(formData.customerGstNo.trim())) {
        toast({
          title: 'Invalid GST Number',
          description: 'Please enter a valid 15-character GSTIN',
          variant: 'destructive'
        });
        return false;
      }
    }

    if (!collectAtCheckout && paymentMethod === 'online' && paymentStatus !== 'completed') {
      toast({
        title: 'Verify online payment',
        description: 'Scan the QR code and click "I have made the payment" before submitting.',
        variant: 'destructive',
      });
      return false;
    }

    if (!collectAtCheckout && paymentMethod === 'online' && !onlinePaymentApp) {
      toast({
        title: 'Select UPI app',
        description: 'Choose which online app was used for payment',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');

      // First, get room_id from room number
      const roomsResponse = await fetch(`${NODE_BACKEND_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const roomsData = await roomsResponse.json();
      const room = roomsData.data?.find((r: any) =>
        r.room_number?.toString() === formData.roomNumber.toString()
      );

      if (!room) {
        toast({
          title: 'Room Not Found',
          description: `Room ${formData.roomNumber} does not exist`,
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Create booking with all fields including ID images
      const bookingData = {
        room_id: room.id,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail || null,
        from_date: formData.checkInDate,
        to_date: formData.checkOutDate,
        from_time: formData.checkInTime,
        to_time: formData.checkOutTime,

        // Amount fields
        amount: charges.baseAmount,
        service: charges.serviceCharge,

        // Split tax fields
        cgst: charges.cgst,
        sgst: charges.sgst,
        igst: charges.igst,
        gst: charges.totalGst,

        // Total
        total: charges.total,

        // Status and booking details
        status: 'booked',
        guests: formData.guests,
        payment_method: collectAtCheckout ? 'cash' : paymentMethod,
        payment_status: collectAtCheckout ? 'pending' : paymentStatus,
        transaction_id: collectAtCheckout ? null : (transactionId || null),
        online_payment_app:
          !collectAtCheckout && paymentMethod === 'online' ? onlinePaymentApp || null : null,
        advance_amount_paid: collectAtCheckout ? 0 : charges.total,
        remaining_amount: collectAtCheckout ? charges.total : 0,

        // Customer ID details
        id_type: formData.idType,
        id_number: formData.idNumber,
        
        // ========== ID IMAGES ==========
        id_image: idImages.length > 0 ? idImages[0] : null,
        id_image2: idImages.length > 1 ? idImages[1] : null,

        // Address fields
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        customer_gst_no: formData.customerGstNo || null,

        // Additional fields
        purpose_of_visit: formData.purposeOfVisit || null,
        other_expenses: charges.otherExpenses || 0,
        expense_description: formData.expenseDescription || null,
        referral_by: formData.referralBy || null,
        referral_amount: formData.referralAmount || 0,

        // Tax metadata
        tax_type: taxType,
        include_service_charge: includeServiceCharge,
        include_cgst: includeCGST,
        include_sgst: includeSGST,
        include_igst: includeIGST,
        gst_percentage: taxType === 'cgst_sgst' ?
          (charges.cgstPercentage + charges.sgstPercentage) :
          charges.igstPercentage,
        cgst_percentage: charges.cgstPercentage,
        sgst_percentage: charges.sgstPercentage,
        igst_percentage: charges.igstPercentage,
        service_charge_percentage: charges.serviceChargePercentage,
        use_custom_percentages: useCustomPercentages,
        nights: nights,
        room_price_per_night: roomPriceEditable
      };

      const response = await fetch(`${NODE_BACKEND_URL}/bookings/past-booking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Previous Booking Added',
          description: `Booking for ${formData.customerName} has been recorded${idImages.length > 0 ? ' with ID proof' : ''}`,
          variant: 'default'
        });

        if (isBasicDatabaseUser()) {
          const bookingId = String(result.data?.bookingId || '');
          if (bookingId) {
            notifyBookingCreated({
              bookingId,
              customerName: formData.customerName,
              roomNumber: String(formData.roomNumber || '—'),
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

        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          idNumber: '',
          idType: 'aadhaar',
          address: '',
          city: '',
          state: '',
          pincode: '',
          customerGstNo: '',
          roomNumber: '',
          guests: 1,
          checkInDate: '',
          checkInTime: '14:00',
          checkOutDate: '',
          checkOutTime: '12:00',
          purposeOfVisit: '',
          otherExpenses: 0,
          expenseDescription: '',
          referralBy: '',
          referralAmount: 0
        });
        setIdImages([]);
        setIdValidationError('');
        setRoomPriceEditable(0);
        setUseCustomPercentages(false);
        setTaxType('cgst_sgst');
        setIncludeServiceCharge(true);
        setIncludeCGST(true);
        setIncludeSGST(true);
        setIncludeIGST(false);
        setPaymentMethod('cash');
        setPaymentStatus('completed');
        setTransactionId('');
        setQrCodeData('');
        setIsGeneratingQR(false);
        setIsVerifyingPayment(false);

        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('❌ ERROR:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerClass =
    'sticky bottom-0 z-10 flex shrink-0 gap-2 border-t border-border/80 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'flex w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl sm:gap-4 sm:p-6',
          'fixed inset-x-0 bottom-0 top-auto h-[min(100dvh,100%)] max-h-[100dvh] translate-x-0 translate-y-0',
          'rounded-t-2xl rounded-b-none border-b-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh]',
          'sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg'
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" aria-hidden />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-2 sm:px-0 sm:pt-0">
            <DialogHeader className="space-y-2 text-left pb-2 sm:pb-0">
              <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <span>Add Previous Booking</span>
                </div>
                <span className="mt-1 block text-xs sm:text-sm font-normal text-amber-600">
                  Past dates · includes tax & payment
                </span>
              </DialogTitle>
            </DialogHeader>

        <div className="space-y-3 sm:space-y-6 pb-2">
          {/* Customer Information */}
          <div className="border rounded-xl p-3 sm:p-6 bg-card shadow-sm">
            <h3 className="font-semibold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs sm:text-sm flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Full Name *
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={e => handleChange('customerName', e.target.value)}
                  placeholder="Enter full name"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerPhone" className="text-xs sm:text-sm flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Phone Number *
                </Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={e => handleChange('customerPhone', e.target.value)}
                  placeholder="10-digit mobile number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerEmail" className="text-xs sm:text-sm flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                </Label>
                <Input
                  id="customerEmail"
                  value={formData.customerEmail}
                  onChange={e => handleChange('customerEmail', e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="idType" className="text-xs sm:text-sm">ID Type</Label>
                <select
                  id="idType"
                  value={formData.idType}
                  onChange={e => handleChange('idType', e.target.value as any)}
                  className="w-full h-10 px-3 text-sm border rounded-md bg-background"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving">Driving License</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="idNumber" className="text-xs sm:text-sm">ID Number</Label>
                <div className="relative">
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={e => handleChange('idNumber', e.target.value)}
                    placeholder="Enter ID number"
                    className={cn('h-10 text-sm', idValidationError ? 'border-red-500 pr-10' : '')}
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
                    Optional field
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerGstNo" className="text-xs sm:text-sm flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Customer GST No
                </Label>
                <Input
                  id="customerGstNo"
                  value={formData.customerGstNo}
                  onChange={e => handleChange('customerGstNo', e.target.value)}
                  placeholder="GSTIN (e.g., 27AAACH1234M1Z5)"
                  maxLength={15}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* ID Proof Upload (collapsible) */}
          <Collapsible
            open={expandedSections.idProofUpload}
            onOpenChange={() => toggleSection('idProofUpload')}
            className="border rounded-xl border-blue-100 bg-blue-50/30"
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex flex-1 items-center justify-between gap-2 text-left min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
                      <FileImage className="h-4 w-4 text-blue-600 shrink-0" />
                      ID Proof Upload
                      {idImages.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5">{idImages.length}</Badge>
                      )}
                    </h3>
                    {!expandedSections.idProofUpload && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {idImages.length > 0 ? `${idImages.length} image(s) added` : 'Optional — tap to upload'}
                      </p>
                    )}
                  </div>
                  {expandedSections.idProofUpload ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-3 pb-3 space-y-3 border-t border-blue-100/80">
                <Alert className="py-2">
                  <FileImage className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    Upload clear {formData.idType === 'pan' ? 'PAN' : 'ID'} images (front/back if needed).
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl p-5 sm:p-8 bg-primary/5">
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
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      {uploadingImage ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-sm sm:text-base mb-1">Upload ID Proof</h3>
                      <p className="text-xs text-muted-foreground">
                        Tap to choose or take a photo
                      </p>
                    </div>
                  </label>
                </div>

                {idImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <Label className="text-xs sm:text-sm font-medium">
                        Uploaded ({idImages.length})
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 sm:flex-none text-xs"
                          onClick={() => setIdImages([])}
                          disabled={idImages.length === 0}
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 sm:flex-none text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Add More
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {idImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg border overflow-hidden bg-gray-100">
                            <img
                              src={image}
                              alt={`ID Proof ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/images/placeholder.png';
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 h-7 w-7 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {index === 0 ? 'Front' : index === 1 ? 'Back' : `Image ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CollapsibleContent>
          </Collapsible>

          {/* Address Information (collapsible) */}
          <Collapsible
            open={expandedSections.addressDetails}
            onOpenChange={() => toggleSection('addressDetails')}
            className="border rounded-xl border-blue-100 bg-blue-50/30"
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex flex-1 items-center justify-between gap-2 text-left min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                      Address Information
                    </h3>
                    {!expandedSections.addressDetails && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {formData.city || formData.address
                          ? [formData.address, formData.city, formData.state].filter(Boolean).join(', ')
                          : 'Optional — tap to add address'}
                      </p>
                    )}
                  </div>
                  {expandedSections.addressDetails ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-3 pb-3 space-y-3 border-t border-blue-100/80">
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="address" className="text-xs sm:text-sm">Full Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Enter full address"
                  className="min-h-[64px] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs sm:text-sm">City</Label>
                  <Input id="city" value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="City" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs sm:text-sm">State</Label>
                  <Input id="state" value={formData.state} onChange={e => handleChange('state', e.target.value)} placeholder="State" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="pincode" className="text-xs sm:text-sm">Pincode</Label>
                  <Input id="pincode" value={formData.pincode} onChange={e => handleChange('pincode', e.target.value)} placeholder="Pincode" maxLength={6} inputMode="numeric" className="h-10 text-sm" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Room Information */}
          <div className="border rounded-xl p-3 sm:p-6 bg-card shadow-sm">
            <h3 className="font-semibold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <Bed className="h-4 w-4 sm:h-5 sm:w-5" />
              Room Information
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="roomNumber" className="text-xs sm:text-sm flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  Room Number *
                </Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={e => handleChange('roomNumber', e.target.value)}
                  placeholder="e.g., 101"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guests" className="text-xs sm:text-sm flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Guests
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.guests}
                  onChange={e => handleChange('guests', parseInt(e.target.value) || 1)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="border rounded-xl p-3 sm:p-6 border-amber-200 bg-amber-50/30">
            <h3 className="font-semibold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              Booking Dates
              <span className="text-[10px] sm:text-xs font-normal text-amber-700/80">(past dates OK)</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="checkInDate" className="text-xs sm:text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Check-in *
                  </Label>
                  <Input
                    type="date"
                    id="checkInDate"
                    value={formData.checkInDate}
                    onChange={e => handleChange('checkInDate', e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkInTime" className="text-xs sm:text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="checkInTime"
                    value={formData.checkInTime}
                    onChange={e => handleChange('checkInTime', e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="checkOutDate" className="text-xs sm:text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Check-out *
                  </Label>
                  <Input
                    type="date"
                    id="checkOutDate"
                    value={formData.checkOutDate}
                    min={formData.checkInDate}
                    onChange={e => handleChange('checkOutDate', e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkOutTime" className="text-xs sm:text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="checkOutTime"
                    value={formData.checkOutTime}
                    onChange={e => handleChange('checkOutTime', e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========== PRICE CONFIGURATION (compact) ========== */}
          <Collapsible
            open={expandedSections.priceConfiguration}
            onOpenChange={() => toggleSection('priceConfiguration')}
            className="border rounded-xl bg-blue-50/40"
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-between gap-2 text-left min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">Price Configuration</h4>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-blue-100">
                        {taxType === 'cgst_sgst' ? 'CGST+SGST' : 'IGST'}
                      </Badge>
                    </div>
                    {!expandedSections.priceConfiguration && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        ₹{roomPriceEditable.toLocaleString('en-IN')}/night · {nights} night{nights === 1 ? '' : 's'} · Total{' '}
                        <span className="font-semibold text-green-700">₹{charges.total.toLocaleString('en-IN')}</span>
                      </p>
                    )}
                  </div>
                  {expandedSections.priceConfiguration ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-3 pb-3 space-y-3 border-t border-blue-100/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="roomPrice" className="text-xs text-muted-foreground">
                    Room price / night (₹)
                  </Label>
                  <Input
                    id="roomPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={roomPriceEditable}
                    onChange={(e) => setRoomPriceEditable(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Base: ₹{charges.baseAmount.toFixed(2)} ({nights} night{nights === 1 ? '' : 's'})
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">GST type</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={taxType === 'cgst_sgst' ? 'default' : 'outline'}
                      onClick={() => setTaxType('cgst_sgst')}
                      className="h-8 text-xs"
                    >
                      CGST+SGST
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={taxType === 'igst' ? 'default' : 'outline'}
                      onClick={() => setTaxType('igst')}
                      className="h-8 text-xs"
                    >
                      IGST
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-white/80 divide-y text-xs">
                <div className="flex items-center gap-2 p-2">
                  <input
                    type="checkbox"
                    id="includeServiceCharge"
                    checked={includeServiceCharge}
                    onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <Label htmlFor="includeServiceCharge" className="flex-1 text-xs cursor-pointer">
                    Service {charges.serviceChargePercentage}%
                  </Label>
                  {includeServiceCharge && (
                    <>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage}
                        onChange={(e) => {
                          setUseCustomPercentages(true);
                          setCustomServicePercentage(parseFloat(e.target.value) || 0);
                        }}
                        className="h-7 w-14 px-1 text-xs"
                      />
                      <span className="text-green-700 font-medium w-16 text-right">+₹{charges.serviceCharge.toFixed(0)}</span>
                    </>
                  )}
                </div>

                {taxType === 'cgst_sgst' ? (
                  <>
                    <div className="flex items-center gap-2 p-2">
                      <input
                        type="checkbox"
                        id="includeCGST"
                        checked={includeCGST}
                        onChange={(e) => setIncludeCGST(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                      <Label htmlFor="includeCGST" className="flex-1 text-xs cursor-pointer">
                        CGST {charges.cgstPercentage}%
                      </Label>
                      {includeCGST && (
                        <>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage}
                            onChange={(e) => {
                              setUseCustomPercentages(true);
                              setCustomCgstPercentage(parseFloat(e.target.value) || 0);
                            }}
                            className="h-7 w-14 px-1 text-xs"
                          />
                          <span className="text-green-700 font-medium w-16 text-right">+₹{charges.cgst.toFixed(0)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-2">
                      <input
                        type="checkbox"
                        id="includeSGST"
                        checked={includeSGST}
                        onChange={(e) => setIncludeSGST(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                      <Label htmlFor="includeSGST" className="flex-1 text-xs cursor-pointer">
                        SGST {charges.sgstPercentage}%
                      </Label>
                      {includeSGST && (
                        <>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage}
                            onChange={(e) => {
                              setUseCustomPercentages(true);
                              setCustomSgstPercentage(parseFloat(e.target.value) || 0);
                            }}
                            className="h-7 w-14 px-1 text-xs"
                          />
                          <span className="text-green-700 font-medium w-16 text-right">+₹{charges.sgst.toFixed(0)}</span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-2">
                    <input
                      type="checkbox"
                      id="includeIGST"
                      checked={includeIGST}
                      onChange={(e) => setIncludeIGST(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    <Label htmlFor="includeIGST" className="flex-1 text-xs cursor-pointer">
                      IGST {charges.igstPercentage}%
                    </Label>
                    {includeIGST && (
                      <>
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
                          className="h-7 w-14 px-1 text-xs"
                        />
                        <span className="text-green-700 font-medium w-16 text-right">+₹{charges.igst.toFixed(0)}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {useCustomPercentages && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    setUseCustomPercentages(false);
                    setCustomServicePercentage(hotelSettings.serviceChargePercentage);
                    setCustomCgstPercentage(hotelSettings.cgstPercentage);
                    setCustomSgstPercentage(hotelSettings.sgstPercentage);
                    setCustomIgstPercentage(hotelSettings.igstPercentage);
                  }}
                >
                  Reset tax % to hotel defaults
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* ========== PRICE SUMMARY ========== */}
          <Collapsible
            open={expandedSections.priceSummary}
            onOpenChange={() => toggleSection('priceSummary')}
            className="border rounded-xl bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex flex-1 items-center justify-between gap-2 text-left min-w-0">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm">Price Summary</h4>
                    {!expandedSections.priceSummary && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total{' '}
                        <span className="font-semibold text-green-600">₹{charges.total.toLocaleString('en-IN')}</span>
                      </p>
                    )}
                  </div>
                  {expandedSections.priceSummary ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-3 pb-3 space-y-1.5 border-t text-xs sm:text-sm">
              <div className="flex justify-between">
                <span>Room Price (₹{roomPriceEditable.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'})</span>
                <span>₹{charges.baseAmount.toFixed(2)}</span>
              </div>

              {includeServiceCharge && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    Service Charge ({charges.serviceChargePercentage}%)
                  </span>
                  <span>₹{charges.serviceCharge.toFixed(2)}</span>
                </div>
              )}

              {taxType === 'cgst_sgst' && (
                <>
                  {includeCGST && (
                    <div className="flex justify-between">
                      <span>CGST ({charges.cgstPercentage}%)</span>
                      <span>₹{charges.cgst.toFixed(2)}</span>
                    </div>
                  )}
                  {includeSGST && (
                    <div className="flex justify-between">
                      <span>SGST ({charges.sgstPercentage}%)</span>
                      <span>₹{charges.sgst.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              {taxType === 'igst' && includeIGST && (
                <div className="flex justify-between">
                  <span>IGST ({charges.igstPercentage}%)</span>
                  <span>₹{charges.igst.toFixed(2)}</span>
                </div>
              )}

              {formData.otherExpenses > 0 && (
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span>Other Expenses{formData.expenseDescription && ` (${formData.expenseDescription})`}</span>
                  <span>+ ₹{formData.otherExpenses.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-sm sm:text-lg">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{charges.total.toFixed(2)}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Details (collapsible) */}
          <Collapsible
            open={expandedSections.additionalDetails}
            onOpenChange={() => toggleSection('additionalDetails')}
            className="border rounded-xl border-green-100 bg-green-50/30"
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-between gap-2 text-left min-w-0"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-green-800">Additional Details</h3>
                    {!expandedSections.additionalDetails && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {formData.purposeOfVisit
                          ? formData.purposeOfVisit
                          : formData.otherExpenses > 0 || formData.referralBy
                            ? [
                                formData.otherExpenses > 0 ? `Expenses ₹${formData.otherExpenses}` : '',
                                formData.referralBy ? `Referral: ${formData.referralBy}` : '',
                              ]
                                .filter(Boolean)
                                .join(' · ')
                            : 'Purpose, expenses, referral (optional)'}
                      </p>
                    )}
                  </div>
                  {expandedSections.additionalDetails ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-3 pb-3 space-y-3 border-t border-green-100/80">
              <div className="space-y-2 pt-2">
                <Label htmlFor="purposeOfVisit" className="text-xs text-muted-foreground">
                  Purpose of Visit
                </Label>
                <Textarea
                  id="purposeOfVisit"
                  value={formData.purposeOfVisit}
                  onChange={e => handleChange('purposeOfVisit', e.target.value)}
                  placeholder="Enter purpose of visit"
                  className="min-h-[64px] text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="otherExpenses" className="text-xs text-muted-foreground">
                    Other Expenses (₹)
                  </Label>
                  <Input
                    id="otherExpenses"
                    type="number"
                    value={formData.otherExpenses}
                    onChange={e => handleChange('otherExpenses', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="1"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="expenseDescription" className="text-xs text-muted-foreground">
                    Expense Description
                  </Label>
                  <Input
                    id="expenseDescription"
                    value={formData.expenseDescription}
                    onChange={e => handleChange('expenseDescription', e.target.value)}
                    placeholder="e.g., Coffee, Snacks, Laundry"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="referralBy" className="text-xs text-muted-foreground">
                    Referral By
                  </Label>
                  <Input
                    id="referralBy"
                    value={formData.referralBy}
                    onChange={e => handleChange('referralBy', e.target.value)}
                    placeholder="Referral source"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="referralAmount" className="text-xs text-muted-foreground">
                    Referral Amount (₹)
                  </Label>
                  <Input
                    id="referralAmount"
                    type="number"
                    value={formData.referralAmount}
                    onChange={e => handleChange('referralAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Payment Method */}
          <div className="border rounded-xl p-3 sm:p-6 bg-card shadow-sm space-y-4">
            <h3 className="font-semibold text-sm sm:text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              Payment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={collectAtCheckout ? 'default' : 'outline'}
                className="h-auto py-3 flex flex-col items-start gap-1 text-left"
                onClick={() => {
                  setCollectAtCheckout(true);
                  setPaymentStatus('pending');
                  setPaymentMethod('cash');
                  setOnlinePaymentApp('');
                  setTransactionId('');
                }}
              >
                <span className="text-sm font-semibold">Collect at checkout</span>
                <span className="text-[11px] opacity-80 font-normal">
                  Guest pays full amount when checking out
                </span>
              </Button>
              <Button
                type="button"
                variant={!collectAtCheckout ? 'default' : 'outline'}
                className="h-auto py-3 flex flex-col items-start gap-1 text-left"
                onClick={() => {
                  setCollectAtCheckout(false);
                  setPaymentStatus('completed');
                }}
              >
                <span className="text-sm font-semibold">Already paid now</span>
                <span className="text-[11px] opacity-80 font-normal">
                  Record cash/online payment already received
                </span>
              </Button>
            </div>

            {collectAtCheckout ? (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Booking will be created with <strong>balance due ₹{charges.total.toFixed(2)}</strong>.
                  Collect this amount in the <strong>Checkout</strong> tab when the guest leaves.
                </AlertDescription>
              </Alert>
            ) : (
              <>
            {userPlan === 'pro' ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-auto py-2.5 sm:py-3 flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-1.5 sm:gap-2"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaymentStatus('completed');
                    setOnlinePaymentApp('');
                  }}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  <div className="text-center sm:text-left">
                    <div className="text-xs sm:text-sm font-medium">Cash</div>
                    <div className="text-[10px] opacity-80 hidden sm:block">Paid at reception</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'online' ? 'default' : 'outline'}
                  className="h-auto py-2.5 sm:py-3 flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-1.5 sm:gap-2"
                  onClick={() => {
                    setPaymentMethod('online');
                    setPaymentStatus('pending');
                    if (!qrCodeData && charges.total > 0) {
                      generateUPIQrCode();
                    }
                  }}
                  disabled={isGeneratingQR || charges.total <= 0}
                >
                  {isGeneratingQR ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <QrCode className="h-4 w-4 shrink-0" />
                  )}
                  <div className="text-center sm:text-left">
                    <div className="text-xs sm:text-sm font-medium">Online</div>
                    <div className="text-[10px] opacity-80 hidden sm:block">UPI QR scan</div>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Basic plan: cash payment only for previous bookings.
                </p>
                <Button
                  type="button"
                  variant="default"
                  className="w-full h-auto py-3 flex items-center justify-center gap-2"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaymentStatus('completed');
                  }}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Cash at reception</span>
                </Button>
              </div>
            )}

            {paymentMethod === 'online' && userPlan === 'pro' && (
              <div className="mt-3 sm:mt-4 border rounded-xl p-3 sm:p-4 space-y-3">
                <UpiAppSelector
                  value={onlinePaymentApp}
                  onChange={setOnlinePaymentApp}
                />
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <h4 className="font-semibold text-xs sm:text-sm mb-2">Scan QR</h4>
                    <div className="bg-white p-2 rounded-lg border">
                      <img
                        src={hotelQRCode || '/images/hithlakshsolutions-com-qr.png'}
                        alt="Hotel UPI QR Code"
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/images/hithlakshsolutions-com-qr.png';
                        }}
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-medium mt-2">
                      Amount:{' '}
                      <span className="text-base sm:text-lg font-bold text-green-600">
                        ₹{charges.total.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="w-full sm:flex-1 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Guest scans QR and pays ₹{charges.total.toFixed(2)}, then confirm below.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant="outline" className={paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {paymentStatus === 'completed' ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                    {paymentStatus !== 'completed' ? (
                      <Button
                        type="button"
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
                    ) : (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 font-medium">
                          Online payment verified.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Transaction ID (optional)</Label>
                      <Input
                        type="text"
                        placeholder="UPI reference / TXN id"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="mt-4 border rounded-lg p-3 bg-blue-50/50 flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Cash received</span>
                </div>
                <span className="font-bold text-blue-700">₹{charges.total.toFixed(2)}</span>
              </div>
            )}
              </>
            )}
          </div>

          {/* Summary */}
          <div className="border rounded-xl p-3 sm:p-6 bg-muted/30">
            <h3 className="font-semibold text-sm sm:text-lg mb-3 sm:mb-4">Booking Summary</h3>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium truncate">{formData.customerName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{formData.customerPhone || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Room</p>
                <p className="font-medium">{formData.roomNumber || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ID Images</p>
                <p className="font-medium">{idImages.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check-in</p>
                <p className="font-medium">{formData.checkInDate || '—'} {formData.checkInTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check-out</p>
                <p className="font-medium">{formData.checkOutDate || '—'} {formData.checkOutTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium">
                  {collectAtCheckout
                    ? `Pay at checkout · ₹${charges.total.toFixed(2)} due`
                    : `${paymentMethod} · ${paymentStatus}`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax</p>
                <p className="font-medium text-blue-600">
                  {taxType === 'cgst_sgst'
                    ? `₹${(charges.cgst + charges.sgst).toFixed(0)}`
                    : `₹${charges.igst.toFixed(0)}`}
                </p>
              </div>
              <div className="col-span-2 border-t pt-2 mt-1">
                <p className="text-muted-foreground">
                  {collectAtCheckout ? 'Amount due at checkout' : 'Total Amount'}
                </p>
                <p className="font-bold text-lg sm:text-2xl text-green-600">₹{charges.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
          </div>

          <div className={cn(footerClass, 'justify-between sm:justify-end sm:pt-4')}>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 flex-1 sm:flex-none sm:min-w-[120px]"
            >
              <X className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">Cancel</span>
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 flex-1 bg-amber-600 hover:bg-amber-700 sm:flex-none sm:min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
                  <span className="truncate">Creating…</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">Create Booking</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviousBookingForm;