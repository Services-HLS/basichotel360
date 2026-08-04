/**
 * Add company_name to customers for billing / corporate guests.
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

  try {
    if (await columnExists(pool, 'customers', 'company_name')) {
      console.log('skip company_name (exists)');
    } else {
      await pool.query(
        `ALTER TABLE customers ADD COLUMN company_name VARCHAR(255) NULL AFTER pincode`
      );
      console.log('added company_name');
    }
  } finally {
    await pool.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
