import { initLocalNotifications } from '@/lib/localNotificationService';
import { initPushNotifications } from '@/lib/pushNotificationService';
import { bindNotificationsToLoggedInUser } from '@/lib/notificationStore';

let initialized = false;

/** Initialize native notification services once per app session */
export async function initNotificationServices(): Promise<void> {
  // Scope in-app bell storage to the currently logged-in user
  if (localStorage.getItem('currentUser') && localStorage.getItem('authToken')) {
    bindNotificationsToLoggedInUser();
  }

  if (initialized) return;
  initialized = true;
  await Promise.all([initLocalNotifications(), initPushNotifications()]);
}
