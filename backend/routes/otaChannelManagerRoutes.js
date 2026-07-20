const express = require('express');
const otaChannelManagerController = require('../controllers/otaChannelManagerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['admin', 'manager', 'super_admin']));

router.get('/aiosell/config', otaChannelManagerController.getConfig);
router.post('/aiosell/inventory', otaChannelManagerController.pushInventory);
router.post('/aiosell/rates', otaChannelManagerController.pushRates);

module.exports = router;
