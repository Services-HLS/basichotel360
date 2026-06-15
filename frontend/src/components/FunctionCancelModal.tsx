
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  Ban, 
  IndianRupee,
  Wallet,
  CreditCard,
  CheckCircle,
  Landmark,
  Info,
  Edit,
  Save,
  XCircle,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface FunctionCancelModalProps {
  open: boolean;
  onClose: () => void;
  booking: any;
  onCancelComplete: () => void;
}

export default function FunctionCancelModal({
  open,
  onClose,
  booking,
  onCancelComplete
}: FunctionCancelModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'online' | 'bank' | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [isEditingRefund, setIsEditingRefund] = useState(false);
  const [tempRefundAmount, setTempRefundAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [cancelCompleted, setCancelCompleted] = useState(false);
  const [refundId, setRefundId] = useState<number | null>(null);
  const [processRefund, setProcessRefund] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'none'>('none');

  // Safely convert database values to numbers
  const totalAmount = Number(booking?.total_amount) || 0;
  const advancePaid = Number(booking?.advance_paid) || 0;
  const hasAdvance = advancePaid > 0;
  const amountPaidByCustomer = hasAdvance ? advancePaid : totalAmount; // For normal bookings, show total amount

  // Set default values based on booking type
  useEffect(() => {
    if (hasAdvance) {
      // For advance bookings, default refund is advance paid
      setRefundAmount(advancePaid);
      setTempRefundAmount(advancePaid);
      setRefundType('full');
      setProcessRefund(true);
    } else {
      // For normal bookings, default refund is 0 (no refund)
      setRefundAmount(0);
      setTempRefundAmount(0);
      setRefundType('none');
      setProcessRefund(false);
    }
  }, [hasAdvance, advancePaid, totalAmount]);

  // Calculate deduction whenever refund amount changes
  useEffect(() => {
    if (hasAdvance && processRefund) {
      const deducted = advancePaid - refundAmount;
      setDeductionAmount(deducted > 0 ? deducted : 0);
    } else if (!hasAdvance && processRefund && refundAmount > 0) {
      // For bookings without advance, refund amount is what we're giving
      setDeductionAmount(0);
    }
  }, [refundAmount, advancePaid, hasAdvance, processRefund]);

  // Debug logging
  useEffect(() => {
    if (booking) {
      console.log('📦 Cancel modal booking:', {
        id: booking.id,
        total: totalAmount,
        advance: advancePaid,
        hasAdvance,
        amountPaidByCustomer
      });
    }
  }, [booking]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCancellationReason('');
      setRefundMethod(null);
      if (hasAdvance) {
        setRefundAmount(advancePaid);
        setTempRefundAmount(advancePaid);
        setRefundType('full');
        setProcessRefund(true);
      } else {
        setRefundAmount(0);
        setTempRefundAmount(0);
        setRefundType('none');
        setProcessRefund(false);
      }
      setIsEditingRefund(false);
      setDeductionReason('');
      setCancelCompleted(false);
      setIsProcessing(false);
      setRefundId(null);
    }
  }, [open, hasAdvance, advancePaid, totalAmount]);

  // Handle save refund amount
  const handleSaveRefundAmount = () => {
    if (tempRefundAmount < 0) {
      toast({
        title: "Error",
        description: "Refund amount cannot be negative",
        variant: "destructive"
      });
      return;
    }

    const maxRefund = hasAdvance ? advancePaid : totalAmount;
    
    if (tempRefundAmount > maxRefund) {
      toast({
        title: "Error",
        description: `Refund amount cannot exceed ${formatCurrency(maxRefund)}`,
        variant: "destructive"
      });
      return;
    }

    setRefundAmount(tempRefundAmount);
    setIsEditingRefund(false);
    
    if (hasAdvance && tempRefundAmount < advancePaid) {
      setRefundType('partial');
      toast({
        title: "Partial Refund",
        description: `₹${(advancePaid - tempRefundAmount).toFixed(2)} will be deducted as per policy`,
        variant: "default"
      });
    } else if (!hasAdvance && tempRefundAmount > 0) {
      setRefundType('partial');
      toast({
        title: "Goodwill Refund",
        description: `₹${tempRefundAmount.toFixed(2)} will be refunded as goodwill gesture`,
        variant: "default"
      });
    } else if (tempRefundAmount === 0) {
      setRefundType('none');
    } else {
      setRefundType('full');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setTempRefundAmount(refundAmount);
    setIsEditingRefund(false);
  };

  // Handle toggle refund processing
  const handleToggleRefund = (checked: boolean) => {
    setProcessRefund(checked);
    if (!checked) {
      setRefundAmount(0);
      setRefundType('none');
      setRefundMethod(null);
    } else if (!hasAdvance) {
      // For bookings without advance, default to 0 but allow editing
      setRefundAmount(0);
      setTempRefundAmount(0);
      setRefundType('none');
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
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

    const maxRefund = hasAdvance ? advancePaid : totalAmount;
    
    if (processRefund && refundAmount > maxRefund) {
      toast({
        title: "Error",
        description: `Refund amount cannot exceed ${formatCurrency(maxRefund)}`,
        variant: "destructive"
      });
      return;
    }

    if (hasAdvance && deductionAmount > 0 && !deductionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide reason for deduction",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('authToken');
      
      console.log('📤 Cancelling booking:', {
        id: booking.id,
        reason: cancellationReason,
        processRefund,
        refundMethod: processRefund ? refundMethod : null,
        refundAmount: processRefund ? refundAmount : 0,
        deductionAmount: deductionAmount,
        deductionReason: deductionReason,
        refundType
      });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/function-rooms/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancellation_reason: cancellationReason,
          process_refund: processRefund,
          refund_method: processRefund ? refundMethod : null,
          refund_amount: processRefund ? refundAmount : 0,
          original_advance: advancePaid,
          deducted_amount: deductionAmount,
          deduction_reason: deductionReason,
          refund_type: refundType,
          refund_notes: `Cancelled by ${booking.customer_name} - ${cancellationReason}${deductionReason ? ` (Deduction: ${deductionReason})` : ''}`
        })
      });

      const data = await response.json();
      console.log('📥 Cancel response:', data);

      if (data.success) {
        setCancelCompleted(true);
        if (data.data?.refund) {
          setRefundId(data.data.refund.id);
        }
        
        let successMessage = "Booking has been cancelled successfully";
        if (processRefund) {
          if (hasAdvance) {
            if (refundAmount < advancePaid) {
              const deducted = advancePaid - refundAmount;
              successMessage = `Booking cancelled. ₹${deducted.toFixed(2)} deducted as ${deductionReason || 'cancellation fee'}. ₹${refundAmount.toFixed(2)} will be refunded via ${refundMethod}.`;
            } else {
              successMessage = `Booking cancelled. Full advance of ₹${refundAmount.toFixed(2)} will be refunded via ${refundMethod}.`;
            }
          } else {
            successMessage = `Booking cancelled. Goodwill refund of ₹${refundAmount.toFixed(2)} will be processed via ${refundMethod}.`;
          }
        }

        toast({
          title: "✅ Booking Cancelled",
          description: successMessage,
        });

        onCancelComplete();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(data.message || 'Cancellation failed');
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!booking) return null;

  const maxRefundAmount = hasAdvance ? advancePaid : totalAmount;
  const customerPaidAmount = hasAdvance ? advancePaid : totalAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5 sm:h-6 sm:w-6" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        {cancelCompleted ? (
          // Success State
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">Booking Cancelled!</h3>
              {processRefund ? (
                <>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasAdvance && refundAmount < advancePaid ? (
                      <>Refund: {formatCurrency(refundAmount)} (Deduction: {formatCurrency(advancePaid - refundAmount)})</>
                    ) : (
                      <>Refund: {formatCurrency(refundAmount)}</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Method: {refundMethod?.toUpperCase()}
                  </p>
                  {refundId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Refund ID: #{refundId}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Booking has been cancelled successfully
                </p>
              )}
            </div>
          </div>
        ) : (
          // Cancel Form
          <div className="space-y-4 sm:space-y-6">
            {/* Warning Alert */}
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </AlertDescription>
            </Alert>

            {/* Booking Summary Card */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-3 sm:p-4 space-y-2">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Booking Summary</h3>
                
                <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono font-medium">{booking.booking_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    <span className="font-medium">{booking.event_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{booking.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-2 mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  {hasAdvance && (
                    <div className="flex justify-between items-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      <span className="font-medium">Advance Paid:</span>
                      <span className="font-bold">{formatCurrency(advancePaid)}</span>
                    </div>
                  )}
                  {!hasAdvance && (
                    <div className="flex justify-between items-center text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      <span className="font-medium">Amount Paid by Customer:</span>
                      <span className="font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Current Status:</span>
                    <Badge variant="outline" className={
                      booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }>
                      {booking.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Management Section - Now showing for ALL bookings */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 text-amber-700">
                    <IndianRupee className="h-4 w-4" />
                    Refund Management
                  </h3>
                  {!hasAdvance && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Process Refund</span>
                      <Switch
                        checked={processRefund}
                        onCheckedChange={handleToggleRefund}
                      />
                    </div>
                  )}
                </div>
                
                {(!hasAdvance && !processRefund) ? (
                  <Alert className="bg-gray-50 border-gray-200">
                    <Info className="h-4 w-4 text-gray-600" />
                    <AlertDescription className="text-xs">
                      No refund will be processed for this cancellation. Toggle the switch above to process a goodwill refund.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-4">
                    {/* Show amount paid by customer */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">
                          {hasAdvance ? 'Advance Paid by Customer:' : 'Total Amount Paid by Customer:'}
                        </span>
                        <span className="text-lg font-bold text-blue-700">
                          {formatCurrency(customerPaidAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Refund Amount with Edit Option */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {hasAdvance ? 'Refund Amount' : 'Goodwill Refund Amount'}
                        </Label>
                        {!isEditingRefund && processRefund ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTempRefundAmount(refundAmount);
                              setIsEditingRefund(true);
                            }}
                            className="h-7 text-xs gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit Amount
                          </Button>
                        ) : isEditingRefund && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveRefundAmount}
                              className="h-7 text-xs gap-1 text-green-600"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-7 text-xs gap-1 text-red-600"
                            >
                              <XCircle className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>

                      {isEditingRefund ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={tempRefundAmount}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (value >= 0) {
                                  setTempRefundAmount(value);
                                }
                              }}
                              min={0}
                              max={maxRefundAmount}
                              step="100"
                              className="pl-10"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Min: ₹0</span>
                            <span>Max: {formatCurrency(maxRefundAmount)}</span>
                          </div>
                          {!hasAdvance && (
                            <p className="text-xs text-blue-600">
                              This is a goodwill refund. Amount will be paid to customer even though no advance was taken.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className={`p-3 rounded-lg border ${
                          hasAdvance 
                            ? 'bg-green-50 border-green-200' 
                            : refundAmount > 0 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {hasAdvance ? 'Refund Amount:' : 'Goodwill Amount:'}
                            </span>
                            <span className={`text-lg font-bold ${
                              hasAdvance 
                                ? 'text-green-600' 
                                : refundAmount > 0 
                                  ? 'text-blue-600' 
                                  : 'text-gray-600'
                            }`}>
                              {formatCurrency(refundAmount)}
                            </span>
                          </div>
                          {hasAdvance && refundAmount < advancePaid && (
                            <div className="mt-2 text-xs text-amber-600">
                              Deduction: {formatCurrency(advancePaid - refundAmount)}
                            </div>
                          )}
                          {!hasAdvance && refundAmount > 0 && (
                            <div className="mt-2 text-xs text-blue-600">
                              Goodwill refund - no advance was taken
                            </div>
                          )}
                          {!hasAdvance && refundAmount === 0 && processRefund && (
                            <div className="mt-2 text-xs text-gray-600">
                              No refund will be processed for this cancellation
                            </div>
                          )}
                        </div>
                      )}

                      {/* Deduction Section - Only for advance payment bookings with partial refund */}
                      {hasAdvance && !isEditingRefund && refundAmount < advancePaid && (
                        <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 text-red-600">
                            <Info className="h-4 w-4" />
                            <span className="text-sm font-medium">Cancellation Deduction</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Advance Paid:</span>
                            <span className="font-medium">{formatCurrency(advancePaid)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Refund Amount:</span>
                            <span className="font-medium">{formatCurrency(refundAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold border-t border-red-200 pt-2">
                            <span>Deduction Amount:</span>
                            <span className="text-red-600">{formatCurrency(advancePaid - refundAmount)}</span>
                          </div>
                          <div className="space-y-2 mt-2">
                            <Label className="text-xs">Reason for Deduction *</Label>
                            <Input
                              value={deductionReason}
                              onChange={(e) => setDeductionReason(e.target.value)}
                              placeholder="e.g., Cancellation fee, Service charge"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Refund Method Selection - Show when refund amount > 0 */}
                    {(refundAmount > 0) && (
                      <div className="space-y-2">
                        <Label className="text-sm mb-2 block font-medium">Select Refund Method *</Label>
                        <RadioGroup 
                          value={refundMethod || ''} 
                          onValueChange={(value) => setRefundMethod(value as any)}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2 border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                            <RadioGroupItem value="cash" id="cash" />
                            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Wallet className="h-4 w-4 text-green-600" />
                              <div>
                                <span className="font-medium">Cash Refund</span>
                                <p className="text-xs text-muted-foreground">Refund at hotel reception</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer flex-1">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <div>
                                <span className="font-medium">Online Transfer</span>
                                <p className="text-xs text-muted-foreground">Refund to original payment method</p>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                            <RadioGroupItem value="bank" id="bank" />
                            <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Landmark className="h-4 w-4 text-purple-600" />
                              <div>
                                <span className="font-medium">Bank Transfer</span>
                                <p className="text-xs text-muted-foreground">Transfer to bank account</p>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancellation Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm sm:text-base font-medium">
                Cancellation Reason *
              </Label>
              <Textarea
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide reason for cancellation..."
                className="min-h-[100px]"
                disabled={isProcessing}
              />
            </div>

            {/* Terms Alert */}
            <Alert className="bg-gray-50 border-gray-200">
              <AlertDescription className="text-xs text-muted-foreground">
                By cancelling this booking, you agree to the hotel's cancellation policy.
                {processRefund && " Refund amount can be edited and will be processed according to your selection."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {cancelCompleted ? 'Close' : 'Go Back'}
          </Button>
          
          {!cancelCompleted && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={
                isProcessing ||
                !cancellationReason.trim() ||
                (processRefund && !refundMethod) ||
                (processRefund && refundAmount <= 0) ||
                (processRefund && refundAmount > maxRefundAmount) ||
                (hasAdvance && deductionAmount > 0 && !deductionReason.trim()) ||
                isEditingRefund
              }
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 order-1 sm:order-2"
              size="lg"
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}