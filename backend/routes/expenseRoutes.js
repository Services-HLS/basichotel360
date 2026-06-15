const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Routes accessible to both admin and staff (view only)
router.get('/', expenseController.getExpenses);
router.get('/categories', expenseController.getExpenseCategories);
router.get('/stats', expenseController.getExpenseStats);
router.get('/:id', expenseController.getExpense);

// Only admin can manage expenses
router.post('/', authorize(['admin']), expenseController.createExpense);
router.put('/:id', authorize(['admin']), expenseController.updateExpense);
router.delete('/:id', authorize(['admin']), expenseController.deleteExpense);

module.exports = router;