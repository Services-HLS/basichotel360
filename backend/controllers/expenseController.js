const Expense = require('../models/Expense');

const expenseController = {
  // Create new expense
  createExpense: async (req, res) => {
    try {
      const { 
        expense_name, 
        description, 
        category, 
        amount, 
        expense_date, 
        remark 
      } = req.body;
      
      const hotelId = req.user.hotel_id;
      const created_by = req.user.id;

      if (!expense_name || !amount || !expense_date) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Expense name, amount, and date are required'
        });
      }

      const expenseId = await Expense.create({
        hotel_id: hotelId,
        expense_name,
        description: description || '',
        category: category || 'other',
        amount: parseFloat(amount),
        expense_date,
        remark: remark || '',
        created_by
      });

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: { expenseId }
      });

    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get all expenses for hotel
  getExpenses: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { 
        category, 
        startDate, 
        endDate, 
        search 
      } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (search) filters.search = search;

      const expenses = await Expense.findByHotel(hotelId, filters);

      res.json({
        success: true,
        data: expenses
      });

    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get expense by ID
  getExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const expense = await Expense.findById(id, hotelId);
      if (!expense) {
        return res.status(404).json({
          success: false,
          error: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        data: expense
      });

    } catch (error) {
      console.error('Get expense error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update expense
  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { 
        expense_name, 
        description, 
        category, 
        amount, 
        expense_date, 
        remark 
      } = req.body;

      if (!expense_name || !amount || !expense_date) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Expense name, amount, and date are required'
        });
      }

      const updated = await Expense.update(id, hotelId, {
        expense_name,
        description: description || '',
        category: category || 'other',
        amount: parseFloat(amount),
        expense_date,
        remark: remark || ''
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense updated successfully'
      });

    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Delete expense
  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const deleted = await Expense.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found'
        });
      }

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });

    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get expense statistics
  getExpenseStats: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { startDate, endDate } = req.query;

      const stats = await Expense.getStats(hotelId, startDate, endDate);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get expense stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get expense categories
  getExpenseCategories: async (req, res) => {
    try {
      const categories = [
        { value: 'utilities', label: 'Utilities' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'staff', label: 'Staff' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'other', label: 'Other' }
      ];

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get expense categories error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  }
};

module.exports = expenseController;