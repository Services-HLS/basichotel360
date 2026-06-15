
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchCustomersByPhone } from '@/lib/bookingApi';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bed,
  Trash2,
  Plus,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  FileImage,
  XCircle,
  QrCode,
  Info,
  Percent,
  Gift,
  X,
  Upload,
  Tag
} from 'lucide-react';

interface Room {
  roomId: string;
  number: string | number;
  type: string;
  floor: string | number;
  price: number;
  maxOccupancy?: number;
}

interface MultiRoomBookingFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRooms: Room[];
  userSource: string;
  spreadsheetId?: string;
  defaultDate?: Date;
  initialCustomerData?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    idType: string;
    idNumber: string;
  };
  existingAdvanceBookings?: any[];
  isGroupConversion?: boolean;
  groupId?: string;
}

interface RoomAvailability {
  [roomId: string]: {
    available: boolean;
    conflictBooking?: {
      id: number;
      customer_name?: string;
      from_date: string;
      to_date: string;
    };
    checking: boolean;
  };
}

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function MultiRoomBookingForm({
  open,
  onClose,
  onSuccess,
  selectedRooms,
  userSource,
  spreadsheetId,
  defaultDate = new Date(),
  initialCustomerData,
  existingAdvanceBookings,
  isGroupConversion,
  groupId: propGroupId,
}: MultiRoomBookingFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer search state
  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [hotelQRCode, setHotelQRCode] = useState<string | null>(null);

  // Room availability state
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availableRoomsCount, setAvailableRoomsCount] = useState(0);

  // Common customer details
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    idType: 'aadhaar',
    idNumber: '',
    specialRequests: ''
  });

  // DISCOUNT STATE - Updated for both percentage and amount
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [customDiscountPercentage, setCustomDiscountPercentage] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(500);
  const [customDiscountAmount, setCustomDiscountAmount] = useState(500);
  const [useCustomDiscount, setUseCustomDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountDescription, setDiscountDescription] = useState('Special Discount');
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  // PER-ROOM DISCOUNT STATE
  const [roomDiscounts, setRoomDiscounts] = useState<Record<string, {
    percentage: number;
    isCustom: boolean;
    isFixedAmount?: boolean;
    fixedAmountValue?: number;
  }>>({});
  const [showCustomRoomDiscount, setShowCustomRoomDiscount] = useState<Record<string, boolean | 'price'>>({});
  const [customRoomDiscountValue, setCustomRoomDiscountValue] = useState<Record<string, number>>({});

  const [idImages, setIdImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDateSafely = (dateInput: Date | string | undefined): Date => {
    if (!dateInput) return new Date();

    try {
      if (dateInput instanceof Date) {
        if (!isNaN(dateInput.getTime())) {
          return new Date(dateInput);
        }
        return new Date();
      }

      if (typeof dateInput === 'string') {
        if (dateInput.includes('T')) {
          const date = new Date(dateInput);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }

        if (dateInput.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [year, month, day] = dateInput.split('-').map(Number);
          if (year && month && day) {
            return new Date(year, month - 1, day);
          }
        }
      }

      return new Date();
    } catch (error) {
      console.error('Error parsing date:', dateInput, error);
      return new Date();
    }
  };

  const [bookingDetails, setBookingDetails] = useState(() => {
    const checkIn = parseDateSafely(defaultDate);

    let checkOut: Date;

    if (existingAdvanceBookings && existingAdvanceBookings.length > 0) {
      const advanceCheckout = existingAdvanceBookings[0]?.to_date;
      if (advanceCheckout) {
        const parsedCheckout = parseDateSafely(advanceCheckout);
        if (parsedCheckout && !isNaN(parsedCheckout.getTime())) {
          checkOut = parsedCheckout;
        } else {
          checkOut = new Date(checkIn);
          checkOut.setDate(checkOut.getDate() + 1);
        }
      } else {
        checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1);
      }
    } else {
      checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
    }

    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      checkInDate: formatLocalDate(checkIn),
      checkOutDate: formatLocalDate(checkOut),
      checkInTime: '14:00',
      checkOutTime: '12:00',
      paymentMethod: 'cash' as 'cash' | 'online',
      paymentStatus: 'completed' as 'pending' | 'completed'
    };
  });

  const [roomConfigs, setRoomConfigs] = useState<Record<string, {
    price: number;
    guests: number;
    includeServiceCharge: boolean;
    includeCGST: boolean;
    includeSGST: boolean;
    includeIGST: boolean;
    servicePercentage: number;
    cgstPercentage: number;
    sgstPercentage: number;
    igstPercentage: number;
  }>>({});

  const [hotelSettings, setHotelSettings] = useState({
    serviceChargePercentage: 10,
    cgstPercentage: 6,
    sgstPercentage: 6,
    igstPercentage: 12
  });

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
                serviceChargePercentage: data.data.serviceChargePercentage || 10,
                cgstPercentage: data.data.cgstPercentage || 6,
                sgstPercentage: data.data.sgstPercentage || 6,
                igstPercentage: data.data.igstPercentage || 12
              });

              if (data.data.qrcode_image) {
                setHotelQRCode(data.data.qrcode_image);
              }
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
    if (existingAdvanceBookings && existingAdvanceBookings.length > 0) {
      console.log('📦 MultiRoomBookingForm received advance bookings:', existingAdvanceBookings);
    }
  }, [existingAdvanceBookings]);

  useEffect(() => {
    if (paymentMethod === 'cash') {
      setPaymentStatus('completed');
      setBookingDetails(prev => ({ ...prev, paymentStatus: 'completed' }));
    }
  }, [paymentMethod]);

  useEffect(() => {
    const configs: any = {};
    selectedRooms.forEach(room => {
      configs[room.roomId] = {
        price: room.price,
        guests: 1,
        includeServiceCharge: true,
        includeCGST: true,
        includeSGST: true,
        includeIGST: false,
        servicePercentage: hotelSettings.serviceChargePercentage,
        cgstPercentage: hotelSettings.cgstPercentage,
        sgstPercentage: hotelSettings.sgstPercentage,
        igstPercentage: hotelSettings.igstPercentage
      };
    });
    setRoomConfigs(configs);
  }, [selectedRooms, hotelSettings]);

  useEffect(() => {
    if (userSource === 'database' && bookingDetails.checkInDate && bookingDetails.checkOutDate) {
      checkAllRoomsAvailability();
    }
  }, [bookingDetails.checkInDate, bookingDetails.checkOutDate, selectedRooms]);

  const generateUPIQrCode = async () => {
    setIsGeneratingQR(true);
    try {
      const upiId = 'test@example';
      const merchantName = 'Hotel Management';
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(transactionId)}`;
      setQrCodeData(upiString);

      localStorage.setItem('currentTransaction', JSON.stringify({
        id: transactionId,
        amount: grandTotal,
        timestamp: Date.now(),
        testMode: true
      }));

      toast({
        title: "QR Code Generated",
        description: `Scan to pay ₹${grandTotal.toFixed(2)}`,
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
      setBookingDetails(prev => ({ ...prev, paymentStatus: 'completed' }));

      toast({
        title: "✅ Payment Successful",
        description: "Payment verified successfully!",
        variant: "default"
      });

      setIsVerifyingPayment(false);
    }, 2000);
  };

  const checkAllRoomsAvailability = async () => {
    setIsCheckingAvailability(true);

    const initialAvailability: RoomAvailability = {};
    selectedRooms.forEach(room => {
      initialAvailability[room.roomId] = {
        available: true,
        checking: true
      };
    });
    setRoomAvailability(initialAvailability);

    const token = localStorage.getItem('authToken');
    let availableCount = 0;

    for (const room of selectedRooms) {
      try {
        const response = await fetch(`${NODE_BACKEND_URL}/bookings/check-availability`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            room_id: parseInt(room.roomId),
            from_date: bookingDetails.checkInDate,
            to_date: bookingDetails.checkOutDate
          })
        });

        const result = await response.json();

        setRoomAvailability(prev => ({
          ...prev,
          [room.roomId]: {
            available: result.data?.available || false,
            checking: false
          }
        }));

        if (result.data?.available) {
          availableCount++;
        }
      } catch (error) {
        console.error(`Error checking room ${room.roomId}:`, error);
        setRoomAvailability(prev => ({
          ...prev,
          [room.roomId]: {
            available: false,
            checking: false
          }
        }));
      }
    }

    setAvailableRoomsCount(availableCount);
    setIsCheckingAvailability(false);
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawPhone = e.target.value;
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const limitedPhone = digitsOnly.slice(0, 10);

    setCustomerData({ ...customerData, phone: limitedPhone });

    if (limitedPhone.length === 10 && userSource === 'database') {
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
    setCustomerData({
      ...customerData,
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      idType: customer.id_type || customer.idType || 'aadhaar',
      idNumber: customer.id_number || customer.idNumber || ''
    });
    setShowCustomerSearch(false);
    setFoundCustomers([]);

    toast({
      title: "Customer Selected",
      description: `Details loaded for ${customer.name}`,
    });
  };

  const nights = (() => {
    if (!bookingDetails.checkInDate || !bookingDetails.checkOutDate) return 0;
    const checkIn = new Date(bookingDetails.checkInDate);
    const checkOut = new Date(bookingDetails.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  })();

  // NOTE: Discount applies ONLY to the room amount. Taxes (Service, CGST, SGST, IGST)
  // are always calculated on the ORIGINAL room amount (price * nights) so the tax
  // value does not change when a discount is given.
  const calculateRoomTotal = (roomId: string) => {
    const config = roomConfigs[roomId];
    if (!config) return 0;

    const baseAmount = config.price * nights;
    let discountedAmount = baseAmount;

    if (discountApplied) {
      if (discountType === 'percentage') {
        const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
        discountedAmount = discountedAmount * (1 - discountPercent / 100);
      } else {
        const totalSubtotal = selectedRooms.reduce((total, room) =>
          total + (roomConfigs[room.roomId]?.price * nights || 0), 0);
        if (totalSubtotal > 0) {
          const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
          const roomProportion = baseAmount / totalSubtotal;
          discountedAmount = discountedAmount - (discountAmt * roomProportion);
        }
      }
    }

    if (roomDiscounts[roomId]) {
      const discount = roomDiscounts[roomId];

      if (discount.isFixedAmount && discount.fixedAmountValue) {
        discountedAmount = discountedAmount - discount.fixedAmountValue;
      } else {
        discountedAmount = discountedAmount * (1 - discount.percentage / 100);
      }
    }

    if (discountedAmount < 0) discountedAmount = 0;

    const serviceCharge = config.includeServiceCharge
      ? (baseAmount * config.servicePercentage) / 100
      : 0;

    const cgst = config.includeCGST
      ? (baseAmount * config.cgstPercentage) / 100
      : 0;

    const sgst = config.includeSGST
      ? (baseAmount * config.sgstPercentage) / 100
      : 0;

    const igst = config.includeIGST
      ? (baseAmount * config.igstPercentage) / 100
      : 0;

    return discountedAmount + serviceCharge + cgst + sgst + igst;
  };

  // Total assuming NO per-room discount (still applies global discount + taxes on original base).
  // Used in the UI for "you saved" comparisons.
  const calculateOriginalRoomTotal = (roomId: string) => {
    const config = roomConfigs[roomId];
    if (!config) return 0;

    const baseAmount = config.price * nights;
    let discountedAmount = baseAmount;

    if (discountApplied) {
      if (discountType === 'percentage') {
        const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
        discountedAmount = discountedAmount * (1 - discountPercent / 100);
      } else {
        const totalSubtotal = selectedRooms.reduce((total, room) =>
          total + (roomConfigs[room.roomId]?.price * nights || 0), 0);
        if (totalSubtotal > 0) {
          const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
          const roomProportion = baseAmount / totalSubtotal;
          discountedAmount = discountedAmount - (discountAmt * roomProportion);
        }
      }
    }

    if (discountedAmount < 0) discountedAmount = 0;

    const serviceCharge = config.includeServiceCharge
      ? (baseAmount * config.servicePercentage) / 100
      : 0;
    const cgst = config.includeCGST
      ? (baseAmount * config.cgstPercentage) / 100
      : 0;
    const sgst = config.includeSGST
      ? (baseAmount * config.sgstPercentage) / 100
      : 0;
    const igst = config.includeIGST
      ? (baseAmount * config.igstPercentage) / 100
      : 0;

    return discountedAmount + serviceCharge + cgst + sgst + igst;
  };

  const applyRoomDiscount = (roomId: string, roomNumber: string | number, percentage: number) => {
    setRoomDiscounts(prev => ({
      ...prev,
      [roomId]: { percentage, isCustom: false, isFixedAmount: false }
    }));

    setShowCustomRoomDiscount(prev => ({ ...prev, [roomId]: false }));

    toast({
      title: "Discount Applied",
      description: `${percentage}% discount applied to Room ${roomNumber}`,
    });
  };

  const applyFixedAmountDiscount = (roomId: string, roomNumber: string | number) => {
    const fixedAmount = customRoomDiscountValue[roomId];

    if (!fixedAmount || fixedAmount <= 0) {
      toast({
        title: "Invalid Discount",
        description: "Discount amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    const config = roomConfigs[roomId];
    let originalRoomTotal = config.price * nights;

    if (discountApplied) {
      if (discountType === 'percentage') {
        const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
        originalRoomTotal = originalRoomTotal * (1 - discountPercent / 100);
      } else {
        const totalSubtotal = selectedRooms.reduce((total, room) =>
          total + (roomConfigs[room.roomId]?.price * nights || 0), 0);
        const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
        const roomProportion = (config.price * nights) / totalSubtotal;
        originalRoomTotal = originalRoomTotal - (discountAmt * roomProportion);
      }
    }

    if (fixedAmount >= originalRoomTotal) {
      toast({
        title: "Invalid Discount",
        description: "Discount amount cannot exceed the room total",
        variant: "destructive"
      });
      return;
    }

    const percentageEquivalent = (fixedAmount / originalRoomTotal) * 100;

    setRoomDiscounts(prev => ({
      ...prev,
      [roomId]: {
        percentage: percentageEquivalent,
        isCustom: true,
        isFixedAmount: true,
        fixedAmountValue: fixedAmount
      }
    }));

    setShowCustomRoomDiscount(prev => ({ ...prev, [roomId]: false }));

    toast({
      title: "Fixed Amount Discount Applied",
      description: `₹${fixedAmount.toFixed(2)} discount applied to Room ${roomNumber} (${percentageEquivalent.toFixed(1)}% off)`,
    });
  };

  const showCustomDiscountInput = (roomId: string, type: 'percentage' | 'price' = 'percentage') => {
    setShowCustomRoomDiscount(prev => ({ ...prev, [roomId]: type === 'percentage' ? true : 'price' }));
    if (!customRoomDiscountValue[roomId]) {
      setCustomRoomDiscountValue(prev => ({ ...prev, [roomId]: type === 'percentage' ? 10 : 100 }));
    }
  };

  const applyCustomRoomDiscount = (roomId: string, roomNumber: string | number) => {
    const customPercentage = customRoomDiscountValue[roomId];

    if (!customPercentage || customPercentage <= 0) {
      toast({
        title: "Invalid Discount",
        description: "Discount percentage must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (customPercentage > 100) {
      toast({
        title: "Invalid Discount",
        description: "Discount percentage cannot exceed 100%",
        variant: "destructive"
      });
      return;
    }

    setRoomDiscounts(prev => ({
      ...prev,
      [roomId]: { percentage: customPercentage, isCustom: true, isFixedAmount: false }
    }));

    setShowCustomRoomDiscount(prev => ({ ...prev, [roomId]: false }));

    toast({
      title: "Custom Discount Applied",
      description: `${customPercentage}% discount applied to Room ${roomNumber}`,
    });
  };

  const removeRoomDiscount = (roomId: string, roomNumber: string | number) => {
    setRoomDiscounts(prev => {
      const newState = { ...prev };
      delete newState[roomId];
      return newState;
    });

    toast({
      title: "Discount Removed",
      description: `Discount removed from Room ${roomNumber}`,
    });
  };

  const cancelCustomDiscount = (roomId: string) => {
    setShowCustomRoomDiscount(prev => ({ ...prev, [roomId]: false }));
  };

  const getRoomRemainingAfterAdvance = (room: Room) => {
    const roomTotal = calculateRoomTotal(room.roomId);

    const existingAdvance = existingAdvanceBookings?.find(adv => {
      if (adv.room_number && room.number) {
        if (String(adv.room_number) === String(room.number)) {
          return true;
        }
      }
      if (adv.room_id && room.roomId) {
        if (String(adv.room_id) === String(room.roomId)) {
          return true;
        }
      }
      return false;
    });

    const advanceAmount = existingAdvance?.advance_amount || 0;
    const advanceId = existingAdvance?.id || null;

    return {
      roomTotal,
      advanceAmount,
      advanceId,
      remainingAmount: Math.max(0, roomTotal - advanceAmount)
    };
  };

  const grandTotal = selectedRooms.reduce((total, room) => {
    if (roomAvailability[room.roomId]?.available === false) return total;
    return total + calculateRoomTotal(room.roomId);
  }, 0);

  const applyDiscountToAllRooms = () => {
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

      setDiscountApplied(true);
      setShowDiscountInput(false);

      toast({
        title: "🎉 Discount Applied!",
        description: `${discountPercent}% discount applied to all rooms.`,
        variant: "default"
      });
    } else {
      const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
      const subtotal = selectedRooms.reduce(
        (total, room) => total + (roomConfigs[room.roomId]?.price * nights || 0),
        0
      );

      if (discountAmt <= 0) {
        toast({
          title: "Invalid Discount",
          description: "Discount amount must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      if (discountAmt >= subtotal) {
        toast({
          title: "Invalid Discount",
          description: "Discount amount cannot exceed the total amount",
          variant: "destructive"
        });
        return;
      }

      setDiscountApplied(true);
      setShowDiscountInput(false);

      toast({
        title: "🎉 Discount Applied!",
        description: `₹${discountAmt} discount applied to all rooms.`,
        variant: "default"
      });
    }
  };

  const removeDiscountFromAllRooms = () => {
    setDiscountApplied(false);
    setUseCustomDiscount(false);
    setCustomDiscountPercentage(10);
    setDiscountPercentage(10);
    setDiscountAmount(500);
    setCustomDiscountAmount(500);
    setDiscountType('percentage');

    toast({
      title: "Discount Removed",
      description: "Discount has been removed from all rooms",
      variant: "default"
    });
  };

  const updateRoomConfig = (roomId: string, field: string, value: any) => {
    setRoomConfigs(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    if (!customerData.name.trim()) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return false;
    }
    if (!customerData.phone.trim() || customerData.phone.length < 10) {
      toast({ title: "Error", description: "Valid phone number is required", variant: "destructive" });
      return false;
    }
    if (!bookingDetails.checkInDate || !bookingDetails.checkOutDate) {
      toast({ title: "Error", description: "Check-in and check-out dates are required", variant: "destructive" });
      return false;
    }

    const unavailableRooms = selectedRooms.filter(room =>
      roomAvailability[room.roomId]?.available === false
    );

    if (unavailableRooms.length > 0) {
      toast({
        title: "Error",
        description: `${unavailableRooms.length} room(s) are not available for selected dates`,
        variant: "destructive"
      });
      return false;
    }

    if (paymentMethod === 'online' && paymentStatus !== 'completed') {
      toast({
        title: "Payment Required",
        description: "Please complete online payment before confirming",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (initialCustomerData) {
      setCustomerData({
        name: initialCustomerData.name || '',
        phone: initialCustomerData.phone || '',
        email: initialCustomerData.email || '',
        address: initialCustomerData.address || '',
        city: initialCustomerData.city || '',
        state: initialCustomerData.state || '',
        pincode: initialCustomerData.pincode || '',
        idType: initialCustomerData.idType || 'aadhaar',
        idNumber: initialCustomerData.idNumber || '',
        specialRequests: ''
      });
    }
  }, [initialCustomerData]);

  const submitToDatabase = async () => {
    const token = localStorage.getItem('authToken');
    const groupId = propGroupId || `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const bookings = selectedRooms
      .filter(room => roomAvailability[room.roomId]?.available !== false)
      .map((room) => {
        const config = roomConfigs[room.roomId];
        const originalPricePerNight = config.price;
        const nightsValue = nights;

        const originalRoomTotal = originalPricePerNight * nightsValue;
        let runningRoomAmount = originalRoomTotal;
        let discountAmountValue = 0;

        if (discountApplied) {
          if (discountType === 'percentage') {
            const pct = useCustomDiscount ? customDiscountPercentage : discountPercentage;
            const amt = (runningRoomAmount * pct) / 100;
            discountAmountValue += amt;
            runningRoomAmount -= amt;
          } else {
            const totalSubtotal = selectedRooms.reduce((total, r) =>
              total + (roomConfigs[r.roomId]?.price * nightsValue || 0), 0);
            const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
            const roomProportion = totalSubtotal > 0 ? (config.price * nightsValue) / totalSubtotal : 0;
            const roomDiscountAmt = discountAmt * roomProportion;
            discountAmountValue += roomDiscountAmt;
            runningRoomAmount -= roomDiscountAmt;
          }
        }

        if (roomDiscounts[room.roomId]) {
          const roomDiscount = roomDiscounts[room.roomId];
          if (roomDiscount.isFixedAmount && roomDiscount.fixedAmountValue) {
            discountAmountValue += roomDiscount.fixedAmountValue;
            runningRoomAmount -= roomDiscount.fixedAmountValue;
          } else {
            const roomDiscountAmount = (runningRoomAmount * roomDiscount.percentage) / 100;
            discountAmountValue += roomDiscountAmount;
            runningRoomAmount -= roomDiscountAmount;
          }
        }

        const discountedRoomAmount = Math.max(0, runningRoomAmount);
        const discountPercentageValue = originalRoomTotal > 0
          ? (discountAmountValue / originalRoomTotal) * 100
          : 0;

        const serviceCharge = config.includeServiceCharge
          ? (originalRoomTotal * config.servicePercentage) / 100
          : 0;
        const cgst = config.includeCGST
          ? (originalRoomTotal * config.cgstPercentage) / 100
          : 0;
        const sgst = config.includeSGST
          ? (originalRoomTotal * config.sgstPercentage) / 100
          : 0;
        const igst = config.includeIGST
          ? (originalRoomTotal * config.igstPercentage) / 100
          : 0;

        const totalWithTax = discountedRoomAmount + serviceCharge + cgst + sgst + igst;

        const { advanceAmount, advanceId } = getRoomRemainingAfterAdvance(room);
        const remainingAmount = Math.max(0, totalWithTax - advanceAmount);

        let transactionId = null;
        if (paymentMethod === 'online') {
          transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}-${room.roomId}`;
        }

        return {
          room_id: parseInt(room.roomId),
          customer_name: customerData.name,
          customer_phone: customerData.phone,
          customer_email: customerData.email,
          from_date: bookingDetails.checkInDate,
          to_date: bookingDetails.checkOutDate,
          from_time: bookingDetails.checkInTime,
          to_time: bookingDetails.checkOutTime,
          amount: discountedRoomAmount,
          service: serviceCharge,
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          total: totalWithTax,
          advance_amount_paid: advanceAmount,
          remaining_amount: remainingAmount,
          guests: config.guests,
          special_requests: customerData.specialRequests,
          id_type: customerData.idType,
          id_number: customerData.idNumber,
          id_image: idImages.length > 0 ? idImages[0] : null,
          id_image2: idImages.length > 1 ? idImages[1] : null,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'completed' : 'pending',
          transaction_id: transactionId,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          pincode: customerData.pincode,
          original_amount: originalPricePerNight * nightsValue,
          discount_percentage: discountPercentageValue,
          discount_amount: discountAmountValue,
          advance_booking_id: advanceId || null,
          is_conversion: !!advanceId
        };
      });

    let endpoint;
    if (isGroupConversion && existingAdvanceBookings?.length) {
      endpoint = `${NODE_BACKEND_URL}/advance-bookings/multiple/convert`;
    } else {
      endpoint = `${NODE_BACKEND_URL}/bookings/multiple`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookings,
        groupBookingId: groupId,
        isGroupConversion: !!isGroupConversion,
        conversionPaymentMethod: paymentMethod,
        conversionPaymentStatus: paymentMethod === 'cash' ? 'completed' : 'pending',
        hotelId: JSON.parse(localStorage.getItem('currentUser') || '{}').hotel_id
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create bookings');
    }
    return await response.json();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (userSource === 'database') {
        const result = await submitToDatabase();

        if (existingAdvanceBookings?.length) {
          toast({
            title: "✅ Group Converted Successfully!",
            description: `${result.data.totalSuccess} rooms converted from advance bookings. Advance payments applied.`,
          });
        } else {
          toast({
            title: "✅ Success!",
            description: `${result.data.totalSuccess} rooms booked successfully`,
          });
        }

        onSuccess();
        onClose();
      } else {
        toast({
          title: "Coming Soon",
          description: "Multiple booking for Google Sheets coming soon",
        });
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bookings",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoomStatus = (room: Room) => {
    const availability = roomAvailability[room.roomId];

    if (!availability || availability.checking) {
      return {
        label: 'Checking...',
        color: 'bg-gray-100 text-gray-600',
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        disabled: true
      };
    }

    if (!availability.available) {
      return {
        label: 'Not Available',
        color: 'bg-red-100 text-red-600 border-red-200',
        icon: <XCircle className="h-4 w-4" />,
        disabled: true
      };
    }

    return {
      label: 'Available',
      color: 'bg-green-100 text-green-600 border-green-200',
      icon: <CheckCircle className="h-4 w-4" />,
      disabled: false
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Bed className="h-6 w-6" />
            Book Multiple Rooms ({selectedRooms.length} rooms)
          </DialogTitle>

          <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
            {!discountApplied ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Gift className="h-4 w-4" />
                Apply Discount to All Rooms
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={removeDiscountFromAllRooms}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Remove Discount ({discountType === 'percentage'
                  ? `${discountApplied ? (useCustomDiscount ? customDiscountPercentage : discountPercentage) : 0}%`
                  : `₹${discountApplied ? (useCustomDiscount ? customDiscountAmount : discountAmount) : 0}`
                })
              </Button>
            )}
          </div>

          {showDiscountInput && !discountApplied && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Apply Discount to All Rooms</h4>
              </div>

              <div className="flex gap-2 mb-4 bg-white rounded-lg p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-4 py-2 text-sm rounded-md transition-all ${discountType === 'percentage'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`px-4 py-2 text-sm rounded-md transition-all ${discountType === 'amount'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Fixed Amount (₹)
                </button>
              </div>

              <div className="space-y-3">
                {discountType === 'percentage' && (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant={!useCustomDiscount && discountPercentage === 10 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(false);
                          setDiscountPercentage(10);
                        }}
                        className="flex-1"
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
                        className="flex-1"
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
                        className="flex-1"
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
                        className="flex-1"
                      >
                        Custom
                      </Button>
                    </div>

                    {useCustomDiscount && (
                      <div className="flex items-center gap-3">
                        <Label htmlFor="customDiscountMulti" className="whitespace-nowrap">
                          Discount Percentage:
                        </Label>
                        <div className="relative flex-1">
                          <Input
                            id="customDiscountMulti"
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
                  </>
                )}

                {discountType === 'amount' && (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant={!useCustomDiscount && discountAmount === 500 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(false);
                          setDiscountAmount(500);
                        }}
                        className="flex-1"
                      >
                        ₹500 OFF
                      </Button>
                      <Button
                        type="button"
                        variant={!useCustomDiscount && discountAmount === 1000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(false);
                          setDiscountAmount(1000);
                        }}
                        className="flex-1"
                      >
                        ₹1000 OFF
                      </Button>
                      <Button
                        type="button"
                        variant={!useCustomDiscount && discountAmount === 1500 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(false);
                          setDiscountAmount(1500);
                        }}
                        className="flex-1"
                      >
                        ₹1500 OFF
                      </Button>
                      <Button
                        type="button"
                        variant={!useCustomDiscount && discountAmount === 2000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(false);
                          setDiscountAmount(2000);
                        }}
                        className="flex-1"
                      >
                        ₹2000 OFF
                      </Button>
                      <Button
                        type="button"
                        variant={useCustomDiscount ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseCustomDiscount(true);
                          setCustomDiscountAmount(100);
                        }}
                        className="flex-1"
                      >
                        Custom
                      </Button>
                    </div>

                    {useCustomDiscount && (
                      <div className="flex items-center gap-3">
                        <Label htmlFor="customDiscountAmount" className="whitespace-nowrap">
                          Discount Amount (₹):
                        </Label>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            id="customDiscountAmount"
                            type="number"
                            min="1"
                            step="100"
                            value={customDiscountAmount}
                            onChange={(e) => setCustomDiscountAmount(parseFloat(e.target.value) || 0)}
                            className="pl-7"
                            placeholder="Enter amount"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-2">Discount Preview:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal (All Rooms):</span>
                      <span>₹{selectedRooms.reduce((total, room) => total + (room.price * nights), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Discount Applied:</span>
                      <span>
                        {discountType === 'percentage'
                          ? `- ${useCustomDiscount ? customDiscountPercentage : discountPercentage}%`
                          : `- ₹${useCustomDiscount ? customDiscountAmount : discountAmount}`
                        }
                      </span>
                    </div>
                    <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                      <span>After Discount:</span>
                      <span className="text-green-600">
                        ₹{discountType === 'percentage'
                          ? (selectedRooms.reduce((total, room) => total + (room.price * nights), 0) *
                            (1 - (useCustomDiscount ? customDiscountPercentage : discountPercentage) / 100)).toFixed(2)
                          : Math.max(0, selectedRooms.reduce((total, room) => total + (room.price * nights), 0) -
                            (useCustomDiscount ? customDiscountAmount : discountAmount)).toFixed(2)
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
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
                    onClick={applyDiscountToAllRooms}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply Discount
                  </Button>
                </div>
              </div>
            </div>
          )}

          {discountApplied && (
            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                {discountType === 'percentage' ? (
                  <Percent className="h-4 w-4 text-green-600" />
                ) : (
                  <IndianRupee className="h-4 w-4 text-green-600" />
                )}
                <span className="text-sm font-medium text-green-800">
                  {discountType === 'percentage'
                    ? `${useCustomDiscount ? customDiscountPercentage : discountPercentage}% Discount Applied to All Rooms!`
                    : `₹${useCustomDiscount ? customDiscountAmount : discountAmount} Discount Applied to All Rooms!`
                  }
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeDiscountFromAllRooms}
                className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </DialogHeader>

        {!isCheckingAvailability && availableRoomsCount < selectedRooms.length && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <span className="font-medium">Note:</span> {selectedRooms.length - availableRoomsCount} room(s) are not available for the selected dates.
              They will be excluded from booking.
            </AlertDescription>
          </Alert>
        )}

        {isCheckingAvailability && (
          <Alert className="bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription>
              Checking room availability...
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-6">
            <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-4 gap-1 sm:gap-0 bg-transparent sm:bg-muted p-0 sm:p-1">
                <TabsTrigger
                  value="customer"
                  className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700 rounded-md whitespace-nowrap"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">1. Customer Details</span>
                  <span className="sm:hidden">Customer</span>
                </TabsTrigger>
                <TabsTrigger
                  value="idproof"
                  className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700 rounded-md whitespace-nowrap"
                >
                  <FileImage className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">2. ID Proof Upload</span>
                  <span className="sm:hidden">ID Proof</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rooms"
                  className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700 rounded-md whitespace-nowrap"
                >
                  <Bed className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">3. Room Configuration</span>
                  <span className="sm:hidden">Rooms</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700 rounded-md whitespace-nowrap"
                >
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">4. Payment & Summary</span>
                  <span className="sm:hidden">Payment</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="customer" className="space-y-6">
            <Card className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Full Name *
                  </Label>
                  <Input
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Mobile Number *
                  </Label>
                  <div className="relative">
                    <Input
                      value={customerData.phone}
                      onChange={handlePhoneChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <Input
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    placeholder="email@example.com"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" /> ID Type
                  </Label>
                  <Select
                    value={customerData.idType}
                    onValueChange={(value) => setCustomerData({ ...customerData, idType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="pan">PAN Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>ID Number</Label>
                  <Input
                    value={customerData.idNumber}
                    onChange={(e) => setCustomerData({ ...customerData, idNumber: e.target.value })}
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={customerData.address}
                    onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={customerData.city}
                    onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={customerData.state}
                    onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={customerData.pincode}
                    onChange={(e) => setCustomerData({ ...customerData, pincode: e.target.value })}
                    placeholder="Pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('rooms')}>
                Next: Configure Rooms
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="idproof" className="space-y-6">
            <Card className="p-6">
              <Alert className="mb-4">
                <FileImage className="h-4 w-4" />
                <AlertDescription>
                  Please upload clear images of your {customerData.idType === 'pan' ? 'PAN Card' : 'Aadhaar Card'}.
                  Upload front and back side if applicable.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-8 bg-primary/5 hover:border-primary/50 transition-colors">
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
                      <h3 className="font-semibold text-lg mb-2">Upload ID Proof Images</h3>
                      <p className="text-sm text-muted-foreground">
                        Tap to choose from gallery or take a photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: JPG, PNG, WebP
                      </p>
                    </div>
                  </label>
                </div>

                {idImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Uploaded Images ({idImages.length})
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIdImages([])}
                          disabled={idImages.length === 0}
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Add More
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('customer')}>
                Back
              </Button>
              <Button
                onClick={() => setActiveTab('rooms')}
                disabled={idImages.length === 0}
              >
                Next: Configure Rooms
                {idImages.length === 0 && " (ID Proof Required)"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Check-in Date
                  </Label>
                  <Input
                    type="date"
                    value={bookingDetails.checkInDate}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, checkInDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Check-in Time
                  </Label>
                  <Input
                    type="time"
                    value={bookingDetails.checkInTime}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, checkInTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Check-out Date
                  </Label>
                  <Input
                    type="date"
                    value={bookingDetails.checkOutDate}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, checkOutDate: e.target.value })}
                    min={bookingDetails.checkInDate}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Check-out Time
                  </Label>
                  <Input
                    type="time"
                    value={bookingDetails.checkOutTime}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <Alert className="mt-4 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Duration: <strong>{nights}</strong> {nights === 1 ? 'night' : 'nights'}
                </AlertDescription>
              </Alert>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Room Configuration</h3>

              {selectedRooms.map((room, index) => {
                const config = roomConfigs[room.roomId];
                const status = getRoomStatus(room);
                const isAvailable = roomAvailability[room.roomId]?.available !== false;
                const { roomTotal, advanceAmount, remainingAmount } = getRoomRemainingAfterAdvance(room);
                const originalTotal = calculateOriginalRoomTotal(room.roomId);
                const currentTotal = calculateRoomTotal(room.roomId);
                const hasRoomDiscount = !!roomDiscounts[room.roomId];
                const showCustomInput = showCustomRoomDiscount[room.roomId];
                const isFixedAmountMode = showCustomInput === 'price';

                if (!config) return null;

                return (
                  <Card
                    key={room.roomId}
                    className={`p-6 border-l-4 ${!isAvailable ? 'border-l-red-500 opacity-60' : 'border-l-blue-500'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                          Room {room.number} - {room.type}
                          {!isAvailable && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Available
                            </Badge>
                          )}
                          {advanceAmount > 0 && isAvailable && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              <IndianRupee className="h-3 w-3 mr-1" />
                              Advance: ₹{advanceAmount.toFixed(2)}
                            </Badge>
                          )}
                          {hasRoomDiscount && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {roomDiscounts[room.roomId].isFixedAmount ? (
                                <Tag className="h-3 w-3 mr-1" />
                              ) : (
                                <Percent className="h-3 w-3 mr-1" />
                              )}
                              {roomDiscounts[room.roomId].isFixedAmount
                                ? `₹${roomDiscounts[room.roomId].fixedAmountValue} OFF`
                                : `${roomDiscounts[room.roomId].percentage}% OFF`
                              }
                              {roomDiscounts[room.roomId].isCustom && " (Custom)"}
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                      </div>
                      <Badge variant="outline" className={status.color}>
                        <span className="flex items-center gap-1">
                          {status.icon}
                          {status.label}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Price per Night (₹)
                        </Label>
                        <Input
                          type="number"
                          value={config.price}
                          onChange={(e) => updateRoomConfig(room.roomId, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          disabled={!isAvailable}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4" /> Guests
                        </Label>
                        <Select
                          value={config.guests.toString()}
                          onValueChange={(value) => updateRoomConfig(room.roomId, 'guests', parseInt(value))}
                          disabled={!isAvailable}
                        >
                          <SelectTrigger>
                            <SelectValue />
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

                    {isAvailable && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Room Discount Options</span>
                          </div>

                          {hasRoomDiscount ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                {roomDiscounts[room.roomId].isFixedAmount
                                  ? `₹${roomDiscounts[room.roomId].fixedAmountValue} OFF Applied`
                                  : `${roomDiscounts[room.roomId].percentage}% OFF Applied`
                                }
                                {roomDiscounts[room.roomId].isCustom && " (Custom)"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRoomDiscount(room.roomId, room.number)}
                                className="text-red-600 h-6 px-2"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remove Discount
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-1 bg-white rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => showCustomDiscountInput(room.roomId, 'percentage')}
                                  className={`px-2 py-1 text-xs rounded-md transition-all ${showCustomInput === true ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                  Percentage %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => showCustomDiscountInput(room.roomId, 'price')}
                                  className={`px-2 py-1 text-xs rounded-md transition-all ${showCustomInput === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                  Fixed Amount ₹
                                </button>
                              </div>

                              {!showCustomInput && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applyRoomDiscount(room.roomId, room.number, 5)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    5%
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applyRoomDiscount(room.roomId, room.number, 10)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    10%
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applyRoomDiscount(room.roomId, room.number, 15)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    15%
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applyRoomDiscount(room.roomId, room.number, 20)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    20%
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => showCustomDiscountInput(room.roomId, 'percentage')}
                                    className="h-7 px-2 text-xs bg-purple-50 hover:bg-purple-100"
                                  >
                                    Custom %
                                  </Button>
                                </div>
                              )}

                              {showCustomInput === true && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={customRoomDiscountValue[room.roomId] || 10}
                                    onChange={(e) => setCustomRoomDiscountValue(prev => ({
                                      ...prev,
                                      [room.roomId]: parseInt(e.target.value) || 0
                                    }))}
                                    className="w-20 h-7 text-sm"
                                    placeholder="%"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => applyCustomRoomDiscount(room.roomId, room.number)}
                                    className="h-7 px-2 text-xs bg-green-600"
                                  >
                                    Apply %
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => cancelCustomDiscount(room.roomId)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}

                              {isFixedAmountMode && (
                                <div className="mt-3 pt-2 border-t border-blue-200">
                                  <div className="flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Fixed Amount Discount</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="10"
                                        value={customRoomDiscountValue[room.roomId] || 0}
                                        onChange={(e) => setCustomRoomDiscountValue(prev => ({
                                          ...prev,
                                          [room.roomId]: parseFloat(e.target.value) || 0
                                        }))}
                                        className="pl-7 h-7 text-sm"
                                        placeholder="Enter amount"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => applyFixedAmountDiscount(room.roomId, room.number)}
                                      className="h-7 px-3 text-xs bg-green-600"
                                    >
                                      Apply Discount
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => cancelCustomDiscount(room.roomId)}
                                      className="h-7 px-3 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Fixed amount will be deducted from the total room price
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {hasRoomDiscount && (
                          <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Original Price:</span>
                              <span className="line-through text-gray-500">₹{originalTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center font-medium">
                              <span className="text-green-700">Discounted Price:</span>
                              <span className="text-green-700 font-bold">₹{currentTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                              <span>Savings:</span>
                              <span className="text-green-600">₹{(originalTotal - currentTotal).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`service-${room.roomId}`}
                            checked={config.includeServiceCharge}
                            onChange={(e) => updateRoomConfig(room.roomId, 'includeServiceCharge', e.target.checked)}
                            className="h-4 w-4"
                            disabled={!isAvailable}
                          />
                          <Label htmlFor={`service-${room.roomId}`}>Service Charge</Label>
                        </div>

                        {config.includeServiceCharge && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.servicePercentage}
                              onChange={(e) => updateRoomConfig(room.roomId, 'servicePercentage', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={!isAvailable}
                            />
                            <span>%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`cgst-${room.roomId}`}
                            checked={config.includeCGST}
                            onChange={(e) => updateRoomConfig(room.roomId, 'includeCGST', e.target.checked)}
                            className="h-4 w-4"
                            disabled={!isAvailable}
                          />
                          <Label htmlFor={`cgst-${room.roomId}`}>CGST</Label>
                        </div>

                        {config.includeCGST && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.cgstPercentage}
                              onChange={(e) => updateRoomConfig(room.roomId, 'cgstPercentage', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={!isAvailable}
                            />
                            <span>%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`sgst-${room.roomId}`}
                            checked={config.includeSGST}
                            onChange={(e) => updateRoomConfig(room.roomId, 'includeSGST', e.target.checked)}
                            className="h-4 w-4"
                            disabled={!isAvailable}
                          />
                          <Label htmlFor={`sgst-${room.roomId}`}>SGST</Label>
                        </div>

                        {config.includeSGST && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.sgstPercentage}
                              onChange={(e) => updateRoomConfig(room.roomId, 'sgstPercentage', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={!isAvailable}
                            />
                            <span>%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {advanceAmount > 0 ? 'Amount Due Now:' : 'Room Total:'}
                        </span>
                        {hasRoomDiscount && (
                          <div className="text-xs text-green-600">
                            Original: ₹{originalTotal.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <span className={`text-xl font-bold ${!isAvailable ? 'text-gray-400' : 'text-green-600'}`}>
                        {!isAvailable ? (
                          <span className="text-xs ml-2 text-gray-500">(Not available)</span>
                        ) : (
                          <>
                            ₹{currentTotal.toFixed(2)}
                            {discountApplied && !hasRoomDiscount && (
                              <span className="text-xs text-green-600 ml-2">
                                ({useCustomDiscount ? customDiscountPercentage : discountPercentage}% off)
                              </span>
                            )}
                            {hasRoomDiscount && (
                              <span className="text-xs text-blue-600 ml-2">
                                {roomDiscounts[room.roomId].isFixedAmount
                                  ? `(₹${roomDiscounts[room.roomId].fixedAmountValue} off)`
                                  : `(${roomDiscounts[room.roomId].percentage}% off)`
                                }
                              </span>
                            )}
                            {advanceAmount > 0 && remainingAmount <= 0 && (
                              <span className="text-xs text-green-600 ml-2">(Fully Paid)</span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('customer')}>
                Back
              </Button>
              <Button
                onClick={() => setActiveTab('payment')}
                disabled={availableRoomsCount === 0}
              >
                Next: Payment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Payment Method</h3>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaymentStatus('completed');
                  }}
                >
                  <Wallet className="h-6 w-6 mb-1" />
                  <span>Cash</span>
                  <span className="text-xs text-muted-foreground">Pay at Hotel</span>
                </Button>

                <Button
                  type="button"
                  variant={paymentMethod === 'online' ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => {
                    setPaymentMethod('online');
                    if (!qrCodeData) generateUPIQrCode();
                  }}
                  disabled={isGeneratingQR}
                >
                  <QrCode className="h-6 w-6 mb-1" />
                  <span>Online</span>
                  <span className="text-xs text-muted-foreground">Pay Now</span>
                  {isGeneratingQR && (
                    <Loader2 className="h-4 w-4 animate-spin mt-1" />
                  )}
                </Button>
              </div>
            </Card>

            {paymentMethod === 'online' && (
              <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2 space-y-4">
                    <h4 className="font-semibold text-center">Scan QR Code to Pay</h4>

                    <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                      {hotelQRCode ? (
                        <img
                          src={hotelQRCode}
                          alt="Hotel UPI QR Code"
                          className="w-48 h-48 object-contain mx-auto"
                          onError={(e) => {
                            console.error('Hotel QR code failed to load');
                            e.currentTarget.src = '/images/default-qr.png';
                          }}
                        />
                      ) : (
                        <img
                          src="/images/default-qr.png"
                          alt="UPI QR Code"
                          className="w-48 h-48 object-contain mx-auto"
                        />
                      )}

                      <div className="mt-3 text-center">
                        <div className="text-sm font-medium mb-1">
                          Amount to Pay:
                          <span className="text-lg font-bold text-green-600 ml-2">
                            ₹{grandTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Scan with any UPI app to pay
                        </div>
                      </div>
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
                          <p className="text-sm font-medium">Verify Amount</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ensure amount is <strong>₹{grandTotal.toFixed(2)}</strong>
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
                            Click "Verify Payment" below after paying
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

                      {paymentStatus === 'pending' && (
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
                      )}

                      {paymentStatus === 'completed' && (
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
              </Card>
            )}

            {paymentMethod === 'cash' && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-4">
                  <Wallet className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Cash Payment at Hotel</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pay the remaining amount when you check-in at the hotel reception.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Amount Due at Hotel:</span>
                        <span className="text-2xl font-bold text-blue-700">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                      </div>
                      {existingAdvanceBookings && existingAdvanceBookings.length > 0 && (
                        <div className="text-sm text-purple-600 mt-2 border-t border-blue-100 pt-2">
                          Advance payments have been deducted from the total amount.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <Label className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                Special Requests (Optional)
              </Label>
              <Textarea
                value={customerData.specialRequests}
                onChange={(e) => setCustomerData({ ...customerData, specialRequests: e.target.value })}
                placeholder="Any special requests for all rooms?"
                className="min-h-[100px]"
              />
            </Card>

            {/* Booking Summary - CORRECTED VERSION */}
            {/* Booking Summary - FIXED VERSION with clear tax breakdown */}
            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>

              <div className="space-y-3">
                {/* Room subtotals before tax */}
                <div className="text-sm font-medium text-gray-700 mb-2">Room Charges:</div>

                {selectedRooms.map((room) => {
                  const isAvailable = roomAvailability[room.roomId]?.available !== false;
                  if (!isAvailable) return null;

                  const config = roomConfigs[room.roomId];
                  if (!config) return null;

                  // Step-by-step. Discount applies ONLY to the room amount.
                  // Taxes are calculated on the ORIGINAL room base (price * nights).
                  const baseAmount = room.price * nights;
                  let globalDiscountAmount = 0;
                  let afterGlobalDiscount = baseAmount;
                  if (discountApplied) {
                    if (discountType === 'percentage') {
                      const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
                      globalDiscountAmount = baseAmount * (discountPercent / 100);
                      afterGlobalDiscount = baseAmount - globalDiscountAmount;
                    } else {
                      const totalSubtotal = selectedRooms.reduce((total, r) =>
                        total + (r.price * nights), 0);
                      const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
                      const roomProportion = totalSubtotal > 0 ? baseAmount / totalSubtotal : 0;
                      globalDiscountAmount = discountAmt * roomProportion;
                      afterGlobalDiscount = baseAmount - globalDiscountAmount;
                    }
                  }

                  let afterRoomDiscount = afterGlobalDiscount;
                  let roomDiscountAmount = 0;
                  if (roomDiscounts[room.roomId]) {
                    const roomDiscount = roomDiscounts[room.roomId];
                    if (roomDiscount.isFixedAmount && roomDiscount.fixedAmountValue) {
                      roomDiscountAmount = roomDiscount.fixedAmountValue;
                      afterRoomDiscount = afterRoomDiscount - roomDiscountAmount;
                    } else {
                      roomDiscountAmount = afterRoomDiscount * (roomDiscount.percentage / 100);
                      afterRoomDiscount = afterRoomDiscount - roomDiscountAmount;
                    }
                  }

                  const totalDiscount = globalDiscountAmount + roomDiscountAmount;
                  const discountedAmount = Math.max(0, afterRoomDiscount);

                  // Taxes are based on the ORIGINAL room amount (NOT the discounted one).
                  const serviceCharge = config.includeServiceCharge
                    ? (baseAmount * config.servicePercentage) / 100
                    : 0;

                  const cgst = config.includeCGST
                    ? (baseAmount * config.cgstPercentage) / 100
                    : 0;
                  const sgst = config.includeSGST
                    ? (baseAmount * config.sgstPercentage) / 100
                    : 0;
                  const igst = config.includeIGST
                    ? (baseAmount * config.igstPercentage) / 100
                    : 0;

                  const totalGST = cgst + sgst + igst;
                  const roomTotal = discountedAmount + serviceCharge + totalGST;

                  return (
                    <div key={room.roomId} className="py-3 border-b">
                      <div className="font-medium">Room {room.number} - {room.type}</div>

                      {/* Show detailed breakdown if there are discounts */}
                      {(totalDiscount > 0 || discountApplied || roomDiscounts[room.roomId]) ? (
                        <div className="text-sm space-y-1 mt-2 pl-4">
                          <div className="flex justify-between text-gray-600">
                            <span>Base Price ({nights} night{nights !== 1 ? 's' : ''}):</span>
                            <span>₹{baseAmount.toFixed(2)}</span>
                          </div>

                          {totalDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount Applied:</span>
                              <span>-₹{totalDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-medium pt-1 border-t border-dashed">
                            <span>After Discount:</span>
                            <span>₹{discountedAmount.toFixed(2)}</span>
                          </div>

                          {(config.includeServiceCharge || config.includeCGST || config.includeSGST || config.includeIGST) && (
                            <div className="pt-2 mt-1 border-t border-dashed">
                              <div className="text-xs text-gray-500 mb-1">
                                Taxes calculated on original room amount (₹{baseAmount.toFixed(2)})
                              </div>

                              {config.includeServiceCharge && (
                                <div className="flex justify-between text-gray-600">
                                  <span>Service Charge ({config.servicePercentage}%):</span>
                                  <span>₹{serviceCharge.toFixed(2)}</span>
                                </div>
                              )}

                              {config.includeCGST && (
                                <div className="flex justify-between text-gray-600">
                                  <span>CGST ({config.cgstPercentage}%):</span>
                                  <span>₹{cgst.toFixed(2)}</span>
                                </div>
                              )}

                              {config.includeSGST && (
                                <div className="flex justify-between text-gray-600">
                                  <span>SGST ({config.sgstPercentage}%):</span>
                                  <span>₹{sgst.toFixed(2)}</span>
                                </div>
                              )}

                              {config.includeIGST && (
                                <div className="flex justify-between text-gray-600">
                                  <span>IGST ({config.igstPercentage}%):</span>
                                  <span>₹{igst.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between font-bold pt-2 mt-1 border-t">
                            <span>Room Total:</span>
                            <span className="text-green-600">₹{roomTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        // Simple view when no discounts
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex justify-between">
                            <span>Room Charges ({nights} night{nights !== 1 ? 's' : ''}):</span>
                            <span>₹{room.price.toFixed(2)} × {nights} = ₹{baseAmount.toFixed(2)}</span>
                          </div>
                          {config.includeServiceCharge && (
                            <div className="flex justify-between">
                              <span>Service Charge ({config.servicePercentage}%):</span>
                              <span>₹{serviceCharge.toFixed(2)}</span>
                            </div>
                          )}
                          {config.includeCGST && (
                            <div className="flex justify-between">
                              <span>CGST ({config.cgstPercentage}%):</span>
                              <span>₹{cgst.toFixed(2)}</span>
                            </div>
                          )}
                          {config.includeSGST && (
                            <div className="flex justify-between">
                              <span>SGST ({config.sgstPercentage}%):</span>
                              <span>₹{sgst.toFixed(2)}</span>
                            </div>
                          )}
                          {config.includeIGST && (
                            <div className="flex justify-between">
                              <span>IGST ({config.igstPercentage}%):</span>
                              <span>₹{igst.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold mt-2 pt-1 border-t">
                            <span>Room Total:</span>
                            <span className="text-green-600">₹{roomTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Tax Summary Section */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span className="font-medium">Total Base Amount:</span>
                    <span>₹{selectedRooms.reduce((total, room) =>
                      total + (room.price * nights), 0).toFixed(2)}</span>
                  </div>

                  {/* Total Discounts */}
                  {(() => {
                    let totalDiscountAmount = 0;
                    selectedRooms.forEach(room => {
                      if (roomAvailability[room.roomId]?.available === false) return;
                      let baseAmount = room.price * nights;

                      if (discountApplied) {
                        if (discountType === 'percentage') {
                          const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
                          totalDiscountAmount += baseAmount * (discountPercent / 100);
                        } else {
                          const totalSubtotal = selectedRooms.reduce((total, r) =>
                            total + (r.price * nights), 0);
                          const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
                          const roomProportion = baseAmount / totalSubtotal;
                          totalDiscountAmount += discountAmt * roomProportion;
                        }
                      }

                      if (roomDiscounts[room.roomId]) {
                        const roomDiscount = roomDiscounts[room.roomId];
                        let afterGlobalDiscount = baseAmount;
                        if (discountApplied) {
                          if (discountType === 'percentage') {
                            const discountPercent = useCustomDiscount ? customDiscountPercentage : discountPercentage;
                            afterGlobalDiscount = baseAmount * (1 - discountPercent / 100);
                          } else {
                            const totalSubtotal = selectedRooms.reduce((total, r) =>
                              total + (r.price * nights), 0);
                            const discountAmt = useCustomDiscount ? customDiscountAmount : discountAmount;
                            const roomProportion = baseAmount / totalSubtotal;
                            afterGlobalDiscount = baseAmount - (discountAmt * roomProportion);
                          }
                        }

                        if (roomDiscount.isFixedAmount && roomDiscount.fixedAmountValue) {
                          totalDiscountAmount += roomDiscount.fixedAmountValue;
                        } else {
                          totalDiscountAmount += afterGlobalDiscount * (roomDiscount.percentage / 100);
                        }
                      }
                    });

                    if (totalDiscountAmount > 0) {
                      return (
                        <div className="flex justify-between text-green-600 mb-2">
                          <span>Total Discount:</span>
                          <span>-₹{totalDiscountAmount.toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Service Charge Total - based on ORIGINAL room amount */}
                  {(() => {
                    let totalServiceCharge = 0;
                    selectedRooms.forEach(room => {
                      if (roomAvailability[room.roomId]?.available === false) return;
                      const config = roomConfigs[room.roomId];
                      if (!config || !config.includeServiceCharge) return;
                      const baseAmount = room.price * nights;
                      totalServiceCharge += (baseAmount * config.servicePercentage) / 100;
                    });

                    if (totalServiceCharge > 0) {
                      return (
                        <div className="flex justify-between text-gray-700 mb-2">
                          <span>Total Service Charge:</span>
                          <span>₹{totalServiceCharge.toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Total Tax (GST) - based on ORIGINAL room amount */}
                  {(() => {
                    let totalCGST = 0, totalSGST = 0, totalIGST = 0;
                    selectedRooms.forEach(room => {
                      if (roomAvailability[room.roomId]?.available === false) return;
                      const config = roomConfigs[room.roomId];
                      if (!config) return;
                      const baseAmount = room.price * nights;

                      if (config.includeCGST) totalCGST += (baseAmount * config.cgstPercentage) / 100;
                      if (config.includeSGST) totalSGST += (baseAmount * config.sgstPercentage) / 100;
                      if (config.includeIGST) totalIGST += (baseAmount * config.igstPercentage) / 100;
                    });

                    const totalGST = totalCGST + totalSGST + totalIGST;

                    if (totalGST > 0) {
                      return (
                        <>
                          {totalCGST > 0 && (
                            <div className="flex justify-between text-gray-700 mb-1 pl-4">
                              <span>CGST:</span>
                              <span>₹{totalCGST.toFixed(2)}</span>
                            </div>
                          )}
                          {totalSGST > 0 && (
                            <div className="flex justify-between text-gray-700 mb-1 pl-4">
                              <span>SGST:</span>
                              <span>₹{totalSGST.toFixed(2)}</span>
                            </div>
                          )}
                          {totalIGST > 0 && (
                            <div className="flex justify-between text-gray-700 mb-1 pl-4">
                              <span>IGST:</span>
                              <span>₹{totalIGST.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-700 mb-2 font-medium">
                            <span>Total Taxes (GST):</span>
                            <span>₹{totalGST.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}

                  {/* Grand Total */}
                  <div className="flex justify-between items-center pt-4 text-xl font-bold border-t mt-2">
                    <span>Grand Total:</span>
                    <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Tax Note */}
                  <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
                    <Info className="h-3 w-3 inline mr-1" />
                    Discount is applied only to the room amount. Service Charge and GST are calculated on the original room amount and remain unchanged.
                  </div>

                  <div className="text-sm text-muted-foreground mt-2">
                    Duration: {nights} {nights === 1 ? 'night' : 'nights'}
                  </div>

                  {existingAdvanceBookings && existingAdvanceBookings.length > 0 && (
                    <div className="text-sm text-purple-600 bg-purple-50 p-2 rounded mt-2">
                      Advance payments already applied. Pay only the remaining amount.
                    </div>
                  )}

                  {paymentMethod === 'online' && paymentStatus === 'completed' && (
                    <Alert className="bg-green-50 border-green-200 mt-4">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Payment verified! You can now confirm your booking.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </Card>
            <div className="flex justify-between gap-4 pt-4">
              <Button variant="outline" onClick={() => setActiveTab('rooms')}>
                Back
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || availableRoomsCount === 0 || (paymentMethod === 'online' && paymentStatus !== 'completed')}
                className="bg-green-600 hover:bg-green-700 min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Booking ({availableRoomsCount} rooms)
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}