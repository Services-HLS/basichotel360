import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
} from '@capacitor/push-notifications';
import { addNotification } from '@/lib/notificationStore';
import { showImmediateLocalNotification } from '@/lib/localNotificationService';

const FCM_TOKEN_KEY = 'hms-fcm-token';
let initialized = false;

function mapPushToRoute(data?: Record<string, string>): string {
  const module = data?.module;
  const entityId = data?.entityId;
  switch (module) {
    case 'checkout':
      return entityId
        ? `/bookings?status=pending_checkout&focus=${entityId}`
        : '/bookings?status=pending_checkout';
    case 'booking':
      return entityId ? `/bookings?focus=${entityId}` : '/bookings';
    case 'housekeeping':
      return '/housekeeping';
    case 'function':
      return '/function-rooms';
    case 'advance':
      return '/advance-bookings';
    case 'refund':
      return '/refund-management';
    case 'collections':
      return '/collections';
    case 'wallet':
      return '/wallet';
    case 'staff':
      return '/staff';
    case 'expense':
      return '/expenses';
    case 'account':
      return data?.route || '/dashboard';
    default:
      return '/dashboard';
  }
}

function handlePushPayload(notification: PushNotificationSchema): void {
  const data = notification.data as Record<string, string> | undefined;
  const title = notification.title || data?.title || 'Hotel360';
  const message = notification.body || data?.message || '';

  if (data?.module) {
    addNotification({
      id: `push-${data.id || Date.now()}`,
      module: data.module as 'booking',
      title,
      message,
      route: mapPushToRoute(data),
      entityId: data.entityId,
      priority: (data.priority as 'high') || 'normal',
    });
  }

  if (Capacitor.isNativePlatform()) {
    void showImmediateLocalNotification({
      idSeed: `push-${data?.id || title}`,
      title,
      body: message,
      route: mapPushToRoute(data),
    });
  }
}

async function registerDeviceToken(token: Token): Promise<void> {
  localStorage.setItem(FCM_TOKEN_KEY, token.value);

  const authToken = localStorage.getItem('authToken');
  if (!authToken) return;

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${API_URL}/notifications/register-device`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token.value,
        platform: Capacitor.getPlatform(),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn('FCM token registration failed:', res.status, body);
    } else {
      console.info('FCM token registered with backend');
    }
  } catch (err) {
    console.warn('FCM token registration error:', err);
  }
}

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  initialized = true;

  try {
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive !== 'granted') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') return;
    }

    await PushNotifications.addListener('registration', (token) => {
      void registerDeviceToken(token);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.warn('Push registration error:', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      handlePushPayload(notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route = mapPushToRoute(
        action.notification.data as Record<string, string> | undefined
      );
      window.location.href = route;
    });

    await PushNotifications.register();
  } catch (err) {
    console.warn(
      'Push notifications unavailable. Add google-services.json for Android FCM:',
      err
    );
  }
}

export function getStoredFcmToken(): string | null {
  return localStorage.getItem(FCM_TOKEN_KEY);
}

/** Call after login to re-register device token with backend */
export async function refreshPushRegistration(): Promise<void> {
  const token = getStoredFcmToken();
  if (token) {
    await registerDeviceToken({ value: token });
    return;
  }
  if (Capacitor.isNativePlatform()) {
    initialized = false;
    await initPushNotifications();
  }
}
