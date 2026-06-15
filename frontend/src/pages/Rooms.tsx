
// import { useState, useEffect, useMemo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import Layout from '@/components/Layout';
// import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
// import { Card, CardHeader, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Plus, Loader2, RefreshCw } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// import AddRoomModal from '@/components/AddRoomModal';
// import RoomDetailsModal from '@/components/RoomDetailsModal';

// // URLs
// const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
// const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

// export default function Rooms() {
//   const { toast } = useToast();
//   const [rooms, setRooms] = useState<any[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
//   const [showAddRoom, setShowAddRoom] = useState(false);
//   const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//   const spreadsheetId = currentUser?.spreadsheetId;
//   const userSource = currentUser?.source; // 'database' or 'google_sheets'
//   const userPlan = currentUser?.plan; // 'pro' or 'free'

//   // ✅ JSONP helper for Google Sheets
//   const loadScript = (src: string) =>
//     new Promise<any>((resolve, reject) => {
//       const callbackName = 'cb_' + Date.now();
//       (window as any)[callbackName] = (data: any) => {
//         resolve(data);
//         delete (window as any)[callbackName];
//         if (script && script.parentNode) script.parentNode.removeChild(script);
//       };
//       const script = document.createElement('script');
//       script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
//       script.onerror = () => {
//         reject(new Error('Failed to load script'));
//         delete (window as any)[callbackName];
//         if (script && script.parentNode) script.parentNode.removeChild(script);
//       };
//       document.body.appendChild(script);
//     });

//   // ✅ Fetch from Backend Database (Pro Plan)
//   const fetchFromBackend = async (): Promise<any[]> => {
//     try {
//       const token = localStorage.getItem('authToken');
//       const response = await fetch(`${NODE_BACKEND_URL}/rooms`, {
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
      
//       // Transform backend data to match our interface
//       const transformedRooms = data.data.map((room: any) => ({
//         roomId: room.id.toString(),
//         number: room.room_number,
//         type: room.type,
//         floor: room.floor || 1,
//         price: room.price || 0,
//         amenities: room.amenities || '',
//         status: room.status || 'available',
//         source: 'database'
//       }));

//       return transformedRooms;
//     } catch (error) {
//       console.error('Error fetching from backend:', error);
//       throw error;
//     }
//   };

//   // ✅ Fetch from Google Sheets (Free Plan)
//   const fetchFromGoogleSheets = async (): Promise<any[]> => {
//     if (!spreadsheetId) return [];
    
//     try {
//       const data = await loadScript(
//         `${APPS_SCRIPT_URL}?action=getRooms&spreadsheetid=${encodeURIComponent(spreadsheetId)}`
//       );
      
//       if (data.rooms) {
//         // Add source information to rooms
//         return data.rooms.map((room: any) => ({
//           ...room,
//           source: 'google_sheets'
//         }));
//       }
//       return [];
//     } catch (error) {
//       console.error('Error fetching from Google Sheets:', error);
//       throw error;
//     }
//   };

//   // ✅ Main fetch function
//   const fetchRooms = async (isRefresh = false) => {
//     if (isRefresh) {
//       setRefreshing(true);
//     } else {
//       setLoading(true);
//     }

//     try {
//       console.log("🔄 Fetching rooms for user:", {
//         source: userSource,
//         plan: userPlan
//       });

//       let roomsData: any[] = [];

//       if (userSource === 'database' || userPlan === 'pro') {
//         // Fetch from backend database (Pro Plan)
//         console.log("📊 Fetching from backend database...");
//         roomsData = await fetchFromBackend();
//       } else {
//         // Fetch from Google Sheets (Free Plan)
//         console.log("📊 Fetching from Google Sheets...");
//         roomsData = await fetchFromGoogleSheets();
//       }

//       setRooms(roomsData);
      
//       if (isRefresh) {
//         toast({
//           title: "Success",
//           description: `Rooms refreshed successfully (${roomsData.length} rooms)`
//         });
//       }

//     } catch (error: any) {
//       console.error('Error fetching rooms:', error);
//       toast({
//         title: "Error",
//         description: `Failed to load rooms: ${error.message}`,
//         variant: "destructive"
//       });
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Manual refresh function
//   const handleRefresh = async () => {
//     await fetchRooms(true);
//   };

//   useEffect(() => {
//     fetchRooms();
//   }, [userSource, userPlan]);

//   const filteredRooms = useMemo(
//     () =>
//       rooms.filter(
//         (r) =>
//           String(r.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
//           String(r.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
//           String(r.floor).toLowerCase().includes(searchTerm.toLowerCase()) ||
//           String(r.status).toLowerCase().includes(searchTerm.toLowerCase())
//       ),
//     [rooms, searchTerm]
//   );

//   const getStatusBadgeClass = (status: string) => {
//     switch (status) {
//       case 'available':
//         return 'bg-green-100 text-green-800';
//       case 'booked':
//         return 'bg-blue-100 text-blue-800';
//       case 'blocked':
//         return 'bg-red-100 text-red-800';
//       case 'maintenance':
//         return 'bg-yellow-100 text-yellow-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const columns: GridColDef[] = [
//     { 
//       field: 'roomId', 
//       headerName: 'Room ID', 
//       flex: 1, 
//       minWidth: 100,
//       renderCell: (params: GridRenderCellParams) => (
//         <div className="flex items-center gap-2">
//           <span>{params.value}</span>
//           {/* {params.row.source === 'database' && (
//             <span className="text-xs bg-green-100 text-green-800 px-1 rounded">DB</span>
//           )}
//           {params.row.source === 'google_sheets' && (
//             <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">GS</span>
//           )} */}
//         </div>
//       ),
//     },
//     { field: 'number', headerName: 'Number', flex: 1, minWidth: 100 },
//     { field: 'type', headerName: 'Type', flex: 1, minWidth: 120 },
//     { field: 'floor', headerName: 'Floor', flex: 1, minWidth: 80 },
//     {
//       field: 'price',
//       headerName: 'Price',
//       flex: 1,
//       minWidth: 110,
//       renderCell: (params) => `₹${Number(params.value || 0).toFixed(2)}`,
//     },
//     {
//       field: 'status',
//       headerName: 'Status',
//       flex: 1,
//       minWidth: 120,
//       renderCell: (params: GridRenderCellParams) => (
//         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(params.value)}`}>
//           {params.value}
//         </span>
//       ),
//     },
//     // {
//     //   field: 'amenities',
//     //   headerName: 'Amenities',
//     //   flex: 1,
//     //   minWidth: 150,
//     //   renderCell: (params: GridRenderCellParams) => (
//     //     <span className="text-sm text-muted-foreground truncate" title={params.value}>
//     //       {params.value || 'None'}
//     //     </span>
//     //   ),
//     // },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       flex: 1,
//       minWidth: 150,
//       renderCell: (params: GridRenderCellParams) => (
//         <Button size="sm" onClick={() => setSelectedRoomId(params.row.roomId)}>
//           Details
//         </Button>
//       ),
//     },
//   ];

//   // Show user plan info
//   const userPlanInfo = userPlan === 'pro' 
//     ? { label: 'Pro Plan', color: 'text-green-600', bgColor: 'bg-green-100' }
//     : { label: 'Free Plan', color: 'text-blue-600', bgColor: 'bg-blue-100' };

//   return (
//     <Layout>
//       <div className="space-y-4">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//           <div>
//             <div className="flex items-center gap-3">
//               <h1 className="text-2xl md:text-3xl font-bold">Rooms Management</h1>
//               {/* {currentUser && (
//                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${userPlanInfo.bgColor} ${userPlanInfo.color}`}>
//                   {userPlanInfo.label}
//                 </span>
//               )} */}
//             </div>
            
//           </div>
          
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               onClick={handleRefresh}
//               disabled={refreshing}
//               className="flex items-center gap-2"
//             >
//               <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
//               {refreshing ? 'Refreshing...' : 'Refresh'}
//             </Button>
            
//             {(userSource === 'google_sheets' || userPlan === 'free') ? (
//               <Button onClick={() => setShowAddRoom(true)} disabled={!spreadsheetId}>
//                 <Plus className="mr-2 h-4 w-4" /> Add Room
//               </Button>
//             ) : (
//               <Button onClick={() => setShowAddRoom(true)}>
//                 <Plus className="mr-2 h-4 w-4" /> Add Room
//               </Button>
//             )}
//           </div>
//         </div>

//         {/* Search and Stats */}
//         <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
//           <div className="w-full md:w-auto">
//             <Input 
//               placeholder="Search rooms by number, type, floor, or status..." 
//               value={searchTerm} 
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full md:w-80"
//             />
//           </div>
          
//           <div className="text-sm text-muted-foreground">
//             Showing {filteredRooms.length} of {rooms.length} rooms
//             {searchTerm && ` matching "${searchTerm}"`}
//           </div>
//         </div>

//         {/* Rooms Table */}
//         <Card>
//           <CardHeader>
//             <h3 className="text-lg font-semibold">All Rooms</h3>
//           </CardHeader>
//           <CardContent className="relative min-h-[600px] flex items-center justify-center">
//             {/* 🌀 Loading Overlay */}
//             {(loading || refreshing) && (
//               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10">
//                 <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
//                 <p className="text-muted-foreground font-medium text-base">
//                   {loading ? 'Loading rooms...' : 'Refreshing rooms...'}
//                 </p>
//                 {/* <p className="text-sm text-muted-foreground mt-1">
//                   from {userSource === 'database' ? 'Database' : 'Google Sheets'}
//                 </p> */}
//               </div>
//             )}

//             {/* ✨ Animated DataGrid */}
//             <AnimatePresence>
//               {!loading && !refreshing && (
//                 <motion.div
//                   key="data-grid"
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.4, ease: 'easeOut' }}
//                   style={{ height: 600, width: '100%' }}
//                 >
//                   {filteredRooms.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//                       <p className="text-lg mb-2">No rooms found</p>
//                       <p className="text-sm">
//                         {searchTerm ? 'Try adjusting your search terms' : 'No rooms available in the system'}
//                       </p>
//                     </div>
//                   ) : (
//                     <DataGrid
//                       rows={filteredRooms}
//                       columns={columns}
//                       getRowId={(row) => `${row.source}-${row.roomId}`}
//                       pagination
//                       paginationModel={paginationModel}
//                       onPaginationModelChange={setPaginationModel}
//                       pageSizeOptions={[10, 20, 50]}
//                       disableRowSelectionOnClick
//                     />
//                   )}
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </CardContent>
//         </Card>

//         {/* Add Room Modal */}
//         {showAddRoom && (
//           <AddRoomModal
//             open={showAddRoom}
//             onClose={() => setShowAddRoom(false)}
//             spreadsheetId={spreadsheetId}
//             userSource={userSource}
//             onRoomAdded={fetchRooms}
//           />
//         )}

//         {/* Room Details Modal */}
//         {selectedRoomId && (
//           <RoomDetailsModal
//             open={!!selectedRoomId}
//             roomId={selectedRoomId}
//             spreadsheetId={spreadsheetId}
//             userSource={userSource}
//             onClose={() => {
//               setSelectedRoomId(null);
//               fetchRooms();
//             }}
//           />
//         )}
//       </div>
//     </Layout>
//   );
// }

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, RefreshCw, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AddRoomModal from '@/components/AddRoomModal';
import RoomDetailsModal from '@/components/RoomDetailsModal';
import EditRoomModal from '@/components/EditRoomModal'; // You'll need to create this

// URLs
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzexlVpr_2umhzBdpoW4juzQo4rj2zB1pU3vlz6wqY78YQX3d2BFntfiV7dgLf6PvC/exec';
const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Rooms() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [rooms, setRooms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<any | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const spreadsheetId = currentUser?.spreadsheetId;
  const userSource = currentUser?.source; // 'database' or 'google_sheets'
  const userPlan = currentUser?.plan; // 'pro' or 'free'

  // ✅ JSONP helper for Google Sheets
  const loadScript = (src: string) =>
    new Promise<any>((resolve, reject) => {
      const callbackName = 'cb_' + Date.now();
      (window as any)[callbackName] = (data: any) => {
        resolve(data);
        delete (window as any)[callbackName];
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
      const script = document.createElement('script');
      script.src = src + (src.includes('?') ? '&' : '?') + 'callback=' + callbackName;
      script.onerror = () => {
        reject(new Error('Failed to load script'));
        delete (window as any)[callbackName];
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
      document.body.appendChild(script);
    });

  // ✅ Fetch from Backend Database (Pro Plan)
  const fetchFromBackend = async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${NODE_BACKEND_URL}/rooms`, {
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
      
      // Transform backend data to match our interface
      const transformedRooms = data.data.map((room: any) => ({
        id: room.id.toString(),
        roomId: room.id.toString(),
        number: room.room_number,
        type: room.type,
        floor: room.floor || 1,
        price: room.price || 0,
        amenities: room.amenities || '',
        status: room.status || 'available',
        gst_percentage: room.gst_percentage || 12,
        service_charge_percentage: room.service_charge_percentage || 0,
        source: 'database'
      }));

      return transformedRooms;
    } catch (error) {
      console.error('Error fetching from backend:', error);
      throw error;
    }
  };

  // ✅ Fetch from Google Sheets (Free Plan)
  const fetchFromGoogleSheets = async (): Promise<any[]> => {
    if (!spreadsheetId) return [];
    
    try {
      const data = await loadScript(
        `${APPS_SCRIPT_URL}?action=getRooms&spreadsheetid=${encodeURIComponent(spreadsheetId)}`
      );
      
      if (data.rooms) {
        // Add source information to rooms
        return data.rooms.map((room: any) => ({
          ...room,
          id: room.roomId || room.room_number,
          source: 'google_sheets'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      throw error;
    }
  };

  // ✅ Main fetch function
  const fetchRooms = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log("🔄 Fetching rooms for user:", {
        source: userSource,
        plan: userPlan
      });

      let roomsData: any[] = [];

      if (userSource === 'database' || userPlan === 'pro') {
        // Fetch from backend database (Pro Plan)
        console.log("📊 Fetching from backend database...");
        roomsData = await fetchFromBackend();
      } else {
        // Fetch from Google Sheets (Free Plan)
        console.log("📊 Fetching from Google Sheets...");
        roomsData = await fetchFromGoogleSheets();
      }

      setRooms(roomsData);
      
      if (isRefresh) {
        toast({
          title: "Success",
          description: `Rooms refreshed successfully (${roomsData.length} rooms)`
        });
      }

    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: `Failed to load rooms: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    await fetchRooms(true);
  };

  // Handle edit room
  const handleEditRoom = (room: any) => {
    setSelectedRoomForEdit(room);
    setShowEditRoom(true);
  };

  // Handle room updated
  const handleRoomUpdated = () => {
    fetchRooms();
  };

  useEffect(() => {
    fetchRooms();
  }, [userSource, userPlan]);

  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (r) =>
          String(r.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(r.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(r.floor).toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(r.amenities || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [rooms, searchTerm]
  );

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [searchTerm]);

  useEffect(() => {
    setPaginationModel((prev) => ({
      page: 0,
      pageSize: isMobile ? 5 : 10,
    }));
  }, [isMobile]);

  const dataGridSx = useMemo(
    () => ({
      border: 'none',
      width: '100%',
      minWidth: isMobile ? 680 : undefined,
      '& .MuiDataGrid-cell': {
        borderBottom: '1px solid hsl(var(--border))',
        whiteSpace: 'nowrap',
      },
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: 'hsl(var(--muted))',
        borderBottom: '1px solid hsl(var(--border))',
        minHeight: isMobile ? '40px !important' : '48px !important',
        maxHeight: isMobile ? '40px !important' : '48px !important',
      },
      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 600,
        fontSize: isMobile ? '0.75rem' : '0.8125rem',
      },
      '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
        paddingLeft: isMobile ? '8px' : '16px',
        paddingRight: isMobile ? '8px' : '16px',
        fontSize: isMobile ? '0.75rem' : '0.875rem',
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: '1px solid hsl(var(--border))',
      },
    }),
    [isMobile]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'number', headerName: 'No.', width: isMobile ? 56 : 90 },
      { field: 'type', headerName: 'Type', width: isMobile ? 100 : 130 },
      { field: 'floor', headerName: 'Floor', width: isMobile ? 56 : 80 },
      {
        field: 'price',
        headerName: 'Price',
        width: isMobile ? 88 : 110,
        renderCell: (params) => `₹${Number(params.value || 0).toFixed(2)}`,
      },
      {
        field: 'roomId',
        headerName: 'Room ID',
        width: isMobile ? 72 : 100,
      },
      {
        field: 'amenities',
        headerName: 'Amenities',
        width: isMobile ? 120 : 180,
        renderCell: (params: GridRenderCellParams) => (
          <span className="block max-w-full truncate text-muted-foreground" title={params.value}>
            {params.value || 'None'}
          </span>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: isMobile ? 64 : 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditRoom(params.row)}
            className="h-7 gap-1 px-2"
            title="Edit room"
          >
            <Edit className="h-3 w-3" />
            {!isMobile && <span>Edit</span>}
          </Button>
        ),
      },
    ],
    [isMobile]
  );

  // Show user plan info
  const userPlanInfo = userPlan === 'pro' 
    ? { label: 'Pro Plan', color: 'text-green-600', bgColor: 'bg-green-100' }
    : { label: 'Free Plan', color: 'text-blue-600', bgColor: 'bg-blue-100' };

  return (
    <Layout>
      <div className="page-shell">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">Rooms Management</h1>
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 flex-1 items-center gap-2 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            {(userSource === 'google_sheets' || userPlan === 'free') ? (
              <Button onClick={() => setShowAddRoom(true)} disabled={!spreadsheetId} className="h-9 flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Add Room
              </Button>
            ) : (
              <Button onClick={() => setShowAddRoom(true)} className="h-9 flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Add Room
              </Button>
            )}
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="w-full md:w-auto">
            <Input 
              placeholder="Search rooms by number, type, floor, or amenities..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredRooms.length} of {rooms.length} rooms
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>

        {/* Rooms Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">All Rooms</h3>
              {isMobile && filteredRooms.length > 0 && (
                <p className="text-xs text-muted-foreground">Swipe table horizontally to see all columns</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative min-w-0 p-0">
            {(loading || refreshing) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                <p className="text-base font-medium text-muted-foreground">
                  {loading ? 'Loading rooms...' : 'Refreshing rooms...'}
                </p>
              </div>
            )}

            <AnimatePresence>
              {!loading && !refreshing && (
                <motion.div
                  key="rooms-table"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mobile-table-wrap w-full min-w-0"
                  style={{ height: isMobile ? 'min(420px, 65dvh)' : 'min(600px, 70dvh)' }}
                >
                  {filteredRooms.length === 0 ? (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-12 text-muted-foreground">
                      <p className="mb-2 text-lg">No rooms found</p>
                      <p className="text-center text-sm">
                        {searchTerm ? 'Try adjusting your search terms' : 'No rooms available in the system'}
                      </p>
                    </div>
                  ) : (
                    <DataGrid
                      rows={filteredRooms}
                      columns={columns}
                      getRowId={(row) => `${row.source}-${row.roomId}`}
                      pagination
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                      pageSizeOptions={isMobile ? [5, 10] : [10, 20, 50]}
                      density={isMobile ? 'compact' : 'standard'}
                      disableRowSelectionOnClick
                      disableColumnMenu={isMobile}
                      rowHeight={isMobile ? 44 : 52}
                      columnHeaderHeight={isMobile ? 40 : 48}
                      sx={dataGridSx}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Add Room Modal */}
        {showAddRoom && (
          <AddRoomModal
            open={showAddRoom}
            onClose={() => setShowAddRoom(false)}
            spreadsheetId={spreadsheetId}
            userSource={userSource}
            onRoomAdded={fetchRooms}
          />
        )}

        {/* Edit Room Modal */}
        {showEditRoom && selectedRoomForEdit && (
          <EditRoomModal
            open={showEditRoom}
            onClose={() => {
              setShowEditRoom(false);
              setSelectedRoomForEdit(null);
            }}
            room={selectedRoomForEdit}
            userSource={userSource}
            onRoomUpdated={handleRoomUpdated}
          />
        )}

        {/* Room Details Modal */}
        {selectedRoomId && (
          <RoomDetailsModal
            open={!!selectedRoomId}
            roomId={selectedRoomId}
            spreadsheetId={spreadsheetId}
            userSource={userSource}
            onClose={() => {
              setSelectedRoomId(null);
              fetchRooms();
            }}
          />
        )}
      </div>
    </Layout>
  );
}