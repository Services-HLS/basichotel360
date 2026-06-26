import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  BOOKINGS_UPDATED_EVENT,
  formatCheckoutDisplay,
  getMinutesUntilCheckout,
  isUpcomingCheckoutBooking,
  type BookingLike,
} from '@/lib/bookingCheckoutUtils';
import {
  BOOKING_CREATED_EVENT,
  CHECKOUT_REMINDER_EVENT,
  getPersistedBookingNotifications,
  getReadBookingNotificationIds,
  getReadCheckoutReminderIds,
  isRecentUnreadBookingFromApi,
  mapApiBookingToNotification,
  markBookingNotificationRead,
  markCheckoutReminderRead,
  mergeBookingNotifications,
  type BookingNotification,
} from '@/lib/appNotifications';
import { isBasicDatabaseUser } from '@/lib/planUtils';
import { getCurrentUser } from '@/lib/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

type UpcomingCheckoutItem = {
  bookingId: string;
  customerName: string;
  roomNumber: string;
  checkoutLabel: string;
  minutesLeft: number;
};

function mapApiBooking(raw: any): BookingLike & UpcomingCheckoutItem {
  const bookingId = String(raw.id);
  const mapped: BookingLike & UpcomingCheckoutItem = {
    status: raw.status || 'booked',
    rawFromDate: raw.from_date,
    rawToDate: raw.to_date,
    fromTime: raw.from_time,
    toTime: raw.to_time,
    bookingId,
    customerName: raw.customer_name || 'Guest',
    roomNumber: raw.room_number || '—',
    checkoutLabel: '',
    minutesLeft: 0,
  };
  mapped.checkoutLabel = formatCheckoutDisplay(mapped);
  mapped.minutesLeft = getMinutesUntilCheckout(mapped) ?? 0;
  return mapped;
}

type NotificationPanelProps = {
  compact: boolean;
  loading: boolean;
  showBookingNotifications: boolean;
  bookingItems: BookingNotification[];
  checkoutItems: UpcomingCheckoutItem[];
  onOpenBooking: (bookingId: string) => void;
  onOpenCheckout: (bookingId: string) => void;
  onViewAllCheckout: () => void;
  onViewAllBookings: () => void;
};

function NotificationPanel({
  compact,
  loading,
  showBookingNotifications,
  bookingItems,
  checkoutItems,
  onOpenBooking,
  onOpenCheckout,
  onViewAllCheckout,
  onViewAllBookings,
}: NotificationPanelProps) {
  const count = checkoutItems.length + bookingItems.length;

  return (
    <div className={cn('flex min-h-0 flex-col', compact && 'max-h-[70dvh]')}>
      {showBookingNotifications && bookingItems.length > 0 && (
        <>
          <div className={cn('shrink-0 border-b', compact ? 'px-2.5 py-1.5' : 'px-3 py-2')}>
            <p className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')}>New bookings</p>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                Recently confirmed — tap to view in Bookings
              </p>
            )}
          </div>
          <div
            className={cn(
              'overflow-y-auto border-b',
              compact ? 'max-h-28' : 'max-h-48'
            )}
          >
            {bookingItems.map((item) => (
              <button
                key={`new-booking-${item.bookingId}`}
                type="button"
                className={cn(
                  'w-full text-left border-b last:border-0 hover:bg-muted/60 transition-colors',
                  compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'
                )}
                onClick={() => onOpenBooking(item.bookingId)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'font-medium truncate',
                        compact ? 'text-xs leading-tight' : 'text-sm'
                      )}
                    >
                      {item.customerName}
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        · R{item.roomNumber}
                      </span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 h-4 px-1 text-[9px] bg-emerald-50 text-emerald-800 border-emerald-200"
                  >
                    Booked
                  </Badge>
                </div>
                <p
                  className={cn(
                    'text-muted-foreground truncate',
                    compact ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1'
                  )}
                >
                  {compact
                    ? `${item.checkInLabel} → ${item.checkOutLabel}`
                    : `Check-in ${item.checkInLabel}`}
                </p>
                {!compact && (
                  <p className="text-[11px] text-muted-foreground">
                    Check-out {item.checkOutLabel}
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={cn('shrink-0 border-b', compact ? 'px-2.5 py-1.5' : 'px-3 py-2')}>
        <p className={cn('font-semibold', compact ? 'text-xs' : 'text-sm')}>Checkout soon</p>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            Within 1 hour — collect payment or add charges before auto-checkout
          </p>
        )}
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          compact ? 'max-h-36' : 'max-h-72'
        )}
      >
        {loading && checkoutItems.length === 0 && bookingItems.length === 0 ? (
          <div
            className={cn(
              'flex items-center justify-center text-muted-foreground',
              compact ? 'py-4' : 'py-8'
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin me-1.5" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : checkoutItems.length === 0 ? (
          <p
            className={cn(
              'text-muted-foreground text-center',
              compact ? 'px-2.5 py-3 text-xs' : 'px-3 py-6 text-sm'
            )}
          >
            No checkouts in the next hour
          </p>
        ) : (
          checkoutItems.map((item) => (
            <button
              key={item.bookingId}
              type="button"
              className={cn(
                'w-full text-left border-b last:border-0 hover:bg-muted/60 transition-colors',
                compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'
              )}
              onClick={() => onOpenCheckout(item.bookingId)}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'font-medium truncate',
                      compact ? 'text-xs leading-tight' : 'text-sm'
                    )}
                  >
                    {item.customerName}
                    <span className="font-normal text-muted-foreground">
                      {' '}
                      · R{item.roomNumber}
                    </span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 h-4 px-1 text-[9px] bg-amber-50 text-amber-800 border-amber-200"
                >
                  {item.minutesLeft <= 60 ? `${item.minutesLeft}m` : 'Soon'}
                </Badge>
              </div>
              <p
                className={cn(
                  'text-amber-800 truncate',
                  compact ? 'text-[10px] mt-0.5' : 'text-[11px] mt-1'
                )}
              >
                {item.checkoutLabel}
              </p>
            </button>
          ))
        )}
      </div>

      {count > 0 && (
        <div className={cn('shrink-0 border-t', compact ? 'p-1.5 space-y-1' : 'p-2 space-y-1')}>
          {checkoutItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className={cn('w-full', compact ? 'h-7 text-[10px]' : 'text-xs')}
              onClick={onViewAllCheckout}
            >
              Checkout soon ({checkoutItems.length})
            </Button>
          )}
          {showBookingNotifications && bookingItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className={cn('w-full', compact ? 'h-7 text-[10px]' : 'text-xs')}
              onClick={onViewAllBookings}
            >
              All bookings
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckoutNotifications() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<UpcomingCheckoutItem[]>([]);
  const [bookingItems, setBookingItems] = useState<BookingNotification[]>([]);

  const user = getCurrentUser();
  const canFetch = user?.source === 'database' && !!localStorage.getItem('authToken');
  const showBookingNotifications = isBasicDatabaseUser(user);

  const loadNotifications = useCallback(async () => {
    if (!canFetch) {
      setCheckoutItems([]);
      setBookingItems([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to load bookings');
      const json = await res.json();
      const rows = json.data || [];

      const readReminderIds = getReadCheckoutReminderIds();
      const upcomingCheckout = rows
        .map(mapApiBooking)
        .filter(
          (b) =>
            isUpcomingCheckoutBooking(b) && !readReminderIds.has(b.bookingId)
        );
      setCheckoutItems(upcomingCheckout);

      if (showBookingNotifications) {
        const readIds = getReadBookingNotificationIds();
        const fromApi = rows
          .filter((raw: Record<string, unknown>) =>
            isRecentUnreadBookingFromApi(raw, readIds)
          )
          .map(mapApiBookingToNotification);
        const merged = mergeBookingNotifications(
          getPersistedBookingNotifications(),
          fromApi,
          readIds
        );
        setBookingItems(merged);
      } else {
        setBookingItems([]);
      }
    } catch {
      setCheckoutItems([]);
      if (showBookingNotifications) {
        const readIds = getReadBookingNotificationIds();
        setBookingItems(
          mergeBookingNotifications(getPersistedBookingNotifications(), [], readIds)
        );
      } else {
        setBookingItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [canFetch, showBookingNotifications]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30_000);
    const onUpdate = () => loadNotifications();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, onUpdate);
    window.addEventListener(BOOKING_CREATED_EVENT, onUpdate);
    window.addEventListener(CHECKOUT_REMINDER_EVENT, onUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(BOOKING_CREATED_EVENT, onUpdate);
      window.removeEventListener(CHECKOUT_REMINDER_EVENT, onUpdate);
    };
  }, [loadNotifications]);

  if (!canFetch) return null;

  const count = checkoutItems.length + bookingItems.length;

  const openBooking = (bookingId: string) => {
    markBookingNotificationRead(bookingId);
    setOpen(false);
    setBookingItems((prev) => prev.filter((item) => item.bookingId !== bookingId));
    navigate(`/bookings?focus=${bookingId}`);
  };

  const openCheckout = (bookingId: string) => {
    markCheckoutReminderRead(bookingId);
    setOpen(false);
    setCheckoutItems((prev) => prev.filter((item) => item.bookingId !== bookingId));
    navigate(`/bookings?status=checkout_soon&focus=${bookingId}`);
  };

  const panelProps: NotificationPanelProps = {
    compact: isMobile,
    loading,
    showBookingNotifications,
    bookingItems,
    checkoutItems,
    onOpenBooking: openBooking,
    onOpenCheckout: openCheckout,
    onViewAllCheckout: () => {
      setOpen(false);
      navigate('/bookings?status=checkout_soon');
    },
    onViewAllBookings: () => {
      setOpen(false);
      navigate('/bookings');
    },
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative shrink-0', isMobile ? 'h-8 w-8' : 'h-9 w-9')}
      aria-label="App notifications"
      onClick={() => {
        setOpen(true);
        loadNotifications();
      }}
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
        {triggerButton}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className={cn(
              'fixed bottom-0 left-0 right-0 top-auto z-[60] w-full max-w-full translate-x-0 translate-y-0 gap-0 rounded-t-xl rounded-b-none border-b-0 p-0',
              'max-h-[min(70dvh,520px)] overflow-hidden'
            )}
          >
            <DialogHeader className="shrink-0 space-y-0 border-b px-3 py-2 pr-10 text-left">
              <DialogTitle className="text-sm font-semibold">Notifications</DialogTitle>
            </DialogHeader>
            <NotificationPanel {...panelProps} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[min(100vw-1.5rem,18rem)] p-0"
      >
        <NotificationPanel {...panelProps} />
      </PopoverContent>
    </Popover>
  );
}
