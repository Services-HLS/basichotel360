// components/EditRoomModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface EditRoomModalProps {
  open: boolean;
  onClose: () => void;
  room: any;
  userSource: string;
  onRoomUpdated: () => void;
}

export default function EditRoomModal({ open, onClose, room, userSource, onRoomUpdated }: EditRoomModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    room_number: '',
    type: '',
    floor: '',
    price: '',
    amenities: '',
    status: 'available',
    gst_percentage: '12',
    service_charge_percentage: '0',
  });

  useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.number || '',
        type: room.type || '',
        floor: room.floor?.toString() || '1',
        price: room.price?.toString() || '0',
        amenities: room.amenities || '',
        status: room.status || 'available',
        gst_percentage: room.gst_percentage?.toString() || '12',
        service_charge_percentage: room.service_charge_percentage?.toString() || '0',
      });
    }
  }, [room]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/rooms/${room.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_number: formData.room_number,  // This is included but not changed in DB
          type: formData.type,
          floor: parseInt(formData.floor),
          price: parseFloat(formData.price),
          amenities: formData.amenities,
          status: formData.status,
          gst_percentage: parseFloat(formData.gst_percentage),
          service_charge_percentage: parseFloat(formData.service_charge_percentage),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update room');
      }

      toast({
        title: "Success",
        description: "Room updated successfully",
      });

      onRoomUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Room {room?.number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number *</Label>
              <Input
                id="room_number"
                name="room_number"
                value={formData.room_number}
                readOnly  // ✅ Make it read-only
                className="bg-gray-50 cursor-not-allowed"  // Optional: Add visual feedback
                required
              />
              <p className="text-xs text-muted-foreground">Room number cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Room Type *</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor *</Label>
              <Input
                id="floor"
                name="floor"
                type="number"
                min="1"
                value={formData.floor}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_percentage">GST (%)</Label>
              <Input
                id="gst_percentage"
                name="gst_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.gst_percentage}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_charge_percentage">Service Charge (%)</Label>
              <Input
                id="service_charge_percentage"
                name="service_charge_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.service_charge_percentage}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities</Label>
            <Input
              id="amenities"
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="WiFi, TV, AC, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}