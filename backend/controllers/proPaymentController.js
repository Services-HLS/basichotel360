



const ProPayment = require('../models/ProPayment');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Hotel = require('../models/Hotel'); // ADD THIS
const User = require('../models/User');   // ADD THIS
const axios = require('axios');
const { getUpgradePricing, addMonths } = require('../utils/proPlanPricing');
const { isBasicHotelPlan } = require('../utils/planUtils');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const proPaymentController = {
  // Create Razorpay order for PRO plan registration
  createOrder: async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, notes, hotelName, adminName, adminEmail, adminPhone } = req.body;

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
      const orderOptions = {
        amount: parseInt(amount), // Amount in paise
        currency: currency,
        receipt: receipt || `pro_plan_${Date.now()}`,
        notes: {
          ...notes,
          plan: 'pro',
          hotelName: hotelName,
          adminEmail: adminEmail
        }
      };

      console.log('📦 Creating Razorpay order for PRO plan:', orderOptions);

      // Create order using Razorpay API
      const order = await razorpay.orders.create(orderOptions);

      console.log('✅ Razorpay order created:', order.id);

      // Save payment record in database (before payment)
      const paymentRecordId = await ProPayment.create({
        hotel_id: null, // Will be updated after hotel registration
        hotel_name: hotelName,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_phone: adminPhone,
        razorpay_order_id: order.id,
        razorpay_payment_id: null, // Will be updated after payment
        razorpay_signature: null, // Will be updated after payment
        amount: order.amount,
        currency: order.currency,
        plan_type: 'pro',
        payment_status: 'pending',
        payment_method: null,
        gateway_response: {
          order_created: true,
          order_id: order.id,
          created_at: new Date().toISOString()
        },
        metadata: {
          receipt: order.receipt,
          notes: order.notes
        }
      });

      res.json({
        success: true,
        message: 'Order created successfully',
        data: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          created_at: order.created_at,
          payment_record_id: paymentRecordId
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

  // Verify Razorpay payment signature and save payment details
  verifyPayment: async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        plan,
        hotelName,
        email,
        adminName,
        adminPhone
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
        
        // Update payment record with failed status
        const existingPayment = await ProPayment.findByRazorpayOrderId(razorpay_order_id);
        if (existingPayment) {
          await ProPayment.updateStatus(existingPayment.id, {
            payment_status: 'failed',
            gateway_response: {
              error: 'INVALID_SIGNATURE',
              message: 'Payment signature verification failed'
            }
          });
        }

        return res.status(400).json({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Payment signature verification failed'
        });
      }

      // Fetch payment details from Razorpay to verify
      let paymentDetails = null;
      try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        
        console.log('✅ Payment verified successfully:', {
          payment_id: paymentDetails.id,
          order_id: paymentDetails.order_id,
          status: paymentDetails.status,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          method: paymentDetails.method
        });

        // Verify payment status
        if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
          return res.status(400).json({
            success: false,
            error: 'PAYMENT_NOT_CAPTURED',
            message: `Payment status is ${paymentDetails.status}, not captured`
          });
        }

        // Verify order matches
        if (paymentDetails.order_id !== razorpay_order_id) {
          return res.status(400).json({
            success: false,
            error: 'ORDER_MISMATCH',
            message: 'Payment order ID does not match'
          });
        }

      } catch (razorpayError) {
        console.error('Razorpay API error:', razorpayError);
        // Even if API call fails, signature verification passed
        paymentDetails = {
          id: razorpay_payment_id,
          order_id: razorpay_order_id,
          status: 'captured', // Assume captured if signature is valid
          amount: null,
          currency: 'INR',
          method: null
        };
      }

      // Find existing payment record by order ID
      let paymentRecord = await ProPayment.findByRazorpayOrderId(razorpay_order_id);
      
      if (paymentRecord) {
        // Update existing payment record
        await ProPayment.updateWithRazorpay(razorpay_order_id, {
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          payment_status: 'success',
          payment_method: paymentDetails.method || 'razorpay',
          gateway_response: {
            verified: true,
            verified_at: new Date().toISOString(),
            payment_id: paymentDetails.id,
            order_id: paymentDetails.order_id,
            status: paymentDetails.status,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency,
            method: paymentDetails.method,
            card_id: paymentDetails.card_id || null,
            bank: paymentDetails.bank || null,
            wallet: paymentDetails.wallet || null,
            vpa: paymentDetails.vpa || null
          }
        });
        
        paymentRecord = await ProPayment.findByRazorpayOrderId(razorpay_order_id);
      } else {
        // Create new payment record if not found
        const paymentRecordId = await ProPayment.create({
          hotel_id: null,
          hotel_name: hotelName,
          admin_name: adminName,
          admin_email: email,
          admin_phone: adminPhone,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          amount: paymentDetails.amount || 0,
          currency: paymentDetails.currency || 'INR',
          plan_type: plan || 'pro',
          payment_status: 'success',
          payment_method: paymentDetails.method || 'razorpay',
          gateway_response: {
            verified: true,
            verified_at: new Date().toISOString(),
            payment_id: paymentDetails.id,
            order_id: paymentDetails.order_id,
            status: paymentDetails.status,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency,
            method: paymentDetails.method
          },
          metadata: {
            plan: plan || 'pro',
            hotelName: hotelName,
            adminEmail: email
          }
        });
        
        paymentRecord = await ProPayment.findById(paymentRecordId);
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          status: 'success',
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          verified_at: new Date().toISOString(),
          plan: plan || 'pro',
          hotelName: hotelName,
          email: email,
          payment_record_id: paymentRecord.id
        }
      });

    } catch (error) {
      console.error('Verify Razorpay payment error:', error);
      res.status(500).json({
        success: false,
        error: 'VERIFICATION_FAILED',
        message: error.message || 'Failed to verify Razorpay payment'
      });
    }
  },

  /** Basic → Pro: create Razorpay order (monthly ₹499 / yearly ₹4,788) */
  createUpgradeOrder: async (req, res) => {
    try {
      const billingPeriod = req.body.billing_period === 'yearly' ? 'yearly' : 'monthly';
      const hotelId = req.user.hotel_id;
      const pricing = getUpgradePricing(billingPeriod);

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'RAZORPAY_NOT_CONFIGURED',
          message: 'Payment gateway is not configured.',
        });
      }

      const hotelData = await Hotel.findById(hotelId);
      if (!hotelData) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found',
        });
      }

      if (!isBasicHotelPlan(hotelData.plan)) {
        return res.status(400).json({
          success: false,
          error: 'ALREADY_PRO',
          message: 'Your hotel is already on a paid Pro plan.',
        });
      }

      const orderOptions = {
        amount: pricing.amountPaise,
        currency: 'INR',
        receipt: `pro_upgrade_${hotelId}_${billingPeriod}_${Date.now()}`,
        payment_capture: 1,
        notes: {
          type: 'pro_upgrade',
          billing_period: billingPeriod,
          hotel_id: String(hotelId),
          hotel_name: hotelData.name,
          user_id: String(req.user.id),
          email: req.user.email,
        },
      };

      const order = await razorpay.orders.create(orderOptions);

      await ProPayment.create({
        hotel_id: hotelId,
        hotel_name: hotelData.name,
        admin_name: req.user.name,
        admin_email: req.user.email,
        admin_phone: req.user.phone,
        razorpay_order_id: order.id,
        razorpay_payment_id: null,
        razorpay_signature: null,
        amount: pricing.amountRupees,
        currency: order.currency,
        plan_type: billingPeriod === 'yearly' ? 'pro_upgrade_yearly' : 'pro_upgrade_monthly',
        payment_status: 'pending',
        payment_method: null,
        gateway_response: {
          order_created: true,
          order_id: order.id,
          billing_period: billingPeriod,
          created_at: new Date().toISOString(),
        },
        metadata: {
          receipt: order.receipt,
          notes: order.notes,
          billing_period: billingPeriod,
        },
      });

      res.json({
        success: true,
        message: 'Upgrade order created',
        data: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          billing_period: billingPeriod,
          amount_rupees: pricing.amountRupees,
          label: pricing.label,
        },
      });
    } catch (error) {
      console.error('❌ Create upgrade order error:', error);
      res.status(500).json({
        success: false,
        error: 'ORDER_CREATION_FAILED',
        message: error.message || 'Failed to create payment order',
      });
    }
  },

  /** Verify upgrade payment and activate Pro */
  verifyUpgrade: async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        billing_period: billingPeriodBody,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Payment details are required',
        });
      }

      const hotelId = req.user.hotel_id;
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        await ProPayment.updateWithRazorpay(razorpay_order_id, {
          razorpay_payment_id,
          razorpay_signature,
          payment_status: 'failed',
          gateway_response: { error: 'INVALID_SIGNATURE' },
        });
        return res.status(400).json({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Payment verification failed',
        });
      }

      const paymentRecord = await ProPayment.findByRazorpayOrderId(razorpay_order_id);
      const billingPeriod =
        billingPeriodBody ||
        paymentRecord?.metadata?.billing_period ||
        (paymentRecord?.plan_type === 'pro_upgrade_yearly' ? 'yearly' : 'monthly');
      const pricing = getUpgradePricing(billingPeriod);

      let paymentMethod = 'razorpay';
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        paymentMethod = paymentDetails.method || paymentMethod;
        if (
          paymentDetails.status !== 'captured' &&
          paymentDetails.status !== 'authorized'
        ) {
          return res.status(400).json({
            success: false,
            error: 'PAYMENT_NOT_CAPTURED',
            message: `Payment status is ${paymentDetails.status}`,
          });
        }
      } catch (fetchErr) {
        console.warn('Razorpay fetch skipped:', fetchErr.message);
      }

      await ProPayment.updateWithRazorpay(razorpay_order_id, {
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'success',
        payment_method: paymentMethod,
        gateway_response: {
          verified: true,
          verified_at: new Date().toISOString(),
          billing_period: billingPeriod,
        },
      });

      const newExpiryDate = addMonths(new Date(), pricing.months);
      const hotelRow = await Hotel.findById(hotelId);

      await Hotel.update(hotelId, {
        name: hotelRow.name,
        address: hotelRow.address,
        plan: 'pro',
        gst_number: hotelRow.gst_number,
      });
      await Hotel.updateTrialExpiry(hotelId, newExpiryDate);
      await User.updateStatus(req.user.id, 'active');

      res.json({
        success: true,
        message: 'Upgraded to Pro successfully',
        data: {
          plan: 'pro',
          billing_period: billingPeriod,
          expiry_date: newExpiryDate,
          amount_rupees: pricing.amountRupees,
        },
      });
    } catch (error) {
      console.error('❌ Verify upgrade error:', error);
      res.status(500).json({
        success: false,
        error: 'VERIFICATION_FAILED',
        message: error.message || 'Failed to verify payment',
      });
    }
  },

  // Reactivation payment order


// In proPaymentController.js - Update reactivateOrder
// reactivateOrder: async (req, res) => {
//   try {
//     const { hotel_id, email, name, phone } = req.body;
    
//     console.log("📦 Creating reactivation order:", { hotel_id, email, name, phone });

//     // Get hotel details
//     const hotelData = await Hotel.findById(hotel_id);
//     if (!hotelData) {
//       return res.status(404).json({
//         success: false,
//         error: 'HOTEL_NOT_FOUND',
//         message: 'Hotel not found'
//       });
//     }

//     // Create order in Razorpay
//     const orderOptions = {
//       amount: 99900, // ₹999 in paise
//       currency: 'INR',
//       receipt: `reactivate_${hotel_id}_${Date.now()}`,
//       payment_capture: 1,
//       notes: {
//         type: 'reactivation',
//         hotel_id: String(hotel_id),
//         hotel_name: hotelData.name,
//         email: email
//       }
//     };

//     console.log('📦 Creating order with options:', orderOptions);

//     // Create order
//     const order = await razorpay.orders.create(orderOptions);
//     console.log('✅ Order created:', order.id);

//     // Save payment record
//     const paymentRecordId = await ProPayment.create({
//       hotel_id: hotel_id,
//       hotel_name: hotelData.name,
//       admin_name: name,
//       admin_email: email,
//       admin_phone: phone,
//       razorpay_order_id: order.id,
//       razorpay_payment_id: null,
//       razorpay_signature: null,
//       amount: order.amount / 100, // Convert paise to rupees for storage
//       currency: order.currency,
//       plan_type: 'pro_reactivation',
//       payment_status: 'pending',
//       payment_method: null,
//       gateway_response: {
//         order_created: true,
//         order_id: order.id,
//         created_at: new Date().toISOString()
//       },
//       metadata: {
//         receipt: order.receipt,
//         notes: order.notes
//       }
//     });

//     // ✅ ADD PAYMENT LOG
//     await ProPayment.createPaymentLog({
//       url: 'https://api.razorpay.com/v1/orders',
//       method: 'POST',
//       headers: JSON.stringify({
//         'content-type': 'application/json',
//         Authorization: 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
//       }),
//       req_body: JSON.stringify(orderOptions),
//       response_body: JSON.stringify(order),
//       status: 'SUCCESS',
//       order_id: order.id,
//       razorpay_order_id: order.id,
//       razorpay_payment_id: null,
//       created_ts: new Date()
//     });

//     res.json({
//       success: true,
//       message: 'Reactivation order created',
//       data: {
//         id: order.id,
//         amount: order.amount, // Send in paise to frontend
//         currency: order.currency,
//         receipt: order.receipt,
//         status: order.status,
//         created_at: order.created_at,
//         payment_record_id: paymentRecordId
//       }
//     });

//   } catch (error) {
//     console.error('❌ Reactivation order error:', error);
    
//     // ✅ ADD ERROR LOG
//     await ProPayment.createPaymentLog({
//       url: 'https://api.razorpay.com/v1/orders',
//       method: 'POST',
//       headers: JSON.stringify(req.headers),
//       req_body: JSON.stringify(req.body),
//       response_body: JSON.stringify(error.message),
//       status: 'ERROR',
//       order_id: null,
//       razorpay_order_id: null,
//       razorpay_payment_id: null,
//       created_ts: new Date()
//     });

//     res.status(500).json({
//       success: false,
//       error: 'ORDER_CREATION_FAILED',
//       message: error.message
//     });
//   }
// },
// In proPaymentController.js - Update reactivateOrder
reactivateOrder: async (req, res) => {
  try {
    const { hotel_id, email, name, phone } = req.body;
    
    console.log("📦 Creating reactivation order:", { hotel_id, email, name, phone });

    // Get hotel details including custom amount
    const hotelData = await Hotel.findById(hotel_id);
    if (!hotelData) {
      return res.status(404).json({
        success: false,
        error: 'HOTEL_NOT_FOUND',
        message: 'Hotel not found'
      });
    }

    // Check if there's a custom amount set by superadmin
    let amount = 99900; // Default ₹999 in paise
    if (hotelData.custom_reactivation_amount) {
      amount = hotelData.custom_reactivation_amount * 100; // Convert to paise
    }

    // Create order in Razorpay
    const orderOptions = {
      amount: amount, // Use custom or default amount
      currency: 'INR',
      receipt: `reactivate_${hotel_id}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        type: 'reactivation',
        hotel_id: String(hotel_id),
        hotel_name: hotelData.name,
        email: email,
        amount_original: amount / 100 // Store original amount in rupees for reference
      }
    };

    console.log('📦 Creating order with options:', orderOptions);

    // Create order
    const order = await razorpay.orders.create(orderOptions);
    console.log('✅ Order created:', order.id);

    // Save payment record
    const paymentRecordId = await ProPayment.create({
      hotel_id: hotel_id,
      hotel_name: hotelData.name,
      admin_name: name,
      admin_email: email,
      admin_phone: phone,
      razorpay_order_id: order.id,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount: order.amount / 100, // Convert paise to rupees for storage
      currency: order.currency,
      plan_type: 'pro_reactivation',
      payment_status: 'pending',
      payment_method: null,
      gateway_response: {
        order_created: true,
        order_id: order.id,
        created_at: new Date().toISOString(),
        custom_amount: hotelData.custom_reactivation_amount ? true : false
      },
      metadata: {
        receipt: order.receipt,
        notes: order.notes,
        custom_amount: hotelData.custom_reactivation_amount || null
      }
    });

    // Add payment log
    await ProPayment.createPaymentLog({
      url: 'https://api.razorpay.com/v1/orders',
      method: 'POST',
      headers: JSON.stringify({
        'content-type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
      }),
      req_body: JSON.stringify(orderOptions),
      response_body: JSON.stringify(order),
      status: 'SUCCESS',
      order_id: order.id,
      razorpay_order_id: order.id,
      razorpay_payment_id: null,
      created_ts: new Date()
    });

    res.json({
      success: true,
      message: 'Reactivation order created',
      data: {
        id: order.id,
        amount: order.amount, // Send in paise to frontend
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
        payment_record_id: paymentRecordId,
        custom_amount: hotelData.custom_reactivation_amount || null
      }
    });

  } catch (error) {
    console.error('❌ Reactivation order error:', error);
    
    await ProPayment.createPaymentLog({
      url: 'https://api.razorpay.com/v1/orders',
      method: 'POST',
      headers: JSON.stringify(req.headers),
      req_body: JSON.stringify(req.body),
      response_body: JSON.stringify(error.message),
      status: 'ERROR',
      order_id: null,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      created_ts: new Date()
    });

    res.status(500).json({
      success: false,
      error: 'ORDER_CREATION_FAILED',
      message: error.message
    });
  }
},

// Update verifyReactivation
verifyReactivation: async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      hotel_id
    } = req.body;

    console.log("🔍 Verifying reactivation:", { 
      razorpay_order_id, 
      razorpay_payment_id, 
      hotel_id 
    });

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !hotel_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'All fields are required'
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    console.log('🔐 Signature check:', {
      received: razorpay_signature,
      generated: generatedSignature
    });

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Invalid signature');
      
      // Update payment record as failed
      await ProPayment.updateWithRazorpay(razorpay_order_id, {
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_status: 'failed',
        gateway_response: {
          error: 'Invalid signature',
          verified_at: new Date().toISOString()
        }
      });

      // ✅ ADD FAILED LOG
      await ProPayment.createPaymentLog({
        url: req.url,
        method: 'POST',
        headers: JSON.stringify(req.headers),
        req_body: JSON.stringify(req.body),
        response_body: JSON.stringify({ error: 'Invalid signature' }),
        status: 'FAILED',
        order_id: null,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        created_ts: new Date()
      });

      return res.status(400).json({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Payment verification failed'
      });
    }

    // Fetch payment details from Razorpay (like your old project)
    let paymentDetails;
    let paymentStatus = 'captured';
    let paymentMethod = 'unknown';
    
    try {
      const axios = require('axios');
      const options = {
        method: 'GET',
        url: `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
        }
      };
      
      const response = await axios.request(options);
      paymentDetails = response.data;
      paymentStatus = paymentDetails.status;
      paymentMethod = paymentDetails.method || 'unknown';
      
      console.log('✅ Payment details:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.amount,
        method: paymentDetails.method
      });

      // Capture payment if authorized (like your old project)
      if (paymentDetails.status === 'authorized') {
        console.log('Capturing authorized payment...');
        const captureResponse = await axios.post(
          `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`,
          { amount: paymentDetails.amount, currency: 'INR' },
          {
            headers: {
              Authorization: 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64'),
              'Content-Type': 'application/json'
            }
          }
        );
        paymentStatus = 'captured';
        console.log('✅ Payment captured successfully');
      }

    } catch (fetchError) {
      console.error('Could not fetch payment details:', fetchError.message);
      paymentDetails = { 
        id: razorpay_payment_id, 
        status: 'captured',
        method: 'unknown',
        amount: 99900
      };
    }

    // Update payment record as successful
    await ProPayment.updateWithRazorpay(razorpay_order_id, {
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      payment_status: 'success',
      payment_method: paymentMethod,
      gateway_response: {
        verified: true,
        verified_at: new Date().toISOString(),
        payment_id: paymentDetails.id,
        status: paymentStatus,
        amount: paymentDetails.amount,
        method: paymentMethod
      }
    });

    // ✅ ADD SUCCESS LOG
    await ProPayment.createPaymentLog({
      url: `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      method: 'GET',
      headers: JSON.stringify({
        Authorization: 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
      }),
      req_body: '',
      response_body: JSON.stringify(paymentDetails),
      status: 'SUCCESS',
      order_id: null,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      created_ts: new Date()
    });

    // Extend hotel trial by 6 months
    const newExpiryDate = new Date();
    newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
    
    await Hotel.updateTrialExpiry(hotel_id, newExpiryDate);
    console.log('📅 Trial extended to:', newExpiryDate.toISOString().split('T')[0]);

    // Update user status to active
    const users = await User.findByHotel(hotel_id);
    const adminUser = users.find(u => u.role === 'admin');
    
    if (adminUser) {
      await User.updateStatus(adminUser.id, 'active');
      console.log('👤 User status updated to active');
    }

    res.json({
      success: true,
      message: 'Account reactivated successfully',
      data: {
        payment_id: razorpay_payment_id,
        new_expiry_date: newExpiryDate,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('❌ Verify reactivation error:', error);
    
    // ✅ ADD ERROR LOG
    await ProPayment.createPaymentLog({
      url: req.url,
      method: 'POST',
      headers: JSON.stringify(req.headers),
      req_body: JSON.stringify(req.body),
      response_body: JSON.stringify(error.message),
      status: 'ERROR',
      order_id: null,
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_payment_id: req.body.razorpay_payment_id,
      created_ts: new Date()
    });

    res.status(500).json({
      success: false,
      error: 'VERIFICATION_FAILED',
      message: error.message
    });
  }
},
  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await ProPayment.findById(id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Failed to get payment'
      });
    }
  },

  // Get payments by hotel ID
  getPaymentsByHotel: async (req, res) => {
    try {
      const { hotelId } = req.params;
      
      const payments = await ProPayment.findByHotelId(hotelId);
      
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });

    } catch (error) {
      console.error('Get payments by hotel error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Failed to get payments'
      });
    }
  },

  // Get payments by email
  getPaymentsByEmail: async (req, res) => {
    try {
      const { email } = req.params;
      
      const payments = await ProPayment.findByEmail(email);
      
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });

    } catch (error) {
      console.error('Get payments by email error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Failed to get payments'
      });
    }
  },

  // Get payment statistics
  getStats: async (req, res) => {
    try {
      const stats = await ProPayment.getStats();
      const monthlyRevenue = await ProPayment.getMonthlyRevenue();
      const reactivationStats = await ProPayment.getReactivationStats();
      
      res.json({
        success: true,
        data: {
          stats,
          monthlyRevenue,
          reactivationStats
        }
      });

    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Failed to get payment statistics'
      });
    }
  },

  // Search payments
  searchPayments: async (req, res) => {
    try {
      const { q, limit = 50, offset = 0 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_QUERY',
          message: 'Search query is required'
        });
      }

      const payments = await ProPayment.search(q, parseInt(limit), parseInt(offset));
      const total = await ProPayment.getCount();
      
      res.json({
        success: true,
        data: payments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      });

    } catch (error) {
      console.error('Search payments error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Failed to search payments'
      });
    }
  },

  // Get reactivation payment for hotel
  getReactivationByHotel: async (req, res) => {
    try {
      const { hotelId } = req.params;
      
      const payment = await ProPayment.findReactivationByHotel(hotelId);
      
      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Get reactivation payment error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Failed to get reactivation payment'
      });
    }
  }

  
};

module.exports = proPaymentController;