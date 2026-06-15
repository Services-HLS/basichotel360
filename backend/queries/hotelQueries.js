const hotelQueries = {
  // Create new hotel
  CREATE_HOTEL: `INSERT INTO hotels (name, address, plan, gst_number) VALUES (?, ?, ?, ?)`,
  
  // Find hotel by ID
  FIND_HOTEL_BY_ID: `SELECT * FROM hotels WHERE id = ?`,
  
  // Find hotel by name
  FIND_HOTEL_BY_NAME: `SELECT * FROM hotels WHERE name = ?`,
  
  // Get all hotels
  GET_ALL_HOTELS: `SELECT * FROM hotels ORDER BY created_at DESC`,
  
  // Update hotel
  UPDATE_HOTEL: `UPDATE hotels SET name = ?, address = ?, plan = ?, gst_number = ? WHERE id = ?`,
  
  // Delete hotel
  DELETE_HOTEL: `DELETE FROM hotels WHERE id = ?`,
  
  // Get hotel stats
  GET_HOTEL_STATS: `
    SELECT 
      h.*,
      COUNT(DISTINCT r.id) as total_rooms,
      COUNT(DISTINCT u.id) as total_staff,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) as available_rooms,
      COUNT(DISTINCT CASE WHEN r.status = 'booked' THEN r.id END) as booked_rooms
    FROM hotels h
    LEFT JOIN rooms r ON h.id = r.hotel_id
    LEFT JOIN users u ON h.id = u.hotel_id
    LEFT JOIN bookings b ON h.id = b.hotel_id
    WHERE h.id = ?
    GROUP BY h.id
  `
};

module.exports = hotelQueries;