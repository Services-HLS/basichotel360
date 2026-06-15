const proPaymentQueries = {
  // Create new PRO plan payment
  CREATE_PRO_PAYMENT: `
    INSERT INTO pro_payments (
      hotel_id, hotel_name, admin_name, admin_email, admin_phone,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      amount, currency, plan_type, payment_status,
      payment_method, gateway_response, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,

  // Get payment by ID
  GET_PAYMENT_BY_ID: `
    SELECT p.*, h.hotel_name as registered_hotel_name
    FROM pro_payments p
    LEFT JOIN hotels h ON p.hotel_id = h.id
    WHERE p.id = ?
  `,

  // Get payment by Razorpay payment ID
  GET_PAYMENT_BY_RAZORPAY_PAYMENT_ID: `
    SELECT * FROM pro_payments 
    WHERE razorpay_payment_id = ?
  `,

  // Get payment by Razorpay order ID
  GET_PAYMENT_BY_RAZORPAY_ORDER_ID: `
    SELECT * FROM pro_payments 
    WHERE razorpay_order_id = ?
  `,

  // Get payments by hotel ID
  GET_PAYMENTS_BY_HOTEL: `
    SELECT * FROM pro_payments 
    WHERE hotel_id = ?
    ORDER BY created_at DESC
  `,

  // Get payments by email
  GET_PAYMENTS_BY_EMAIL: `
    SELECT * FROM pro_payments 
    WHERE admin_email = ?
    ORDER BY created_at DESC
  `,

  // Get payments by status
  GET_PAYMENTS_BY_STATUS: `
    SELECT * FROM pro_payments 
    WHERE payment_status = ?
    ORDER BY created_at DESC
  `,

  // Get payments by date range
  GET_PAYMENTS_BY_DATE_RANGE: `
    SELECT * FROM pro_payments 
    WHERE DATE(created_at) BETWEEN ? AND ?
    ORDER BY created_at DESC
  `,

  // Update payment status
  UPDATE_PAYMENT_STATUS: `
    UPDATE pro_payments SET 
      payment_status = ?,
      gateway_response = ?,
      metadata = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  // Update payment with Razorpay details
  UPDATE_PAYMENT_WITH_RAZORPAY: `
    UPDATE pro_payments SET 
      razorpay_payment_id = ?,
      razorpay_signature = ?,
      payment_status = ?,
      payment_method = ?,
      gateway_response = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE razorpay_order_id = ?
  `,

  // Link payment to hotel after registration
  LINK_PAYMENT_TO_HOTEL: `
    UPDATE pro_payments SET 
      hotel_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE razorpay_payment_id = ?
  `,

  // Get payment statistics
  GET_PAYMENT_STATS: `
    SELECT 
      COUNT(*) as total_payments,
      SUM(CASE WHEN payment_status = 'success' THEN amount ELSE 0 END) as total_received,
      SUM(CASE WHEN payment_status = 'success' THEN 1 ELSE 0 END) as successful_payments,
      SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
      SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
      AVG(CASE WHEN payment_status = 'success' THEN amount ELSE NULL END) as average_amount
    FROM pro_payments 
    WHERE DATE(created_at) = CURDATE()
  `,

  // Get monthly PRO plan revenue
  GET_MONTHLY_REVENUE: `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as payment_count,
      SUM(amount) as total_amount,
      SUM(CASE WHEN payment_status = 'success' THEN amount ELSE 0 END) as successful_amount
    FROM pro_payments 
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
  `,

  // Search payments
  SEARCH_PAYMENTS: `
    SELECT * FROM pro_payments 
    WHERE (
      hotel_name LIKE ? OR
      admin_name LIKE ? OR
      admin_email LIKE ? OR
      admin_phone LIKE ? OR
      razorpay_order_id LIKE ? OR
      razorpay_payment_id LIKE ?
    )
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `,

  // Get total count for pagination
  GET_PAYMENT_COUNT: `
    SELECT COUNT(*) as total FROM pro_payments
  `,

  // Get payments by plan type
  GET_PAYMENTS_BY_PLAN: `
    SELECT * FROM pro_payments 
    WHERE plan_type = ?
    ORDER BY created_at DESC
  `,
  // In proPaymentQueries.js - Add these new queries

// Get reactivation payment by hotel ID
GET_REACTIVATION_PAYMENT: `
  SELECT * FROM pro_payments 
  WHERE hotel_id = ? 
  AND plan_type = 'pro_reactivation'
  AND payment_status = 'success'
  ORDER BY created_at DESC
  LIMIT 1
`,

// Get total reactivation revenue
GET_REACTIVATION_STATS: `
  SELECT 
    COUNT(*) as total_reactivations,
    SUM(amount) as total_reactivation_revenue,
    MIN(created_at) as first_reactivation,
    MAX(created_at) as latest_reactivation
  FROM pro_payments 
  WHERE plan_type = 'pro_reactivation'
  AND payment_status = 'success'
`,
};

module.exports = proPaymentQueries;
