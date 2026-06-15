

// const express = require('express');
// const router = express.Router();
// const functionRoomController = require('../controllers/functionRoomController');
// const { authenticate, authorize } = require('../middleware/auth');

// // All routes require authentication
// router.use(authenticate);

// // ===========================================
// // FUNCTION ROOM MANAGEMENT ROUTES
// // ===========================================

// // Get all function rooms
// router.get('/', functionRoomController.getFunctionRooms);

// // Get availability calendar
// router.get('/availability', functionRoomController.getAvailabilityCalendar);

// // Get function room statistics
// router.get('/stats', authorize(['admin', 'manager']), functionRoomController.getFunctionRoomStats);

// // Get single function room
// router.get('/:id', functionRoomController.getFunctionRoom);

// // Create function room (admin only)
// router.post('/', authorize(['admin']), functionRoomController.createFunctionRoom);

// // Create multiple function rooms (batch)
// router.post('/batch', authorize(['admin']), functionRoomController.createMultipleFunctionRooms);

// // Update function room (admin only)
// router.put('/:id', authorize(['admin']), functionRoomController.updateFunctionRoom);

// // Update function room status
// router.patch('/:id/status', authorize(['admin']), functionRoomController.updateFunctionRoomStatus);

// // Delete function room (admin only)
// router.delete('/:id', authorize(['admin']), functionRoomController.deleteFunctionRoom);

// // ===========================================
// // ⚠️⚠️⚠️ CRITICAL - ORDER IS IMPORTANT ⚠️⚠️⚠️
// // ===========================================
// // PUT SPECIFIC ROUTES BEFORE PARAMETERIZED ROUTES
// // ===========================================

// // ✅ 1. FIRST - SPECIFIC ROUTES (no :id parameter)
// // Check availability
// router.post('/check-availability', functionRoomController.checkFunctionRoomAvailability);

// // ✅ GET ALL bookings with rooms (MUST come before /:id routes)
// router.get('/bookings/with-rooms', functionRoomController.getAllFunctionBookingsWithRooms);

// // ✅ CREATE booking with rooms
// router.post('/bookings/with-rooms', functionRoomController.createFunctionBookingWithRooms);

// // ✅ GET ALL regular bookings
// router.get('/bookings', functionRoomController.getFunctionBookings);

// // ✅ CREATE regular booking
// router.post('/bookings', functionRoomController.createFunctionBooking);

// // ✅ 2. SECOND - PARAMETERIZED ROUTES (with :id parameter)
// // Get single booking with rooms
// router.get('/bookings/:id/with-rooms', functionRoomController.getFunctionBookingWithRooms);

// // Get single booking (regular)
// router.get('/bookings/:id', functionRoomController.getFunctionBooking);

// router.get(
//   '/bookings/:id/invoice/pdf',
//   functionRoomController.generateInvoicePDF
// );
// router.get(
//   '/bookings/:id/invoice/html',
//   functionRoomController.downloadFunctionInvoiceHTML
// );

// // Get invoice info
// router.get(
//   '/bookings/:id/invoice/info',
//   functionRoomController.getFunctionBookingInvoice
// );

// router.get(
//   '/bookings/:id/invoice/json',
//   functionRoomController.generateInvoiceJSON
// );
// // Update booking
// router.put('/bookings/:id', functionRoomController.updateFunctionBooking);

// // Update booking payment
// router.patch('/bookings/:id/payment', functionRoomController.updateFunctionBookingPayment);

// // Cancel booking
// router.post('/bookings/:id/cancel', functionRoomController.cancelFunctionBooking);

// router.delete('/bookings/:id', authenticate, authorize(['admin']), functionRoomController.deleteFunctionBooking);


// // ===========================================
// // BLOCK/MAINTENANCE ROUTES
// // ===========================================

// // Block function room for maintenance
// router.post('/block', authorize(['admin', 'manager']), functionRoomController.blockFunctionRoom);

// module.exports = router;

const express = require('express');
const router = express.Router();
const functionRoomController = require('../controllers/functionRoomController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// ===========================================
// FUNCTION ROOM MANAGEMENT ROUTES
// ===========================================

// Get all function rooms
router.get('/', functionRoomController.getFunctionRooms);

// Get availability calendar
router.get('/availability', functionRoomController.getAvailabilityCalendar);

// Get function room statistics
router.get('/stats', authorize(['admin', 'manager']), functionRoomController.getFunctionRoomStats);

// Get single function room
router.get('/:id', functionRoomController.getFunctionRoom);

// Create function room (admin only)
router.post('/', authorize(['admin']), functionRoomController.createFunctionRoom);

// Create multiple function rooms (batch)
router.post('/batch', authorize(['admin']), functionRoomController.createMultipleFunctionRooms);

// Update function room (admin only)
router.put('/:id', authorize(['admin']), functionRoomController.updateFunctionRoom);

// Update function room status
router.patch('/:id/status', authorize(['admin']), functionRoomController.updateFunctionRoomStatus);

// Delete function room (admin only)
router.delete('/:id', authorize(['admin']), functionRoomController.deleteFunctionRoom);

// ===========================================
// BOOKING ROUTES - ORDER IS IMPORTANT
// ===========================================

// ✅ 1. FIRST - SPECIFIC ROUTES (no :id parameter)
// Check availability (using the date range version)
router.post('/check-availability', functionRoomController.checkFunctionRoomAvailability);

// ✅ GET ALL bookings with rooms
router.get('/bookings/with-rooms', functionRoomController.getAllFunctionBookingsWithRooms);

// ✅ CREATE booking with rooms (this is the one we're using)
router.post('/bookings/with-rooms', functionRoomController.createFunctionBookingWithRooms);

// ✅ GET ALL regular bookings
router.get('/bookings', functionRoomController.getFunctionBookings);

// ✅ CREATE regular booking (if you still need this)
// Comment this out if you're only using the with-rooms version
// router.post('/bookings', functionRoomController.createFunctionBooking);

// ✅ 2. SECOND - PARAMETERIZED ROUTES (with :id parameter)
// Get single booking with rooms
router.get('/bookings/:id/with-rooms', functionRoomController.getFunctionBookingWithRooms);

// Get single booking (regular)
router.get('/bookings/:id', functionRoomController.getFunctionBooking);

// Invoice routes
router.get('/bookings/:id/invoice/pdf', functionRoomController.generateInvoicePDF);
router.get('/bookings/:id/invoice/html', functionRoomController.downloadFunctionInvoiceHTML);
router.get('/bookings/:id/invoice/info', functionRoomController.getFunctionBookingInvoice);
router.get('/bookings/:id/invoice/json', functionRoomController.generateInvoiceJSON);

// Update booking
router.put('/bookings/:id', functionRoomController.updateFunctionBooking);

// Update booking payment
router.patch('/bookings/:id/payment', functionRoomController.updateFunctionBookingPayment);

// Cancel booking
router.post('/bookings/:id/cancel', functionRoomController.cancelFunctionBooking);

// Delete booking
router.delete('/bookings/:id', authenticate, authorize(['admin']), functionRoomController.deleteFunctionBooking);

// ===========================================
// BLOCK/MAINTENANCE ROUTES
// ===========================================

// Block function room for maintenance
router.post('/block', authorize(['admin', 'manager']), functionRoomController.blockFunctionRoom);


// Add these after your existing routes

// Get all refunds for a booking
router.get('/bookings/:bookingId/refunds', functionRoomController.getBookingRefunds);

// Update refund status
router.patch('/refunds/:refundId', authenticate, authorize(['admin', 'manager']), functionRoomController.updateRefundStatus);

// In routes file
router.get('/bookings/:bookingId/payments', functionRoomController.getBookingPaymentHistory);
// router.get('/bookings/:bookingId/refunds', authenticate, functionRoomController.getBookingRefunds);

// // Update refund status
// router.patch('/refunds/:refundId', authenticate, authorize(['admin', 'manager']), functionRoomController.updateRefundStatus);

module.exports = router;