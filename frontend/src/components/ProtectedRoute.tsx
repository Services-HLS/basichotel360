// components/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/storage';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
  adminOnly?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredPermission,
  requiredAnyPermissions,
  requiredAllPermissions,
  adminOnly = false
}: ProtectedRouteProps) => {
  const user = getCurrentUser();

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin access is required
  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  // Check for specific permission
  if (requiredPermission && !hasPermission(requiredPermission as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Permission Denied</h1>
          <p className="text-muted-foreground">
            You need "{requiredPermission.replace('_', ' ')}" permission to access this page
          </p>
        </div>
      </div>
    );
  }

  // Check for any of the permissions
  if (requiredAnyPermissions && !hasAnyPermission(requiredAnyPermissions as any[])) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Permission Denied</h1>
          <p className="text-muted-foreground">
            You need one of the required permissions to access this page
          </p>
        </div>
      </div>
    );
  }

  // Check for all permissions
  if (requiredAllPermissions && !hasAllPermissions(requiredAllPermissions as any[])) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Permission Denied</h1>
          <p className="text-muted-foreground">
            You need all required permissions to access this page
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;