

const { pool } = require('../config/database');
const customerQueries = require('../queries/customerQueries');

class Customer {


 

  // Generate sequential customer number (simple numbers: 1,2,3...)
  static async generateCustomerNumber(hotelId) {
    try {
      console.log(`🔍 Generating customer number for hotel: ${hotelId}`);

      // First, let's see all customer numbers for this hotel (excluding nulls)
      const [allNumbers] = await pool.execute(
        `SELECT customer_number FROM customers WHERE hotel_id = ? AND customer_number IS NOT NULL AND customer_number != '' ORDER BY CAST(customer_number AS UNSIGNED)`,
        [hotelId]
      );
      console.log('📊 All customer numbers for this hotel (excluding nulls):', allNumbers.map(n => n.customer_number));

      // Get the MAX value - explicitly exclude null and empty strings
      const [result] = await pool.execute(
        `SELECT COALESCE(MAX(CAST(customer_number AS UNSIGNED)), 0) as max_number 
       FROM customers 
       WHERE hotel_id = ? 
         AND customer_number IS NOT NULL 
         AND customer_number != ''
         AND customer_number REGEXP '^[0-9]+$'`,
        [hotelId]
      );

      // Ensure maxNumber is treated as a number
      const maxNumber = parseInt(result[0].max_number) || 0;
      console.log(`📈 Max number found: ${maxNumber} (type: ${typeof maxNumber})`);

      // Generate simple sequential number: next number (max + 1)
      // Force numeric addition by using Number()
      const nextNumber = Number(maxNumber) + 1;
      const customerNumber = nextNumber.toString();

      console.log(`✅ Generated customer number: ${customerNumber} (from ${maxNumber} + 1)`);

      return customerNumber;
    } catch (error) {
      console.error('Error generating customer number:', error);

      // Fallback method
      try {
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as count FROM customers WHERE hotel_id = ?`,
          [hotelId]
        );
        const count = parseInt(countResult[0].count) || 0;
        const fallbackNumber = (count + 1).toString();
        console.log(`Using fallback method: ${fallbackNumber}`);
        return fallbackNumber;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw error;
      }
    }
  }

  // Create new customer with full details
  static async create(customerData) {
    // Generate customer number if not provided
    if (!customerData.customer_number) {
      customerData.customer_number = await this.generateCustomerNumber(customerData.hotel_id);
    }

    const [result] = await pool.execute(
      customerQueries.CREATE_CUSTOMER,
      [
        customerData.hotel_id,
        customerData.name,
        customerData.phone,
        customerData.email || '',
        customerData.customer_number, // Simple sequential number (1,2,3...)
        customerData.id_type || 'aadhaar',
        customerData.id_number || null, // This is the actual Aadhaar/PAN number
        customerData.id_image || null,
        customerData.id_image2 || null,
        customerData.payment_method || 'cash',
        customerData.payment_status || 'pending',
        customerData.payment_reference || null,
        customerData.transaction_id || null,
        customerData.address || '',
        customerData.city || '',
        customerData.state || '',
        customerData.pincode || '',
        customerData.customer_gst_no || null,
        customerData.purpose_of_visit || null,
        customerData.other_expenses || 0,
        customerData.expense_description || null
      ]
    );
    return result.insertId;
  }

  // Create customer basic (for backward compatibility)
  static async createBasic(customerData) {
    if (!customerData.customer_number) {
      customerData.customer_number = await this.generateCustomerNumber(customerData.hotel_id);
    }

    const [result] = await pool.execute(
      customerQueries.CREATE_CUSTOMER_BASIC,
      [
        customerData.hotel_id,
        customerData.name,
        customerData.phone,
        customerData.email || '',
        customerData.customer_number
      ]
    );
    return result.insertId;
  }

  // Find customer by ID
  static async findById(id, hotelId) {
    const [rows] = await pool.execute(customerQueries.FIND_CUSTOMER_BY_ID, [id, hotelId]);
    return rows[0];
  }

  // Find customer by ID with images
  static async findByIdWithImages(id, hotelId) {
    const [rows] = await pool.execute(customerQueries.GET_CUSTOMER_WITH_IMAGES, [id, hotelId]);
    return rows[0];
  }

  // Get customers by hotel
  static async findByHotel(hotelId) {
    const [rows] = await pool.execute(customerQueries.GET_CUSTOMERS_BY_HOTEL, [hotelId]);
    return rows;
  }

  // Update customer
  static async update(id, hotelId, customerData) {
    console.log('🔧 Updating customer with data:', { id, hotelId, customerData });

    const updateData = {
      name: customerData.name || '',
      phone: customerData.phone || '',
      email: customerData.email || null,
      customer_number: customerData.customer_number || null, // Simple sequential number
      id_type: customerData.id_type || 'aadhaar',
      id_number: customerData.id_number || null, // Actual ID proof number
      id_image: customerData.id_image || null,
      id_image2: customerData.id_image2 || null,
      payment_method: customerData.payment_method || 'cash',
      payment_status: customerData.payment_status || 'pending',
      payment_reference: customerData.payment_reference || null,
      transaction_id: customerData.transaction_id || null,
      address: customerData.address || null,
      city: customerData.city || null,
      state: customerData.state || null,
      pincode: customerData.pincode || null,
      customer_gst_no: customerData.customer_gst_no || null,
      purpose_of_visit: customerData.purpose_of_visit || null,
      other_expenses: customerData.other_expenses || 0,
      expense_description: customerData.expense_description || null
    };

    console.log('🔧 Prepared update data:', updateData);

    const [result] = await pool.execute(
      customerQueries.UPDATE_CUSTOMER,
      [
        updateData.name,
        updateData.phone,
        updateData.email,
        updateData.customer_number, // customer_number (simple sequential)
        updateData.id_type,
        updateData.id_number, // id_number (actual ID proof)
        updateData.id_image,
        updateData.id_image2,
        updateData.payment_method,
        updateData.payment_status,
        updateData.payment_reference,
        updateData.transaction_id,
        updateData.address,
        updateData.city,
        updateData.state,
        updateData.pincode,
        updateData.customer_gst_no,
        updateData.purpose_of_visit,
        updateData.other_expenses,
        updateData.expense_description,
        id,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  // Update payment status
  static async updatePaymentStatus(id, hotelId, paymentStatus, transactionId) {
    const [result] = await pool.execute(
      customerQueries.UPDATE_PAYMENT_STATUS,
      [paymentStatus, transactionId, id, hotelId]
    );
    return result.affectedRows > 0;
  }

  // Delete customer
  static async delete(id, hotelId) {
    const [result] = await pool.execute(customerQueries.DELETE_CUSTOMER, [id, hotelId]);
    return result.affectedRows > 0;
  }

  // Search customers
  static async search(hotelId, searchTerm) {
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.execute(
      customerQueries.SEARCH_CUSTOMERS,
      [hotelId, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
    );
    return rows;
  }

  // Get customer statistics
  static async getStats(hotelId) {
    const [rows] = await pool.execute(customerQueries.GET_CUSTOMER_STATS, [hotelId]);
    return rows[0];
  }

  // Find customer by phone
  static async findByPhone(phone, hotelId) {
    const [rows] = await pool.execute(
      'SELECT * FROM customers WHERE phone = ? AND hotel_id = ?',
      [phone, hotelId]
    );
    return rows[0];
  }

  // Get customers with pending payments
  static async getCustomersWithPendingPayments(hotelId) {
    const [rows] = await pool.execute(
      'SELECT * FROM customers WHERE hotel_id = ? AND payment_status = ?',
      [hotelId, 'pending']
    );
    return rows;
  }

  // Find customer by customer number
  static async findByCustomerNumber(customerNumber, hotelId) {
    const [rows] = await pool.execute(
      'SELECT * FROM customers WHERE customer_number = ? AND hotel_id = ?',
      [customerNumber, hotelId]
    );
    return rows[0];
  }
}

module.exports = Customer;