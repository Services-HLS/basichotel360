


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import ExpenseForm from '@/components/ExpenseForm';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import Layout from '@/components/Layout';
import { removeNotification } from '@/lib/notificationStore';

interface Expense {
  id: number;
  expense_name: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  remark: string;
  created_by_name: string;
  created_at: string;
}

const Expenses = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'staff', label: 'Staff' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' }
  ];

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (search) params.append('search', search);

      const response = await fetch(
        `${backendUrl}/expenses?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load expenses (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        const processedExpenses = (data.data || []).map((expense: any) => ({
          ...expense,
          amount: parseFloat(expense.amount) || 0
        }));
        setExpenses(processedExpenses);
      } else {
        throw new Error(data.message || 'Failed to load expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchExpenses();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      void fetchExpenses();
    }, 0);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    const id = expenseToDelete.id;
    setDeletingId(id);

    try {
      const token = localStorage.getItem('authToken');
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${backendUrl}/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        let message = 'Failed to delete expense';
        try {
          const errorData = await response.json();
          message = errorData?.message || message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      let data: { success?: boolean; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Some proxies return empty body on success
        data = { success: true };
      }

      if (data.success === false) {
        throw new Error(data.message || 'Failed to delete expense');
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      removeNotification(`expense-large-${id}`);

      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Delete failed",
        description:
          error instanceof Error && error.name === 'AbortError'
            ? 'Delete request timed out. Please try again.'
            : error instanceof Error
              ? error.message
              : 'Failed to delete expense',
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedExpense(null);
    fetchExpenses();
  };

  const totalAmount = expenses.reduce((sum, expense) => {
    return sum + (expense.amount || 0);
  }, 0);

  const totalExpensesCount = expenses.length;
  const averagePerExpense = totalExpensesCount > 0 ? totalAmount / totalExpensesCount : 0;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      utilities: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      supplies: 'bg-green-100 text-green-800',
      staff: 'bg-purple-100 text-purple-800',
      marketing: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Safe formatting function
  const formatAmount = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toFixed(2)}`;
  };

  const formatExpenseDate = (value: string) => {
    if (!value) return '—';
    const dateOnly = String(value).slice(0, 10);
    const parsed = new Date(`${dateOnly}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-IN');
  };

  return (
    <Layout>
      <div className="page-shell container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Expenses Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track and manage all hotel expenses
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto whitespace-nowrap"
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatAmount(totalAmount)}</div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalExpensesCount}</div>
              <p className="text-sm text-muted-foreground">Number of Expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {formatAmount(averagePerExpense)}
              </div>
              <p className="text-sm text-muted-foreground">Average per Expense</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</label>
                <InputWithIcon
                  placeholder="Search by name, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From Date</label>
                <InputWithIcon
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To Date</label>
                <InputWithIcon
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleResetFilters} className="w-full sm:w-auto">
                Reset Filters
              </Button>
              <Button onClick={handleApplyFilters} className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found. Add your first expense.
              </div>
            ) : (
              <div className="mobile-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Expense Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {formatExpenseDate(expense.expense_date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.expense_name}
                        {expense.description && (
                          <p className="text-sm text-muted-foreground">
                            {expense.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatAmount(expense.amount)}
                      </TableCell>
                      <TableCell>{expense.remark || '-'}</TableCell>
                      <TableCell>{expense.created_by_name}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingId === expense.id}
                            onClick={() => setExpenseToDelete(expense)}
                          >
                            {deletingId === expense.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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

        {/* Expense Form Dialog */}
        {showForm && (
          <ExpenseForm
            open={showForm}
            onClose={() => {
              setShowForm(false);
              setSelectedExpense(null);
            }}
            onSuccess={handleFormSuccess}
            expense={selectedExpense}
          />
        )}

        <AlertDialog
          open={!!expenseToDelete}
          onOpenChange={(open) => {
            if (!open && deletingId === null) {
              setExpenseToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete expense?</AlertDialogTitle>
              <AlertDialogDescription>
                {expenseToDelete
                  ? `Remove "${expenseToDelete.expense_name}" (${formatAmount(expenseToDelete.amount)})? This cannot be undone.`
                  : 'This expense will be permanently removed.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingId !== null}
                onClick={(e) => {
                  e.preventDefault();
                  void confirmDeleteExpense();
                }}
              >
                {deletingId !== null ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Expenses;