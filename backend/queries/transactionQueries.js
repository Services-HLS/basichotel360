// const transactionQueries = {
//   // Create new transaction
//   CREATE_TRANSACTION: `
//     INSERT INTO transactions (
//       hotel_id, booking_id, customer_id, transaction_id, amount, currency,
//       payment_method, payment_gateway, upi_id, upi_transaction_id,
//       card_last4, card_type, card_network, status, status_message,
//       gateway_transaction_id, gateway_response, metadata
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `,

//   // Get transaction by ID
//   GET_TRANSACTION_BY_ID: `
//     SELECT t.*, 
//            b.room_id,
//            r.room_number,
//            c.name as customer_name,
//            c.phone as customer_phone
//     FROM transactions t
//     LEFT JOIN bookings b ON t.booking_id = b.id
//     LEFT JOIN rooms r ON b.room_id = r.id
//     LEFT JOIN customers c ON t.customer_id = c.id
//     WHERE t.id = ? AND t.hotel_id = ?
//   `,

//   // Get transaction by transaction_id
//   GET_TRANSACTION_BY_TRANSACTION_ID: `
//     SELECT * FROM transactions 
//     WHERE transaction_id = ? AND hotel_id = ?
//   `,

//   // Get transactions by hotel
//   GET_TRANSACTIONS_BY_HOTEL: `
//     SELECT t.*, 
//            b.room_id,
//            r.room_number,
//            c.name as customer_name,
//            c.phone as customer_phone
//     FROM transactions t
//     LEFT JOIN bookings b ON t.booking_id = b.id
//     LEFT JOIN rooms r ON b.room_id = r.id
//     LEFT JOIN customers c ON t.customer_id = c.id
//     WHERE t.hotel_id = ?
//     ORDER BY t.created_at DESC
//     LIMIT ?
//     OFFSET ?
//   `,

//   // Get transactions by booking
//   GET_TRANSACTIONS_BY_BOOKING: `
//     SELECT * FROM transactions 
//     WHERE booking_id = ? AND hotel_id = ?
//     ORDER BY created_at DESC
//   `,

//   // Get transactions by customer
//   GET_TRANSACTIONS_BY_CUSTOMER: `
//     SELECT t.*, 
//            b.room_id,
//            r.room_number
//     FROM transactions t
//     LEFT JOIN bookings b ON t.booking_id = b.id
//     LEFT JOIN rooms r ON b.room_id = r.id
//     WHERE t.customer_id = ? AND t.hotel_id = ?
//     ORDER BY t.created_at DESC
//   `,

//   // Get transactions by status
//   GET_TRANSACTIONS_BY_STATUS: `
//     SELECT t.*, 
//            b.room_id,
//            r.room_number,
//            c.name as customer_name
//     FROM transactions t
//     LEFT JOIN bookings b ON t.booking_id = b.id
//     LEFT JOIN rooms r ON b.room_id = r.id
//     LEFT JOIN customers c ON t.customer_id = c.id
//     WHERE t.hotel_id = ? AND t.status = ?
//     ORDER BY t.created_at DESC
//   `,

//   // Get transactions by date range
//   GET_TRANSACTIONS_BY_DATE_RANGE: `
//     SELECT t.*, 
//            b.room_id,
//            r.room_number,
//            c.name as customer_name
//     FROM transactions t
//     LEFT JOIN bookings b ON t.booking_id = b.id
//     LEFT JOIN rooms r ON b.room_id = r.id
//     LEFT JOIN customers c ON t.customer_id = c.id
//     WHERE t.hotel_id = ? 
//     AND DATE(t.created_at) BETWEEN ? AND ?
//     ORDER BY t.created_at DESC
//   `,

//   // Update transaction status
//   UPDATE_TRANSACTION_STATUS: `
//     UPDATE transactions SET 
//       status = ?, 
//       status_message = ?,
//       gateway_transaction_id = ?,
//       gateway_response = ?,
//       updated_at = CURRENT_TIMESTAMP
//     WHERE id = ? AND hotel_id = ?
//   `,

//   // Update UPI transaction
//   UPDATE_UPI_TRANSACTION: `
//     UPDATE transactions SET 
//       upi_transaction_id = ?,
//       status = ?,
//       status_message = ?,
//       updated_at = CURRENT_TIMESTAMP
//     WHERE transaction_id = ? AND hotel_id = ?
//   `,

//   // Process refund
//   PROCESS_REFUND: `
//     UPDATE transactions SET 
//       status = 'refunded',
//       refund_id = ?,
//       refund_amount = ?,
//       refund_date = CURRENT_TIMESTAMP,
//       refund_reason = ?,
//       updated_at = CURRENT_TIMESTAMP
//     WHERE id = ? AND hotel_id = ?
//   `,

//   // Get transaction statistics
//   GET_TRANSACTION_STATS: `
//     SELECT 
//       COUNT(*) as total_transactions,
//       SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_received,
//       SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunded,
//       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
//       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
//       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
//       AVG(CASE WHEN status = 'success' THEN amount ELSE NULL END) as average_transaction_amount
//     FROM transactions 
//     WHERE hotel_id = ?
//     AND DATE(created_at) = CURDATE()
//   `,

//   // Get monthly revenue
//   GET_MONTHLY_REVENUE: `
//     SELECT 
//       DATE_FORMAT(created_at, '%Y-%m') as month,
//       COUNT(*) as transaction_count,
//       SUM(amount) as total_amount,
//       SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as successful_amount
//     FROM transactions 
//     WHERE hotel_id = ?
//     AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
//     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
//     ORDER BY month DESC
//   `,

//   // Get payment method statistics
//   GET_PAYMENT_METHOD_STATS: `
//     SELECT 
//       payment_method,
//       COUNT(*) as transaction_count,
//       SUM(amount) as total_amount,
//       AVG(amount) as average_amount
//     FROM transactions 
//     WHERE hotel_id = ?
//     AND status = 'success'
//     GROUP BY payment_method
//   `,

//   // Search transactions
//   SEARCH_TRANSACTIONS: `
//     SELECT t.*, 
//            b.room_id,
//            r.room_number,
//            c.name as customer_name,
//            c.phone as customer_phone
//     FROM transactions t
//     LEFT JOIN bookings b ON t.booking_id = b.id
//     LEFT JOIN rooms r ON b.room_id = r.id
//     LEFT JOIN customers c ON t.customer_id = c.id
//     WHERE t.hotel_id = ?
//     AND (
//       t.transaction_id LIKE ? OR
//       c.name LIKE ? OR
//       c.phone LIKE ? OR
//       t.gateway_transaction_id LIKE ?
//     )
//     ORDER BY t.created_at DESC
//     LIMIT ?
//     OFFSET ?
//   `,
// };

// module.exports = transactionQueries;

const transactionQueries = {
  // Create new transaction - UPDATED to include advance_booking_id
  CREATE_TRANSACTION: `
    INSERT INTO transactions (
      hotel_id, booking_id, advance_booking_id, customer_id, transaction_id, amount, currency,
      payment_method, payment_gateway, upi_id, upi_transaction_id,
      card_last4, card_type, card_network, status, status_message,
      gateway_transaction_id, gateway_response, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  // Get transaction by ID - UPDATED to include advance_booking_id
  GET_TRANSACTION_BY_ID: `
    SELECT t.*, 
           b.room_id,
           r.room_number,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number,
           ab.status as advance_status,
           ab.advance_amount,
           ab.remaining_amount,
           ab.advance_expiry_date,
           c.name as customer_name,
           c.phone as customer_phone
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.id = ? AND t.hotel_id = ?
  `,

  // Get transaction by transaction_id - UPDATED to include advance_booking_id
  GET_TRANSACTION_BY_TRANSACTION_ID: `
    SELECT t.*,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number,
           ab.status as advance_status
    FROM transactions t
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    WHERE t.transaction_id = ? AND t.hotel_id = ?
  `,

  // Get transactions by hotel - UPDATED to include advance_booking_id
  GET_TRANSACTIONS_BY_HOTEL: `
    SELECT t.*, 
           b.room_id,
           r.room_number,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number,
           ab.status as advance_status,
           ab.advance_amount,
           c.name as customer_name,
           c.phone as customer_phone
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.hotel_id = ?
    ORDER BY t.created_at DESC
    LIMIT ?
    OFFSET ?
  `,

  // Get transactions by advance booking - NEW QUERY
  GET_TRANSACTIONS_BY_ADVANCE_BOOKING: `
    SELECT * FROM transactions 
    WHERE advance_booking_id = ? AND hotel_id = ?
    ORDER BY created_at DESC
  `,

  // Get transactions by booking
  GET_TRANSACTIONS_BY_BOOKING: `
    SELECT * FROM transactions 
    WHERE booking_id = ? AND hotel_id = ?
    ORDER BY created_at DESC
  `,

  // Get transactions by customer - UPDATED to include advance_booking_id
  GET_TRANSACTIONS_BY_CUSTOMER: `
    SELECT t.*, 
           b.room_id,
           r.room_number,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE t.customer_id = ? AND t.hotel_id = ?
    ORDER BY t.created_at DESC
  `,

  // Get transactions by status - UPDATED to include advance_booking_id
  GET_TRANSACTIONS_BY_STATUS: `
    SELECT t.*, 
           b.room_id,
           r.room_number,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number,
           c.name as customer_name
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.hotel_id = ? AND t.status = ?
    ORDER BY t.created_at DESC
  `,

  // Get transactions by date range - UPDATED to include advance_booking_id
  GET_TRANSACTIONS_BY_DATE_RANGE: `
    SELECT t.*, 
           b.room_id,
           r.room_number,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number,
           c.name as customer_name
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.hotel_id = ? 
    AND DATE(t.created_at) BETWEEN ? AND ?
    ORDER BY t.created_at DESC
  `,

  // Update transaction status - unchanged
  UPDATE_TRANSACTION_STATUS: `
    UPDATE transactions SET 
      status = ?, 
      status_message = ?,
      gateway_transaction_id = ?,
      gateway_response = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND hotel_id = ?
  `,

  // Update UPI transaction - unchanged
  UPDATE_UPI_TRANSACTION: `
    UPDATE transactions SET 
      upi_transaction_id = ?,
      status = ?,
      status_message = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE transaction_id = ? AND hotel_id = ?
  `,

  // Process refund - unchanged
  PROCESS_REFUND: `
    UPDATE transactions SET 
      status = 'refunded',
      refund_id = ?,
      refund_amount = ?,
      refund_date = CURRENT_TIMESTAMP,
      refund_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND hotel_id = ?
  `,

  // Get transaction statistics - UPDATED to separate regular and advance
  GET_TRANSACTION_STATS: `
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN booking_id IS NOT NULL AND status = 'success' THEN amount ELSE 0 END) as regular_booking_revenue,
      SUM(CASE WHEN advance_booking_id IS NOT NULL AND status = 'success' THEN amount ELSE 0 END) as advance_booking_revenue,
      SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_received,
      SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunded,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
      AVG(CASE WHEN status = 'success' THEN amount ELSE NULL END) as average_transaction_amount
    FROM transactions 
    WHERE hotel_id = ?
    AND DATE(created_at) = CURDATE()
  `,

  // Get monthly revenue - UPDATED to separate regular and advance
  GET_MONTHLY_REVENUE: `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as transaction_count,
      SUM(amount) as total_amount,
      SUM(CASE WHEN booking_id IS NOT NULL AND status = 'success' THEN amount ELSE 0 END) as regular_booking_amount,
      SUM(CASE WHEN advance_booking_id IS NOT NULL AND status = 'success' THEN amount ELSE 0 END) as advance_booking_amount,
      SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as successful_amount
    FROM transactions 
    WHERE hotel_id = ?
    AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
  `,

  // Get payment method statistics - UPDATED to include type
  GET_PAYMENT_METHOD_STATS: `
    SELECT 
      payment_method,
      COUNT(*) as transaction_count,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount,
      SUM(CASE WHEN booking_id IS NOT NULL THEN 1 ELSE 0 END) as regular_booking_count,
      SUM(CASE WHEN advance_booking_id IS NOT NULL THEN 1 ELSE 0 END) as advance_booking_count
    FROM transactions 
    WHERE hotel_id = ?
    AND status = 'success'
    GROUP BY payment_method
  `,

  // Search transactions - UPDATED to include advance_booking_id
  SEARCH_TRANSACTIONS: `
    SELECT t.*, 
           b.room_id,
           r.room_number,
           ab.id as advance_booking_id,
           ab.invoice_number as advance_invoice_number,
           c.name as customer_name,
           c.phone as customer_phone
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    LEFT JOIN advance_bookings ab ON t.advance_booking_id = ab.id
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.hotel_id = ?
    AND (
      t.transaction_id LIKE ? OR
      c.name LIKE ? OR
      c.phone LIKE ? OR
      t.gateway_transaction_id LIKE ? OR
      ab.invoice_number LIKE ?
    )
    ORDER BY t.created_at DESC
    LIMIT ?
    OFFSET ?
  `,
};

module.exports = transactionQueries;