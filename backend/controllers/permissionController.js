// Create new file: controllers/permissionController.js
const User = require('../models/User');

const permissionController = {
  // Get all permission types
  // getPermissionTypes: async (req, res) => {
  //   try {
  //     const permissions = await User.getPermissionTypes();
      
  //     res.json({
  //       success: true,
  //       data: permissions
  //     });
  //   } catch (error) {
  //     console.error('Get permission types error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Failed to get permission types'
  //     });
  //   }
  // },
  // In controllers/permissionController.js, find getPermissionTypes and REPLACE it with:

getPermissionTypes: async (req, res) => {
  try {
    const permissionTypes = [
      // Dashboard
      { id: 'view_dashboard', label: 'View Dashboard', description: 'Can access dashboard', category: 'Dashboard' },
      
      // Rooms
      { id: 'view_rooms', label: 'View Rooms', description: 'Can view room list', category: 'Rooms' },
      { id: 'manage_rooms', label: 'Manage Rooms', description: 'Can add/edit/delete rooms', category: 'Rooms' },
      
      // Bookings
      { id: 'view_bookings', label: 'View Bookings', description: 'Can view booking list', category: 'Bookings' },
      { id: 'create_booking', label: 'Create Booking', description: 'Can create new bookings', category: 'Bookings' },
      { id: 'edit_booking', label: 'Edit Booking', description: 'Can edit existing bookings', category: 'Bookings' },
      { id: 'cancel_booking', label: 'Cancel Booking', description: 'Can cancel bookings', category: 'Bookings' },
      
      // Customers
      { id: 'view_customers', label: 'View Customers', description: 'Can view customer list', category: 'Customers' },
      { id: 'manage_customers', label: 'Manage Customers', description: 'Can add/edit customers', category: 'Customers' },
      
      // ADD INCOME & EXPENSES CATEGORY:
      { id: 'view_collections', label: 'View Collections', description: 'Can view collections/income', category: 'Income & Expenses' },
      { id: 'view_expenses', label: 'View Expenses', description: 'Can view expenses', category: 'Income & Expenses' },
      { id: 'view_salaries', label: 'View Salaries', description: 'Can view salaries', category: 'Income & Expenses' },
      { id: 'manage_housekeeping', label: 'Manage Housekeeping', description: 'Can manage housekeeping tasks', category: 'Income & Expenses' },
      
      // Reports
      { id: 'view_reports', label: 'View Reports', description: 'Can view reports', category: 'Reports' },
      { id: 'view_financial', label: 'View Financial', description: 'Can view financial data', category: 'Reports' },
      
      // Administration
      { id: 'manage_staff', label: 'Manage Staff', description: 'Can manage staff users', category: 'Administration' },
      { id: 'manage_hotel_settings', label: 'Manage Settings', description: 'Can change hotel settings', category: 'Administration' }
    ];
    
    res.json({
      success: true,
      data: permissionTypes
    });
  } catch (error) {
    console.error('Get permission types error:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to get permission types'
    });
  }
},

  // Get users with permissions for current hotel
  getUsersWithPermissions: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const users = await User.getUsersWithPermissions(hotelId);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get users with permissions error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to get users'
      });
    }
  },

  // Update user permissions
  updateUserPermissions: async (req, res) => {
    try {
      const { userId, permissions } = req.body;
      const hotelId = req.user.hotel_id;
      const grantedBy = req.user.userId;

      // Verify target user belongs to same hotel
      const targetUser = await User.findById(userId);
      if (!targetUser || targetUser.hotel_id !== hotelId) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found in your hotel'
        });
      }

      // Get current permissions
      const currentPermissions = await User.getUserPermissions(userId, hotelId);
      
      // Add new permissions
      for (const permission of permissions) {
        if (!currentPermissions.includes(permission)) {
          await User.addPermission(userId, hotelId, permission, grantedBy);
        }
      }
      
      // Remove old permissions
      for (const permission of currentPermissions) {
        if (!permissions.includes(permission)) {
          await User.removePermission(userId, hotelId, permission);
        }
      }
      
      res.json({
        success: true,
        message: 'Permissions updated successfully'
      });
    } catch (error) {
      console.error('Update permissions error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to update permissions'
      });
    }
  },

  // Get current user's permissions
  getMyPermissions: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          permissions: req.user.permissions || [],
          isAdmin: req.user.role === 'admin'
        }
      });
    } catch (error) {
      console.error('Get my permissions error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to get permissions'
      });
    }
  }
};

module.exports = permissionController;