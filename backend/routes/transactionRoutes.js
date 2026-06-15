const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth'); // Use authenticate

// Apply auth middleware to all transaction routes
router.use(authenticate); // Use authenticate instead

// Transaction routes
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/stats', transactionController.getTransactionStats);
router.get('/summary', transactionController.getSuccessfulSummary);
router.get('/booking/:bookingId', transactionController.getTransactionsByBooking);
router.get('/customer/:customerId', transactionController.getTransactionsByCustomer);
router.get('/:id', transactionController.getTransaction);
router.get('/:id/receipt', transactionController.generateReceipt);
router.put('/:id/status', transactionController.updateTransactionStatus);
router.put('/upi/:transactionId', transactionController.updateUPITransaction);
router.post('/:id/refund', transactionController.processRefund);

module.exports = router;