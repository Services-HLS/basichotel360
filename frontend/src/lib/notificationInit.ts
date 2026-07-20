import { initLocalNotifications } from '@/lib/localNotificationService';
import { initPushNotifications } from '@/lib/pushNotificationService';

let initialized = false;

/** Initialize native notification services once per app session */
export async function initNotificationServices(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await Promise.all([initLocalNotifications(), initPushNotifications()]);
}
