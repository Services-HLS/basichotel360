/** Shared booking checkout / room-blocking helpers */

export type BookingLike = {
  status?: string;
  fromDate?: string;
  toDate?: string;
  rawFromDate?: string;
  rawToDate?: string;
  fromTime?: string;
  toTime?: string;
  checkIn?: string;
  checkOut?: string;
  checkInTime?: string;
  checkOutTime?: string;
  isAdvanceBooking?: boolean;
};

const DEFAULT_CHECK_IN_TIME = '14:00';
const DEFAULT_CHECK_OUT_TIME = '12:00';

function parseTimeParts(timeStr?: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 12, minutes: 0 };
  const normalized = String(timeStr).trim().slice(0, 5);
  const [h, m] = normalized.split(':').map((v) => parseInt(v, 10));
  return {
    hours: Number.isFinite(h) ? h : 12,
    minutes: Number.isFinite(m) ? m : 0,
  };
}

function resolveDateString(booking: BookingLike, kind: 'in' | 'out'): string | null {
  if (kind === 'in') {
    return (
      booking.rawFromDate ||
      booking.fromDate ||
      booking.checkIn ||
      null
    );
  }
  return (
    booking.rawToDate ||
    booking.toDate ||
    booking.checkOut ||
    null
  );
}

export function getBookingCheckInMoment(booking: BookingLike): Date | null {
  const dateStr = resolveDateString(booking, 'in');
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const { hours, minutes } = parseTimeParts(
    booking.fromTime || booking.checkInTime || DEFAULT_CHECK_IN_TIME
  );
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function getBookingCheckoutMoment(booking: BookingLike): Date | null {
  const dateStr = resolveDateString(booking, 'out');
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const { hours, minutes } = parseTimeParts(
    booking.toTime || booking.checkOutTime || DEFAULT_CHECK_OUT_TIME
  );
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Whether this booking blocks new reservations in Book a Room.
 * After checkout date+time passes, status may still be "booked" but the room is free to sell again.
 */
export function isBookingBlockingRoom(booking: BookingLike): boolean {
  const s = String(booking.status || '').toLowerCase();
  if (!s || s === 'cancelled' || s === 'completed' || s === 'checked_out' || s === 'available') {
    return false;
  }
  if (s === 'booked') {
    if (isPendingCheckoutBooking(booking)) return false;
    return true;
  }
  if (s === 'maintenance' || s === 'blocked') return true;
  if (
    s === 'confirmed' ||
    s === 'pending' ||
    s === 'active' ||
    s === 'checked_in' ||
    s === 'checked-in'
  ) {
    return true;
  }
  if (booking.isAdvanceBooking && (s === 'confirmed' || s === 'pending')) {
    return true;
  }
  return false;
}

/** Default lead time for in-app checkout reminders */
export const CHECKOUT_REMINDER_MS = 60 * 60 * 1000;

function isActiveBookedStatus(status?: string): boolean {
  const s = String(status || '').toLowerCase();
  return !s || s === 'booked';
}

/** Checkout date+time has passed but status is still booked (until server auto-completes) */
export function isPendingCheckoutBooking(booking: BookingLike): boolean {
  if (!isActiveBookedStatus(booking.status)) return false;
  const checkoutAt = getBookingCheckoutMoment(booking);
  if (!checkoutAt) return false;
  return Date.now() >= checkoutAt.getTime();
}

/** Checkout is within the next hour — show staff reminder before auto-checkout */
export function isUpcomingCheckoutBooking(
  booking: BookingLike,
  withinMs: number = CHECKOUT_REMINDER_MS
): boolean {
  if (!isActiveBookedStatus(booking.status)) return false;
  const checkoutAt = getBookingCheckoutMoment(booking);
  if (!checkoutAt) return false;
  const now = Date.now();
  const checkoutMs = checkoutAt.getTime();
  return checkoutMs > now && checkoutMs - now <= withinMs;
}

export function getMinutesUntilCheckout(booking: BookingLike): number | null {
  const checkoutAt = getBookingCheckoutMoment(booking);
  if (!checkoutAt) return null;
  const diff = checkoutAt.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (60 * 1000));
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDayStart(value: string): Date | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return startOfDay(d);
}

/** Whether a blocking booking occupies a calendar day */
export function isBookingOccupyingDate(booking: BookingLike, date: Date): boolean {
  if (!isBookingBlockingRoom(booking)) return false;

  const status = String(booking.status || '').toLowerCase();
  if (status === 'completed' || status === 'checked_out') return false;

  const checkInStr =
    booking.rawFromDate || booking.checkIn || booking.fromDate;
  const checkOutStr =
    booking.rawToDate || booking.checkOut || booking.toDate;
  if (!checkInStr || !checkOutStr) return false;

  const target = startOfDay(date);
  const from = parseDayStart(checkInStr);
  const to = parseDayStart(checkOutStr);
  if (!from || !to) return false;

  if (from.getTime() === to.getTime()) {
    return target.getTime() === from.getTime();
  }
  return target.getTime() >= from.getTime() && target.getTime() <= to.getTime();
}

export function formatCheckoutDisplay(booking: BookingLike): string {
  const checkoutAt = getBookingCheckoutMoment(booking);
  if (!checkoutAt) return booking.toDate || '—';
  return checkoutAt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCheckInDisplay(booking: BookingLike): string {
  const checkInAt = getBookingCheckInMoment(booking);
  if (!checkInAt) return booking.fromDate || booking.rawFromDate || '—';
  return checkInAt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const BOOKINGS_UPDATED_EVENT = 'hms-bookings-updated';

export function notifyBookingsUpdated() {
  window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
}
