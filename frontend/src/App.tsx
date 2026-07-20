

// // src/App.tsx - UPDATED VERSION
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import AuthProtectedRoute from "@/components/AuthProtectedRoute"; // NEW IMPORT
// import AuthService from "@/lib/auth"; // NEW IMPORT
// import { useEffect } from "react"; // ADD THIS IMPORT

// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import StaffManagement from "./pages/StaffManagement";
// import RoomBooking from "./pages/RoomBooking";
// import Rooms from "./pages/Rooms";
// import Bookings from "./pages/Bookings";
// import Customers from "./pages/Customers";
// import Settings from "./pages/Settings";
// import Contact from "./pages/Contact";
// import NotFound from "./pages/NotFound";
// import ConditionalFooter from './components/ConditionalFooter';

// import Expenses from "./pages/Expenses";
// import Salaries from "./pages/Salaries";
// import Collections from "./pages/Collections";
// import Reports from "./pages/Reports";
// import Housekeeping from "./pages/Housekeeping";
// import MetaPixel from "./components/MetaPixel";
// import UpgradeFlow from "./components/UpgradeFlow";
// import ReferralDashboard from "./components/ReferralDashboard";
// import TransactionHistory from "./components/TransactionHistory";
// import WalletDashboard from "./components/WalletDashboard";
// import FunctionRooms from "./pages/FunctionRooms";
// import ForgotPassword from "@/components/ForgotPassword";
// import ResetPassword from "@/components/ResetPassword";
// import AdvanceBookings from "./pages/AdvanceBookings";

// const queryClient = new QueryClient();

// const App = () => {
//   // ADD THIS EFFECT - runs once when app loads
//   useEffect(() => {
//     // Setup fetch interceptor for automatic token handling
//     AuthService.setupFetchInterceptor();

//     // Check initial auth state
//     const checkInitialAuth = async () => {
//       const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/contact', '/upgrade'];
//       const isPublicRoute = publicRoutes.some(route => 
//         window.location.pathname.startsWith(route)
//       );

//       if (!isPublicRoute) {
//         console.log('🔄 App initializing - checking session...');
//         const isValid = await AuthService.validateSession();
//         if (!isValid) {
//           console.log('❌ Initial session invalid, redirecting to login');
//           window.location.href = '/login';
//         } else {
//           console.log('✅ Initial session valid');
//         }
//       }
//     };

//     checkInitialAuth();
//   }, []); // Empty array = runs once on mount

//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <MetaPixel />
//           <Routes>
//             {/* --- PUBLIC ROUTES --- */}
//             <Route path="/" element={<Navigate to="/login" replace />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/forgot-password" element={<ForgotPassword />} />
//             <Route path="/reset-password" element={<ResetPassword />} />
//             <Route path="/contact" element={<Contact />} />
//             <Route path="/upgrade" element={<UpgradeFlow />} />

//             {/* --- PROTECTED ROUTES - REPLACE ALL ProtectedRoute WITH AuthProtectedRoute --- */}
//             <Route path="/dashboard" element={
//               <AuthProtectedRoute requiredPermission="view_dashboard">
//                 <Dashboard />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/staff" element={
//               <AuthProtectedRoute requiredPermission="manage_staff">
//                 <StaffManagement />
//               </AuthProtectedRoute>
//             } />

//             {/* Income & Expenses Group */}
//             <Route path="/collections" element={
//               <AuthProtectedRoute requiredPermission="view_collections">
//                 <Collections />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/expenses" element={
//               <AuthProtectedRoute requiredPermission="view_expenses">
//                 <Expenses />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/salaries" element={
//               <AuthProtectedRoute requiredPermission="view_salaries">
//                 <Salaries />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/housekeeping" element={
//               <AuthProtectedRoute requiredPermission="manage_housekeeping">
//                 <Housekeeping />
//               </AuthProtectedRoute>
//             } />

//             {/* Other Routes */}
//             <Route path="/roombooking" element={
//               <AuthProtectedRoute requiredPermission="create_booking">
//                 <RoomBooking />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/rooms" element={
//               <AuthProtectedRoute requiredPermission="view_rooms">
//                 <Rooms />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/function-rooms" element={
//               <AuthProtectedRoute requiredPermission="manage_function_rooms">
//                 <FunctionRooms />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/bookings" element={
//               <AuthProtectedRoute requiredPermission="view_bookings">
//                 <Bookings />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/advance-bookings" element={
//               <AuthProtectedRoute requiredPermission="create_booking">
//                 <AdvanceBookings />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/customers" element={
//               <AuthProtectedRoute requiredPermission="view_customers">
//                 <Customers />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/reports" element={
//               <AuthProtectedRoute requiredPermission="view_reports">
//                 <Reports />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/settings" element={
//               <AuthProtectedRoute requiredPermission="manage_hotel_settings">
//                 <Settings />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/wallet" element={
//               <AuthProtectedRoute requiredPermission="view_dashboard">
//                 <WalletDashboard />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/wallet/transactions" element={
//               <AuthProtectedRoute requiredPermission="view_dashboard">
//                 <TransactionHistory />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/referrals" element={
//               <AuthProtectedRoute requiredPermission="view_dashboard">
//                 <ReferralDashboard />
//               </AuthProtectedRoute>
//             } />

//             <Route path="/upgrade" element={
//               <AuthProtectedRoute>
//                 <UpgradeFlow />
//               </AuthProtectedRoute>
//             } />

//             <Route path="*" element={<NotFound />} />
//           </Routes>

//           <ConditionalFooter />
//         </BrowserRouter>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// };

// export default App;





// // // src/App.tsx - UPDATED VERSION
// // import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// // import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// // import { TooltipProvider } from "@/components/ui/tooltip";
// // import { Toaster } from "@/components/ui/toaster";
// // import { Toaster as Sonner } from "@/components/ui/sonner";
// // import AuthProtectedRoute from "@/components/AuthProtectedRoute"; // NEW IMPORT
// // import AuthService from "@/lib/auth"; // NEW IMPORT
// // import { useEffect } from "react"; // ADD THIS IMPORT
// // import { setupApiInterceptor } from "@/lib/apiInterceptor"; // ✅ NEW IMPORT
// // import { clearAllUserData } from "@/lib/clearUserData"; // ✅ NEW IMPORT


// // import Login from "./pages/Login";
// // import Dashboard from "./pages/Dashboard";
// // import StaffManagement from "./pages/StaffManagement";
// // import RoomBooking from "./pages/RoomBooking";
// // import Rooms from "./pages/Rooms";
// // import Bookings from "./pages/Bookings";
// // import Customers from "./pages/Customers";
// // import Settings from "./pages/Settings";
// // import Contact from "./pages/Contact";
// // import NotFound from "./pages/NotFound";
// // import ConditionalFooter from './components/ConditionalFooter';

// // import Expenses from "./pages/Expenses";
// // import Salaries from "./pages/Salaries";
// // import Collections from "./pages/Collections";
// // import Reports from "./pages/Reports";
// // import Housekeeping from "./pages/Housekeeping";
// // import MetaPixel from "./components/MetaPixel";
// // import UpgradeFlow from "./components/UpgradeFlow";
// // import ReferralDashboard from "./components/ReferralDashboard";
// // import TransactionHistory from "./components/TransactionHistory";
// // import WalletDashboard from "./components/WalletDashboard";
// // import FunctionRooms from "./pages/FunctionRooms";
// // import ForgotPassword from "@/components/ForgotPassword";
// // import ResetPassword from "@/components/ResetPassword";
// // import AdvanceBookings from "./pages/AdvanceBookings";

// // const queryClient = new QueryClient();

// // const App = () => {
// //   useEffect(() => {
// //     // Setup fetch interceptor for automatic token handling
// //     AuthService.setupFetchInterceptor();

// //     // ✅ NEW: Setup API interceptor for hotel validation
// //     setupApiInterceptor();

// //     // Check initial auth state
// //     const checkInitialAuth = async () => {
// //       const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/contact', '/upgrade'];
// //       const isPublicRoute = publicRoutes.some(route =>
// //         window.location.pathname.startsWith(route)
// //       );

// //       if (!isPublicRoute) {
// //         console.log('🔄 App initializing - checking session...');

// //         // ✅ NEW: Verify that user data is consistent
// //         const currentUser = localStorage.getItem('currentUser');
// //         const token = localStorage.getItem('authToken');

// //         if (!currentUser || !token) {
// //           console.log('❌ No user data found');
// //           clearAllUserData();
// //           window.location.href = '/login';
// //           return;
// //         }

// //         try {
// //           const user = JSON.parse(currentUser);

// //           // Verify token matches user (basic check)
// //           const tokenParts = token.split('.');
// //           if (tokenParts.length === 3) {
// //             const payload = JSON.parse(atob(tokenParts[1]));
// //             if (payload.userId !== user.id && payload.hotel_id !== user.hotel_id) {
// //               console.log('❌ Token-user mismatch');
// //               clearAllUserData();
// //               window.location.href = '/login';
// //               return;
// //             }
// //           }

// //           const isValid = await AuthService.validateSession();
// //           if (!isValid) {
// //             console.log('❌ Initial session invalid, redirecting to login');
// //             clearAllUserData();
// //             window.location.href = '/login';
// //           } else {
// //             console.log('✅ Initial session valid for hotel:', user.hotel_id);
// //           }
// //         } catch (error) {
// //           console.error('Error checking session:', error);
// //           clearAllUserData();
// //           window.location.href = '/login';
// //         }
// //       }
// //     };

// //     checkInitialAuth();
// //   }, []);

// //   return (
// //     <QueryClientProvider client={queryClient}>
// //       <TooltipProvider>
// //         <Toaster />
// //         <Sonner />
// //         <BrowserRouter>
// //           <MetaPixel />
// //           <Routes>
// //             {/* --- PUBLIC ROUTES --- */}
// //             <Route path="/" element={<Navigate to="/login" replace />} />
// //             <Route path="/login" element={<Login />} />
// //             <Route path="/forgot-password" element={<ForgotPassword />} />
// //             <Route path="/reset-password" element={<ResetPassword />} />
// //             <Route path="/contact" element={<Contact />} />
// //             <Route path="/upgrade" element={<UpgradeFlow />} />

// //             {/* --- PROTECTED ROUTES - REPLACE ALL ProtectedRoute WITH AuthProtectedRoute --- */}
// //             <Route path="/dashboard" element={
// //               <AuthProtectedRoute requiredPermission="view_dashboard">
// //                 <Dashboard />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/staff" element={
// //               <AuthProtectedRoute requiredPermission="manage_staff">
// //                 <StaffManagement />
// //               </AuthProtectedRoute>
// //             } />

// //             {/* Income & Expenses Group */}
// //             <Route path="/collections" element={
// //               <AuthProtectedRoute requiredPermission="view_collections">
// //                 <Collections />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/expenses" element={
// //               <AuthProtectedRoute requiredPermission="view_expenses">
// //                 <Expenses />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/salaries" element={
// //               <AuthProtectedRoute requiredPermission="view_salaries">
// //                 <Salaries />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/housekeeping" element={
// //               <AuthProtectedRoute requiredPermission="manage_housekeeping">
// //                 <Housekeeping />
// //               </AuthProtectedRoute>
// //             } />

// //             {/* Other Routes */}
// //             <Route path="/roombooking" element={
// //               <AuthProtectedRoute requiredPermission="create_booking">
// //                 <RoomBooking />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/rooms" element={
// //               <AuthProtectedRoute requiredPermission="view_rooms">
// //                 <Rooms />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/function-rooms" element={
// //               <AuthProtectedRoute requiredPermission="manage_function_rooms">
// //                 <FunctionRooms />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/bookings" element={
// //               <AuthProtectedRoute requiredPermission="view_bookings">
// //                 <Bookings />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/advance-bookings" element={
// //               <AuthProtectedRoute requiredPermission="create_booking">
// //                 <AdvanceBookings />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/customers" element={
// //               <AuthProtectedRoute requiredPermission="view_customers">
// //                 <Customers />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/reports" element={
// //               <AuthProtectedRoute requiredPermission="view_reports">
// //                 <Reports />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/settings" element={
// //               <AuthProtectedRoute requiredPermission="manage_hotel_settings">
// //                 <Settings />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/wallet" element={
// //               <AuthProtectedRoute requiredPermission="view_dashboard">
// //                 <WalletDashboard />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/wallet/transactions" element={
// //               <AuthProtectedRoute requiredPermission="view_dashboard">
// //                 <TransactionHistory />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/referrals" element={
// //               <AuthProtectedRoute requiredPermission="view_dashboard">
// //                 <ReferralDashboard />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="/upgrade" element={
// //               <AuthProtectedRoute>
// //                 <UpgradeFlow />
// //               </AuthProtectedRoute>
// //             } />

// //             <Route path="*" element={<NotFound />} />
// //           </Routes>

// //           <ConditionalFooter />
// //         </BrowserRouter>
// //       </TooltipProvider>
// //     </QueryClientProvider>
// //   );
// // };

// // export default App;




// src/App.tsx - UPDATED VERSION
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AuthProtectedRoute from "@/components/AuthProtectedRoute"; // NEW IMPORT
import AuthService from "@/lib/auth"; // NEW IMPORT
import { useEffect } from "react"; // ADD THIS IMPORT

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StaffManagement from "./pages/StaffManagement";
import RoomBooking from "./pages/RoomBooking";
import Rooms from "./pages/Rooms";
import Bookings from "./pages/Bookings";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ConditionalFooter from './components/ConditionalFooter';

import Expenses from "./pages/Expenses";
import Salaries from "./pages/Salaries";
import Collections from "./pages/Collections";
import Reports from "./pages/Reports";
import Housekeeping from "./pages/Housekeeping";
import MetaPixel from "./components/MetaPixel";
import UpgradeFlow from "./components/UpgradeFlow";
import FunctionRooms from "./pages/FunctionRooms";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";
import AdvanceBookings from "./pages/AdvanceBookings";
import RefundManagement from './pages/RefundManagement';
import { TrackingProvider } from "./context/TrackingContext";
import { initNotificationServices } from '@/lib/notificationInit';
import { setupApiInterceptor } from '@/lib/apiInterceptor';

const queryClient = new QueryClient();

const App = () => {
  // ADD THIS EFFECT - runs once when app loads
  useEffect(() => {
    // Setup fetch interceptor for automatic token handling
    AuthService.setupFetchInterceptor();
    setupApiInterceptor();

    // Check initial auth state
    const checkInitialAuth = async () => {
      const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/contact', '/upgrade'];
      const isPublicRoute = publicRoutes.some(route =>
        window.location.pathname.startsWith(route)
      );

      if (!isPublicRoute) {
        console.log('🔄 App initializing - checking session...');
        const isValid = await AuthService.validateSession();
        if (!isValid) {
          console.log('❌ Initial session invalid, redirecting to login');
          window.location.href = '/login';
        } else {
          console.log('✅ Initial session valid');
        }
      }
    };

    checkInitialAuth();
    void initNotificationServices();
  }, []); // Empty array = runs once on mount

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TrackingProvider>
            <MetaPixel />
            <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/upgrade" element={<UpgradeFlow />} />

              {/* --- PROTECTED ROUTES - REPLACE ALL ProtectedRoute WITH AuthProtectedRoute --- */}
              <Route path="/dashboard" element={
                <AuthProtectedRoute requiredPermission="view_dashboard">
                  <Dashboard />
                </AuthProtectedRoute>
              } />

              <Route path="/staff" element={
                <AuthProtectedRoute requiredPermission="manage_staff">
                  <StaffManagement />
                </AuthProtectedRoute>
              } />

              {/* Income & Expenses Group */}
              <Route path="/collections" element={
                <AuthProtectedRoute requiredPermission="view_collections">
                  <Collections />
                </AuthProtectedRoute>
              } />

              <Route path="/expenses" element={
                <AuthProtectedRoute requiredPermission="view_expenses">
                  <Expenses />
                </AuthProtectedRoute>
              } />

              <Route path="/salaries" element={
                <AuthProtectedRoute requiredPermission="view_salaries">
                  <Salaries />
                </AuthProtectedRoute>
              } />

              <Route path="/housekeeping" element={
                <AuthProtectedRoute requiredPermission="manage_housekeeping">
                  <Housekeeping />
                </AuthProtectedRoute>
              } />

              {/* Other Routes */}
              <Route path="/roombooking" element={
                <AuthProtectedRoute requiredPermission="create_booking">
                  <RoomBooking />
                </AuthProtectedRoute>
              } />

              <Route path="/rooms" element={
                <AuthProtectedRoute requiredPermission="view_rooms">
                  <Rooms />
                </AuthProtectedRoute>
              } />

              <Route path="/function-rooms" element={
                <AuthProtectedRoute requiredPermission="manage_function_rooms">
                  <FunctionRooms />
                </AuthProtectedRoute>
              } />

              <Route path="/bookings" element={
                <AuthProtectedRoute requiredPermission="view_bookings">
                  <Bookings />
                </AuthProtectedRoute>
              } />

              <Route path="/advance-bookings" element={
                <AuthProtectedRoute requiredPermission="create_booking">
                  <AdvanceBookings />
                </AuthProtectedRoute>
              } />

              <Route path="/customers" element={
                <AuthProtectedRoute requiredPermission="view_customers">
                  <Customers />
                </AuthProtectedRoute>
              } />

              <Route path="/reports" element={
                <AuthProtectedRoute requiredPermission="view_reports">
                  <Reports />
                </AuthProtectedRoute>
              } />

              <Route path="/refund-management" element={
                <AuthProtectedRoute requiredPermission="view_dashboard">
                  <RefundManagement />
                </AuthProtectedRoute>
              } />

              <Route path="/settings" element={
                <AuthProtectedRoute requiredPermission="manage_hotel_settings">
                  <Settings />
                </AuthProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>

            <ConditionalFooter />
          </TrackingProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;