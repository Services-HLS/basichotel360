import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter, Download, Edit, Trash2, Calendar, User } from 'lucide-react';
import SalaryForm from '@/components/SalaryForm';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import Layout from '@/components/Layout';

interface Salary {
  id: number;
  employee_name: string;
  designation: string;
  salary_month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  payment_method: string;
  status: string;
  remarks: string;
  created_by_name: string;
  created_at: string;
}

const Salaries = () => {
  const { toast } = useToast();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Wrap fetchSalaries in useCallback to prevent unnecessary recreations
  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();

      // Only add filters if they have values
      if (status && status !== 'all') params.append('status', status);

      // Convert YYYY-MM month picker value to full dates:
      //   startDate → first day of that month  (e.g. 2026-03 → 2026-03-01)
      //   endDate   → last  day of that month  (e.g. 2026-03 → 2026-03-31)
      if (startDate) {
        const firstDay = `${startDate}-01`;
        params.append('startDate', firstDay);
      }
      if (endDate) {
        // Last day: go to first day of NEXT month, then subtract 1 day
        const [year, month] = endDate.split('-').map(Number);
        const lastDay = new Date(year, month, 0); // day 0 of next month = last day of this month
        const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
        params.append('endDate', lastDayStr);
      }

      if (search) params.append('search', search);


      const response = await fetch(
        `${backendUrl}/salaries?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        // Convert string numbers to actual numbers
        const salariesWithNumbers = data.data.map((salary: any) => ({
          ...salary,
          basic_salary: parseFloat(salary.basic_salary) || 0,
          allowances: parseFloat(salary.allowances) || 0,
          deductions: parseFloat(salary.deductions) || 0,
          net_salary: parseFloat(salary.net_salary) || 0,
        }));
        setSalaries(salariesWithNumbers);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load salaries",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching salaries:', error);
      toast({
        title: "Error",
        description: "Failed to load salaries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [search, status, startDate, endDate, toast]); // Add dependencies

  // Fetch salaries only on initial load
  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleApplyFilters = () => {
    fetchSalaries();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchSalaries(), 0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${backendUrl}/salaries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Salary record deleted successfully"
        });
        fetchSalaries();
      }
    } catch (error) {
      console.error('Error deleting salary:', error);
      toast({
        title: "Error",
        description: "Failed to delete salary record",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (salary: Salary) => {
    setSelectedSalary(salary);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSalary(null);
    fetchSalaries();
  };

  const totalNetSalary = salaries.reduce((sum, salary) => sum + salary.net_salary, 0);
  const totalBasic = salaries.reduce((sum, salary) => sum + salary.basic_salary, 0);
  const totalAllowances = salaries.reduce((sum, salary) => sum + salary.allowances, 0);
  const totalDeductions = salaries.reduce((sum, salary) => sum + salary.deductions, 0);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      cheque: 'bg-orange-100 text-orange-800',
      online: 'bg-teal-100 text-teal-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="page-shell container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Salary Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage employee salaries and payments
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto whitespace-nowrap"
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Salary Record
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹{totalNetSalary.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Net Salary</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹{totalBasic.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Basic</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹{totalAllowances.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Allowances</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹{totalDeductions.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Deductions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Search */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search Employee</label>
                <InputWithIcon
                  placeholder="Search by name, designation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Month */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From Month</label>
                <InputWithIcon
                  type="month"
                  placeholder="From Month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>

              {/* End Month */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To Month</label>
                <InputWithIcon
                  type="month"
                  placeholder="To Month"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full sm:w-auto"
              >
                Reset Filters
              </Button>
              <Button onClick={handleApplyFilters} className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Salaries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading salaries...</div>
            ) : salaries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No salary records found. Add your first salary record.
              </div>
            ) : (
              <div className="mobile-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {salary.employee_name}
                        </div>
                      </TableCell>
                      <TableCell>{salary.designation}</TableCell>
                      <TableCell>
                        {new Date(salary.salary_month).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </TableCell>
                      <TableCell>₹{salary.basic_salary.toFixed(2)}</TableCell>
                      <TableCell>₹{salary.allowances.toFixed(2)}</TableCell>
                      <TableCell>₹{salary.deductions.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">
                        ₹{salary.net_salary.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getPaymentMethodColor(salary.payment_method)}>
                            {salary.payment_method.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {new Date(salary.payment_date).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(salary.status)}>
                          {salary.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(salary)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(salary.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Form Dialog */}
        {showForm && (
          <SalaryForm
            open={showForm}
            onClose={() => {
              setShowForm(false);
              setSelectedSalary(null);
            }}
            onSuccess={handleFormSuccess}
            salary={selectedSalary}
          />
        )}
      </div>
    </Layout>
  );
};

export default Salaries;