const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');

const transactionController = {
  // Create new transaction
  createTransaction: async (req, res) => {
    try {
      const {
        booking_id,
        customer_id,
        transaction_id,
        amount,
        currency,
        payment_method,
        payment_gateway,
        upi_id,
        upi_transaction_id,
        card_last4,
        card_type,
        card_network,
        status,
        status_message,
        gateway_transaction_id,
        gateway_response,
        metadata
      } = req.body;

      const hotelId = req.user.hotel_id;

      // Validate required fields
      if (!transaction_id || !amount) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Transaction ID and amount are required'
        });
      }

      // Check if transaction already exists
      const existingTransaction = await Transaction.findByTransactionId(transaction_id, hotelId);
      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          error: 'TRANSACTION_EXISTS',
          message: 'Transaction with this ID already exists'
        });
      }

      // Validate booking if provided
      if (booking_id) {
        const booking = await Booking.findById(booking_id, hotelId);
        if (!booking) {
          return res.status(404).json({
            success: false,
            error: 'BOOKING_NOT_FOUND',
            message: 'Booking not found'
          });
        }
      }

      // Validate customer if provided
      if (customer_id) {
        const customer = await Customer.findById(customer_id, hotelId);
        if (!customer) {
          return res.status(404).json({
            success: false,
            error: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          });
        }
      }

      // Create transaction
      const transactionData = {
        hotel_id: hotelId,
        booking_id: booking_id || null,
        customer_id: customer_id || null,
        transaction_id,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        payment_method: payment_method || 'online',
        payment_gateway: payment_gateway || null,
        upi_id: upi_id || null,
        upi_transaction_id: upi_transaction_id || null,
        card_last4: card_last4 || null,
        card_type: card_type || null,
        card_network: card_network || null,
        status: status || 'pending',
        status_message: status_message || null,
        gateway_transaction_id: gateway_transaction_id || null,
        gateway_response: gateway_response || null,
        metadata: metadata || null
      };

      const transactionId = await Transaction.create(transactionData);

      // If transaction is for a booking and status is success, update booking payment status
      if (booking_id && status === 'success') {
        await Booking.updatePaymentStatus(booking_id, hotelId, 'completed', transaction_id);
        
        // Update customer payment status if customer exists
        if (customer_id) {
          await Customer.updatePaymentStatus(customer_id, hotelId, 'completed', transaction_id);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: {
          transactionId: transactionId,
          transaction_id: transaction_id
        }
      });

    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get transaction by ID
  getTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const transaction = await Transaction.findById(id, hotelId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get transactions by hotel
  getTransactions: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { 
        page = 1, 
        limit = 50,
        status,
        payment_method,
        start_date,
        end_date,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      let transactions;

      if (search) {
        transactions = await Transaction.search(hotelId, search, parseInt(limit), offset);
      } else if (status) {
        transactions = await Transaction.findByStatus(hotelId, status);
      } else if (start_date && end_date) {
        transactions = await Transaction.findByDateRange(hotelId, start_date, end_date);
      } else {
        transactions = await Transaction.findByHotel(hotelId, parseInt(limit), offset);
      }

      // Get total count for pagination
      const total = await Transaction.getCount(hotelId);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get transactions by booking
  getTransactionsByBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const hotelId = req.user.hotel_id;

      const transactions = await Transaction.findByBooking(bookingId, hotelId);

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Get transactions by booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get transactions by customer
  getTransactionsByCustomer: async (req, res) => {
    try {
      const { customerId } = req.params;
      const hotelId = req.user.hotel_id;

      const transactions = await Transaction.findByCustomer(customerId, hotelId);

      res.json({
        success: true,
        data: transactions
      });

    } catch (error) {
      console.error('Get transactions by customer error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update transaction status
  updateTransactionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { 
        status, 
        status_message, 
        gateway_transaction_id, 
        gateway_response 
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Status is required'
        });
      }

      const transaction = await Transaction.findById(id, hotelId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        });
      }

      const statusData = {
        status,
        status_message: status_message || null,
        gateway_transaction_id: gateway_transaction_id || null,
        gateway_response: gateway_response || null
      };

      const updated = await Transaction.updateStatus(id, hotelId, statusData);
      if (!updated) {
        return res.status(500).json({
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to update transaction status'
        });
      }

      // Update booking and customer payment status if transaction is successful
      if (status === 'success' && transaction.booking_id) {
        await Booking.updatePaymentStatus(
          transaction.booking_id, 
          hotelId, 
          'completed', 
          transaction.transaction_id
        );
        
        if (transaction.customer_id) {
          await Customer.updatePaymentStatus(
            transaction.customer_id, 
            hotelId, 
            'completed', 
            transaction.transaction_id
          );
        }
      }

      res.json({
        success: true,
        message: 'Transaction status updated successfully'
      });

    } catch (error) {
      console.error('Update transaction status error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update UPI transaction
  updateUPITransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const hotelId = req.user.hotel_id;
      const { 
        upi_transaction_id, 
        status, 
        status_message 
      } = req.body;

      const transaction = await Transaction.findByTransactionId(transactionId, hotelId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        });
      }

      const upiData = {
        upi_transaction_id: upi_transaction_id || null,
        status: status || 'pending',
        status_message: status_message || null
      };

      const updated = await Transaction.updateUPITransaction(transactionId, hotelId, upiData);
      if (!updated) {
        return res.status(500).json({
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to update UPI transaction'
        });
      }

      res.json({
        success: true,
        message: 'UPI transaction updated successfully'
      });

    } catch (error) {
      console.error('Update UPI transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Process refund
  processRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { 
        refund_id, 
        refund_amount, 
        refund_reason 
      } = req.body;

      const transaction = await Transaction.findById(id, hotelId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        });
      }

      // Check if transaction is successful
      if (transaction.status !== 'success') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TRANSACTION_STATUS',
          message: 'Only successful transactions can be refunded'
        });
      }

      // Validate refund amount
      const maxRefundAmount = parseFloat(transaction.amount) - parseFloat(transaction.refund_amount || 0);
      if (parseFloat(refund_amount) > maxRefundAmount) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REFUND_AMOUNT',
          message: `Refund amount cannot exceed ${maxRefundAmount}`
        });
      }

      const refundData = {
        refund_id: refund_id || `REF${Date.now()}`,
        refund_amount: parseFloat(refund_amount || 0),
        refund_reason: refund_reason || ''
      };

      const refunded = await Transaction.processRefund(id, hotelId, refundData);
      if (!refunded) {
        return res.status(500).json({
          success: false,
          error: 'REFUND_FAILED',
          message: 'Failed to process refund'
        });
      }

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refund_id: refundData.refund_id,
          refund_amount: refundData.refund_amount
        }
      });

    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get transaction statistics
  getTransactionStats: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      
      const [stats, monthlyRevenue, paymentMethodStats] = await Promise.all([
        Transaction.getStats(hotelId),
        Transaction.getMonthlyRevenue(hotelId),
        Transaction.getPaymentMethodStats(hotelId)
      ]);

      res.json({
        success: true,
        data: {
          stats,
          monthly_revenue: monthlyRevenue,
          payment_methods: paymentMethodStats
        }
      });

    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get successful transactions summary
  getSuccessfulSummary: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { days = 30 } = req.query;

      const summary = await Transaction.getSuccessfulSummary(hotelId, parseInt(days));

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Get successful summary error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Generate payment receipt
  generateReceipt: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const transaction = await Transaction.findById(id, hotelId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        });
      }

      // Generate receipt data
      const receipt = {
        receipt_number: `REC${transaction.id.toString().padStart(6, '0')}`,
        transaction_id: transaction.transaction_id,
        date: new Date(transaction.created_at).toLocaleDateString('en-IN'),
        time: new Date(transaction.created_at).toLocaleTimeString('en-IN'),
        amount: transaction.amount,
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        status: transaction.status,
        customer_name: transaction.customer_name || 'N/A',
        customer_phone: transaction.customer_phone || 'N/A',
        room_number: transaction.room_number || 'N/A',
        hotel_details: {
          name: req.user.hotel_name || 'Hotel',
          address: req.user.hotel_address || '',
          phone: req.user.hotel_phone || '',
          gstin: req.user.hotel_gstin || ''
        }
      };

      res.json({
        success: true,
        data: receipt
      });

    } catch (error) {
      console.error('Generate receipt error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  }
};

module.exports = transactionController;