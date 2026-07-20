import { useCallback, useEffect, useState } from 'react';
import {
  NOTIFICATIONS_UPDATED_EVENT,
  getUnreadCountByModule,
  type NotificationModule,
} from '@/lib/notificationStore';
import {
  NOTIFICATION_POLL_INTERVAL_MS,
  pollNotificationData,
  type NotificationPollCounts,
} from '@/lib/notificationPollingService';
import { getCurrentUser } from '@/lib/storage';

export type SidebarNotificationBadges = {
  '/bookings': number;
  '/housekeeping': number;
  '/refund-management': number;
  '/function-rooms': number;
  '/advance-bookings': number;
  '/dashboard': number;
  '/collections': number;
  '/expenses': number;
  '/salaries': number;
  '/staff': number;
};

const EMPTY_COUNTS: NotificationPollCounts = {
  pendingCheckout: 0,
  newBookings: 0,
  overdueHousekeeping: 0,
  pendingRefunds: 0,
  functionToday: 0,
  advanceAlerts: 0,
  occupancyAlerts: 0,
  collectionsPending: 0,
  expenseAlerts: 0,
  totalUnread: 0,
};

export function useNotificationCounts(): {
  counts: NotificationPollCounts;
  badges: SidebarNotificationBadges;
  moduleCounts: Record<NotificationModule, number>;
  refresh: () => Promise<void>;
} {
  const [counts, setCounts] = useState<NotificationPollCounts>(EMPTY_COUNTS);
  const [moduleCounts, setModuleCounts] = useState(getUnreadCountByModule());

  const user = getCurrentUser();
  const canFetch = user?.source === 'database' && !!localStorage.getItem('authToken');
  const showBookingNotifications = canFetch;

  const refresh = useCallback(async () => {
    if (!canFetch) {
      setCounts(EMPTY_COUNTS);
      setModuleCounts(getUnreadCountByModule());
      return;
    }

    try {
      const result = await pollNotificationData({ showBookingNotifications });
      setCounts(result.counts);
      setModuleCounts(getUnreadCountByModule());
    } catch {
      setModuleCounts(getUnreadCountByModule());
    }
  }, [canFetch, showBookingNotifications]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, NOTIFICATION_POLL_INTERVAL_MS);
    const onUpdate = () => {
      setModuleCounts(getUnreadCountByModule());
      void refresh();
    };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    };
  }, [refresh]);

  const badges: SidebarNotificationBadges = {
    '/bookings':
      counts.pendingCheckout + counts.newBookings + moduleCounts.booking + moduleCounts.checkout,
    '/housekeeping': counts.overdueHousekeeping + moduleCounts.housekeeping,
    '/refund-management': counts.pendingRefunds + moduleCounts.refund,
    '/function-rooms': counts.functionToday + moduleCounts.function,
    '/advance-bookings': counts.advanceAlerts + moduleCounts.advance,
    '/dashboard': 0,
    '/collections': counts.collectionsPending + moduleCounts.collections,
    '/expenses': counts.expenseAlerts + moduleCounts.expense,
    '/salaries': counts.expenseAlerts,
    '/staff': moduleCounts.staff,
  };

  return { counts, badges, moduleCounts, refresh };
}

