



const { pool } = require('../config/database');
const { serializeGuestsForDb } = require('../utils/guestUtils');
const bookingQueries = require('../queries/bookingQueries');

class Booking {
  // Create new booking with all details
  // static async create(bookingData) {
  //   try {
  //     const total = bookingData.total ||
  //       (parseFloat(bookingData.amount || 0) +
  //         parseFloat(bookingData.service || 0) +
  //         parseFloat(bookingData.gst || 0) +
  //         parseFloat(bookingData.cgst || 0) +
  //         parseFloat(bookingData.sgst || 0) +
  //         parseFloat(bookingData.igst || 0));

  //     // Make sure status is valid
  //     const status = bookingData.status || 'booked';
  //     const validStatuses = ['booked', 'maintenance', 'blocked', 'available', 'completed', 'cancelled'];
  //     const finalStatus = validStatuses.includes(status) ? status : 'booked';

  //     const [result] = await pool.execute(
  //       bookingQueries.CREATE_BOOKING,
  //       [
  //         bookingData.hotel_id,
  //         bookingData.room_id,
  //         bookingData.customer_id || null,
  //         bookingData.from_date,
  //         bookingData.to_date,
  //         bookingData.from_time || '14:00:00',
  //         bookingData.to_time || '12:00:00',
  //         finalStatus,
  //         parseFloat(bookingData.amount || 0),
  //         parseFloat(bookingData.service || 0),
  //         parseFloat(bookingData.gst || 0),
  //         parseFloat(bookingData.cgst || 0),
  //         parseFloat(bookingData.sgst || 0),
  //         parseFloat(bookingData.igst || 0),
  //         parseFloat(total),
  //         parseInt(bookingData.guests || 1),
  //         bookingData.special_requests || '',
  //         bookingData.id_type || 'aadhaar',
  //         bookingData.payment_method || 'cash',
  //         bookingData.payment_status || 'pending',
  //         bookingData.transaction_id || null,
  //         bookingData.referral_by || '',
  //         parseFloat(bookingData.referral_amount || 0),
  //         bookingData.invoice_number || null
  //       ]
  //     );
  //     return result.insertId;
  //   } catch (error) {
  //     console.error('Error in Booking.create:', error);
  //     throw error;
  //   }
  // }

  // In models/Booking.js - Find the create method and replace it
  // static async create(bookingData) {
  //   try {
  //     // Calculate total if not provided
  //     const total = bookingData.total ||
  //       (parseFloat(bookingData.amount || 0) +
  //         parseFloat(bookingData.service || 0) +
  //         parseFloat(bookingData.gst || 0) +
  //         parseFloat(bookingData.cgst || 0) +
  //         parseFloat(bookingData.sgst || 0) +
  //         parseFloat(bookingData.igst || 0));

  //     // Calculate advance payment fields
  //     const advancePaid = parseFloat(bookingData.advance_amount_paid || 0);
  //     const remainingAmount = total - advancePaid;

  //     // Make sure status is valid
  //     const status = bookingData.status || 'booked';
  //     const validStatuses = ['booked', 'maintenance', 'blocked', 'available', 'completed', 'cancelled'];
  //     const finalStatus = validStatuses.includes(status) ? status : 'booked';

  //     console.log('📝 Creating booking with advance payment:', {
  //       total,
  //       advancePaid,
  //       remainingAmount,
  //       advance_booking_id: bookingData.advance_booking_id
  //     });

  //     const [result] = await pool.execute(
  //       bookingQueries.CREATE_BOOKING,
  //       [
  //         bookingData.hotel_id,
  //         bookingData.room_id,
  //         bookingData.customer_id || null,
  //         bookingData.advance_booking_id || null,  // ← NEW: Link to advance booking
  //         bookingData.from_date,
  //         bookingData.to_date,
  //         bookingData.from_time || '14:00:00',
  //         bookingData.to_time || '12:00:00',
  //         finalStatus,
  //         parseFloat(bookingData.amount || 0),
  //         parseFloat(bookingData.service || 0),
  //         parseFloat(bookingData.gst || 0),
  //         parseFloat(bookingData.cgst || 0),
  //         parseFloat(bookingData.sgst || 0),
  //         parseFloat(bookingData.igst || 0),
  //         parseFloat(total),                         // Full total
  //         advancePaid,                                // ← NEW: Advance amount paid
  //         remainingAmount,                            // ← NEW: Remaining amount
  //         parseInt(bookingData.guests || 1),
  //         bookingData.special_requests || '',
  //         bookingData.id_type || 'aadhaar',
  //         bookingData.payment_method || 'cash',
  //         bookingData.payment_status || 'pending',
  //         bookingData.transaction_id || null,
  //         bookingData.referral_by || '',
  //         parseFloat(bookingData.referral_amount || 0),
  //         bookingData.invoice_number || null
  //       ]
  //     );
  //     return result.insertId;
  //   } catch (error) {
  //     console.error('Error in Booking.create:', error);
  //     throw error;
  //   }
  // }

  // In models/Booking.js - Update the create method
  // static async create(bookingData) {
  //   try {
  //     // Calculate total if not provided
  //     const total = bookingData.total ||
  //       (parseFloat(bookingData.amount || 0) +
  //         parseFloat(bookingData.service || 0) +
  //         parseFloat(bookingData.gst || 0) +
  //         parseFloat(bookingData.cgst || 0) +
  //         parseFloat(bookingData.sgst || 0) +
  //         parseFloat(bookingData.igst || 0));

  //     // Calculate advance payment fields
  //     const advancePaid = parseFloat(bookingData.advance_amount_paid || 0);
  //     const remainingAmount = total - advancePaid;

  //     // Make sure status is valid
  //     const status = bookingData.status || 'booked';
  //     const validStatuses = ['booked', 'maintenance', 'blocked', 'available', 'completed', 'cancelled'];
  //     const finalStatus = validStatuses.includes(status) ? status : 'booked';

  //     console.log('📝 Creating booking with advance payment:', {
  //       total,
  //       advancePaid,
  //       remainingAmount,
  //       advance_booking_id: bookingData.advance_booking_id,
  //       group_booking_id: bookingData.group_booking_id // Add this log
  //     });

  //     const [result] = await pool.execute(
  //       bookingQueries.CREATE_BOOKING,
  //       [
  //         bookingData.hotel_id,
  //         bookingData.room_id,
  //         bookingData.customer_id || null,
  //         bookingData.advance_booking_id || null,
  //         bookingData.group_booking_id || null,  // ← ADD THIS - group_booking_id
  //         bookingData.from_date,
  //         bookingData.to_date,
  //         bookingData.from_time || '14:00:00',
  //         bookingData.to_time || '12:00:00',
  //         finalStatus,
  //         parseFloat(bookingData.amount || 0),
  //         parseFloat(bookingData.service || 0),
  //         parseFloat(bookingData.gst || 0),
  //         parseFloat(bookingData.cgst || 0),
  //         parseFloat(bookingData.sgst || 0),
  //         parseFloat(bookingData.igst || 0),
  //         parseFloat(total),
  //         advancePaid,
  //         remainingAmount,
  //         parseInt(bookingData.guests || 1),
  //         bookingData.special_requests || '',
  //         bookingData.id_type || 'aadhaar',
  //         bookingData.payment_method || 'cash',
  //         bookingData.payment_status || 'pending',
  //         bookingData.transaction_id || null,
  //         bookingData.referral_by || '',
  //         parseFloat(bookingData.referral_amount || 0),
  //         bookingData.invoice_number || null
  //       ]
  //     );
  //     return result.insertId;
  //   } catch (error) {
  //     console.error('Error in Booking.create:', error);
  //     throw error;
  //   }
  // }

  // Add this new method to get booking with advance details

  static async create(bookingData) {
    try {
      const total = bookingData.total ||
        (parseFloat(bookingData.amount || 0) +
          parseFloat(bookingData.service || 0) +
          parseFloat(bookingData.gst || 0) +
          parseFloat(bookingData.cgst || 0) +
          parseFloat(bookingData.sgst || 0) +
          parseFloat(bookingData.igst || 0));

      const advancePaid = parseFloat(bookingData.advance_amount_paid || 0);
      const remainingAmount = total - advancePaid;

      const status = bookingData.status || 'booked';
      const validStatuses = ['booked', 'maintenance', 'blocked', 'available', 'completed', 'cancelled'];
      const finalStatus = validStatuses.includes(status) ? status : 'booked';

      // Get discount values
      const discountPercentage = parseFloat(bookingData.discount_percentage || 0);
      const discountAmount = parseFloat(bookingData.discount_amount || 0);
      const originalAmount = parseFloat(bookingData.original_amount || bookingData.amount || 0);

      const [result] = await pool.execute(
        bookingQueries.CREATE_BOOKING,
        [
          bookingData.hotel_id,
          bookingData.room_id,
          bookingData.customer_id || null,
          bookingData.advance_booking_id || null,
          bookingData.group_booking_id || null,
          bookingData.from_date,
          bookingData.to_date,
          bookingData.from_time || '14:00:00',
          bookingData.to_time || '12:00:00',
          finalStatus,
          parseFloat(bookingData.amount || 0),
          parseFloat(bookingData.service || 0),
          parseFloat(bookingData.gst || 0),
          parseFloat(bookingData.cgst || 0),
          parseFloat(bookingData.sgst || 0),
          parseFloat(bookingData.igst || 0),
          parseFloat(total),
          advancePaid,
          remainingAmount,
          serializeGuestsForDb(bookingData),
          bookingData.special_requests || '',
          bookingData.id_type || 'aadhaar',
          bookingData.payment_method || 'cash',
          bookingData.payment_status || 'pending',
          bookingData.transaction_id || null,
          bookingData.referral_by || '',
          parseFloat(bookingData.referral_amount || 0),
          bookingData.invoice_number || null,
          discountPercentage,
          discountAmount,
          originalAmount
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in Booking.create:', error);
      throw error;
    }
  }

  static async findByIdWithAdvance(id, hotelId) {
    try {
      const [rows] = await pool.execute(
        bookingQueries.GET_BOOKING_WITH_ADVANCE,
        [id, hotelId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findByIdWithAdvance:', error);
      throw error;
    }
  }

  // Create booking without customer (for blocks/maintenance)
  static async createWithoutCustomer(bookingData) {
    const total = parseFloat(bookingData.amount || 0) +
      parseFloat(bookingData.service || 0) +
      parseFloat(bookingData.gst || 0);

    const [result] = await pool.execute(
      bookingQueries.CREATE_BOOKING_WITHOUT_CUSTOMER,
      [
        bookingData.hotel_id,
        bookingData.room_id,
        bookingData.from_date,
        bookingData.to_date,
        bookingData.from_time || '14:00:00',
        bookingData.to_time || '12:00:00',
        bookingData.status || 'blocked',
        parseFloat(bookingData.amount || 0),
        parseFloat(bookingData.service || 0),
        parseFloat(bookingData.gst || 0),
        parseFloat(total),
        serializeGuestsForDb(bookingData),
        bookingData.special_requests || '',
        bookingData.referral_by || '',
        parseFloat(bookingData.referral_amount || 0)
      ]
    );
    return result.insertId;
  }

  // Find booking by ID
  static async findById(id, hotelId) {
    const [rows] = await pool.execute(bookingQueries.FIND_BOOKING_BY_ID, [id, hotelId]);
    return rows[0] || null;
  }

  // Get bookings with details
  static async findByHotelWithDetails(hotelId) {
    const [rows] = await pool.execute(bookingQueries.GET_BOOKINGS_WITH_DETAILS, [hotelId]);
    return rows;
  }

  // Update booking
  static async update(id, hotelId, bookingData) {
    console.log('📝 Booking.update called with:', { id, hotelId, bookingData });

    const updates = [];
    const params = [];

    const addField = (fieldName, value, isNumber = false) => {
      if (value !== undefined) {
        updates.push(`${fieldName} = ?`);
        params.push(isNumber ? parseFloat(value) || 0 : value);
      }
    };

    addField('room_id', bookingData.room_id);
    addField('customer_id', bookingData.customer_id);
    addField('from_date', bookingData.from_date);
    addField('to_date', bookingData.to_date);
    addField('from_time', bookingData.from_time);
    addField('to_time', bookingData.to_time);
    addField('actual_checkout_date', bookingData.actual_checkout_date);
    addField('actual_checkout_time', bookingData.actual_checkout_time);
    addField('amount', bookingData.amount, true);
    addField('service', bookingData.service, true);
    addField('gst', bookingData.gst, true);
    addField('cgst', bookingData.cgst, true);
    addField('sgst', bookingData.sgst, true);
    addField('igst', bookingData.igst, true);

    if (bookingData.total !== undefined) {
      addField('total', bookingData.total, true);
    } else if (
      bookingData.amount !== undefined ||
      bookingData.service !== undefined ||
      bookingData.gst !== undefined ||
      bookingData.cgst !== undefined ||
      bookingData.sgst !== undefined ||
      bookingData.igst !== undefined
    ) {
      const amount = parseFloat(bookingData.amount) || 0;
      const service = parseFloat(bookingData.service) || 0;
      const gst = parseFloat(bookingData.gst) || 0;
      const cgst = parseFloat(bookingData.cgst) || 0;
      const sgst = parseFloat(bookingData.sgst) || 0;
      const igst = parseFloat(bookingData.igst) || 0;
      const total = amount + service + gst;
      addField('total', total, true);
    }

    if (bookingData.status !== undefined) {
      const validStatuses = ['booked', 'maintenance', 'blocked', 'available', 'completed', 'cancelled'];
      if (validStatuses.includes(bookingData.status)) {
        addField('status', bookingData.status);
      }
    }

    addField('guests', bookingData.guests, true);
    addField('special_requests', bookingData.special_requests);
    addField('payment_method', bookingData.payment_method);
    addField('online_payment_app', bookingData.online_payment_app);
    addField('payment_status', bookingData.payment_status);
    addField('transaction_id', bookingData.transaction_id);
    addField('referral_by', bookingData.referral_by);
    addField('referral_amount', bookingData.referral_amount, true);
    addField('discount_percentage', bookingData.discount_percentage, true);
    addField('discount_amount', bookingData.discount_amount, true);
    addField('original_amount', bookingData.original_amount, true);
    addField('advance_amount_paid', bookingData.advance_amount_paid, true);
    addField('remaining_amount', bookingData.remaining_amount, true);

    if (updates.length === 0) {
      console.log('No fields to update');
      return false;
    }

    params.push(id);
    params.push(hotelId);

    const query = `UPDATE bookings SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`;

    console.log('📝 Update query:', query);
    console.log('📝 Update params:', params);

    try {
      const [result] = await pool.execute(query, params);
      console.log('✅ Update result:', result.affectedRows > 0);

      if (result.affectedRows > 0 && (bookingData.status === 'completed' || bookingData.status === 'cancelled')) {
        let roomId = bookingData.room_id;

        if (!roomId) {
          const [bookingRows] = await pool.execute(
            'SELECT room_id FROM bookings WHERE id = ? AND hotel_id = ?',
            [id, hotelId]
          );
          if (bookingRows.length > 0) {
            roomId = bookingRows[0].room_id;
          }
        }

        if (roomId) {
          const Room = require('./Room');
          await Room.updateStatus(roomId, hotelId, 'available');
          console.log(`✅ Room ${roomId} status updated to available`);
        }
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error in Booking.update:', error);
      throw error;
    }
  }

  // Check room availability (uses check-in / check-out times when overlapping stays)
  static async checkRoomAvailability(
    roomId,
    hotelId,
    fromDate,
    toDate,
    excludeBookingId = null,
    status = 'booked',
    fromTime = '14:00',
    toTime = '12:00'
  ) {
    try {
      const norm = (t, fallback) => {
        if (t === undefined || t === null || String(t).trim() === '') return fallback;
        const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/);
        if (!m) return fallback;
        return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
      };

      const reqFromT = norm(fromTime, '14:00');
      const reqToT = norm(toTime, '12:00');

      console.log('🔍 CHECKING ROOM AVAILABILITY');
      console.log('Input:', { roomId, hotelId, fromDate, toDate, reqFromT, reqToT, excludeBookingId, status });

      if (!fromDate || !toDate) {
        console.log('⚠️ Missing dates');
        return false;
      }

      // Overlap: existing_start < requested_end AND existing_end > requested_start
      const query = `
        SELECT b.*, r.room_number 
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE b.room_id = ? 
        AND b.hotel_id = ?
        AND b.status IN ('booked', 'blocked', 'maintenance')
        AND NOT (
          b.status = 'booked'
          AND STR_TO_DATE(
            CONCAT(b.to_date, ' ', IFNULL(NULLIF(TRIM(b.to_time), ''), '12:00')),
            '%Y-%m-%d %H:%i'
          ) <= NOW()
        )
        AND STR_TO_DATE(
          CONCAT(b.from_date, ' ', IFNULL(NULLIF(TRIM(b.from_time), ''), '14:00')),
          '%Y-%m-%d %H:%i'
        ) < STR_TO_DATE(CONCAT(?, ' ', ?), '%Y-%m-%d %H:%i')
        AND STR_TO_DATE(
          CONCAT(b.to_date, ' ', IFNULL(NULLIF(TRIM(b.to_time), ''), '12:00')),
          '%Y-%m-%d %H:%i'
        ) > STR_TO_DATE(CONCAT(?, ' ', ?), '%Y-%m-%d %H:%i')
        ${excludeBookingId ? 'AND b.id != ?' : ''}
      `;

      const params = [
        roomId, hotelId,
        toDate, reqToT,
        fromDate, reqFromT
      ];

      if (excludeBookingId) {
        params.push(excludeBookingId);
      }

      console.log('📝 SQL Query:', query);
      console.log('📝 SQL Params:', params);

      const [rows] = await pool.execute(query, params);

      console.log(`📊 Found ${rows.length} conflicting bookings`);

      if (rows.length > 0) {
        console.log('❌ Conflicts:', rows.map(r => ({
          id: r.id,
          from_date: r.from_date,
          from_time: r.from_time,
          to_date: r.to_date,
          to_time: r.to_time,
          status: r.status
        })));
      }

      return rows.length === 0;

    } catch (error) {
      console.error('❌ Error in checkRoomAvailability:', error);
      throw error;
    }
  }

  // Check for duplicate booking
  static async checkDuplicateBooking(hotelId, roomId, customerId, fromDate, toDate, excludeBookingId = null) {
    try {
      console.log('🔍 CHECKING DUPLICATE BOOKING');
      console.log('Input:', { hotelId, roomId, customerId, fromDate, toDate, excludeBookingId });

      let query = `
        SELECT b.*, c.name as customer_name, r.room_number
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE b.hotel_id = ? 
        AND b.room_id = ?
        AND b.customer_id = ?
        AND b.from_date = ?
        AND b.to_date = ?
        AND b.status IN ('booked', 'blocked', 'maintenance')
      `;

      let params = [hotelId, roomId, customerId, fromDate, toDate];

      if (excludeBookingId) {
        query += ` AND b.id != ?`;
        params.push(excludeBookingId);
      }

      console.log('📝 Duplicate check query:', query);
      console.log('📝 Duplicate check params:', params);

      const [rows] = await pool.execute(query, params);

      console.log(`📊 Found ${rows.length} duplicate bookings`);
      if (rows.length > 0) {
        console.log('❌ Duplicate details:', rows[0]);
      }

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Error checking duplicate booking:', error);
      throw error;
    }
  }

  static async getNextInvoiceNumber(hotelId) {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;

      const [rows] = await pool.execute(
        `SELECT invoice_number 
         FROM bookings 
         WHERE hotel_id = ? 
         AND invoice_number LIKE ?
         ORDER BY CAST(SUBSTRING(invoice_number, ?) AS UNSIGNED) DESC 
         LIMIT 1`,
        [hotelId, `${prefix}%`, prefix.length + 1]
      );

      if (rows.length > 0 && rows[0].invoice_number) {
        const lastInvoice = rows[0].invoice_number;
        const lastNumber = parseInt(lastInvoice.split('-')[2]) || 0;
        return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
      }

      return `${prefix}0001`;
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      return `INV-${new Date().getFullYear()}-0001`;
    }
  }

  // Update invoice number
  static async updateInvoiceNumber(id, hotelId, invoiceNumber) {
    try {
      const [result] = await pool.execute(
        'UPDATE bookings SET invoice_number = ? WHERE id = ? AND hotel_id = ?',
        [invoiceNumber, id, hotelId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating invoice number:', error);
      throw error;
    }
  }

  // Check if invoice number exists
  static async checkInvoiceNumberExists(invoiceNumber, hotelId, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM bookings WHERE invoice_number = ? AND hotel_id = ?';
      let params = [invoiceNumber, hotelId];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].count > 0;
    } catch (error) {
      console.error('Error checking invoice number:', error);
      throw error;
    }
  }

  // Create special booking (block/maintenance)
  // static async createSpecialBooking(bookingData, type = 'blocked') {
  //   try {
  //     console.log('📝 Creating special booking:', { bookingData, type });

  //     if (!bookingData.hotel_id || !bookingData.room_id || !bookingData.from_date || !bookingData.to_date) {
  //       throw new Error('Missing required fields');
  //     }

  //     const defaults = {
  //       from_time: '00:00:00',
  //       to_time: '23:59:59',
  //       amount: 0,
  //       service: 0,
  //       gst: 0,
  //       total: 0,
  //       status: type,
  //       guests: 0,
  //       special_requests: type === 'blocked' ? 'Room blocked' : 'Room under maintenance',
  //       payment_method: 'none',
  //       payment_status: 'none',
  //       referral_by: 'Admin',
  //       referral_amount: 0
  //     };

  //     const mergedData = { ...defaults, ...bookingData };

  //     const query = `
  //       INSERT INTO bookings (
  //         hotel_id, room_id, from_date, to_date, from_time, to_time,
  //         status, amount, service, gst, total, guests, special_requests,
  //         payment_method, payment_status, referral_by, referral_amount
  //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //     `;

  //     const values = [
  //       mergedData.hotel_id,
  //       mergedData.room_id,
  //       mergedData.from_date,
  //       mergedData.to_date,
  //       mergedData.from_time,
  //       mergedData.to_time,
  //       mergedData.status,
  //       mergedData.amount,
  //       mergedData.service,
  //       mergedData.gst,
  //       mergedData.total,
  //       mergedData.guests,
  //       mergedData.special_requests,
  //       mergedData.payment_method,
  //       mergedData.payment_status,
  //       mergedData.referral_by,
  //       mergedData.referral_amount
  //     ];

  //     const [result] = await pool.execute(query, values);
  //     console.log('✅ Special booking created with ID:', result.insertId);

  //     return result.insertId;

  //   } catch (error) {
  //     console.error('❌ Error creating special booking:', error);
  //     throw error;
  //   }
  // }

  // In models/Booking.js - Update createSpecialBooking
  static async createSpecialBooking(bookingData, type = 'blocked') {
    try {
      console.log('📝 Creating special booking:', { bookingData, type });

      if (!bookingData.hotel_id || !bookingData.room_id || !bookingData.from_date || !bookingData.to_date) {
        throw new Error('Missing required fields');
      }

      const defaults = {
        from_time: '00:00:00',
        to_time: '23:59:59',
        amount: 0,
        service: 0,
        gst: 0,
        total: 0,
        status: type,
        guests: 0,
        special_requests: type === 'blocked' ? 'Room blocked' : 'Room under maintenance',
        payment_method: 'none',
        payment_status: 'none',
        referral_by: 'Admin',
        referral_amount: 0
      };

      const mergedData = { ...defaults, ...bookingData };

      const query = `
      INSERT INTO bookings (
        hotel_id, room_id, customer_id, from_date, to_date, from_time, to_time,
        status, amount, service, gst, total, guests, special_requests,
        payment_method, payment_status, referral_by, referral_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const values = [
        mergedData.hotel_id,
        mergedData.room_id,
        mergedData.customer_id || null,  // ← Include customer_id
        mergedData.from_date,
        mergedData.to_date,
        mergedData.from_time,
        mergedData.to_time,
        mergedData.status,
        mergedData.amount,
        mergedData.service,
        mergedData.gst,
        mergedData.total,
        mergedData.guests,
        mergedData.special_requests,
        mergedData.payment_method,
        mergedData.payment_status,
        mergedData.referral_by,
        mergedData.referral_amount
      ];

      const [result] = await pool.execute(query, values);
      console.log('✅ Special booking created with ID:', result.insertId);

      return result.insertId;

    } catch (error) {
      console.error('❌ Error creating special booking:', error);
      throw error;
    }
  }

  // Delete booking
  // static async delete(id, hotelId) {
  //   const [result] = await pool.execute(bookingQueries.DELETE_BOOKING, [id, hotelId]);
  //   return result.affectedRows > 0;
  // }

  // Delete booking with cascade
  static async delete(id, hotelId) {
    try {
      console.log('🗑️ Booking.delete called:', { id, hotelId });

      // First get booking details to know what to delete
      const booking = await this.findById(id, hotelId);

      if (!booking) {
        console.log('❌ Booking not found');
        return false;
      }

      console.log('📋 Booking found for deletion:', {
        id: booking.id,
        payment_method: booking.payment_method,
        transaction_id: booking.transaction_id
      });

      // Start a transaction for atomic operation
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Delete from collections if cash payment
        if (booking.payment_method === 'cash') {
          const [collectionResult] = await connection.execute(
            'DELETE FROM collections WHERE booking_id = ? AND hotel_id = ?',
            [id, hotelId]
          );
          console.log(`💰 Deleted ${collectionResult.affectedRows} collection records`);
        }

        // Delete from transactions if online payment or has transaction_id
        if (booking.payment_method === 'online' || booking.transaction_id) {
          const [transactionResult] = await connection.execute(
            'DELETE FROM transactions WHERE booking_id = ? AND hotel_id = ?',
            [id, hotelId]
          );
          console.log(`💳 Deleted ${transactionResult.affectedRows} transaction records`);
        }

        // Unlink advance booking if exists
        if (booking.advance_booking_id) {
          await connection.execute(
            'UPDATE bookings SET advance_booking_id = NULL WHERE id = ?',
            [id]
          );
          console.log(`🔗 Unlinked advance booking: ${booking.advance_booking_id}`);
        }

        // Delete the booking
        const [result] = await connection.execute(
          'DELETE FROM bookings WHERE id = ? AND hotel_id = ?',
          [id, hotelId]
        );

        await connection.commit();
        console.log(`✅ Booking deleted successfully, affected rows: ${result.affectedRows}`);
        return result.affectedRows > 0;

      } catch (error) {
        await connection.rollback();
        console.error('❌ Transaction rolled back due to error:', error);
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Error in Booking.delete:', error);
      throw error;
    }
  }


  //  createWithGroup 
  static async createWithGroup(bookingData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO bookings (
        hotel_id, room_id, customer_id, group_booking_id,
        from_date, to_date, from_time, to_time,
        status, amount, service, cgst, sgst, igst, total,
        guests, special_requests, payment_method, payment_status,
        id_type, transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingData.hotel_id,
          bookingData.room_id,
          bookingData.customer_id,
          bookingData.group_booking_id,
          bookingData.from_date,
          bookingData.to_date,
          bookingData.from_time,
          bookingData.to_time,
          bookingData.status || 'booked',
          parseFloat(bookingData.amount || 0),
          parseFloat(bookingData.service || 0),
          parseFloat(bookingData.cgst || 0),
          parseFloat(bookingData.sgst || 0),
          parseFloat(bookingData.igst || 0),
          parseFloat(bookingData.total || 0),
          serializeGuestsForDb(bookingData),
          bookingData.special_requests || '',
          bookingData.payment_method || 'cash',
          bookingData.payment_status || 'pending',
          bookingData.id_type || 'aadhaar',
          bookingData.transaction_id || null
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in Booking.createWithGroup:', error);
      throw error;
    }
  }

  // Find all bookings in a group
  static async findByGroupId(groupId, hotelId) {
    try {
      const [rows] = await pool.execute(
        `SELECT b.*, r.room_number, r.type as room_type,
              c.name as customer_name, c.phone as customer_phone
       FROM bookings b
       LEFT JOIN rooms r ON b.room_id = r.id
       LEFT JOIN customers c ON b.customer_id = c.id
       WHERE b.group_booking_id = ? AND b.hotel_id = ?
       ORDER BY b.room_id`,
        [groupId, hotelId]
      );
      return rows;
    } catch (error) {
      console.error('Error in Booking.findByGroupId:', error);
      throw error;
    }
  }

  // Generate unique group ID
  static generateGroupId() {
    return `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = Booking;