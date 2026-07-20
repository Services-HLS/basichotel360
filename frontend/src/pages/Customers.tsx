// import AddCustomerDialog from '@/components/AddCustomerDialog';
// import EditCustomerDialog from '@/components/EditCustomerDialog';
// import { useState, useEffect, useMemo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import Layout from '@/components/Layout';
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
// import { Card, CardContent, CardHeader } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Search, Loader2, RefreshCw, Download, Eye, FileText, FileDown, FileSpreadsheet, User, Phone, Mail, Calendar, Hash, CreditCard, Pencil } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Badge } from '@/components/ui/badge';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// // URLs
// const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
// const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   customerNumber: string;
//   idNumber: string;
//   idType: string;
//   createdAt: string;
//   address?: string;
//   city?: string;
//   state?: string;
//   pincode?: string;
//   customer_gst_no?: string;
//   purpose_of_visit?: string;
//   other_expenses?: number;
//   expense_description?: string;
//   source?: string;
// }

// /** ✅ Handles dd/mm/yyyy, yyyy-mm-dd, and ISO date formats */
// function parseDateString(value: string): string {
//   if (!value) return '';

//   const isoParsed = new Date(value);
//   if (!isNaN(isoParsed.getTime())) {
//     return isoParsed.toLocaleDateString('en-GB');
//   }

//   const match = value.match(
//     /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/
//   );
//   if (match) {
//     const [, dd, mm, yyyy] = match;
//     const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
//     if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB');
//   }

//   const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
//   if (iso) {
//     const [, yyyy, mm, dd] = iso;
//     const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
//     if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB');
//   }

//   return value;
// }

// // Helper to format ID type label
// const formatIdType = (type: string): string => {
//   const types: Record<string, string> = {
//     aadhaar: 'Aadhaar',
//     pan: 'PAN',
//     passport: 'Passport',
//     driving: 'Driving License'
//   };
//   return types[type] || type;
// };

// const Customers = () => {
//   const { toast } = useToast();
//   const [currentUser] = useState<any>(() => {
//     try {
//       return JSON.parse(localStorage.getItem('currentUser') || '{}');
//     } catch {
//       return {};
//     }
//   });

//   const spreadsheetId = currentUser?.spreadsheetId;
//   const userSource = currentUser?.source;
//   const userPlan = currentUser?.plan;

//   // Check if user is database/pro user
//   const isDatabaseUser = userSource === 'database' || userPlan === 'pro';

//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
//   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
//   const [editDialogOpen, setEditDialogOpen] = useState(false);
//   const [generatingPdf, setGeneratingPdf] = useState(false);
//   const [downloadingAll, setDownloadingAll] = useState(false);
//   const [activeTab, setActiveTab] = useState('basic');

//   // ✅ JSONP helper for Google Sheets
//   const loadScript = (src: string) =>
//     new Promise<any>((resolve, reject) => {
//       const callbackName = 'cb_' + Date.now();
//       (window as any)[callbackName] = (data: any) => {
//         resolve(data);
//         delete (window as any)[callbackName];
//         const script = document.getElementById(callbackName);
//         if (script && script.parentNode) script.parentNode.removeChild(script);
//       };
//       const script = document.createElement('script');
//       script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
//       script.id = callbackName;
//       script.onerror = () => {
//         reject(new Error('Failed to load script'));
//         delete (window as any)[callbackName];
//         if (script && script.parentNode) script.parentNode.removeChild(script);
//       };
//       document.body.appendChild(script);
//     });

//   // ✅ Fetch from Backend Database
//   // ✅ Fetch from Backend Database
//   const fetchFromBackend = async (): Promise<Customer[]> => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const response = await fetch(`${NODE_BACKEND_URL}/customers`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       // Group customers by hotel_id to create sequential numbers
//       const customersByHotel: Record<string, any[]> = {};
//       data.data.forEach((customer: any) => {
//         const hotelId = customer.hotel_id;
//         if (!customersByHotel[hotelId]) {
//           customersByHotel[hotelId] = [];
//         }
//         customersByHotel[hotelId].push(customer);
//       });

//       // Sort each hotel's customers by created_at and assign sequential numbers
//       const transformedCustomers: Customer[] = [];

//       Object.keys(customersByHotel).forEach(hotelId => {
//         const hotelCustomers = customersByHotel[hotelId];
//         // Sort by created_at
//         hotelCustomers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

//         hotelCustomers.forEach((customer, index) => {
//           transformedCustomers.push({
//             id: customer.id.toString(),
//             name: customer.name,
//             phone: customer.phone,
//             email: customer.email || '',
//             // Use customer_number if exists, otherwise generate sequential number
//             customerNumber: customer.customer_number || (index + 1).toString(),
//             idNumber: customer.id_number || '',
//             idType: customer.id_type || 'aadhaar',
//             createdAt: parseDateString(customer.created_at),
//             address: customer.address || '',
//             city: customer.city || '',
//             state: customer.state || '',
//             pincode: customer.pincode || '',
//             customer_gst_no: customer.customer_gst_no || '',
//             purpose_of_visit: customer.purpose_of_visit || '',
//             other_expenses: customer.other_expenses || 0,
//             expense_description: customer.expense_description || '',
//             source: 'database'
//           });
//         });
//       });

//       // Sort all customers by created_at for display
//       return transformedCustomers.sort((a, b) =>
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       );
//     } catch (error) {
//       console.error('Error fetching from backend:', error);
//       throw error;
//     }
//   };

//   // ✅ Fetch from Google Sheets
//   const fetchFromGoogleSheets = async (): Promise<Customer[]> => {
//     if (!spreadsheetId) return [];

//     try {
//       const custRes = await loadScript(
//         `${APPS_SCRIPT_URL}?action=getCustomers&spreadsheetid=${encodeURIComponent(spreadsheetId)}`
//       );

//       if (Array.isArray(custRes.customers)) {
//         const normalized = custRes.customers.map((c: any, i: number) => {
//           const createdAt = c.createdAt || c.CreatedAt || c.created_at || c['Created At'] || '';

//           return {
//             id: c.customerId || c.id || `CUST-${i + 1}`,
//             name: c.name || '',
//             phone: c.phone ? String(c.phone) : '',
//             email: c.email || '',
//             customerNumber: c.customerNumber || '',
//             idNumber: c.idNumber || '',
//             idType: c.idType || 'aadhaar',
//             createdAt: parseDateString(createdAt),
//             source: 'google_sheets'
//           } as Customer;
//         });

//         return normalized;
//       }
//       return [];
//     } catch (error) {
//       console.error('Error fetching from Google Sheets:', error);
//       throw error;
//     }
//   };

//   // ✅ Update Customer
//   const updateCustomer = async (customerId: string, updatedData: Partial<Customer>) => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const response = await fetch(`${NODE_BACKEND_URL}/customers/${customerId}`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(updatedData)
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update customer');
//       }

//       const result = await response.json();

//       toast({
//         title: "Success",
//         description: "Customer updated successfully"
//       });

//       // Refresh the customer list
//       await fetchCustomers();

//       return true;
//     } catch (error: any) {
//       console.error('Error updating customer:', error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to update customer",
//         variant: "destructive"
//       });
//       return false;
//     }
//   };

//   // ✅ Generate PDF for Single Customer
//   const generateCustomerPDF = async (customer: Customer) => {
//     try {
//       setGeneratingPdf(true);

//       if (isDatabaseUser) {
//         const token = localStorage.getItem('authToken');
//         const response = await fetch(
//           `${NODE_BACKEND_URL}/customers/${customer.id}/pdf`,
//           {
//             method: 'GET',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error('Failed to generate PDF');
//         }

//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `Customer_${customer.name}_${customer.id}.pdf`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);

//         toast({
//           title: "Success",
//           description: "PDF downloaded successfully"
//         });
//       } else {
//         // For Google Sheets users, show upgrade message
//         toast({
//           title: "Feature unavailable",
//           description: "PDF download is only available for Pro Plan users",
//           variant: "destructive"
//         });
//       }
//     } catch (error: any) {
//       console.error('Error generating PDF:', error);
//       toast({
//         title: "Error",
//         description: `Failed to generate PDF: ${error.message}`,
//         variant: "destructive"
//       });
//     } finally {
//       setGeneratingPdf(false);
//       setDetailsDialogOpen(false);
//     }
//   };

//   // ✅ Generate PDF for All Customers
//   const generateAllCustomersPDF = async () => {
//     if (!isDatabaseUser) {
//       toast({
//         title: "Feature unavailable",
//         description: "Bulk PDF export is only available for Pro Plan users",
//         variant: "destructive"
//       });
//       return;
//     }

//     try {
//       setDownloadingAll(true);
//       const token = localStorage.getItem('authToken');
//       const response = await fetch(`${NODE_BACKEND_URL}/customers/export/pdf`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to generate PDF');
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `All_Customers_${new Date().toISOString().split('T')[0]}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);

//       toast({
//         title: "Success",
//         description: "All customers PDF downloaded successfully"
//       });
//     } catch (error: any) {
//       console.error('Error generating PDF for all customers:', error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to generate PDF",
//         variant: "destructive"
//       });
//     } finally {
//       setDownloadingAll(false);
//     }
//   };

//   // ✅ Export to Excel
//   const exportToExcel = async () => {
//     if (!isDatabaseUser) {
//       toast({
//         title: "Feature unavailable",
//         description: "Excel export is only available for Pro Plan users",
//         variant: "destructive"
//       });
//       return;
//     }

//     try {
//       setDownloadingAll(true);

//       const token = localStorage.getItem('authToken');
//       const response = await fetch(`${NODE_BACKEND_URL}/customers/export/excel`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `Customers_${new Date().toISOString().split('T')[0]}.xlsx`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);

//         toast({
//           title: "Success",
//           description: "Excel file downloaded successfully"
//         });
//       } else {
//         toast({
//           title: "Error",
//           description: "Failed to export Excel",
//           variant: "destructive"
//         });
//       }
//     } catch (error: any) {
//       console.error('Error exporting to Excel:', error);
//       toast({
//         title: "Error",
//         description: error.message || "Failed to export Excel",
//         variant: "destructive"
//       });
//     } finally {
//       setDownloadingAll(false);
//     }
//   };

//   // ✅ Generate CSV
//   const generateCSV = () => {
//     if (!isDatabaseUser) {
//       toast({
//         title: "Feature unavailable",
//         description: "CSV export is only available for Pro Plan users",
//         variant: "destructive"
//       });
//       return;
//     }

//     if (filteredCustomers.length === 0) {
//       toast({
//         title: "No data",
//         description: "No customers to export",
//         variant: "destructive"
//       });
//       return;
//     }

//     try {
//       const headers = [
//         'Customer Number',
//         'Name',
//         'Phone',
//         'Email',
//         'ID Type',
//         'ID Number',
//         'Joined Date',
//         'Address',
//         'City',
//         'State',
//         'Pincode',
//         'GST No',
//         'Purpose of Visit',
//         'Other Expenses',
//         'Expense Description'
//       ];

//       const csvRows = [];
//       csvRows.push(headers.join(','));

//       for (const customer of filteredCustomers) {
//         const row = [
//           `"${customer.customerNumber || ''}"`,
//           `"${customer.name.replace(/"/g, '""')}"`,
//           customer.phone,
//           `"${customer.email || ''}"`,
//           `"${formatIdType(customer.idType)}"`,
//           `"${customer.idNumber || ''}"`,
//           customer.createdAt,
//           `"${customer.address || ''}"`,
//           `"${customer.city || ''}"`,
//           `"${customer.state || ''}"`,
//           customer.pincode || '',
//           `"${customer.customer_gst_no || ''}"`,
//           `"${customer.purpose_of_visit || ''}"`,
//           customer.other_expenses || 0,
//           `"${customer.expense_description || ''}"`
//         ];
//         csvRows.push(row.join(','));
//       }

//       const csvString = csvRows.join('\n');
//       const blob = new Blob([csvString], { type: 'text/csv' });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `Customers_${new Date().toISOString().split('T')[0]}.csv`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);

//       toast({
//         title: "Success",
//         description: "CSV file downloaded successfully"
//       });
//     } catch (error: any) {
//       console.error('Error generating CSV:', error);
//       toast({
//         title: "Error",
//         description: `Failed to generate CSV: ${error.message}`,
//         variant: "destructive"
//       });
//     }
//   };

//   // ✅ View Customer Details
//   const viewCustomerDetails = (customer: Customer) => {
//     setSelectedCustomer(customer);
//     setDetailsDialogOpen(true);
//     setActiveTab('basic');
//   };

//   // ✅ Edit Customer
//   const handleEditCustomer = (customer: Customer) => {
//     if (!isDatabaseUser) {
//       toast({
//         title: "Feature unavailable",
//         description: "Edit is only available for Pro Plan users",
//         variant: "destructive"
//       });
//       return;
//     }
//     setSelectedCustomer(customer);
//     setEditDialogOpen(true);
//   };

//   // ✅ Handle Edit Success
//   const handleEditSuccess = () => {
//     setEditDialogOpen(false);
//     setDetailsDialogOpen(false);
//     fetchCustomers();
//   };

//   // ✅ Main fetch function
//   const fetchCustomers = async (isRefresh = false) => {
//     if (isRefresh) {
//       setRefreshing(true);
//     } else {
//       setLoading(true);
//     }

//     try {
//       let customersData: Customer[] = [];

//       if (isDatabaseUser) {
//         customersData = await fetchFromBackend();
//       } else {
//         customersData = await fetchFromGoogleSheets();
//       }

//       setCustomers(customersData);

//       if (isRefresh) {
//         toast({
//           title: "Success",
//           description: `Customers refreshed successfully (${customersData.length} customers)`
//         });
//       }

//     } catch (error: any) {
//       console.error('Error fetching customers:', error);
//       toast({
//         title: "Error",
//         description: `Failed to load customers: ${error.message}`,
//         variant: "destructive"
//       });
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = async () => {
//     await fetchCustomers(true);
//   };

//   useEffect(() => {
//     fetchCustomers();
//   }, [userSource, userPlan]);

//   const filteredCustomers = useMemo(() => {
//     const term = searchTerm.toLowerCase().trim();
//     if (!term) return customers;

//     return customers.filter(
//       (c) =>
//         c.customerNumber?.toLowerCase().includes(term) ||
//         c.name?.toLowerCase().includes(term) ||
//         c.phone?.includes(term) ||
//         c.email?.toLowerCase().includes(term) ||
//         c.idNumber?.toLowerCase().includes(term) ||
//         c.address?.toLowerCase().includes(term) ||
//         c.customer_gst_no?.toLowerCase().includes(term) ||
//         c.purpose_of_visit?.toLowerCase().includes(term)
//     );
//   }, [customers, searchTerm]);

//   // ✅ Updated columns with conditional actions based on user type
//   const baseColumns: GridColDef[] = [
//     {
//       field: 'customerNumber',
//       headerName: 'Customer #',
//       width: 130,
//       renderCell: (params) => {
//         const customerNumber = params.value as string;
//         return (
//           <div className="flex items-center gap-2">
//             <Hash className="h-3.5 w-3.5 text-muted-foreground" />
//             <Badge variant="outline" className="font-mono text-xs">
//               {customerNumber || '—'}
//             </Badge>
//           </div>
//         );
//       },
//     },
//     {
//       field: 'name',
//       headerName: 'Customer Name',
//       width: 220,
//       renderCell: (params) => {
//         const customer = params.row as Customer;
//         const initials = customer.name
//           .split(' ')
//           .map(n => n[0])
//           .join('')
//           .toUpperCase()
//           .slice(0, 2);

//         return (
//           <div className="flex items-center gap-3 py-2">
//             <Avatar className="h-8 w-8 bg-primary/10 text-primary">
//               <AvatarFallback>{initials || 'U'}</AvatarFallback>
//             </Avatar>
//             <div className="flex flex-col">
//               <span className="font-medium">{customer.name}</span>
//               {customer.email && (
//                 <span className="text-xs text-muted-foreground truncate max-w-[150px]">
//                   {customer.email}
//                 </span>
//               )}
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       field: 'phone',
//       headerName: 'Phone',
//       width: 140,
//       renderCell: (params) => {
//         const phone = params.value as string;
//         return (
//           <div className="flex items-center gap-2">
//             <Phone className="h-3.5 w-3.5 text-muted-foreground" />
//             <span>{phone}</span>
//           </div>
//         );
//       },
//     },
//     {
//       field: 'idNumber',
//       headerName: 'ID Proof',
//       width: 180,
//       renderCell: (params) => {
//         const customer = params.row as Customer;
//         return (
//           <div className="flex items-center gap-2">
//             <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
//             <div className="flex flex-col">
//               <Badge variant="secondary" className="text-xs mb-0.5 w-fit">
//                 {formatIdType(customer.idType)}
//               </Badge>
//               <span className="text-xs font-mono">
//                 {customer.idNumber || '—'}
//               </span>
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       field: 'createdAt',
//       headerName: 'Joined On',
//       width: 130,
//       renderCell: (params) => {
//         const date = params.value as string;
//         return (
//           <div className="flex items-center gap-2">
//             <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
//             <span className="text-sm">{date || '—'}</span>
//           </div>
//         );
//       },
//     },
//   ];

//   // Add actions column only for database users
//   const columns: GridColDef[] = isDatabaseUser
//     ? [
//       ...baseColumns,
//       {
//         field: 'actions',
//         headerName: 'Actions',
//         width: 160,
//         sortable: false,
//         filterable: false,
//         renderCell: (params) => {
//           const customer = params.row as Customer;
//           return (
//             <div className="flex items-center gap-1">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => viewCustomerDetails(customer)}
//                 title="View Details"
//                 className="h-8 w-8"
//               >
//                 <Eye className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => handleEditCustomer(customer)}
//                 title="Edit Customer"
//                 className="h-8 w-8"
//               >
//                 <Pencil className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => generateCustomerPDF(customer)}
//                 disabled={generatingPdf}
//                 title="Download PDF"
//                 className="h-8 w-8"
//               >
//                 <FileText className="h-4 w-4" />
//               </Button>
//             </div>
//           );
//         },
//       }
//     ]
//     : baseColumns; // No actions column for non-database users

//   return (
//     <Layout>
//       <div className="space-y-6 p-4 md:p-6">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
//             <p className="text-muted-foreground mt-1">
//               Manage and view all your customer information
//             </p>
//           </div>

//           <div className="flex flex-wrap items-center gap-2">
//             {/* Add Customer Button - Only for database users */}
//             {isDatabaseUser && (
//               <AddCustomerDialog onCustomerAdded={fetchCustomers} />
//             )}

//             {/* Bulk Export Dropdown - Only for database users */}
//             {isDatabaseUser && (
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant="outline"
//                     disabled={downloadingAll || customers.length === 0}
//                     className="flex items-center gap-2"
//                   >
//                     <FileDown className="h-4 w-4" />
//                     <span className="hidden sm:inline">Export</span>
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuItem
//                     onClick={generateAllCustomersPDF}
//                     disabled={downloadingAll}
//                   >
//                     <FileText className="h-4 w-4 mr-2" />
//                     PDF ({customers.length})
//                   </DropdownMenuItem>
//                   <DropdownMenuItem
//                     onClick={exportToExcel}
//                     disabled={downloadingAll}
//                   >
//                     <FileSpreadsheet className="h-4 w-4 mr-2" />
//                     Excel
//                   </DropdownMenuItem>
//                   <DropdownMenuItem
//                     onClick={generateCSV}
//                     disabled={downloadingAll}
//                   >
//                     <FileDown className="h-4 w-4 mr-2" />
//                     CSV
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             )}

//             {/* Refresh Button - Available for all users */}
//             <Button
//               variant="outline"
//               onClick={handleRefresh}
//               disabled={refreshing || downloadingAll}
//               className="flex items-center gap-2"
//             >
//               <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
//               <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
//             </Button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
//                   <p className="text-2xl font-bold">{customers.length}</p>
//                 </div>
//                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
//                   <User className="h-5 w-5 text-primary" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">With ID Proof</p>
//                   <p className="text-2xl font-bold">
//                     {customers.filter(c => c.idNumber).length}
//                   </p>
//                 </div>
//                 <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
//                   <CreditCard className="h-5 w-5 text-blue-600" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">With Email</p>
//                   <p className="text-2xl font-bold">
//                     {customers.filter(c => c.email).length}
//                   </p>
//                 </div>
//                 <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
//                   <Mail className="h-5 w-5 text-green-600" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">This Month</p>
//                   <p className="text-2xl font-bold">
//                     {customers.filter(c => {
//                       const date = new Date(c.createdAt);
//                       const now = new Date();
//                       return date.getMonth() === now.getMonth() &&
//                         date.getFullYear() === now.getFullYear();
//                     }).length}
//                   </p>
//                 </div>
//                 <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
//                   <Calendar className="h-5 w-5 text-purple-600" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div> */}

//         {/* Search and Table Card */}
//         <Card className="border shadow-sm">
//           <CardHeader className="pb-3">
//             <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
//               <div className="relative flex-1 max-w-md">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                 <Input
//                   placeholder="Search by customer #, name, phone, ID proof, email..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 w-full"
//                 />
//               </div>
//               <div className="text-sm text-muted-foreground">
//                 Showing <span className="font-medium">{filteredCustomers.length}</span> of{' '}
//                 <span className="font-medium">{customers.length}</span> customers
//               </div>
//             </div>
//           </CardHeader>

//           <CardContent className="p-0 relative min-h-[500px]">
//             {(loading || refreshing || downloadingAll) && (
//               <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-b-lg">
//                 <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
//                 <p className="text-muted-foreground font-medium">
//                   {loading ? 'Loading customers...' :
//                     refreshing ? 'Refreshing data...' :
//                       'Preparing download...'}
//                 </p>
//               </div>
//             )}

//             <AnimatePresence>
//               {!loading && !refreshing && !downloadingAll && (
//                 <motion.div
//                   key="data-grid"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.3 }}
//                   style={{ height: 550, width: '100%' }}
//                 >
//                   {filteredCustomers.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//                       <User className="h-12 w-12 mb-4 opacity-20" />
//                       <p className="text-lg font-medium">No customers found</p>
//                       <p className="text-sm">
//                         {searchTerm ? 'Try adjusting your search' : 'No customers available'}
//                       </p>
//                     </div>
//                   ) : (
//                     <DataGrid
//                       rows={filteredCustomers}
//                       columns={columns}
//                       getRowId={(row) => `${row.source}-${row.id}`}
//                       initialState={{
//                         pagination: {
//                           paginationModel: { page: 0, pageSize: 10 },
//                         },
//                       }}
//                       pageSizeOptions={[5, 10, 25, 50]}
//                       disableRowSelectionOnClick
//                       sx={{
//                         border: 'none',
//                         '& .MuiDataGrid-cell': {
//                           borderBottom: '1px solid #f0f0f0',
//                         },
//                         '& .MuiDataGrid-columnHeaders': {
//                           backgroundColor: '#f9fafb',
//                           borderBottom: '1px solid #e5e7eb',
//                         },
//                       }}
//                     />
//                   )}
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Customer Details Dialog - Only for database users */}
//       {isDatabaseUser && (
//         <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
//           <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="text-xl">Customer Details</DialogTitle>
//             </DialogHeader>

//             {selectedCustomer && (
//               <div className="space-y-6 py-4">
//                 {/* Profile Header */}
//                 <div className="flex items-center gap-4 pb-4 border-b">
//                   <Avatar className="h-16 w-16 bg-primary/10 text-primary">
//                     <AvatarFallback className="text-lg">
//                       {selectedCustomer.name
//                         .split(' ')
//                         .map(n => n[0])
//                         .join('')
//                         .toUpperCase()
//                         .slice(0, 2)}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <h2 className="text-2xl font-semibold">{selectedCustomer.name}</h2>
//                     <div className="flex items-center gap-2 mt-1 text-muted-foreground">
//                       <Phone className="h-3.5 w-3.5" />
//                       <span>{selectedCustomer.phone}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//                   <TabsList className="grid w-full grid-cols-2">
//                     <TabsTrigger value="basic">Basic Info</TabsTrigger>
//                     <TabsTrigger value="additional">Additional Details</TabsTrigger>
//                   </TabsList>

//                   <TabsContent value="basic" className="space-y-4 mt-4">
//                     <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
//                       <InfoRow label="Customer #" value={selectedCustomer.customerNumber || '—'} className="font-mono" />
//                       <InfoRow label="Name" value={selectedCustomer.name} />
//                       <InfoRow label="Phone" value={selectedCustomer.phone} />
//                       <InfoRow label="Email" value={selectedCustomer.email || '—'} />
//                       <InfoRow
//                         label="ID Type"
//                         value={formatIdType(selectedCustomer.idType)}
//                       />
//                       <InfoRow
//                         label="ID Number"
//                         value={selectedCustomer.idNumber || '—'}
//                         className="font-mono"
//                       />
//                       <InfoRow label="Joined Date" value={selectedCustomer.createdAt} />
//                     </div>
//                   </TabsContent>

//                   <TabsContent value="additional" className="space-y-4 mt-4">
//                     <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
//                       {selectedCustomer.address && (
//                         <InfoRow label="Address" value={selectedCustomer.address} />
//                       )}
//                       {(selectedCustomer.city || selectedCustomer.state) && (
//                         <InfoRow
//                           label="City/State"
//                           value={[selectedCustomer.city, selectedCustomer.state]
//                             .filter(Boolean)
//                             .join(', ') || '—'}
//                         />
//                       )}
//                       {selectedCustomer.pincode && (
//                         <InfoRow label="Pincode" value={selectedCustomer.pincode} />
//                       )}
//                       {selectedCustomer.customer_gst_no && (
//                         <InfoRow
//                           label="GST No"
//                           value={selectedCustomer.customer_gst_no}
//                           className="font-mono uppercase"
//                         />
//                       )}
//                       {selectedCustomer.purpose_of_visit && (
//                         <InfoRow label="Purpose" value={selectedCustomer.purpose_of_visit} />
//                       )}
//                       {selectedCustomer.other_expenses && selectedCustomer.other_expenses > 0 && (
//                         <InfoRow
//                           label="Other Expenses"
//                           value={`₹${selectedCustomer.other_expenses.toFixed(2)}`}
//                         />
//                       )}
//                       {selectedCustomer.expense_description && (
//                         <InfoRow
//                           label="Expense Description"
//                           value={selectedCustomer.expense_description}
//                         />
//                       )}
//                       {!selectedCustomer.address && !selectedCustomer.city && !selectedCustomer.customer_gst_no &&
//                         !selectedCustomer.purpose_of_visit && !selectedCustomer.other_expenses && (
//                           <p className="text-sm text-muted-foreground text-center py-4">
//                             No additional details available
//                           </p>
//                         )}
//                     </div>
//                   </TabsContent>
//                 </Tabs>

//                 {/* Action Buttons */}
//                 <div className="flex justify-end gap-3 pt-6 border-t">
//                   <Button
//                     variant="outline"
//                     onClick={() => handleEditCustomer(selectedCustomer)}
//                     className="flex items-center gap-2"
//                   >
//                     <Pencil className="h-4 w-4" />
//                     Edit
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={() => setDetailsDialogOpen(false)}
//                   >
//                     Close
//                   </Button>
//                   <Button
//                     onClick={() => generateCustomerPDF(selectedCustomer)}
//                     disabled={generatingPdf}
//                     className="flex items-center gap-2"
//                   >
//                     {generatingPdf ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <Download className="h-4 w-4" />
//                     )}
//                     {generatingPdf ? 'Generating...' : 'Download PDF'}
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Edit Customer Dialog - Only for database users */}
//       {isDatabaseUser && selectedCustomer && (
//         <EditCustomerDialog
//           open={editDialogOpen}
//           onOpenChange={setEditDialogOpen}
//           customer={selectedCustomer}
//           onSuccess={handleEditSuccess}
//           onUpdate={updateCustomer}
//         />
//       )}
//     </Layout>
//   );
// };

// // Helper component for info rows
// const InfoRow = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
//   <div className="flex justify-between items-start gap-4">
//     <span className="text-sm text-muted-foreground whitespace-nowrap">{label}:</span>
//     <span className={`text-sm font-medium text-right break-words ${className}`}>
//       {value || '—'}
//     </span>
//   </div>
// );

// export default Customers;

import AddCustomerDialog from '@/components/AddCustomerDialog';
import EditCustomerDialog from '@/components/EditCustomerDialog';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2, RefreshCw, Download, Eye, FileText, FileDown, FileSpreadsheet, User, Phone, Mail, Calendar, Hash, CreditCard, Pencil, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CUSTOMERS_UPDATED_EVENT } from '@/lib/bookingCheckoutUtils';

// URLs
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
  id_image?: string;
  id_image2?: string;
  payment_method?: string;
  payment_status?: string;
  payment_reference?: string;
  transaction_id?: string;
}

/** ✅ Handles dd/mm/yyyy, yyyy-mm-dd, and ISO date formats */
function parseDateString(value: string): string {
  if (!value) return '';

  const isoParsed = new Date(value);
  if (!isNaN(isoParsed.getTime())) {
    return isoParsed.toLocaleDateString('en-GB');
  }

  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/
  );
  if (match) {
    const [, dd, mm, yyyy] = match;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB');
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB');
  }

  return value;
}

// Helper to format ID type label
const formatIdType = (type: string): string => {
  const types: Record<string, string> = {
    aadhaar: 'Aadhaar',
    pan: 'PAN',
    passport: 'Passport',
    driving: 'Driving License'
  };
  return types[type] || type;
};

// Helper component for info rows
const InfoRow = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-sm text-muted-foreground whitespace-nowrap">{label}:</span>
    <span className={`text-sm font-medium text-right break-words ${className}`}>
      {value || '—'}
    </span>
  </div>
);

const Customers = () => {
  const { toast } = useToast();
  const [currentUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  });

  const spreadsheetId = currentUser?.spreadsheetId;
  const userSource = currentUser?.source;
  const userPlan = currentUser?.plan;

  // Check if user is database/pro user
  const isDatabaseUser = userSource === 'database' || userPlan === 'pro';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState('');
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  // ✅ JSONP helper for Google Sheets
  const loadScript = (src: string) =>
    new Promise<any>((resolve, reject) => {
      const callbackName = 'cb_' + Date.now();
      (window as any)[callbackName] = (data: any) => {
        resolve(data);
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
      const script = document.createElement('script');
      script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
      script.id = callbackName;
      script.onerror = () => {
        reject(new Error('Failed to load script'));
        delete (window as any)[callbackName];
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
      document.body.appendChild(script);
    });

  // ✅ Download ID image (Aadhaar/PAN card)
  const downloadIdImage = async (customerId: string, imageType: 'front' | 'back') => {
    if (!isDatabaseUser) {
      toast({
        title: "Feature unavailable",
        description: "ID image download is only available for Pro Plan users",
        variant: "destructive"
      });
      return;
    }

    try {
      setDownloadingImage(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${NODE_BACKEND_URL}/customers/${customerId}/images/download?type=${imageType}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download ID image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${imageType}_image.png`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `ID ${imageType} image downloaded successfully`
      });
    } catch (error: any) {
      console.error('Error downloading ID image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download ID image",
        variant: "destructive"
      });
    } finally {
      setDownloadingImage(false);
    }
  };

  // ✅ Fetch from Backend Database
  const fetchFromBackend = async (): Promise<Customer[]> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/customers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Group customers by hotel_id to create sequential numbers
      const customersByHotel: Record<string, any[]> = {};
      data.data.forEach((customer: any) => {
        const hotelId = customer.hotel_id;
        if (!customersByHotel[hotelId]) {
          customersByHotel[hotelId] = [];
        }
        customersByHotel[hotelId].push(customer);
      });

      // Sort each hotel's customers by created_at and assign sequential numbers
      const transformedCustomers: Customer[] = [];

      Object.keys(customersByHotel).forEach(hotelId => {
        const hotelCustomers = customersByHotel[hotelId];
        // Sort by created_at
        hotelCustomers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        hotelCustomers.forEach((customer, index) => {
          transformedCustomers.push({
            id: customer.id.toString(),
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            customerNumber: customer.customer_number || (index + 1).toString(),
            idNumber: customer.id_number || '',
            idType: customer.id_type || 'aadhaar',
            createdAt: parseDateString(customer.created_at),
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            customer_gst_no: customer.customer_gst_no || '',
            purpose_of_visit: customer.purpose_of_visit || '',
            other_expenses: customer.other_expenses || 0,
            expense_description: customer.expense_description || '',
            source: 'database',
            id_image: customer.id_image || null,
            id_image2: customer.id_image2 || null,
            payment_method: customer.payment_method,
            payment_status: customer.payment_status,
            payment_reference: customer.payment_reference,
            transaction_id: customer.transaction_id
          });
        });
      });

      // Sort all customers by created_at for display
      return transformedCustomers.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching from backend:', error);
      throw error;
    }
  };

  // ✅ Fetch from Google Sheets
  const fetchFromGoogleSheets = async (): Promise<Customer[]> => {
    if (!spreadsheetId) return [];

    try {
      const custRes = await loadScript(
        `${APPS_SCRIPT_URL}?action=getCustomers&spreadsheetid=${encodeURIComponent(spreadsheetId)}`
      );

      if (Array.isArray(custRes.customers)) {
        const normalized = custRes.customers.map((c: any, i: number) => {
          const createdAt = c.createdAt || c.CreatedAt || c.created_at || c['Created At'] || '';

          return {
            id: c.customerId || c.id || `CUST-${i + 1}`,
            name: c.name || '',
            phone: c.phone ? String(c.phone) : '',
            email: c.email || '',
            customerNumber: c.customerNumber || '',
            idNumber: c.idNumber || '',
            idType: c.idType || 'aadhaar',
            createdAt: parseDateString(createdAt),
            source: 'google_sheets'
          } as Customer;
        });

        return normalized;
      }
      return [];
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      throw error;
    }
  };

  // ✅ Update Customer
  const updateCustomer = async (customerId: string, updatedData: Partial<Customer>) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Customer updated successfully"
      });

      // Refresh the customer list
      await fetchCustomers();

      return true;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!isDatabaseUser) {
      toast({
        title: "Feature unavailable",
        description: "Delete is only available for Pro Plan users",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      `Delete customer "${customer.name}" (${customer.phone})?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingCustomer(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/customers/${customer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let message = 'Failed to delete customer';
        try {
          const errorData = await response.json();
          message = errorData?.message || message;
        } catch {
          // ignore response parse errors
        }
        throw new Error(message);
      }

      toast({
        title: "Customer deleted",
        description: `${customer.name} has been removed successfully.`,
      });

      setDetailsDialogOpen(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete customer",
        variant: "destructive"
      });
    } finally {
      setDeletingCustomer(false);
    }
  };

  // ✅ Generate PDF for Single Customer
  const generateCustomerPDF = async (customer: Customer) => {
    try {
      setGeneratingPdf(true);

      if (isDatabaseUser) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${NODE_BACKEND_URL}/customers/${customer.id}/pdf`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Customer_${customer.name}_${customer.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "PDF downloaded successfully"
        });
      } else {
        // For Google Sheets users, show upgrade message
        toast({
          title: "Feature unavailable",
          description: "PDF download is only available for Pro Plan users",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setGeneratingPdf(false);
      setDetailsDialogOpen(false);
    }
  };

  // ✅ Generate PDF for All Customers
  const generateAllCustomersPDF = async () => {
    if (!isDatabaseUser) {
      toast({
        title: "Feature unavailable",
        description: "Bulk PDF export is only available for Pro Plan users",
        variant: "destructive"
      });
      return;
    }

    try {
      setDownloadingAll(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/customers/export/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `All_Customers_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "All customers PDF downloaded successfully"
      });
    } catch (error: any) {
      console.error('Error generating PDF for all customers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  // ✅ Export to Excel
  const exportToExcel = async () => {
    if (!isDatabaseUser) {
      toast({
        title: "Feature unavailable",
        description: "Excel export is only available for Pro Plan users",
        variant: "destructive"
      });
      return;
    }

    try {
      setDownloadingAll(true);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/customers/export/excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Customers_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Excel file downloaded successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to export Excel",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to export Excel",
        variant: "destructive"
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  // ✅ Generate CSV
  const generateCSV = () => {
    if (!isDatabaseUser) {
      toast({
        title: "Feature unavailable",
        description: "CSV export is only available for Pro Plan users",
        variant: "destructive"
      });
      return;
    }

    if (filteredCustomers.length === 0) {
      toast({
        title: "No data",
        description: "No customers to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const headers = [
        'Customer Number',
        'Name',
        'Phone',
        'Email',
        'ID Type',
        'ID Number',
        'Joined Date',
        'Address',
        'City',
        'State',
        'Pincode',
        'GST No',
        'Purpose of Visit',
        'Other Expenses',
        'Expense Description'
      ];

      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const customer of filteredCustomers) {
        const row = [
          `"${customer.customerNumber || ''}"`,
          `"${customer.name.replace(/"/g, '""')}"`,
          customer.phone,
          `"${customer.email || ''}"`,
          `"${formatIdType(customer.idType)}"`,
          `"${customer.idNumber || ''}"`,
          customer.createdAt,
          `"${customer.address || ''}"`,
          `"${customer.city || ''}"`,
          `"${customer.state || ''}"`,
          customer.pincode || '',
          `"${customer.customer_gst_no || ''}"`,
          `"${customer.purpose_of_visit || ''}"`,
          customer.other_expenses || 0,
          `"${customer.expense_description || ''}"`
        ];
        csvRows.push(row.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Customers_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "CSV file downloaded successfully"
      });
    } catch (error: any) {
      console.error('Error generating CSV:', error);
      toast({
        title: "Error",
        description: `Failed to generate CSV: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // ✅ View Customer Details
  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsDialogOpen(true);
    setActiveTab('basic');
  };

  // ✅ Edit Customer
  const handleEditCustomer = (customer: Customer) => {
    if (!isDatabaseUser) {
      toast({
        title: "Feature unavailable",
        description: "Edit is only available for Pro Plan users",
        variant: "destructive"
      });
      return;
    }
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  // ✅ Handle Edit Success
  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setDetailsDialogOpen(false);
    fetchCustomers();
  };

  // ✅ Main fetch function
  const fetchCustomers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let customersData: Customer[] = [];

      if (isDatabaseUser) {
        customersData = await fetchFromBackend();
      } else {
        customersData = await fetchFromGoogleSheets();
      }

      setCustomers(customersData);

      if (isRefresh) {
        toast({
          title: "Success",
          description: `Customers refreshed successfully (${customersData.length} customers)`
        });
      }

    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: `Failed to load customers: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchCustomers(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, [userSource, userPlan]);

  useEffect(() => {
    const refreshGuests = () => {
      void fetchCustomers(true);
    };
    window.addEventListener(CUSTOMERS_UPDATED_EVENT, refreshGuests);
    return () => window.removeEventListener(CUSTOMERS_UPDATED_EVENT, refreshGuests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSource, userPlan]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers;

    return customers.filter(
      (c) =>
        c.customerNumber?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.idNumber?.toLowerCase().includes(term) ||
        c.address?.toLowerCase().includes(term) ||
        c.customer_gst_no?.toLowerCase().includes(term) ||
        c.purpose_of_visit?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // ✅ Updated columns with conditional actions based on user type
  const baseColumns: GridColDef[] = [
    {
      field: 'customerNumber',
      headerName: 'Customer #',
      width: 130,
      renderCell: (params) => {
        const customerNumber = params.value as string;
        return (
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="outline" className="font-mono text-xs">
              {customerNumber || '—'}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'name',
      headerName: 'Customer Name',
      width: 220,
      renderCell: (params) => {
        const customer = params.row as Customer;
        const initials = customer.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-3 py-2">
            <Avatar className="h-8 w-8 bg-primary/10 text-primary">
              <AvatarFallback>{initials || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{customer.name}</span>
              {customer.email && (
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {customer.email}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      renderCell: (params) => {
        const phone = params.value as string;
        return (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{phone}</span>
          </div>
        );
      },
    },
    {
      field: 'idNumber',
      headerName: 'ID Proof',
      width: 180,
      renderCell: (params) => {
        const customer = params.row as Customer;
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <Badge variant="secondary" className="text-xs mb-0.5 w-fit">
                {formatIdType(customer.idType)}
              </Badge>
              <span className="text-xs font-mono">
                {customer.idNumber || '—'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Joined On',
      width: 130,
      renderCell: (params) => {
        const date = params.value as string;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{date || '—'}</span>
          </div>
        );
      },
    },
  ];

  // Add actions column only for database users
  const columns: GridColDef[] = isDatabaseUser
    ? [
      ...baseColumns,
      {
        field: 'actions',
        headerName: 'Actions',
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const customer = params.row as Customer;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => viewCustomerDetails(customer)}
                title="View Details"
                className="h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditCustomer(customer)}
                title="Edit Customer"
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => generateCustomerPDF(customer)}
                disabled={generatingPdf}
                title="Download PDF"
                className="h-8 w-8"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      }
    ]
    : baseColumns; // No actions column for non-database users

  return (
    <Layout>
      <div className="page-shell p-2 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your customer information
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Add Customer Button - Only for database users */}
            {isDatabaseUser && (
              <AddCustomerDialog onCustomerAdded={fetchCustomers} />
            )}

            {/* Bulk Export Dropdown - Only for database users */}
            {isDatabaseUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={downloadingAll || customers.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={generateAllCustomersPDF}
                    disabled={downloadingAll}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF ({customers.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportToExcel}
                    disabled={downloadingAll}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={generateCSV}
                    disabled={downloadingAll}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Refresh Button - Available for all users */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || downloadingAll}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
          </div>
        </div>

        {/* Search and Table Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by customer #, name, phone, ID proof, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filteredCustomers.length}</span> of{' '}
                <span className="font-medium">{customers.length}</span> customers
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative min-h-[min(500px,70dvh)] overflow-x-auto p-0">
            {(loading || refreshing || downloadingAll || downloadingImage || deletingCustomer) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-b-lg">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground font-medium">
                  {loading ? 'Loading customers...' :
                    refreshing ? 'Refreshing data...' :
                      deletingCustomer ? 'Deleting customer...' :
                      downloadingImage ? 'Downloading image...' :
                        'Preparing download...'}
                </p>
              </div>
            )}

            <AnimatePresence>
              {!loading && !refreshing && !downloadingAll && !downloadingImage && !deletingCustomer && (
                <motion.div
                  key="data-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 550, width: '100%' }}
                >
                  {filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <User className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No customers found</p>
                      <p className="text-sm">
                        {searchTerm ? 'Try adjusting your search' : 'No customers available'}
                      </p>
                    </div>
                  ) : (
                    <DataGrid
                      rows={filteredCustomers}
                      columns={columns}
                      getRowId={(row) => `${row.source}-${row.id}`}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: 10 },
                        },
                      }}
                      pageSizeOptions={[5, 10, 25, 50]}
                      disableRowSelectionOnClick
                      sx={{
                        border: 'none',
                        '& .MuiDataGrid-cell': {
                          borderBottom: '1px solid #f0f0f0',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb',
                        },
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewImageTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewImage && (
              <img 
                src={previewImage} 
                alt={previewImageTitle}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog - Only for database users */}
      {isDatabaseUser && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Customer Details</DialogTitle>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-6 py-4">
                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16 bg-primary/10 text-primary">
                    <AvatarFallback className="text-lg">
                      {selectedCustomer.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1 sm:grid sm:grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="additional">Additional Details</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                      <InfoRow label="Customer #" value={selectedCustomer.customerNumber || '—'} className="font-mono" />
                      <InfoRow label="Name" value={selectedCustomer.name} />
                      <InfoRow label="Phone" value={selectedCustomer.phone} />
                      <InfoRow label="Email" value={selectedCustomer.email || '—'} />
                      <InfoRow
                        label="ID Type"
                        value={formatIdType(selectedCustomer.idType)}
                      />
                      <InfoRow
                        label="ID Number"
                        value={selectedCustomer.idNumber || '—'}
                        className="font-mono"
                      />
                      <InfoRow label="Joined Date" value={selectedCustomer.createdAt} />
                      <InfoRow label="Payment Method" value={selectedCustomer.payment_method || '—'} />
                      <InfoRow label="Payment Status" value={selectedCustomer.payment_status || '—'} />
                      {selectedCustomer.transaction_id && (
                        <InfoRow label="Transaction ID" value={selectedCustomer.transaction_id} className="font-mono text-xs" />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="additional" className="space-y-4 mt-4">
                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                      {selectedCustomer.address && (
                        <InfoRow label="Address" value={selectedCustomer.address} />
                      )}
                      {(selectedCustomer.city || selectedCustomer.state) && (
                        <InfoRow
                          label="City/State"
                          value={[selectedCustomer.city, selectedCustomer.state]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        />
                      )}
                      {selectedCustomer.pincode && (
                        <InfoRow label="Pincode" value={selectedCustomer.pincode} />
                      )}
                      {selectedCustomer.customer_gst_no && (
                        <InfoRow
                          label="GST No"
                          value={selectedCustomer.customer_gst_no}
                          className="font-mono uppercase"
                        />
                      )}
                      {selectedCustomer.purpose_of_visit && (
                        <InfoRow label="Purpose" value={selectedCustomer.purpose_of_visit} />
                      )}
                      {selectedCustomer.other_expenses && selectedCustomer.other_expenses > 0 && (
                        <InfoRow
                          label="Other Expenses"
                          value={`₹${selectedCustomer.other_expenses.toFixed(2)}`}
                        />
                      )}
                      {selectedCustomer.expense_description && (
                        <InfoRow
                          label="Expense Description"
                          value={selectedCustomer.expense_description}
                        />
                      )}
                      {!selectedCustomer.address && !selectedCustomer.city && !selectedCustomer.customer_gst_no &&
                        !selectedCustomer.purpose_of_visit && !selectedCustomer.other_expenses && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No additional details available
                          </p>
                        )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4 mt-4">
                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        ID Proof Documents ({formatIdType(selectedCustomer.idType)})
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front Side Image */}
                        <div className="border rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Front Side</span>
                            <div className="flex gap-1">
                              {selectedCustomer.id_image && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPreviewImage(selectedCustomer.id_image!);
                                      setPreviewImageTitle(`${selectedCustomer.name} - ID Front`);
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadIdImage(selectedCustomer.id, 'front')}
                                    className="h-8 w-8 p-0"
                                    title="Download"
                                    disabled={downloadingImage}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedCustomer.id_image ? (
                            <div 
                              className="relative aspect-[16/11] bg-gray-100 rounded overflow-hidden cursor-pointer"
                              onClick={() => {
                                setPreviewImage(selectedCustomer.id_image!);
                                setPreviewImageTitle(`${selectedCustomer.name} - ID Front`);
                              }}
                            >
                              <img 
                                src={selectedCustomer.id_image} 
                                alt="ID Front"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[16/11] bg-gray-100 rounded flex items-center justify-center text-muted-foreground">
                              <span className="text-sm">No image uploaded</span>
                            </div>
                          )}
                        </div>

                        {/* Back Side Image */}
                        {/* <div className="border rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Back Side</span>
                            <div className="flex gap-1">
                              {selectedCustomer.id_image2 && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPreviewImage(selectedCustomer.id_image2!);
                                      setPreviewImageTitle(`${selectedCustomer.name} - ID Back`);
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadIdImage(selectedCustomer.id, 'back')}
                                    className="h-8 w-8 p-0"
                                    title="Download"
                                    disabled={downloadingImage}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedCustomer.id_image2 ? (
                            <div 
                              className="relative aspect-[16/11] bg-gray-100 rounded overflow-hidden cursor-pointer"
                              onClick={() => {
                                setPreviewImage(selectedCustomer.id_image2!);
                                setPreviewImageTitle(`${selectedCustomer.name} - ID Back`);
                              }}
                            >
                              <img 
                                src={selectedCustomer.id_image2} 
                                alt="ID Back"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[16/11] bg-gray-100 rounded flex items-center justify-center text-muted-foreground">
                              <span className="text-sm">No image uploaded</span>
                            </div>
                          )}
                        </div> */}
                      </div>

                      {/* ID Number Display */}
                      {selectedCustomer.idNumber && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">{formatIdType(selectedCustomer.idType)} Number:</span>
                          <p className="font-mono font-medium mt-1">{selectedCustomer.idNumber}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => deleteCustomer(selectedCustomer)}
                    disabled={deletingCustomer}
                    className="flex items-center gap-2"
                  >
                    {deletingCustomer ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deletingCustomer ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEditCustomer(selectedCustomer)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => generateCustomerPDF(selectedCustomer)}
                    disabled={generatingPdf}
                    className="flex items-center gap-2"
                  >
                    {generatingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {generatingPdf ? 'Generating...' : 'Download PDF'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Customer Dialog - Only for database users */}
      {isDatabaseUser && selectedCustomer && (
        <EditCustomerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          customer={selectedCustomer}
          onSuccess={handleEditSuccess}
          onUpdate={updateCustomer}
        />
      )}
    </Layout>
  );
};

export default Customers;