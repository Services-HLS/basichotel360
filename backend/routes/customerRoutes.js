

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/search-by-phone', customerController.searchCustomersByPhone);
router.get('/stats', customerController.getCustomerStats);
router.get('/:id', customerController.getCustomer);
router.get('/:id/images', customerController.getCustomerImages);
router.get('/:id/pdf', customerController.generateCustomerPDF); // NEW PDF ROUTE
router.put('/:id', customerController.updateCustomer);
router.patch('/:id/payment', customerController.updateCustomerPayment);
router.delete('/:id', customerController.deleteCustomer);
// router.get('/:id/images', customerController.getCustomerImages);
router.get('/:id/images/download', customerController.downloadCustomerIdImage);
router.get('/:id/id-image', customerController.getCustomerIdImages);

module.exports = router;