


const User = require('../models/User');
const Hotel = require('../models/Hotel');
const jwt = require('jsonwebtoken');
const { isBasicHotelPlan } = require('../utils/planUtils');

const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log("🔐 Login attempt for:", username);

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'Username and password are required'
        });
      }

      // Find user
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        });
      }

      // ✅ CHECK IF USER IS SUPER ADMIN FIRST
      if (user.role === 'super_admin' || user.hotel_id === 0) {
        console.log("👑 Super Admin login attempt for:", username);

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            error: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password'
          });
        }

        // Generate token for super admin
        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            role: 'super_admin',
            hotel_id: 0,
            permissions: ['*'], // Super admin has all permissions
            status: user.status
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        console.log("✅ Super Admin login successful for:", username);

        return res.json({
          success: true,
          message: 'Super Admin login successful',
          token: token,
          user: {
            ...userWithoutPassword,
            hotelName: 'System Administration',
            hotelPlan: 'system',
            permissions: ['*'], // Super admin has all permissions
            source: 'database',
            isSuperAdmin: true
          }
        });
      }

      // ✅ REGULAR USER LOGIN FLOW CONTINUES HERE
      // Verify password for regular user
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        });
      }

      // Get hotel information
      const hotel = await Hotel.findById(user.hotel_id);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      // Get custom reactivation amount
      let customReactivationAmount = 999; // Default
      if (hotel.custom_reactivation_amount) {
        customReactivationAmount = hotel.custom_reactivation_amount;
      }


      // Get Permissions
      let userPermissions = await User.getUserPermissions(user.id, user.hotel_id);
      const isBasicHotel = isBasicHotelPlan(hotel.plan);
      if (isBasicHotel) {
        userPermissions = ['view_dashboard', 'view_rooms', 'view_bookings'];
      }

      // Calculate trial info for PRO plan users
      let trialInfo = null;
      let isTrialExpired = false;

      if (hotel.plan === 'pro' && hotel.trial_expiry_date) {
        const now = new Date();
        const expiryDate = new Date(hotel.trial_expiry_date);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        isTrialExpired = daysLeft <= 0;

        trialInfo = {
          active: daysLeft > 0,
          daysLeft: Math.max(0, daysLeft),
          expiryDate: expiryDate.toISOString(),
          status: daysLeft <= 0 ? 'expired' : daysLeft <= 2 ? 'warning' : 'active'
        };

        // If trial expired but user still has pending status, update it
        if (isTrialExpired && user.status === 'pending') {
          await User.updateStatus(user.id, 'suspended');
          user.status = 'suspended';
          console.log(`🔄 Updated user status to suspended due to trial expiry`);
        }
      }

      // For PRO plan users who are pending (trial users), check if trial expired
      if (hotel.plan === 'pro' && user.status === 'pending' && hotel.trial_expiry_date) {
        const now = new Date();
        const expiryDate = new Date(hotel.trial_expiry_date);

        if (expiryDate < now) {
          console.log(`⚠️ PRO trial expired for user ${username}, but allowing login with suspended status`);
          // Update status to suspended but still allow login
          await User.updateStatus(user.id, 'suspended');
          user.status = 'suspended';
        }
      }

      // Generate token for regular user
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          hotel_id: user.hotel_id,
          permissions: userPermissions,
          status: user.status,
          hotel_plan: hotel.plan
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          ...userWithoutPassword,
          hotelName: hotel.name,
          hotelPlan: hotel.plan,
          permissions: userPermissions,
          trialInfo: trialInfo,
          isTrialExpired: isTrialExpired,
          customReactivationAmount: customReactivationAmount,
          source: 'database',
          isSuperAdmin: false
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });
      }

      // ✅ CHECK IF SUPER ADMIN
      if (user.role === 'super_admin' || user.hotel_id === 0) {
        const { password: _, ...userWithoutPassword } = user;

        return res.json({
          success: true,
          data: {
            ...userWithoutPassword,
            hotelName: 'System Administration',
            hotelPlan: 'system',
            permissions: ['*'],
            isSuperAdmin: true,
            source: 'database'
          }
        });
      }

      // Regular user flow
      const hotel = await Hotel.findById(user.hotel_id);
      const permissions = await User.getUserPermissions(user.id, user.hotel_id);
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          ...userWithoutPassword,
          hotelName: hotel ? hotel.name : 'Unknown Hotel',
          hotelPlan: hotel ? hotel.plan : 'unknown',
          permissions: permissions,
          isSuperAdmin: false,
          source: 'database'
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' });
    }
  },

  changePassword: async (req, res) => {
    // ... (Your existing changePassword code remains the same)
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password required' });
      }

      const user = await User.findByUsername(req.user.username);
      const isValidPassword = await User.verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      await User.updatePassword(userId, newPassword);
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = authController;