

// // Create new file: routes/userRoutes.js
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticate, authorize } = require('../middleware/auth');

// // All routes require authentication
// router.use(authenticate);

// // Only admin can access these routes
// router.use(authorize(['admin']));

// // User management routes
// router.post('/', userController.createUser);
// router.get('/', userController.getAllUsers);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

// module.exports = router;


// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Check if user exists with same username AND phone - PUBLIC
router.post('/check-duplicate', async (req, res) => {
  try {
    const { username, phone } = req.body;

    if (!username || !phone) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Username and phone are required'
      });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if user exists with same username AND phone
    const [rows] = await pool.execute(
      `SELECT id FROM users WHERE username = ? AND phone = ?`,
      [username, cleanPhone]
    );

    // Also check if username exists (for suggestion)
    const [usernameRows] = await pool.execute(
      `SELECT username FROM users WHERE username LIKE ? ORDER BY username DESC`,
      [`${username}%`]
    );

    // Generate username suggestions if username exists
    let suggestedUsername = null;
    if (usernameRows.length > 0) {
      // Extract all numbers from existing usernames
      const existingNumbers = usernameRows
        .map(row => {
          const match = row.username.match(new RegExp(`^${escapeRegex(username)}(\\d*)$`));
          return match ? (match[1] ? parseInt(match[1]) : 0) : null;
        })
        .filter(num => num !== null)
        .sort((a, b) => a - b);

      // Find the smallest available number
      let nextNumber = 0;
      for (let i = 0; i <= existingNumbers.length; i++) {
        if (!existingNumbers.includes(i)) {
          nextNumber = i;
          break;
        }
      }

      suggestedUsername = nextNumber === 0 ? username : `${username}${nextNumber}`;
    }

    console.log(`🔍 [CHECK DUPLICATE] Username: ${username}, Phone: ${cleanPhone}, Exists: ${rows.length > 0}`);

    res.json({
      success: true,
      exists: rows.length > 0,
      usernameExists: usernameRows.length > 0,
      suggestedUsername: suggestedUsername
    });

  } catch (error) {
    console.error('❌ [CHECK DUPLICATE] Error:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to check duplicate user'
    });
  }
});

// Helper function to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// PROTECTED ROUTES (Require authentication)
// ============================================

// Apply authentication middleware to all routes below this line
router.use(authenticate);

// Only admin can access these routes
router.use(authorize(['admin']));

// User management routes (protected)
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;