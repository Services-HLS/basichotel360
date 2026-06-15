const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticateSuperAdmin } = require('../middleware/superAdminAuth');

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================
router.post('/login', superAdminController.login);

// ===========================================
// PROTECTED ROUTES (Super Admin only)
// ===========================================
router.use(authenticateSuperAdmin);

// Dashboard
router.get('/dashboard', superAdminController.getDashboardStats);

// Hotel Management
router.get('/hotels', superAdminController.getAllHotels);
router.get('/hotels/:id', superAdminController.getHotelDetails);
router.put('/hotels/:id', superAdminController.updateHotel);
router.delete('/hotels/:id', superAdminController.deleteHotel);

// Trial Management
router.get('/trials', superAdminController.getTrialHotels);
router.post('/hotels/:id/extend-trial', superAdminController.extendTrial);
router.post('/trials/send-reminder', superAdminController.sendReminderEmail);

// Room Management
router.get('/hotels/:id/rooms', superAdminController.getHotelRooms);
router.get('/hotels/:hotelId/rooms/:roomId', superAdminController.getRoomDetails);
router.post('/hotels/:id/rooms', superAdminController.createRoom);
router.put('/hotels/:hotelId/rooms/:roomId', superAdminController.updateRoom);
router.delete('/hotels/:hotelId/rooms/:roomId', superAdminController.deleteRoom);

// Function Room Management
router.get('/hotels/:id/function-rooms', superAdminController.getHotelFunctionRooms);
router.get('/hotels/:hotelId/function-rooms/:roomId', superAdminController.getFunctionRoomDetails);
router.post('/hotels/:id/function-rooms', superAdminController.createFunctionRoom);
router.put('/hotels/:hotelId/function-rooms/:roomId', superAdminController.updateFunctionRoom);
router.delete('/hotels/:hotelId/function-rooms/:roomId', superAdminController.deleteFunctionRoom);


// Add to your superAdminRoutes.js
router.get('/hotels/:hotelId/reactivation-amount', superAdminController.getReactivationAmount);
router.put('/hotels/:hotelId/reactivation-amount', superAdminController.updateReactivationAmount);

// Add this with other protected routes
router.put('/hotels/:id/admin', superAdminController.updateHotelAdmin);

// Notification Settings Routes
router.get('/hotels/:hotelId/notification-settings', superAdminController.getNotificationSettings);
router.put('/hotels/:hotelId/notification-settings', superAdminController.updateNotificationSettings);
module.exports = router;