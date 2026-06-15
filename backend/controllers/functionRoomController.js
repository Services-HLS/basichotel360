
const { pool } = require('../config/database');
const PDFDocument = require('pdfkit');

class FunctionRoomController {
  // ===========================================
  // INTERNAL HELPER METHODS
  // ===========================================

  // Update checkAvailabilityInternal to handle date ranges
  // In functionRoomController.js - update this method
  checkAvailabilityInternal = async (roomId, hotelId, checkInDate, checkOutDate, startTime, endTime, excludeBookingId = null) => {
    try {
      // Ensure all parameters are provided and not undefined
      if (!roomId || !hotelId || !checkInDate || !checkOutDate || !startTime || !endTime) {
        console.error('❌ Missing required parameters for availability check:', { roomId, hotelId, checkInDate, checkOutDate, startTime, endTime });
        return false;
      }

      console.log('🔍 Checking availability with:', {
        roomId, hotelId, checkInDate, checkOutDate, startTime, endTime, excludeBookingId
      });

      // FIXED SQL QUERY - This correctly handles date ranges and single day checks
      const query = `
      SELECT id FROM function_bookings
      WHERE function_room_id = ?
      AND hotel_id = ?
      AND status IN ('confirmed', 'pending')
      AND (
        -- Case 1: New booking starts during existing booking's date range
        (booking_date <= ? AND end_date >= ?)
        OR
        -- Case 2: New booking ends during existing booking's date range
        (booking_date <= ? AND end_date >= ?)
        OR
        -- Case 3: New booking completely contains existing booking
        (booking_date >= ? AND end_date <= ?)
        OR
        -- Case 4: SAME DAY - Check for time overlap when dates are the same
        (booking_date = ? AND ? = booking_date AND (
          (start_time < ? AND end_time > ?)  -- Time overlap condition
        ))
      )
      AND (? IS NULL OR id != ?)
    `;

      const params = [
        roomId,
        hotelId,
        checkInDate, checkInDate,  // Case 1: existing booking starts during new booking
        checkOutDate, checkOutDate, // Case 2: existing booking ends during new booking
        checkInDate, checkOutDate,  // Case 3: existing booking is within new booking
        checkInDate, checkInDate,   // Case 4: same date check
        endTime, startTime,         // Time overlap params
        excludeBookingId, excludeBookingId
      ];

      // Replace any undefined with null
      const safeParams = params.map(p => p === undefined ? null : p);

      console.log('📝 SQL Query params:', safeParams);

      const [rows] = await pool.execute(query, safeParams);

      console.log(`✅ Availability check result: ${rows.length} conflicting bookings found`);
      if (rows.length > 0) {
        console.log('❌ Conflicting booking IDs:', rows.map(r => r.id));
      }

      return rows.length === 0;
    } catch (error) {
      console.error('❌ Internal availability check error:', error);
      throw error;
    }
  }

  // Helper: Calculate hours between two times
  calculateHours = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  // ===========================================
  // FUNCTION ROOM MANAGEMENT
  // ===========================================

  // Create a new function room
  createFunctionRoom = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const {
        room_number,
        name,
        type,
        capacity,
        floor,
        base_price,
        half_day_price,
        hourly_rate,
        amenities,
        dimensions,
        area_sqft,
        has_ac,
        has_projector,
        has_sound_system,
        has_wifi,
        has_catering,
        has_parking,
        has_stage,
        setup_options,
        status = 'available'
      } = req.body;

      // Check if room number already exists
      const [existing] = await pool.execute(
        'SELECT id FROM function_rooms WHERE hotel_id = ? AND room_number = ?',
        [hotelId, room_number]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'ROOM_EXISTS',
          message: 'Function room number already exists'
        });
      }

      const [result] = await pool.execute(
        `INSERT INTO function_rooms (
          hotel_id, room_number, name, type, capacity, floor,
          base_price, half_day_price, hourly_rate, amenities,
          dimensions, area_sqft, has_ac, has_projector, has_sound_system,
          has_wifi, has_catering, has_parking, has_stage, setup_options, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hotelId, room_number, name || room_number, type, capacity, floor || 1,
          base_price, half_day_price || null, hourly_rate || null,
          amenities || null, dimensions || null, area_sqft || null,
          has_ac !== false, has_projector || false, has_sound_system || false,
          has_wifi !== false, has_catering || false, has_parking || false,
          has_stage || false, setup_options || null, status
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Function room created successfully',
        data: {
          id: result.insertId,
          room_number,
          name: name || room_number
        }
      });
    } catch (error) {
      console.error('❌ Create function room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Create multiple function rooms (range)
  createMultipleFunctionRooms = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const {
        room_number_start,
        room_number_end,
        name_prefix,
        type,
        capacity,
        floor,
        base_price,
        half_day_price,
        hourly_rate,
        amenities,
        status = 'available'
      } = req.body;

      const startNum = parseInt(room_number_start);
      const endNum = parseInt(room_number_end);

      if (startNum > endNum) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_RANGE',
          message: 'Start room number must be less than or equal to end room number'
        });
      }

      // Check existing rooms
      const errors = [];
      const createdRooms = [];

      for (let i = startNum; i <= endNum; i++) {
        const roomNumber = i.toString();

        const [existing] = await pool.execute(
          'SELECT id FROM function_rooms WHERE hotel_id = ? AND room_number = ?',
          [hotelId, roomNumber]
        );

        if (existing.length > 0) {
          errors.push(`Room ${roomNumber} already exists`);
          continue;
        }

        const [result] = await pool.execute(
          `INSERT INTO function_rooms (
            hotel_id, room_number, name, type, capacity, floor,
            base_price, half_day_price, hourly_rate, amenities, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hotelId, roomNumber, `${name_prefix || 'Function'} ${i}`,
            type, capacity, floor, base_price, half_day_price || null,
            hourly_rate || null, amenities || null, status
          ]
        );

        createdRooms.push({
          id: result.insertId,
          room_number: roomNumber,
          name: `${name_prefix || 'Function'} ${i}`
        });
      }

      res.status(201).json({
        success: true,
        message: `${createdRooms.length} function rooms created successfully`,
        errors: errors.length > 0 ? errors : undefined,
        data: createdRooms
      });
    } catch (error) {
      console.error('❌ Create multiple function rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get all function rooms for hotel
  getFunctionRooms = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;

      const [rooms] = await pool.execute(
        `SELECT * FROM function_rooms 
         WHERE hotel_id = ? 
         ORDER BY 
           CAST(room_number AS UNSIGNED), 
           room_number`,
        [hotelId]
      );

      res.json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      console.error('❌ Get function rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get single function room
  getFunctionRoom = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const [rooms] = await pool.execute(
        'SELECT * FROM function_rooms WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (rooms.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Function room not found'
        });
      }

      res.json({
        success: true,
        data: rooms[0]
      });
    } catch (error) {
      console.error('❌ Get function room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Update function room
  updateFunctionRoom = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const updates = req.body;

      // Build dynamic update query
      const fields = [];
      const values = [];

      const allowedFields = [
        'room_number', 'name', 'type', 'capacity', 'floor',
        'base_price', 'half_day_price', 'hourly_rate', 'amenities',
        'dimensions', 'area_sqft', 'has_ac', 'has_projector',
        'has_sound_system', 'has_wifi', 'has_catering', 'has_parking',
        'has_stage', 'setup_options', 'status'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_UPDATES',
          message: 'No fields to update'
        });
      }

      values.push(id, hotelId);

      const [result] = await pool.execute(
        `UPDATE function_rooms SET ${fields.join(', ')} WHERE id = ? AND hotel_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Function room not found'
        });
      }

      res.json({
        success: true,
        message: 'Function room updated successfully'
      });
    } catch (error) {
      console.error('❌ Update function room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Update function room status
  updateFunctionRoomStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { status } = req.body;

      if (!['available', 'booked', 'maintenance', 'blocked'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: 'Invalid status'
        });
      }

      const [result] = await pool.execute(
        'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
        [status, id, hotelId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Function room not found'
        });
      }

      res.json({
        success: true,
        message: 'Function room status updated successfully'
      });
    } catch (error) {
      console.error('❌ Update function room status error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Delete function room
  deleteFunctionRoom = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Check if room has any bookings
      const [bookings] = await pool.execute(
        'SELECT id FROM function_bookings WHERE function_room_id = ? AND hotel_id = ? AND status IN ("confirmed", "pending")',
        [id, hotelId]
      );

      if (bookings.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'ROOM_HAS_BOOKINGS',
          message: 'Cannot delete function room with active bookings'
        });
      }

      const [result] = await pool.execute(
        'DELETE FROM function_rooms WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Function room not found'
        });
      }

      res.json({
        success: true,
        message: 'Function room deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete function room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // ===========================================
  // FUNCTION ROOM BOOKING MANAGEMENT
  // ===========================================

  // Create function room booking with rooms
  // createFunctionBookingWithRooms = async (req, res) => {
  //   try {
  //     const hotelId = req.user.hotel_id;
  //     const userId = req.user.userId;
  //     const {
  //       function_room_id,
  //       event_name,
  //       event_type,
  //       check_in_date,
  //       check_out_date,
  //       start_time,
  //       end_time,
  //       setup_time,
  //       breakdown_time,
  //       rate_type,
  //       rate_amount,
  //       subtotal,
  //       service_charge = 0,
  //       gst = 0,
  //       catering_charges = 0,
  //       decoration_charges = 0,
  //       other_charges = 0,
  //       discount = 0,
  //       total_amount,
  //       advance_paid = 0,
  //       guests_expected,
  //       payment_method,
  //       payment_status = 'pending',
  //       transaction_id,
  //       status = 'confirmed',
  //       customer_name,
  //       customer_phone,
  //       customer_email,
  //       customer_address,
  //       special_requests,
  //       catering_requirements,
  //       setup_requirements,
  //       customer_id = null,
  //       has_room_bookings = false,
  //       room_booking_ids = null,
  //       total_rooms_booked = 0
  //     } = req.body;

  //     // Validate required fields
  //     if (!function_room_id || !event_name || !check_in_date || !check_out_date || !start_time || !end_time || !customer_name || !customer_phone) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'MISSING_FIELDS',
  //         message: 'Missing required fields'
  //       });
  //     }

  //     // Validate dates
  //     if (new Date(check_out_date) < new Date(check_in_date)) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'INVALID_DATES',
  //         message: 'Check-out date cannot be before check-in date'
  //       });
  //     }

  //     // Check room availability for the entire date range
  //     const isAvailable = await this.checkAvailabilityInternal(
  //       function_room_id,
  //       hotelId,
  //       check_in_date,
  //       check_out_date,
  //       start_time,
  //       end_time
  //     );

  //     if (!isAvailable) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'ROOM_NOT_AVAILABLE',
  //         message: 'Function room is not available for the selected date and time range'
  //       });
  //     }

  //     // Generate booking reference
  //     const bookingReference = `EVT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  //     // Generate invoice number
  //     const invoiceNumber = `INV-${bookingReference}`;

  //     // Calculate total hours
  //     const totalHours = this.calculateHours(start_time, end_time);

  //     // Parse room booking IDs if provided
  //     let roomBookingIdsArray = null;
  //     if (room_booking_ids) {
  //       try {
  //         roomBookingIdsArray = typeof room_booking_ids === 'string'
  //           ? JSON.parse(room_booking_ids)
  //           : room_booking_ids;
  //       } catch (e) {
  //         console.error('Error parsing room_booking_ids:', e);
  //       }
  //     }

  //     // Clean SQL query - make sure there are no hidden characters
  //     const sql = `INSERT INTO function_bookings (
  //     hotel_id, function_room_id, customer_id, booking_reference,
  //     invoice_number, event_name, event_type, booking_date, end_date, start_time, end_time,
  //     setup_time, breakdown_time, total_hours, rate_type, rate_amount,
  //     subtotal, service_charge, gst, catering_charges, decoration_charges,
  //     other_charges, discount, total_amount, advance_paid,
  //     guests_expected, guests_attended, payment_method, payment_status, transaction_id,
  //     status, cancellation_reason, customer_name, customer_phone, customer_email,
  //     customer_address, special_requests, catering_requirements,
  //     setup_requirements, created_by, has_room_bookings, 
  //     room_booking_ids, total_rooms_booked
  //   ) VALUES (${Array(43).fill('?').join(', ')})`;

  //     const values = [
  //       hotelId,
  //       function_room_id,
  //       customer_id,
  //       bookingReference,
  //       invoiceNumber,
  //       event_name,
  //       event_type,
  //       check_in_date,
  //       check_out_date,
  //       start_time,
  //       end_time,
  //       setup_time || null,
  //       breakdown_time || null,
  //       totalHours,
  //       rate_type,
  //       rate_amount,
  //       subtotal,
  //       service_charge,
  //       gst,
  //       catering_charges,
  //       decoration_charges,
  //       other_charges,
  //       discount,
  //       total_amount,
  //       advance_paid,
  //       guests_expected || null,
  //       null, // guests_attended
  //       payment_method || 'cash',
  //       payment_status,
  //       transaction_id || null,
  //       status,
  //       null, // cancellation_reason
  //       customer_name,
  //       customer_phone,
  //       customer_email || null,
  //       customer_address || null,
  //       special_requests || null,
  //       catering_requirements || null,
  //       setup_requirements || null,
  //       userId,
  //       has_room_bookings ? 1 : 0, // Convert boolean to tinyint
  //       roomBookingIdsArray ? JSON.stringify(roomBookingIdsArray) : null,
  //       total_rooms_booked || 0
  //     ];

  //     console.log('SQL:', sql);
  //     console.log('Values count:', values.length);

  //     const [result] = await pool.execute(sql, values);

  //     // Create junction entries if room bookings exist
  //     if (has_room_bookings && roomBookingIdsArray && roomBookingIdsArray.length > 0) {
  //       for (const roomBookingId of roomBookingIdsArray) {
  //         await pool.execute(
  //           `INSERT INTO function_room_bookings_junction (function_booking_id, room_booking_id)
  //          VALUES (?, ?)`,
  //           [result.insertId, roomBookingId]
  //         );
  //       }
  //     }

  //     // Update room status if confirmed
  //     if (status === 'confirmed') {
  //       await pool.execute(
  //         'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
  //         ['booked', function_room_id, hotelId]
  //       );
  //     }

  //     res.status(201).json({
  //       success: true,
  //       message: has_room_bookings
  //         ? 'Function booking with accommodation created successfully'
  //         : 'Function booking created successfully',
  //       data: {
  //         id: result.insertId,
  //         booking_reference: bookingReference,
  //         invoice_number: invoiceNumber,
  //         check_in_date,
  //         check_out_date,
  //         start_time,
  //         end_time,
  //         total_amount,
  //         advance_paid,
  //         balance_due: total_amount - advance_paid,
  //         has_room_bookings,
  //         total_rooms_booked
  //       }
  //     });
  //   } catch (error) {
  //     console.error('❌ Create function booking with rooms error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: error.message
  //     });
  //   }
  // }

  // In functionRoomController.js - update createFunctionBookingWithRooms method

  createFunctionBookingWithRooms = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      const {
        function_room_id,
        event_name,
        event_type,
        check_in_date,
        check_out_date,
        start_time,
        end_time,
        setup_time,
        breakdown_time,
        rate_type,
        rate_amount,
        subtotal,
        service_charge = 0,
        gst = 0,
        catering_charges = 0,
        decoration_charges = 0,
        other_charges = 0,
        discount = 0,
        total_amount,
        advance_paid = 0,
        guests_expected,
        payment_method,
        payment_status = 'pending',
        transaction_id,
        status = 'confirmed',
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        special_requests,
        catering_requirements,
        setup_requirements,
        customer_id = null,
        has_room_bookings = false,
        room_booking_ids = null,
        total_rooms_booked = 0
      } = req.body;

      // Validate required fields
      if (!function_room_id || !event_name || !check_in_date || !check_out_date || !start_time || !end_time || !customer_name || !customer_phone) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Missing required fields'
        });
      }

      // Validate dates
      if (new Date(check_out_date) < new Date(check_in_date)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DATES',
          message: 'Check-out date cannot be before check-in date'
        });
      }

      // Check room availability for the entire date range
      const isAvailable = await this.checkAvailabilityInternal(
        function_room_id,
        hotelId,
        check_in_date,
        check_out_date,
        start_time,
        end_time
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'ROOM_NOT_AVAILABLE',
          message: 'Function room is not available for the selected date and time range'
        });
      }

      // Generate booking reference
      const bookingReference = `EVT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // Generate invoice number
      const invoiceNumber = `INV-${bookingReference}`;

      // Calculate total hours
      const totalHours = this.calculateHours(start_time, end_time);

      // Parse room booking IDs if provided
      let roomBookingIdsArray = null;
      if (room_booking_ids) {
        try {
          roomBookingIdsArray = typeof room_booking_ids === 'string'
            ? JSON.parse(room_booking_ids)
            : room_booking_ids;
        } catch (e) {
          console.error('Error parsing room_booking_ids:', e);
        }
      }

      // Determine payment status based on advance payment
      // If advance_paid equals total_amount, it's completed
      // Otherwise it's pending or partial
      let finalPaymentStatus = payment_status;
      if (advance_paid >= total_amount) {
        finalPaymentStatus = 'completed';
      } else if (advance_paid > 0) {
        finalPaymentStatus = 'pending'; // or 'partial' if you have that status
      }

      // Start a transaction to ensure both inserts succeed
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Clean SQL query - make sure there are no hidden characters
        const sql = `INSERT INTO function_bookings (
      hotel_id, function_room_id, customer_id, booking_reference,
      invoice_number, event_name, event_type, booking_date, end_date, start_time, end_time,
      setup_time, breakdown_time, total_hours, rate_type, rate_amount,
      subtotal, service_charge, gst, catering_charges, decoration_charges,
      other_charges, discount, total_amount, advance_paid,
      guests_expected, guests_attended, payment_method, payment_status, transaction_id,
      status, cancellation_reason, customer_name, customer_phone, customer_email,
      customer_address, special_requests, catering_requirements,
      setup_requirements, created_by, has_room_bookings, 
      room_booking_ids, total_rooms_booked
    ) VALUES (${Array(43).fill('?').join(', ')})`;

        const values = [
          hotelId,
          function_room_id,
          customer_id,
          bookingReference,
          invoiceNumber,
          event_name,
          event_type,
          check_in_date,
          check_out_date,
          start_time,
          end_time,
          setup_time || null,
          breakdown_time || null,
          totalHours,
          rate_type,
          rate_amount,
          subtotal,
          service_charge,
          gst,
          catering_charges,
          decoration_charges,
          other_charges,
          discount,
          total_amount,
          advance_paid,
          guests_expected || null,
          null, // guests_attended
          payment_method || 'cash',
          finalPaymentStatus, // Use the determined payment status
          transaction_id || null,
          status,
          null, // cancellation_reason
          customer_name,
          customer_phone,
          customer_email || null,
          customer_address || null,
          special_requests || null,
          catering_requirements || null,
          setup_requirements || null,
          userId,
          has_room_bookings ? 1 : 0,
          roomBookingIdsArray ? JSON.stringify(roomBookingIdsArray) : null,
          total_rooms_booked || 0
        ];

        console.log('SQL:', sql);
        console.log('Values count:', values.length);

        const [result] = await connection.execute(sql, values);

        // Insert into function_booking_amounts table
        // Determine transaction type based on payment
        let transactionType = 'payment';
        let transactionAmount = total_amount;

        // If advance paid is less than total, record the advance payment
        if (advance_paid > 0 && advance_paid < total_amount) {
          transactionType = 'advance';
          transactionAmount = advance_paid;
        }

        // Insert into amount tracking table
        const [amountResult] = await connection.execute(
          `INSERT INTO function_booking_amounts (
          function_booking_id, hotel_id, transaction_type, payment_method,
          transaction_amount, transaction_reference, description, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            hotelId,
            transactionType,
            payment_method || 'cash',
            transactionAmount,
            transaction_id || null,
            transactionType === 'advance' ? 'Advance payment received' : 'Full payment received',
            userId
          ]
        );

        console.log(`💰 Transaction recorded: ${transactionType} of ₹${transactionAmount}`);

        // Create junction entries if room bookings exist
        if (has_room_bookings && roomBookingIdsArray && roomBookingIdsArray.length > 0) {
          for (const roomBookingId of roomBookingIdsArray) {
            await connection.execute(
              `INSERT INTO function_room_bookings_junction (function_booking_id, room_booking_id)
           VALUES (?, ?)`,
              [result.insertId, roomBookingId]
            );
          }
        }

        // Update room status if confirmed
        if (status === 'confirmed') {
          await connection.execute(
            'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
            ['booked', function_room_id, hotelId]
          );
        }

        // Commit the transaction
        await connection.commit();

        res.status(201).json({
          success: true,
          message: has_room_bookings
            ? 'Function booking with accommodation created successfully'
            : 'Function booking created successfully',
          data: {
            id: result.insertId,
            booking_reference: bookingReference,
            invoice_number: invoiceNumber,
            check_in_date,
            check_out_date,
            start_time,
            end_time,
            total_amount,
            advance_paid,
            balance_due: total_amount - advance_paid,
            payment_status: finalPaymentStatus,
            has_room_bookings,
            total_rooms_booked,
            transaction: {
              id: amountResult.insertId,
              type: transactionType,
              amount: transactionAmount,
              method: payment_method
            }
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Create function booking with rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }
  // Check function room availability - SINGLE VERSION
  // In functionRoomController.js, ensure you have this method (the date range version):
  checkFunctionRoomAvailability = async (req, res) => {
    try {
      const {
        room_id,
        check_in_date,
        check_out_date,
        start_time,
        end_time,
        exclude_booking_id
      } = req.body;

      const hotelId = req.user.hotel_id;

      console.log('🔍 API Checking availability:', {
        room_id,
        check_in_date,
        check_out_date,
        start_time,
        end_time,
        hotelId
      });

      // Validate required fields
      if (!room_id || !check_in_date || !check_out_date || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Missing required fields for availability check'
        });
      }

      const isAvailable = await this.checkAvailabilityInternal(
        room_id,
        hotelId,
        check_in_date,
        check_out_date,
        start_time,
        end_time,
        exclude_booking_id
      );

      res.json({
        success: true,
        data: {
          available: isAvailable,
          room_id,
          check_in_date,
          check_out_date,
          start_time,
          end_time
        }
      });
    } catch (error) {
      console.error('❌ API Check availability error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get all function bookings
  getFunctionBookings = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { date, status, room_id } = req.query;

      let query = `
        SELECT fb.*, fr.room_number, fr.name as room_name, fr.capacity
        FROM function_bookings fb
        LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
        WHERE fb.hotel_id = ?
      `;

      const params = [hotelId];

      if (date) {
        query += ` AND fb.booking_date = ?`;
        params.push(date);
      }

      if (status) {
        query += ` AND fb.status = ?`;
        params.push(status);
      }

      if (room_id) {
        query += ` AND fb.function_room_id = ?`;
        params.push(room_id);
      }

      query += ` ORDER BY fb.booking_date DESC, fb.start_time`;

      const [bookings] = await pool.execute(query, params);

      res.json({
        success: true,
        data: bookings,
        count: bookings.length
      });
    } catch (error) {
      console.error('❌ Get function bookings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get single function booking
  getFunctionBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const [bookings] = await pool.execute(
        `SELECT fb.*, fr.room_number, fr.name as room_name, fr.capacity, fr.base_price
         FROM function_bookings fb
         LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
         WHERE fb.id = ? AND fb.hotel_id = ?`,
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      res.json({
        success: true,
        data: bookings[0]
      });
    } catch (error) {
      console.error('❌ Get function booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get function booking with associated room bookings
  getFunctionBookingWithRooms = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Get function booking
      const [bookings] = await pool.execute(
        `SELECT fb.*, fr.room_number, fr.name as room_name, fr.capacity, fr.base_price
         FROM function_bookings fb
         LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
         WHERE fb.id = ? AND fb.hotel_id = ?`,
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];

      // Get associated room bookings if any
      let roomBookings = [];
      if (booking.has_room_bookings && booking.room_booking_ids) {
        const roomBookingIds = JSON.parse(booking.room_booking_ids);

        if (roomBookingIds.length > 0) {
          const placeholders = roomBookingIds.map(() => '?').join(',');
          const [roomBookingsData] = await pool.execute(
            `SELECT b.*, r.room_number, r.type as room_type
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE b.id IN (${placeholders}) AND b.hotel_id = ?`,
            [...roomBookingIds, hotelId]
          );
          roomBookings = roomBookingsData;
        }
      }

      res.json({
        success: true,
        data: {
          ...booking,
          room_bookings: roomBookings
        }
      });
    } catch (error) {
      console.error('❌ Get function booking with rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get all function bookings with room bookings
  getAllFunctionBookingsWithRooms = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { date, status, room_id } = req.query;

      let query = `
        SELECT fb.*, fr.room_number, fr.name as room_name, fr.capacity
        FROM function_bookings fb
        LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
        WHERE fb.hotel_id = ?
      `;

      const params = [hotelId];

      if (date) {
        query += ` AND fb.booking_date = ?`;
        params.push(date);
      }

      if (status) {
        query += ` AND fb.status = ?`;
        params.push(status);
      }

      if (room_id) {
        query += ` AND fb.function_room_id = ?`;
        params.push(room_id);
      }

      query += ` ORDER BY fb.booking_date DESC, fb.start_time`;

      const [bookings] = await pool.execute(query, params);

      // Get room bookings for each function booking
      for (const booking of bookings) {
        if (booking.has_room_bookings && booking.room_booking_ids) {
          try {
            const roomBookingIds = JSON.parse(booking.room_booking_ids);
            if (roomBookingIds.length > 0) {
              const placeholders = roomBookingIds.map(() => '?').join(',');
              const [roomBookingsData] = await pool.execute(
                `SELECT b.id, b.room_id, r.room_number, r.type as room_type, 
                        b.from_date, b.to_date, b.total as amount
                 FROM bookings b
                 LEFT JOIN rooms r ON b.room_id = r.id
                 WHERE b.id IN (${placeholders}) AND b.hotel_id = ?`,
                [...roomBookingIds, hotelId]
              );
              booking.room_bookings = roomBookingsData;
            }
          } catch (e) {
            booking.room_bookings = [];
          }
        } else {
          booking.room_bookings = [];
        }
      }

      res.json({
        success: true,
        data: bookings,
        count: bookings.length
      });
    } catch (error) {
      console.error('❌ Get all function bookings with rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Update function booking
  updateFunctionBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const updates = req.body;

      // Get current booking
      const [currentBookings] = await pool.execute(
        'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (currentBookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const currentBooking = currentBookings[0];

      // If date/time/room changed, check availability
      if ((updates.booking_date || updates.end_date || updates.start_time || updates.end_time || updates.function_room_id) &&
        updates.status !== 'cancelled') {

        const checkRoomId = updates.function_room_id || currentBooking.function_room_id;
        const checkInDate = updates.booking_date || currentBooking.booking_date;
        const checkOutDate = updates.end_date || currentBooking.end_date || currentBooking.booking_date;
        const checkStartTime = updates.start_time || currentBooking.start_time;
        const checkEndTime = updates.end_time || currentBooking.end_time;

        const isAvailable = await this.checkAvailabilityInternal(
          checkRoomId,
          hotelId,
          checkInDate,
          checkOutDate,
          checkStartTime,
          checkEndTime,
          id
        );

        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            error: 'ROOM_NOT_AVAILABLE',
            message: 'Function room is not available for the selected date and time'
          });
        }
      }

      // Build dynamic update query
      const fields = [];
      const values = [];

      const allowedFields = [
        'function_room_id', 'customer_id', 'event_name', 'event_type',
        'booking_date', 'end_date', 'start_time', 'end_time', 'setup_time', 'breakdown_time',
        'rate_type', 'rate_amount', 'subtotal', 'service_charge', 'gst',
        'catering_charges', 'decoration_charges', 'other_charges', 'discount',
        'total_amount', 'advance_paid', 'guests_expected', 'guests_attended',
        'payment_method', 'payment_status', 'transaction_id', 'status',
        'cancellation_reason', 'customer_name', 'customer_phone', 'customer_email',
        'customer_address', 'special_requests', 'catering_requirements',
        'setup_requirements'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      });

      if (fields.length > 0) {
        values.push(id, hotelId);

        const [result] = await pool.execute(
          `UPDATE function_bookings SET ${fields.join(', ')} WHERE id = ? AND hotel_id = ?`,
          values
        );

        // Update room status if needed
        if (updates.status === 'cancelled' || updates.status === 'completed') {
          await pool.execute(
            'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
            ['available', currentBooking.function_room_id, hotelId]
          );
        } else if (updates.status === 'confirmed') {
          await pool.execute(
            'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
            ['booked', currentBooking.function_room_id, hotelId]
          );
        }
      }

      res.json({
        success: true,
        message: 'Function booking updated successfully'
      });
    } catch (error) {
      console.error('❌ Update function booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Update payment status
  // updateFunctionBookingPayment = async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const hotelId = req.user.hotel_id;
  //     const { payment_status, transaction_id, advance_paid } = req.body;

  //     const updates = [];
  //     const values = [];

  //     if (payment_status) {
  //       updates.push('payment_status = ?');
  //       values.push(payment_status);
  //     }

  //     if (transaction_id) {
  //       updates.push('transaction_id = ?');
  //       values.push(transaction_id);
  //     }

  //     if (advance_paid !== undefined) {
  //       updates.push('advance_paid = ?');
  //       values.push(advance_paid);
  //     }

  //     if (updates.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'NO_UPDATES',
  //         message: 'No fields to update'
  //       });
  //     }

  //     values.push(id, hotelId);

  //     const [result] = await pool.execute(
  //       `UPDATE function_bookings SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`,
  //       values
  //     );

  //     if (result.affectedRows === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'BOOKING_NOT_FOUND',
  //         message: 'Function booking not found'
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       message: 'Payment status updated successfully'
  //     });
  //   } catch (error) {
  //     console.error('❌ Update payment status error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: error.message
  //     });
  //   }
  // }

  // Update payment status
  // updateFunctionBookingPayment = async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const hotelId = req.user.hotel_id;
  //     const { payment_status, transaction_id, advance_paid } = req.body;

  //     const updates = [];
  //     const values = [];

  //     if (payment_status) {
  //       updates.push('payment_status = ?');
  //       values.push(payment_status);
  //     }

  //     if (transaction_id) {
  //       updates.push('transaction_id = ?');
  //       values.push(transaction_id);
  //     }

  //     if (advance_paid !== undefined) {
  //       updates.push('advance_paid = ?');
  //       values.push(advance_paid);
  //       // DON'T try to update balance_due - it's automatic!
  //     }

  //     if (updates.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'NO_UPDATES',
  //         message: 'No fields to update'
  //       });
  //     }

  //     values.push(id, hotelId);

  //     // Simple update without balance_due
  //     const query = `UPDATE function_bookings SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`;

  //     const [result] = await pool.execute(query, values);

  //     if (result.affectedRows === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'BOOKING_NOT_FOUND',
  //         message: 'Function booking not found'
  //       });
  //     }

  //     // Get the updated booking
  //     const [updatedBooking] = await pool.execute(
  //       'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
  //       [id, hotelId]
  //     );

  //     res.json({
  //       success: true,
  //       message: 'Payment status updated successfully',
  //       data: updatedBooking[0]
  //     });

  //   } catch (error) {
  //     console.error('❌ Update payment status error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: error.message
  //     });
  //   }
  // }
  // Update payment status and record payment
  updateFunctionBookingPayment = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      const { payment_status, transaction_id, advance_paid } = req.body;

      // Get current booking to know the total amount
      const [bookings] = await pool.execute(
        'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];
      const currentAdvance = Number(booking.advance_paid) || 0;
      const totalAmount = Number(booking.total_amount) || 0;

      // Calculate new advance and determine transaction type
      let newAdvance = currentAdvance;
      let transactionAmount = 0;
      let transactionType = 'payment';

      if (advance_paid !== undefined) {
        newAdvance = Number(advance_paid);
        transactionAmount = newAdvance - currentAdvance;

        // Determine transaction type based on whether this completes the payment
        if (transactionAmount > 0) {
          if (newAdvance >= totalAmount) {
            transactionType = 'payment';
          } else {
            transactionType = 'advance';
          }
        }
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        const updates = [];
        const values = [];

        if (payment_status) {
          updates.push('payment_status = ?');
          values.push(payment_status);
        }

        if (transaction_id) {
          updates.push('transaction_id = ?');
          values.push(transaction_id);
        }

        if (advance_paid !== undefined) {
          updates.push('advance_paid = ?');
          values.push(newAdvance);
        }

        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'NO_UPDATES',
            message: 'No fields to update'
          });
        }

        values.push(id, hotelId);

        // Update function booking
        const query = `UPDATE function_bookings SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`;
        const [result] = await connection.execute(query, values);

        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            error: 'BOOKING_NOT_FOUND',
            message: 'Function booking not found'
          });
        }

        // Record the payment/advance in function_booking_amounts
        if (transactionAmount > 0) {
          const [amountResult] = await connection.execute(
            `INSERT INTO function_booking_amounts (
            function_booking_id, hotel_id, transaction_type, payment_method,
            transaction_amount, transaction_reference, description, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              hotelId,
              transactionType,
              booking.payment_method || 'cash',
              transactionAmount,
              transaction_id || null,
              transactionType === 'advance'
                ? `Additional advance payment of ₹${transactionAmount}`
                : `Final payment of ₹${transactionAmount}`,
              userId
            ]
          );

          console.log(`💰 Additional ${transactionType} recorded: ₹${transactionAmount}`);
        }

        // Commit transaction
        await connection.commit();

        // Get the updated booking
        const [updatedBooking] = await pool.execute(
          'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
          [id, hotelId]
        );

        res.json({
          success: true,
          message: 'Payment status updated successfully',
          data: updatedBooking[0]
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Update payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }





  // cancelFunctionBooking = async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const hotelId = req.user.hotel_id;
  //     const userId = req.user.userId;
  //     const {
  //       cancellation_reason,
  //       refund_method,
  //       refund_amount,
  //       original_advance,
  //       deducted_amount,
  //       deduction_reason,
  //       refund_notes,
  //       process_refund,  // Add this from frontend
  //       refund_type      // Add this from frontend
  //     } = req.body;

  //     // Get booking details
  //     const [bookings] = await pool.execute(
  //       'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
  //       [id, hotelId]
  //     );

  //     if (bookings.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'BOOKING_NOT_FOUND',
  //         message: 'Function booking not found'
  //       });
  //     }

  //     const booking = bookings[0];
  //     const advancePaid = Number(booking.advance_paid) || 0;
  //     const hasAdvance = advancePaid > 0;
  //     const totalAmount = Number(booking.total_amount) || 0;

  //     // Validate refund if processing
  //     if (process_refund) {
  //       if (!refund_method) {
  //         return res.status(400).json({
  //           success: false,
  //           error: 'REFUND_METHOD_REQUIRED',
  //           message: 'Refund method is required'
  //         });
  //       }

  //       if (refund_amount === undefined || refund_amount === null) {
  //         return res.status(400).json({
  //           success: false,
  //           error: 'REFUND_AMOUNT_REQUIRED',
  //           message: 'Refund amount is required'
  //         });
  //       }

  //       const maxRefund = hasAdvance ? advancePaid : totalAmount;

  //       if (refund_amount > maxRefund) {
  //         return res.status(400).json({
  //           success: false,
  //           error: 'INVALID_REFUND_AMOUNT',
  //           message: `Refund amount cannot exceed ${maxRefund}`
  //         });
  //       }

  //       if (refund_amount < 0) {
  //         return res.status(400).json({
  //           success: false,
  //           error: 'INVALID_REFUND_AMOUNT',
  //           message: 'Refund amount cannot be negative'
  //         });
  //       }

  //       if (hasAdvance && deducted_amount > 0 && !deduction_reason) {
  //         return res.status(400).json({
  //           success: false,
  //           error: 'DEDUCTION_REASON_REQUIRED',
  //           message: 'Deduction reason is required'
  //         });
  //       }
  //     }

  //     // Start transaction
  //     const connection = await pool.getConnection();
  //     await connection.beginTransaction();

  //     try {
  //       // 1. Update booking status to cancelled
  //       await connection.execute(
  //         `UPDATE function_bookings 
  //        SET status = 'cancelled', 
  //            cancellation_reason = ?,
  //            payment_status = ?,
  //            updated_at = NOW()
  //        WHERE id = ? AND hotel_id = ?`,
  //         [
  //           cancellation_reason || null,
  //           hasAdvance ? 'refunded' : (process_refund ? 'refunded' : 'pending'),
  //           id,
  //           hotelId
  //         ]
  //       );

  //       // 2. Update function room status back to available
  //       await connection.execute(
  //         'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
  //         ['available', booking.function_room_id, hotelId]
  //       );

  //       // 3. If there are associated room bookings, handle them
  //       if (booking.has_room_bookings && booking.room_booking_ids) {
  //         try {
  //           const roomBookingIds = JSON.parse(booking.room_booking_ids);
  //           if (roomBookingIds.length > 0) {
  //             const placeholders = roomBookingIds.map(() => '?').join(',');
  //             await connection.execute(
  //               `UPDATE bookings 
  //              SET status = 'cancelled', 
  //                  cancellation_reason = ? 
  //              WHERE id IN (${placeholders}) AND hotel_id = ?`,
  //               [cancellation_reason || 'Cancelled due to function cancellation', ...roomBookingIds, hotelId]
  //             );
  //           }
  //         } catch (e) {
  //           console.error('Error parsing room booking IDs:', e);
  //         }
  //       }

  //       // 4. Create refund record if processing refund AND amount > 0
  //       let refundRecord = null;
  //       if (process_refund && refund_amount > 0) {
  //         // Generate refund transaction ID
  //         const refundTransactionId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  //         // Calculate deduction if any (only for advance bookings)
  //         const deductedAmount = hasAdvance ? (advancePaid - refund_amount) : null;
  //         const deductionNotes = deductedAmount > 0
  //           ? `Deducted: ₹${deductedAmount} (${deduction_reason || 'Cancellation fee'})`
  //           : null;

  //         // Insert into refunds table
  //         const [refundResult] = await connection.execute(
  //           `INSERT INTO function_booking_refunds (
  //           function_booking_id, hotel_id, refund_amount, refund_method, 
  //           refund_status, transaction_id, refund_reason, processed_by,
  //           processed_at, notes, original_advance, deducted_amount, deduction_reason,
  //           refund_type
  //         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
  //           [
  //             id,
  //             hotelId,
  //             refund_amount,
  //             refund_method,
  //             'pending',
  //             refundTransactionId,
  //             cancellation_reason || (hasAdvance ? 'Advance payment refund' : 'Goodwill refund'),
  //             userId,
  //             refund_notes || null,
  //             hasAdvance ? advancePaid : totalAmount,
  //             deductedAmount,
  //             deductedAmount > 0 ? deduction_reason : null,
  //             refund_type || (hasAdvance ? (refund_amount === advancePaid ? 'full' : 'partial') : 'partial')
  //           ]
  //         );

  //         // Get the inserted refund record
  //         const [refundDetails] = await connection.execute(
  //           'SELECT * FROM function_booking_refunds WHERE id = ?',
  //           [refundResult.insertId]
  //         );
  //         refundRecord = refundDetails[0];

  //         // If refund method is cash, mark it as completed immediately
  //         if (refund_method === 'cash') {
  //           await connection.execute(
  //             `UPDATE function_booking_refunds 
  //            SET refund_status = 'completed', 
  //                processed_at = NOW() 
  //            WHERE id = ?`,
  //             [refundResult.insertId]
  //           );
  //           refundRecord.refund_status = 'completed';
  //         }

  //         console.log('💰 Refund record created:', {
  //           refund_id: refundResult.insertId,
  //           amount: refund_amount,
  //           original_amount: hasAdvance ? advancePaid : totalAmount,
  //           deducted: deductedAmount,
  //           method: refund_method,
  //           type: refund_type,
  //           transaction_id: refundTransactionId
  //         });
  //       }

  //       // Commit transaction
  //       await connection.commit();

  //       // Prepare response message
  //       let message = 'Function booking cancelled successfully';
  //       if (process_refund) {
  //         if (hasAdvance) {
  //           if (refund_amount < advancePaid) {
  //             const deducted = advancePaid - refund_amount;
  //             message = `Function booking cancelled. ₹${deducted.toFixed(2)} deducted as ${deduction_reason || 'cancellation fee'}. ₹${refund_amount.toFixed(2)} will be refunded via ${refund_method}.`;
  //           } else {
  //             message = `Function booking cancelled. Full advance of ₹${refund_amount.toFixed(2)} will be refunded via ${refund_method}.`;
  //           }
  //         } else {
  //           message = `Function booking cancelled. Goodwill refund of ₹${refund_amount.toFixed(2)} will be processed via ${refund_method}.`;
  //         }
  //       }

  //       res.json({
  //         success: true,
  //         message: message,
  //         data: {
  //           booking: {
  //             id: parseInt(id),
  //             booking_reference: booking.booking_reference,
  //             status: 'cancelled',
  //             payment_status: hasAdvance ? 'refunded' : (process_refund ? 'refunded' : 'pending'),
  //             advance_paid: advancePaid,
  //             total_amount: totalAmount
  //           },
  //           refund: refundRecord ? {
  //             id: refundRecord.id,
  //             amount: refundRecord.refund_amount,
  //             original_amount: refundRecord.original_advance,
  //             deducted_amount: refundRecord.deducted_amount,
  //             method: refundRecord.refund_method,
  //             status: refundRecord.refund_status,
  //             transaction_id: refundRecord.transaction_id,
  //             processed_at: refundRecord.processed_at,
  //             type: refundRecord.refund_type
  //           } : null
  //         }
  //       });

  //     } catch (error) {
  //       await connection.rollback();
  //       throw error;
  //     } finally {
  //       connection.release();
  //     }

  //   } catch (error) {
  //     console.error('❌ Cancel function booking error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: error.message
  //     });
  //   }
  // };




  cancelFunctionBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      const {
        cancellation_reason,
        refund_method,
        refund_amount,
        original_advance,
        deducted_amount,
        deduction_reason,
        refund_notes,
        process_refund,  // Add this from frontend
        refund_type      // Add this from frontend
      } = req.body;

      // Get booking details
      const [bookings] = await pool.execute(
        'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];
      const advancePaid = Number(booking.advance_paid) || 0;
      const hasAdvance = advancePaid > 0;
      const totalAmount = Number(booking.total_amount) || 0;

      // Validate refund if processing
      if (process_refund) {
        if (!refund_method) {
          return res.status(400).json({
            success: false,
            error: 'REFUND_METHOD_REQUIRED',
            message: 'Refund method is required'
          });
        }

        if (refund_amount === undefined || refund_amount === null) {
          return res.status(400).json({
            success: false,
            error: 'REFUND_AMOUNT_REQUIRED',
            message: 'Refund amount is required'
          });
        }

        const maxRefund = hasAdvance ? advancePaid : totalAmount;

        if (refund_amount > maxRefund) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_REFUND_AMOUNT',
            message: `Refund amount cannot exceed ${maxRefund}`
          });
        }

        if (refund_amount < 0) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_REFUND_AMOUNT',
            message: 'Refund amount cannot be negative'
          });
        }

        if (hasAdvance && deducted_amount > 0 && !deduction_reason) {
          return res.status(400).json({
            success: false,
            error: 'DEDUCTION_REASON_REQUIRED',
            message: 'Deduction reason is required'
          });
        }
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 1. Update booking status to cancelled
        await connection.execute(
          `UPDATE function_bookings 
         SET status = 'cancelled', 
             cancellation_reason = ?,
             payment_status = ?,
             updated_at = NOW()
         WHERE id = ? AND hotel_id = ?`,
          [
            cancellation_reason || null,
            hasAdvance ? 'refunded' : (process_refund ? 'refunded' : 'pending'),
            id,
            hotelId
          ]
        );

        // 2. Update function room status back to available
        await connection.execute(
          'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
          ['available', booking.function_room_id, hotelId]
        );

        // 3. If there are associated room bookings, handle them
        if (booking.has_room_bookings && booking.room_booking_ids) {
          try {
            console.log('='.repeat(50));
            console.log('🔄 PROCESSING ASSOCIATED ROOM BOOKINGS');
            console.log('='.repeat(50));
            console.log('Function Booking ID:', booking.id);
            console.log('Has Room Bookings:', booking.has_room_bookings);
            console.log('Room Booking IDs JSON (raw):', booking.room_booking_ids);
            console.log('Type of raw data:', typeof booking.room_booking_ids);

            // Parse the JSON
            let roomBookingIds = [];
            try {
              // If it's already an object, use it directly
              if (typeof booking.room_booking_ids === 'object' && booking.room_booking_ids !== null) {
                roomBookingIds = booking.room_booking_ids;
                console.log('📋 Already an object:', roomBookingIds);
              }
              // If it's a string, try to parse it
              else if (typeof booking.room_booking_ids === 'string') {
                // Check if it's a JSON string that starts with [
                if (booking.room_booking_ids.trim().startsWith('[')) {
                  roomBookingIds = JSON.parse(booking.room_booking_ids);
                  console.log('📋 Parsed JSON array:', roomBookingIds);
                }
                // Check if it's a single number in a string
                else if (!isNaN(parseInt(booking.room_booking_ids))) {
                  roomBookingIds = [parseInt(booking.room_booking_ids)];
                  console.log('📋 Converted single number to array:', roomBookingIds);
                }
                // Maybe it's a comma-separated list
                else if (booking.room_booking_ids.includes(',')) {
                  roomBookingIds = booking.room_booking_ids.split(',').map(id => parseInt(id.trim()));
                  console.log('📋 Parsed comma-separated list:', roomBookingIds);
                }
              }

              console.log('📋 Final room booking IDs:', roomBookingIds);
              console.log('📋 Is Array?', Array.isArray(roomBookingIds));
              console.log('📋 Length:', roomBookingIds.length);

            } catch (parseError) {
              console.error('❌ JSON Parse Error:', parseError);
              // Last resort - try to extract numbers from the string
              if (typeof booking.room_booking_ids === 'string') {
                const matches = booking.room_booking_ids.match(/\d+/g);
                if (matches && matches.length > 0) {
                  roomBookingIds = matches.map(Number);
                  console.log('📋 Extracted numbers from string:', roomBookingIds);
                }
              }
            }

            // Ensure roomBookingIds is an array and has items
            if (Array.isArray(roomBookingIds) && roomBookingIds.length > 0) {
              // Filter out any null/undefined values
              roomBookingIds = roomBookingIds.filter(id => id != null);

              console.log(`✅ Processing ${roomBookingIds.length} room booking IDs`);
              console.log('📋 Cleaned IDs:', roomBookingIds);

              const placeholders = roomBookingIds.map(() => '?').join(',');

              // Check if these bookings exist
              console.log('🔍 Checking bookings with IDs:', roomBookingIds);

              // FIXED: Removed 'room_number' from the SELECT statement
              const [existingBookings] = await connection.execute(
                `SELECT id, room_id, status, from_date, to_date 
         FROM bookings 
         WHERE id IN (${placeholders}) AND hotel_id = ?`,
                [...roomBookingIds, hotelId]
              );

              console.log('📊 Existing bookings found:', existingBookings.length);

              if (existingBookings.length > 0) {
                console.log('Booking details:', existingBookings.map(b => ({
                  id: b.id,
                  room_id: b.room_id,
                  status: b.status,
                  from_date: b.from_date,
                  to_date: b.to_date
                })));

                // FINAL FIX: Removed 'cancellation_reason' and 'updated_at' from the UPDATE statement
                const [updateResult] = await connection.execute(
                  `UPDATE bookings 
           SET status = 'cancelled'
           WHERE id IN (${placeholders}) AND hotel_id = ?`,
                  [...roomBookingIds, hotelId]
                );

                console.log(`✅ Updated ${updateResult.affectedRows} bookings to cancelled`);

                // Get unique room IDs to update
                const roomIds = [...new Set(existingBookings.map(b => b.room_id).filter(id => id))];
                console.log('🏨 Unique room IDs to update:', roomIds);


                // Update each room to available
                for (const roomId of roomIds) {
                  if (roomId) {
                    console.log(`🔄 Setting room ID ${roomId} to available...`);

                    // First check current room status
                    const [currentRoom] = await connection.execute(
                      'SELECT id, room_number, status FROM rooms WHERE id = ? AND hotel_id = ?',
                      [roomId, hotelId]
                    );

                    console.log('📊 Current room status:', currentRoom[0]?.status);

                    // FINAL FIX: Removed updated_at since it doesn't exist in rooms table
                    const [updateRoomResult] = await connection.execute(
                      'UPDATE rooms SET status = ? WHERE id = ? AND hotel_id = ?',
                      ['available', roomId, hotelId]
                    );

                    console.log(`✅ Room update result:`, updateRoomResult.affectedRows > 0 ? 'SUCCESS' : 'FAILED');

                    // Verify the update
                    const [verifyRoom] = await connection.execute(
                      'SELECT id, room_number, status FROM rooms WHERE id = ? AND hotel_id = ?',
                      [roomId, hotelId]
                    );

                    if (verifyRoom.length > 0) {
                      console.log(`📊 Room ${verifyRoom[0].room_number} status after update:`, verifyRoom[0].status);
                    }
                  }
                }

                console.log(`✅ Successfully processed ${roomBookingIds.length} associated room bookings and freed ${roomIds.length} rooms`);
              } else {
                console.log('⚠️ No existing bookings found with these IDs');
                console.log('📋 IDs we searched for:', roomBookingIds);
              }
            } else {
              console.log('⚠️ No valid room booking IDs to process');
              console.log('roomBookingIds value:', roomBookingIds);
            }
            console.log('='.repeat(50));
          } catch (e) {
            console.error('❌ Error processing room bookings:', e);
            console.error('Error details:', e.message);
            console.error('Error stack:', e.stack);
            // Don't throw the error - let the cancellation continue
          }
        }
        // 4. Create refund record if processing refund AND amount > 0
        let refundRecord = null;
        if (process_refund && refund_amount > 0) {
          // Generate refund transaction ID
          const refundTransactionId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          // Calculate deduction if any (only for advance bookings)
          const deductedAmount = hasAdvance ? (advancePaid - refund_amount) : null;
          const deductionNotes = deductedAmount > 0
            ? `Deducted: ₹${deductedAmount} (${deduction_reason || 'Cancellation fee'})`
            : null;

          // Insert into refunds table
          const [refundResult] = await connection.execute(
            `INSERT INTO function_booking_refunds (
            function_booking_id, hotel_id, refund_amount, refund_method, 
            refund_status, transaction_id, refund_reason, processed_by,
            processed_at, notes, original_advance, deducted_amount, deduction_reason,
            refund_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
            [
              id,
              hotelId,
              refund_amount,
              refund_method,
              'pending',
              refundTransactionId,
              cancellation_reason || (hasAdvance ? 'Advance payment refund' : 'Goodwill refund'),
              userId,
              refund_notes || null,
              hasAdvance ? advancePaid : totalAmount,
              deductedAmount,
              deductedAmount > 0 ? deduction_reason : null,
              refund_type || (hasAdvance ? (refund_amount === advancePaid ? 'full' : 'partial') : 'partial')
            ]
          );

          // Get the inserted refund record
          const [refundDetails] = await connection.execute(
            'SELECT * FROM function_booking_refunds WHERE id = ?',
            [refundResult.insertId]
          );
          refundRecord = refundDetails[0];

          // If refund method is cash, mark it as completed immediately
          if (refund_method === 'cash') {
            await connection.execute(
              `UPDATE function_booking_refunds 
             SET refund_status = 'completed', 
                 processed_at = NOW() 
             WHERE id = ?`,
              [refundResult.insertId]
            );
            refundRecord.refund_status = 'completed';
          }

          console.log('💰 Refund record created:', {
            refund_id: refundResult.insertId,
            amount: refund_amount,
            original_amount: hasAdvance ? advancePaid : totalAmount,
            deducted: deductedAmount,
            method: refund_method,
            type: refund_type,
            transaction_id: refundTransactionId
          });
        }

        // Commit transaction
        await connection.commit();

        // Prepare response message
        let message = 'Function booking cancelled successfully';
        if (process_refund) {
          if (hasAdvance) {
            if (refund_amount < advancePaid) {
              const deducted = advancePaid - refund_amount;
              message = `Function booking cancelled. ₹${deducted.toFixed(2)} deducted as ${deduction_reason || 'cancellation fee'}. ₹${refund_amount.toFixed(2)} will be refunded via ${refund_method}.`;
            } else {
              message = `Function booking cancelled. Full advance of ₹${refund_amount.toFixed(2)} will be refunded via ${refund_method}.`;
            }
          } else {
            message = `Function booking cancelled. Goodwill refund of ₹${refund_amount.toFixed(2)} will be processed via ${refund_method}.`;
          }
        }

        res.json({
          success: true,
          message: message,
          data: {
            booking: {
              id: parseInt(id),
              booking_reference: booking.booking_reference,
              status: 'cancelled',
              payment_status: hasAdvance ? 'refunded' : (process_refund ? 'refunded' : 'pending'),
              advance_paid: advancePaid,
              total_amount: totalAmount
            },
            refund: refundRecord ? {
              id: refundRecord.id,
              amount: refundRecord.refund_amount,
              original_amount: refundRecord.original_advance,
              deducted_amount: refundRecord.deducted_amount,
              method: refundRecord.refund_method,
              status: refundRecord.refund_status,
              transaction_id: refundRecord.transaction_id,
              processed_at: refundRecord.processed_at,
              type: refundRecord.refund_type
            } : null
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Cancel function booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  };


  // Delete function booking (permanent)
  deleteFunctionBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('🗑️ Deleting function booking:', { id, hotelId, userId: req.user.userId });

      // First, get the booking details to know which function room to update
      const [bookings] = await pool.execute(
        'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];

      // Start a transaction to ensure data consistency
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // If booking has associated room bookings, handle them
        if (booking.has_room_bookings && booking.room_booking_ids) {
          try {
            const roomBookingIds = JSON.parse(booking.room_booking_ids);

            if (roomBookingIds.length > 0) {
              // Delete the associated room bookings as well
              const placeholders = roomBookingIds.map(() => '?').join(',');
              await connection.execute(
                `DELETE FROM bookings WHERE id IN (${placeholders}) AND hotel_id = ?`,
                [...roomBookingIds, hotelId]
              );

              console.log(`✅ Deleted ${roomBookingIds.length} associated room bookings`);
            }
          } catch (e) {
            console.error('Error parsing room booking IDs:', e);
            // Continue with deletion even if room booking IDs can't be parsed
          }
        }

        // Delete the function booking
        const [result] = await connection.execute(
          'DELETE FROM function_bookings WHERE id = ? AND hotel_id = ?',
          [id, hotelId]
        );

        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            error: 'BOOKING_NOT_FOUND',
            message: 'Function booking not found'
          });
        }

        // Update the function room status back to available
        await connection.execute(
          'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
          ['available', booking.function_room_id, hotelId]
        );

        await connection.commit();

        res.json({
          success: true,
          message: 'Function booking deleted successfully',
          data: {
            id: parseInt(id),
            booking_reference: booking.booking_reference
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Delete function booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // ===========================================
  // OTHER FUNCTIONS (keep as they were)
  // ===========================================

  // Get availability calendar
  getAvailabilityCalendar = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { year, month } = req.query;

      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const lastDay = new Date(year, parseInt(month), 0).getDate();
      const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

      // Get all function rooms
      const [rooms] = await pool.execute(
        'SELECT id, room_number, name, capacity FROM function_rooms WHERE hotel_id = ?',
        [hotelId]
      );

      // Get bookings for the month
      const [bookings] = await pool.execute(
        `SELECT function_room_id, booking_date, start_time, end_time, status, event_name
         FROM function_bookings
         WHERE hotel_id = ?
         AND booking_date BETWEEN ? AND ?
         AND status IN ('confirmed', 'pending')
         ORDER BY booking_date, start_time`,
        [hotelId, startDate, endDate]
      );

      // Build calendar data
      const calendar = {};

      rooms.forEach(room => {
        calendar[room.id] = {
          ...room,
          bookings: {}
        };
      });

      bookings.forEach(booking => {
        if (calendar[booking.function_room_id]) {
          if (!calendar[booking.function_room_id].bookings[booking.booking_date]) {
            calendar[booking.function_room_id].bookings[booking.booking_date] = [];
          }
          calendar[booking.function_room_id].bookings[booking.booking_date].push(booking);
        }
      });

      res.json({
        success: true,
        data: Object.values(calendar)
      });
    } catch (error) {
      console.error('❌ Get availability calendar error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Block function room for maintenance
  blockFunctionRoom = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      const {
        function_room_id,
        start_date,
        end_date,
        start_time,
        end_time,
        reason,
        type = 'maintenance'
      } = req.body;

      const [result] = await pool.execute(
        `INSERT INTO function_room_blocks (
          hotel_id, function_room_id, start_date, end_date,
          start_time, end_time, reason, type, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hotelId, function_room_id, start_date, end_date,
          start_time || null, end_time || null, reason || null,
          type, userId
        ]
      );

      // Update room status
      await pool.execute(
        'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
        [type === 'maintenance' ? 'maintenance' : 'blocked', function_room_id, hotelId]
      );

      res.status(201).json({
        success: true,
        message: `Function room ${type === 'maintenance' ? 'set to maintenance' : 'blocked'} successfully`,
        data: {
          id: result.insertId
        }
      });
    } catch (error) {
      console.error('❌ Block function room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Get function room statistics
  getFunctionRoomStats = async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { period = 'month' } = req.query;

      let dateCondition = '';

      if (period === 'today') {
        dateCondition = 'AND booking_date = CURDATE()';
      } else if (period === 'week') {
        dateCondition = 'AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      } else if (period === 'month') {
        dateCondition = 'AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      } else if (period === 'year') {
        dateCondition = 'AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
      }

      // Room counts by status
      const [roomStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_rooms,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_rooms,
          SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked_rooms,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_rooms,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_rooms
        FROM function_rooms
        WHERE hotel_id = ?
      `, [hotelId]);

      // Booking statistics
      const [bookingStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
          SUM(total_amount) as total_revenue,
          SUM(advance_paid) as total_advance,
          AVG(total_amount) as avg_booking_value,
          COUNT(DISTINCT customer_name) as unique_customers
        FROM function_bookings
        WHERE hotel_id = ?
        ${dateCondition}
      `, [hotelId]);

      // Popular event types
      const [eventTypes] = await pool.execute(`
        SELECT event_type, COUNT(*) as count
        FROM function_bookings
        WHERE hotel_id = ? AND event_type IS NOT NULL
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 5
      `, [hotelId]);

      res.json({
        success: true,
        data: {
          roomStats: roomStats[0] || {},
          bookingStats: bookingStats[0] || {},
          popularEventTypes: eventTypes,
          period
        }
      });
    } catch (error) {
      console.error('❌ Get function room stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }

  // Invoice functions (keep as they were)
  generateInvoicePDF = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Fetch booking details with function room info and hotel info from users table
      const [bookings] = await pool.execute(
        `SELECT fb.*, 
                fr.room_number, 
                fr.name as room_name, 
                fr.capacity,
                fr.base_price,
                fr.half_day_price,
                fr.hourly_rate,
                u.name as hotel_name,
                u.email as hotel_email,
                u.phone as hotel_phone,
                h.address as hotel_address,
                h.gst_number as hotel_gstin
         FROM function_bookings fb
         LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
         LEFT JOIN hotels h ON fb.hotel_id = h.id
         LEFT JOIN users u ON fb.hotel_id = u.hotel_id AND u.role = 'admin'
         WHERE fb.id = ? AND fb.hotel_id = ?
         LIMIT 1`,
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];

      // Generate invoice number using booking reference
      const invoiceNumber = `INV-${booking.booking_reference || `FB-${id}-${Date.now().toString().slice(-6)}`}`;

      // Optional: Try to update invoice_number if column exists (will fail silently if not)
      try {
        await pool.execute(
          'UPDATE function_bookings SET invoice_number = ? WHERE id = ?',
          [invoiceNumber, id]
        );
      } catch (e) {
        // Column doesn't exist, just continue
        console.log('Note: invoice_number column not found in function_bookings table');
      }

      // Get room bookings if any
      let roomBookings = [];
      if (booking.has_room_bookings && booking.room_booking_ids) {
        try {
          const roomBookingIds = JSON.parse(booking.room_booking_ids);
          if (roomBookingIds.length > 0) {
            const placeholders = roomBookingIds.map(() => '?').join(',');
            const [rooms] = await pool.execute(
              `SELECT b.*, r.room_number, r.type 
               FROM bookings b
               LEFT JOIN rooms r ON b.room_id = r.id
               WHERE b.id IN (${placeholders}) AND b.hotel_id = ?`,
              [...roomBookingIds, hotelId]
            );
            roomBookings = rooms;
          }
        } catch (e) {
          console.error('Error parsing room booking IDs:', e);
        }
      }

      // Generate PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=function-invoice-${invoiceNumber}.pdf`);

      doc.pipe(res);

      // Helper function to format currency
      const formatCurrency = (amount) => {
        return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      // Helper function to format date
      const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      const formatTime = (time) => {
        if (!time) return 'N/A';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };

      // ========== HOTEL HEADER ==========
      doc.fontSize(20).font('Helvetica-Bold').text(booking.hotel_name || 'Hotel Management System', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(booking.hotel_address || '', { align: 'center' });
      if (booking.hotel_phone || booking.hotel_email) {
        doc.fontSize(9).text(`Contact: ${booking.hotel_phone || ''} ${booking.hotel_email || ''}`, { align: 'center' });
      }
      if (booking.hotel_gstin) {
        doc.fontSize(9).text(`GSTIN: ${booking.hotel_gstin}`, { align: 'center' });
      }
      doc.moveDown();

      // ========== INVOICE TITLE ==========
      doc.fontSize(18).font('Helvetica-Bold').text('FUNCTION ROOM INVOICE', { align: 'center', underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice No: ${invoiceNumber}`, { align: 'right' });
      doc.text(`Date: ${formatDate(new Date())}`, { align: 'right' });
      doc.text(`Booking Ref: ${booking.booking_reference}`, { align: 'right' });
      doc.moveDown();

      // ========== CUSTOMER DETAILS ==========
      doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica');
      doc.text(booking.customer_name || 'N/A');
      doc.text(`Phone: ${booking.customer_phone || 'N/A'}`);
      if (booking.customer_email) doc.text(`Email: ${booking.customer_email}`);
      if (booking.customer_address) doc.text(`Address: ${booking.customer_address}`);
      doc.moveDown();

      // ========== EVENT DETAILS ==========
      doc.fontSize(11).font('Helvetica-Bold').text('Event Details:');
      doc.fontSize(10).font('Helvetica');

      const eventDetails = [
        ['Event Name:', booking.event_name],
        ['Event Type:', booking.event_type || 'N/A'],
        ['Venue:', `${booking.room_name} (Room ${booking.room_number})`],
        ['Check-in:', `${formatDate(booking.booking_date)} ${formatTime(booking.start_time)}`],
        ['Check-out:', `${formatDate(booking.end_date || booking.booking_date)} ${formatTime(booking.end_time)}`],
        ['Total Hours:', booking.total_hours ? `${booking.total_hours} hrs` : 'N/A'],
        ['Expected Guests:', booking.guests_expected || 'N/A'],
        ['Booking Reference:', booking.booking_reference]
      ];

      let y = doc.y;
      eventDetails.forEach(([label, value]) => {
        doc.text(label, 50, y, { continued: true, width: 120 });
        doc.text(value, 170, y, { width: 380 });
        y += 20;
        doc.y = y;
      });
      doc.moveDown();

      // ========== ACCOMMODATION DETAILS (if any) ==========
      if (booking.has_room_bookings && roomBookings.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('Accommodation Details:');
        doc.fontSize(10).font('Helvetica');
        doc.text(`${roomBookings.length} room(s) blocked with this event`);
        doc.moveDown(0.5);

        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Room', 50, doc.y, { width: 80 });
        doc.text('Check-in', 130, doc.y, { width: 100 });
        doc.text('Check-out', 230, doc.y, { width: 100 });
        doc.text('Nights', 330, doc.y, { width: 60 });
        doc.moveDown();

        // Table rows
        doc.fontSize(9).font('Helvetica');
        roomBookings.forEach(room => {
          const nights = Math.ceil(
            (new Date(room.to_date) - new Date(room.from_date)) / (1000 * 60 * 60 * 24)
          );
          doc.text(`Room ${room.room_number}`, 50, doc.y, { width: 80 });
          doc.text(formatDate(room.from_date), 130, doc.y, { width: 100 });
          doc.text(formatDate(room.to_date), 230, doc.y, { width: 100 });
          doc.text(nights.toString(), 330, doc.y, { width: 60 });
          doc.moveDown();
        });
        doc.moveDown();
      }

      // ========== CHARGES BREAKDOWN ==========
      doc.fontSize(11).font('Helvetica-Bold').text('Charges Breakdown:');
      doc.moveDown(0.5);

      const charges = [
        ['Room Charges:', formatCurrency(booking.rate_amount || booking.subtotal || 0)],
        ['Service Charge:', formatCurrency(booking.service_charge || 0)],
        ['Catering Charges:', formatCurrency(booking.catering_charges || 0)],
        ['Decoration Charges:', formatCurrency(booking.decoration_charges || 0)],
        ['Other Charges:', formatCurrency(booking.other_charges || 0)]
      ];

      charges.forEach(([label, value]) => {
        if (parseFloat(value.replace(/[^0-9.-]+/g, '')) > 0) {
          doc.fontSize(10).font('Helvetica');
          doc.text(label, 50, doc.y, { continued: true, width: 150 });
          doc.text(value, 400, doc.y, { width: 100, align: 'right' });
          doc.moveDown();
        }
      });

      if (booking.discount > 0) {
        doc.fontSize(10).font('Helvetica').fillColor('green');
        doc.text('Discount:', 50, doc.y, { continued: true, width: 150 });
        doc.text(`- ${formatCurrency(booking.discount)}`, 400, doc.y, { width: 100, align: 'right' });
        doc.fillColor('black');
        doc.moveDown();
      }

      // GST
      doc.fontSize(10).font('Helvetica');
      doc.text('GST (18%):', 50, doc.y, { continued: true, width: 150 });
      doc.text(formatCurrency(booking.gst || 0), 400, doc.y, { width: 100, align: 'right' });
      doc.moveDown();

      // Line separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total Amount:', 50, doc.y, { continued: true, width: 150 });
      doc.text(formatCurrency(booking.total_amount), 400, doc.y, { width: 100, align: 'right' });
      doc.moveDown();

      // Advance payment
      if (booking.advance_paid > 0) {
        doc.fontSize(10).font('Helvetica').fillColor('blue');
        doc.text('Advance Paid:', 50, doc.y, { continued: true, width: 150 });
        doc.text(formatCurrency(booking.advance_paid), 400, doc.y, { width: 100, align: 'right' });
        doc.fillColor('black');
        doc.moveDown();

        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Balance Due:', 50, doc.y, { continued: true, width: 150 });
        doc.text(formatCurrency(booking.total_amount - booking.advance_paid), 400, doc.y, { width: 100, align: 'right' });
      }

      // ========== PAYMENT STATUS ==========
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Payment Status:', 50, doc.y, { continued: true, width: 150 });
      doc.fontSize(10).font('Helvetica');

      const paymentStatus = booking.payment_status || 'pending';
      let statusColor = 'orange';
      if (paymentStatus === 'completed') statusColor = 'green';
      if (paymentStatus === 'partial') statusColor = 'blue';
      if (paymentStatus === 'refunded') statusColor = 'purple';

      doc.fillColor(statusColor);
      doc.text(paymentStatus.toUpperCase(), 200, doc.y);
      doc.fillColor('black');
      doc.moveDown();

      // ========== SPECIAL REQUESTS ==========
      if (booking.special_requests) {
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Special Requests:', 50, doc.y);
        doc.fontSize(9).font('Helvetica');
        doc.text(booking.special_requests, 50, doc.y + 15, { width: 500 });
        doc.moveDown(2);
      }

      // ========== TERMS AND CONDITIONS ==========
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica');
      doc.text('Terms & Conditions:', 50, doc.y);
      doc.fontSize(7);
      doc.text('1. This is a computer generated invoice and does not require signature.', 70, doc.y + 15);
      doc.text('2. All amounts are in Indian Rupees (INR).', 70, doc.y + 30);
      doc.text('3. GST is applicable as per the rates mentioned.', 70, doc.y + 45);
      doc.text('4. Advance payment is non-refundable for confirmed bookings.', 70, doc.y + 60);
      doc.text('5. Cancellation policy applies as per hotel terms.', 70, doc.y + 75);

      // ========== FOOTER ==========
      doc.fontSize(8).font('Helvetica');
      doc.text('Thank you for choosing our services!', 50, 750, { align: 'center' });

      doc.end();

    } catch (error) {
      console.error('❌ Error generating function booking invoice:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  };

  // Get invoice by booking ID
  getFunctionBookingInvoice = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const [bookings] = await pool.execute(
        `SELECT booking_reference, created_at 
         FROM function_bookings 
         WHERE id = ? AND hotel_id = ?`,
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      res.json({
        success: true,
        data: {
          invoice_number: `INV-${bookings[0].booking_reference}`,
          generated_at: bookings[0].created_at
        }
      });

    } catch (error) {
      console.error('❌ Error fetching function booking invoice:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  };

  // Generate invoice JSON
  generateInvoiceJSON = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('📄 Generating function booking invoice JSON:', { id, hotelId });

      const [bookings] = await pool.execute(
        `SELECT fb.*, 
              fr.room_number, 
              fr.name as room_name, 
              fr.capacity,
              fr.base_price,
              fr.half_day_price,
              fr.hourly_rate,
              u.name as hotel_name,
              u.email as hotel_email,
              u.phone as hotel_phone,
              h.address as hotel_address,
              h.gst_number as hotel_gstin,
              h.logo_image as hotel_logo
       FROM function_bookings fb
       LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
       LEFT JOIN hotels h ON fb.hotel_id = h.id
       LEFT JOIN users u ON fb.hotel_id = u.hotel_id AND u.role = 'admin'
       WHERE fb.id = ? AND fb.hotel_id = ?
       LIMIT 1`,
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];

      // Generate invoice number
      let invoiceNumber = booking.invoice_number;
      if (!invoiceNumber) {
        invoiceNumber = `FINV-${Date.now().toString().slice(-8)}-${id}`;
      }

      // Get room bookings if any
      let roomBookings = [];
      if (booking.has_room_bookings && booking.room_booking_ids) {
        try {
          const roomBookingIds = JSON.parse(booking.room_booking_ids);
          if (roomBookingIds.length > 0) {
            const placeholders = roomBookingIds.map(() => '?').join(',');
            const [rooms] = await pool.execute(
              `SELECT b.*, r.room_number, r.type 
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE b.id IN (${placeholders}) AND b.hotel_id = ?`,
              [...roomBookingIds, hotelId]
            );
            roomBookings = rooms;
          }
        } catch (e) {
          console.error('Error parsing room booking IDs:', e);
        }
      }

      // Format helper functions
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      const formatTime = (time) => {
        if (!time) return '';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };

      // Calculate nights for accommodation rooms
      const calculateNights = (fromDate, toDate) => {
        try {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          const diffTime = Math.abs(to - from);
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
          return 1;
        }
      };

      // Prepare charges breakdown
      const charges = [
        {
          description: `Room Charges (${booking.rate_type || 'full_day'})`,
          amount: parseFloat(booking.rate_amount || booking.subtotal || 0)
        }
      ];

      if (parseFloat(booking.service_charge || 0) > 0) {
        charges.push({
          description: 'Service Charge',
          amount: parseFloat(booking.service_charge)
        });
      }

      if (parseFloat(booking.catering_charges || 0) > 0) {
        charges.push({
          description: 'Catering Charges',
          amount: parseFloat(booking.catering_charges)
        });
      }

      if (parseFloat(booking.decoration_charges || 0) > 0) {
        charges.push({
          description: 'Decoration Charges',
          amount: parseFloat(booking.decoration_charges)
        });
      }

      if (parseFloat(booking.other_charges || 0) > 0) {
        charges.push({
          description: 'Other Charges',
          amount: parseFloat(booking.other_charges)
        });
      }

      // Add GST
      charges.push({
        description: `GST (${booking.gst_percentage || 18}%)`,
        amount: parseFloat(booking.gst || 0)
      });

      // Add discount as negative if present
      if (parseFloat(booking.discount || 0) > 0) {
        charges.push({
          description: 'Discount',
          amount: -parseFloat(booking.discount)
        });
      }

      // Prepare invoice data
      const invoiceData = {
        success: true,
        data: {
          invoiceNumber: invoiceNumber,
          invoiceDate: formatDate(new Date()),
          bookingReference: booking.booking_reference,
          hotel: {
            name: booking.hotel_name || 'Hotel',
            address: booking.hotel_address || '',
            phone: booking.hotel_phone || '',
            email: booking.hotel_email || '',
            gstin: booking.hotel_gstin || '',
            logo: booking.hotel_logo || null
          },
          customer: {
            name: booking.customer_name || '',
            phone: booking.customer_phone || '',
            email: booking.customer_email || '',
            address: booking.customer_address || ''
          },
          event: {
            name: booking.event_name || '',
            type: booking.event_type || '',
            checkInDate: formatDate(booking.booking_date),
            checkOutDate: formatDate(booking.end_date || booking.booking_date),
            startTime: formatTime(booking.start_time),
            endTime: formatTime(booking.end_time),
            totalHours: booking.total_hours || this.calculateHours(booking.start_time, booking.end_time),
            guestsExpected: booking.guests_expected || 0,
            venue: `${booking.room_name || 'Function Room'} (Room ${booking.room_number || 'N/A'})`
          },
          accommodation: roomBookings.map(room => ({
            roomNumber: room.room_number,
            roomType: room.type,
            fromDate: formatDate(room.from_date),
            toDate: formatDate(room.to_date),
            nights: calculateNights(room.from_date, room.to_date)
          })),
          charges: charges,
          subtotal: parseFloat(booking.subtotal || booking.rate_amount || 0),
          totalAmount: parseFloat(booking.total_amount || 0),
          advancePaid: parseFloat(booking.advance_paid || 0),
          balanceDue: parseFloat((booking.total_amount || 0) - (booking.advance_paid || 0)),
          payment: {
            method: booking.payment_method || 'cash',
            status: booking.payment_status || 'pending',
            transactionId: booking.transaction_id || ''
          },
          status: booking.status,
          specialRequests: booking.special_requests || '',
          cateringRequirements: booking.catering_requirements || '',
          createdAt: booking.created_at,
          footer: {
            note: 'Thank you for choosing our services!',
            terms: 'Cancellation policy applies as per hotel terms.',
            companyName: booking.hotel_name || 'Hotel Management System'
          }
        }
      };

      console.log('✅ Function invoice JSON generated:', invoiceNumber);
      res.json(invoiceData);

    } catch (error) {
      console.error('❌ Error generating function booking invoice JSON:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  };

  // Download function booking invoice as HTML
  downloadFunctionInvoiceHTML = async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('📥 Downloading function booking invoice HTML:', { id, hotelId });

      const [bookings] = await pool.execute(
        `SELECT fb.*, 
              fr.room_number, 
              fr.name as room_name, 
              fr.capacity,
              fr.base_price,
              fr.half_day_price,
              fr.hourly_rate,
              u.name as hotel_name,
              u.email as hotel_email,
              u.phone as hotel_phone,
              h.address as hotel_address,
              h.gst_number as hotel_gstin,
              h.logo_image as hotel_logo
       FROM function_bookings fb
       LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
       LEFT JOIN hotels h ON fb.hotel_id = h.id
       LEFT JOIN users u ON fb.hotel_id = u.hotel_id AND u.role = 'admin'
       WHERE fb.id = ? AND fb.hotel_id = ?
       LIMIT 1`,
        [id, hotelId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Function booking not found'
        });
      }

      const booking = bookings[0];

      // Get room bookings if any
      let roomBookings = [];
      if (booking.has_room_bookings && booking.room_booking_ids) {
        try {
          const roomBookingIds = JSON.parse(booking.room_booking_ids);
          if (roomBookingIds.length > 0) {
            const placeholders = roomBookingIds.map(() => '?').join(',');
            const [rooms] = await pool.execute(
              `SELECT b.*, r.room_number, r.type 
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE b.id IN (${placeholders}) AND b.hotel_id = ?`,
              [...roomBookingIds, hotelId]
            );
            roomBookings = rooms;
          }
        } catch (e) {
          console.error('Error parsing room booking IDs:', e);
        }
      }

      // Generate invoice number
      const invoiceNumber = booking.invoice_number || `FINV-${Date.now().toString().slice(-8)}-${id}`;

      // Format helper functions
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      const formatTime = (time) => {
        if (!time) return '';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };

      const formatCurrency = (amount) => {
        return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      const calculateNights = (fromDate, toDate) => {
        try {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        } catch (e) {
          return 1;
        }
      };

      // Create HTML invoice
      const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Function Invoice - ${booking.booking_reference}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2c3e50; }
        .logo-section { flex: 1; display: flex; flex-direction: column; align-items: flex-start; }
        .hotel-logo { max-width: 180px; max-height: 100px; height: auto; margin-bottom: 15px; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .hotel-details { text-align: right; flex: 1; }
        .hotel-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-title { text-align: center; font-size: 28px; margin: 30px 0; color: #2c3e50; text-transform: uppercase; letter-spacing: 2px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-weight: bold; }
        .details-section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 30px; }
        .details-box { flex: 1; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0; }
        .details-label { font-weight: bold; color: #2c3e50; margin-bottom: 15px; display: block; font-size: 16px; padding-bottom: 8px; border-bottom: 2px solid #3498db; }
        .table { width: 100%; border-collapse: collapse; margin: 30px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .table th { background-color: #2c3e50; color: white; padding: 15px; text-align: left; border-bottom: 2px solid #1a252f; font-weight: bold; font-size: 14px; }
        .table td { padding: 15px; border-bottom: 1px solid #e0e0e0; font-size: 14px; }
        .total-row { font-weight: bold; font-size: 16px; background-color: #e8f4fd; }
        .total-row td { border-top: 2px solid #3498db; color: #2c3e50; }
        .payment-status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-partial { background-color: #cce5ff; color: #004085; }
        .footer { margin-top: 50px; text-align: center; font-size: 13px; color: #666; padding-top: 30px; border-top: 2px dashed #ddd; }
        .barcode { text-align: center; font-family: 'Courier New', monospace; letter-spacing: 3px; margin-top: 20px; background-color: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 18px; font-weight: bold; color: #2c3e50; border: 1px dashed #ccc; }
        @media print { body { margin: 0; padding: 20px; } .hotel-logo { max-width: 120px; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          ${booking.hotel_logo ? `<img src="${booking.hotel_logo}" alt="Hotel Logo" class="hotel-logo">` : `<div class="hotel-name">${booking.hotel_name || 'Hotel'}</div>`}
          <div style="font-size: 11px; color: #666; margin-top: 5px;">Generated by Hotel Management System</div>
        </div>
        <div class="hotel-details">
          <div class="hotel-info" style="font-size: 13px; color: #666;">
            ${booking.hotel_address || ''}<br>
            📞 ${booking.hotel_phone || 'N/A'}<br>
            🏷️ GSTIN: ${booking.hotel_gstin || 'N/A'}<br>
            📧 ${booking.hotel_email || 'N/A'}
          </div>
        </div>
      </div>
      
      <div class="invoice-title">FUNCTION ROOM TAX INVOICE</div>
      
      <div style="text-align: center; font-size: 18px; margin-bottom: 20px;">
        Invoice No: ${invoiceNumber} | Date: ${formatDate(new Date())}
      </div>
      
      <div class="details-section">
        <div class="details-box">
          <span class="details-label">Bill To:</span>
          <div><strong>${booking.customer_name || 'N/A'}</strong></div>
          <div>📱 ${booking.customer_phone || 'N/A'}</div>
          ${booking.customer_email ? `<div>📧 ${booking.customer_email}</div>` : ''}
          ${booking.customer_address ? `<div>📍 ${booking.customer_address}</div>` : ''}
        </div>
        
        <div class="details-box">
          <span class="details-label">Booking Details:</span>
          <div><strong>Ref:</strong> ${booking.booking_reference}</div>
          <div><strong>Event:</strong> ${booking.event_name}</div>
          <div><strong>Type:</strong> ${booking.event_type || 'N/A'}</div>
          <div><strong>Venue:</strong> ${booking.room_name} (${booking.room_number})</div>
        </div>
      </div>
      
      <div class="details-section">
        <div class="details-box">
          <span class="details-label">Event Schedule:</span>
          <div><strong>Check-in:</strong> ${formatDate(booking.booking_date)} ${formatTime(booking.start_time)}</div>
          <div><strong>Check-out:</strong> ${formatDate(booking.end_date || booking.booking_date)} ${formatTime(booking.end_time)}</div>
          <div><strong>Duration:</strong> ${booking.total_hours || 0} hours</div>
          <div><strong>Guests:</strong> ${booking.guests_expected || 0}</div>
        </div>
        
        <div class="details-box">
          <span class="details-label">Payment Details:</span>
          <div><strong>Method:</strong> ${booking.payment_method || 'cash'}</div>
          <div><strong>Status:</strong> 
            <span class="payment-status status-${booking.payment_status || 'pending'}">
              ${(booking.payment_status || 'pending').toUpperCase()}
            </span>
          </div>
          ${booking.transaction_id ? `<div><strong>TXN ID:</strong> ${booking.transaction_id}</div>` : ''}
        </div>
      </div>
      
      ${roomBookings.length > 0 ? `
        <div style="margin-top: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            Blocked Rooms (${roomBookings.length})
          </h3>
          <table class="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
              </tr>
            </thead>
            <tbody>
              ${roomBookings.map(room => {
        const nights = calculateNights(room.from_date, room.to_date);
        return `<tr><td>Room ${room.room_number}</td><td>${formatDate(room.from_date)}</td><td>${formatDate(room.to_date)}</td><td>${nights}</td></tr>`;
      }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Room Charges (${booking.rate_type || 'full_day'})</td>
            <td style="text-align: right;">${formatCurrency(booking.rate_amount || booking.subtotal || 0)}</td>
          </tr>
          ${booking.service_charge > 0 ? `<tr><td>Service Charge</td><td style="text-align: right;">${formatCurrency(booking.service_charge)}</td></tr>` : ''}
          ${booking.catering_charges > 0 ? `<tr><td>Catering Charges</td><td style="text-align: right;">${formatCurrency(booking.catering_charges)}</td></tr>` : ''}
          ${booking.decoration_charges > 0 ? `<tr><td>Decoration Charges</td><td style="text-align: right;">${formatCurrency(booking.decoration_charges)}</td></tr>` : ''}
          ${booking.other_charges > 0 ? `<tr><td>Other Charges</td><td style="text-align: right;">${formatCurrency(booking.other_charges)}</td></tr>` : ''}
          ${booking.discount > 0 ? `<tr style="color: green;"><td>Discount</td><td style="text-align: right;">-${formatCurrency(booking.discount)}</td></tr>` : ''}
          <tr>
            <td>GST (${booking.gst_percentage || 18}%)</td>
            <td style="text-align: right;">${formatCurrency(booking.gst || 0)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>TOTAL AMOUNT</strong></td>
            <td style="text-align: right; font-size: 18px;"><strong>${formatCurrency(booking.total_amount)}</strong></td>
          </tr>
        </tbody>
      </table>
      
      ${booking.advance_paid > 0 ? `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Advance Paid:</strong></span>
            <span style="color: green;">${formatCurrency(booking.advance_paid)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px;">
            <span><strong>Balance Due:</strong></span>
            <span><strong>${formatCurrency((booking.total_amount || 0) - (booking.advance_paid || 0))}</strong></span>
          </div>
        </div>
      ` : ''}
      
      ${booking.special_requests ? `
        <div style="margin-top: 30px; padding: 15px; background-color: #f0f8ff; border-radius: 8px;">
          <strong>Special Requests:</strong><br>
          ${booking.special_requests.replace(/\n/g, '<br>')}
        </div>
      ` : ''}
      
      <div class="footer">
        <div style="margin-bottom: 20px;">
          <div><strong>Terms & Conditions:</strong></div>
          <div style="font-size: 12px; color: #666; line-height: 1.5;">
            1. This is a computer generated invoice<br>
            2. Cancellation policy applies as per hotel terms<br>
            3. All amounts are in Indian Rupees (INR)<br>
            4. GST is applicable as per the rates mentioned
          </div>
        </div>
        <div class="barcode">${booking.booking_reference}</div>
        <div style="margin-top: 20px; font-size: 11px; color: #999;">
          Generated on: ${new Date().toLocaleString('en-IN')}
        </div>
      </div>
    </body>
    </html>
    `;

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="function-invoice-${booking.booking_reference}.html"`);
      res.send(invoiceHTML);

    } catch (error) {
      console.error('❌ Download function invoice HTML error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  };
  // Get all refunds for a booking
  getBookingRefunds = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const hotelId = req.user.hotel_id;

      const [refunds] = await pool.execute(
        `SELECT r.*, u.name as processed_by_name 
       FROM function_booking_refunds r
       LEFT JOIN users u ON r.processed_by = u.id
       WHERE r.function_booking_id  = ? AND r.hotel_id = ?
       ORDER BY r.created_at DESC`,
        [bookingId, hotelId]
      );

      res.json({
        success: true,
        data: refunds
      });

    } catch (error) {
      console.error('❌ Get booking refunds error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  };

  // Update refund status (mark as completed)
  updateRefundStatus = async (req, res) => {
    try {
      const { refundId } = req.params;
      const hotelId = req.user.hotel_id;
      const { refund_status, transaction_id, notes } = req.body;

      const [result] = await pool.execute(
        `UPDATE function_booking_refunds 
       SET refund_status = ?,
           transaction_id = COALESCE(?, transaction_id),
           notes = CONCAT(notes, '\n', ?),
           processed_at = NOW()
       WHERE id = ? AND hotel_id = ?`,
        [refund_status, transaction_id, notes || '', refundId, hotelId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'REFUND_NOT_FOUND',
          message: 'Refund record not found'
        });
      }

      // Get updated refund
      const [updatedRefund] = await pool.execute(
        'SELECT * FROM function_booking_refunds WHERE id = ?',
        [refundId]
      );

      res.json({
        success: true,
        message: 'Refund status updated successfully',
        data: updatedRefund[0]
      });

    } catch (error) {
      console.error('❌ Update refund status error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  };

  // Add this to functionRoomController.js

// Get payment/transaction history for a booking
getBookingPaymentHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const hotelId = req.user.hotel_id;

    const [transactions] = await pool.execute(
      `SELECT * FROM function_booking_amounts 
       WHERE function_booking_id = ? AND hotel_id = ?
       ORDER BY created_at DESC`,
      [bookingId, hotelId]
    );

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('❌ Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
};
}

module.exports = new FunctionRoomController();