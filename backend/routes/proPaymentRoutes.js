const express = require('express');
const router = express.Router();
const proPaymentController = require('../controllers/proPaymentController');
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required - called before registration)
router.post('/create-order', proPaymentController.createOrder);
router.post('/verify', proPaymentController.verifyPayment);

// Basic → Pro upgrade (authenticated)
router.post('/upgrade-order', authenticate, proPaymentController.createUpgradeOrder);
router.post('/verify-upgrade', authenticate, proPaymentController.verifyUpgrade);

// Protected routes (require authentication)
router.get('/:id', authenticate, proPaymentController.getPaymentById);
router.get('/hotel/:hotelId', authenticate, proPaymentController.getPaymentsByHotel);
router.get('/email/:email', authenticate, proPaymentController.getPaymentsByEmail);
router.get('/stats/summary', authenticate, proPaymentController.getStats);
router.get('/search/query', authenticate, proPaymentController.searchPayments);

// Add these new routes for reactivation
router.post('/reactivate', proPaymentController.reactivateOrder);
router.post('/verify-reactivation', proPaymentController.verifyReactivation);
module.exports = router;
