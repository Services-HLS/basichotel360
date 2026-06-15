import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConvertBookingFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  advanceBooking: any;
  room: any;
}

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ConvertBookingForm({
  open,
  onClose,
  onSuccess,
  advanceBooking,
  room
}: ConvertBookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [chargeDescription, setChargeDescription] = useState('');

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${NODE_BACKEND_URL}/advance-bookings/${advanceBooking.id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          additional_charges: additionalCharges,
          charge_description: chargeDescription
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Booking Converted",
          description: `Advance booking converted. Room: ${room.number}`,
          variant: "default"
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Conversion failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Advance Booking</DialogTitle>
          <DialogDescription>
            Convert advance booking to regular booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <div className="bg-purple-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-purple-600">Room:</span>
              <span className="font-medium">Room {room.number} ({room.type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Dates:</span>
              <span className="font-medium">
                {new Date(advanceBooking.from_date).toLocaleDateString()} - {new Date(advanceBooking.to_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Customer:</span>
              <span className="font-medium">{advanceBooking.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Total Amount:</span>
              <span className="font-bold">₹{advanceBooking.total}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Advance Paid:</span>
              <span className="font-bold">₹{advanceBooking.advance_amount}</span>
            </div>
            <div className="flex justify-between text-orange-600 border-t pt-2">
              <span>Balance Due:</span>
              <span className="font-bold">₹{advanceBooking.remaining_amount}</span>
            </div>
          </div>

          {/* Additional Charges (Optional) */}
          <div className="space-y-2">
            <Label>Additional Charges (Optional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={additionalCharges || ''}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
              <Input
                placeholder="Description"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Advance payment of ₹{advanceBooking.advance_amount} will be applied. 
              Balance ₹{advanceBooking.remaining_amount + additionalCharges} to be collected at check-in.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleConvert}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                'Confirm Conversion'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}