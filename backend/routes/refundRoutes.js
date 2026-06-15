// routes/refundRoutes.js
const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get cancellable bookings (with filters)
router.get('/cancellable-bookings', refundController.getCancellableBookings);

// Get cancellation details for a specific booking
router.get('/:id/cancellation-details', refundController.getCancellationDetails);

// Process cancellation and refund
router.post('/:id/cancel', refundController.processCancellation);

// Get refund history - THIS IS THE FIXED ROUTE
router.get('/refunds/history', refundController.getRefundHistory);

// Update refund status (admin only)
router.patch('/refunds/:refundId', authorize(['admin']), refundController.updateRefundStatus);

module.exports = router;