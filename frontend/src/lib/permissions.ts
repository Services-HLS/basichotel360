// lib/permissions.ts
import {
  BASIC_PLAN_PERMISSIONS,
  isBasicDatabaseUser,
} from '@/lib/planUtils';

// Permission types
export type Permission = 
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
  | 'view_financial'
  | 'view_collections'
  | 'view_expenses'
  | 'view_salaries'
  | 'manage_housekeeping'
  |'manage_function_rooms';


// Check if user has permission
export const hasPermission = (permission: Permission): boolean => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return false;
  
  const user = JSON.parse(userStr);

  // Database basic plan: limited menu even for admin
  if (isBasicDatabaseUser(user)) {
    return BASIC_PLAN_PERMISSIONS.includes(permission);
  }
  
  // Admin has all permissions (pro / full database)
  if (user.role === 'admin') return true;
  
  // Check if user has the specific permission
  return user.permissions?.includes(permission) || false;
};

// Check if user has any of the given permissions
export const hasAnyPermission = (permissions: Permission[]): boolean => {
  if (!permissions.length) return true;
  
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return false;
  
  const user = JSON.parse(userStr);

  if (isBasicDatabaseUser(user)) {
    return permissions.some((p) => BASIC_PLAN_PERMISSIONS.includes(p));
  }
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has any of the permissions
  return permissions.some(permission => 
    user.permissions?.includes(permission)
  );
};

// Check if user has all of the given permissions
export const hasAllPermissions = (permissions: Permission[]): boolean => {
  if (!permissions.length) return true;
  
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return false;
  
  const user = JSON.parse(userStr);

  if (isBasicDatabaseUser(user)) {
    return permissions.every((p) => BASIC_PLAN_PERMISSIONS.includes(p));
  }
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check if user has all permissions
  return permissions.every(permission => 
    user.permissions?.includes(permission)
  );
};

// Get user role
export const getUserRole = (): string | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  
  const user = JSON.parse(userStr);
  return user.role || null;
};

// Get all user permissions
export const getUserPermissions = (): Permission[] => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return [];
  
  const user = JSON.parse(userStr);
  return user.permissions || [];
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return getUserRole() === 'admin';
};