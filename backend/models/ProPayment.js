const { pool } = require('../config/database');
const proPaymentQueries = require('../queries/proPaymentQueries');

class ProPayment {
  // Create new PRO plan payment
  static async create(paymentData) {
    const [result] = await pool.execute(
      proPaymentQueries.CREATE_PRO_PAYMENT,
      [
        paymentData.hotel_id || null,
        paymentData.hotel_name || null,
        paymentData.admin_name || null,
        paymentData.admin_email || null,
        paymentData.admin_phone || null,
        paymentData.razorpay_order_id || null,
        paymentData.razorpay_payment_id || null,
        paymentData.razorpay_signature || null,
        parseFloat(paymentData.amount || 0),
        paymentData.currency || 'INR',
        paymentData.plan_type || 'pro',
        paymentData.payment_status || 'pending',
        paymentData.payment_method || null,
        paymentData.gateway_response ? JSON.stringify(paymentData.gateway_response) : null,
        paymentData.metadata ? JSON.stringify(paymentData.metadata) : null
      ]
    );
    return result.insertId;
  }

  // Find payment by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENT_BY_ID,
      [id]
    );
    return rows[0];
  }

  // Find payment by Razorpay payment ID
  static async findByRazorpayPaymentId(razorpayPaymentId) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENT_BY_RAZORPAY_PAYMENT_ID,
      [razorpayPaymentId]
    );
    return rows[0];
  }

  // Find payment by Razorpay order ID
  static async findByRazorpayOrderId(razorpayOrderId) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENT_BY_RAZORPAY_ORDER_ID,
      [razorpayOrderId]
    );
    return rows[0];
  }

  // Get payments by hotel ID
  static async findByHotelId(hotelId) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENTS_BY_HOTEL,
      [hotelId]
    );
    return rows;
  }

  // Get payments by email
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENTS_BY_EMAIL,
      [email]
    );
    return rows;
  }

  // Get payments by status
  static async findByStatus(status) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENTS_BY_STATUS,
      [status]
    );
    return rows;
  }

  // Get payments by date range
  static async findByDateRange(startDate, endDate) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENTS_BY_DATE_RANGE,
      [startDate, endDate]
    );
    return rows;
  }

  // Update payment status
  static async updateStatus(id, statusData) {
    const [result] = await pool.execute(
      proPaymentQueries.UPDATE_PAYMENT_STATUS,
      [
        statusData.payment_status,
        statusData.gateway_response ? JSON.stringify(statusData.gateway_response) : null,
        statusData.metadata ? JSON.stringify(statusData.metadata) : null,
        id
      ]
    );
    return result.affectedRows > 0;
  }

  // Update payment with Razorpay details
  static async updateWithRazorpay(orderId, razorpayData) {
    const [result] = await pool.execute(
      proPaymentQueries.UPDATE_PAYMENT_WITH_RAZORPAY,
      [
        razorpayData.razorpay_payment_id,
        razorpayData.razorpay_signature,
        razorpayData.payment_status || 'success',
        razorpayData.payment_method || null,
        razorpayData.gateway_response ? JSON.stringify(razorpayData.gateway_response) : null,
        orderId
      ]
    );
    return result.affectedRows > 0;
  }

  // Link payment to hotel after registration
  static async linkToHotel(razorpayPaymentId, hotelId) {
    const [result] = await pool.execute(
      proPaymentQueries.LINK_PAYMENT_TO_HOTEL,
      [hotelId, razorpayPaymentId]
    );
    return result.affectedRows > 0;
  }

  // Get payment statistics
  static async getStats() {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENT_STATS
    );
    return rows[0];
  }

  // Get monthly revenue
  static async getMonthlyRevenue() {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_MONTHLY_REVENUE
    );
    return rows;
  }

  // Search payments
  static async search(searchTerm, limit = 50, offset = 0) {
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.execute(
      proPaymentQueries.SEARCH_PAYMENTS,
      [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]
    );
    return rows;
  }

  // Get total count
  static async getCount() {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENT_COUNT
    );
    return rows[0].total;
  }

  // Get payments by plan type
  static async findByPlanType(planType) {
    const [rows] = await pool.execute(
      proPaymentQueries.GET_PAYMENTS_BY_PLAN,
      [planType]
    );
    return rows;
  }

 
// Find reactivation payment by hotel
static async findReactivationByHotel(hotelId) {
  const [rows] = await pool.execute(
    `SELECT * FROM pro_payments 
     WHERE hotel_id = ? 
     AND plan_type = 'pro_reactivation'
     AND payment_status = 'success'
     ORDER BY created_at DESC
     LIMIT 1`,
    [hotelId]
  );
  return rows[0];
}

// Get reactivation stats
static async getReactivationStats() {
  const [rows] = await pool.execute(
    `SELECT 
      COUNT(*) as total_reactivations,
      SUM(amount) as total_reactivation_revenue,
      MIN(created_at) as first_reactivation,
      MAX(created_at) as latest_reactivation
     FROM pro_payments 
     WHERE plan_type = 'pro_reactivation'
     AND payment_status = 'success'`
  );
  return rows[0];
}


// Add this method to your existing ProPayment class
static async createPaymentLog(paymentLog) {
  const query = `
    INSERT INTO payment_logs (
      url, method, headers, req_body, response_body, status, 
      order_id, razorpay_order_id, razorpay_payment_id, created_ts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(query, [
    paymentLog.url || null,
    paymentLog.method || null,
    paymentLog.headers || null,
    paymentLog.req_body || null,
    paymentLog.response_body || null,
    paymentLog.status || 'PENDING',
    paymentLog.order_id || null,
    paymentLog.razorpay_order_id || null,
    paymentLog.razorpay_payment_id || null,
    paymentLog.created_ts || new Date()
  ]);
  
  return result.insertId;
}
}

module.exports = ProPayment;
