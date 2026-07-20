const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(authenticate);

router.post('/register-device', notificationController.registerDevice);
router.post('/unregister-device', notificationController.unregisterDevice);
router.get('/status', notificationController.getStatus);
router.post('/send-test', notificationController.sendTest);

module.exports = router;
