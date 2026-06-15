

const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { authenticate } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Hotel registration (public)
router.post('/register', hotelController.registerHotel);
router.post('/register-basic/send-otp', hotelController.sendBasicRegistrationOTP);
router.post('/register-basic/verify-otp', hotelController.verifyBasicRegistrationOTP);
router.post('/register-basic', hotelController.registerBasic);

router.post('/send-pro-otp-whatsapp', hotelController.sendProPlanOTPWithWhatsApp);
// PRO Plan Email OTP Routes (public - for registration)
router.post('/send-pro-otp', hotelController.sendProPlanOTP);
router.post('/verify-email-otp', hotelController.verifyEmailOTP);

// Get all hotels (public - for listing)
router.get('/', hotelController.getAllHotels);

// ============================================
// PROTECTED ROUTES (Require authentication)
// ============================================

// Apply authentication middleware to all protected routes
router.use(authenticate);

// Hotel settings
router.get('/settings', hotelController.getHotelSettings);
router.put('/settings', hotelController.updateHotelSettings);

// Tax settings
router.get('/tax-settings', hotelController.getTaxSettings);
router.put('/tax-settings', hotelController.updateTaxSettings);

router.post('/recalculate-gst', authenticate, hotelController.recalculateAllRoomsGST);

// QR Code management
router.put('/:id/qrcode', hotelController.uploadQRCode);
router.get('/:id/qrcode', hotelController.getQRCode);
router.delete('/:id/qrcode', hotelController.removeQRCode);

// Hotel management
router.get('/:id', hotelController.getHotel);
router.get('/:id/stats', hotelController.getHotelStats);
router.put('/:id', hotelController.updateHotel);

// Test endpoint
router.get('/test', hotelController.testEndpoint);

router.put('/:id/logo',  hotelController.uploadLogo);
router.get('/:id/logo', hotelController.getLogo);
router.delete('/:id/logo', authenticate, hotelController.removeLogo);

// routes/hotelRoutes.js - Add these routes
router.get('/referral/settings', authenticate, hotelController.getReferralSettings);
router.put('/referral/settings', authenticate, hotelController.updateReferralSettings);

module.exports = router;