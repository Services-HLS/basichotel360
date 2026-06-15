const Admin = require('../models/Admin');

const adminController = {
  // Create new admin (for super_admin only)
  createAdmin: async (req, res) => {
    try {
      const { username, password, name, email, phone, role } = req.body;
      const hotelId = req.user.hotel_id;

      // Check if username exists
      const usernameExists = await Admin.checkUsernameExists(username);
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: 'USERNAME_EXISTS',
          message: 'Username already taken'
        });
      }

      const adminId = await Admin.create({
        username,
        password,
        name,
        email,
        phone,
        role: role || 'admin',
        hotel_id: hotelId
      });

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        adminId: adminId
      });

    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get all admins for hotel
  getAdmins: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const admins = await Admin.findByHotel(hotelId);

      res.json({
        success: true,
        data: admins
      });

    } catch (error) {
      console.error('Get admins error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get admin by ID
  getAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const admin = await Admin.findById(id);
      if (!admin || admin.hotel_id !== parseInt(hotelId)) {
        return res.status(404).json({
          success: false,
          error: 'ADMIN_NOT_FOUND',
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        data: admin
      });

    } catch (error) {
      console.error('Get admin error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update admin
  updateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { name, email, phone, role } = req.body;

      // Only super_admin can change roles
      if (role && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Only super admin can change roles'
        });
      }

      const updated = await Admin.update(id, hotelId, {
        name,
        email,
        phone,
        role
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'ADMIN_NOT_FOUND',
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        message: 'Admin updated successfully'
      });

    } catch (error) {
      console.error('Update admin error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Delete admin
  deleteAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Prevent self-deletion
      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: 'SELF_DELETION',
          message: 'Cannot delete your own account'
        });
      }

      const deleted = await Admin.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'ADMIN_NOT_FOUND',
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        message: 'Admin deleted successfully'
      });

    } catch (error) {
      console.error('Delete admin error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.user.userId;

      // Get current admin
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: 'ADMIN_NOT_FOUND',
          message: 'Admin not found'
        });
      }

      // Verify current password
      const isValidPassword = await Admin.verifyPassword(currentPassword, admin.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await Admin.updatePassword(adminId, newPassword);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  }
};

module.exports = adminController;