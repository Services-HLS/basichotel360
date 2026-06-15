const AdvanceBooking = require('../models/AdvanceBooking');
const Customer = require('../models/Customer');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Collection = require('../models/Collection');
const { pool } = require('../config/database');
const InvoiceService = require('../services/Adv-invoiceService');

const EmailService = require('../services/emailService'); // 👈 ADD THIS
const WhatsAppService = require('../services/whatsappService'); // 👈 ADD THIS
const { isBasicHotelPlan } = require('../utils/planUtils');

// Import fs and path for logo handling
const fs = require('fs'); // 👈 ADD THIS
const path = require('path'); // 👈 ADD THIS
const PDFService = require('../services/pdfService');

// At the top of advanceBookingController.js, add this function
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

const getHotelDetails = async (hotelId) => {
    const [hotelRows] = await pool.execute(
        `SELECT h.id, h.name, h.address, h.gst_number, h.logo_image,
                u.phone as phone, u.email as email
         FROM hotels h
         LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
         WHERE h.id = ?`,
        [hotelId]
    );

    return {
        name: hotelRows[0]?.name || 'Hotel',
        address: hotelRows[0]?.address || '',
        phone: hotelRows[0]?.phone || '',
        email: hotelRows[0]?.email || '',
        gstin: hotelRows[0]?.gst_number || '',
        logo: hotelRows[0]?.logo_image || ''
    };
};

const advanceBookingController = {
    // Create advance booking
    // createAdvanceBooking: async (req, res) => {
    //     try {
    //         const {
    //             customer_id,
    //             room_id,
    //             from_date,
    //             to_date,
    //             from_time = '14:00',
    //             to_time = '12:00',
    //             guests = 1,
    //             amount = 0,
    //             advance_amount = 0,
    //             service = 0,
    //             cgst = 0,
    //             sgst = 0,
    //             igst = 0,
    //             total = 0,
    //             payment_method = 'cash',
    //             payment_status = 'pending',
    //             transaction_id = null,
    //             status = 'pending',
    //             expiry_days = 30,
    //             special_requests = '',
    //             id_type = 'aadhaar',
    //             id_number = '',
    //             id_image = null,
    //             id_image2 = null,
    //             referral_by = '',
    //             referral_amount = 0,
    //             // Customer details for new customer
    //             customer_name,
    //             customer_phone,
    //             customer_email,
    //             customer_id_number,
    //             address,
    //             city,
    //             state,
    //             pincode,
    //             customer_gst_no,
    //             purpose_of_visit,
    //             other_expenses = 0,
    //             expense_description = '',
    //             notes = ''
    //         } = req.body;

    //         const hotelId = req.user.hotel_id;
    //         let finalCustomerId = customer_id;
    //         let isNewCustomer = false;

    //         console.log('📝 Create advance booking request:', {
    //             hotelId,
    //             room_id,
    //             from_date,
    //             to_date,
    //             customer_name,
    //             customer_phone,
    //             advance_amount,
    //             total
    //         });

    //         // ===========================================
    //         // 1. VALIDATE ROOM (if specified)
    //         // ===========================================
    //         if (room_id) {
    //             const room = await Room.findById(room_id, hotelId);
    //             if (!room) {
    //                 return res.status(404).json({
    //                     success: false,
    //                     error: 'ROOM_NOT_FOUND',
    //                     message: 'Room not found'
    //                 });
    //             }

    //             // Check availability for future dates
    //             const isAvailable = await Booking.checkRoomAvailability(
    //                 room_id,
    //                 hotelId,
    //                 from_date,
    //                 to_date,
    //                 null,
    //                 'booked'
    //             );

    //             if (!isAvailable) {
    //                 return res.status(400).json({
    //                     success: false,
    //                     error: 'ROOM_NOT_AVAILABLE',
    //                     message: 'Room is not available for the selected dates'
    //                 });
    //             }
    //         }

    //         // ===========================================
    //         // 2. CUSTOMER HANDLING
    //         // ===========================================
    //         if (customer_name && customer_phone) {
    //             const existingCustomer = await Customer.findByPhone(customer_phone, hotelId);

    //             if (existingCustomer) {
    //                 finalCustomerId = existingCustomer.id;
    //                 console.log('✅ Found existing customer:', finalCustomerId);
    //             } else {
    //                 finalCustomerId = await Customer.create({
    //                     hotel_id: hotelId,
    //                     name: customer_name,
    //                     phone: customer_phone,
    //                     email: customer_email || '',
    //                     id_number: customer_id_number || '',
    //                     id_type: id_type || 'aadhaar',
    //                     id_image: id_image || null,
    //                     id_image2: id_image2 || null,
    //                     address: address || '',
    //                     city: city || '',
    //                     state: state || '',
    //                     pincode: pincode || '',
    //                     customer_gst_no: customer_gst_no || '',
    //                     purpose_of_visit: purpose_of_visit || null,
    //                     other_expenses: other_expenses || 0,
    //                     expense_description: expense_description || null
    //                 });
    //                 isNewCustomer = true;
    //                 console.log('✅ Created new customer:', finalCustomerId);
    //             }
    //         }

    //         // Calculate remaining amount
    //         const remaining_amount = (parseFloat(total) || 0) - (parseFloat(advance_amount) || 0);

    //         // Create advance booking
    //         const advanceBookingId = await AdvanceBooking.create({
    //             hotel_id: hotelId,
    //             customer_id: finalCustomerId,
    //             room_id,
    //             from_date,
    //             to_date,
    //             from_time,
    //             to_time,
    //             guests,
    //             amount: parseFloat(amount),
    //             advance_amount: parseFloat(advance_amount),
    //             remaining_amount,
    //             service: parseFloat(service),
    //             cgst: parseFloat(cgst),
    //             sgst: parseFloat(sgst),
    //             igst: parseFloat(igst),
    //             total: parseFloat(total),
    //             payment_method,
    //             payment_status: remaining_amount <= 0 ? 'completed' : 'partial',
    //             transaction_id,
    //             status,
    //             expiry_days,
    //             special_requests,
    //             id_type,
    //             id_number,
    //             id_image,
    //             id_image2,
    //             referral_by,
    //             referral_amount: parseFloat(referral_amount),
    //             address,
    //             city,
    //             state,
    //             pincode,
    //             customer_gst_no,
    //             purpose_of_visit,
    //             other_expenses: parseFloat(other_expenses),
    //             expense_description,
    //             created_by: req.user.userId,
    //             notes
    //         });

    //         // Create transaction record if advance payment made
    //         if (advance_amount > 0 && payment_method !== 'cash') {
    //             const txnId = transaction_id || `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    //             await Transaction.create({
    //                 hotel_id: hotelId,
    //                 booking_id: null,
    //                 advance_booking_id: advanceBookingId,
    //                 customer_id: finalCustomerId,
    //                 transaction_id: txnId,
    //                 amount: advance_amount,
    //                 currency: 'INR',
    //                 payment_method,
    //                 payment_gateway: 'upi',
    //                 status: 'success',
    //                 status_message: 'Advance payment received',
    //                 metadata: {
    //                     type: 'advance_booking',
    //                     booking_id: advanceBookingId,
    //                     from_date,
    //                     to_date,
    //                     room_id
    //                 }
    //             });

    //             if (!transaction_id) {
    //                 await AdvanceBooking.update(advanceBookingId, hotelId, {
    //                     transaction_id: txnId
    //                 });
    //             }
    //         }

    //         // If payment is completed and advance amount >= total, auto-confirm
    //         if (remaining_amount <= 0) {
    //             await AdvanceBooking.update(advanceBookingId, hotelId, {
    //                 status: 'confirmed'
    //             });
    //         }

    //         res.status(201).json({
    //             success: true,
    //             message: isNewCustomer ? 'New customer and advance booking created' : 'Advance booking created',
    //             data: {
    //                 advanceBookingId,
    //                 customerId: finalCustomerId,
    //                 isNewCustomer,
    //                 invoiceNumber: (await AdvanceBooking.findById(advanceBookingId, hotelId))?.invoice_number,
    //                 details: {
    //                     from_date,
    //                     to_date,
    //                     total: parseFloat(total),
    //                     advance_amount: parseFloat(advance_amount),
    //                     remaining_amount,
    //                     payment_status: remaining_amount <= 0 ? 'completed' : 'partial',
    //                     expiry_days
    //                 }
    //             }
    //         });

    //     } catch (error) {
    //         console.error('❌ Create advance booking error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: 'Internal server error: ' + error.message
    //         });
    //     }
    // },


    // Create advance booking
    createAdvanceBooking: async (req, res) => {
        try {
            const {
                customer_id,
                room_id,
                from_date,
                to_date,
                from_time = '14:00',
                to_time = '12:00',
                guests = 1,
                amount = 0,
                advance_amount = 0,
                service = 0,
                cgst = 0,
                sgst = 0,
                igst = 0,
                total = 0,
                payment_method = 'cash',
                payment_status = 'pending',
                transaction_id = null,
                status = 'pending',
                expiry_days = 30,
                special_requests = '',
                id_type = 'aadhaar',
                id_number = '',
                id_image = null,
                id_image2 = null,
                referral_by = '',
                referral_amount = 0,
                // Customer details for new customer
                customer_name,
                customer_phone,
                customer_email,
                customer_id_number,
                address,
                city,
                state,
                pincode,
                customer_gst_no,
                purpose_of_visit,
                other_expenses = 0,
                expense_description = '',
                notes = '',
                // New field to track if checkout was auto-generated
                is_checkout_auto_generated = false
            } = req.body;

            const hotelId = req.user.hotel_id;
            let finalCustomerId = customer_id;
            let isNewCustomer = false;

            console.log('📝 Create advance booking request:', {
                hotelId,
                room_id,
                from_date,
                to_date,
                customer_name,
                customer_phone,
                advance_amount,
                total,
                is_checkout_auto_generated
            });

            // ===========================================
            // 1. VALIDATE ROOM (if specified)
            // ===========================================
            if (room_id) {
                const room = await Room.findById(room_id, hotelId);
                if (!room) {
                    return res.status(404).json({
                        success: false,
                        error: 'ROOM_NOT_FOUND',
                        message: 'Room not found'
                    });
                }

                // Check availability for future dates
                const isAvailable = await Booking.checkRoomAvailability(
                    room_id,
                    hotelId,
                    from_date,
                    to_date,
                    null,
                    'booked',
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
            }

            // ===========================================
            // 2. CUSTOMER HANDLING
            // ===========================================
            if (customer_name && customer_phone) {
                const existingCustomer = await Customer.findByPhone(customer_phone, hotelId);

                if (existingCustomer) {
                    finalCustomerId = existingCustomer.id;
                    console.log('✅ Found existing customer:', finalCustomerId);
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
                        address: address || '',
                        city: city || '',
                        state: state || '',
                        pincode: pincode || '',
                        customer_gst_no: customer_gst_no || '',
                        purpose_of_visit: purpose_of_visit || null,
                        other_expenses: other_expenses || 0,
                        expense_description: expense_description || null
                    });
                    isNewCustomer = true;
                    console.log('✅ Created new customer:', finalCustomerId);
                }
            }

            // Calculate remaining amount
            const remaining_amount = (parseFloat(total) || 0) - (parseFloat(advance_amount) || 0);

            // Add note about auto-generated checkout date if applicable
            let finalNotes = notes;
            if (is_checkout_auto_generated) {
                finalNotes = finalNotes
                    ? `${finalNotes}\n[System] Checkout date was auto-generated (default 1 night stay)`
                    : '[System] Checkout date was auto-generated (default 1 night stay)';
            }

            // Create advance booking
            const advanceBookingId = await AdvanceBooking.create({
                hotel_id: hotelId,
                customer_id: finalCustomerId,
                room_id,
                group_booking_id: null,
                from_date,
                to_date,
                from_time,
                to_time,
                guests,
                amount: parseFloat(amount),
                advance_amount: parseFloat(advance_amount),
                remaining_amount,
                service: parseFloat(service),
                cgst: parseFloat(cgst),
                sgst: parseFloat(sgst),
                igst: parseFloat(igst),
                total: parseFloat(total),
                payment_method,
                payment_status: remaining_amount <= 0 ? 'completed' : 'partial',
                transaction_id,
                status,
                expiry_days,
                special_requests,
                id_type,
                id_number,
                id_image,
                id_image2,
                referral_by,
                referral_amount: parseFloat(referral_amount),
                address,
                city,
                state,
                pincode,
                customer_gst_no,
                purpose_of_visit,
                other_expenses: parseFloat(other_expenses),
                expense_description,
                created_by: req.user.userId,
                notes: finalNotes
            });

            // Create transaction record if advance payment made
            // if (advance_amount > 0 && payment_method !== 'cash') {
            //     const txnId = transaction_id || `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            //     await Transaction.create({
            //         hotel_id: hotelId,
            //         booking_id: null,
            //         advance_booking_id: advanceBookingId,
            //         customer_id: finalCustomerId,
            //         transaction_id: txnId,
            //         amount: advance_amount,
            //         currency: 'INR',
            //         payment_method,
            //         payment_gateway: 'upi',
            //         status: 'success',
            //         status_message: 'Advance payment received',
            //         metadata: {
            //             type: 'advance_booking',
            //             booking_id: advanceBookingId,
            //             from_date,
            //             to_date,
            //             room_id,
            //             is_checkout_auto_generated
            //         }
            //     });

            //     if (!transaction_id) {
            //         await AdvanceBooking.update(advanceBookingId, hotelId, {
            //             transaction_id: txnId
            //         });
            //     }
            // }

            // If payment is completed and advance amount >= total, auto-confirm
            if (remaining_amount <= 0) {
                await AdvanceBooking.update(advanceBookingId, hotelId, {
                    status: 'confirmed'
                });
            }

            // Get the created booking to return
            const createdBooking = await AdvanceBooking.findById(advanceBookingId, hotelId);

            res.status(201).json({
                success: true,
                message: isNewCustomer ? 'New customer and advance booking created' : 'Advance booking created',
                data: {
                    advanceBookingId,
                    customerId: finalCustomerId,
                    isNewCustomer,
                    invoiceNumber: createdBooking?.invoice_number,
                    details: {
                        from_date,
                        to_date,
                        total: parseFloat(total),
                        advance_amount: parseFloat(advance_amount),
                        remaining_amount,
                        payment_status: remaining_amount <= 0 ? 'completed' : 'partial',
                        expiry_days,
                        is_checkout_auto_generated
                    }
                }
            });

        } catch (error) {
            console.error('❌ Create advance booking error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Get all advance bookings
    // getAdvanceBookings: async (req, res) => {
    //     try {
    //         const hotelId = req.user.hotel_id;
    //         const { status, payment_status, from_date, to_date } = req.query;

    //         // Check for expired bookings first
    //         await AdvanceBooking.checkExpired(hotelId);

    //         const bookings = await AdvanceBooking.findByHotel(hotelId, {
    //             status,
    //             payment_status,
    //             from_date,
    //             to_date
    //         });

    //         res.json({
    //             success: true,
    //             data: bookings,
    //             count: bookings.length
    //         });

    //     } catch (error) {
    //         console.error('❌ Get advance bookings error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: 'Internal server error'
    //         });
    //     }
    // },

    // Get all advance bookings
    getAdvanceBookings: async (req, res) => {
        try {
            const hotelId = req.user.hotel_id;
            const { status, payment_status, from_date, to_date } = req.query;

            // Check for expired bookings first
            await AdvanceBooking.checkExpired(hotelId);

            const bookings = await AdvanceBooking.findByHotel(hotelId, {
                status,
                payment_status,
                from_date,
                to_date
            });

            // Format dates properly for frontend
            const formattedBookings = bookings.map(booking => ({
                ...booking,
                from_date: booking.from_date, // Keep original
                to_date: booking.to_date,
                advance_expiry_date: booking.advance_expiry_date,
                // Add formatted dates for display
                from_date_display: booking.from_date ? new Date(booking.from_date).toLocaleDateString('en-IN') : null,
                to_date_display: booking.to_date ? new Date(booking.to_date).toLocaleDateString('en-IN') : null,
                created_at_display: booking.created_at ? new Date(booking.created_at).toLocaleString('en-IN') : null
            }));

            res.json({
                success: true,
                data: formattedBookings,
                count: formattedBookings.length
            });

        } catch (error) {
            console.error('❌ Get advance bookings error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Get single advance booking
    getAdvanceBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            const booking = await AdvanceBooking.findById(id, hotelId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            res.json({
                success: true,
                data: booking
            });

        } catch (error) {
            console.error('❌ Get advance booking error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Update advance booking
    updateAdvanceBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;
            const updateData = req.body;

            const updated = await AdvanceBooking.update(id, hotelId, updateData);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            res.json({
                success: true,
                message: 'Advance booking updated successfully'
            });

        } catch (error) {
            console.error('❌ Update advance booking error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Add advance payment to existing booking
    addAdvancePayment: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;
            const { advance_amount, payment_method, transaction_id } = req.body;

            if (!advance_amount || advance_amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_AMOUNT',
                    message: 'Valid advance amount is required'
                });
            }

            const booking = await AdvanceBooking.findById(id, hotelId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            const newAdvanceAmount = (parseFloat(booking.advance_amount) || 0) + parseFloat(advance_amount);
            const total = parseFloat(booking.total) || parseFloat(booking.amount) || 0;

            if (newAdvanceAmount > total) {
                return res.status(400).json({
                    success: false,
                    error: 'AMOUNT_EXCEEDS_TOTAL',
                    message: 'Advance amount cannot exceed total booking amount'
                });
            }

            // Generate transaction ID if not provided
            const txnId = transaction_id || `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Update advance amount
            await AdvanceBooking.updateAdvanceAmount(id, hotelId, newAdvanceAmount, txnId);

            // Create transaction record
            await Transaction.create({
                hotel_id: hotelId,
                advance_booking_id: id,
                customer_id: booking.customer_id,
                transaction_id: txnId,
                amount: advance_amount,
                currency: 'INR',
                payment_method,
                payment_gateway: payment_method === 'online' ? 'upi' : 'cash',
                status: 'success',
                status_message: 'Additional advance payment received',
                metadata: {
                    type: 'advance_payment',
                    previous_amount: booking.advance_amount,
                    new_amount: newAdvanceAmount
                }
            });

            // If fully paid, update status to confirmed
            if (newAdvanceAmount >= total) {
                await AdvanceBooking.update(id, hotelId, {
                    status: 'confirmed',
                    payment_status: 'completed'
                });
            }

            res.json({
                success: true,
                message: 'Advance payment added successfully',
                data: {
                    advance_booking_id: id,
                    previous_amount: booking.advance_amount,
                    added_amount: advance_amount,
                    new_amount: newAdvanceAmount,
                    remaining_amount: total - newAdvanceAmount,
                    fully_paid: newAdvanceAmount >= total
                }
            });

        } catch (error) {
            console.error('❌ Add advance payment error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },



    // convertToBooking: async (req, res) => {
    //         try {
    //             const { id } = req.params;
    //             const hotelId = req.user.hotel_id;
    //             const userId = req.user.userId;

    //             console.log('🔄 Converting advance booking to regular booking:', { id, hotelId, userId });

    //             const advanceBooking = await AdvanceBooking.findById(id, hotelId);
    //             if (!advanceBooking) {
    //                 return res.status(404).json({
    //                     success: false,
    //                     error: 'BOOKING_NOT_FOUND',
    //                     message: 'Advance booking not found'
    //                 });
    //             }

    //             if (advanceBooking.status === 'converted') {
    //                 return res.status(400).json({
    //                     success: false,
    //                     error: 'ALREADY_CONVERTED',
    //                     message: 'This advance booking has already been converted'
    //                 });
    //             }

    //             if (advanceBooking.status !== 'confirmed' && advanceBooking.status !== 'pending') {
    //                 return res.status(400).json({
    //                     success: false,
    //                     error: 'INVALID_STATUS',
    //                     message: 'Only confirmed or pending bookings can be converted'
    //                 });
    //             }

    //             if (!advanceBooking.room_id) {
    //                 return res.status(400).json({
    //                     success: false,
    //                     error: 'ROOM_REQUIRED',
    //                     message: 'Room must be selected to convert to booking'
    //                 });
    //             }

    //             const isAvailable = await Booking.checkRoomAvailability(
    //                 advanceBooking.room_id,
    //                 hotelId,
    //                 advanceBooking.from_date,
    //                 advanceBooking.to_date,
    //                 null,
    //                 'booked'
    //             );

    //             if (!isAvailable) {
    //                 return res.status(400).json({
    //                     success: false,
    //                     error: 'ROOM_NOT_AVAILABLE',
    //                     message: 'Room is no longer available for the selected dates'
    //                 });
    //             }

    //             const fullTotal = parseFloat(advanceBooking.total) || 0;
    //             const advancePaid = parseFloat(advanceBooking.advance_amount) || 0;
    //             const remainingAmount = fullTotal - advancePaid;

    //             const paymentStatus = remainingAmount <= 0 ? 'completed' : 'pending';
    //             const paymentMethod = advanceBooking.payment_method || 'cash';

    //             console.log('💰 Amount calculation:', {
    //                 fullTotal,
    //                 advancePaid,
    //                 remainingAmount,
    //                 paymentStatus,
    //                 paymentMethod
    //             });

    //             const bookingData = {
    //                 hotel_id: hotelId,
    //                 room_id: advanceBooking.room_id,
    //                 customer_id: advanceBooking.customer_id,
    //                 advance_booking_id: advanceBooking.id,
    //                 from_date: advanceBooking.from_date,
    //                 to_date: advanceBooking.to_date,
    //                 from_time: advanceBooking.from_time,
    //                 to_time: advanceBooking.to_time,
    //                 amount: parseFloat(advanceBooking.amount) || 0,
    //                 service: parseFloat(advanceBooking.service) || 0,
    //                 gst: (parseFloat(advanceBooking.cgst) || 0) +
    //                     (parseFloat(advanceBooking.sgst) || 0) +
    //                     (parseFloat(advanceBooking.igst) || 0),
    //                 cgst: parseFloat(advanceBooking.cgst) || 0,
    //                 sgst: parseFloat(advanceBooking.sgst) || 0,
    //                 igst: parseFloat(advanceBooking.igst) || 0,
    //                 total: fullTotal,
    //                 advance_amount_paid: advancePaid,
    //                 remaining_amount: remainingAmount,
    //                 status: 'booked',
    //                 guests: advanceBooking.guests || 1,
    //                 special_requests: advanceBooking.special_requests || '',
    //                 id_type: advanceBooking.id_type || 'aadhaar',
    //                 payment_method: paymentMethod,
    //                 payment_status: paymentStatus,
    //                 transaction_id: advanceBooking.transaction_id || null,
    //                 referral_by: advanceBooking.referral_by || '',
    //                 referral_amount: parseFloat(advanceBooking.referral_amount) || 0
    //             };

    //             console.log('📝 Creating booking with data:', bookingData);
    //             const bookingId = await Booking.create(bookingData);

    //             // ===========================================
    //             // CREATE COLLECTION FOR CASH ADVANCE PAYMENT
    //             // ===========================================

    //             if (advancePaid > 0) {
    //                 console.log(`💰 Processing advance payment of ₹${advancePaid} via ${paymentMethod}`);

    //                 if (paymentMethod === 'cash') {
    //                     try {
    //                         // Get customer name for collection
    //                         const customerName = advanceBooking.customer_name || 'Walk-in Customer';

    //                         // Insert directly into collections table
    //                         const insertQuery = `
    //                             INSERT INTO collections (
    //                                 hotel_id, booking_id, collection_date, payment_mode,
    //                                 amount, remarks, collected_by, handover_status, created_by
    //                             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    //                         `;

    //                         const insertParams = [
    //                             hotelId,
    //                             bookingId,
    //                             new Date().toISOString().split('T')[0],
    //                             'cash',
    //                             remainingAmount,
    //                             `Advance payment from booking #${advanceBooking.invoice_number || advanceBooking.id} (converted)`,
    //                             userId,
    //                             'pending',
    //                             userId
    //                         ];

    //                         const [collectionResult] = await pool.execute(insertQuery, insertParams);
    //                         console.log('✅ Collection created for advance payment with ID:', collectionResult.insertId);

    //                     } catch (collectionError) {
    //                         console.error('❌ Failed to create collection:', collectionError);
    //                     }
    //                 } 
    //                 else if (paymentMethod === 'online' || paymentMethod === 'upi' || paymentMethod === 'card') {
    //                     try {
    //                         const transactionId = advanceBooking.transaction_id || `TXN-ADV-${Date.now()}`;

    //                         const transactionRecord = await Transaction.create({
    //                             hotel_id: hotelId,
    //                             booking_id: bookingId,
    //                             advance_booking_id: advanceBooking.id,
    //                             customer_id: advanceBooking.customer_id,
    //                             transaction_id: transactionId,
    //                             amount: advancePaid,
    //                             currency: 'INR',
    //                             payment_method: paymentMethod,
    //                             payment_gateway: paymentMethod === 'online' ? 'upi' : paymentMethod,
    //                             status: 'success',
    //                             status_message: 'Advance payment received (converted from advance booking)',
    //                             metadata: {
    //                                 room_id: advanceBooking.room_id,
    //                                 room_number: advanceBooking.room_number,
    //                                 from_date: advanceBooking.from_date,
    //                                 to_date: advanceBooking.to_date,
    //                                 customer_name: advanceBooking.customer_name,
    //                                 customer_phone: advanceBooking.customer_phone,
    //                                 is_advance_conversion: true,
    //                                 full_total: fullTotal,
    //                                 remaining_amount: remainingAmount,
    //                                 invoice_number: advanceBooking.invoice_number
    //                             }
    //                         });

    //                         console.log('💰 Transaction created for advance payment:', transactionRecord);
    //                     } catch (transactionError) {
    //                         console.error('❌ Transaction creation error:', transactionError);
    //                     }
    //                 }
    //             }

    //             if (remainingAmount > 0) {
    //                 console.log('⏳ Remaining amount to be paid at check-in: ₹' + remainingAmount);
    //             }

    //             await AdvanceBooking.convertToBooking(id, hotelId, bookingId, userId);

    //             const Room = require('../models/Room');
    //             await Room.updateStatus(advanceBooking.room_id, hotelId, 'booked');

    //             // ===========================================
    //             // SEND CONFIRMATION (EMAIL + WHATSAPP)
    //             // ===========================================
    //             setTimeout(async () => {
    //                 try {
    //                     const [fullBooking] = await pool.execute(`
    //                         SELECT b.*, r.room_number, r.type as room_type,
    //                                c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
    //                                c.customer_gst_no, c.address, c.city, c.state, c.pincode,
    //                                h.name as hotel_name, b.hotel_id
    //                         FROM bookings b
    //                         LEFT JOIN rooms r ON b.room_id = r.id
    //                         LEFT JOIN customers c ON b.customer_id = c.id
    //                         LEFT JOIN hotels h ON b.hotel_id = h.id
    //                         WHERE b.id = ? AND b.hotel_id = ?
    //                     `, [bookingId, hotelId]);

    //                     if (fullBooking.length > 0) {
    //                         const booking = fullBooking[0];

    //                         const [adminRows] = await pool.execute(
    //                             `SELECT email, name, phone FROM users 
    //                              WHERE hotel_id = ? AND role = 'admin' AND status = 'active'
    //                              LIMIT 1`,
    //                             [hotelId]
    //                         );

    //                         const hotelAdmin = adminRows.length > 0 ? adminRows[0] : null;
    //                         const hotelAdminEmail = hotelAdmin ? hotelAdmin.email : process.env.EMAIL_USER;
    //                         const hotelAdminName = hotelAdmin ? hotelAdmin.name : 'Hotel Admin';
    //                         const hotelAdminPhone = hotelAdmin ? hotelAdmin.phone : null;

    //                         const hotelDetails = {
    //                             name: booking.hotel_name || 'Hotel',
    //                             email: hotelAdminEmail,
    //                             address: ''
    //                         };

    //                         const hotelOwnerDetails = {
    //                             name: hotelAdminName,
    //                             email: hotelAdminEmail,
    //                             phone: hotelAdminPhone
    //                         };

    //                         const customerEmail = booking.customer_email;
    //                         const customerName = booking.customer_name;
    //                         const customerPhone = booking.customer_phone;

    //                         const customerDetails = {
    //                             name: customerName,
    //                             email: customerEmail,
    //                             phone: customerPhone
    //                         };

    //                         const companyLogoBase64 = getBase64Logo();

    //                         if (customerDetails.email) {
    //                             await EmailService.sendBookingConfirmation(booking, hotelDetails, customerDetails, {
    //                                 companyLogoUrl: companyLogoBase64,
    //                                 companyName: 'Hithlaksh Solutions Private Limited',
    //                                 companyWebsite: 'https://hithlakshsolutions.com/',
    //                                 privacyLink: 'https://hithlakshsolutions.com/privacy',
    //                                 termsLink: 'https://hithlakshsolutions.com/terms'
    //                             });
    //                             console.log(`✅ Booking confirmation email sent to customer (conversion)`);
    //                         }

    //                         if (customerDetails.phone || hotelOwnerDetails.phone) {
    //                             try {
    //                                 const whatsappResults = await WhatsAppService.sendBookingConfirmationToAll(
    //                                     booking,
    //                                     booking.hotel_name || 'Hotel',
    //                                     customerDetails,
    //                                     hotelOwnerDetails
    //                                 );

    //                                 if (whatsappResults.customer?.success) {
    //                                     console.log(`📱 WhatsApp sent to customer: ${customerDetails.name}`);
    //                                 }
    //                                 if (whatsappResults.hotelOwner?.success) {
    //                                     console.log(`📱 WhatsApp sent to hotel owner: ${hotelOwnerDetails.name}`);
    //                                 }
    //                             } catch (whatsappError) {
    //                                 console.error(`❌ WhatsApp error:`, whatsappError.message);
    //                             }
    //                         }
    //                     }
    //                 } catch (error) {
    //                     console.error('❌ Error sending booking confirmations:', error);
    //                 }
    //             }, 1000);

    //             res.json({
    //                 success: true,
    //                 message: 'Advance booking converted to regular booking',
    //                 data: {
    //                     advance_booking_id: id,
    //                     booking_id: bookingId,
    //                     room_number: advanceBooking.room_number,
    //                     full_total: fullTotal,
    //                     advance_paid: advancePaid,
    //                     remaining_amount: remainingAmount,
    //                     payment_status: paymentStatus,
    //                     payment_method: paymentMethod
    //                 }
    //             });

    //         } catch (error) {
    //             console.error('❌ Convert to booking error:', error);
    //             res.status(500).json({
    //                 success: false,
    //                 error: 'SERVER_ERROR',
    //                 message: 'Internal server error: ' + error.message
    //             });
    //         }
    //     },



    // In advanceBookingController.js - UPDATED convertToBooking method
    convertToBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;
            const userId = req.user.userId;

            const {
                conversion_payment_method,  // 👈 ADD THIS
                conversion_payment_status   // 👈 ADD THIS (optional)
            } = req.body;

            console.log('🔄 Converting advance booking to regular booking:', { id, hotelId, userId, conversion_payment_method });

            const advanceBooking = await AdvanceBooking.findById(id, hotelId);
            if (!advanceBooking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            if (advanceBooking.status === 'converted') {
                return res.status(400).json({
                    success: false,
                    error: 'ALREADY_CONVERTED',
                    message: 'This advance booking has already been converted'
                });
            }

            if (advanceBooking.status !== 'confirmed' && advanceBooking.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_STATUS',
                    message: 'Only confirmed or pending bookings can be converted'
                });
            }

            if (!advanceBooking.room_id) {
                return res.status(400).json({
                    success: false,
                    error: 'ROOM_REQUIRED',
                    message: 'Room must be selected to convert to booking'
                });
            }

            const isAvailable = await Booking.checkRoomAvailability(
                advanceBooking.room_id,
                hotelId,
                advanceBooking.from_date,
                advanceBooking.to_date,
                null,
                'booked',
                advanceBooking.from_time || '14:00',
                advanceBooking.to_time || '12:00'
            );

            if (!isAvailable) {
                return res.status(400).json({
                    success: false,
                    error: 'ROOM_NOT_AVAILABLE',
                    message: 'Room is no longer available for the selected dates'
                });
            }

            const fullTotal = parseFloat(advanceBooking.total) || 0;
            const advancePaid = parseFloat(advanceBooking.advance_amount) || 0;
            const remainingAmount = fullTotal - advancePaid;

            const paymentStatus = remainingAmount <= 0 ? 'completed' : 'pending';
            // const paymentMethod = advanceBooking.payment_method || 'cash';
            const paymentMethod = conversion_payment_method || advanceBooking.payment_method || 'cash';

            console.log('💰 Amount calculation:', {
                fullTotal,
                advancePaid,
                remainingAmount,
                paymentStatus,
                paymentMethod
            });

            const bookingData = {
                hotel_id: hotelId,
                room_id: advanceBooking.room_id,
                customer_id: advanceBooking.customer_id,
                advance_booking_id: advanceBooking.id,
                from_date: advanceBooking.from_date,
                to_date: advanceBooking.to_date,
                from_time: advanceBooking.from_time,
                to_time: advanceBooking.to_time,
                amount: parseFloat(advanceBooking.amount) || 0,
                service: parseFloat(advanceBooking.service) || 0,
                gst: (parseFloat(advanceBooking.cgst) || 0) +
                    (parseFloat(advanceBooking.sgst) || 0) +
                    (parseFloat(advanceBooking.igst) || 0),
                cgst: parseFloat(advanceBooking.cgst) || 0,
                sgst: parseFloat(advanceBooking.sgst) || 0,
                igst: parseFloat(advanceBooking.igst) || 0,
                total: fullTotal,
                advance_amount_paid: advancePaid,
                remaining_amount: remainingAmount,
                status: 'booked',
                guests: advanceBooking.guests || 1,
                special_requests: advanceBooking.special_requests || '',
                id_type: advanceBooking.id_type || 'aadhaar',
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                transaction_id: advanceBooking.transaction_id || null,
                referral_by: advanceBooking.referral_by || '',
                referral_amount: parseFloat(advanceBooking.referral_amount) || 0
            };

            console.log('📝 Creating booking with data:', bookingData);
            const bookingId = await Booking.create(bookingData);

            // ===========================================
            // CREATE COLLECTION FOR CASH ADVANCE PAYMENT
            // ===========================================

            if (advancePaid > 0) {
                console.log(`💰 Processing advance payment of ₹${advancePaid} via ${paymentMethod}`);

                if (paymentMethod === 'cash') {
                    try {
                        // Get customer name for collection
                        const customerName = advanceBooking.customer_name || 'Walk-in Customer';

                        // Insert directly into collections table
                        const insertQuery = `
                        INSERT INTO collections (
                            hotel_id, booking_id, collection_date, payment_mode,
                            amount, remarks, collected_by, handover_status, created_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                        const insertParams = [
                            hotelId,
                            bookingId,
                            new Date().toISOString().split('T')[0],
                            'cash',
                            remainingAmount,
                            `Advance payment from booking #${advanceBooking.invoice_number || advanceBooking.id} (converted)`,
                            userId,
                            'pending',
                            userId
                        ];

                        const [collectionResult] = await pool.execute(insertQuery, insertParams);
                        console.log('✅ Collection created for advance payment with ID:', collectionResult.insertId);

                    } catch (collectionError) {
                        console.error('❌ Failed to create collection:', collectionError);
                    }
                }
                else if (paymentMethod === 'online' || paymentMethod === 'upi' || paymentMethod === 'card') {
                    try {
                        const transactionId = advanceBooking.transaction_id || `TXN-ADV-${Date.now()}`;

                        const transactionRecord = await Transaction.create({
                            hotel_id: hotelId,
                            booking_id: bookingId,
                            advance_booking_id: advanceBooking.id,
                            customer_id: advanceBooking.customer_id,
                            transaction_id: transactionId,
                            amount: advancePaid,
                            currency: 'INR',
                            payment_method: paymentMethod,
                            payment_gateway: paymentMethod === 'online' ? 'upi' : paymentMethod,
                            status: 'success',
                            status_message: 'Advance payment received (converted from advance booking)',
                            metadata: {
                                room_id: advanceBooking.room_id,
                                room_number: advanceBooking.room_number,
                                from_date: advanceBooking.from_date,
                                to_date: advanceBooking.to_date,
                                customer_name: advanceBooking.customer_name,
                                customer_phone: advanceBooking.customer_phone,
                                is_advance_conversion: true,
                                full_total: fullTotal,
                                remaining_amount: remainingAmount,
                                invoice_number: advanceBooking.invoice_number,
                                conversion_payment_method: paymentMethod
                            }
                        });

                        console.log('💰 Transaction created for advance payment:', transactionRecord);
                    } catch (transactionError) {
                        console.error('❌ Transaction creation error:', transactionError);
                    }
                }
            }

            if (remainingAmount > 0) {
                console.log('⏳ Remaining amount to be paid at check-in: ₹' + remainingAmount);
            }

            // ===========================================
            // FIX: UPDATE ADVANCE BOOKING PAYMENT STATUS TO COMPLETED
            // AND REMAINING AMOUNT TO 0
            // ===========================================

            // Update advance booking with completed payment status and 0 remaining amount
            await AdvanceBooking.update(id, hotelId, {
                status: 'converted',
                payment_status: 'completed',  // Set to completed
                remaining_amount: 0,           // Set remaining to 0
                notes: advanceBooking.notes
                    ? advanceBooking.notes + '\n[System] Converted to regular booking on ' + new Date().toLocaleDateString()
                    : '[System] Converted to regular booking on ' + new Date().toLocaleDateString()
            });

            // Also call convertToBooking for backward compatibility (it updates status to 'converted')
            await AdvanceBooking.convertToBooking(id, hotelId, bookingId, userId);

            const Room = require('../models/Room');
            await Room.updateStatus(advanceBooking.room_id, hotelId, 'booked');

            // ===========================================
            // SEND CONFIRMATION (EMAIL + WHATSAPP) — Pro / Pro Plus only
            // ===========================================
            if (isBasicHotelPlan(req.user.hotel_plan)) {
                console.log(`ℹ️ Basic plan hotel ${hotelId} — skipping conversion booking email/WhatsApp notifications`);
            } else {
            setTimeout(async () => {
                try {
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

                        const companyLogoBase64 = getBase64Logo();

                        if (customerDetails.email) {
                            await EmailService.sendBookingConfirmation(booking, hotelDetails, customerDetails, {
                                companyLogoUrl: companyLogoBase64,
                                companyName: 'Hithlaksh Solutions Private Limited',
                                companyWebsite: 'https://hithlakshsolutions.com/',
                                privacyLink: 'https://hithlakshsolutions.com/privacy',
                                termsLink: 'https://hithlakshsolutions.com/terms'
                            });
                            console.log(`✅ Booking confirmation email sent to customer (conversion)`);
                        }

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
                                console.error(`❌ WhatsApp error:`, whatsappError.message);
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error sending booking confirmations:', error);
                }
            }, 1000);
            }

            res.json({
                success: true,
                message: 'Advance booking converted to regular booking',
                data: {
                    advance_booking_id: id,
                    booking_id: bookingId,
                    room_number: advanceBooking.room_number,
                    full_total: fullTotal,
                    advance_paid: advancePaid,
                    remaining_amount: remainingAmount,
                    payment_status: paymentStatus,
                    payment_method: paymentMethod,
                    advance_booking_updated: {
                        status: 'converted',
                        payment_status: 'completed',
                        remaining_amount: 0
                    }
                }
            });

        } catch (error) {
            console.error('❌ Convert to booking error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },


    cancelAdvanceBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;
            const { reason } = req.body;

            const booking = await AdvanceBooking.findById(id, hotelId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            if (booking.status === 'converted') {
                return res.status(400).json({
                    success: false,
                    error: 'CANNOT_CANCEL',
                    message: 'Converted bookings cannot be cancelled'
                });
            }

            await AdvanceBooking.cancel(id, hotelId, reason || 'Cancelled by user');

            // TODO: Process refund if advance payment was made
            if (booking.advance_amount > 0) {
                // Create refund record or process payment reversal
                console.log('💰 Refund needed for advance payment:', booking.advance_amount);
            }

            res.json({
                success: true,
                message: 'Advance booking cancelled successfully',
                data: {
                    advance_booking_id: id,
                    advance_amount: booking.advance_amount,
                    refund_status: booking.advance_amount > 0 ? 'pending' : 'no_refund'
                }
            });

        } catch (error) {
            console.error('❌ Cancel advance booking error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Get advance booking stats
    // getAdvanceBookingStats: async (req, res) => {
    //     try {
    //         const hotelId = req.user.hotel_id;

    //         // Check for expired bookings first
    //         await AdvanceBooking.checkExpired(hotelId);

    //         const stats = await AdvanceBooking.getStats(hotelId);

    //         res.json({
    //             success: true,
    //             data: stats
    //         });

    //     } catch (error) {
    //         console.error('❌ Get advance booking stats error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: 'Internal server error'
    //         });
    //     }
    // },

    // Get advance booking stats
    getAdvanceBookingStats: async (req, res) => {
        try {
            const hotelId = req.user.hotel_id;

            // Check for expired bookings first
            await AdvanceBooking.checkExpired(hotelId);

            const stats = await AdvanceBooking.getStats(hotelId);

            // Get current date in IST for filtering if needed
            const now = new Date();
            const todayIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
            const todayStr = todayIST.toISOString().split('T')[0];

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('❌ Get advance booking stats error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Generate invoice for advance booking
    // generateInvoice: async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const hotelId = req.user.hotel_id;

    //         const booking = await AdvanceBooking.findById(id, hotelId);
    //         if (!booking) {
    //             return res.status(404).json({
    //                 success: false,
    //                 error: 'BOOKING_NOT_FOUND',
    //                 message: 'Advance booking not found'
    //             });
    //         }

    //         // Get hotel details
    //         const [hotelRows] = await pool.execute(`
    //             SELECT h.*, u.phone as hotel_phone, u.email as hotel_email
    //             FROM hotels h
    //             LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
    //             WHERE h.id = ?
    //         `, [hotelId]);

    //         const hotelDetails = hotelRows[0] || {};

    //         // Get company logo
    //         const [logoRows] = await pool.execute(
    //             'SELECT logo_image FROM hotels WHERE id = ?',
    //             [hotelId]
    //         );

    //         const companyLogoBase64 = logoRows[0]?.logo_image || '';

    //         // Format dates
    //         const formatDate = (date) => {
    //             if (!date) return '';
    //             try {
    //                 const d = new Date(date);
    //                 return d.toLocaleDateString('en-IN', {
    //                     day: '2-digit',
    //                     month: 'short',
    //                     year: 'numeric'
    //                 });
    //             } catch (e) {
    //                 return date;
    //             }
    //         };

    //         const invoiceData = {
    //             invoiceNumber: booking.invoice_number,
    //             invoiceDate: formatDate(new Date()),
    //             bookingId: booking.id,
    //             type: 'ADVANCE BOOKING',
    //             expiryDate: formatDate(booking.advance_expiry_date),
    //             hotel: {
    //                 name: hotelDetails.name || 'Hotel',
    //                 address: hotelDetails.address || '',
    //                 phone: hotelDetails.hotel_phone || '',
    //                 email: hotelDetails.hotel_email || '',
    //                 gstin: hotelDetails.gst_number || '',
    //                 logo: companyLogoBase64
    //             },
    //             customer: {
    //                 name: booking.customer_name || 'Walk-in',
    //                 phone: booking.customer_phone || '',
    //                 email: booking.customer_email || '',
    //                 address: booking.address || '',
    //                 city: booking.city || '',
    //                 state: booking.state || '',
    //                 pincode: booking.pincode || '',
    //                 gst: booking.customer_gst_no || ''
    //             },
    //             booking: {
    //                 roomNumber: booking.room_number || 'Not Assigned',
    //                 roomType: booking.room_type || 'Standard',
    //                 fromDate: formatDate(booking.from_date),
    //                 toDate: formatDate(booking.to_date),
    //                 fromTime: booking.from_time,
    //                 toTime: booking.to_time,
    //                 nights: Math.ceil((new Date(booking.to_date) - new Date(booking.from_date)) / (1000 * 60 * 60 * 24)),
    //                 guests: booking.guests
    //             },
    //             charges: [
    //                 {
    //                     description: `Room Charges (${booking.amount > 0 ? '₹' + booking.amount : 'To be decided'})`,
    //                     amount: booking.amount
    //                 },
    //                 { description: 'Service Charges', amount: booking.service },
    //                 ...(booking.cgst > 0 ? [{ description: `CGST`, amount: booking.cgst }] : []),
    //                 ...(booking.sgst > 0 ? [{ description: `SGST`, amount: booking.sgst }] : []),
    //                 ...(booking.igst > 0 ? [{ description: `IGST`, amount: booking.igst }] : [])
    //             ],
    //             subtotal: (booking.amount || 0) + (booking.service || 0),
    //             total: booking.total || 0,
    //             advancePaid: booking.advance_amount || 0,
    //             remainingDue: (booking.total || 0) - (booking.advance_amount || 0),
    //             payment: {
    //                 method: booking.payment_method,
    //                 status: booking.payment_status,
    //                 transactionId: booking.transaction_id
    //             },
    //             status: booking.status,
    //             notes: booking.notes || 'Advance booking - Balance to be paid at check-in',
    //             footer: {
    //                 note: 'This is an advance booking invoice. Final amount may vary.',
    //                 terms: 'Advance booking valid until ' + formatDate(booking.advance_expiry_date),
    //                 companyName: hotelDetails.name || 'Hotel Management System'
    //             }
    //         };

    //         res.json({
    //             success: true,
    //             data: invoiceData
    //         });

    //     } catch (error) {
    //         console.error('❌ Generate advance invoice error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: 'Internal server error: ' + error.message
    //         });
    //     }
    // },

    // Update generateInvoice method
    generateInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            const booking = await AdvanceBooking.findById(id, hotelId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            // Get hotel details - FIXED QUERY
            const [hotelRows] = await pool.execute(
                `SELECT h.id, h.name, h.address, h.gst_number, h.logo_image,
                    u.phone as phone, u.email as email
             FROM hotels h
             LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
             WHERE h.id = ?`,
                [hotelId]
            );

            const hotelData = {
                name: hotelRows[0]?.name || 'Hotel',
                address: hotelRows[0]?.address || '',
                phone: hotelRows[0]?.phone || '',
                email: hotelRows[0]?.email || '',
                gstin: hotelRows[0]?.gst_number || '',
                logo: hotelRows[0]?.logo_image || ''
            };

            // Generate HTML using template
            const htmlContent = InvoiceService.generateSingleInvoice(booking, hotelData);

            res.json({
                success: true,
                data: {
                    html: htmlContent,
                    invoiceNumber: booking.invoice_number
                }
            });

        } catch (error) {
            console.error('❌ Generate advance invoice error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Update generateGroupInvoice method
    generateGroupInvoice: async (req, res) => {
        try {
            const { groupId } = req.params;
            const hotelId = req.user.hotel_id;

            const bookings = await AdvanceBooking.findByGroupId(groupId, hotelId);
            if (!bookings || bookings.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'GROUP_NOT_FOUND',
                    message: 'Group not found'
                });
            }

            // Get hotel details - FIXED QUERY
            const [hotelRows] = await pool.execute(
                `SELECT h.id, h.name, h.address, h.gst_number, h.logo_image,
                    u.phone as phone, u.email as email
             FROM hotels h
             LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
             WHERE h.id = ?`,
                [hotelId]
            );

            const hotelData = {
                name: hotelRows[0]?.name || 'Hotel',
                address: hotelRows[0]?.address || '',
                phone: hotelRows[0]?.phone || '',
                email: hotelRows[0]?.email || '',
                gstin: hotelRows[0]?.gst_number || '',
                logo: hotelRows[0]?.logo_image || ''
            };

            // Generate HTML using template
            const htmlContent = InvoiceService.generateGroupInvoice(groupId, bookings, hotelData);

            res.json({
                success: true,
                data: {
                    html: htmlContent,
                    groupId: groupId,
                    roomCount: bookings.length
                }
            });

        } catch (error) {
            console.error('❌ Generate group invoice error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    generateInvoicePDF: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            console.log(`📄 Generating PDF for invoice: ${id}`);

            const booking = await AdvanceBooking.findById(id, hotelId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            const hotelData = await getHotelDetails(hotelId);
            const htmlContent = InvoiceService.generateSingleInvoice(booking, hotelData);

            // Validate HTML content
            if (!htmlContent || htmlContent.length < 100) {
                throw new Error('Invalid HTML content generated');
            }

            console.log(`📄 HTML content length: ${htmlContent.length} characters`);

            // Generate PDF
            const pdfBuffer = await PDFService.generatePDF(htmlContent, {
                landscape: false
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking.invoice_number}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Cache-Control', 'no-cache');

            console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('❌ Generate PDF error:', error);
            res.status(500).json({
                success: false,
                error: 'PDF_GENERATION_FAILED',
                message: 'Failed to generate PDF: ' + error.message
            });
        }
    },

    // Replace the generateGroupInvoicePDF method
    generateGroupInvoicePDF: async (req, res) => {
        try {
            const { groupId } = req.params;
            const hotelId = req.user.hotel_id;

            console.log(`📄 Generating Group PDF for: ${groupId}`);

            const bookings = await AdvanceBooking.findByGroupId(groupId, hotelId);
            if (!bookings || bookings.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'GROUP_NOT_FOUND',
                    message: 'Group not found'
                });
            }

            const hotelData = await getHotelDetails(hotelId);
            const htmlContent = InvoiceService.generateGroupInvoice(groupId, bookings, hotelData);

            // Validate HTML content
            if (!htmlContent || htmlContent.length < 100) {
                throw new Error('Invalid HTML content generated');
            }

            console.log(`📄 Group HTML content length: ${htmlContent.length} characters`);

            // Generate PDF in landscape for group invoices
            const pdfBuffer = await PDFService.generatePDF(htmlContent, {
                landscape: true
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="group-invoice-${groupId.slice(-8)}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Cache-Control', 'no-cache');

            console.log(`✅ Group PDF generated successfully: ${pdfBuffer.length} bytes`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('❌ Generate group PDF error:', error);
            res.status(500).json({
                success: false,
                error: 'PDF_GENERATION_FAILED',
                message: 'Failed to generate group PDF: ' + error.message
            });
        }
    },


    // controllers/advanceBookingController.js - Add this new method

    // Create multiple advance bookings at once
    createMultipleAdvanceBookings: async (req, res) => {
        try {
            const { bookings, groupBookingId, customerData } = req.body;
            const hotelId = req.user.hotel_id;

            console.log('📝 Create multiple advance bookings request:', {
                hotelId,
                roomCount: bookings.length,
                groupBookingId,
                customerData
            });

            // ===========================================
            // 1. CUSTOMER HANDLING (create once for all rooms)
            // ===========================================
            let finalCustomerId = customerData.customer_id;
            let isNewCustomer = false;

            if (customerData.customer_name && customerData.customer_phone) {
                const existingCustomer = await Customer.findByPhone(customerData.customer_phone, hotelId);

                if (existingCustomer) {
                    finalCustomerId = existingCustomer.id;
                    console.log('✅ Found existing customer:', finalCustomerId);

                    // Update customer if needed
                    await Customer.update(existingCustomer.id, hotelId, {
                        name: customerData.customer_name,
                        phone: customerData.customer_phone,
                        email: customerData.customer_email || existingCustomer.email,
                        id_number: customerData.customer_id_number || existingCustomer.id_number,
                        id_type: customerData.id_type || 'aadhaar',
                        id_image: customerData.id_image || existingCustomer.id_image,
                        id_image2: customerData.id_image2 || existingCustomer.id_image2,
                        address: customerData.address || existingCustomer.address,
                        city: customerData.city || existingCustomer.city,
                        state: customerData.state || existingCustomer.state,
                        pincode: customerData.pincode || existingCustomer.pincode,
                        customer_gst_no: customerData.customer_gst_no || existingCustomer.customer_gst_no,
                        purpose_of_visit: customerData.purpose_of_visit || existingCustomer.purpose_of_visit,
                    });
                } else {
                    finalCustomerId = await Customer.create({
                        hotel_id: hotelId,
                        name: customerData.customer_name,
                        phone: customerData.customer_phone,
                        email: customerData.customer_email || '',
                        id_number: customerData.customer_id_number || '',
                        id_type: customerData.id_type || 'aadhaar',
                        id_image: customerData.id_image || null,
                        id_image2: customerData.id_image2 || null,
                        address: customerData.address || '',
                        city: customerData.city || '',
                        state: customerData.state || '',
                        pincode: customerData.pincode || '',
                        customer_gst_no: customerData.customer_gst_no || '',
                        purpose_of_visit: customerData.purpose_of_visit || null,
                    });
                    isNewCustomer = true;
                    console.log('✅ Created new customer:', finalCustomerId);
                }
            }

            const results = [];
            const errors = [];

            // Process each room booking
            for (const bookingData of bookings) {
                try {
                    // Check room availability
                    if (bookingData.room_id) {
                        const room = await Room.findById(bookingData.room_id, hotelId);
                        if (!room) {
                            errors.push({
                                room_id: bookingData.room_id,
                                error: 'ROOM_NOT_FOUND',
                                message: 'Room not found'
                            });
                            continue;
                        }

                        const isAvailable = await Booking.checkRoomAvailability(
                            bookingData.room_id,
                            hotelId,
                            bookingData.from_date,
                            bookingData.to_date || bookingData.from_date,
                            null,
                            'booked',
                            bookingData.from_time || '14:00',
                            bookingData.to_time || '12:00'
                        );

                        if (!isAvailable) {
                            errors.push({
                                room_id: bookingData.room_id,
                                room_number: bookingData.room_number,
                                error: 'ROOM_NOT_AVAILABLE',
                                message: `Room ${bookingData.room_number} is not available for selected dates`
                            });
                            continue;
                        }
                    }

                    // Calculate remaining amount
                    const remaining_amount = (parseFloat(bookingData.total) || 0) - (parseFloat(bookingData.advance_amount) || 0);

                    // Add note if checkout date was auto-generated
                    let finalNotes = bookingData.notes || '';
                    if (bookingData.is_checkout_auto_generated) {
                        finalNotes = finalNotes
                            ? `${finalNotes}\n[System] Checkout date was auto-generated (default 1 night stay)`
                            : '[System] Checkout date was auto-generated (default 1 night stay)';
                    }

                    // Add group booking ID to link all rooms
                    const advanceBookingId = await AdvanceBooking.create({
                        hotel_id: hotelId,
                        customer_id: finalCustomerId,
                        room_id: bookingData.room_id,
                        group_booking_id: groupBookingId,  // 👈 NEW: Link all rooms with same group ID
                        from_date: bookingData.from_date,
                        to_date: bookingData.to_date || bookingData.from_date,
                        from_time: bookingData.from_time || '14:00',
                        to_time: bookingData.to_time || '12:00',
                        guests: bookingData.guests || 1,
                        amount: parseFloat(bookingData.amount) || 0,
                        advance_amount: parseFloat(bookingData.advance_amount) || 0,
                        remaining_amount,
                        service: parseFloat(bookingData.service) || 0,
                        cgst: parseFloat(bookingData.cgst) || 0,
                        sgst: parseFloat(bookingData.sgst) || 0,
                        igst: parseFloat(bookingData.igst) || 0,
                        total: parseFloat(bookingData.total) || 0,
                        payment_method: bookingData.payment_method || 'cash',
                        payment_status: remaining_amount <= 0 ? 'completed' : 'partial',
                        transaction_id: bookingData.transaction_id || null,
                        status: remaining_amount <= 0 ? 'confirmed' : 'pending',
                        expiry_days: bookingData.expiry_days || 30,
                        special_requests: bookingData.special_requests || '',
                        id_type: customerData.id_type || 'aadhaar',
                        id_number: customerData.id_number || '',
                        id_image: customerData.id_image || null,
                        id_image2: customerData.id_image2 || null,
                        referral_by: bookingData.referral_by || '',
                        referral_amount: parseFloat(bookingData.referral_amount) || 0,
                        address: customerData.address || '',
                        city: customerData.city || '',
                        state: customerData.state || '',
                        pincode: customerData.pincode || '',
                        customer_gst_no: customerData.customer_gst_no || '',
                        purpose_of_visit: customerData.purpose_of_visit || '',
                        other_expenses: parseFloat(bookingData.other_expenses) || 0,
                        expense_description: bookingData.expense_description || '',
                        created_by: req.user.userId,
                        notes: finalNotes
                    });

                    results.push({
                        advanceBookingId,
                        room_id: bookingData.room_id,
                        room_number: bookingData.room_number,
                        success: true
                    });

                } catch (error) {
                    console.error('❌ Error creating advance booking for room:', bookingData.room_number, error);
                    errors.push({
                        room_id: bookingData.room_id,
                        room_number: bookingData.room_number,
                        error: error.message
                    });
                }
            }

            // Create a single transaction record for the entire group if advance payment made
            const totalAdvanceAmount = bookings.reduce((sum, b) => sum + (parseFloat(b.advance_amount) || 0), 0);
            if (totalAdvanceAmount > 0 && customerData.payment_method !== 'cash') {
                const txnId = customerData.transaction_id || `ADV-GRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                await Transaction.create({
                    hotel_id: hotelId,
                    booking_id: null,
                    advance_booking_id: results[0]?.advanceBookingId, // Link to first booking
                    customer_id: finalCustomerId,
                    transaction_id: txnId,
                    amount: totalAdvanceAmount,
                    currency: 'INR',
                    payment_method: customerData.payment_method,
                    payment_gateway: 'upi',
                    status: 'success',
                    status_message: 'Group advance payment received',
                    metadata: {
                        type: 'group_advance_booking',
                        group_id: groupBookingId,
                        room_count: results.length,
                        bookings: results.map(r => r.advanceBookingId)
                    }
                });

                // Update all bookings with transaction ID
                for (const result of results) {
                    await AdvanceBooking.update(result.advanceBookingId, hotelId, {
                        transaction_id: txnId
                    });
                }
            }

            res.status(201).json({
                success: true,
                message: `Created ${results.length} advance bookings, ${errors.length} failed`,
                data: {
                    groupBookingId,
                    customerId: finalCustomerId,
                    isNewCustomer,
                    successful: results,
                    failed: errors,
                    totalAdvanceAmount
                }
            });

        } catch (error) {
            console.error('❌ Create multiple advance bookings error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Get group advance bookings
    getGroupAdvanceBookings: async (req, res) => {
        try {
            const { groupId } = req.params;
            const hotelId = req.user.hotel_id;

            const bookings = await AdvanceBooking.findByGroupId(groupId, hotelId);

            if (!bookings || bookings.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'GROUP_NOT_FOUND',
                    message: 'Group not found'
                });
            }

            // Calculate group totals
            const totals = bookings.reduce((acc, booking) => ({
                totalAmount: acc.totalAmount + (parseFloat(booking.total) || 0),
                totalAdvance: acc.totalAdvance + (parseFloat(booking.advance_amount) || 0),
                totalRemaining: acc.totalRemaining + (parseFloat(booking.remaining_amount) || 0)
            }), { totalAmount: 0, totalAdvance: 0, totalRemaining: 0 });

            res.json({
                success: true,
                data: {
                    groupId,
                    bookings,
                    totals,
                    roomCount: bookings.length
                }
            });

        } catch (error) {
            console.error('❌ Get group advance bookings error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // controllers/advanceBookingController.js
    checkRoomAvailabilityForAdvance: async (req, res) => {
        try {
            const { room_id, from_date, to_date, from_time = '14:00', to_time = '12:00' } = req.body;
            const hotelId = req.user.hotel_id;

            // Check regular bookings
            const isRegularBookingAvailable = await Booking.checkRoomAvailability(
                room_id,
                hotelId,
                from_date,
                to_date,
                null,
                'booked',
                from_time,
                to_time
            );

            if (!isRegularBookingAvailable) {
                return res.json({
                    success: true,
                    data: {
                        available: false,
                        reason: 'Room is already booked for these dates'
                    }
                });
            }

            // Check advance bookings (pending or confirmed)
            const [advanceBookings] = await pool.execute(`
            SELECT * FROM advance_bookings 
            WHERE hotel_id = ? 
            AND room_id = ?
            AND status IN ('pending', 'confirmed')
            AND (
                (from_date <= ? AND to_date >= ?) OR
                (from_date <= ? AND to_date >= ?) OR
                (from_date >= ? AND to_date <= ?)
            )
        `, [hotelId, room_id, to_date, from_date, to_date, from_date, from_date, to_date]);

            const isAvailable = advanceBookings.length === 0;

            res.json({
                success: true,
                data: {
                    available: isAvailable,
                    reason: isAvailable ? 'Room available' : 'Room already has an advance booking',
                    conflictingAdvanceBookings: advanceBookings
                }
            });

        } catch (error) {
            console.error('❌ Check advance availability error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: error.message
            });
        }
    },

    // Add to advanceBookingController.js
    deleteAdvanceBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            console.log('🗑️ Deleting advance booking:', { id, hotelId });

            // Get booking details first
            const booking = await AdvanceBooking.findById(id, hotelId);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'BOOKING_NOT_FOUND',
                    message: 'Advance booking not found'
                });
            }

            // Check if booking can be deleted
            const deletableStatuses = ['pending', 'expired'];
            if (!deletableStatuses.includes(booking.status)) {
                return res.status(400).json({
                    success: false,
                    error: 'CANNOT_DELETE',
                    message: `Cannot delete advance booking with status: ${booking.status}. Only pending or expired bookings can be deleted.`
                });
            }

            // Delete the booking
            const deleted = await AdvanceBooking.delete(id, hotelId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'DELETE_FAILED',
                    message: 'Failed to delete advance booking'
                });
            }

            res.json({
                success: true,
                message: 'Advance booking deleted successfully',
                data: {
                    id: parseInt(id),
                    customer_name: booking.customer_name,
                    room_number: booking.room_number,
                    status: booking.status
                }
            });

        } catch (error) {
            console.error('❌ Delete advance booking error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: error.message || 'Internal server error'
            });
        }
    },

    // In advanceBookingController.js - Add this function

    // convertMultipleAdvanceBookings: async (req, res) => {
    //     try {
    //         const { bookings, groupBookingId, conversionPaymentMethod, conversionPaymentStatus } = req.body;
    //         const hotelId = req.user.hotel_id;
    //         const userId = req.user.userId;

    //         console.log('🔄 Converting multiple advance bookings to regular bookings:', {
    //             count: bookings?.length || 0,
    //             groupBookingId,
    //             conversionPaymentMethod,
    //             hotelId
    //         });

    //         if (!bookings || bookings.length === 0) {
    //             return res.status(400).json({
    //                 success: false,
    //                 error: 'NO_BOOKINGS',
    //                 message: 'No bookings provided for conversion'
    //             });
    //         }

    //         const results = [];
    //         const errors = [];

    //         // Process each booking conversion
    //         for (const bookingData of bookings) {
    //             try {
    //                 const advanceBookingId = bookingData.advance_booking_id;

    //                 if (!advanceBookingId) {
    //                     console.log('⚠️ No advance_booking_id for room:', bookingData.room_id);
    //                     errors.push({
    //                         room_id: bookingData.room_id,
    //                         error: 'NO_ADVANCE_ID',
    //                         message: 'No advance booking ID provided'
    //                     });
    //                     continue;
    //                 }

    //                 console.log(`🔄 Converting advance booking ${advanceBookingId} for room ${bookingData.room_id}`);

    //                 // 1. Get the advance booking details
    //                 const advanceBooking = await AdvanceBooking.findById(advanceBookingId, hotelId);

    //                 if (!advanceBooking) {
    //                     console.log(`❌ Advance booking ${advanceBookingId} not found`);
    //                     errors.push({
    //                         room_id: bookingData.room_id,
    //                         advance_booking_id: advanceBookingId,
    //                         error: 'ADVANCE_NOT_FOUND',
    //                         message: 'Advance booking not found'
    //                     });
    //                     continue;
    //                 }

    //                 console.log(`📋 Found advance booking:`, {
    //                     id: advanceBooking.id,
    //                     status: advanceBooking.status,
    //                     room_number: advanceBooking.room_number,
    //                     advance_amount: advanceBooking.advance_amount
    //                 });

    //                 // 2. Validate advance booking status
    //                 if (advanceBooking.status === 'converted') {
    //                     errors.push({
    //                         room_id: bookingData.room_id,
    //                         advance_booking_id: advanceBookingId,
    //                         error: 'ALREADY_CONVERTED',
    //                         message: 'This advance booking has already been converted'
    //                     });
    //                     continue;
    //                 }

    //                 if (advanceBooking.status !== 'confirmed' && advanceBooking.status !== 'pending') {
    //                     errors.push({
    //                         room_id: bookingData.room_id,
    //                         advance_booking_id: advanceBookingId,
    //                         error: 'INVALID_STATUS',
    //                         message: `Cannot convert advance booking with status: ${advanceBooking.status}`
    //                     });
    //                     continue;
    //                 }

    //                 // 3. Check room availability
    //                 const isAvailable = await Booking.checkRoomAvailability(
    //                     advanceBooking.room_id,
    //                     hotelId,
    //                     advanceBooking.from_date || bookingData.from_date,
    //                     advanceBooking.to_date || bookingData.to_date,
    //                     null,
    //                     'booked'
    //                 );

    //                 if (!isAvailable) {
    //                     errors.push({
    //                         room_id: bookingData.room_id,
    //                         advance_booking_id: advanceBookingId,
    //                         error: 'ROOM_NOT_AVAILABLE',
    //                         message: `Room ${advanceBooking.room_number} is no longer available for selected dates`
    //                     });
    //                     continue;
    //                 }

    //                 // 4. Calculate amounts
    //                 const fullTotal = parseFloat(advanceBooking.total) || parseFloat(bookingData.total) || 0;
    //                 const advancePaid = parseFloat(advanceBooking.advance_amount) || parseFloat(bookingData.advance_amount_paid) || 0;
    //                 const remainingAmount = fullTotal - advancePaid;

    //                 // 5. Use provided payment method or fallback
    //                 const paymentMethod = conversionPaymentMethod || bookingData.payment_method || advanceBooking.payment_method || 'cash';
    //                 const paymentStatus = remainingAmount <= 0 ? 'completed' : (conversionPaymentStatus || bookingData.payment_status || 'pending');

    //                 console.log(`💰 Amount calculation for booking ${advanceBookingId}:`, {
    //                     fullTotal,
    //                     advancePaid,
    //                     remainingAmount,
    //                     paymentMethod,
    //                     paymentStatus
    //                 });

    //                 // 6. Prepare booking data
    //                 const regularBookingData = {
    //                     hotel_id: hotelId,
    //                     room_id: advanceBooking.room_id,
    //                     customer_id: advanceBooking.customer_id,
    //                     advance_booking_id: advanceBooking.id,
    //                     group_booking_id: groupBookingId,
    //                     from_date: advanceBooking.from_date || bookingData.from_date,
    //                     to_date: advanceBooking.to_date || bookingData.to_date,
    //                     from_time: advanceBooking.from_time || bookingData.from_time || '14:00',
    //                     to_time: advanceBooking.to_time || bookingData.to_time || '12:00',
    //                     amount: parseFloat(advanceBooking.amount) || parseFloat(bookingData.amount) || 0,
    //                     service: parseFloat(advanceBooking.service) || parseFloat(bookingData.service) || 0,
    //                     cgst: parseFloat(advanceBooking.cgst) || parseFloat(bookingData.cgst) || 0,
    //                     sgst: parseFloat(advanceBooking.sgst) || parseFloat(bookingData.sgst) || 0,
    //                     igst: parseFloat(advanceBooking.igst) || parseFloat(bookingData.igst) || 0,
    //                     total: fullTotal,
    //                     advance_amount_paid: advancePaid,
    //                     remaining_amount: Math.max(0, remainingAmount),
    //                     status: 'booked',
    //                     guests: advanceBooking.guests || bookingData.guests || 1,
    //                     special_requests: advanceBooking.special_requests || bookingData.special_requests || '',
    //                     id_type: advanceBooking.id_type || bookingData.id_type || 'aadhaar',
    //                     payment_method: paymentMethod,
    //                     payment_status: paymentStatus,
    //                     transaction_id: advanceBooking.transaction_id || bookingData.transaction_id || null,
    //                     referral_by: advanceBooking.referral_by || bookingData.referral_by || '',
    //                     referral_amount: parseFloat(advanceBooking.referral_amount) || parseFloat(bookingData.referral_amount) || 0,
    //                     invoice_number: await Booking.getNextInvoiceNumber(hotelId)
    //                 };

    //                 // 7. Create the regular booking
    //                 const bookingId = await Booking.create(regularBookingData);
    //                 console.log(`✅ Created booking ${bookingId} for advance ${advanceBookingId}`);

    //                 // 8. Create collection for cash payment
    //                 if (advancePaid > 0 && paymentMethod === 'cash') {
    //                     try {
    //                         const Collection = require('../models/Collection');
    //                         await Collection.createFromCashBooking(bookingId, hotelId, userId);
    //                         console.log(`💰 Collection created for booking ${bookingId}`);
    //                     } catch (collectionError) {
    //                         console.error('Collection creation error:', collectionError);
    //                     }
    //                 }

    //                 // 9. Create transaction for online payment
    //                 if (paymentMethod === 'online' && advancePaid > 0) {
    //                     try {
    //                         const Transaction = require('../models/Transaction');
    //                         const transactionId = advanceBooking.transaction_id || `TXN-CONV-${Date.now()}-${advanceBookingId}`;

    //                         await Transaction.create({
    //                             hotel_id: hotelId,
    //                             booking_id: bookingId,
    //                             advance_booking_id: advanceBooking.id,
    //                             customer_id: advanceBooking.customer_id,
    //                             transaction_id: transactionId,
    //                             amount: advancePaid,
    //                             currency: 'INR',
    //                             payment_method: 'online',
    //                             payment_gateway: 'upi',
    //                             status: 'success',
    //                             status_message: 'Advance payment transferred from advance booking',
    //                             metadata: {
    //                                 is_group_conversion: true,
    //                                 group_booking_id: groupBookingId,
    //                                 original_advance_booking_id: advanceBooking.id,
    //                                 room_number: advanceBooking.room_number
    //                             }
    //                         });
    //                         console.log(`💰 Transaction created for booking ${bookingId}`);
    //                     } catch (transactionError) {
    //                         console.error('Transaction creation error:', transactionError);
    //                     }
    //                 }

    //                 // 10. CRITICAL: Update advance booking status to 'converted'
    //                 await AdvanceBooking.update(advanceBookingId, hotelId, {
    //                     status: 'converted',
    //                     payment_status: 'completed',
    //                     remaining_amount: 0,
    //                     booking_id: bookingId,
    //                     converted_by: userId,
    //                     converted_at: new Date(),
    //                     notes: (advanceBooking.notes || '') + '\n[System] Converted to regular booking via group conversion on ' + new Date().toLocaleDateString()
    //                 });

    //                 // Also call the convertToBooking method for any additional logic
    //                 await AdvanceBooking.convertToBooking(advanceBookingId, hotelId, bookingId, userId);

    //                 // 11. Update room status
    //                 const Room = require('../models/Room');
    //                 await Room.updateStatus(advanceBooking.room_id, hotelId, 'booked');

    //                 results.push({
    //                     success: true,
    //                     advance_booking_id: advanceBookingId,
    //                     booking_id: bookingId,
    //                     room_id: bookingData.room_id,
    //                     room_number: advanceBooking.room_number,
    //                     total: fullTotal,
    //                     advance_paid: advancePaid,
    //                     remaining_amount: Math.max(0, remainingAmount)
    //                 });

    //                 console.log(`✅ Successfully converted advance booking ${advanceBookingId} to booking ${bookingId}`);

    //             } catch (error) {
    //                 console.error('Error converting individual booking:', error);
    //                 errors.push({
    //                     room_id: bookingData.room_id,
    //                     advance_booking_id: bookingData.advance_booking_id,
    //                     error: error.message
    //                 });
    //             }
    //         }

    //         // Send notifications for successful conversions (optional, can be done asynchronously)
    //         if (results.length > 0) {
    //             console.log(`✅ Successfully converted ${results.length} advance bookings, ${errors.length} failed`);
    //         }

    //         // Return response
    //         res.json({
    //             success: true,
    //             message: `Converted ${results.length} of ${bookings.length} advance bookings`,
    //             data: {
    //                 successful: results,
    //                 failed: errors,
    //                 groupBookingId,
    //                 totalSuccess: results.length,
    //                 totalFailed: errors.length
    //             }
    //         });

    //     } catch (error) {
    //         console.error('❌ Convert multiple advance bookings error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: 'Internal server error: ' + error.message
    //         });
    //     }
    // },
    // In advanceBookingController.js - Update convertMultipleAdvanceBookings

convertMultipleAdvanceBookings: async (req, res) => {
    try {
        const { bookings, groupBookingId, conversionPaymentMethod, conversionPaymentStatus } = req.body;
        const hotelId = req.user.hotel_id;
        const userId = req.user.userId;

        console.log('🔄 Converting multiple advance bookings with EDITED values:', {
            count: bookings?.length || 0,
            groupBookingId,
            conversionPaymentMethod,
            hotelId
        });

        if (!bookings || bookings.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'NO_BOOKINGS',
                message: 'No bookings provided for conversion'
            });
        }

        const results = [];
        const errors = [];

        for (const bookingData of bookings) {
            try {
                const advanceBookingId = bookingData.advance_booking_id;

                if (!advanceBookingId) {
                    errors.push({
                        room_id: bookingData.room_id,
                        error: 'NO_ADVANCE_ID',
                        message: 'No advance booking ID provided'
                    });
                    continue;
                }

                console.log(`🔄 Converting advance booking ${advanceBookingId} for room ${bookingData.room_id}`);
                console.log(`📝 Received booking data:`, {
                    from_date: bookingData.from_date,
                    to_date: bookingData.to_date,
                    amount: bookingData.amount,
                    total: bookingData.total,
                    advance_amount_paid: bookingData.advance_amount_paid
                });

                // Get the advance booking details for reference
                const advanceBooking = await AdvanceBooking.findById(advanceBookingId, hotelId);

                if (!advanceBooking) {
                    errors.push({
                        room_id: bookingData.room_id,
                        advance_booking_id: advanceBookingId,
                        error: 'ADVANCE_NOT_FOUND',
                        message: 'Advance booking not found'
                    });
                    continue;
                }

                console.log(`📋 Original advance booking:`, {
                    id: advanceBooking.id,
                    status: advanceBooking.status,
                    room_number: advanceBooking.room_number,
                    advance_amount: advanceBooking.advance_amount,
                    from_date: advanceBooking.from_date,
                    to_date: advanceBooking.to_date,
                    amount: advanceBooking.amount
                });

                if (advanceBooking.status === 'converted') {
                    errors.push({
                        room_id: bookingData.room_id,
                        advance_booking_id: advanceBookingId,
                        error: 'ALREADY_CONVERTED',
                        message: 'This advance booking has already been converted'
                    });
                    continue;
                }

                if (advanceBooking.status !== 'confirmed' && advanceBooking.status !== 'pending') {
                    errors.push({
                        room_id: bookingData.room_id,
                        advance_booking_id: advanceBookingId,
                        error: 'INVALID_STATUS',
                        message: `Cannot convert advance booking with status: ${advanceBooking.status}`
                    });
                    continue;
                }

                // CRITICAL: Use EDITED dates from bookingData, NOT from advance booking
                const finalFromDate = bookingData.from_date || advanceBooking.from_date;
                const finalToDate = bookingData.to_date || advanceBooking.to_date;

                // Check room availability with EDITED dates
                const isAvailable = await Booking.checkRoomAvailability(
                    advanceBooking.room_id,
                    hotelId,
                    finalFromDate,
                    finalToDate,
                    null,
                    'booked',
                    bookingData.from_time || advanceBooking.from_time || '14:00',
                    bookingData.to_time || advanceBooking.to_time || '12:00'
                );

                if (!isAvailable) {
                    errors.push({
                        room_id: bookingData.room_id,
                        advance_booking_id: advanceBookingId,
                        error: 'ROOM_NOT_AVAILABLE',
                        message: `Room ${advanceBooking.room_number} is not available for selected dates (${finalFromDate} to ${finalToDate})`
                    });
                    continue;
                }

                // CRITICAL: Use EDITED amounts from bookingData, NOT from advance booking
                const fullTotal = parseFloat(bookingData.total) || 0;
                const advancePaid = parseFloat(advanceBooking.advance_amount) || 0;  // Keep original advance paid
                const editedAmount = parseFloat(bookingData.amount) || 0;
                const editedService = parseFloat(bookingData.service) || 0;
                const editedCgst = parseFloat(bookingData.cgst) || 0;
                const editedSgst = parseFloat(bookingData.sgst) || 0;
                const editedIgst = parseFloat(bookingData.igst) || 0;
                
                // Calculate remaining amount based on EDITED total
                const remainingAmount = fullTotal - advancePaid;

                const paymentMethod = conversionPaymentMethod || bookingData.payment_method || 'cash';
                const paymentStatus = remainingAmount <= 0 ? 'completed' : (conversionPaymentStatus || bookingData.payment_status || 'pending');

                console.log(`💰 Amount calculation with EDITED values:`, {
                    editedAmount,
                    editedService,
                    editedCgst,
                    editedSgst,
                    editedIgst,
                    fullTotal,
                    advancePaid,
                    remainingAmount,
                    originalAdvanceAmount: advanceBooking.amount,
                    paymentMethod,
                    paymentStatus
                });

                // CRITICAL: Create booking with EDITED values
                const regularBookingData = {
                    hotel_id: hotelId,
                    room_id: advanceBooking.room_id,
                    customer_id: advanceBooking.customer_id,
                    advance_booking_id: advanceBooking.id,
                    group_booking_id: groupBookingId,
                    from_date: finalFromDate,  // EDITED date
                    to_date: finalToDate,      // EDITED date
                    from_time: bookingData.from_time || advanceBooking.from_time || '14:00',
                    to_time: bookingData.to_time || advanceBooking.to_time || '12:00',
                    amount: editedAmount,      // EDITED amount
                    service: editedService,    // EDITED service charge
                    cgst: editedCgst,          // EDITED CGST
                    sgst: editedSgst,          // EDITED SGST
                    igst: editedIgst,          // EDITED IGST
                    total: fullTotal,          // EDITED total
                    advance_amount_paid: advancePaid,
                    remaining_amount: Math.max(0, remainingAmount),
                    status: 'booked',
                    guests: bookingData.guests || advanceBooking.guests || 1,
                    special_requests: bookingData.special_requests || advanceBooking.special_requests || '',
                    id_type: bookingData.id_type || advanceBooking.id_type || 'aadhaar',
                    payment_method: paymentMethod,
                    payment_status: paymentStatus,
                    transaction_id: advanceBooking.transaction_id || null,
                    referral_by: bookingData.referral_by || advanceBooking.referral_by || '',
                    referral_amount: parseFloat(bookingData.referral_amount) || parseFloat(advanceBooking.referral_amount) || 0,
                    invoice_number: await Booking.getNextInvoiceNumber(hotelId),
                    // Add original amount for tracking
                    original_amount: parseFloat(advanceBooking.amount) || 0
                };

                // Create the regular booking with EDITED values
                const bookingId = await Booking.create(regularBookingData);
                console.log(`✅ Created booking ${bookingId} with EDITED values`);

                // Update advance booking status to converted
                await AdvanceBooking.update(advanceBookingId, hotelId, {
                    status: 'converted',
                    payment_status: 'completed',
                    remaining_amount: 0,
                    booking_id: bookingId,
                    converted_by: userId,
                    converted_at: new Date(),
                    notes: (advanceBooking.notes || '') + 
                        `\n[System] Converted to regular booking on ${new Date().toLocaleDateString()} with EDITED values: ` +
                        `Amount: ₹${editedAmount}, Dates: ${finalFromDate} to ${finalToDate}`
                });

                await AdvanceBooking.convertToBooking(advanceBookingId, hotelId, bookingId, userId);

                // Update room status
                const Room = require('../models/Room');
                await Room.updateStatus(advanceBooking.room_id, hotelId, 'booked');

                results.push({
                    success: true,
                    advance_booking_id: advanceBookingId,
                    booking_id: bookingId,
                    room_id: bookingData.room_id,
                    room_number: advanceBooking.room_number,
                    total: fullTotal,
                    advance_paid: advancePaid,
                    remaining_amount: Math.max(0, remainingAmount),
                    edited_dates: {
                        from_date: finalFromDate,
                        to_date: finalToDate
                    },
                    edited_amount: editedAmount
                });

                console.log(`✅ Successfully converted advance booking ${advanceBookingId} with EDITED values`);

            } catch (error) {
                console.error('Error converting individual booking:', error);
                errors.push({
                    room_id: bookingData.room_id,
                    advance_booking_id: bookingData.advance_booking_id,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Converted ${results.length} of ${bookings.length} advance bookings`,
            data: {
                successful: results,
                failed: errors,
                groupBookingId,
                totalSuccess: results.length,
                totalFailed: errors.length
            }
        });

    } catch (error) {
        console.error('❌ Convert multiple advance bookings error:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error: ' + error.message
        });
    }
},
};

module.exports = advanceBookingController;