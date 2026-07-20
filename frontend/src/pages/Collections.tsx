

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
import { formatCollectionPaymentLabel } from '@/lib/upiPaymentApps';
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
  previous_balance?: number;
  todays_collection?: number;
  cash_percentage: number;
  online_percentage: number;
  breakdown?: { name: string; amount: number }[];
}

interface HandoverRecord {
  id: number;
  hotel_id: number;
  total_collected?: number;
  handover_amount: number;
  handover_date: string;
  handover_to: number;
  handover_to_name?: string;
  handover_type: 'full' | 'partial' | 'bulk' | 'shift' | string;
  status: 'pending' | 'completed';
  remarks: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
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
    previous_balance: 0,
    todays_collection: 0,
    cash_percentage: 0,
    online_percentage: 0
  });
  const [handoverHistory, setHandoverHistory] = useState<HandoverRecord[]>([]);
  const [loadingHandoverHistory, setLoadingHandoverHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingCashBookings, setLoadingCashBookings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [staff, setStaff] = useState<any[]>([]);
  const [handoverTypes, setHandoverTypes] = useState<string[]>([]);

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
  const [showGeneralHandoverModal, setShowGeneralHandoverModal] = useState(false);
  const [generalHandoverSubmitting, setGeneralHandoverSubmitting] = useState(false);
  const [generalHandoverData, setGeneralHandoverData] = useState({
    amount: '',
    handed_to: 'owner',
    remarks: '',
    handover_type: 'cash'
  });

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
  const [activeTab, setActiveTab] = useState<string>('all');

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

  // Fetch staff users for handover recipient
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${backendUrl}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStaff(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  // Fetch handover types for dropdown
  const fetchHandoverTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${backendUrl}/collections/handover-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHandoverTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch handover history from API
  const fetchHandoverHistory = async () => {
    setLoadingHandoverHistory(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(
        `${backendUrl}/collections/handovers?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setHandoverHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching handover history:', error);
    } finally {
      setLoadingHandoverHistory(false);
    }
  };

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

      // Map activeTab to server parameters if not 'all'
      // This ensures pagination works correctly for 'Handed' and 'Pending' tabs
      if (activeTab === 'cash') params.append('paymentMode', 'cash');
      else if (activeTab === 'online') params.append('paymentMode', 'online');
      else if (activeTab === 'handed') params.append('handoverStatus', 'handed_over');

      // Manual filters take precedence if they are not 'all'
      if (paymentMode !== 'all') params.set('paymentMode', paymentMode);
      if (handoverStatus !== 'all') params.set('handoverStatus', handoverStatus);

      if (searchQuery) params.set('search', searchQuery);

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
          handed_over_cash: data.data.summary?.handed_over_cash || 0,
          pending_handover: data.data.summary?.pending_handover || 0,
          previous_balance: data.data.summary?.previous_balance || 0,
          todays_collection: data.data.summary?.todays_collection || 0,
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

  // Removed handleHandover as per-booking handover is replaced by bulk.

  // Handle general handover (bulk)
  const handleGeneralHandover = () => {
    setGeneralHandoverData({
      amount: summary.pending_handover.toString(),
      handed_to: 'owner',
      remarks: '',
      handover_type: 'cash'
    });
    setShowGeneralHandoverModal(true);
  };

  const submitGeneralHandover = async () => {
    try {
      setGeneralHandoverSubmitting(true);
      const token = localStorage.getItem('authToken'); // Changed 'token' to 'authToken' for consistency
      const response = await fetch(`${backendUrl}/collections/bulk-handover`, { // Changed VITE_API_URL to backendUrl
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...generalHandoverData,
          handover_type: parseFloat(generalHandoverData.amount) >= summary.pending_handover ? 'full' : 'partial',
          total_collected: summary.pending_handover
        })
      });

      const data = await response.json();
      if (data.success) {
        notifyBulkHandover({
          amount: parseFloat(generalHandoverData.amount) || summary.pending_handover,
        });

        toast({
          title: "Success",
          description: "Total cash handed over successfully",
        });
        setShowGeneralHandoverModal(false);
        fetchCollections();
        fetchHandoverHistory();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to handover cash",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setGeneralHandoverSubmitting(false);
    }
  };

  // Removed submitHandover as per-booking handover is replaced by bulk.

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
        notifyCollectionRecorded({
          collectionId: data.data?.id ? String(data.data.id) : undefined,
          amount: parseFloat(newCollectionData.amount),
          paymentMode: newCollectionData.payment_mode,
        });

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

      // Map activeTab for export filtering
      if (activeTab === 'cash') params.append('paymentMode', 'cash');
      else if (activeTab === 'online') params.append('paymentMode', 'online');
      else if (activeTab === 'handed') params.append('handoverStatus', 'handed_over');

      if (paymentMode !== 'all') params.set('paymentMode', paymentMode);
      if (handoverStatus !== 'all') params.set('handoverStatus', handoverStatus);
      if (searchQuery) params.append('search', searchQuery);

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
    if (activeTab === 'handed') return collection.handover_status === 'handed_over' || collection.handover_status === 'partially_handed_over';
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
    fetchStaff();
    fetchHandoverTypes();
    if (activeTab === 'handed') {
      fetchHandoverHistory();
      fetchCollections(); // Still fetch for summary
    } else {
      fetchCollections();
    }
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
  const getPaymentModeBadge = (mode: string, remarks?: string) => {
    const label = formatCollectionPaymentLabel(mode, remarks);
    const variants: Record<string, string> = {
      cash: 'bg-green-100 text-green-800 border-green-200',
      online: 'bg-blue-100 text-blue-800 border-blue-200',
      card: 'bg-purple-100 text-purple-800 border-purple-200',
      upi: 'bg-orange-100 text-orange-800 border-orange-200',
      phonepe: 'bg-purple-100 text-purple-800 border-purple-200',
      googlepay: 'bg-blue-100 text-blue-800 border-blue-200',
      paytm: 'bg-sky-100 text-sky-800 border-sky-200',
    };
    const variantKey = label.toLowerCase().replace(/\s+/g, '');
    const variantClass =
      variants[variantKey] ||
      (mode === 'cash' ? variants.cash : variants.online);
    return (
      <Badge variant="outline" className={`${variantClass} text-xs`}>
        {label}
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
      <div className="page-shell container mx-auto px-2 py-4 sm:px-4 sm:py-8">
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
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-green-600 truncate">
                    {formatCurrency(summary.pending_handover)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Cash</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
              </div>
              {/* Subtext removed as per-request */}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-blue-600 truncate">
                    {formatCurrency(summary.total_online)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Online</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
              {/* Subtext removed as per-request */}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-purple-600 truncate">
                    {formatCurrency(summary.total_amount)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
              </div>
              {/* Subtext removed as per-request */}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-yellow-600 truncate">
                    {formatCurrency(summary.handed_over_cash)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Handed Over</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Hand className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
              </div>
              {/* Subtext removed as per-request */}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 w-full h-10 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <TabsTrigger
              value="all"
              className="h-full rounded-md text-[11px] sm:text-xs font-medium transition-none data-[state=active]:bg-cyan-600 data-[state=active]:text-white shadow-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="cash"
              className="h-full rounded-md text-[11px] sm:text-xs font-medium transition-none data-[state=active]:bg-cyan-600 data-[state=active]:text-white shadow-none"
            >
              Cash
            </TabsTrigger>
            <TabsTrigger
              value="online"
              className="h-full rounded-md text-[11px] sm:text-xs font-medium transition-none data-[state=active]:bg-cyan-600 data-[state=active]:text-white shadow-none"
            >
              Online
            </TabsTrigger>
            <TabsTrigger
              value="handed"
              className="h-full rounded-md text-[11px] sm:text-xs font-medium transition-none data-[state=active]:bg-cyan-600 data-[state=active]:text-white shadow-none"
            >
              Handed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters for collections tabs */}
        {(activeTab === 'all' || activeTab === 'cash' || activeTab === 'online' || activeTab === 'handed') && (
          <Card className="mb-6">
            <CardContent className="p-3 sm:p-4">
              {/* Unified single-line filter bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 items-end gap-2 sm:gap-3">
                {/* Start Date */}
                <div>
                  <Label htmlFor="startDate" className="text-[10px] sm:text-xs">Start Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 pl-8 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <Label htmlFor="endDate" className="text-[10px] sm:text-xs">End Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="h-8 pl-8 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Search */}
                <div className="md:col-span-1 lg:col-span-2">
                  <Label htmlFor="search" className="text-[10px] sm:text-xs">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Guest or room..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <Button
                  onClick={fetchCollections}
                  className="h-8 text-xs font-semibold w-full bg-cyan-600 hover:bg-cyan-700"
                  disabled={loading}
                >
                  <Filter className="h-3 w-3 mr-2" />
                  {loading ? '...' : 'Apply Filters'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collections Table */}
        {(activeTab === 'all' || activeTab === 'cash' || activeTab === 'online' || activeTab === 'handed') && (
          <div className="space-y-4">
            {/* Handed Tab Special Summary */}
            {activeTab === 'handed' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-lg text-blue-700 flex items-center gap-2">
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />
                      Handover Ledger
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleGeneralHandover}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-none h-8 text-xs shadow-sm font-semibold px-4"
                    >
                      <Hand className="h-3.5 w-3.5 mr-2" />
                      Handover
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  {loadingHandoverHistory ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading ledger...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-10 text-[10px] sm:text-xs">Sno</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Date & Time</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Handover Amount</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Handed By</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Handed To</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Type</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Remarks</TableHead>
                            <TableHead className="text-center text-[10px] sm:text-xs">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {handoverHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No handover records found</p>
                                <p className="text-xs mt-1">Adjust filters or settle cash balance to see data here.</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            handoverHistory.map((record, index) => (
                              <TableRow key={record.id} className="hover:bg-muted/30">
                                <TableCell className="text-[10px] sm:text-xs text-muted-foreground">
                                  {handoverHistory.length - index}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="text-xs sm:text-sm font-medium">{format(new Date(record.handover_date), 'dd MMM yyyy')}</div>
                                  <div className="text-[10px] text-muted-foreground">{format(new Date(record.handover_date), 'hh:mm a')}</div>
                                </TableCell>
                                <TableCell className="font-bold text-blue-700 text-xs sm:text-sm">
                                  {formatCurrency(record.handover_amount)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-slate-600">
                                  {record.created_by_name || 'Staff'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                    <div className="text-[10px] sm:text-sm capitalize font-medium">{record.handover_to_name || record.handover_to}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase font-bold tracking-wider ${record.handover_type === 'full' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                    {record.handover_type || 'Bulk'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[150px] sm:max-w-[200px] truncate text-[10px] sm:text-xs text-muted-foreground">
                                  {record.remarks || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-green-100/80 text-green-800 border-green-200 text-[10px] px-1.5 py-0">
                                    Completed
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab !== 'handed' && (
              <Card>
                <CardContent className="p-0 sm:p-2">
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
                            <TableRow className="bg-slate-50">
                              <TableHead className="w-10 text-[10px] sm:text-xs px-2 sm:px-4">Sno</TableHead>
                              <TableHead className="whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-4">
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('collection_date')}>
                                  Date
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-4">Guest Name</TableHead>
                              <TableHead className="whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-4">Room</TableHead>
                              <TableHead className="whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-4 text-center">Payment</TableHead>
                              <TableHead className="whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-4">
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('amount')}>
                                  Amount
                                  <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-4 hidden md:table-cell">Collected By</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCollections.map((collection, index) => (
                              <TableRow key={collection.id} className="hover:bg-muted/50">
                                <TableCell className="text-[10px] sm:text-xs text-muted-foreground px-2 sm:px-4">
                                  {(currentPage * pageSize) + index + 1}
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-2 sm:px-4">
                                  <div className="text-[10px] sm:text-xs font-medium">
                                    {new Date(collection.collection_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-2 sm:px-4">
                                  <div className="text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-[160px]">
                                    {collection.guest_name || 'Walk-in'}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-2 sm:px-4">
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                                    {collection.room_number ? `R${collection.room_number}` : '-'}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-2 sm:px-4">
                                  {getPaymentModeBadge(collection.payment_mode, collection.remarks)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-2 sm:px-4 font-bold text-xs sm:text-sm">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <IndianRupee className="h-3 w-3" />
                                      {collection.amount.toFixed(0)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-2 sm:px-4 hidden md:table-cell">
                                  <div className="text-xs sm:text-sm">{collection.collected_by_name || 'Staff'}</div>
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
          </div>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
        {/* Bulk Handover Modal */}
        <Dialog open={showGeneralHandoverModal} onOpenChange={setShowGeneralHandoverModal}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Process Bulk Handover</DialogTitle>
              <DialogDescription>
                Handover the total cash balance to the owner
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Pending Amount:</span>
                <span className="text-lg font-bold text-blue-900">{formatCurrency(summary.pending_handover)}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="bulkAmount">Handover Amount *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bulkAmount"
                      type="number"
                      value={generalHandoverData.amount}
                      onChange={(e) => setGeneralHandoverData({ ...generalHandoverData, amount: e.target.value })}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="bulkTo">Handover To *</Label>
                    <Select
                      value={generalHandoverData.handed_to}
                      onValueChange={(val) => setGeneralHandoverData({ ...generalHandoverData, handed_to: val })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.length > 0 ? (
                          staff.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="owner">Hotel Owner</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bulkType">Settlement Type</Label>
                    <Select
                      disabled
                      value={parseFloat(generalHandoverData.amount) >= summary.pending_handover ? 'full' : 'partial'}
                      onValueChange={(val) => setGeneralHandoverData({ ...generalHandoverData, handover_type: val })}
                    >
                      <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 text-slate-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Settlement</SelectItem>
                        <SelectItem value="partial">Partial Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bulkRemarks">Remarks</Label>
                  <Textarea
                    id="bulkRemarks"
                    value={generalHandoverData.remarks}
                    onChange={(e) => setGeneralHandoverData({ ...generalHandoverData, remarks: e.target.value })}
                    placeholder="e.g. Weekly settlement..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGeneralHandoverModal(false)} disabled={generalHandoverSubmitting}>
                Cancel
              </Button>
              <Button onClick={submitGeneralHandover} disabled={generalHandoverSubmitting || !generalHandoverData.amount}>
                {generalHandoverSubmitting ? 'Processing...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Collections;