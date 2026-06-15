const { pool } = require('../config/database');
const adminQueries = require('../queries/adminQueries');
const bcrypt = require('bcryptjs');

class Admin {
  // Create new admin
  static async create(adminData) {
    const hashedPassword = await bcrypt.hash(adminData.password, 12);
    const [result] = await pool.execute(
      adminQueries.CREATE_ADMIN,
      [
        adminData.hotel_id,
        adminData.username,
        hashedPassword,
        adminData.name,
        adminData.email,
        adminData.phone,
        adminData.role || 'admin'
      ]
    );
    return result.insertId;
  }

  // Find admin by ID
  static async findById(id) {
    const [rows] = await pool.execute(adminQueries.FIND_ADMIN_BY_ID, [id]);
    return rows[0];
  }

  // Find admin by username
  static async findByUsername(username) {
    const [rows] = await pool.execute(adminQueries.FIND_ADMIN_BY_USERNAME, [username]);
    return rows[0];
  }

  // Find admins by hotel
  static async findByHotel(hotelId) {
    const [rows] = await pool.execute(adminQueries.FIND_ADMINS_BY_HOTEL, [hotelId]);
    return rows;
  }

  // Update admin
  static async update(id, hotelId, adminData) {
    const [result] = await pool.execute(
      adminQueries.UPDATE_ADMIN,
      [adminData.name, adminData.email, adminData.phone, adminData.role, id, hotelId]
    );
    return result.affectedRows > 0;
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.execute(adminQueries.UPDATE_PASSWORD, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  // Delete admin
  static async delete(id, hotelId) {
    const [result] = await pool.execute(adminQueries.DELETE_ADMIN, [id, hotelId]);
    return result.affectedRows > 0;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Check username exists
  static async checkUsernameExists(username, excludeId = null) {
    let query = adminQueries.CHECK_USERNAME_EXISTS;
    const params = excludeId ? [username, excludeId] : [username, 0];
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }

  // Find admin by hotel and role
  static async findByHotelAndRole(hotelId, role) {
    const [rows] = await pool.execute(adminQueries.FIND_ADMIN_BY_HOTEL_AND_ROLE, [hotelId, role]);
    return rows[0];
  }
}

module.exports = Admin;