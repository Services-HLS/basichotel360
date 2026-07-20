-- UPI app used for online payment (phonepe, googlepay, paytm, etc.)
ALTER TABLE bookings
  ADD COLUMN online_payment_app VARCHAR(32) NULL AFTER payment_method;
