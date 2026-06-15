import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import QuotationForm from '@/components/QuotationForm';

interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone: string;
  room_number: string;
  from_date: string;
  to_date: string;
  nights: number;
  total_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'converted';
  expiry_date: string;
  created_at: string;
  room_type: string;
  created_by_name: string;
}

const Quotations: React.FC = () => {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.VITE_BACKEND_URL}/quotations?status=${selectedStatus === 'all' ? '' : selectedStatus}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setQuotations(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quotations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [selectedStatus]);

  const handleDownloadQuotation = async (quotationId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      window.open(
        `${process.env.VITE_BACKEND_URL}/quotations/${quotationId}/download?autoprint=true`,
        '_blank'
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download quotation',
        variant: 'destructive'
      });
    }
  };

  const handleConvertToBooking = async (quotationId: string) => {
    if (!window.confirm('Convert this quotation to a booking?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.VITE_BACKEND_URL}/quotations/${quotationId}/convert-to-booking`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payment_method: 'cash',
            payment_status: 'pending'
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: '✅ Success',
          description: 'Quotation converted to booking successfully'
        });
        fetchQuotations(); // Refresh list
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert quotation',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800' },
      converted: { label: 'Converted', color: 'bg-blue-100 text-blue-800' }
    }[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const columns: GridColDef<Quotation>[] = [
    {
      field: 'quotation_number',
      headerName: 'Quotation #',
      width: 150,
      renderCell: (params) => (
        <div className="font-mono font-medium">
          {params.value}
        </div>
      )
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 150
    },
    {
      field: 'customer_phone',
      headerName: 'Phone',
      width: 130
    },
    {
      field: 'room_number',
      headerName: 'Room',
      width: 100
    },
    {
      field: 'from_date',
      headerName: 'Dates',
      width: 180,
      renderCell: (params) => (
        <div className="text-sm">
          {format(new Date(params.row.from_date), 'dd MMM')} - {format(new Date(params.row.to_date), 'dd MMM')}
          <div className="text-xs text-gray-500">{params.row.nights} night(s)</div>
        </div>
      )
    },
    {
      field: 'total_amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => (
        <div className="font-medium">
          ₹{params.value.toLocaleString('en-IN')}
        </div>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => getStatusBadge(params.value)
    },
    {
      field: 'expiry_date',
      headerName: 'Valid Until',
      width: 130,
      renderCell: (params) => (
        <div className="text-sm">
          {format(new Date(params.value), 'dd MMM')}
          <div className={`text-xs ${new Date(params.value) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
            {new Date(params.value) < new Date() ? 'Expired' : 'Valid'}
          </div>
        </div>
      )
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 130,
      renderCell: (params) => format(new Date(params.value), 'dd MMM')
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadQuotation(params.row.id)}
            title="Download Quotation"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedQuotation(params.row)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {params.row.status === 'pending' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleConvertToBooking(params.row.id)}
              title="Convert to Booking"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filteredQuotations = quotations.filter(quotation =>
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer_phone.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="page-shell">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quotations Management</h1>
            <p className="text-muted-foreground mt-1">
              Create, manage, and convert quotations to bookings
            </p>
          </div>
          
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
            <Button
              variant="outline"
              onClick={fetchQuotations}
              disabled={loading}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button
              variant="default"
              onClick={() => setShowQuotationForm(true)}
              className="h-9"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="truncate">New Quote</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search quotations by number, customer, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-full sm:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {filteredQuotations.length} of {quotations.length} quotations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardContent className="p-0">
            <div className="h-[min(600px,70dvh)] w-full overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading quotations...</p>
                  </div>
                </div>
              ) : filteredQuotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4" />
                  <p className="text-lg mb-2">No quotations found</p>
                  <p className="text-sm mb-4">
                    {searchTerm || selectedStatus !== 'all'
                      ? 'Try adjusting your search terms or filters'
                      : 'No quotations available'}
                  </p>
                  <Button onClick={() => setShowQuotationForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Quotation
                  </Button>
                </div>
              ) : (
                <DataGrid
                  rows={filteredQuotations}
                  columns={columns}
                  getRowId={(row) => row.id}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } }
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Quotations</p>
                  <p className="text-2xl font-bold">{quotations.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {quotations.filter(q => q.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Converted</p>
                  <p className="text-2xl font-bold">
                    {quotations.filter(q => q.status === 'converted').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">
                    {quotations.filter(q => q.status === 'expired').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quotation Form Modal */}
      {showQuotationForm && (
        <QuotationForm
          open={showQuotationForm}
          onClose={() => setShowQuotationForm(false)}
          onSuccess={() => {
            fetchQuotations();
            toast({
              title: 'Success',
              description: 'Quotation created successfully'
            });
          }}
        />
      )}
    </Layout>
  );
};

export default Quotations;