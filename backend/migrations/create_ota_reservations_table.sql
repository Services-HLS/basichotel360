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
);
