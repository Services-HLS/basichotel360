// src/components/TransactionHistory.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // ← ADD THIS IMPORT
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Download,
  Filter,
  Search,
  Calendar,
  IndianRupee,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// If Badge component doesn't exist in your UI library, here's a simple version:
const SimpleBadge = ({ children, variant = 'default', className = '' }: any) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wallet/transactions?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // Handle different response structures
        if (result.success && result.data) {
          setTransactions(result.data);
        } else if (result.data) {
          setTransactions(result.data);
        } else if (Array.isArray(result)) {
          setTransactions(result);
        } else {
          setTransactions([]);
        }
      } else {
        throw new Error('Failed to load transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const filteredTransactions = transactions.filter((txn: any) => {
    if (filter !== 'all' && txn.category !== filter) return false;
    if (search && !txn.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Description', 'Type', 'Category', 'Amount', 'Reference ID'],
        ...filteredTransactions.map((txn: any) => [
          formatDate(txn.created_at),
          txn.description || '',
          txn.type || '',
          txn.category || '',
          `₹${txn.amount || 0}`,
          txn.reference_id || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Transaction history downloaded as CSV',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export transactions',
        variant: 'destructive'
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'signup_bonus': 'bg-purple-100 text-purple-800',
      'referral_earnings': 'bg-green-100 text-green-800',
      'wallet_topup': 'bg-blue-100 text-blue-800',
      'subscription_payment': 'bg-orange-100 text-orange-800',
      'refund': 'bg-yellow-100 text-yellow-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/wallet')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
              <p className="text-muted-foreground">
                View all your wallet transactions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={exportToCSV} 
              variant="outline"
              className="h-10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Label htmlFor="search" className="mb-2 block">Search Transactions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by description, reference ID..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Dropdown */}
              <div>
                <Label htmlFor="filter" className="mb-2 block">Filter by Category</Label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    id="filter"
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="signup_bonus">Signup Bonus</option>
                    <option value="referral_earnings">Referral Earnings</option>
                    <option value="wallet_topup">Wallet Top-up</option>
                    <option value="subscription_payment">Subscription</option>
                    <option value="refund">Refund</option>
                    <option value="manual_adjustment">Manual Adjustment</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{transactions
                      .filter(t => t.type === 'credit')
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{transactions
                      .filter(t => t.type === 'debit')
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''} Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                <p className="text-muted-foreground mb-6">
                  {search || filter !== 'all' 
                    ? 'Try changing your search or filter criteria' 
                    : 'Your transaction history will appear here once you make a transaction'}
                </p>
                {(search || filter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((txn: any) => (
                  <div
                    key={txn.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 mb-4 sm:mb-0">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <IndianRupee className={`h-5 w-5 ${
                            txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{txn.description || 'No description'}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(txn.created_at)}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              getCategoryColor(txn.category)
                            }`}>
                              {txn.category ? txn.category.replace(/_/g, ' ') : 'Unknown'}
                            </span>
                            {txn.reference_id && (
                              <span className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded">
                                Ref: {txn.reference_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{(txn.amount || 0).toLocaleString()}
                      </p>
                      <p className={`text-sm mt-1 ${
                        txn.type === 'credit' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {txn.type === 'credit' ? 'Credit' : 'Debit'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination or View More */}
        {filteredTransactions.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                // Load more transactions or show all
                toast({
                  title: 'Loading more...',
                  description: 'Fetching additional transactions'
                });
              }}
            >
              Load More Transactions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;