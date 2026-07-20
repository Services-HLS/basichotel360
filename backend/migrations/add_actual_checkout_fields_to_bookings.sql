ALTER TABLE bookings
  ADD COLUMN actual_checkout_date DATE NULL AFTER to_time,
  ADD COLUMN actual_checkout_time TIME NULL AFTER actual_checkout_date;

