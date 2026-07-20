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
  Home,
  Printer,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Check,
  X,
  Edit,
  Eye,
  FileText,
  Sparkles,
  Bath,
  Bed,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  ClipboardCheck,
  AlertTriangle
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser } from '@/lib/storage';
import { notifyHousekeepingTask, notifyHousekeepingCompleted } from '@/lib/notificationStore';

import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HousekeepingRecord {
  id: number;
  room_id: number;
  room_number: string;
  booking_id?: number;
  housekeeper_id?: number;
  housekeeper_name?: string;
  checkin_date?: string;
  checkout_date?: string;
  cleaning_date: string;
  cleaning_type: 'checkin' | 'checkout' | 'daily' | 'deep';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  completed_at?: string;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  room_type?: string;
  room_floor?: number;
  booking_checkin?: string;
  booking_checkout?: string;
}

interface HousekeepingSummary {
  pending: number;
  in_progress: number;
  completed: number;
  delayed: number;
  total_today: number;
  completion_rate: number;
}

interface Housekeeper {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Room {
  id: number;
  room_number: string;
  type: string;
  floor?: number;
  status?: string;
  price?: number;
}

const Housekeeping = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<HousekeepingRecord[]>([]);
  const [summary, setSummary] = useState<HousekeepingSummary>({
    pending: 0,
    in_progress: 0,
    completed: 0,
    delayed: 0,
    total_today: 0,
    completion_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [loadingHousekeepers, setLoadingHousekeepers] = useState(false);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [housekeepersError, setHousekeepersError] = useState<string | null>(null);

  // Filters
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('all');
  const [cleaningType, setCleaningType] = useState('all');
  const [roomNumber, setRoomNumber] = useState('');
  const [housekeeperId, setHousekeeperId] = useState('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuickUpdateModal, setShowQuickUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HousekeepingRecord | null>(null);

  // New record form
  const [newRecord, setNewRecord] = useState({
    room_id: '0',
    cleaning_date: new Date().toISOString().split('T')[0],
    cleaning_type: 'daily' as 'checkin' | 'checkout' | 'daily' | 'deep',
    housekeeper_id: '0',
    housekeeper_name: '', // New field for manual name entry
    notes: '',
    checkin_date: '',
    checkout_date: '',
    booking_id: ''
  });

  // Update record form
  const [updateData, setUpdateData] = useState({
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'delayed',
    notes: '',
    housekeeper_id: '0',
    housekeeper_name: '' // New field for manual name entry
  });

  // Quick update form (for table actions)
  const [quickUpdateData, setQuickUpdateData] = useState({
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'delayed',
    notes: ''
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch housekeeping records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams({ date });
      if (status !== 'all') params.append('status', status);
      if (cleaningType !== 'all') params.append('cleaning_type', cleaningType);
      if (roomNumber) params.append('room_number', roomNumber);
      if (housekeeperId !== 'all') params.append('housekeeper_id', housekeeperId);

      const response = await fetch(
        `${backendUrl}/housekeeping?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("hotelhousekeeping", response)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setRecords(data.data.records || []);
        setSummary(data.data.summary || {
          pending: 0,
          in_progress: 0,
          completed: 0,
          delayed: 0,
          total_today: 0,
          completion_rate: 0
        });
      } else {
        throw new Error(data.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Error fetching housekeeping records:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load housekeeping data",
        variant: "destructive"
      });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch housekeepers and rooms
  const fetchData = async () => {
    setLoadingHousekeepers(true);
    setHousekeepersError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      // Fetch housekeepers
      const housekeepersResponse = await fetch(
        `${backendUrl}/housekeeping/housekeepers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!housekeepersResponse.ok) {
        throw new Error(`Failed to fetch housekeepers: ${housekeepersResponse.status}`);
      }

      const housekeepersData = await housekeepersResponse.json();

      if (housekeepersData.success) {
        setHousekeepers(housekeepersData.data || []);
      } else {
        throw new Error(housekeepersData.message || 'Failed to load housekeepers');
      }

      // Fetch available rooms
      const roomsResponse = await fetch(
        `${backendUrl}/housekeeping/rooms`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!roomsResponse.ok) {
        throw new Error(`Failed to fetch rooms: ${roomsResponse.status}`);
      }

      const roomsData = await roomsResponse.json();
      if (roomsData.success) {
        setRooms(roomsData.data || []);
      } else {
        throw new Error(roomsData.message || 'Failed to load rooms');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setHousekeepersError(error instanceof Error ? error.message : 'Failed to load data');
      toast({
        title: "Warning",
        description: "Could not load housekeepers data. Some features may be limited.",
        variant: "default"
      });

      // Set empty arrays on error
      setHousekeepers([]);
      setRooms([]);
    } finally {
      setLoadingHousekeepers(false);
    }
  };

  // Create new record
  const createRecord = async () => {
    if (newRecord.room_id === '0' || !newRecord.room_id) {
      toast({
        title: "Error",
        description: "Please select a room",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

      // Get room number for selected room
      const selectedRoom = rooms.find(room => room.id.toString() === newRecord.room_id);
      const room_number = selectedRoom?.room_number || `Room-${newRecord.room_id}`;

      // Prepare housekeeper data
      let housekeeper_id = null;
      let housekeeper_name = null;

      // If user selected from dropdown
      if (newRecord.housekeeper_id !== '0' && newRecord.housekeeper_id) {
        const selectedHousekeeper = housekeepers.find(hk => hk.id.toString() === newRecord.housekeeper_id);
        housekeeper_id = selectedHousekeeper?.id || null;
        housekeeper_name = selectedHousekeeper?.name || null;
      }

      // If user entered manual name (overrides dropdown selection)
      if (newRecord.housekeeper_name.trim()) {
        housekeeper_name = newRecord.housekeeper_name.trim();
        housekeeper_id = null; // Manual name, no ID association
      }

      const response = await fetch(`${backendUrl}/housekeeping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: newRecord.room_id,
          room_number,
          housekeeper_id,
          housekeeper_name,
          cleaning_date: newRecord.cleaning_date,
          cleaning_type: newRecord.cleaning_type,
          notes: newRecord.notes || null,
          status: 'pending',
          created_by: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Housekeeping record created successfully",
          variant: "default"
        });
        const created = data.data;
        if (created?.id) {
          notifyHousekeepingTask({
            taskId: String(created.id),
            roomNumber: String(created.room_number || room_number),
            status: 'pending',
            cleaningType: newRecord.cleaning_type,
          });
        }
        setShowCreateModal(false);
        setNewRecord({
          room_id: '0',
          cleaning_date: new Date().toISOString().split('T')[0],
          cleaning_type: 'daily',
          housekeeper_id: '0',
          housekeeper_name: '',
          notes: '',
          checkin_date: '',
          checkout_date: '',
          booking_id: ''
        });
        fetchRecords();
      } else {
        throw new Error(data.message || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create record",
        variant: "destructive"
      });
    }
  };

  // Update record status and details
  const updateRecord = async (id: number) => {
    if (!selectedRecord) return;

    try {
      const token = localStorage.getItem('authToken');

      // Prepare housekeeper data
      let housekeeper_id = null;
      let housekeeper_name = null;

      // If user selected from dropdown
      if (updateData.housekeeper_id !== '0' && updateData.housekeeper_id) {
        const selectedHousekeeper = housekeepers.find(hk => hk.id.toString() === updateData.housekeeper_id);
        housekeeper_id = selectedHousekeeper?.id || null;
        housekeeper_name = selectedHousekeeper?.name || null;
      }

      // If user entered manual name (overrides dropdown selection)
      if (updateData.housekeeper_name.trim()) {
        housekeeper_name = updateData.housekeeper_name.trim();
        housekeeper_id = null; // Manual name, no ID association
      }

      const response = await fetch(`${backendUrl}/housekeeping/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: updateData.status,
          housekeeper_id,
          housekeeper_name,
          notes: updateData.notes || null
        })
      });

      const data = await response.json();
      if (data.success) {
        if (updateData.status === 'completed' && selectedRecord) {
          notifyHousekeepingCompleted({
            taskId: String(id),
            roomNumber: String(selectedRecord.room_number),
          });
        }

        toast({
          title: "Success",
          description: "Record updated successfully",
          variant: "default"
        });
        setShowDetailsModal(false);
        fetchRecords();
      } else {
        throw new Error(data.message || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update record",
        variant: "destructive"
      });
    }
  };

  // Quick update status (from table row)
  const quickUpdateStatus = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/housekeeping/${id}/quick-update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: quickUpdateData.status,
          notes: quickUpdateData.notes || null
        })
      });

      const data = await response.json();
      if (data.success) {
        if (quickUpdateData.status === 'completed' && selectedRecord) {
          notifyHousekeepingCompleted({
            taskId: String(id),
            roomNumber: String(selectedRecord.room_number),
          });
        }

        toast({
          title: "Success",
          description: "Status updated successfully",
          variant: "default"
        });
        setShowQuickUpdateModal(false);
        fetchRecords();
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      });
    }
  };

  // Mark as completed
  const markAsCompleted = async (id: number) => {
    const record = records.find((r) => r.id === id);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${backendUrl}/housekeeping/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        if (record) {
          notifyHousekeepingCompleted({
            taskId: String(id),
            roomNumber: String(record.room_number),
          });
        }

        toast({
          title: "Success",
          description: "Marked as completed",
          variant: "default"
        });
        fetchRecords();
      } else {
        throw new Error(data.message || 'Failed to mark as completed');
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as completed",
        variant: "destructive"
      });
    }
  };

  // Delete record
  const deleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${backendUrl}/housekeeping/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
          variant: "default"
        });
        fetchRecords();
      } else {
        throw new Error(data.message || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete record",
        variant: "destructive"
      });
    }
  };

  // View record details
  const viewDetails = (record: HousekeepingRecord) => {
    setSelectedRecord(record);
    setUpdateData({
      status: record.status,
      notes: record.notes || '',
      housekeeper_id: record.housekeeper_id?.toString() || '0',
      housekeeper_name: record.housekeeper_name || ''
    });
    setShowDetailsModal(true);
  };

  // Quick update status (from action buttons)
  const handleQuickUpdate = (record: HousekeepingRecord, newStatus: 'pending' | 'in_progress' | 'completed' | 'delayed') => {
    setSelectedRecord(record);
    setQuickUpdateData({
      status: newStatus,
      notes: record.notes || ''
    });
    setShowQuickUpdateModal(true);
  };

  // Handle export to Excel
  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${backendUrl}/housekeeping/export?date=${date}&status=${status}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `housekeeping_${date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Exported successfully",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Error",
        description: "Failed to export",
        variant: "destructive"
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('all');
    setCleaningType('all');
    setRoomNumber('');
    setHousekeeperId('all');
  };

  useEffect(() => {
    fetchRecords();
  }, [date, status, cleaningType, housekeeperId]);

  useEffect(() => {
    fetchData();
  }, []);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Pending'
      },
      in_progress: {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        label: 'In Progress'
      },
      completed: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Completed'
      },
      delayed: {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
        label: 'Delayed'
      }
    };

    const variant = variants[status] || variants.pending;

    return (
      <Badge variant="outline" className={`${variant.className} text-xs`}>
        <span className="flex items-center">
          {variant.icon}
          {variant.label}
        </span>
      </Badge>
    );
  };

  // Get cleaning type badge
  const getCleaningTypeBadge = (type: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      checkin: {
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Home className="h-3 w-3 mr-1" />,
        label: 'Check-in'
      },
      checkout: {
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Home className="h-3 w-3 mr-1" />,
        label: 'Check-out'
      },
      daily: {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Sparkles className="h-3 w-3 mr-1" />,
        label: 'Daily'
      },
      deep: {
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Bath className="h-3 w-3 mr-1" />,
        label: 'Deep'
      }
    };

    const variant = variants[type] || variants.daily;

    return (
      <Badge variant="outline" className={`${variant.className} text-xs`}>
        <span className="flex items-center">
          {variant.icon}
          {variant.label}
        </span>
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Handle housekeeper selection change
  const handleHousekeeperSelect = (value: string) => {
    setNewRecord({
      ...newRecord,
      housekeeper_id: value,
      housekeeper_name: value === '0' ? '' : newRecord.housekeeper_name // Clear manual name if selecting from dropdown
    });

    // If a housekeeper is selected from dropdown, clear the manual name field
    if (value !== '0') {
      const selectedHousekeeper = housekeepers.find(hk => hk.id.toString() === value);
      if (selectedHousekeeper) {
        setNewRecord(prev => ({
          ...prev,
          housekeeper_name: '' // Clear manual name when selecting from dropdown
        }));
      }
    }
  };

  // Handle update housekeeper selection change
  const handleUpdateHousekeeperSelect = (value: string) => {
    setUpdateData({
      ...updateData,
      housekeeper_id: value,
      housekeeper_name: value === '0' ? '' : updateData.housekeeper_name // Clear manual name if selecting from dropdown
    });

    // If a housekeeper is selected from dropdown, clear the manual name field
    if (value !== '0') {
      const selectedHousekeeper = housekeepers.find(hk => hk.id.toString() === value);
      if (selectedHousekeeper) {
        setUpdateData(prev => ({
          ...prev,
          housekeeper_name: '' // Clear manual name when selecting from dropdown
        }));
      }
    }
  };

  return (
    <Layout>
      <div className="page-shell container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Housekeeping Management</h1>
            <p className="text-muted-foreground">Manage room cleaning and maintenance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loadingHousekeepers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {loadingHousekeepers ? 'Loading...' : 'Refresh Data'}
            </Button>
            <Button onClick={() => setShowCreateModal(true)} size="sm" disabled={loadingHousekeepers}>
              <Home className="h-4 w-4 mr-2" />
              New Task
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm" disabled={records.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-yellow-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.in_progress}</div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{summary.completion_rate}%</div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm">Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cleaningType" className="text-sm">Cleaning Type</Label>
                <Select value={cleaningType} onValueChange={setCleaningType}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="checkin">Check-in</SelectItem>
                    <SelectItem value="checkout">Check-out</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="deep">Deep Clean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="housekeeper" className="text-sm">Housekeeper</Label>
                <Select value={housekeeperId} onValueChange={setHousekeeperId} disabled={loadingHousekeepers}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder={loadingHousekeepers ? "Loading..." : "All Housekeepers"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Housekeepers</SelectItem>
                    {housekeepers.length > 0 ? (
                      housekeepers.map(hk => (
                        <SelectItem key={hk.id} value={hk.id.toString()}>
                          {hk.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {loadingHousekeepers ? "Loading..." : "No housekeepers"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={fetchRecords} className="h-9 mt-1" disabled={loading}>
                  <Filter className="h-4 w-4 mr-2" />
                  {loading ? 'Loading...' : 'Filter'}
                </Button>
                <Button onClick={resetFilters} variant="outline" className="h-9 mt-1">
                  Reset
                </Button>
              </div>
            </div>
            {housekeepersError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{housekeepersError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Housekeeping Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Housekeeping Tasks</CardTitle>
              <CardDescription>
                Showing {records.length} tasks for {formatDate(date)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Total: {summary.total_today}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading tasks...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No housekeeping tasks found for this date.</p>
                <p className="text-sm mt-1">Create a new task or try different filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Housekeeper</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Quick Actions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-bold text-lg">{record.room_number}</div>
                          {record.room_type && (
                            <div className="text-xs text-muted-foreground">
                              {record.room_type}
                              {record.room_floor && ` • Floor ${record.room_floor}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getCleaningTypeBadge(record.cleaning_type)}
                        </TableCell>
                        <TableCell>
                          {record.housekeeper_name ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{record.housekeeper_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{formatDate(record.cleaning_date)}</div>
                            {record.checkin_date && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Check-in: </span>
                                {formatDate(record.checkin_date)}
                              </div>
                            )}
                            {record.checkout_date && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Check-out: </span>
                                {formatDate(record.checkout_date)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                          {record.completed_at && record.status === 'completed' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Completed: {formatDate(record.completed_at)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {record.status !== 'in_progress' && record.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickUpdate(record, 'in_progress')}
                                className="h-7 px-2"
                                title="Mark as In Progress"
                              >
                                <ClipboardCheck className="h-3 w-3" />
                              </Button>
                            )}
                            {record.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsCompleted(record.id)}
                                className="h-7 px-2"
                                title="Mark as Completed"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            {record.status !== 'delayed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickUpdate(record, 'delayed')}
                                className="h-7 px-2"
                                title="Mark as Delayed"
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewDetails(record)}
                              className="h-8 w-8 p-0"
                              title="View/Edit Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteRecord(record.id)}
                              className="h-8 w-8 p-0"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
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

        {/* Create New Task Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Housekeeping Task</DialogTitle>
              <DialogDescription>
                Schedule a new cleaning task for a room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="room_id">Room *</Label>
                <Select
                  value={newRecord.room_id}
                  onValueChange={(value) => setNewRecord({ ...newRecord, room_id: value })}
                  disabled={loadingHousekeepers}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingHousekeepers ? "Loading rooms..." : "Select room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.length > 0 ? (
                      rooms.map(room => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          Room {room.room_number} - {room.type}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {loadingHousekeepers ? "Loading rooms..." : "No rooms available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <Label htmlFor="cleaning_date">Cleaning Date *</Label>
                  <Input
                    id="cleaning_date"
                    type="date"
                    value={newRecord.cleaning_date}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      cleaning_date: e.target.value
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cleaning_type">Cleaning Type *</Label>
                  <Select
                    value={newRecord.cleaning_type}
                    onValueChange={(value: any) =>
                      setNewRecord({
                        ...newRecord,
                        cleaning_type: value
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Clean</SelectItem>
                      <SelectItem value="checkin">Check-in Clean</SelectItem>
                      <SelectItem value="checkout">Check-out Clean</SelectItem>
                      <SelectItem value="deep">Deep Clean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="housekeeper_id">Assign Housekeeper (Select from list)</Label>
                  <Select
                    value={newRecord.housekeeper_id}
                    onValueChange={handleHousekeeperSelect}
                    disabled={loadingHousekeepers}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loadingHousekeepers ? "Loading..." : "Select housekeeper"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Unassigned</SelectItem>
                      {housekeepers.length > 0 ? (
                        housekeepers.map(hk => (
                          <SelectItem key={hk.id} value={hk.id.toString()}>
                            {hk.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          {loadingHousekeepers ? "Loading..." : "No housekeepers available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="housekeeper_name">Or Enter Housekeeper Name</Label>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="housekeeper_name"
                      value={newRecord.housekeeper_name}
                      onChange={(e) => setNewRecord({
                        ...newRecord,
                        housekeeper_name: e.target.value,
                        housekeeper_id: '0' // Reset dropdown if manual name is entered
                      })}
                      placeholder="Enter housekeeper name manually"
                      className="mt-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: Manual name will override the selected housekeeper
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({
                    ...newRecord,
                    notes: e.target.value
                  })}
                  placeholder="Special instructions or notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createRecord}
                disabled={newRecord.room_id === '0' || loadingHousekeepers}
              >
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View/Edit Task Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Housekeeping Task Details</DialogTitle>
              <DialogDescription>
                View and update task information
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Task Details</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Room</div>
                      <div className="font-bold text-lg">{selectedRecord.room_number}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div>{formatDate(selectedRecord.cleaning_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div>{getCleaningTypeBadge(selectedRecord.cleaning_type)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current Status</div>
                      <div>{getStatusBadge(selectedRecord.status)}</div>
                    </div>
                  </div>
                  {selectedRecord.notes && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="text-sm">{selectedRecord.notes}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select
                      value={updateData.status}
                      onValueChange={(value: any) =>
                        setUpdateData({ ...updateData, status: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="housekeeper_id">Assign Housekeeper (Select from list)</Label>
                      <Select
                        value={updateData.housekeeper_id}
                        onValueChange={handleUpdateHousekeeperSelect}
                        disabled={loadingHousekeepers}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={loadingHousekeepers ? "Loading..." : "Select housekeeper"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Unassigned</SelectItem>
                          {housekeepers.length > 0 ? (
                            housekeepers.map(hk => (
                              <SelectItem key={hk.id} value={hk.id.toString()}>
                                {hk.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              {loadingHousekeepers ? "Loading..." : "No housekeepers available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="housekeeper_name">Or Enter Housekeeper Name</Label>
                        <span className="text-xs text-muted-foreground">(Optional)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="housekeeper_name"
                          value={updateData.housekeeper_name}
                          onChange={(e) => setUpdateData({
                            ...updateData,
                            housekeeper_name: e.target.value,
                            housekeeper_id: '0' // Reset dropdown if manual name is entered
                          })}
                          placeholder="Enter housekeeper name manually"
                          className="mt-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Update Notes</Label>
                    <Textarea
                      id="notes"
                      value={updateData.notes}
                      onChange={(e) => setUpdateData({
                        ...updateData,
                        notes: e.target.value
                      })}
                      placeholder="Update notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateRecord(selectedRecord!.id)}
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Update Status Modal */}
        <Dialog open={showQuickUpdateModal} onOpenChange={setShowQuickUpdateModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Quick Update Status</DialogTitle>
              <DialogDescription>
                Update status for {selectedRecord?.room_number}
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Room</div>
                      <div className="font-bold">{selectedRecord.room_number}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current Status</div>
                      <div>{getStatusBadge(selectedRecord.status)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="quick_status">Update to</Label>
                    <Select
                      value={quickUpdateData.status}
                      onValueChange={(value: any) =>
                        setQuickUpdateData({ ...quickUpdateData, status: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quick_notes">Add Note (Optional)</Label>
                    <Textarea
                      id="quick_notes"
                      value={quickUpdateData.notes}
                      onChange={(e) => setQuickUpdateData({
                        ...quickUpdateData,
                        notes: e.target.value
                      })}
                      placeholder="Add a note about this status change..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowQuickUpdateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => quickUpdateStatus(selectedRecord!.id)}
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Housekeeping;