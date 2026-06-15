const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Room = require('../models/Room');
const { pool } = require('../config/database');

const quotationController = {
    // Create new quotation - UPDATED
    // In controllers/quotationController.js - createQuotation method
    createQuotation: async (req, res) => {
        try {
            const {
                room_id,
                room_number,
                customer_id,
                from_date,
                to_date,
                from_time,
                to_time,
                nights,
                guests,
                room_price,
                service_charge,
                gst,
                other_expenses,
                total_amount,
                customer_name,
                customer_phone,
                customer_email,
                customer_address,
                special_requests,
                purpose_of_visit,
                terms_and_conditions,
                validity_days,
                payment_terms,
                notes,
                created_by
            } = req.body;

            // Get these from auth middleware
            const hotelId = req.user.hotel_id;
            const userId = created_by || req.user.userId;

            console.log('📝 Creating quotation with:', {
                hotelId,
                room_id,
                room_number,
                from_date,
                to_date,
                customer_name
            });

            // Validate required fields
            if (!room_id) {
                return res.status(400).json({
                    success: false,
                    error: 'ROOM_ID_REQUIRED',
                    message: 'Room ID is required for availability check'
                });
            }

            if (!from_date || !to_date) {
                return res.status(400).json({
                    success: false,
                    error: 'DATES_REQUIRED',
                    message: 'Check-in and check-out dates are required'
                });
            }

            // Check date validity
            const fromDate = new Date(from_date);
            const toDate = new Date(to_date);

            if (fromDate >= toDate) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_DATES',
                    message: 'Check-out date must be after check-in date'
                });
            }

            // Check room availability
            console.log('🔍 Checking availability before creating quotation...');
            const availability = await Quotation.checkAvailability(
                hotelId,
                room_id,      // Use room_id for checking
                room_number,  // room_number for reference
                from_date,
                to_date
            );

            console.log('📊 Availability result:', {
                available: availability.available,
                conflictingBookingsCount: availability.conflictingBookings?.length || 0,
                conflictingQuotationsCount: availability.conflictingQuotations?.length || 0
            });

            if (!availability.available) {
                let message = 'Room is not available for the selected dates';
                let conflictingType = '';

                if (availability.conflictingBookings?.length > 0) {
                    conflictingType = 'bookings';
                    const booking = availability.conflictingBookings[0];
                    message = `Room is already ${booking.status} from ${booking.from_date} to ${booking.to_date}`;
                } else if (availability.conflictingQuotations?.length > 0) {
                    conflictingType = 'quotations';
                    const quotation = availability.conflictingQuotations[0];
                    message = `Quotation ${quotation.quotation_number} already exists for these dates (Status: ${quotation.status})`;
                }

                return res.status(400).json({
                    success: false,
                    error: 'ROOM_NOT_AVAILABLE',
                    message,
                    data: {
                        conflictingType,
                        conflictingBookings: availability.conflictingBookings,
                        conflictingQuotations: availability.conflictingQuotations
                    }
                });
            }

            // Calculate expiry date
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + (validity_days || 7));

            const quotationData = {
                hotel_id: hotelId,
                room_id: room_id,
                room_number: room_number || null,
                customer_id: customer_id || null,
                from_date,
                to_date,
                from_time: from_time || '14:00',
                to_time: to_time || '12:00',
                nights: nights || 1,
                guests: guests || 1,
                room_price: parseFloat(room_price) || 0,
                service_charge: parseFloat(service_charge) || 0,
                gst: parseFloat(gst) || 0,
                other_expenses: parseFloat(other_expenses) || 0,
                total_amount: parseFloat(total_amount) || 0,
                customer_name,
                customer_phone,
                customer_email: customer_email || '',
                customer_address: customer_address || '',
                special_requests: special_requests || '',
                purpose_of_visit: purpose_of_visit || '',
                terms_and_conditions: terms_and_conditions || 'Standard terms apply',
                validity_days: validity_days || 7,
                expiry_date: expiryDate.toISOString().split('T')[0],
                status: 'pending',
                payment_terms: payment_terms || '50% advance, 50% on check-in',
                notes: notes || '',
                created_by: userId
            };

            console.log('📝 Creating quotation with data:', quotationData);
            const result = await Quotation.create(quotationData);

            console.log('✅ Quotation created successfully:', result);

            res.status(201).json({
                success: true,
                message: 'Quotation created successfully',
                data: {
                    quotationId: result.id,
                    quotationNumber: result.quotation_number,
                    expiryDate: expiryDate.toISOString().split('T')[0],
                    roomNumber: room_number,
                    from_date,
                    to_date,
                    total_amount: parseFloat(total_amount) || 0
                }
            });

        } catch (error) {
            console.error('❌ Create quotation error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Check room availability for quotation
    checkAvailability: async (req, res) => {
        try {
            const { room_id, room_number, from_date, to_date } = req.body;
            const hotelId = req.user.hotel_id;

            if (!from_date || !to_date) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_DATES',
                    message: 'Check-in and check-out dates are required'
                });
            }

            const availability = await Quotation.checkAvailability(
                hotelId,
                room_id,
                room_number,
                from_date,
                to_date
            );

            res.json({
                success: true,
                data: availability
            });

        } catch (error) {
            console.error('❌ Check availability error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Get all quotations - UPDATED TO INCLUDE ROOM SEARCH
    // In quotationController.js - getQuotations method
getQuotations: async (req, res) => {
    try {
        const hotelId = req.user.hotel_id;
        const { status, search, room_number } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (search) filters.search = search;
        if (room_number) filters.room_number = room_number;

        const quotations = await Quotation.findByHotel(hotelId, filters);

        // Remove duplicates by ID
        const uniqueQuotations = [];
        const seenIds = new Set();
        
        quotations.forEach(quotation => {
            if (!seenIds.has(quotation.id)) {
                seenIds.add(quotation.id);
                uniqueQuotations.push(quotation);
            }
        });

        console.log(`📊 Found ${quotations.length} quotations, returning ${uniqueQuotations.length} unique`);

        res.json({
            success: true,
            data: uniqueQuotations,
            count: uniqueQuotations.length,
            total: quotations.length // Optional: show total including duplicates
        });

    } catch (error) {
        console.error('❌ Get quotations error:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
},

    // Get single quotation - UPDATED
    getQuotation: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            const quotation = await Quotation.findById(id, hotelId);

            if (!quotation) {
                return res.status(404).json({
                    success: false,
                    error: 'QUOTATION_NOT_FOUND',
                    message: 'Quotation not found'
                });
            }

            res.json({
                success: true,
                data: quotation
            });

        } catch (error) {
            console.error('❌ Get quotation error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Update quotation
    updateQuotation: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;
            const updateData = req.body;

            const updated = await Quotation.update(id, hotelId, updateData);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    error: 'QUOTATION_NOT_FOUND',
                    message: 'Quotation not found or not updated'
                });
            }

            res.json({
                success: true,
                message: 'Quotation updated successfully'
            });

        } catch (error) {
            console.error('❌ Update quotation error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Delete quotation
    deleteQuotation: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            // Check if quotation has been converted
            const quotation = await Quotation.findById(id, hotelId);
            if (quotation && quotation.status === 'converted') {
                return res.status(400).json({
                    success: false,
                    error: 'QUOTATION_CONVERTED',
                    message: 'Cannot delete a quotation that has been converted to booking'
                });
            }

            const deleted = await Quotation.delete(id, hotelId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'QUOTATION_NOT_FOUND',
                    message: 'Quotation not found'
                });
            }

            res.json({
                success: true,
                message: 'Quotation deleted successfully'
            });

        } catch (error) {
            console.error('❌ Delete quotation error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error'
            });
        }
    },

    // Convert quotation to booking - UPDATED WITH ROOM_NUMBER
    convertToBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;
            const {
                payment_method = 'cash',
                payment_status = 'pending',
                transaction_id = null
            } = req.body;

            // Get quotation details
            const quotation = await Quotation.findById(id, hotelId);

            if (!quotation) {
                return res.status(404).json({
                    success: false,
                    error: 'QUOTATION_NOT_FOUND',
                    message: 'Quotation not found'
                });
            }

            if (quotation.status === 'converted') {
                return res.status(400).json({
                    success: false,
                    error: 'ALREADY_CONVERTED',
                    message: 'Quotation has already been converted to a booking',
                    data: { booking_id: quotation.converted_to_booking_id }
                });
            }

            // Check if expiry date has passed
            const today = new Date();
            const expiryDate = new Date(quotation.expiry_date);
            if (today > expiryDate && quotation.status !== 'accepted') {
                return res.status(400).json({
                    success: false,
                    error: 'QUOTATION_EXPIRED',
                    message: 'Quotation has expired'
                });
            }

            // Check room availability using room_number
            const roomNumber = quotation.room_number;
            let roomId = quotation.room_id;

            // If we have room_number but no room_id, try to find room by number
            if (!roomId && roomNumber) {
                const [rooms] = await pool.execute(
                    `SELECT id FROM rooms WHERE hotel_id = ? AND room_number = ?`,
                    [hotelId, roomNumber]
                );
                if (rooms.length > 0) {
                    roomId = rooms[0].id;
                }
            }

            // Check availability (exclude_booking_id must be a booking id or null)
            const isAvailable = await Booking.checkRoomAvailability(
                roomId,
                hotelId,
                quotation.from_date,
                quotation.to_date,
                null,
                'booked',
                quotation.from_time || '14:00',
                quotation.to_time || '12:00'
            );

            if (!isAvailable) {
                return res.status(400).json({
                    success: false,
                    error: 'ROOM_NOT_AVAILABLE',
                    message: 'Room is no longer available for the selected dates'
                });
            }

            // Create or find customer
            let customerId = quotation.customer_id;

            if (!customerId && quotation.customer_phone) {
                const existingCustomer = await Customer.findByPhone(quotation.customer_phone, hotelId);

                if (existingCustomer) {
                    customerId = existingCustomer.id;
                    // Update customer details if needed
                    await Customer.update(customerId, hotelId, {
                        name: quotation.customer_name,
                        email: quotation.customer_email || '',
                        address: quotation.customer_address || ''
                    });
                } else {
                    // Create new customer
                    customerId = await Customer.create({
                        hotel_id: hotelId,
                        name: quotation.customer_name,
                        phone: quotation.customer_phone,
                        email: quotation.customer_email || '',
                        id_number: '',
                        id_type: 'aadhaar',
                        address: quotation.customer_address || '',
                        payment_method: payment_method,
                        payment_status: payment_status
                    });
                }
            }

            // Create booking from quotation
            const bookingData = {
                hotel_id: hotelId,
                room_id: roomId,
                room_number: roomNumber, // Include room_number
                customer_id: customerId,
                from_date: quotation.from_date,
                to_date: quotation.to_date,
                from_time: quotation.from_time,
                to_time: quotation.to_time,
                amount: quotation.room_price,
                service: quotation.service_charge,
                gst: quotation.gst,
                total: quotation.total_amount,
                guests: quotation.guests,
                special_requests: quotation.special_requests,
                id_type: 'aadhaar',
                payment_method: payment_method,
                payment_status: payment_status,
                transaction_id: transaction_id,
                referral_by: quotation.referral_by || '',
                referral_amount: quotation.referral_amount || 0,
                purpose_of_visit: quotation.purpose_of_visit || '',
                other_expenses: quotation.other_expenses || 0,
                expense_description: quotation.expense_description || '',
                quotation_id: quotation.id // Link booking to quotation
            };

            const bookingId = await Booking.create(bookingData);

            // Update room status if we have roomId
            if (roomId) {
                await Room.updateStatus(roomId, hotelId, 'booked');
            }

            // Update quotation status
            await Quotation.convertToBooking(id, hotelId, { booking_id: bookingId });

            res.status(201).json({
                success: true,
                message: 'Quotation successfully converted to booking',
                data: {
                    quotationId: quotation.id,
                    bookingId: bookingId,
                    bookingDetails: {
                        room_number: roomNumber,
                        from_date: quotation.from_date,
                        to_date: quotation.to_date,
                        total_amount: quotation.total_amount,
                        payment_method: payment_method
                    }
                }
            });

        } catch (error) {
            console.error('❌ Convert quotation error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },


    // Generate quotation PDF/HTML
    generateQuotationDocument: async (req, res) => {
        try {
            const { id } = req.params;
            const hotelId = req.user.hotel_id;

            const quotation = await Quotation.findById(id, hotelId);

            if (!quotation) {
                return res.status(404).json({
                    success: false,
                    error: 'QUOTATION_NOT_FOUND',
                    message: 'Quotation not found'
                });
            }

            // Get hotel details
            const [hotelRows] = await pool.execute(
                `SELECT h.*, u.phone as hotel_phone, u.email as hotel_email 
         FROM hotels h
         LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
         WHERE h.id = ? LIMIT 1`,
                [hotelId]
            );

            const hotelDetails = hotelRows[0] || {};

            // Format dates
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            };

            // Calculate days until expiry
            const today = new Date();
            const expiryDate = new Date(quotation.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            // Quotation data for document
            const quotationData = {
                quotationNumber: quotation.quotation_number,
                quotationDate: formatDate(quotation.created_at),
                expiryDate: formatDate(quotation.expiry_date),
                daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,

                hotel: {
                    name: hotelDetails.name || 'Hotel',
                    address: hotelDetails.address || '',
                    phone: hotelDetails.hotel_phone || hotelDetails.phone || '',
                    email: hotelDetails.hotel_email || hotelDetails.email || '',
                    gstin: hotelDetails.gst_number || ''
                },

                customer: {
                    name: quotation.customer_name,
                    phone: quotation.customer_phone,
                    email: quotation.customer_email,
                    address: quotation.customer_address
                },

                room: {
                    roomNumber: quotation.room_number || 'N/A',
                    roomType: quotation.room_type || 'Standard',
                    fromDate: formatDate(quotation.from_date),
                    toDate: formatDate(quotation.to_date),
                    fromTime: quotation.from_time,
                    toTime: quotation.to_time,
                    nights: quotation.nights || 1,
                    guests: quotation.guests || 1
                },

                charges: [
                    { description: `Room Charges (${quotation.nights} night(s))`, amount: quotation.room_price },
                    { description: 'Service Charges', amount: quotation.service_charge },
                    { description: 'GST', amount: quotation.gst },
                    ...(quotation.other_expenses > 0 ? [
                        { description: 'Other Expenses', amount: quotation.other_expenses }
                    ] : [])
                ],

                summary: {
                    subtotal: quotation.room_price + quotation.service_charge,
                    gst: quotation.gst,
                    otherExpenses: quotation.other_expenses,
                    total: quotation.total_amount
                },

                terms: {
                    payment: quotation.payment_terms || '50% advance, 50% on check-in',
                    validity: `Valid until: ${formatDate(quotation.expiry_date)}`,
                    specialRequests: quotation.special_requests || 'None',
                    notes: quotation.notes || ''
                }
            };

            res.json({
                success: true,
                message: 'Quotation document data generated',
                data: quotationData
            });

        } catch (error) {
            console.error('❌ Generate quotation document error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // Download quotation as HTML
    downloadQuotation: async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'html', autoprint = 'false' } = req.query;

        console.log('📥 Download request for quotation:', id);

        // Get quotation data
        const [quotationRows] = await pool.execute(
            `SELECT q.*, 
          h.name as hotel_name,
          h.address as hotel_address,
          u.phone as hotel_phone,
          u.email as hotel_email,        
          h.gst_number as hotel_gst
   FROM quotations q
   LEFT JOIN hotels h ON q.hotel_id = h.id
   LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'  
   WHERE q.id = ?`,
            [id]
        );

        const quotation = quotationRows[0];

        if (!quotation) {
            return res.status(404).json({
                success: false,
                error: 'QUOTATION_NOT_FOUND',
                message: 'Quotation not found'
            });
        }

        // Helper functions (keep your existing helper functions)
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        };

        const formatCurrency = (amount) => {
            return parseFloat(amount || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // Create HTML document with proper event handling
// Create HTML document
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation - ${quotation.quotation_number}</title>
  <style>
    /* For screen display */
    @media screen {
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        line-height: 1.5;
        color: #333;
      }
    }
    
    /* For printing - optimized for single page */
    @media print {
      @page {
        margin: 10mm;
        size: A4 portrait;
      }
      
      body {
        margin: 0;
        padding: 5mm;
        font-size: 11px;
        line-height: 1.2;
      }
      
      /* Prevent page breaks */
      .header, .document-title, .details-section, 
      .table, .terms-section, .footer {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Reduce all spacing */
      * {
        margin-top: 2px !important;
        margin-bottom: 2px !important;
      }
      
      /* Hide print button */
      .no-print {
        display: none !important;
      }
    }
    
    /* Common styles for both screen and print */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #2c3e50;
    }
    
    .company-info {
      flex: 1;
      font-size: 11px;
    }
    
    .quotation-info {
      text-align: right;
      flex: 1;
      font-size: 11px;
    }
    
    .company-name {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }
    
    .document-title {
      text-align: center;
      font-size: 20px;
      margin: 15px 0;
      color: #2c3e50;
      text-transform: uppercase;
    }
    
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      gap: 15px;
    }
    
    .details-box {
      flex: 1;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      font-size: 12px;
    }
    
    .details-label {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
      display: block;
      border-bottom: 1px solid #3498db;
      padding-bottom: 3px;
      font-size: 13px;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
    }
    
    .table th {
      background-color: #2c3e50;
      color: white;
      padding: 8px;
      text-align: left;
      font-size: 12px;
    }
    
    .table td {
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 12px;
    }
    
    .total-row {
      font-weight: bold;
      background-color: #e8f4fd;
    }
    
    .total-row td {
      border-top: 2px solid #3498db;
      font-size: 13px;
    }
    
    .terms-section {
      margin-top: 15px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
      font-size: 11px;
    }
    
    .footer {
      margin-top: 15px;
      text-align: center;
      font-size: 10px;
      color: #666;
      padding-top: 10px;
      border-top: 1px dashed #ddd;
    }
    
    .validity-badge {
      display: inline-block;
      padding: 3px 8px;
      background-color: ${quotation.status === 'expired' ? '#fee' : '#e8f4fd'};
      color: ${quotation.status === 'expired' ? '#c00' : '#2c3e50'};
      border-radius: 12px;
      font-weight: bold;
      margin-top: 5px;
      font-size: 10px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status-pending { background-color: #fff3cd; color: #856404; }
    .status-accepted { background-color: #d4edda; color: #155724; }
    .status-converted { background-color: #cce5ff; color: #004085; }
    .status-expired { background-color: #f8d7da; color: #721c24; }
    
    /* Extra compression for very long content */
    .compressed {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    @media print and (orientation: portrait) {
      /* Stack details boxes vertically to save horizontal space */
      .details-section {
        flex-direction: column;
      }
      
      .details-box {
        margin-bottom: 8px !important;
      }
      
      /* Reduce font sizes further if needed */
      body {
        font-size: 10px !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="company-name">${quotation.hotel_name || 'Hotel'}</div>
      <div>${quotation.hotel_address || ''}</div>
      <div>📞 ${quotation.hotel_phone || ''}</div>
      <div>📧 ${quotation.hotel_email || ''}</div>
      <div>🏷️ GSTIN: ${quotation.hotel_gst || 'N/A'}</div>
    </div>
    
    <div class="quotation-info">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">QUOTATION</div>
      <div><strong>Quotation No:</strong> ${quotation.quotation_number}</div>
      <div><strong>Date:</strong> ${formatDate(quotation.created_at)}</div>
      <div><strong>Valid Until:</strong> ${formatDate(quotation.expiry_date)}</div>
      <div class="status-badge status-${quotation.status}" style="margin-top: 3px;">
        ${quotation.status.toUpperCase()}
      </div>
    </div>
  </div>
  
  <div class="document-title">QUOTATION</div>
  
  <div class="details-section">
    <div class="details-box">
      <span class="details-label">Bill To:</span>
      <div style="font-size: 14px; margin-bottom: 5px;"><strong>${quotation.customer_name}</strong></div>
      <div style="margin-bottom: 3px;">📱 ${quotation.customer_phone}</div>
      <div style="margin-bottom: 3px;">📧 ${quotation.customer_email || 'No email'}</div>
      <div>📍 ${quotation.customer_address || 'No address'}</div>
    </div>
    
    <div class="details-box">
      <span class="details-label">Room Details:</span>
      <div style="margin-bottom: 5px;"><strong>Room:</strong> ${quotation.room_number} (${quotation.room_type || 'Standard'})</div>
      <div style="margin-bottom: 5px;"><strong>Check-in:</strong> ${formatDate(quotation.from_date)} at ${quotation.from_time}</div>
      <div style="margin-bottom: 5px;"><strong>Check-out:</strong> ${formatDate(quotation.to_date)} at ${quotation.to_time}</div>
      <div style="margin-bottom: 5px;"><strong>Duration:</strong> ${quotation.nights || 1} Night(s)</div>
      <div><strong>Guests:</strong> ${quotation.guests || 1}</div>
    </div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Room Charges (${quotation.nights || 1} night(s))</td>
        <td style="text-align: right;">${formatCurrency(quotation.room_price)}</td>
      </tr>
      <tr>
        <td>Service Charges</td>
        <td style="text-align: right;">${formatCurrency(quotation.service_charge)}</td>
      </tr>
      <tr>
        <td>GST</td>
        <td style="text-align: right;">${formatCurrency(quotation.gst)}</td>
      </tr>
      ${quotation.other_expenses > 0 ? `
        <tr>
          <td>Other Expenses</td>
          <td style="text-align: right;">${formatCurrency(quotation.other_expenses)}</td>
        </tr>
      ` : ''}
      <tr class="total-row">
        <td><strong>TOTAL AMOUNT (INR)</strong></td>
        <td style="text-align: right; font-size: 14px;">
          <strong>₹${formatCurrency(quotation.total_amount)}</strong>
        </td>
      </tr>
    </tbody>
  </table>
  
  <div class="terms-section">
    <div style="margin-bottom: 8px;">
      <strong>Payment Terms:</strong> ${quotation.payment_terms || '50% advance, 50% on check-in'}
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Special Requests:</strong> ${quotation.special_requests || 'None'}
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Notes:</strong> ${quotation.notes || ''}
    </div>
    
    <div>
      <strong>Quotation Validity:</strong> This quotation is valid until ${formatDate(quotation.expiry_date)}.
      ${quotation.status === 'expired' ?
                    '<div class="validity-badge">⚠️ QUOTATION EXPIRED</div>' :
                    ''}
    </div>
  </div>
  
  <div class="footer">
    <div style="margin-bottom: 10px;">
      <strong>Terms & Conditions:</strong><br>
      1. Prices subject to change<br>
      2. Valid for ${quotation.validity_days || 7} days<br>
      3. Booking confirmed on advance payment<br>
      4. Check-in: 14:00, Check-out: 12:00<br>
      5. Early/Late check-in/out charges apply
    </div>
    
    <div style="margin-top: 10px;">
      <div style="border-top: 1px solid #000; width: 150px; margin: 0 auto; padding-top: 5px;">
        <strong>Authorized Signature</strong>
      </div>
      <div style="margin-top: 2px; font-size: 10px;">
        For ${quotation.hotel_name || 'Hotel'}
      </div>
    </div>
    
    <div style="margin-top: 10px; font-size: 8px; color: #999;">
      <div>Computer-generated quotation</div>
      <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>
  
  <!-- Action buttons for browser view -->
  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button id="printBtn" style="padding: 8px 16px; background-color: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-size: 14px;">
      🖨️ Print Quotation
    </button>
    <button id="closeBtn" style="padding: 8px 16px; background-color: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
      ❌ Close
    </button>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const printBtn = document.getElementById('printBtn');
      if (printBtn) {
        printBtn.addEventListener('click', function() {
          window.print();
        });
      }
      
      const closeBtn = document.getElementById('closeBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          window.close();
        });
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const autoprint = urlParams.get('autoprint');
      
      if (autoprint === 'true') {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    });
  </script>
</body>
</html>`;

        // Send HTML response with proper headers
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
        res.send(htmlContent);

    } catch (error) {
        console.error('❌ Download quotation error:', error);
        res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1 style="color: red;">Error Generating Quotation</h1>
          <p>${error.message || 'Internal server error'}</p>
          <button id="errorCloseBtn">Close</button>
          <script>
            document.getElementById('errorCloseBtn').addEventListener('click', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    }
}

//     downloadQuotation: async (req, res) => {
//         try {
//             const { id } = req.params;
//             const { format = 'html', autoprint = 'false' } = req.query;

//             console.log('📥 Download request for quotation:', id);

//             // Get quotation data WITHOUT hotelId filter
//             // Get quotation data WITHOUT hotelId filter
//             const [quotationRows] = await pool.execute(
//                 `SELECT q.*, 
//           h.name as hotel_name,
//           h.address as hotel_address,
//           u.phone as hotel_phone,
//           u.email as hotel_email,        
//           h.gst_number as hotel_gst
//    FROM quotations q
//    LEFT JOIN hotels h ON q.hotel_id = h.id
//    LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'  
//    WHERE q.id = ?`,
//                 [id]
//             );

//             const quotation = quotationRows[0];

//             if (!quotation) {
//                 return res.status(404).json({
//                     success: false,
//                     error: 'QUOTATION_NOT_FOUND',
//                     message: 'Quotation not found'
//                 });
//             }

//             // Helper functions
//             const formatDate = (dateStr) => {
//                 if (!dateStr) return '';
//                 const date = new Date(dateStr);
//                 return date.toLocaleDateString('en-IN', {
//                     day: '2-digit',
//                     month: 'short',
//                     year: 'numeric'
//                 });
//             };

//             const formatCurrency = (amount) => {
//                 return parseFloat(amount || 0).toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2
//                 });
//             };

//             // Create HTML document
//             const htmlContent = `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8">
//   <title>Quotation - ${quotation.quotation_number}</title>
//   <style>
//     body {
//       font-family: Arial, sans-serif;
//       margin: 40px;
//       line-height: 1.6;
//       color: #333;
//     }
    
//     .header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: 30px;
//       padding-bottom: 20px;
//       border-bottom: 2px solid #2c3e50;
//     }
    
//     .company-info {
//       flex: 1;
//     }
    
//     .quotation-info {
//       text-align: right;
//       flex: 1;
//     }
    
//     .company-name {
//       font-size: 24px;
//       font-weight: bold;
//       color: #2c3e50;
//       margin-bottom: 10px;
//     }
    
//     .document-title {
//       text-align: center;
//       font-size: 28px;
//       margin: 30px 0;
//       color: #2c3e50;
//       text-transform: uppercase;
//     }
    
//     .details-section {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: 30px;
//       gap: 30px;
//     }
    
//     .details-box {
//       flex: 1;
//       padding: 20px;
//       background-color: #f8f9fa;
//       border-radius: 8px;
//       border: 1px solid #e0e0e0;
//     }
    
//     .details-label {
//       font-weight: bold;
//       color: #2c3e50;
//       margin-bottom: 10px;
//       display: block;
//       border-bottom: 2px solid #3498db;
//       padding-bottom: 5px;
//     }
    
//     .table {
//       width: 100%;
//       border-collapse: collapse;
//       margin: 30px 0;
//     }
    
//     .table th {
//       background-color: #2c3e50;
//       color: white;
//       padding: 12px;
//       text-align: left;
//     }
    
//     .table td {
//       padding: 12px;
//       border-bottom: 1px solid #e0e0e0;
//     }
    
//     .total-row {
//       font-weight: bold;
//       background-color: #e8f4fd;
//     }
    
//     .total-row td {
//       border-top: 2px solid #3498db;
//       font-size: 16px;
//     }
    
//     .terms-section {
//       margin-top: 40px;
//       padding: 20px;
//       background-color: #f8f9fa;
//       border-radius: 8px;
//     }
    
//     .footer {
//       margin-top: 50px;
//       text-align: center;
//       font-size: 12px;
//       color: #666;
//       padding-top: 20px;
//       border-top: 1px dashed #ddd;
//     }
    
//     .validity-badge {
//       display: inline-block;
//       padding: 5px 15px;
//       background-color: ${quotation.status === 'expired' ? '#fee' : '#e8f4fd'};
//       color: ${quotation.status === 'expired' ? '#c00' : '#2c3e50'};
//       border-radius: 20px;
//       font-weight: bold;
//       margin-top: 10px;
//     }
    
//     .status-badge {
//       display: inline-block;
//       padding: 5px 15px;
//       border-radius: 20px;
//       font-size: 12px;
//       font-weight: bold;
//       text-transform: uppercase;
//     }
    
//     .status-pending { background-color: #fff3cd; color: #856404; }
//     .status-accepted { background-color: #d4edda; color: #155724; }
//     .status-converted { background-color: #cce5ff; color: #004085; }
//     .status-expired { background-color: #f8d7da; color: #721c24; }
    
//     @media print {
//       body { margin: 0; padding: 20px; }
//       .no-print { display: none; }
//     }
//   </style>
// </head>
// <body>
//   <div class="header">
//     <div class="company-info">
//       <div class="company-name">${quotation.hotel_name || 'Hotel'}</div>
//       <div>${quotation.hotel_address || ''}</div>
//       <div>📞 ${quotation.hotel_phone || ''}</div>
//       <div>📧 ${quotation.hotel_email || ''}</div>
//       <div>🏷️ GSTIN: ${quotation.hotel_gst || 'N/A'}</div>
//     </div>
    
//     <div class="quotation-info">
//       <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">QUOTATION</div>
//       <div><strong>Quotation No:</strong> ${quotation.quotation_number}</div>
//       <div><strong>Date:</strong> ${formatDate(quotation.created_at)}</div>
//       <div><strong>Valid Until:</strong> ${formatDate(quotation.expiry_date)}</div>
//       <div class="status-badge status-${quotation.status}">
//         ${quotation.status.toUpperCase()}
//       </div>
//     </div>
//   </div>
  
//   <div class="document-title">QUOTATION</div>
  
//   <div class="details-section">
//     <div class="details-box">
//       <span class="details-label">Bill To:</span>
//       <div style="font-size: 18px; margin-bottom: 10px;"><strong>${quotation.customer_name}</strong></div>
//       <div style="margin-bottom: 5px;">📱 ${quotation.customer_phone}</div>
//       <div style="margin-bottom: 5px;">📧 ${quotation.customer_email || 'No email'}</div>
//       <div>📍 ${quotation.customer_address || 'No address'}</div>
//     </div>
    
//     <div class="details-box">
//       <span class="details-label">Room Details:</span>
//       <div style="margin-bottom: 10px;"><strong>Room:</strong> ${quotation.room_number} (${quotation.room_type || 'Standard'})</div>
//       <div style="margin-bottom: 10px;"><strong>Check-in:</strong> ${formatDate(quotation.from_date)} at ${quotation.from_time}</div>
//       <div style="margin-bottom: 10px;"><strong>Check-out:</strong> ${formatDate(quotation.to_date)} at ${quotation.to_time}</div>
//       <div style="margin-bottom: 10px;"><strong>Duration:</strong> ${quotation.nights || 1} Night(s)</div>
//       <div><strong>Guests:</strong> ${quotation.guests || 1}</div>
//     </div>
//   </div>
  
//   <table class="table">
//     <thead>
//       <tr>
//         <th>Description</th>
//         <th style="text-align: right;">Amount (₹)</th>
//       </tr>
//     </thead>
//     <tbody>
//       <tr>
//         <td>Room Charges (${quotation.nights || 1} night(s))</td>
//         <td style="text-align: right;">${formatCurrency(quotation.room_price)}</td>
//       </tr>
//       <tr>
//         <td>Service Charges</td>
//         <td style="text-align: right;">${formatCurrency(quotation.service_charge)}</td>
//       </tr>
//       <tr>
//         <td>GST</td>
//         <td style="text-align: right;">${formatCurrency(quotation.gst)}</td>
//       </tr>
//       ${quotation.other_expenses > 0 ? `
//         <tr>
//           <td>Other Expenses</td>
//           <td style="text-align: right;">${formatCurrency(quotation.other_expenses)}</td>
//         </tr>
//       ` : ''}
//       <tr class="total-row">
//         <td><strong>TOTAL AMOUNT (INR)</strong></td>
//         <td style="text-align: right; font-size: 18px;">
//           <strong>₹${formatCurrency(quotation.total_amount)}</strong>
//         </td>
//       </tr>
//     </tbody>
//   </table>
  
//   <div class="terms-section">
//     <div style="margin-bottom: 15px;">
//       <strong>Payment Terms:</strong> ${quotation.payment_terms || '50% advance, 50% on check-in'}
//     </div>
    
//     <div style="margin-bottom: 15px;">
//       <strong>Special Requests:</strong> ${quotation.special_requests || 'None'}
//     </div>
    
//     <div style="margin-bottom: 15px;">
//       <strong>Notes:</strong> ${quotation.notes || ''}
//     </div>
    
//     <div>
//       <strong>Quotation Validity:</strong> This quotation is valid until ${formatDate(quotation.expiry_date)}.
//       ${quotation.status === 'expired' ?
//                     '<div class="validity-badge">⚠️ QUOTATION EXPIRED</div>' :
//                     ''}
//     </div>
//   </div>
  
//   <div class="footer">
//     <div style="margin-bottom: 20px;">
//       <strong>Terms & Conditions:</strong><br>
//       1. Prices are subject to change without prior notice<br>
//       2. Quotation validity: ${quotation.validity_days || 7} days from issue date<br>
//       3. Booking confirmed only upon receipt of advance payment<br>
//       4. Check-in time: 14:00, Check-out time: 12:00<br>
//       5. Early check-in/Late check-out charges may apply
//     </div>
    
//     <div style="margin-top: 30px;">
//       <div style="border-top: 2px solid #000; width: 250px; margin: 0 auto; padding-top: 10px;">
//         <strong>Authorized Signature</strong>
//       </div>
//       <div style="margin-top: 5px;">
//         For ${quotation.hotel_name || 'Hotel'}
//       </div>
//     </div>
    
//     <div style="margin-top: 40px; font-size: 11px; color: #999;">
//       <div>This is a computer-generated quotation. No signature required.</div>
//       <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
//     </div>
//   </div>
  
//   <!-- Action buttons for browser view -->
//   <div class="no-print" style="margin-top: 40px; text-align: center;">
//     <button onclick="window.print()" style="padding: 10px 20px; background-color: #2c3e50; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
//       🖨️ Print Quotation
//     </button>
//     <button onclick="window.close()" style="padding: 10px 20px; background-color: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
//       ❌ Close
//     </button>
//   </div>
  
//   ${autoprint === 'true' ? `
//     <script>
//       // Auto-print if specified in URL
//       setTimeout(() => {
//         window.print();
//       }, 1000);
//     </script>
//   ` : ''}
// </body>
// </html>`;

//             // Send HTML response
//             res.setHeader('Content-Type', 'text/html');
//             // res.setHeader('Content-Disposition', `inline; filename="quotation-${quotation.quotation_number}.html"`);
//             res.send(htmlContent);

//         } catch (error) {
//             console.error('❌ Download quotation error:', error);
//             res.status(500).send(`
//       <html>
//         <body style="font-family: Arial; padding: 40px;">
//           <h1 style="color: red;">Error Generating Quotation</h1>
//           <p>${error.message || 'Internal server error'}</p>
//           <button onclick="window.close()">Close</button>
//         </body>
//       </html>
//     `);
//         }
//     }
};

module.exports = quotationController;