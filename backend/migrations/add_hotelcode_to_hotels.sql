ALTER TABLE hotels
  ADD COLUMN hotelcode VARCHAR(50) NULL AFTER gst_number;

CREATE UNIQUE INDEX idx_hotels_hotelcode ON hotels (hotelcode);
