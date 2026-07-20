


const Hotel = require('../models/Hotel');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const crypto = require('crypto');
const WhatsAppService = require('../services/whatsappService');
const { pool } = require('../config/database');
const { normalizeHotelPlan, isBasicHotelPlan } = require('../utils/planUtils');

const hotelController = {

  /** Send WhatsApp OTP for basic registration */
  sendBasicRegistrationOTP: async (req, res) => {
    try {
      const { username, phone } = req.body;

      if (!username || !phone) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Username and phone are required'
        });
      }

      const cleanUsername = username.trim();
      const cleanPhone = String(phone).replace(/\D/g, '');

      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_USERNAME',
          message: 'Username must be at least 3 characters'
        });
      }

      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE',
          message: 'Phone must be a valid 10-digit number'
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpKey = `reg_${cleanPhone}_${cleanUsername.toLowerCase()}`;
      const saved = await User.saveEmailOTP(otpKey, otp, 15);
      if (!saved) {
        throw new Error('Failed to save OTP');
      }

      let whatsappSent = false;
      let whatsappError = null;

      try {
        const whatsappResult = await WhatsAppService.sendHotelUpdateNotification(
          cleanUsername,
          `Registration OTP: ${otp}`,
          cleanPhone
        );
        whatsappSent = whatsappResult.success;
        if (!whatsappSent) {
          whatsappError = whatsappResult.error || whatsappResult.data || 'WhatsApp delivery failed';
        }
      } catch (err) {
        whatsappError = err.message;
      }

      if (!whatsappSent) {
        return res.status(500).json({
          success: false,
          error: 'WHATSAPP_FAILED',
          message: whatsappError || 'Failed to send OTP on WhatsApp. Please try again.'
        });
      }

      res.json({
        success: true,
        message: 'OTP sent to your WhatsApp (valid for 15 minutes)',
        data: {
          phone: cleanPhone,
          expiresIn: '15 minutes',
          ...(process.env.NODE_ENV === 'development' && { otp })
        }
      });
    } catch (error) {
      console.error('❌ [BASIC REG OTP] Error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to send OTP: ' + error.message
      });
    }
  },

  /** Verify WhatsApp OTP for basic registration */
  verifyBasicRegistrationOTP: async (req, res) => {
    try {
      const { username, phone, otp } = req.body;

      if (!username || !phone || !otp) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Username, phone, and OTP are required'
        });
      }

      const cleanUsername = username.trim();
      const cleanPhone = String(phone).replace(/\D/g, '');
      const otpKey = `reg_${cleanPhone}_${cleanUsername.toLowerCase()}`;

      const isValid = await User.verifyEmailOTP(otpKey, String(otp).trim());
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_OTP',
          message: 'OTP is wrong or expired. Please tap Send WhatsApp OTP again and use the new code.'
        });
      }

      res.json({
        success: true,
        message: 'Phone verified successfully'
      });
    } catch (error) {
      console.error('❌ [BASIC REG VERIFY OTP] Error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to verify OTP'
      });
    }
  },

  /** Basic registration: username + phone only (BASIC / free plan) */
  registerBasic: async (req, res) => {
    try {
      const { username, phone, otp } = req.body;

      if (!username || !phone || !otp) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Username, phone, and OTP are required'
        });
      }

      const cleanUsername = username.trim();
      const cleanPhone = String(phone).replace(/\D/g, '');

      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_USERNAME',
          message: 'Username must be at least 3 characters'
        });
      }

      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE',
          message: 'Phone must be a valid 10-digit number'
        });
      }

      const otpKey = `reg_${cleanPhone}_${cleanUsername.toLowerCase()}`;
      const isOTPValid = await User.verifyEmailOTP(otpKey, String(otp).trim());
      if (!isOTPValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_OTP',
          message: 'OTP is wrong or expired. Tap Send WhatsApp OTP again and use the new code.'
        });
      }

      const [duplicateRows] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND phone = ?',
        [cleanUsername, cleanPhone]
      );
      if (duplicateRows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'USERNAME_AND_PHONE_EXIST',
          message: 'This username and phone are already registered'
        });
      }

      const existingUser = await User.findByUsername(cleanUsername);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'USERNAME_EXISTS',
          message: 'Username already taken. Please choose a different username.'
        });
      }

      let hotelName = `${cleanUsername} Hotel`;
      let suffix = 0;
      while (await Hotel.findByName(hotelName)) {
        suffix += 1;
        hotelName = `${cleanUsername} Hotel ${suffix}`;
      }

      const dbPlan = 'base';
      const autoEmail = `${cleanUsername.replace(/\s+/g, '').toLowerCase()}@hotel.com`;

      const hotelId = await Hotel.create({
        name: hotelName,
        address: 'Address not provided',
        plan: dbPlan,
        gst_number: null,
        trial_expiry_date: null
      });

      const userId = await User.create({
        username: cleanUsername,
        password: cleanPhone,
        role: 'admin',
        name: cleanUsername,
        email: autoEmail,
        phone: cleanPhone,
        hotel_id: hotelId,
        status: 'active',
        trial_expiry_date: null,
        hotel_plan: dbPlan
      });

      try {
        await EmailService.sendWelcomeEmail({
          hotelName,
          plan: dbPlan,
          adminName: cleanUsername,
          adminEmail: autoEmail,
          trialDays: null,
          trialExpiryDate: null
        });
      } catch (emailError) {
        console.warn('⚠️ Welcome email failed to send:', emailError.message);
      }

      try {
        await pool.execute('DELETE FROM email_otps WHERE email = ?', [otpKey]);
      } catch (deleteErr) {
        console.warn('⚠️ Could not delete OTP after registration:', deleteErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Login with your username and phone number as password.',
        data: {
          hotelId,
          userId,
          plan: dbPlan,
          status: 'active',
          hotelName,
          username: cleanUsername,
          password: cleanPhone
        }
      });
    } catch (error) {
      console.error('❌ Basic registration error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  registerHotel: async (req, res) => {
    try {
      console.log("📝 Received hotel registration request");

      // const { hotelName, address, plan, admin, gstNumber, emailOTP } = req.body;
      const { hotelName, address, plan, admin, gstNumber } = req.body;

      // Validate required fields
      if (!hotelName || !address || !plan || !admin) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'All required fields are missing'
        });
      }

      // Validate admin fields
      if (!admin.username || !admin.password || !admin.name || !admin.email || !admin.phone) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'All admin fields are required'
        });
      }

      // For PRO plan, validate email OTP
      // if (plan === 'pro' && !emailOTP) {
      //   return res.status(400).json({
      //     success: false,
      //     error: 'EMAIL_OTP_REQUIRED',
      //     message: 'Email OTP is required for PRO plan registration'
      //   });
      // }

      // Check if hotel already exists
      const existingHotel = await Hotel.findByName(hotelName);
      if (existingHotel) {
        return res.status(400).json({
          success: false,
          error: 'HOTEL_EXISTS',
          message: 'Hotel already registered. Please choose a different name.'
        });
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(admin.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'USERNAME_EXISTS',
          message: 'Username already taken. Please choose a different username.'
        });
      }

      // For PRO plan, verify email OTP

      // if (plan === 'pro') {
      //   console.log("🔐 [REGISTRATION] Verifying OTP for:", admin.email);
      //   console.log("🔐 [REGISTRATION] OTP provided:", emailOTP);

      //   const isOTPValid = await User.verifyEmailOTP(admin.email, emailOTP);

      //   if (!isOTPValid) {
      //     return res.status(400).json({
      //       success: false,
      //       error: 'INVALID_OTP',
      //       message: 'Invalid or expired email OTP'
      //     });
      //   }

      //   // ✅ OTP verified successfully - NOW delete it
      //   console.log("✅ OTP verified, deleting from database");
      //   try {
      //     await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [admin.email]);
      //     console.log("✅ OTP deleted successfully");
      //   } catch (deleteError) {
      //     console.warn("⚠️ Could not delete OTP:", deleteError.message);
      //   }
      // }

      // In registerHotel method, around line 50-70
      // if (plan === 'pro') {
      //   console.log("🔐 [REGISTRATION] Verifying OTP for:", admin.email);
      //   console.log("🔐 [REGISTRATION] OTP provided:", emailOTP);

      //   const isOTPValid = await User.verifyEmailOTP(admin.email, emailOTP);

      //   if (!isOTPValid) {
      //     return res.status(400).json({
      //       success: false,
      //       error: 'INVALID_OTP',
      //       message: 'Invalid or expired email OTP'
      //     });
      //   }

      //   // ✅ OTP verified successfully - NOW delete it
      //   console.log("✅ OTP verified, deleting from database");
      //   try {
      //     await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [admin.email]);
      //     console.log("✅ OTP deleted successfully");
      //   } catch (deleteError) {
      //     console.warn("⚠️ Could not delete OTP:", deleteError.message);
      //   }
      // }

      console.log("✅ All validations passed, creating hotel...");

      // DB enum is base | pro | pro_plus — map "free" from frontend to "base"
      const dbPlan = normalizeHotelPlan(plan);

      // Calculate trial expiry date for PRO plan; Basic (base) is active immediately
      let trialExpiryDate = null;
      let userStatus = admin.status || 'active';

      if (dbPlan === 'pro') {
        trialExpiryDate = new Date();
        trialExpiryDate.setDate(trialExpiryDate.getDate() + 30); // 30 days trial
        userStatus = 'pending'; // PRO users start as pending
      } else if (isBasicHotelPlan(dbPlan)) {
        userStatus = 'active';
      }

      // Create hotel in database
      const hotelId = await Hotel.create({
        name: hotelName,
        address: address,
        plan: dbPlan,
        gst_number: gstNumber || null,
        trial_expiry_date: trialExpiryDate
      });

      console.log("✅ Hotel created with ID:", hotelId);

      // Create admin user
      const userId = await User.create({
        username: admin.username,
        password: admin.password,
        role: 'admin',
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        hotel_id: hotelId,
        status: userStatus,
        trial_expiry_date: trialExpiryDate,
        hotel_plan: dbPlan,
      });

      console.log("✅ Admin user created with ID:", userId, "Status:", userStatus);

      // Send welcome email
      try {
        await EmailService.sendWelcomeEmail({
          hotelName: hotelName,
          plan: dbPlan,
          adminName: admin.name,
          adminEmail: admin.email,
          trialDays: dbPlan === 'pro' ? 30 : null,
          trialExpiryDate: trialExpiryDate
        });
      } catch (emailError) {
        console.warn("⚠️ Welcome email failed to send:", emailError.message);
      }

      res.status(201).json({
        success: true,
        message: dbPlan === 'pro'
          ? `Hotel registered successfully with PRO plan (30-day trial)`
          : `Hotel registered successfully with BASIC (base) plan`,
        data: {
          hotelId: hotelId,
          userId: userId,
          plan: dbPlan,
          status: userStatus,
          trialExpiryDate: trialExpiryDate
        }
      });

    } catch (error) {
      console.error('❌ Hotel registration error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },


  // In hotelController.js - Add this new method

  // Send OTP via both Email AND WhatsApp for PRO plan
  // sendProPlanOTPWithWhatsApp: async (req, res) => {
  //   try {
  //     const { email, hotelName, adminName, phone } = req.body;

  //     console.log("📧📱 [SEND PRO OTP WITH WHATSAPP] Request received:", {
  //       email,
  //       hotelName,
  //       adminName,
  //       phone
  //     });

  //     if (!email || !hotelName || !adminName) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'MISSING_FIELDS',
  //         message: 'Email, hotel name, and admin name are required'
  //       });
  //     }

  //     // Generate 6-digit OTP
  //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //     console.log("🔐 [SEND PRO OTP] Generated OTP:", otp);

  //     // Set expiry to 15 minutes
  //     // const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
  //     const otpExpiry = new Date();
  //     otpExpiry.setMinutes(otpExpiry.getMinutes() + 30);

  //     console.log("🔐 [SEND PRO OTP] Expiry time (after +30 min):");
  //     console.log("   - Local (Indian):", otpExpiry.toString());
  //     console.log("   - UTC:", otpExpiry.toISOString());
  //     console.log("   - Timestamp:", otpExpiry.getTime());

  //     const localHours = otpExpiry.getHours(); // Gets hours in local time
  //     const utcHours = otpExpiry.getUTCHours(); // Gets hours in UTC

  //     console.log(`🔐 [SEND PRO OTP] Time verification:`);
  //     console.log(`   - Local hours: ${localHours}:${otpExpiry.getMinutes()}`);
  //     console.log(`   - UTC hours: ${utcHours}:${otpExpiry.getUTCMinutes()}`);
  //     console.log(`   - Difference: ${localHours - utcHours} hours (should be 5.5)`);



  //     // Save OTP to database
  //     const saved = await User.saveEmailOTP(email, otp, otpExpiry);
  //     if (!saved) {
  //       throw new Error("Failed to save OTP to database");
  //     }

  //     // TRACK SENDING STATUS
  //     const deliveryStatus = {
  //       email: { sent: false, error: null },
  //       whatsapp: { sent: false, error: null }
  //     };

  //     // 1. SEND EMAIL OTP (Existing method)
  //     try {
  //       await EmailService.sendProPlanOTPEmail(email, otp, hotelName, adminName);
  //       console.log("📧 [SEND PRO OTP] Email sent successfully");
  //       deliveryStatus.email.sent = true;
  //     } catch (emailError) {
  //       console.error("📧 [SEND PRO OTP] Email sending failed:", emailError.message);
  //       deliveryStatus.email.error = emailError.message;
  //     }

  //     // 2. SEND WHATSAPP OTP - REUSE hotel_update_notification template
  //     if (phone) {
  //       try {
  //         console.log("📱 [SEND PRO OTP] Attempting WhatsApp OTP to:", phone);

  //         // REUSE the existing sendHotelUpdateNotification method
  //         // We pass OTP as the "requestId" parameter
  //         const whatsappResult = await WhatsAppService.sendHotelUpdateNotification(
  //           adminName,  // Customer Name = Admin Name
  //           `OTP: ${otp}`, // Request ID = OTP (clever reuse!)
  //           phone        // Customer Phone
  //         );

  //         if (whatsappResult.success) {
  //           console.log("📱 [SEND PRO OTP] WhatsApp OTP sent successfully");
  //           deliveryStatus.whatsapp.sent = true;
  //         } else {
  //           console.log("📱 [SEND PRO OTP] WhatsApp failed:", whatsappResult.error);
  //           deliveryStatus.whatsapp.error = whatsappResult.error;
  //         }
  //       } catch (whatsappError) {
  //         console.error("📱 [SEND PRO OTP] WhatsApp error:", whatsappError.message);
  //         deliveryStatus.whatsapp.error = whatsappError.message;
  //       }
  //     } else {
  //       console.log("📱 [SEND PRO OTP] No phone number provided, skipping WhatsApp");
  //       deliveryStatus.whatsapp.error = "No phone number provided";
  //     }

  //     // ALWAYS return success if at least ONE channel worked
  //     const atLeastOneSent = deliveryStatus.email.sent || deliveryStatus.whatsapp.sent;

  //     if (!atLeastOneSent) {
  //       throw new Error("Failed to send OTP via any channel");
  //     }

  //     // Build response message
  //     let message = 'OTP sent successfully';
  //     const channels = [];
  //     if (deliveryStatus.email.sent) channels.push('📧 Email');
  //     if (deliveryStatus.whatsapp.sent) channels.push('📱 WhatsApp');

  //     if (channels.length > 0) {
  //       message = `OTP sent via ${channels.join(' & ')}`;
  //     }

  //     res.json({
  //       success: true,
  //       message: message,
  //       data: {
  //         email: email,
  //         phone: phone,
  //         expiry: otpExpiry.toISOString(),
  //         // otp: otp, // For testing only - remove in production
  //         ...(process.env.NODE_ENV === 'development' && { otp }),
  //         delivery: deliveryStatus
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ [SEND PRO OTP WITH WHATSAPP] Error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Failed to send OTP: ' + error.message
  //     });
  //   }
  // },

  // sendProPlanOTPWithWhatsApp: async (req, res) => {
  //   try {
  //     const { email, hotelName, adminName, phone } = req.body;

  //     console.log("📧📱 [SEND PRO OTP WITH WHATSAPP] Request received:", {
  //       email,
  //       hotelName,
  //       adminName,
  //       phone
  //     });

  //     if (!email || !hotelName || !adminName) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'MISSING_FIELDS',
  //         message: 'Email, hotel name, and admin name are required'
  //       });
  //     }

  //     // Generate 6-digit OTP
  //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //     console.log("🔐 [SEND PRO OTP] Generated OTP:", otp);

  //     // ✅ FIXED: Set expiry to 30 minutes from now
  //     const otpExpiry = new Date();
  //     otpExpiry.setMinutes(otpExpiry.getMinutes() + 30);

  //     console.log("🔐 [SEND PRO OTP] Expiry time (local):", otpExpiry.toString());
  //     console.log("🔐 [SEND PRO OTP] Expiry time (ISO):", otpExpiry.toISOString());

  //     // Save OTP to database
  //     const saved = await User.saveEmailOTP(email, otp, otpExpiry);
  //     if (!saved) {
  //       throw new Error("Failed to save OTP to database");
  //     }

  //     // TRACK SENDING STATUS
  //     const deliveryStatus = {
  //       email: { sent: false, error: null },
  //       whatsapp: { sent: false, error: null }
  //     };

  //     // 1. SEND EMAIL OTP
  //     try {
  //       await EmailService.sendProPlanOTPEmail(email, otp, hotelName, adminName);
  //       console.log("📧 [SEND PRO OTP] Email sent successfully");
  //       deliveryStatus.email.sent = true;
  //     } catch (emailError) {
  //       console.error("📧 [SEND PRO OTP] Email sending failed:", emailError.message);
  //       deliveryStatus.email.error = emailError.message;
  //     }

  //     // 2. SEND WHATSAPP OTP
  //     if (phone) {
  //       try {
  //         console.log("📱 [SEND PRO OTP] Attempting WhatsApp OTP to:", phone);

  //         const whatsappResult = await WhatsAppService.sendHotelUpdateNotification(
  //           adminName,
  //           `OTP: ${otp}`,
  //           phone
  //         );

  //         if (whatsappResult.success) {
  //           console.log("📱 [SEND PRO OTP] WhatsApp OTP sent successfully");
  //           deliveryStatus.whatsapp.sent = true;
  //         } else {
  //           console.log("📱 [SEND PRO OTP] WhatsApp failed:", whatsappResult.error);
  //           deliveryStatus.whatsapp.error = whatsappResult.error;
  //         }
  //       } catch (whatsappError) {
  //         console.error("📱 [SEND PRO OTP] WhatsApp error:", whatsappError.message);
  //         deliveryStatus.whatsapp.error = whatsappError.message;
  //       }
  //     } else {
  //       console.log("📱 [SEND PRO OTP] No phone number provided, skipping WhatsApp");
  //       deliveryStatus.whatsapp.error = "No phone number provided";
  //     }

  //     // ALWAYS return success if at least ONE channel worked
  //     const atLeastOneSent = deliveryStatus.email.sent || deliveryStatus.whatsapp.sent;

  //     if (!atLeastOneSent) {
  //       throw new Error("Failed to send OTP via any channel");
  //     }

  //     // Build response message
  //     let message = 'OTP sent successfully';
  //     const channels = [];
  //     if (deliveryStatus.email.sent) channels.push('📧 Email');
  //     if (deliveryStatus.whatsapp.sent) channels.push('📱 WhatsApp');

  //     if (channels.length > 0) {
  //       message = `OTP sent via ${channels.join(' & ')}`;
  //     }

  //     res.json({
  //       success: true,
  //       message: message,
  //       data: {
  //         email: email,
  //         phone: phone,
  //         expiry: otpExpiry.toISOString(),
  //         ...(process.env.NODE_ENV === 'development' && { otp }),
  //         delivery: deliveryStatus
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ [SEND PRO OTP WITH WHATSAPP] Error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Failed to send OTP: ' + error.message
  //     });
  //   }
  // },

  sendProPlanOTPWithWhatsApp: async (req, res) => {
    try {
      const { email, hotelName, adminName, phone } = req.body;

      console.log("📧📱 [SEND PRO OTP WITH WHATSAPP] Request received:", {
        email,
        hotelName,
        adminName,
        phone
      });

      if (!email || !hotelName || !adminName) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Email, hotel name, and admin name are required'
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("🔐 [SEND PRO OTP] Generated OTP:", otp);

      // ✅ FIXED: Set expiry to 24 HOURS from now
      const otpExpiry = new Date();
      otpExpiry.setHours(otpExpiry.getHours() + 24); // Add 24 hours

      console.log("🔐 [SEND PRO OTP] Expiry time (24 hours later):", otpExpiry.toString());
      console.log("🔐 [SEND PRO OTP] Expiry time (ISO):", otpExpiry.toISOString());

      // Save OTP to database
      const saved = await User.saveEmailOTP(email, otp, otpExpiry);
      if (!saved) {
        throw new Error("Failed to save OTP to database");
      }

      // TRACK SENDING STATUS
      const deliveryStatus = {
        email: { sent: false, error: null },
        whatsapp: { sent: false, error: null }
      };

      // 1. SEND EMAIL OTP
      try {
        await EmailService.sendProPlanOTPEmail(email, otp, hotelName, adminName);
        console.log("📧 [SEND PRO OTP] Email sent successfully");
        deliveryStatus.email.sent = true;
      } catch (emailError) {
        console.error("📧 [SEND PRO OTP] Email sending failed:", emailError.message);
        deliveryStatus.email.error = emailError.message;
      }

      // 2. SEND WHATSAPP OTP
      if (phone) {
        try {
          console.log("📱 [SEND PRO OTP] Attempting WhatsApp OTP to:", phone);

          const whatsappResult = await WhatsAppService.sendHotelUpdateNotification(
            adminName,
            `OTP: ${otp}`,
            phone
          );

          if (whatsappResult.success) {
            console.log("📱 [SEND PRO OTP] WhatsApp OTP sent successfully");
            deliveryStatus.whatsapp.sent = true;
          } else {
            console.log("📱 [SEND PRO OTP] WhatsApp failed:", whatsappResult.error);
            deliveryStatus.whatsapp.error = whatsappResult.error;
          }
        } catch (whatsappError) {
          console.error("📱 [SEND PRO OTP] WhatsApp error:", whatsappError.message);
          deliveryStatus.whatsapp.error = whatsappError.message;
        }
      } else {
        console.log("📱 [SEND PRO OTP] No phone number provided, skipping WhatsApp");
        deliveryStatus.whatsapp.error = "No phone number provided";
      }

      // ALWAYS return success if at least ONE channel worked
      const atLeastOneSent = deliveryStatus.email.sent || deliveryStatus.whatsapp.sent;

      if (!atLeastOneSent) {
        throw new Error("Failed to send OTP via any channel");
      }

      // Build response message
      let message = 'OTP sent successfully (valid for 24 hours)';
      const channels = [];
      if (deliveryStatus.email.sent) channels.push('📧 Email');
      if (deliveryStatus.whatsapp.sent) channels.push('📱 WhatsApp');

      if (channels.length > 0) {
        message = `OTP sent via ${channels.join(' & ')} (valid for 24 hours)`;
      }

      res.json({
        success: true,
        message: message,
        data: {
          email: email,
          phone: phone,
          expiry: otpExpiry.toISOString(),
          expiresIn: '24 hours',
          ...(process.env.NODE_ENV === 'development' && { otp }),
          delivery: deliveryStatus
        }
      });

    } catch (error) {
      console.error('❌ [SEND PRO OTP WITH WHATSAPP] Error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to send OTP: ' + error.message
      });
    }
  },

  // Send email OTP for PRO plan registration
  // sendProPlanOTP: async (req, res) => {
  //   try {
  //     const { email, hotelName, adminName } = req.body;

  //     console.log("📧 [SEND PRO OTP] Request received for email:", email);

  //     if (!email || !hotelName || !adminName) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'MISSING_FIELDS',
  //         message: 'Email, hotel name, and admin name are required'
  //       });
  //     }

  //     // Generate 6-digit OTP
  //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //     console.log("📧 [SEND PRO OTP] Generated OTP:", otp);

  //     // Set expiry to 15 minutes from now (more buffer)
  //     const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
  //     console.log("📧 [SEND PRO OTP] OTP expiry (JS time):", otpExpiry);
  //     console.log("📧 [SEND PRO OTP] Current time:", new Date());

  //     // Save OTP to database
  //     const saved = await User.saveEmailOTP(email, otp, otpExpiry);

  //     if (!saved) {
  //       throw new Error("Failed to save OTP to database");
  //     }

  //     console.log("📧 [SEND PRO OTP] OTP saved to database successfully");

  //     // Send OTP email
  //     try {
  //       await EmailService.sendProPlanOTPEmail(email, otp, hotelName, adminName);
  //       console.log("📧 [SEND PRO OTP] Email sent successfully");
  //     } catch (emailError) {
  //       console.error("📧 [SEND PRO OTP] Email sending failed:", emailError.message);
  //       // Don't fail registration if email fails
  //     }

  //     res.json({
  //       success: true,
  //       message: 'OTP sent to email successfully',
  //       data: {
  //         email: email,
  //         expiry: otpExpiry.toISOString(),
  //         otp: otp // For testing only - remove in production
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ [SEND PRO OTP] Error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Failed to send OTP: ' + error.message
  //     });
  //   }
  // },

  sendProPlanOTP: async (req, res) => {
    try {
      const { email, hotelName, adminName } = req.body;

      console.log("📧 [SEND PRO OTP] Request received for email:", email);

      if (!email || !hotelName || !adminName) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Email, hotel name, and admin name are required'
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("📧 [SEND PRO OTP] Generated OTP:", otp);

      // ✅ FIXED: Set expiry to 24 HOURS from now
      const otpExpiry = new Date();
      otpExpiry.setHours(otpExpiry.getHours() + 24); // Add 24 hours

      console.log("📧 [SEND PRO OTP] OTP expiry (24 hours later):", otpExpiry);
      console.log("📧 [SEND PRO OTP] Current time:", new Date());

      // Save OTP to database
      const saved = await User.saveEmailOTP(email, otp, otpExpiry);

      if (!saved) {
        throw new Error("Failed to save OTP to database");
      }

      console.log("📧 [SEND PRO OTP] OTP saved to database successfully");

      // Send OTP email
      try {
        await EmailService.sendProPlanOTPEmail(email, otp, hotelName, adminName);
        console.log("📧 [SEND PRO OTP] Email sent successfully");
      } catch (emailError) {
        console.error("📧 [SEND PRO OTP] Email sending failed:", emailError.message);
        // Don't fail registration if email fails
      }

      res.json({
        success: true,
        message: 'OTP sent to email successfully (valid for 24 hours)',
        data: {
          email: email,
          expiry: otpExpiry.toISOString(),
          expiresIn: '24 hours',
          otp: otp // For testing only - remove in production
        }
      });

    } catch (error) {
      console.error('❌ [SEND PRO OTP] Error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to send OTP: ' + error.message
      });
    }
  },

  // Verify email OTP
  verifyEmailOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Email and OTP are required'
        });
      }

      const isValid = await User.verifyEmailOTP(email, otp);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_OTP',
          message: 'Invalid or expired OTP'
        });
      }

      res.json({
        success: true,
        message: 'OTP verified successfully'
      });

    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to verify OTP'
      });
    }
  },

  getHotel: async (req, res) => {
    try {
      const { id } = req.params;
      const hotel = await Hotel.findById(id);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      res.json({
        success: true,
        data: hotel
      });

    } catch (error) {
      console.error('Get hotel error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get hotel statistics
  getHotelStats: async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await Hotel.getStats(id);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get hotel stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update hotel
  updateHotel: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, plan, gstNumber } = req.body;

      const updated = await Hotel.update(id, { name, address, plan, gst_number: gstNumber || null });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      res.json({
        success: true,
        message: 'Hotel updated successfully'
      });

    } catch (error) {
      console.error('Update hotel error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get all hotels (for super admin)
  // In your hotelController.js
  getAllHotels: async (req, res) => {
    try {
      const hotels = await Hotel.getAll();
      res.json({
        success: true,
        data: hotels
      });
    } catch (error) {
      console.error('Get all hotels error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },






  getHotelSettings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      console.log('🔍 Getting hotel settings for hotel ID:', hotelId);

      // Get hotel settings (including QR code)
      const hotel = await Hotel.getSettings(hotelId);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      // Get current user info for email and phone
      const currentUser = req.user;

      res.json({
        success: true,
        data: {
          name: hotel.name,
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: hotel.address,
          gstNumber: hotel.gst_number || '',
          gstPercentage: hotel.gst_percentage || 12.00,
          cgstPercentage: hotel.cgst_percentage || 6.00,      // ADD THIS
          sgstPercentage: hotel.sgst_percentage || 6.00,      // ADD THIS
          igstPercentage: hotel.igst_percentage || 12.00,     // ADD THIS
          serviceChargePercentage: hotel.service_charge_percentage || 10.00,
          plan: hotel.plan || 'base',
          hotelcode: hotel.hotelcode || '',
          qrcode_image: hotel.qrcode_image || null // Add QR code
        }
      });

    } catch (error) {
      console.error('❌ Get hotel settings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },



  updateHotelSettings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const {
        name,
        email,
        phone,
        address,
        gstNumber,
        gstPercentage,
        cgstPercentage,        // ADD THIS
        sgstPercentage,        // ADD THIS
        igstPercentage,        // ADD THIS
        serviceChargePercentage,
        hotelcode,
        qrcode_image // Add QR code field
      } = req.body;

      console.log('📝 Update hotel settings request:', {
        hotelId,
        name,
        email,
        phone,
        address,
        gstNumber,
        cgstPercentage,        // ADD THIS
        sgstPercentage,        // ADD THIS
        igstPercentage,
        gstPercentage,
        serviceChargePercentage,
        hasQRCode: !!qrcode_image
      });

      // Validate required fields
      if (!name || !email || !phone || !address) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'All fields are required'
        });
      }

      // Update hotel information
      const updated = await Hotel.updateSettings(hotelId, {
        name,
        address,
        plan: 'pro',
        gst_number: gstNumber || null,
        gst_percentage: gstPercentage !== undefined ? parseFloat(gstPercentage) : undefined,
        cgst_percentage: cgstPercentage !== undefined ? parseFloat(cgstPercentage) : undefined,        // ADD THIS
        sgst_percentage: sgstPercentage !== undefined ? parseFloat(sgstPercentage) : undefined,        // ADD THIS
        igst_percentage: igstPercentage !== undefined ? parseFloat(igstPercentage) : undefined,        // ADD THIS
        service_charge_percentage: serviceChargePercentage !== undefined ?
          parseFloat(serviceChargePercentage) : undefined,
        hotelcode: hotelcode !== undefined ? hotelcode : undefined,
        qrcode_image: qrcode_image || null
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      // Update user information
      const userUpdated = await User.update(req.user.id, hotelId, {
        email,
        phone,
        name: name
      });

      res.json({
        success: true,
        message: 'Hotel settings updated successfully',
        data: {
          name,
          email,
          phone,
          address,
          gstNumber: gstNumber || '',
          gstPercentage: gstPercentage !== undefined ? parseFloat(gstPercentage) : undefined,
          cgstPercentage: cgstPercentage !== undefined ? parseFloat(cgstPercentage) : undefined,      // ADD THIS
          sgstPercentage: sgstPercentage !== undefined ? parseFloat(sgstPercentage) : undefined,      // ADD THIS
          igstPercentage: igstPercentage !== undefined ? parseFloat(igstPercentage) : undefined,      // ADD THIS
          serviceChargePercentage: serviceChargePercentage !== undefined ?
            parseFloat(serviceChargePercentage) : undefined,
          hotelcode: hotelcode !== undefined ? String(hotelcode).trim() : '',
          qrcode_image: qrcode_image || null
        }
      });
    } catch (error) {
      console.error('❌ Update hotel settings error:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_HOTEL_CODE',
          message: 'This AIOSELL hotel code is already assigned to another hotel',
        });
      }

      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update only tax settings
  // Replace your existing updateTaxSettings method with this:
  // updateTaxSettings: async (req, res) => {
  //   try {
  //     const hotelId = req.user.hotel_id;
  //     const {
  //       gstPercentage,
  //       cgstPercentage,
  //       sgstPercentage,
  //       igstPercentage,
  //       serviceChargePercentage
  //     } = req.body;

  //     console.log('💰 Update tax settings:', {
  //       hotelId,
  //       gstPercentage,
  //       cgstPercentage,
  //       sgstPercentage,
  //       igstPercentage,
  //       serviceChargePercentage
  //     });

  //     // Validate percentages
  //     if (gstPercentage !== undefined && (gstPercentage < 0 || gstPercentage > 100)) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'INVALID_GST',
  //         message: 'GST percentage must be between 0 and 100'
  //       });
  //     }

  //     if (cgstPercentage !== undefined && (cgstPercentage < 0 || cgstPercentage > 100)) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'INVALID_CGST',
  //         message: 'CGST percentage must be between 0 and 100'
  //       });
  //     }

  //     if (sgstPercentage !== undefined && (sgstPercentage < 0 || sgstPercentage > 100)) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'INVALID_SGST',
  //         message: 'SGST percentage must be between 0 and 100'
  //       });
  //     }

  //     if (igstPercentage !== undefined && (igstPercentage < 0 || igstPercentage > 100)) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'INVALID_IGST',
  //         message: 'IGST percentage must be between 0 and 100'
  //       });
  //     }

  //     if (serviceChargePercentage !== undefined && (serviceChargePercentage < 0 || serviceChargePercentage > 100)) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'INVALID_SERVICE_CHARGE',
  //         message: 'Service charge percentage must be between 0 and 100'
  //       });
  //     }

  //     // Update tax settings for all rooms
  //     const updated = await Hotel.updateTaxSettings(
  //       hotelId,
  //       gstPercentage !== undefined ? parseFloat(gstPercentage) : undefined,
  //       cgstPercentage !== undefined ? parseFloat(cgstPercentage) : undefined,
  //       sgstPercentage !== undefined ? parseFloat(sgstPercentage) : undefined,
  //       igstPercentage !== undefined ? parseFloat(igstPercentage) : undefined,
  //       serviceChargePercentage !== undefined ? parseFloat(serviceChargePercentage) : undefined
  //     );

  //     if (!updated) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'HOTEL_NOT_FOUND',
  //         message: 'Hotel not found or no rooms to update'
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       message: 'Tax settings updated successfully for all rooms',
  //       data: {
  //         gstPercentage: gstPercentage !== undefined ? parseFloat(gstPercentage) : undefined,
  //         cgstPercentage: cgstPercentage !== undefined ? parseFloat(cgstPercentage) : undefined,
  //         sgstPercentage: sgstPercentage !== undefined ? parseFloat(sgstPercentage) : undefined,
  //         igstPercentage: igstPercentage !== undefined ? parseFloat(igstPercentage) : undefined,
  //         serviceChargePercentage: serviceChargePercentage !== undefined ?
  //           parseFloat(serviceChargePercentage) : undefined
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ Update tax settings error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Internal server error'
  //     });
  //   }
  // },

  // // Get only tax settings

  // getTaxSettings: async (req, res) => {
  //   try {
  //     const hotelId = req.user.hotel_id;
  //     const taxSettings = await Hotel.getTaxSettings(hotelId);

  //     res.json({
  //       success: true,
  //       data: {
  //         gstPercentage: taxSettings.gst_percentage,
  //         cgstPercentage: taxSettings.cgst_percentage,
  //         sgstPercentage: taxSettings.sgst_percentage,
  //         igstPercentage: taxSettings.igst_percentage,
  //         serviceChargePercentage: taxSettings.service_charge_percentage
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ Get tax settings error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Internal server error'
  //     });
  //   }
  // },

  // Get tax settings (updated to support slabs)
  getTaxSettings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const taxSettings = await Hotel.getTaxSettings(hotelId);

      res.json({
        success: true,
        data: {
          gstType: taxSettings.gstType,
          gstSlabs: taxSettings.gstSlabs,
          gstPercentage: taxSettings.gst_percentage,
          cgstPercentage: taxSettings.cgst_percentage,
          sgstPercentage: taxSettings.sgst_percentage,
          igstPercentage: taxSettings.igst_percentage,
          serviceChargePercentage: taxSettings.service_charge_percentage
        }
      });
    } catch (error) {
      console.error('❌ Get tax settings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Update tax settings (supports both flat and slab)
  updateTaxSettings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const {
        gstType,           // 'flat' or 'slab'
        flatGst,          // { gstPercentage, cgstPercentage, sgstPercentage, igstPercentage }
        gstSlabs,         // Array of slabs
        serviceChargePercentage
      } = req.body;

      console.log('💰 Update tax settings:', { hotelId, gstType, hasFlatGst: !!flatGst, slabCount: gstSlabs?.length });

      // Validate based on type
      if (gstType === 'flat') {
        if (!flatGst) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_FLAT_GST',
            message: 'Flat GST settings are required'
          });
        }

        // Validate percentages
        if (flatGst.gstPercentage < 0 || flatGst.gstPercentage > 100) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_GST',
            message: 'GST percentage must be between 0 and 100'
          });
        }

        // Update with flat GST
        const updated = await Hotel.updateTaxSettings(
          hotelId,
          flatGst.gstPercentage,
          flatGst.cgstPercentage,
          flatGst.sgstPercentage,
          flatGst.igstPercentage,
          serviceChargePercentage,
          'flat',
          null
        );

        if (!updated) {
          return res.status(404).json({
            success: false,
            error: 'UPDATE_FAILED',
            message: 'Failed to update tax settings'
          });
        }

        res.json({
          success: true,
          message: 'Flat GST settings updated successfully for all rooms',
          data: {
            gstType: 'flat',
            flatGst,
            serviceChargePercentage
          }
        });

      } else if (gstType === 'slab') {
        if (!gstSlabs || gstSlabs.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_SLABS',
            message: 'GST slabs are required'
          });
        }

        // Validate slabs
        for (let i = 0; i < gstSlabs.length; i++) {
          const slab = gstSlabs[i];
          if (slab.gstPercentage < 0 || slab.gstPercentage > 100) {
            return res.status(400).json({
              success: false,
              error: 'INVALID_SLAB_GST',
              message: `GST percentage in slab ${i + 1} must be between 0 and 100`
            });
          }

          // Ensure CGST + SGST = GST
          const cgstPlusSgst = slab.cgstPercentage + slab.sgstPercentage;
          if (Math.abs(cgstPlusSgst - slab.gstPercentage) > 0.01) {
            return res.status(400).json({
              success: false,
              error: 'TAX_MISMATCH',
              message: `In slab ${i + 1}: CGST (${slab.cgstPercentage}%) + SGST (${slab.sgstPercentage}%) = ${cgstPlusSgst}% should equal GST ${slab.gstPercentage}%`
            });
          }
        }

        // Update with slab-wise GST
        const updated = await Hotel.updateTaxSettings(
          hotelId,
          null, null, null, null,
          serviceChargePercentage,
          'slab',
          gstSlabs
        );

        if (!updated) {
          return res.status(404).json({
            success: false,
            error: 'UPDATE_FAILED',
            message: 'Failed to update tax settings'
          });
        }

        res.json({
          success: true,
          message: 'Slab-wise GST settings updated successfully',
          data: {
            gstType: 'slab',
            gstSlabs,
            serviceChargePercentage
          }
        });

      } else {
        return res.status(400).json({
          success: false,
          error: 'INVALID_GST_TYPE',
          message: 'GST type must be either "flat" or "slab"'
        });
      }

    } catch (error) {
      console.error('❌ Update tax settings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },
  // Test endpoint
  testEndpoint: async (req, res) => {
    try {
      console.log("✅ Test endpoint called by user:", req.user);
      res.json({
        success: true,
        message: "API is working",
        timestamp: new Date().toISOString(),
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          hotel_id: req.user.hotel_id
        }
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  uploadQRCode: async (req, res) => {
    try {
      const { id } = req.params;
      const { qrcode_image, file_name } = req.body;

      console.log('📷 Uploading QR code for hotel:', id, 'File name:', file_name);

      if (!qrcode_image) {
        return res.status(400).json({
          success: false,
          error: 'QR_CODE_REQUIRED',
          message: 'QR code image is required'
        });
      }

      // Validate Base64 format
      const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
      if (!base64Regex.test(qrcode_image)) {
        // Try to fix common issues
        let fixedImage = qrcode_image;

        // If missing data URL prefix, add it
        if (!fixedImage.startsWith('data:image/')) {
          fixedImage = `data:image/png;base64,${fixedImage}`;
        }

        // Validate again
        if (!base64Regex.test(fixedImage)) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_IMAGE_FORMAT',
            message: 'QR code must be a valid Base64 image (PNG, JPG, WebP)'
          });
        }
      }

      // Clean and validate Base64
      const base64Data = qrcode_image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Basic validation - check if it's a valid image
      if (buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_IMAGE',
          message: 'QR code image data is empty'
        });
      }

      // Optional: Limit image size (2MB)
      if (buffer.length > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'IMAGE_TOO_LARGE',
          message: 'QR code image must be less than 2MB'
        });
      }

      // Update hotel with QR code
      const updated = await Hotel.updateQRCode(id, qrcode_image);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      // Return the exact same Base64 string that was stored
      res.json({
        success: true,
        message: 'QR code uploaded successfully',
        data: {
          qrcode_image: qrcode_image,
          file_name: file_name || 'qr_code.png',
          size_bytes: buffer.length
        }
      });

    } catch (error) {
      console.error('❌ Upload QR code error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Also add this method to remove QR code
  removeQRCode: async (req, res) => {
    try {
      const { id } = req.params;

      const updated = await Hotel.updateQRCode(id, null);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      res.json({
        success: true,
        message: 'QR code removed successfully'
      });

    } catch (error) {
      console.error('❌ Remove QR code error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },
  // Add this method to get QR code
  getQRCode: async (req, res) => {
    try {
      const { id } = req.params;

      const qrCode = await Hotel.getQRCode(id);

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          error: 'QR_CODE_NOT_FOUND',
          message: 'QR code not found for this hotel'
        });
      }

      res.json({
        success: true,
        data: {
          qrcode_image: qrCode
        }
      });

    } catch (error) {
      console.error('❌ Get QR code error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
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
  },
  uploadLogo: async (req, res) => {
    try {
      const { id } = req.params;
      const { logo_image, file_name } = req.body;

      console.log('🖼️ Uploading logo for hotel:', id, 'File name:', file_name);

      if (!logo_image) {
        return res.status(400).json({
          success: false,
          error: 'LOGO_REQUIRED',
          message: 'Logo image is required'
        });
      }

      // Validate Base64 format
      const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
      if (!base64Regex.test(logo_image)) {
        // Try to fix common issues
        let fixedImage = logo_image;

        // If missing data URL prefix, add it
        if (!fixedImage.startsWith('data:image/')) {
          fixedImage = `data:image/png;base64,${fixedImage}`;
        }

        // Validate again
        if (!base64Regex.test(fixedImage)) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_IMAGE_FORMAT',
            message: 'Logo must be a valid Base64 image (PNG, JPG, WebP)'
          });
        }
      }

      // Clean and validate Base64
      const base64Data = logo_image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Basic validation
      if (buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_IMAGE',
          message: 'Logo image data is empty'
        });
      }

      // Limit image size (1MB for logos)
      if (buffer.length > 1 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'IMAGE_TOO_LARGE',
          message: 'Logo image must be less than 1MB'
        });
      }

      // Update hotel with logo
      const updated = await Hotel.updateLogo(id, logo_image);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logo_image: logo_image,
          file_name: file_name || 'logo.png',
          size_bytes: buffer.length
        }
      });

    } catch (error) {
      console.error('❌ Upload logo error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get hotel logo
  getLogo: async (req, res) => {
    try {
      const { id } = req.params;

      const logo = await Hotel.getLogo(id);

      if (!logo) {
        return res.status(404).json({
          success: false,
          error: 'LOGO_NOT_FOUND',
          message: 'Logo not found for this hotel'
        });
      }

      res.json({
        success: true,
        data: {
          logo_image: logo
        }
      });

    } catch (error) {
      console.error('❌ Get logo error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Remove hotel logo
  removeLogo: async (req, res) => {
    try {
      const { id } = req.params;

      const updated = await Hotel.updateLogo(id, null);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      res.json({
        success: true,
        message: 'Logo removed successfully'
      });

    } catch (error) {
      console.error('❌ Remove logo error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Recalculate GST for all rooms
  recalculateAllRoomsGST: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { serviceChargePercentage } = req.body;

      const result = await Hotel.recalculateAllRoomsGST(hotelId, serviceChargePercentage);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'RECALCULATION_FAILED',
          message: result.message
        });
      }

      res.json({
        success: true,
        message: `GST recalculated for ${result.updatedCount} rooms`,
        data: { updatedCount: result.updatedCount }
      });
    } catch (error) {
      console.error('❌ Recalculate GST error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },
};

module.exports = hotelController;