

// components/Layout.tsx - MODIFIED VERSION
import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '@/lib/storage';
import { hasPermission, isAdmin } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  isAnyBasicUser,
  isBasicDatabaseUser,
  isBasicPlanViewOnlyPath,
} from '@/lib/planUtils';
import { BasicPlanViewOnlyWrapper } from '@/components/BasicPlanViewOnlyWrapper';
import CheckoutNotifications from '@/components/CheckoutNotifications';
import MobileDraggableSidebar from '@/components/MobileDraggableSidebar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Bed,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Receipt,
  Wallet,
  BarChart3,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  Home,
  Building2,
  CalendarDays,
  Ban,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '@/components/Logo';
import { useEffect } from 'react'; // Add useEffect
// ... keep other imports ...
import { Loader2 } from 'lucide-react'; // Add this import if not already there

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [incomeExpensesOpen, setIncomeExpensesOpen] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ✅ ADD THIS STATE for hotel logo
  // const [hotelLogo, setHotelLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [hotelLogo, setHotelLogo] = useState<string | null>(() => {
    // Try to get logo from localStorage first (cached)
    try {
      const stored = localStorage.getItem('hotelLogo');
      return stored ? stored : null; // Don't parse, it's already a string
    } catch {
      return null;
    }
  });


  // Legacy Google Sheets basic vs database basic
  const isGoogleSheetsUser = currentUser?.source === 'google_sheets';
  const isBasicUser = isAnyBasicUser(currentUser);
  const isBasicDbUser = isBasicDatabaseUser(currentUser);



  useEffect(() => {
    const handleSubscriptionExpired = (event: any) => {
      // Update user in state if needed
      if (event.detail?.user) {
        // You might want to update some state here
      }

      // Optionally show a toast or notification
      // toast({
      //   title: "Trial Expired",
      //   description: "Your trial has expired. Please reactivate your account.",
      //   variant: "destructive"
      // });
    };

    window.addEventListener('subscription:expired', handleSubscriptionExpired);

    return () => {
      window.removeEventListener('subscription:expired', handleSubscriptionExpired);
    };
  }, []);

  // Update the fetchHotelLogo function to handle 403 errors properly
  // In Layout.tsx - Update the fetchHotelLogo function
  // In Layout.tsx - Update the fetchHotelLogo function
  useEffect(() => {
    if (currentUser?.source === 'database' && currentUser?.hotel_id) {
      if (hotelLogo) {
        return;
      }

      const fetchHotelLogo = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) return;

          // Fetch hotel logo from backend
          const response = await fetch(`${API_URL}/hotels/${currentUser.hotel_id}/logo`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
            },
            cache: 'no-store'
          });

          // Handle 403 specifically - could be subscription expired
          if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));

            // Check if this is subscription expired
            const errorMessage = errorData.message?.toLowerCase() || '';
            const errorCode = errorData.code?.toLowerCase() || '';

            const isSubscriptionExpired =
              errorCode.includes('subscription_expired') ||
              errorCode.includes('trial_expired') ||
              errorMessage.includes('subscription expired') ||
              errorMessage.includes('trial expired') ||
              errorData.status === 'suspended';

            if (isSubscriptionExpired) {
              // Update user in localStorage
              const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
              const updatedUser = {
                ...currentUserData,
                isTrialExpired: true,
                status: 'suspended',
                subscription_status: 'expired'
              };
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));

              // Dispatch event
              window.dispatchEvent(new CustomEvent('subscription:expired', {
                detail: { user: updatedUser }
              }));

              // DON'T redirect to login, just return
              return;
            }

            return;
          }

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.logo_image) {
              // Save to state
              setHotelLogo(result.data.logo_image);

              // Save to localStorage for future use
              localStorage.setItem('hotelLogo', result.data.logo_image);

              // Also update currentUser with logo
              const updatedUser = {
                ...currentUser,
                logo_image: result.data.logo_image
              };
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          console.error('Error fetching hotel logo:', error);
          // Don't redirect on error
        }
      };

      fetchHotelLogo();
    }
  }, [currentUser, API_URL, hotelLogo]);
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('hotelLogo');
    localStorage.removeItem('currentHotel');
    localStorage.removeItem('selectedHotel');
    navigate('/login');
  };

  // Add this with your other useState declarations in Layout.tsx


  // In Layout.tsx - REPLACE the handleLogout function with this:

  // const handleLogout = () => {
  //   console.log('🚪 Layout: Logging out user...');
  //   clearAllUserData();
  //  navigate('/login');
  // };

  const [functionHallEnabled, setFunctionHallEnabled] = useState<boolean>(() => {
    // Get saved preference from localStorage
    const saved = localStorage.getItem('functionHallEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Add this useEffect to listen for toggle events
  useEffect(() => {
    const handleFunctionHallToggle = (event: CustomEvent) => {
      setFunctionHallEnabled(event.detail.enabled);
    };

    window.addEventListener('functionHallToggle' as any, handleFunctionHallToggle);

    return () => {
      window.removeEventListener('functionHallToggle' as any, handleFunctionHallToggle);
    };
  }, []);

  // Main navigation items (visible to all logged-in users with permissions)
  // const mainNavItems = [
  //   {
  //     path: '/roombooking',
  //     icon: Calendar,
  //     label: 'Book a Room',
  //     requires: 'create_booking'
  //   },

  //   {
  //     path: '/advance-bookings',
  //     icon: CalendarDays, // Import CalendarDays from lucide-react
  //     label: 'Advance Booking',
  //     requires: 'create_booking' // or create a new permission like 'manage_advance_bookings'
  //   },
  //    {
  //     path: '/bookings',
  //     icon: Calendar,
  //     label: 'My Bookings',
  //     requires: 'view_bookings'
  //   },
  //   {
  //     path: '/dashboard',
  //     icon: LayoutDashboard,
  //     label: 'Dashboard',
  //     requires: 'view_dashboard'
  //   },      
  //   {
  //     path: '/rooms',
  //     icon: Bed,
  //     label: 'Rooms',
  //     requires: 'view_rooms'
  //   },
  //   // ✅ ADD FUNCTION ROOMS HERE - Only for PRO/Database users
  //   // ...(currentUser?.source === 'database' ? [{
  //   //   path: '/function-rooms',
  //   //   icon: Building2, // Make sure to import Building2 from lucide-react
  //   //   label: 'Function hall',
  //   //   requires: 'view_rooms' // or create a new permission 'manage_function_rooms'
  //   // }] : []),
  //   // Replace the existing Function Rooms menu item with this conditional version
  //   // In Layout.tsx - Function Rooms menu item with disabled styling
  //   ...(currentUser?.source === 'database' ? [{
  //     path: '/function-rooms',
  //     icon: Building2,
  //     label: 'Function hall',
  //     requires: 'view_rooms',
  //     disabled: !functionHallEnabled // Add this property
  //   }] : []),

  //   {
  //     path: '/customers',
  //     icon: Users,
  //     label: 'Guest Details',
  //     requires: 'view_customers'
  //   },
  //   //   ...(currentUser?.source === 'database' ? [{
  //   //   path: '/wallet',
  //   //   icon: Wallet,
  //   //   label: 'My Wallet',
  //   //   requires: 'view_dashboard'
  //   // }] : []),
  //   // // ✅ ADD REFERRALS MENU ITEM - ONLY FOR DATABASE USERS
  //   // ...(currentUser?.source === 'database' ? [{
  //   //   path: '/referrals',
  //   //   icon: Users,
  //   //   label: 'Refer & Earn',
  //   //   requires: 'view_dashboard'
  //   // }] : [])
  // ];

  type NavItem = {
    path: string;
    icon: typeof Calendar;
    label: string;
    requires?: string;
    highlight?: boolean;
    disabled?: boolean;
    proOnly?: boolean;
  };

  // Full sidebar for all plans; Basic plan users see Pro items greyed out
  const mainNavItems: NavItem[] = [
    {
      path: '/roombooking',
      icon: Calendar,
      label: 'Book a Room',
      requires: 'create_booking',
      highlight: true,
    },
    {
      path: '/advance-bookings',
      icon: CalendarDays,
      label: 'Advance Bookings',
      requires: 'create_booking',
      proOnly: true,
    },
    {
      path: '/bookings',
      icon: Calendar,
      label: 'Checkout',
      requires: 'view_bookings',
    },
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Overview',
      requires: 'view_dashboard',
    },
    {
      path: '/rooms',
      icon: Bed,
      label: 'Rooms',
      requires: 'view_rooms',
    },
    ...(currentUser?.source === 'database'
      ? [
          {
            path: '/function-rooms',
            icon: Building2,
            label: 'Function Hall',
            requires: 'view_rooms',
            proOnly: true,
            disabled: !functionHallEnabled,
          },
        ]
      : []),
    {
      path: '/customers',
      icon: Users,
      label: 'Guest Details',
      requires: 'view_customers',
      proOnly: true,
    },
  ];

  // Income & Expenses sub-items
  const incomeExpensesItems = [
    {
      path: '/collections',
      icon: IndianRupee,
      label: 'Collections',
      requires: 'view_collections'
    },
    {
      path: '/expenses',
      icon: Receipt,
      label: 'Expenses',
      requires: 'view_expenses'
    },
    {
      path: '/salaries',
      icon: Wallet,
      label: 'Salaries',
      requires: 'view_salaries'
    },
    {
      path: '/housekeeping',
      icon: Home,
      label: 'Housekeeping',
      requires: 'manage_housekeeping'
    }
  ];

  // Other navigation items (visible based on permissions)
  const otherNavItems = [
    {
      path: '/refund-management',
      icon: Ban,
      label: 'Cancellations & Refunds',
      requires: 'view_dashboard',
      proOnly: true,
    },
    {
      path: '/contact',
      icon: HelpCircle,
      label: 'Contact Support',
      requires: 'view_dashboard' // All logged-in users can see contact
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      requires: 'manage_hotel_settings'
    }
  ];

  // Reports item - ONLY FOR ADMIN (and only for Pro users, not Google Sheets)
  const reportsNavItem: NavItem = {
    path: '/reports',
    icon: BarChart3,
    label: 'Reports',
    requires: 'view_reports',
    proOnly: true,
  };

  const isNavItemDisabled = (item: NavItem) => {
    return !!item.disabled;
  };

  const isNavItemViewOnly = (item: NavItem) => {
    return isBasicDbUser && (item.proOnly || isBasicPlanViewOnlyPath(item.path));
  };

  const getNavDisabledTitle = (item: NavItem) => {
    if (isNavItemViewOnly(item)) {
      return 'View-only on Basic plan — upgrade to Pro for full access';
    }
    if (item.disabled) {
      return 'Function Hall is disabled. Enable it from Dashboard Quick Actions';
    }
    return '';
  };

  const getNavDisabledBadge = (item: NavItem) => {
    if (isNavItemViewOnly(item)) return 'View';
    if (item.disabled) return '(Off)';
    return null;
  };

  const handleNavClick = (item: NavItem) => {
    if (isNavItemDisabled(item)) {
      toast({
        title: 'Unavailable',
        description: 'Function Hall is disabled for this hotel.',
      });
      return;
    }
    handleNavigate(item.path);
  };

  // Function to check if item should be visible
  const shouldShowItem = (item: NavItem) => {
    if (item.path === '/reports' && isGoogleSheetsUser) {
      return false;
    }

    if (item.path === '/reports') {
      return isAdmin();
    }

    // Basic plan: show full main sidebar (Pro items inactive via proOnly flag)
    if (isBasicDbUser && item.proOnly) {
      return true;
    }
    if (
      isBasicDbUser &&
      mainNavItems.some((m) => m.path === item.path)
    ) {
      return true;
    }
    if (isBasicDbUser && (item.path === '/settings' || item.path === '/contact')) {
      return true;
    }

    if (isAdmin() && !isBasicUser) return true;

    if (item.requires) {
      return hasPermission(item.requires as any);
    }

    return true;
  };

  // Filter navigation items based on user permissions
  const filterNavItems = (items: NavItem[]) => {
    return items.filter((item) => shouldShowItem(item));
  };

  const incomeExpensesViewOnly = isBasicDbUser;

  const isActive = (path: string) => location.pathname === path;
  const isInIncomeExpenses = () =>
    location.pathname.startsWith('/collections') ||
    location.pathname.startsWith('/expenses') ||
    location.pathname.startsWith('/salaries') ||
    location.pathname.startsWith('/housekeeping');

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const NavSectionLabel = ({ children }: { children: ReactNode }) => (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75 first:pt-1">
      {children}
    </p>
  );

  const renderNavButton = (item: NavItem, compact = false) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const disabled = isNavItemDisabled(item);
    const isHighlighted = item.highlight;
    const badge = getNavDisabledBadge(item);

    return (
      <button
        key={item.path}
        type="button"
        onClick={() => handleNavClick(item)}
        className={cn(
          'group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200',
          compact ? 'py-2.5' : 'py-2.5',
          active && 'bg-primary text-primary-foreground shadow-md shadow-primary/15',
          !active && disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
          !active && !disabled && isHighlighted && 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:from-amber-600 hover:to-amber-700',
          !active && !disabled && !isHighlighted && 'text-foreground hover:bg-muted/70'
        )}
        title={getNavDisabledTitle(item)}
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            active && 'bg-primary-foreground/15',
            !active && isHighlighted && !disabled && 'bg-white/20',
            !active && !isHighlighted && 'bg-muted/80 group-hover:bg-muted'
          )}
        >
          <Icon className={cn('h-4 w-4', disabled && 'opacity-60')} />
        </span>
        <span className={cn('font-medium text-left leading-tight', compact ? 'text-sm' : 'text-sm')}>
          {item.label}
        </span>
        {badge && (
          <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
        {active && !badge && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
        )}
      </button>
    );
  };

  const renderIncomeExpensesSection = (compact = false) => {
    if (isGoogleSheetsUser && !isBasicDbUser) return null;

    const viewOnly = incomeExpensesViewOnly;
    const expanded = incomeExpensesOpen || isInIncomeExpenses();
    const sectionActive = isInIncomeExpenses();

    return (
      <div>
        <button
          type="button"
          onClick={() => setIncomeExpensesOpen(!incomeExpensesOpen)}
          className={cn(
            'group w-full flex items-center justify-between rounded-xl px-2.5 py-2.5 transition-all duration-200',
            sectionActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/70'
          )}
          title={viewOnly ? 'View-only on Basic plan' : ''}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-sm">
              <TrendingUp className="h-4 w-4" />
            </span>
            <span className={cn('font-medium', compact ? 'text-sm' : 'text-sm')}>Income & Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            {viewOnly && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                View
              </span>
            )}
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-primary/15 pl-3">
            {incomeExpensesItems
              .filter((item) => {
                if (isAdmin()) return true;
                if (item.requires) {
                  return hasPermission(item.requires as any);
                }
                return true;
              })
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  const renderReportsButton = (compact = false) => {
    if (!isAdmin() || isGoogleSheetsUser) return null;
    return renderNavButton(reportsNavItem, compact);
  };

  const SidebarContent = () => (
    <div className="flex h-full min-h-0 flex-col">
      {!isMobile ? (
        <div className="shrink-0 border-b border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm',
                logoLoading && 'bg-muted'
              )}
            >
              {logoLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {!logoLoading && hotelLogo && (
                <img
                  src={hotelLogo}
                  alt={currentUser?.name || 'Hotel Logo'}
                  className="h-full w-full object-contain p-1.5"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {!logoLoading && (!hotelLogo || isGoogleSheetsUser) && (
                <Logo
                  size="lg"
                  variant="icon"
                  quality="high"
                  className="ring-2 ring-primary/15"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold leading-tight">{currentUser?.name}</h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{currentUser?.hotelName}</p>
              <span
                className={cn(
                  'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  isBasicUser && 'bg-sky-100 text-sky-800',
                  !isBasicUser && isAdmin() && 'bg-violet-100 text-violet-800',
                  !isBasicUser && !isAdmin() && 'bg-emerald-100 text-emerald-800'
                )}
              >
                {isBasicUser ? 'Basic' : isAdmin() ? 'Admin' : 'Staff'}
              </span>
            </div>

            <div className="shrink-0">
              <CheckoutNotifications />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center border-b border-border/70 px-3 py-2.5 pr-12">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              isBasicUser && 'bg-sky-100 text-sky-800',
              !isBasicUser && isAdmin() && 'bg-violet-100 text-violet-800',
              !isBasicUser && !isAdmin() && 'bg-emerald-100 text-emerald-800'
            )}
          >
            {isBasicUser ? 'Basic plan' : isAdmin() ? 'Admin' : 'Staff'}
          </span>
        </div>
      )}

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3">
        <NavSectionLabel>Menu</NavSectionLabel>
        {filterNavItems(mainNavItems).map((item) => renderNavButton(item, isMobile))}

        {!(isGoogleSheetsUser && !isBasicDbUser) && (
          <>
            <NavSectionLabel>Finance</NavSectionLabel>
            {renderIncomeExpensesSection(isMobile)}
            {renderReportsButton(isMobile)}
          </>
        )}

        <NavSectionLabel>More</NavSectionLabel>
        {filterNavItems(otherNavItems as NavItem[]).map((item) => renderNavButton(item, isMobile))}
      </nav>

      <div className="shrink-0 border-t border-border/70 bg-muted/30 p-3">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="h-10 w-full justify-start gap-3 rounded-xl border-border/80 bg-background/80 text-sm hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <LogOut className="h-4 w-4" />
          </span>
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border/60 bg-card/90 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center gap-1.5 px-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl py-1 pr-1 text-left active:bg-muted/60"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background shadow-sm">
                {hotelLogo ? (
                  <img
                    src={hotelLogo}
                    alt={currentUser?.name || 'Hotel Logo'}
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  <Logo size="md" variant="icon" quality="high" className="ring-1 ring-primary/10" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold leading-tight">{currentUser?.name}</h2>
                <p className="truncate text-[10px] text-muted-foreground">{currentUser?.hotelName}</p>
              </div>
            </button>
            <CheckoutNotifications />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl border-border/70 bg-background/80"
              onClick={() => setIsOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {isMobile && (
        <MobileDraggableSidebar open={isOpen} onOpenChange={setIsOpen}>
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2.5 top-2.5 z-10 h-8 w-8 rounded-full border border-border/60 bg-background/95 shadow-sm"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarContent />
          </div>
        </MobileDraggableSidebar>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sticky top-0 flex h-screen w-[272px] shrink-0 flex-col border-r border-border/70 bg-card shadow-[2px_0_16px_rgba(0,0,0,0.04)]">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <div className={cn('flex min-h-screen min-w-0 flex-1 flex-col', isMobile && 'pt-14')}>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[100vw] overflow-x-hidden p-3 sm:p-5 md:p-8">
            <BasicPlanViewOnlyWrapper>{children}</BasicPlanViewOnlyWrapper>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;