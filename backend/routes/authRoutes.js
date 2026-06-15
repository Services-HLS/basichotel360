// // const express = require('express');
// // const router = express.Router();
// // const authController = require('../controllers/authController');
// // const { authenticate } = require('../middleware/auth');

// // // Public routes
// // router.post('/login', authController.login);


// // // Protected routes
// // router.get('/me', authenticate, authController.getCurrentUser);
// // router.post('/change-password', authenticate, authController.changePassword);

// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');
// const { authenticate } = require('../middleware/auth');
// const User = require('../models/User'); // Add this import
// const EmailService = require('../services/emailService'); // Add this import
// const jwt = require('jsonwebtoken'); // Add this import
// const bcrypt = require('bcryptjs'); // Add this for password hashing

// // IMPORT THE DATABASE POOL
// const { pool } = require('../config/database'); 

// // Public routes
// router.post('/login', authController.login);

// // ========== PASSWORD RESET ROUTES ==========

// /**
//  * @route POST /api/auth/forgot-password
//  * @desc Request password reset - Step 1: Check email
//  * @access Public
//  */
// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         error: 'EMAIL_REQUIRED',
//         message: 'Email address is required'
//       });
//     }

//     // Find ALL users with this email
//     const users = await User.findAllByEmail(email);
    
//     // If no users found - return success for security
//     if (!users || users.length === 0) {
//       return res.json({
//         success: true,
//         message: 'If your email is registered, you will receive a password reset link'
//       });
//     }

//     // If only ONE user found, proceed normally
//     if (users.length === 1) {
//       const user = users[0];
      
//       // Generate reset token
//       const resetToken = jwt.sign(
//         {
//           userId: user.id,
//           email: user.email,
//           hotel_id: user.hotel_id,
//           purpose: 'password_reset'
//         },
//         process.env.JWT_SECRET || 'your-secret-key',
//         { expiresIn: '1h' }
//       );

//       // Create reset link
//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
//       const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

//       // Send email
//       await EmailService.sendPasswordResetEmail({
//         to: email,
//         userName: user.name,
//         hotelName: user.hotel_name,
//         resetLink: resetLink,
//         expiresIn: '1 hour'
//       });

//       return res.json({
//         success: true,
//         message: 'Password reset link has been sent to your email'
//       });
//     }

//     // If MULTIPLE users found, return list of hotels
//     const hotels = users.map(user => ({
//       hotelId: user.hotel_id,
//       hotelName: user.hotel_name,
//       userName: user.name,
//       userRole: user.role,
//       status: user.status
//     }));

//     res.json({
//       success: true,
//       requiresHotelSelection: true,
//       message: 'Multiple accounts found with this email. Please select your hotel.',
//       data: {
//         email: email,
//         hotels: hotels
//       }
//     });

//   } catch (error) {
//     console.error('❌ Forgot password error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'SERVER_ERROR',
//       message: 'Failed to process request'
//     });
//   }
// });

// /**
//  * @route POST /api/auth/forgot-password-with-hotel
//  * @desc Request password reset - Step 2: After hotel selection
//  * @access Public
//  */
// router.post('/forgot-password-with-hotel', async (req, res) => {
//   try {
//     const { email, hotelId } = req.body;

//     if (!email || !hotelId) {
//       return res.status(400).json({
//         success: false,
//         error: 'MISSING_FIELDS',
//         message: 'Email and hotel selection are required'
//       });
//     }

//     // Find specific user by email AND hotel_id
//     const [rows] = await pool.execute(
//       `SELECT u.*, h.name as hotel_name 
//        FROM users u
//        JOIN hotels h ON u.hotel_id = h.id
//        WHERE u.email = ? AND u.hotel_id = ?`,
//       [email, hotelId]
//     );

//     const user = rows[0];

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'USER_NOT_FOUND',
//         message: 'User not found for selected hotel'
//       });
//     }

//     // Generate reset token
//     const resetToken = jwt.sign(
//       {
//         userId: user.id,
//         email: user.email,
//         hotel_id: user.hotel_id,
//         purpose: 'password_reset'
//       },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '1h' }
//     );

//     // Create reset link
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
//     const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

//     // Send email
//     await EmailService.sendPasswordResetEmail({
//       to: email,
//       userName: user.name,
//       hotelName: user.hotel_name,
//       resetLink: resetLink,
//       expiresIn: '1 hour'
//     });

//     res.json({
//       success: true,
//       message: `Password reset link sent for ${user.hotel_name}`
//     });

//   } catch (error) {
//     console.error('❌ Forgot password with hotel error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'SERVER_ERROR',
//       message: 'Failed to process request'
//     });
//   }
// });

// /**
//  * @route POST /api/auth/reset-password
//  * @desc Reset password using token
//  * @access Public
//  */
// router.post('/reset-password', async (req, res) => {
//   try {
//     const { token, newPassword, confirmPassword } = req.body;

//     // Validate inputs
//     if (!token || !newPassword || !confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         error: 'MISSING_FIELDS',
//         message: 'All fields are required'
//       });
//     }

//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         error: 'PASSWORD_MISMATCH',
//         message: 'Passwords do not match'
//       });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         error: 'WEAK_PASSWORD',
//         message: 'Password must be at least 6 characters long'
//       });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
//     if (decoded.purpose !== 'password_reset') {
//       return res.status(400).json({
//         success: false,
//         error: 'INVALID_TOKEN',
//         message: 'Invalid reset token'
//       });
//     }

//     // Hash new password
//     const bcrypt = require('bcryptjs');
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     const [result] = await pool.execute(
//       `UPDATE users SET password = ? WHERE id = ? AND email = ?`,
//       [hashedPassword, decoded.userId, decoded.email]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'USER_NOT_FOUND',
//         message: 'User not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Password has been reset successfully'
//     });

//   } catch (error) {
//     console.error('❌ Reset password error:', error);
    
//     if (error.name === 'TokenExpiredError') {
//       return res.status(400).json({
//         success: false,
//         error: 'TOKEN_EXPIRED',
//         message: 'Reset link has expired'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       error: 'SERVER_ERROR',
//       message: 'Failed to reset password'
//     });
//   }
// });

// /**
//  * @route POST /api/auth/verify-reset-token
//  * @desc Verify if reset token is valid
//  * @access Public
//  */
// router.post('/verify-reset-token', async (req, res) => {
//   try {
//     const { token } = req.body;

//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         error: 'TOKEN_REQUIRED',
//         message: 'Reset token is required'
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
//     if (decoded.purpose !== 'password_reset') {
//       return res.status(400).json({
//         success: false,
//         error: 'INVALID_TOKEN',
//         message: 'Invalid reset token'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Token is valid',
//       data: {
//         email: decoded.email
//       }
//     });

//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(400).json({
//         success: false,
//         error: 'TOKEN_EXPIRED',
//         message: 'Reset link has expired'
//       });
//     }
    
//     res.status(400).json({
//       success: false,
//       error: 'INVALID_TOKEN',
//       message: 'Invalid reset token'
//     });
//   }
// });

// // Protected routes
// router.get('/me', authenticate, authController.getCurrentUser);
// router.post('/change-password', authenticate, authController.changePassword);

// module.exports = router;

// routes/auth.js - UPDATED WITH REFRESH TOKEN ENDPOINT
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// IMPORT THE DATABASE POOL
const { pool } = require('../config/database'); 

// ========== EXISTING PUBLIC ROUTES ==========
router.post('/login', authController.login);

// ========== NEW REFRESH TOKEN ROUTE - ADD THIS ==========
/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh an expired access token
 * @access Public (requires valid refresh token in Authorization header)
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { userId, hotelId } = req.body;
    const authHeader = req.headers.authorization;
    
    // Validate request
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Refresh token: No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const oldToken = authHeader.split(' ')[1];

    if (!userId || !hotelId) {
      console.log('❌ Refresh token: Missing userId or hotelId');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    console.log(`🔄 Token refresh requested for user: ${userId}, hotel: ${hotelId}`);

    // First, try to find user by ID (for database users)
    let user = null;
    
    // Check if this is a database user (has numeric ID)
    if (!isNaN(userId)) {
      // Find user in MySQL database
      const [rows] = await pool.execute(
        `SELECT u.*, h.name as hotel_name, h.plan as hotel_plan 
         FROM users u
         JOIN hotels h ON u.hotel_id = h.id
         WHERE u.id = ? AND u.hotel_id = ?`,
        [userId, hotelId]
      );
      user = rows[0];
    } else {
      // This might be a Google Sheets user - we'll handle differently
      console.log('📊 Non-numeric userId, possibly Google Sheets user');
      return res.status(400).json({
        success: false,
        message: 'Token refresh not available for Google Sheets users'
      });
    }
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('✅ User found:', { id: user.id, name: user.name, role: user.role });

    // Check if user account is still active
    if (user.status === 'suspended') {
      console.log('❌ Account suspended:', userId);
      return res.status(403).json({ 
        success: false, 
        message: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Check if trial expired for pro users
    const isProPlan = user.plan === 'pro' || user.hotel_plan === 'pro';
    if (isProPlan && user.status === 'pending') {
      // Check trial period (30 days)
      const createdAt = new Date(user.created_at || user.createdAt);
      const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation > 30) {
        console.log('❌ Trial expired for user:', userId);
        return res.status(403).json({ 
          success: false, 
          message: 'Trial expired',
          code: 'TRIAL_EXPIRED'
        });
      }
    }

    // Calculate trial days left (for response)
    let trialDaysLeft = null;
    if (isProPlan && user.status === 'pending') {
      const createdAt = new Date(user.created_at || user.createdAt);
      const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      trialDaysLeft = Math.max(0, 30 - daysSinceCreation);
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
         userId: user.id,
        username: user.username,
        hotelId: user.hotel_id,
        role: user.role,
        source: 'database'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // 7 days expiry
    );

    console.log('✅ New token generated for user:', userId);

    // Return new token and updated user data
    res.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        hotelName: user.hotel_name,
        hotel_id: user.hotel_id,
        plan: isProPlan ? 'pro' : 'basic',
        status: user.status,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
        trialInfo: isProPlan ? {
          daysLeft: trialDaysLeft,
          isTrialActive: user.status === 'pending'
        } : null,
        source: 'database'
      }
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during token refresh',
      code: 'SERVER_ERROR'
    });
  }
});

// ========== PASSWORD RESET ROUTES ==========
// ... (keep all your existing password reset routes exactly as they are)

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset - Step 1: Check email
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email address is required'
      });
    }

    // Find ALL users with this email
    const [users] = await pool.execute(
      `SELECT u.*, h.name as hotel_name, h.plan as hotel_plan 
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE u.email = ?`,
      [email]
    );
    
    // If no users found - return success for security
    if (!users || users.length === 0) {
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // If only ONE user found, proceed normally
    if (users.length === 1) {
      const user = users[0];
      
      // Generate reset token
      const resetToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          hotel_id: user.hotel_id,
          purpose: 'password_reset'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // Create reset link
      const frontendUrl = process.env.FRONTEND_URL ;
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      // Send email
      await EmailService.sendPasswordResetEmail({
        to: email,
        userName: user.name,
        hotelName: user.hotel_name,
        resetLink: resetLink,
        expiresIn: '1 hour'
      });

      return res.json({
        success: true,
        message: 'Password reset link has been sent to your email'
      });
    }

    // If MULTIPLE users found, return list of hotels
    const hotels = users.map(user => ({
      hotelId: user.hotel_id,
      hotelName: user.hotel_name,
      userName: user.name,
      userRole: user.role,
      status: user.status
    }));

    res.json({
      success: true,
      requiresHotelSelection: true,
      message: 'Multiple accounts found with this email. Please select your hotel.',
      data: {
        email: email,
        hotels: hotels
      }
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to process request'
    });
  }
});

/**
 * @route POST /api/auth/forgot-password-with-hotel
 * @desc Request password reset - Step 2: After hotel selection
 * @access Public
 */
router.post('/forgot-password-with-hotel', async (req, res) => {
  try {
    const { email, hotelId } = req.body;

    if (!email || !hotelId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Email and hotel selection are required'
      });
    }

    // Find specific user by email AND hotel_id
    const [rows] = await pool.execute(
      `SELECT u.*, h.name as hotel_name 
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE u.email = ? AND u.hotel_id = ?`,
      [email, hotelId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found for selected hotel'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        hotel_id: user.hotel_id,
        purpose: 'password_reset'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL ;
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    await EmailService.sendPasswordResetEmail({
      to: email,
      userName: user.name,
      hotelName: user.hotel_name,
      resetLink: resetLink,
      expiresIn: '1 hour'
    });

    res.json({
      success: true,
      message: `Password reset link sent for ${user.hotel_name}`
    });

  } catch (error) {
    console.error('❌ Forgot password with hotel error:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to process request'
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using token
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const [result] = await pool.execute(
      `UPDATE users SET password = ? WHERE id = ? AND email = ?`,
      [hashedPassword, decoded.userId, decoded.email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Reset link has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to reset password'
    });
  }
});

/**
 * @route POST /api/auth/verify-reset-token
 * @desc Verify if reset token is valid
 * @access Public
 */
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_REQUIRED',
        message: 'Reset token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: decoded.email
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Reset link has expired'
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid reset token'
    });
  }
});

// ========== PROTECTED ROUTES ==========
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;