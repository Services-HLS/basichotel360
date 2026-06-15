



const User = require('../models/User');

const userController = {
  // Create new user (admin only)
  createUser: async (req, res) => {
    try {
      // Extract status from body, default to 'active' if not sent, or force 'pending' if you prefer
      const { username, password, name, email, phone, role, status } = req.body;
      const hotelId = req.user.hotel_id;
      const createdBy = req.user.userId;

      if (!username || !password || !name || !email || !role) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Username, password, name, email, and role are required'
        });
      }

      const usernameExists = await User.checkUsernameExists(username);
      if (usernameExists) {
        return res.status(400).json({ success: false, error: 'USERNAME_EXISTS', message: 'Username already exists' });
      }

      const userId = await User.create({
        username,
        password,
        role,
        name,
        email,
        phone,
        hotel_id: hotelId,
        status: status || 'active' // Allow admin to set status, default active
      }, createdBy);

      const newUser = await User.findById(userId);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to create user' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const users = await User.findByHotel(hotelId);
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get users' });
    }
  },

  // Update user (admin only) - Now includes Status update
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, role, status } = req.body; // Added status
      const hotelId = req.user.hotel_id;

      const user = await User.findById(id);
      if (!user || user.hotel_id !== hotelId) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // If status is provided, use it, otherwise keep existing status
      const newStatus = status || user.status;

      const updated = await User.update(id, hotelId, { 
        name, 
        email, 
        phone, 
        role, 
        status: newStatus 
      });

      if (!updated) {
        return res.status(400).json({ success: false, message: 'Failed to update user' });
      }

      res.json({ success: true, message: 'User updated successfully' });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      }

      const deleted = await User.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }
};

module.exports = userController;