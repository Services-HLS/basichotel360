require('dotenv').config();
const mysql = require('mysql2/promise');
const { parseGuests, getGuestNameGroups } = require('../utils/guestUtils');

(async () => {
  const p = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });
  const [r] = await p.query('SELECT id, guests FROM bookings WHERE id = 2179');
  const guests = r[0]?.guests;
  console.log('raw type:', typeof guests);
  console.log('raw value:', guests);
  console.log('parsed:', parseGuests(guests));
  console.log('groups:', getGuestNameGroups(guests));
  await p.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
