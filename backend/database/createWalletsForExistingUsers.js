// database/createWalletsForExistingUsers.js - CREATE NEW FILE

const { pool } = require('../config/database');
const crypto = require('crypto');

async function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REF${code}`;
}

async function createWalletsForExistingUsers() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Creating wallets for existing users...');
    
    await connection.beginTransaction();
    
    // Get all users without wallets
    const [usersWithoutWallets] = await connection.execute(`
      SELECT u.id as user_id, u.hotel_id 
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE w.id IS NULL
      ORDER BY u.id
    `);
    
    console.log(`📊 Found ${usersWithoutWallets.length} users without wallets`);
    
    let createdCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutWallets) {
      try {
        // Generate unique referral code
        let referralCode;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          referralCode = await generateReferralCode();
          const [existing] = await connection.execute(
            'SELECT id FROM wallets WHERE referral_code = ?',
            [referralCode]
          );
          if (existing.length === 0) {
            isUnique = true;
          }
          attempts++;
        }
        
        if (!isUnique) {
          referralCode = `REF${Date.now().toString(36).toUpperCase().slice(-8)}`;
        }
        
        // Create wallet
        await connection.execute(
          `INSERT INTO wallets (user_id, hotel_id, referral_code, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [user.user_id, user.hotel_id, referralCode]
        );
        
        createdCount++;
        
        // Add signup bonus for PRO users
        const [userDetails] = await connection.execute(
          `SELECT u.status, h.plan 
           FROM users u
           JOIN hotels h ON u.hotel_id = h.id
           WHERE u.id = ?`,
          [user.user_id]
        );
        
        if (userDetails[0] && userDetails[0].plan === 'pro') {
          // Get settings
          const [settings] = await connection.execute(
            `SELECT signup_bonus_amount FROM referral_settings 
             WHERE (hotel_id = ? OR hotel_id IS NULL) AND is_active = TRUE
             ORDER BY hotel_id DESC LIMIT 1`,
            [user.hotel_id]
          );
          
          const bonusAmount = settings[0]?.signup_bonus_amount || 100.00;
          
          // Update wallet with bonus
          await connection.execute(
            `UPDATE wallets SET 
             balance = balance + ?,
             signup_bonus_credited = TRUE
             WHERE user_id = ?`,
            [bonusAmount, user.user_id]
          );
          
          // Add transaction record
          const [wallet] = await connection.execute(
            `SELECT id FROM wallets WHERE user_id = ?`,
            [user.user_id]
          );
          
          if (wallet[0]) {
            await connection.execute(
              `INSERT INTO wallet_transactions 
               (wallet_id, user_id, hotel_id, transaction_id, type, amount, category, description, status)
               VALUES (?, ?, ?, ?, 'credit', ?, 'signup_bonus', ?, 'completed')`,
              [
                wallet[0].id,
                user.user_id,
                user.hotel_id,
                `BONUS_${Date.now()}_${user.user_id}`,
                bonusAmount,
                `Signup bonus credited: ₹${bonusAmount}`
              ]
            );
          }
        }
        
        if (createdCount % 10 === 0) {
          console.log(`✅ Created ${createdCount} wallets...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating wallet for user ${user.user_id}:`, error.message);
        // Continue with next user
      }
    }
    
    await connection.commit();
    
    console.log('\n🎉 Wallet creation completed!');
    console.log(`✅ Created: ${createdCount} wallets`);
    console.log(`❌ Errors: ${errorCount} users`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction failed:', error);
  } finally {
    connection.release();
  }
}

// Run the function
createWalletsForExistingUsers().then(() => {
  console.log('✨ Wallet creation process finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});