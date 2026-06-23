import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  designation: string;
}

interface SalaryFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salary?: any;
}

const SalaryForm: React.FC<SalaryFormProps> = ({ open, onClose, onSuccess, salary }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    employee_name: '',
    designation: '',
    salary_month: new Date().toISOString().slice(0, 7),
    basic_salary: '',
    allowances: '',
    deductions: '',
    net_salary: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    status: 'paid',
    remarks: ''
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (salary) {
        const loaded = {
          user_id: salary.user_id?.toString() || '',
          employee_name: salary.employee_name,
          designation: salary.designation,
          salary_month: salary.salary_month.slice(0, 7),
          basic_salary: salary.basic_salary.toString(),
          allowances: salary.allowances.toString(),
          deductions: salary.deductions.toString(),
          net_salary: '',
          payment_date: salary.payment_date,
          payment_method: salary.payment_method,
          status: salary.status,
          remarks: salary.remarks || ''
        };
        loaded.net_salary = formatNetSalary(computeNetSalary(loaded));
        setFormData(loaded);
      } else {
        setFormData({
          user_id: '',
          employee_name: '',
          designation: '',
          salary_month: new Date().toISOString().slice(0, 7),
          basic_salary: '',
          allowances: '',
          deductions: '',
          net_salary: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          status: 'paid',
          remarks: ''
        });
      }
    }
  }, [salary, open]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('authToken');
      // const response = await fetch('http://localhost:3001/api/salaries/employees', {
          const response = await fetch(`${backendUrl}/salaries/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeChange = (userId: string) => {
    const employee = employees.find(emp => emp.id.toString() === userId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        user_id: userId,
        employee_name: employee.name,
        designation: employee.designation || 'Staff'
      }));
    }
  };

  const computeNetSalary = (data: {
    basic_salary: string;
    allowances: string;
    deductions: string;
  }) => {
    const basic = parseFloat(data.basic_salary) || 0;
    const allowances = parseFloat(data.allowances) || 0;
    const deductions = parseFloat(data.deductions) || 0;
    const net = basic + allowances - deductions;
    return Math.round(net * 100) / 100;
  };

  const formatNetSalary = (net: number) =>
    Number.isFinite(net) ? net.toFixed(2) : '';

  const calculateNetSalary = () =>
    computeNetSalary({
      basic_salary: formData.basic_salary,
      allowances: formData.allowances,
      deductions: formData.deductions,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.basic_salary || !formData.salary_month) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const netSalary = calculateNetSalary();
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const url =salary
       ?`${backendUrl}/salaries/${salary.id}`
       :`${backendUrl}/salaries`;
      
      const method = salary ? 'PUT' : 'POST';
      
      const requestData = {
        ...formData,
        basic_salary: (parseFloat(formData.basic_salary) || 0).toString(),
        allowances: (parseFloat(formData.allowances) || 0).toString(),
        deductions: (parseFloat(formData.deductions) || 0).toString(),
        net_salary: netSalary.toFixed(2),
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: salary ? "Salary updated successfully" : "Salary record created successfully"
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      toast({
        title: "Error",
        description: "Failed to save salary record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (['basic_salary', 'allowances', 'deductions'].includes(field)) {
        next.net_salary = formatNetSalary(computeNetSalary(next));
      }
      return next;
    });
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online' }
  ];

  const statusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {salary ? 'Edit Salary Record' : 'Add New Salary Record'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Employee *</Label>
              <Select
                value={formData.user_id}
                onValueChange={handleEmployeeChange}
                disabled={!!salary}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} - {employee.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                readOnly
                placeholder="Auto-filled from employee"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_month">Salary Month *</Label>
              <Input
                id="salary_month"
                type="month"
                value={formData.salary_month}
                onChange={(e) => handleChange('salary_month', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleChange('payment_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic_salary">Basic Salary (₹) *</Label>
              <Input
                id="basic_salary"
                type="number"
                step="0.01"
                min="0"
                value={formData.basic_salary}
                onChange={(e) => handleChange('basic_salary', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allowances">Allowances (₹)</Label>
              <Input
                id="allowances"
                type="number"
                step="0.01"
                min="0"
                value={formData.allowances}
                onChange={(e) => handleChange('allowances', e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions (₹)</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                min="0"
                value={formData.deductions}
                onChange={(e) => handleChange('deductions', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="net_salary">Net Salary (₹)</Label>
              <Input
                id="net_salary"
                type="text"
                value={formData.net_salary}
                readOnly
                className="font-bold text-green-600"
              />
              <p className="text-xs text-muted-foreground">
                Basic + Allowances − Deductions ={' '}
                {formatNetSalary(calculateNetSalary()) || '0.00'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Any remarks"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : salary ? 'Update' : 'Save Salary Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalaryForm;