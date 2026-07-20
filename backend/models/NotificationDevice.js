const { pool } = require('../config/database');

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS notification_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  hotel_id INT NOT NULL,
  fcm_token VARCHAR(512) NOT NULL,
  platform VARCHAR(32) NOT NULL DEFAULT 'android',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_fcm_token (fcm_token),
  INDEX idx_notification_devices_hotel (hotel_id),
  INDEX idx_notification_devices_user (user_id)
)`;

class NotificationDevice {
  static async ensureTable() {
    await pool.execute(CREATE_TABLE_SQL);
  }

  static async upsert({ userId, hotelId, token, platform = 'android' }) {
    await this.ensureTable();

    const [existing] = await pool.execute(
      'SELECT id FROM notification_devices WHERE fcm_token = ? LIMIT 1',
      [token]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE notification_devices
         SET user_id = ?, hotel_id = ?, platform = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
         WHERE fcm_token = ?`,
        [userId, hotelId, platform, token]
      );
      return existing[0].id;
    }

    const [result] = await pool.execute(
      `INSERT INTO notification_devices (user_id, hotel_id, fcm_token, platform, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [userId, hotelId, token, platform]
    );
    return result.insertId;
  }

  static async deactivateToken(token) {
    await this.ensureTable();
    const [result] = await pool.execute(
      'UPDATE notification_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE fcm_token = ?',
      [token]
    );
    return result.affectedRows > 0;
  }

  static async deactivateForUser(userId) {
    await this.ensureTable();
    await pool.execute(
      'UPDATE notification_devices SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
  }

  static async getActiveTokensForUser(userId) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT fcm_token, platform
       FROM notification_devices
       WHERE user_id = ? AND is_active = 1`,
      [userId]
    );
    return rows;
  }

  static async getActiveTokensForHotel(hotelId) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT fcm_token, platform, user_id
       FROM notification_devices
       WHERE hotel_id = ? AND is_active = 1`,
      [hotelId]
    );
    return rows;
  }

  static async listForHotel(hotelId) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT id, user_id, platform, is_active, created_at, updated_at,
              CONCAT(LEFT(fcm_token, 12), '...') AS token_preview
       FROM notification_devices
       WHERE hotel_id = ?
       ORDER BY updated_at DESC`,
      [hotelId]
    );
    return rows;
  }
}

module.exports = NotificationDevice;
