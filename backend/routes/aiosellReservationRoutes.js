const express = require('express');
const otaChannelManagerController = require('../controllers/otaChannelManagerController');
const { aiosellBasicAuth, validateAiosellEndpointKey } = require('../middleware/aiosellAuth');

const router = express.Router();

router.post(
  '/reservations/:endpointKey',
  aiosellBasicAuth,
  validateAiosellEndpointKey,
  otaChannelManagerController.receiveReservation
);

module.exports = router;
