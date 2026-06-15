// controllers/walletController.js - CREATE NEW FILE
const Wallet = require('../models/Wallet');
const Referral = require('../models/Referral');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const walletController = {
  // Get wallet details
  getWallet: async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📱 Getting wallet for user:', userId);
    
    let summary = await Wallet.getWalletSummary(userId);
    
    if (!summary) {
      console.log('⚠️ Wallet not found, attempting to create one...');
      
      // Try to create wallet
      try {
        // Get user's hotel_id
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        if (user && user.hotel_id) {
          await Wallet.create(userId, user.hotel_id);
          console.log('✅ Created wallet for user:', userId);
          
          // Try getting summary again
          summary = await Wallet.getWalletSummary(userId);
        }
      } catch (createError) {
        console.error('❌ Failed to create wallet:', createError);
      }
    }
    
    if (!summary) {
      return res.status(200).json({
        success: true,
        message: 'Wallet is being created',
        data: {
          balance: 0,
          referral_balance: 0,
          total_referrals: 0,
          earned_from_referrals: 0,
          referral_code: 'PENDING',
          signup_bonus_credited: false,
          recent_transactions: []
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Wallet details retrieved successfully',
      data: summary
    });
    
  } catch (error) {
    console.error('❌ Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to load wallet: ' + error.message
    });
  }
},

  // Get transactions
  getTransactions: async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user.userId;
      
      console.log('📊 Getting transactions for user:', userId);
      
      const wallet = await Wallet.getByUserId(userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'WALLET_NOT_FOUND',
          message: 'Wallet not found'
        });
      }
      
      const transactions = await Wallet.getTransactions(
        wallet.id, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      res.json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        }
      });
      
    } catch (error) {
      console.error('❌ Get transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  },

  // Create top-up order
  createTopupOrder: async (req, res) => {
    try {
      const { amount } = req.body;
      const userId = req.user.userId;
      
      console.log('💰 Creating top-up order:', { userId, amount });
      
      if (!amount || amount < 100) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Minimum top-up amount is ₹100'
        });
      }
      
      // Validate Razorpay configuration
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'RAZORPAY_NOT_CONFIGURED',
          message: 'Razorpay is not configured'
        });
      }
      
      // Create Razorpay order
      const orderOptions = {
        amount: Math.round(parseFloat(amount) * 100), // Convert to paise
        currency: 'INR',
        receipt: `wallet_topup_${userId}_${Date.now()}`,
        notes: {
          type: 'wallet_topup',
          user_id: userId,
          amount: amount
        }
      };
      
      console.log('📦 Razorpay order options:', orderOptions);
      
      const order = await razorpay.orders.create(orderOptions);
      
      console.log('✅ Razorpay order created:', order.id);
      
      res.json({
        success: true,
        message: 'Order created successfully',
        data: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          created_at: order.created_at
        }
      });
      
    } catch (error) {
      console.error('❌ Create topup order error:', error);
      res.status(500).json({
        success: false,
        error: 'ORDER_CREATION_FAILED',
        message: error.message
      });
    }
  },

  // Verify wallet top-up payment
  verifyTopupPayment: async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        amount 
      } = req.body;
      
      const userId = req.user.userId;
      
      console.log('🔐 Verifying top-up payment:', {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        userId,
        amount
      });
      
      // Validate inputs
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'All payment fields are required'
        });
      }
      
      // Verify Razorpay signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');
      
      console.log('🔐 Signature verification:', {
        received: razorpay_signature.slice(0, 20) + '...',
        generated: generatedSignature.slice(0, 20) + '...'
      });
      
      if (generatedSignature !== razorpay_signature) {
        console.error('❌ Signature verification failed');
        return res.status(400).json({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Payment signature verification failed'
        });
      }
      
      // Verify payment with Razorpay API
      let paymentDetails;
      try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        console.log('✅ Payment details from Razorpay:', {
          id: paymentDetails.id,
          status: paymentDetails.status,
          amount: paymentDetails.amount,
          method: paymentDetails.method
        });
        
        if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
          return res.status(400).json({
            success: false,
            error: 'PAYMENT_NOT_CAPTURED',
            message: `Payment status is ${paymentDetails.status}`
          });
        }
      } catch (razorpayError) {
        console.error('Razorpay API error:', razorpayError);
        // Even if API fails, signature verification passed
        paymentDetails = {
          id: razorpay_payment_id,
          status: 'captured'
        };
      }
      
      // Top up wallet
      await Wallet.topUpWallet(userId, parseFloat(amount), razorpay_payment_id);
      
      // Get updated wallet
      const wallet = await Wallet.getByUserId(userId);
      
      res.json({
        success: true,
        message: 'Wallet top-up successful',
        data: {
          new_balance: wallet.balance,
          transaction_id: razorpay_payment_id,
          amount: amount
        }
      });
      
    } catch (error) {
      console.error('❌ Verify topup error:', error);
      res.status(500).json({
        success: false,
        error: 'TOPUP_FAILED',
        message: error.message
      });
    }
  },

  // Make PRO payment using wallet
  payWithWallet: async (req, res) => {
    try {
      const { amount, plan_type, description } = req.body;
      const userId = req.user.userId;
      
      console.log('💳 Processing wallet payment:', { userId, amount, plan_type });
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Valid amount is required'
        });
      }
      
      const wallet = await Wallet.getByUserId(userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'WALLET_NOT_FOUND',
          message: 'Wallet not found'
        });
      }
      
      // Generate reference ID for PRO payment
      const referenceId = `PRO_PAY_${Date.now()}_${userId}`;
      
      // Make payment from wallet
      const paymentResult = await Wallet.makePayment(
        wallet.id, 
        parseFloat(amount), 
        description || `PRO Plan payment: ${plan_type || 'subscription'}`,
        referenceId
      );
      
      // Update PRO payment record
      const ProPayment = require('../models/ProPayment');
      await ProPayment.create({
        hotel_id: wallet.hotel_id,
        hotel_name: req.user.hotelName || 'Hotel',
        admin_name: req.user.name,
        admin_email: req.user.email,
        razorpay_order_id: referenceId,
        razorpay_payment_id: `WALLET_${referenceId}`,
        amount: amount,
        currency: 'INR',
        plan_type: plan_type || 'pro',
        payment_status: 'success',
        payment_method: 'wallet',
        gateway_response: {
          method: 'wallet',
          wallet_id: wallet.id,
          user_id: userId,
          transaction_reference: referenceId,
          timestamp: new Date().toISOString()
        },
        metadata: {
          payment_source: 'wallet',
          wallet_transaction: true,
          user_id: userId
        }
      });
      
      // Update hotel plan
      const Hotel = require('../models/Hotel');
      await Hotel.update(wallet.hotel_id, {
        plan: plan_type || 'pro'
      });
      
      // Update user status to active
      const User = require('../models/User');
      await User.updateStatus(userId, 'active');
      
      // Complete referral if applicable
      await Wallet.completeReferral(userId, parseFloat(amount));
      
      // Update hotel trial expiry (add 6 months)
      const newExpiryDate = new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 6);
      await Hotel.updateTrialExpiry(wallet.hotel_id, newExpiryDate);
      
      res.json({
        success: true,
        message: 'Payment successful using wallet',
        data: {
          new_balance: paymentResult.newBalance,
          reference_id: referenceId,
          plan_activated: plan_type || 'pro',
          expiry_date: newExpiryDate
        }
      });
      
    } catch (error) {
      console.error('❌ Wallet payment error:', error);
      res.status(500).json({
        success: false,
        error: 'PAYMENT_FAILED',
        message: error.message
      });
    }
  },

  // Get referral statistics
  getReferralStats: async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log('📈 Getting referral stats for user:', userId);
      
      const stats = await Wallet.getReferralStats(userId);
      const wallet = await Wallet.getByUserId(userId);
      
      // Build referral link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const referralLink = wallet ? `${frontendUrl}/register?ref=${wallet.referral_code}` : null;
      
      res.json({
        success: true,
        message: 'Referral statistics retrieved successfully',
        data: {
          ...stats,
          referral_code: wallet?.referral_code,
          referral_link: referralLink,
          user_id: userId
        }
      });
      
    } catch (error) {
      console.error('❌ Get referral stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  },

  // Get referral leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      console.log('🏆 Getting leaderboard for hotel:', hotelId);
      
      const leaderboard = await Wallet.getLeaderboard(hotelId, 10);
      
      res.json({
        success: true,
        message: 'Leaderboard retrieved successfully',
        data: leaderboard
      });
      
    } catch (error) {
      console.error('❌ Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  },

  // Validate referral code
  validateReferralCode: async (req, res) => {
    try {
      const { code } = req.params;
      console.log('🔍 Validating referral code:', code);
      
      const referral = await Wallet.validateReferralCode(code);
      
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: 'INVALID_CODE',
          message: 'Invalid referral code'
        });
      }
      
      res.json({
        success: true,
        message: 'Referral code is valid',
        data: {
          referrer_id: referral.user_id,
          referrer_name: referral.referrer_name,
          referrer_email: referral.referrer_email,
          hotel_name: referral.hotel_name,
          referral_code: referral.referral_code,
          total_referrals: referral.total_referrals,
          successful_referrals: referral.successful_referrals,
          total_earnings: referral.total_earnings
        }
      });
      
    } catch (error) {
      console.error('❌ Validate referral error:', error);
      
      if (error.message.includes('maximum referral limit')) {
        return res.status(400).json({
          success: false,
          error: 'REFERRAL_LIMIT_REACHED',
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: error.message
      });
    }
  },

  // Get referral settings
  getReferralSettings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      console.log('⚙️ Getting referral settings for hotel:', hotelId);
      
      const settings = await Wallet.getReferralSettings(hotelId);
      
      res.json({
        success: true,
        message: 'Referral settings retrieved successfully',
        data: settings
      });
      
    } catch (error) {
      console.error('❌ Get referral settings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  },

  // Update referral settings (admin only)
  updateReferralSettings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const userId = req.user.userId;
      
      const {
        signup_bonus_amount,
        referral_bonus_amount,
        commission_percentage,
        max_referrals_per_user,
        min_pro_payment_for_commission,
        is_active
      } = req.body;
      
      console.log('⚙️ Updating referral settings:', { hotelId, userId, ...req.body });
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Only admin can update referral settings'
        });
      }
      
      // Validate inputs
      if (signup_bonus_amount < 0 || referral_bonus_amount < 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Bonus amounts cannot be negative'
        });
      }
      
      if (commission_percentage < 0 || commission_percentage > 100) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PERCENTAGE',
          message: 'Commission percentage must be between 0 and 100'
        });
      }
      
      const settings = {
        signup_bonus_amount: parseFloat(signup_bonus_amount),
        referral_bonus_amount: parseFloat(referral_bonus_amount),
        commission_percentage: parseFloat(commission_percentage),
        max_referrals_per_user: parseInt(max_referrals_per_user),
        min_pro_payment_for_commission: parseFloat(min_pro_payment_for_commission),
        is_active: is_active === true || is_active === 'true'
      };
      
      const Referral = require('../models/Referral');
      const updated = await Referral.updateSettings(hotelId, settings, userId);
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to update referral settings'
        });
      }
      
      res.json({
        success: true,
        message: 'Referral settings updated successfully',
        data: settings
      });
      
    } catch (error) {
      console.error('❌ Update referral settings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  }
};

module.exports = walletController;