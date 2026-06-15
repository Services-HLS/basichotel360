

const Customer = require('../models/Customer');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/database');

const customerController = {
  // Create new customer
  createCustomer: async (req, res) => {
    try {
      const {
        name,
        phone,
        email,
        id_number, // This is the actual Aadhaar/PAN number
        id_type,
        id_image,
        id_image2,
        payment_method,
        payment_status,
        payment_reference,
        transaction_id,
        address,
        city,
        state,
        pincode,
        customer_gst_no,
        purpose_of_visit,
        other_expenses,
        expense_description
      } = req.body;

      const hotelId = req.user.hotel_id;

      // Check if customer with same phone already exists
      const existingCustomer = await Customer.findByPhone(phone, hotelId);
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: 'CUSTOMER_EXISTS',
          message: 'Customer with this phone number already exists',
          data: existingCustomer
        });
      }

      // Generate sequential customer number
      const customerNumber = await Customer.generateCustomerNumber(hotelId);

      const customerId = await Customer.create({
        hotel_id: hotelId,
        name,
        phone,
        email: email || '',
        customer_number: customerNumber, // Sequential number (e.g., 25-0001)
        id_type: id_type || 'aadhaar',
        id_number: id_number || null, // Actual ID proof number
        id_image: id_image || null,
        id_image2: id_image2 || null,
        payment_method: payment_method || 'cash',
        payment_status: payment_status || 'pending',
        payment_reference: payment_reference || null,
        transaction_id: transaction_id || null,
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        customer_gst_no: customer_gst_no || null,
        purpose_of_visit: purpose_of_visit || null,
        other_expenses: other_expenses || 0,
        expense_description: expense_description || null
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: {
          customerId: customerId,
          customerNumber: customerNumber
        }
      });

    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get all customers for hotel
  // getCustomers: async (req, res) => {
  //   try {
  //     const hotelId = req.user.hotel_id;
  //     const customers = await Customer.findByHotel(hotelId);

  //     // Transform data for frontend
  //     const transformedCustomers = customers.map(customer => {
  //       const { id_image, id_image2, ...customerWithoutImages } = customer;
  //       return {
  //         ...customerWithoutImages,
  //         customerNumber: customer.customer_number, // Sequential number
  //         idNumber: customer.id_number, // Actual ID proof number
  //         has_id_image: !!id_image,
  //         has_id_image2: !!id_image2
  //       };
  //     });

  //     res.json({
  //       success: true,
  //       data: transformedCustomers
  //     });

  //   } catch (error) {
  //     console.error('Get customers error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Internal server error'
  //     });
  //   }
  // },
  // Get all customers for hotel
  getCustomers: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const customers = await Customer.findByHotel(hotelId);

      // ✅ KEEP the images in the response
      const transformedCustomers = customers.map(customer => {
        return {
          id: customer.id,
          hotel_id: customer.hotel_id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          customer_number: customer.customer_number,
          id_type: customer.id_type,
          id_number: customer.id_number,
          id_image: customer.id_image,      // ✅ Keep this
          id_image2: customer.id_image2,    // ✅ Keep this
          created_at: customer.created_at,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          customer_gst_no: customer.customer_gst_no,
          purpose_of_visit: customer.purpose_of_visit,
          other_expenses: customer.other_expenses,
          expense_description: customer.expense_description,
          payment_method: customer.payment_method,
          payment_status: customer.payment_status,
          payment_reference: customer.payment_reference,
          transaction_id: customer.transaction_id,
          customerNumber: customer.customer_number,
          idNumber: customer.id_number,
          has_id_image: !!customer.id_image,
          has_id_image2: !!customer.id_image2
        };
      });

      res.json({
        success: true,
        data: transformedCustomers
      });

    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get customer by ID with images
  getCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const customer = await Customer.findByIdWithImages(id, hotelId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      // Transform data
      const transformedCustomer = {
        ...customer,
        customerNumber: customer.customer_number,
        idNumber: customer.id_number
      };

      res.json({
        success: true,
        data: transformedCustomer
      });

    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get customer ID images only
  getCustomerImages: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const customer = await Customer.findByIdWithImages(id, hotelId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: {
          id_image: customer.id_image,
          id_image2: customer.id_image2
        }
      });

    } catch (error) {
      console.error('Get customer images error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const {
        name,
        phone,
        email,
        customer_number, // Sequential number
        id_number, // Actual ID proof number
        id_type,
        id_image,
        id_image2,
        payment_method,
        payment_status,
        payment_reference,
        transaction_id,
        address,
        city,
        state,
        pincode,
        customer_gst_no,
        purpose_of_visit,
        other_expenses,
        expense_description
      } = req.body;

      const updated = await Customer.update(id, hotelId, {
        name,
        phone,
        email,
        customer_number,
        id_type,
        id_number,
        id_image,
        id_image2,
        payment_method,
        payment_status,
        payment_reference,
        transaction_id,
        address,
        city,
        state,
        pincode,
        customer_gst_no,
        purpose_of_visit,
        other_expenses,
        expense_description
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        message: 'Customer updated successfully'
      });

    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update customer payment status
  updateCustomerPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { payment_status, transaction_id } = req.body;

      if (!['pending', 'completed', 'failed'].includes(payment_status)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PAYMENT_STATUS',
          message: 'Invalid payment status'
        });
      }

      const updated = await Customer.updatePaymentStatus(id, hotelId, payment_status, transaction_id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully'
      });

    } catch (error) {
      console.error('Update customer payment error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Search customers
  searchCustomers: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'SEARCH_QUERY_REQUIRED',
          message: 'Search query is required'
        });
      }

      const customers = await Customer.search(hotelId, q);

      // Transform data
      const transformedCustomers = customers.map(customer => {
        const { id_image, id_image2, ...customerWithoutImages } = customer;
        return {
          ...customerWithoutImages,
          customerNumber: customer.customer_number,
          idNumber: customer.id_number
        };
      });

      res.json({
        success: true,
        data: transformedCustomers
      });

    } catch (error) {
      console.error('Search customers error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Delete customer
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Check if customer has any bookings
      const [bookings] = await pool.execute(
        'SELECT COUNT(*) as booking_count FROM bookings WHERE customer_id = ? AND hotel_id = ?',
        [id, hotelId]
      );

      if (bookings[0].booking_count > 0) {
        return res.status(400).json({
          success: false,
          error: 'CUSTOMER_HAS_BOOKINGS',
          message: 'Cannot delete customer with existing bookings'
        });
      }

      const deleted = await Customer.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });

    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get customer statistics
  getCustomerStats: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const stats = await Customer.getStats(hotelId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get customer stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Generate PDF for single customer
  generateCustomerPDF: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const customer = await Customer.findByIdWithImages(id, hotelId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Customer_${customer.name}_${customer.id}.pdf"`
      );

      // Pipe PDF to response
      doc.pipe(res);

      // Add content to PDF
      doc.fontSize(25).font('Helvetica-Bold').text('CUSTOMER DETAILS', {
        align: 'center',
        underline: true
      });

      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Hotel ID: ${hotelId}`, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
      doc.moveDown(2);

      // Customer Information
      doc.fontSize(16).font('Helvetica-Bold').text('Personal Information');
      doc.moveDown();

      const personalInfo = [
        { label: 'Customer Number', value: customer.customer_number || 'N/A' },
        { label: 'Name', value: customer.name },
        { label: 'Phone', value: customer.phone },
        { label: 'Email', value: customer.email || 'N/A' },
        { label: 'ID Type', value: customer.id_type || 'N/A' },
        { label: 'ID Number', value: customer.id_number || 'N/A' },
        { label: 'Created Date', value: new Date(customer.created_at).toLocaleDateString('en-GB') },
      ];

      personalInfo.forEach(info => {
        doc.fontSize(12).font('Helvetica')
          .text(`${info.label}:`, { continued: true, bold: true })
          .text(` ${info.value}`, { bold: false });
      });

      doc.moveDown();

      // Address Information
      if (customer.address || customer.city || customer.state || customer.pincode) {
        doc.fontSize(16).font('Helvetica-Bold').text('Address Information');
        doc.moveDown();

        const addressInfo = [
          { label: 'Address', value: customer.address },
          { label: 'City', value: customer.city },
          { label: 'State', value: customer.state },
          { label: 'Pincode', value: customer.pincode },
        ].filter(info => info.value);

        addressInfo.forEach(info => {
          doc.fontSize(12).font('Helvetica')
            .text(`${info.label}:`, { continued: true, bold: true })
            .text(` ${info.value}`, { bold: false });
        });

        doc.moveDown();
      }

      // Additional Information
      const additionalInfo = [
        { label: 'GST Number', value: customer.customer_gst_no },
        { label: 'Purpose of Visit', value: customer.purpose_of_visit },
        { label: 'Other Expenses', value: customer.other_expenses ? `₹${customer.other_expenses}` : null },
        { label: 'Expense Description', value: customer.expense_description },
      ].filter(info => info.value);

      if (additionalInfo.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold').text('Additional Information');
        doc.moveDown();

        additionalInfo.forEach(info => {
          doc.fontSize(12).font('Helvetica')
            .text(`${info.label}:`, { continued: true, bold: true })
            .text(` ${info.value}`, { bold: false });
        });

        doc.moveDown();
      }

      // Payment Information
      doc.fontSize(16).font('Helvetica-Bold').text('Payment Information');
      doc.moveDown();

      const paymentInfo = [
        { label: 'Payment Method', value: customer.payment_method },
        { label: 'Payment Status', value: customer.payment_status },
        { label: 'Transaction ID', value: customer.transaction_id || 'N/A' },
        { label: 'Payment Reference', value: customer.payment_reference || 'N/A' },
      ];

      paymentInfo.forEach(info => {
        doc.fontSize(12).font('Helvetica')
          .text(`${info.label}:`, { continued: true, bold: true })
          .text(` ${info.value}`, { bold: false });
      });

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica-Oblique')
        .text('This is a computer-generated document and does not require a signature.', {
          align: 'center'
        });

      doc.end();

    } catch (error) {
      console.error('Generate PDF error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to generate PDF'
      });
    }
  },

  // Search customers by phone
  searchCustomersByPhone: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { phone } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'PHONE_REQUIRED',
          message: 'Phone number is required'
        });
      }

      // Clean phone number - remove all non-digits
      const cleanPhone = phone.replace(/\D/g, '');

      // Create search variants
      const phoneVariants = [cleanPhone];

      // Remove leading zero if present
      const noLeadingZero = cleanPhone.replace(/^0+/, '');
      if (noLeadingZero !== cleanPhone) phoneVariants.push(noLeadingZero);

      // Add leading zero if not present
      if (!cleanPhone.startsWith('0') && cleanPhone.length >= 10) {
        phoneVariants.push('0' + cleanPhone);
      }

      // Last 10 digits only
      phoneVariants.push(cleanPhone.slice(-10));

      // With country code
      if (cleanPhone.length === 10) {
        phoneVariants.push('+91' + cleanPhone);
        phoneVariants.push('91' + cleanPhone);
      }

      const uniqueVariants = [...new Set(phoneVariants)];

      // Build SQL query
      const placeholders = uniqueVariants.map(() => '?').join(',');
      const query = `
        SELECT id, hotel_id, name, phone, email, customer_gst_no, 
               address, city, state, pincode, purpose_of_visit,
               other_expenses, expense_description, id_type, 
               customer_number, id_number, created_at
        FROM customers 
        WHERE hotel_id = ? 
        AND phone IN (${placeholders})
        ORDER BY created_at DESC
      `;

      const params = [hotelId, ...uniqueVariants];
      const [customers] = await pool.execute(query, params);

      // Transform data
      const transformedCustomers = customers.map(customer => ({
        ...customer,
        customerNumber: customer.customer_number,
        idNumber: customer.id_number
      }));

      res.json({
        success: true,
        data: transformedCustomers
      });

    } catch (error) {
      console.error('❌ Search customers by phone error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      });
    }
  },
  // Add this to customerController.js

  // Download customer ID image (Aadhaar/PAN card)
  downloadCustomerIdImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.query; // 'front' or 'back' for id_image or id_image2
      const hotelId = req.user.hotel_id;

      const customer = await Customer.findByIdWithImages(id, hotelId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      // Get the appropriate image
      let imageData = type === 'back' ? customer.id_image2 : customer.id_image;

      if (!imageData) {
        return res.status(404).json({
          success: false,
          error: 'IMAGE_NOT_FOUND',
          message: `ID ${type === 'back' ? 'back' : 'front'} image not found for this customer`
        });
      }

      // Check if imageData already has data:image prefix
      let base64Data = imageData;
      let mimeType = 'image/png'; // default

      if (imageData.includes('data:image')) {
        // Extract mime type and base64 data
        const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = `image/${matches[1]}`;
          base64Data = matches[2];
        } else {
          // If pattern doesn't match but has data:image prefix
          base64Data = imageData.split(',')[1] || imageData;
        }
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Set response headers for image download
      const idType = customer.id_type || 'aadhaar';
      const fileName = `${idType}_${type === 'back' ? 'back' : 'front'}_${customer.name}_${customer.id}.${mimeType.split('/')[1] || 'png'}`;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', imageBuffer.length);

      res.send(imageBuffer);

    } catch (error) {
      console.error('Download ID image error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to download ID image'
      });
    }
  },

  // Get both ID images as base64 (for preview)
  getCustomerIdImages: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const customer = await Customer.findByIdWithImages(id, hotelId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: {
          id_image: customer.id_image || null,
          id_image2: customer.id_image2 || null,
          id_type: customer.id_type
        }
      });

    } catch (error) {
      console.error('Get ID images error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to get ID images'
      });
    }
  },
};

module.exports = customerController;