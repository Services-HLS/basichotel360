// hooks/use-permissions.ts
import { useState, useEffect } from 'react';
import { getUserPermissions, isAdmin, hasPermission as checkPermission } from '@/lib/permissions';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = () => {
      const userPermissions = getUserPermissions();
      const adminStatus = isAdmin();
      
      setPermissions(userPermissions);
      setIsUserAdmin(adminStatus);
      setLoading(false);
    };

    loadPermissions();
    
    // Listen for storage changes (in case of login/logout)
    const handleStorageChange = () => {
      loadPermissions();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (isUserAdmin) return true;
    return checkPermission(permission as any);
  };

  const hasAnyPermissions = (requiredPermissions: string[]): boolean => {
    if (isUserAdmin) return true;
    return requiredPermissions.some(permission => checkPermission(permission as any));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    if (isUserAdmin) return true;
    return requiredPermissions.every(permission => checkPermission(permission as any));
  };

  return {
    permissions,
    isAdmin: isUserAdmin,
    hasPermission,
    hasAnyPermissions,
    hasAllPermissions,
    loading
  };
};