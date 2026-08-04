/**
 * One-time fix: set PRO trial_expiry_date to created_at + 15 days
 * ONLY for pending PRO trial hotels (not paid/active subscriptions).
 *
 * Usage: node scripts/fixProTrialTo15Days.js
 */
require('dotenv').config();
const { pool } = require('../config/database');
const { PRO_TRIAL_DAYS } = require('../utils/proTrial');

async function main() {
  const connection = await pool.getConnection();
  try {
    console.log(`🔧 Fixing PENDING PRO trials to ${PRO_TRIAL_DAYS} days...`);

    const [before] = await connection.execute(
      `SELECT h.id, h.name, h.plan, u.status AS admin_status,
              h.created_at, h.trial_expiry_date,
              DATEDIFF(h.trial_expiry_date, NOW()) AS days_left
       FROM hotels h
       JOIN users u ON u.hotel_id = h.id AND u.role = 'admin'
       WHERE h.plan = 'pro'
         AND u.status = 'pending'
         AND h.trial_expiry_date IS NOT NULL
       ORDER BY h.id DESC
       LIMIT 30`
    );
    console.log('📋 Pending PRO hotels BEFORE update:');
    console.table(before);

    const [hotelResult] = await connection.execute(
      `UPDATE hotels h
       JOIN users u ON u.hotel_id = h.id AND u.role = 'admin'
       SET h.trial_expiry_date = DATE_ADD(COALESCE(h.created_at, NOW()), INTERVAL ? DAY)
       WHERE h.plan = 'pro'
         AND u.status = 'pending'
         AND h.trial_expiry_date IS NOT NULL`,
      [PRO_TRIAL_DAYS]
    );
    console.log(`✅ hotels updated: ${hotelResult.affectedRows}`);

    try {
      const [userResult] = await connection.execute(
        `UPDATE users u
         JOIN hotels h ON h.id = u.hotel_id
         SET u.trial_expiry_date = h.trial_expiry_date
         WHERE h.plan = 'pro'
           AND u.role = 'admin'
           AND u.status = 'pending'
           AND h.trial_expiry_date IS NOT NULL`
      );
      console.log(`✅ users updated: ${userResult.affectedRows}`);
    } catch (err) {
      console.warn('⚠️ users.trial_expiry_date update skipped:', err.message);
    }

    const [after] = await connection.execute(
      `SELECT h.id, h.name, h.plan, u.status AS admin_status,
              h.created_at, h.trial_expiry_date,
              DATEDIFF(h.trial_expiry_date, NOW()) AS days_left
       FROM hotels h
       JOIN users u ON u.hotel_id = h.id AND u.role = 'admin'
       WHERE h.plan = 'pro'
         AND u.status = 'pending'
         AND h.trial_expiry_date IS NOT NULL
       ORDER BY h.id DESC
       LIMIT 30`
    );
    console.log('📋 Pending PRO hotels AFTER update:');
    console.table(after);

    console.log('✅ Done. Logout and login again (or hard refresh) to see 15 days left.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Fix failed:', err);
  process.exit(1);
});
