// src/components/AuthProtectedRoute.tsx
// This is a NEW FILE - create it in the components folder
// You can DELETE the old ProtectedRoute.tsx after creating this

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '@/lib/auth';
import { getCurrentUser } from '@/lib/storage';
import { isBasicDatabaseUser, isBasicPlanViewOnlyPath, isRouteAllowedForBasicUser } from '@/lib/planUtils';
import { hasPermission } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

interface AuthProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

const AuthProtectedRoute = ({ children, requiredPermission }: AuthProtectedRouteProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const validateAuth = async () => {
      console.log('🔐 AuthProtectedRoute: Validating access to', location.pathname);
      
      try {
        // First check if we have a user
        const user = getCurrentUser();
        if (!user) {
          console.log('❌ No user found in storage');
          if (isMounted) {
            setIsValid(false);
            setIsValidating(false);
          }
          return;
        }

        console.log('👤 User found:', { 
          name: user.name, 
          role: user.role,
          source: user.source 
        });

        // Validate session with token refresh if needed
        const isValid = await AuthService.validateSession();
        
        if (!isValid) {
          console.log('❌ Session validation failed');
          if (isMounted) {
            setIsValid(false);
          }
        } else {
          // Basic plan: view-only access to Pro sections (no permission required)
          if (isBasicDatabaseUser(user) && isBasicPlanViewOnlyPath(location.pathname, user)) {
            if (isMounted) setIsValid(true);
            return;
          }

          if (isBasicDatabaseUser(user) && !isRouteAllowedForBasicUser(location.pathname)) {
            console.log('🚫 Basic plan route blocked:', location.pathname);
            if (isMounted) setIsValid(false);
            return;
          }

          // Check permissions if required
          if (requiredPermission) {
            const hasRequiredPerm = hasPermission(requiredPermission as any);
            console.log(`🔑 Permission check for ${requiredPermission}:`, hasRequiredPerm);
            
            if (isMounted) {
              setIsValid(hasRequiredPerm);
            }
          } else {
            if (isMounted) {
              setIsValid(true);
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth validation error:', error);
        if (isMounted) {
          setIsValid(false);
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };

    validateAuth();

    return () => {
      isMounted = false;
    };
  }, [requiredPermission, location.pathname]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    const user = getCurrentUser();
    if (user && isBasicDatabaseUser(user) && !isRouteAllowedForBasicUser(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
    console.log('🚫 Access denied, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthProtectedRoute;