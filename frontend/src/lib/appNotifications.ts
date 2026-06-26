import {
  BOOKINGS_UPDATED_EVENT,
  formatCheckInDisplay,
  formatCheckoutDisplay,
  type BookingLike,
} from '@/lib/bookingCheckoutUtils';

export type BookingNotification = {
  bookingId: string;
  customerName: string;
  roomNumber: string;
  checkInLabel: string;
  checkOutLabel: string;
  createdAt: string;
};

const STORAGE_KEY = 'hms-booking-notifications';
const READ_KEY = 'hms-booking-notifications-read';
const CHECKOUT_REMINDER_READ_KEY = 'hms-checkout-reminder-read';
export const BOOKING_CREATED_EVENT = 'hms-booking-created';
export const CHECKOUT_REMINDER_EVENT = 'hms-checkout-reminder';

/** Show API-sourced booking alerts for this long after creation */
const RECENT_BOOKING_MS = 72 * 60 * 60 * 1000;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getPersistedBookingNotifications(): BookingNotification[] {
  return safeParse<BookingNotification[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function getReadBookingNotificationIds(): Set<string> {
  const ids = safeParse<string[]>(localStorage.getItem(READ_KEY), []);
  return new Set(ids);
}

export function markBookingNotificationRead(bookingId: string) {
  const read = getReadBookingNotificationIds();
  read.add(String(bookingId));
  const trimmed = [...read].slice(-200);
  localStorage.setItem(READ_KEY, JSON.stringify(trimmed));
}

export function notifyBookingCreated(item: BookingNotification) {
  const existing = getPersistedBookingNotifications();
  const merged = [
    item,
    ...existing.filter((n) => n.bookingId !== item.bookingId),
  ].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent(BOOKING_CREATED_EVENT, { detail: item }));
  window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
}

export function mapApiBookingToNotification(raw: Record<string, unknown>): BookingNotification {
  const bookingLike: BookingLike = {
    status: String(raw.status || 'booked'),
    rawFromDate: raw.from_date as string | undefined,
    rawToDate: raw.to_date as string | undefined,
    fromTime: raw.from_time as string | undefined,
    toTime: raw.to_time as string | undefined,
  };

  return {
    bookingId: String(raw.id),
    customerName: String(raw.customer_name || 'Guest'),
    roomNumber: String(raw.room_number || '—'),
    checkInLabel: formatCheckInDisplay(bookingLike),
    checkOutLabel: formatCheckoutDisplay(bookingLike),
    createdAt:
      (raw.created_at as string | undefined) || new Date().toISOString(),
  };
}

export function isRecentUnreadBookingFromApi(
  raw: Record<string, unknown>,
  readIds: Set<string>
): boolean {
  const id = String(raw.id ?? '');
  if (!id || readIds.has(id)) return false;

  const status = String(raw.status || '').toLowerCase();
  if (status !== 'booked') return false;

  const createdAt = raw.created_at ? new Date(String(raw.created_at)).getTime() : 0;
  if (!createdAt || Number.isNaN(createdAt)) return false;

  return Date.now() - createdAt <= RECENT_BOOKING_MS;
}

export function getReadCheckoutReminderIds(): Set<string> {
  const ids = safeParse<string[]>(localStorage.getItem(CHECKOUT_REMINDER_READ_KEY), []);
  return new Set(ids);
}

export function markCheckoutReminderRead(bookingId: string) {
  const read = getReadCheckoutReminderIds();
  read.add(String(bookingId));
  const trimmed = [...read].slice(-200);
  localStorage.setItem(CHECKOUT_REMINDER_READ_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent(CHECKOUT_REMINDER_EVENT));
}

export function mergeBookingNotifications(
  persisted: BookingNotification[],
  fromApi: BookingNotification[],
  readIds: Set<string>
): BookingNotification[] {
  const byId = new Map<string, BookingNotification>();

  for (const item of [...fromApi, ...persisted]) {
    if (readIds.has(item.bookingId)) continue;
    byId.set(item.bookingId, item);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
