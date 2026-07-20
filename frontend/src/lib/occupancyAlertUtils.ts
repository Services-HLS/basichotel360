import { isBookingOccupyingDate, type BookingLike } from '@/lib/bookingCheckoutUtils';
import { dateOnly, localDateStr } from '@/lib/dateUtils';

/** Occupancy below this % triggers a low-occupancy in-app alert */
export const LOW_OCCUPANCY_PERCENT = 30;

type RoomRow = { id?: number | string };
type BookingRow = Record<string, unknown>;
type AdvanceRow = {
  room_id?: number | string;
  from_date?: string;
  status?: string;
};

export type OccupancyStats = {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyPercent: number;
};

function mapRowToBookingLike(raw: BookingRow): BookingLike {
  return {
    status: String(raw.status || 'booked'),
    rawFromDate: raw.from_date as string | undefined,
    rawToDate: raw.to_date as string | undefined,
    fromTime: raw.from_time as string | undefined,
    toTime: raw.to_time as string | undefined,
    isAdvanceBooking: Boolean(raw.is_advance_booking || raw.advance_booking_id),
  };
}

function todayDate(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

export function computeTodayOccupancy(
  rooms: RoomRow[],
  bookingRows: BookingRow[],
  advanceRows: AdvanceRow[] = []
): OccupancyStats {
  const totalRooms = rooms.length;
  if (totalRooms === 0) {
    return { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, occupancyPercent: 0 };
  }

  const today = todayDate();
  const todayStr = localDateStr(today);
  const occupiedRoomIds = new Set<string>();

  for (const raw of bookingRows) {
    const roomId = String(raw.room_id ?? '');
    if (!roomId) continue;
    const booking = mapRowToBookingLike(raw);
    if (isBookingOccupyingDate(booking, today)) {
      occupiedRoomIds.add(roomId);
    }
  }

  for (const ab of advanceRows) {
    const roomId = String(ab.room_id ?? '');
    const fromDate = dateOnly(ab.from_date);
    const status = String(ab.status || '').toLowerCase();
    if (
      !roomId ||
      fromDate !== todayStr ||
      status === 'cancelled' ||
      status === 'converted' ||
      status === 'completed'
    ) {
      continue;
    }
    occupiedRoomIds.add(roomId);
  }

  const occupiedRooms = occupiedRoomIds.size;
  const availableRooms = Math.max(0, totalRooms - occupiedRooms);
  const occupancyPercent = Math.round((occupiedRooms / totalRooms) * 100);

  return { totalRooms, occupiedRooms, availableRooms, occupancyPercent };
}

export function isLowOccupancy(stats: OccupancyStats): boolean {
  return stats.totalRooms > 0 && stats.occupancyPercent < LOW_OCCUPANCY_PERCENT;
}

export function isFullOccupancy(stats: OccupancyStats): boolean {
  return stats.totalRooms > 0 && stats.availableRooms === 0;
}
