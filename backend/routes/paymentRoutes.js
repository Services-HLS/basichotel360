
// // const express = require('express');
// // const router = express.Router();
// // const paymentController = require('../controllers/paymentController');
// // const { authenticate } = require('../middleware/auth'); // Change this line

// // console.log('Payment Controller:', paymentController);
// // console.log('Type of generatePaymentQR:', typeof paymentController.generatePaymentQR);

// // // Payment routes - use authenticate instead of auth
// // router.post('/generate-qr', authenticate, paymentController.generatePaymentQR);
// // router.post('/verify', authenticate, paymentController.verifyPayment);
// // router.get('/status/:bookingId', authenticate, paymentController.getPaymentStatus);
// // router.get('/transactions', authenticate, paymentController.getTransactions);

// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const paymentController = require('../controllers/paymentController');
// const { authenticate } = require('../middleware/auth');

// // Payment routes
// router.post('/generate-qr', authenticate, paymentController.generatePaymentQR);
// router.post('/verify', authenticate, paymentController.verifyPayment);

// // **NEW: Test endpoints**
// router.post('/simulate-pay/:transaction_id', authenticate, paymentController.simulatePayment);
// router.get('/verify-dummy/:transaction_id', authenticate, paymentController.verifyDummyPayment);
// router.post('/test-webhook', authenticate, paymentController.testWebhook);
// router.post('/create-test', authenticate, paymentController.createTestTransaction);

// // Existing routes
// router.get('/status/:bookingId', authenticate, paymentController.getPaymentStatus);
// router.get('/transactions', authenticate, paymentController.getTransactions);

// module.exports = router;

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth'); 

// Existing routes (require authentication)
router.post('/generate-qr', authenticate, paymentController.generatePaymentQR);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.post('/simulate-pay/:transaction_id', authenticate, paymentController.simulatePayment);
router.get('/verify-dummy/:transaction_id', authenticate, paymentController.verifyDummyPayment);

// Razorpay routes for PRO plan registration (no authentication required - called before registration)
router.post('/create-order', paymentController.createOrder);
router.post('/verify-razorpay', paymentController.verifyRazorpayPayment);

module.exports = router;