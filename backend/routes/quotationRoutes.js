// In routes/quotations.js
const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/:id/download', quotationController.downloadQuotation);
// All quotation routes require authentication
router.use(authenticate);

// Quotation CRUD operations
router.post('/', quotationController.createQuotation);
router.post('/check-availability', quotationController.checkAvailability); // NEW ROUTE
router.get('/', quotationController.getQuotations);
router.get('/:id', quotationController.getQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.deleteQuotation);

// Quotation actions
router.post('/:id/convert-to-booking', quotationController.convertToBooking);
router.get('/:id/document', quotationController.generateQuotationDocument);
router.get('/:id/download', quotationController.downloadQuotation);

module.exports = router;