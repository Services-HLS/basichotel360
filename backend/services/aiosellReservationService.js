const { pool } = require('../config/database');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const OtaReservation = require('../models/OtaReservation');
const Hotel = require('../models/Hotel');
const { serializeGuestsForDb } = require('../utils/guestUtils');

async function resolveHotelId(hotelCode) {
  const hotel = await Hotel.findByHotelCode(hotelCode);
  if (hotel?.id) {
    return hotel.id;
  }

  return null;
}

function buildGuestName(guest = {}) {
  const firstName = (guest.firstName || '').trim();
  const lastName = (guest.lastName || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'OTA Guest';
}

function buildGuestPhone(guest, bookingId) {
  const phone = (guest.phone || '').trim();
  if (phone) {
    return phone;
  }

  return `OTA${String(bookingId || Date.now()).slice(-10)}`;
}

function buildSpecialRequests(payload) {
  const parts = [];

  if (payload.channel) {
    parts.push(`Channel: ${payload.channel}`);
  }
  if (payload.segment) {
    parts.push(`Segment: ${payload.segment}`);
  }
  if (payload.bookingId) {
    parts.push(`OTA Booking ID: ${payload.bookingId}`);
  }
  if (payload.cmBookingId) {
    parts.push(`CM Booking ID: ${payload.cmBookingId}`);
  }
  if (payload.specialRequests) {
    parts.push(payload.specialRequests);
  }

  return parts.join(' | ');
}

async function findRoomForCode(hotelId, roomCode) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM rooms
     WHERE hotel_id = ?
       AND (
         type = ?
         OR room_number = ?
         OR LOWER(REPLACE(type, ' ', '-')) = LOWER(?)
       )
     ORDER BY id ASC
     LIMIT 1`,
    [hotelId, roomCode, roomCode, roomCode]
  );

  return rows[0] || null;
}

function getRoomAmount(roomPayload, payloadAmount) {
  if (Array.isArray(roomPayload.prices) && roomPayload.prices.length > 0) {
    return roomPayload.prices.reduce((sum, priceRow) => sum + (parseFloat(priceRow.sellRate) || 0), 0);
  }

  return parseFloat(payloadAmount?.amountAfterTax) || 0;
}

async function findOrCreateCustomer(hotelId, payload) {
  const guest = payload.guest || {};
  const guestName = buildGuestName(guest);
  const guestPhone = buildGuestPhone(guest, payload.bookingId);
  const guestEmail = (guest.email || '').trim();

  if (guestPhone) {
    const existing = await Customer.findByPhone(guestPhone, hotelId);
    if (existing) {
      return existing.id;
    }
  }

  return Customer.create({
    hotel_id: hotelId,
    name: guestName,
    phone: guestPhone,
    email: guestEmail,
    address: guest.address?.line1 || '',
    city: guest.address?.city || '',
    state: guest.address?.state || '',
    pincode: guest.address?.zipCode || '',
    payment_method: payload.pah ? 'cash' : 'online',
    payment_status: payload.pah ? 'pending' : 'paid',
  });
}

async function createBookingsForPayload(hotelId, payload) {
  const rooms = Array.isArray(payload.rooms) ? payload.rooms : [];
  if (rooms.length === 0) {
    throw new Error('At least one room is required for booking');
  }

  const customerId = await findOrCreateCustomer(hotelId, payload);
  const groupBookingId = `OTA-${payload.bookingId}`;
  const createdBookingIds = [];

  for (const roomPayload of rooms) {
    const room = await findRoomForCode(hotelId, roomPayload.roomCode);
    if (!room) {
      throw new Error(`Room not found for roomCode: ${roomPayload.roomCode}`);
    }

    const amount = getRoomAmount(roomPayload, payload.amount);

    const isAvailable = await Booking.checkRoomAvailability(
      room.id,
      hotelId,
      payload.checkin,
      payload.checkout,
      null,
      'booked'
    );

    if (!isAvailable) {
      throw new Error(`Room ${roomPayload.roomCode} is not available for selected dates`);
    }

    const invoiceNumber = await Booking.getNextInvoiceNumber(hotelId);
    const bookingId = await Booking.create({
      hotel_id: hotelId,
      room_id: room.id,
      customer_id: customerId,
      group_booking_id: rooms.length > 1 ? groupBookingId : null,
      from_date: payload.checkin,
      to_date: payload.checkout,
      amount,
      total: amount,
      original_amount: amount,
      status: 'booked',
      adults: roomPayload.occupancy?.adults || 1,
      children: roomPayload.occupancy?.children || 0,
      special_requests: buildSpecialRequests(payload),
      payment_method: payload.pah ? 'cash' : 'online',
      payment_status: payload.pah ? 'pending' : 'paid',
      transaction_id: String(payload.cmBookingId || payload.bookingId),
      referral_by: payload.channel || 'OTA',
      referral_amount: parseFloat(payload.amount?.commission) || 0,
      invoice_number: invoiceNumber,
      advance_amount_paid: payload.pah ? 0 : amount,
      remaining_amount: payload.pah ? amount : 0,
    });

    createdBookingIds.push(bookingId);
  }

  return createdBookingIds[0];
}

async function updateBookingsForPayload(hotelId, payload, existingRecord) {
  const booking = await Booking.findById(existingRecord.booking_id, hotelId);
  if (!booking) {
    return createBookingsForPayload(hotelId, payload);
  }

  const roomPayload = Array.isArray(payload.rooms) ? payload.rooms[0] : null;
  const updateData = {
    from_date: payload.checkin,
    to_date: payload.checkout,
    special_requests: buildSpecialRequests(payload),
    referral_by: payload.channel || booking.referral_by,
    referral_amount: parseFloat(payload.amount?.commission) || 0,
    payment_method: payload.pah ? 'cash' : 'online',
    payment_status: payload.pah ? 'pending' : 'paid',
    transaction_id: String(payload.cmBookingId || payload.bookingId),
  };

  if (roomPayload) {
    const room = await findRoomForCode(hotelId, roomPayload.roomCode);
    if (!room) {
      throw new Error(`Room not found for roomCode: ${roomPayload.roomCode}`);
    }

    const amount = getRoomAmount(roomPayload, payload.amount);
    updateData.room_id = room.id;
    updateData.amount = amount;
    updateData.total = amount;
    updateData.original_amount = amount;
    updateData.guests = serializeGuestsForDb({
      adults: roomPayload.occupancy?.adults || 1,
      children: roomPayload.occupancy?.children || 0,
    });
    updateData.advance_amount_paid = payload.pah ? 0 : amount;
    updateData.remaining_amount = payload.pah ? amount : 0;
  }

  await Booking.update(existingRecord.booking_id, hotelId, updateData);
  return existingRecord.booking_id;
}

async function cancelBooking(hotelId, payload, existingRecord) {
  if (!existingRecord?.booking_id) {
    return null;
  }

  await Booking.update(existingRecord.booking_id, hotelId, {
    status: 'cancelled',
  });

  return existingRecord.booking_id;
}

async function processReservation(payload) {
  const action = (payload.action || '').toLowerCase();
  const hotelCode = payload.hotelCode;

  if (!hotelCode) {
    throw new Error('hotelCode is required');
  }

  if (!payload.bookingId) {
    throw new Error('bookingId is required');
  }

  const hotelId = await resolveHotelId(hotelCode);
  if (!hotelId) {
    throw new Error(`No hotel found in database for hotelCode: ${hotelCode}. Save this code in HMS Settings.`);
  }

  const existingRecord = await OtaReservation.findByOtaBookingId(hotelId, String(payload.bookingId));

  if (action === 'cancel') {
    const bookingId = await cancelBooking(hotelId, payload, existingRecord);
    await OtaReservation.upsert({
      hotelId,
      bookingId,
      otaBookingId: String(payload.bookingId),
      cmBookingId: payload.cmBookingId || null,
      channel: payload.channel || null,
      action,
      payload,
    });

    return {
      success: true,
      action,
      hotelId,
      bookingId,
      message: bookingId ? 'Reservation cancelled' : 'Cancellation recorded',
    };
  }

  if (action === 'modify') {
    const bookingId = await updateBookingsForPayload(hotelId, payload, existingRecord);
    await OtaReservation.upsert({
      hotelId,
      bookingId,
      otaBookingId: String(payload.bookingId),
      cmBookingId: payload.cmBookingId || null,
      channel: payload.channel || null,
      action,
      payload,
    });

    return {
      success: true,
      action,
      hotelId,
      bookingId,
      message: 'Reservation modified',
    };
  }

  if (action === 'book') {
    if (existingRecord?.booking_id) {
      return {
        success: true,
        action,
        hotelId,
        bookingId: existingRecord.booking_id,
        message: 'Reservation already exists',
      };
    }

    const bookingId = await createBookingsForPayload(hotelId, payload);
    await OtaReservation.upsert({
      hotelId,
      bookingId,
      otaBookingId: String(payload.bookingId),
      cmBookingId: payload.cmBookingId || null,
      channel: payload.channel || null,
      action,
      payload,
    });

    return {
      success: true,
      action,
      hotelId,
      bookingId,
      message: 'Reservation created',
    };
  }

  throw new Error(`Unsupported action: ${action || 'unknown'}`);
}

module.exports = {
  processReservation,
  resolveHotelId,
};
