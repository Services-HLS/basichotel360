import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BOOKINGS_UPDATED_EVENT } from '@/lib/bookingCheckoutUtils';
import {
  BOOKING_CREATED_EVENT,
  CHECKOUT_REMINDER_EVENT,
  markBookingNotificationRead,
  markCheckoutReminderRead,
} from '@/lib/appNotifications';
import {
  getUnreadNotifications,
  markNotificationRead,
  clearAllNotificationBadges,
  MODULE_LABELS,
  MODULE_ORDER,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
  type NotificationModule,
} from '@/lib/notificationStore';
import {
  pollNotificationData,
  NOTIFICATION_POLL_INTERVAL_MS,
} from '@/lib/notificationPollingService';
import { getCurrentUser } from '@/lib/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const MODULE_BADGE_STYLES: Partial<Record<NotificationModule, string>> = {
  checkout: 'bg-orange-50 text-orange-800 border-orange-200',
  booking: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  housekeeping: 'bg-sky-50 text-sky-800 border-sky-200',
  function: 'bg-violet-50 text-violet-800 border-violet-200',
  advance: 'bg-amber-50 text-amber-800 border-amber-200',
  refund: 'bg-rose-50 text-rose-800 border-rose-200',
  account: 'bg-red-50 text-red-800 border-red-200',
  collections: 'bg-lime-50 text-lime-800 border-lime-200',
  wallet: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  staff: 'bg-slate-50 text-slate-800 border-slate-200',
  expense: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
};

type NotificationPanelProps = {
  compact: boolean;
  loading: boolean;
  clearing: boolean;
  grouped: Partial<Record<NotificationModule, AppNotification[]>>;
  onOpen: (item: AppNotification) => void;
  onViewAll: (module: NotificationModule) => void;
  onClearAll: () => void;
};

function NotificationSection({
  compact,
  module,
  items,
  onOpen,
  onViewAll,
}: {
  compact: boolean;
  module: NotificationModule;
  items: AppNotification[];
  onOpen: (item: AppNotification) => void;
  onViewAll: (module: NotificationModule) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-b last:border-b-0">
      <div className={cn('shrink-0 border-b bg-muted/30', compact ? 'px-2.5 py-1.5' : 'px-3 py-2')}>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className={cn('font-semibold truncate min-w-0 flex-1', compact ? 'text-xs' : 'text-sm')}>
            {MODULE_LABELS[module]}
          </p>
          <Badge variant="secondary" className="h-4 shrink-0 px-1 text-[9px]">
            {items.length}
          </Badge>
        </div>
        {module === 'checkout' && !compact && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Due now or within 1 hour — collect payment before auto-checkout
          </p>
        )}
      </div>
      <div className={cn('overflow-y-auto', compact ? 'max-h-28' : 'max-h-40')}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'w-full text-left border-b last:border-0 hover:bg-muted/60 transition-colors',
              compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'
            )}
            onClick={() => onOpen(item)}
          >
            <div className="flex items-center justify-between gap-1.5">
              <p
                className={cn(
                  'font-medium truncate min-w-0 flex-1',
                  compact ? 'text-xs leading-tight' : 'text-sm'
                )}
              >
                {item.title}
              </p>
              {item.badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 h-4 px-1 text-[9px]',
                    MODULE_BADGE_STYLES[module]
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <p
              className={cn(
                'text-muted-foreground truncate',
                compact ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1',
                module === 'checkout' && 'text-orange-700'
              )}
            >
              {item.message}
            </p>
          </button>
        ))}
      </div>
      <div className={cn('border-t', compact ? 'p-1.5' : 'p-2')}>
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', compact ? 'h-7 text-[10px]' : 'text-xs')}
          onClick={() => onViewAll(module)}
        >
          View all
        </Button>
      </div>
    </div>
  );
}

function NotificationPanel({
  compact,
  loading,
  clearing,
  grouped,
  onOpen,
  onViewAll,
  onClearAll,
}: NotificationPanelProps) {
  const total = MODULE_ORDER.reduce((sum, m) => sum + (grouped[m]?.length ?? 0), 0);
  const hasAny = total > 0;

  return (
    <div className={cn('flex min-h-0 flex-col', compact && 'max-h-[70dvh]')}>
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          compact ? 'max-h-[50dvh]' : 'max-h-[28rem]'
        )}
      >
        {loading && !hasAny ? (
          <div
            className={cn(
              'flex items-center justify-center text-muted-foreground',
              compact ? 'py-4' : 'py-8'
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin me-1.5" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : !hasAny ? (
          <p
            className={cn(
              'text-muted-foreground text-center',
              compact ? 'px-2.5 py-6 text-xs' : 'px-3 py-8 text-sm'
            )}
          >
            No new notifications
          </p>
        ) : (
          MODULE_ORDER.map((module) => (
            <NotificationSection
              key={module}
              compact={compact}
              module={module}
              items={grouped[module] ?? []}
              onOpen={onOpen}
              onViewAll={onViewAll}
            />
          ))
        )}
      </div>
      <div className={cn('shrink-0 border-t', compact ? 'p-1.5' : 'p-2')}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('w-full', compact ? 'h-7 text-[10px]' : 'text-xs')}
          disabled={loading || clearing}
          onClick={onClearAll}
        >
          {clearing ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Clearing…
            </>
          ) : (
            'Clear all'
          )}
        </Button>
      </div>
    </div>
  );
}

const MODULE_ROUTES: Record<NotificationModule, string> = {
  booking: '/bookings',
  checkout: '/bookings?status=checkout_soon',
  housekeeping: '/housekeeping',
  function: '/function-rooms',
  account: '/dashboard',
  advance: '/advance-bookings',
  refund: '/refund-management',
  collections: '/collections',
  wallet: '/wallet',
  staff: '/staff',
  expense: '/expenses',
};

export default function CheckoutNotifications() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [storeVersion, setStoreVersion] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>([]);

  const user = getCurrentUser();
  const canFetch = user?.source === 'database' && !!localStorage.getItem('authToken');
  const showBookingNotifications = canFetch;

  const loadNotifications = useCallback(async () => {
    if (!canFetch) return;
    setLoading(true);
    try {
      const result = await pollNotificationData({ showBookingNotifications });
      setLiveNotifications(result.liveNotifications);
    } finally {
      setLoading(false);
      setStoreVersion((v) => v + 1);
    }
  }, [canFetch, showBookingNotifications]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL_MS);
    const onUpdate = () => {
      setStoreVersion((v) => v + 1);
      void loadNotifications();
    };
    window.addEventListener(BOOKINGS_UPDATED_EVENT, onUpdate);
    window.addEventListener(BOOKING_CREATED_EVENT, onUpdate);
    window.addEventListener(CHECKOUT_REMINDER_EVENT, onUpdate);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(BOOKING_CREATED_EVENT, onUpdate);
      window.removeEventListener(CHECKOUT_REMINDER_EVENT, onUpdate);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    };
  }, [loadNotifications]);

  const grouped = useMemo(() => {
    void storeVersion;
    const stored = getUnreadNotifications();
    const liveIds = new Set(liveNotifications.map((n) => n.id));
    const merged = [
      ...liveNotifications,
      ...stored.filter((n) => !liveIds.has(n.id)),
    ];

    const result: Partial<Record<NotificationModule, AppNotification[]>> = {};
    for (const item of merged) {
      if (item.module === 'booking' && !showBookingNotifications) continue;
      if (item.module === 'account' || item.module === 'wallet') continue;
      if (!result[item.module]) result[item.module] = [];
      result[item.module]!.push(item);
    }
    return result;
  }, [storeVersion, showBookingNotifications, liveNotifications]);

  const count = useMemo(() => {
    return MODULE_ORDER.reduce((sum, m) => {
      if (m === 'booking' && !showBookingNotifications) return sum;
      return sum + (grouped[m]?.length ?? 0);
    }, 0);
  }, [grouped, showBookingNotifications]);

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      await clearAllNotificationBadges();
      await loadNotifications();
      setStoreVersion((v) => v + 1);
    } finally {
      setClearing(false);
    }
  }, [loadNotifications]);

  if (!canFetch) return null;

  const openItem = (item: AppNotification) => {
    if (item.id.startsWith('checkout-soon-') && item.entityId) {
      markCheckoutReminderRead(item.entityId);
    } else if (item.module === 'booking' && item.entityId) {
      markBookingNotificationRead(item.entityId);
    } else {
      markNotificationRead(item.id);
    }
    setOpen(false);
    setStoreVersion((v) => v + 1);
    navigate(item.route);
  };

  const viewAll = (module: NotificationModule) => {
    setOpen(false);
    navigate(MODULE_ROUTES[module]);
  };

  const panelProps: NotificationPanelProps = {
    compact: isMobile,
    loading,
    clearing,
    grouped,
    onOpen: openItem,
    onViewAll: viewAll,
    onClearAll: () => void handleClearAll(),
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void loadNotifications();
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative shrink-0', isMobile ? 'h-8 w-8' : 'h-9 w-9')}
      aria-label="App notifications"
      type="button"
    >
      <Bell className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
      {count > 0 && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-orange-600 font-bold text-white',
            isMobile
              ? '-top-0.5 -right-0.5 h-3.5 min-w-[0.875rem] px-0.5 text-[9px]'
              : '-top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 text-[10px]'
          )}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative shrink-0 h-8 w-8')}
          aria-label="App notifications"
          type="button"
          onClick={() => handleOpenChange(true)}
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-orange-600 px-0.5 text-[9px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            className={cn(
              'fixed bottom-0 left-0 right-0 top-auto z-[60] w-full max-w-full translate-x-0 translate-y-0 gap-0 rounded-t-xl rounded-b-none border-b-0 p-0',
              'max-h-[min(70dvh,520px)] overflow-hidden flex flex-col',
              '[&>button.absolute]:hidden'
            )}
          >
            <DialogHeader className="sticky top-0 z-10 shrink-0 flex flex-row items-center justify-between gap-2 border-b bg-background px-3 py-3 text-left">
              <DialogTitle className="text-sm font-semibold leading-none">
                Notifications
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <NotificationPanel {...panelProps} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[min(100vw-1.5rem,20rem)] p-0"
      >
        <NotificationPanel {...panelProps} />
      </PopoverContent>
    </Popover>
  );
}
