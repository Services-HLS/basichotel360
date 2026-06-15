// src/utils/permissionUtils.ts
export type PermissionType = 
  | 'view_dashboard'
  | 'view_rooms'
  | 'manage_rooms'
  | 'view_bookings'
  | 'create_booking'
  | 'edit_booking'
  | 'cancel_booking'
  | 'view_customers'
  | 'manage_customers'
  | 'view_reports'
  | 'manage_staff'
  | 'manage_hotel_settings'
  | 'view_financial';

export const permissionLabels: Record<PermissionType, string> = {
  'view_dashboard': 'View Dashboard',
  'view_rooms': 'View Rooms',
  'manage_rooms': 'Manage Rooms',
  'view_bookings': 'View Bookings',
  'create_booking': 'Create Bookings',
  'edit_booking': 'Edit Bookings',
  'cancel_booking': 'Cancel Bookings',
  'view_customers': 'View Customers',
  'manage_customers': 'Manage Customers',
  'view_reports': 'View Reports',
  'manage_staff': 'Manage Staff',
  'manage_hotel_settings': 'Manage Hotel Settings',
  'view_financial': 'View Financial Reports'
};

// Check if user has specific permission
export const hasPermission = (permission: PermissionType): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    
    // Admin has all permissions automatically
    if (user.role === 'admin') {
      return true;
    }
    
    // Check user permissions
    const permissions = user.permissions || [];
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Get user role
export const getUserRole = (): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return '';
    
    const user = JSON.parse(userStr);
    return user.role || '';
  } catch (error) {
    console.error('Error getting user role:', error);
    return '';
  }
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return getUserRole() === 'admin';
};