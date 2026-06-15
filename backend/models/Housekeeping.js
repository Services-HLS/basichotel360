const { pool } = require('../config/database');

class Housekeeping {
  // Create new housekeeping record

static async create(housekeepingData) {
    try {
      // Get room number from rooms table if not provided
      let room_number = housekeepingData.room_number;
      if (!room_number && housekeepingData.room_id) {
        const [roomRows] = await pool.execute(
          'SELECT room_number FROM rooms WHERE id = ? AND hotel_id = ?',
          [housekeepingData.room_id, housekeepingData.hotel_id]
        );
        
        if (roomRows.length > 0) {
          room_number = roomRows[0].room_number;
        } else {
          room_number = `Room-${housekeepingData.room_id}`;
        }
      }

      const query = `
        INSERT INTO housekeeping (
          hotel_id, room_id, booking_id, room_number,
          housekeeper_id, housekeeper_name, checkin_date,
          checkout_date, cleaning_date, cleaning_type,
          status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        housekeepingData.hotel_id,
        housekeepingData.room_id,
        housekeepingData.booking_id || null,
        room_number,
        housekeepingData.housekeeper_id || null,
        housekeepingData.housekeeper_name || null,
        housekeepingData.checkin_date || null,
        housekeepingData.checkout_date || null,
        housekeepingData.cleaning_date,
        housekeepingData.cleaning_type || 'daily',
        housekeepingData.status || 'pending',
        housekeepingData.notes || '',
        housekeepingData.created_by
      ];

      console.log('📝 [Housekeeping Create] Query:', query);
      console.log('📝 [Housekeeping Create] Params:', params);

      const [result] = await pool.execute(query, params);
      console.log('✅ [Housekeeping Create] Success! ID:', result.insertId);
      
      // Return the created record
      return await this.getById(result.insertId, housekeepingData.hotel_id);
    } catch (error) {
      console.error('❌ [Housekeeping Create] Error:', error.message);
      console.error('❌ [Housekeeping Create] SQL:', error.sql);
      throw error;
    }
  }

  // Get housekeeping records with filters


static async getRecords(hotelId, filters = {}) {
  let query = `
    SELECT 
      h.*,
      r.type as room_type,
      r.floor as room_floor,
      b.from_date as booking_checkin,
      b.to_date as booking_checkout,
      u.name as created_by_name,
      verifier.name as verified_by_name
    FROM housekeeping h
    LEFT JOIN rooms r ON h.room_id = r.id
    LEFT JOIN bookings b ON h.booking_id = b.id
    LEFT JOIN users u ON h.created_by = u.id
    LEFT JOIN users verifier ON h.verified_by = verifier.id
    WHERE h.hotel_id = ?
  `;

  const params = [hotelId];

  // Add filters - FIX: Don't use DATE() function
  if (filters.date) {
    // Use date range instead of DATE() function
    query += ` AND h.cleaning_date >= ? AND h.cleaning_date < ?`;
    const date = new Date(filters.date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    params.push(filters.date, nextDate.toISOString().split('T')[0]);
  }

  // FIX: Only add status filter if status is not 'all'
  if (filters.status && filters.status !== 'all') {
    query += ` AND h.status = ?`;
    params.push(filters.status);
  }

  if (filters.cleaning_type && filters.cleaning_type !== 'all') {
    query += ` AND h.cleaning_type = ?`;
    params.push(filters.cleaning_type);
  }

  if (filters.room_number) {
    query += ` AND h.room_number LIKE ?`;
    params.push(`%${filters.room_number}%`);
  }

  if (filters.housekeeper_id && filters.housekeeper_id !== 'all') {
    query += ` AND h.housekeeper_id = ?`;
    params.push(filters.housekeeper_id);
  }

  if (filters.search) {
    query += ` AND (h.room_number LIKE ? OR h.notes LIKE ? OR h.housekeeper_name LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  query += ` ORDER BY h.cleaning_date DESC, h.room_number ASC`;

  // Apply pagination
  const limit = parseInt(filters.limit) || 100;
  const offset = parseInt(filters.offset) || 0;
  
  console.log('📊 [Housekeeping GetRecords] Full Query:', query);
  console.log('📊 [Housekeeping GetRecords] Params:', params);

  try {
    const [rows] = await pool.execute(query, params);
    console.log('✅ [Housekeeping GetRecords] Found:', rows.length, 'records');
    
    // Ensure room_number is populated
    const formattedRows = rows.map(row => {
      // If room_number is empty or null, try to get it from room_type
      if (!row.room_number || row.room_number === 'Room-0') {
        return {
          ...row,
          room_number: row.room_type ? `Room ${row.room_type}` : 'Unknown Room'
        };
      }
      return row;
    });
    
    return formattedRows;
  } catch (error) {
    console.error('❌ [Housekeeping GetRecords] Error:', error.message);
    console.error('❌ [Housekeeping GetRecords] SQL:', error.sql);
    
    // Fallback to simpler query
    return await this.getRecordsFallback(hotelId, filters);
  }
}

// Fallback method without complex joins
static async getRecordsFallback(hotelId, filters = {}) {
  try {
    let query = `SELECT * FROM housekeeping WHERE hotel_id = ?`;
    const params = [hotelId];

    if (filters.date) {
      query += ` AND DATE(cleaning_date) = ?`;
      params.push(filters.date);
    }

    if (filters.status && filters.status !== 'all') {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY cleaning_date DESC, room_number ASC LIMIT ? OFFSET ?`;
    
    const limit = parseInt(filters.limit) || 100;
    const offset = parseInt(filters.offset) || 0;
    params.push(limit, offset);

    console.log('📊 [Housekeeping Fallback] Query:', query);
    console.log('📊 [Housekeeping Fallback] Params:', params);

    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('❌ [Housekeeping Fallback] Error:', error.message);
    return [];
  }
}


  // Get housekeeping summary statistics

 static async getSummary(hotelId, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // FIXED: Use backticks around 'delayed' since it's a reserved keyword
    let query = `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) as \`delayed\`
      FROM housekeeping
      WHERE hotel_id = ? AND DATE(cleaning_date) = ?
    `;

    const params = [hotelId, targetDate];

    console.log('📊 [Housekeeping Summary] Query:', query);
    console.log('📊 [Housekeeping Summary] Params:', params);

    try {
      const [rows] = await pool.execute(query, params);
      console.log('✅ [Housekeeping Summary] Result:', rows[0]);

      const summary = rows[0] || {
        total_tasks: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        delayed: 0
      };

      // Calculate completion rate
      const total = parseInt(summary.total_tasks) || 0;
      const completed = parseInt(summary.completed) || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total_today: total,
        pending: parseInt(summary.pending) || 0,
        in_progress: parseInt(summary.in_progress) || 0,
        completed: completed,
        delayed: parseInt(summary.delayed) || 0,
        completion_rate: completionRate
      };
    } catch (error) {
      console.error('❌ [Housekeeping Summary] Error:', error.message);
      console.error('❌ [Housekeeping Summary] SQL:', error.sql);
      
      // Alternative query without using delayed as column alias
      return await this.getSummaryAlternative(hotelId, targetDate);
    }
  }

  // Alternative summary query without reserved keywords
  static async getSummaryAlternative(hotelId, date) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_count,
          status,
          COUNT(*) as count_per_status
        FROM housekeeping
        WHERE hotel_id = ? AND DATE(cleaning_date) = ?
        GROUP BY status
      `;

      const [rows] = await pool.execute(query, [hotelId, date]);
      
      // Initialize counters
      let summary = {
        total_today: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        delayed: 0,
        completion_rate: 0
      };

      // Process each status group
      rows.forEach(row => {
        summary.total_today += row.count_per_status;
        
        switch(row.status) {
          case 'pending':
            summary.pending = row.count_per_status;
            break;
          case 'in_progress':
            summary.in_progress = row.count_per_status;
            break;
          case 'completed':
            summary.completed = row.count_per_status;
            break;
          case 'delayed':
            summary.delayed = row.count_per_status;
            break;
        }
      });

      // Calculate completion rate
      summary.completion_rate = summary.total_today > 0 
        ? Math.round((summary.completed / summary.total_today) * 100) 
        : 0;

      return summary;
    } catch (error) {
      console.error('❌ [Housekeeping Summary Alternative] Error:', error.message);
      return {
        total_today: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        delayed: 0,
        completion_rate: 0
      };
    }
  }




static async getById(id, hotelId) {
    try {
      const query = `
        SELECT 
          h.*,
          r.type as room_type,
          r.floor as room_floor,
          r.room_number as actual_room_number,
          b.from_date as booking_checkin,
          b.to_date as booking_checkout,
          u.name as created_by_name,
          verifier.name as verified_by_name
        FROM housekeeping h
        LEFT JOIN rooms r ON h.room_id = r.id
        LEFT JOIN bookings b ON h.booking_id = b.id
        LEFT JOIN users u ON h.created_by = u.id
        LEFT JOIN users verifier ON h.verified_by = verifier.id
        WHERE h.id = ? AND h.hotel_id = ?
      `;

      const [rows] = await pool.execute(query, [id, hotelId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const record = rows[0];
      
      // Ensure room_number is correct
      if (!record.room_number || record.room_number === 'Room-0') {
        record.room_number = record.actual_room_number || `Room-${record.room_id}`;
      }
      
      return record;
    } catch (error) {
      console.error('❌ [Housekeeping GetById] Error:', error.message);
      return null;
    }
  }

  // Update housekeeping record
  static async update(id, hotelId, updateData) {
    let query = `UPDATE housekeeping SET `;
    const params = [];
    const updates = [];

    if (updateData.status !== undefined) {
      updates.push(`status = ?`);
      params.push(updateData.status);
      
      // If marking as completed, set completed_at timestamp
      if (updateData.status === 'completed' && !updateData.completed_at) {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updateData.housekeeper_id !== undefined) {
      updates.push(`housekeeper_id = ?`);
      params.push(updateData.housekeeper_id || null);
    }

    if (updateData.housekeeper_name !== undefined) {
      updates.push(`housekeeper_name = ?`);
      params.push(updateData.housekeeper_name || null);
    }

    if (updateData.notes !== undefined) {
      updates.push(`notes = ?`);
      params.push(updateData.notes);
    }

    if (updateData.cleaning_type !== undefined) {
      updates.push(`cleaning_type = ?`);
      params.push(updateData.cleaning_type);
    }

    if (updates.length === 0) {
      return false;
    }

    query += updates.join(', ') + ` WHERE id = ? AND hotel_id = ?`;
    params.push(id, hotelId);

    console.log('🔄 [Housekeeping Update] Query:', query);
    console.log('🔄 [Housekeeping Update] Params:', params);

    try {
      const [result] = await pool.execute(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ [Housekeeping Update] Error:', error.message);
      throw error;
    }
  }

  // Mark record as completed
  static async markAsCompleted(id, hotelId, verifiedBy = null) {
    const query = `
      UPDATE housekeeping 
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ? AND hotel_id = ?
    `;

    try {
      const [result] = await pool.execute(query, [verifiedBy, id, hotelId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ [Housekeeping MarkAsCompleted] Error:', error.message);
      throw error;
    }
  }

  // Delete housekeeping record
  static async delete(id, hotelId) {
    const query = 'DELETE FROM housekeeping WHERE id = ? AND hotel_id = ?';
    
    try {
      const [result] = await pool.execute(query, [id, hotelId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ [Housekeeping Delete] Error:', error.message);
      throw error;
    }
  }

  // Get available housekeepers (staff users)
  static async getHousekeepers(hotelId) {
    const query = `
      SELECT id, name, email, phone, role 
      FROM users 
      WHERE hotel_id = ? 
        AND status = 'active'
        AND (role = 'staff' OR role = 'admin')
      ORDER BY name
    `;

    try {
      const [rows] = await pool.execute(query, [hotelId]);
      return rows;
    } catch (error) {
      console.error('❌ [Housekeeping GetHousekeepers] Error:', error.message);
      return [];
    }
  }

  // Get rooms that need cleaning (checkout rooms or based on booking)
  static async getRoomsNeedingCleaning(hotelId, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get rooms with checkouts today
    const query = `
      SELECT 
        r.id,
        r.room_number,
        r.type,
        r.floor,
        b.id as booking_id,
        b.customer_id,
        c.name as guest_name,
        b.from_date as checkin_date,
        b.to_date as checkout_date
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.hotel_id = ? 
        AND DATE(b.to_date) = ?
        AND b.status = 'booked'
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE r.hotel_id = ? 
        AND r.status IN ('booked', 'available')
      ORDER BY r.room_number
    `;

    try {
      const [rows] = await pool.execute(query, [hotelId, targetDate, hotelId]);
      return rows;
    } catch (error) {
      console.error('❌ [Housekeeping GetRoomsNeedingCleaning] Error:', error.message);
      return [];
    }
  }

  // Get all rooms for dropdown
  static async getAllRooms(hotelId) {
    const query = `
      SELECT id, room_number, type, floor, status, price
      FROM rooms
      WHERE hotel_id = ?
      ORDER BY room_number
    `;

    try {
      const [rows] = await pool.execute(query, [hotelId]);
      return rows;
    } catch (error) {
      console.error('❌ [Housekeeping GetAllRooms] Error:', error.message);
      return [];
    }
  }

  // Auto-create housekeeping tasks from checkouts
  static async autoCreateFromCheckouts(hotelId) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get bookings checking out today
      const [checkoutBookings] = await pool.execute(`
        SELECT 
          b.id as booking_id,
          b.room_id,
          b.customer_id,
          b.from_date,
          b.to_date,
          r.room_number,
          c.name as guest_name
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        JOIN customers c ON b.customer_id = c.id
        WHERE b.hotel_id = ?
          AND DATE(b.to_date) = ?
          AND b.status = 'booked'
      `, [hotelId, today]);

      let createdCount = 0;

      // Create housekeeping tasks for each checkout
      for (const booking of checkoutBookings) {
        // Check if task already exists for this room today
        const [existingTask] = await pool.execute(`
          SELECT id FROM housekeeping 
          WHERE hotel_id = ? 
            AND room_id = ? 
            AND DATE(cleaning_date) = ?
            AND cleaning_type = 'checkout'
        `, [hotelId, booking.room_id, today]);

        if (existingTask.length === 0) {
          // Create checkout cleaning task
          await pool.execute(`
            INSERT INTO housekeeping (
              hotel_id, room_id, booking_id, room_number,
              checkin_date, checkout_date, cleaning_date,
              cleaning_type, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            hotelId,
            booking.room_id,
            booking.booking_id,
            booking.room_number,
            booking.from_date,
            booking.to_date,
            today,
            'checkout',
            'pending',
            1 // System user ID or use a default
          ]);

          createdCount++;
        }
      }

      console.log(`✅ [AutoCreate] Created ${createdCount} checkout cleaning tasks`);
      return createdCount;
    } catch (error) {
      console.error('❌ [AutoCreate] Error:', error.message);
      return 0;
    }
  }

  // Get weekly cleaning schedule
  static async getWeeklySchedule(hotelId, startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const query = `
      SELECT 
        h.*,
        r.type as room_type,
        r.floor as room_floor,
        u.name as housekeeper_full_name
      FROM housekeeping h
      LEFT JOIN rooms r ON h.room_id = r.id
      LEFT JOIN users u ON h.housekeeper_id = u.id
      WHERE h.hotel_id = ?
        AND h.cleaning_date BETWEEN ? AND ?
      ORDER BY h.cleaning_date, h.room_number
    `;

    try {
      const [rows] = await pool.execute(query, [hotelId, startDate, endDate.toISOString().split('T')[0]]);
      return rows;
    } catch (error) {
      console.error('❌ [Housekeeping WeeklySchedule] Error:', error.message);
      return [];
    }
  }
}

module.exports = Housekeeping;