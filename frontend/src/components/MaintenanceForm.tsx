// components/MaintenanceForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Wrench, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmzEN8dvGOZQKM4Dok-vf59Wvjg9uf3_hn7YWhn-WTaWL8TKl5YSSyFevYx9Ovucqb/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface MaintenanceFormProps {
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

const MaintenanceForm = ({
  room,
  defaultDateRange,
  onClose,
  onSuccess,
  userSource,
  spreadsheetId
}: MaintenanceFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange || {
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 1))
    }
  );

  // JSONP fetch for Google Sheets
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

  const maintenanceTypes = [
    'Electrical',
    'Plumbing',
    'HVAC',
    'Carpentry',
    'Painting',
    'Cleaning',
    'Furniture Repair',
    'Appliance Repair',
    'Structural',
    'Other'
  ];

// Update the handleSubmit function in MaintenanceForm.tsx
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

  if (!maintenanceType) {
    toast({
      title: "Error",
      description: "Please select maintenance type",
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
      maintenanceType,
      description,
      assignedTo,
      estimatedCost: estimatedCost || 0,
      priority
    };

    console.log('📤 Maintenance payload:', payload);

    if (userSource === 'database') {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/bookings/maintenance`, {
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
          description: `Maintenance request submitted for Room ${room.number}`
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to submit maintenance request');
      }
    } else {
      // Google Sheets
      if (!spreadsheetId) {
        throw new Error('No spreadsheet ID provided');
      }

      const params = new URLSearchParams();
      params.append('action', 'maintenance');
      params.append('spreadsheetid', spreadsheetId);
      params.append('roomId', String(room.roomId));
      params.append('roomNumber', String(room.number));
      params.append('fromDate', format(dateRange.from, 'yyyy-MM-dd'));
      params.append('toDate', format(dateRange.to, 'yyyy-MM-dd'));
      params.append('maintenanceType', maintenanceType);
      params.append('description', description || '');
      params.append('assignedTo', assignedTo || '');
      params.append('estimatedCost', estimatedCost || '0');
      params.append('priority', priority);

      const scriptUrl = `${APPS_SCRIPT_URL}?${params.toString()}`;
      console.log('📤 Calling Google Apps Script:', scriptUrl);

      const result = await jsonpFetch<any>(scriptUrl);
      console.log('✅ Google Sheets response:', result);

      if (result && result.success) {
        toast({
          title: "Success",
          description: `Maintenance request submitted for Room ${room.number}`
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(result?.error || 'Failed to submit maintenance request');
      }
    }
  } catch (error: any) {
    console.error('❌ Error setting maintenance:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to set maintenance. Please try again.",
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
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Request
              </h2>
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
            {/* Maintenance Type */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceType">Maintenance Type *</Label>
              <Select value={maintenanceType} onValueChange={setMaintenanceType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Maintenance Dates *</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Date</Label>
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
                  <Label className="text-xs">End Date</Label>
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

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      High Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Urgent (Room Out of Service)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description / Issue Details</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance issue or requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Technician/Team)</Label>
              <Input
                id="assignedTo"
                placeholder="Enter technician name or team"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            {/* Estimated Cost */}
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
              <Input
                id="estimatedCost"
                type="number"
                placeholder="0.00"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Summary */}
            {dateRange?.from && dateRange?.to && (
              <div className="p-3 bg-yellow-50 rounded-md space-y-2">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Maintenance Summary</span>
                </div>
                <div className="text-sm text-yellow-700 grid grid-cols-2 gap-2">
                  <div>Duration:</div>
                  <div className="font-semibold">
                    {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                  <div>Room Status:</div>
                  <div className="font-semibold">Out of Service</div>
                  <div>Priority:</div>
                  <div className="font-semibold capitalize">{priority}</div>
                </div>
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
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? 'Submitting...' : 'Submit Maintenance Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceForm;