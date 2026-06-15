

const customerQueries = {
  // Create new customer with all details
  CREATE_CUSTOMER: `INSERT INTO customers (
    hotel_id, name, phone, email, customer_number, id_type, id_number,
    id_image, id_image2, payment_method, payment_status,
    payment_reference, transaction_id, address, city, state, pincode,
    customer_gst_no, purpose_of_visit, other_expenses, expense_description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  // Create customer basic
  CREATE_CUSTOMER_BASIC: `INSERT INTO customers (
    hotel_id, name, phone, email, customer_number
  ) VALUES (?, ?, ?, ?, ?)`,

  // Find customer by ID
  FIND_CUSTOMER_BY_ID: `SELECT * FROM customers WHERE id = ? AND hotel_id = ?`,

  // Get customers by hotel
  GET_CUSTOMERS_BY_HOTEL: `SELECT * FROM customers WHERE hotel_id = ? ORDER BY created_at DESC`,

  // Update customer
  UPDATE_CUSTOMER: `UPDATE customers SET 
    name = ?, phone = ?, email = ?, customer_number = ?, id_type = ?, id_number = ?,
    id_image = ?, id_image2 = ?, payment_method = ?, payment_status = ?,
    payment_reference = ?, transaction_id = ?, address = ?, city = ?, 
    state = ?, pincode = ?, customer_gst_no = ?, purpose_of_visit = ?, 
    other_expenses = ?, expense_description = ?
    WHERE id = ? AND hotel_id = ?`,

  // Update customer basic info
  UPDATE_CUSTOMER_BASIC: `UPDATE customers SET 
    name = ?, phone = ?, email = ?, customer_number = ? 
    WHERE id = ? AND hotel_id = ?`,

  // Delete customer
  DELETE_CUSTOMER: `DELETE FROM customers WHERE id = ? AND hotel_id = ?`,

  // Search customers - updated to search both customer_number and id_number
  SEARCH_CUSTOMERS: `SELECT * FROM customers 
    WHERE hotel_id = ? AND (
      name LIKE ? OR 
      phone LIKE ? OR 
      email LIKE ? OR 
      customer_number LIKE ? OR 
      id_number LIKE ? OR 
      customer_gst_no LIKE ? OR 
      purpose_of_visit LIKE ?
    )`,

  // Get customer stats
  GET_CUSTOMER_STATS: `
    SELECT 
      COUNT(*) as total_customers,
      COUNT(id_number) as customers_with_id_proof,
      COUNT(customer_gst_no) as customers_with_gst
    FROM customers 
    WHERE hotel_id = ?
  `,

  // Get customer with images
  GET_CUSTOMER_WITH_IMAGES: `
    SELECT id, name, phone, email, customer_number, id_type, id_number, 
           id_image, id_image2, created_at, address, city, state, pincode,
           customer_gst_no, purpose_of_visit, other_expenses, expense_description,
           payment_method, payment_status, payment_reference, transaction_id
    FROM customers 
    WHERE id = ? AND hotel_id = ?
  `,

  // Update payment status
  UPDATE_PAYMENT_STATUS: `UPDATE customers SET 
    payment_status = ?, transaction_id = ? 
    WHERE id = ? AND hotel_id = ?`,
};

module.exports = customerQueries;