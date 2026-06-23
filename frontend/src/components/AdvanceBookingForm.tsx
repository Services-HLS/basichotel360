
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
import { cn } from '@/lib/utils';
import {
    Upload,
    X,
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
    Info,
    CalendarDays,
    Receipt,
    Home,
    BedDouble,
    Building,
    CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

interface Room {
    id?: number;
    roomId?: string;
    number: string | number;
    type: string;
    price: number;
    maxOccupancy?: number;
    floor?: number;
    status?: string;
}

interface AdvanceBookingFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
    rooms: Room[];
    userSource?: string;
    hotelId?: string;
}

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Validation error interface
interface ValidationErrors {
    [key: string]: string;
}

export default function AdvanceBookingForm({
    open,
    onClose,
    onSuccess,
    rooms,
    userSource = 'database',
    hotelId
}: AdvanceBookingFormProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeStep, setActiveStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idImages, setIdImages] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    // Customer search states
    const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    // Availability states
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [isRoomAvailable, setIsRoomAvailable] = useState<boolean | null>(null);
    const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

    const [hotelQRCode, setHotelQRCode] = useState<string | null>(null);

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

    // Form data - ID fields are now optional
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        idType: 'aadhaar' as 'aadhaar' | 'pan' | 'passport' | 'driving' | '',
        idNumber: '',
        checkInDate: format(new Date(), 'yyyy-MM-dd'),
        checkInTime: '14:00',
        checkOutDate: '',
        checkOutTime: '',
        adults: 1,
        children: 0,
        guests: 1,
        specialRequests: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        customerGstNo: '',
        purposeOfVisit: '',
        referralBy: '',
        referralAmount: 0
    });

    // Validation functions
    const validateStep1 = (): boolean => {
        const errors: ValidationErrors = {};

        if (!selectedRoom) {
            errors.room = 'Please select a room';
        }
        if (!formData.checkInDate) {
            errors.checkInDate = 'Check-in date is required';
        }
        // Check-out date is optional - no validation needed
        if (formData.checkOutDate && formData.checkOutDate < formData.checkInDate) {
            errors.checkOutDate = 'Check-out date cannot be earlier than check-in date';
        }

        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast({
                title: 'Validation Error',
                description: Object.values(errors)[0],
                variant: 'destructive'
            });
            return false;
        }
        return true;
    };

    const validateStep2 = (): boolean => {
        const errors: ValidationErrors = {};

        // Customer Name validation
        if (!formData.customerName.trim()) {
            errors.customerName = 'Customer name is required';
        } else if (formData.customerName.trim().length < 2) {
            errors.customerName = 'Name must be at least 2 characters';
        } else if (formData.customerName.trim().length > 100) {
            errors.customerName = 'Name must be less than 100 characters';
        }

        // Phone validation
        if (!formData.customerPhone.trim()) {
            errors.customerPhone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.customerPhone)) {
            errors.customerPhone = 'Please enter a valid 10-digit phone number';
        }

        // Email validation (optional but validate if provided)
        if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
            errors.customerEmail = 'Please enter a valid email address';
        }

        // ID fields are now optional - only validate if provided
        if (formData.idNumber && formData.idNumber.trim()) {
            // Validate based on ID type
            const idNumberClean = formData.idNumber.trim();
            
            if (formData.idType === 'aadhaar') {
                if (!/^\d{12}$/.test(idNumberClean)) {
                    errors.idNumber = 'Aadhaar number must be 12 digits';
                }
            } else if (formData.idType === 'pan') {
                if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNumberClean.toUpperCase())) {
                    errors.idNumber = 'PAN card must be in format ABCDE1234F';
                }
            } else if (formData.idType === 'passport') {
                if (idNumberClean.length < 8 || idNumberClean.length > 12) {
                    errors.idNumber = 'Passport number must be 8-12 characters';
                }
            } else if (formData.idType === 'driving') {
                if (idNumberClean.length < 10 || idNumberClean.length > 16) {
                    errors.idNumber = 'Driving license must be 10-16 characters';
                }
            }
        }

        // Pincode validation (optional but validate if provided)
        if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
            errors.pincode = 'Pincode must be 6 digits';
        }

        // GST validation (optional but validate if provided)
        if (formData.customerGstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.customerGstNo)) {
            errors.customerGstNo = 'Please enter a valid GST number';
        }

        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast({
                title: 'Validation Error',
                description: Object.values(errors)[0],
                variant: 'destructive'
            });
            return false;
        }
        return true;
    };

    const validateStep3 = (): boolean => {
        const errors: ValidationErrors = {};

        if (advanceAmount <= 0) {
            errors.advanceAmount = 'Advance amount must be greater than 0';
        } else if (advanceAmount > charges.total) {
            errors.advanceAmount = 'Advance amount cannot exceed total amount';
        } else if (advanceAmount < charges.total * 0.1) {
            errors.advanceAmount = `Minimum advance amount is ₹${(charges.total * 0.1).toFixed(2)} (10% of total)`;
        }

        if (advancePaymentMethod === 'online' && advancePaymentStatus !== 'completed') {
            errors.payment = 'Please complete the online payment';
        }

        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast({
                title: 'Validation Error',
                description: Object.values(errors)[0],
                variant: 'destructive'
            });
            return false;
        }
        return true;
    };

    // Clear field-specific error
    const clearFieldError = (fieldName: string) => {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    };

    // Reset form function
    const resetForm = () => {
        setActiveStep(1);
        setSelectedRoom('');
        setSelectedRoomObj(null);
        setRoomPriceEditable(0);
        setIdImages([]);
        setFoundCustomers([]);
        setShowCustomerSearch(false);
        setSelectedCustomer(null);
        setAdvanceAmount(0);
        setAdvancePaymentStatus('pending');
        setQrCodeData('');
        setExpiryDays(30);
        setIncludeServiceCharge(true);
        setIncludeCGST(true);
        setIncludeSGST(true);
        setIncludeIGST(false);
        setTaxType('cgst_sgst');
        setUseCustomPercentages(false);
        setCustomServicePercentage(hotelSettings.serviceChargePercentage);
        setCustomCgstPercentage(hotelSettings.cgstPercentage);
        setCustomSgstPercentage(hotelSettings.sgstPercentage);
        setCustomIgstPercentage(hotelSettings.igstPercentage);
        setValidationErrors({});

        setFormData({
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            idType: 'aadhaar',
            idNumber: '',
            checkInDate: format(new Date(), 'yyyy-MM-dd'),
            checkInTime: '14:00',
            checkOutDate: '',
            checkOutTime: '',
            adults: 1,
            children: 0,
            guests: 1,
            specialRequests: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            customerGstNo: '',
            purposeOfVisit: '',
            referralBy: '',
            referralAmount: 0
        });
    };

    // Add useEffect to watch for open state
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                resetForm();
            }, 200);
            return () => clearTimeout(timer);
        } else {
            // When opening, reset immediately
            resetForm();
        }
    }, [open]);

    // Room selection
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    const [selectedRoomObj, setSelectedRoomObj] = useState<Room | null>(null);
    const [roomPriceEditable, setRoomPriceEditable] = useState<number>(0);

    // ========== PRICE EDITING STATE VARIABLES ==========
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

    // Advance payment
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);
    const [advancePaymentMethod, setAdvancePaymentMethod] = useState<'cash' | 'online'>('cash');
    const [advancePaymentStatus, setAdvancePaymentStatus] = useState<'pending' | 'partial' | 'completed'>('pending');
    const [qrCodeData, setQrCodeData] = useState<string>('');
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [expiryDays, setExpiryDays] = useState<number>(30);

    // Filter available rooms based on selected dates
    useEffect(() => {
        const filterAvailableRooms = async () => {
            if (!formData.checkInDate) {
                setAvailableRooms(rooms);
                return;
            }

            const checkToDate = formData.checkOutDate || formData.checkInDate;

            setCheckingAvailability(true);
            try {
                const token = localStorage.getItem('authToken');
                const availableRoomsList: Room[] = [];

                for (const room of rooms) {
                    const roomId = room.id?.toString() || room.roomId || room.number?.toString() || '';

                    const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/check-availability`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            room_id: roomId,
                            from_date: formData.checkInDate,
                            to_date: checkToDate
                        })
                    });
                    const data = await response.json();

                    if (data.success && data.data.available) {
                        availableRoomsList.push(room);
                    }
                }

                setAvailableRooms(availableRoomsList);

                if (selectedRoom) {
                    const isSelectedAvailable = availableRoomsList.some(room => {
                        const roomId = room.id?.toString() || room.roomId || room.number?.toString() || '';
                        return roomId === selectedRoom;
                    });

                    if (!isSelectedAvailable) {
                        setSelectedRoom('');
                        setSelectedRoomObj(null);
                        toast({
                            title: "Room Not Available",
                            description: "Previously selected room is no longer available for these dates",
                            variant: "destructive"
                        });
                    }
                }
            } catch (error) {
                console.error('Error filtering available rooms:', error);
                setAvailableRooms(rooms);
            } finally {
                setCheckingAvailability(false);
            }
        };

        const timer = setTimeout(filterAvailableRooms, 500);
        return () => clearTimeout(timer);
    }, [formData.checkInDate, formData.checkOutDate, rooms]);

    // Update selected room object when room selection changes
    useEffect(() => {
        if (selectedRoom) {
            const room = rooms.find(r => {
                const roomId = r.id?.toString() || r.roomId || r.number?.toString() || '';
                return roomId === selectedRoom;
            });
            setSelectedRoomObj(room || null);
            if (room) {
                setRoomPriceEditable(room.price || 0);
            }
        } else {
            setSelectedRoomObj(null);
        }
    }, [selectedRoom, rooms]);

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
                            serviceChargePercentage: data.data.serviceChargePercentage || 10.00,
                            qrcode_image: data.data.qrcode_image
                        });

                        if (data.data.qrcode_image) {
                            setHotelQRCode(data.data.qrcode_image);
                        }

                        console.log('✅ Hotel tax settings loaded:', data.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching hotel settings:', error);
            }
        };

        if (userSource === 'database') {
            fetchHotelSettings();
        }
    }, [userSource]);

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

    // Calculate nights - handle optional checkout
    const nights = (() => {
        if (!formData.checkInDate) return 0;

        if (!formData.checkOutDate) {
            return 1;
        }

        const a = new Date(formData.checkInDate);
        const b = new Date(formData.checkOutDate);
        const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    })();

    // Get room price
    const roomPrice = selectedRoomObj?.price || 0;
    const effectiveRoomPrice = roomPriceEditable > 0 ? roomPriceEditable : roomPrice;

    // ========== CALCULATE CHARGES ==========
    const calculateCharges = () => {
        const baseAmount = effectiveRoomPrice * nights;

        const servicePercentage = Number(useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage) || 0;
        const serviceCharge = includeServiceCharge ? (baseAmount * servicePercentage) / 100 : 0;

        let cgst = 0, sgst = 0, igst = 0, totalGst = 0;
        let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;

        if (taxType === 'cgst_sgst') {
            cgstPercentage = Number(useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage) || 0;
            sgstPercentage = Number(useCustomPercentages ? customSgstPercentage : hotelSettings.sgstPercentage) || 0;

            cgst = includeCGST ? ((baseAmount + serviceCharge) * cgstPercentage) / 100 : 0;
            sgst = includeSGST ? ((baseAmount + serviceCharge) * sgstPercentage) / 100 : 0;
            totalGst = cgst + sgst;
        } else {
            igstPercentage = Number(useCustomPercentages ? customIgstPercentage : hotelSettings.igstPercentage) || 0;
            igst = includeIGST ? ((baseAmount + serviceCharge) * igstPercentage) / 100 : 0;
            totalGst = igst;
        }

        const total = baseAmount + serviceCharge + cgst + sgst + igst;

        return {
            baseAmount: Number(baseAmount) || 0,
            serviceCharge: Number(serviceCharge) || 0,
            cgst: Number(cgst) || 0,
            sgst: Number(sgst) || 0,
            igst: Number(igst) || 0,
            totalGst: Number(totalGst) || 0,
            total: Number(total) || 0,
            roomPrice: Number(effectiveRoomPrice) || 0,
            includeServiceCharge,
            includeCGST,
            includeSGST,
            includeIGST,
            taxType,
            cgstPercentage: Number(cgstPercentage) || 0,
            sgstPercentage: Number(sgstPercentage) || 0,
            igstPercentage: Number(igstPercentage) || 0,
            serviceChargePercentage: Number(servicePercentage) || 0,
            useCustomPercentages
        };
    };

    const charges = calculateCharges();

    // Handle phone change for customer search
    const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawPhone = e.target.value;
        const digitsOnly = rawPhone.replace(/\D/g, '');
        const limitedPhone = digitsOnly.slice(0, 10);

        setFormData({ ...formData, customerPhone: limitedPhone });
        clearFieldError('customerPhone');

        if (limitedPhone.length === 10) {
            setIsSearchingCustomer(true);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${NODE_BACKEND_URL}/customers/search-by-phone?phone=${limitedPhone}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setFoundCustomers(data.data || []);
                setShowCustomerSearch(data.data && data.data.length > 0);
            } catch (error) {
                console.error('Error searching customers:', error);
                setFoundCustomers([]);
                setShowCustomerSearch(false);
            } finally {
                setIsSearchingCustomer(false);
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
            customerEmail: customer.email || '',
            idType: customer.id_type || formData.idType,
            idNumber: customer.id_number || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            customerGstNo: customer.customer_gst_no || '',
            purposeOfVisit: customer.purpose_of_visit || formData.purposeOfVisit
        });

        if (customer.id_image) {
            setIdImages([customer.id_image]);
        }
        if (customer.id_image2) {
            setIdImages(prev => [...prev, customer.id_image2]);
        }

        setShowCustomerSearch(false);
        setFoundCustomers([]);
        toast({
            title: "✅ Customer Details Loaded",
            description: `Details auto-filled for ${customer.name}`,
            variant: "default"
        });
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setIdImages(prev => [...prev, reader.result as string]);
                };
            }
            toast({ title: "Images uploaded", description: `${files.length} image(s) added` });
        } catch (error) {
            toast({ title: "Upload failed", variant: "destructive" });
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        setIdImages(prev => prev.filter((_, i) => i !== index));
    };

    // Generate QR code for advance payment
    const generateQRCode = async () => {
        setIsGeneratingQR(true);
        try {
            const upiId = 'hotel@upi';
            const merchantName = 'Hotel Management';
            const transactionId = `ADV${Date.now()}${Math.floor(Math.random() * 1000)}`;

            const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${advanceAmount}&cu=INR&tn=${encodeURIComponent(transactionId)}`;
            setQrCodeData(upiString);

            localStorage.setItem('currentAdvanceTransaction', JSON.stringify({
                id: transactionId,
                amount: advanceAmount,
                timestamp: Date.now()
            }));

            toast({
                title: "QR Code Generated",
                description: "Scan to pay advance amount",
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
    const verifyPayment = async () => {
        setIsVerifyingPayment(true);
        setTimeout(() => {
            setAdvancePaymentStatus('completed');
            clearFieldError('payment');
            toast({
                title: "✅ Payment Successful",
                description: "Advance payment verified successfully!"
            });
            setIsVerifyingPayment(false);
        }, 2000);
    };

    // Validate step
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            if (activeStep === 2 && advanceAmount > 0 && advancePaymentMethod === 'online' && !qrCodeData) {
                generateQRCode();
            }
            setActiveStep(activeStep + 1);
        }
    };

    const handlePrev = () => setActiveStep(activeStep - 1);

    const handleSubmit = async () => {
        if (!validateStep(activeStep)) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');

            const roomIdToUse = selectedRoomObj?.id || selectedRoom;

            let finalCheckOutDate = formData.checkOutDate;
            let finalCheckOutTime = formData.checkOutTime;

            if (!finalCheckOutDate) {
                const nextDay = new Date(formData.checkInDate);
                nextDay.setDate(nextDay.getDate() + 1);
                finalCheckOutDate = format(nextDay, 'yyyy-MM-dd');
                finalCheckOutTime = finalCheckOutTime || '12:00';
            }

            const payload = {
                room_id: roomIdToUse,
                from_date: formData.checkInDate,
                to_date: finalCheckOutDate,
                from_time: formData.checkInTime,
                to_time: finalCheckOutTime || '12:00',
                guests: Math.max(1, (Number(formData.adults) || 1) + (Number(formData.children) || 0)),
                adults: Number(formData.adults) || 1,
                children: Number(formData.children) || 0,
                amount: Number(charges.baseAmount) || 0,
                advance_amount: Number(advanceAmount) || 0,
                remaining_amount: Number(charges.total - advanceAmount) || 0,
                service: Number(charges.serviceCharge) || 0,
                cgst: Number(charges.cgst) || 0,
                sgst: Number(charges.sgst) || 0,
                igst: Number(charges.igst) || 0,
                total: Number(charges.total) || 0,
                payment_method: advancePaymentMethod,
                payment_status: advancePaymentStatus === 'completed' ? 'completed' : advanceAmount > 0 ? 'partial' : 'pending',
                status: advancePaymentStatus === 'completed' && advanceAmount >= charges.total ? 'confirmed' : 'pending',
                expiry_days: Number(expiryDays) || 30,
                special_requests: formData.specialRequests || '',
                id_type: formData.idType || null,
                id_number: formData.idNumber || null,
                id_image: idImages.length > 0 ? idImages[0] : null,
                id_image2: idImages.length > 1 ? idImages[1] : null,
                referral_by: formData.referralBy || '',
                referral_amount: Number(formData.referralAmount) || 0,
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                customer_email: formData.customerEmail || '',
                customer_id_number: formData.idNumber || null,
                address: formData.address || '',
                city: formData.city || '',
                state: formData.state || '',
                pincode: formData.pincode || '',
                customer_gst_no: formData.customerGstNo || '',
                purpose_of_visit: formData.purposeOfVisit || '',
                gst_percentage: taxType === 'cgst_sgst' ?
                    Number(charges.cgstPercentage + charges.sgstPercentage) || 0 :
                    Number(charges.igstPercentage) || 0,
                service_charge_percentage: includeServiceCharge ? Number(charges.serviceChargePercentage) || 0 : 0,
                is_checkout_auto_generated: !formData.checkOutDate
            };

            console.log('Submitting payload with optional checkout:', payload);

            const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "✅ Advance Booking Created",
                    description: !formData.checkOutDate
                        ? `Advance booking created with default 1 night stay. Advance paid: ₹${Number(advanceAmount).toFixed(2)}`
                        : `Advance booking created successfully. Advance paid: ₹${Number(advanceAmount).toFixed(2)}`
                });
                onSuccess(result.data);
                onClose();
                localStorage.removeItem('currentAdvanceTransaction');
            } else {
                throw new Error(result.message || 'Failed to create advance booking');
            }
        } catch (error: any) {
            console.error('Submit error:', error);
            toast({
                title: "Error",
                description: error.message || 'Failed to create advance booking',
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Progress steps
    const steps = [
        { number: 1, label: 'Room & Dates', icon: CalendarDays },
        { number: 2, label: 'Customer Details', icon: User },
        { number: 3, label: 'Advance Payment', icon: CreditCard }
    ];

    // Get room icon based on type
    const getRoomIcon = (type: string) => {
        const typeLower = type?.toLowerCase() || '';
        if (typeLower.includes('suite')) return <Building className="h-4 w-4" />;
        if (typeLower.includes('deluxe')) return <BedDouble className="h-4 w-4" />;
        return <Home className="h-4 w-4" />;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                resetForm();
                onClose();
            }
        }}>
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
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-2 sm:px-0 sm:pt-0">
                <DialogHeader className="space-y-1 text-left pb-2">
                    <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                        <span>Advance Booking</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            Step {activeStep}/3
                        </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Secure your booking with advance payment. Balance due at check-in.
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="mb-4 grid grid-cols-3 gap-1 px-0 sm:mb-6 sm:gap-2 sm:px-2">
                    {steps.map((step) => (
                        <div key={step.number} className="flex flex-col items-center text-center">
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10',
                                    activeStep >= step.number
                                        ? 'bg-primary text-primary-foreground'
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
                                    'mt-1.5 text-[10px] leading-tight sm:mt-2 sm:text-xs',
                                    activeStep >= step.number ? 'font-medium' : 'text-muted-foreground'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Room & Dates */}
                {activeStep === 1 && (
                    <div className="space-y-6">
                        {/* Room Selection - Dropdown */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <BedDouble className="h-4 w-4" />
                                Select Room *
                            </Label>
                            {rooms.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>No rooms available. Please add rooms first.</AlertDescription>
                                </Alert>
                            ) : (
                                <Select
                                    value={selectedRoom}
                                    onValueChange={(value) => {
                                        setSelectedRoom(value);
                                        clearFieldError('room');
                                    }}
                                    disabled={checkingAvailability}
                                >
                                    <SelectTrigger className={`w-full ${validationErrors.room ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder={checkingAvailability ? "Checking availability..." : "Choose a room"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRooms.length > 0 ? (
                                            availableRooms.map((room) => {
                                                const roomId = room.id?.toString() || room.roomId || room.number?.toString() || '';
                                                return (
                                                    <SelectItem key={roomId} value={roomId}>
                                                        <div className="flex items-center justify-between w-full gap-4">
                                                            <div className="flex items-center gap-2">
                                                                {getRoomIcon(room.type)}
                                                                <span className="font-medium">Room {room.number}</span>
                                                                <span className="text-xs text-muted-foreground">({room.type})</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-semibold text-green-600">₹{room.price}</span>
                                                                {room.floor && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Floor {room.floor}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-muted-foreground">
                                                {checkingAvailability ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Checking availability...
                                                    </div>
                                                ) : (
                                                    "No rooms available for selected dates"
                                                )}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                            {validationErrors.room && (
                                <p className="text-sm text-red-500">{validationErrors.room}</p>
                            )}

                            {/* Availability Status */}
                            {checkingAvailability && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking room availability...
                                </div>
                            )}

                            {!checkingAvailability && availableRooms.length === 0 && formData.checkInDate && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No rooms available for selected dates. Please choose different dates.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <p className="text-xs text-muted-foreground">
                                {availableRooms.length} room(s) available for selected dates
                            </p>
                        </div>

                        {/* Date Selection - Updated with optional checkout */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Check-in Date *
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.checkInDate}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={e => {
                                        setFormData({ ...formData, checkInDate: e.target.value });
                                        clearFieldError('checkInDate');
                                    }}
                                    className={validationErrors.checkInDate ? 'border-red-500' : ''}
                                />
                                {validationErrors.checkInDate && (
                                    <p className="text-sm text-red-500">{validationErrors.checkInDate}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Check-in Time
                                </Label>
                                <Input
                                    type="time"
                                    value={formData.checkInTime}
                                    onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Check-out Date
                                    <Badge variant="outline" className="text-xs bg-gray-100">Optional</Badge>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.checkOutDate}
                                    min={formData.checkInDate || format(new Date(), 'yyyy-MM-dd')}
                                    onChange={e => {
                                        setFormData({ ...formData, checkOutDate: e.target.value });
                                        clearFieldError('checkOutDate');
                                    }}
                                    placeholder="Select checkout date"
                                    className={validationErrors.checkOutDate ? 'border-red-500' : ''}
                                />
                                {validationErrors.checkOutDate && (
                                    <p className="text-sm text-red-500">{validationErrors.checkOutDate}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    If not specified, default is 1 night stay
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Check-out Time
                                    <Badge variant="outline" className="text-xs bg-gray-100">Optional</Badge>
                                </Label>
                                <Input
                                    type="time"
                                    value={formData.checkOutTime}
                                    onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                                    disabled={!formData.checkOutDate}
                                />
                            </div>
                        </div>

                        {/* Show default nights message */}
                        {!formData.checkOutDate && (
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                                <p className="text-sm text-blue-700 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    No checkout date specified. Defaulting to 1 night stay.
                                </p>
                            </div>
                        )}

                        {/* Guests */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Guests
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Adults</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={formData.adults}
                                            onChange={(e) => {
                                                const adults = Math.max(1, parseInt(e.target.value, 10) || 1);
                                                const children = Number(formData.children) || 0;
                                                setFormData({
                                                    ...formData,
                                                    adults,
                                                    guests: adults + children,
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Children</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={20}
                                            value={formData.children}
                                            onChange={(e) => {
                                                const children = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                const adults = Number(formData.adults) || 1;
                                                setFormData({
                                                    ...formData,
                                                    children,
                                                    guests: adults + children,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total: {Math.max(1, (Number(formData.adults) || 1) + (Number(formData.children) || 0))} guest(s)
                                </p>
                            </div>
                        </div>

                        {/* Price Summary - Basic */}
                        {selectedRoom && (
                            <div className="border rounded-lg p-4 bg-blue-50/30">
                                <h4 className="font-medium mb-2">Price Summary</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="shrink min-w-0">Room Price</span>
                                        <span className="shrink-0 tabular-nums text-right">₹{effectiveRoomPrice} × {nights}n</span>
                                    </div>
                                    {!formData.checkOutDate && (
                                        <div className="text-xs text-blue-600">
                                            *Default 1 night stay (checkout date not specified)
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-3 font-medium">
                                        <span>Base Amount</span>
                                        <span className="shrink-0 tabular-nums">₹{(effectiveRoomPrice * nights).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={onClose} className="h-11 w-full sm:w-auto">Cancel</Button>
                            <Button
                                onClick={handleNext}
                                disabled={!selectedRoom || !formData.checkInDate || checkingAvailability || availableRooms.length === 0}
                                className="h-11 w-full sm:w-auto"
                            >
                                Next: Customer
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Customer Details */}
                {activeStep === 2 && (
                    <div className="space-y-6">
                        {/* Customer Search */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Mobile Number *
                            </Label>
                            <div className="relative">
                                <Input
                                    value={formData.customerPhone}
                                    onChange={handlePhoneChange}
                                    placeholder="10-digit mobile number"
                                    maxLength={10}
                                    className={`${isSearchingCustomer ? 'pr-10' : ''} ${validationErrors.customerPhone ? 'border-red-500' : ''}`}
                                />
                                {isSearchingCustomer && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {validationErrors.customerPhone && (
                                <p className="text-sm text-red-500">{validationErrors.customerPhone}</p>
                            )}

                            {/* Customer Suggestions Dropdown */}
                            {showCustomerSearch && foundCustomers.length > 0 && (
                                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto shadow-lg bg-white z-50 mt-1">
                                    {foundCustomers.map((customer) => (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => selectCustomer(customer)}
                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex justify-between items-start transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{customer.name}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                                                    <span>📞 {customer.phone}</span>
                                                    {customer.email && (
                                                        <span className="text-xs">✉️ {customer.email}</span>
                                                    )}
                                                </div>
                                                {customer.id_number && (
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        ID: {customer.id_number} ({customer.id_type})
                                                    </div>
                                                )}
                                                {customer.address && (
                                                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                                                        📍 {[customer.address, customer.city, customer.state].filter(Boolean).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 ml-2">
                                                Existing Customer
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showCustomerSearch && foundCustomers.length === 0 && !isSearchingCustomer && (
                                <div className="border rounded-lg p-4 text-center text-muted-foreground bg-gray-50">
                                    No existing customer found with this number. Please fill in the details below.
                                </div>
                            )}
                        </div>

                        {/* Customer Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Full Name *
                                </Label>
                                <Input
                                    value={formData.customerName}
                                    onChange={e => {
                                        setFormData({ ...formData, customerName: e.target.value });
                                        clearFieldError('customerName');
                                    }}
                                    placeholder="Enter full name"
                                    className={validationErrors.customerName ? 'border-red-500' : ''}
                                />
                                {validationErrors.customerName && (
                                    <p className="text-sm text-red-500">{validationErrors.customerName}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                    <Badge variant="outline" className="text-xs bg-gray-100">Optional</Badge>
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={e => {
                                        setFormData({ ...formData, customerEmail: e.target.value });
                                        clearFieldError('customerEmail');
                                    }}
                                    placeholder="email@example.com"
                                    className={validationErrors.customerEmail ? 'border-red-500' : ''}
                                />
                                {validationErrors.customerEmail && (
                                    <p className="text-sm text-red-500">{validationErrors.customerEmail}</p>
                                )}
                            </div>
                        </div>

                        {/* ID Proof - Now Optional */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>
                                    ID Type
                                    <Badge variant="outline" className="ml-2 text-xs bg-gray-100">Optional</Badge>
                                </Label>
                                <Select
                                    value={formData.idType}
                                    onValueChange={(val: any) => {
                                        setFormData({ ...formData, idType: val });
                                        if (formData.idNumber) clearFieldError('idNumber');
                                    }}
                                >
                                    <SelectTrigger>
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
                            <div className="space-y-2">
                                <Label>
                                    ID Number
                                    <Badge variant="outline" className="ml-2 text-xs bg-gray-100">Optional</Badge>
                                </Label>
                                <Input
                                    value={formData.idNumber}
                                    onChange={e => {
                                        setFormData({ ...formData, idNumber: e.target.value });
                                        clearFieldError('idNumber');
                                    }}
                                    placeholder="Enter ID number (optional)"
                                    className={validationErrors.idNumber ? 'border-red-500' : ''}
                                />
                                {validationErrors.idNumber && (
                                    <p className="text-sm text-red-500">{validationErrors.idNumber}</p>
                                )}
                                {formData.idNumber && !validationErrors.idNumber && (
                                    <p className="text-xs text-muted-foreground">
                                        {formData.idType === 'aadhaar' && 'Aadhaar: 12-digit number'}
                                        {formData.idType === 'pan' && 'PAN: ABCDE1234F format'}
                                        {formData.idType === 'passport' && 'Passport: 8-12 characters'}
                                        {formData.idType === 'driving' && 'Driving License: 10-16 characters'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ID Proof Upload */}
                        <div className="space-y-3">
                            <Label>Upload ID Proof</Label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Upload Images
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {idImages.length} image(s) uploaded
                                </span>
                            </div>

                            {idImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {idImages.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={img} alt="ID" className="w-full h-20 object-cover rounded border" />
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute -top-2 -right-2 h-6 w-6"
                                                onClick={() => removeImage(idx)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-3">
                            <Label>Address (Optional)</Label>
                            <Textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter full address"
                                rows={2}
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <Input
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                                <Input
                                    placeholder="State"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                />
                                <Input
                                    placeholder="Pincode"
                                    value={formData.pincode}
                                    onChange={e => {
                                        setFormData({ ...formData, pincode: e.target.value });
                                        clearFieldError('pincode');
                                    }}
                                    maxLength={6}
                                    className={validationErrors.pincode ? 'border-red-500' : ''}
                                />
                            </div>
                            {validationErrors.pincode && (
                                <p className="text-sm text-red-500">{validationErrors.pincode}</p>
                            )}
                        </div>

                        {/* Customer GST */}
                        <div className="space-y-2">
                            <Label>Customer GST No</Label>
                            <Input
                                value={formData.customerGstNo}
                                onChange={e => {
                                    setFormData({ ...formData, customerGstNo: e.target.value });
                                    clearFieldError('customerGstNo');
                                }}
                                placeholder="GSTIN (e.g., 27AAACH1234M1Z5)"
                                className={validationErrors.customerGstNo ? 'border-red-500' : ''}
                            />
                            {validationErrors.customerGstNo && (
                                <p className="text-sm text-red-500">{validationErrors.customerGstNo}</p>
                            )}
                        </div>

                        {/* Purpose of Visit */}
                        <div className="space-y-2">
                            <Label>Purpose of Visit</Label>
                            <Textarea
                                value={formData.purposeOfVisit}
                                onChange={e => setFormData({ ...formData, purposeOfVisit: e.target.value })}
                                placeholder="Enter purpose of visit"
                                rows={2}
                            />
                        </div>

                        {/* Special Requests */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Special Requests
                            </Label>
                            <Textarea
                                value={formData.specialRequests}
                                onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                                placeholder="Any special requests or requirements"
                                rows={2}
                            />
                        </div>

                        {/* Referral */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Referral By</Label>
                                <Input
                                    value={formData.referralBy}
                                    onChange={e => setFormData({ ...formData, referralBy: e.target.value })}
                                    placeholder="e.g., Friend, Agent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Referral Amount (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.referralAmount}
                                    onChange={e => setFormData({ ...formData, referralAmount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                            <Button variant="outline" onClick={handlePrev} className="h-11 w-full sm:w-auto">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button onClick={handleNext} className="h-11 w-full sm:w-auto">
                                Next: Payment
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Advance Payment */}
                {activeStep === 3 && (
                    <div className="space-y-6">
                        {/* ========== PRICE CONFIGURATION SECTION ========== */}
                        <div className="border rounded-lg p-4 md:p-6 space-y-4 bg-blue-50/50">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                <span>💰 Price Configuration</span>
                                <Badge variant="outline" className="text-xs">
                                    Customizable
                                </Badge>
                            </h4>

                            {/* Room Price Editing */}
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <Label htmlFor="roomPrice" className="flex items-center gap-2 text-sm">
                                            Room Price per Night (₹)
                                        </Label>
                                        <Badge variant="outline" className="text-xs w-fit">
                                            Original: ₹{roomPrice}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <div className="flex-1">
                                            <Input
                                                id="roomPrice"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={roomPriceEditable}
                                                onChange={(e) => setRoomPriceEditable(parseFloat(e.target.value) || 0)}
                                                placeholder="Enter room price per night"
                                                className="text-base md:text-lg font-medium w-full"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRoomPriceEditable(roomPrice)}
                                            className="whitespace-nowrap w-full sm:w-auto"
                                        >
                                            Reset to Original
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Base price: ₹{effectiveRoomPrice} × {nights} night(s) = ₹{charges.baseAmount.toFixed(2)}
                                    </p>
                                </div>

                                {/* Tax Type Selection */}
                                <div className="space-y-3 border-t pt-4">
                                    <Label className="text-sm font-medium">GST Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={taxType === 'cgst_sgst' ? "default" : "outline"}
                                            onClick={() => setTaxType('cgst_sgst')}
                                            className="h-auto py-2 px-2 text-xs sm:text-sm"
                                        >
                                            <div className="text-center">
                                                <div className="font-medium">CGST+SGST</div>
                                                <div className="text-[10px] sm:text-xs opacity-90">Local</div>
                                            </div>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={taxType === 'igst' ? "default" : "outline"}
                                            onClick={() => setTaxType('igst')}
                                            className="h-auto py-2 px-2 text-xs sm:text-sm"
                                        >
                                            <div className="text-center">
                                                <div className="font-medium">IGST</div>
                                                <div className="text-[10px] sm:text-xs opacity-90">Outside</div>
                                            </div>
                                        </Button>
                                    </div>
                                </div>

                                {/* Optional Charges */}
                                <div className="space-y-3 pt-2">
                                    {/* Service Charge */}
                                    <div className="flex flex-col p-3 border rounded-lg bg-white">
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center h-5 pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    id="includeServiceCharge"
                                                    checked={includeServiceCharge}
                                                    onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                                                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor="includeServiceCharge" className="font-medium text-sm cursor-pointer">
                                                    Service Charge
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Hotel service charge
                                                </p>
                                            </div>
                                        </div>

                                        {includeServiceCharge && (
                                            <div className="mt-2 ml-7 space-y-2">
                                                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                                                    <div className="flex items-center gap-2 w-full xs:w-auto">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={Number(useCustomPercentages ? customServicePercentage : hotelSettings.serviceChargePercentage) || 0}
                                                            onChange={(e) => {
                                                                setUseCustomPercentages(true);
                                                                setCustomServicePercentage(Number(e.target.value) || 0);
                                                            }}
                                                            className="w-20 text-sm"
                                                            placeholder="%"
                                                        />
                                                        <span className="text-sm">%</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setUseCustomPercentages(false);
                                                            setCustomServicePercentage(Number(hotelSettings.serviceChargePercentage) || 10);
                                                        }}
                                                        className="text-xs h-8 px-2"
                                                    >
                                                        Reset
                                                    </Button>
                                                </div>
                                                <div className="text-xs text-green-600 font-medium">
                                                    + ₹{Number(charges.serviceCharge).toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CGST + SGST Section */}
                                    {taxType === 'cgst_sgst' && (
                                        <>
                                            {/* CGST */}
                                            <div className="flex flex-col p-3 border rounded-lg bg-white">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center h-5 pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            id="includeCGST"
                                                            checked={includeCGST}
                                                            onChange={(e) => setIncludeCGST(e.target.checked)}
                                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label htmlFor="includeCGST" className="font-medium text-sm cursor-pointer">
                                                            CGST (Central)
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Central GST
                                                        </p>
                                                    </div>
                                                </div>

                                                {includeCGST && (
                                                    <div className="mt-2 ml-7 space-y-2">
                                                        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                                                            <div className="flex items-center gap-2 w-full xs:w-auto">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    value={Number(useCustomPercentages ? customCgstPercentage : hotelSettings.cgstPercentage) || 0}
                                                                    onChange={(e) => {
                                                                        setUseCustomPercentages(true);
                                                                        setCustomCgstPercentage(Number(e.target.value) || 0);
                                                                    }}
                                                                    className="w-20 text-sm"
                                                                    placeholder="%"
                                                                />
                                                                <span className="text-sm">%</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setUseCustomPercentages(false);
                                                                    setCustomCgstPercentage(hotelSettings.cgstPercentage);
                                                                }}
                                                                className="text-xs h-8 px-2"
                                                            >
                                                                Reset
                                                            </Button>
                                                        </div>
                                                        <div className="text-xs text-green-600 font-medium">
                                                            + ₹{charges.cgst.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* SGST */}
                                            <div className="flex flex-col p-3 border rounded-lg bg-white">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center h-5 pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            id="includeSGST"
                                                            checked={includeSGST}
                                                            onChange={(e) => setIncludeSGST(e.target.checked)}
                                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label htmlFor="includeSGST" className="font-medium text-sm cursor-pointer">
                                                            SGST (State)
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            State GST
                                                        </p>
                                                    </div>
                                                </div>

                                                {includeSGST && (
                                                    <div className="mt-2 ml-7 space-y-2">
                                                        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                                                            <div className="flex items-center gap-2 w-full xs:w-auto">
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
                                                                    className="w-20 text-sm"
                                                                    placeholder="%"
                                                                />
                                                                <span className="text-sm">%</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setUseCustomPercentages(false);
                                                                    setCustomSgstPercentage(hotelSettings.sgstPercentage);
                                                                }}
                                                                className="text-xs h-8 px-2"
                                                            >
                                                                Reset
                                                            </Button>
                                                        </div>
                                                        <div className="text-xs text-green-600 font-medium">
                                                            + ₹{charges.sgst.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* IGST Section */}
                                    {taxType === 'igst' && (
                                        <div className="flex flex-col p-3 border rounded-lg bg-white">
                                            <div className="flex items-start gap-3">
                                                <div className="flex items-center h-5 pt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        id="includeIGST"
                                                        checked={includeIGST}
                                                        onChange={(e) => setIncludeIGST(e.target.checked)}
                                                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor="includeIGST" className="font-medium text-sm cursor-pointer">
                                                        IGST (Integrated)
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        For inter-state transactions
                                                    </p>
                                                </div>
                                            </div>

                                            {includeIGST && (
                                                <div className="mt-2 ml-7 space-y-2">
                                                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                                                        <div className="flex items-center gap-2 w-full xs:w-auto">
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
                                                                className="w-20 text-sm"
                                                                placeholder="%"
                                                            />
                                                            <span className="text-sm">%</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setUseCustomPercentages(false);
                                                                setCustomIgstPercentage(hotelSettings.igstPercentage);
                                                            }}
                                                            className="text-xs h-8 px-2"
                                                        >
                                                            Reset
                                                        </Button>
                                                    </div>
                                                    <div className="text-xs text-green-600 font-medium">
                                                        + ₹{charges.igst.toFixed(2)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex flex-col xs:flex-row gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
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
                                            setCustomCgstPercentage(hotelSettings.cgstPercentage);
                                            setCustomSgstPercentage(hotelSettings.sgstPercentage);
                                            setCustomIgstPercentage(hotelSettings.igstPercentage);
                                        }}
                                        className="flex-1 text-xs sm:text-sm"
                                    >
                                        Include All (Default)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIncludeServiceCharge(false);
                                            setIncludeCGST(false);
                                            setIncludeSGST(false);
                                            setIncludeIGST(false);
                                        }}
                                        className="flex-1 text-xs sm:text-sm"
                                    >
                                        Remove All
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* ========== PRICE SUMMARY ========== */}
                        <div className="border rounded-lg p-6 space-y-3 bg-muted/50">
                            <h4 className="font-semibold text-lg">Price Summary</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Room Price (₹{Number(effectiveRoomPrice).toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'})</span>
                                    <span>₹{Number(charges.baseAmount).toFixed(2)}</span>
                                </div>

                                {includeServiceCharge && (
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-2">
                                            Service Charge ({Number(charges.serviceChargePercentage).toFixed(2)}%)
                                        </span>
                                        <span>₹{Number(charges.serviceCharge).toFixed(2)}</span>
                                    </div>
                                )}

                                {taxType === 'cgst_sgst' && (
                                    <>
                                        {includeCGST && (
                                            <div className="flex justify-between">
                                                <span className="flex items-center gap-2">
                                                    CGST ({Number(charges.cgstPercentage).toFixed(2)}%)
                                                </span>
                                                <span>₹{Number(charges.cgst).toFixed(2)}</span>
                                            </div>
                                        )}

                                        {includeSGST && (
                                            <div className="flex justify-between">
                                                <span className="flex items-center gap-2">
                                                    SGST ({Number(charges.sgstPercentage).toFixed(2)}%)
                                                </span>
                                                <span>₹{Number(charges.sgst).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {taxType === 'igst' && includeIGST && (
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-2">
                                            IGST ({Number(charges.igstPercentage).toFixed(2)}%)
                                        </span>
                                        <span>₹{Number(charges.igst).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total Amount</span>
                                        <span className="text-green-600">₹{Number(charges.total).toFixed(2)}</span>
                                    </div>
                                    {!formData.checkOutDate && (
                                        <div className="text-sm text-blue-600 mt-1">
                                            *Based on default 1 night stay
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Advance Payment Section */}
                        <div className="space-y-4">
                            <Label className="text-lg font-medium">Advance Payment</Label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Advance Amount (₹) *</Label>
                                    <Input
                                        type="number"
                                        value={advanceAmount || ''}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setAdvanceAmount(val);
                                            clearFieldError('advanceAmount');
                                            if (val >= charges.total) {
                                                setAdvancePaymentStatus('completed');
                                            } else if (val > 0) {
                                                setAdvancePaymentStatus('partial');
                                            }
                                        }}
                                        min="0"
                                        max={charges.total}
                                        step="100"
                                        placeholder="Enter advance amount"
                                        className={validationErrors.advanceAmount ? 'border-red-500' : ''}
                                    />
                                    {validationErrors.advanceAmount && (
                                        <p className="text-sm text-red-500">{validationErrors.advanceAmount}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Minimum: ₹{(charges.total * 0.1).toFixed(2)} (10% of total)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Expiry Days</Label>
                                    <Select
                                        value={expiryDays.toString()}
                                        onValueChange={(val) => setExpiryDays(parseInt(val))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 Days</SelectItem>
                                            <SelectItem value="30">30 Days</SelectItem>
                                            <SelectItem value="45">45 Days</SelectItem>
                                            <SelectItem value="60">60 Days</SelectItem>
                                            <SelectItem value="90">90 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={advancePaymentMethod === 'cash' ? 'default' : 'outline'}
                                    className="h-20 flex flex-col items-center justify-center"
                                    onClick={() => setAdvancePaymentMethod('cash')}
                                >
                                    <Wallet className="h-5 w-5 mb-1" />
                                    <span>Cash</span>
                                    <span className="text-xs text-muted-foreground">Pay at hotel</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant={advancePaymentMethod === 'online' ? 'default' : 'outline'}
                                    className="h-20 flex flex-col items-center justify-center"
                                    onClick={() => {
                                        setAdvancePaymentMethod('online');
                                        if (!qrCodeData) generateQRCode();
                                    }}
                                    disabled={isGeneratingQR}
                                >
                                    {isGeneratingQR ? (
                                        <Loader2 className="h-5 w-5 mb-1 animate-spin" />
                                    ) : (
                                        <QrCode className="h-5 w-5 mb-1" />
                                    )}
                                    <span>Online</span>
                                    <span className="text-xs text-muted-foreground">Pay now</span>
                                </Button>
                            </div>

                            {validationErrors.payment && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{validationErrors.payment}</AlertDescription>
                                </Alert>
                            )}

                            {advancePaymentMethod === 'online' && (
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
                                                                e.currentTarget.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(qrCodeData);
                                                                e.currentTarget.alt = 'UPI QR Code for Payment';
                                                            }}
                                                        />
                                                        <div className="mt-3 text-center">
                                                            <div className="text-sm font-medium mb-1">
                                                                Amount: <span className="text-lg font-bold text-green-600">₹{advanceAmount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-2">
                                                                Scan to pay advance amount
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`}
                                                            alt="Payment QR"
                                                            className="w-48 h-48 object-contain mx-auto"
                                                        />
                                                        <div className="mt-3 text-center">
                                                            <div className="text-sm font-medium mb-1">
                                                                Amount: <span className="text-lg font-bold text-green-600">₹{advanceAmount.toFixed(2)}</span>
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
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-medium text-primary">1</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">Scan QR Code</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Use any UPI app to scan the QR code
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
                                                            Amount is pre-filled: <strong>₹{advanceAmount.toFixed(2)}</strong>
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
                                                            Enter your UPI PIN to complete
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
                                                            Click "I have made the payment" below
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mt-6">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Payment Status:</span>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${advancePaymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                                        advancePaymentStatus === 'partial' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {advancePaymentStatus === 'completed' ? '✅ Completed' :
                                                            advancePaymentStatus === 'partial' ? '⏳ Partial' :
                                                                '🔄 Pending'}
                                                    </div>
                                                </div>

                                                {advancePaymentStatus !== 'completed' && (
                                                    <Button
                                                        onClick={verifyPayment}
                                                        disabled={isVerifyingPayment}
                                                        className="w-full"
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
                                                )}

                                                {advancePaymentStatus === 'completed' && (
                                                    <Alert className="bg-green-50 border-green-200">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <AlertDescription className="text-green-700 font-medium">
                                                            ✅ Payment Verified Successfully!
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {advancePaymentMethod === 'cash' && (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        You will pay ₹{advanceAmount.toFixed(2)} at the hotel reception.
                                        Balance of ₹{(charges.total - advanceAmount).toFixed(2)} to be paid at check-in.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Payment Summary */}
                        <div className="border-t pt-4">
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="shrink min-w-0">Total Booking</span>
                                    <span className="shrink-0 font-bold tabular-nums">₹{charges.total.toFixed(2)}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3 text-green-600">
                                    <span className="shrink min-w-0">Advance Paid</span>
                                    <span className="shrink-0 font-bold tabular-nums">₹{advanceAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3 border-t pt-2 text-orange-600">
                                    <span className="shrink min-w-0">Balance at Check-in</span>
                                    <span className="shrink-0 font-bold tabular-nums">₹{(charges.total - advanceAmount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                            <Button variant="outline" onClick={handlePrev} className="h-11 w-full sm:w-auto">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || advanceAmount <= 0 || advanceAmount > charges.total || (advancePaymentMethod === 'online' && advancePaymentStatus !== 'completed')}
                                className="h-11 w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Create Advance Booking
                                    </>
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