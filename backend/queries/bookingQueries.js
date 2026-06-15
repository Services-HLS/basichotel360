
const bookingQueries = {
  // Create new booking with all fields
  CREATE_BOOKING: `INSERT INTO bookings (
    hotel_id, room_id, customer_id, advance_booking_id, group_booking_id, 
    from_date, to_date, from_time, to_time,
    status, amount, service, gst, cgst, sgst, igst, total, 
    advance_amount_paid, remaining_amount,
    guests, special_requests, id_type, payment_method, payment_status, transaction_id,
    referral_by, referral_amount, invoice_number,
    discount_percentage, discount_amount, original_amount
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  // CREATE_BOOKING: `INSERT INTO bookings (
  //   hotel_id, room_id, customer_id, advance_booking_id, group_booking_id, from_date, to_date, from_time, to_time,
  //   status, amount, service, gst, cgst, sgst, igst, total, advance_amount_paid, remaining_amount,
  //   guests, special_requests, id_type, payment_method, payment_status, transaction_id,
  //   referral_by, referral_amount, invoice_number
  // ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,


  // Create booking without customer (for blocks/maintenance)
  // CREATE_BOOKING_WITHOUT_CUSTOMER: `INSERT INTO bookings (
  //   hotel_id, room_id, from_date, to_date, from_time, to_time,
  //   status, amount, service, gst, cgst, sgst, igst, total, guests, special_requests,
  //   referral_by, referral_amount
  // ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  // Update CREATE_BOOKING_WITHOUT_CUSTOMER to include customer_id
  CREATE_BOOKING_WITHOUT_CUSTOMER: `INSERT INTO bookings (
  hotel_id, room_id, customer_id, from_date, to_date, from_time, to_time,
  status, amount, service, gst, cgst, sgst, igst, total, guests, special_requests,
  referral_by, referral_amount
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  // Original create booking (for backward compatibility)
  CREATE_BOOKING_ORIGINAL: `INSERT INTO bookings (
    hotel_id, room_id, customer_id, from_date, to_date, from_time, to_time,
    status, amount, service, gst, total
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  // Find booking by ID
  FIND_BOOKING_BY_ID: `SELECT * FROM bookings WHERE id = ? AND hotel_id = ?`,

  // Get bookings by hotel
  GET_BOOKINGS_BY_HOTEL: `
    SELECT b.*, 
           c.name as customer_name,
           c.phone as customer_phone,
           c.email as customer_email,
           c.id_number as customer_id_number,
           r.room_number,
           r.type as room_type
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.hotel_id = ?
    ORDER BY b.created_at DESC
  `,

  // Get bookings with customer details
  GET_BOOKINGS_WITH_DETAILS: `
    SELECT b.*, 
           c.name as customer_name,
           c.phone as customer_phone,
           c.email as customer_email,
           c.id_number as customer_id_number,
           c.id_image,
           c.id_image2,
           r.room_number,
           r.type as room_type,
           r.price as room_price,
           r.gst_percentage,
           r.cgst_percentage,
           r.sgst_percentage,
           r.igst_percentage,
           r.service_charge_percentage
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.hotel_id = ?
    ORDER BY b.created_at DESC
  `,

  // Update booking
  UPDATE_BOOKING: `UPDATE bookings SET 
    room_id = ?, customer_id = ?, from_date = ?, to_date = ?, 
    from_time = ?, to_time = ?, amount = ?, service = ?, 
    gst = ?, cgst = ?, sgst = ?, igst = ?,
    total = ?, status = ?, guests = ?, special_requests = ?,
    payment_method = ?, payment_status = ?, transaction_id = ?,
    referral_by = ?, referral_amount = ?
    WHERE id = ? AND hotel_id = ?`,

  // Update booking status
  UPDATE_BOOKING_STATUS: `UPDATE bookings SET status = ? WHERE id = ? AND hotel_id = ?`,

  // Update booking payment status
  UPDATE_BOOKING_PAYMENT: `UPDATE bookings SET 
    payment_status = ?, transaction_id = ? 
    WHERE id = ? AND hotel_id = ?`,

  // Delete booking
  DELETE_BOOKING: `DELETE FROM bookings WHERE id = ? AND hotel_id = ?`,

  // Get bookings by date range
  GET_BOOKINGS_BY_DATE_RANGE: `
    SELECT b.*, 
           c.name as customer_name,
           r.room_number
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.hotel_id = ? 
    AND b.from_date <= ? 
    AND b.to_date >= ?
    ORDER BY b.from_date
  `,

  // Check room availability
  CHECK_ROOM_AVAILABILITY: `
    SELECT b.* 
    FROM bookings b 
    WHERE b.room_id = ? 
    AND b.hotel_id = ?
    AND b.from_date < ? 
    AND b.to_date > ?
    AND b.status IN ('booked', 'blocked', 'maintenance')
    AND (? IS NULL OR b.id != ?)
  `,

  // Get booking statistics
  GET_BOOKING_STATS: `
    SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as active_bookings,
      SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_bookings,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_bookings,
      SUM(total) as total_revenue
    FROM bookings 
    WHERE hotel_id = ?
    AND DATE(created_at) = CURDATE()
  `,

  // Get today's check-ins
  GET_TODAYS_CHECKINS: `
    SELECT b.*, c.name as customer_name, r.room_number
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.hotel_id = ?
    AND b.from_date = CURDATE()
    AND b.status = 'booked'
    ORDER BY b.from_time
  `,

  // Get today's check-outs
  GET_TODAYS_CHECKOUTS: `
    SELECT b.*, c.name as customer_name, r.room_number
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.hotel_id = ?
    AND b.to_date = CURDATE()
    AND b.status = 'booked'
    ORDER BY b.to_time
  `,

  // Get bookings by payment status
  GET_BOOKINGS_BY_PAYMENT_STATUS: `
    SELECT b.*, c.name as customer_name, r.room_number
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.hotel_id = ?
    AND b.payment_status = ?
    ORDER BY b.created_at DESC
  `,

  // Add new query to get booking with advance details
  GET_BOOKING_WITH_ADVANCE: `
    SELECT b.*, 
           ab.invoice_number as advance_invoice_number,
           ab.advance_expiry_date,
           ab.advance_amount as original_advance_amount,
           ab.status as advance_status
    FROM bookings b
    LEFT JOIN advance_bookings ab ON b.advance_booking_id = ab.id
    WHERE b.id = ? AND b.hotel_id = ?
  `,
};

module.exports = bookingQueries;