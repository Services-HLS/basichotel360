import {
  BOOKINGS_UPDATED_EVENT,
  formatCheckInDisplay,
  formatCheckoutDisplay,
  type BookingLike,
} from '@/lib/bookingCheckoutUtils';
import { dateOnly, localDateStr, localTomorrowStr } from '@/lib/dateUtils';

/** Module groups for the in-app notification center */
export type NotificationModule =
  | 'booking'
  | 'checkout'
  | 'housekeeping'
  | 'function'
  | 'account'
  | 'advance'
  | 'refund'
  | 'collections'
  | 'wallet'
  | 'staff'
  | 'expense';

/** In-app account alerts (trial, session, occupancy) — disabled */
export const SHOW_ACCOUNT_NOTIFICATIONS = false;

/** In-app wallet alerts (top-up, low balance) — disabled */
export const SHOW_WALLET_NOTIFICATIONS = false;

function isVisibleNotification(notification: AppNotification): boolean {
  if (notification.module === 'account' && !SHOW_ACCOUNT_NOTIFICATIONS) return false;
  if (notification.module === 'wallet' && !SHOW_WALLET_NOTIFICATIONS) return false;
  return true;
}

/** Expenses at or above this amount trigger a bell alert */
export const LARGE_EXPENSE_THRESHOLD = 10_000;

/** Wallet balance at or below this triggers a low-balance alert */
export const LOW_WALLET_BALANCE = 500;

export type NotificationPriority = 'low' | 'normal' | 'high';

export type AppNotification = {
  id: string;
  module: NotificationModule;
  title: string;
  message: string;
  route: string;
  entityId?: string;
  createdAt: string;
  priority: NotificationPriority;
  badge?: string;
};

export type BookingNotification = {
  bookingId: string;
  customerName: string;
  roomNumber: string;
  checkInLabel: string;
  checkOutLabel: string;
  createdAt: string;
};

const STORAGE_KEY = 'hms-app-notifications';
const READ_KEY = 'hms-app-notifications-read';
const LEGACY_BOOKING_STORAGE_KEY = 'hms-booking-notifications';
const LEGACY_BOOKING_READ_KEY = 'hms-booking-notifications-read';
const LEGACY_CHECKOUT_REMINDER_READ_KEY = 'hms-checkout-reminder-read';

export const NOTIFICATIONS_UPDATED_EVENT = 'hms-notifications-updated';
export const BOOKING_CREATED_EVENT = 'hms-booking-created';
export const CHECKOUT_REMINDER_EVENT = 'hms-checkout-reminder';

/** Show API-sourced booking alerts for this long after creation */
const RECENT_BOOKING_MS = 72 * 60 * 60 * 1000;
const MAX_STORED = 100;
const MAX_READ_IDS = 300;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function migrateLegacyBookingNotifications() {
  const legacy = safeParse<BookingNotification[]>(
    localStorage.getItem(LEGACY_BOOKING_STORAGE_KEY),
    []
  );
  if (legacy.length === 0) return;

  const existing = getStoredNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  const migrated: AppNotification[] = legacy
    .filter((b) => !existingIds.has(`booking-${b.bookingId}`))
    .map((b) => bookingToAppNotification(b));

  if (migrated.length > 0) {
    persistNotifications([...migrated, ...existing].slice(0, MAX_STORED));
  }

  const legacyRead = safeParse<string[]>(localStorage.getItem(LEGACY_BOOKING_READ_KEY), []);
  if (legacyRead.length > 0) {
    const read = getReadNotificationIds();
    legacyRead.forEach((id) => read.add(`booking-${id}`));
    localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-MAX_READ_IDS)));
  }
}

function persistNotifications(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
}

function dispatchNotificationsUpdated() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
}

export function getStoredNotifications(): AppNotification[] {
  migrateLegacyBookingNotifications();
  return safeParse<AppNotification[]>(localStorage.getItem(STORAGE_KEY), []);
}

function migrateLegacyCheckoutReminderReads() {
  const legacy = safeParse<string[]>(
    localStorage.getItem(LEGACY_CHECKOUT_REMINDER_READ_KEY),
    []
  );
  if (legacy.length === 0) return;

  const read = getReadNotificationIds();
  for (const bookingId of legacy) {
    read.add(`checkout-soon-${bookingId}`);
  }
  localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-MAX_READ_IDS)));
  localStorage.removeItem(LEGACY_CHECKOUT_REMINDER_READ_KEY);
}

export function getReadNotificationIds(): Set<string> {
  migrateLegacyCheckoutReminderReads();
  return new Set(safeParse<string[]>(localStorage.getItem(READ_KEY), []));
}

export function getUnreadNotifications(): AppNotification[] {
  const read = getReadNotificationIds();
  return getStoredNotifications()
    .filter((n) => !read.has(n.id) && isVisibleNotification(n))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadByModule(module: NotificationModule): AppNotification[] {
  return getUnreadNotifications().filter((n) => n.module === module);
}

export function getUnreadCountByModule(): Record<NotificationModule, number> {
  const counts: Record<NotificationModule, number> = {
    booking: 0,
    checkout: 0,
    housekeeping: 0,
    function: 0,
    account: 0,
    advance: 0,
    refund: 0,
    collections: 0,
    wallet: 0,
    staff: 0,
    expense: 0,
  };
  for (const n of getUnreadNotifications()) {
    counts[n.module] += 1;
  }
  return counts;
}

export function getTotalUnreadCount(): number {
  return getUnreadNotifications().length;
}

export function markNotificationRead(id: string) {
  const read = getReadNotificationIds();
  read.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-MAX_READ_IDS)));
  dispatchNotificationsUpdated();
}

export function markModuleNotificationsRead(module: NotificationModule) {
  const read = getReadNotificationIds();
  for (const n of getStoredNotifications()) {
    if (n.module === module) read.add(n.id);
  }
  localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-MAX_READ_IDS)));
  dispatchNotificationsUpdated();
}

/** Mark all current bell + sidebar alerts as read (clears badges until new alerts appear). */
export async function clearAllNotificationBadges(): Promise<void> {
  const read = getReadNotificationIds();

  for (const n of getStoredNotifications()) {
    read.add(n.id);
  }

  try {
    const { pollNotificationData } = await import('@/lib/notificationPollingService');
    const result = await pollNotificationData({ showBookingNotifications: true });

    for (const id of result.allNotificationIds) {
      read.add(id);
    }

    for (const item of result.bookingItems) {
      read.add(`booking-${item.bookingId}`);
    }

    for (const item of result.checkoutItems) {
      const bookingId = item.bookingId;
      read.add(`checkout-${bookingId}`);
      read.add(`checkout-soon-${bookingId}`);
      read.add(`checkin-soon-${bookingId}`);
      read.add(`checkin-today-${bookingId}`);
    }
  } catch {
    // still persist stored notification dismissals
  }

  const readList = [...read].slice(-MAX_READ_IDS);
  localStorage.setItem(READ_KEY, JSON.stringify(readList));

  const legacyBookingIds = readList
    .filter((id) => id.startsWith('booking-'))
    .map((id) => id.replace('booking-', ''));
  localStorage.setItem(
    LEGACY_BOOKING_READ_KEY,
    JSON.stringify(legacyBookingIds.slice(-200))
  );

  const legacyCheckoutIds = readList
    .filter((id) => id.startsWith('checkout-soon-'))
    .map((id) => id.replace('checkout-soon-', ''));
  localStorage.setItem(
    LEGACY_CHECKOUT_REMINDER_READ_KEY,
    JSON.stringify(legacyCheckoutIds.slice(-200))
  );

  dispatchNotificationsUpdated();
}

export function addNotification(
  item: Omit<AppNotification, 'createdAt'> & { createdAt?: string }
) {
  const notification: AppNotification = {
    ...item,
    createdAt: item.createdAt ?? new Date().toISOString(),
  };

  const existing = getStoredNotifications();
  const merged = [
    notification,
    ...existing.filter((n) => n.id !== notification.id),
  ].slice(0, MAX_STORED);

  persistNotifications(merged);
  dispatchNotificationsUpdated();

  if (notification.module === 'booking') {
    window.dispatchEvent(
      new CustomEvent(BOOKING_CREATED_EVENT, { detail: notification })
    );
  }
}

export function upsertNotifications(items: AppNotification[]) {
  const byId = new Map<string, AppNotification>();
  for (const item of [...items, ...getStoredNotifications()]) {
    byId.set(item.id, item);
  }
  const merged = [...byId.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_STORED);
  persistNotifications(merged);
  dispatchNotificationsUpdated();
}

export function removeNotification(id: string) {
  persistNotifications(getStoredNotifications().filter((n) => n.id !== id));
  dispatchNotificationsUpdated();
}

function bookingToAppNotification(item: BookingNotification): AppNotification {
  return {
    id: `booking-${item.bookingId}`,
    module: 'booking',
    title: item.customerName,
    message: `Room ${item.roomNumber} · Check-in ${item.checkInLabel}`,
    route: `/bookings?focus=${item.bookingId}`,
    entityId: item.bookingId,
    createdAt: item.createdAt,
    priority: 'normal',
    badge: 'Booked',
  };
}

// --- Backward-compatible booking helpers ---

export function getPersistedBookingNotifications(): BookingNotification[] {
  return getStoredNotifications()
    .filter((n) => n.module === 'booking')
    .map((n) => ({
      bookingId: n.entityId ?? n.id.replace('booking-', ''),
      customerName: n.title,
      roomNumber: n.message.match(/Room ([^·]+)/)?.[1]?.trim() ?? '—',
      checkInLabel: n.message.split('Check-in ')[1] ?? '',
      checkOutLabel: '',
      createdAt: n.createdAt,
    }));
}

export function getReadBookingNotificationIds(): Set<string> {
  const read = getReadNotificationIds();
  const bookingIds = new Set<string>();
  for (const id of read) {
    if (id.startsWith('booking-')) bookingIds.add(id.replace('booking-', ''));
  }
  return bookingIds;
}

export function markBookingNotificationRead(bookingId: string) {
  markNotificationRead(`booking-${bookingId}`);
}

export function getReadCheckoutReminderIds(): Set<string> {
  const read = getReadNotificationIds();
  const bookingIds = new Set<string>();
  for (const id of read) {
    if (id.startsWith('checkout-soon-')) {
      bookingIds.add(id.replace('checkout-soon-', ''));
    }
  }
  return bookingIds;
}

export function markCheckoutReminderRead(bookingId: string) {
  markNotificationRead(`checkout-soon-${bookingId}`);
  window.dispatchEvent(new CustomEvent(CHECKOUT_REMINDER_EVENT));
}

export function notifyBookingCreated(item: BookingNotification) {
  addNotification(bookingToAppNotification(item));
  window.dispatchEvent(new CustomEvent(BOOKING_CREATED_EVENT, { detail: item }));
}

export function notifyCheckoutPending(item: {
  bookingId: string;
  customerName: string;
  roomNumber: string;
  checkoutLabel: string;
}) {
  addNotification({
    id: `checkout-${item.bookingId}`,
    module: 'checkout',
    title: item.customerName,
    message: `Room ${item.roomNumber} · ${item.checkoutLabel}`,
    route: `/bookings?status=pending_checkout&focus=${item.bookingId}`,
    entityId: item.bookingId,
    priority: 'high',
    badge: 'Due',
  });
}

export function notifyHousekeepingTask(item: {
  taskId: string;
  roomNumber: string;
  status: string;
  cleaningType?: string;
  overdue?: boolean;
}) {
  addNotification({
    id: `housekeeping-${item.taskId}`,
    module: 'housekeeping',
    title: `Room ${item.roomNumber}`,
    message: item.overdue
      ? `Overdue ${item.cleaningType ?? 'cleaning'} task`
      : `${item.cleaningType ?? 'Cleaning'} — ${item.status}`,
    route: '/housekeeping',
    entityId: item.taskId,
    priority: item.overdue ? 'high' : 'normal',
    badge: item.overdue ? 'Overdue' : item.status,
  });
}

export function notifyRoomNeedsCleaning(item: {
  bookingId: string;
  roomNumber: string;
  customerName: string;
}) {
  addNotification({
    id: `housekeeping-checkout-${item.bookingId}`,
    module: 'housekeeping',
    title: `Room ${item.roomNumber} needs cleaning`,
    message: `${item.customerName} checked out`,
    route: '/housekeeping',
    entityId: item.bookingId,
    priority: 'high',
    badge: 'Clean',
  });
}

export function notifyRoomReady(item: { taskId: string; roomNumber: string }) {
  addNotification({
    id: `housekeeping-ready-${item.taskId}`,
    module: 'housekeeping',
    title: `Room ${item.roomNumber} is ready`,
    message: 'Cleaning completed — room available for guests',
    route: '/housekeeping',
    entityId: item.taskId,
    priority: 'normal',
    badge: 'Ready',
  });
}

export function notifyHousekeepingCompleted(item: {
  taskId: string;
  roomNumber: string;
}) {
  removeNotification(`housekeeping-${item.taskId}`);
  notifyRoomReady(item);
}

export function notifyOccupancyAlert(_item: {
  kind: 'low' | 'full';
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyPercent: number;
}) {
  if (!SHOW_ACCOUNT_NOTIFICATIONS) return;
  // occupancy alerts disabled — see SHOW_ACCOUNT_NOTIFICATIONS
}

export function notifyFunctionEvent(item: {
  bookingId: string;
  hallName: string;
  eventDate: string;
  customerName?: string;
}) {
  const bookingId = String(item.bookingId || '').trim();
  if (!bookingId) {
    console.warn('notifyFunctionEvent: missing booking id — notification skipped');
    return;
  }

  const eventDate = dateOnly(item.eventDate) || '';
  const today = localDateStr();
  const tomorrow = localTomorrowStr();
  let badge = 'Scheduled';
  if (eventDate === today) badge = 'Today';
  else if (eventDate === tomorrow) badge = 'Tomorrow';

  const dateLabel = eventDate || item.eventDate || '—';

  addNotification({
    id: `function-${bookingId}`,
    module: 'function',
    title: item.hallName,
    message: item.customerName
      ? `${item.customerName} · ${dateLabel}`
      : `Event on ${dateLabel}`,
    route: '/function-rooms',
    entityId: bookingId,
    priority: eventDate === today ? 'high' : 'normal',
    badge,
  });
}

export function notifyAdvanceBooking(item: {
  bookingId: string;
  customerName: string;
  roomNumber: string;
  checkInDate: string;
  kind: 'created' | 'tomorrow' | 'expiring' | 'converted' | 'today';
}) {
  const messages: Record<typeof item.kind, string> = {
    created: `Advance booking for Room ${item.roomNumber}`,
    tomorrow: `Check-in tomorrow · Room ${item.roomNumber}`,
    today: `Check-in today · Room ${item.roomNumber}`,
    expiring: `Advance booking expiring soon · Room ${item.roomNumber}`,
    converted: `Advance booking converted · Room ${item.roomNumber}`,
  };
  const badges: Record<typeof item.kind, string> = {
    created: 'Advance',
    tomorrow: 'Tomorrow',
    today: 'Today',
    expiring: 'Expiring',
    converted: 'Converted',
  };
  addNotification({
    id: `advance-${item.kind}-${item.bookingId}`,
    module: 'advance',
    title: item.customerName,
    message: messages[item.kind],
    route: '/advance-bookings',
    entityId: item.bookingId,
    priority: item.kind === 'tomorrow' || item.kind === 'today' ? 'high' : 'normal',
    badge: badges[item.kind],
  });
}

export function notifyAccount(_item: {
  id: string;
  title: string;
  message: string;
  route?: string;
  priority?: NotificationPriority;
}) {
  if (!SHOW_ACCOUNT_NOTIFICATIONS) return;
}

export function notifyRefundPending(item: {
  bookingId: string;
  customerName: string;
  roomNumber: string;
}) {
  addNotification({
    id: `refund-${item.bookingId}`,
    module: 'refund',
    title: item.customerName,
    message: `Cancellation pending · Room ${item.roomNumber}`,
    route: '/refund-management',
    entityId: item.bookingId,
    priority: 'normal',
    badge: 'Refund',
  });
}

export function notifyCancellationProcessed(item: {
  bookingId: string;
  customerName: string;
  roomNumber: string;
}) {
  removeNotification(`refund-${item.bookingId}`);
  addNotification({
    id: `refund-processed-${item.bookingId}`,
    module: 'refund',
    title: item.customerName,
    message: `Cancellation processed · Room ${item.roomNumber}`,
    route: '/refund-management',
    entityId: item.bookingId,
    priority: 'normal',
    badge: 'Done',
  });
}

export function notifyCollectionRecorded(item: {
  collectionId?: string;
  amount: number;
  paymentMode: string;
}) {
  const id = item.collectionId ?? `collection-${Date.now()}`;
  addNotification({
    id: `collections-${id}`,
    module: 'collections',
    title: 'Collection recorded',
    message: `₹${item.amount.toLocaleString('en-IN')} via ${item.paymentMode}`,
    route: '/collections',
    entityId: id,
    priority: 'normal',
    badge: 'Paid',
  });
}

export function notifyBulkHandover(item: { amount: number }) {
  addNotification({
    id: `collections-handover-${Date.now()}`,
    module: 'collections',
    title: 'Cash handover completed',
    message: `₹${item.amount.toLocaleString('en-IN')} handed over`,
    route: '/collections',
    priority: 'high',
    badge: 'Handover',
  });
}

export function notifyLargeExpense(item: {
  expenseId: string;
  name: string;
  amount: number;
}) {
  addNotification({
    id: `expense-large-${item.expenseId}`,
    module: 'expense',
    title: item.name,
    message: `Large expense · ₹${item.amount.toLocaleString('en-IN')}`,
    route: '/expenses',
    entityId: item.expenseId,
    priority: 'high',
    badge: 'Large',
  });
}

export function notifyStaffUserCreated(item: { userId: string; name: string }) {
  addNotification({
    id: `staff-created-${item.userId}`,
    module: 'staff',
    title: item.name,
    message: 'New staff user created',
    route: '/staff',
    entityId: item.userId,
    priority: 'normal',
    badge: 'New',
  });
}

export function notifyStaffPermissionsUpdated(item: { userId: string; name: string }) {
  addNotification({
    id: `staff-perms-${item.userId}-${Date.now()}`,
    module: 'staff',
    title: item.name,
    message: 'Staff permissions updated',
    route: '/staff',
    entityId: item.userId,
    priority: 'normal',
    badge: 'Updated',
  });
}

export function notifyWalletTopup(_item: { amount: number }) {
  if (!SHOW_WALLET_NOTIFICATIONS) return;
}

export function notifyWalletLowBalance(_item: { balance: number }) {
  if (!SHOW_WALLET_NOTIFICATIONS) return;
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
    createdAt: (raw.created_at as string | undefined) || new Date().toISOString(),
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

export const MODULE_LABELS: Record<NotificationModule, string> = {
  booking: 'New bookings',
  checkout: 'Checkout',
  housekeeping: 'Housekeeping',
  function: 'Function hall',
  account: 'Account',
  advance: 'Advance bookings',
  refund: 'Cancellations',
  collections: 'Collections',
  wallet: 'Wallet',
  staff: 'Staff',
  expense: 'Expenses & salaries',
};

export const MODULE_ORDER: NotificationModule[] = [
  'checkout',
  'booking',
  'housekeeping',
  'collections',
  'advance',
  'function',
  'refund',
  'expense',
  'staff',
];
