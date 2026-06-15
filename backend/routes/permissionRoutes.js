// Create new file: routes/permissionRoutes.js
const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get permission types (available for all authenticated users)
router.get('/types', permissionController.getPermissionTypes);

// Get my permissions
router.get('/my-permissions', permissionController.getMyPermissions);

// Admin only routes
router.get('/users', 
  authorize(['admin']),
  permissionController.getUsersWithPermissions
);

router.put('/update', 
  authorize(['admin']),
  permissionController.updateUserPermissions
);

module.exports = router;