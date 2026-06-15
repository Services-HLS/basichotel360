const { pool } = require('../config/database');
const transactionQueries = require('../queries/transactionQueries');

class Transaction {
  // Create new transaction
  static async create(transactionData) {
    const [result] = await pool.execute(
      transactionQueries.CREATE_TRANSACTION,
      [
        transactionData.hotel_id,
        transactionData.booking_id || null,
        transactionData.advance_booking_id || null,
        transactionData.customer_id || null,
        transactionData.transaction_id,
        parseFloat(transactionData.amount || 0),
        transactionData.currency || 'INR',
        transactionData.payment_method || 'online',
        transactionData.payment_gateway || null,
        transactionData.upi_id || null,
        transactionData.upi_transaction_id || null,
        transactionData.card_last4 || null,
        transactionData.card_type || null,
        transactionData.card_network || null,
        transactionData.status || 'pending',
        transactionData.status_message || null,
        transactionData.gateway_transaction_id || null,
        transactionData.gateway_response ? JSON.stringify(transactionData.gateway_response) : null,
        transactionData.metadata ? JSON.stringify(transactionData.metadata) : null
      ]
    );
    return result.insertId;
  }

  // Find transaction by ID
  static async findById(id, hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTION_BY_ID,
      [id, hotelId]
    );
    return rows[0];
  }

  // Find transaction by transaction_id
  static async findByTransactionId(transactionId, hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTION_BY_TRANSACTION_ID,
      [transactionId, hotelId]
    );
    return rows[0];
  }

  // Get transactions by hotel with pagination
  static async findByHotel(hotelId, limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTIONS_BY_HOTEL,
      [hotelId, limit, offset]
    );
    return rows;
  }

   // NEW METHOD: Get transactions by advance booking
  static async findByAdvanceBooking(advanceBookingId, hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTIONS_BY_ADVANCE_BOOKING,
      [advanceBookingId, hotelId]
    );
    return rows;
  }

  // Get transactions by booking
  static async findByBooking(bookingId, hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTIONS_BY_BOOKING,
      [bookingId, hotelId]
    );
    return rows;
  }

  // Get transactions by customer
  static async findByCustomer(customerId, hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTIONS_BY_CUSTOMER,
      [customerId, hotelId]
    );
    return rows;
  }

  // Get transactions by status
  static async findByStatus(hotelId, status) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTIONS_BY_STATUS,
      [hotelId, status]
    );
    return rows;
  }

  // Get transactions by date range
  static async findByDateRange(hotelId, startDate, endDate) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTIONS_BY_DATE_RANGE,
      [hotelId, startDate, endDate]
    );
    return rows;
  }

  // Update transaction status
  static async updateStatus(id, hotelId, statusData) {
    const [result] = await pool.execute(
      transactionQueries.UPDATE_TRANSACTION_STATUS,
      [
        statusData.status,
        statusData.status_message || null,
        statusData.gateway_transaction_id || null,
        statusData.gateway_response ? JSON.stringify(statusData.gateway_response) : null,
        id,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  // Update UPI transaction
  static async updateUPITransaction(transactionId, hotelId, upiData) {
    const [result] = await pool.execute(
      transactionQueries.UPDATE_UPI_TRANSACTION,
      [
        upiData.upi_transaction_id,
        upiData.status,
        upiData.status_message,
        transactionId,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  // Process refund
  static async processRefund(id, hotelId, refundData) {
    const [result] = await pool.execute(
      transactionQueries.PROCESS_REFUND,
      [
        refundData.refund_id,
        parseFloat(refundData.refund_amount || 0),
        refundData.refund_reason || '',
        id,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  // Get transaction statistics
  static async getStats(hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_TRANSACTION_STATS,
      [hotelId]
    );
    return rows[0];
  }

  // Get monthly revenue
  static async getMonthlyRevenue(hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_MONTHLY_REVENUE,
      [hotelId]
    );
    return rows;
  }

  // Get payment method statistics
  static async getPaymentMethodStats(hotelId) {
    const [rows] = await pool.execute(
      transactionQueries.GET_PAYMENT_METHOD_STATS,
      [hotelId]
    );
    return rows;
  }

  // Search transactions
  static async search(hotelId, searchTerm, limit = 50, offset = 0) {
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.execute(
      transactionQueries.SEARCH_TRANSACTIONS,
      [hotelId, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]
    );
    return rows;
  }

  // Get total count for pagination
  static async getCount(hotelId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM transactions WHERE hotel_id = ?',
      [hotelId]
    );
    return rows[0].total;
  }

  // Get successful transactions summary
  static async getSuccessfulSummary(hotelId, days = 30) {
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as count,
        SUM(amount) as total,
        DATE(created_at) as date
       FROM transactions 
       WHERE hotel_id = ? 
       AND status = 'success'
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [hotelId, days]
    );
    return rows;
  }

  static async getAdvancePaymentSummary(hotelId, days = 30) {
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as advance_payment_count,
        SUM(amount) as total_advance_collected,
        AVG(amount) as average_advance_amount,
        SUM(CASE WHEN ab.status = 'converted' THEN 1 ELSE 0 END) as converted_count,
        SUM(CASE WHEN ab.status = 'expired' THEN 1 ELSE 0 END) as expired_count
       FROM transactions t
       JOIN advance_bookings ab ON t.advance_booking_id = ab.id
       WHERE t.hotel_id = ? 
       AND t.advance_booking_id IS NOT NULL
       AND t.status = 'success'
       AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [hotelId, days]
    );
    return rows[0];
  }
}

module.exports = Transaction;