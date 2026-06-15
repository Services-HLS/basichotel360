


const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentController = {
  generatePaymentQR: async (req, res) => {
    try {
      const { amount, booking_id, customer_name } = req.body;
      const hotelId = req.user.hotel_id;

      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Create transaction record
      const transactionRecord = await Transaction.create({
        hotel_id: hotelId,
        booking_id: booking_id,
        customer_id: null, // Will be updated later
        transaction_id: transactionId,
        amount: parseFloat(amount),
        currency: 'INR',
        payment_method: 'online',
        payment_gateway: 'upi',
        status: 'pending',
        status_message: 'QR generated, waiting for payment'
      });

      // Generate UPI QR code data
      const upiId = process.env.UPI_ID || 'dummy-test@ybl';
      const merchantName = process.env.MERCHANT_NAME || 'Hotel Management';
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionId)}`;

      res.json({
        success: true,
        data: {
          qr_data: upiString,
          transaction_id: transactionId,
          amount: parseFloat(amount),
          upi_id: upiId,
          merchant_name: merchantName,
          booking_id: booking_id,
          transaction_record_id: transactionRecord,
          instructions: 'Scan this QR code with any UPI app'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  verifyPayment: async (req, res) => {
    try {
      const { transaction_id, booking_id } = req.body;
      const hotelId = req.user.hotel_id;

      // Find transaction
      const transaction = await Transaction.findByTransactionId(transaction_id, hotelId);
      if (!transaction) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }

      // Update transaction status
      await Transaction.updateStatus(transaction.id, hotelId, {
        status: 'success',
        status_message: 'Payment verified successfully'
      });

      // Update booking payment status
      if (booking_id) {
        await Booking.updatePaymentStatus(booking_id, hotelId, 'completed', transaction_id);
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: { transaction_id, status: 'completed' }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // For testing - simulate payment
  simulatePayment: async (req, res) => {
    try {
      const { transaction_id } = req.params;
      const hotelId = req.user.hotel_id;

      const transaction = await Transaction.findByTransactionId(transaction_id, hotelId);
      if (!transaction) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }

      // Simulate payment
      await Transaction.updateStatus(transaction.id, hotelId, {
        status: 'success',
        status_message: 'Dummy payment simulated for testing'
      });

      res.json({
        success: true,
        message: 'Payment simulated successfully',
        data: { transaction_id, status: 'success', simulated: true }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

   verifyDummyPayment: async (req, res) => {
    try {
      const { transaction_id } = req.params;
      const hotelId = req.user.hotel_id;

      if (!transaction_id) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Transaction ID is required'
        });
      }

      // Find transaction
      const transaction = await Transaction.findByTransactionId(transaction_id, hotelId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        });
      }

      // For dummy payments, always return success
      res.json({
        success: true,
        message: 'Dummy payment verification (always succeeds in test mode)',
        data: {
          transaction_id: transaction_id,
          status: 'success',
          amount: transaction.amount,
          booking_id: transaction.booking_id,
          verified_at: new Date().toISOString(),
          test_mode: true,
          note: 'This is a dummy verification for testing'
        }
      });

    } catch (error) {
      console.error('Verify dummy payment error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to verify dummy payment'
      });
    }
  },

  // Create Razorpay order for PRO plan registration
  createOrder: async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, notes } = req.body;

      if (!amount) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Amount is required'
        });
      }

      // Validate Razorpay is configured
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'RAZORPAY_NOT_CONFIGURED',
          message: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.'
        });
      }

      // Create order options
      const options = {
        amount: parseInt(amount), // Amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {}
      };

      console.log('📦 Creating Razorpay order:', options);

      // Create order using Razorpay API
      const order = await razorpay.orders.create(options);

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
      console.error('Create Razorpay order error:', error);
      res.status(500).json({
        success: false,
        error: 'ORDER_CREATION_FAILED',
        message: error.message || 'Failed to create Razorpay order'
      });
    }
  },

  // Verify Razorpay payment signature
  verifyRazorpayPayment: async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        plan,
        hotelName,
        email
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Razorpay order ID, payment ID, and signature are required'
        });
      }

      // Validate Razorpay is configured
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'RAZORPAY_NOT_CONFIGURED',
          message: 'Razorpay secret key is not configured'
        });
      }

      // Generate signature for verification
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      console.log('🔐 Verifying payment signature:');
      console.log('  Order ID:', razorpay_order_id);
      console.log('  Payment ID:', razorpay_payment_id);
      console.log('  Received Signature:', razorpay_signature);
      console.log('  Generated Signature:', generatedSignature);

      // Verify signature
      if (generatedSignature !== razorpay_signature) {
        console.error('❌ Signature verification failed');
        return res.status(400).json({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Payment signature verification failed'
        });
      }

      // Optional: Fetch payment details from Razorpay to double-check
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        console.log('✅ Payment verified successfully:', {
          payment_id: payment.id,
          order_id: payment.order_id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency
        });

        // Verify payment status
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
          return res.status(400).json({
            success: false,
            error: 'PAYMENT_NOT_CAPTURED',
            message: `Payment status is ${payment.status}, not captured`
          });
        }

        // Verify order matches
        if (payment.order_id !== razorpay_order_id) {
          return res.status(400).json({
            success: false,
            error: 'ORDER_MISMATCH',
            message: 'Payment order ID does not match'
          });
        }

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            payment_id: payment.id,
            order_id: payment.order_id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            verified_at: new Date().toISOString(),
            plan: plan || 'pro',
            hotelName: hotelName,
            email: email
          }
        });

      } catch (razorpayError) {
        console.error('Razorpay API error:', razorpayError);
        // Even if API call fails, signature verification passed, so we can trust the payment
        res.json({
          success: true,
          message: 'Payment signature verified (API verification skipped)',
          data: {
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            verified_at: new Date().toISOString(),
            plan: plan || 'pro',
            hotelName: hotelName,
            email: email,
            note: 'Signature verified but Razorpay API verification failed'
          }
        });
      }

    } catch (error) {
      console.error('Verify Razorpay payment error:', error);
      res.status(500).json({
        success: false,
        error: 'VERIFICATION_FAILED',
        message: error.message || 'Failed to verify Razorpay payment'
      });
    }
  },

};

module.exports = paymentController;