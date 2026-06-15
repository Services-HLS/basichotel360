const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Routes accessible to both admin and staff (view only)
router.get('/', salaryController.getSalaries);
router.get('/stats', salaryController.getSalaryStats);
router.get('/employees', salaryController.getEmployeesForSalary);
router.get('/:id', salaryController.getSalary);

// Only admin can manage salaries
router.post('/', authorize(['admin']), salaryController.createSalary);
router.put('/:id', authorize(['admin']), salaryController.updateSalary);
router.delete('/:id', authorize(['admin']), salaryController.deleteSalary);

module.exports = router;