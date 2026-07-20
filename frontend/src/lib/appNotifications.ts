/**
 * Backward-compatible facade — senior booking flows import from here.
 * All persistence goes through notificationStore.
 */
import { BOOKINGS_UPDATED_EVENT } from '@/lib/bookingCheckoutUtils';
import {
  BOOKING_CREATED_EVENT,
  CHECKOUT_REMINDER_EVENT,
  getPersistedBookingNotifications,
  getReadBookingNotificationIds,
  getReadCheckoutReminderIds,
  mapApiBookingToNotification,
  markBookingNotificationRead,
  markCheckoutReminderRead,
  mergeBookingNotifications,
  notifyBookingCreated as storeNotifyBookingCreated,
  type BookingNotification,
} from '@/lib/notificationStore';

export type { BookingNotification };
export {
  BOOKING_CREATED_EVENT,
  CHECKOUT_REMINDER_EVENT,
  getPersistedBookingNotifications,
  getReadBookingNotificationIds,
  getReadCheckoutReminderIds,
  mapApiBookingToNotification,
  markBookingNotificationRead,
  markCheckoutReminderRead,
  mergeBookingNotifications,
};

export function notifyBookingCreated(item: BookingNotification) {
  storeNotifyBookingCreated(item);
  window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
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

  return Date.now() - createdAt <= 72 * 60 * 60 * 1000;
}
