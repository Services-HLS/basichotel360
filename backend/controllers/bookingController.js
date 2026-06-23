

const BlockMaintenancePdfService = require('../services/blockMaintenancePdfService');

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Collection = require('../models/Collection');
const { pool } = require('../config/database');

const WhatsAppService = require('../services/whatsappService');


// Import Email Service
const EmailService = require('../services/emailService');
const SchedulerService = require('../services/schedulerService');
const { isBasicHotelPlan } = require('../utils/planUtils');
const { getPaymentBreakdown } = require('../utils/paymentBreakdown');
const { serializeGuestsForDb, formatGuestsForDisplay } = require('../utils/guestUtils');

const fs = require('fs');
const path = require('path');

// Function to get base64 logo
const getBase64Logo = () => {
  try {
    // Try multiple possible paths for the logo
    const possiblePaths = [
      path.join(__dirname, '../public/logo.jpeg'),
      path.join(__dirname, '../../public/logo.jpeg'),
      path.join(__dirname, '../../../public/logo.jpeg'),
      path.join(__dirname, 'public/logo.jpeg'),
    ];

    let logoPath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        logoPath = possiblePath;
        console.log(`✅ Found logo at: ${logoPath}`);
        break;
      }
    }

    if (!logoPath) {
      console.log('⚠️ Logo file not found, using placeholder');
      return 'https://via.placeholder.com/80x40/2c3e50/ffffff?text=HSPL';
    }

    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('❌ Error loading logo:', error);
    return 'https://via.placeholder.com/80x40/2c3e50/ffffff?text=HSPL';
  }
};

// Pre-load the logo as base64
const companyLogoBase64 = getBase64Logo();
console.log('Company logo loaded:', companyLogoBase64 ? 'Yes' : 'No');


const bookingController = {




  createBooking: async (req, res) => {
    try {
      const {
        room_id,
        customer_id,
        from_date,
        to_date,
        from_time,
        to_time,
        amount,
        service,
        gst,
        cgst,
        sgst,
        igst,
        total,
        status,
        guests,
        special_requests,
        id_type,
        payment_method,
        payment_status,
        transaction_id,
        // Customer details
        customer_name,
        customer_phone,
        customer_email,
        customer_id_number,
        id_image,
        id_image2,
        address,
        city,
        state,
        pincode,
        customer_gst_no,
        purpose_of_visit,
        other_expenses,
        expense_description,
        referral_by,
        referral_amount,
        discount_percentage,      // NEW
        discount_amount,          // NEW
        original_amount           // NEW
      } = req.body;

      const hotelId = req.user.hotel_id;
      let finalCustomerId = customer_id;
      let generatedTransactionId = transaction_id;
      let isNewCustomer = false;
      let existingCustomer = null;

      console.log('📝 Create booking request:', {
        hotelId,
        room_id,
        customer_id,
        from_date,
        to_date,
        status,
        customer_name,
        customer_phone,
        payment_method,
        customer_email
      });

      // ===========================================
      // 1. VALIDATE ROOM
      // ===========================================
      const room = await Room.findById(room_id, hotelId);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        });
      }

      // ===========================================
      // 2. CUSTOMER HANDLING
      // ===========================================
      if (customer_name && customer_phone) {
        try {
          existingCustomer = await Customer.findByPhone(customer_phone, hotelId);

          if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
            console.log('✅ Found existing customer:', {
              customerId: finalCustomerId,
              name: existingCustomer.name
            });

            // Check for duplicate booking
            if (status === 'booked' && finalCustomerId) {
              const duplicateBooking = await Booking.checkDuplicateBooking(
                hotelId,
                room_id,
                finalCustomerId,
                from_date,
                to_date
              );

              if (duplicateBooking) {
                return res.status(400).json({
                  success: false,
                  error: 'DUPLICATE_BOOKING',
                  message: 'A booking already exists for this customer in the same room and dates',
                  data: {
                    booking_id: duplicateBooking.id,
                    customer_name: duplicateBooking.customer_name,
                    room_number: duplicateBooking.room_number,
                    from_date: duplicateBooking.from_date,
                    to_date: duplicateBooking.to_date,
                    status: duplicateBooking.status
                  }
                });
              }
            }

            // Update existing customer
            await Customer.update(existingCustomer.id, hotelId, {
              name: customer_name,
              phone: customer_phone,
              email: customer_email || existingCustomer.email,
              id_number: customer_id_number || existingCustomer.id_number,
              id_type: id_type || 'aadhaar',
              id_image: id_image || existingCustomer.id_image,
              id_image2: id_image2 || existingCustomer.id_image2,
              address: address || existingCustomer.address,
              city: city || existingCustomer.city,
              state: state || existingCustomer.state,
              pincode: pincode || existingCustomer.pincode,
              customer_gst_no: customer_gst_no || existingCustomer.customer_gst_no,
              purpose_of_visit: purpose_of_visit || existingCustomer.purpose_of_visit,
              other_expenses: other_expenses || existingCustomer.other_expenses || 0,
              expense_description: expense_description || existingCustomer.expense_description
            });

          } else {
            // Create new customer
            finalCustomerId = await Customer.create({
              hotel_id: hotelId,
              name: customer_name,
              phone: customer_phone,
              email: customer_email || '',
              id_number: customer_id_number || '',
              id_type: id_type || 'aadhaar',
              id_image: id_image || null,
              id_image2: id_image2 || null,
              address: address || '',
              city: city || '',
              state: state || '',
              pincode: pincode || '',
              customer_gst_no: customer_gst_no,
              purpose_of_visit: purpose_of_visit || null,
              other_expenses: other_expenses || 0,
              expense_description: expense_description || null
            });
            isNewCustomer = true;
            console.log('✅ Created new customer:', { customerId: finalCustomerId });
          }

        } catch (customerError) {
          console.error('❌ Customer creation error:', customerError);
          return res.status(500).json({
            success: false,
            error: 'CUSTOMER_CREATION_FAILED',
            message: 'Failed to create/update customer'
          });
        }
      }

      // ===========================================
      // 3. CHECK ROOM AVAILABILITY
      // ===========================================
      const isAvailable = await Booking.checkRoomAvailability(
        room_id,
        hotelId,
        from_date,
        to_date,
        null,
        status,
        from_time || '14:00',
        to_time || '12:00'
      );
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'ROOM_NOT_AVAILABLE',
          message: 'Room is not available for the selected dates'
        });
      }

      let invoiceNumber = req.body.invoice_number;
      if (!invoiceNumber) {
        invoiceNumber = await Booking.getNextInvoiceNumber(hotelId);
      }

      const otherExpensesValue = parseFloat(other_expenses) || 0;

      // Calculate total
      const calculatedTotal = parseFloat(amount || 0) +
        parseFloat(service || 0) +
        parseFloat(gst || 0) +
        otherExpensesValue;

      const finalTotal = parseFloat(total || calculatedTotal);

      // ===========================================
      // 4. CREATE BOOKING
      // ===========================================
      const bookingData = {
        hotel_id: hotelId,
        room_id,
        customer_id: status === 'booked' ? finalCustomerId : null,
        from_date,
        to_date,
        from_time: from_time || '14:00',
        to_time: to_time || '12:00',
        amount: parseFloat(amount || 0),
        service: parseFloat(service || 0),
        gst: parseFloat(gst || 0),
        cgst: parseFloat(cgst || 0),
        sgst: parseFloat(sgst || 0),
        igst: parseFloat(igst || 0),
        total: finalTotal,
        invoice_number: invoiceNumber,
        status: status || 'booked',
        guests: serializeGuestsForDb({ adults: req.body.adults, children: req.body.children, guests }),
        special_requests: special_requests || '',
        id_type: id_type || 'aadhaar',
        payment_method: payment_method || 'cash',
        payment_status:
          payment_status !== undefined && payment_status !== null && payment_status !== ''
            ? payment_status
            : payment_method === 'cash'
              ? 'completed'
              : 'pending',
        transaction_id: transaction_id || null,
        referral_by: referral_by || '',
        referral_amount: parseFloat(referral_amount || 0),
        discount_percentage: parseFloat(discount_percentage || 0),
        discount_amount: parseFloat(discount_amount || 0),
        original_amount: parseFloat(original_amount || amount || 0),
        advance_amount_paid: parseFloat(req.body.advance_amount_paid || 0),
        remaining_amount: parseFloat(
          req.body.remaining_amount ??
          (finalTotal - parseFloat(req.body.advance_amount_paid || 0))
        )
      };

      console.log('📅 Creating booking:', bookingData);

      let bookingId;
      if (status === 'booked' && finalCustomerId) {
        bookingId = await Booking.create(bookingData);
      } else {
        bookingId = await Booking.createWithoutCustomer(bookingData);
      }

      console.log('✅ Booking created successfully:', { bookingId });

      // ===========================================
      // 5. UPDATE ROOM STATUS
      // ===========================================
      if (status === 'booked') {
        await Room.updateStatus(room_id, hotelId, 'booked');
      }

      // ===========================================
      // 6. CREATE TRANSACTION RECORD IF PAYMENT IS ONLINE
      // ===========================================
      let transactionRecord = null;
      if (payment_method === 'online' && status === 'booked') {
        try {
          generatedTransactionId = transaction_id || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

          transactionRecord = await Transaction.create({
            hotel_id: hotelId,
            booking_id: bookingId,
            customer_id: finalCustomerId,
            transaction_id: generatedTransactionId,
            amount: parseFloat(total || 0),
            currency: 'INR',
            payment_method: 'online',
            payment_gateway: 'upi',
            status: payment_status || 'pending',
            status_message: payment_status === 'completed' ? 'Payment completed' : 'Payment initiated',
            metadata: {
              room_id: room_id,
              room_number: room.room_number,
              from_date: from_date,
              to_date: to_date,
              customer_name: customer_name,
              customer_phone: customer_phone
            }
          });

          console.log('💰 Transaction created:', {
            transactionId: generatedTransactionId,
            transactionRecordId: transactionRecord
          });

          if (!transaction_id) {
            await Booking.update(bookingId, hotelId, {
              transaction_id: generatedTransactionId
            });
          }

          if (payment_status === 'completed') {
            await Transaction.updateStatus(transactionRecord, hotelId, {
              status: 'success',
              status_message: 'Payment completed successfully',
              gateway_transaction_id: generatedTransactionId
            });
          }

        } catch (transactionError) {
          console.error('❌ Transaction creation error:', transactionError);
        }
      }

      // ===========================================
      // 7. CREATE COLLECTION FOR CASH PAYMENT
      // ===========================================
      if (payment_method === 'cash' && status === 'booked') {
        try {
          await Collection.createFromCashBooking(bookingId, hotelId, req.user.userId);
          console.log('✅ Auto-created collection for cash booking');
        } catch (collectionError) {
          console.error('❌ Failed to auto-create collection:', collectionError);
        }
      }

      // ===========================================
      // 8. SEND EMAIL AND WHATSAPP (KEEP THIS ONE)
      // ===========================================
      // if (status === 'booked') {
      //   try {
      //     // Send email and WhatsApp asynchronously
      //     setTimeout(async () => {
      //       try {
      //         // Get full booking details
      //         const [fullBooking] = await pool.execute(`
      //         SELECT b.*, r.room_number, r.type as room_type,
      //                c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
      //                c.customer_gst_no, c.address, c.city, c.state, c.pincode,
      //                h.name as hotel_name, b.hotel_id
      //         FROM bookings b
      //         LEFT JOIN rooms r ON b.room_id = r.id
      //         LEFT JOIN customers c ON b.customer_id = c.id
      //         LEFT JOIN hotels h ON b.hotel_id = h.id
      //         WHERE b.id = ? AND b.hotel_id = ?
      //       `, [bookingId, hotelId]);

      //         if (fullBooking.length > 0) {
      //           const booking = fullBooking[0];

      //           // Get hotel admin email
      //           const [adminRows] = await pool.execute(
      //             `SELECT email, name, phone FROM users 
      //            WHERE hotel_id = ? AND role = 'admin' AND status = 'active'
      //            LIMIT 1`,
      //             [hotelId]
      //           );

      //           const hotelAdmin = adminRows.length > 0 ? adminRows[0] : null;
      //           const hotelAdminEmail = hotelAdmin ? hotelAdmin.email : process.env.EMAIL_USER;
      //           const hotelAdminName = hotelAdmin ? hotelAdmin.name : 'Hotel Admin';
      //           const hotelAdminPhone = hotelAdmin ? hotelAdmin.phone : null;

      //           const hotelDetails = {
      //             name: booking.hotel_name || 'Hotel',
      //             email: hotelAdminEmail,
      //             address: ''
      //           };

      //           const hotelOwnerDetails = {
      //             name: hotelAdminName,
      //             email: hotelAdminEmail,
      //             phone: hotelAdminPhone
      //           };

      //           const customerEmail = booking.customer_email || customer_email;
      //           const customerName = booking.customer_name || customer_name;
      //           const customerPhone = booking.customer_phone || customer_phone;

      //           const customerDetails = {
      //             name: customerName,
      //             email: customerEmail,
      //             phone: customerPhone
      //           };

      //           // 1. SEND EMAIL
      //           if (customerDetails.email) {
      //             await EmailService.sendBookingConfirmation(booking, hotelDetails, customerDetails, {
      //               companyLogoUrl: companyLogoBase64,
      //               companyName: 'Hithlaksh Solutions Private Limited',
      //               companyWebsite: 'https://hithlakshsolutions.com/',
      //               privacyLink: 'https://hithlakshsolutions.com/privacy',
      //               termsLink: 'https://hithlakshsolutions.com/terms'
      //             });
      //             console.log(`✅ Booking confirmation email sent to customer`);
      //           } else {
      //             console.log(`⚠️ No email for customer - booking ${bookingId}`);
      //           }

      //           // 2. SEND WHATSAPP
      //           if (customerDetails.phone || hotelOwnerDetails.phone) {
      //             try {
      //               const whatsappResults = await WhatsAppService.sendBookingConfirmationToAll(
      //                 booking,
      //                 booking.hotel_name || 'Hotel',
      //                 customerDetails,
      //                 hotelOwnerDetails
      //               );

      //               if (whatsappResults.customer?.success) {
      //                 console.log(`📱 WhatsApp sent to customer: ${customerDetails.name}`);
      //               }
      //               if (whatsappResults.hotelOwner?.success) {
      //                 console.log(`📱 WhatsApp sent to hotel owner: ${hotelOwnerDetails.name}`);
      //               }
      //             } catch (whatsappError) {
      //               console.error(`❌ WhatsApp error:`, whatsappError.message);
      //             }
      //           } else {
      //             console.log(`📱 No phone numbers for WhatsApp - booking ${bookingId}`);
      //           }
      //         }
      //       } catch (error) {
      //         console.error('❌ Error sending booking confirmations:', error);
      //       }
      //     }, 1000);
      //   } catch (error) {
      //     console.error('❌ Confirmation setup error:', error);
      //   }
      // }

      // In bookingController.js - Find the createBooking method and update the notification section

      // ===========================================
      // SEND NOTIFICATIONS BASED ON HOTEL PREFERENCES (Pro / Pro Plus only)
      // ===========================================
      if (status === 'booked') {
        if (isBasicHotelPlan(req.user.hotel_plan)) {
          console.log(`ℹ️ Basic plan hotel ${hotelId} — skipping booking email/WhatsApp notifications`);
        } else {
        try {
          // Send notifications asynchronously
          setTimeout(async () => {
            try {
              // Get hotel notification settings
              const [hotelSettingsRows] = await pool.execute(
                'SELECT notification_settings FROM hotels WHERE id = ?',
                [hotelId]
              );

              // Default settings (both enabled if not set)
              let notificationSettings = { email: true, whatsapp: true };

              if (hotelSettingsRows[0]?.notification_settings) {
                try {
                  let settings = hotelSettingsRows[0].notification_settings;
                  if (typeof settings === 'string') {
                    settings = JSON.parse(settings);
                  }
                  notificationSettings = { ...notificationSettings, ...settings };
                } catch (e) {
                  console.error('Error parsing notification settings:', e);
                }
              }

              console.log(`📧 Hotel ${hotelId} notification settings:`, notificationSettings);

              // Get full booking details
              const [fullBooking] = await pool.execute(`
                    SELECT b.*, r.room_number, r.type as room_type,
                           c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
                           c.customer_gst_no, c.address, c.city, c.state, c.pincode,
                           h.name as hotel_name, b.hotel_id
                    FROM bookings b
                    LEFT JOIN rooms r ON b.room_id = r.id
                    LEFT JOIN customers c ON b.customer_id = c.id
                    LEFT JOIN hotels h ON b.hotel_id = h.id
                    WHERE b.id = ? AND b.hotel_id = ?
                `, [bookingId, hotelId]);

              if (fullBooking.length > 0) {
                const booking = fullBooking[0];

                // Get hotel admin details
                const [adminRows] = await pool.execute(
                  `SELECT email, name, phone FROM users 
                         WHERE hotel_id = ? AND role = 'admin' AND status = 'active'
                         LIMIT 1`,
                  [hotelId]
                );

                const hotelAdmin = adminRows.length > 0 ? adminRows[0] : null;
                const hotelAdminEmail = hotelAdmin ? hotelAdmin.email : process.env.EMAIL_USER;
                const hotelAdminName = hotelAdmin ? hotelAdmin.name : 'Hotel Admin';
                const hotelAdminPhone = hotelAdmin ? hotelAdmin.phone : null;

                const hotelDetails = {
                  name: booking.hotel_name || 'Hotel',
                  email: hotelAdminEmail,
                  address: ''
                };

                const hotelOwnerDetails = {
                  name: hotelAdminName,
                  email: hotelAdminEmail,
                  phone: hotelAdminPhone
                };

                const customerEmail = booking.customer_email;
                const customerName = booking.customer_name;
                const customerPhone = booking.customer_phone;

                const customerDetails = {
                  name: customerName,
                  email: customerEmail,
                  phone: customerPhone
                };

                // 1. SEND EMAIL (only if enabled in hotel settings)
                if (notificationSettings.email) {
                  if (customerDetails.email) {
                    await EmailService.sendBookingConfirmation(booking, hotelDetails, customerDetails, {
                      companyLogoUrl: companyLogoBase64,
                      companyName: 'Hithlaksh Solutions Private Limited',
                      companyWebsite: 'https://hithlakshsolutions.com/',
                      privacyLink: 'https://hithlakshsolutions.com/privacy',
                      termsLink: 'https://hithlakshsolutions.com/terms'
                    });
                    console.log(`✅ Booking confirmation email sent to customer for booking ${bookingId}`);
                  } else {
                    console.log(`⚠️ No email for customer - booking ${bookingId}`);
                  }
                } else {
                  console.log(`⚠️ Email notifications disabled for hotel ${hotelId} - skipping email for booking ${bookingId}`);
                }

                // 2. SEND WHATSAPP (only if enabled in hotel settings)
                if (notificationSettings.whatsapp) {
                  if (customerDetails.phone || hotelOwnerDetails.phone) {
                    try {
                      const whatsappResults = await WhatsAppService.sendBookingConfirmationToAll(
                        booking,
                        booking.hotel_name || 'Hotel',
                        customerDetails,
                        hotelOwnerDetails
                      );

                      if (whatsappResults.customer?.success) {
                        console.log(`📱 WhatsApp sent to customer: ${customerDetails.name}`);
                      }
                      if (whatsappResults.hotelOwner?.success) {
                        console.log(`📱 WhatsApp sent to hotel owner: ${hotelOwnerDetails.name}`);
                      }
                    } catch (whatsappError) {
                      console.error(`❌ WhatsApp error for booking ${bookingId}:`, whatsappError.message);
                    }
                  } else {
                    console.log(`📱 No phone numbers for WhatsApp - booking ${bookingId}`);
                  }
                } else {
                  console.log(`⚠️ WhatsApp notifications disabled for hotel ${hotelId} - skipping WhatsApp for booking ${bookingId}`);
                }
              }
            } catch (error) {
              console.error('❌ Error sending booking confirmations:', error);
            }
          }, 1000);
        } catch (error) {
          console.error('❌ Confirmation setup error:', error);
        }
        }
      }

      // ===========================================
      // 9. RESPONSE
      // ===========================================
      const responseData = {
        bookingId: bookingId,
        customerId: finalCustomerId,
        isNewCustomer: isNewCustomer,
        bookingDetails: {
          room_id: room_id,
          room_number: room.room_number,
          from_date: from_date,
          to_date: to_date,
          status: status || 'booked',
          total: parseFloat(total || 0),
          payment_method: payment_method,
          referral_by: referral_by || '',
          referral_amount: parseFloat(referral_amount || 0)
        }
      };

      if (transactionRecord) {
        responseData.transaction = {
          transactionId: generatedTransactionId,
          transactionRecordId: transactionRecord,
          amount: parseFloat(total || 0),
          payment_method: payment_method,
          payment_status: payment_status || 'pending'
        };
      }

      res.status(201).json({
        success: true,
        message: isNewCustomer ? 'New customer and booking created successfully' : 'Booking created successfully',
        data: responseData
      });

    } catch (error) {
      console.error('❌ Create booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },


  getBookings: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;

      // Modified query to include advance booking details
      const [rows] = await pool.execute(`
      SELECT b.*, 
             c.name as customer_name,
             c.phone as customer_phone,
             c.email as customer_email,
             r.room_number,
             r.type as room_type,
             ab.invoice_number as advance_invoice_number,
             ab.advance_amount as original_advance_amount,
             ab.status as advance_status
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN advance_bookings ab ON b.advance_booking_id = ab.id
      WHERE b.hotel_id = ?
      ORDER BY b.created_at DESC
    `, [hotelId]);

      res.json({
        success: true,
        data: rows
      });

    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },


  getBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      const booking = await Booking.findById(id, hotelId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      // Get customer details if booking has customer
      let customerDetails = null;
      if (booking.customer_id) {
        customerDetails = await Customer.findByIdWithImages(booking.customer_id, hotelId);
      }

      res.json({
        success: true,
        data: {
          ...booking,
          customer: customerDetails
        }
      });

    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },



  updateBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const bookingData = req.body;

      console.log('='.repeat(50));
      console.log('📝 UPDATE BOOKING REQUEST RECEIVED');
      console.log('='.repeat(50));
      console.log('Booking ID:', id);
      console.log('Hotel ID:', hotelId);
      console.log('Request Body:', JSON.stringify(bookingData, null, 2));

      // Get current booking details
      const currentBooking = await Booking.findById(id, hotelId);
      if (!currentBooking) {
        console.log('❌ Booking not found');
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      console.log('📋 Current Booking Details:', {
        id: currentBooking.id,
        room_id: currentBooking.room_id,
        from_date: currentBooking.from_date,
        to_date: currentBooking.to_date,
        status: currentBooking.status
      });

      const resolvedFromDate = bookingData.from_date || currentBooking.from_date;
      const resolvedToDate = bookingData.to_date || currentBooking.to_date;
      const fromDateStr = resolvedFromDate ? String(resolvedFromDate).slice(0, 10) : '';
      const toDateStr = resolvedToDate ? String(resolvedToDate).slice(0, 10) : '';

      if (fromDateStr && toDateStr && toDateStr < fromDateStr) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DATES',
          message: 'Checkout date cannot be before check-in date'
        });
      }

      // ===========================================
      // CHECK FOR DUPLICATE WHEN UPDATING
      // ===========================================
      if ((bookingData.room_id || currentBooking.room_id) &&
        (bookingData.customer_id || currentBooking.customer_id) &&
        (bookingData.from_date || currentBooking.from_date) &&
        (bookingData.to_date || currentBooking.to_date)) {

        const checkRoomId = bookingData.room_id || currentBooking.room_id;
        const checkCustomerId = bookingData.customer_id || currentBooking.customer_id;
        const checkFromDate = bookingData.from_date || currentBooking.from_date;
        const checkToDate = bookingData.to_date || currentBooking.to_date;

        console.log('🔍 Checking for duplicate booking:', {
          checkRoomId,
          checkCustomerId,
          checkFromDate,
          checkToDate,
          excludeBookingId: id
        });

        // Skip duplicate check if customer is being removed (null)
        if (checkCustomerId) {
          const duplicateBooking = await Booking.checkDuplicateBooking(
            hotelId,
            checkRoomId,
            checkCustomerId,
            checkFromDate,
            checkToDate,
            id // Exclude current booking
          );

          console.log('📊 Duplicate check result:', duplicateBooking ? 'DUPLICATE FOUND' : 'No duplicate');

          if (duplicateBooking) {
            console.log('❌ Duplicate booking found:', duplicateBooking);
            return res.status(400).json({
              success: false,
              error: 'DUPLICATE_BOOKING',
              message: 'Another booking already exists for this customer in the same room and dates',
              data: {
                existing_booking_id: duplicateBooking.id,
                customer_name: duplicateBooking.customer_name,
                room_number: duplicateBooking.room_number,
                from_date: duplicateBooking.from_date,
                to_date: duplicateBooking.to_date,
                status: duplicateBooking.status
              }
            });
          }
        }
      }

      // ===========================================
      // CRITICAL: CHECK ROOM AVAILABILITY
      // ===========================================
      // If dates or room is changing, check if the room is available
      if ((bookingData.from_date || bookingData.to_date || bookingData.room_id)) {

        const checkRoomId = bookingData.room_id || currentBooking.room_id;
        const checkFromDate = bookingData.from_date || currentBooking.from_date;
        const checkToDate = bookingData.to_date || currentBooking.to_date;
        const checkFromTime = bookingData.from_time || currentBooking.from_time || '14:00';
        const checkToTime = bookingData.to_time || currentBooking.to_time || '12:00';

        // Get the new status (if being updated, otherwise keep current)
        const checkStatus = bookingData.status || currentBooking.status;

        console.log('🔍 CHECKING ROOM AVAILABILITY:', {
          roomId: checkRoomId,
          fromDate: checkFromDate,
          toDate: checkToDate,
          fromTime: checkFromTime,
          toTime: checkToTime,
          currentStatus: checkStatus,
          excludeBookingId: id
        });

        // Check if room is available for these dates
        const isAvailable = await Booking.checkRoomAvailability(
          checkRoomId,
          hotelId,
          checkFromDate,
          checkToDate,
          id, // Exclude current booking
          checkStatus,
          checkFromTime,
          checkToTime
        );

        console.log('✅ AVAILABILITY CHECK RESULT:', isAvailable ? 'AVAILABLE ✅' : 'NOT AVAILABLE ❌');

        if (!isAvailable) {
          console.log('❌ ROOM NOT AVAILABLE - Blocking update');
          return res.status(400).json({
            success: false,
            error: 'ROOM_NOT_AVAILABLE',
            message: 'Room is already booked or blocked for the selected dates'
          });
        } else {
          console.log('✅ ROOM IS AVAILABLE - Proceeding with update');
        }
      }

      // Update booking
      console.log('📝 Attempting to update booking with data:', bookingData);
      const updated = await Booking.update(id, hotelId, bookingData);

      console.log('📊 Update result:', updated ? 'SUCCESS ✅' : 'FAILED ❌');

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found or not updated'
        });
      }

      // Update room status if needed
      if (bookingData.status === 'completed' || bookingData.status === 'cancelled') {
        const roomId = bookingData.room_id || currentBooking.room_id;
        if (roomId) {
          const Room = require('../models/Room');
          await Room.updateStatus(roomId, hotelId, 'available');
          console.log(`✅ Room ${roomId} set to available`);
        }
      } else if (bookingData.status === 'booked' && currentBooking.status !== 'booked') {
        const roomId = bookingData.room_id || currentBooking.room_id;
        if (roomId) {
          const Room = require('../models/Room');
          await Room.updateStatus(roomId, hotelId, 'booked');
          console.log(`✅ Room ${roomId} set to booked`);
        }
      }

      console.log('✅ Booking updated successfully');
      console.log('='.repeat(50));

      res.json({
        success: true,
        message: 'Booking updated successfully'
      });

    } catch (error) {
      console.error('❌ UPDATE BOOKING ERROR:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },
  // Update booking payment status
  updateBookingPayment: async (req, res) => {
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

      const updated = await Booking.updatePaymentStatus(id, hotelId, payment_status, transaction_id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      // Also update customer payment status if booking has customer
      const booking = await Booking.findById(id, hotelId);
      if (booking && booking.customer_id) {
        await Customer.updatePaymentStatus(booking.customer_id, hotelId, payment_status, transaction_id);
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully'
      });

    } catch (error) {
      console.error('Update booking payment error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get bookings by payment status
  getBookingsByPaymentStatus: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { status } = req.params;

      if (!['pending', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PAYMENT_STATUS',
          message: 'Invalid payment status'
        });
      }

      const bookings = await Booking.getByPaymentStatus(hotelId, status);

      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Get bookings by payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Get today's activities
  getTodaysActivities: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;

      const [checkins, checkouts] = await Promise.all([
        Booking.getTodaysCheckins(hotelId),
        Booking.getTodaysCheckouts(hotelId)
      ]);

      res.json({
        success: true,
        data: {
          checkins,
          checkouts
        }
      });

    } catch (error) {
      console.error('Get today\'s activities error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Generate payment QR code
  generatePaymentQR: async (req, res) => {
    try {
      const { amount, booking_id, customer_name } = req.body;
      const hotelId = req.user.hotel_id;

      if (!amount || !booking_id) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Amount and booking ID are required'
        });
      }

      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Update booking with transaction ID
      await Booking.updatePaymentStatus(booking_id, hotelId, 'pending', transactionId);

      // Generate UPI QR code data
      const upiId = process.env.UPI_ID || 'hotel.management@upi';
      const merchantName = process.env.MERCHANT_NAME || 'Hotel Management';

      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionId)}`;

      res.json({
        success: true,
        data: {
          qr_data: upiString,
          transaction_id: transactionId,
          amount: amount,
          upi_id: upiId,
          merchant_name: merchantName,
          instructions: 'Scan this QR code with any UPI app to pay'
        }
      });

    } catch (error) {
      console.error('Generate payment QR error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to generate payment QR code'
      });
    }
  },

  // Verify payment
  verifyPayment: async (req, res) => {
    try {
      const { transaction_id, booking_id } = req.body;
      const hotelId = req.user.hotel_id;

      if (!transaction_id || !booking_id) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Transaction ID and booking ID are required'
        });
      }

      // In real implementation, verify with payment gateway
      // For demo, simulate successful verification
      const isSuccess = Math.random() > 0.1; // 90% success rate

      if (isSuccess) {
        // Update booking payment status
        await Booking.updatePaymentStatus(booking_id, hotelId, 'completed', transaction_id);

        // Get booking to update customer payment status
        const booking = await Booking.findById(booking_id, hotelId);
        if (booking && booking.customer_id) {
          await Customer.updatePaymentStatus(booking.customer_id, hotelId, 'completed', transaction_id);
        }

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            payment_status: 'completed',
            transaction_id: transaction_id
          }
        });
      } else {
        // Update as failed
        await Booking.updatePaymentStatus(booking_id, hotelId, 'failed', transaction_id);

        res.status(400).json({
          success: false,
          error: 'PAYMENT_FAILED',
          message: 'Payment verification failed'
        });
      }

    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to verify payment'
      });
    }
  },

  // Check room availability
  checkRoomAvailability: async (req, res) => {
    try {
      const { room_id, from_date, to_date, exclude_booking_id, from_time, to_time } = req.body;
      const hotelId = req.user.hotel_id;

      if (!room_id || !from_date || !to_date) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Room ID, from date, and to date are required'
        });
      }

      const isAvailable = await Booking.checkRoomAvailability(
        room_id,
        hotelId,
        from_date,
        to_date,
        exclude_booking_id,
        'booked',
        from_time || '14:00',
        to_time || '12:00'
      );

      res.json({
        success: true,
        data: {
          available: isAvailable,
          room_id: room_id,
          from_date: from_date,
          to_date: to_date,
          from_time: from_time || '14:00',
          to_time: to_time || '12:00'
        }
      });

    } catch (error) {
      console.error('Check room availability error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },

  // Update booking status
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { status } = req.body;

      if (!['booked', 'maintenance', 'blocked', 'available'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: 'Invalid booking status'
        });
      }

      const updated = await Booking.updateStatus(id, hotelId, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      // Update room status if booking is canceled/completed
      const booking = await Booking.findById(id, hotelId);
      if (booking && (status === 'available' || status === 'completed')) {
        await Room.updateStatus(booking.room_id, hotelId, 'available');
      }

      res.json({
        success: true,
        message: 'Booking status updated successfully'
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },



  // Delete booking
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('🗑️ Delete booking request:', { id, hotelId });

      // Get booking details before deletion
      const booking = await Booking.findById(id, hotelId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      console.log('📋 Booking details:', {
        id: booking.id,
        payment_method: booking.payment_method,
        room_id: booking.room_id,
        status: booking.status
      });

      // ===========================================
      // DELETE RELATED RECORDS BASED ON PAYMENT METHOD
      // ===========================================

      // Delete from collections table if cash payment
      if (booking.payment_method === 'cash') {
        const [collectionResult] = await pool.execute(
          'DELETE FROM collections WHERE booking_id = ? AND hotel_id = ?',
          [id, hotelId]
        );
        console.log(`💰 Deleted ${collectionResult.affectedRows} collection record(s) for booking ${id}`);
      }

      // Delete from transactions table if online payment
      if (booking.payment_method === 'online') {
        const [transactionResult] = await pool.execute(
          'DELETE FROM transactions WHERE booking_id = ? AND hotel_id = ?',
          [id, hotelId]
        );
        console.log(`💳 Deleted ${transactionResult.affectedRows} transaction record(s) for booking ${id}`);
      }

      // Also delete from transactions if there's a transaction_id but payment_method not set
      if (booking.transaction_id) {
        const [transactionResult] = await pool.execute(
          'DELETE FROM transactions WHERE booking_id = ? AND hotel_id = ?',
          [id, hotelId]
        );
        if (transactionResult.affectedRows > 0) {
          console.log(`💳 Deleted ${transactionResult.affectedRows} transaction record(s) for booking ${id} (by transaction_id)`);
        }
      }

      // Check for and unlink advance booking if exists
      if (booking.advance_booking_id) {
        await pool.execute(
          'UPDATE bookings SET advance_booking_id = NULL WHERE id = ?',
          [id]
        );
        console.log(`🔗 Unlinked advance booking ${booking.advance_booking_id} from booking ${id}`);
      }

      // Update room status back to available
      if (booking.room_id) {
        const Room = require('../models/Room');
        await Room.updateStatus(booking.room_id, hotelId, 'available');
        console.log(`✅ Room ${booking.room_id} status updated to available`);
      }

      // Finally, delete the booking
      const deleted = await Booking.delete(id, hotelId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      console.log('✅ Booking and related records deleted successfully:', {
        bookingId: id,
        payment_method: booking.payment_method,
        deletedCollections: booking.payment_method === 'cash',
        deletedTransactions: booking.payment_method === 'online'
      });

      res.json({
        success: true,
        message: 'Booking and all related records deleted successfully',
        data: {
          bookingId: id,
          deletedCollections: booking.payment_method === 'cash',
          deletedTransactions: booking.payment_method === 'online'
        }
      });

    } catch (error) {
      console.error('❌ Delete booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  getBookingsByDateRange: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'DATE_RANGE_REQUIRED',
          message: 'Start date and end date are required'
        });
      }

      const bookings = await Booking.getByDateRange(hotelId, start_date, end_date);

      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Get bookings by date range error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  },






  generateInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('📄 Generating invoice for booking:', { id, hotelId });

      const booking = await Booking.findById(id, hotelId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      let customerDetails = null;
      if (booking.customer_id) {
        customerDetails = await Customer.findById(booking.customer_id, hotelId);
      }

      const roomDetails = await Room.findById(booking.room_id, hotelId);

      const [hotelRows] = await pool.execute(`
            SELECT h.*, u.phone as hotel_phone, u.email as hotel_email
            FROM hotels h
            LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
            WHERE h.id = ?
            LIMIT 1
        `, [hotelId]);

      const hotelDetails = hotelRows[0] || {};

      const [logoRows] = await pool.execute(
        `SELECT logo_image FROM hotels WHERE id = ?`,
        [hotelId]
      );
      const hotelLogo = logoRows[0]?.logo_image || companyLogoBase64;

      const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } catch (e) {
          return dateStr;
        }
      };

      const calculateNights = (fromDate, toDate) => {
        try {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          const diffTime = Math.abs(to - from);
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
          return 1;
        }
      };

      const nights = calculateNights(booking.from_date, booking.to_date);
      const amount = parseFloat(booking.amount) || 0;
      const perNightCharge = nights > 0 ? amount / nights : amount;
      const safeValue = (value, defaultValue = 0) => value !== null && value !== undefined ? value : defaultValue;
      const otherExpenses = parseFloat(customerDetails?.other_expenses) || 0;
      const expenseDescription = customerDetails?.expense_description || '';
      const cgst = parseFloat(booking.cgst) || 0;
      const sgst = parseFloat(booking.sgst) || 0;
      const igst = parseFloat(booking.igst) || 0;
      const discountPercentage = parseFloat(booking.discount_percentage) || 0;
      const discountAmount = parseFloat(booking.discount_amount) || 0;
      const originalAmount = parseFloat(booking.original_amount) || amount;

      // Payment breakdown: advance at booking vs paid at checkout
      const paymentBreakdown = getPaymentBreakdown(booking);
      const { bookingAdvance, checkoutPaid, totalPaid, remainingAmount } = paymentBreakdown;

      let taxType = 'cgst_sgst';
      let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;

      if (cgst > 0 || sgst > 0) {
        taxType = 'cgst_sgst';
        const taxableAmount = safeValue(booking.amount) + safeValue(booking.service);
        if (taxableAmount > 0) {
          cgstPercentage = (cgst / taxableAmount) * 100;
          sgstPercentage = (sgst / taxableAmount) * 100;
        }
      } else if (igst > 0) {
        taxType = 'igst';
        const taxableAmount = safeValue(booking.amount) + safeValue(booking.service);
        if (taxableAmount > 0) {
          igstPercentage = (igst / taxableAmount) * 100;
        }
      }

      const charges = [];

      if (discountPercentage > 0) {
        charges.push({
          description: `Room Charges (${nights} night${nights > 1 ? 's' : ''}) - Original`,
          amount: originalAmount,
          isOriginal: true
        });
        charges.push({
          description: `Room Charges (${nights} night${nights > 1 ? 's' : ''}) - After Discount`,
          amount: safeValue(booking.amount),
          isDiscounted: true
        });
        charges.push({
          description: `Discount (${discountPercentage}% OFF)`,
          amount: -discountAmount,
          isDiscount: true
        });
      } else {
        charges.push({
          description: `Room Charges (${nights} night${nights > 1 ? 's' : ''} @ ₹${perNightCharge.toFixed(2)}/night)`,
          amount: safeValue(booking.amount)
        });
      }

      charges.push({
        description: 'Service Charges',
        amount: safeValue(booking.service)
      });

      if (cgst > 0) {
        charges.push({
          description: `CGST @ ${cgstPercentage.toFixed(2)}%`,
          amount: cgst
        });
      }

      if (sgst > 0) {
        charges.push({
          description: `SGST @ ${sgstPercentage.toFixed(2)}%`,
          amount: sgst
        });
      }

      if (igst > 0) {
        charges.push({
          description: `IGST @ ${igstPercentage.toFixed(2)}%`,
          amount: igst
        });
      }

      if (otherExpenses > 0) {
        charges.push({
          description: `Other Expenses${expenseDescription ? ` (${expenseDescription})` : ''}`,
          amount: otherExpenses
        });
      }

      // Payment lines on invoice
      if (bookingAdvance > 0) {
        charges.push({
          description:
            booking.status === 'completed'
              ? 'Advance Paid at Booking'
              : 'Advance Payment Already Paid',
          amount: -bookingAdvance,
          isAdvance: true
        });
      }

      if (checkoutPaid > 0) {
        charges.push({
          description: 'Paid at Checkout',
          amount: -checkoutPaid,
          isCheckoutPayment: true
        });
      }

      if (remainingAmount > 0) {
        charges.push({
          description:
            booking.status === 'completed' ? 'Balance Due' : 'Balance Due at Check-in',
          amount: remainingAmount,
          isBalance: true,
          bold: true,
          borderTop: true
        });
      }

      const invoiceData = {
        invoiceNumber: booking.invoice_number || `INV-${Date.now().toString().slice(-6)}-${booking.id}`,
        invoiceDate: formatDateDisplay(new Date().toISOString()),
        taxType: taxType,
        discountApplied: discountPercentage > 0,
        discountPercentage: discountPercentage,
        discountAmount: discountAmount,
        originalAmount: originalAmount,
        advancePaid: bookingAdvance,
        checkoutPaid,
        totalPaid,
        remainingAmount: remainingAmount,
        hotel: {
          name: hotelDetails.name || 'Hotel',
          address: hotelDetails.address || '',
          phone: hotelDetails.hotel_phone || hotelDetails.phone || '',
          gstin: hotelDetails.gst_number || hotelDetails.gstin || '',
          email: hotelDetails.hotel_email || hotelDetails.email || '',
          logo: hotelLogo
        },
        customer: customerDetails ? {
          name: customerDetails.name || '',
          phone: customerDetails.phone || '',
          email: customerDetails.email || '',
          address: customerDetails.address || '',
          city: customerDetails.city || '',
          state: customerDetails.state || '',
          pincode: customerDetails.pincode || '',
          idNumber: customerDetails.id_number || '',
          idType: customerDetails.id_type || 'aadhaar',
          customerGstNo: customerDetails.customer_gst_no || '',
          purposeOfVisit: customerDetails.purpose_of_visit || '',
          otherExpenses: otherExpenses,
          expenseDescription: expenseDescription
        } : {
          name: 'Walk-in Customer',
          phone: 'N/A'
        },
        booking: {
          id: booking.id || '',
          roomNumber: roomDetails?.room_number || booking.room_id || '',
          roomType: roomDetails?.type || 'Standard',
          fromDate: formatDateDisplay(booking.from_date),
          toDate: formatDateDisplay(booking.to_date),
          fromTime: booking.from_time || '14:00',
          toTime: booking.to_time || '12:00',
          status: booking.status || '',
          nights: nights,
          guests: booking.guests || 1
        },
        charges: charges,
        subtotal: safeValue(booking.amount) + safeValue(booking.service),
        cgst: cgst,
        sgst: sgst,
        igst: igst,
        total: safeValue(booking.total),
        payment: {
          method: booking.payment_method || 'cash',
          status:
            booking.status === 'completed' && (!booking.payment_status || booking.payment_status === 'pending')
              ? 'completed'
              : (booking.payment_status || 'pending'),
          transactionId: booking.transaction_id || '',
          advancePaid: bookingAdvance,
          checkoutPaid,
          totalPaid,
          remainingAmount: remainingAmount
        },
        footer: {
          note: 'Thank you for your stay with us!',
          terms: 'Check-out time is 12:00 PM',
          signature: 'Authorized Signature',
          companyName: hotelDetails.name || 'Hotel Management System',
          companyUrl: 'https://hithlakshsolutions.com/'
        }
      };

      console.log('✅ Invoice data generated with payment breakdown:', {
        bookingAdvance,
        checkoutPaid,
        totalPaid,
        remainingAmount,
        total: invoiceData.total
      });

      res.json({
        success: true,
        message: 'Invoice generated successfully',
        data: invoiceData
      });

    } catch (error) {
      console.error('❌ Generate invoice error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },


  //   downloadInvoice: async (req, res) => {
  //     try {
  //       const { id } = req.params;
  //       const hotelId = req.user.hotel_id;

  //       console.log('📥 Downloading invoice for booking:', { id, hotelId });

  //       // Get booking with all details
  //       const booking = await Booking.findById(id, hotelId);
  //       if (!booking) {
  //         return res.status(404).json({
  //           success: false,
  //           error: 'BOOKING_NOT_FOUND',
  //           message: 'Booking not found'
  //         });
  //       }

  //       // Get all related data
  //       let customerDetails = null;
  //       if (booking.customer_id) {
  //         customerDetails = await Customer.findById(booking.customer_id, hotelId);
  //       }

  //       const roomDetails = await Room.findById(booking.room_id, hotelId);

  //       // Get hotel details
  //       const [hotelRows] = await pool.execute(`
  //             SELECT 
  //                 h.*,
  //                 u.phone as hotel_phone,
  //                 u.email as hotel_email,
  //                 u.name as admin_name
  //             FROM hotels h
  //             LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
  //             WHERE h.id = ?
  //             LIMIT 1
  //         `, [hotelId]);

  //       const hotelDetails = hotelRows[0] || {};

  //       // Get hotel logo
  //       const [logoRows] = await pool.execute(
  //         `SELECT logo_image FROM hotels WHERE id = ?`,
  //         [hotelId]
  //       );
  //       const hotelLogo = logoRows[0]?.logo_image || companyLogoBase64;

  //       // Format dates
  //       const formatDateDisplay = (dateStr) => {
  //         if (!dateStr) return '';
  //         try {
  //           const date = new Date(dateStr);
  //           return date.toLocaleDateString('en-IN', {
  //             day: '2-digit',
  //             month: 'long',
  //             year: 'numeric'
  //           });
  //         } catch (e) {
  //           return dateStr;
  //         }
  //       };

  //       const calculateNights = (fromDate, toDate) => {
  //         if (!fromDate || !toDate) return 1;
  //         try {
  //           const from = new Date(fromDate);
  //           const to = new Date(toDate);
  //           const diffTime = Math.abs(to - from);
  //           return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //         } catch (e) {
  //           return 1;
  //         }
  //       };

  //       // Helper functions
  //       const formatCurrency = (value) => {
  //         if (value === null || value === undefined) return '0';
  //         const num = parseFloat(value);
  //         return isNaN(num) ? '0' : num.toLocaleString('en-IN', {
  //           minimumFractionDigits: 0,
  //           maximumFractionDigits: 0
  //         });
  //       };

  //       const getString = (value, defaultValue = '') => {
  //         return value !== null && value !== undefined ? String(value) : defaultValue;
  //       };

  //       // Calculate amounts
  //       const nights = calculateNights(booking.from_date, booking.to_date);
  //       const roomAmount = parseFloat(booking.amount) || 0;
  //       const serviceAmount = parseFloat(booking.service) || 0;
  //       const cgstAmount = parseFloat(booking.cgst) || 0;
  //       const sgstAmount = parseFloat(booking.sgst) || 0;
  //       const igstAmount = parseFloat(booking.igst) || 0;
  //       const totalAmount = parseFloat(booking.total) || 0;
  //       const perNightRate = nights > 0 ? roomAmount / nights : roomAmount;

  //       // Get advance payment amount
  //       const advancePaid = parseFloat(booking.advance_amount_paid) || 0;
  //       const remainingAmount = parseFloat(booking.remaining_amount) || (totalAmount - advancePaid);

  //       // Get discount values
  //       const discountPercentage = parseFloat(booking.discount_percentage) || 0;
  //       const discountAmount = parseFloat(booking.discount_amount) || 0;
  //       const originalAmount = parseFloat(booking.original_amount) || roomAmount;

  //       // Calculate percentages
  //       const taxableAmount = originalAmount + serviceAmount;
  //       let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;
  //       if (taxableAmount > 0) {
  //         if (cgstAmount > 0) cgstPercentage = (cgstAmount / taxableAmount) * 100;
  //         if (sgstAmount > 0) sgstPercentage = (sgstAmount / taxableAmount) * 100;
  //         if (igstAmount > 0) igstPercentage = (igstAmount / taxableAmount) * 100;
  //       }

  //       // Determine tax type
  //       const taxType = igstAmount > 0 ? 'igst' : 'cgst_sgst';

  //       // Get other expenses
  //       const otherExpenses = parseFloat(customerDetails?.other_expenses) || 0;
  //       const expenseDescription = (customerDetails?.expense_description || '').replace(/'/g, "\\'");

  //       const escapeHtml = (str) => {
  //         if (!str) return '';
  //         return String(str)
  //           .replace(/&/g, '&amp;')
  //           .replace(/</g, '&lt;')
  //           .replace(/>/g, '&gt;')
  //           .replace(/"/g, '&quot;')
  //           .replace(/'/g, '&#39;');
  //       };

  //       // Generate invoice HTML with advance payment section
  //       const invoiceHTML = `<!DOCTYPE html>
  // <html lang="en">
  // <head>
  // <meta charset="UTF-8">
  // <meta name="viewport" content="width=device-width, initial-scale=1.0">
  // <title>Invoice - ${getString(booking.invoice_number)}</title>
  // <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
  // <style>
  //   *{box-sizing:border-box;margin:0;padding:0}
  //   body{background:#F0EDE8;font-family:'Outfit',sans-serif;min-height:100vh;padding:2rem;display:flex;justify-content:center;align-items:center;}
  //   #invoice{max-width:860px;margin:0 auto;background:#FDFAF5;border:1px solid #C9A84C;font-family:'Outfit',sans-serif;}

  //   .inv-header{background:#1A1208;color:#C9A84C;padding:2.2rem 2.8rem 1.8rem;display:flex;justify-content:space-between;align-items:flex-start;}
  //   .inv-logo-name{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:300;letter-spacing:.18em;color:#F0D98C;line-height:1.1;}
  //   .inv-logo-sub{font-size:9px;font-family:'Outfit',sans-serif;font-weight:300;letter-spacing:.45em;color:#A08030;margin-top:4px;text-transform:uppercase;}
  //   .inv-logo-addr{font-size:10px;color:#7A6030;margin-top:8px;line-height:1.8;font-weight:300;}
  //   .inv-header-right{text-align:right;}
  //   .inv-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;letter-spacing:.2em;color:#F0D98C;text-transform:uppercase;}
  //   .inv-meta-line{font-size:10.5px;color:#A08030;margin:2px 0;font-weight:300;}
  //   .inv-meta-line strong{color:#C9A84C;}
  //   .gold-bar{height:2px;background:#C9A84C;}

  //   .inv-guest-row{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #E8D9B0;}
  //   .inv-guest-cell{padding:1.2rem 2.2rem;border-right:1px solid #E8D9B0;}
  //   .inv-guest-cell:last-child{border-right:none;}
  //   .cell-label{font-size:8.5px;font-weight:600;letter-spacing:.25em;color:#A08030;text-transform:uppercase;margin-bottom:5px;}
  //   .cell-value{font-size:12.5px;color:#1A1208;line-height:1.5;}
  //   .cell-value strong{font-weight:600;display:block;font-size:13.5px;}

  //   .sec-title{font-size:9px;font-weight:600;letter-spacing:.3em;color:#A08030;text-transform:uppercase;padding:1rem 2.2rem .5rem;border-top:1px solid #E8D9B0;}

  //   .inv-tbl{width:100%;border-collapse:collapse;table-layout:fixed;}
  //   .inv-tbl thead tr{background:#F5EDD8;}
  //   .inv-tbl th{font-size:8.5px;font-weight:600;letter-spacing:.2em;color:#A08030;text-transform:uppercase;padding:.5rem .9rem;text-align:left;border-bottom:1px solid #E8D9B0;}
  //   .inv-tbl th:first-child{padding-left:2.2rem;width:44%;}
  //   .inv-tbl th:last-child{text-align:right;padding-right:2.2rem;}
  //   .inv-tbl td{font-size:12px;color:#2A1F0A;padding:.55rem .9rem;border-bottom:1px solid #F0E8CF;vertical-align:top;font-weight:300;}
  //   .inv-tbl td:first-child{padding-left:2.2rem;font-weight:400;}
  //   .inv-tbl td:last-child{text-align:right;padding-right:2.2rem;font-weight:500;}
  //   .inv-tbl td .note{font-size:10px;color:#7A6030;font-style:italic;font-family:'Cormorant Garamond',serif;display:block;margin-top:1px;}

  //   .calc-area{background:#FAF4E8;padding:1rem 2.2rem;display:flex;flex-direction:column;align-items:flex-end;gap:4px;border-top:1px solid #E8D9B0;}
  //   .calc-row{display:flex;gap:2.5rem;font-size:12px;color:#5A4010;}
  //   .calc-row span:last-child{min-width:80px;text-align:right;font-weight:500;}
  //   .calc-row.disc span{color:#1A5A20;}
  //   .calc-row.advance span{color:#6A4A20;}
  //   .calc-row.gst{border-top:1px dashed #D9C890;padding-top:4px;}

  //   .total-bar{background:#1A1208;display:flex;justify-content:space-between;align-items:center;padding:1.1rem 2.2rem;}
  //   .total-label{font-size:9px;font-weight:600;letter-spacing:.3em;color:#A08030;text-transform:uppercase;}
  //   .total-amount{font-family:'Cormorant Garamond',serif;font-size:28px;color:#F0D98C;}

  //   .inv-footer{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #C9A84C;}
  //   .inv-footer-cell{padding:1.1rem 2.2rem;}
  //   .inv-footer-cell:first-child{border-right:1px solid #E8D9B0;}
  //   .footer-label{font-size:8.5px;font-weight:600;letter-spacing:.25em;color:#A08030;text-transform:uppercase;margin-bottom:5px;}
  //   .footer-val{font-size:11px;color:#5A4010;line-height:1.8;font-weight:300;}
  //   .remarks-text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13.5px;color:#7A6030;line-height:1.6;}
  //   .paid-stamp{display:inline-block;border:1.5px solid #1A5A20;color:#1A5A20;font-size:8.5px;font-weight:600;letter-spacing:.25em;padding:3px 9px;text-transform:uppercase;margin-top:6px;}

  //   .original-row td:first-child span{text-decoration:line-through;color:#999;}
  //   .discount-row{background:#E8F5E8;}
  //   .advance-row{background:#FFF8E0;}

  //   @media print{
  //     body{background:#fff;padding:0;}
  //     .no-print{display:none;}
  //   }
  // </style>
  // </head>
  // <body>
  // <div id="invoice">
  //   <!-- HEADER -->
  //   <div class="inv-header">
  //     <div>
  //       <div class="inv-logo-name">${escapeHtml(hotelDetails.name || 'Hotel Management')}</div>
  //       <div class="inv-logo-sub">Luxury Collection</div>
  //       <div class="inv-logo-addr">${escapeHtml(hotelDetails.address || 'Address not specified')}<br>Tel: ${escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A')} · GSTIN: ${escapeHtml(hotelDetails.gst_number || 'N/A')}</div>
  //     </div>
  //     <div class="inv-header-right">
  //       <div class="inv-title">INVOICE</div>
  //       <div class="inv-meta-line">No. <strong>${escapeHtml(booking.invoice_number)}</strong></div>
  //       <div class="inv-meta-line">Date: <strong>${formatDateDisplay(new Date().toISOString())}</strong></div>
  //       <div class="inv-meta-line">Folio: <strong>Room ${escapeHtml(roomDetails?.room_number || '')}</strong></div>
  //     </div>
  //   </div>

  //   <div class="gold-bar"></div>

  //   <!-- GUEST ROW -->
  //   <div class="inv-guest-row">
  //     <div class="inv-guest-cell">
  //       <div class="cell-label">Guest</div>
  //       <div class="cell-value"><strong>${escapeHtml(customerDetails?.name || 'Walk-in Customer')}</strong>${escapeHtml(customerDetails?.email || '')}<br>${escapeHtml(customerDetails?.phone || 'N/A')}</div>
  //     </div>
  //     <div class="inv-guest-cell">
  //       <div class="cell-label">Stay Period</div>
  //       <div class="cell-value"><strong>${formatDateDisplay(booking.from_date)} — ${formatDateDisplay(booking.to_date)}</strong>${nights} Nights · ${booking.guests || 1} Adults<br>${escapeHtml(roomDetails?.type || 'Standard')} Room</div>
  //     </div>
  //     <div class="inv-guest-cell">
  //       <div class="cell-label">Reservation</div>
  //       <div class="cell-value"><strong>RES-${booking.id}</strong>${booking.special_requests ? 'Special Request: ' + booking.special_requests.substring(0, 50) : 'Direct Booking'}</div>
  //     </div>
  //   </div>

  //   <!-- ROOM CHARGES SECTION -->
  //   <div class="sec-title">Room Charges</div>
  //   <table class="inv-tbl">
  //     <thead>
  //       <tr><th>Description</th><th>Nights</th><th>Rate / Night</th><th>Amount</th></tr>
  //     </thead>
  //     <tbody>
  //       ${discountPercentage > 0 ? `
  //       <tr class="original-row">
  //         <td><span>${escapeHtml(roomDetails?.type || 'Deluxe King Room')} (Original)</span><span class="note">Bed & Breakfast</span></td>
  //         <td>${nights}</td>
  //         <td>₹${formatCurrency(originalAmount / nights)}</td>
  //         <td>₹${formatCurrency(originalAmount)}</td>
  //       </tr>
  //       <tr class="discount-row">
  //         <td><span>Discount (${discountPercentage}% OFF)</span><span class="note">Special offer applied</span></td>
  //         <td>—</td>
  //         <td>—</td>
  //         <td style="color:#28a745;">-₹${formatCurrency(discountAmount)}</td>
  //       </tr>
  //       ` : ''}
  //       <tr>
  //         <td><span>${escapeHtml(roomDetails?.type || 'Deluxe King Room')}</span><span class="note">${escapeHtml(roomDetails?.amenities || 'Bed & Breakfast')}</span></td>
  //         <td>${nights}</td>
  //         <td>₹${formatCurrency(perNightRate)}</td>
  //         <td>₹${formatCurrency(roomAmount)}</td>
  //       </tr>
  //       ${serviceAmount > 0 ? `
  //       <tr>
  //         <td><span>Service Charges</span><span class="note">Hotel service fee</span></td>
  //         <td>—</td>
  //         <td>—</td>
  //         <td>₹${formatCurrency(serviceAmount)}</td>
  //       </tr>
  //       ` : ''}
  //       ${otherExpenses > 0 ? `
  //       <tr>
  //         <td><span>Other Expenses</span><span class="note">${escapeHtml(expenseDescription || 'Additional charges')}</span></td>
  //         <td>—</td>
  //         <td>—</td>
  //         <td>₹${formatCurrency(otherExpenses)}</td>
  //       </tr>
  //       ` : ''}
  //     </tbody>
  //   </table>

  //   <!-- CALCULATION SECTION -->
  //   <div class="calc-area">
  //     <div class="calc-row"><span>Subtotal</span><span>₹${formatCurrency(roomAmount + serviceAmount)}</span></div>
  //     ${discountPercentage > 0 ? `<div class="calc-row disc"><span>Discount (${discountPercentage}% OFF)</span><span>− ₹${formatCurrency(discountAmount)}</span></div>` : ''}
  //     ${taxType === 'cgst_sgst' && cgstAmount > 0 ? `<div class="calc-row gst"><span>CGST @ ${cgstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(cgstAmount)}</span></div>` : ''}
  //     ${taxType === 'cgst_sgst' && sgstAmount > 0 ? `<div class="calc-row gst"><span>SGST @ ${sgstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(sgstAmount)}</span></div>` : ''}
  //     ${taxType === 'igst' && igstAmount > 0 ? `<div class="calc-row gst"><span>IGST @ ${igstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(igstAmount)}</span></div>` : ''}

  //     <!-- ADVANCE PAYMENT SECTION (SHOW LIKE DISCOUNT) -->
  //     ${advancePaid > 0 ? `
  //     <div class="calc-row advance">
  //       <span>Advance Payment Already Paid</span>
  //       <span class="advance-amount">− ₹${formatCurrency(advancePaid)}</span>
  //     </div>
  //     ` : ''}

  //     <!-- REMAINING BALANCE SECTION -->
  //     <div class="calc-row" style="border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">
  //       <span>Balance Due at Check-in</span>
  //       <span class="balance-amount">₹${formatCurrency(remainingAmount)}</span>
  //     </div>
  //   </div>

  //   <!-- TOTAL BAR -->
  //   <div class="total-bar">
  //     <div>
  //       <div class="total-label">Total Amount</div>
  //       <div style="font-size:10px;opacity:.6;margin-top:2px;">INR · Inclusive of all taxes</div>
  //       ${advancePaid > 0 ? `<div style="font-size:9px;color:#A08030;margin-top:4px;">Advance Paid: ₹${formatCurrency(advancePaid)}</div>` : ''}
  //       <!-- ${remainingAmount > 0 ? `<div style="font-size:9px;color:#C9A84C;margin-top:2px;">Balance Due: ₹${formatCurrency(remainingAmount)}</div>` : ''}-->
  //     </div>
  //     <div class="total-amount">₹${formatCurrency(totalAmount)}</div>
  //   </div>

  //   <!-- FOOTER -->
  //   <div class="inv-footer">
  //     <div class="inv-footer-cell">
  //       <div class="footer-label">Remarks</div>
  //       <div class="remarks-text">"Thank you for choosing us. We hope your stay was truly memorable."</div>
  //       <div class="paid-stamp">${booking.payment_status || 'Pending'} · ${booking.payment_method || 'Cash'}</div>
  //       ${advancePaid > 0 ? `<div style="margin-top:8px;font-size:9px;text-align:center;color:#6A4A20;">✓ Advance payment of ₹${formatCurrency(advancePaid)} received</div>` : ''}
  //     </div>
  //     <div class="inv-footer-cell">
  //       <div class="footer-label">Payment Information</div>
  //       <div class="footer-val">Payment Mode: ${(booking.payment_method || 'Cash').toUpperCase()}<br>${booking.transaction_id ? `Transaction Ref: ${booking.transaction_id}<br>` : ''}Bank: ${escapeHtml(hotelDetails.name || 'Hotel')} Account<br><br>Email: ${escapeHtml(hotelDetails.hotel_email || 'accounts@hotel.com')}<br>Tel: ${escapeHtml(hotelDetails.hotel_phone || 'N/A')}</div>
  //     </div>
  //   </div>
  // </div>
  // </body>
  // </html>`;

  //       // Set response headers for HTML download
  //       res.setHeader('Content-Type', 'text/html');
  //       res.setHeader('Content-Disposition', `attachment; filename="invoice-${getString(booking.invoice_number, booking.id)}.html"`);

  //       res.send(invoiceHTML);

  //     } catch (error) {
  //       console.error('❌ Download invoice error:', error);
  //       res.status(500).json({
  //         success: false,
  //         error: 'SERVER_ERROR',
  //         message: 'Internal server error: ' + error.message
  //       });
  //     }
  //   },

  //   downloadInvoice: async (req, res) => {
  //     try {
  //       const { id } = req.params;
  //       const hotelId = req.user.hotel_id;

  //       console.log('📥 Downloading invoice for booking:', { id, hotelId });

  //       // Get booking with all details
  //       const booking = await Booking.findById(id, hotelId);
  //       if (!booking) {
  //         return res.status(404).json({
  //           success: false,
  //           error: 'BOOKING_NOT_FOUND',
  //           message: 'Booking not found'
  //         });
  //       }

  //       // Get all related data - SAFE with defaults
  //       let customerDetails = null;
  //       if (booking.customer_id) {
  //         const customer = await Customer.findById(booking.customer_id, hotelId);
  //         if (customer) {
  //           customerDetails = {
  //             name: customer.name || '',
  //             phone: customer.phone || '',
  //             email: customer.email || '',
  //             address: customer.address || '',
  //             city: customer.city || '',
  //             state: customer.state || '',
  //             pincode: customer.pincode || '',
  //             customer_gst_no: customer.customer_gst_no || '',
  //             other_expenses: customer.other_expenses || 0,
  //             expense_description: customer.expense_description || ''
  //           };
  //         }
  //       }

  //       const roomDetails = await Room.findById(booking.room_id, hotelId);

  //       // Get hotel details
  //       const [hotelRows] = await pool.execute(`
  //       SELECT 
  //           h.*,
  //           u.phone as hotel_phone,
  //           u.email as hotel_email,
  //           u.name as admin_name
  //       FROM hotels h
  //       LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
  //       WHERE h.id = ?
  //       LIMIT 1
  //     `, [hotelId]);

  //       const hotelDetails = hotelRows[0] || {};

  //       // Get hotel logo
  //       const [logoRows] = await pool.execute(
  //         `SELECT logo_image FROM hotels WHERE id = ?`,
  //         [hotelId]
  //       );
  //       const hotelLogo = logoRows[0]?.logo_image || companyLogoBase64;

  //       // Format dates
  //       const formatDateDisplay = (dateStr) => {
  //         if (!dateStr) return '';
  //         try {
  //           const date = new Date(dateStr);
  //           return date.toLocaleDateString('en-IN', {
  //             day: '2-digit',
  //             month: 'long',
  //             year: 'numeric'
  //           });
  //         } catch (e) {
  //           return dateStr;
  //         }
  //       };

  //       const calculateNights = (fromDate, toDate) => {
  //         if (!fromDate || !toDate) return 1;
  //         try {
  //           const from = new Date(fromDate);
  //           const to = new Date(toDate);
  //           const diffTime = Math.abs(to - from);
  //           return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //         } catch (e) {
  //           return 1;
  //         }
  //       };

  //       // Helper functions
  //       const formatCurrency = (value) => {
  //         if (value === null || value === undefined) return '0';
  //         const num = parseFloat(value);
  //         return isNaN(num) ? '0' : num.toLocaleString('en-IN', {
  //           minimumFractionDigits: 0,
  //           maximumFractionDigits: 0
  //         });
  //       };

  //       const getString = (value, defaultValue = '') => {
  //         return value !== null && value !== undefined ? String(value) : defaultValue;
  //       };

  //       // Calculate amounts
  //       const nights = calculateNights(booking.from_date, booking.to_date);
  //       const roomAmount = parseFloat(booking.amount) || 0;
  //       const serviceAmount = parseFloat(booking.service) || 0;
  //       const cgstAmount = parseFloat(booking.cgst) || 0;
  //       const sgstAmount = parseFloat(booking.sgst) || 0;
  //       const igstAmount = parseFloat(booking.igst) || 0;
  //       const totalAmount = parseFloat(booking.total) || 0;
  //       const perNightRate = nights > 0 ? roomAmount / nights : roomAmount;

  //       // Get advance payment amount
  //       const advancePaid = parseFloat(booking.advance_amount_paid) || 0;
  //       const remainingAmount = parseFloat(booking.remaining_amount) || (totalAmount - advancePaid);

  //       // Get discount values
  //       const discountPercentage = parseFloat(booking.discount_percentage) || 0;
  //       const discountAmount = parseFloat(booking.discount_amount) || 0;
  //       const originalAmount = parseFloat(booking.original_amount) || roomAmount;

  //       // Calculate percentages
  //       const taxableAmount = originalAmount + serviceAmount;
  //       let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;
  //       if (taxableAmount > 0) {
  //         if (cgstAmount > 0) cgstPercentage = (cgstAmount / taxableAmount) * 100;
  //         if (sgstAmount > 0) sgstPercentage = (sgstAmount / taxableAmount) * 100;
  //         if (igstAmount > 0) igstPercentage = (igstAmount / taxableAmount) * 100;
  //       }

  //       // Determine tax type
  //       const taxType = igstAmount > 0 ? 'igst' : 'cgst_sgst';

  //       // Get other expenses
  //       const otherExpenses = parseFloat(customerDetails?.other_expenses) || 0;
  //       const expenseDescription = (customerDetails?.expense_description || '').replace(/'/g, "\\'");

  //       const escapeHtml = (str) => {
  //         if (!str) return '';
  //         return String(str)
  //           .replace(/&/g, '&amp;')
  //           .replace(/</g, '&lt;')
  //           .replace(/>/g, '&gt;')
  //           .replace(/"/g, '&quot;')
  //           .replace(/'/g, '&#39;');
  //       };

  //       // Build full address for customer
  //       const buildCustomerAddress = () => {
  //         let addressParts = [];
  //         if (customerDetails?.address) addressParts.push(escapeHtml(customerDetails.address));
  //         if (customerDetails?.city) addressParts.push(escapeHtml(customerDetails.city));
  //         if (customerDetails?.state) addressParts.push(escapeHtml(customerDetails.state));
  //         if (customerDetails?.pincode) addressParts.push(escapeHtml(customerDetails.pincode));
  //         return addressParts.join(', ');
  //       };

  //       const customerAddressFull = buildCustomerAddress();

  //       // Generate invoice HTML
  //       const invoiceHTML = `<!DOCTYPE html>
  // <html lang="en">
  // <head>
  // <meta charset="UTF-8">
  // <meta name="viewport" content="width=device-width, initial-scale=1.0">
  // <title>Invoice - ${getString(booking.invoice_number)}</title>
  // <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
  // <style>
  //   *{box-sizing:border-box;margin:0;padding:0}
  //   body{background:#F0EDE8;font-family:'Outfit',sans-serif;min-height:100vh;padding:2rem;display:flex;justify-content:center;align-items:center;}
  //   #invoice{max-width:860px;margin:0 auto;background:#FDFAF5;border:1px solid #C9A84C;font-family:'Outfit',sans-serif;}

  //   .inv-header{background:#1A1208;color:#C9A84C;padding:2.2rem 2.8rem 1.8rem;display:flex;justify-content:space-between;align-items:flex-start;}
  //   .inv-logo-name{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:300;letter-spacing:.18em;color:#F0D98C;line-height:1.1;}
  //   .inv-logo-sub{font-size:9px;font-family:'Outfit',sans-serif;font-weight:300;letter-spacing:.45em;color:#A08030;margin-top:4px;text-transform:uppercase;}
  //   .inv-logo-addr{font-size:10px;color:#7A6030;margin-top:8px;line-height:1.8;font-weight:300;}
  //   .inv-header-right{text-align:right;}
  //   .inv-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;letter-spacing:.2em;color:#F0D98C;text-transform:uppercase;}
  //   .inv-meta-line{font-size:10.5px;color:#A08030;margin:2px 0;font-weight:300;}
  //   .inv-meta-line strong{color:#C9A84C;}
  //   .gold-bar{height:2px;background:#C9A84C;}

  //   .inv-guest-row{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #E8D9B0;}
  //   .inv-guest-cell{padding:1.2rem 2.2rem;border-right:1px solid #E8D9B0;}
  //   .inv-guest-cell:last-child{border-right:none;}
  //   .cell-label{font-size:8.5px;font-weight:600;letter-spacing:.25em;color:#A08030;text-transform:uppercase;margin-bottom:5px;}
  //   .cell-value{font-size:12.5px;color:#1A1208;line-height:1.5;}
  //   .cell-value strong{font-weight:600;display:block;font-size:13.5px;}

  //   .sec-title{font-size:9px;font-weight:600;letter-spacing:.3em;color:#A08030;text-transform:uppercase;padding:1rem 2.2rem .5rem;border-top:1px solid #E8D9B0;}

  //   .inv-tbl{width:100%;border-collapse:collapse;table-layout:fixed;}
  //   .inv-tbl thead tr{background:#F5EDD8;}
  //   .inv-tbl th{font-size:8.5px;font-weight:600;letter-spacing:.2em;color:#A08030;text-transform:uppercase;padding:.5rem .9rem;text-align:left;border-bottom:1px solid #E8D9B0;}
  //   .inv-tbl th:first-child{padding-left:2.2rem;width:44%;}
  //   .inv-tbl th:last-child{text-align:right;padding-right:2.2rem;}
  //   .inv-tbl td{font-size:12px;color:#2A1F0A;padding:.55rem .9rem;border-bottom:1px solid #F0E8CF;vertical-align:top;font-weight:300;}
  //   .inv-tbl td:first-child{padding-left:2.2rem;font-weight:400;}
  //   .inv-tbl td:last-child{text-align:right;padding-right:2.2rem;font-weight:500;}
  //   .inv-tbl td .note{font-size:10px;color:#7A6030;font-style:italic;font-family:'Cormorant Garamond',serif;display:block;margin-top:1px;}

  //   .calc-area{background:#FAF4E8;padding:1rem 2.2rem;display:flex;flex-direction:column;align-items:flex-end;gap:4px;border-top:1px solid #E8D9B0;}
  //   .calc-row{display:flex;gap:2.5rem;font-size:12px;color:#5A4010;}
  //   .calc-row span:last-child{min-width:80px;text-align:right;font-weight:500;}
  //   .calc-row.disc span{color:#1A5A20;}
  //   .calc-row.advance span{color:#6A4A20;}
  //   .calc-row.gst{border-top:1px dashed #D9C890;padding-top:4px;}

  //   .total-bar{background:#1A1208;display:flex;justify-content:space-between;align-items:center;padding:1.1rem 2.2rem;}
  //   .total-label{font-size:9px;font-weight:600;letter-spacing:.3em;color:#A08030;text-transform:uppercase;}
  //   .total-amount{font-family:'Cormorant Garamond',serif;font-size:28px;color:#F0D98C;}

  //   .inv-footer{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #C9A84C;}
  //   .inv-footer-cell{padding:1.1rem 2.2rem;}
  //   .inv-footer-cell:first-child{border-right:1px solid #E8D9B0;}
  //   .footer-label{font-size:8.5px;font-weight:600;letter-spacing:.25em;color:#A08030;text-transform:uppercase;margin-bottom:5px;}
  //   .footer-val{font-size:11px;color:#5A4010;line-height:1.8;font-weight:300;}
  //   .remarks-text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13.5px;color:#7A6030;line-height:1.6;}
  //   .paid-stamp{display:inline-block;border:1.5px solid #1A5A20;color:#1A5A20;font-size:8.5px;font-weight:600;letter-spacing:.25em;padding:3px 9px;text-transform:uppercase;margin-top:6px;}

  //   .original-row td:first-child span{text-decoration:line-through;color:#999;}
  //   .discount-row{background:#E8F5E8;}
  //   .advance-row{background:#FFF8E0;}

  //   @media print{
  //     body{background:#fff;padding:0;}
  //     .no-print{display:none;}
  //   }
  // </style>
  // </head>
  // <body>
  // <div id="invoice">
  //   <!-- HEADER -->
  //   <div class="inv-header">
  //     <div>
  //       <div class="inv-logo-name">${escapeHtml(hotelDetails.name || 'Hotel Management')}</div>
  //       <div class="inv-logo-sub">Luxury Collection</div>
  //       <div class="inv-logo-addr">${escapeHtml(hotelDetails.address || 'Address not specified')}<br>Tel: ${escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A')} · GSTIN: ${escapeHtml(hotelDetails.gst_number || 'N/A')}</div>
  //     </div>
  //     <div class="inv-header-right">
  //       <div class="inv-title">INVOICE</div>
  //       <div class="inv-meta-line">No. <strong>${escapeHtml(booking.invoice_number)}</strong></div>
  //       <div class="inv-meta-line">Date: <strong>${formatDateDisplay(new Date().toISOString())}</strong></div>
  //       <div class="inv-meta-line">Folio: <strong>Room ${escapeHtml(roomDetails?.room_number || '')}</strong></div>
  //     </div>
  //   </div>

  //   <div class="gold-bar"></div>

  //   <!-- GUEST ROW - WITH ADDRESS AND GST -->
  //   <div class="inv-guest-row">
  //     <div class="inv-guest-cell">
  //       <div class="cell-label">Guest Details</div>
  //       <div class="cell-value">
  //         <strong>${escapeHtml(customerDetails?.name || 'Walk-in Customer')}</strong>
  //         ${customerDetails?.email ? `<br>📧 ${escapeHtml(customerDetails.email)}` : ''}
  //         <br>📱 ${escapeHtml(customerDetails?.phone || 'N/A')}
  //         ${customerAddressFull ? `<br>📍 ${customerAddressFull}` : ''}
  //         ${customerDetails?.customer_gst_no ? `<br>🏢 <strong>GST:</strong> ${escapeHtml(customerDetails.customer_gst_no)}` : ''}
  //       </div>
  //     </div>
  //     <div class="inv-guest-cell">
  //       <div class="cell-label">Stay Period</div>
  //       <div class="cell-value">
  //         <strong>${formatDateDisplay(booking.from_date)} — ${formatDateDisplay(booking.to_date)}</strong>
  //         ${nights} Nights · ${formatGuestsForDisplay(booking.guests)}
  //         <br>🏨 ${escapeHtml(roomDetails?.type || 'Standard')} Room
  //       </div>
  //     </div>
  //     <div class="inv-guest-cell">
  //       <div class="cell-label">Reservation</div>
  //       <div class="cell-value">
  //         <strong>RES-${booking.id}</strong>
  //         ${booking.special_requests ? 'Special Request: ' + booking.special_requests.substring(0, 50) : 'Direct Booking'}
  //       </div>
  //     </div>
  //   </div>

  //   <!-- ROOM CHARGES SECTION -->
  //   <div class="sec-title">Room Charges</div>
  //   <table class="inv-tbl">
  //     <thead>
  //       <tr><th>Description</th><th>Nights</th><th>Rate / Night</th><th>Amount</th></tr>
  //     </thead>
  //     <tbody>
  //       ${discountPercentage > 0 ? `
  //       <tr class="original-row">
  //         <td><span>${escapeHtml(roomDetails?.type || 'Deluxe King Room')} (Original)</span><span class="note">Bed & Breakfast</span></td>
  //         <td>${nights}</td>
  //         <td>₹${formatCurrency(originalAmount / nights)}</td>
  //         <td>₹${formatCurrency(originalAmount)}</td>
  //       </tr>
  //       <tr class="discount-row">
  //         <td><span>Discount (${discountPercentage}% OFF)</span><span class="note">Special offer applied</span></td>
  //         <td>—</td>
  //         <td>—</td>
  //         <td><td style="color:#28a745;">-₹${formatCurrency(discountAmount)}</td>
  //       </tr>
  //       ` : ''}
  //       <tr>
  //         <td><span>${escapeHtml(roomDetails?.type || 'Deluxe King Room')}</span><span class="note">${escapeHtml(roomDetails?.amenities || 'Bed & Breakfast')}</span></td>
  //         <td>${nights}</td>
  //         <td>₹${formatCurrency(perNightRate)}</td>
  //         <td>₹${formatCurrency(roomAmount)}</td>
  //       </tr>
  //       ${serviceAmount > 0 ? `
  //       <tr>
  //         <td><span>Service Charges</span><span class="note">Hotel service fee</span></td>
  //         <td>—</td>
  //         <td>—</td>
  //         <td>₹${formatCurrency(serviceAmount)}</td>
  //       </tr>
  //       ` : ''}
  //       ${otherExpenses > 0 ? `
  //       <tr>
  //         <td><span>Other Expenses</span><span class="note">${escapeHtml(expenseDescription || 'Additional charges')}</span></td>
  //         <td>—</td>
  //         <td>—</td>
  //         <td>₹${formatCurrency(otherExpenses)}</td>
  //       </tr>
  //       ` : ''}
  //     </tbody>
  //   </table>

  //   <!-- CALCULATION SECTION -->
  //   <div class="calc-area">
  //     <div class="calc-row"><span>Subtotal</span><span>₹${formatCurrency(roomAmount + serviceAmount)}</span></div>
  //     ${discountPercentage > 0 ? `<div class="calc-row disc"><span>Discount (${discountPercentage}% OFF)</span><span>− ₹${formatCurrency(discountAmount)}</span></div>` : ''}
  //     ${taxType === 'cgst_sgst' && cgstAmount > 0 ? `<div class="calc-row gst"><span>CGST @ ${cgstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(cgstAmount)}</span></div>` : ''}
  //     ${taxType === 'cgst_sgst' && sgstAmount > 0 ? `<div class="calc-row gst"><span>SGST @ ${sgstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(sgstAmount)}</span></div>` : ''}
  //     ${taxType === 'igst' && igstAmount > 0 ? `<div class="calc-row gst"><span>IGST @ ${igstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(igstAmount)}</span></div>` : ''}

  //     ${advancePaid > 0 ? `
  //     <div class="calc-row advance">
  //       <span>Advance Payment Already Paid</span>
  //       <span class="advance-amount">− ₹${formatCurrency(advancePaid)}</span>
  //     </div>
  //     ` : ''}

  //     <div class="calc-row" style="border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">
  //       <span>Balance Due</span>
  //       <span class="balance-amount">₹${formatCurrency(remainingAmount)}</span>
  //     </div>
  //   </div>

  //   <!-- TOTAL BAR -->
  //   <div class="total-bar">
  //     <div>
  //       <div class="total-label">Total Amount</div>
  //       <div style="font-size:10px;opacity:.6;margin-top:2px;">INR · Inclusive of all taxes</div>
  //       ${advancePaid > 0 ? `<div style="font-size:9px;color:#A08030;margin-top:4px;">Advance Paid: ₹${formatCurrency(advancePaid)}</div>` : ''}
  //     </div>
  //     <div class="total-amount">₹${formatCurrency(totalAmount)}</div>
  //   </div>

  //   <!-- FOOTER -->
  //   <div class="inv-footer">
  //     <div class="inv-footer-cell">
  //       <div class="footer-label">Remarks</div>
  //       <div class="remarks-text">"Thank you for choosing us. We hope your stay was truly memorable."</div>
  //       <div class="paid-stamp">${booking.payment_status || 'Pending'} · ${booking.payment_method || 'Cash'}</div>
  //       ${advancePaid > 0 ? `<div style="margin-top:8px;font-size:9px;text-align:center;color:#6A4A20;">✓ Advance payment of ₹${formatCurrency(advancePaid)} received</div>` : ''}
  //     </div>
  //     <div class="inv-footer-cell">
  //       <div class="footer-label">Payment Information</div>
  //       <div class="footer-val">Payment Mode: ${(booking.payment_method || 'Cash').toUpperCase()}<br>${booking.transaction_id ? `Transaction Ref: ${booking.transaction_id}<br>` : ''}Bank: ${escapeHtml(hotelDetails.name || 'Hotel')} Account<br><br>Email: ${escapeHtml(hotelDetails.hotel_email || 'accounts@hotel.com')}<br>Tel: ${escapeHtml(hotelDetails.hotel_phone || 'N/A')}</div>
  //     </div>
  //   </div>
  // </div>
  // </body>
  // </html>`;

  //       // Set response headers for HTML download
  //       res.setHeader('Content-Type', 'text/html');
  //       res.setHeader('Content-Disposition', `attachment; filename="invoice-${getString(booking.invoice_number, booking.id)}.html"`);

  //       res.send(invoiceHTML);

  //     } catch (error) {
  //       console.error('❌ Download invoice error:', error);
  //       res.status(500).json({
  //         success: false,
  //         error: 'SERVER_ERROR',
  //         message: 'Internal server error: ' + error.message
  //       });
  //     }
  //   },

  downloadInvoice: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('📥 Downloading invoice for booking:', { id, hotelId });

      // Get booking with all details
      const booking = await Booking.findById(id, hotelId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      // Get all related data - SAFE with defaults
      let customerDetails = null;
      if (booking.customer_id) {
        const customer = await Customer.findById(booking.customer_id, hotelId);
        if (customer) {
          customerDetails = {
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            customer_gst_no: customer.customer_gst_no || '',
            other_expenses: customer.other_expenses || 0,
            expense_description: customer.expense_description || ''
          };
        }
      }

      const roomDetails = await Room.findById(booking.room_id, hotelId);

      // Get hotel details
      const [hotelRows] = await pool.execute(`
      SELECT 
          h.*,
          u.phone as hotel_phone,
          u.email as hotel_email,
          u.name as admin_name
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
      WHERE h.id = ?
      LIMIT 1
    `, [hotelId]);

      const hotelDetails = hotelRows[0] || {};

      // Format dates
      const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
        } catch (e) {
          return dateStr;
        }
      };

      const calculateNights = (fromDate, toDate) => {
        if (!fromDate || !toDate) return 1;
        try {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          const diffTime = Math.abs(to - from);
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
          return 1;
        }
      };

      // Helper functions
      const formatCurrency = (value) => {
        if (value === null || value === undefined) return '0';
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toLocaleString('en-IN');
      };

      const getString = (value, defaultValue = '') => {
        return value !== null && value !== undefined ? String(value) : defaultValue;
      };

      // Calculate amounts
      const nights = calculateNights(booking.from_date, booking.to_date);
      const roomAmount = parseFloat(booking.amount) || 0;
      const serviceAmount = parseFloat(booking.service) || 0;
      const cgstAmount = parseFloat(booking.cgst) || 0;
      const sgstAmount = parseFloat(booking.sgst) || 0;
      const igstAmount = parseFloat(booking.igst) || 0;
      const totalAmount = parseFloat(booking.total) || 0;
      const perNightRate = nights > 0 ? roomAmount / nights : roomAmount;

      // Payment breakdown for invoice
      const paymentBreakdown = getPaymentBreakdown(booking);
      const { bookingAdvance, checkoutPaid, totalPaid, remainingAmount } = paymentBreakdown;

      // Get discount values
      const discountPercentage = parseFloat(booking.discount_percentage) || 0;
      const discountAmount = parseFloat(booking.discount_amount) || 0;
      const originalAmount = parseFloat(booking.original_amount) || roomAmount;

      // Calculate percentages
      const taxableAmount = originalAmount + serviceAmount;
      let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;
      if (taxableAmount > 0) {
        if (cgstAmount > 0) cgstPercentage = (cgstAmount / taxableAmount) * 100;
        if (sgstAmount > 0) sgstPercentage = (sgstAmount / taxableAmount) * 100;
        if (igstAmount > 0) igstPercentage = (igstAmount / taxableAmount) * 100;
      }

      // Determine tax type
      const taxType = igstAmount > 0 ? 'igst' : 'cgst_sgst';

      // Get other expenses
      const otherExpenses = parseFloat(customerDetails?.other_expenses) || 0;
      const expenseDescription = (customerDetails?.expense_description || '').replace(/'/g, "\\'");

      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      // Build full address for customer
      const buildCustomerAddress = () => {
        let addressParts = [];
        if (customerDetails?.address) addressParts.push(escapeHtml(customerDetails.address));
        if (customerDetails?.city) addressParts.push(escapeHtml(customerDetails.city));
        if (customerDetails?.state) addressParts.push(escapeHtml(customerDetails.state));
        if (customerDetails?.pincode) addressParts.push(escapeHtml(customerDetails.pincode));
        return addressParts.join(', ');
      };

      const customerAddressFull = buildCustomerAddress();

      // Generate invoice HTML - WITH GST SHOWING AND PROPER CALCULATION
      const invoiceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice - ${getString(booking.invoice_number)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#F0EDE8;font-family:'Outfit',sans-serif;min-height:100vh;padding:2rem;display:flex;justify-content:center;align-items:center;}
  #invoice{max-width:860px;margin:0 auto;background:#FDFAF5;border:1px solid #C9A84C;font-family:'Outfit',sans-serif;}
  
  .inv-header{background:#1A1208;color:#C9A84C;padding:2.2rem 2.8rem 1.8rem;display:flex;justify-content:space-between;align-items:flex-start;}
  .inv-logo-name{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:300;letter-spacing:.18em;color:#F0D98C;line-height:1.1;}
  .inv-logo-sub{font-size:9px;font-family:'Outfit',sans-serif;font-weight:300;letter-spacing:.45em;color:#A08030;margin-top:4px;text-transform:uppercase;}
  .inv-logo-addr{font-size:10px;color:#7A6030;margin-top:8px;line-height:1.8;font-weight:300;}
  .inv-header-right{text-align:right;}
  .inv-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;letter-spacing:.2em;color:#F0D98C;text-transform:uppercase;}
  .inv-meta-line{font-size:10.5px;color:#A08030;margin:2px 0;font-weight:300;}
  .inv-meta-line strong{color:#C9A84C;}
  .gold-bar{height:2px;background:#C9A84C;}
  
  .inv-guest-row{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #E8D9B0;}
  .inv-guest-cell{padding:1.2rem 2.2rem;border-right:1px solid #E8D9B0;}
  .inv-guest-cell:last-child{border-right:none;}
  .cell-label{font-size:8.5px;font-weight:600;letter-spacing:.25em;color:#A08030;text-transform:uppercase;margin-bottom:5px;}
  .cell-value{font-size:12.5px;color:#1A1208;line-height:1.5;}
  .cell-value strong{font-weight:600;display:block;font-size:13.5px;}
  
  .sec-title{font-size:9px;font-weight:600;letter-spacing:.3em;color:#A08030;text-transform:uppercase;padding:1rem 2.2rem .5rem;border-top:1px solid #E8D9B0;}
  
  .inv-tbl{width:100%;border-collapse:collapse;table-layout:fixed;}
  .inv-tbl thead tr{background:#F5EDD8;}
  .inv-tbl th{font-size:8.5px;font-weight:600;letter-spacing:.2em;color:#A08030;text-transform:uppercase;padding:.5rem .9rem;text-align:left;border-bottom:1px solid #E8D9B0;}
  .inv-tbl th:first-child{padding-left:2.2rem;width:44%;}
  .inv-tbl th:last-child{text-align:right;padding-right:2.2rem;}
  .inv-tbl td{font-size:12px;color:#2A1F0A;padding:.55rem .9rem;border-bottom:1px solid #F0E8CF;vertical-align:top;font-weight:300;}
  .inv-tbl td:first-child{padding-left:2.2rem;font-weight:400;}
  .inv-tbl td:last-child{text-align:right;padding-right:2.2rem;font-weight:500;}
  .inv-tbl td .note{font-size:10px;color:#7A6030;font-style:italic;font-family:'Cormorant Garamond',serif;display:block;margin-top:1px;}
  
  .calc-area{background:#FAF4E8;padding:1rem 2.2rem;display:flex;flex-direction:column;align-items:flex-end;gap:4px;border-top:1px solid #E8D9B0;}
  .calc-row{display:flex;gap:2.5rem;font-size:12px;color:#5A4010;}
  .calc-row span:last-child{min-width:80px;text-align:right;font-weight:500;}
  .calc-row.disc span{color:#1A5A20;}
  .calc-row.advance span{color:#6A4A20;}
  .calc-row.gst{border-top:1px dashed #D9C890;padding-top:4px;}
  
  .total-bar{background:#1A1208;display:flex;justify-content:space-between;align-items:center;padding:1.1rem 2.2rem;}
  .total-label{font-size:9px;font-weight:600;letter-spacing:.3em;color:#A08030;text-transform:uppercase;}
  .total-amount{font-family:'Cormorant Garamond',serif;font-size:28px;color:#F0D98C;}
  
  .inv-footer{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #C9A84C;}
  .inv-footer-cell{padding:1.1rem 2.2rem;}
  .inv-footer-cell:first-child{border-right:1px solid #E8D9B0;}
  .footer-label{font-size:8.5px;font-weight:600;letter-spacing:.25em;color:#A08030;text-transform:uppercase;margin-bottom:5px;}
  .footer-val{font-size:11px;color:#5A4010;line-height:1.8;font-weight:300;}
  .remarks-text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13.5px;color:#7A6030;line-height:1.6;}
  .paid-stamp{display:inline-block;border:1.5px solid #1A5A20;color:#1A5A20;font-size:8.5px;font-weight:600;letter-spacing:.25em;padding:3px 9px;text-transform:uppercase;margin-top:6px;}
  
  @media print{
    body{background:#fff;padding:0;}
    .no-print{display:none;}
  }
</style>
</head>
<body>
<div id="invoice">
  <!-- HEADER -->
  <div class="inv-header">
    <div>
      <div class="inv-logo-name">${escapeHtml(hotelDetails.name || 'Hotel Management')}</div>
      <div class="inv-logo-sub">Luxury Collection</div>
      <div class="inv-logo-addr">${escapeHtml(hotelDetails.address || 'Address not specified')}<br>Tel: ${escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A')} · GSTIN: ${escapeHtml(hotelDetails.gst_number || 'N/A')}</div>
    </div>
    <div class="inv-header-right">
      <div class="inv-title">INVOICE</div>
      <div class="inv-meta-line">No. <strong>${escapeHtml(booking.invoice_number)}</strong></div>
      <div class="inv-meta-line">Date: <strong>${formatDateDisplay(new Date().toISOString())}</strong></div>
      <div class="inv-meta-line">Folio: <strong>Room ${escapeHtml(roomDetails?.room_number || '')}</strong></div>
    </div>
  </div>
  
  <div class="gold-bar"></div>
  
  <!-- GUEST ROW - WITH GST NUMBER -->
  <div class="inv-guest-row">
    <div class="inv-guest-cell">
      <div class="cell-label">Guest Details</div>
      <div class="cell-value">
        <strong>${escapeHtml(customerDetails?.name || 'Walk-in Customer')}</strong>
        ${customerDetails?.email ? `<br>📧 ${escapeHtml(customerDetails.email)}` : ''}
        <br>📱 ${escapeHtml(customerDetails?.phone || 'N/A')}
        ${customerAddressFull ? `<br>📍 ${customerAddressFull}` : ''}
        ${customerDetails?.customer_gst_no ? `<br>🏢 <strong>GSTIN:</strong> ${escapeHtml(customerDetails.customer_gst_no)}` : ''}
      </div>
    </div>
    <div class="inv-guest-cell">
      <div class="cell-label">Stay Period</div>
      <div class="cell-value">
        <strong>${formatDateDisplay(booking.from_date)} — ${formatDateDisplay(booking.to_date)}</strong>
        ${nights} Nights · ${formatGuestsForDisplay(booking.guests)}
        <br>🏨 ${escapeHtml(roomDetails?.type || 'Standard')} Room
      </div>
    </div>
    <div class="inv-guest-cell">
      <div class="cell-label">Reservation</div>
      <div class="cell-value">
        <strong>RES-${booking.id}</strong>
        ${booking.special_requests ? 'Special Request: ' + booking.special_requests.substring(0, 50) : 'Direct Booking'}
      </div>
    </div>
  </div>
  
  <!-- ROOM CHARGES SECTION - SINGLE ROW ONLY -->
  <div class="sec-title">Room Charges</div>
  <table class="inv-tbl">
    <thead>
      <tr><th>Description</th><th>Nights</th><th>Rate / Night</th><th>Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <span>${escapeHtml(roomDetails?.type || 'Deluxe Room')}</span>
          ${discountPercentage > 0 ? `<span class="note">(${discountPercentage}% discount applied)</span>` : '<span class="note">Nightly rate</span>'}
        </td>
        <td>${nights}</td>
        <td>₹${formatCurrency(perNightRate)}</td>
        <td>₹${formatCurrency(roomAmount)}</td>
      </tr>
      ${serviceAmount > 0 ? `
      <tr>
        <td><span>Service Charges</span><span class="note">Hotel service fee</span></td>
        <td>—</td>
        <td>—</td>
        <td>₹${formatCurrency(serviceAmount)}</td>
      </tr>
      ` : ''}
      ${otherExpenses > 0 ? `
      <tr>
        <td><span>Other Expenses</span><span class="note">${escapeHtml(expenseDescription || 'Additional charges')}</span></td>
        <td>—</td>
        <td>—</td>
        <td>₹${formatCurrency(otherExpenses)}</td>
      </tr>
      ` : ''}
    </tbody>
  </table>
  
  <!-- CALCULATION SECTION - SHOW ORIGINAL PRICE, DISCOUNT MINUS, THEN TOTAL -->
  <div class="calc-area">
    <div class="calc-row"><span>Original Room Charges</span><span>₹${formatCurrency(originalAmount)}</span></div>
    ${discountPercentage > 0 ? `<div class="calc-row disc"><span>Discount (${discountPercentage}% OFF)</span><span>- ₹${formatCurrency(discountAmount)}</span></div>` : ''}
    ${roomAmount !== originalAmount ? `<div class="calc-row"><span>Net Room Charges</span><span>₹${formatCurrency(roomAmount)}</span></div>` : ''}
    ${serviceAmount > 0 ? `<div class="calc-row"><span>Service Charges</span><span>₹${formatCurrency(serviceAmount)}</span></div>` : ''}
    ${taxType === 'cgst_sgst' && cgstAmount > 0 ? `<div class="calc-row gst"><span>CGST @ ${cgstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(cgstAmount)}</span></div>` : ''}
    ${taxType === 'cgst_sgst' && sgstAmount > 0 ? `<div class="calc-row gst"><span>SGST @ ${sgstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(sgstAmount)}</span></div>` : ''}
    ${taxType === 'igst' && igstAmount > 0 ? `<div class="calc-row gst"><span>IGST @ ${igstPercentage.toFixed(2)}%</span><span>₹${formatCurrency(igstAmount)}</span></div>` : ''}
    ${bookingAdvance > 0 ? `
      <div class="calc-row advance">
        <span>Advance Paid at Booking</span>
        <span>- ₹${formatCurrency(bookingAdvance)}</span>
      </div>
    ` : ''}
    ${checkoutPaid > 0 ? `
      <div class="calc-row advance">
        <span>Paid at Checkout</span>
        <span>- ₹${formatCurrency(checkoutPaid)}</span>
      </div>
    ` : ''}
    <div class="calc-row" style="border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">
      <span>${remainingAmount > 0 ? 'BALANCE DUE' : 'TOTAL PAID'}</span>
      <span>₹${formatCurrency(remainingAmount > 0 ? remainingAmount : totalPaid)}</span>
    </div>
  </div>
  
  <!-- TOTAL BAR -->
  <div class="total-bar">
    <div>
      <div class="total-label">Total Amount</div>
      <div style="font-size:10px;opacity:.6;margin-top:2px;">INR · Inclusive of all taxes</div>
      ${bookingAdvance > 0 ? `<div style="font-size:9px;color:#A08030;margin-top:4px;">Advance at Booking: ₹${formatCurrency(bookingAdvance)}</div>` : ''}
      ${checkoutPaid > 0 ? `<div style="font-size:9px;color:#A08030;margin-top:2px;">Paid at Checkout: ₹${formatCurrency(checkoutPaid)}</div>` : ''}
      ${discountPercentage > 0 ? `<div style="font-size:9px;color:#1A5A20;margin-top:2px;">You saved ₹${formatCurrency(discountAmount)} with ${discountPercentage}% discount!</div>` : ''}
    </div>
    <div class="total-amount">₹${formatCurrency(totalAmount)}</div>
  </div>
  
  <!-- FOOTER -->
  <div class="inv-footer">
    <div class="inv-footer-cell">
      <div class="footer-label">Remarks</div>
      <div class="remarks-text">"Thank you for choosing us. We hope your stay was truly memorable."</div>
      <div class="paid-stamp">${booking.payment_status || 'Pending'} · ${booking.payment_method || 'Cash'}</div>
    </div>
    <div class="inv-footer-cell">
      <div class="footer-label">Payment Information</div>
      <div class="footer-val">Payment Mode: ${(booking.payment_method || 'Cash').toUpperCase()}<br>${booking.transaction_id ? `Transaction Ref: ${booking.transaction_id}<br>` : ''}<br>Email: ${escapeHtml(hotelDetails.hotel_email || 'accounts@hotel.com')}<br>Tel: ${escapeHtml(hotelDetails.hotel_phone || 'N/A')}</div>
    </div>
  </div>
</div>
</body>
</html>`;

      // Set response headers for HTML download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${getString(booking.invoice_number, booking.id)}.html"`);

      res.send(invoiceHTML);

    } catch (error) {
      console.error('❌ Download invoice error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  sendCheckoutReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Get booking details
      const [bookingRows] = await pool.execute(`
        SELECT b.*, r.room_number,
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               h.name as hotel_name, h.email as hotel_email, h.phone as hotel_phone, 
               h.address as hotel_address
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        WHERE b.id = ? AND b.hotel_id = ? AND b.status = 'booked'
      `, [id, hotelId]);

      if (bookingRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found or not active'
        });
      }

      const booking = bookingRows[0];

      // Check if checkout time is approaching (within 2 hours)
      const now = new Date();
      const checkoutTime = new Date(`${booking.to_date} ${booking.to_time || '12:00'}`);
      const timeDiff = checkoutTime - now;
      const hoursUntilCheckout = timeDiff / (1000 * 60 * 60);

      if (hoursUntilCheckout > 2) {
        return res.status(400).json({
          success: false,
          error: 'TOO_EARLY',
          message: 'Checkout reminder can only be sent within 2 hours of checkout time'
        });
      }

      const hotelDetails = {
        name: booking.hotel_name,
        email: booking.hotel_email,
        phone: booking.hotel_phone,
        address: booking.hotel_address
      };

      const customerDetails = {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone
      };

      if (!customerDetails.email) {
        return res.status(400).json({
          success: false,
          error: 'NO_EMAIL',
          message: 'Customer does not have an email address'
        });
      }

      // Send checkout reminder email
      await EmailService.sendCheckoutReminder(booking, hotelDetails, customerDetails);

      res.json({
        success: true,
        message: 'Checkout reminder sent successfully'
      });

    } catch (error) {
      console.error('❌ Send checkout reminder error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // ===========================================
  // NEW: RESEND BOOKING CONFIRMATION
  // ===========================================
  resendConfirmation: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      if (isBasicHotelPlan(req.user.hotel_plan)) {
        return res.status(403).json({
          success: false,
          error: 'BASIC_PLAN_NO_NOTIFICATIONS',
          message: 'Booking confirmation email is not available on the Basic plan.'
        });
      }

      // Get booking details
      const [bookingRows] = await pool.execute(`
        SELECT b.*, r.room_number, r.type as room_type,
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               h.name as hotel_name, h.email as hotel_email, h.phone as hotel_phone, 
               h.address as hotel_address
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        WHERE b.id = ? AND b.hotel_id = ?
      `, [id, hotelId]);

      if (bookingRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      const booking = bookingRows[0];

      const hotelDetails = {
        name: booking.hotel_name,
        email: booking.hotel_email,
        phone: booking.hotel_phone,
        address: booking.hotel_address
      };

      const customerDetails = {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone
      };

      if (!customerDetails.email) {
        return res.status(400).json({
          success: false,
          error: 'NO_EMAIL',
          message: 'Customer does not have an email address'
        });
      }

      // Resend confirmation email
      await EmailService.sendBookingConfirmation(booking, hotelDetails, customerDetails);

      res.json({
        success: true,
        message: 'Booking confirmation resent successfully'
      });

    } catch (error) {
      console.error('❌ Resend confirmation error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // ===========================================
  // NEW: GET UPCOMING CHECKOUTS
  // ===========================================
  getUpcomingCheckouts: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { hours = 2 } = req.query; // Default: next 2 hours

      const now = new Date();
      const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));

      const [bookings] = await pool.execute(`
        SELECT b.*, r.room_number,
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(b.to_date, ' ', b.to_time)) as minutes_until_checkout
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.hotel_id = ? 
        AND b.status = 'booked'
        AND CONCAT(b.to_date, ' ', b.to_time) BETWEEN NOW() AND ?
        ORDER BY b.to_date, b.to_time
      `, [hotelId, futureTime]);

      res.json({
        success: true,
        data: bookings,
        count: bookings.length
      });

    } catch (error) {
      console.error('❌ Get upcoming checkouts error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },


  updateInvoiceNumber: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;
      const { invoice_number } = req.body;

      if (!invoice_number || invoice_number.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'INVOICE_NUMBER_REQUIRED',
          message: 'Invoice number is required'
        });
      }

      // Check if invoice number already exists (excluding current booking)
      const exists = await Booking.checkInvoiceNumberExists(invoice_number, hotelId, id);
      if (exists) {
        return res.status(400).json({
          success: false,
          error: 'INVOICE_NUMBER_EXISTS',
          message: 'This invoice number is already in use'
        });
      }

      // Update invoice number
      const updated = await Booking.updateInvoiceNumber(id, hotelId, invoice_number);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        message: 'Invoice number updated successfully',
        data: { invoice_number }
      });

    } catch (error) {
      console.error('❌ Update invoice number error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },


  createPastBooking: async (req, res) => {
    try {
      const {
        room_id,
        customer_id,
        from_date,
        to_date,
        from_time = '14:00',
        to_time = '12:00',
        amount,
        service,
        gst,
        cgst,        // ← ADD THIS
        sgst,        // ← ADD THIS
        igst,        // ← ADD THIS
        total,
        status = 'booked',
        guests = 1,
        special_requests = '',
        id_type = 'aadhaar',
        payment_method = 'cash',
        payment_status = 'completed',
        transaction_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_id_number,
        id_image,
        id_image2,
        address,
        city,
        state,
        pincode,
        customer_gst_no,
        purpose_of_visit,
        other_expenses = 0,
        expense_description = '',
        referral_by,
        referral_amount = 0,
        invoice_number,
        booking_date,
        check_in_date,
        check_out_date
      } = req.body;

      const hotelId = req.user.hotel_id;
      let finalCustomerId = customer_id;
      let isNewCustomer = false;

      console.log('📝 Create past booking request:', {
        hotelId,
        room_id,
        from_date: from_date || check_in_date,
        to_date: to_date || check_out_date,
        customer_name,
        customer_phone,
        // Log the tax fields being received
        taxFields: { cgst, sgst, igst, gst }
      });

      // ===========================================
      // 1. VALIDATE ROOM
      // ===========================================
      const room = await Room.findById(room_id, hotelId);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        });
      }

      // ===========================================
      // 2. CUSTOMER HANDLING
      // ===========================================
      if (customer_name && customer_phone) {
        try {
          const existingCustomer = await Customer.findByPhone(customer_phone, hotelId);

          if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
            console.log('✅ Found existing customer:', {
              customerId: finalCustomerId,
              name: existingCustomer.name
            });

            if (customer_email || address) {
              await Customer.update(existingCustomer.id, hotelId, {
                name: customer_name,
                phone: customer_phone,
                email: customer_email || existingCustomer.email,
                id_number: customer_id_number || existingCustomer.id_number,
                id_type: id_type || 'aadhaar',
                id_image: id_image || existingCustomer.id_image,
                id_image2: id_image2 || existingCustomer.id_image2,
                address: address || existingCustomer.address,
                city: city || existingCustomer.city,
                state: state || existingCustomer.state,
                pincode: pincode || existingCustomer.pincode,
                customer_gst_no: customer_gst_no || existingCustomer.customer_gst_no,
                purpose_of_visit: purpose_of_visit || existingCustomer.purpose_of_visit,
                other_expenses: other_expenses || existingCustomer.other_expenses || 0,
                expense_description: expense_description || existingCustomer.expense_description
              });
            }
          } else {
            finalCustomerId = await Customer.create({
              hotel_id: hotelId,
              name: customer_name,
              phone: customer_phone,
              email: customer_email || '',
              id_number: customer_id_number || '',
              id_type: id_type || 'aadhaar',
              id_image: id_image || null,
              id_image2: id_image2 || null,
              payment_method: payment_method || 'cash',
              payment_status: payment_status || 'completed',
              transaction_id: transaction_id || null,
              address: address || '',
              city: city || '',
              state: state || '',
              pincode: pincode || '',
              customer_gst_no: customer_gst_no,
              purpose_of_visit: purpose_of_visit || null,
              other_expenses: other_expenses || 0,
              expense_description: expense_description || null
            });
            isNewCustomer = true;
            console.log('✅ Created new customer:', { customerId: finalCustomerId });
          }
        } catch (customerError) {
          console.error('❌ Customer creation error:', customerError);
          return res.status(500).json({
            success: false,
            error: 'CUSTOMER_CREATION_FAILED',
            message: 'Failed to create/update customer'
          });
        }
      }

      // ===========================================
      // 3. CHECK IF DATES ARE VALID (ALLOW PAST DATES)
      // ===========================================
      const actualFromDate = from_date || check_in_date;
      const actualToDate = to_date || check_out_date;
      const actualBookingDate = booking_date || new Date().toISOString().split('T')[0];

      if (!actualFromDate || !actualToDate) {
        return res.status(400).json({
          success: false,
          error: 'DATES_REQUIRED',
          message: 'Check-in and check-out dates are required'
        });
      }

      const fromDate = new Date(actualFromDate);
      const toDate = new Date(actualToDate);
      const bookingDate = new Date(actualBookingDate);

      if (toDate <= fromDate) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DATE_RANGE',
          message: 'Check-out date must be after check-in date'
        });
      }

      console.log('📅 Date validation passed (past dates allowed):', {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        bookingDate: bookingDate.toISOString(),
        isPastDate: fromDate < new Date()
      });

      // ===========================================
      // 4. CHECK ROOM AVAILABILITY (Skip for past bookings)
      // ===========================================
      const today = new Date();
      if (fromDate >= today) {
        const isAvailable = await Booking.checkRoomAvailability(
          room_id,
          hotelId,
          actualFromDate,
          actualToDate,
          null,
          status,
          from_time || '14:00',
          to_time || '12:00'
        );
        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            error: 'ROOM_NOT_AVAILABLE',
            message: 'Room is not available for the selected dates'
          });
        }
      } else {
        console.log('⚠️ Past date booking - skipping availability check');
      }

      // ===========================================
      // 5. CREATE BOOKING WITH PAST DATES
      // ===========================================
      let finalInvoiceNumber = invoice_number;
      if (!finalInvoiceNumber) {
        finalInvoiceNumber = await Booking.getNextInvoiceNumber(hotelId);
      }

      const otherExpensesValue = parseFloat(other_expenses) || 0;

      // Calculate total including split taxes
      const calculatedTotal = parseFloat(amount || 0) +
        parseFloat(service || 0) +
        parseFloat(gst || 0) +
        parseFloat(cgst || 0) +    // ← ADD THIS
        parseFloat(sgst || 0) +    // ← ADD THIS
        parseFloat(igst || 0) +    // ← ADD THIS
        otherExpensesValue;

      const finalTotal = parseFloat(total || calculatedTotal);

      const bookingData = {
        hotel_id: hotelId,
        room_id,
        customer_id: status === 'booked' ? finalCustomerId : null,
        from_date: actualFromDate,
        to_date: actualToDate,
        from_time: from_time,
        to_time: to_time,
        amount: parseFloat(amount || 0),
        service: parseFloat(service || 0),
        gst: parseFloat(gst || 0),
        cgst: parseFloat(cgst || 0),    // ← ADD THIS
        sgst: parseFloat(sgst || 0),    // ← ADD THIS
        igst: parseFloat(igst || 0),    // ← ADD THIS
        total: finalTotal,
        invoice_number: finalInvoiceNumber,
        status: status,
        guests: serializeGuestsForDb({ adults: req.body.adults, children: req.body.children, guests }),
        special_requests: special_requests || '',
        id_type: id_type || 'aadhaar',
        payment_method: payment_method || 'cash',
        payment_status: payment_status || 'completed',
        transaction_id: transaction_id || null,
        referral_by: referral_by || '',
        referral_amount: parseFloat(referral_amount || 0),
        booking_date: actualBookingDate,
        is_past_booking: fromDate < new Date() ? 1 : 0,
        created_at: bookingDate.toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
      };

      console.log('📅 Creating past booking with tax details:', {
        amount: bookingData.amount,
        service: bookingData.service,
        cgst: bookingData.cgst,
        sgst: bookingData.sgst,
        igst: bookingData.igst,
        gst: bookingData.gst,
        total: bookingData.total
      });

      let bookingId;
      if (status === 'booked' && finalCustomerId) {
        bookingId = await Booking.create(bookingData);
      } else {
        bookingId = await Booking.createWithoutCustomer(bookingData);
      }

      console.log('✅ Past booking created successfully:', { bookingId });

      // ===========================================
      // 6. UPDATE ROOM STATUS (Only if dates are current/future)
      // ===========================================
      if (status === 'booked' && fromDate >= today) {
        await Room.updateStatus(room_id, hotelId, 'booked');
        console.log('✅ Room status updated to booked');
      }

      // ===========================================
      // 7. CREATE COLLECTION FOR PAST BOOKING
      // ===========================================
      if (payment_method === 'cash' && status === 'booked') {
        try {
          await Collection.createFromCashBooking(bookingId, hotelId, req.user.userId);
          console.log('✅ Auto-created collection for past cash booking');
        } catch (collectionError) {
          console.error('❌ Failed to auto-create collection:', collectionError);
        }
      }

      // ===========================================
      // 8. RESPONSE
      // ===========================================
      const responseData = {
        bookingId: bookingId,
        customerId: finalCustomerId,
        isNewCustomer: isNewCustomer,
        isPastBooking: fromDate < new Date(),
        bookingDetails: {
          room_id: room_id,
          room_number: room.room_number,
          from_date: actualFromDate,
          to_date: actualToDate,
          booking_date: actualBookingDate,
          status: status,
          total: finalTotal,
          payment_method: payment_method,
          payment_status: payment_status,
          invoice_number: finalInvoiceNumber,
          // Include tax breakdown in response
          tax_breakdown: {
            cgst: parseFloat(cgst || 0),
            sgst: parseFloat(sgst || 0),
            igst: parseFloat(igst || 0),
            gst: parseFloat(gst || 0)
          }
        }
      };

      res.status(201).json({
        success: true,
        message: isNewCustomer ? 'New customer and past booking created successfully' : 'Past booking created successfully',
        data: responseData
      });

    } catch (error) {
      console.error('❌ Create past booking error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },
  // Add these methods to bookingController.js

  // Block room
  // blockRoom: async (req, res) => {
  //   try {
  //     const {
  //       roomId,
  //       roomNumber,
  //       fromDate,
  //       toDate,
  //       reason,
  //       blockedBy
  //     } = req.body;

  //     const hotelId = req.user.hotel_id;

  //     console.log('🚫 Block room request:', {
  //       hotelId,
  //       roomId,
  //       roomNumber,
  //       fromDate,
  //       toDate,
  //       reason,
  //       blockedBy
  //     });

  //     // Find room by ID or number
  //     let room;
  //     if (roomId) {
  //       room = await Room.findById(roomId, hotelId);
  //     } else if (roomNumber) {
  //       room = await Room.findByNumber(roomNumber, hotelId);
  //     }

  //     if (!room) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'ROOM_NOT_FOUND',
  //         message: 'Room not found'
  //       });
  //     }

  //     // Check if room is already booked for these dates
  //     const isAvailable = await Booking.checkRoomAvailability(
  //       room.id,
  //       hotelId,
  //       fromDate,
  //       toDate,
  //       null,
  //       'blocked'
  //     );

  //     if (!isAvailable) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'ROOM_NOT_AVAILABLE',
  //         message: 'Room is already booked or blocked for selected dates'
  //       });
  //     }

  //     // Create a booking record with status 'blocked' (no customer)
  //     const bookingData = {
  //       hotel_id: hotelId,
  //       room_id: room.id,
  //       from_date: fromDate,
  //       to_date: toDate,
  //       from_time: '00:00',
  //       to_time: '23:59',
  //       amount: 0,
  //       service: 0,
  //       gst: 0,
  //       total: 0,
  //       status: 'blocked',
  //       guests: 0,
  //       special_requests: reason || 'Room blocked',
  //       payment_method: 'none',
  //       payment_status: 'none',
  //       referral_by: blockedBy || 'Admin'
  //     };

  //     const bookingId = await Booking.createSpecialBooking(bookingData, 'block');
  //     console.log('✅ Room blocked successfully:', { bookingId });

  //     // Update room status to blocked
  //     await Room.updateStatus(room.id, hotelId, 'blocked');

  //     res.status(201).json({
  //       success: true,
  //       message: `Room ${room.room_number} blocked successfully`,
  //       data: {
  //         bookingId,
  //         roomId: room.id,
  //         roomNumber: room.room_number,
  //         fromDate,
  //         toDate,
  //         reason,
  //         blockedBy
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ Block room error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'SERVER_ERROR',
  //       message: 'Internal server error: ' + error.message
  //     });
  //   }
  // },
  // In bookingController.js - Replace the blockRoom method

  blockRoom: async (req, res) => {
    try {
      const {
        roomId,
        roomNumber,
        fromDate,
        toDate,
        reason,
        blockedBy,
        customerName  // ← ADD THIS - Allow customer name for block
      } = req.body;

      const hotelId = req.user.hotel_id;

      console.log('🚫 Block room request:', {
        hotelId,
        roomId,
        roomNumber,
        fromDate,
        toDate,
        reason,
        blockedBy,
        customerName
      });

      // Find room by ID or number
      let room;
      if (roomId) {
        room = await Room.findById(roomId, hotelId);
      } else if (roomNumber) {
        room = await Room.findByNumber(roomNumber, hotelId);
      }

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        });
      }

      // Check if room is already booked for these dates
      const isAvailable = await Booking.checkRoomAvailability(
        room.id,
        hotelId,
        fromDate,
        toDate,
        null,
        'blocked',
        '00:00',
        '23:59'
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'ROOM_NOT_AVAILABLE',
          message: 'Room is already booked or blocked for selected dates'
        });
      }

      // ===========================================
      // HANDLE CUSTOMER IF PROVIDED
      // ===========================================
      let customerId = null;

      if (customerName) {
        // Check if customer exists with this name (simplified - you might want phone too)
        const [customerRows] = await pool.execute(
          `SELECT id FROM customers WHERE hotel_id = ? AND name = ? LIMIT 1`,
          [hotelId, customerName]
        );

        if (customerRows.length > 0) {
          customerId = customerRows[0].id;
          console.log(`✅ Found customer: ${customerId} for block`);
        } else {
          // Create a generic customer for this block
          customerId = await Customer.create({
            hotel_id: hotelId,
            name: customerName,
            phone: '0000000000', // Placeholder
            email: '',
            id_number: '',
            id_type: 'aadhaar',
            address: '',
            city: '',
            state: '',
            pincode: ''
          });
          console.log(`✅ Created customer: ${customerId} for block`);
        }
      }

      // Create special requests with block details
      const specialRequests = `BLOCKED: ${reason || 'No reason provided'}\n` +
        `Blocked by: ${blockedBy || 'Admin'}\n` +
        `Customer: ${customerName || 'Not specified'}`;

      // Create a booking record with status 'blocked'
      const bookingData = {
        hotel_id: hotelId,
        room_id: room.id,
        customer_id: customerId,  // ← Include customer ID if available
        from_date: fromDate,
        to_date: toDate,
        from_time: '00:00',
        to_time: '23:59',
        amount: 0,
        service: 0,
        gst: 0,
        total: 0,
        status: 'blocked',
        guests: 0,
        special_requests: specialRequests,
        payment_method: 'none',
        payment_status: 'none',
        referral_by: blockedBy || 'Admin'
      };

      const bookingId = await Booking.createSpecialBooking(bookingData, 'blocked');
      console.log('✅ Room blocked successfully:', { bookingId });

      // Update room status to blocked
      await Room.updateStatus(room.id, hotelId, 'blocked');

      res.status(201).json({
        success: true,
        message: `Room ${room.room_number} blocked successfully`,
        data: {
          bookingId,
          roomId: room.id,
          roomNumber: room.room_number,
          fromDate,
          toDate,
          reason,
          blockedBy,
          customerName,  // ← Return customer name
          customerId     // ← Return customer ID
        }
      });

    } catch (error) {
      console.error('❌ Block room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Maintenance request
  maintenanceRequest: async (req, res) => {
    try {
      const {
        roomId,
        roomNumber,
        fromDate,
        toDate,
        maintenanceType,
        description,
        assignedTo,
        estimatedCost,
        priority
      } = req.body;

      const hotelId = req.user.hotel_id;

      console.log('🔧 Maintenance request:', {
        hotelId,
        roomId,
        roomNumber,
        fromDate,
        toDate,
        maintenanceType,
        description,
        assignedTo,
        estimatedCost,
        priority
      });

      // Find room by ID or number
      let room;
      if (roomId) {
        room = await Room.findById(roomId, hotelId);
      } else if (roomNumber) {
        room = await Room.findByNumber(roomNumber, hotelId);
      }

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'ROOM_NOT_FOUND',
          message: 'Room not found'
        });
      }

      // Check if room is already booked for these dates
      const isAvailable = await Booking.checkRoomAvailability(
        room.id,
        hotelId,
        fromDate,
        toDate,
        null,
        'maintenance',
        '00:00',
        '23:59'
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'ROOM_NOT_AVAILABLE',
          message: 'Room is already booked or under maintenance for selected dates'
        });
      }

      // Create special requests with maintenance details
      const specialRequests = `MAINTENANCE: ${maintenanceType || 'General'}\n` +
        `Description: ${description || 'Not specified'}\n` +
        `Assigned to: ${assignedTo || 'Not assigned'}\n` +
        `Priority: ${priority || 'medium'}\n` +
        `Estimated cost: ₹${estimatedCost || '0'}`;

      // Create a booking record with status 'maintenance' (no customer)
      const bookingData = {
        hotel_id: hotelId,
        room_id: room.id,
        from_date: fromDate,
        to_date: toDate,
        from_time: '00:00',
        to_time: '23:59',
        amount: 0,
        service: 0,
        gst: 0,
        total: estimatedCost || 0,
        status: 'maintenance',
        guests: 0,
        special_requests: specialRequests,
        payment_method: 'none',
        payment_status: 'none',
        referral_by: assignedTo || 'Maintenance Team'
      };

      const bookingId = await Booking.createSpecialBooking(bookingData, 'maintenance');
      console.log('✅ Maintenance request created successfully:', { bookingId });

      // Update room status to maintenance
      await Room.updateStatus(room.id, hotelId, 'maintenance');

      res.status(201).json({
        success: true,
        message: `Maintenance request for Room ${room.room_number} created successfully`,
        data: {
          bookingId,
          roomId: room.id,
          roomNumber: room.room_number,
          fromDate,
          toDate,
          maintenanceType,
          description,
          assignedTo,
          estimatedCost,
          priority
        }
      });

    } catch (error) {
      console.error('❌ Maintenance request error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get blocked rooms
  getBlockedRooms: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { date } = req.query;

      let query = `
      SELECT b.*, r.room_number, r.type as room_type
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.hotel_id = ? 
      AND b.status = 'blocked'
    `;

      let params = [hotelId];

      if (date) {
        query += ` AND b.from_date <= ? AND b.to_date >= ?`;
        params.push(date, date);
      }

      query += ` ORDER BY b.from_date`;

      const [blockedRooms] = await pool.execute(query, params);

      res.json({
        success: true,
        data: blockedRooms,
        count: blockedRooms.length
      });

    } catch (error) {
      console.error('❌ Get blocked rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  // Get maintenance rooms
  getMaintenanceRooms: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { date } = req.query;

      let query = `
      SELECT b.*, r.room_number, r.type as room_type
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.hotel_id = ? 
      AND b.status = 'maintenance'
    `;

      let params = [hotelId];

      if (date) {
        query += ` AND b.from_date <= ? AND b.to_date >= ?`;
        params.push(date, date);
      }

      query += ` ORDER BY b.from_date`;

      const [maintenanceRooms] = await pool.execute(query, params);

      res.json({
        success: true,
        data: maintenanceRooms,
        count: maintenanceRooms.length
      });

    } catch (error) {
      console.error('❌ Get maintenance rooms error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },
  // ===========================================
  // GENERATE BLOCK ROOM PDF
  // ===========================================
  generateBlockRoomPDF: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      // Get blocked room details - FIXED QUERY
      const [blockRows] = await pool.execute(`
      SELECT b.*, r.room_number, r.type as room_type,
             h.name as hotel_name, h.address as hotel_address,
             u.phone as hotel_phone, u.email as hotel_email,
             h.gst_number
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN users u ON b.hotel_id = u.hotel_id AND u.role = 'admin'
      WHERE b.id = ? AND b.hotel_id = ? AND b.status = 'blocked'
      LIMIT 1
    `, [id, hotelId]);

      if (blockRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'BLOCK_NOT_FOUND',
          message: 'Blocked room record not found'
        });
      }

      const blockData = blockRows[0];
      const hotelDetails = {
        name: blockData.hotel_name,
        address: blockData.hotel_address,
        phone: blockData.hotel_phone || 'N/A',
        email: blockData.hotel_email || 'N/A',
        gst_number: blockData.gst_number || 'N/A'
      };

      // Generate PDF
      const pdfBuffer = await BlockMaintenancePdfService.generateBlockReport(blockData, hotelDetails);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="block-report-${blockData.room_number || 'room'}-${Date.now()}.pdf"`);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('❌ Generate block room PDF error:', error);
      res.status(500).json({
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate block room report: ' + error.message
      });
    }
  },

  // In your bookingController.js, update the generateMaintenanceRoomPDF method:
  generateMaintenanceRoomPDF: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log(`📄 Generating maintenance PDF for ID: ${id}`);

      // Get maintenance room details
      const [maintenanceRows] = await pool.execute(`
      SELECT 
        b.id,
        b.from_date,
        b.to_date,
        b.total,
        b.status,
        b.special_requests,
        r.room_number,
        r.type as room_type,
        h.name as hotel_name,
        h.address as hotel_address
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.id = ? AND b.hotel_id = ? AND b.status = 'maintenance'
      LIMIT 1
    `, [id, hotelId]);

      if (maintenanceRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'MAINTENANCE_NOT_FOUND',
          message: 'Maintenance record not found'
        });
      }

      const maintenanceData = maintenanceRows[0];

      const hotelDetails = {
        name: maintenanceData.hotel_name || 'Hotel',
        address: maintenanceData.hotel_address || '',
        phone: 'N/A', // You can fetch this from database if needed
        email: 'N/A'
      };

      console.log('📊 Maintenance data:', maintenanceData);

      // Generate PDF
      const pdfBuffer = await BlockMaintenancePdfService.generateMaintenanceReport(maintenanceData, hotelDetails);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty');
      }

      console.log(`✅ PDF buffer size: ${pdfBuffer.length} bytes`);

      // Set proper headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="maintenance-report-${maintenanceData.room_number}-${id}.pdf"`);

      // IMPORTANT: Don't send JSON, send the buffer directly
      res.send(pdfBuffer);

    } catch (error) {
      console.error('❌ Generate maintenance room PDF error:', error);

      // Send proper error response
      res.status(500).json({
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: error.message
      });
    }
  },

  // ===========================================
  // GENERATE COMBINED BLOCK/MAINTENANCE REPORT
  // ===========================================
  generateCombinedReport: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { startDate, endDate } = req.query;

      // Get hotel details from users table
      const [hotelRows] = await pool.execute(`
      SELECT h.name, h.address, h.gst_number,
             u.phone as hotel_phone, u.email as hotel_email
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
      WHERE h.id = ?
      LIMIT 1
    `, [hotelId]);

      if (hotelRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        });
      }

      const hotelDetails = hotelRows[0];

      // Build query for blocked rooms
      let blockedQuery = `
      SELECT b.*, r.room_number, r.type as room_type
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.hotel_id = ? AND b.status = 'blocked'
    `;

      // Build query for maintenance rooms
      let maintenanceQuery = `
      SELECT b.*, r.room_number, r.type as room_type
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.hotel_id = ? AND b.status = 'maintenance'
    `;

      const blockedParams = [hotelId];
      const maintenanceParams = [hotelId];

      if (startDate && endDate) {
        blockedQuery += ` AND b.from_date >= ? AND b.to_date <= ?`;
        blockedParams.push(startDate, endDate);

        maintenanceQuery += ` AND b.from_date >= ? AND b.to_date <= ?`;
        maintenanceParams.push(startDate, endDate);
      }

      blockedQuery += ` ORDER BY b.from_date`;
      maintenanceQuery += ` ORDER BY b.from_date`;

      // Execute both queries
      const [blockedRooms] = await pool.execute(blockedQuery, blockedParams);
      const [maintenanceRooms] = await pool.execute(maintenanceQuery, maintenanceParams);

      // Generate combined PDF report
      const pdfBuffer = await BlockMaintenancePdfService.generateCombinedReport(
        blockedRooms,
        maintenanceRooms,
        hotelDetails
      );

      // Set response headers
      const filename = startDate && endDate
        ? `room-status-report-${startDate}-to-${endDate}.pdf`
        : `room-status-report-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('❌ Generate combined report error:', error);
      res.status(500).json({
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate combined report: ' + error.message
      });
    }
  },

  // ===========================================
  // GET BLOCK/MAINTENANCE STATISTICS
  // ===========================================
  getBlockMaintenanceStats: async (req, res) => {
    try {
      const hotelId = req.user.hotel_id;
      const { period = 'current' } = req.query; // current, week, month, year

      let dateCondition = '';
      let params = [hotelId];

      if (period === 'week') {
        dateCondition = `AND b.from_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
      } else if (period === 'month') {
        dateCondition = `AND b.from_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
      } else if (period === 'year') {
        dateCondition = `AND b.from_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)`;
      } else {
        // current - today
        dateCondition = `AND DATE(b.from_date) = CURDATE()`;
      }

      // Get blocked rooms statistics
      const [blockStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_blocks,
        SUM(CASE WHEN DATE(b.from_date) = CURDATE() THEN 1 ELSE 0 END) as today_blocks,
        SUM(CASE WHEN b.to_date < CURDATE() THEN 1 ELSE 0 END) as expired_blocks,
        SUM(CASE WHEN b.from_date <= CURDATE() AND b.to_date >= CURDATE() THEN 1 ELSE 0 END) as active_blocks,
        MIN(b.from_date) as earliest_block,
        MAX(b.to_date) as latest_block_end
      FROM bookings b
      WHERE b.hotel_id = ? 
      AND b.status = 'blocked'
      ${dateCondition}
    `, params);

      // Get maintenance rooms statistics
      const [maintenanceStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_maintenance,
        SUM(CASE WHEN DATE(b.from_date) = CURDATE() THEN 1 ELSE 0 END) as today_maintenance,
        SUM(CASE WHEN b.to_date < CURDATE() THEN 1 ELSE 0 END) as expired_maintenance,
        SUM(CASE WHEN b.from_date <= CURDATE() AND b.to_date >= CURDATE() THEN 1 ELSE 0 END) as active_maintenance,
        SUM(b.total) as total_maintenance_cost,
        AVG(b.total) as avg_maintenance_cost
      FROM bookings b
      WHERE b.hotel_id = ? 
      AND b.status = 'maintenance'
      ${dateCondition}
    `, params);

      // Get room distribution
      const [roomDistribution] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT CASE WHEN b.status = 'blocked' THEN r.id END) as blocked_room_count,
        COUNT(DISTINCT CASE WHEN b.status = 'maintenance' THEN r.id END) as maintenance_room_count,
        (SELECT COUNT(*) FROM rooms WHERE hotel_id = ? AND status = 'available') as available_room_count,
        (SELECT COUNT(*) FROM rooms WHERE hotel_id = ?) as total_room_count
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.hotel_id = ? 
      AND (b.status = 'blocked' OR b.status = 'maintenance')
      AND (b.from_date <= CURDATE() AND b.to_date >= CURDATE())
    `, [hotelId, hotelId, hotelId]);

      res.json({
        success: true,
        data: {
          period,
          blockStats: blockStats[0] || {},
          maintenanceStats: maintenanceStats[0] || {},
          roomDistribution: roomDistribution[0] || {},
          summary: {
            totalUnavailable: (blockStats[0]?.active_blocks || 0) + (maintenanceStats[0]?.active_maintenance || 0),
            revenueImpact: `₹${((blockStats[0]?.active_blocks || 0) * 5000).toLocaleString('en-IN')}`, // Estimated daily revenue loss
            operationalImpact: 'Moderate' // Based on number of unavailable rooms
          }
        }
      });

    } catch (error) {
      console.error('❌ Get block/maintenance stats error:', error);
      res.status(500).json({
        success: false,
        error: 'STATS_FETCH_FAILED',
        message: 'Failed to fetch statistics: ' + error.message
      });
    }
  },

  // Unblock room
  unblockRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const hotelId = req.user.hotel_id;

      console.log('🔓 Unblock room request:', { id, hotelId });

      // Get current booking details
      const currentBooking = await Booking.findById(id, hotelId);
      if (!currentBooking) {
        return res.status(404).json({
          success: false,
          error: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        });
      }

      // Check if it's actually a blocked room
      if (currentBooking.status !== 'blocked') {
        return res.status(400).json({
          success: false,
          error: 'NOT_BLOCKED',
          message: 'This booking is not a blocked room'
        });
      }

      // Update booking status to 'available'
      const updated = await Booking.update(id, hotelId, {
        status: 'available'
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to unblock room'
        });
      }

      // Get the room ID from the booking
      const roomId = currentBooking.room_id;

      if (roomId) {
        // Update room status to available
        const Room = require('../models/Room');
        const roomUpdated = await Room.updateStatus(roomId, hotelId, 'available');

        if (!roomUpdated) {
          console.warn('⚠️ Room status update may have failed:', { roomId, hotelId });
        } else {
          console.log('✅ Room status updated to available:', roomId);
        }
      }

      console.log('✅ Room unblocked successfully:', { bookingId: id });

      res.json({
        success: true,
        message: 'Room unblocked successfully'
      });

    } catch (error) {
      console.error('❌ Unblock room error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error: ' + error.message
      });
    }
  },

  //  createMultipleBookings method




  // In bookingController.js - Update createMultipleBookings method
  // createMultipleBookings: async (req, res) => {
  //   try {
  //     const { bookings, groupBookingId } = req.body;
  //     const hotelId = req.user.hotel_id;
  //     const userId = req.user.userId;  // Get the current user ID for collections

  //     const results = [];
  //     const errors = [];

  //     console.log('📦 Processing multiple bookings:', {
  //       count: bookings.length,
  //       groupBookingId,
  //       firstBooking: bookings[0]
  //     });

  //     // Process each booking
  //     for (const bookingData of bookings) {
  //       try {
  //         // Extract customer details from each booking
  //         const {
  //           customer_name,
  //           customer_phone,
  //           customer_email,
  //           customer_id_number,
  //           id_type,
  //           address,
  //           city,
  //           state,
  //           pincode,
  //           customer_gst_no,
  //           // Room details
  //           room_id,
  //           from_date,
  //           to_date,
  //           from_time,
  //           to_time,
  //           amount,
  //           service,
  //           cgst,
  //           sgst,
  //           igst,
  //           total,
  //           guests,
  //           special_requests,
  //           payment_method,
  //           payment_status,
  //           id_number
  //         } = bookingData;

  //         // ===========================================
  //         // 1. CHECK ROOM AVAILABILITY
  //         // ===========================================
  //         const isAvailable = await Booking.checkRoomAvailability(
  //           room_id,
  //           hotelId,
  //           from_date,
  //           to_date,
  //           null,
  //           'booked'
  //         );

  //         if (!isAvailable) {
  //           errors.push({
  //             room_id,
  //             error: 'ROOM_NOT_AVAILABLE',
  //             message: `Room ${room_id} is not available for selected dates`
  //           });
  //           continue;
  //         }

  //         // ===========================================
  //         // 2. HANDLE CUSTOMER
  //         // ===========================================
  //         let finalCustomerId = null;

  //         if (customer_name && customer_phone) {
  //           // Check if customer exists
  //           let existingCustomer = await Customer.findByPhone(customer_phone, hotelId);

  //           if (existingCustomer) {
  //             finalCustomerId = existingCustomer.id;
  //             console.log(`✅ Using existing customer: ${finalCustomerId} for booking`);

  //             // Optionally update customer details
  //             await Customer.update(existingCustomer.id, hotelId, {
  //               name: customer_name,
  //               phone: customer_phone,
  //               email: customer_email || existingCustomer.email,
  //               id_number: customer_id_number || existingCustomer.id_number,
  //               id_type: id_type || existingCustomer.id_type || 'aadhaar',
  //               address: address || existingCustomer.address,
  //               city: city || existingCustomer.city,
  //               state: state || existingCustomer.state,
  //               pincode: pincode || existingCustomer.pincode,
  //               customer_gst_no: customer_gst_no || existingCustomer.customer_gst_no
  //             });

  //           } else {
  //             // Create new customer
  //             finalCustomerId = await Customer.create({
  //               hotel_id: hotelId,
  //               name: customer_name,
  //               phone: customer_phone,
  //               email: customer_email || '',
  //               id_number: customer_id_number || '',
  //               id_type: id_type || 'aadhaar',
  //               address: address || '',
  //               city: city || '',
  //               state: state || '',
  //               pincode: pincode || '',
  //               customer_gst_no: customer_gst_no || ''
  //             });
  //             console.log(`✅ Created new customer: ${finalCustomerId}`);
  //           }
  //         }

  //         // ===========================================
  //         // 3. CREATE BOOKING WITH GROUP ID
  //         // ===========================================
  //         const bookingPayload = {
  //           hotel_id: hotelId,
  //           room_id,
  //           customer_id: finalCustomerId,
  //           group_booking_id: groupBookingId,
  //           from_date,
  //           to_date,
  //           from_time: from_time || '14:00',
  //           to_time: to_time || '12:00',
  //           amount: parseFloat(amount || 0),
  //           service: parseFloat(service || 0),
  //           cgst: parseFloat(cgst || 0),
  //           sgst: parseFloat(sgst || 0),
  //           igst: parseFloat(igst || 0),
  //           total: parseFloat(total || amount || 0),
  //           status: 'booked',
  //           guests: serializeGuestsForDb({ adults: req.body.adults, children: req.body.children, guests }),
  //           special_requests: special_requests || '',
  //           payment_method: payment_method || 'cash',
  //           payment_status: payment_status || 'pending',
  //           id_type: id_type || 'aadhaar'
  //         };

  //         // Use the create method that handles customer correctly
  //         const bookingId = await Booking.create(bookingPayload);

  //         // Update room status
  //         await Room.updateStatus(room_id, hotelId, 'booked');

  //         // ===========================================
  //         // 4. CREATE TRANSACTION FOR ONLINE PAYMENT
  //         // ===========================================
  //         if (payment_method === 'online' && bookingId) {
  //           try {
  //             const Transaction = require('../models/Transaction');
  //             const generatedTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}-${room_id}`;

  //             await Transaction.create({
  //               hotel_id: hotelId,
  //               booking_id: bookingId,
  //               customer_id: finalCustomerId,
  //               transaction_id: generatedTransactionId,
  //               amount: parseFloat(total || amount || 0),
  //               currency: 'INR',
  //               payment_method: 'online',
  //               payment_gateway: 'upi',
  //               status: payment_status || 'pending',
  //               status_message: payment_status === 'completed' ? 'Payment completed' : 'Payment initiated',
  //               metadata: {
  //                 room_id: room_id,
  //                 from_date: from_date,
  //                 to_date: to_date,
  //                 customer_name: customer_name,
  //                 group_booking_id: groupBookingId
  //               }
  //             });

  //             console.log(`💰 Transaction created for booking ${bookingId}`);

  //             // Update booking with transaction ID
  //             await Booking.update(bookingId, hotelId, {
  //               transaction_id: generatedTransactionId
  //             });

  //           } catch (transactionError) {
  //             console.error('❌ Transaction creation error:', transactionError);
  //             // Don't fail the booking if transaction creation fails
  //           }
  //         }

  //         // ===========================================
  //         // 5. CREATE COLLECTION FOR CASH PAYMENT
  //         // ===========================================
  //         if (payment_method === 'cash' && bookingId) {
  //           try {
  //             const Collection = require('../models/Collection');
  //             await Collection.createFromCashBooking(bookingId, hotelId, userId);
  //             console.log(`✅ Collection created for cash booking ${bookingId}`);
  //           } catch (collectionError) {
  //             console.error('❌ Failed to create collection:', collectionError);
  //           }
  //         }

  //         results.push({
  //           bookingId,
  //           room_id,
  //           customer_id: finalCustomerId,
  //           success: true
  //         });

  //       } catch (error) {
  //         console.error('❌ Error processing booking:', error);
  //         errors.push({
  //           room_id: bookingData.room_id,
  //           error: error.message
  //         });
  //       }
  //     }

  //     res.json({
  //       success: true,
  //       data: {
  //         successful: results,
  //         failed: errors,
  //         groupBookingId,
  //         totalSuccess: results.length,
  //         totalFailed: errors.length
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Multiple booking error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: error.message
  //     });
  //   }
  // },



  // In bookingController.js - Update createMultipleBookings method

  createMultipleBookings: async (req, res) => {
    try {
      const { bookings, groupBookingId, isGroupConversion, conversionPaymentMethod, conversionPaymentStatus, hotelId: reqHotelId } = req.body;
      const hotelId = req.user?.hotel_id || reqHotelId;
      const userId = req.user?.userId;

      const results = [];
      const errors = [];

      console.log('📦 Processing multiple bookings:', {
        count: bookings.length,
        groupBookingId,
        isGroupConversion,
        conversionPaymentMethod,
        hotelId
      });

      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        for (const bookingData of bookings) {
          try {
            console.log(`📝 Processing booking for room ${bookingData.room_id}:`, bookingData);

            // Handle customer
            let finalCustomerId = null;
            if (bookingData.customer_name && bookingData.customer_phone) {
              let existingCustomer = await Customer.findByPhone(bookingData.customer_phone, hotelId);

              if (existingCustomer) {
                finalCustomerId = existingCustomer.id;
                // Update customer details
                await Customer.update(existingCustomer.id, hotelId, {
                  name: bookingData.customer_name,
                  phone: bookingData.customer_phone,
                  email: bookingData.customer_email || existingCustomer.email,
                  id_number: bookingData.id_number || existingCustomer.id_number,
                  id_type: bookingData.id_type || existingCustomer.id_type || 'aadhaar',
                  address: bookingData.address || existingCustomer.address,
                  city: bookingData.city || existingCustomer.city,
                  state: bookingData.state || existingCustomer.state,
                  pincode: bookingData.pincode || existingCustomer.pincode,
                  id_image: bookingData.id_image || existingCustomer.id_image,
                  id_image2: bookingData.id_image2 || existingCustomer.id_image2
                });
              } else {
                finalCustomerId = await Customer.create({
                  hotel_id: hotelId,
                  name: bookingData.customer_name,
                  phone: bookingData.customer_phone,
                  email: bookingData.customer_email || '',
                  id_number: bookingData.id_number || '',
                  id_type: bookingData.id_type || 'aadhaar',
                  address: bookingData.address || '',
                  city: bookingData.city || '',
                  state: bookingData.state || '',
                  pincode: bookingData.pincode || '',
                  id_image: bookingData.id_image || null,
                  id_image2: bookingData.id_image2 || null
                });
              }
            }

            // Check room availability (skip if converting advance booking)
            let isAvailable = true;
            if (!bookingData.is_conversion) {
              isAvailable = await Booking.checkRoomAvailability(
                bookingData.room_id,
                hotelId,
                bookingData.from_date,
                bookingData.to_date,
                null,
                'booked',
                bookingData.from_time || '14:00',
                bookingData.to_time || '12:00'
              );
            }

            if (!isAvailable && !bookingData.is_conversion) {
              errors.push({
                room_id: bookingData.room_id,
                error: 'ROOM_NOT_AVAILABLE',
                message: `Room ${bookingData.room_id} is not available`
              });
              continue;
            }

            // Generate invoice number
            let invoiceNumber = bookingData.invoice_number;
            if (!invoiceNumber) {
              invoiceNumber = await Booking.getNextInvoiceNumber(hotelId);
            }

            // Create booking
            const bookingPayload = {
              hotel_id: hotelId,
              room_id: bookingData.room_id,
              customer_id: finalCustomerId,
              advance_booking_id: bookingData.advance_booking_id || null,
              group_booking_id: groupBookingId,
              from_date: bookingData.from_date,
              to_date: bookingData.to_date,
              from_time: bookingData.from_time || '14:00',
              to_time: bookingData.to_time || '12:00',
              amount: parseFloat(bookingData.amount || 0),
              service: parseFloat(bookingData.service || 0),
              cgst: parseFloat(bookingData.cgst || 0),
              sgst: parseFloat(bookingData.sgst || 0),
              igst: parseFloat(bookingData.igst || 0),
              total: parseFloat(bookingData.total || 0),
              status: 'booked',
              guests: serializeGuestsForDb(bookingData),
              special_requests: bookingData.special_requests || '',
              payment_method: bookingData.conversion_payment_method || bookingData.payment_method || 'cash',
              payment_status: bookingData.conversion_payment_status || bookingData.payment_status || 'completed',
              id_type: bookingData.id_type || 'aadhaar',
              invoice_number: invoiceNumber,
              advance_amount_paid: parseFloat(bookingData.advance_amount_paid || 0),
              remaining_amount: parseFloat(bookingData.remaining_amount || 0),
              discount_percentage: parseFloat(bookingData.discount_percentage || 0),
              discount_amount: parseFloat(bookingData.discount_amount || 0),
              original_amount: parseFloat(bookingData.original_amount || bookingData.amount || 0)
            };

            console.log('📝 Creating booking payload:', bookingPayload);

            const bookingId = await Booking.create(bookingPayload);
            console.log(`✅ Booking created with ID: ${bookingId}`);

            // Update room status
            await Room.updateStatus(bookingData.room_id, hotelId, 'booked');

            // If this is a conversion from advance booking, update the advance booking status
            if (bookingData.is_conversion && bookingData.advance_booking_id) {
              await connection.execute(
                `UPDATE advance_bookings 
               SET status = 'converted', 
                   converted_at = NOW(),
                   converted_booking_id = ?,
                   payment_method = ?,
                   payment_status = ?
               WHERE id = ? AND hotel_id = ?`,
                [bookingId, bookingPayload.payment_method, bookingPayload.payment_status, bookingData.advance_booking_id, hotelId]
              );
              console.log(`✅ Advance booking ${bookingData.advance_booking_id} marked as converted`);
            }

            // Create collection for cash payment
            if (bookingPayload.payment_method === 'cash' && bookingId) {
              try {
                const Collection = require('../models/Collection');
                await Collection.createFromCashBooking(bookingId, hotelId, userId);
                console.log(`💰 Collection created for booking ${bookingId}`);
              } catch (collectionError) {
                console.error('Collection creation error:', collectionError);
              }
            }
            // Create transaction for online payment
            if (bookingPayload.payment_method === 'online' && bookingId) {
              try {
                const Transaction = require('../models/Transaction');
                const generatedTransactionId = bookingPayload.transaction_id || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}-${bookingData.room_id}`;

                await Transaction.create({
                  hotel_id: hotelId,
                  booking_id: bookingId,
                  customer_id: finalCustomerId,
                  transaction_id: generatedTransactionId,
                  amount: parseFloat(bookingPayload.total || 0),
                  currency: 'INR',
                  payment_method: 'online',
                  payment_gateway: 'upi',
                  status: bookingPayload.payment_status || 'pending',
                  status_message: bookingPayload.payment_status === 'completed' ? 'Payment completed' : 'Payment initiated',
                  metadata: {
                    room_id: bookingData.room_id,
                    from_date: bookingData.from_date,
                    to_date: bookingData.to_date,
                    customer_name: bookingData.customer_name,
                    group_booking_id: groupBookingId
                  }
                });

                console.log(`💰 Transaction created for booking ${bookingId}`);

                // Update booking with transaction ID
                await Booking.update(bookingId, hotelId, {
                  transaction_id: generatedTransactionId
                });

              } catch (transactionError) {
                console.error('❌ Transaction creation error:', transactionError);
              }
            }

            results.push({
              bookingId,
              room_id: bookingData.room_id,
              customer_id: finalCustomerId,
              advance_booking_id: bookingData.advance_booking_id,
              success: true
            });

          } catch (error) {
            console.error('❌ Error processing booking:', error);
            errors.push({
              room_id: bookingData.room_id,
              error: error.message
            });
          }
        }

        // Commit transaction
        await connection.commit();
        console.log('✅ Transaction committed successfully');

        // If this was a group conversion, dispatch an event
        if (isGroupConversion && results.length > 0) {
          // You can add socket.io or event emitter here if needed
          console.log(`🎉 Group conversion completed: ${results.length} rooms converted`);
        }

        res.json({
          success: true,
          data: {
            successful: results,
            failed: errors,
            groupBookingId,
            totalSuccess: results.length,
            totalFailed: errors.length,
            isGroupConversion: !!isGroupConversion
          }
        });

      } catch (error) {
        await connection.rollback();
        console.error('❌ Transaction error, rolling back:', error);
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Multiple booking error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get group booking details
  getGroupBooking: async (req, res) => {
    try {
      const { groupId } = req.params;
      const hotelId = req.user.hotel_id;

      const bookings = await Booking.findByGroupId(groupId, hotelId);

      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Error fetching group booking:', error);
      res.status(500).json({ error: error.message });
    }
  },



  // serveInvoiceBuilder: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const token = req.query.token;

  //     if (!token) {
  //       return res.status(401).send('<html><body><h1>Authentication Error</h1><button onclick="window.close()">Close</button></body></html>');
  //     }

  //     const jwt = require('jsonwebtoken');
  //     let decoded;
  //     try {
  //       decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  //     } catch (err) {
  //       return res.status(401).send('<html><body><h1>Invalid Token</h1><button onclick="window.close()">Close</button></body></html>');
  //     }

  //     const hotelId = decoded.hotel_id;

  //     // Get booking details
  //     const booking = await Booking.findById(id, hotelId);
  //     if (!booking) {
  //       return res.status(404).send('<html><body><h1>Booking Not Found</h1><button onclick="window.close()">Close</button></body></html>');
  //     }

  //     // Get customer details
  //     let customerDetails = null;
  //     if (booking.customer_id) {
  //       customerDetails = await Customer.findById(booking.customer_id, hotelId);
  //     }

  //     const roomDetails = await Room.findById(booking.room_id, hotelId);

  //     // Get hotel details
  //     const [hotelRows] = await pool.execute(`
  //           SELECT h.*, u.phone as hotel_phone, u.email as hotel_email, u.name as admin_name
  //           FROM hotels h
  //           LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
  //           WHERE h.id = ? LIMIT 1
  //       `, [hotelId]);

  //     const hotelDetails = hotelRows[0] || {};

  //     // Helper functions
  //     const formatDateDisplay = (dateStr) => {
  //       if (!dateStr) return '';
  //       try {
  //         const date = new Date(dateStr);
  //         return date.toLocaleDateString('en-IN', {
  //           day: '2-digit', month: 'long', year: 'numeric'
  //         });
  //       } catch (e) { return dateStr; }
  //     };

  //     const formatCurrency = (value) => {
  //       const num = parseFloat(value);
  //       return isNaN(num) ? '0' : num.toLocaleString('en-IN');
  //     };

  //     const calculateNights = (fromDate, toDate) => {
  //       if (!fromDate || !toDate) return 1;
  //       const from = new Date(fromDate);
  //       const to = new Date(toDate);
  //       const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  //       return diff > 0 ? diff : 1;
  //     };

  //     const nights = calculateNights(booking.from_date, booking.to_date);
  //     const roomAmount = parseFloat(booking.amount) || 0;
  //     const serviceAmount = parseFloat(booking.service) || 0;
  //     const cgstAmount = parseFloat(booking.cgst) || 0;
  //     const sgstAmount = parseFloat(booking.sgst) || 0;
  //     const igstAmount = parseFloat(booking.igst) || 0;
  //     const totalAmount = parseFloat(booking.total) || 0;
  //     const perNightRate = nights > 0 ? roomAmount / nights : roomAmount;

  //     // ← NEW: Get advance payment details
  //     const advancePaid = parseFloat(booking.advance_amount_paid) || 0;
  //     const remainingAmount = parseFloat(booking.remaining_amount) || (totalAmount - advancePaid);

  //     const discountPercentage = parseFloat(booking.discount_percentage) || 0;
  //     const discountAmount = parseFloat(booking.discount_amount) || 0;
  //     const originalAmount = parseFloat(booking.original_amount) || roomAmount;

  //     // Calculate tax percentages
  //     const taxableAmount = originalAmount + serviceAmount;
  //     let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;
  //     if (taxableAmount > 0) {
  //       if (cgstAmount > 0) cgstPercentage = (cgstAmount / taxableAmount) * 100;
  //       if (sgstAmount > 0) sgstPercentage = (sgstAmount / taxableAmount) * 100;
  //       if (igstAmount > 0) igstPercentage = (igstAmount / taxableAmount) * 100;
  //     }
  //     const taxType = igstAmount > 0 ? 'igst' : 'cgst_sgst';
  //     const otherExpenses = parseFloat(customerDetails?.other_expenses) || 0;
  //     const expenseDescription = (customerDetails?.expense_description || '').replace(/'/g, "\\'");

  //     const escapeHtml = (str) => {
  //       if (!str) return '';
  //       return String(str)
  //         .replace(/&/g, '&amp;')
  //         .replace(/</g, '&lt;')
  //         .replace(/>/g, '&gt;')
  //         .replace(/"/g, '&quot;')
  //         .replace(/'/g, '&#39;');
  //     };

  //     // Prepare data for template
  //     const hotelName = escapeHtml(hotelDetails.name || 'Hotel Management');
  //     const hotelTag = 'Luxury Collection';
  //     const hotelAddr = escapeHtml(hotelDetails.address || 'Address not specified');
  //     const hotelGstin = escapeHtml(hotelDetails.gst_number || 'N/A');
  //     const hotelTel = escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A');
  //     const invNo = escapeHtml(booking.invoice_number);
  //     const invDate = formatDateDisplay(new Date().toISOString());
  //     const invFolio = `Room ${roomDetails?.room_number || ''}`;
  //     const guestName = escapeHtml(customerDetails?.name || 'Walk-in Customer');
  //     const guestDetails = `${escapeHtml(customerDetails?.email || '')}<br>${escapeHtml(customerDetails?.phone || 'N/A')}`;
  //     const stayDates = `${formatDateDisplay(booking.from_date)} — ${formatDateDisplay(booking.to_date)}`;
  //     const stayDetails = `${nights} Nights · ${booking.guests || 1} Adults<br>${roomDetails?.type || 'Standard'} Room`;
  //     const resId = `RES-${booking.id}`;
  //     const resDetails = escapeHtml(booking.special_requests ? 'Special Request: ' + booking.special_requests.substring(0, 50) : 'Direct Booking');
  //     const roomType = escapeHtml(roomDetails?.type || 'Deluxe King Room');
  //     const roomNote = escapeHtml(roomDetails?.amenities || 'Bed & Breakfast');

  //     // ← NEW: Enhanced payment status and info with advance payment details
  //     let paymentStatusText = `${booking.payment_status || 'Pending'} · ${booking.payment_method || 'Cash'}`;
  //     let paymentInfoText = `Payment Mode: ${(booking.payment_method || 'Cash').toUpperCase()}<br>${booking.transaction_id ? `Transaction Ref: ${booking.transaction_id}<br>` : ''}Bank: ${hotelName} Account<br><br>Email: ${escapeHtml(hotelDetails.hotel_email || 'accounts@hotel.com')}<br>Tel: ${hotelTel}`;

  //     // ← NEW: Add advance payment info to payment info
  //     if (advancePaid > 0) {
  //       paymentStatusText += ` · Advance: ₹${formatCurrency(advancePaid)}`;
  //       paymentInfoText = `<strong>Advance Payment: ₹${formatCurrency(advancePaid)}</strong><br>Balance Due: ₹${formatCurrency(remainingAmount)}<br><br>${paymentInfoText}`;
  //     }

  //     // Build room rows HTML with advance payment calculation
  //     let roomRows = '';
  //     if (discountPercentage > 0) {
  //       roomRows += '<tr class="removable original-row" style="position:relative;">';
  //       roomRows += '<td><span contenteditable="true">' + roomType + ' (Original)</span><span class="note" contenteditable="true">' + roomNote + '</span></td>';
  //       roomRows += '<td contenteditable="true">' + nights + '</td>';
  //       roomRows += '<td contenteditable="true">₹' + formatCurrency(originalAmount / nights) + '</td>';
  //       roomRows += '<td contenteditable="true">₹' + formatCurrency(originalAmount) + '</td>';
  //       roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
  //       roomRows += '</tr>';

  //       roomRows += '<tr class="removable discount-row" style="position:relative;">';
  //       roomRows += '<td><span contenteditable="true">Discount (' + discountPercentage + '% OFF)</span><span class="note" contenteditable="true">Special offer applied</span></td>';
  //       roomRows += '<td contenteditable="true">—</td>';
  //       roomRows += '<td contenteditable="true">—</td>';
  //       roomRows += '<td contenteditable="true" style="color:#28a745;">-₹' + formatCurrency(discountAmount) + '</td>';
  //       roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
  //       roomRows += '</tr>';
  //     }

  //     roomRows += '<tr class="removable" style="position:relative;">';
  //     roomRows += '<td><span contenteditable="true">' + roomType + '</span><span class="note" contenteditable="true">' + roomNote + '</span></td>';
  //     roomRows += '<td contenteditable="true">' + nights + '</td>';
  //     roomRows += '<td contenteditable="true">₹' + formatCurrency(perNightRate) + '</td>';
  //     roomRows += '<td contenteditable="true">₹' + formatCurrency(roomAmount) + '</td>';
  //     roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
  //     roomRows += '</tr>';

  //     if (serviceAmount > 0) {
  //       roomRows += '<tr class="removable" style="position:relative;">';
  //       roomRows += '<td><span contenteditable="true">Service Charges</span><span class="note" contenteditable="true">Hotel service fee</span></td>';
  //       roomRows += '<td contenteditable="true">—</td>';
  //       roomRows += '<td contenteditable="true">—</td>';
  //       roomRows += '<td contenteditable="true">₹' + formatCurrency(serviceAmount) + '</td>';
  //       roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
  //       roomRows += '</tr>';
  //     }

  //     if (otherExpenses > 0) {
  //       roomRows += '<tr class="removable" style="position:relative;">';
  //       roomRows += '<td><span contenteditable="true">Other Expenses</span><span class="note" contenteditable="true">' + expenseDescription + '</span></td>';
  //       roomRows += '<td contenteditable="true">—</td>';
  //       roomRows += '<td contenteditable="true">—</td>';
  //       roomRows += '<td contenteditable="true">₹' + formatCurrency(otherExpenses) + '</td>';
  //       roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
  //       roomRows += '</tr>';
  //     }

  //     // Build calc rows HTML with advance payment
  //     let calcRows = '';
  //     calcRows += '<div class="calc-row removable" style="position:relative;">';
  //     calcRows += '<span contenteditable="true">Subtotal</span><span contenteditable="true">₹' + formatCurrency(roomAmount + serviceAmount) + '</span>';
  //     calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //     calcRows += '</div>';

  //     if (discountPercentage > 0) {
  //       calcRows += '<div class="calc-row disc removable" style="position:relative;">';
  //       calcRows += '<span contenteditable="true">Discount (' + discountPercentage + '%)</span><span contenteditable="true">− ₹' + formatCurrency(discountAmount) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     if (taxType === 'cgst_sgst' && cgstAmount > 0) {
  //       calcRows += '<div class="calc-row gst removable" style="position:relative;">';
  //       calcRows += '<span contenteditable="true">CGST @ ' + cgstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(cgstAmount) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     if (taxType === 'cgst_sgst' && sgstAmount > 0) {
  //       calcRows += '<div class="calc-row gst removable" style="position:relative;">';
  //       calcRows += '<span contenteditable="true">SGST @ ' + sgstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(sgstAmount) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     if (taxType === 'igst' && igstAmount > 0) {
  //       calcRows += '<div class="calc-row gst removable" style="position:relative;">';
  //       calcRows += '<span contenteditable="true">IGST @ ' + igstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(igstAmount) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     // ← NEW: Add advance payment row (like discount)
  //     if (advancePaid > 0) {
  //       calcRows += '<div class="calc-row advance removable" style="position:relative; border-top: 1px dashed #D9C890; margin-top: 4px; padding-top: 4px;">';
  //       calcRows += '<span contenteditable="true" style="color:#6A4A20;">Advance Payment Already Paid</span>';
  //       calcRows += '<span contenteditable="true" style="color:#6A4A20;">− ₹' + formatCurrency(advancePaid) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     // ← NEW: Add balance due row
  //     if (remainingAmount > 0) {
  //       calcRows += '<div class="calc-row balance removable" style="position:relative; border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">';
  //       calcRows += '<span contenteditable="true"></span>';
  //       calcRows += '<span contenteditable="true">₹' + formatCurrency(remainingAmount) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     // Read template file
  //     let templatePath;
  //     const possiblePaths = [
  //       path.join(__dirname, '../public/invoice-builder-template.html'),
  //       path.join(__dirname, '../../public/invoice-builder-template.html'),
  //       path.join(process.cwd(), 'public/invoice-builder-template.html'),
  //       path.join(__dirname, 'public/invoice-builder-template.html')
  //     ];

  //     for (const p of possiblePaths) {
  //       if (fs.existsSync(p)) {
  //         templatePath = p;
  //         break;
  //       }
  //     }

  //     if (!templatePath) {
  //       throw new Error('Template file not found. Please create public/invoice-builder-template.html');
  //     }

  //     let html = fs.readFileSync(templatePath, 'utf8');

  //     // Replace placeholders
  //     html = html.split('HOTEL_NAME_PLACEHOLDER').join(hotelName);
  //     html = html.split('HOTEL_TAG_PLACEHOLDER').join(hotelTag);
  //     html = html.split('HOTEL_ADDR_PLACEHOLDER').join(hotelAddr);
  //     html = html.split('HOTEL_GSTIN_PLACEHOLDER').join(hotelGstin);
  //     html = html.split('HOTEL_TEL_PLACEHOLDER').join(hotelTel);
  //     html = html.split('INV_NO_PLACEHOLDER').join(invNo);
  //     html = html.split('INV_DATE_PLACEHOLDER').join(invDate);
  //     html = html.split('INV_FOLIO_PLACEHOLDER').join(invFolio);
  //     html = html.split('GUEST_NAME_PLACEHOLDER').join(guestName);
  //     html = html.split('GUEST_DETAILS_PLACEHOLDER').join(guestDetails);
  //     html = html.split('STAY_DATES_PLACEHOLDER').join(stayDates);
  //     html = html.split('STAY_DETAILS_PLACEHOLDER').join(stayDetails);
  //     html = html.split('RES_ID_PLACEHOLDER').join(resId);
  //     html = html.split('RES_DETAILS_PLACEHOLDER').join(resDetails);
  //     html = html.split('ROOM_ROWS_PLACEHOLDER').join(roomRows);
  //     html = html.split('CALC_ROWS_PLACEHOLDER').join(calcRows);
  //     html = html.split('TOTAL_AMOUNT_PLACEHOLDER').join('₹' + formatCurrency(totalAmount));
  //     html = html.split('PAYMENT_STATUS_PLACEHOLDER').join(paymentStatusText);
  //     html = html.split('PAYMENT_INFO_PLACEHOLDER').join(paymentInfoText);

  //     // ← NEW: Also replace advance payment specific placeholders in the template (if any)
  //     html = html.split('ADVANCE_PAID_PLACEHOLDER').join(advancePaid > 0 ? formatCurrency(advancePaid) : '0');
  //     html = html.split('REMAINING_AMOUNT_PLACEHOLDER').join(remainingAmount > 0 ? formatCurrency(remainingAmount) : '0');
  //     html = html.split('SHOW_ADVANCE_SECTION').join(advancePaid > 0 ? 'block' : 'none');

  //     // Send the HTML
  //     res.setHeader('Content-Type', 'text/html');
  //     res.send(html);

  //   } catch (error) {
  //     console.error('❌ Serve invoice builder error:', error);
  //     res.status(500).send(`<html><body><h1>Error: ${error.message}</h1><button onclick="window.close()">Close</button></body></html>`);
  //   }
  // },

  // In bookingController.js - Add this new function


  serveInvoiceBuilder: async (req, res) => {
    try {
      const { id } = req.params;
      const token = req.query.token;

      if (!token) {
        return res.status(401).send('<html><body><h1>Authentication Error</h1><button onclick="window.close()">Close</button></body></html>');
      }

      const jwt = require('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (err) {
        return res.status(401).send('<html><body><h1>Invalid Token</h1><button onclick="window.close()">Close</button></body></html>');
      }

      const hotelId = decoded.hotel_id;

      // Get booking details
      const booking = await Booking.findById(id, hotelId);
      if (!booking) {
        return res.status(404).send('<html><body><h1>Booking Not Found</h1><button onclick="window.close()">Close</button></body></html>');
      }

      // Get customer details with safe defaults - FIXES SQL BIND ERROR
      let customerDetails = null;
      if (booking.customer_id) {
        const customer = await Customer.findById(booking.customer_id, hotelId);
        if (customer) {
          customerDetails = {
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            customer_gst_no: customer.customer_gst_no || '',
            other_expenses: customer.other_expenses || 0,
            expense_description: customer.expense_description || ''
          };
        }
      }

      const roomDetails = await Room.findById(booking.room_id, hotelId);

      // Get hotel details
      const [hotelRows] = await pool.execute(`
      SELECT h.*, u.phone as hotel_phone, u.email as hotel_email, u.name as admin_name
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
      WHERE h.id = ? LIMIT 1
    `, [hotelId]);

      const hotelDetails = hotelRows[0] || {};

      // Helper functions
      const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric'
          });
        } catch (e) { return dateStr; }
      };

      const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toLocaleString('en-IN');
      };

      const calculateNights = (fromDate, toDate) => {
        if (!fromDate || !toDate) return 1;
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
      };

      const nights = calculateNights(booking.from_date, booking.to_date);
      const roomAmount = parseFloat(booking.amount) || 0;
      const serviceAmount = parseFloat(booking.service) || 0;
      const cgstAmount = parseFloat(booking.cgst) || 0;
      const sgstAmount = parseFloat(booking.sgst) || 0;
      const igstAmount = parseFloat(booking.igst) || 0;
      const totalAmount = parseFloat(booking.total) || 0;
      const perNightRate = nights > 0 ? roomAmount / nights : roomAmount;

      // Get advance payment details
      const advancePaid = parseFloat(booking.advance_amount_paid) || 0;
      const remainingAmount = parseFloat(booking.remaining_amount) || (totalAmount - advancePaid);

      const discountPercentage = parseFloat(booking.discount_percentage) || 0;
      const discountAmount = parseFloat(booking.discount_amount) || 0;
      const originalAmount = parseFloat(booking.original_amount) || roomAmount;

      // Calculate tax percentages
      const taxableAmount = originalAmount + serviceAmount;
      let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;
      if (taxableAmount > 0) {
        if (cgstAmount > 0) cgstPercentage = (cgstAmount / taxableAmount) * 100;
        if (sgstAmount > 0) sgstPercentage = (sgstAmount / taxableAmount) * 100;
        if (igstAmount > 0) igstPercentage = (igstAmount / taxableAmount) * 100;
      }
      const taxType = igstAmount > 0 ? 'igst' : 'cgst_sgst';
      const otherExpenses = parseFloat(customerDetails?.other_expenses) || 0;
      const expenseDescription = (customerDetails?.expense_description || '').replace(/'/g, "\\'");

      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      // Build full address for customer
      const buildCustomerAddress = () => {
        let addressParts = [];
        if (customerDetails?.address) addressParts.push(escapeHtml(customerDetails.address));
        if (customerDetails?.city) addressParts.push(escapeHtml(customerDetails.city));
        if (customerDetails?.state) addressParts.push(escapeHtml(customerDetails.state));
        if (customerDetails?.pincode) addressParts.push(escapeHtml(customerDetails.pincode));
        return addressParts.join(', ');
      };

      const customerAddressFull = buildCustomerAddress();

      // Prepare data for template
      const hotelName = escapeHtml(hotelDetails.name || 'Hotel Management');
      const hotelTag = 'Luxury Collection';
      const hotelAddr = escapeHtml(hotelDetails.address || 'Address not specified');
      const hotelGstin = escapeHtml(hotelDetails.gst_number || 'N/A');
      const hotelTel = escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A');
      const invNo = escapeHtml(booking.invoice_number);
      const invDate = formatDateDisplay(new Date().toISOString());
      const invFolio = `Room ${roomDetails?.room_number || ''}`;

      // Guest details with address and GST
      const guestName = escapeHtml(customerDetails?.name || 'Walk-in Customer');
      let guestDetailsHtml = '';
      if (customerDetails?.email) {
        guestDetailsHtml += escapeHtml(customerDetails.email) + '<br>';
      }
      guestDetailsHtml += escapeHtml(customerDetails?.phone || 'N/A');
      if (customerAddressFull) {
        guestDetailsHtml += '<br>' + customerAddressFull;
      }
      if (customerDetails?.customer_gst_no) {
        guestDetailsHtml += '<br><strong>GST:</strong> ' + escapeHtml(customerDetails.customer_gst_no);
      }
      const guestDetails = guestDetailsHtml;

      const stayDates = `${formatDateDisplay(booking.from_date)} — ${formatDateDisplay(booking.to_date)}`;
      const stayDetails = `${nights} Nights · ${formatGuestsForDisplay(booking.guests)}<br>${roomDetails?.type || 'Standard'} Room`;
      const resId = `RES-${booking.id}`;
      const resDetails = escapeHtml(booking.special_requests ? 'Special Request: ' + booking.special_requests.substring(0, 50) : 'Direct Booking');
      const roomType = escapeHtml(roomDetails?.type || 'Deluxe King Room');
      const roomNote = escapeHtml(roomDetails?.amenities || 'Bed & Breakfast');

      // Enhanced payment status and info with advance payment details
      let paymentStatusText = `${booking.payment_status || 'Pending'} · ${booking.payment_method || 'Cash'}`;
      let paymentInfoText = `Payment Mode: ${(booking.payment_method || 'Cash').toUpperCase()}<br>${booking.transaction_id ? `Transaction Ref: ${booking.transaction_id}<br>` : ''}<br>Email: ${escapeHtml(hotelDetails.hotel_email || 'accounts@hotel.com')}<br>Tel: ${hotelTel}`;

      if (advancePaid > 0) {
        paymentStatusText += ` · Advance: ₹${formatCurrency(advancePaid)}`;
        paymentInfoText = `<strong>Advance Payment: ₹${formatCurrency(advancePaid)}</strong><br>Balance Due: ₹${formatCurrency(remainingAmount)}<br><br>${paymentInfoText}`;
      }

      // Build room rows HTML
      let roomRows = '';
      if (discountPercentage > 0) {
        roomRows += '<tr class="removable original-row" style="position:relative;">';
        roomRows += '<td><span contenteditable="true">' + roomType + ' (Original)</span><span class="note" contenteditable="true">' + roomNote + '</span></td>';
        roomRows += '<td contenteditable="true">' + nights + '</td>';
        roomRows += '<td contenteditable="true">₹' + formatCurrency(originalAmount / nights) + '</td>';
        roomRows += '<td contenteditable="true">₹' + formatCurrency(originalAmount) + '</td>';
        roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
        roomRows += '</tr>';

        roomRows += '<tr class="removable discount-row" style="position:relative;">';
        roomRows += '<td><span contenteditable="true">Discount (' + discountPercentage + '% OFF)</span><span class="note" contenteditable="true">Special offer applied</span></td>';
        roomRows += '<td contenteditable="true">—</td>';
        roomRows += '<td contenteditable="true">—</td>';
        roomRows += '<td contenteditable="true" style="color:#28a745;">-₹' + formatCurrency(discountAmount) + '</td>';
        roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
        roomRows += '</tr>';
      }

      roomRows += '<tr class="removable" style="position:relative;">';
      roomRows += '<td><span contenteditable="true">' + roomType + '</span><span class="note" contenteditable="true">' + roomNote + '</span></td>';
      roomRows += '<td contenteditable="true">' + nights + '</td>';
      roomRows += '<td contenteditable="true">₹' + formatCurrency(perNightRate) + '</td>';
      roomRows += '<td contenteditable="true">₹' + formatCurrency(roomAmount) + '</td>';
      roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
      roomRows += '</tr>';

      if (serviceAmount > 0) {
        roomRows += '<tr class="removable" style="position:relative;">';
        roomRows += '<td><span contenteditable="true">Service Charges</span><span class="note" contenteditable="true">Hotel service fee</span></td>';
        roomRows += '<td contenteditable="true">—</td>';
        roomRows += '<td contenteditable="true">—</td>';
        roomRows += '<td contenteditable="true">₹' + formatCurrency(serviceAmount) + '</td>';
        roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
        roomRows += '</tr>';
      }

      if (otherExpenses > 0) {
        roomRows += '<tr class="removable" style="position:relative;">';
        roomRows += '<td><span contenteditable="true">Other Expenses</span><span class="note" contenteditable="true">' + expenseDescription + '</span></td>';
        roomRows += '<td contenteditable="true">—</td>';
        roomRows += '<td contenteditable="true">—</td>';
        roomRows += '<td contenteditable="true">₹' + formatCurrency(otherExpenses) + '</td>';
        roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
        roomRows += '</tr>';
      }

      // Build calc rows HTML
      let calcRows = '';
      calcRows += '<div class="calc-row removable" style="position:relative;">';
      calcRows += '<span contenteditable="true">Subtotal</span><span contenteditable="true">₹' + formatCurrency(roomAmount + serviceAmount) + '</span>';
      calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
      calcRows += '</div>';

      if (discountPercentage > 0) {
        calcRows += '<div class="calc-row disc removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">Discount (' + discountPercentage + '%)</span><span contenteditable="true">− ₹' + formatCurrency(discountAmount) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      if (taxType === 'cgst_sgst' && cgstAmount > 0) {
        calcRows += '<div class="calc-row gst removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">CGST @ ' + cgstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(cgstAmount) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      if (taxType === 'cgst_sgst' && sgstAmount > 0) {
        calcRows += '<div class="calc-row gst removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">SGST @ ' + sgstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(sgstAmount) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      if (taxType === 'igst' && igstAmount > 0) {
        calcRows += '<div class="calc-row gst removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">IGST @ ' + igstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(igstAmount) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      if (advancePaid > 0) {
        calcRows += '<div class="calc-row advance removable" style="position:relative; border-top: 1px dashed #D9C890; margin-top: 4px; padding-top: 4px;">';
        calcRows += '<span contenteditable="true" style="color:#6A4A20;">Advance Payment Already Paid</span>';
        calcRows += '<span contenteditable="true" style="color:#6A4A20;">− ₹' + formatCurrency(advancePaid) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      if (remainingAmount > 0) {
        calcRows += '<div class="calc-row balance removable" style="position:relative; border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">';
        calcRows += '<span contenteditable="true"></span>';
        calcRows += '<span contenteditable="true">₹' + formatCurrency(remainingAmount) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      // Read template file
      let templatePath;
      const possiblePaths = [
        path.join(__dirname, '../public/invoice-builder-template.html'),
        path.join(__dirname, '../../public/invoice-builder-template.html'),
        path.join(process.cwd(), 'public/invoice-builder-template.html'),
        path.join(__dirname, 'public/invoice-builder-template.html')
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      if (!templatePath) {
        throw new Error('Template file not found. Please create public/invoice-builder-template.html');
      }

      let html = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      html = html.split('HOTEL_NAME_PLACEHOLDER').join(hotelName);
      html = html.split('HOTEL_TAG_PLACEHOLDER').join(hotelTag);
      html = html.split('HOTEL_ADDR_PLACEHOLDER').join(hotelAddr);
      html = html.split('HOTEL_GSTIN_PLACEHOLDER').join(hotelGstin);
      html = html.split('HOTEL_TEL_PLACEHOLDER').join(hotelTel);
      html = html.split('INV_NO_PLACEHOLDER').join(invNo);
      html = html.split('INV_DATE_PLACEHOLDER').join(invDate);
      html = html.split('INV_FOLIO_PLACEHOLDER').join(invFolio);
      html = html.split('GUEST_NAME_PLACEHOLDER').join(guestName);
      html = html.split('GUEST_DETAILS_PLACEHOLDER').join(guestDetails);
      html = html.split('STAY_DATES_PLACEHOLDER').join(stayDates);
      html = html.split('STAY_DETAILS_PLACEHOLDER').join(stayDetails);
      html = html.split('RES_ID_PLACEHOLDER').join(resId);
      html = html.split('RES_DETAILS_PLACEHOLDER').join(resDetails);
      html = html.split('ROOM_ROWS_PLACEHOLDER').join(roomRows);
      html = html.split('CALC_ROWS_PLACEHOLDER').join(calcRows);
      html = html.split('TOTAL_AMOUNT_PLACEHOLDER').join('₹' + formatCurrency(totalAmount));
      html = html.split('PAYMENT_STATUS_PLACEHOLDER').join(paymentStatusText);
      html = html.split('PAYMENT_INFO_PLACEHOLDER').join(paymentInfoText);
      html = html.split('ADVANCE_PAID_PLACEHOLDER').join(advancePaid > 0 ? formatCurrency(advancePaid) : '0');
      html = html.split('REMAINING_AMOUNT_PLACEHOLDER').join(remainingAmount > 0 ? formatCurrency(remainingAmount) : '0');
      html = html.split('SHOW_ADVANCE_SECTION').join(advancePaid > 0 ? 'block' : 'none');

      // Send the HTML
      res.setHeader('Content-Type', 'text/html');
      res.send(html);

    } catch (error) {
      console.error('❌ Serve invoice builder error:', error);
      res.status(500).send(`<html><body><h1>Error: ${error.message}</h1><button onclick="window.close()">Close</button></body></html>`);
    }
  },
  // serveGroupInvoiceBuilder: async (req, res) => {
  //   try {
  //     const { groupId } = req.params;
  //     const token = req.query.token;

  //     if (!token) {
  //       return res.status(401).send('<html><body><h1>Authentication Error</h1><button onclick="window.close()">Close</button></body></html>');
  //     }

  //     const jwt = require('jsonwebtoken');
  //     let decoded;
  //     try {
  //       decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  //     } catch (err) {
  //       return res.status(401).send('<html><body><h1>Invalid Token</h1><button onclick="window.close()">Close</button></body></html>');
  //     }

  //     const hotelId = decoded.hotel_id;

  //     // Get all bookings in the group
  //     const groupBookings = await Booking.findByGroupId(groupId, hotelId);

  //     if (!groupBookings || groupBookings.length === 0) {
  //       return res.status(404).send('<html><body><h1>Group Not Found</h1><button onclick="window.close()">Close</button></body></html>');
  //     }

  //     // Get first booking for group details
  //     const firstBooking = groupBookings[0];
  //     const customerDetails = await Customer.findById(firstBooking.customer_id, hotelId);

  //     // Get hotel details
  //     const [hotelRows] = await pool.execute(`
  //           SELECT h.*, u.phone as hotel_phone, u.email as hotel_email, u.name as admin_name
  //           FROM hotels h
  //           LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
  //           WHERE h.id = ? LIMIT 1
  //       `, [hotelId]);

  //     const hotelDetails = hotelRows[0] || {};

  //     // Helper functions
  //     const formatDateDisplay = (dateStr) => {
  //       if (!dateStr) return '';
  //       try {
  //         const date = new Date(dateStr);
  //         return date.toLocaleDateString('en-IN', {
  //           day: '2-digit', month: 'long', year: 'numeric'
  //         });
  //       } catch (e) { return dateStr; }
  //     };

  //     const formatCurrency = (value) => {
  //       const num = parseFloat(value);
  //       return isNaN(num) ? '0' : num.toLocaleString('en-IN');
  //     };

  //     const calculateNights = (fromDate, toDate) => {
  //       if (!fromDate || !toDate) return 1;
  //       const from = new Date(fromDate);
  //       const to = new Date(toDate);
  //       const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  //       return diff > 0 ? diff : 1;
  //     };

  //     const nights = calculateNights(firstBooking.from_date, firstBooking.to_date);

  //     // Calculate group totals
  //     let totalAmount = 0;
  //     let totalAdvancePaid = 0;
  //     let totalRemaining = 0;

  //     groupBookings.forEach(booking => {
  //       totalAmount += parseFloat(booking.total) || 0;
  //       totalAdvancePaid += parseFloat(booking.advance_amount_paid) || 0;
  //     });
  //     totalRemaining = totalAmount - totalAdvancePaid;

  //     const escapeHtml = (str) => {
  //       if (!str) return '';
  //       return String(str)
  //         .replace(/&/g, '&amp;')
  //         .replace(/</g, '&lt;')
  //         .replace(/>/g, '&gt;')
  //         .replace(/"/g, '&quot;')
  //         .replace(/'/g, '&#39;');
  //     };

  //     // Build room rows HTML for group
  //     let roomRows = '';
  //     groupBookings.forEach((booking, index) => {
  //       const roomAmount = parseFloat(booking.amount) || 0;
  //       const roomNumber = booking.room_number || 'N/A';
  //       const roomType = 'Standard';
  //       const nightsCount = calculateNights(booking.from_date, booking.to_date);
  //       const perNightRate = nightsCount > 0 ? roomAmount / nightsCount : roomAmount;

  //       roomRows += '<tr class="removable" style="position:relative;">';
  //       roomRows += '<td><span contenteditable="true">Room ' + roomNumber + ' (' + roomType + ')</span><span class="note" contenteditable="true">Nightly rate</span></td>';
  //       roomRows += '<td contenteditable="true">' + nightsCount + '</td>';
  //       roomRows += '<td contenteditable="true">₹' + formatCurrency(perNightRate) + '</td>';
  //       roomRows += '<td contenteditable="true">₹' + formatCurrency(roomAmount) + '</td>';
  //       roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
  //       roomRows += '</tr>';
  //     });

  //     // Build calc rows HTML with advance payment for group
  //     let calcRows = '';
  //     calcRows += '<div class="calc-row removable" style="position:relative;">';
  //     calcRows += '<span contenteditable="true">Subtotal (All Rooms)</span><span contenteditable="true">₹' + formatCurrency(totalAmount) + '</span>';
  //     calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //     calcRows += '</div>';

  //     if (totalAdvancePaid > 0) {
  //       calcRows += '<div class="calc-row advance removable" style="position:relative; border-top: 1px dashed #D9C890; margin-top: 4px; padding-top: 4px;">';
  //       calcRows += '<span contenteditable="true" style="color:#6A4A20;">Total Advance Payment Already Paid</span>';
  //       calcRows += '<span contenteditable="true" style="color:#6A4A20;">− ₹' + formatCurrency(totalAdvancePaid) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     if (totalRemaining > 0) {
  //       calcRows += '<div class="calc-row balance removable" style="position:relative; border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">';
  //       calcRows += '<span contenteditable="true">Total </span>';
  //       calcRows += '<span contenteditable="true">₹' + formatCurrency(totalRemaining) + '</span>';
  //       calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
  //       calcRows += '</div>';
  //     }

  //     // Prepare data for template
  //     const hotelName = escapeHtml(hotelDetails.name || 'Hotel Management');
  //     const hotelTag = 'Luxury Collection';
  //     const hotelAddr = escapeHtml(hotelDetails.address || 'Address not specified');
  //     const hotelGstin = escapeHtml(hotelDetails.gst_number || 'N/A');
  //     const hotelTel = escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A');
  //     const invNo = `GRP-INV-${groupId.slice(-8)}`;
  //     const invDate = formatDateDisplay(new Date().toISOString());
  //     const invFolio = `${groupBookings.length} Rooms`;
  //     const guestName = escapeHtml(customerDetails?.name || 'Group Booking');
  //     const guestDetails = `${escapeHtml(customerDetails?.email || '')}<br>${escapeHtml(customerDetails?.phone || 'N/A')}`;
  //     const stayDates = `${formatDateDisplay(firstBooking.from_date)} — ${formatDateDisplay(firstBooking.to_date)}`;
  //     const stayDetails = `${nights} Nights · ${groupBookings.length} Rooms<br>Group Booking`;
  //     const resId = `GRP-${groupId.slice(-6)}`;
  //     const resDetails = `Group booking with ${groupBookings.length} rooms`;
  //     const paymentStatus = `${totalRemaining <= 0 ? 'Paid' : 'Partial'} · Total: ₹${formatCurrency(totalAmount)} · Advance: ₹${formatCurrency(totalAdvancePaid)}`;
  //     const paymentInfo = `Payment Mode: Cash/Online<br>Total Amount: ₹${formatCurrency(totalAmount)}<br>Advance Paid: ₹${formatCurrency(totalAdvancePaid)}<br>Balance Due: ₹${formatCurrency(totalRemaining)}<br><br>Email: ${escapeHtml(hotelDetails.hotel_email || 'accounts@hotel.com')}<br>Tel: ${hotelTel}`;

  //     // Read template file
  //     let templatePath;
  //     const possiblePaths = [
  //       path.join(__dirname, '../public/invoice-builder-template.html'),
  //       path.join(__dirname, '../../public/invoice-builder-template.html'),
  //       path.join(process.cwd(), 'public/invoice-builder-template.html'),
  //       path.join(__dirname, 'public/invoice-builder-template.html')
  //     ];

  //     for (const p of possiblePaths) {
  //       if (fs.existsSync(p)) {
  //         templatePath = p;
  //         break;
  //       }
  //     }

  //     if (!templatePath) {
  //       throw new Error('Template file not found');
  //     }

  //     let html = fs.readFileSync(templatePath, 'utf8');

  //     // Replace placeholders
  //     html = html.split('HOTEL_NAME_PLACEHOLDER').join(hotelName);
  //     html = html.split('HOTEL_TAG_PLACEHOLDER').join(hotelTag);
  //     html = html.split('HOTEL_ADDR_PLACEHOLDER').join(hotelAddr);
  //     html = html.split('HOTEL_GSTIN_PLACEHOLDER').join(hotelGstin);
  //     html = html.split('HOTEL_TEL_PLACEHOLDER').join(hotelTel);
  //     html = html.split('INV_NO_PLACEHOLDER').join(invNo);
  //     html = html.split('INV_DATE_PLACEHOLDER').join(invDate);
  //     html = html.split('INV_FOLIO_PLACEHOLDER').join(invFolio);
  //     html = html.split('GUEST_NAME_PLACEHOLDER').join(guestName);
  //     html = html.split('GUEST_DETAILS_PLACEHOLDER').join(guestDetails);
  //     html = html.split('STAY_DATES_PLACEHOLDER').join(stayDates);
  //     html = html.split('STAY_DETAILS_PLACEHOLDER').join(stayDetails);
  //     html = html.split('RES_ID_PLACEHOLDER').join(resId);
  //     html = html.split('RES_DETAILS_PLACEHOLDER').join(resDetails);
  //     html = html.split('ROOM_ROWS_PLACEHOLDER').join(roomRows);
  //     html = html.split('CALC_ROWS_PLACEHOLDER').join(calcRows);
  //     html = html.split('TOTAL_AMOUNT_PLACEHOLDER').join('₹' + formatCurrency(totalAmount));
  //     html = html.split('PAYMENT_STATUS_PLACEHOLDER').join(paymentStatus);
  //     html = html.split('PAYMENT_INFO_PLACEHOLDER').join(paymentInfo);

  //     res.setHeader('Content-Type', 'text/html');
  //     res.send(html);

  //   } catch (error) {
  //     console.error('❌ Serve group invoice builder error:', error);
  //     res.status(500).send(`<html><body><h1>Error: ${error.message}</h1><button onclick="window.close()">Close</button></body></html>`);
  //   }
  // },
  serveGroupInvoiceBuilder: async (req, res) => {
    try {
      const { groupId } = req.params;
      const token = req.query.token;

      if (!token) {
        return res.status(401).send('<html><body><h1>Authentication Error</h1><button onclick="window.close()">Close</button></body></html>');
      }

      const jwt = require('jsonwebtoken');
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (err) {
        return res.status(401).send('<html><body><h1>Invalid Token</h1><button onclick="window.close()">Close</button></body></html>');
      }

      const hotelId = decoded.hotel_id;

      // Get all bookings in the group
      const groupBookings = await Booking.findByGroupId(groupId, hotelId);

      if (!groupBookings || groupBookings.length === 0) {
        return res.status(404).send('<html><body><h1>Group Not Found</h1><button onclick="window.close()">Close</button></body></html>');
      }

      // Get first booking for group details
      const firstBooking = groupBookings[0];
      let customerDetails = null;

      // Get customer details with address and GST
      if (firstBooking.customer_id) {
        const customer = await Customer.findById(firstBooking.customer_id, hotelId);
        if (customer) {
          customerDetails = {
            name: customer.name || 'Group Booking',
            phone: customer.phone || 'N/A',
            email: customer.email || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            customer_gst_no: customer.customer_gst_no || '',
            id_type: customer.id_type || 'aadhaar',
            id_number: customer.id_number || ''
          };
        }
      }

      // Get hotel details
      const [hotelRows] = await pool.execute(`
      SELECT h.*, u.phone as hotel_phone, u.email as hotel_email, u.name as admin_name
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
      WHERE h.id = ? LIMIT 1
    `, [hotelId]);

      const hotelDetails = hotelRows[0] || {};

      // Helper functions
      const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric'
          });
        } catch (e) { return dateStr; }
      };

      const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toLocaleString('en-IN');
      };

      const calculateNights = (fromDate, toDate) => {
        if (!fromDate || !toDate) return 1;
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
      };

      const nights = calculateNights(firstBooking.from_date, firstBooking.to_date);

      // Calculate group totals with discount information
      let totalOriginalAmount = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalIGST = 0;
      let totalServiceCharge = 0;
      let totalAmount = 0;
      let totalDiscountAmount = 0;
      let totalAdvancePaid = 0;
      let totalRemaining = 0;

      groupBookings.forEach(booking => {
        const bookingAmount = parseFloat(booking.amount) || 0;
        const originalAmount = parseFloat(booking.original_amount) || bookingAmount;
        const discountAmount = parseFloat(booking.discount_amount) || 0;

        totalOriginalAmount += originalAmount;
        totalAmount += bookingAmount;
        totalDiscountAmount += discountAmount;
        totalAdvancePaid += parseFloat(booking.advance_amount_paid) || 0;
        totalCGST += parseFloat(booking.cgst) || 0;
        totalSGST += parseFloat(booking.sgst) || 0;
        totalIGST += parseFloat(booking.igst) || 0;
        totalServiceCharge += parseFloat(booking.service) || 0;
      });
      // Final amount due = discounted room + service + all taxes
      const totalWithTax = totalAmount + totalServiceCharge + totalCGST + totalSGST + totalIGST;
      totalRemaining = totalWithTax - totalAdvancePaid;

      const discountPercentage = totalOriginalAmount > 0
        ? ((totalDiscountAmount / totalOriginalAmount) * 100).toFixed(2)
        : 0;

      // Determine tax type
      const cgstPercentage = totalOriginalAmount > 0 ? (totalCGST / totalOriginalAmount) * 100 : 0;
      const sgstPercentage = totalOriginalAmount > 0 ? (totalSGST / totalOriginalAmount) * 100 : 0;
      const igstPercentage = totalOriginalAmount > 0 ? (totalIGST / totalOriginalAmount) * 100 : 0;
      const taxType = totalIGST > 0 ? 'igst' : 'cgst_sgst';

      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      // Build full address for customer
      const buildCustomerAddress = () => {
        let addressParts = [];
        if (customerDetails?.address) addressParts.push(escapeHtml(customerDetails.address));
        if (customerDetails?.city) addressParts.push(escapeHtml(customerDetails.city));
        if (customerDetails?.state) addressParts.push(escapeHtml(customerDetails.state));
        if (customerDetails?.pincode) addressParts.push(escapeHtml(customerDetails.pincode));
        return addressParts.join(', ');
      };

      const customerAddressFull = buildCustomerAddress();

      // Build room rows HTML - SIMPLIFIED VERSION (no discount rows, just show discounted price)
      let roomRows = '';
      groupBookings.forEach((booking, index) => {
        const roomAmount = parseFloat(booking.amount) || 0;
        const originalAmount = parseFloat(booking.original_amount) || roomAmount;
        const discountAmount = parseFloat(booking.discount_amount) || 0;
        const discountPercent = parseFloat(booking.discount_percentage) || 0;
        const roomNumber = booking.room_number || 'N/A';
        const roomType = booking.room_type || 'Standard';
        const nightsCount = calculateNights(booking.from_date, booking.to_date);
        const perNightRate = nightsCount > 0 ? roomAmount / nightsCount : roomAmount;

        // Single row for each room - show discounted price only
        roomRows += '<tr class="removable" style="position:relative;">';
        roomRows += '<td><span contenteditable="true">Room ' + roomNumber + ' (' + roomType + ')</span>';

        // Show discount info as small text if applicable
        if (discountAmount > 0) {
          roomRows += '<span class="note" contenteditable="true">(' + discountPercent + '% off - Saved ₹' + formatCurrency(discountAmount) + ')</span>';
        } else {
          roomRows += '<span class="note" contenteditable="true">Nightly rate</span>';
        }
        roomRows += '</td>';
        roomRows += '<td contenteditable="true">' + nightsCount + '</td>';
        roomRows += '<td contenteditable="true">₹' + formatCurrency(perNightRate) + '</td>';
        roomRows += '<td contenteditable="true">₹' + formatCurrency(roomAmount) + '</td>';
        roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
        roomRows += '</tr>';

        // Add service charge if present
        const serviceAmount = parseFloat(booking.service) || 0;
        if (serviceAmount > 0) {
          roomRows += '<tr class="removable" style="position:relative;">';
          roomRows += '<td><span contenteditable="true">Service Charges</span><span class="note" contenteditable="true">Hotel service fee</span></td>';
          roomRows += '<td contenteditable="true">—</td>';
          roomRows += '<td contenteditable="true">—</td>';
          roomRows += '<td contenteditable="true">₹' + formatCurrency(serviceAmount) + '</td>';
          roomRows += '<button class="remove-btn" onclick="this.closest(\'tr\').remove()">×</button>';
          roomRows += '</tr>';
        }
      });

      // Build calc rows HTML - SIMPLIFIED VERSION
      let calcRows = '';

      // Just show subtotal and discount as separate line items
      calcRows += '<div class="calc-row removable" style="position:relative;">';
      calcRows += '<span contenteditable="true">Subtotal</span><span contenteditable="true">₹' + formatCurrency(totalOriginalAmount) + '</span>';
      calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
      calcRows += '</div>';

      if (totalDiscountAmount > 0) {
        calcRows += '<div class="calc-row disc removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">Total Discount (' + discountPercentage + '%)</span><span contenteditable="true">- ₹' + formatCurrency(totalDiscountAmount) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      // Show total after discount
      calcRows += '<div class="calc-row removable" style="position:relative; border-top: 1px solid #e0e0e0; margin-top: 5px; padding-top: 5px;">';
      calcRows += '<span contenteditable="true" style="font-weight:500;">Total after discount</span><span contenteditable="true" style="font-weight:500;">₹' + formatCurrency(totalAmount) + '</span>';
      calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
      calcRows += '</div>';

      // Add taxes if any
      if (taxType === 'cgst_sgst') {
        if (totalCGST > 0) {
          calcRows += '<div class="calc-row gst removable" style="position:relative;">';
          calcRows += '<span contenteditable="true">CGST @ ' + cgstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(totalCGST) + '</span>';
          calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
          calcRows += '</div>';
        }
        if (totalSGST > 0) {
          calcRows += '<div class="calc-row gst removable" style="position:relative;">';
          calcRows += '<span contenteditable="true">SGST @ ' + sgstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(totalSGST) + '</span>';
          calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
          calcRows += '</div>';
        }
      } else if (taxType === 'igst' && totalIGST > 0) {
        calcRows += '<div class="calc-row gst removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">IGST @ ' + igstPercentage.toFixed(2) + '%</span><span contenteditable="true">₹' + formatCurrency(totalIGST) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      // Add service charges if any
      if (totalServiceCharge > 0 && totalServiceCharge !== totalAmount) {
        calcRows += '<div class="calc-row removable" style="position:relative;">';
        calcRows += '<span contenteditable="true">Service Charges</span><span contenteditable="true">₹' + formatCurrency(totalServiceCharge) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      if (totalAdvancePaid > 0) {
        calcRows += '<div class="calc-row advance removable" style="position:relative; border-top: 1px dashed #D9C890; margin-top: 4px; padding-top: 4px;">';
        calcRows += '<span contenteditable="true" style="color:#6A4A20;">Advance Payment</span>';
        calcRows += '<span contenteditable="true" style="color:#6A4A20;">- ₹' + formatCurrency(totalAdvancePaid) + '</span>';
        calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
        calcRows += '</div>';
      }

      // Final amount due (includes taxes)
      calcRows += '<div class="calc-row balance removable" style="position:relative; border-top: 2px solid #D9C890; margin-top: 8px; padding-top: 8px; font-weight: bold;">';
      calcRows += '<span contenteditable="true">TOTAL AMOUNT </span>';
      calcRows += '<span contenteditable="true">₹' + formatCurrency(totalRemaining > 0 ? totalRemaining : totalWithTax) + '</span>';
      calcRows += '<button class="remove-btn" style="right:-20px;" onclick="this.parentElement.remove()">×</button>';
      calcRows += '</div>';

      // Prepare guest details with address and GST
      let guestDetailsHtml = '';
      if (customerDetails?.email) {
        guestDetailsHtml += escapeHtml(customerDetails.email) + '<br>';
      }
      guestDetailsHtml += escapeHtml(customerDetails?.phone || 'N/A');
      if (customerAddressFull) {
        guestDetailsHtml += '<br>' + customerAddressFull;
      }
      if (customerDetails?.customer_gst_no) {
        guestDetailsHtml += '<br>GSTIN: ' + escapeHtml(customerDetails.customer_gst_no);
      }
      if (customerDetails?.id_number) {
        guestDetailsHtml += '<br>' + (customerDetails.id_type || 'ID').toUpperCase() + ': ' + escapeHtml(customerDetails.id_number);
      }

      // Prepare data for template
      const hotelName = escapeHtml(hotelDetails.name || 'Hotel Management');
      const hotelTag = 'LUXURY COLLECTION';
      const hotelAddr = escapeHtml(hotelDetails.address || 'Address not specified');
      const hotelGstin = escapeHtml(hotelDetails.gst_number || 'N/A');
      const hotelTel = escapeHtml(hotelDetails.hotel_phone || hotelDetails.phone || 'N/A');
      const hotelEmail = escapeHtml(hotelDetails.hotel_email || hotelDetails.email || 'accounts@hotel.com');
      const invNo = `GRP-INV-${groupId.slice(-8)}`;
      const invDate = formatDateDisplay(new Date().toISOString());
      const invFolio = `${groupBookings.length} Rooms`;
      const guestName = escapeHtml(customerDetails?.name || 'Group Booking');
      const stayDates = `${formatDateDisplay(firstBooking.from_date)} — ${formatDateDisplay(firstBooking.to_date)}`;
      const stayDetails = `${nights} Nights · ${groupBookings.length} Rooms<br>Group booking with ${groupBookings.length} rooms`;
      const resId = `GRP-${groupId.slice(-6)}`;
      const resDetails = `Group booking with ${groupBookings.length} rooms`;

      // Simplified payment status - just show the amount (includes taxes)
      const totalDue = totalRemaining > 0 ? totalRemaining : totalWithTax;

      // Payment info - simplified
      let paymentInfoHtml = `Payment Mode: Cash/Online<br>`;
      if (totalDiscountAmount > 0) {
        paymentInfoHtml += `Total Discount: ₹${formatCurrency(totalDiscountAmount)} (${discountPercentage}%)<br>`;
      }
      paymentInfoHtml += `Total Amount: ₹${formatCurrency(totalWithTax)}<br>`;
      if (totalAdvancePaid > 0) {
        paymentInfoHtml += `Advance Paid: ₹${formatCurrency(totalAdvancePaid)}<br>`;
      }
      // paymentInfoHtml += `<strong>Balance Due: ₹${formatCurrency(totalDue)}</strong><br><br>`;
      paymentInfoHtml += `Email: ${hotelEmail}<br>`;
      paymentInfoHtml += `Tel: ${hotelTel}`;

      // Read template file
      let templatePath;
      const possiblePaths = [
        path.join(__dirname, '../public/invoice-builder-template.html'),
        path.join(__dirname, '../../public/invoice-builder-template.html'),
        path.join(process.cwd(), 'public/invoice-builder-template.html'),
        path.join(__dirname, 'public/invoice-builder-template.html')
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      if (!templatePath) {
        throw new Error('Template file not found');
      }

      let html = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      html = html.split('HOTEL_NAME_PLACEHOLDER').join(hotelName);
      html = html.split('HOTEL_TAG_PLACEHOLDER').join(hotelTag);
      html = html.split('HOTEL_ADDR_PLACEHOLDER').join(hotelAddr);
      html = html.split('HOTEL_GSTIN_PLACEHOLDER').join(hotelGstin);
      html = html.split('HOTEL_TEL_PLACEHOLDER').join(hotelTel);
      html = html.split('HOTEL_EMAIL_PLACEHOLDER').join(hotelEmail);
      html = html.split('INV_NO_PLACEHOLDER').join(invNo);
      html = html.split('INV_DATE_PLACEHOLDER').join(invDate);
      html = html.split('INV_FOLIO_PLACEHOLDER').join(invFolio);
      html = html.split('GUEST_NAME_PLACEHOLDER').join(guestName);
      html = html.split('GUEST_DETAILS_PLACEHOLDER').join(guestDetailsHtml);
      html = html.split('STAY_DATES_PLACEHOLDER').join(stayDates);
      html = html.split('STAY_DETAILS_PLACEHOLDER').join(stayDetails);
      html = html.split('RES_ID_PLACEHOLDER').join(resId);
      html = html.split('RES_DETAILS_PLACEHOLDER').join(resDetails);
      html = html.split('ROOM_ROWS_PLACEHOLDER').join(roomRows);
      html = html.split('CALC_ROWS_PLACEHOLDER').join(calcRows);
      html = html.split('TOTAL_AMOUNT_PLACEHOLDER').join('₹' + formatCurrency(totalDue));
      html = html.split('PAYMENT_STATUS_PLACEHOLDER').join(''); // Empty - no status text
      html = html.split('PAYMENT_INFO_PLACEHOLDER').join(paymentInfoHtml);

      // Additional placeholders
      html = html.split('DISCOUNT_PERCENTAGE_PLACEHOLDER').join(discountPercentage);
      html = html.split('DISCOUNT_AMOUNT_PLACEHOLDER').join(formatCurrency(totalDiscountAmount));
      html = html.split('SHOW_DISCOUNT_SECTION').join(totalDiscountAmount > 0 ? 'block' : 'none');
      html = html.split('TOTAL_DISPLAY_AMOUNT_PLACEHOLDER').join('₹' + formatCurrency(totalDue));

      res.setHeader('Content-Type', 'text/html');
      res.send(html);

    } catch (error) {
      console.error('❌ Serve group invoice builder error:', error);
      res.status(500).send(`<html><body><h1>Error: ${error.message}</h1><button onclick="window.close()">Close</button></body></html>`);
    }
  },

};

module.exports = bookingController;


