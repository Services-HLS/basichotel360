

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth'); // Change this line
router.get('/:id/invoice-builder', bookingController.serveInvoiceBuilder);
router.get('/group/:groupId/invoice-builder', bookingController.serveGroupInvoiceBuilder);

// Apply auth middleware to all booking routes
router.use(authenticate); // Change this line

// Booking routes
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/date-range', bookingController.getBookingsByDateRange);
router.get('/today', bookingController.getTodaysActivities);
router.get('/payment-status/:status', bookingController.getBookingsByPaymentStatus);
router.get('/:id', bookingController.getBooking);
router.put('/:id', bookingController.updateBooking);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.patch('/:id/payment', bookingController.updateBookingPayment);
router.post('/check-availability', bookingController.checkRoomAvailability);
router.delete('/:id', bookingController.deleteBooking);

// Add these routes after all other routes
router.get('/:id/invoice',  bookingController.generateInvoice);
router.get('/:id/invoice/download',  bookingController.downloadInvoice);
router.get('/:id/invoice/pdf', bookingController.downloadInvoicePDF);
router.put('/:id/invoice-number',  bookingController.updateInvoiceNumber);

// Add these to your booking routes
router.post('/:id/send-checkout-reminder', bookingController.sendCheckoutReminder);
router.post('/:id/resend-confirmation', bookingController.resendConfirmation);
router.get('/upcoming-checkouts',  bookingController.getUpcomingCheckouts);
router.post('/past-booking', authenticate, bookingController.createPastBooking);
// Add these routes to your existing bookingRoutes.js

// Block and maintenance routes
router.post('/block-room', bookingController.blockRoom);
router.post('/maintenance', bookingController.maintenanceRequest);
router.get('/blocked-rooms', bookingController.getBlockedRooms);
router.get('/maintenance-rooms', bookingController.getMaintenanceRooms);

// router.get('/block/:id/pdf', bookingController.generateBlockRoomPDF);
// router.get('/maintenance/:id/pdf', bookingController.generateMaintenanceRoomPDF);
// router.get('/combined-report/pdf', bookingController.generateCombinedReport);
router.get('/block-maintenance-stats', bookingController.getBlockMaintenanceStats);
// Add this route
router.put('/:id/unblock', bookingController.unblockRoom);
router.get('/block/:id/pdf', bookingController.generateBlockRoomPDF);
router.get('/maintenance/:id/pdf', bookingController.generateMaintenanceRoomPDF);
router.get('/combined-report/pdf', bookingController.generateCombinedReport);

// In your routes file
router.post('/multiple',  bookingController.createMultipleBookings);
router.get('/group/:groupId', bookingController.getGroupBooking);




module.exports = router;