// src/components/AuthProtectedRoute.tsx
// This is a NEW FILE - create it in the components folder
// You can DELETE the old ProtectedRoute.tsx after creating this

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '@/lib/auth';
import { getCurrentUser } from '@/lib/storage';
import { isBasicDatabaseUser, isBasicPlanViewOnlyPath, isRouteAllowedForBasicUser } from '@/lib/planUtils';
import { isSubscriptionExpired } from '@/lib/subscription';
import { hasPermission } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

interface AuthProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

const ALLOWED_WHEN_SUBSCRIPTION_LOCKED = ['/upgrade', '/contact', '/login', '/dashboard'];

const AuthProtectedRoute = ({ children, requiredPermission }: AuthProtectedRouteProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [redirectToUpgrade, setRedirectToUpgrade] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const validateAuth = async () => {
      console.log('🔐 AuthProtectedRoute: Validating access to', location.pathname);

      try {
        const user = getCurrentUser();
        if (!user) {
          console.log('❌ No user found in storage');
          if (isMounted) {
            setIsValid(false);
            setIsValidating(false);
            setRedirectToUpgrade(false);
          }
          return;
        }

        console.log('👤 User found:', {
          name: user.name,
          role: user.role,
          source: user.source,
        });

        // Expired / suspended PRO: only upgrade (and contact) routes allowed
        const pathAllowedWhileLocked = ALLOWED_WHEN_SUBSCRIPTION_LOCKED.some(
          (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
        );
        if (isSubscriptionExpired(user) && !pathAllowedWhileLocked) {
          console.log('🚫 Subscription locked — redirect to /upgrade');
          if (isMounted) {
            setRedirectToUpgrade(true);
            setIsValid(false);
            setIsValidating(false);
          }
          return;
        }

        const sessionValid = await AuthService.validateSession();

        if (!sessionValid) {
          console.log('❌ Session validation failed');
          if (isMounted) {
            setIsValid(false);
            setRedirectToUpgrade(false);
          }
        } else {
          if (isBasicDatabaseUser(user) && isBasicPlanViewOnlyPath(location.pathname, user)) {
            if (isMounted) {
              setIsValid(true);
              setRedirectToUpgrade(false);
            }
            return;
          }

          if (isBasicDatabaseUser(user) && !isRouteAllowedForBasicUser(location.pathname)) {
            console.log('🚫 Basic plan route blocked:', location.pathname);
            if (isMounted) {
              setIsValid(false);
              setRedirectToUpgrade(false);
            }
            return;
          }

          if (requiredPermission) {
            const hasRequiredPerm = hasPermission(requiredPermission as any);
            console.log(`🔑 Permission check for ${requiredPermission}:`, hasRequiredPerm);

            if (isMounted) {
              setIsValid(hasRequiredPerm);
              setRedirectToUpgrade(false);
            }
          } else if (isMounted) {
            setIsValid(true);
            setRedirectToUpgrade(false);
          }
        }
      } catch (error) {
        console.error('❌ Auth validation error:', error);
        if (isMounted) {
          setIsValid(false);
          setRedirectToUpgrade(false);
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

  if (redirectToUpgrade) {
    return <Navigate to="/upgrade" replace />;
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
