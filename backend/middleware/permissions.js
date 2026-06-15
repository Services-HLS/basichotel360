// Create new file: middleware/permission.js
const User = require('../models/User');

// Simple permission checker middleware
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const hotelId = req.user.hotel_id;

      console.log(`🔐 [PERMISSION CHECK] User ${userId} needs '${permission}' permission`);

      // Admin has all permissions automatically
      if (req.user.role === 'admin') {
        console.log(`✅ [PERMISSION CHECK] User is admin, granting all permissions`);
        return next();
      }

      // Check if user has permission
      const hasPerm = await User.hasPermission(userId, hotelId, permission);
      
      if (hasPerm) {
        console.log(`✅ [PERMISSION CHECK] User has '${permission}' permission`);
        next();
      } else {
        console.log(`❌ [PERMISSION CHECK] User missing '${permission}' permission`);
        res.status(403).json({
          success: false,
          error: 'PERMISSION_DENIED',
          message: `You don't have permission to ${permission.replace('_', ' ')}`
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Permission check failed'
      });
    }
  };
};

module.exports = { hasPermission };