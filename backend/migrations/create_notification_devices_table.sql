-- Run once on your MySQL database (Hotel_Management)
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
);
