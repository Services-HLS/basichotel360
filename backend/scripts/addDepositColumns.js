/**
 * Add security deposit columns to bookings.
 * Deposit is held separately from room advance/balance.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function columnExists(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.c) > 0;
}

(async () => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  const columns = [
    ['deposit_amount', 'DECIMAL(12,2) NOT NULL DEFAULT 0'],
    ['deposit_payment_method', 'VARCHAR(32) NULL'],
    ['deposit_returned', 'DECIMAL(12,2) NOT NULL DEFAULT 0'],
    ['deposit_deducted', 'DECIMAL(12,2) NOT NULL DEFAULT 0'],
    ['deposit_deduction_reason', 'VARCHAR(255) NULL'],
    ["deposit_status", "VARCHAR(32) NOT NULL DEFAULT 'none'"],
  ];

  for (const [name, def] of columns) {
    if (await columnExists(pool, 'bookings', name)) {
      console.log(`skip ${name} (exists)`);
      continue;
    }
    console.log(`adding bookings.${name} ...`);
    await pool.query(`ALTER TABLE bookings ADD COLUMN ${name} ${def}`);
  }

  console.log('Done.');
  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
