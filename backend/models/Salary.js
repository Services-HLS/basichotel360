// const { pool } = require('../config/database');

// class Salary {
//   static async create(salaryData) {
//     const [result] = await pool.execute(
//       `INSERT INTO salaries (
//         hotel_id, user_id, employee_name, designation,
//         salary_month, basic_salary, allowances, deductions,
//         net_salary, payment_date, payment_method, status,
//         remarks, created_by
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         salaryData.hotel_id,
//         salaryData.user_id,
//         salaryData.employee_name,
//         salaryData.designation,
//         salaryData.salary_month,
//         parseFloat(salaryData.basic_salary || 0),
//         parseFloat(salaryData.allowances || 0),
//         parseFloat(salaryData.deductions || 0),
//         parseFloat(salaryData.net_salary || 0),
//         salaryData.payment_date,
//         salaryData.payment_method || 'cash',
//         salaryData.status || 'paid',
//         salaryData.remarks || '',
//         salaryData.created_by || null
//       ]
//     );
//     return result.insertId;
//   }

//   static async findById(id, hotelId) {
//     const [rows] = await pool.execute(
//       `SELECT s.*, u1.name as employee_name, u2.name as created_by_name 
//        FROM salaries s 
//        LEFT JOIN users u1 ON s.user_id = u1.id
//        LEFT JOIN users u2 ON s.created_by = u2.id
//        WHERE s.id = ? AND s.hotel_id = ?`,
//       [id, hotelId]
//     );
//     return rows[0];
//   }

//   static async findByHotel(hotelId, filters = {}) {
//     let query = `
//       SELECT s.*, u1.name as employee_name, u2.name as created_by_name 
//       FROM salaries s 
//       LEFT JOIN users u1 ON s.user_id = u1.id
//       LEFT JOIN users u2 ON s.created_by = u2.id
//       WHERE s.hotel_id = ?
//     `;
//     const params = [hotelId];

//     if (filters.user_id) {
//       query += ' AND s.user_id = ?';
//       params.push(filters.user_id);
//     }

//     if (filters.status) {
//       query += ' AND s.status = ?';
//       params.push(filters.status);
//     }

//     if (filters.startDate && filters.endDate) {
//       query += ' AND s.salary_month BETWEEN ? AND ?';
//       params.push(filters.startDate, filters.endDate);
//     }

//     query += ' ORDER BY s.salary_month DESC, s.created_at DESC';
    
//     const [rows] = await pool.execute(query, params);
//     return rows;
//   }

//   static async update(id, hotelId, salaryData) {
//     const [result] = await pool.execute(
//       `UPDATE salaries SET 
//         basic_salary = ?, allowances = ?, deductions = ?,
//         net_salary = ?, payment_date = ?, payment_method = ?,
//         status = ?, remarks = ?
//        WHERE id = ? AND hotel_id = ?`,
//       [
//         parseFloat(salaryData.basic_salary || 0),
//         parseFloat(salaryData.allowances || 0),
//         parseFloat(salaryData.deductions || 0),
//         parseFloat(salaryData.net_salary || 0),
//         salaryData.payment_date,
//         salaryData.payment_method || 'cash',
//         salaryData.status || 'paid',
//         salaryData.remarks || '',
//         id,
//         hotelId
//       ]
//     );
//     return result.affectedRows > 0;
//   }

//   static async delete(id, hotelId) {
//     const [result] = await pool.execute(
//       'DELETE FROM salaries WHERE id = ? AND hotel_id = ?',
//       [id, hotelId]
//     );
//     return result.affectedRows > 0;
//   }

//   static async getStats(hotelId, startDate = null, endDate = null) {
//     let query = `
//       SELECT 
//         COUNT(*) as total_salaries,
//         SUM(net_salary) as total_amount,
//         status,
//         MONTH(salary_month) as month,
//         YEAR(salary_month) as year
//       FROM salaries 
//       WHERE hotel_id = ?
//     `;
//     const params = [hotelId];

//     if (startDate && endDate) {
//       query += ' AND salary_month BETWEEN ? AND ?';
//       params.push(startDate, endDate);
//     }

//     query += ' GROUP BY status, MONTH(salary_month), YEAR(salary_month) ORDER BY year DESC, month DESC';
    
//     const [rows] = await pool.execute(query, params);
//     return rows;
//   }

//   static async getEmployeesForSalary(hotelId) {
//     const [rows] = await pool.execute(
//       `SELECT id, name, email, phone, role as designation 
//        FROM users 
//        WHERE hotel_id = ? AND status = 'active' 
//        ORDER BY name`,
//       [hotelId]
//     );
//     return rows;
//   }
// }

// module.exports = Salary;

const { pool } = require('../config/database');

class Salary {
  static async create(salaryData) {
    try {
      const query = `
        INSERT INTO salaries (
          hotel_id, user_id, employee_name, designation,
          salary_month, basic_salary, allowances, deductions,
          net_salary, payment_date, payment_method, status,
          remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        salaryData.hotel_id,
        salaryData.user_id,
        salaryData.employee_name,
        salaryData.designation,
        salaryData.salary_month,
        parseFloat(salaryData.basic_salary || 0),
        parseFloat(salaryData.allowances || 0),
        parseFloat(salaryData.deductions || 0),
        parseFloat(salaryData.net_salary || 0),
        salaryData.payment_date,
        salaryData.payment_method || 'cash',
        salaryData.status || 'paid',
        salaryData.remarks || '',
        salaryData.created_by || null
      ];

      const [result] = await pool.query(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Error in Salary.create:', error);
      throw error;
    }
  }

  static async findById(id, hotelId) {
    try {
      const query = `
        SELECT s.*, 
               COALESCE(u1.name, s.employee_name) as employee_name, 
               u2.name as created_by_name 
        FROM salaries s 
        LEFT JOIN users u1 ON s.user_id = u1.id
        LEFT JOIN users u2 ON s.created_by = u2.id
        WHERE s.id = ? AND s.hotel_id = ?
      `;
      
      const [rows] = await pool.query(query, [id, hotelId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in Salary.findById:', error);
      throw error;
    }
  }

  static async findByHotel(hotelId, filters = {}) {
    try {
      let query = `
        SELECT s.*, 
               COALESCE(u1.name, s.employee_name) as employee_name, 
               u2.name as created_by_name 
        FROM salaries s 
        LEFT JOIN users u1 ON s.user_id = u1.id
        LEFT JOIN users u2 ON s.created_by = u2.id
        WHERE s.hotel_id = ?
      `;
      
      const values = [hotelId];

      // Add filters
      if (filters.user_id) {
        query += ' AND s.user_id = ?';
        values.push(filters.user_id);
      }

      if (filters.status && filters.status !== 'all') {
        query += ' AND s.status = ?';
        values.push(filters.status);
      }

      if (filters.startDate) {
        query += ' AND s.salary_month >= ?';
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND s.salary_month <= ?';
        values.push(filters.endDate);
      }

      if (filters.search) {
        query += ' AND (s.employee_name LIKE ? OR s.designation LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        values.push(searchTerm, searchTerm);
      }

      query += ' ORDER BY s.salary_month DESC, s.created_at DESC';
      
      const [rows] = await pool.query(query, values);
      return rows || [];

    } catch (error) {
      console.error('Error in Salary.findByHotel:', error);
      console.error('HotelId:', hotelId);
      console.error('Filters:', filters);
      throw error;
    }
  }

  static async update(id, hotelId, salaryData) {
    try {
      const query = `
        UPDATE salaries SET 
          basic_salary = ?, 
          allowances = ?, 
          deductions = ?,
          net_salary = ?, 
          payment_date = ?, 
          payment_method = ?,
          status = ?, 
          remarks = ?,
          updated_at = NOW()
        WHERE id = ? AND hotel_id = ?
      `;
      
      const values = [
        parseFloat(salaryData.basic_salary || 0),
        parseFloat(salaryData.allowances || 0),
        parseFloat(salaryData.deductions || 0),
        parseFloat(salaryData.net_salary || 0),
        salaryData.payment_date,
        salaryData.payment_method || 'cash',
        salaryData.status || 'paid',
        salaryData.remarks || '',
        id,
        hotelId
      ];

      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Salary.update:', error);
      throw error;
    }
  }

  static async delete(id, hotelId) {
    try {
      const query = 'DELETE FROM salaries WHERE id = ? AND hotel_id = ?';
      const [result] = await pool.query(query, [id, hotelId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Salary.delete:', error);
      throw error;
    }
  }

  static async getStats(hotelId, startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_salaries,
          COALESCE(SUM(net_salary), 0) as total_amount,
          status,
          MONTH(salary_month) as month,
          YEAR(salary_month) as year
        FROM salaries 
        WHERE hotel_id = ?
      `;
      
      const values = [hotelId];

      if (startDate) {
        query += ' AND salary_month >= ?';
        values.push(startDate);
      }

      if (endDate) {
        query += ' AND salary_month <= ?';
        values.push(endDate);
      }

      query += ' GROUP BY status, MONTH(salary_month), YEAR(salary_month) ORDER BY year DESC, month DESC';
      
      const [rows] = await pool.query(query, values);
      return rows || [];
    } catch (error) {
      console.error('Error in Salary.getStats:', error);
      throw error;
    }
  }

  static async getEmployeesForSalary(hotelId) {
    try {
      const query = `
        SELECT id, name, email, phone, role as designation 
        FROM users 
        WHERE hotel_id = ? AND status = 'active' 
        ORDER BY name
      `;
      
      const [rows] = await pool.query(query, [hotelId]);
      return rows || [];
    } catch (error) {
      console.error('Error in Salary.getEmployeesForSalary:', error);
      throw error;
    }
  }
}

module.exports = Salary;