const roomQueries = {
  // Create new room
  CREATE_ROOM: `INSERT INTO rooms (
    hotel_id, room_number, type, floor, price, amenities, status, 
    gst_percentage, cgst_percentage, sgst_percentage, igst_percentage, 
    service_charge_percentage
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

 
 
  // Find room by ID
  FIND_ROOM_BY_ID: `SELECT * FROM rooms WHERE id = ? AND hotel_id = ?`,
  
  // Get rooms by hotel
  GET_ROOMS_BY_HOTEL: `SELECT * FROM rooms WHERE hotel_id = ? ORDER BY room_number`,
  
  // Update room
  UPDATE_ROOM: `UPDATE rooms SET room_number = ?, type = ?, floor = ?, price = ?, amenities = ?, status = ? WHERE id = ? AND hotel_id = ?`,
  
  // Update room status
  UPDATE_ROOM_STATUS: `UPDATE rooms SET status = ? WHERE id = ? AND hotel_id = ?`,
  
  // Delete room
  DELETE_ROOM: `DELETE FROM rooms WHERE id = ? AND hotel_id = ?`,
  
  // Get available rooms
  GET_AVAILABLE_ROOMS: `SELECT * FROM rooms WHERE hotel_id = ? AND status = 'available' ORDER BY room_number`,
  
  // Check room number exists
  CHECK_ROOM_NUMBER_EXISTS: `SELECT id FROM rooms WHERE hotel_id = ? AND room_number = ? AND id != ?`,
  
  // Get room types summary
  GET_ROOM_TYPES_SUMMARY: `
    SELECT 
      type,
      COUNT(*) as total_rooms,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms
    FROM rooms 
    WHERE hotel_id = ? 
    GROUP BY type
  `,


 UPDATE_ROOM_GST: `UPDATE rooms SET 
    gst_percentage = ?, 
    cgst_percentage = ?, 
    sgst_percentage = ?, 
    igst_percentage = ?,
    service_charge_percentage = ? 
    WHERE id = ? AND hotel_id = ?`,

  // UPDATE_ROOM_gst: `UPDATE rooms SET room_number = ?, type = ?, floor = ?, price = ?, amenities = ?, status = ?, gst_percentage = ?, service_charge_percentage = ? WHERE id = ? AND hotel_id = ?`,
};

module.exports = roomQueries;