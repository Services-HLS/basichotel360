// routes/walletRoutes.js - CREATE NEW FILE
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

router.get('/referral/validate/:code', walletController.validateReferralCode);
// All routes require authentication
router.use(authenticate);

// Wallet routes
router.get('/', walletController.getWallet);
router.get('/transactions', walletController.getTransactions);
router.post('/topup/order', walletController.createTopupOrder);
router.post('/topup/verify', walletController.verifyTopupPayment);
router.post('/pay', walletController.payWithWallet);

// Referral routes
router.get('/referral/stats', walletController.getReferralStats);
router.get('/referral/leaderboard', walletController.getLeaderboard);
// router.get('/referral/validate/:code', walletController.validateReferralCode);
router.get('/referral/settings', walletController.getReferralSettings);
router.put('/referral/settings', walletController.updateReferralSettings);

module.exports = router;