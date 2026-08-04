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

  const [bookingCols] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'guests'");
  const [advanceCols] = await pool.query("SHOW COLUMNS FROM advance_bookings LIKE 'guests'");
  console.log('bookings.guests:', bookingCols[0]);
  console.log('advance_bookings.guests:', advanceCols[0]);

  const [sample] = await pool.query(
    'SELECT id, guests, CHAR_LENGTH(guests) AS len FROM bookings WHERE id = 2108'
  );
  console.log('booking 2108:', sample[0]);

  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
