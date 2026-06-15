// models/Wallet.js - CREATE NEW FILE
const { pool } = require('../config/database');
const crypto = require('crypto');

class Wallet {
  // Generate unique referral code
  static generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REF${code}`;
  }

  // Create wallet for user
static async create(userId, hotelId) {
  console.log('💰 Creating wallet for user:', userId, 'hotel:', hotelId);
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if wallet already exists
    const [existing] = await connection.execute(
      'SELECT id FROM wallets WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length > 0) {
      console.log('ℹ️ Wallet already exists for user:', userId);
      await connection.rollback();
      return existing[0].id;
    }
    
    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      referralCode = this.generateReferralCode();
      const [existingCode] = await connection.execute(
        'SELECT id FROM wallets WHERE referral_code = ?',
        [referralCode]
      );
      if (existingCode.length === 0) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      // Fallback: use timestamp + random
      referralCode = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
    
    // Create wallet
    const [result] = await connection.execute(
      `INSERT INTO wallets (user_id, hotel_id, referral_code, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [userId, hotelId, referralCode]
    );
    
    const walletId = result.insertId;
    
    // Check if user should get signup bonus (PRO users)
    const [userDetails] = await connection.execute(
      `SELECT u.status, h.plan 
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE u.id = ?`,
      [userId]
    );
    
    if (userDetails[0] && userDetails[0].plan === 'pro') {
      // Get bonus amount from settings
      const [settings] = await connection.execute(
        `SELECT signup_bonus_amount FROM referral_settings 
         WHERE (hotel_id = ? OR hotel_id IS NULL) AND is_active = TRUE
         ORDER BY hotel_id DESC LIMIT 1`,
        [hotelId]
      );
      
      const bonusAmount = settings[0]?.signup_bonus_amount || 100.00;
      
      // Add bonus to wallet
      await connection.execute(
        `UPDATE wallets SET 
         balance = balance + ?,
         signup_bonus_credited = TRUE
         WHERE id = ?`,
        [bonusAmount, walletId]
      );
      
      // Add transaction
      await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, hotel_id, transaction_id, type, amount, category, description, status)
         VALUES (?, ?, ?, ?, 'credit', ?, 'signup_bonus', ?, 'completed')`,
        [
          walletId,
          userId,
          hotelId,
          `BONUS_${Date.now()}_${userId}`,
          bonusAmount,
          `Signup bonus credited: ₹${bonusAmount}`
        ]
      );
      
      console.log('🎁 Added signup bonus of ₹', bonusAmount);
    }
    
    await connection.commit();
    
    console.log('✅ Wallet created with ID:', walletId, 'Code:', referralCode);
    return walletId;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating wallet:', error);
    throw error;
  } finally {
    connection.release();
  }
}

  // Get wallet by user ID
  static async getByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM wallets WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  // Get wallet by hotel ID
  static async getByHotelId(hotelId) {
    const [rows] = await pool.execute(
      `SELECT w.*, u.name as user_name, u.email 
       FROM wallets w
       JOIN users u ON w.user_id = u.id
       WHERE w.hotel_id = ?`,
      [hotelId]
    );
    return rows[0];
  }

  // Get wallet by referral code
  static async getByReferralCode(code) {
    const [rows] = await pool.execute(
      `SELECT w.*, u.name as user_name, u.email, h.name as hotel_name
       FROM wallets w
       JOIN users u ON w.user_id = u.id
       JOIN hotels h ON w.hotel_id = h.id
       WHERE w.referral_code = ?`,
      [code]
    );
    return rows[0];
  }

  // Update wallet balance
  static async updateBalance(walletId, amount, isCredit = true) {
    const operator = isCredit ? '+' : '-';
    const [result] = await pool.execute(
      `UPDATE wallets SET balance = balance ${operator} ? WHERE id = ?`,
      [amount, walletId]
    );
    return result.affectedRows > 0;
  }

  // Add transaction
  static async addTransaction(transactionData) {
    const transactionId = transactionData.transaction_id || 
      `TXN${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    const [result] = await pool.execute(
      `INSERT INTO wallet_transactions 
       (wallet_id, user_id, hotel_id, transaction_id, type, amount, 
        category, description, reference_id, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionData.wallet_id,
        transactionData.user_id,
        transactionData.hotel_id,
        transactionId,
        transactionData.type,
        transactionData.amount,
        transactionData.category,
        transactionData.description || '',
        transactionData.reference_id || null,
        transactionData.metadata ? JSON.stringify(transactionData.metadata) : null,
        transactionData.status || 'completed'
      ]
    );
    
    console.log('📝 Transaction added:', transactionId, 'Amount:', transactionData.amount);
    return result.insertId;
  }

  // Get wallet transactions
  static async getTransactions(walletId, limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT * FROM wallet_transactions 
       WHERE wallet_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [walletId, limit, offset]
    );
    return rows;
  }

  // Get wallet summary
  static async getWalletSummary(userId) {
  try {
    console.log('📊 Getting wallet summary for user:', userId);
    
    // First check if wallet exists
    const [walletRows] = await pool.execute(
      `SELECT * FROM wallets WHERE user_id = ?`,
      [userId]
    );
    
    // If wallet doesn't exist, create one
    if (!walletRows[0]) {
      console.log('💰 Wallet not found for user:', userId, '- Creating one...');
      
      // Get user's hotel_id
      const [userRows] = await pool.execute(
        `SELECT hotel_id FROM users WHERE id = ?`,
        [userId]
      );
      
      if (!userRows[0] || !userRows[0].hotel_id) {
        console.error('❌ User or hotel not found for user:', userId);
        return null;
      }
      
      const hotelId = userRows[0].hotel_id;
      
      // Create wallet
      const walletId = await this.create(userId, hotelId);
      console.log('✅ Created wallet with ID:', walletId);
      
      // Get the newly created wallet
      const [newWalletRows] = await pool.execute(
        `SELECT * FROM wallets WHERE id = ?`,
        [walletId]
      );
      
      if (!newWalletRows[0]) {
        console.error('❌ Failed to retrieve created wallet');
        return null;
      }
      
      var wallet = newWalletRows[0]; // Use var for hoisting
    } else {
      var wallet = walletRows[0]; // Use var for hoisting
    }
    
    // Get referral stats - SIMPLIFIED QUERY
    const [referralStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_referrals,
        SUM(COALESCE(commission_earned, 0)) as total_commission_earned
       FROM referral_tracking
       WHERE referrer_id = ?`,
      [userId]
    );
    
    // Get transaction counts
    const [transactionStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'credit' THEN 1 ELSE 0 END) as total_credits,
        SUM(CASE WHEN type = 'debit' THEN 1 ELSE 0 END) as total_debits
       FROM wallet_transactions
       WHERE user_id = ?`,
      [userId]
    );
    
    // Get recent transactions
    const [recentTransactions] = await pool.execute(
      `SELECT * FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    // Get referral settings
    const settings = await this.getReferralSettings(wallet.hotel_id);
    
    // Build referral link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const referralLink = `${frontendUrl}/register?ref=${wallet.referral_code}`;
    
    // Get stats with proper defaults
    const stats = referralStats[0] || {
      total_referrals: 0,
      successful_referrals: 0,
      pending_referrals: 0,
      total_commission_earned: 0
    };
    
    const txnStats = transactionStats[0] || {
      total_transactions: 0,
      total_credits: 0,
      total_debits: 0
    };
    
    const summary = {
      ...wallet,
      ...stats,
      ...txnStats,
      recent_transactions: recentTransactions || [],
      referral_link: referralLink,
      referral_settings: settings
    };
    
    console.log('✅ Wallet summary generated for user:', userId);
    console.log('💰 Balance:', wallet.balance);
    console.log('📊 Referrals:', stats.total_referrals);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error getting wallet summary:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

  // Get referral settings
  static async getReferralSettings(hotelId = null) {
    let query = `SELECT * FROM referral_settings WHERE is_active = TRUE`;
    const params = [];
    
    if (hotelId) {
      query += ` AND (hotel_id = ? OR hotel_id IS NULL) ORDER BY hotel_id DESC`;
      params.push(hotelId);
    } else {
      query += ` AND hotel_id IS NULL`;
    }
    
    query += ` LIMIT 1`;
    
    const [rows] = await pool.execute(query, params);
    
    if (rows[0]) {
      return rows[0];
    }
    
    // Return default settings
    return {
      signup_bonus_amount: 100.00,
      referral_bonus_amount: 200.00,
      commission_percentage: 10.00,
      max_referrals_per_user: 10,
      min_pro_payment_for_commission: 399.00,
      is_active: true
    };
  }

  // Credit signup bonus
  static async creditSignupBonus(userId, hotelId) {
    console.log('🎁 Crediting signup bonus for user:', userId);
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get wallet
      const [walletRows] = await connection.execute(
        `SELECT * FROM wallets WHERE user_id = ? FOR UPDATE`,
        [userId]
      );
      
      if (!walletRows[0]) {
        throw new Error('Wallet not found');
      }
      
      const wallet = walletRows[0];
      
      // Check if already credited
      if (wallet.signup_bonus_credited) {
        console.log('ℹ️ Signup bonus already credited for user:', userId);
        await connection.rollback();
        return false;
      }
      
      // Get settings
      const settings = await this.getReferralSettings(hotelId);
      const bonusAmount = settings.signup_bonus_amount;
      
      console.log('💰 Signup bonus amount:', bonusAmount);
      
      // Update wallet balance
      await connection.execute(
        `UPDATE wallets SET 
         balance = balance + ?,
         signup_bonus_credited = TRUE
         WHERE id = ?`,
        [bonusAmount, wallet.id]
      );
      
      // Add transaction record
      await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, hotel_id, type, amount, category, description)
         VALUES (?, ?, ?, 'credit', ?, 'signup_bonus', ?)`,
        [
          wallet.id,
          userId,
          hotelId,
          bonusAmount,
          `Signup bonus credited: ₹${bonusAmount}`
        ]
      );
      
      await connection.commit();
      console.log('✅ Signup bonus credited successfully for user:', userId);
      return true;
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error crediting signup bonus:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Process referral
  static async processReferral(referrerId, referredId, hotelId) {
    console.log('🤝 Processing referral:', { referrerId, referredId, hotelId });
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get referrer's wallet
      const [referrerWallet] = await connection.execute(
        `SELECT * FROM wallets WHERE user_id = ?`,
        [referrerId]
      );
      
      if (!referrerWallet[0]) {
        throw new Error('Referrer wallet not found');
      }
      
      // Check max referrals
      const settings = await this.getReferralSettings(hotelId);
      if (referrerWallet[0].total_referrals >= settings.max_referrals_per_user) {
        throw new Error('Referrer has reached maximum referral limit');
      }
      
      // Create referral tracking record
      const [refResult] = await connection.execute(
        `INSERT INTO referral_tracking 
         (referrer_id, referred_id, referral_code, status, hotel_registered)
         VALUES (?, ?, ?, 'pending', TRUE)`,
        [referrerId, referredId, referrerWallet[0].referral_code]
      );
      
      // Update referrer's referral count
      await connection.execute(
        `UPDATE wallets SET total_referrals = total_referrals + 1 
         WHERE id = ?`,
        [referrerWallet[0].id]
      );
      
      // Update referred user's wallet
      await connection.execute(
        `UPDATE wallets SET referral_by = ? WHERE user_id = ?`,
        [referrerId, referredId]
      );
      
      await connection.commit();
      
      console.log('✅ Referral processed successfully, ID:', refResult.insertId);
      
      return {
        referralId: refResult.insertId,
        referralCode: referrerWallet[0].referral_code
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error processing referral:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Complete referral (when referred user makes PRO payment)
  static async completeReferral(referredUserId, paymentAmount) {
    console.log('✅ Completing referral for user:', referredUserId, 'Payment:', paymentAmount);
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get referral record
      const [referral] = await connection.execute(
        `SELECT * FROM referral_tracking 
         WHERE referred_id = ? AND status = 'pending'`,
        [referredUserId]
      );
      
      if (!referral[0]) {
        console.log('ℹ️ No pending referral found for user:', referredUserId);
        await connection.rollback();
        return { success: true, commission: 0 };
      }
      
      const referralRecord = referral[0];
      
      // Get settings
      const settings = await this.getReferralSettings(null);
      
      // Calculate commission
      let commission = 0;
      if (paymentAmount >= settings.min_pro_payment_for_commission) {
        commission = (paymentAmount * settings.commission_percentage) / 100;
        commission = Math.round(commission * 100) / 100; // Round to 2 decimal places
      }
      
      console.log('💰 Calculated commission:', commission);
      
      // Update referral record
      await connection.execute(
        `UPDATE referral_tracking SET 
         status = 'completed',
         commission_earned = ?,
         commission_paid = ?,
         pro_payment_made = TRUE,
         completed_at = NOW(),
         conditions_met = ?
         WHERE id = ?`,
        [
          commission,
          commission > 0 ? false : true,
          JSON.stringify({
            payment_amount: paymentAmount,
            min_required: settings.min_pro_payment_for_commission,
            commission_percentage: settings.commission_percentage,
            calculated_commission: commission,
            payment_date: new Date().toISOString()
          }),
          referralRecord.id
        ]
      );
      
      // Credit commission to referrer's wallet
      if (commission > 0) {
        const [referrerWallet] = await connection.execute(
          `SELECT * FROM wallets WHERE user_id = ?`,
          [referralRecord.referrer_id]
        );
        
        if (referrerWallet[0]) {
          // Update wallet balance
          await connection.execute(
            `UPDATE wallets SET 
             balance = balance + ?,
             referral_balance = referral_balance + ?,
             earned_from_referrals = earned_from_referrals + ?
             WHERE id = ?`,
            [commission, commission, commission, referrerWallet[0].id]
          );
          
          // Add transaction
          await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, user_id, hotel_id, type, amount, category, description)
             VALUES (?, ?, ?, 'credit', ?, 'referral_earnings', ?)`,
            [
              referrerWallet[0].id,
              referralRecord.referrer_id,
              referrerWallet[0].hotel_id,
              commission,
              `Referral commission: ₹${commission}`
            ]
          );
          
          console.log('💸 Commission credited to referrer:', referralRecord.referrer_id);
        }
      }
      
      await connection.commit();
      return { success: true, commission };
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error completing referral:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Validate referral code
  static async validateReferralCode(code) {
    console.log('🔍 Validating referral code:', code);
    
    try {
      const [rows] = await pool.execute(
        `SELECT 
          w.*,
          u.name as referrer_name,
          u.email as referrer_email,
          h.name as hotel_name,
          (SELECT COUNT(*) FROM referral_tracking WHERE referrer_id = w.user_id AND status = 'completed') as successful_referrals,
          (SELECT SUM(commission_earned) FROM referral_tracking WHERE referrer_id = w.user_id) as total_earnings
         FROM wallets w
         JOIN users u ON w.user_id = u.id
         JOIN hotels h ON w.hotel_id = h.id
         WHERE w.referral_code = ?`,
        [code]
      );
      
      if (!rows[0]) {
        console.log('❌ Referral code not found:', code);
        return null;
      }
      
      const wallet = rows[0];
      
      // Check if referrer has reached max referrals
      const settings = await this.getReferralSettings(wallet.hotel_id);
      if (wallet.total_referrals >= settings.max_referrals_per_user) {
        throw new Error('Referrer has reached maximum referral limit');
      }
      
      console.log('✅ Referral code valid for:', wallet.referrer_name);
      return wallet;
      
    } catch (error) {
      console.error('❌ Error validating referral code:', error);
      throw error;
    }
  }

  // Make payment from wallet
  static async makePayment(walletId, amount, description, referenceId) {
    console.log('💳 Making wallet payment:', { walletId, amount, description });
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check sufficient balance with FOR UPDATE to lock row
      const [wallet] = await connection.execute(
        `SELECT balance FROM wallets WHERE id = ? FOR UPDATE`,
        [walletId]
      );
      
      if (!wallet[0]) {
        throw new Error('Wallet not found');
      }
      
      if (wallet[0].balance < amount) {
        throw new Error('Insufficient wallet balance');
      }
      
      // Deduct from wallet
      await connection.execute(
        `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
        [amount, walletId]
      );
      
      // Get wallet details for transaction
      const [walletDetails] = await connection.execute(
        `SELECT user_id, hotel_id FROM wallets WHERE id = ?`,
        [walletId]
      );
      
      // Add debit transaction
      await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, hotel_id, type, amount, category, description, reference_id)
         VALUES (?, ?, ?, 'debit', ?, 'subscription_payment', ?, ?)`,
        [
          walletId,
          walletDetails[0].user_id,
          walletDetails[0].hotel_id,
          amount,
          description,
          referenceId
        ]
      );
      
      await connection.commit();
      
      const newBalance = wallet[0].balance - amount;
      console.log('✅ Payment successful. New balance:', newBalance);
      
      return { success: true, newBalance };
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error making wallet payment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Top up wallet
  static async topUpWallet(userId, amount, razorpayPaymentId) {
    console.log('💰 Topping up wallet for user:', userId, 'Amount:', amount);
    
    const wallet = await this.getByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update wallet balance
      await connection.execute(
        `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
        [amount, wallet.id]
      );
      
      // Add transaction
      await connection.execute(
        `INSERT INTO wallet_transactions 
         (wallet_id, user_id, hotel_id, type, amount, category, description, reference_id)
         VALUES (?, ?, ?, 'credit', ?, 'wallet_topup', ?, ?)`,
        [
          wallet.id,
          userId,
          wallet.hotel_id,
          amount,
          `Wallet top-up via Razorpay: ₹${amount}`,
          razorpayPaymentId
        ]
      );
      
      await connection.commit();
      
      const newBalance = wallet.balance + amount;
      console.log('✅ Wallet top-up successful. New balance:', newBalance);
      
      return { success: true, newBalance };
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error topping up wallet:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get referral leaderboard
// static async getLeaderboard(hotelId = null, limit = 10) {
//   console.log('🏆 Getting leaderboard for hotel:', hotelId, 'limit:', limit);
  
//   let query = `
//     SELECT 
//       w.user_id,
//       u.name,
//       u.email,
//       COUNT(rt.id) as total_referrals,
//       SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
//       SUM(CASE WHEN rt.commission_earned IS NOT NULL THEN rt.commission_earned ELSE 0 END) as total_earnings,
//       w.referral_code
//     FROM wallets w
//     JOIN users u ON w.user_id = u.id
//     LEFT JOIN referral_tracking rt ON w.user_id = rt.referrer_id
//   `;
  
//   const params = [];
  
//   if (hotelId) {
//     query += ` WHERE w.hotel_id = ?`;
//     params.push(hotelId);
//   }
  
//   query += `
//     GROUP BY w.user_id, u.name, u.email, w.referral_code
//     ORDER BY total_earnings DESC, successful_referrals DESC, total_referrals DESC
//     LIMIT ?
//   `;
  
//   // Make sure limit is a number
//   params.push(parseInt(limit) || 10);
  
//   console.log('📊 Leaderboard query:', query);
//   console.log('📊 Leaderboard params:', params);
  
//   const [rows] = await pool.execute(query, params);
//   console.log('✅ Leaderboard results:', rows.length, 'users');
//   return rows;
// }
// models/Wallet.js - UPDATE the getLeaderboard method

// static async getLeaderboard(hotelId = null, limit = 10) {
//   console.log('🏆 Getting leaderboard for hotel:', hotelId, 'limit:', limit);
  
//   // SIMPLIFIED QUERY - Fix the NULL handling
//   let query = `
//     SELECT 
//       w.user_id,
//       u.name,
//       u.email,
//       COUNT(DISTINCT rt.id) as total_referrals,
//       SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
//       COALESCE(SUM(rt.commission_earned), 0) as total_earnings,
//       w.referral_code,
//       w.balance as wallet_balance
//     FROM wallets w
//     JOIN users u ON w.user_id = u.id
//     LEFT JOIN referral_tracking rt ON w.user_id = rt.referrer_id
//   `;
  
//   const params = [];
  
//   if (hotelId) {
//     query += ` WHERE w.hotel_id = ?`;
//     params.push(hotelId);
//   }
  
//   query += `
//     GROUP BY w.user_id, u.name, u.email, w.referral_code, w.balance
//     ORDER BY total_earnings DESC, successful_referrals DESC, total_referrals DESC
//     LIMIT ?
//   `;
  
//   // Make sure limit is a number
//   const limitNum = parseInt(limit) || 10;
//   params.push(limitNum);
  
//   console.log('📊 Leaderboard query:', query);
//   console.log('📊 Leaderboard params:', params);
  
//   try {
//     const [rows] = await pool.execute(query, params);
//     console.log('✅ Leaderboard results:', rows.length, 'users');
    
//     // Format the results
//     const formattedRows = rows.map(row => ({
//       user_id: row.user_id,
//       name: row.name,
//       email: row.email,
//       total_referrals: parseInt(row.total_referrals) || 0,
//       successful_referrals: parseInt(row.successful_referrals) || 0,
//       total_earnings: parseFloat(row.total_earnings) || 0,
//       referral_code: row.referral_code,
//       wallet_balance: parseFloat(row.wallet_balance) || 0
//     }));
    
//     return formattedRows;
//   } catch (error) {
//     console.error('❌ Error in getLeaderboard:', error);
//     console.error('SQL:', query);
//     console.error('Params:', params);
    
//     // Return empty array on error
//     return [];
//   }
// }

static async getLeaderboard(hotelId = null, limit = 10) {
  console.log('🏆 Getting leaderboard for hotel:', hotelId, 'limit:', limit);
  
  try {
    // Parse limit to ensure it's an integer
    const limitNum = parseInt(limit) || 10;
    
    // Build query with string interpolation to avoid parameter binding issues
    let query = `
      SELECT 
        w.user_id,
        u.name,
        u.email,
        COUNT(DISTINCT rt.id) as total_referrals,
        SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
        COALESCE(SUM(rt.commission_earned), 0) as total_earnings,
        w.referral_code,
        w.balance as wallet_balance
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      LEFT JOIN referral_tracking rt ON w.user_id = rt.referrer_id
    `;
    
    // Use string interpolation instead of parameter binding
    if (hotelId) {
      const parsedHotelId = parseInt(hotelId);
      query += ` WHERE w.hotel_id = ${parsedHotelId}`;
    }
    
    query += `
      GROUP BY w.user_id, u.name, u.email, w.referral_code, w.balance
      ORDER BY total_earnings DESC, successful_referrals DESC, total_referrals DESC
      LIMIT ${limitNum}
    `;
    
    console.log('📊 Leaderboard query:', query);
    
    // Execute without parameters
    const [rows] = await pool.execute(query);
    console.log('✅ Leaderboard results:', rows.length, 'users');
    
    return rows;
    
  } catch (error) {
    console.error('❌ Error in getLeaderboard:', error);
    return [];
  }
}

// Add a fallback method for simpler leaderboard
static async getSimpleLeaderboard(hotelId = null, limit = 10) {
  console.log('🔄 Using simple leaderboard fallback');
  
  try {
    const limitNum = parseInt(limit) || 10;
    
    let query = `
      SELECT 
        w.user_id,
        u.name,
        u.email,
        w.referral_code,
        w.balance as wallet_balance
      FROM wallets w
      JOIN users u ON w.user_id = u.id
    `;
    
    const params = [];
    
    if (hotelId) {
      query += ` WHERE w.hotel_id = ?`;
      params.push(parseInt(hotelId));
    }
    
    query += ` ORDER BY w.balance DESC LIMIT ?`;
    params.push(limitNum);
    
    const [rows] = await pool.execute(query, params);
    
    // Get referral stats separately
    const formattedRows = await Promise.all(rows.map(async (row) => {
      const [stats] = await pool.execute(
        `SELECT 
          COUNT(*) as total_referrals,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
          COALESCE(SUM(commission_earned), 0) as total_earnings
         FROM referral_tracking
         WHERE referrer_id = ?`,
        [row.user_id]
      );
      
      return {
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        total_referrals: parseInt(stats[0]?.total_referrals) || 0,
        successful_referrals: parseInt(stats[0]?.successful_referrals) || 0,
        total_earnings: parseFloat(stats[0]?.total_earnings) || 0,
        referral_code: row.referral_code,
        wallet_balance: parseFloat(row.wallet_balance) || 0
      };
    }));
    
    // Sort by total_earnings
    formattedRows.sort((a, b) => b.total_earnings - a.total_earnings);
    
    return formattedRows;
    
  } catch (fallbackError) {
    console.error('❌ Fallback leaderboard also failed:', fallbackError);
    return [];
  }
}

  // Get referral stats for user
  static async getReferralStats(userId) {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_referrals,
        SUM(commission_earned) as total_commission_earned,
        SUM(CASE WHEN commission_paid = TRUE THEN commission_earned ELSE 0 END) as paid_commission
       FROM referral_tracking
       WHERE referrer_id = ?`,
      [userId]
    );
    
    return stats[0] || {
      total_referrals: 0,
      successful_referrals: 0,
      pending_referrals: 0,
      total_commission_earned: 0,
      paid_commission: 0
    };
  }
}

module.exports = Wallet;