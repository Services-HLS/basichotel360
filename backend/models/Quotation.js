const { pool } = require("../config/database");

class Quotation {
  // Create quotation - INSERT FIRST, then set quotation_number from auto-increment ID
  // This is 100% race-condition proof: MySQL auto-increment is atomic by design
  static async create(quotationData) {
    const currentYear = new Date().getFullYear();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Step 1: INSERT with a temporary unique placeholder for quotation_number
      // Two simultaneous requests each get their own unique auto-increment ID
      const tempPlaceholder = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const [result] = await connection.execute(
        `INSERT INTO quotations (
          hotel_id, room_id, room_number, customer_id, quotation_number,
          from_date, to_date, from_time, to_time, nights, guests,
          room_price, service_charge, gst, other_expenses, total_amount,
          customer_name, customer_phone, customer_email, customer_address,
          special_requests, purpose_of_visit, terms_and_conditions,
          validity_days, expiry_date, status, payment_terms, notes, created_by,
          converted_to_booking_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationData.hotel_id,
          quotationData.room_id || null,
          quotationData.room_number || null,
          quotationData.customer_id || null,
          tempPlaceholder, // Temporary - will be updated below
          quotationData.from_date,
          quotationData.to_date,
          quotationData.from_time || "14:00",
          quotationData.to_time || "12:00",
          quotationData.nights || 1,
          quotationData.guests || 1,
          quotationData.room_price || 0,
          quotationData.service_charge || 0,
          quotationData.gst || 0,
          quotationData.other_expenses || 0,
          quotationData.total_amount || 0,
          quotationData.customer_name,
          quotationData.customer_phone,
          quotationData.customer_email || "",
          quotationData.customer_address || "",
          quotationData.special_requests || "",
          quotationData.purpose_of_visit || "",
          quotationData.terms_and_conditions || "Standard terms apply",
          quotationData.validity_days || 7,
          quotationData.expiry_date,
          quotationData.status || "pending",
          quotationData.payment_terms || "50% advance, 50% on check-in",
          quotationData.notes || "",
          quotationData.created_by || null,
          null, // converted_to_booking_id
        ],
      );

      // Step 2: Use the unique auto-increment ID to build a guaranteed-unique quotation number
      const insertId = result.insertId;
      const quotationNumber = `QT-${currentYear}-${String(insertId).padStart(4, "0")}`;

      // Step 3: Update the row with the real quotation number
      await connection.execute(
        `UPDATE quotations SET quotation_number = ? WHERE id = ?`,
        [quotationNumber, insertId],
      );

      // Commit both INSERT and UPDATE together
      await connection.commit();
      console.log(`✅ Quotation created: ${quotationNumber} (id: ${insertId})`);
      return { id: insertId, quotation_number: quotationNumber };
    } catch (error) {
      await connection.rollback();
      console.error("❌ Failed to create quotation:", error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find by ID - UPDATED TO JOIN WITH ROOMS
  static async findById(id, hotelId) {
    const [rows] = await pool.execute(
      `SELECT q.*, 
              r.room_number as actual_room_number, 
              r.type as room_type,
              r.floor as room_floor
       FROM quotations q
       LEFT JOIN rooms r ON q.room_id = r.id OR q.room_number = r.room_number
       WHERE q.id = ? AND q.hotel_id = ?`,
      [id, hotelId],
    );

    const quotation = rows[0];

    // Ensure room_number is populated
    if (quotation) {
      if (!quotation.room_number && quotation.actual_room_number) {
        quotation.room_number = quotation.actual_room_number;
      }
    }

    return quotation;
  }

  // Get all quotations for hotel - UPDATED WITH ROOM INFO
  static async findByHotel(hotelId, filters = {}) {
    let query = `
      SELECT q.*, 
             COALESCE(r.room_number, q.room_number) as display_room_number,
             r.type as room_type,
             r.floor as room_floor,
             u.name as created_by_name
      FROM quotations q
      LEFT JOIN rooms r ON q.room_id = r.id OR q.room_number = r.room_number
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.hotel_id = ?
    `;

    const params = [hotelId];

    if (filters.status) {
      query += ` AND q.status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      query += ` AND (
        q.customer_name LIKE ? OR 
        q.quotation_number LIKE ? OR 
        q.customer_phone LIKE ? OR
        q.room_number LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY q.created_at DESC`;

    const [rows] = await pool.execute(query, params);

    // Ensure room_number is properly set
    return rows.map((row) => ({
      ...row,
      room_number: row.display_room_number || row.room_number,
    }));
  }

  // Update quotation - UPDATED TO INCLUDE ROOM_NUMBER
  static async update(id, hotelId, updateData) {
    const updates = [];
    const params = [];

    const fields = {
      room_id: updateData.room_id,
      room_number: updateData.room_number,
      from_date: updateData.from_date,
      to_date: updateData.to_date,
      room_price: updateData.room_price,
      service_charge: updateData.service_charge,
      gst: updateData.gst,
      other_expenses: updateData.other_expenses,
      total_amount: updateData.total_amount,
      customer_name: updateData.customer_name,
      customer_phone: updateData.customer_phone,
      customer_email: updateData.customer_email,
      special_requests: updateData.special_requests,
      validity_days: updateData.validity_days,
      status: updateData.status,
      notes: updateData.notes,
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;

    params.push(id, hotelId);

    const query = `UPDATE quotations SET ${updates.join(", ")} WHERE id = ? AND hotel_id = ?`;
    const [result] = await pool.execute(query, params);

    return result.affectedRows > 0;
  }

  static async checkAvailability(
    hotelId,
    roomId,
    roomNumber,
    fromDate,
    toDate,
  ) {
    try {
      console.log("🔍 Checking availability for quotation:", {
        hotelId,
        roomId,
        roomNumber,
        fromDate,
        toDate,
      });

      // Build query for BOOKINGS
      let bookingsQuery = `
      SELECT b.* 
      FROM bookings b
      WHERE b.hotel_id = ? 
      AND b.room_id = ?
      AND b.status IN ('booked', 'blocked', 'maintenance')
      AND (
        (b.from_date <= ? AND b.to_date >= ?) OR      -- Overlap start
        (b.from_date <= ? AND b.to_date >= ?) OR      -- Overlap end
        (b.from_date >= ? AND b.to_date <= ?)         -- Complete within
      )
    `;

      const bookingsParams = [
        hotelId,
        roomId,
        toDate, // For first condition: b.to_date >= fromDate
        fromDate, // For first condition: b.from_date <= toDate
        fromDate, // For second condition: b.from_date <= toDate
        toDate, // For second condition: b.to_date >= fromDate
        fromDate, // For third condition: b.from_date >= fromDate
        toDate, // For third condition: b.to_date <= toDate
      ];

      console.log("📝 Bookings query:", bookingsQuery);
      console.log("📝 Bookings params:", bookingsParams);

      const [bookings] = await pool.execute(bookingsQuery, bookingsParams);

      // Build query for QUOTATIONS (check other pending/accepted quotations)
      let quotationsQuery = `
      SELECT q.* 
      FROM quotations q
      WHERE q.hotel_id = ? 
      AND q.room_id = ?
      AND q.status IN ('pending', 'accepted', 'converted')
      AND q.id != COALESCE(?, 0)  -- Exclude current quotation if updating
      AND (
        (q.from_date <= ? AND q.to_date >= ?) OR      -- Overlap start
        (q.from_date <= ? AND q.to_date >= ?) OR      -- Overlap end
        (q.from_date >= ? AND q.to_date <= ?)         -- Complete within
      )
    `;

      // For create operations, we don't have an ID to exclude yet
      const quotationsParams = [
        hotelId,
        roomId,
        0, // Exclude quotation ID (0 means none for create)
        toDate,
        fromDate,
        fromDate,
        toDate,
        fromDate,
        toDate,
      ];

      console.log("📝 Quotations query:", quotationsQuery);
      console.log("📝 Quotations params:", quotationsParams);

      const [quotations] = await pool.execute(
        quotationsQuery,
        quotationsParams,
      );

      console.log("📊 Availability check results:", {
        bookingsCount: bookings.length,
        quotationsCount: quotations.length,
        available: bookings.length === 0 && quotations.length === 0,
        conflictingBookings: bookings.map((b) => ({
          id: b.id,
          from_date: b.from_date,
          to_date: b.to_date,
          status: b.status,
        })),
        conflictingQuotations: quotations.map((q) => ({
          id: q.id,
          quotation_number: q.quotation_number,
          from_date: q.from_date,
          to_date: q.to_date,
          status: q.status,
        })),
      });

      return {
        available: bookings.length === 0 && quotations.length === 0,
        conflictingBookings: bookings,
        conflictingQuotations: quotations,
      };
    } catch (error) {
      console.error("❌ Error checking availability in quotations:", error);
      throw error;
    }
  }

  // Convert quotation to booking
  static async convertToBooking(id, hotelId, bookingData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update quotation status
      const [updateResult] = await connection.execute(
        `UPDATE quotations SET status = 'converted', converted_to_booking_id = ? 
         WHERE id = ? AND hotel_id = ?`,
        [bookingData.booking_id, id, hotelId],
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("Quotation not found");
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete quotation
  static async delete(id, hotelId) {
    const [result] = await pool.execute(
      `DELETE FROM quotations WHERE id = ? AND hotel_id = ?`,
      [id, hotelId],
    );
    return result.affectedRows > 0;
  }
}

module.exports = Quotation;
