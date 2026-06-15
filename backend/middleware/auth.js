

// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const authenticate = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         error: 'NO_TOKEN',
//         message: 'Access denied. No token provided.'
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
//     // ✅ GET FULL USER INFO INCLUDING EMAIL AND PHONE
//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         error: 'USER_NOT_FOUND',
//         message: 'User no longer exists.'
//       });
//     }

//     // ✅ ADD ALL USER DETAILS TO REQ.USER
//     req.user = {
//       userId: decoded.userId,
//       id: user.id, // Add this
//       username: user.username,
//       name: user.name, // Add this
//       email: user.email, // Add this
//       phone: user.phone, // Add this
//       role: user.role,
//       hotel_id: user.hotel_id,
//       permissions: user.permissions || [],
//       status: user.status
//     };
    
//     console.log(`🔐 [AUTH] User authenticated: ${req.user.name}, Role: ${req.user.role}, Hotel: ${req.user.hotel_id}`);
    
//     next();

//   } catch (error) {
//     console.error('Authentication error:', error);
//     res.status(401).json({
//       success: false,
//       error: 'INVALID_TOKEN',
//       message: 'Invalid token.'
//     });
//   }
// };

// const authorize = (roles = []) => {
//   return (req, res, next) => {
//     if (roles.length > 0 && !roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         error: 'FORBIDDEN',
//         message: `Required role: ${roles.join(' or ')}`
//       });
//     }
//     next();
//   };
// };

// module.exports = { authenticate, authorize };


const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel'); // ADD THIS IMPORT

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // ✅ GET FULL USER INFO INCLUDING EMAIL AND PHONE
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User no longer exists.'
      });
    }

    // ✅ IMPORTANT: GET HOTEL INFO FOR TRIAL CHECK
    const hotel = await Hotel.findById(user.hotel_id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'HOTEL_NOT_FOUND',
        message: 'Hotel not found.'
      });
    }

    // ✅ CHECK USER STATUS AND TRIAL EXPIRY (CRITICAL NEW LOGIC)
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: hotel.plan === 'pro' 
          ? 'Your PRO plan trial has expired. Please upgrade to continue.'
          : 'Your account has been suspended. Please contact support.',
        status: user.status,
        plan: hotel.plan,
        requiresUpgrade: hotel.plan === 'pro'
      });
    }

    // ✅ CHECK FOR EXPIRED TRIAL (PRO PLAN SPECIFIC)
    if (user.status === 'pending' && hotel.plan === 'pro') {
      // Check if trial has expired
      const now = new Date();
      const trialExpiryDate = new Date(hotel.trial_expiry_date);
      
      if (trialExpiryDate < now) {
        // Trial expired, update user status to suspended
        await User.updateStatus(user.id, 'suspended');
        
        return res.status(403).json({
          success: false,
          error: 'TRIAL_EXPIRED',
          message: 'Your 30-day PRO plan trial has expired. Please upgrade to continue.',
          status: 'suspended',
          plan: hotel.plan,
          requiresUpgrade: true,
          trialExpired: true
        });
      }
      
      // Check if trial is about to expire (less than 2 days)
      const daysUntilExpiry = Math.ceil((trialExpiryDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 2 && daysUntilExpiry > 0) {
        // Add warning to response header
        res.setHeader('X-Trial-Warning', `Trial expires in ${daysUntilExpiry} day(s)`);
      }
    }

    // ✅ ADD ALL USER DETAILS TO REQ.USER
    req.user = {
      userId: decoded.userId,
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hotel_id: user.hotel_id,
      permissions: user.permissions || [],
      status: user.status,
      hotel_plan: hotel.plan, // Add hotel plan to user object
      trial_expiry_date: hotel.trial_expiry_date, // Add trial expiry
      trial_active: hotel.plan === 'pro' && user.status === 'pending'
    };
    
    console.log(`🔐 [AUTH] User authenticated: ${req.user.name}, ` +
                `Role: ${req.user.role}, ` +
                `Hotel: ${req.user.hotel_id}, ` +
                `Plan: ${hotel.plan}, ` +
                `Status: ${user.status}, ` +
                `Trial Expiry: ${hotel.trial_expiry_date || 'N/A'}`);
    
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid token format.'
      });
    }
    
    res.status(401).json({
      success: false,
      error: 'AUTH_FAILED',
      message: 'Authentication failed.'
    });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    // ✅ ADD PRO PLAN RESTRICTION CHECK
    if (req.user.hotel_plan === 'pro' && req.user.status === 'pending') {
      // User is on PRO trial - allow all roles temporarily
      console.log(`🔐 [AUTH] PRO trial user accessing: ${req.user.role}`);
      next();
      return;
    }
    
    // Original role check
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// ✅ NEW MIDDLEWARE: CHECK IF USER CAN ACCESS PRO FEATURES
const requireProPlan = (req, res, next) => {
  if (req.user.hotel_plan !== 'pro' && req.user.hotel_plan !== 'pro_plus') {
    return res.status(403).json({
      success: false,
      error: 'PRO_PLAN_REQUIRED',
      message: 'This feature requires PRO plan. Please upgrade.'
    });
  }
  
  // Check if trial is active or account is paid
  if (req.user.status !== 'active' && req.user.status !== 'pending') {
    return res.status(403).json({
      success: false,
      error: 'ACCOUNT_INACTIVE',
      message: 'Your account is not active. Please check your subscription.'
    });
  }
  
  next();
};

// ✅ NEW MIDDLEWARE: CHECK TRIAL STATUS
const checkTrialStatus = (req, res, next) => {
  if (req.user.hotel_plan === 'pro' && req.user.status === 'pending') {
    const trialExpiryDate = new Date(req.user.trial_expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((trialExpiryDate - now) / (1000 * 60 * 60 * 24));
    
    // Add trial info to response
    res.locals.trialInfo = {
      active: true,
      daysLeft: daysLeft,
      expiryDate: trialExpiryDate,
      status: daysLeft <= 0 ? 'expired' : daysLeft <= 2 ? 'warning' : 'active'
    };
  }
  
  next();
};

module.exports = { 
  authenticate, 
  authorize, 
  requireProPlan, // Export new middleware
  checkTrialStatus // Export new middleware
};