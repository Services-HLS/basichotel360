

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Download,
  Filter,
  IndianRupee,
  Printer,
  RefreshCw,
  Wallet,
  CreditCard,
  Hand,
  TrendingUp,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpDown,
  Users,
  Building,
  Banknote,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Collection {
  id: number;
  booking_id?: number;
  guest_name?: string;
  room_number?: string;
  collection_date: string;
  payment_mode: 'cash' | 'online' | 'card' | 'upi';
  amount: number;
  transaction_id?: string;
  remarks?: string;
  collected_by: number;
  collected_by_name?: string;
  handover_status: 'pending' | 'handed_over' | 'partially_handed_over' | 'not_applicable';
  handover_amount?: number;
  handover_date?: string;
  handover_to?: string;
  handover_remarks?: string;
  created_at: string;

  // Booking details
  booking_payment_method?: string;
  booking_payment_status?: string;
  booking_total?: number;
}

interface CollectionSummary {
  total_cash: number;
  total_online: number;
  total_amount: number;
  handed_over_cash: number;
  pending_handover: number;
  cash_percentage: number;
  online_percentage: number;
}

interface CashBooking {
  booking_id: number;
  booking_date: string;
  booking_amount: number;
  payment_method: string;
  payment_status: string;
  guest_name: string;
  room_number: string;
  collected_amount: number;
  pending_amount: number;
}

const Collections = () => {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [cashBookings, setCashBookings] = useState<CashBooking[]>([]);
  const [summary, setSummary] = useState<CollectionSummary>({
    total_cash: 0,
    total_online: 0,
    total_amount: 0,
    handed_over_cash: 0,
    pending_handover: 0,
    cash_percentage: 0,
    online_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingCashBookings, setLoadingCashBookings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  // Payment mode filter
  const [paymentMode, setPaymentMode] = useState('all');
  const [handoverStatus, setHandoverStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handover modal state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [handoverAmount, setHandoverAmount] = useState('');
  const [handoverTo, setHandoverTo] = useState('owner');
  const [handoverRemarks, setHandoverRemarks] = useState('');
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  // New collection modal state
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionData, setNewCollectionData] = useState({
    booking_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash' as 'cash' | 'online' | 'card' | 'upi',
    amount: '',
    transaction_id: '',
    remarks: ''
  });
  const [newCollectionSubmitting, setNewCollectionSubmitting] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState('collection_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Active tab
  const [activeTab, setActiveTab] = useState('all');

  // Function hall toggle state
  const [functionHallEnabled, setFunctionHallEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('functionHallEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Listen for function hall toggle events
  useEffect(() => {
    const handleToggle = (event: any) => {
      if (event.detail && typeof event.detail.enabled === 'boolean') {
        setFunctionHallEnabled(event.detail.enabled);
      }
    };

    window.addEventListener('functionHallToggle', handleToggle);
    return () => window.removeEventListener('functionHallToggle', handleToggle);
  }, []);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch collections from API

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: pageSize.toString(),
        offset: (currentPage * pageSize).toString(),
        search: searchQuery
      });

      if (paymentMode !== 'all') params.append('paymentMode', paymentMode);
      if (handoverStatus !== 'all') params.append('handoverStatus', handoverStatus);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(
        `${backendUrl}/collections?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ API Data received:', {
          collectionsCount: data.data.collections?.length,
          summary: data.data.summary
        });

        // FIX: Create a NEW summary object with ALL properties
        const newSummary = {
          total_cash: data.data.summary?.total_cash || 0,
          total_online: data.data.summary?.total_online || 0,
          total_amount: data.data.summary?.total_amount || 0,
          handed_over_cash: data.data.summary?.handed_over_cash || 0,  // This should be 1050
          pending_handover: data.data.summary?.pending_handover || 0,  // This should be 6915.5
          cash_percentage: data.data.summary?.cash_percentage || 0,
          online_percentage: data.data.summary?.online_percentage || 0
        };

        console.log('📊 Setting summary with handed_over_cash:', newSummary.handed_over_cash);

        setCollections(data.data.collections || []);
        setSummary(newSummary);
        setTotalRecords(data.data.pagination?.total || 0);

      } else {
        throw new Error(data.message || 'Failed to fetch collections');
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load collections data",
        variant: "destructive"
      });

      // Don't reset to zeros - keep existing data
      console.log('⚠️ Error occurred, keeping existing data');
    } finally {
      setLoading(false);
    }
  };// Add this useEffect to debug summary state
  useEffect(() => {
    console.log('🔄 SUMMARY STATE CHANGED:', {
      handed_over_cash: summary.handed_over_cash,
      pending_handover: summary.pending_handover,
      total_cash: summary.total_cash
    });
  }, [summary]); // This runs whenever summary changes



  // Fetch cash bookings (bookings with cash payment)
  const fetchCashBookings = async () => {
    setLoadingCashBookings(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(
        `${backendUrl}/collections/cash-bookings?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("cash collection", data);
      if (data.success) {
        const parsedData = (data.data || []).map((booking: any) => ({
          ...booking,
          booking_amount: Number(booking.booking_amount) || 0,
          pending_amount: Number(booking.pending_amount) || 0,
          collected_amount: Number(booking.collected_amount) || 0
        }));
        setCashBookings(parsedData);
      } else {
        throw new Error(data.message || 'Failed to fetch cash bookings');
      }
    } catch (error) {
      console.error('Error fetching cash bookings:', error);
      toast({
        title: "Warning",
        description: error instanceof Error ? error.message : "Failed to load cash bookings",
        variant: "default"
      });
      setCashBookings([]);
    } finally {
      setLoadingCashBookings(false);
    }
  };

  // Handle cash handover
  const handleHandover = (collection: Collection) => {
    if (collection.payment_mode !== 'cash') {
      toast({
        title: "Error",
        description: "Only cash collections can be handed over",
        variant: "destructive"
      });
      return;
    }

    if (collection.handover_status === 'handed_over') {
      toast({
        title: "Info",
        description: "Cash already handed over completely",
        variant: "default"
      });
      return;
    }

    const availableAmount = collection.amount - (collection.handover_amount || 0);

    setSelectedCollection(collection);
    setHandoverAmount(availableAmount.toString());
    setHandoverTo('owner');
    setHandoverRemarks('');
    setShowHandoverModal(true);
  };

  // Submit handover to API
  const submitHandover = async () => {
    if (!selectedCollection) return;

    setHandoverSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${backendUrl}/collections/${selectedCollection.id}/handover`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: parseFloat(handoverAmount),
            handed_to: handoverTo,
            remarks: handoverRemarks
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Cash handed over successfully",
          variant: "default"
        });
        setShowHandoverModal(false);
        fetchCollections(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to handover cash');
      }
    } catch (error) {
      console.error('Error handing over cash:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to handover cash",
        variant: "destructive"
      });
    } finally {
      setHandoverSubmitting(false);
    }
  };

  // Submit new collection to API
  const submitNewCollection = async () => {
    setNewCollectionSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${backendUrl}/collections`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            booking_id: newCollectionData.booking_id || null,
            collection_date: newCollectionData.collection_date,
            payment_mode: newCollectionData.payment_mode,
            amount: parseFloat(newCollectionData.amount),
            transaction_id: newCollectionData.transaction_id || null,
            remarks: newCollectionData.remarks || ''
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Collection recorded successfully",
          variant: "default"
        });
        setShowNewCollectionModal(false);
        setNewCollectionData({
          booking_id: '',
          collection_date: new Date().toISOString().split('T')[0],
          payment_mode: 'cash',
          amount: '',
          transaction_id: '',
          remarks: ''
        });

        // Refresh appropriate tab
        if (newCollectionData.payment_mode === 'cash') {
          fetchCollections();
          fetchCashBookings();
        } else {
          fetchCollections();
        }
      } else {
        throw new Error(data.message || 'Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create collection",
        variant: "destructive"
      });
    } finally {
      setNewCollectionSubmitting(false);
    }
  };

  // Export collections to Excel
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        startDate,
        endDate
      });

      if (paymentMode !== 'all') params.append('paymentMode', paymentMode);
      if (handoverStatus !== 'all') params.append('handoverStatus', handoverStatus);

      const response = await fetch(
        `${backendUrl}/collections/export?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `collections_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Collections exported successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export collections",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort collections
  const sortedCollections = [...collections].sort((a, b) => {
    let aValue: any = a[sortField as keyof Collection];
    let bValue: any = b[sortField as keyof Collection];

    if (sortField === 'collection_date' || sortField === 'handover_date' || sortField === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter collections based on active tab
  const filteredCollections = sortedCollections.filter(collection => {
    if (activeTab === 'all') return true;
    if (activeTab === 'cash') return collection.payment_mode === 'cash';
    if (activeTab === 'online') return ['online', 'card', 'upi'].includes(collection.payment_mode);
    if (activeTab === 'pending') return collection.handover_status === 'pending';
    if (activeTab === 'handed') return collection.handover_status === 'handed_over';
    return true;
  });

  // Auto-collect from cash booking
  const autoCollectFromBooking = (booking: CashBooking) => {
    setNewCollectionData({
      booking_id: booking.booking_id.toString(),
      collection_date: new Date().toISOString().split('T')[0],
      payment_mode: 'cash',
      amount: booking.pending_amount.toString(),
      transaction_id: '',
      remarks: `Cash collection for booking #${booking.booking_id} - ${booking.guest_name}, Room ${booking.room_number}`
    });
    setShowNewCollectionModal(true);
  };

  // Fetch data when filters or tab changes
  useEffect(() => {
    fetchCollections();
  }, [startDate, endDate, activeTab, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [startDate, endDate, activeTab, paymentMode, handoverStatus, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get payment mode badge
  const getPaymentModeBadge = (mode: string) => {
    const variants: Record<string, string> = {
      cash: 'bg-green-100 text-green-800 border-green-200',
      online: 'bg-blue-100 text-blue-800 border-blue-200',
      card: 'bg-purple-100 text-purple-800 border-purple-200',
      upi: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return (
      <Badge variant="outline" className={`${variants[mode] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </Badge>
    );
  };

  // Get handover status badge
  const getHandoverStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Pending'
      },
      handed_over: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Handed Over'
      },
      partially_handed_over: {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        label: 'Partially Handed'
      },
      not_applicable: {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <ShieldCheck className="h-3 w-3 mr-1" />,
        label: 'N/A'
      }
    };

    const variant = variants[status] || variants.not_applicable;

    return (
      <Badge variant="outline" className={`${variant.className} text-xs`}>
        <span className="flex items-center">
          {variant.icon}
          {variant.label}
        </span>
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Collections Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              Track cash and online collections
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button onClick={fetchCollections} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs h-9">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button onClick={() => setShowNewCollectionModal(true)} size="sm" className="flex-1 sm:flex-none text-xs h-9">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Record Collection</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button onClick={exportToExcel} disabled={exporting || collections.length === 0} size="sm" className="flex-1 sm:flex-none text-xs h-9">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? '...' : <span className="hidden sm:inline">Export Excel</span>}
              {exporting ? '...' : <span className="sm:hidden">Export</span>}
            </Button>
          </div>
        </div>
          {!functionHallEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-xs flex items-center gap-2 mb-6">
            <AlertCircle className="h-4 w-4" />
            <span>Function Hall revenue is excluded. Enable it in Overview to include it in Collections.</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                    {formatCurrency(summary.total_cash)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Cash</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-xs">
                <span className="text-muted-foreground hidden sm:inline">Percentage: </span>
                <span className="font-medium">{summary.cash_percentage.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600 truncate">
                    {formatCurrency(summary.total_online)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Online</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-xs">
                <span className="text-muted-foreground hidden sm:inline">Percentage: </span>
                <span className="font-medium">{summary.online_percentage.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600 truncate">
                    {formatCurrency(summary.total_amount)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-xs truncate">
                <span className="text-muted-foreground hidden sm:inline">Date Range: </span>
                <span className="font-medium text-[10px] sm:text-xs">
                  {format(new Date(startDate), 'dd/MM')} - {format(new Date(endDate), 'dd/MM')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">
                    {formatCurrency(summary.pending_handover)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Hand className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-xs truncate">
                <span className="text-muted-foreground hidden sm:inline">Handed: </span>
                <span className="font-medium text-[10px] sm:text-xs">
                  {formatCurrency(summary.handed_over_cash)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full sm:grid sm:grid-cols-2 md:grid-cols-7 gap-1 bg-transparent sm:bg-muted p-1">
              <TabsTrigger value="all" className="text-xs whitespace-nowrap px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All
              </TabsTrigger>
              <TabsTrigger value="cash" className="text-xs whitespace-nowrap px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Cash
              </TabsTrigger>
              <TabsTrigger value="online" className="text-xs whitespace-nowrap px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Online
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs whitespace-nowrap px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Pending
              </TabsTrigger>
              <TabsTrigger value="handed" className="text-xs whitespace-nowrap px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Handed
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Filters for collections tabs */}
        {(activeTab === 'all' || activeTab === 'cash' || activeTab === 'online' || activeTab === 'pending' || activeTab === 'handed') && (
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Date filters - stacked on mobile */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="startDate" className="text-xs sm:text-sm">Start Date</Label>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-xs sm:text-sm">End Date</Label>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter controls - stacked on mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="paymentMode" className="text-xs sm:text-sm">Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="h-9 mt-1 text-xs">
                        <SelectValue placeholder="All Modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="handoverStatus" className="text-xs sm:text-sm">Handover Status</Label>
                    <Select value={handoverStatus} onValueChange={setHandoverStatus}>
                      <SelectTrigger className="h-9 mt-1 text-xs">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="handed_over">Handed Over</SelectItem>
                        <SelectItem value="partially_handed_over">Partially</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search and Filter button - full width on mobile */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        id="search"
                        placeholder="Search guest or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 text-xs sm:text-sm flex-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={fetchCollections}
                    className="w-full h-9"
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {loading ? 'Loading...' : 'Apply Filters'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collections Table */}
        {(activeTab === 'all' || activeTab === 'cash' || activeTab === 'online' || activeTab === 'pending' || activeTab === 'handed') && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">Collections</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Showing {filteredCollections.length} of {totalRecords} collections
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs sm:text-sm whitespace-nowrap self-start sm:self-auto">
                Total: {formatCurrency(summary.total_amount)}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {loading ? (
                <div className="text-center py-8 px-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Loading collections...</p>
                </div>
              ) : filteredCollections.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No collections found for the selected criteria.</p>
                  <p className="text-xs mt-1">Try adjusting your filters or record a new collection.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <Table>

                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">
                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('collection_date')}>
                              Date
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Guest / Room</TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Payment</TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">
                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('amount')}>
                              Amount
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Collected By</TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Handover</TableHead>
                          <TableHead className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCollections.map((collection) => (
                          <TableRow key={collection.id} className="hover:bg-muted/50">
                            <TableCell className="whitespace-nowrap px-2 sm:px-4">
                              <div className="text-xs sm:text-sm font-medium">
                                {new Date(collection.collection_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}
                              </div>
                              {collection.transaction_id && (
                                <div className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[120px]">
                                  {collection.transaction_id.substring(0, 8)}...
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 sm:px-4">
                              <div className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[150px]">
                                {collection.guest_name || 'Walk-in'}
                              </div>
                              {collection.room_number && (
                                <div className="text-xs text-muted-foreground">
                                  R{collection.room_number}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 sm:px-4">
                              {getPaymentModeBadge(collection.payment_mode)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 sm:px-4 font-bold text-xs sm:text-sm">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {collection.amount.toFixed(0)}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 sm:px-4 hidden md:table-cell">
                              <div className="text-xs sm:text-sm">{collection.collected_by_name || 'Staff'}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 sm:px-4">
                              <div className="space-y-1">
                                {getHandoverStatusBadge(collection.handover_status)}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 sm:px-4">
                              {collection.payment_mode === 'cash' && collection.handover_status !== 'handed_over' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleHandover(collection)}
                                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                                >
                                  <Hand className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Handover</span>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Pagination UI */}
            {!loading && totalRecords > 0 && (
              <div className="px-4 pb-4 sm:px-6 flex flex-col sm:flex-row items-center justify-end gap-4 border-t pt-4">


                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <div className="text-xs font-medium mr-2">
                    Page {currentPage + 1} of {Math.ceil(totalRecords / pageSize)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={(currentPage + 1) * pageSize >= totalRecords}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(Math.ceil(totalRecords / pageSize) - 1)}
                      disabled={(currentPage + 1) * pageSize >= totalRecords}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}



        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Summary</CardTitle>
                <CardDescription>Monthly collection breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash Collection</span>
                    <span className="font-bold text-green-600">{formatCurrency(summary.total_cash)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online Collection</span>
                    <span className="font-bold text-blue-600">{formatCurrency(summary.total_online)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">Total Collection</span>
                    <span className="font-bold text-lg">{formatCurrency(summary.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Handover</span>
                    <span className="font-bold text-yellow-600">{formatCurrency(summary.pending_handover)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Handed Over</span>
                    <span className="font-bold text-green-600">{formatCurrency(summary.handed_over_cash)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowNewCollectionModal(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Record New Collection
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={exporting || collections.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export to Excel'}
                  </Button>
                  <Button
                    onClick={fetchCollections}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Handover Modal */}
        <Dialog open={showHandoverModal} onOpenChange={setShowHandoverModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Handover Cash to Owner</DialogTitle>
              <DialogDescription>
                Record cash handover for this collection
              </DialogDescription>
            </DialogHeader>
            {selectedCollection && (
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Collection Details</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Guest</div>
                      <div className="font-medium">{selectedCollection.guest_name || 'Walk-in'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-bold text-lg">{formatCurrency(selectedCollection.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div>{new Date(selectedCollection.collection_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Already Handed Over</div>
                      <div>{formatCurrency(selectedCollection.handover_amount || 0)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="handoverAmount">Amount to Handover *</Label>
                    <Input
                      id="handoverAmount"
                      type="number"
                      value={handoverAmount}
                      onChange={(e) => setHandoverAmount(e.target.value)}
                      max={selectedCollection.amount - (selectedCollection.handover_amount || 0)}
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Maximum: {formatCurrency(selectedCollection.amount - (selectedCollection.handover_amount || 0))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="handoverTo">Handover To *</Label>
                    <Select value={handoverTo} onValueChange={setHandoverTo}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Hotel Owner</SelectItem>
                        <SelectItem value="manager">Hotel Manager</SelectItem>
                        <SelectItem value="bank">Bank Deposit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="handoverRemarks">Remarks</Label>
                    <Textarea
                      id="handoverRemarks"
                      value={handoverRemarks}
                      onChange={(e) => setHandoverRemarks(e.target.value)}
                      placeholder="Enter any remarks..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowHandoverModal(false)}
                disabled={handoverSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitHandover}
                disabled={handoverSubmitting || !handoverAmount || parseFloat(handoverAmount) <= 0}
              >
                {handoverSubmitting ? 'Processing...' : 'Confirm Handover'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Collection Modal */}
        <Dialog open={showNewCollectionModal} onOpenChange={setShowNewCollectionModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record New Collection</DialogTitle>
              <DialogDescription>
                Record a new cash or online collection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                  <Input
                    id="bookingId"
                    value={newCollectionData.booking_id}
                    onChange={(e) => setNewCollectionData({
                      ...newCollectionData,
                      booking_id: e.target.value
                    })}
                    placeholder="e.g., 123"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="collectionDate">Collection Date *</Label>
                  <Input
                    id="collectionDate"
                    type="date"
                    value={newCollectionData.collection_date}
                    onChange={(e) => setNewCollectionData({
                      ...newCollectionData,
                      collection_date: e.target.value
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <Select
                  value={newCollectionData.payment_mode}
                  onValueChange={(value: 'cash' | 'online' | 'card' | 'upi') =>
                    setNewCollectionData({
                      ...newCollectionData,
                      payment_mode: value
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={newCollectionData.amount}
                    onChange={(e) => setNewCollectionData({
                      ...newCollectionData,
                      amount: e.target.value
                    })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {newCollectionData.payment_mode !== 'cash' && (
                <div>
                  <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                  <Input
                    id="transactionId"
                    value={newCollectionData.transaction_id}
                    onChange={(e) => setNewCollectionData({
                      ...newCollectionData,
                      transaction_id: e.target.value
                    })}
                    placeholder="For online payments"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={newCollectionData.remarks}
                  onChange={(e) => setNewCollectionData({
                    ...newCollectionData,
                    remarks: e.target.value
                  })}
                  placeholder="Additional notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewCollectionModal(false)}
                disabled={newCollectionSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitNewCollection}
                disabled={newCollectionSubmitting || !newCollectionData.amount || parseFloat(newCollectionData.amount) <= 0}
              >
                {newCollectionSubmitting ? 'Processing...' : 'Record Collection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Collections;