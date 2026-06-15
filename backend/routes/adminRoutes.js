const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Routes accessible to super_admin only
router.post('/', authorize(['super_admin']), adminController.createAdmin);
router.get('/', authorize(['super_admin']), adminController.getAdmins);
router.get('/:id', authorize(['super_admin']), adminController.getAdmin);
router.put('/:id', authorize(['super_admin']), adminController.updateAdmin);
router.delete('/:id', authorize(['super_admin']), adminController.deleteAdmin);

// Password change route accessible to all authenticated admins
router.post('/change-password', authenticate, adminController.changePassword);

module.exports = router;