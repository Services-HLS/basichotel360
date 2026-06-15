// const Salary = require('../models/Salary');

// const salaryController = {
//   // Create new salary record
//   createSalary: async (req, res) => {
//     try {
//       const { 
//         user_id,
//         employee_name,
//         designation,
//         salary_month,
//         basic_salary,
//         allowances,
//         deductions,
//         net_salary,
//         payment_date,
//         payment_method,
//         status,
//         remarks
//       } = req.body;
      
//       const hotelId = req.user.hotel_id;
//       const created_by = req.user.id;

//       // Calculate net salary if not provided
//       const calculatedNetSalary = parseFloat(basic_salary || 0) + 
//                                  parseFloat(allowances || 0) - 
//                                  parseFloat(deductions || 0);

//       const finalNetSalary = net_salary || calculatedNetSalary;

//       const salaryId = await Salary.create({
//         hotel_id: hotelId,
//         user_id,
//         employee_name,
//         designation,
//         salary_month,
//         basic_salary: parseFloat(basic_salary || 0),
//         allowances: parseFloat(allowances || 0),
//         deductions: parseFloat(deductions || 0),
//         net_salary: parseFloat(finalNetSalary),
//         payment_date,
//         payment_method: payment_method || 'cash',
//         status: status || 'paid',
//         remarks: remarks || '',
//         created_by
//       });

//       res.status(201).json({
//         success: true,
//         message: 'Salary record created successfully',
//         data: { salaryId }
//       });

//     } catch (error) {
//       console.error('Create salary error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   },

//   // Get all salary records for hotel
//   getSalaries: async (req, res) => {
//     try {
//       const hotelId = req.user.hotel_id;
//       const { 
//         user_id, 
//         status, 
//         startDate, 
//         endDate 
//       } = req.query;

//       const filters = {};
//       if (user_id) filters.user_id = user_id;
//       if (status) filters.status = status;
//       if (startDate) filters.startDate = startDate;
//       if (endDate) filters.endDate = endDate;

//       const salaries = await Salary.findByHotel(hotelId, filters);

//       res.json({
//         success: true,
//         data: salaries
//       });

//     } catch (error) {
//       console.error('Get salaries error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   },

//   // Get salary by ID
//   getSalary: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const hotelId = req.user.hotel_id;

//       const salary = await Salary.findById(id, hotelId);
//       if (!salary) {
//         return res.status(404).json({
//           success: false,
//           error: 'SALARY_NOT_FOUND',
//           message: 'Salary record not found'
//         });
//       }

//       res.json({
//         success: true,
//         data: salary
//       });

//     } catch (error) {
//       console.error('Get salary error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   },

//   // Update salary record
//   updateSalary: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const hotelId = req.user.hotel_id;
//       const { 
//         basic_salary,
//         allowances,
//         deductions,
//         net_salary,
//         payment_date,
//         payment_method,
//         status,
//         remarks
//       } = req.body;

//       // Calculate net salary
//       const calculatedNetSalary = parseFloat(basic_salary || 0) + 
//                                  parseFloat(allowances || 0) - 
//                                  parseFloat(deductions || 0);

//       const finalNetSalary = net_salary || calculatedNetSalary;

//       const updated = await Salary.update(id, hotelId, {
//         basic_salary: parseFloat(basic_salary || 0),
//         allowances: parseFloat(allowances || 0),
//         deductions: parseFloat(deductions || 0),
//         net_salary: parseFloat(finalNetSalary),
//         payment_date,
//         payment_method: payment_method || 'cash',
//         status: status || 'paid',
//         remarks: remarks || ''
//       });

//       if (!updated) {
//         return res.status(404).json({
//           success: false,
//           error: 'SALARY_NOT_FOUND',
//           message: 'Salary record not found'
//         });
//       }

//       res.json({
//         success: true,
//         message: 'Salary record updated successfully'
//       });

//     } catch (error) {
//       console.error('Update salary error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   },

//   // Delete salary record
//   deleteSalary: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const hotelId = req.user.hotel_id;

//       const deleted = await Salary.delete(id, hotelId);
//       if (!deleted) {
//         return res.status(404).json({
//           success: false,
//           error: 'SALARY_NOT_FOUND',
//           message: 'Salary record not found'
//         });
//       }

//       res.json({
//         success: true,
//         message: 'Salary record deleted successfully'
//       });

//     } catch (error) {
//       console.error('Delete salary error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   },

//   // Get salary statistics
//   getSalaryStats: async (req, res) => {
//     try {
//       const hotelId = req.user.hotel_id;
//       const { startDate, endDate } = req.query;

//       const stats = await Salary.getStats(hotelId, startDate, endDate);

//       res.json({
//         success: true,
//         data: stats
//       });

//     } catch (error) {
//       console.error('Get salary stats error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   },

//   // Get employees for salary
//   getEmployeesForSalary: async (req, res) => {
//     try {
//       const hotelId = req.user.hotel_id;
//       const employees = await Salary.getEmployeesForSalary(hotelId);

//       res.json({
//         success: true,
//         data: employees
//       });

//     } catch (error) {
//       console.error('Get employees for salary error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'SERVER_ERROR',
//         message: 'Internal server error'
//       });
//     }
//   }
// };

// module.exports = salaryController;


const Salary = require('../models/Salary');

const salaryController = {
  // Create new salary record
  createSalary: async (req, res) => {
    try {
      const { 
        user_id,
        employee_name,
        designation,
        salary_month,
        basic_salary,
        allowances,
        deductions,
        net_salary,
        payment_date,
        payment_method,
        status,
        remarks
      } = req.body;
      
      const hotelId = req.user.hotel_id;
      const created_by = req.user.id;

      // Validate required fields
      if (!employee_name || !designation || !salary_month || !payment_date) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Please fill all required fields'
        });
      }

      // Calculate net salary if not provided
      const calculatedNetSalary = (parseFloat(basic_salary || 0) + 
                                   parseFloat(allowances || 0) - 
                                   parseFloat(deductions || 0)).toFixed(2);

      const finalNetSalary = net_salary || calculatedNetSalary;

      const salaryId = await Salary.create({
        hotel_id: hotelId,
        user_id: user_id || null,
        employee_name,
        designation,
        salary_month,
        basic_salary: parseFloat(basic_salary || 0),
        allowances: parseFloat(allowances || 0),
        deductions: parseFloat(deductions || 0),
        net_salary: parseFloat(finalNetSalary),
        payment_date,
        payment_method: payment_method || 'cash',
        status: status || 'paid',
        remarks: remarks || '',
        created_by
      });

      res.status(201).json({
        success: true,
        message: 'Salary record created successfully',
        data: { salaryId }
      });

    } catch (error) {
      console.error('Create salary error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get all salary records for hotel
  getSalaries: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      
      if (!hotelId) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Hotel ID is required'
        });
      }

      const { 
        user_id, 
        status, 
        startDate, 
        endDate,
        search 
      } = req.query;

      const filters = {};
      
      if (user_id) filters.user_id = user_id;
      if (status && status !== 'all') filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (search) filters.search = search;

      console.log('Fetching salaries for hotel:', hotelId, 'with filters:', filters);
      
      const salaries = await Salary.findByHotel(hotelId, filters);

      res.json({
        success: true,
        data: salaries,
        count: salaries.length
      });

    } catch (error) {
      console.error('Get salaries error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get salary by ID
  getSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const salary = await Salary.findById(id, hotelId);
      if (!salary) {
        return res.status(404).json({
          success: false,
          error: 'SALARY_NOT_FOUND',
          message: 'Salary record not found'
        });
      }

      res.json({
        success: true,
        data: salary
      });

    } catch (error) {
      console.error('Get salary error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Update salary record
  updateSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { 
        basic_salary,
        allowances,
        deductions,
        net_salary,
        payment_date,
        payment_method,
        status,
        remarks
      } = req.body;

      // Calculate net salary
      const calculatedNetSalary = (parseFloat(basic_salary || 0) + 
                                   parseFloat(allowances || 0) - 
                                   parseFloat(deductions || 0)).toFixed(2);

      const finalNetSalary = net_salary || calculatedNetSalary;

      const updated = await Salary.update(id, hotelId, {
        basic_salary: parseFloat(basic_salary || 0),
        allowances: parseFloat(allowances || 0),
        deductions: parseFloat(deductions || 0),
        net_salary: parseFloat(finalNetSalary),
        payment_date,
        payment_method: payment_method || 'cash',
        status: status || 'paid',
        remarks: remarks || ''
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'SALARY_NOT_FOUND',
          message: 'Salary record not found'
        });
      }

      res.json({
        success: true,
        message: 'Salary record updated successfully'
      });

    } catch (error) {
      console.error('Update salary error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Delete salary record
  deleteSalary: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const deleted = await Salary.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'SALARY_NOT_FOUND',
          message: 'Salary record not found'
        });
      }

      res.json({
        success: true,
        message: 'Salary record deleted successfully'
      });

    } catch (error) {
      console.error('Delete salary error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get salary statistics
  getSalaryStats: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { startDate, endDate } = req.query;

      const stats = await Salary.getStats(hotelId, startDate, endDate);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get salary stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get employees for salary
  getEmployeesForSalary: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const employees = await Salary.getEmployeesForSalary(hotelId);

      res.json({
        success: true,
        data: employees
      });

    } catch (error) {
      console.error('Get employees for salary error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  }
};

module.exports = salaryController;