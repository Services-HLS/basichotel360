// models/Referral.js - CREATE NEW FILE
const { pool } = require('../config/database');

class Referral {
  // Get referral details with user info
  static async getReferralDetails(code) {
    const [rows] = await pool.execute(
      `SELECT 
        rt.*,
        u1.name as referrer_name,
        u1.email as referrer_email,
        u2.name as referred_name,
        u2.email as referred_email,
        h.name as hotel_name
       FROM referral_tracking rt
       JOIN users u1 ON rt.referrer_id = u1.id
       JOIN users u2 ON rt.referred_id = u2.id
       LEFT JOIN hotels h ON u2.hotel_id = h.id
       WHERE rt.referral_code = ?
       ORDER BY rt.created_at DESC`,
      [code]
    );
    
    return rows;
  }

  // Get all referrals for a user
  static async getUserReferrals(userId, status = null) {
    let query = `
      SELECT 
        rt.*,
        u.name as referred_name,
        u.email as referred_email,
        h.name as hotel_name,
        h.plan as hotel_plan
      FROM referral_tracking rt
      JOIN users u ON rt.referred_id = u.id
      LEFT JOIN hotels h ON u.hotel_id = h.id
      WHERE rt.referrer_id = ?
    `;
    
    const params = [userId];
    
    if (status) {
      query += ` AND rt.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY rt.created_at DESC`;
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get pending referrals count
  static async getPendingReferralsCount(userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM referral_tracking 
       WHERE referrer_id = ? AND status = 'pending'`,
      [userId]
    );
    
    return rows[0].count;
  }

  // Update referral settings
  static async updateSettings(hotelId, settings, createdBy) {
    const [result] = await pool.execute(
      `INSERT INTO referral_settings 
       (hotel_id, signup_bonus_amount, referral_bonus_amount, 
        commission_percentage, max_referrals_per_user, 
        min_pro_payment_for_commission, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       signup_bonus_amount = VALUES(signup_bonus_amount),
       referral_bonus_amount = VALUES(referral_bonus_amount),
       commission_percentage = VALUES(commission_percentage),
       max_referrals_per_user = VALUES(max_referrals_per_user),
       min_pro_payment_for_commission = VALUES(min_pro_payment_for_commission),
       is_active = VALUES(is_active),
       updated_at = NOW()`,
      [
        hotelId,
        settings.signup_bonus_amount,
        settings.referral_bonus_amount,
        settings.commission_percentage,
        settings.max_referrals_per_user,
        settings.min_pro_payment_for_commission,
        settings.is_active,
        createdBy
      ]
    );
    
    return result.affectedRows > 0;
  }

  // Get commission summary
  static async getCommissionSummary(hotelId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        DATE(rt.completed_at) as date,
        COUNT(*) as total_referrals,
        SUM(rt.commission_earned) as total_commission,
        AVG(rt.commission_earned) as avg_commission
      FROM referral_tracking rt
      WHERE rt.status = 'completed'
    `;
    
    const params = [];
    
    if (hotelId) {
      query += ` AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = rt.referrer_id AND u.hotel_id = ?
      )`;
      params.push(hotelId);
    }
    
    if (startDate) {
      query += ` AND DATE(rt.completed_at) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND DATE(rt.completed_at) <= ?`;
      params.push(endDate);
    }
    
    query += ` GROUP BY DATE(rt.completed_at) ORDER BY date DESC`;
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Referral;