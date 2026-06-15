

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
    Check,
    AlertCircle,
    Filter,
    Bed,
    CalendarCheck,
    DollarSign,
    Users,
    RefreshCw,
    Download,
    Search,
    X,
    IndianRupee,
    PartyPopper,
    FileText,
    PieChart,
    BarChart3,
    TrendingUp,
    Shield,
    Printer,
    Layout as LayoutIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportData {
    [key: string]: any;
}

const Reports = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('daily_occupancy');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [columnFilters, setColumnFilters] = useState<{ [key: string]: string[] }>({});

    // Function Hall Sync
    const [functionHallEnabled, setFunctionHallEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('functionHallEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        const handleFunctionHallToggle = (event: CustomEvent) => {
            setFunctionHallEnabled(event.detail.enabled);
            // If function room report is active and hall is disabled, switch to another tab
            if (!event.detail.enabled && activeTab === 'function_room') {
                setActiveTab('daily_occupancy');
            }
        };

        window.addEventListener('functionHallToggle' as any, handleFunctionHallToggle);

        return () => {
            window.removeEventListener('functionHallToggle' as any, handleFunctionHallToggle);
        };
    }, [activeTab]);

    useEffect(() => {
        setSearchTerm('');
        setColumnFilters({});
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setSelectedDate(today);
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
    }, [activeTab]);

    // Initial check on mount
    useEffect(() => {
        if (!functionHallEnabled && activeTab === 'function_room') {
            setActiveTab('daily_occupancy');
        }
    }, []);

    // ========== POLICE REPORT STATE ==========
    const [policeReportData, setPoliceReportData] = useState<any[]>([]);
    const [hotelDetails, setHotelDetails] = useState<any>({});
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // ========== FUNCTION ROOM REPORT STATE ==========
    const [functionRoomData, setFunctionRoomData] = useState<any[]>([]);
    const [functionRoomSummary, setFunctionRoomSummary] = useState<any>(null);

    // ========== DAILY SALES STATE (split: bookings + advance bookings) ==========
    const [dailySalesData, setDailySalesData] = useState<{ bookings: any[], advanceBookings: any[], functionBookings: any[] }>({
        bookings: [],
        advanceBookings: [],
        functionBookings: []
    });

    // ========== ADVANCE BOOKING REPORT STATE ==========
    const [advanceBookingReportData, setAdvanceBookingReportData] = useState<any[]>([]);

    // Date filters for reports
    const [startDate, setStartDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    });
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Helper to get unique values for a column
    const getUniqueValues = (data: any[], key: string) => {
        const values = data.map(item => String(item[key] || 'N/A')).filter(Boolean);
        return Array.from(new Set(values)).sort();
    };

    // Main filtering function
    const getFilteredData = (data: any[]) => {
        return data.filter(item => {
            // Global search
            const matchesSearch = searchTerm === '' || Object.values(item).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Column filters
            const matchesColumnFilters = Object.keys(columnFilters).every(key => {
                const activeValues = columnFilters[key];
                if (!activeValues || activeValues.length === 0) return true;
                return activeValues.includes(String(item[key] || 'N/A'));
            });

            return matchesSearch && matchesColumnFilters;
        });
    };

    const toggleColumnFilter = (columnId: string, value: string) => {
        setColumnFilters(prev => {
            const current = prev[columnId] || [];
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [columnId]: next };
        });
    };

    const clearColumnFilters = (columnId: string) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            delete next[columnId];
            return next;
        });
    };

    const ColumnFilter = ({ columnId, label, data }: { columnId: string, label: string, data: any[] }) => {
        const uniqueValues = getUniqueValues(data, columnId);
        const activeValues = columnFilters[columnId] || [];

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 hover:bg-muted ${activeValues.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Filter className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                    <div className="p-2 border-b">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{label} Filters</span>
                            {activeValues.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => clearColumnFilters(columnId)} className="h-6 px-2 text-[10px] text-red-500 hover:text-red-700">
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    <ScrollArea className="h-48">
                        <div className="p-2 space-y-1">
                            {uniqueValues.map((val) => (
                                <div key={val} className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer" onClick={() => toggleColumnFilter(columnId, val)}>
                                    <Checkbox checked={activeValues.includes(val)} />
                                    <span className="text-xs truncate">{val}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        );
    };

    // ========== POLICE REPORT FUNCTIONS ==========
    const fetchPoliceReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const url = `${backendUrl}/reports/police-report?startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setPoliceReportData(data.data);
                setReportData(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch police report",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchHotelDetails = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${backendUrl}/reports/police-report/header`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setHotelDetails(data.data);
            }
        } catch (error) {
            console.error('Error fetching hotel details:', error);
        }
    };

    const downloadPoliceReportPDF = async () => {
        setGeneratingPDF(true);
        try {
            const token = localStorage.getItem('authToken');
            const url = `${backendUrl}/reports/police-report/download?startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/pdf'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `police_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: "Success",
                description: "Police report PDF downloaded successfully"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to download PDF: " + error.message,
                variant: "destructive"
            });
        } finally {
            setGeneratingPDF(false);
        }
    };

    // ========== FUNCTION ROOM REPORT FUNCTIONS ==========
    const fetchFunctionRoomReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const url = `${backendUrl}/reports/function-room?startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setFunctionRoomData(data.data);
                setReportData(data.data);

                // Also fetch summary
                await fetchFunctionRoomSummary();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch function room report",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchFunctionRoomSummary = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const url = `${backendUrl}/reports/function-room/summary?startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                // Ensure all numeric values are properly parsed
                const summary = data.data || {};
                setFunctionRoomSummary({
                    total_bookings: parseInt(summary.total_bookings) || 0,
                    total_revenue: parseFloat(summary.total_revenue) || 0,
                    total_advance: parseFloat(summary.total_advance) || 0,
                    total_balance: parseFloat(summary.total_balance) || 0,
                    total_catering: parseFloat(summary.total_catering) || 0,
                    total_decoration: parseFloat(summary.total_decoration) || 0,
                    total_other_charges: parseFloat(summary.total_other_charges) || 0,
                    avg_guests: parseFloat(summary.avg_guests) || 0,
                    confirmed_bookings: parseInt(summary.confirmed_bookings) || 0,
                    completed_bookings: parseInt(summary.completed_bookings) || 0,
                    pending_bookings: parseInt(summary.pending_bookings) || 0,
                    cancelled_bookings: parseInt(summary.cancelled_bookings) || 0
                });
            }
        } catch (error) {
            console.error('Error fetching function room summary:', error);
        }
    };



    // ========== REPORT DATA FETCH ==========
    const fetchReportData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'police_report') {
                await fetchPoliceReport();
                await fetchHotelDetails();
                return;
            }

            if (activeTab === 'function_room') {
                await fetchFunctionRoomReport();
                return;
            }

            const token = localStorage.getItem('authToken');
            let url = `${backendUrl}/reports/${getEndpoint(activeTab)}?`;

            const params = new URLSearchParams();

            switch (activeTab) {
                case 'daily_occupancy':
                case 'check_in_out':
                case 'blocking':
                case 'expenses':
                case 'pnl_summary':
                case 'advance_booking':
                    params.append('startDate', startDate);
                    params.append('endDate', endDate);
                    break;
                case 'housekeeping':
                case 'daily_sales':
                    params.append('date', selectedDate);
                    break;
                case 'salaries':
                    params.append('month', selectedMonth.toString());
                    params.append('year', selectedYear.toString());
                    break;
            }

            params.append('functionHallEnabled', functionHallEnabled.toString());

            url += params.toString();

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                // Daily Sales returns { bookings, advanceBookings } — handle separately
                if (activeTab === 'daily_sales') {
                    setDailySalesData({
                        bookings: data.data?.bookings || [],
                        advanceBookings: data.data?.advanceBookings || [],
                        functionBookings: data.data?.functionBookings || []
                    });
                    setReportData(data.data?.bookings || []);  // for record count badge
                } else {
                    setReportData(data.data);
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fetch report data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // ========== EXPORT FUNCTIONS ==========
    const exportReport = async () => {
        if (activeTab === 'police_report') {
            await downloadPoliceReportPDF();
            return;
        }

        setExporting(true);
        try {
            const token = localStorage.getItem('authToken');
            let url = `${backendUrl}/reports/export/${activeTab}?`;

            const params = new URLSearchParams();

            if (activeTab === 'police_report') {
                params.append('startDate', startDate || '');
                params.append('endDate', endDate || '');
            } else {
                switch (activeTab) {
                    case 'daily_occupancy':
                    case 'check_in_out':
                    case 'blocking':
                    case 'expenses':
                    case 'pnl_summary':
                    case 'function_room':
                    case 'advance_booking':
                        params.append('startDate', startDate);
                        params.append('endDate', endDate);
                        break;
                    case 'housekeeping':
                    case 'daily_sales':
                        params.append('date', selectedDate);
                        break;
                    case 'salaries':
                        params.append('month', selectedMonth.toString());
                        params.append('year', selectedYear.toString());
                        break;
                }
            }

            url += params.toString();

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${activeTab}_report_${Date.now()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Success",
                description: "Report exported successfully"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to export report",
                variant: "destructive"
            });
        } finally {
            setExporting(false);
        }
    };

    const getEndpoint = (tab: string) => {
        const endpoints: Record<string, string> = {
            'daily_occupancy': 'daily-occupancy',
            'housekeeping': 'housekeeping',
            'daily_sales': 'daily-sales',
            'check_in_out': 'check-in-out',
            'blocking': 'blocking',
            'expenses': 'expenses',
            'salaries': 'salaries-report',
            'pnl_summary': 'pnl-summary',
            'police_report': 'police-report',
            'function_room': 'function-room',
            'advance_booking': 'advance-bookings'
        };
        return endpoints[tab] || tab;
    };

    const getReportTitle = (tab: string) => {
        const titles: Record<string, string> = {
            'daily_occupancy': 'Daily Occupancy Report',
            'housekeeping': 'Housekeeping Report',
            'daily_sales': 'Daily Sales Report',
            'check_in_out': 'Check In & Check Out Report',
            'blocking': 'Room Blocking Report',
            'expenses': 'Expenses Report (Exclude Salaries)',
            'salaries': 'Salary Report',
            'pnl_summary': 'Profit & Loss Summary',
            'police_report': 'Police Report',
            'function_room': 'Function Room Report',
            'advance_booking': 'Advance Booking Report'
        };
        return titles[tab] || 'Report';
    };

    const getReportDescription = (tab: string) => {
        const descriptions: Record<string, string> = {
            'daily_occupancy': 'Daily room occupancy, revenue, and availability statistics',
            'housekeeping': 'Daily room cleaning status and maintenance tracking',
            'daily_sales': 'Daily booking sales with customer and payment details',
            'check_in_out': 'Check-in and check-out schedule for guests',
            'blocking': 'Room blocking and reservation schedule',
            'expenses': 'Hotel operational expenses tracking (Exclude Salaries)',
            'salaries': 'Employee salary payments and status',
            'pnl_summary': 'Monthly profit and loss analysis',
            'police_report': 'Daily guest registration report for police submission',
            'function_room': 'Function room bookings, revenue, and event details',
            'advance_booking': 'Tracking all advance bookings and reservation status'
        };
        return descriptions[tab] || '';
    };

    const getReportIcon = (tab: string) => {
        const icons: Record<string, React.ReactNode> = {
            'daily_occupancy': <Bed className="h-5 w-5" />,
            'housekeeping': <FileText className="h-5 w-5" />,
            'daily_sales': <DollarSign className="h-5 w-5" />,
            'check_in_out': <Users className="h-5 w-5" />,
            'blocking': <PieChart className="h-5 w-5" />,
            'expenses': <BarChart3 className="h-5 w-5" />,
            'salaries': <TrendingUp className="h-5 w-5" />,
            'pnl_summary': <PieChart className="h-5 w-5" />,
            'police_report': <Shield className="h-5 w-5" />,
            'function_room': <PartyPopper className="h-5 w-5" />,
            'advance_booking': <CalendarCheck className="h-5 w-5" />
        };
        return icons[tab] || <FileText className="h-5 w-5" />;
    };



    // ========== RENDER FUNCTIONS ==========
    const renderPoliceReportTable = () => {
        if (policeReportData.length === 0) return null;

        return (
            <div className="overflow-x-auto">
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <div className="text-center">
                        <h3 className="text-lg font-bold">{hotelDetails.name || 'Hotel Name'}</h3>
                        <p className="text-sm text-gray-600">{hotelDetails.address || 'Hotel Address'}</p>
                        <p className="text-xs text-gray-500">GST: {hotelDetails.gst_number || ''}</p>
                        <p className="text-sm font-semibold mt-2">POLICE REPORT</p>
                        <p className="text-xs">
                            From: {format(new Date(startDate), 'dd-MMM-yyyy')}&nbsp;&nbsp;&nbsp;To:&nbsp;&nbsp;{format(new Date(endDate), 'dd-MMM-yyyy')}
                        </p>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="flex items-center gap-1">
                                S.No/Book No
                                <ColumnFilter columnId="serial_number" label="Serial No" data={policeReportData} />
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Guest/Address
                                    <ColumnFilter columnId="guest_name" label="Guest" data={policeReportData} />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Check-in
                                    <ColumnFilter columnId="check_in_date" label="Check-in" data={policeReportData} />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Departure
                                    <ColumnFilter columnId="departure_date" label="Departure" data={policeReportData} />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Purpose
                                    <ColumnFilter columnId="purpose_of_visit" label="Purpose" data={policeReportData} />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    ID Type/No
                                    <ColumnFilter columnId="guest_id_type" label="ID Type" data={policeReportData} />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Room/Mobile
                                    <ColumnFilter columnId="room_number" label="Room" data={policeReportData} />
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {getFilteredData(policeReportData).map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-center">
                                    <div className="font-medium">{item.serial_number || index + 1}</div>
                                    <div className="text-xs">{item.book_no || ''}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.guest_name || 'N/A'}</div>
                                    <div className="text-xs text-gray-600">{item.address || 'N/A'}</div>
                                </TableCell>
                                <TableCell className="text-center">{item.check_in_date || 'N/A'}</TableCell>
                                <TableCell className="text-center">{item.departure_date || 'N/A'}</TableCell>
                                <TableCell>
                                    <div>{item.purpose_of_visit || 'N/A'}</div>
                                </TableCell>
                                <TableCell>
                                    <div>{item.guest_id_type || 'N/A'}</div>
                                    <div className="text-xs text-gray-600">{item.guest_id_no || 'N/A'}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="font-medium">{item.room_number || 'N/A'}</div>
                                    <div className="text-xs">{item.mobile_no || 'N/A'}</div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };
    const renderFunctionRoomTable = () => {
        if (functionRoomData.length === 0) return null;

        // Helper function to safely format currency
        const formatCurrency = (value: any): string => {
            if (value === null || value === undefined) return '0';
            // If it's a string, parse it to number
            if (typeof value === 'string') {
                const num = parseFloat(value);
                return isNaN(num) ? '0' : num.toFixed(0);
            }
            // If it's a number, format it directly
            if (typeof value === 'number') {
                return value.toFixed(0);
            }
            return '0';
        };

        // Helper function to safely get number value
        const getNumberValue = (value: any): number => {
            if (value === null || value === undefined) return 0;
            if (typeof value === 'string') {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
            }
            if (typeof value === 'number') return value;
            return 0;
        };

        const filteredData = getFilteredData(functionRoomData);
        
        const totalBookings = filteredData.length;
        const totalRevenue = filteredData.reduce((s, r) => s + getNumberValue(r.total_amount), 0);
        const totalAdvance = filteredData.reduce((s, r) => s + getNumberValue(r.advance_paid), 0);
        const avgGuests = totalBookings > 0 ? filteredData.reduce((s, r) => s + getNumberValue(r.guests_expected), 0) / totalBookings : 0;

        return (
            <div className="space-y-4">
                {functionRoomSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                        <Card>
                            <CardContent className="p-3">
                                <div className="text-xs text-muted-foreground">Total Bookings</div>
                                <div className="text-lg font-bold">{totalBookings}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3">
                                <div className="text-xs text-muted-foreground">Total Revenue</div>
                                <div className="text-lg font-bold flex items-center">
                                    <IndianRupee className="h-4 w-4" />
                                    {formatCurrency(totalRevenue)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3">
                                <div className="text-xs text-muted-foreground">Advance Collected</div>
                                <div className="text-lg font-bold flex items-center">
                                    <IndianRupee className="h-4 w-4" />
                                    {formatCurrency(totalAdvance)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3">
                                <div className="text-xs text-muted-foreground">Avg Guests</div>
                                <div className="text-lg font-bold">{Math.round(avgGuests)}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Date
                                        <ColumnFilter columnId="date" label="Date" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Room
                                        <ColumnFilter columnId="room_number" label="Room" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Event
                                        <ColumnFilter columnId="event_name" label="Event" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Customer
                                        <ColumnFilter columnId="customer_name" label="Customer" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Time
                                        <ColumnFilter columnId="start_time" label="Time" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Guests
                                        <ColumnFilter columnId="guests_expected" label="Guests" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Total Amount
                                        <ColumnFilter columnId="total_amount" label="Total Amount" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Payment
                                        <ColumnFilter columnId="payment_method" label="Payment" data={functionRoomData} />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        Status
                                        <ColumnFilter columnId="status" label="Status" data={functionRoomData} />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getFilteredData(functionRoomData).map((item, index) => {
                                // Safely parse numeric values
                                const totalAmount = getNumberValue(item.total_amount);
                                const advancePaid = getNumberValue(item.advance_paid);

                                return (
                                    <TableRow key={index}>
                                        <TableCell>{item.date ? format(new Date(item.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.room_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-600">{item.room_number || ''}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.event_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-600">{item.room_type || ''}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{item.customer_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-600">{item.customer_phone || ''}</div>
                                        </TableCell>
                                        <TableCell>
                                            {item.start_time || 'N/A'} - {item.end_time || 'N/A'}
                                        </TableCell>
                                        <TableCell>{item.guests_expected || 0}</TableCell>
                                        <TableCell>
                                            <div className="font-medium flex items-center">
                                                <IndianRupee className="h-3 w-3" />
                                                {formatCurrency(totalAmount)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Adv: <IndianRupee className="h-2 w-2 inline" />
                                                {formatCurrency(advancePaid)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                item.payment_method === 'cash' ? 'bg-green-50' :
                                                    item.payment_method === 'online' ? 'bg-blue-50' : ''
                                            }>
                                                {item.payment_method || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                item.status === 'confirmed' ? 'bg-green-500' :
                                                    item.status === 'completed' ? 'bg-blue-500' :
                                                        item.status === 'pending' ? 'bg-yellow-500' :
                                                            item.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                            }>
                                                {item.status || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    // ========== DAILY SALES: Custom 3-section renderer ==========
    const renderDailySalesTable = () => {
        const { bookings = [], advanceBookings = [], functionBookings = [] } = dailySalesData;
        const fmt = (v: any) => `₹${(parseFloat(v) || 0).toFixed(2)}`;
        const fmtDate = (d: any) => {
            if (!d) return 'N/A';
            try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
            catch { return d; }
        };

        const filteredBookings = getFilteredData(bookings);
        const filteredAdvanceBookings = getFilteredData(advanceBookings);
        const filteredFunctionBookings = getFilteredData(functionBookings);

        const bookingTotal = filteredBookings.reduce((s: number, r: any) => s + (parseFloat(r.total_amount) || 0), 0);
        const advanceTotal = filteredAdvanceBookings.reduce((s: number, r: any) => s + (parseFloat(r.total_amount) || 0), 0);
        const functionTotal = filteredFunctionBookings.reduce((s: number, r: any) => s + (parseFloat(r.total_amount) || 0), 0);
        const functionTotalAdvance = filteredFunctionBookings.reduce((s: number, r: any) => s + (parseFloat(r.advance_paid) || 0), 0);
        const functionTotalBalance = filteredFunctionBookings.reduce((s: number, r: any) => s + (parseFloat(r.balance_due) || 0), 0);

        return (
            <div className="space-y-6">
                {!functionHallEnabled && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-xs flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Function Hall revenue is excluded. Enable it in Overview to include it in Daily Sales.</span>
                    </div>
                )}
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Card><CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">Room Bookings</div>
                        <div className="text-lg font-bold">{filteredBookings.length} bookings</div>
                        <div className="text-sm text-green-600 font-semibold">{fmt(bookingTotal)}</div>
                    </CardContent></Card>
                    <Card><CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">Advance Bookings</div>
                        <div className="text-lg font-bold">{filteredAdvanceBookings.length} bookings</div>
                        <div className="text-sm text-blue-600 font-semibold">{fmt(advanceTotal)}</div>
                    </CardContent></Card>
                    {functionHallEnabled && (
                        <Card><CardContent className="p-3">
                            <div className="text-xs text-muted-foreground">Function Hall</div>
                            <div className="text-lg font-bold">{filteredFunctionBookings.length} bookings</div>
                            <div className="text-sm text-purple-600 font-semibold">{fmt(functionTotal)}</div>
                        </CardContent></Card>
                    )}
                    <Card><CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">Combine Day Sales</div>
                        <div className="text-lg font-bold">{filteredBookings.length + filteredAdvanceBookings.length + (functionHallEnabled ? filteredFunctionBookings.length : 0)} total</div>
                        <div className="text-sm text-primary font-bold">{fmt(bookingTotal + advanceTotal + (functionHallEnabled ? functionTotal : 0))}</div>
                    </CardContent></Card>
                </div>

                {/* TABLE 1: Room Bookings */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Bed className="h-4 w-4 text-green-600" />
                        Room Bookings
                        <Badge variant="outline" className="text-xs">{getFilteredData(bookings).length} records</Badge>
                    </h3>
                    <div className="overflow-x-auto rounded-md border text-[10px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-green-50">
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Invoice
                                            <ColumnFilter columnId="invoice_number" label="Invoice" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Room
                                            <ColumnFilter columnId="room_number" label="Room" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Customer
                                            <ColumnFilter columnId="customer_name" label="Customer" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Mobile
                                            <ColumnFilter columnId="mobile_no" label="Mobile" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Payment
                                            <ColumnFilter columnId="payment_method" label="Payment" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Status
                                            <ColumnFilter columnId="payment_status" label="Status" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Room Cost
                                            <ColumnFilter columnId="room_cost" label="Room Cost" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            GST
                                            <ColumnFilter columnId="gst" label="GST" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Other Exp
                                            <ColumnFilter columnId="other_expenses" label="Other Exp" data={bookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right font-bold">
                                        <div className="flex items-center justify-end gap-1">
                                            Total
                                            <ColumnFilter columnId="total_amount" label="Total" data={bookings} />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getFilteredData(bookings).map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs">{row.invoice_number || '-'}</TableCell>
                                        <TableCell className="text-xs font-medium">{row.room_number}</TableCell>
                                        <TableCell className="text-xs">{row.customer_name || 'N/A'}</TableCell>
                                        <TableCell className="text-xs">{row.mobile_no || '-'}</TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className="text-xs capitalize">{row.payment_method || '-'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge className={`text-xs ${row.payment_status === 'completed' ? 'bg-green-100 text-green-800' : row.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {row.payment_status || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-right">{fmt(row.room_cost)}</TableCell>
                                        <TableCell className="text-xs text-right">{fmt(row.gst)}</TableCell>
                                        <TableCell className="text-xs text-right">{fmt(row.other_expenses)}</TableCell>
                                        <TableCell className="text-xs text-right font-bold">{fmt(row.total_amount)}</TableCell>
                                    </TableRow>
                                ))}
                                {/* Totals row */}
                                <TableRow className="bg-green-50 font-bold">
                                    <TableCell colSpan={9} className="text-xs text-right">Total</TableCell>
                                    <TableCell className="text-xs text-right">{fmt(bookingTotal)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* TABLE 2: Advance Bookings */}
                <div className="space-y-2 mt-4">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-blue-600" />
                        Advance Bookings
                        <Badge variant="outline" className="text-xs">{getFilteredData(advanceBookings).length} records</Badge>
                    </h3>
                    <div className="overflow-x-auto rounded-md border text-[10px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-blue-50">
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Invoice
                                            <ColumnFilter columnId="invoice_number" label="Invoice" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Room
                                            <ColumnFilter columnId="room_number" label="Room" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Customer
                                            <ColumnFilter columnId="customer_name" label="Customer" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Mobile
                                            <ColumnFilter columnId="mobile_no" label="Mobile" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Check-In
                                            <ColumnFilter columnId="from_date" label="Check-In" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Check-Out
                                            <ColumnFilter columnId="to_date" label="Check-Out" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Payment
                                            <ColumnFilter columnId="payment_method" label="Payment" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Status
                                            <ColumnFilter columnId="booking_status" label="Status" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Total
                                            <ColumnFilter columnId="total_amount" label="Total" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Paid
                                            <ColumnFilter columnId="advance_amount" label="Paid" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Bal
                                            <ColumnFilter columnId="remaining_amount" label="Bal" data={advanceBookings} />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getFilteredData(advanceBookings).map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs">{row.invoice_number || '-'}</TableCell>
                                        <TableCell className="text-xs font-medium">{row.room_number || 'N/A'}</TableCell>
                                        <TableCell className="text-xs">{row.customer_name || 'N/A'}</TableCell>
                                        <TableCell className="text-xs">{row.mobile_no || '-'}</TableCell>
                                        <TableCell className="text-xs">{fmtDate(row.from_date)}</TableCell>
                                        <TableCell className="text-xs">{fmtDate(row.to_date)}</TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className="text-xs capitalize">{row.payment_method || '-'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge className={`text-xs ${row.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' : row.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {row.booking_status || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-bold">{fmt(row.total_amount)}</TableCell>
                                        <TableCell className="text-xs text-right text-green-700">{fmt(row.advance_amount)}</TableCell>
                                        <TableCell className="text-xs text-right text-orange-600">{fmt(row.remaining_amount)}</TableCell>
                                    </TableRow>
                                ))}
                                {/* Totals row */}
                                <TableRow className="bg-blue-50 font-bold">
                                    <TableCell colSpan={8} className="text-xs text-right">Total</TableCell>
                                    <TableCell className="text-xs text-right">{fmt(advanceTotal)}</TableCell>
                                    <TableCell className="text-xs text-right text-green-700">
                                        {fmt(filteredAdvanceBookings.reduce((s: number, r: any) => s + (parseFloat(r.advance_amount) || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-xs text-right text-orange-600">
                                        {fmt(filteredAdvanceBookings.reduce((s: number, r: any) => s + (parseFloat(r.remaining_amount) || 0), 0))}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* 3. Function Bookings */}
                {functionHallEnabled && (
                    <div className="space-y-3 pt-4 border-t-2 border-dashed border-purple-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PartyPopper className="h-5 w-5 text-purple-600" />
                                <h3 className="font-bold text-gray-800">Function Hall Bookings</h3>
                            </div>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                {functionBookings.length} Bookings
                            </Badge>
                        </div>

                        <div className="overflow-x-auto rounded-md border border-purple-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-purple-50">
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Event Name
                                                <ColumnFilter columnId="event_name" label="Event Name" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Room
                                                <ColumnFilter columnId="room_number" label="Room" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Customer
                                                <ColumnFilter columnId="customer_name" label="Customer" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Mobile
                                                <ColumnFilter columnId="mobile_no" label="Mobile" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Event Date
                                                <ColumnFilter columnId="booking_date" label="Event Date" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Payment
                                                <ColumnFilter columnId="payment_method" label="Payment" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Status
                                                <ColumnFilter columnId="payment_status" label="Status" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                Total Amount
                                                <ColumnFilter columnId="total_amount" label="Total Amount" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                Advance Paid
                                                <ColumnFilter columnId="advance_paid" label="Advance Paid" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                Balance Due
                                                <ColumnFilter columnId="balance_due" label="Balance Due" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Rooms
                                                <ColumnFilter columnId="total_rooms_booked" label="Rooms" data={functionBookings} />
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getFilteredData(functionBookings).map((row: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs">{row.event_name || '-'}</TableCell>
                                            <TableCell className="text-xs font-medium">{row.room_number || 'N/A'}</TableCell>
                                            <TableCell className="text-xs">{row.customer_name || 'N/A'}</TableCell>
                                            <TableCell className="text-xs">{row.mobile_no || '-'}</TableCell>
                                            <TableCell className="text-xs">{fmtDate(row.booking_date)}</TableCell>
                                            <TableCell className="text-xs">
                                                <Badge variant="outline" className="text-xs capitalize">{row.payment_method || '-'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <Badge className={`text-xs ${row.payment_status === 'completed' ? 'bg-green-100 text-green-800' : row.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {row.payment_status || '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-right font-medium">{fmt(row.total_amount)}</TableCell>
                                            <TableCell className="text-xs text-right font-medium text-green-600">{fmt(row.advance_paid)}</TableCell>
                                            <TableCell className="text-xs text-right font-medium text-red-600">{fmt(row.balance_due)}</TableCell>
                                            <TableCell className="text-xs">
                                                {row.has_room_bookings ? (
                                                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                                        Yes ({row.total_rooms_booked || 0})
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">No</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals row */}
                                    <TableRow className="bg-purple-50 font-bold">
                                        <TableCell colSpan={7} className="text-xs text-right">Totals</TableCell>
                                        <TableCell className="text-xs text-right text-purple-700 font-bold">{fmt(functionTotal)}</TableCell>
                                        <TableCell className="text-xs text-right text-green-700 font-bold">{fmt(functionTotalAdvance)}</TableCell>
                                        <TableCell className="text-xs text-right text-red-700 font-bold">{fmt(functionTotalBalance)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTableColumns = () => {
        if (reportData.length === 0) return null;

        const sample = reportData[0];
        return Object.keys(sample)
            .filter(key => key !== 'occupancy_percentage')
            .map((key) => (
                <TableHead key={key} className={`font-bold ${!functionHallEnabled && key === 'function_revenue' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-1">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        <ColumnFilter 
                            columnId={key} 
                            label={key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
                            data={reportData} 
                        />
                    </div>
                </TableHead>
            ));
    };
    const renderTableRows = () => {
        return getFilteredData(reportData).map((row, index) => {
            const keys = Object.keys(row).filter(key => key !== 'occupancy_percentage');
            return (
                <TableRow key={index}>
                    {keys.map((key, idx) => {
                        let value = row[key];

                        // Respect Function Hall toggle for P&L Summary
                        if (activeTab === 'pnl_summary' && key === 'function_revenue' && !functionHallEnabled) {
                            value = 0;
                        }

                        // Check if this is a date field
                        const isDateField = (key.toLowerCase().includes('date') ||
                            key.toLowerCase().includes('checkin') ||
                            key.toLowerCase().includes('checkout') ||
                            key.toLowerCase().includes('check_in') ||
                            key.toLowerCase().includes('check_out')) && 
                            // Only exclude exactly named count columns in Daily Occupancy
                            !(activeTab === 'daily_occupancy' && (key === 'check_in' || key === 'check_out'));

                        // Format date if it's a date field and has a value
                        if (isDateField && value) {
                            try {
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                    // Format as DD/MM/YYYY
                                    const day = date.getDate().toString().padStart(2, '0');
                                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                    const year = date.getFullYear();
                                    return (
                                        <TableCell key={idx}>
                                            {`${day}/${month}/${year}`}
                                        </TableCell>
                                    );
                                }
                            } catch (e) {
                                // If date parsing fails, show original value
                            }
                        }

                        // Handle number formatting
                        if (typeof value === 'number' && !isNaN(value)) {
                            // Check if it's an integer count field
                            const isCountField = (activeTab === 'daily_occupancy' && (key === 'check_in' || key === 'check_out')) || 
                                               key === 'total_rooms' || 
                                               key === 'total rooms' ||
                                               key === 'booked' || 
                                               key === 'blocked' ||
                                               key === 'out_of_order' ||
                                               key === 'occupied_rooms';

                            if (isCountField) {
                                return (
                                    <TableCell key={idx}>
                                        {Math.round(value)}
                                    </TableCell>
                                );
                            }


                            const formattedValue =
                                key === 'occupancy_rate' ? `${value.toFixed(2)}%` :
                                    key === 'total_revenue' || key === 'avg_revenue_per_room' || key === 'amount' ||
                                        key === 'room_cost' || key === 'gst' || key === 'total' || key === 'net_profit' ||
                                        key === 'basic_salary' || key === 'allowances' || key === 'deductions' ||
                                        key === 'net_salary' || key === 'salary_per_month' || key === 'total_amount' ||
                                        key === 'subtotal' || key === 'service_charge' || key === 'catering_charges' ||
                                        key === 'decoration_charges' || key === 'other_charges' || key === 'advance_paid' ||
                                        key === 'room_cost' || key === 'gst' || key === 'function_revenue' ?
                                        `₹${value.toFixed(2)}` : value.toFixed(2);

                            return (
                                <TableCell key={idx} className={!functionHallEnabled && key === 'function_revenue' ? 'opacity-50 grayscale' : ''}>
                                    {formattedValue}
                                </TableCell>
                            );
                        }


                        // Default string value
                        return (
                            <TableCell key={idx} className={!functionHallEnabled && key === 'function_revenue' ? 'opacity-50 grayscale' : ''}>
                                {String(value || '')}
                            </TableCell>
                        );
                    })}
                </TableRow>
            );
        });
    };

    useEffect(() => {
        fetchReportData();
    }, [activeTab, startDate, endDate, selectedDate, selectedMonth, selectedYear]);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: year, label: year.toString() };
    });

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold sm:font-bold">
                            Reports Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Generate and analyze hotel performance reports
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={fetchReportData} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs h-9 sm:h-8">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button
                            onClick={exportReport}
                            disabled={exporting ||
                                (activeTab === 'police_report' ? policeReportData.length === 0 :
                                    activeTab === 'function_room' ? functionRoomData.length === 0 :
                                        reportData.length === 0)}
                            size="sm"
                            className="flex-1 sm:flex-none text-xs h-9 sm:h-8"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {exporting ? 'Exporting...' : 'Export'}
                        </Button>
                    </div>
                </div>

                {/* Global Search Bar */}
                <div className="mb-4">
                    {(reportData.length > 0 || policeReportData.length > 0 || functionRoomData.length > 0) && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search across all columns..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-white shadow-sm"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Report Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                    {/* Mobile-optimized tabs section with better selection visibility */}
                    <div className="mb-4">
                        {/* Horizontal scrollable tabs for mobile */}
                        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                            <TabsList className="inline-flex w-max min-w-full sm:grid sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap gap-1.5 bg-transparent sm:bg-muted p-1">
                                <TabsTrigger
                                    value="daily_occupancy"
                                    className={`
    flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-teal-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
  `}
                                >
                                    <Bed className="h-3.5 w-3.5" />
                                    <span>Daily Occupancy</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="advance_booking"
                                    className={`
        flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <CalendarCheck className="h-3.5 w-3.5" />
                                    <span>Advance Booking</span>
                                </TabsTrigger>



                                <TabsTrigger
                                    value="daily_sales"
                                    className={`
          flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>Daily Sales</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="check_in_out"
                                    className={`
        flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    <span>Check In/Out</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="blocking"
                                    className={`
         flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <PieChart className="h-3.5 w-3.5" />
                                    <span>Blocking</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="expenses"
                                    className={`
          flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    <span>Expenses (Excl. Salaries)</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="salaries"
                                    className={`
         flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span>Salaries</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="pnl_summary"
                                    className={`
         flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <PieChart className="h-3.5 w-3.5" />
                                    <span>P&L Summary</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="police_report"
                                    className={`
          flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md
        `}
                                >
                                    <Shield className="h-3.5 w-3.5" />
                                    <span>Police Report</span>
                                </TabsTrigger>

                                 <TabsTrigger
                                    value="function_room"
                                    disabled={!functionHallEnabled}
                                    className={`
        flex items-center gap-1.5 text-xs h-9 px-3 whitespace-nowrap
    data-[state=active]:bg-emerald-600 data-[state=active]:text-white
    data-[state=active]:shadow-md data-[state=active]:font-medium
    data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-700
    hover:bg-gray-200 transition-all duration-200
    rounded-md ${!functionHallEnabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                                >
                                    <PartyPopper className="h-3.5 w-3.5" />
                                    <span>Function Room</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    {/* Report Title and Description - Keep as is */}
                    <Card className="mb-4">
                        <CardHeader className="px-3 sm:px-4 pt-4 pb-3">
                            <div className="flex items-center gap-3">
                                {getReportIcon(activeTab)}
                                <div>
                                    <CardTitle className="text-base">{getReportTitle(activeTab)}</CardTitle>
                                    <CardDescription className="text-xs">{getReportDescription(activeTab)}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Report Filters - Mobile optimized */}
                    <Card className="mb-4">
                        <CardContent className="pt-4 px-3 sm:px-4 pb-4">
                            <div className="space-y-3">
                                {/* Date filters for reports that need start/end date */}
                                {['daily_occupancy', 'check_in_out', 'blocking', 'expenses', 'pnl_summary', 'police_report', 'function_room', 'advance_booking'].includes(activeTab) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full text-xs h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="endDate" className="text-xs">End Date</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full text-xs h-9"
                                                min={startDate}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                                            <Button
                                                onClick={fetchReportData}
                                                className="w-full text-xs h-9"
                                                disabled={loading}
                                            >
                                                <Filter className="h-3 w-3 mr-1" />
                                                {loading ? 'Loading...' : 'Apply Filters'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Single date filter for daily sales */}
                                {activeTab === 'daily_sales' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1 sm:col-span-1">
                                            <Label htmlFor="selectedDate" className="text-xs">Date</Label>
                                            <Input
                                                id="selectedDate"
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full text-xs h-9"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={fetchReportData}
                                                className="w-full text-xs h-9"
                                                disabled={loading}
                                            >
                                                <Filter className="h-3 w-3 mr-1" />
                                                {loading ? 'Loading...' : 'Apply Filters'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Month/Year filter for salaries */}
                                {activeTab === 'salaries' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="month" className="text-xs">Month</Label>
                                            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                                                <SelectTrigger className="w-full text-xs h-9">
                                                    <SelectValue placeholder="Select month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map(month => (
                                                        <SelectItem key={month.value} value={month.value.toString()}>
                                                            {month.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="year" className="text-xs">Year</Label>
                                            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                                                <SelectTrigger className="w-full text-xs h-9">
                                                    <SelectValue placeholder="Select year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {years.map(year => (
                                                        <SelectItem key={year.value} value={year.value.toString()}>
                                                            {year.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={fetchReportData}
                                                className="w-full text-xs h-9"
                                                disabled={loading}
                                            >
                                                <Filter className="h-3 w-3 mr-1" />
                                                {loading ? 'Loading...' : 'Apply Filters'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Data Table */}
                    <Card>
                        <CardHeader className={`flex ${activeTab === 'police_report' ? 'flex-col sm:flex-row' : 'flex-row'} items-center justify-between space-y-0 px-4 pt-4 pb-3`}>
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-sm sm:text-base whitespace-nowrap">Report Data</CardTitle>
                                <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 px-1.5 h-5">
                                    {activeTab === 'police_report' ? policeReportData.length :
                                        activeTab === 'function_room' ? functionRoomData.length :
                                        activeTab === 'daily_sales' ? (dailySalesData.bookings.length + dailySalesData.advanceBookings.length) :
                                            reportData.length} records
                                </Badge>
                            </div>

                            <div className="flex flex-row items-center gap-2 sm:justify-end">
                                {/* PDF Download for Police Report */}
                                {activeTab === 'police_report' && (
                                    <Button
                                        onClick={downloadPoliceReportPDF}
                                        variant="outline"
                                        size="sm"
                                        disabled={generatingPDF || policeReportData.length === 0}
                                        className="text-[10px] sm:text-xs h-8 sm:h-7 bg-red-50 hover:bg-red-100 border-red-200"
                                    >
                                        <FileText className="h-3 w-3 mr-1 text-red-600" />
                                        {generatingPDF ? 'Downloading...' : 'Download PDF'}
                                    </Button>
                                )}

                                {/* Print Button */}
                                {activeTab === 'police_report' && (
                                    <Button
                                        onClick={() => window.print()}
                                        variant="outline"
                                        size="sm"
                                        disabled={policeReportData.length === 0}
                                        className="text-[10px] sm:text-xs h-8 sm:h-7"
                                    >
                                        <Printer className="h-3 w-3 mr-1" />
                                        Print
                                    </Button>
                                )}

                                {/* Export Excel Button */}
                                {activeTab !== 'police_report' && (
                                    <Button
                                        onClick={exportReport}
                                        variant="outline"
                                        size="sm"
                                        disabled={exporting ||
                                            (activeTab === 'function_room' ? functionRoomData.length === 0 : reportData.length === 0)}
                                        className="text-[10px] sm:text-xs h-8 sm:h-7"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Export Excel
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="px-4 pb-4">
                            {loading ? (
                                <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-muted-foreground mt-2 text-xs">Loading report data...</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'police_report' ? (
                                        policeReportData.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground text-xs">
                                                No police report data found for the selected date range
                                            </div>
                                        ) : (
                                            renderPoliceReportTable()
                                        )
                                    ) : activeTab === 'function_room' ? (
                                        functionRoomData.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground text-xs">
                                                No function room data found for the selected date range
                                            </div>
                                        ) : (
                                            renderFunctionRoomTable()
                                        )
                                    ) : activeTab === 'daily_sales' ? (
                                        renderDailySalesTable()
                                    ) : (
                                        reportData.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground text-xs">
                                                No data found for the selected criteria
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {activeTab === 'pnl_summary' && !functionHallEnabled && (
                                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-xs flex items-center gap-2 mb-2">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span>Function Hall revenue is excluded. Enable it in Overview to include it in P&L.</span>
                                                    </div>
                                                )}
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                {renderTableColumns()}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {renderTableRows()}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                </Tabs>
            </div >
        </Layout >
    );
};

export default Reports;