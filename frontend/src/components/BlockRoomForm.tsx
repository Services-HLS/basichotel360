// components/BlockRoomForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmzEN8dvGOZQKM4Dok-vf59Wvjg9uf3_hn7YWhn-WTaWL8TKl5YSSyFevYx9Ovucqb/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface BlockRoomFormProps {
  room: {
    roomId: string;
    number: string | number;
    type: string;
    price: number;
  };
  defaultDateRange?: DateRange;
  onClose: () => void;
  onSuccess: () => void;
  userSource?: string;
  spreadsheetId?: string;
}

const BlockRoomForm = ({
  room,
  defaultDateRange,
  onClose,
  onSuccess,
  userSource,
  spreadsheetId
}: BlockRoomFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [blockedBy, setBlockedBy] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange || {
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 1))
    }
  );

  const [customerName, setCustomerName] = useState('');

  // JSONP fetch for Google Sheets (same as in RoomBooking component)
  function jsonpFetch<T>(src: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const callbackName = 'cb_' + String(Date.now()) + String(Math.floor(Math.random() * 10000));

      (window as any)[callbackName] = (data: T) => {
        console.log('📥 JSONP Callback received:', data);
        resolve(data);
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      const script = document.createElement('script');
      script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName + '&_=' + Date.now();
      script.id = callbackName;

      script.onerror = () => {
        console.error('❌ JSONP Script load error');
        reject(new Error('Failed to load script'));
        delete (window as any)[callbackName];
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      document.body.appendChild(script);
    });
  }

  // Update the handleSubmit function in BlockRoomForm.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive"
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for blocking",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        roomId: room.roomId,
        roomNumber: String(room.number),
        fromDate: format(dateRange.from, 'yyyy-MM-dd'),
        toDate: format(dateRange.to, 'yyyy-MM-dd'),
        reason,
        blockedBy: blockedBy || 'Admin',
          customerName: customerName || undefined  
      };

      console.log('📤 Block room payload:', payload);

      if (userSource === 'database') {
        // Call the new block-room endpoint
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${NODE_BACKEND_URL}/bookings/block-room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('✅ Database response:', result);

        if (response.ok && result.success) {
          toast({
            title: "Success",
            description: `Room ${room.number} has been blocked successfully`
          });
          onSuccess();
          onClose();
        } else {
          throw new Error(result.message || 'Failed to block room');
        }
      } else {
        // Google Sheets - use JSONP
        if (!spreadsheetId) {
          throw new Error('No spreadsheet ID provided');
        }

        const params = new URLSearchParams();
        params.append('action', 'blockRoom');
        params.append('spreadsheetid', spreadsheetId);
        params.append('roomId', String(room.roomId));
        params.append('roomNumber', String(room.number));
        params.append('fromDate', format(dateRange.from, 'yyyy-MM-dd'));
        params.append('toDate', format(dateRange.to, 'yyyy-MM-dd'));
        params.append('reason', reason);
        params.append('blockedBy', blockedBy || 'Admin');

        const scriptUrl = `${APPS_SCRIPT_URL}?${params.toString()}`;
        console.log('📤 Calling Google Apps Script:', scriptUrl);

        const result = await jsonpFetch<any>(scriptUrl);
        console.log('✅ Google Sheets response:', result);

        if (result && result.success) {
          toast({
            title: "Success",
            description: `Room ${room.number} has been blocked successfully`
          });
          onSuccess();
          onClose();
        } else {
          throw new Error(result?.error || 'Failed to block room in Google Sheets');
        }
      }
    } catch (error: any) {
      console.error('❌ Error blocking room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to block room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Block Room</h2>
              <p className="text-muted-foreground mt-1">Room {room.number} - {room.type}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label>Block Dates</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">From Date *</Label>
                  <Input
                    type="date"
                    value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateRange(prev => ({
                          ...prev,
                          from: new Date(e.target.value)
                        }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">To Date *</Label>
                  <Input
                    type="date"
                    value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateRange(prev => ({
                          ...prev,
                          to: new Date(e.target.value)
                        }));
                      }
                    }}
                    min={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Reason for Blocking */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Blocking *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for blocking the room (e.g., renovation, VIP, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name for this block"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Associate this block with a customer
              </p>
            </div>

            {/* Blocked By */}
            <div className="space-y-2">
              <Label htmlFor="blockedBy">Blocked By</Label>
              <Input
                id="blockedBy"
                placeholder="Enter your name or department"
                value={blockedBy}
                onChange={(e) => setBlockedBy(e.target.value)}
              />
            </div>

            {/* Estimated Duration Display */}
            {dateRange?.from && dateRange?.to && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Room will be blocked for{' '}
                  <span className="font-semibold">
                    {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                  {' '}(from {format(dateRange.from, 'MMM dd, yyyy')} to {format(dateRange.to, 'MMM dd, yyyy')})
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Blocking...' : 'Block Room'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlockRoomForm;