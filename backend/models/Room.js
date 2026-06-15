

const { pool } = require('../config/database');
const roomQueries = require('../queries/roomQueries');

class Room {
  // Create new room
  static async create(roomData) {
    const [result] = await pool.execute(
      roomQueries.CREATE_ROOM,
      [
        roomData.hotel_id,
        roomData.room_number,
        roomData.type,
        roomData.floor || 1,
        roomData.price || 0.00,
        roomData.amenities || '',
        roomData.status || 'available',
        roomData.gst_percentage || 12.00,
        roomData.cgst_percentage || 6.00,  // Half of GST by default
        roomData.sgst_percentage || 6.00,  // Half of GST by default
        roomData.igst_percentage || 12.00, // Same as GST for interstate   // New
        roomData.service_charge_percentage || 0.00  // New
      ]
    );
    return result.insertId;
  }

  // Find room by ID
  static async findById(id, hotelId) {
    const [rows] = await pool.execute(roomQueries.FIND_ROOM_BY_ID, [id, hotelId]);
    return rows[0];
  }

  // Get rooms by hotel
  static async findByHotel(hotelId) {
    const [rows] = await pool.execute(roomQueries.GET_ROOMS_BY_HOTEL, [hotelId]);
    return rows;
  }

  // Update room
  static async update(id, hotelId, roomData) {
    const [result] = await pool.execute(
      roomQueries.UPDATE_ROOM,
      [
        roomData.room_number,
        roomData.type,
        roomData.floor,
        roomData.price,
        roomData.amenities,
        roomData.status,
        id,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  // Update room status
  // static async updateStatus(id, hotelId, status) {
  //   const [result] = await pool.execute(roomQueries.UPDATE_ROOM_STATUS, [status, id, hotelId]);
  //   return result.affectedRows > 0;
  // }

  // Update room status
static async updateStatus(id, hotelId, status) {
  try {
    console.log('🔄 Room.updateStatus called:', { id, hotelId, status });
    
    // Validate status
    const validStatuses = ['available', 'booked', 'maintenance', 'blocked'];
    if (!validStatuses.includes(status)) {
      console.error('❌ Invalid status:', status);
      return false;
    }

    const [result] = await pool.execute(
      roomQueries.UPDATE_ROOM_STATUS, 
      [status, id, hotelId]
    );
    
    console.log('✅ Room status update result:', result.affectedRows > 0);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('❌ Error in Room.updateStatus:', error);
    throw error;
  }
}

  // Delete room
  static async delete(id, hotelId) {
    const [result] = await pool.execute(roomQueries.DELETE_ROOM, [id, hotelId]);
    return result.affectedRows > 0;
  }

  // Get available rooms
  static async getAvailable(hotelId) {
    const [rows] = await pool.execute(roomQueries.GET_AVAILABLE_ROOMS, [hotelId]);
    return rows;
  }

  // Check room number exists
  static async checkRoomNumberExists(hotelId, roomNumber, excludeId = null) {
    const [rows] = await pool.execute(
      roomQueries.CHECK_ROOM_NUMBER_EXISTS,
      [hotelId, roomNumber, excludeId || 0]
    );
    return rows.length > 0;
  }

  // Get room types summary
  static async getRoomTypesSummary(hotelId) {
    const [rows] = await pool.execute(roomQueries.GET_ROOM_TYPES_SUMMARY, [hotelId]);
    return rows;
  }

  //update the gst
  // Method 1: For updating ONLY GST and service charge
  static async updategst(id, hotelId, taxData) {
    try {
      console.log('Updating only GST/tax for room:', { id, hotelId, taxData });

      // Build dynamic query based on what's provided
      const updates = [];
      const values = [];

      if (taxData.gst_percentage !== undefined) {
        updates.push('gst_percentage = ?');
        values.push(taxData.gst_percentage);
      }

      if (taxData.service_charge_percentage !== undefined) {
        updates.push('service_charge_percentage = ?');
        values.push(taxData.service_charge_percentage);
      }

      // If nothing to update, return false
      if (updates.length === 0) {
        return false;
      }

      // Add WHERE clause parameters
      values.push(id, hotelId);

      const query = `UPDATE rooms SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`;
      console.log('Query:', query, 'Values:', values);

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error in updateGSTOnly:', error);
      throw error;
    }
  }

  // Method 2: Keep original but make it handle partial updates
  static async updateRoomPartial(id, hotelId, roomData) {
    try {
      // Get current room data
      const [existingRooms] = await pool.execute(
        'SELECT * FROM rooms WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (existingRooms.length === 0) {
        return false;
      }

      const currentRoom = existingRooms[0];

      // Build dynamic update query
      const updates = [];
      const values = [];

      // Check each field and add to update if provided
      const fields = [
        'room_number', 'type', 'floor', 'price', 'amenities', 'status',
        'gst_percentage', 'service_charge_percentage'
      ];

      fields.forEach(field => {
        if (roomData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(roomData[field]);
        }
      });

      // If no updates, return false
      if (updates.length === 0) {
        return false;
      }

      // Add WHERE clause parameters
      values.push(id, hotelId);

      const query = `UPDATE rooms SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`;
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error in updateRoomPartial:', error);
      throw error;
    }
  }

  // In models/Room.js, add this method:
  static async findByNumber(roomNumber, hotelId) {
    const [rows] = await pool.execute(
      'SELECT * FROM rooms WHERE room_number = ? AND hotel_id = ?',
      [roomNumber, hotelId]
    );
    return rows[0] || null;
  }


  static async updateRoomGST(id, hotelId, gstData) {
  try {
    const [result] = await pool.execute(
      roomQueries.UPDATE_ROOM_GST,
      [
        gstData.gst_percentage,
        gstData.cgst_percentage,
        gstData.sgst_percentage,
        gstData.igst_percentage,
        gstData.service_charge_percentage,
        id,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating room GST:', error);
    throw error;
  }
}

// Partial update for rooms (allows updating specific fields)
static async updateRoomPartial(id, hotelId, roomData) {
  try {
    const updates = [];
    const values = [];

    const fields = [
      'room_number', 'type', 'floor', 'price', 'amenities', 'status',
      'gst_percentage', 'cgst_percentage', 'sgst_percentage', 'igst_percentage', 
      'service_charge_percentage'
    ];

    fields.forEach(field => {
      if (roomData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(roomData[field]);
      }
    });

    if (updates.length === 0) {
      return false;
    }

    values.push(id, hotelId);
    const query = `UPDATE rooms SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in updateRoomPartial:', error);
    throw error;
  }
}
}

module.exports = Room;