import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type ScheduleOptions,
} from '@capacitor/local-notifications';

const CHECKIN_REMINDER_MS = 60 * 60 * 1000;
const CHECKOUT_REMINDER_MS = 30 * 60 * 1000;
const TRIAL_REMINDER_DAYS = [3, 1];
/** Status-bar icon — white silhouette (Android requirement) */
const NOTIFICATION_SMALL_ICON = 'ic_stat_hotel360';
/** Full-color brand logo from public/newlogo.png */
const NOTIFICATION_LARGE_ICON = 'ic_notification_logo';
const NOTIFICATION_ICON_COLOR = '#0d9488';

let permissionRequested = false;

function hashId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147480000;
}

function iconFields() {
  return {
    smallIcon: NOTIFICATION_SMALL_ICON,
    largeIcon: NOTIFICATION_LARGE_ICON,
    iconColor: NOTIFICATION_ICON_COLOR,
  };
}

export async function initLocalNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted' && !permissionRequested) {
      permissionRequested = true;
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const route = event.notification.extra?.route as string | undefined;
      if (route) {
        window.location.href = route;
      }
    });
  } catch (err) {
    console.warn('Local notifications init failed:', err);
  }
}

async function scheduleNotification(options: ScheduleOptions): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule(options);
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
  }
}

export function scheduleBookingReminders(
  bookings: Array<{
    id: string;
    customerName: string;
    roomNumber: string;
    checkInMoment: Date | null;
    checkoutMoment: Date | null;
    status: string;
  }>
): void {
  if (!Capacitor.isNativePlatform()) return;

  const now = Date.now();
  const schedules: ScheduleOptions = { notifications: [] };
  const status = (s: string) => s.toLowerCase();

  for (const b of bookings) {
    if (status(b.status) === 'cancelled' || status(b.status) === 'completed') continue;

    if (b.checkInMoment) {
      const at = b.checkInMoment.getTime() - CHECKIN_REMINDER_MS;
      if (at > now && at - now < 48 * 60 * 60 * 1000) {
        schedules.notifications.push({
          id: hashId(`checkin-${b.id}`),
          title: 'Guest arriving soon',
          body: `${b.customerName} · Room ${b.roomNumber} checks in in 1 hour`,
          schedule: { at: new Date(at) },
          ...iconFields(),
          extra: { route: `/bookings?focus=${b.id}` },
        });
      }
    }

    if (b.checkoutMoment && status(b.status) === 'booked') {
      const at = b.checkoutMoment.getTime() - CHECKOUT_REMINDER_MS;
      if (at > now && at - now < 48 * 60 * 60 * 1000) {
        schedules.notifications.push({
          id: hashId(`checkout-${b.id}`),
          title: 'Checkout reminder',
          body: `${b.customerName} · Room ${b.roomNumber} checkout in 30 minutes`,
          schedule: { at: new Date(at) },
          ...iconFields(),
          extra: { route: `/bookings?status=pending_checkout&focus=${b.id}` },
        });
      }
    }
  }

  if (schedules.notifications.length > 0) {
    void scheduleNotification(schedules);
  }
}

export function scheduleTrialReminders(trialExpiryDate: string): void {
  if (!Capacitor.isNativePlatform()) return;

  const expiry = new Date(trialExpiryDate);
  if (Number.isNaN(expiry.getTime())) return;

  const schedules: ScheduleOptions = { notifications: [] };
  const now = Date.now();

  for (const daysBefore of TRIAL_REMINDER_DAYS) {
    const at = new Date(expiry);
    at.setDate(at.getDate() - daysBefore);
    at.setHours(9, 0, 0, 0);
    if (at.getTime() > now) {
      schedules.notifications.push({
        id: hashId(`trial-${daysBefore}`),
        title: 'Trial expiring soon',
        body:
          daysBefore === 1
            ? 'Your Hotel360 trial expires tomorrow. Upgrade to keep full access.'
            : `Your Hotel360 trial expires in ${daysBefore} days.`,
        schedule: { at },
        ...iconFields(),
        extra: { route: '/upgrade' },
      });
    }
  }

  if (schedules.notifications.length > 0) {
    void scheduleNotification(schedules);
  }
}

export async function showImmediateLocalNotification(item: {
  title: string;
  body: string;
  route?: string;
  idSeed: string;
}): Promise<void> {
  await scheduleNotification({
    notifications: [
      {
        id: hashId(item.idSeed),
        title: item.title,
        body: item.body,
        schedule: { at: new Date(Date.now() + 500) },
        ...iconFields(),
        extra: { route: item.route },
      },
    ],
  });
}
