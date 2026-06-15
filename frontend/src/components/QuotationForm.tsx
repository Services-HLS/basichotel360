

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, User, Phone, Mail, Bed, Clock, Users, FileText, CalendarDays, Percent, Loader2 } from 'lucide-react';

// ✅ CORRECT: Use import.meta.env for Vite in the browser
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

interface QuotationFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (quotationData: any) => void;
    room?: any;
    defaultDates?: {
        fromDate?: string;
        toDate?: string;
    };
}

const QuotationForm: React.FC<QuotationFormProps> = ({
    open,
    onClose,
    onSuccess,
    room,
    defaultDates
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
    const [includeGST, setIncludeGST] = useState(true);

    // Add loading state for hotel settings
    const [loadingHotelSettings, setLoadingHotelSettings] = useState(false);

    // Same structure as booking form
    const [hotelSettings, setHotelSettings] = useState<{
        gstPercentage: number;
        serviceChargePercentage: number;
    }>({
        gstPercentage: 12.00, // Default fallback
        serviceChargePercentage: 10.00 // Default fallback
    });

    const [formData, setFormData] = useState({
        room_id: room?.roomId || '',
        room_number: room?.number || '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        from_date: defaultDates?.fromDate || '',
        to_date: defaultDates?.toDate || '',
        from_time: '14:00',
        to_time: '12:00',
        nights: 1,
        guests: 1,
        room_price: room?.price || 0,
        service_charge: 0,
        gst: 0,
        other_expenses: 0,
        total_amount: room?.price || 0,
        special_requests: '',
        purpose_of_visit: '',
        terms_and_conditions: 'Standard terms apply',
        validity_days: 7,
        payment_terms: '50% advance, 50% on check-in',
        notes: ''
    });

    // Fetch hotel settings on component mount (same as booking form)
    useEffect(() => {
        const fetchHotelSettings = async () => {
            if (!open) return;

            setLoadingHotelSettings(true);
            try {
                console.log('🔄 Fetching hotel settings for quotation...');
                const token = localStorage.getItem('authToken');

                if (!token) {
                    console.error('❌ No auth token found');
                    toast({
                        title: 'Authentication Error',
                        description: 'Please login again',
                        variant: 'destructive'
                    });
                    return;
                }

                const response = await fetch(`${BACKEND_URL}/hotels/settings`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📡 Hotel settings response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('📊 Hotel settings data:', data);

                    if (data.success && data.data) {
                        // Extract values from data.data (same as booking form)
                        const gstPercentage = parseFloat(data.data.gstPercentage);
                        const serviceChargePercentage = parseFloat(data.data.serviceChargePercentage);

                        console.log('✅ Setting hotel tax settings:', {
                            gstPercentage,
                            serviceChargePercentage,
                            rawData: data.data
                        });

                        setHotelSettings({
                            gstPercentage,
                            serviceChargePercentage
                        });

                        // Also update form data to trigger recalculation
                        setFormData(prev => ({ ...prev }));
                    } else {
                        console.warn('⚠️ Hotel settings API returned success:false', data);
                        toast({
                            title: 'Warning',
                            description: 'Could not load hotel tax settings, using defaults',
                            variant: 'default'
                        });
                    }
                } else {
                    console.error('❌ Hotel settings API error:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                }
            } catch (error: any) {
                console.error('❌ Error fetching hotel settings for quotation:', error);
                toast({
                    title: 'Connection Error',
                    description: 'Failed to load hotel settings. Using default values.',
                    variant: 'destructive'
                });
            } finally {
                setLoadingHotelSettings(false);
            }
        };

        fetchHotelSettings();
    }, [open, toast]);

    const calculateCharges = () => {
        console.log('🧮 Calculating charges with hotel settings:', hotelSettings);

        const roomPrice = parseFloat(String(formData.room_price)) || 0;
        const nights = parseInt(String(formData.nights)) || 1;
        const baseAmount = roomPrice * nights;

        // Calculate service charge if included (using hotel settings)
        const serviceCharge = includeServiceCharge
            ? (baseAmount * hotelSettings.serviceChargePercentage) / 100
            : 0;

        // Calculate GST if included (on base + service charge) (using hotel settings)
        const gst = includeGST
            ? ((baseAmount + serviceCharge) * hotelSettings.gstPercentage) / 100
            : 0;

        const otherExpenses = parseFloat(String(formData.other_expenses)) || 0;
        const total = baseAmount + serviceCharge + gst + otherExpenses;

        console.log('📈 Calculated charges:', {
            roomPrice,
            nights,
            baseAmount,
            serviceChargePercentage: hotelSettings.serviceChargePercentage,
            serviceCharge,
            gstPercentage: hotelSettings.gstPercentage,
            gst,
            otherExpenses,
            total
        });

        setFormData(prev => ({
            ...prev,
            service_charge: parseFloat(serviceCharge.toFixed(2)),
            gst: parseFloat(gst.toFixed(2)),
            total_amount: parseFloat(total.toFixed(2))
        }));
    };

    // Recalculate when dependencies change
    useEffect(() => {
        console.log('🔄 Recalculating charges effect triggered');
        calculateCharges();
    }, [
        formData.room_price,
        formData.nights,
        formData.other_expenses,
        includeServiceCharge,
        includeGST,
        hotelSettings.gstPercentage,
        hotelSettings.serviceChargePercentage
    ]);

    useEffect(() => {
        console.log('📊 Room object in QuotationForm:', room);
        console.log('📊 Room ID:', room?.id);
        console.log('📊 Room number:', room?.number);
        console.log('📊 Room object keys:', room ? Object.keys(room) : 'No room object');
    }, [room]);

    // Add a debug button to check current state
    const debugState = () => {
        console.log('🔍 DEBUG - Current state:', {
            room,
            room_id: room?.roomId,
            hotelSettings,
            formData,
            includeServiceCharge,
            includeGST,
            open,
            defaultDates
        });

        // Check localStorage
        const token = localStorage.getItem('authToken');
        console.log('🔑 Auth token exists:', !!token);

        // Check environment - ✅ FIXED: Use BACKEND_URL variable
        console.log('🌐 Backend URL:', BACKEND_URL);
    };

    // Add this helper function in QuotationForm.tsx
    const getCurrentUserId = () => {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user.userId || user.id;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        return 1; // Fallback to admin user ID
    };

    // Calculate nights when dates change
    useEffect(() => {
        if (formData.from_date && formData.to_date) {
            const from = new Date(formData.from_date);
            const to = new Date(formData.to_date);
            const nights = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
            if (nights > 0) {
                setFormData(prev => ({ ...prev, nights }));
            }
        }
    }, [formData.from_date, formData.to_date]);

    // Main submit function - SIMPLIFIED: Removed availability check
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Calculate expiry date
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + formData.validity_days);

            // IMPORTANT: Extract correct room_id from room object
            // Your room object from RoomBooking.tsx has room.roomId
            // Make sure it's the database ID (not Google Sheets ID)
            let roomId = '';
            if (room?.roomId) {
                // If roomId is like "db-65", extract the number
                if (room.roomId.startsWith('db-')) {
                    roomId = room.roomId.replace('db-', '');
                } else {
                    roomId = room.roomId.toString();
                }
            }

            // Prepare payload
            const payload = {
                ...formData,
                room_id: roomId,  // Use extracted room_id
                room_number: room?.number || formData.room_number || '',
                created_by: getCurrentUserId(),
                expiry_date: expiryDate.toISOString().split('T')[0]
            };

            console.log('📤 Sending quotation payload:', payload);

            const response = await fetch(`${BACKEND_URL}/quotations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('📥 Quotation response:', data);

            if (data.success) {
                toast({
                    title: '✅ Quotation Created',
                    description: `Quotation ${data.data.quotationNumber} generated successfully`,
                    variant: 'default'
                });

                onSuccess(data.data);
                onClose();
            } else {
                throw new Error(data.message || 'Failed to create quotation');
            }
        } catch (error: any) {
            console.error('❌ Quotation creation error:', error);
            toast({
                title: '❌ Error',
                description: error.message || 'Failed to create quotation',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Create Quotation {room && `- Room ${room.number}`}
                        {loadingHotelSettings && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        )}
                    </DialogTitle>
                </DialogHeader>

           

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Details */}
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Customer Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">Full Name *</Label>
                                <Input
                                    id="customer_name"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                    placeholder="Enter customer name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customer_phone">Mobile Number *</Label>
                                <Input
                                    id="customer_phone"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                    placeholder="10-digit mobile number"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customer_email">Email Address</Label>
                                <Input
                                    id="customer_email"
                                    type="email"
                                    value={formData.customer_email}
                                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customer_address">Address</Label>
                                <Input
                                    id="customer_address"
                                    value={formData.customer_address}
                                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                                    placeholder="Full address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Bed className="h-5 w-5" />
                            Booking Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="from_date">Check-in Date *</Label>
                                <Input
                                    id="from_date"
                                    type="date"
                                    value={formData.from_date}
                                    onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="from_time">Check-in Time</Label>
                                <Input
                                    id="from_time"
                                    type="time"
                                    value={formData.from_time}
                                    onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to_date">Check-out Date *</Label>
                                <Input
                                    id="to_date"
                                    type="date"
                                    value={formData.to_date}
                                    onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                                    min={formData.from_date}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to_time">Check-out Time</Label>
                                <Input
                                    id="to_time"
                                    type="time"
                                    value={formData.to_time}
                                    onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nights">Number of Nights</Label>
                                <Input
                                    id="nights"
                                    type="number"
                                    min="1"
                                    value={formData.nights}
                                    onChange={(e) => {
                                        const nights = parseInt(e.target.value) || 1;
                                        setFormData({ ...formData, nights });
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guests">Number of Guests</Label>
                                <Select
                                    value={formData.guests.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, guests: parseInt(value) })}
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

                        {room && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Room {room.number} - {room.type}</div>
                                        <div className="text-sm text-gray-600">Floor: {room.floor}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">
                                            ₹{room.price}/night
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Details */}
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Percent className="h-5 w-5" />
                            Pricing Configuration
                            {loadingHotelSettings && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    (Loading hotel settings...)
                                </span>
                            )}
                        </h3>

                        {/* Hotel Settings Info */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-blue-800">Current Hotel Tax Settings</div>
                                    <div className="text-xs text-blue-600">
                                        GST: {hotelSettings.gstPercentage}% • Service Charge: {hotelSettings.serviceChargePercentage}%
                                    </div>
                                </div>
                                <div className="text-xs text-blue-700">
                                    {hotelSettings.gstPercentage === 12.00 && hotelSettings.serviceChargePercentage === 10.00
                                        ? "Using default values"
                                        : "Loaded from hotel settings"}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Room Price */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room_price">Room Price per Night (₹)</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="room_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.room_price}
                                            onChange={(e) => {
                                                const price = parseFloat(e.target.value) || 0;
                                                setFormData({ ...formData, room_price: price });
                                            }}
                                            className="text-lg font-medium"
                                        />
                                        {room && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFormData(prev => ({ ...prev, room_price: room.price }))}
                                            >
                                                Reset to Original
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Tax Configuration Checkboxes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                                    {/* Service Charge Checkbox */}
                                    <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                                        <Checkbox
                                            id="includeServiceCharge"
                                            checked={includeServiceCharge}
                                            onCheckedChange={(checked) => setIncludeServiceCharge(checked === true)}
                                            className="mt-1"
                                            disabled={loadingHotelSettings}
                                        />
                                        <div className="space-y-1 flex-1">
                                            <Label htmlFor="includeServiceCharge" className="font-medium cursor-pointer flex items-center gap-2">
                                                Include Service Charge ({hotelSettings.serviceChargePercentage}%)
                                                {loadingHotelSettings && <Loader2 className="h-3 w-3 animate-spin" />}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Hotel service charge percentage
                                            </p>
                                            {includeServiceCharge && (
                                                <div className="text-sm text-green-600 font-medium mt-1">
                                                    + ₹{formData.service_charge.toFixed(2)}
                                                    <span className="text-xs ml-2">
                                                        ({hotelSettings.serviceChargePercentage}% of base)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* GST Checkbox */}
                                    <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                                        <Checkbox
                                            id="includeGST"
                                            checked={includeGST}
                                            onCheckedChange={(checked) => setIncludeGST(checked === true)}
                                            className="mt-1"
                                            disabled={loadingHotelSettings}
                                        />
                                        <div className="space-y-1 flex-1">
                                            <Label htmlFor="includeGST" className="font-medium cursor-pointer flex items-center gap-2">
                                                Include GST ({hotelSettings.gstPercentage}%)
                                                {loadingHotelSettings && <Loader2 className="h-3 w-3 animate-spin" />}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Hotel GST percentage on (base + service)
                                            </p>
                                            {includeGST && (
                                                <div className="text-sm text-green-600 font-medium mt-1">
                                                    + ₹{formData.gst.toFixed(2)}
                                                    <span className="text-xs ml-2">
                                                        ({hotelSettings.gstPercentage}% of base + service)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions for Tax Options */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIncludeServiceCharge(true);
                                            setIncludeGST(true);
                                        }}
                                        className="flex-1"
                                        disabled={loadingHotelSettings}
                                    >
                                        Include All Taxes
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIncludeServiceCharge(false);
                                            setIncludeGST(false);
                                        }}
                                        className="flex-1"
                                        disabled={loadingHotelSettings}
                                    >
                                        Remove All Taxes
                                    </Button>
                                </div>
                            </div>

                            {/* Other Expenses */}
                            <div className="space-y-2">
                                <Label htmlFor="other_expenses">Other Expenses (₹)</Label>
                                <Input
                                    id="other_expenses"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.other_expenses}
                                    onChange={(e) => {
                                        const expenses = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, other_expenses: expenses });
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Additional charges like coffee, tiffin, laundry, etc.
                                </p>
                            </div>

                            {/* Price Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Room Charges (₹{formData.room_price} × {formData.nights} nights):</span>
                                    <span>₹{(formData.room_price * formData.nights).toFixed(2)}</span>
                                </div>

                                {/* Show Service Charge only if included */}
                                {includeServiceCharge && (
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-1">
                                            Service Charge ({hotelSettings.serviceChargePercentage}%)
                                        </span>
                                        <span>₹{formData.service_charge.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Show GST only if included */}
                                {includeGST && (
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-1">
                                            GST ({hotelSettings.gstPercentage}%)
                                        </span>
                                        <span>₹{formData.gst.toFixed(2)}</span>
                                    </div>
                                )}

                                {formData.other_expenses > 0 && (
                                    <div className="flex justify-between">
                                        <span>Other Expenses:</span>
                                        <span className="text-blue-600">+ ₹{formData.other_expenses.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total Amount:</span>
                                    <span className="text-green-600">₹{formData.total_amount.toFixed(2)}</span>
                                </div>

                                {/* Tax Inclusion Status */}
                                <div className="text-sm text-muted-foreground pt-1">
                                    {!includeServiceCharge && !includeGST && formData.other_expenses === 0
                                        ? "No additional charges"
                                        : !includeServiceCharge && !includeGST
                                            ? "Only additional expenses included"
                                            : formData.other_expenses > 0
                                                ? "All charges + expenses included"
                                                : !includeServiceCharge
                                                    ? "Service charge excluded"
                                                    : !includeGST
                                                        ? "GST excluded"
                                                        : "All charges included"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="validity_days">Quotation Validity (Days)</Label>
                                <Select
                                    value={formData.validity_days.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, validity_days: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 Days</SelectItem>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="15">15 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment_terms">Payment Terms</Label>
                                <Select
                                    value={formData.payment_terms}
                                    onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50% advance, 50% on check-in">50% advance, 50% on check-in</SelectItem>
                                        <SelectItem value="100% advance">100% advance</SelectItem>
                                        <SelectItem value="Full payment on arrival">Full payment on arrival</SelectItem>
                                        <SelectItem value="Credit terms: 30 days">Credit terms: 30 days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="special_requests">Special Requests</Label>
                                <Textarea
                                    id="special_requests"
                                    value={formData.special_requests}
                                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                                    placeholder="Any special requirements"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional notes"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || loadingHotelSettings}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : loadingHotelSettings ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading Settings...
                                </>
                            ) : (
                                'Generate Quotation'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default QuotationForm;