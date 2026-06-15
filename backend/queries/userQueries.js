// const userQueries = {
//   // Create new user
//   CREATE_USER: `INSERT INTO users (username, password, role, name, email, phone, hotel_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  
//   // Find user by ID
//   FIND_USER_BY_ID: `SELECT id, username, role, name, email, phone, hotel_id, created_at FROM users WHERE id = ?`,
  
//   // Find user by username
//   FIND_USER_BY_USERNAME: `SELECT * FROM users WHERE username = ?`,
  
//   // Find users by hotel
//   FIND_USERS_BY_HOTEL: `SELECT id, username, role, name, email, phone, created_at FROM users WHERE hotel_id = ? ORDER BY created_at DESC`,
  
//   // Update user
//   UPDATE_USER: `UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ? AND hotel_id = ?`,
  
//   // Update password
//   UPDATE_PASSWORD: `UPDATE users SET password = ? WHERE id = ?`,
  
//   // Delete user
//   DELETE_USER: `DELETE FROM users WHERE id = ? AND hotel_id = ?`,
  
//   // Check username exists
//   CHECK_USERNAME_EXISTS: `SELECT id FROM users WHERE username = ? AND id != ?`
// };

// module.exports = userQueries;

// const userQueries = {
//   // Create new user
//   CREATE_USER: `INSERT INTO users (username, password, role, name, email, phone, hotel_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  
//   // Find user by ID
//   FIND_USER_BY_ID: `SELECT id, username, role, name, email, phone, hotel_id, created_at FROM users WHERE id = ?`,
  
//   // Find user by username
//   FIND_USER_BY_USERNAME: `SELECT * FROM users WHERE username = ?`,
  
//   // Find users by hotel
//   FIND_USERS_BY_HOTEL: `SELECT id, username, role, name, email, phone, created_at FROM users WHERE hotel_id = ? ORDER BY created_at DESC`,
  
//   // Update user
//   UPDATE_USER: `UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ? AND hotel_id = ?`,
  
//   // Update password
//   UPDATE_PASSWORD: `UPDATE users SET password = ? WHERE id = ?`,
  
//   // Delete user
//   DELETE_USER: `DELETE FROM users WHERE id = ? AND hotel_id = ?`,
  
//   // Check username exists
//   CHECK_USERNAME_EXISTS: `SELECT id FROM users WHERE username = ? AND id != ?`
// };

// module.exports = userQueries;



const userQueries = {
  // Create new user (Added status)
  CREATE_USER: `INSERT INTO users (username, password, role, name, email, phone, hotel_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  
  // Find user by ID (Added status)
  FIND_USER_BY_ID: `SELECT id, username, role, name, email, phone, hotel_id, status, created_at FROM users WHERE id = ?`,
  
  // Find user by username
  FIND_USER_BY_USERNAME: `SELECT * FROM users WHERE username = ?`,
  
  // Find users by hotel (Added status)
  FIND_USERS_BY_HOTEL: `SELECT id, username, role, name, email, phone, status, created_at FROM users WHERE hotel_id = ? ORDER BY created_at DESC`,
  
  // Update user (Added status)
  UPDATE_USER: `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ? AND hotel_id = ?`,
  
  // Update password
  UPDATE_PASSWORD: `UPDATE users SET password = ? WHERE id = ?`,
  
  // Delete user
  DELETE_USER: `DELETE FROM users WHERE id = ? AND hotel_id = ?`,
  
  // Check username exists
  CHECK_USERNAME_EXISTS: `SELECT id FROM users WHERE username = ? AND id != ?`
};

module.exports = userQueries;