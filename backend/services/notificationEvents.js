const fcmService = require('./fcmService');
const NotificationDevice = require('../models/NotificationDevice');

/** In-memory dedupe — resets on server restart */
const sentKeys = new Set();
const MAX_DEDUPE_KEYS = 5000;

function dedupeKey(parts) {
  return parts.filter(Boolean).join(':');
}

function shouldSend(key) {
  if (sentKeys.has(key)) return false;
  sentKeys.add(key);
  if (sentKeys.size > MAX_DEDUPE_KEYS) {
    const first = sentKeys.values().next().value;
    sentKeys.delete(first);
  }
  return true;
}

async function cleanupInvalidTokens(invalidTokens) {
  if (!invalidTokens?.length) return;
  await Promise.all(
    invalidTokens.map((token) => NotificationDevice.deactivateToken(token))
  );
}

/**
 * Send FCM push to all registered devices for a hotel.
 * Fire-and-forget safe — logs warnings, never throws.
 */
async function notifyHotel(hotelId, payload, options = {}) {
  const { dedupe } = options;
  if (!hotelId) return { sent: false, reason: 'no_hotel' };

  if (dedupe && !shouldSend(dedupe)) {
    return { sent: false, reason: 'deduped' };
  }

  if (!fcmService.isConfigured()) {
    return { sent: false, reason: 'fcm_not_configured' };
  }

  try {
    const result = await fcmService.sendPushToHotel(hotelId, {
      id: payload.id || `${payload.module}-${Date.now()}`,
      title: payload.title,
      message: payload.message,
      module: payload.module,
      entityId: payload.entityId ? String(payload.entityId) : undefined,
      route: payload.route,
      priority: payload.priority || 'normal',
    });

    if (result.invalidTokens?.length) {
      await cleanupInvalidTokens(result.invalidTokens);
    }

    if (result.successCount > 0) {
      console.log(`📲 Push sent (${payload.module}) hotel ${hotelId}: ${payload.title}`);
    }

    return { sent: result.successCount > 0, ...result };
  } catch (err) {
    console.warn('📲 Push notification failed:', err.message);
    return { sent: false, error: err.message };
  }
}

function notifyNewBooking(hotelId, { bookingId, customerName, roomNumber }) {
  return notifyHotel(hotelId, {
    module: 'booking',
    title: customerName || 'New booking',
    message: `Room ${roomNumber || '—'} · New reservation confirmed`,
    entityId: bookingId,
    route: `/bookings?focus=${bookingId}`,
    priority: 'high',
  });
}

function notifyCheckoutSoon(hotelId, { bookingId, customerName, roomNumber, minutesLeft }) {
  const mins = minutesLeft != null ? `${minutesLeft}m` : 'soon';
  return notifyHotel(
    hotelId,
    {
      module: 'checkout',
      title: customerName || 'Checkout soon',
      message: `Room ${roomNumber || '—'} · Checkout in ${mins}`,
      entityId: bookingId,
      route: `/bookings?status=checkout_soon&focus=${bookingId}`,
      priority: 'high',
    },
    { dedupe: dedupeKey(['checkout-soon', hotelId, bookingId]) }
  );
}

function notifyPendingCheckout(hotelId, { bookingId, customerName, roomNumber }) {
  return notifyHotel(
    hotelId,
    {
      module: 'checkout',
      title: customerName || 'Checkout overdue',
      message: `Room ${roomNumber || '—'} · Checkout time passed — collect payment`,
      entityId: bookingId,
      route: `/bookings?status=pending_checkout&focus=${bookingId}`,
      priority: 'high',
    },
    { dedupe: dedupeKey(['checkout-due', hotelId, bookingId, new Date().toISOString().slice(0, 10)]) }
  );
}

function notifyRoomNeedsCleaning(hotelId, { bookingId, roomNumber, customerName }) {
  return notifyHotel(
    hotelId,
    {
      module: 'housekeeping',
      title: `Room ${roomNumber || '—'} needs cleaning`,
      message: customerName ? `${customerName} checked out` : 'Guest checked out',
      entityId: bookingId,
      route: '/housekeeping',
      priority: 'high',
    },
    { dedupe: dedupeKey(['hk-clean', hotelId, bookingId]) }
  );
}

function notifyHousekeepingTask(hotelId, { taskId, roomNumber, status, overdue }) {
  return notifyHotel(
    hotelId,
    {
      module: 'housekeeping',
      title: `Room ${roomNumber || '—'}`,
      message: overdue
        ? 'Overdue housekeeping task'
        : `Housekeeping task — ${status || 'pending'}`,
      entityId: taskId,
      route: '/housekeeping',
      priority: overdue ? 'high' : 'normal',
    },
    overdue
      ? { dedupe: dedupeKey(['hk-overdue', hotelId, taskId, new Date().toISOString().slice(0, 10)]) }
      : undefined
  );
}

function notifyFunctionEventToday(hotelId, { bookingId, hallName, customerName }) {
  return notifyHotel(
    hotelId,
    {
      module: 'function',
      title: hallName || 'Function hall',
      message: customerName ? `${customerName} · Event today` : 'Function hall event today',
      entityId: bookingId,
      route: '/function-rooms',
      priority: 'normal',
    },
    { dedupe: dedupeKey(['function-today', hotelId, bookingId]) }
  );
}

function notifyFunctionBookingCreated(hotelId, { bookingId, eventName, customerName, eventDate }) {
  return notifyHotel(hotelId, {
    module: 'function',
    title: eventName || 'Function booking',
    message: customerName
      ? `${customerName} · ${eventDate || 'New event'}`
      : 'New function hall booking created',
    entityId: bookingId,
    route: '/function-rooms',
    priority: 'normal',
  });
}

module.exports = {
  notifyHotel,
  notifyNewBooking,
  notifyCheckoutSoon,
  notifyPendingCheckout,
  notifyRoomNeedsCleaning,
  notifyHousekeepingTask,
  notifyFunctionEventToday,
  notifyFunctionBookingCreated,
};
