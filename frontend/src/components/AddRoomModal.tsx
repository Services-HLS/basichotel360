

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Sparkles } from 'lucide-react';

export interface AddRoomModalProps {
  open: boolean;
  onClose: () => void;
  spreadsheetId: string;
  userSource?: string; // 'database' or 'google_sheets'
  onRoomAdded?: () => Promise<void>;
  roomType?: 'standard' | 'function'; // NEW: determines which form to show
}

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// JSONP for Google Sheets
function jsonpRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    (window as any)[callbackName] = function (data: any) {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    const script = document.createElement('script');
    script.src = `${url}&callback=${callbackName}`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error('Network request failed'));
    };
    document.body.appendChild(script);
  });
}

// Fetch for Backend Database
async function fetchBackendRequest(endpoint: string, data: any): Promise<any> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${NODE_BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return await response.json();
}

// Function room types
const FUNCTION_ROOM_TYPES = [
  { value: 'banquet', label: 'Banquet Hall', icon: '🎉' },
  { value: 'conference', label: 'Conference Room', icon: '💼' },
  { value: 'meeting', label: 'Meeting Room', icon: '🤝' },
  { value: 'party', label: 'Party Hall', icon: '🎊' },
  { value: 'wedding', label: 'Wedding Hall', icon: '💒' },
  { value: 'seminar', label: 'Seminar Hall', icon: '📚' },
  { value: 'training', label: 'Training Room', icon: '📝' },
  { value: 'other', label: 'Other', icon: '🏛️' }
];

// Available setup options for function rooms
const SETUP_OPTIONS_LIST = [
  'Theater (50-100)',
  'Classroom (30-50)',
  'U-Shape (20-30)',
  'Boardroom (10-20)',
  'Banquet (40-80)',
  'Cabaret (30-60)',
  'Hollow Square (20-40)',
  'Reception (50-100+)'
];

// ===========================================
// SUB-COMPONENTS (Moved outside to prevent re-mounting on every state change)
// ===========================================

interface FunctionRoomFormProps {
  functionForm: any;
  setFunctionForm: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
}

const FunctionRoomForm = ({ functionForm, setFunctionForm, loading }: FunctionRoomFormProps) => (
  <div className="space-y-6">
    {/* Basic Information */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        Basic Information
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room/Hall Number *</Label>
          <Input
            id="roomNumber"
            value={functionForm.roomNumber}
            onChange={(e) => setFunctionForm({ ...functionForm, roomNumber: e.target.value })}
            placeholder="e.g., F101"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomName">Hall Name</Label>
          <Input
            id="roomName"
            value={functionForm.name}
            onChange={(e) => setFunctionForm({ ...functionForm, name: e.target.value })}
            placeholder="e.g., Grand Ballroom"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="functionType">Function Type *</Label>
          <select
            id="functionType"
            value={functionForm.type}
            onChange={(e) => setFunctionForm({ ...functionForm, type: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            disabled={loading}
          >
            {FUNCTION_ROOM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity (Guests) *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={functionForm.capacity}
            onChange={(e) => setFunctionForm({ ...functionForm, capacity: Number(e.target.value) })}
            placeholder="Max guests"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="floor">Floor</Label>
          <Input
            id="floor"
            type="number"
            min="0"
            value={functionForm.floor}
            onChange={(e) => setFunctionForm({ ...functionForm, floor: Number(e.target.value) })}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="areaSqft">Area (sq.ft.)</Label>
          <Input
            id="areaSqft"
            type="number"
            min="0"
            value={functionForm.areaSqft}
            onChange={(e) => setFunctionForm({ ...functionForm, areaSqft: Number(e.target.value) })}
            placeholder="e.g., 1500"
            disabled={loading}
          />
        </div>
      </div>
    </div>

    {/* Pricing Section */}
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Pricing Options
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="basePrice">Full Day (₹) *</Label>
          <Input
            id="basePrice"
            type="number"
            min="0"
            step="0.01"
            value={functionForm.basePrice}
            onChange={(e) => setFunctionForm({ ...functionForm, basePrice: Number(e.target.value) })}
            placeholder="Full day rate"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="halfDayPrice">Half Day (₹)</Label>
          <Input
            id="halfDayPrice"
            type="number"
            min="0"
            step="0.01"
            value={functionForm.halfDayPrice}
            onChange={(e) => setFunctionForm({ ...functionForm, halfDayPrice: Number(e.target.value) })}
            placeholder="Optional"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
          <Input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={functionForm.hourlyRate}
            onChange={(e) => setFunctionForm({ ...functionForm, hourlyRate: Number(e.target.value) })}
            placeholder="Optional"
            disabled={loading}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        At least one pricing option is required. Full day price is mandatory.
      </p>
    </div>

    {/* Features & Amenities */}
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        Features & Amenities
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasAC"
            checked={functionForm.hasAC}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasAC: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasAC" className="text-sm font-medium cursor-pointer">
            Air Conditioned
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasProjector"
            checked={functionForm.hasProjector}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasProjector: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasProjector" className="text-sm font-medium cursor-pointer">
            Projector/Screen
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasSoundSystem"
            checked={functionForm.hasSoundSystem}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasSoundSystem: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasSoundSystem" className="text-sm font-medium cursor-pointer">
            Sound System
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasWiFi"
            checked={functionForm.hasWiFi}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasWiFi: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasWiFi" className="text-sm font-medium cursor-pointer">
            WiFi
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasCatering"
            checked={functionForm.hasCatering}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasCatering: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasCatering" className="text-sm font-medium cursor-pointer">
            In-house Catering
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasParking"
            checked={functionForm.hasParking}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasParking: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasParking" className="text-sm font-medium cursor-pointer">
            Parking Available
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasStage"
            checked={functionForm.hasStage}
            onCheckedChange={(checked) => setFunctionForm({ ...functionForm, hasStage: checked as boolean })}
            disabled={loading}
          />
          <label htmlFor="hasStage" className="text-sm font-medium cursor-pointer">
            Stage/Dais
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Setup Options</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SETUP_OPTIONS_LIST.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`setup-${option}`}
                checked={functionForm.setupOptions.includes(option)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFunctionForm({
                      ...functionForm,
                      setupOptions: [...functionForm.setupOptions, option]
                    });
                  } else {
                    setFunctionForm({
                      ...functionForm,
                      setupOptions: functionForm.setupOptions.filter((o: string) => o !== option)
                    });
                  }
                }}
                disabled={loading}
              />
              <label htmlFor={`setup-${option}`} className="text-sm font-medium leading-none cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amenities">Additional Amenities</Label>
        <Input
          id="amenities"
          value={functionForm.amenities}
          onChange={(e) => setFunctionForm({ ...functionForm, amenities: e.target.value })}
          placeholder="e.g., Whiteboard, Flip chart, Microphones, etc."
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dimensions">Dimensions</Label>
        <Input
          id="dimensions"
          value={functionForm.dimensions}
          onChange={(e) => setFunctionForm({ ...functionForm, dimensions: e.target.value })}
          placeholder="e.g., 40ft x 60ft"
          disabled={loading}
        />
      </div>
    </div>
  </div>
);


const AddRoomModal = ({
  open,
  onClose,
  spreadsheetId,
  userSource,
  onRoomAdded,
  roomType = 'standard'
}: AddRoomModalProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'single' | 'range' | 'multiple'>('single');
  const [loading, setLoading] = useState(false);

  // ===========================================
  // STANDARD ROOM STATES
  // ===========================================
  const [singleForm, setSingleForm] = useState({
    roomNumber: '',
    roomType: '',
    floor: 1,
    basePrice: 0,
  });

  const [rangeForm, setRangeForm] = useState({
    startRoom: '',
    endRoom: '',
    roomType: '',
    floor: 1,
    basePrice: 0,
  });

  const [multipleRooms, setMultipleRooms] = useState<Array<{
    roomNumber: string;
    roomType: string;
    floor: number;
    basePrice: number;
  }>>([{ roomNumber: '', roomType: '', floor: 1, basePrice: 0 }]);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // ===========================================
  // FUNCTION ROOM STATES
  // ===========================================
  const [functionForm, setFunctionForm] = useState({
    roomNumber: '',
    name: '',
    type: 'banquet',
    capacity: 50,
    floor: 1,
    basePrice: 0,
    halfDayPrice: 0,
    hourlyRate: 0,
    dimensions: '',
    areaSqft: 0,
    amenities: '',
    hasAC: true,
    hasProjector: false,
    hasSoundSystem: false,
    hasWiFi: true,
    hasCatering: false,
    hasParking: false,
    hasStage: false,
    setupOptions: [] as string[]
  });

  const availableAmenities = [
    'AC', 'WiFi', 'TV', 'Mini Bar', 'Room Service', 'Jacuzzi', 'Balcony', 'Sea View'
  ];

  // ===========================================
  // RESET FORMS
  // ===========================================
  const resetForms = () => {
    // Standard room forms
    setSingleForm({ roomNumber: '', roomType: '', floor: 1, basePrice: 0 });
    setRangeForm({ startRoom: '', endRoom: '', roomType: '', floor: 1, basePrice: 0 });
    setMultipleRooms([{ roomNumber: '', roomType: '', floor: 1, basePrice: 0 }]);
    setSelectedAmenities([]);

    // Function room form
    setFunctionForm({
      roomNumber: '',
      name: '',
      type: 'banquet',
      capacity: 50,
      floor: 1,
      basePrice: 0,
      halfDayPrice: 0,
      hourlyRate: 0,
      dimensions: '',
      areaSqft: 0,
      amenities: '',
      hasAC: true,
      hasProjector: false,
      hasSoundSystem: false,
      hasWiFi: true,
      hasCatering: false,
      hasParking: false,
      hasStage: false,
      setupOptions: []
    });

    setMode('single');
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  // ===========================================
  // STANDARD ROOM API CALLS
  // ===========================================
  const saveToGoogleSheets = async (roomData: any) => {
    const params = new URLSearchParams({
      action: 'addroom',
      spreadsheetid: spreadsheetId,
      number: roomData.roomNumber.trim(),
      type: roomData.roomType.trim(),
      floor: String(roomData.floor),
      price: String(roomData.basePrice),
      amenities: roomData.amenities.join(','),
    });
    const result = await jsonpRequest(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);
    return result;
  };

  const saveMultipleToGoogleSheets = async (rooms: any[]) => {
    const promises = rooms.map(room => {
      const params = new URLSearchParams({
        action: 'addroom',
        spreadsheetid: spreadsheetId,
        number: room.roomNumber.trim(),
        type: room.roomType.trim(),
        floor: String(room.floor),
        price: String(room.basePrice),
        amenities: room.amenities.join(','),
      });
      return jsonpRequest(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);
    });

    const results = await Promise.all(promises);
    const allSuccess = results.every(r => r.success);
    return { success: allSuccess, results };
  };

  const saveToBackend = async (roomData: any) => {
    const backendData = {
      room_number: roomData.roomNumber.trim(),
      type: roomData.roomType.trim(),
      floor: roomData.floor,
      price: roomData.basePrice,
      amenities: roomData.amenities.join(','),
      status: 'available'
    };
    const result = await fetchBackendRequest('/rooms', backendData);
    return result;
  };

  const saveMultipleToBackend = async (rooms: any[]) => {
    if (mode === 'range') {
      const rangeData = {
        room_number_start: rangeForm.startRoom,
        room_number_end: rangeForm.endRoom,
        type: rangeForm.roomType,
        floor: rangeForm.floor,
        price: rangeForm.basePrice,
        amenities: selectedAmenities.join(','),
        status: 'available'
      };
      const result = await fetchBackendRequest('/rooms/batch', rangeData);
      return result;
    } else {
      const batchData = {
        rooms: rooms.map(room => ({
          room_number: room.roomNumber.trim(),
          type: room.roomType.trim(),
          floor: room.floor,
          price: room.basePrice,
          amenities: selectedAmenities.join(','),
          status: 'available'
        }))
      };
      const result = await fetchBackendRequest('/rooms/batch-multiple', batchData);
      return result;
    }
  };

  // ===========================================
  // FUNCTION ROOM API CALLS
  // ===========================================
  const saveFunctionRoomToBackend = async (roomData: any) => {
    try {
      const backendData = {
        room_number: roomData.roomNumber.trim(),
        name: roomData.name || roomData.roomNumber.trim(),
        type: roomData.type,
        capacity: roomData.capacity,
        floor: roomData.floor,
        base_price: roomData.basePrice,
        half_day_price: roomData.halfDayPrice || null,
        hourly_rate: roomData.hourlyRate || null,
        amenities: roomData.amenities,
        dimensions: roomData.dimensions || null,
        area_sqft: roomData.areaSqft || null,
        has_ac: roomData.hasAC,
        has_projector: roomData.hasProjector,
        has_sound_system: roomData.hasSoundSystem,
        has_wifi: roomData.hasWiFi,
        has_catering: roomData.hasCatering,
        has_parking: roomData.hasParking,
        has_stage: roomData.hasStage,
        setup_options: roomData.setupOptions.join(','),
        status: 'available' as const
      };

      // Import the API function
      const { createFunctionRoom } = await import('@/lib/functionRoomApi');
      const result = await createFunctionRoom(backendData);
      return result;
    } catch (error) {
      console.error('Error saving function room:', error);
      throw error;
    }
  };

  const saveMultipleFunctionRooms = async (rooms: any[]) => {
    try {
      const { createMultipleFunctionRooms } = await import('@/lib/functionRoomApi');

      if (mode === 'range') {
        const rangeData = {
          room_number_start: rangeForm.startRoom,
          room_number_end: rangeForm.endRoom,
          name_prefix: functionForm.name || 'Function',
          type: functionForm.type,
          capacity: functionForm.capacity,
          floor: functionForm.floor,
          base_price: functionForm.basePrice,
          half_day_price: functionForm.halfDayPrice || null,
          hourly_rate: functionForm.hourlyRate || null,
          amenities: functionForm.amenities,
          status: 'available'
        };

        const result = await createMultipleFunctionRooms(rangeData);
        return result;
      } else {
        const batchData = {
          rooms: rooms.map(room => ({
            room_number: room.roomNumber.trim(),
            name: room.name || room.roomNumber.trim(),
            type: room.type || functionForm.type,
            capacity: room.capacity || functionForm.capacity,
            floor: room.floor,
            base_price: room.basePrice,
            half_day_price: room.halfDayPrice || null,
            hourly_rate: room.hourlyRate || null,
            amenities: room.amenities || functionForm.amenities,
            has_ac: room.hasAC !== undefined ? room.hasAC : functionForm.hasAC,
            has_projector: room.hasProjector !== undefined ? room.hasProjector : functionForm.hasProjector,
            has_sound_system: room.hasSoundSystem !== undefined ? room.hasSoundSystem : functionForm.hasSoundSystem,
            has_wifi: room.hasWiFi !== undefined ? room.hasWiFi : functionForm.hasWiFi,
            has_catering: room.hasCatering !== undefined ? room.hasCatering : functionForm.hasCatering,
            has_parking: room.hasParking !== undefined ? room.hasParking : functionForm.hasParking,
            has_stage: room.hasStage !== undefined ? room.hasStage : functionForm.hasStage,
            setup_options: room.setupOptions || functionForm.setupOptions.join(',')
          }))
        };

        const result = await createMultipleFunctionRooms(batchData);
        return result;
      }
    } catch (error) {
      console.error('Error saving multiple function rooms:', error);
      throw error;
    }
  };

  // ===========================================
  // MULTIPLE ROOMS HANDLERS (Standard)
  // ===========================================
  const addMultipleRoomRow = () => {
    setMultipleRooms([...multipleRooms, { roomNumber: '', roomType: '', floor: 1, basePrice: 0 }]);
  };

  const removeMultipleRoomRow = (index: number) => {
    if (multipleRooms.length > 1) {
      const updated = [...multipleRooms];
      updated.splice(index, 1);
      setMultipleRooms(updated);
    }
  };

  const updateMultipleRoom = (index: number, field: string, value: string | number) => {
    const updated = [...multipleRooms];
    updated[index] = { ...updated[index], [field]: value };
    setMultipleRooms(updated);
  };

  // ===========================================
  // AMENITIES HANDLER
  // ===========================================
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // ===========================================
  // SUBMIT HANDLER
  // ===========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;

      if (roomType === 'function') {
        // ===========================================
        // FUNCTION ROOM SUBMISSION
        // ===========================================

        // Validate PRO plan only
        if (userSource !== 'database') {
          toast({
            title: 'PRO Plan Feature',
            description: 'Function rooms are only available for PRO plan users with database',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        if (mode === 'single') {
          // Validate single function room
          if (!functionForm.roomNumber.trim()) {
            toast({ title: 'Validation Error', description: 'Room number is required', variant: 'destructive' });
            setLoading(false);
            return;
          }
          if (!functionForm.type) {
            toast({ title: 'Validation Error', description: 'Room type is required', variant: 'destructive' });
            setLoading(false);
            return;
          }
          if (functionForm.capacity <= 0) {
            toast({ title: 'Validation Error', description: 'Capacity must be greater than 0', variant: 'destructive' });
            setLoading(false);
            return;
          }
          if (functionForm.basePrice <= 0) {
            toast({ title: 'Validation Error', description: 'Base price must be greater than 0', variant: 'destructive' });
            setLoading(false);
            return;
          }

          result = await saveFunctionRoomToBackend(functionForm);

        } else if (mode === 'range') {
          // Validate range
          if (!rangeForm.startRoom || !rangeForm.endRoom) {
            toast({ title: 'Validation Error', description: 'Start and end room numbers are required', variant: 'destructive' });
            setLoading(false);
            return;
          }

          const start = parseInt(rangeForm.startRoom);
          const end = parseInt(rangeForm.endRoom);

          if (isNaN(start) || isNaN(end) || start > end) {
            toast({ title: 'Validation Error', description: 'Invalid room range', variant: 'destructive' });
            setLoading(false);
            return;
          }

          result = await saveMultipleFunctionRooms([]);

        } else if (mode === 'multiple') {
          // Validate multiple rooms
          const validRooms = multipleRooms.filter(room =>
            room.roomNumber.trim()
          );

          if (validRooms.length === 0) {
            toast({ title: 'Validation Error', description: 'Add at least one valid function room', variant: 'destructive' });
            setLoading(false);
            return;
          }

          result = await saveMultipleFunctionRooms(validRooms);
        }

        if (result.success) {
          const message = mode === 'single'
            ? `Function room ${functionForm.roomNumber} added successfully!`
            : `${mode === 'range'
              ? `${parseInt(rangeForm.endRoom) - parseInt(rangeForm.startRoom) + 1} function rooms`
              : `${multipleRooms.filter(r => r.roomNumber.trim()).length} function rooms`} added successfully!`;

          toast({
            title: 'Success',
            description: message,
          });

          resetForms();
          onClose();
          if (onRoomAdded) await onRoomAdded();
        } else {
          toast({
            title: 'Error',
            description: result.message || 'Failed to add function rooms',
            variant: 'destructive',
          });
        }

      } else {
        // ===========================================
        // STANDARD ROOM SUBMISSION
        // ===========================================
        const amenities = selectedAmenities;

        if (mode === 'single') {
          // Validate single room
          if (!singleForm.roomNumber.trim() || !singleForm.roomType.trim()) {
            toast({ title: 'Validation Error', description: 'All fields are required', variant: 'destructive' });
            setLoading(false);
            return;
          }

          const roomData = { ...singleForm, amenities };

          if (userSource === 'database') {
            result = await saveToBackend(roomData);
          } else {
            result = await saveToGoogleSheets(roomData);
          }

        } else if (mode === 'range') {
          // Validate range
          if (!rangeForm.startRoom || !rangeForm.endRoom || !rangeForm.roomType.trim()) {
            toast({ title: 'Validation Error', description: 'All fields are required', variant: 'destructive' });
            setLoading(false);
            return;
          }

          const start = parseInt(rangeForm.startRoom);
          const end = parseInt(rangeForm.endRoom);

          if (isNaN(start) || isNaN(end) || start > end) {
            toast({ title: 'Validation Error', description: 'Invalid room range', variant: 'destructive' });
            setLoading(false);
            return;
          }

          if (userSource === 'database') {
            result = await saveMultipleToBackend([]);
          } else {
            // For Google Sheets, create each room individually
            const rooms = [];
            for (let i = start; i <= end; i++) {
              rooms.push({
                roomNumber: i.toString(),
                roomType: rangeForm.roomType,
                floor: rangeForm.floor,
                basePrice: rangeForm.basePrice,
                amenities
              });
            }
            result = await saveMultipleToGoogleSheets(rooms);
          }

        } else if (mode === 'multiple') {
          // Validate multiple rooms
          const validRooms = multipleRooms.filter(room =>
            room.roomNumber.trim() && room.roomType.trim()
          );

          if (validRooms.length === 0) {
            toast({ title: 'Validation Error', description: 'Add at least one valid room', variant: 'destructive' });
            setLoading(false);
            return;
          }

          if (userSource === 'database') {
            result = await saveMultipleToBackend(validRooms);
          } else {
            const roomsWithAmenities = validRooms.map(room => ({ ...room, amenities }));
            result = await saveMultipleToGoogleSheets(roomsWithAmenities);
          }
        }

        if (result.success) {
          const message = mode === 'single'
            ? `Room ${singleForm.roomNumber} added successfully!`
            : `${mode === 'range'
              ? `${parseInt(rangeForm.endRoom) - parseInt(rangeForm.startRoom) + 1} rooms`
              : `${multipleRooms.filter(r => r.roomNumber.trim() && r.roomType.trim()).length} rooms`} added successfully!`;

          toast({
            title: 'Success',
            description: message,
          });

          resetForms();
          onClose();
          if (onRoomAdded) await onRoomAdded();
        } else {
          toast({
            title: 'Error',
            description: result.message || 'Failed to add rooms',
            variant: 'destructive',
          });
        }
      }

    } catch (err: any) {
      console.error('Add room error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // FUNCTION ROOM FORM JSX
  // ===========================================


  // ===========================================
  // RENDER
  // ===========================================
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`${roomType === 'function' ? 'max-w-5xl' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {roomType === 'function' ? 'Add New Function Room' : 'Add New Room(s)'}
          </DialogTitle>
          <DialogDescription>
            {roomType === 'function' ? (
              <>
                Add banquet halls, conference rooms, and event spaces.
                {userSource === 'database' ? (
                  <span className="ml-1 font-medium text-green-600">(PRO Plan Feature)</span>
                ) : (
                  <span className="ml-1 font-medium text-amber-600">
                    (Available only for PRO plan with database)
                  </span>
                )}
              </>
            ) : (
              `Choose how you want to add rooms.`
            )}
          </DialogDescription>
        </DialogHeader>

        {roomType === 'function' ? (
          // ===========================================
          // FUNCTION ROOM FORM (No tabs)
          // ===========================================
          <form onSubmit={handleSubmit}>
            {userSource !== 'database' ? (
              <div className="py-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">PRO Plan Feature</h3>
                <p className="text-muted-foreground mb-4">
                  Function rooms are only available for PRO plan users with database storage.
                </p>
                <Button
                  type="button"
                  onClick={() => window.location.href = '/upgrade'}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to PRO
                </Button>
              </div>
            ) : (
              <>
                <FunctionRoomForm
                  functionForm={functionForm}
                  setFunctionForm={setFunctionForm}
                  loading={loading}
                />

                <div className="flex gap-3 justify-end pt-6 border-t mt-6">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Function Room'}
                  </Button>
                </div>
              </>
            )}
          </form>
        ) : (
          // ===========================================
          // STANDARD ROOM FORM (With tabs)
          // ===========================================
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            {/* Responsive TabsList */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
              <TabsList className="inline-flex w-full min-w-[300px] sm:grid sm:grid-cols-3 gap-1 bg-transparent sm:bg-muted p-1">
                <TabsTrigger
                  value="single"
                  className={`
          flex items-center justify-center px-4 py-2 text-sm
          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
          data-[state=active]:shadow-sm
          data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
          hover:bg-gray-200 transition-all duration-200
          rounded-md whitespace-nowrap
        `}
                >
                  Single Room
                </TabsTrigger>

                <TabsTrigger
                  value="range"
                  className={`
          flex items-center justify-center px-4 py-2 text-sm
          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
          data-[state=active]:shadow-sm
          data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
          hover:bg-gray-200 transition-all duration-200
          rounded-md whitespace-nowrap
        `}
                >
                  Room Range
                </TabsTrigger>

                <TabsTrigger
                  value="multiple"
                  className={`
          flex items-center justify-center px-4 py-2 text-sm
          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
          data-[state=active]:shadow-sm
          data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
          hover:bg-gray-200 transition-all duration-200
          rounded-md whitespace-nowrap
        `}
                >
                  Multiple Rooms
                </TabsTrigger>
              </TabsList>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Single Room Tab */}
              <TabsContent value="single" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number *</Label>
                    <Input
                      id="roomNumber"
                      value={singleForm.roomNumber}
                      onChange={(e) => setSingleForm({ ...singleForm, roomNumber: e.target.value })}
                      placeholder="e.g., 101"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomType">Room Type *</Label>
                    <Input
                      id="roomType"
                      value={singleForm.roomType}
                      onChange={(e) => setSingleForm({ ...singleForm, roomType: e.target.value })}
                      placeholder="e.g., Deluxe"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor *</Label>
                    <Input
                      id="floor"
                      type="number"
                      min="0"
                      value={singleForm.floor}
                      onChange={(e) => setSingleForm({ ...singleForm, floor: Number(e.target.value) })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price (₹) *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={singleForm.basePrice}
                      onChange={(e) => setSingleForm({ ...singleForm, basePrice: Number(e.target.value) })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Room Range Tab */}
              <TabsContent value="range" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startRoom">Start Room Number *</Label>
                    <Input
                      id="startRoom"
                      value={rangeForm.startRoom}
                      onChange={(e) => setRangeForm({ ...rangeForm, startRoom: e.target.value })}
                      placeholder="e.g., 101"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endRoom">End Room Number *</Label>
                    <Input
                      id="endRoom"
                      value={rangeForm.endRoom}
                      onChange={(e) => setRangeForm({ ...rangeForm, endRoom: e.target.value })}
                      placeholder="e.g., 110"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomType">Room Type *</Label>
                    <Input
                      id="roomType"
                      value={rangeForm.roomType}
                      onChange={(e) => setRangeForm({ ...rangeForm, roomType: e.target.value })}
                      placeholder="e.g., Standard"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor *</Label>
                    <Input
                      id="floor"
                      type="number"
                      min="0"
                      value={rangeForm.floor}
                      onChange={(e) => setRangeForm({ ...rangeForm, floor: Number(e.target.value) })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="basePrice">Base Price (₹) *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={rangeForm.basePrice}
                      onChange={(e) => setRangeForm({ ...rangeForm, basePrice: Number(e.target.value) })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  This will create rooms from {rangeForm.startRoom || '...'} to {rangeForm.endRoom || '...'} with the same type, floor, and price.
                  {rangeForm.startRoom && rangeForm.endRoom && !isNaN(parseInt(rangeForm.startRoom)) && !isNaN(parseInt(rangeForm.endRoom)) &&
                    ` (${Math.max(0, parseInt(rangeForm.endRoom) - parseInt(rangeForm.startRoom) + 1)} rooms)`}
                </div>
              </TabsContent>

              {/* Multiple Rooms Tab */}
              <TabsContent value="multiple" className="space-y-4">
                <div className="space-y-4">
                  {multipleRooms.map((room, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg">
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Room #{index + 1}</Label>
                        <Input
                          placeholder="Room Number"
                          value={room.roomNumber}
                          onChange={(e) => updateMultipleRoom(index, 'roomNumber', e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Input
                          placeholder="Type"
                          value={room.roomType}
                          onChange={(e) => updateMultipleRoom(index, 'roomType', e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Floor</Label>
                        <Input
                          type="number"
                          min="0"
                          value={room.floor}
                          onChange={(e) => updateMultipleRoom(index, 'floor', Number(e.target.value))}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Price (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={room.basePrice}
                          onChange={(e) => updateMultipleRoom(index, 'basePrice', Number(e.target.value))}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="col-span-1">
                        {multipleRooms.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMultipleRoomRow(index)}
                            disabled={loading}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMultipleRoomRow}
                    className="w-full"
                    disabled={loading}
                  >
                    + Add Another Room
                  </Button>
                </div>
              </TabsContent>

              {/* Amenities Section (Common for all standard room tabs) */}
              <div className="space-y-3 pt-4">
                <Label>Amenities (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={selectedAmenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                        disabled={loading}
                      />
                      <label htmlFor={amenity} className="text-sm font-medium leading-none cursor-pointer">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons for Standard Rooms */}
              <div className="flex gap-3 justify-end pt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : `Add ${mode === 'single' ? 'Room' : 'Rooms'} `}
                </Button>
              </div>
            </form>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddRoomModal;