import {
  formatCheckoutDisplay,
  formatCheckInDisplay,
  getBookingCheckInMoment,
  getBookingCheckoutMoment,
  getMinutesUntilCheckIn,
  getMinutesUntilCheckout,
  isCheckInTodayBooking,
  isPendingCheckoutBooking,
  isUpcomingCheckInBooking,
  isUpcomingCheckoutBooking,
  type BookingLike,
} from '@/lib/bookingCheckoutUtils';
import {
  getPersistedBookingNotifications,
  getReadBookingNotificationIds,
  getReadCheckoutReminderIds,
  mapApiBookingToNotification,
  mergeBookingNotifications,
} from '@/lib/appNotifications';
import type { AppNotification } from '@/lib/notificationStore';
import {
  getReadNotificationIds,
  SHOW_ACCOUNT_NOTIFICATIONS,
} from '@/lib/notificationStore';
import { isSubscriptionExpired } from '@/lib/subscription';
import { dateOnly, localDateStr, localTomorrowStr } from '@/lib/dateUtils';
import {
  computeTodayOccupancy,
  isFullOccupancy,
  isLowOccupancy,
} from '@/lib/occupancyAlertUtils';
import { scheduleBookingReminders, scheduleTrialReminders } from '@/lib/localNotificationService';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
/** Match senior dev poll cadence for checkout reminders */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export type NotificationPollCounts = {
  pendingCheckout: number;
  newBookings: number;
  overdueHousekeeping: number;
  pendingRefunds: number;
  functionToday: number;
  advanceAlerts: number;
  occupancyAlerts: number;
  collectionsPending: number;
  expenseAlerts: number;
  totalUnread: number;
};

export type NotificationPollResult = {
  checkoutItems: Array<{
    bookingId: string;
    customerName: string;
    roomNumber: string;
    checkoutLabel: string;
  }>;
  bookingItems: ReturnType<typeof mapApiBookingToNotification>[];
  liveNotifications: AppNotification[];
  /** All active poll notification ids (for mark-all-read) */
  allNotificationIds: string[];
  grouped: Partial<Record<string, AppNotification[]>>;
  counts: NotificationPollCounts;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function todayStr(): string {
  return localDateStr();
}

function tomorrowStr(): string {
  return localTomorrowStr();
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${API_URL}${path}${separator}_nc=${Date.now()}`;
    const res = await fetch(url, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    // 304 has no body — treat as failed fetch so caller does not use stale empty data
    if (!res.ok || res.status === 304) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function mapBookingRow(raw: Record<string, unknown>): BookingLike & {
  bookingId: string;
  customerName: string;
  roomNumber: string;
  checkoutLabel: string;
} {
  const bookingId = String(raw.id);
  const mapped: BookingLike & {
    bookingId: string;
    customerName: string;
    roomNumber: string;
    checkoutLabel: string;
  } = {
    status: String(raw.status || 'booked'),
    rawFromDate: raw.from_date as string | undefined,
    rawToDate: raw.to_date as string | undefined,
    fromTime: raw.from_time as string | undefined,
    toTime: raw.to_time as string | undefined,
    bookingId,
    customerName: String(raw.customer_name || 'Guest'),
    roomNumber: String(raw.room_number || '—'),
    checkoutLabel: '',
  };
  mapped.checkoutLabel = formatCheckoutDisplay(mapped);
  return mapped;
}

type HousekeepingRow = {
  id: number;
  room_number: string;
  status: string;
  cleaning_type?: string;
  cleaning_date?: string;
};

type AdvanceRow = {
  id: number | string;
  customer_name?: string;
  room_number?: string;
  room_id?: number | string;
  from_date?: string;
  advance_expiry_date?: string;
  status?: string;
};

type FunctionRow = {
  id: number | string;
  function_room_name?: string;
  hall_name?: string;
  room_name?: string;
  room_number?: string;
  customer_name?: string;
  event_date?: string;
  booking_date?: string;
  check_in_date?: string;
  from_date?: string;
  created_at?: string;
  status?: string;
};

type RefundRow = {
  id: number | string;
  customer_name?: string;
  room_number?: string;
  status?: string;
  booking_type?: string;
};

type RefundApiData = {
  room_bookings?: RefundRow[];
  advance_bookings?: RefundRow[];
  function_bookings?: RefundRow[];
};

function flattenRefundRows(data: RefundApiData | RefundRow[] | null | undefined): RefundRow[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [
    ...(data.room_bookings ?? []),
    ...(data.advance_bookings ?? []),
    ...(data.function_bookings ?? []),
  ];
}

const EMPTY_RESULT: NotificationPollResult = {
  checkoutItems: [],
  bookingItems: [],
  liveNotifications: [],
  allNotificationIds: [],
  grouped: {},
  counts: {
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
  },
};

export async function pollNotificationData(options?: {
  showBookingNotifications?: boolean;
}): Promise<NotificationPollResult> {
  const showBookingNotifications = options?.showBookingNotifications ?? true;
  const today = todayStr();
  const tomorrow = tomorrowStr();

  try {
  const [bookingsRes, roomsRes, housekeepingRes, advanceRes, functionRes, refundRes, collectionsRes] =
    await Promise.all([
      fetchJson<{ data?: Record<string, unknown>[] }>('/bookings'),
      fetchJson<{ data?: Array<{ id?: number | string }> }>('/rooms?limit=1000'),
      fetchJson<{ success?: boolean; data?: { records?: HousekeepingRow[] } }>(
        `/housekeeping?date=${today}`
      ),
      fetchJson<{ data?: AdvanceRow[] }>(`/advance-bookings?t=${Date.now()}`),
      fetchJson<{ data?: FunctionRow[] }>('/function-rooms/bookings/with-rooms'),
      fetchJson<{ data?: RefundApiData | RefundRow[] }>('/refunds/cancellable-bookings'),
      fetchJson<{
        success?: boolean;
        data?: { summary?: { pending_handover?: number } };
      }>(`/collections?startDate=${today}&endDate=${today}&limit=1`),
    ]);

  const rows = bookingsRes?.data ?? [];
  const roomRows = Array.isArray(roomsRes?.data) ? roomsRes.data : [];
  const hkRecords = housekeepingRes?.data?.records ?? [];
  const advanceRows = Array.isArray(advanceRes?.data) ? advanceRes.data : [];
  const functionRows = Array.isArray(functionRes?.data) ? functionRes.data : [];
  const refundRows = flattenRefundRows(refundRes?.data);

  const mappedBookings = rows.map((raw) => mapBookingRow(raw));

  const checkoutItems = mappedBookings
    .filter(isPendingCheckoutBooking)
    .map((item) => ({
      bookingId: item.bookingId,
      customerName: item.customerName,
      roomNumber: item.roomNumber,
      checkoutLabel: item.checkoutLabel,
    }));

  const readReminderIds = getReadCheckoutReminderIds();
  const checkoutSoonItems = mappedBookings.filter(
    (item) =>
      isUpcomingCheckoutBooking(item) && !readReminderIds.has(item.bookingId)
  );

  const readIds = getReadBookingNotificationIds();
  const fromApiBookings = showBookingNotifications
    ? rows
        .filter((raw) => {
          const id = String(raw.id ?? '');
          const status = String(raw.status || '').toLowerCase();
          if (status !== 'booked' || readIds.has(id)) return false;
          const createdAt = raw.created_at
            ? new Date(String(raw.created_at)).getTime()
            : 0;
          return createdAt && Date.now() - createdAt <= 72 * 60 * 60 * 1000;
        })
        .map(mapApiBookingToNotification)
    : [];

  const bookingItems = showBookingNotifications
    ? mergeBookingNotifications(
        getPersistedBookingNotifications(),
        fromApiBookings,
        readIds
      )
    : [];

  const derived: AppNotification[] = [];

  const checkInSoonItems = mappedBookings.filter(isUpcomingCheckInBooking);
  const checkInSoonIds = new Set(checkInSoonItems.map((b) => b.bookingId));

  for (const item of checkInSoonItems) {
    const minutes = getMinutesUntilCheckIn(item) ?? 0;
    derived.push({
      id: `checkin-soon-${item.bookingId}`,
      module: 'booking',
      title: item.customerName,
      message: `Arriving in ${minutes}m · Room ${item.roomNumber}`,
      route: `/bookings?focus=${item.bookingId}`,
      entityId: item.bookingId,
      createdAt: new Date().toISOString(),
      priority: 'high',
      badge: minutes <= 60 ? `${minutes}m` : 'Soon',
    });
  }

  for (const item of mappedBookings) {
    if (!isCheckInTodayBooking(item) || checkInSoonIds.has(item.bookingId)) continue;
    derived.push({
      id: `checkin-today-${item.bookingId}`,
      module: 'booking',
      title: item.customerName,
      message: `Check-in today · Room ${item.roomNumber} · ${formatCheckInDisplay(item)}`,
      route: `/bookings?focus=${item.bookingId}`,
      entityId: item.bookingId,
      createdAt: new Date().toISOString(),
      priority: 'high',
      badge: 'Today',
    });
  }

  for (const item of checkoutSoonItems) {
    const minutes = getMinutesUntilCheckout(item) ?? 0;
    derived.push({
      id: `checkout-soon-${item.bookingId}`,
      module: 'checkout',
      title: item.customerName,
      message: `Room ${item.roomNumber} · ${item.checkoutLabel}`,
      route: `/bookings?status=checkout_soon&focus=${item.bookingId}`,
      entityId: item.bookingId,
      createdAt: new Date().toISOString(),
      priority: 'high',
      badge: minutes <= 60 ? `${minutes}m` : 'Soon',
    });
  }

  for (const item of checkoutItems) {
    derived.push({
      id: `checkout-${item.bookingId}`,
      module: 'checkout',
      title: item.customerName,
      message: `Room ${item.roomNumber} · ${item.checkoutLabel}`,
      route: `/bookings?status=pending_checkout&focus=${item.bookingId}`,
      entityId: item.bookingId,
      createdAt: new Date().toISOString(),
      priority: 'high',
      badge: 'Due',
    });
  }

  const now = Date.now();
  for (const task of hkRecords) {
    const isOverdue =
      (task.status === 'pending' || task.status === 'delayed') &&
      task.cleaning_date &&
      new Date(`${task.cleaning_date}T23:59:59`).getTime() < now;

    if (task.status === 'pending' || task.status === 'delayed' || isOverdue) {
      derived.push({
        id: `housekeeping-${task.id}`,
        module: 'housekeeping',
        title: `Room ${task.room_number}`,
        message: isOverdue
          ? `Overdue ${task.cleaning_type ?? 'cleaning'} task`
          : `${task.cleaning_type ?? 'Cleaning'} — ${task.status}`,
        route: '/housekeeping',
        entityId: String(task.id),
        createdAt: new Date().toISOString(),
        priority: isOverdue ? 'high' : 'normal',
        badge: isOverdue ? 'Overdue' : task.status,
      });
    }
  }

  for (const ab of advanceRows) {
    const fromDate = dateOnly(ab.from_date);
    const expiryDate = dateOnly(ab.advance_expiry_date);
    const status = String(ab.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'converted' || status === 'completed') continue;

    const id = String(ab.id);
    if (fromDate === today) {
      derived.push({
        id: `advance-today-${id}`,
        module: 'advance',
        title: String(ab.customer_name || 'Guest'),
        message: `Check-in today · Room ${ab.room_number ?? '—'}`,
        route: '/advance-bookings',
        entityId: id,
        createdAt: new Date().toISOString(),
        priority: 'high',
        badge: 'Today',
      });
    }

    if (fromDate === tomorrow) {
      derived.push({
        id: `advance-tomorrow-${id}`,
        module: 'advance',
        title: String(ab.customer_name || 'Guest'),
        message: `Check-in tomorrow · Room ${ab.room_number ?? '—'}`,
        route: '/advance-bookings',
        entityId: id,
        createdAt: new Date().toISOString(),
        priority: 'high',
        badge: 'Tomorrow',
      });
    }

    if (expiryDate) {
      const expiryMs = new Date(`${expiryDate}T23:59:59`).getTime();
      if (expiryMs > now && expiryMs - now <= 24 * 60 * 60 * 1000) {
        derived.push({
          id: `advance-expiring-${id}`,
          module: 'advance',
          title: String(ab.customer_name || 'Guest'),
          message: `Advance booking expiring soon · Room ${ab.room_number ?? '—'}`,
          route: '/advance-bookings',
          entityId: id,
          createdAt: new Date().toISOString(),
          priority: 'normal',
          badge: 'Expiring',
        });
      }
    }
  }

  for (const fb of functionRows) {
    const eventDate = dateOnly(
      fb.booking_date || fb.check_in_date || fb.event_date || fb.from_date
    );
    const status = String(fb.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'completed' || !eventDate) continue;

    const id = String(fb.id);
    const hallName = String(
      fb.function_room_name || fb.room_name || fb.hall_name || fb.room_number || 'Function hall'
    );
    const createdAt = fb.created_at ? new Date(String(fb.created_at)).getTime() : 0;
    const isRecentlyCreated =
      Boolean(createdAt) && now - createdAt <= 72 * 60 * 60 * 1000;

    let badge: string | null = null;
    let message = '';
    let priority: AppNotification['priority'] = 'normal';

    if (eventDate === today) {
      badge = 'Today';
      message = fb.customer_name ? `${fb.customer_name} · Today` : 'Event today';
      priority = 'high';
    } else if (eventDate === tomorrow) {
      badge = 'Tomorrow';
      message = fb.customer_name
        ? `${fb.customer_name} · Tomorrow`
        : 'Event tomorrow';
      priority = 'high';
    } else if (isRecentlyCreated) {
      badge = 'New';
      message = fb.customer_name
        ? `${fb.customer_name} · ${eventDate}`
        : `Event on ${eventDate}`;
    }

    if (!badge) continue;

    derived.push({
      id: `function-${id}`,
      module: 'function',
      title: hallName,
      message,
      route: '/function-rooms',
      entityId: id,
      createdAt: new Date().toISOString(),
      priority,
      badge,
    });
  }

  for (const rb of refundRows) {
    const id = String(rb.id);
    derived.push({
      id: `refund-${id}`,
      module: 'refund',
      title: String(rb.customer_name || 'Guest'),
      message: `Cancellation pending · Room ${rb.room_number ?? '—'}`,
      route: '/refund-management',
      entityId: id,
      createdAt: new Date().toISOString(),
      priority: 'normal',
      badge: 'Refund',
    });
  }

  for (const b of bookingItems) {
    const bookingId = `booking-${b.bookingId}`;
    if (derived.some((n) => n.id === bookingId || n.entityId === b.bookingId)) continue;
    derived.push({
      id: bookingId,
      module: 'booking',
      title: b.customerName,
      message: `Room ${b.roomNumber} · Check-in ${b.checkInLabel}`,
      route: `/bookings?focus=${b.bookingId}`,
      entityId: b.bookingId,
      createdAt: b.createdAt,
      priority: 'normal',
      badge: 'Booked',
    });
  }

  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (SHOW_ACCOUNT_NOTIFICATIONS && user?.trial_expiry_date) {
      scheduleTrialReminders(user.trial_expiry_date);

      const expiry = new Date(user.trial_expiry_date);
      if (!Number.isNaN(expiry.getTime())) {
        const msLeft = expiry.getTime() - now;
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

        if (isSubscriptionExpired(user)) {
          derived.push({
            id: 'account-subscription-expired',
            module: 'account',
            title: 'Subscription expired',
            message: 'Your trial or subscription has expired. Upgrade to restore full access.',
            route: '/upgrade',
            createdAt: new Date().toISOString(),
            priority: 'high',
            badge: 'Expired',
          });
        } else if (daysLeft > 0 && daysLeft <= 3) {
          derived.push({
            id: 'account-trial-expiring',
            module: 'account',
            title: 'Trial expiring soon',
            message: `Your trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
            route: '/upgrade',
            createdAt: new Date().toISOString(),
            priority: 'high',
            badge: `${daysLeft}d`,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  if (SHOW_ACCOUNT_NOTIFICATIONS) {
    const occupancy = computeTodayOccupancy(roomRows, rows, advanceRows);

    if (isFullOccupancy(occupancy)) {
      derived.push({
        id: 'account-full-occupancy',
        module: 'account',
        title: 'All rooms occupied',
        message: `All ${occupancy.totalRooms} rooms are occupied today — no availability`,
        route: '/rooms',
        createdAt: new Date().toISOString(),
        priority: 'high',
        badge: 'Full',
      });
    } else if (isLowOccupancy(occupancy)) {
      derived.push({
        id: 'account-low-occupancy',
        module: 'account',
        title: 'Low occupancy today',
        message: `${occupancy.occupancyPercent}% occupied · ${occupancy.availableRooms} of ${occupancy.totalRooms} rooms available`,
        route: '/dashboard',
        createdAt: new Date().toISOString(),
        priority: 'normal',
        badge: 'Low',
      });
    }
  }

  const pendingHandover = Number(collectionsRes?.data?.summary?.pending_handover ?? 0);
  if (pendingHandover > 0) {
    derived.push({
      id: 'collections-pending-handover',
      module: 'collections',
      title: 'Uncollected cash handover',
      message: `₹${pendingHandover.toLocaleString('en-IN')} cash pending handover`,
      route: '/collections',
      createdAt: new Date().toISOString(),
      priority: 'high',
      badge: 'Pending',
    });
  }

  const nowDate = new Date();
  const lastDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();
  if (nowDate.getDate() >= lastDayOfMonth - 4) {
    derived.push({
      id: 'expense-salary-due-reminder',
      module: 'expense',
      title: 'Salary payments due',
      message: 'Review and process monthly salary payments before month end',
      route: '/salaries',
      createdAt: new Date().toISOString(),
      priority: 'normal',
      badge: 'Due',
    });
  }

  scheduleBookingReminders(
    rows.map((raw) => ({
      id: String(raw.id),
      customerName: String(raw.customer_name || 'Guest'),
      roomNumber: String(raw.room_number || '—'),
      checkInMoment: getBookingCheckInMoment(mapBookingRow(raw)),
      checkoutMoment: getBookingCheckoutMoment(mapBookingRow(raw)),
      status: String(raw.status || ''),
    }))
  );

  const dismissedIds = getReadNotificationIds();
  const visibleDerived = derived.filter((n) => !dismissedIds.has(n.id));

  const visibleGrouped: Partial<Record<string, AppNotification[]>> = {};
  for (const n of visibleDerived) {
    if (!visibleGrouped[n.module]) visibleGrouped[n.module] = [];
    visibleGrouped[n.module]!.push(n);
  }

  const countModule = (module: string) =>
    visibleDerived.filter((n) => n.module === module).length;

  const occupancyVisible = visibleDerived.some(
    (n) => n.id === 'account-low-occupancy' || n.id === 'account-full-occupancy'
  )
    ? 1
    : 0;
  const collectionsVisible = visibleDerived.some(
    (n) => n.id === 'collections-pending-handover'
  )
    ? 1
    : 0;
  const expenseVisible = visibleDerived.some(
    (n) => n.id === 'expense-salary-due-reminder'
  )
    ? 1
    : 0;
  const overdueHousekeepingVisible = visibleDerived.filter(
    (n) => n.module === 'housekeeping' && n.badge === 'Overdue'
  ).length;

  return {
    checkoutItems,
    bookingItems,
    liveNotifications: visibleDerived,
    allNotificationIds: derived.map((n) => n.id),
    grouped: visibleGrouped,
    counts: {
      pendingCheckout: countModule('checkout'),
      newBookings: visibleDerived.filter(
        (n) => n.module === 'booking' && n.id.startsWith('booking-')
      ).length,
      overdueHousekeeping: overdueHousekeepingVisible,
      pendingRefunds: countModule('refund'),
      functionToday: countModule('function'),
      advanceAlerts: countModule('advance'),
      occupancyAlerts: occupancyVisible,
      collectionsPending: collectionsVisible,
      expenseAlerts: expenseVisible,
      totalUnread: visibleDerived.length,
    },
  };
  } catch (error) {
    console.warn('Notification poll failed:', error);
    return EMPTY_RESULT;
  }
}
