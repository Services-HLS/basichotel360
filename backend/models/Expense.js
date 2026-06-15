const { pool } = require('../config/database')

class Expense {
  static async create(expenseData) {
    const [result] = await pool.execute(
      `INSERT INTO expenses (
        hotel_id, expense_name, description, category, 
        amount, expense_date, remark, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseData.hotel_id,
        expenseData.expense_name,
        expenseData.description || '',
        expenseData.category || 'other',
        parseFloat(expenseData.amount || 0),
        expenseData.expense_date,
        expenseData.remark || '',
        expenseData.created_by || null
      ]
    );
    return result.insertId;
  }

  static async findById(id, hotelId) {
    const [rows] = await pool.execute(
      `SELECT e.*, u.name as created_by_name 
       FROM expenses e 
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ? AND e.hotel_id = ?`,
      [id, hotelId]
    );
    return rows[0];
  }

  static async findByHotel(hotelId, filters = {}) {
    let query = `
      SELECT e.*, u.name as created_by_name 
      FROM expenses e 
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.hotel_id = ?
    `;
    const params = [hotelId];

    if (filters.category) {
      query += ' AND e.category = ?';
      params.push(filters.category);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND e.expense_date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.search) {
      query += ' AND (e.expense_name LIKE ? OR e.description LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(id, hotelId, expenseData) {
    const [result] = await pool.execute(
      `UPDATE expenses SET 
        expense_name = ?, description = ?, category = ?,
        amount = ?, expense_date = ?, remark = ?
       WHERE id = ? AND hotel_id = ?`,
      [
        expenseData.expense_name,
        expenseData.description || '',
        expenseData.category || 'other',
        parseFloat(expenseData.amount || 0),
        expenseData.expense_date,
        expenseData.remark || '',
        id,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  static async delete(id, hotelId) {
    const [result] = await pool.execute(
      'DELETE FROM expenses WHERE id = ? AND hotel_id = ?',
      [id, hotelId]
    );
    return result.affectedRows > 0;
  }

  static async getStats(hotelId, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as total_expenses,
        SUM(amount) as total_amount,
        category,
        MONTH(expense_date) as month,
        YEAR(expense_date) as year
      FROM expenses 
      WHERE hotel_id = ?
    `;
    const params = [hotelId];

    if (startDate && endDate) {
      query += ' AND expense_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY category, MONTH(expense_date), YEAR(expense_date) ORDER BY year DESC, month DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Expense;