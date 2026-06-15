// routes/whatsappTestRoutes.js
const express = require('express');
const router = express.Router();
const whatsappTestController = require('../controllers/whatsappTestController');

// Test routes for Postman
router.post('/test-hotel-update', whatsappTestController.testHotelUpdate);
router.post('/test-booking-confirmation', whatsappTestController.testBookingConfirmation);
router.get('/test-config', whatsappTestController.testConfiguration);
router.post('/quick-test', whatsappTestController.quickTest);

module.exports = router;