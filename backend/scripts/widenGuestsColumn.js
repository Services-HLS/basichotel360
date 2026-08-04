/**
 * Widen bookings.guests / advance_bookings.guests so guest member names fit.
 * Was varchar(50) — truncated JSON like {"adults":2,...,"names":["linga
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  console.log('Altering bookings.guests → TEXT ...');
  await pool.query('ALTER TABLE bookings MODIFY COLUMN guests TEXT NULL');

  console.log('Altering advance_bookings.guests → TEXT ...');
  await pool.query('ALTER TABLE advance_bookings MODIFY COLUMN guests TEXT NULL');

  const [bookingCols] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'guests'");
  const [advanceCols] = await pool.query("SHOW COLUMNS FROM advance_bookings LIKE 'guests'");
  console.log('bookings.guests now:', bookingCols[0].Type);
  console.log('advance_bookings.guests now:', advanceCols[0].Type);
  console.log('Done. Create a new booking with guest names to verify.');

  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
