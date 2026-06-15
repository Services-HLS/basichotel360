const adminQueries = {
  // Create new admin
  CREATE_ADMIN: `INSERT INTO admin (hotel_id, username, password, name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  
  // Find admin by ID
  FIND_ADMIN_BY_ID: `SELECT id, hotel_id, username, name, email, phone, role, created_at FROM admin WHERE id = ?`,
  
  // Find admin by username
  FIND_ADMIN_BY_USERNAME: `SELECT * FROM admin WHERE username = ?`,
  
  // Find admins by hotel
  FIND_ADMINS_BY_HOTEL: `SELECT id, username, name, email, phone, role, created_at FROM admin WHERE hotel_id = ? ORDER BY created_at DESC`,
  
  // Update admin
  UPDATE_ADMIN: `UPDATE admin SET name = ?, email = ?, phone = ?, role = ? WHERE id = ? AND hotel_id = ?`,
  
  // Update password
  UPDATE_PASSWORD: `UPDATE admin SET password = ? WHERE id = ?`,
  
  // Delete admin
  DELETE_ADMIN: `DELETE FROM admin WHERE id = ? AND hotel_id = ?`,
  
  // Check username exists
  CHECK_USERNAME_EXISTS: `SELECT id FROM admin WHERE username = ? AND id != ?`,
  
  // Get admin by hotel and role
  FIND_ADMIN_BY_HOTEL_AND_ROLE: `SELECT * FROM admin WHERE hotel_id = ? AND role = ?`
};

module.exports = adminQueries;