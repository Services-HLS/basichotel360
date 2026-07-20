const { pool } = require('../config/database');

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ota_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT NOT NULL,
  booking_id INT NULL,
  ota_booking_id VARCHAR(100) NOT NULL,
  cm_booking_id VARCHAR(100) NULL,
  channel VARCHAR(50) NULL,
  last_action VARCHAR(20) NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hotel_ota_booking (hotel_id, ota_booking_id),
  INDEX idx_ota_reservations_booking (booking_id)
)`;

class OtaReservation {
  static async ensureTable() {
    await pool.execute(CREATE_TABLE_SQL);
  }

  static async findByOtaBookingId(hotelId, otaBookingId) {
    await this.ensureTable();
    const [rows] = await pool.execute(
      `SELECT * FROM ota_reservations
       WHERE hotel_id = ? AND ota_booking_id = ?
       LIMIT 1`,
      [hotelId, otaBookingId]
    );
    return rows[0] || null;
  }

  static async upsert({
    hotelId,
    bookingId,
    otaBookingId,
    cmBookingId,
    channel,
    action,
    payload,
  }) {
    await this.ensureTable();
    const payloadJson = payload ? JSON.stringify(payload) : null;

    const [existing] = await pool.execute(
      `SELECT id FROM ota_reservations
       WHERE hotel_id = ? AND ota_booking_id = ?
       LIMIT 1`,
      [hotelId, otaBookingId]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE ota_reservations
         SET booking_id = ?, cm_booking_id = ?, channel = ?, last_action = ?, payload = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [bookingId, cmBookingId, channel, action, payloadJson, existing[0].id]
      );
      return existing[0].id;
    }

    const [result] = await pool.execute(
      `INSERT INTO ota_reservations
       (hotel_id, booking_id, ota_booking_id, cm_booking_id, channel, last_action, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [hotelId, bookingId, otaBookingId, cmBookingId, channel, action, payloadJson]
    );
    return result.insertId;
  }
}

module.exports = OtaReservation;
