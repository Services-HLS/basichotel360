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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  customerNumber: string;
  idNumber: string;
  idType: string;
  createdAt: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  customer_gst_no?: string;
  purpose_of_visit?: string;
  other_expenses?: number;
  expense_description?: string;
  source?: string;
}

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onSuccess: () => void;
  onUpdate: (id: string, data: Partial<Customer>) => Promise<boolean>;
}

const EditCustomerDialog = ({ 
  open, 
  onOpenChange, 
  customer, 
  onSuccess,
  onUpdate 
}: EditCustomerDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idType: 'aadhaar',
    idNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    customer_gst_no: '',
    purpose_of_visit: '',
    other_expenses: '',
    expense_description: ''
  });

  // Load customer data when dialog opens
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        idType: customer.idType || 'aadhaar',
        idNumber: customer.idNumber || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        customer_gst_no: customer.customer_gst_no || '',
        purpose_of_visit: customer.purpose_of_visit || '',
        other_expenses: customer.other_expenses?.toString() || '',
        expense_description: customer.expense_description || ''
      });
    }
  }, [customer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        id_type: formData.idType,
        id_number: formData.idNumber || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        customer_gst_no: formData.customer_gst_no || null,
        purpose_of_visit: formData.purpose_of_visit || null,
        other_expenses: formData.other_expenses ? parseFloat(formData.other_expenses) : 0,
        expense_description: formData.expense_description || null
      };

      const success = await onUpdate(customer.id, updatedData);
      
      if (success) {
        toast({
          title: "Success",
          description: "Customer updated successfully"
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Customer: {customer?.customerNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="additional">Additional Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* ID Type */}
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type</Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(value) => handleSelectChange('idType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="pan">PAN Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ID Number */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="idNumber">ID Number (Aadhaar/PAN/Passport)</Label>
                  <Input
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder="Enter ID proof number"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GST Number */}
                  <div className="space-y-2">
                    <Label htmlFor="customer_gst_no">GST Number</Label>
                    <Input
                      id="customer_gst_no"
                      name="customer_gst_no"
                      value={formData.customer_gst_no}
                      onChange={handleInputChange}
                      placeholder="e.g., 22AAAAA0000A1Z5"
                      className="uppercase"
                    />
                  </div>

                  {/* Purpose of Visit */}
                  <div className="space-y-2">
                    <Label htmlFor="purpose_of_visit">Purpose of Visit</Label>
                    <Input
                      id="purpose_of_visit"
                      name="purpose_of_visit"
                      value={formData.purpose_of_visit}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Other Expenses */}
                  <div className="space-y-2">
                    <Label htmlFor="other_expenses">Other Expenses (₹)</Label>
                    <Input
                      id="other_expenses"
                      name="other_expenses"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.other_expenses}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Expense Description */}
                  <div className="space-y-2">
                    <Label htmlFor="expense_description">Expense Description</Label>
                    <Input
                      id="expense_description"
                      name="expense_description"
                      value={formData.expense_description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;