// // src/hooks/use-auth.ts
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// interface User {
//   userId: string | number;
//   username: string;
//   name: string;
//   email: string;
//   phone?: string;
//   role: string;
//   hotel_id: string | number;
//   hotelName?: string;
//   plan?: 'basic' | 'pro' | 'pro_plus';
//   status?: 'active' | 'pending' | 'suspended';
//   source?: 'database' | 'google_sheets';
//   permissions?: string[];
//   trial_expiry_date?: string;
//   isTrialExpired?: boolean;
// }

// export const useAuth = () => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const checkAuth = () => {
//       try {
//         const token = localStorage.getItem('authToken');
//         const userData = localStorage.getItem('currentUser');

//         if (token && userData) {
//           const parsedUser = JSON.parse(userData);
//           setUser(parsedUser);
//         } else {
//           setUser(null);
//         }
//       } catch (error) {
//         console.error('Auth check error:', error);
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     checkAuth();

//     // Listen for storage changes (like logout from another tab)
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'authToken' || e.key === 'currentUser') {
//         checkAuth();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, []);

//   const login = (token: string, userData: User) => {
//     localStorage.setItem('authToken', token);
//     localStorage.setItem('currentUser', JSON.stringify(userData));
//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('currentUser');
//     setUser(null);
//     navigate('/login');
//   };

//   const updateUser = (updates: Partial<User>) => {
//     if (user) {
//       const updatedUser = { ...user, ...updates };
//       localStorage.setItem('currentUser', JSON.stringify(updatedUser));
//       setUser(updatedUser);
//     }
//   };

//   const isAuthenticated = () => {
//     return !!localStorage.getItem('authToken');
//   };

//   const hasPermission = (permission: string) => {
//     if (!user?.permissions) return false;
//     return user.permissions.includes(permission);
//   };

//   const isAdmin = () => {
//     return user?.role === 'admin';
//   };

//   return {
//     user,
//     loading,
//     login,
//     logout,
//     updateUser,
//     isAuthenticated,
//     hasPermission,
//     isAdmin,
//   };
// };