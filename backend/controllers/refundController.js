// controllers/refundController.js - COMPLETE FIXED VERSION with arrow functions
const { pool } = require('../config/database');
const EmailService = require('../services/emailService');
const WhatsAppService = require('../services/whatsappService');

class RefundController {

    // Get cancellable bookings for a hotel
    getCancellableBookings = async (req, res) => {
        try {
            const hotelId = req.user.hotel_id;
            const {
                type,
                status,
                from_date,
                to_date,
                created_before_days,
                created_after_date,
                from_created_date,
                to_created_date,
                show_all = 'false'
            } = req.query;

            let results = {
                room_bookings: [],
                advance_bookings: [],
                function_bookings: []
            };

            // Get today's date for comparison
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            console.log('📅 Today\'s date:', todayStr);
            console.log('📊 Filter Request:', {
                type,
                created_before_days,
                from_created_date,
                to_created_date,
                show_all
            });

            // Check if we have custom date range parameters
            const hasCustomDateRange = from_created_date && to_created_date;
            const hasLastXDays = created_before_days && !isNaN(parseInt(created_before_days));

            // Calculate date threshold based on filter type
            let dateThreshold = null;
            let dateRangeStart = null;
            let dateRangeEnd = null;

            if (show_all !== 'true') {
                if (hasCustomDateRange) {
                    // Use custom date range
                    dateRangeStart = from_created_date;
                    dateRangeEnd = to_created_date;
                    console.log(`📅 Using custom date range: ${dateRangeStart} to ${dateRangeEnd}`);
                } else if (hasLastXDays) {
                    // Use last X days
                    const days = parseInt(created_before_days);
                    dateThreshold = new Date(today);
                    dateThreshold.setDate(today.getDate() - days);
                    dateThreshold.setHours(0, 0, 0, 0);
                    console.log(`📅 Using last ${days} days, from ${dateThreshold.toISOString().split('T')[0]} to ${todayStr}`);
                }
            }

            // 1. Room Bookings
            if (!type || type === 'room') {
                let roomQuery = `
                SELECT 
                    b.id as booking_id,
                    'room' as booking_type,
                    b.invoice_number,
                    b.customer_id,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    r.room_number,
                    b.from_date,
                    b.to_date,
                    b.total,
                    b.advance_amount_paid as advance_paid,
                    b.remaining_amount,
                    b.payment_method,
                    b.payment_status,
                    b.status,
                    b.created_at,
                    b.cancellation_reason,
                    DATEDIFF(CURDATE(), DATE(b.created_at)) as days_since_created
                FROM bookings b
                LEFT JOIN customers c ON b.customer_id = c.id
                LEFT JOIN rooms r ON b.room_id = r.id
                WHERE b.hotel_id = ?
                AND b.status NOT IN ('cancelled')
                AND b.from_date >= ?
            `;

                const params = [hotelId, todayStr];

                // Apply creation date filters
                if (show_all !== 'true') {
                    if (dateRangeStart && dateRangeEnd) {
                        roomQuery += ` AND DATE(b.created_at) >= ? AND DATE(b.created_at) <= ?`;
                        params.push(dateRangeStart, dateRangeEnd);
                        console.log(`✅ Room filter: created_at between ${dateRangeStart} and ${dateRangeEnd}`);
                    } else if (dateThreshold) {
                        roomQuery += ` AND DATE(b.created_at) >= ?`;
                        params.push(dateThreshold.toISOString().split('T')[0]);
                        console.log(`✅ Room filter: created_at >= ${dateThreshold.toISOString().split('T')[0]}`);
                    }
                }

                if (status && status !== 'all') {
                    roomQuery += ` AND b.status = ?`;
                    params.push(status);
                }

                if (from_date && to_date) {
                    roomQuery += ` AND b.from_date >= ? AND b.to_date <= ?`;
                    params.push(from_date, to_date);
                }

                roomQuery += ` ORDER BY b.created_at DESC`;

                const [roomBookings] = await pool.execute(roomQuery, params);

                const validRoomBookings = roomBookings.filter(booking => {
                    const checkInDate = new Date(booking.from_date);
                    const todayDate = new Date(todayStr);
                    return checkInDate >= todayDate;
                });

                results.room_bookings = validRoomBookings;
                console.log(`📊 Room bookings: ${validRoomBookings.length} (filtered from ${roomBookings.length})`);
            }

            // 2. Advance Bookings
            if (!type || type === 'advance') {
                let advanceQuery = `
                SELECT 
                    ab.id as booking_id,
                    'advance' as booking_type,
                    ab.invoice_number,
                    ab.customer_id,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    r.room_number,
                    ab.from_date,
                    ab.to_date,
                    ab.total,
                    ab.advance_amount as advance_paid,
                    ab.remaining_amount,
                    ab.payment_method,
                    ab.payment_status,
                    ab.status,
                    ab.created_at,
                    ab.advance_expiry_date,
                    ab.cancellation_reason,
                    DATEDIFF(CURDATE(), DATE(ab.created_at)) as days_since_created
                FROM advance_bookings ab
                LEFT JOIN customers c ON ab.customer_id = c.id
                LEFT JOIN rooms r ON ab.room_id = r.id
                WHERE ab.hotel_id = ?
                AND ab.status NOT IN ('cancelled', 'converted')
                AND ab.from_date >= ?
            `;

                const params = [hotelId, todayStr];

                if (show_all !== 'true') {
                    if (dateRangeStart && dateRangeEnd) {
                        advanceQuery += ` AND DATE(ab.created_at) >= ? AND DATE(ab.created_at) <= ?`;
                        params.push(dateRangeStart, dateRangeEnd);
                    } else if (dateThreshold) {
                        advanceQuery += ` AND DATE(ab.created_at) >= ?`;
                        params.push(dateThreshold.toISOString().split('T')[0]);
                    }
                }

                if (status && status !== 'all') {
                    advanceQuery += ` AND ab.status = ?`;
                    params.push(status);
                }

                if (from_date && to_date) {
                    advanceQuery += ` AND ab.from_date >= ? AND ab.to_date <= ?`;
                    params.push(from_date, to_date);
                }

                advanceQuery += ` ORDER BY ab.created_at DESC`;

                const [advanceBookings] = await pool.execute(advanceQuery, params);

                const validAdvanceBookings = advanceBookings.filter(booking => {
                    const checkInDate = new Date(booking.from_date);
                    const todayDate = new Date(todayStr);
                    return checkInDate >= todayDate;
                });

                results.advance_bookings = validAdvanceBookings;
                console.log(`📊 Advance bookings: ${validAdvanceBookings.length} (filtered from ${advanceBookings.length})`);
            }

            // 3. Function Bookings - Show only upcoming events (next 7 days)
            if (!type || type === 'function') {
                // Calculate upcoming dates (next 7 days)
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const upcomingDays = 7;
                const upcomingDate = new Date(today);
                upcomingDate.setDate(today.getDate() + upcomingDays);
                const upcomingDateStr = upcomingDate.toISOString().split('T')[0];

                let functionQuery = `
                SELECT 
                    fb.id as booking_id,
                    'function' as booking_type,
                    fb.booking_reference as invoice_number,
                    fb.customer_id,
                    fb.customer_name,
                    fb.customer_phone,
                    fb.customer_email,
                    fr.room_number,
                    DATE(fb.booking_date) as from_date,
                    DATE(fb.end_date) as to_date,
                    fb.total_amount as total,
                    fb.advance_paid,
                    (fb.total_amount - fb.advance_paid) as remaining_amount,
                    fb.payment_method,
                    fb.payment_status,
                    fb.status,
                    fb.created_at,
                    fb.cancellation_reason,
                    DATEDIFF(CURDATE(), DATE(fb.created_at)) as days_since_created
                FROM function_bookings fb
                LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
                WHERE fb.hotel_id = ?
                AND fb.status NOT IN ('cancelled')
                -- Only show function bookings with event date within next 7 days
                AND DATE(fb.booking_date) BETWEEN ? AND ?
            `;

                const params = [hotelId, todayStr, upcomingDateStr];

                if (show_all !== 'true') {
                    if (dateRangeStart && dateRangeEnd) {
                        functionQuery += ` AND DATE(fb.created_at) >= ? AND DATE(fb.created_at) <= ?`;
                        params.push(dateRangeStart, dateRangeEnd);
                        console.log(`✅ Function filter: created_at between ${dateRangeStart} and ${dateRangeEnd}`);
                    } else if (dateThreshold) {
                        functionQuery += ` AND DATE(fb.created_at) >= ?`;
                        params.push(dateThreshold.toISOString().split('T')[0]);
                        console.log(`✅ Function filter: created_at >= ${dateThreshold.toISOString().split('T')[0]}`);
                    }
                }

                if (status && status !== 'all') {
                    functionQuery += ` AND fb.status = ?`;
                    params.push(status);
                }

                if (from_date && to_date) {
                    functionQuery += ` AND fb.booking_date >= ? AND fb.end_date <= ?`;
                    params.push(from_date, to_date);
                }

                functionQuery += ` ORDER BY fb.created_at DESC`;

                const [functionBookings] = await pool.execute(functionQuery, params);

                const validFunctionBookings = functionBookings.filter(booking => {
                    const eventDate = new Date(booking.from_date);
                    const todayDate = new Date(todayStr);
                    return eventDate >= todayDate;
                });

                results.function_bookings = validFunctionBookings;
                console.log(`📊 Function bookings: ${validFunctionBookings.length} (filtered from ${functionBookings.length})`);
            }

            // Summary with correct filter info
            const summary = {
                total: results.room_bookings.length + results.advance_bookings.length + results.function_bookings.length,
                by_type: {
                    room: results.room_bookings.length,
                    advance: results.advance_bookings.length,
                    function: results.function_bookings.length
                },
                filter_applied: {
                    show_all: show_all === 'true',
                    last_x_days: (!show_all && hasLastXDays && !hasCustomDateRange) ? created_before_days : null,
                    from_date: (dateRangeStart && dateRangeEnd) ? dateRangeStart : (dateThreshold ? dateThreshold.toISOString().split('T')[0] : null),
                    to_date: (dateRangeStart && dateRangeEnd) ? dateRangeEnd : (dateThreshold ? todayStr : null),
                    is_custom_range: hasCustomDateRange
                }
            };

            res.json({
                success: true,
                data: results,
                summary: summary,
                counts: {
                    room: results.room_bookings.length,
                    advance: results.advance_bookings.length,
                    function: results.function_bookings.length
                }
            });

        } catch (error) {
            console.error('❌ Get cancellable bookings error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: error.message
            });
        }
    }

    // Get cancellation details for a specific booking
    // getCancellationDetails = async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const { type } = req.query;
    //         const hotelId = req.user.hotel_id;

    //         let booking = null;

    //         switch (type) {
    //             case 'room':
    //                 const [roomBookings] = await pool.execute(`
    //                     SELECT 
    //                         b.*,
    //                         c.name as customer_name,
    //                         c.phone as customer_phone,
    //                         c.email as customer_email,
    //                         r.room_number,
    //                         r.type as room_type
    //                     FROM bookings b
    //                     LEFT JOIN customers c ON b.customer_id = c.id
    //                     LEFT JOIN rooms r ON b.room_id = r.id
    //                     WHERE b.id = ? AND b.hotel_id = ?
    //                 `, [id, hotelId]);
    //                 booking = roomBookings[0];
    //                 break;

    //             case 'advance':
    //                 const [advanceBookings] = await pool.execute(`
    //                     SELECT 
    //                         ab.*,
    //                         c.name as customer_name,
    //                         c.phone as customer_phone,
    //                         c.email as customer_email,
    //                         r.room_number,
    //                         r.type as room_type
    //                     FROM advance_bookings ab
    //                     LEFT JOIN customers c ON ab.customer_id = c.id
    //                     LEFT JOIN rooms r ON ab.room_id = r.id
    //                     WHERE ab.id = ? AND ab.hotel_id = ?
    //                 `, [id, hotelId]);
    //                 booking = advanceBookings[0];
    //                 break;

    //             case 'function':
    //                 const [functionBookings] = await pool.execute(`
    //                     SELECT 
    //                         fb.*,
    //                         fr.room_number,
    //                         fr.name as room_name
    //                     FROM function_bookings fb
    //                     LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
    //                     WHERE fb.id = ? AND fb.hotel_id = ?
    //                 `, [id, hotelId]);
    //                 booking = functionBookings[0];
    //                 break;

    //             default:
    //                 return res.status(400).json({
    //                     success: false,
    //                     error: 'INVALID_TYPE',
    //                     message: 'Invalid booking type'
    //                 });
    //         }

    //         if (!booking) {
    //             return res.status(404).json({
    //                 success: false,
    //                 error: 'BOOKING_NOT_FOUND',
    //                 message: 'Booking not found'
    //             });
    //         }

    //         // Get existing refunds for this booking
    //         const [refunds] = await pool.execute(`
    //             SELECT * FROM booking_refunds 
    //             WHERE booking_id = ? AND booking_type = ? AND hotel_id = ?
    //             ORDER BY created_at DESC
    //         `, [id, type, hotelId]);

    //         // Calculate cancellation eligibility
    //         const now = new Date();
    //         const checkInDate = new Date(booking.from_date || booking.booking_date);
    //         const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));

    //         let refundPercentage = 100;

    //         if (daysUntilCheckIn >= 7) {
    //             refundPercentage = 100;
    //         } else if (daysUntilCheckIn >= 3) {
    //             refundPercentage = 50;
    //         } else if (daysUntilCheckIn >= 1) {
    //             refundPercentage = 25;
    //         } else {
    //             refundPercentage = 0;
    //         }

    //         const totalPaid = parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
    //             parseFloat(booking.total || 0);
    //         const maxRefund = totalPaid;
    //         const recommendedRefund = (totalPaid * refundPercentage) / 100;

    //         res.json({
    //             success: true,
    //             data: {
    //                 booking,
    //                 existing_refunds: refunds,
    //                 cancellation_policy: {
    //                     days_until_checkin: daysUntilCheckIn,
    //                     refund_percentage: refundPercentage,
    //                     max_refund: maxRefund,
    //                     recommended_refund: recommendedRefund
    //                 }
    //             }
    //         });

    //     } catch (error) {
    //         console.error('❌ Get cancellation details error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: error.message
    //         });
    //     }
    // }

    getCancellationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;
        const hotelId = req.user.hotel_id;

        let booking = null;

        switch (type) {
            case 'room':
                const [roomBookings] = await pool.execute(`
                    SELECT 
                        b.*,
                        c.name as customer_name,
                        c.phone as customer_phone,
                        c.email as customer_email,
                        r.room_number,
                        r.type as room_type
                    FROM bookings b
                    LEFT JOIN customers c ON b.customer_id = c.id
                    LEFT JOIN rooms r ON b.room_id = r.id
                    WHERE b.id = ? AND b.hotel_id = ?
                `, [id, hotelId]);
                booking = roomBookings[0];
                break;

            case 'advance':
                const [advanceBookings] = await pool.execute(`
                    SELECT 
                        ab.*,
                        c.name as customer_name,
                        c.phone as customer_phone,
                        c.email as customer_email,
                        r.room_number,
                        r.type as room_type
                    FROM advance_bookings ab
                    LEFT JOIN customers c ON ab.customer_id = c.id
                    LEFT JOIN rooms r ON ab.room_id = r.id
                    WHERE ab.id = ? AND ab.hotel_id = ?
                `, [id, hotelId]);
                booking = advanceBookings[0];
                break;

            case 'function':
                const [functionBookings] = await pool.execute(`
                    SELECT 
                        fb.*,
                        fr.room_number,
                        fr.name as room_name
                    FROM function_bookings fb
                    LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
                    WHERE fb.id = ? AND fb.hotel_id = ?
                `, [id, hotelId]);
                booking = functionBookings[0];
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_TYPE',
                    message: 'Invalid booking type'
                });
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'BOOKING_NOT_FOUND',
                message: 'Booking not found'
            });
        }

        // Get existing refunds for this booking
        const [refunds] = await pool.execute(`
            SELECT * FROM booking_refunds 
            WHERE booking_id = ? AND booking_type = ? AND hotel_id = ?
            ORDER BY created_at DESC
        `, [id, type, hotelId]);

        // Calculate cancellation eligibility
        const now = new Date();
        const checkInDate = new Date(booking.from_date || booking.booking_date);
        const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));

        let refundPercentage = 100;

        if (daysUntilCheckIn >= 7) {
            refundPercentage = 100;
        } else if (daysUntilCheckIn >= 3) {
            refundPercentage = 50;
        } else if (daysUntilCheckIn >= 1) {
            refundPercentage = 25;
        } else {
            refundPercentage = 0;
        }

        // 👇 FIX: Calculate totalPaid - if advance_paid is 0, use total_amount for goodwill refund
        const advancePaid = parseFloat(booking.advance_paid || booking.advance_amount || 0);
        const totalAmount = parseFloat(booking.total || booking.total_amount || 0);
        
        // If there's an advance payment, that's what was paid
        // If no advance payment, but booking exists, we can offer goodwill refund
        let totalPaid = advancePaid;
        let isGoodwillRefund = false;
        
        if (totalPaid === 0 && totalAmount > 0) {
            // No advance was taken, but we can offer goodwill refund up to totalAmount
            totalPaid = totalAmount;
            isGoodwillRefund = true;
        }
        
        const maxRefund = totalPaid;
        // For goodwill refund, recommended refund is based on policy
        const recommendedRefund = isGoodwillRefund ? (totalPaid * refundPercentage) / 100 : (advancePaid * refundPercentage) / 100;

        console.log('💰 Cancellation calculation:', {
            advancePaid,
            totalAmount,
            totalPaid,
            isGoodwillRefund,
            daysUntilCheckIn,
            refundPercentage,
            maxRefund,
            recommendedRefund
        });

        res.json({
            success: true,
            data: {
                booking,
                existing_refunds: refunds,
                cancellation_policy: {
                    days_until_checkin: daysUntilCheckIn,
                    refund_percentage: refundPercentage,
                    max_refund: maxRefund,
                    recommended_refund: recommendedRefund,
                    is_goodwill_refund: isGoodwillRefund  // 👈 Add flag to indicate goodwill refund
                }
            }
        });

    } catch (error) {
        console.error('❌ Get cancellation details error:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: error.message
        });
    }
}

    // Process cancellation and refund
    // processCancellation = async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const {
    //             type,
    //             cancellation_reason,
    //             process_refund,
    //             refund_amount,
    //             refund_method,
    //             refund_type,
    //             deduction_reason,
    //             deduction_amount,
    //             refund_notes
    //         } = req.body;

    //         const hotelId = req.user.hotel_id;
    //         const userId = req.user.userId;

    //         const connection = await pool.getConnection();
    //         await connection.beginTransaction();

    //         try {
    //             let booking = null;
    //             let updateQuery = '';
    //             let updateParams = [];

    //             switch (type) {
    //                 case 'room':
    //                     const [roomBookings] = await connection.execute(
    //                         'SELECT * FROM bookings WHERE id = ? AND hotel_id = ?',
    //                         [id, hotelId]
    //                     );
    //                     booking = roomBookings[0];

    //                     updateQuery = `
    //                         UPDATE bookings 
    //                         SET status = 'cancelled',
    //                             cancellation_reason = ?
    //                         WHERE id = ? AND hotel_id = ?
    //                     `;
    //                     updateParams = [cancellation_reason, id, hotelId];
    //                     break;

    //                 case 'advance':
    //                     const [advanceBookings] = await connection.execute(
    //                         'SELECT * FROM advance_bookings WHERE id = ? AND hotel_id = ?',
    //                         [id, hotelId]
    //                     );
    //                     booking = advanceBookings[0];

    //                     updateQuery = `
    //                         UPDATE advance_bookings 
    //                         SET status = 'cancelled',
    //                             cancellation_reason = ?
    //                         WHERE id = ? AND hotel_id = ?
    //                     `;
    //                     updateParams = [cancellation_reason, id, hotelId];
    //                     break;

    //                 case 'function':
    //                     const [functionBookings] = await connection.execute(
    //                         'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
    //                         [id, hotelId]
    //                     );
    //                     booking = functionBookings[0];

    //                     updateQuery = `
    //                         UPDATE function_bookings 
    //                         SET status = 'cancelled',
    //                             cancellation_reason = ?,
    //                             updated_at = NOW()
    //                         WHERE id = ? AND hotel_id = ?
    //                     `;
    //                     updateParams = [cancellation_reason, id, hotelId];
    //                     break;

    //                 default:
    //                     throw new Error('Invalid booking type');
    //             }

    //             if (!booking) {
    //                 throw new Error('Booking not found');
    //             }

    //             await connection.execute(updateQuery, updateParams);

    //             // Update room status if applicable
    //             if (type === 'room' && booking.room_id) {
    //                 await connection.execute(
    //                     'UPDATE rooms SET status = ? WHERE id = ? AND hotel_id = ?',
    //                     ['available', booking.room_id, hotelId]
    //                 );
    //             } else if (type === 'function' && booking.function_room_id) {
    //                 await connection.execute(
    //                     'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
    //                     ['available', booking.function_room_id, hotelId]
    //                 );
    //             }

    //             // Process refund if requested
    //             let refundRecord = null;
    //             if (process_refund && refund_amount > 0) {
    //                 const refundTransactionId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    //                 const [refundResult] = await connection.execute(`
    //                     INSERT INTO booking_refunds (
    //                         hotel_id, booking_id, booking_type, refund_amount, refund_method,
    //                         refund_status, transaction_id, refund_reason, processed_by,
    //                         processed_at, refund_type, deduction_amount, deduction_reason,
    //                         notes, original_amount
    //                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
    //                 `, [
    //                     hotelId, id, type, refund_amount, refund_method,
    //                     'pending', refundTransactionId, cancellation_reason, userId,
    //                     refund_type || 'partial',
    //                     deduction_amount || 0, deduction_reason || null,
    //                     refund_notes || null,
    //                     parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
    //                     parseFloat(booking.total || 0)
    //                 ]);

    //                 const [refundDetails] = await connection.execute(
    //                     'SELECT * FROM booking_refunds WHERE id = ?',
    //                     [refundResult.insertId]
    //                 );
    //                 refundRecord = refundDetails[0];

    //                 if (refund_method === 'cash') {
    //                     await connection.execute(`
    //                         UPDATE booking_refunds 
    //                         SET refund_status = 'completed', processed_at = NOW()
    //                         WHERE id = ?
    //                     `, [refundResult.insertId]);
    //                     refundRecord.refund_status = 'completed';
    //                 }

    //                 console.log('💰 Refund record created:', {
    //                     refund_id: refundResult.insertId,
    //                     amount: refund_amount,
    //                     type: type,
    //                     method: refund_method
    //                 });
    //             }

    //             // Call the helper method - using this.sendCancellationNotification works now
    //             await this.sendCancellationNotification(booking, type, cancellation_reason, refundRecord);

    //             await connection.commit();

    //             res.json({
    //                 success: true,
    //                 message: 'Booking cancelled successfully',
    //                 data: {
    //                     booking_id: id,
    //                     booking_type: type,
    //                     refund: refundRecord,
    //                     cancellation_reason
    //                 }
    //             });

    //         } catch (error) {
    //             await connection.rollback();
    //             throw error;
    //         } finally {
    //             connection.release();
    //         }

    //     } catch (error) {
    //         console.error('❌ Process cancellation error:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'SERVER_ERROR',
    //             message: error.message
    //         });
    //     }
    // }

    // Updated processCancellation method - Always set refund_status to 'completed'
    processCancellation = async (req, res) => {
        try {
            const { id } = req.params;
            const {
                type,
                cancellation_reason,
                process_refund,
                refund_amount,
                refund_method,
                refund_type,
                deduction_reason,
                deduction_amount,
                refund_notes
            } = req.body;

            const hotelId = req.user.hotel_id;
            const userId = req.user.userId;

            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                let booking = null;
                let updateQuery = '';
                let updateParams = [];

                switch (type) {
                    case 'room':
                        const [roomBookings] = await connection.execute(
                            'SELECT * FROM bookings WHERE id = ? AND hotel_id = ?',
                            [id, hotelId]
                        );
                        booking = roomBookings[0];

                        updateQuery = `
                        UPDATE bookings 
                        SET status = 'cancelled',
                            cancellation_reason = ?
                        WHERE id = ? AND hotel_id = ?
                    `;
                        updateParams = [cancellation_reason, id, hotelId];
                        break;

                    case 'advance':
                        const [advanceBookings] = await connection.execute(
                            'SELECT * FROM advance_bookings WHERE id = ? AND hotel_id = ?',
                            [id, hotelId]
                        );
                        booking = advanceBookings[0];

                        updateQuery = `
                        UPDATE advance_bookings 
                        SET status = 'cancelled',
                            cancellation_reason = ?
                        WHERE id = ? AND hotel_id = ?
                    `;
                        updateParams = [cancellation_reason, id, hotelId];
                        break;

                    case 'function':
                        const [functionBookings] = await connection.execute(
                            'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
                            [id, hotelId]
                        );
                        booking = functionBookings[0];

                        updateQuery = `
                        UPDATE function_bookings 
                        SET status = 'cancelled',
                            cancellation_reason = ?,
                            updated_at = NOW()
                        WHERE id = ? AND hotel_id = ?
                    `;
                        updateParams = [cancellation_reason, id, hotelId];
                        break;

                    default:
                        throw new Error('Invalid booking type');
                }

                if (!booking) {
                    throw new Error('Booking not found');
                }

                await connection.execute(updateQuery, updateParams);

                // Update room status if applicable
                if (type === 'room' && booking.room_id) {
                    await connection.execute(
                        'UPDATE rooms SET status = ? WHERE id = ? AND hotel_id = ?',
                        ['available', booking.room_id, hotelId]
                    );
                } else if (type === 'function' && booking.function_room_id) {
                    await connection.execute(
                        'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
                        ['available', booking.function_room_id, hotelId]
                    );
                }

                // Process refund if requested
                let refundRecord = null;
                if (process_refund && refund_amount > 0) {
                    const refundTransactionId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                    // ALWAYS set refund_status to 'completed' regardless of method
                    const [refundResult] = await connection.execute(`
                    INSERT INTO booking_refunds (
                        hotel_id, booking_id, booking_type, refund_amount, refund_method,
                        refund_status, transaction_id, refund_reason, processed_by,
                        processed_at, refund_type, deduction_amount, deduction_reason,
                        notes, original_amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
                `, [
                        hotelId, id, type, refund_amount, refund_method,
                        'completed', // 👈 ALWAYS 'completed' for any refund method
                        refundTransactionId, cancellation_reason, userId,
                        refund_type || 'partial',
                        deduction_amount || 0, deduction_reason || null,
                        refund_notes || null,
                        parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
                        parseFloat(booking.total || 0)
                    ]);

                    const [refundDetails] = await connection.execute(
                        'SELECT * FROM booking_refunds WHERE id = ?',
                        [refundResult.insertId]
                    );
                    refundRecord = refundDetails[0];

                    console.log('💰 Refund record created with status COMPLETED:', {
                        refund_id: refundResult.insertId,
                        amount: refund_amount,
                        type: type,
                        method: refund_method,
                        status: 'completed'
                    });
                }

                // Send cancellation notification
                await this.sendCancellationNotification(booking, type, cancellation_reason, refundRecord);

                await connection.commit();

                res.json({
                    success: true,
                    message: 'Booking cancelled successfully',
                    data: {
                        booking_id: id,
                        booking_type: type,
                        refund: refundRecord,
                        cancellation_reason
                    }
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('❌ Process cancellation error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: error.message
            });
        }
    }

    // Get refund history - FIXED VERSION
    getRefundHistory = async (req, res) => {
        try {
            const hotelId = req.user.hotel_id;
            const { booking_id, booking_type, from_date, to_date, status } = req.query;

            let query = `
                SELECT 
                    r.*,
                    CASE 
                        WHEN r.booking_type = 'room' THEN b.invoice_number
                        WHEN r.booking_type = 'advance' THEN ab.invoice_number
                        WHEN r.booking_type = 'function' THEN fb.booking_reference
                    END as invoice_number,
                    CASE 
                        WHEN r.booking_type = 'room' THEN c.name
                        WHEN r.booking_type = 'advance' THEN cust.name
                        WHEN r.booking_type = 'function' THEN fb.customer_name
                    END as customer_name,
                    u.name as processed_by_name
                FROM booking_refunds r
                LEFT JOIN bookings b ON r.booking_id = b.id AND r.booking_type = 'room'
                LEFT JOIN customers c ON b.customer_id = c.id
                LEFT JOIN advance_bookings ab ON r.booking_id = ab.id AND r.booking_type = 'advance'
                LEFT JOIN customers cust ON ab.customer_id = cust.id
                LEFT JOIN function_bookings fb ON r.booking_id = fb.id AND r.booking_type = 'function'
                LEFT JOIN users u ON r.processed_by = u.id
                WHERE r.hotel_id = ?
            `;

            const params = [hotelId];

            if (booking_id) {
                query += ` AND r.booking_id = ?`;
                params.push(booking_id);
            }

            if (booking_type) {
                query += ` AND r.booking_type = ?`;
                params.push(booking_type);
            }

            if (status && status !== 'all') {
                query += ` AND r.refund_status = ?`;
                params.push(status);
            }

            if (from_date && to_date) {
                query += ` AND DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?`;
                params.push(from_date, to_date);
            }

            query += ` ORDER BY r.created_at DESC`;

            console.log('📊 Refund History Query:', query);
            console.log('📊 Params:', params);

            const [refunds] = await pool.execute(query, params);

            res.json({
                success: true,
                data: refunds,
                count: refunds.length
            });

        } catch (error) {
            console.error('❌ Get refund history error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: error.message
            });
        }
    }

    // Update refund status
    updateRefundStatus = async (req, res) => {
        try {
            const { refundId } = req.params;
            const { refund_status, transaction_id, notes } = req.body;
            const hotelId = req.user.hotel_id;

            const [result] = await pool.execute(`
                UPDATE booking_refunds 
                SET refund_status = ?,
                    transaction_id = COALESCE(?, transaction_id),
                    notes = CONCAT(notes, '\n', ?),
                    processed_at = NOW()
                WHERE id = ? AND hotel_id = ?
            `, [refund_status, transaction_id, notes || '', refundId, hotelId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'REFUND_NOT_FOUND',
                    message: 'Refund record not found'
                });
            }

            const [updatedRefund] = await pool.execute(
                'SELECT * FROM booking_refunds WHERE id = ?',
                [refundId]
            );

            res.json({
                success: true,
                message: 'Refund status updated successfully',
                data: updatedRefund[0]
            });

        } catch (error) {
            console.error('❌ Update refund status error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: error.message
            });
        }
    }

    // Helper: Send cancellation notification (arrow function)
    sendCancellationNotification = async (booking, type, reason, refund = null) => {
        try {
            const hotelId = booking.hotel_id;

            const [hotelRows] = await pool.execute(`
                SELECT h.*, u.email as hotel_email, u.phone as hotel_phone, u.name as hotel_admin_name
                FROM hotels h
                LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
                WHERE h.id = ?
            `, [hotelId]);

            const hotel = hotelRows[0] || {};

            // Get customer name based on booking type
            let customerName = '';
            let customerEmail = '';
            let customerPhone = '';

            if (type === 'room' && booking.customer_id) {
                const [customerRows] = await pool.execute(
                    'SELECT name, email, phone FROM customers WHERE id = ?',
                    [booking.customer_id]
                );
                if (customerRows[0]) {
                    customerName = customerRows[0].name;
                    customerEmail = customerRows[0].email;
                    customerPhone = customerRows[0].phone;
                }
            } else if (type === 'advance' && booking.customer_id) {
                const [customerRows] = await pool.execute(
                    'SELECT name, email, phone FROM customers WHERE id = ?',
                    [booking.customer_id]
                );
                if (customerRows[0]) {
                    customerName = customerRows[0].name;
                    customerEmail = customerRows[0].email;
                    customerPhone = customerRows[0].phone;
                }
            } else if (type === 'function') {
                customerName = booking.customer_name;
                customerEmail = booking.customer_email;
                customerPhone = booking.customer_phone;
            }

            const notificationData = {
                booking_type: type,
                booking_id: booking.id,
                booking_reference: booking.booking_reference || booking.invoice_number,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                room_number: booking.room_number,
                from_date: booking.from_date || booking.booking_date,
                to_date: booking.to_date || booking.end_date,
                total_amount: booking.total || booking.total_amount,
                advance_paid: booking.advance_paid || booking.advance_amount || 0,
                cancellation_reason: reason,
                refund: refund ? {
                    amount: refund.refund_amount,
                    method: refund.refund_method,
                    status: refund.refund_status
                } : null
            };

            // Send email if customer email exists
            if (notificationData.customer_email) {
                try {
                    await EmailService.sendCancellationConfirmation(notificationData, hotel);
                    console.log(`✅ Cancellation email sent to: ${notificationData.customer_email}`);
                } catch (emailError) {
                    console.error('Email error:', emailError.message);
                }
            }

            // Send WhatsApp if customer phone exists
            if (notificationData.customer_phone) {
                try {
                    await WhatsAppService.sendCancellationNotification(notificationData, hotel);
                    console.log(`📱 Cancellation WhatsApp sent to: ${notificationData.customer_phone}`);
                } catch (whatsappError) {
                    console.error('WhatsApp error:', whatsappError.message);
                }
            }

        } catch (error) {
            console.error('❌ Error sending cancellation notification:', error);
        }
    }
}

module.exports = new RefundController();






// // controllers/refundController.js - COMPLETE FIXED VERSION
// const { pool } = require('../config/database');
// const EmailService = require('../services/emailService');
// const WhatsAppService = require('../services/whatsappService');

// class RefundController {

//     // Get cancellable bookings for a hotel
//     // async getCancellableBookings(req, res) {
//     //     try {
//     //         const hotelId = req.user.hotel_id;
//     //         const {
//     //             type,
//     //             status,
//     //             from_date,
//     //             to_date,
//     //             created_before_days,  // This parameter name is misleading - it's actually "last X days"
//     //             created_after_date,
//     //             from_created_date,
//     //             to_created_date,
//     //             show_all = 'false'
//     //         } = req.query;

//     //         let results = {
//     //             room_bookings: [],
//     //             advance_bookings: [],
//     //             function_bookings: []
//     //         };

//     //         console.log('📊 Filter Request:', {
//     //             type,
//     //             created_before_days,
//     //             show_all
//     //         });

//     //         // Calculate date threshold for "last X days" (INCLUDING today)
//     //         let dateThreshold = null;
//     //         if (created_before_days && !isNaN(parseInt(created_before_days)) && show_all !== 'true') {
//     //             const days = parseInt(created_before_days);
//     //             const today = new Date();
//     //             dateThreshold = new Date(today);
//     //             dateThreshold.setDate(today.getDate() - days);
//     //             dateThreshold.setHours(0, 0, 0, 0);
//     //             const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

//     //             console.log(`📅 Filter: Bookings created on or AFTER ${dateThresholdStr} (last ${days} days including today)`);
//     //             console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
//     //         }

//     //         // 1. Room Bookings
//     //         if (!type || type === 'room') {
//     //             let roomQuery = `
//     //             SELECT
//     //                 b.id as booking_id,
//     //                 'room' as booking_type,
//     //                 b.invoice_number,
//     //                 b.customer_id,
//     //                 c.name as customer_name,
//     //                 c.phone as customer_phone,
//     //                 c.email as customer_email,
//     //                 r.room_number,
//     //                 b.from_date,
//     //                 b.to_date,
//     //                 b.total,
//     //                 b.advance_amount_paid as advance_paid,
//     //                 b.remaining_amount,
//     //                 b.payment_method,
//     //                 b.payment_status,
//     //                 b.status,
//     //                 b.created_at,
//     //                 b.cancellation_reason,
//     //                 DATEDIFF(CURDATE(), DATE(b.created_at)) as days_since_created
//     //             FROM bookings b
//     //             LEFT JOIN customers c ON b.customer_id = c.id
//     //             LEFT JOIN rooms r ON b.room_id = r.id
//     //             WHERE b.hotel_id = ?
//     //             AND b.status NOT IN ('cancelled')
//     //         `;

//     //             const params = [hotelId];

//     //             // Apply date filters - SHOW bookings from the last X days (including today)
//     //             if (show_all !== 'true') {
//     //                 if (dateThreshold) {
//     //                     // CHANGE: Use >= to show bookings from the last X days (including threshold date)
//     //                     roomQuery += ` AND DATE(b.created_at) >= ?`;
//     //                     params.push(dateThreshold.toISOString().split('T')[0]);
//     //                     console.log(`✅ Room filter: created_at >= ${dateThreshold.toISOString().split('T')[0]}`);
//     //                 }

//     //                 if (from_created_date && to_created_date) {
//     //                     roomQuery += ` AND DATE(b.created_at) >= ? AND DATE(b.created_at) <= ?`;
//     //                     params.push(from_created_date, to_created_date);
//     //                 }
//     //             } else {
//     //                 console.log('📡 Show All Bookings - no date filter for rooms');
//     //             }

//     //             if (status && status !== 'all') {
//     //                 roomQuery += ` AND b.status = ?`;
//     //                 params.push(status);
//     //             }

//     //             if (from_date && to_date) {
//     //                 roomQuery += ` AND b.from_date >= ? AND b.to_date <= ?`;
//     //                 params.push(from_date, to_date);
//     //             }

//     //             roomQuery += ` ORDER BY b.created_at DESC`;

//     //             console.log('📊 Room Query:', roomQuery);
//     //             console.log('📊 Room Params:', params);

//     //             const [roomBookings] = await pool.execute(roomQuery, params);
//     //             results.room_bookings = roomBookings;
//     //             console.log(`📊 Room bookings found: ${roomBookings.length}`);
//     //         }

//     //         // 2. Advance Bookings
//     //         if (!type || type === 'advance') {
//     //             let advanceQuery = `
//     //             SELECT
//     //                 ab.id as booking_id,
//     //                 'advance' as booking_type,
//     //                 ab.invoice_number,
//     //                 ab.customer_id,
//     //                 c.name as customer_name,
//     //                 c.phone as customer_phone,
//     //                 c.email as customer_email,
//     //                 r.room_number,
//     //                 ab.from_date,
//     //                 ab.to_date,
//     //                 ab.total,
//     //                 ab.advance_amount as advance_paid,
//     //                 ab.remaining_amount,
//     //                 ab.payment_method,
//     //                 ab.payment_status,
//     //                 ab.status,
//     //                 ab.created_at,
//     //                 ab.advance_expiry_date,
//     //                 ab.cancellation_reason,
//     //                 DATEDIFF(CURDATE(), DATE(ab.created_at)) as days_since_created
//     //             FROM advance_bookings ab
//     //             LEFT JOIN customers c ON ab.customer_id = c.id
//     //             LEFT JOIN rooms r ON ab.room_id = r.id
//     //             WHERE ab.hotel_id = ?
//     //             AND ab.status NOT IN ('cancelled', 'converted')
//     //         `;

//     //             const params = [hotelId];

//     //             if (show_all !== 'true') {
//     //                 if (dateThreshold) {
//     //                     // CHANGE: Use >= to show bookings from the last X days
//     //                     advanceQuery += ` AND DATE(ab.created_at) >= ?`;
//     //                     params.push(dateThreshold.toISOString().split('T')[0]);
//     //                 }

//     //                 if (from_created_date && to_created_date) {
//     //                     advanceQuery += ` AND DATE(ab.created_at) >= ? AND DATE(ab.created_at) <= ?`;
//     //                     params.push(from_created_date, to_created_date);
//     //                 }
//     //             }

//     //             if (status && status !== 'all') {
//     //                 advanceQuery += ` AND ab.status = ?`;
//     //                 params.push(status);
//     //             }

//     //             if (from_date && to_date) {
//     //                 advanceQuery += ` AND ab.from_date >= ? AND ab.to_date <= ?`;
//     //                 params.push(from_date, to_date);
//     //             }

//     //             advanceQuery += ` ORDER BY ab.created_at DESC`;

//     //             const [advanceBookings] = await pool.execute(advanceQuery, params);
//     //             results.advance_bookings = advanceBookings;
//     //         }

//     //         // 3. Function Bookings
//     //         if (!type || type === 'function') {
//     //             let functionQuery = `
//     //             SELECT
//     //                 fb.id as booking_id,
//     //                 'function' as booking_type,
//     //                 fb.booking_reference as invoice_number,
//     //                 fb.customer_id,
//     //                 fb.customer_name,
//     //                 fb.customer_phone,
//     //                 fb.customer_email,
//     //                 fr.room_number,
//     //                 fb.booking_date as from_date,
//     //                 fb.end_date as to_date,
//     //                 fb.total_amount as total,
//     //                 fb.advance_paid,
//     //                 (fb.total_amount - fb.advance_paid) as remaining_amount,
//     //                 fb.payment_method,
//     //                 fb.payment_status,
//     //                 fb.status,
//     //                 fb.created_at,
//     //                 fb.cancellation_reason,
//     //                 DATEDIFF(CURDATE(), DATE(fb.created_at)) as days_since_created
//     //             FROM function_bookings fb
//     //             LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
//     //             WHERE fb.hotel_id = ?
//     //             AND fb.status NOT IN ('cancelled')
//     //         `;

//     //             const params = [hotelId];

//     //             if (show_all !== 'true') {
//     //                 if (dateThreshold) {
//     //                     // CHANGE: Use >= to show bookings from the last X days
//     //                     functionQuery += ` AND DATE(fb.created_at) >= ?`;
//     //                     params.push(dateThreshold.toISOString().split('T')[0]);
//     //                 }

//     //                 if (from_created_date && to_created_date) {
//     //                     functionQuery += ` AND DATE(fb.created_at) >= ? AND DATE(fb.created_at) <= ?`;
//     //                     params.push(from_created_date, to_created_date);
//     //                 }
//     //             }

//     //             if (status && status !== 'all') {
//     //                 functionQuery += ` AND fb.status = ?`;
//     //                 params.push(status);
//     //             }

//     //             if (from_date && to_date) {
//     //                 functionQuery += ` AND fb.booking_date >= ? AND fb.end_date <= ?`;
//     //                 params.push(from_date, to_date);
//     //             }

//     //             functionQuery += ` ORDER BY fb.created_at DESC`;

//     //             const [functionBookings] = await pool.execute(functionQuery, params);
//     //             results.function_bookings = functionBookings;
//     //         }

//     //         // Summary
//     //         const summary = {
//     //             total: results.room_bookings.length + results.advance_bookings.length + results.function_bookings.length,
//     //             by_type: {
//     //                 room: results.room_bookings.length,
//     //                 advance: results.advance_bookings.length,
//     //                 function: results.function_bookings.length
//     //             },
//     //             filter_applied: {
//     //                 last_x_days: created_before_days || null,
//     //                 from_date: dateThreshold ? dateThreshold.toISOString().split('T')[0] : null,
//     //                 to_date: new Date().toISOString().split('T')[0],
//     //                 show_all: show_all === 'true'
//     //             }
//     //         };

//     //         res.json({
//     //             success: true,
//     //             data: results,
//     //             summary: summary,
//     //             counts: {
//     //                 room: results.room_bookings.length,
//     //                 advance: results.advance_bookings.length,
//     //                 function: results.function_bookings.length
//     //             }
//     //         });

//     //     } catch (error) {
//     //         console.error('❌ Get cancellable bookings error:', error);
//     //         res.status(500).json({
//     //             success: false,
//     //             error: 'SERVER_ERROR',
//     //             message: error.message
//     //         });
//     //     }
//     // }

//     // In refundController.js - Update getCancellableBookings

//     async getCancellableBookings(req, res) {
//         try {
//             const hotelId = req.user.hotel_id;
//             const {
//                 type,
//                 status,
//                 from_date,
//                 to_date,
//                 created_before_days,
//                 created_after_date,
//                 from_created_date,  // This is for custom date range
//                 to_created_date,    // This is for custom date range
//                 show_all = 'false'
//             } = req.query;

//             let results = {
//                 room_bookings: [],
//                 advance_bookings: [],
//                 function_bookings: []
//             };

//             // Get today's date for comparison
//             const today = new Date();
//             const todayStr = today.toISOString().split('T')[0];

//             console.log('📅 Today\'s date:', todayStr);
//             console.log('📊 Filter Request:', {
//                 type,
//                 created_before_days,
//                 from_created_date,
//                 to_created_date,
//                 show_all
//             });

//             // Check if we have custom date range parameters
//             const hasCustomDateRange = from_created_date && to_created_date;
//             const hasLastXDays = created_before_days && !isNaN(parseInt(created_before_days));

//             // Calculate date threshold based on filter type
//             let dateThreshold = null;
//             let dateRangeStart = null;
//             let dateRangeEnd = null;

//             if (show_all !== 'true') {
//                 if (hasCustomDateRange) {
//                     // Use custom date range
//                     dateRangeStart = from_created_date;
//                     dateRangeEnd = to_created_date;
//                     console.log(`📅 Using custom date range: ${dateRangeStart} to ${dateRangeEnd}`);
//                 } else if (hasLastXDays) {
//                     // Use last X days
//                     const days = parseInt(created_before_days);
//                     dateThreshold = new Date(today);
//                     dateThreshold.setDate(today.getDate() - days);
//                     dateThreshold.setHours(0, 0, 0, 0);
//                     console.log(`📅 Using last ${days} days, from ${dateThreshold.toISOString().split('T')[0]} to ${todayStr}`);
//                 }
//             }

//             // 1. Room Bookings
//             if (!type || type === 'room') {
//                 let roomQuery = `
//                 SELECT
//                     b.id as booking_id,
//                     'room' as booking_type,
//                     b.invoice_number,
//                     b.customer_id,
//                     c.name as customer_name,
//                     c.phone as customer_phone,
//                     c.email as customer_email,
//                     r.room_number,
//                     b.from_date,
//                     b.to_date,
//                     b.total,
//                     b.advance_amount_paid as advance_paid,
//                     b.remaining_amount,
//                     b.payment_method,
//                     b.payment_status,
//                     b.status,
//                     b.created_at,
//                     b.cancellation_reason,
//                     DATEDIFF(CURDATE(), DATE(b.created_at)) as days_since_created
//                 FROM bookings b
//                 LEFT JOIN customers c ON b.customer_id = c.id
//                 LEFT JOIN rooms r ON b.room_id = r.id
//                 WHERE b.hotel_id = ?
//                 AND b.status NOT IN ('cancelled')
//                 AND b.from_date >= ?
//             `;

//                 const params = [hotelId, todayStr];

//                 // Apply creation date filters
//                 if (show_all !== 'true') {
//                     if (dateRangeStart && dateRangeEnd) {
//                         // Custom date range
//                         roomQuery += ` AND DATE(b.created_at) >= ? AND DATE(b.created_at) <= ?`;
//                         params.push(dateRangeStart, dateRangeEnd);
//                         console.log(`✅ Room filter: created_at between ${dateRangeStart} and ${dateRangeEnd}`);
//                     } else if (dateThreshold) {
//                         // Last X days
//                         roomQuery += ` AND DATE(b.created_at) >= ?`;
//                         params.push(dateThreshold.toISOString().split('T')[0]);
//                         console.log(`✅ Room filter: created_at >= ${dateThreshold.toISOString().split('T')[0]}`);
//                     }
//                 }

//                 if (status && status !== 'all') {
//                     roomQuery += ` AND b.status = ?`;
//                     params.push(status);
//                 }

//                 if (from_date && to_date) {
//                     roomQuery += ` AND b.from_date >= ? AND b.to_date <= ?`;
//                     params.push(from_date, to_date);
//                 }

//                 roomQuery += ` ORDER BY b.created_at DESC`;

//                 const [roomBookings] = await pool.execute(roomQuery, params);

//                 const validRoomBookings = roomBookings.filter(booking => {
//                     const checkInDate = new Date(booking.from_date);
//                     const todayDate = new Date(todayStr);
//                     return checkInDate >= todayDate;
//                 });

//                 results.room_bookings = validRoomBookings;
//                 console.log(`📊 Room bookings: ${validRoomBookings.length} (filtered from ${roomBookings.length})`);
//             }

//             // 2. Advance Bookings
//             if (!type || type === 'advance') {
//                 let advanceQuery = `
//                 SELECT
//                     ab.id as booking_id,
//                     'advance' as booking_type,
//                     ab.invoice_number,
//                     ab.customer_id,
//                     c.name as customer_name,
//                     c.phone as customer_phone,
//                     c.email as customer_email,
//                     r.room_number,
//                     ab.from_date,
//                     ab.to_date,
//                     ab.total,
//                     ab.advance_amount as advance_paid,
//                     ab.remaining_amount,
//                     ab.payment_method,
//                     ab.payment_status,
//                     ab.status,
//                     ab.created_at,
//                     ab.advance_expiry_date,
//                     ab.cancellation_reason,
//                     DATEDIFF(CURDATE(), DATE(ab.created_at)) as days_since_created
//                 FROM advance_bookings ab
//                 LEFT JOIN customers c ON ab.customer_id = c.id
//                 LEFT JOIN rooms r ON ab.room_id = r.id
//                 WHERE ab.hotel_id = ?
//                 AND ab.status NOT IN ('cancelled', 'converted')
//                 AND ab.from_date >= ?
//             `;

//                 const params = [hotelId, todayStr];

//                 if (show_all !== 'true') {
//                     if (dateRangeStart && dateRangeEnd) {
//                         advanceQuery += ` AND DATE(ab.created_at) >= ? AND DATE(ab.created_at) <= ?`;
//                         params.push(dateRangeStart, dateRangeEnd);
//                     } else if (dateThreshold) {
//                         advanceQuery += ` AND DATE(ab.created_at) >= ?`;
//                         params.push(dateThreshold.toISOString().split('T')[0]);
//                     }
//                 }

//                 if (status && status !== 'all') {
//                     advanceQuery += ` AND ab.status = ?`;
//                     params.push(status);
//                 }

//                 if (from_date && to_date) {
//                     advanceQuery += ` AND ab.from_date >= ? AND ab.to_date <= ?`;
//                     params.push(from_date, to_date);
//                 }

//                 advanceQuery += ` ORDER BY ab.created_at DESC`;

//                 const [advanceBookings] = await pool.execute(advanceQuery, params);

//                 const validAdvanceBookings = advanceBookings.filter(booking => {
//                     const checkInDate = new Date(booking.from_date);
//                     const todayDate = new Date(todayStr);
//                     return checkInDate >= todayDate;
//                 });

//                 results.advance_bookings = validAdvanceBookings;
//                 console.log(`📊 Advance bookings: ${validAdvanceBookings.length} (filtered from ${advanceBookings.length})`);
//             }

//             // 3. Function Bookings - Show only upcoming events (next 7 days)
//             if (!type || type === 'function') {
//                 // Calculate upcoming dates (next 7 days)
//                 const today = new Date();
//                 const todayStr = today.toISOString().split('T')[0];
//                 const upcomingDays = 7;
//                 const upcomingDate = new Date(today);
//                 upcomingDate.setDate(today.getDate() + upcomingDays);
//                 const upcomingDateStr = upcomingDate.toISOString().split('T')[0];

//                 let functionQuery = `
//         SELECT
//             fb.id as booking_id,
//             'function' as booking_type,
//             fb.booking_reference as invoice_number,
//             fb.customer_id,
//             fb.customer_name,
//             fb.customer_phone,
//             fb.customer_email,
//             fr.room_number,
//             DATE(fb.booking_date) as from_date,
//             DATE(fb.end_date) as to_date,
//             fb.total_amount as total,
//             fb.advance_paid,
//             (fb.total_amount - fb.advance_paid) as remaining_amount,
//             fb.payment_method,
//             fb.payment_status,
//             fb.status,
//             fb.created_at,
//             fb.cancellation_reason,
//             DATEDIFF(CURDATE(), DATE(fb.created_at)) as days_since_created
//         FROM function_bookings fb
//         LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
//         WHERE fb.hotel_id = ?
//         AND fb.status NOT IN ('cancelled')
//         -- Only show function bookings with event date within next 7 days
//         AND DATE(fb.booking_date) BETWEEN ? AND ?
//     `;

//                 const params = [hotelId, todayStr, upcomingDateStr];

//                 if (show_all !== 'true') {
//                     if (dateRangeStart && dateRangeEnd) {
//                         functionQuery += ` AND DATE(fb.created_at) >= ? AND DATE(fb.created_at) <= ?`;
//                         params.push(dateRangeStart, dateRangeEnd);
//                         console.log(`✅ Function filter: created_at between ${dateRangeStart} and ${dateRangeEnd}`);
//                     } else if (dateThreshold) {
//                         functionQuery += ` AND DATE(fb.created_at) >= ?`;
//                         params.push(dateThreshold.toISOString().split('T')[0]);
//                         console.log(`✅ Function filter: created_at >= ${dateThreshold.toISOString().split('T')[0]}`);
//                     }
//                 }

//                 if (status && status !== 'all') {
//                     functionQuery += ` AND fb.status = ?`;
//                     params.push(status);
//                 }

//                 if (from_date && to_date) {
//                     functionQuery += ` AND fb.booking_date >= ? AND fb.end_date <= ?`;
//                     params.push(from_date, to_date);
//                 }

//                 functionQuery += ` ORDER BY fb.created_at DESC`;

//                 const [functionBookings] = await pool.execute(functionQuery, params);

//                 const validFunctionBookings = functionBookings.filter(booking => {
//                     const eventDate = new Date(booking.from_date);
//                     const todayDate = new Date(todayStr);
//                     return eventDate >= todayDate;
//                 });

//                 results.function_bookings = validFunctionBookings;
//                 console.log(`📊 Function bookings: ${validFunctionBookings.length} (filtered from ${functionBookings.length})`);
//             }

//             // Summary with correct filter info
//             const summary = {
//                 total: results.room_bookings.length + results.advance_bookings.length + results.function_bookings.length,
//                 by_type: {
//                     room: results.room_bookings.length,
//                     advance: results.advance_bookings.length,
//                     function: results.function_bookings.length
//                 },
//                 filter_applied: {
//                     show_all: show_all === 'true',
//                     last_x_days: (!show_all && hasLastXDays && !hasCustomDateRange) ? created_before_days : null,
//                     from_date: (dateRangeStart && dateRangeEnd) ? dateRangeStart : (dateThreshold ? dateThreshold.toISOString().split('T')[0] : null),
//                     to_date: (dateRangeStart && dateRangeEnd) ? dateRangeEnd : (dateThreshold ? todayStr : null),
//                     is_custom_range: hasCustomDateRange
//                 }
//             };

//             res.json({
//                 success: true,
//                 data: results,
//                 summary: summary,
//                 counts: {
//                     room: results.room_bookings.length,
//                     advance: results.advance_bookings.length,
//                     function: results.function_bookings.length
//                 }
//             });

//         } catch (error) {
//             console.error('❌ Get cancellable bookings error:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'SERVER_ERROR',
//                 message: error.message
//             });
//         }
//     }
//     // Get cancellation details for a specific booking
//     async getCancellationDetails(req, res) {
//         try {
//             const { id } = req.params;
//             const { type } = req.query;
//             const hotelId = req.user.hotel_id;

//             let booking = null;

//             switch (type) {
//                 case 'room':
//                     const [roomBookings] = await pool.execute(`
//                         SELECT
//                             b.*,
//                             c.name as customer_name,
//                             c.phone as customer_phone,
//                             c.email as customer_email,
//                             r.room_number,
//                             r.type as room_type
//                         FROM bookings b
//                         LEFT JOIN customers c ON b.customer_id = c.id
//                         LEFT JOIN rooms r ON b.room_id = r.id
//                         WHERE b.id = ? AND b.hotel_id = ?
//                     `, [id, hotelId]);
//                     booking = roomBookings[0];
//                     break;

//                 case 'advance':
//                     const [advanceBookings] = await pool.execute(`
//                         SELECT
//                             ab.*,
//                             c.name as customer_name,
//                             c.phone as customer_phone,
//                             c.email as customer_email,
//                             r.room_number,
//                             r.type as room_type
//                         FROM advance_bookings ab
//                         LEFT JOIN customers c ON ab.customer_id = c.id
//                         LEFT JOIN rooms r ON ab.room_id = r.id
//                         WHERE ab.id = ? AND ab.hotel_id = ?
//                     `, [id, hotelId]);
//                     booking = advanceBookings[0];
//                     break;

//                 case 'function':
//                     const [functionBookings] = await pool.execute(`
//                         SELECT
//                             fb.*,
//                             fr.room_number,
//                             fr.name as room_name
//                         FROM function_bookings fb
//                         LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
//                         WHERE fb.id = ? AND fb.hotel_id = ?
//                     `, [id, hotelId]);
//                     booking = functionBookings[0];
//                     break;

//                 default:
//                     return res.status(400).json({
//                         success: false,
//                         error: 'INVALID_TYPE',
//                         message: 'Invalid booking type'
//                     });
//             }

//             if (!booking) {
//                 return res.status(404).json({
//                     success: false,
//                     error: 'BOOKING_NOT_FOUND',
//                     message: 'Booking not found'
//                 });
//             }

//             // Get existing refunds for this booking
//             const [refunds] = await pool.execute(`
//                 SELECT * FROM booking_refunds
//                 WHERE booking_id = ? AND booking_type = ? AND hotel_id = ?
//                 ORDER BY created_at DESC
//             `, [id, type, hotelId]);

//             // Calculate cancellation eligibility
//             const now = new Date();
//             const checkInDate = new Date(booking.from_date || booking.booking_date);
//             const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));

//             let refundPercentage = 100;

//             if (daysUntilCheckIn >= 7) {
//                 refundPercentage = 100;
//             } else if (daysUntilCheckIn >= 3) {
//                 refundPercentage = 50;
//             } else if (daysUntilCheckIn >= 1) {
//                 refundPercentage = 25;
//             } else {
//                 refundPercentage = 0;
//             }

//             const totalPaid = parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
//                 parseFloat(booking.total || 0);
//             const maxRefund = totalPaid;
//             const recommendedRefund = (totalPaid * refundPercentage) / 100;

//             res.json({
//                 success: true,
//                 data: {
//                     booking,
//                     existing_refunds: refunds,
//                     cancellation_policy: {
//                         days_until_checkin: daysUntilCheckIn,
//                         refund_percentage: refundPercentage,
//                         max_refund: maxRefund,
//                         recommended_refund: recommendedRefund
//                     }
//                 }
//             });

//         } catch (error) {
//             console.error('❌ Get cancellation details error:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'SERVER_ERROR',
//                 message: error.message
//             });
//         }
//     }

//     // Process cancellation and refund


//     async processCancellation(req, res) {
//         try {
//             const { id } = req.params;
//             const {
//                 type,
//                 cancellation_reason,
//                 process_refund,
//                 refund_amount,
//                 refund_method,
//                 refund_type,
//                 deduction_reason,
//                 deduction_amount,
//                 refund_notes
//             } = req.body;

//             const hotelId = req.user.hotel_id;
//             const userId = req.user.userId;

//             const connection = await pool.getConnection();
//             await connection.beginTransaction();

//             try {
//                 let booking = null;
//                 let updateQuery = '';
//                 let updateParams = [];

//                 switch (type) {
//                     case 'room':
//                         const [roomBookings] = await connection.execute(
//                             'SELECT * FROM bookings WHERE id = ? AND hotel_id = ?',
//                             [id, hotelId]
//                         );
//                         booking = roomBookings[0];

//                         // FIXED: Remove updated_at since it doesn't exist in bookings table
//                         updateQuery = `
//                         UPDATE bookings
//                         SET status = 'cancelled',
//                             cancellation_reason = ?
//                         WHERE id = ? AND hotel_id = ?
//                     `;
//                         updateParams = [cancellation_reason, id, hotelId];
//                         break;

//                     case 'advance':
//                         const [advanceBookings] = await connection.execute(
//                             'SELECT * FROM advance_bookings WHERE id = ? AND hotel_id = ?',
//                             [id, hotelId]
//                         );
//                         booking = advanceBookings[0];

//                         // FIXED: Remove updated_at since it doesn't exist in advance_bookings table
//                         updateQuery = `
//                         UPDATE advance_bookings
//                         SET status = 'cancelled',
//                             cancellation_reason = ?
//                         WHERE id = ? AND hotel_id = ?
//                     `;
//                         updateParams = [cancellation_reason, id, hotelId];
//                         break;

//                     case 'function':
//                         const [functionBookings] = await connection.execute(
//                             'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
//                             [id, hotelId]
//                         );
//                         booking = functionBookings[0];

//                         // FIXED: Remove updated_at since it doesn't exist in function_bookings table
//                         updateQuery = `
//                         UPDATE function_bookings
//                         SET status = 'cancelled',
//                             cancellation_reason = ?
//                         WHERE id = ? AND hotel_id = ?
//                     `;
//                         updateParams = [cancellation_reason, id, hotelId];
//                         break;

//                     default:
//                         throw new Error('Invalid booking type');
//                 }

//                 if (!booking) {
//                     throw new Error('Booking not found');
//                 }

//                 await connection.execute(updateQuery, updateParams);

//                 // Update room status if applicable
//                 if (type === 'room' && booking.room_id) {
//                     await connection.execute(
//                         'UPDATE rooms SET status = ? WHERE id = ? AND hotel_id = ?',
//                         ['available', booking.room_id, hotelId]
//                     );
//                 } else if (type === 'function' && booking.function_room_id) {
//                     await connection.execute(
//                         'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
//                         ['available', booking.function_room_id, hotelId]
//                     );
//                 }

//                 // Process refund if requested
//                 let refundRecord = null;
//                 if (process_refund && refund_amount > 0) {
//                     const refundTransactionId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

//                     const [refundResult] = await connection.execute(`
//                     INSERT INTO booking_refunds (
//                         hotel_id, booking_id, booking_type, refund_amount, refund_method,
//                         refund_status, transaction_id, refund_reason, processed_by,
//                         processed_at, refund_type, deduction_amount, deduction_reason,
//                         notes, original_amount
//                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
//                 `, [
//                         hotelId, id, type, refund_amount, refund_method,
//                         'pending', refundTransactionId, cancellation_reason, userId,
//                         refund_type || 'partial',
//                         deduction_amount || 0, deduction_reason || null,
//                         refund_notes || null,
//                         parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
//                         parseFloat(booking.total || 0)
//                     ]);

//                     const [refundDetails] = await connection.execute(
//                         'SELECT * FROM booking_refunds WHERE id = ?',
//                         [refundResult.insertId]
//                     );
//                     refundRecord = refundDetails[0];

//                     if (refund_method === 'cash') {
//                         await connection.execute(`
//                         UPDATE booking_refunds
//                         SET refund_status = 'completed', processed_at = NOW()
//                         WHERE id = ?
//                     `, [refundResult.insertId]);
//                         refundRecord.refund_status = 'completed';
//                     }

//                     console.log('💰 Refund record created:', {
//                         refund_id: refundResult.insertId,
//                         amount: refund_amount,
//                         type: type,
//                         method: refund_method
//                     });
//                 }

//                 await this.sendCancellationNotification(booking, type, cancellation_reason, refundRecord);

//                 await connection.commit();

//                 res.json({
//                     success: true,
//                     message: 'Booking cancelled successfully',
//                     data: {
//                         booking_id: id,
//                         booking_type: type,
//                         refund: refundRecord,
//                         cancellation_reason
//                     }
//                 });

//             } catch (error) {
//                 await connection.rollback();
//                 throw error;
//             } finally {
//                 connection.release();
//             }

//         } catch (error) {
//             console.error('❌ Process cancellation error:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'SERVER_ERROR',
//                 message: error.message
//             });
//         }
//     }

//     // Get refund history - FIXED VERSION


//     async getRefundHistory(req, res) {
//         try {
//             const hotelId = req.user.hotel_id;
//             const { booking_id, booking_type, from_date, to_date, status } = req.query;

//             // FIXED: Correct SQL query with proper joins
//             let query = `
//             SELECT
//                 r.*,
//                 CASE
//                     WHEN r.booking_type = 'room' THEN b.invoice_number
//                     WHEN r.booking_type = 'advance' THEN ab.invoice_number
//                     WHEN r.booking_type = 'function' THEN fb.booking_reference
//                 END as invoice_number,
//                 CASE
//                     WHEN r.booking_type = 'room' THEN c.name
//                     WHEN r.booking_type = 'advance' THEN cust.name
//                     WHEN r.booking_type = 'function' THEN fb.customer_name
//                 END as customer_name,
//                 u.name as processed_by_name
//             FROM booking_refunds r
//             LEFT JOIN bookings b ON r.booking_id = b.id AND r.booking_type = 'room'
//             LEFT JOIN customers c ON b.customer_id = c.id
//             LEFT JOIN advance_bookings ab ON r.booking_id = ab.id AND r.booking_type = 'advance'
//             LEFT JOIN customers cust ON ab.customer_id = cust.id
//             LEFT JOIN function_bookings fb ON r.booking_id = fb.id AND r.booking_type = 'function'
//             LEFT JOIN users u ON r.processed_by = u.id
//             WHERE r.hotel_id = ?
//         `;

//             const params = [hotelId];

//             if (booking_id) {
//                 query += ` AND r.booking_id = ?`;
//                 params.push(booking_id);
//             }

//             if (booking_type) {
//                 query += ` AND r.booking_type = ?`;
//                 params.push(booking_type);
//             }

//             if (status && status !== 'all') {
//                 query += ` AND r.refund_status = ?`;
//                 params.push(status);
//             }

//             if (from_date && to_date) {
//                 query += ` AND DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?`;
//                 params.push(from_date, to_date);
//             }

//             query += ` ORDER BY r.created_at DESC`;

//             console.log('📊 Refund History Query:', query);
//             console.log('📊 Params:', params);

//             const [refunds] = await pool.execute(query, params);

//             res.json({
//                 success: true,
//                 data: refunds,
//                 count: refunds.length
//             });

//         } catch (error) {
//             console.error('❌ Get refund history error:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'SERVER_ERROR',
//                 message: error.message
//             });
//         }
//     }

//     // Update refund status
//     async updateRefundStatus(req, res) {
//         try {
//             const { refundId } = req.params;
//             const { refund_status, transaction_id, notes } = req.body;
//             const hotelId = req.user.hotel_id;

//             const [result] = await pool.execute(`
//                 UPDATE booking_refunds
//                 SET refund_status = ?,
//                     transaction_id = COALESCE(?, transaction_id),
//                     notes = CONCAT(notes, '\n', ?),
//                     processed_at = NOW()
//                 WHERE id = ? AND hotel_id = ?
//             `, [refund_status, transaction_id, notes || '', refundId, hotelId]);

//             if (result.affectedRows === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     error: 'REFUND_NOT_FOUND',
//                     message: 'Refund record not found'
//                 });
//             }

//             const [updatedRefund] = await pool.execute(
//                 'SELECT * FROM booking_refunds WHERE id = ?',
//                 [refundId]
//             );

//             res.json({
//                 success: true,
//                 message: 'Refund status updated successfully',
//                 data: updatedRefund[0]
//             });

//         } catch (error) {
//             console.error('❌ Update refund status error:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'SERVER_ERROR',
//                 message: error.message
//             });
//         }
//     }

//     // Helper: Send cancellation notification
//     async sendCancellationNotification(booking, type, reason, refund = null) {
//         try {
//             const hotelId = booking.hotel_id;

//             const [hotelRows] = await pool.execute(`
//                 SELECT h.*, u.email as hotel_email, u.phone as hotel_phone, u.name as hotel_admin_name
//                 FROM hotels h
//                 LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
//                 WHERE h.id = ?
//             `, [hotelId]);

//             const hotel = hotelRows[0] || {};

//             // Get customer name based on booking type
//             let customerName = '';
//             let customerEmail = '';
//             let customerPhone = '';

//             if (type === 'room' && booking.customer_id) {
//                 const [customerRows] = await pool.execute(
//                     'SELECT name, email, phone FROM customers WHERE id = ?',
//                     [booking.customer_id]
//                 );
//                 if (customerRows[0]) {
//                     customerName = customerRows[0].name;
//                     customerEmail = customerRows[0].email;
//                     customerPhone = customerRows[0].phone;
//                 }
//             } else if (type === 'advance' && booking.customer_id) {
//                 const [customerRows] = await pool.execute(
//                     'SELECT name, email, phone FROM customers WHERE id = ?',
//                     [booking.customer_id]
//                 );
//                 if (customerRows[0]) {
//                     customerName = customerRows[0].name;
//                     customerEmail = customerRows[0].email;
//                     customerPhone = customerRows[0].phone;
//                 }
//             } else if (type === 'function') {
//                 customerName = booking.customer_name;
//                 customerEmail = booking.customer_email;
//                 customerPhone = booking.customer_phone;
//             }

//             const notificationData = {
//                 booking_type: type,
//                 booking_id: booking.id,
//                 booking_reference: booking.booking_reference || booking.invoice_number,
//                 customer_name: customerName,
//                 customer_email: customerEmail,
//                 customer_phone: customerPhone,
//                 room_number: booking.room_number,
//                 from_date: booking.from_date || booking.booking_date,
//                 to_date: booking.to_date || booking.end_date,
//                 total_amount: booking.total || booking.total_amount,
//                 advance_paid: booking.advance_paid || booking.advance_amount || 0,
//                 cancellation_reason: reason,
//                 refund: refund ? {
//                     amount: refund.refund_amount,
//                     method: refund.refund_method,
//                     status: refund.refund_status
//                 } : null
//             };

//             // Send email if customer email exists
//             if (notificationData.customer_email) {
//                 try {
//                     await EmailService.sendCancellationConfirmation(notificationData, hotel);
//                     console.log(`✅ Cancellation email sent to: ${notificationData.customer_email}`);
//                 } catch (emailError) {
//                     console.error('Email error:', emailError.message);
//                 }
//             }

//             // Send WhatsApp if customer phone exists
//             if (notificationData.customer_phone) {
//                 try {
//                     await WhatsAppService.sendCancellationNotification(notificationData, hotel);
//                     console.log(`📱 Cancellation WhatsApp sent to: ${notificationData.customer_phone}`);
//                 } catch (whatsappError) {
//                     console.error('WhatsApp error:', whatsappError.message);
//                 }
//             }

//         } catch (error) {
//             console.error('❌ Error sending cancellation notification:', error);
//         }
//     }
// }

// module.exports = new RefundController();



// // // controllers/refundController.js
// // const { pool } = require('../config/database');
// // const EmailService = require('../services/emailService');
// // const WhatsAppService = require('../services/whatsappService');

// // class RefundController {

// //     // Get cancellable bookings for a hotel
// //     async getCancellableBookings(req, res) {
// //         try {
// //             const hotelId = req.user.hotel_id;
// //             const {
// //                 type,
// //                 status,
// //                 from_date,
// //                 to_date,
// //                 created_before_days, // NEW: Filter bookings created before X days
// //                 created_after_date,   // NEW: Filter bookings created after specific date
// //                 show_all = 'false'    // NEW: Show all or only cancellable
// //             } = req.query;

// //             let results = {
// //                 room_bookings: [],
// //                 advance_bookings: [],
// //                 function_bookings: []
// //             };

// //             // Calculate date threshold for "created before X days"
// //             let dateThreshold = null;
// //             if (created_before_days && !isNaN(parseInt(created_before_days))) {
// //                 const days = parseInt(created_before_days);
// //                 dateThreshold = new Date();
// //                 dateThreshold.setDate(dateThreshold.getDate() - days);
// //                 dateThreshold = dateThreshold.toISOString().split('T')[0];
// //                 console.log(`📅 Filtering bookings created before: ${dateThreshold} (${days} days ago)`);
// //             }

// //             // 1. Room Bookings
// //             if (!type || type === 'room') {
// //                 let roomQuery = `
// //           SELECT
// //             b.id as booking_id,
// //             'room' as booking_type,
// //             b.invoice_number,
// //             b.customer_id,
// //             c.name as customer_name,
// //             c.phone as customer_phone,
// //             c.email as customer_email,
// //             r.room_number,
// //             b.from_date,
// //             b.to_date,
// //             b.total,
// //             b.advance_amount_paid as advance_paid,
// //             b.remaining_amount,
// //             b.payment_method,
// //             b.payment_status,
// //             b.status,
// //             b.created_at,
// //             b.cancellation_reason,
// //             DATEDIFF(CURDATE(), DATE(b.created_at)) as days_since_created
// //           FROM bookings b
// //           LEFT JOIN customers c ON b.customer_id = c.id
// //           LEFT JOIN rooms r ON b.room_id = r.id
// //           WHERE b.hotel_id = ?
// //           AND b.status NOT IN ('cancelled')
// //         `;

// //                 const params = [hotelId];

// //                 // Add date filter for created date
// //                 if (dateThreshold && show_all !== 'true') {
// //                     roomQuery += ` AND DATE(b.created_at) <= ?`;
// //                     params.push(dateThreshold);
// //                 }

// //                 if (created_after_date) {
// //                     roomQuery += ` AND DATE(b.created_at) >= ?`;
// //                     params.push(created_after_date);
// //                 }

// //                 if (status && status !== 'all') {
// //                     roomQuery += ` AND b.status = ?`;
// //                     params.push(status);
// //                 }

// //                 if (from_date && to_date) {
// //                     roomQuery += ` AND b.from_date >= ? AND b.to_date <= ?`;
// //                     params.push(from_date, to_date);
// //                 }

// //                 roomQuery += ` ORDER BY b.created_at DESC`;

// //                 const [roomBookings] = await pool.execute(roomQuery, params);
// //                 results.room_bookings = roomBookings;
// //             }

// //             // 2. Advance Bookings
// //             if (!type || type === 'advance') {
// //                 let advanceQuery = `
// //           SELECT
// //             ab.id as booking_id,
// //             'advance' as booking_type,
// //             ab.invoice_number,
// //             ab.customer_id,
// //             c.name as customer_name,
// //             c.phone as customer_phone,
// //             c.email as customer_email,
// //             r.room_number,
// //             ab.from_date,
// //             ab.to_date,
// //             ab.total,
// //             ab.advance_amount as advance_paid,
// //             ab.remaining_amount,
// //             ab.payment_method,
// //             ab.payment_status,
// //             ab.status,
// //             ab.created_at,
// //             ab.advance_expiry_date,
// //             ab.cancellation_reason,
// //             DATEDIFF(CURDATE(), DATE(ab.created_at)) as days_since_created
// //           FROM advance_bookings ab
// //           LEFT JOIN customers c ON ab.customer_id = c.id
// //           LEFT JOIN rooms r ON ab.room_id = r.id
// //           WHERE ab.hotel_id = ?
// //           AND ab.status NOT IN ('cancelled', 'converted')
// //         `;

// //                 const params = [hotelId];

// //                 if (dateThreshold && show_all !== 'true') {
// //                     advanceQuery += ` AND DATE(ab.created_at) <= ?`;
// //                     params.push(dateThreshold);
// //                 }

// //                 if (created_after_date) {
// //                     advanceQuery += ` AND DATE(ab.created_at) >= ?`;
// //                     params.push(created_after_date);
// //                 }

// //                 if (status && status !== 'all') {
// //                     advanceQuery += ` AND ab.status = ?`;
// //                     params.push(status);
// //                 }

// //                 if (from_date && to_date) {
// //                     advanceQuery += ` AND ab.from_date >= ? AND ab.to_date <= ?`;
// //                     params.push(from_date, to_date);
// //                 }

// //                 advanceQuery += ` ORDER BY ab.created_at DESC`;

// //                 const [advanceBookings] = await pool.execute(advanceQuery, params);
// //                 results.advance_bookings = advanceBookings;
// //             }

// //             // 3. Function Bookings
// //             if (!type || type === 'function') {
// //                 let functionQuery = `
// //           SELECT
// //             fb.id as booking_id,
// //             'function' as booking_type,
// //             fb.booking_reference as invoice_number,
// //             fb.customer_id,
// //             fb.customer_name,
// //             fb.customer_phone,
// //             fb.customer_email,
// //             fr.room_number,
// //             fb.booking_date as from_date,
// //             fb.end_date as to_date,
// //             fb.total_amount as total,
// //             fb.advance_paid,
// //             (fb.total_amount - fb.advance_paid) as remaining_amount,
// //             fb.payment_method,
// //             fb.payment_status,
// //             fb.status,
// //             fb.created_at,
// //             fb.cancellation_reason,
// //             DATEDIFF(CURDATE(), DATE(fb.created_at)) as days_since_created
// //           FROM function_bookings fb
// //           LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
// //           WHERE fb.hotel_id = ?
// //           AND fb.status NOT IN ('cancelled')
// //         `;

// //                 const params = [hotelId];

// //                 if (dateThreshold && show_all !== 'true') {
// //                     functionQuery += ` AND DATE(fb.created_at) <= ?`;
// //                     params.push(dateThreshold);
// //                 }

// //                 if (created_after_date) {
// //                     functionQuery += ` AND DATE(fb.created_at) >= ?`;
// //                     params.push(created_after_date);
// //                 }

// //                 if (status && status !== 'all') {
// //                     functionQuery += ` AND fb.status = ?`;
// //                     params.push(status);
// //                 }

// //                 if (from_date && to_date) {
// //                     functionQuery += ` AND fb.booking_date >= ? AND fb.end_date <= ?`;
// //                     params.push(from_date, to_date);
// //                 }

// //                 functionQuery += ` ORDER BY fb.created_at DESC`;

// //                 const [functionBookings] = await pool.execute(functionQuery, params);
// //                 results.function_bookings = functionBookings;
// //             }

// //             // Add summary statistics
// //             const summary = {
// //                 total: results.room_bookings.length + results.advance_bookings.length + results.function_bookings.length,
// //                 by_type: {
// //                     room: results.room_bookings.length,
// //                     advance: results.advance_bookings.length,
// //                     function: results.function_bookings.length
// //                 },
// //                 filter_applied: {
// //                     created_before_days: created_before_days || null,
// //                     created_before_date: dateThreshold,
// //                     created_after_date: created_after_date || null,
// //                     show_all: show_all === 'true'
// //                 }
// //             };

// //             res.json({
// //                 success: true,
// //                 data: results,
// //                 summary: summary,
// //                 counts: {
// //                     room: results.room_bookings.length,
// //                     advance: results.advance_bookings.length,
// //                     function: results.function_bookings.length
// //                 }
// //             });

// //         } catch (error) {
// //             console.error('❌ Get cancellable bookings error:', error);
// //             res.status(500).json({
// //                 success: false,
// //                 error: 'SERVER_ERROR',
// //                 message: error.message
// //             });
// //         }
// //     }

// //     // Get cancellation details for a specific booking
// //     async getCancellationDetails(req, res) {
// //         try {
// //             const { id } = req.params;
// //             const { type } = req.query;
// //             const hotelId = req.user.hotel_id;

// //             let booking = null;
// //             let tableName = '';

// //             // Get booking based on type
// //             switch (type) {
// //                 case 'room':
// //                     const [roomBookings] = await pool.execute(`
// //             SELECT
// //               b.*,
// //               c.name as customer_name,
// //               c.phone as customer_phone,
// //               c.email as customer_email,
// //               r.room_number,
// //               r.type as room_type
// //             FROM bookings b
// //             LEFT JOIN customers c ON b.customer_id = c.id
// //             LEFT JOIN rooms r ON b.room_id = r.id
// //             WHERE b.id = ? AND b.hotel_id = ?
// //           `, [id, hotelId]);
// //                     booking = roomBookings[0];
// //                     tableName = 'bookings';
// //                     break;

// //                 case 'advance':
// //                     const [advanceBookings] = await pool.execute(`
// //             SELECT
// //               ab.*,
// //               c.name as customer_name,
// //               c.phone as customer_phone,
// //               c.email as customer_email,
// //               r.room_number,
// //               r.type as room_type
// //             FROM advance_bookings ab
// //             LEFT JOIN customers c ON ab.customer_id = c.id
// //             LEFT JOIN rooms r ON ab.room_id = r.id
// //             WHERE ab.id = ? AND ab.hotel_id = ?
// //           `, [id, hotelId]);
// //                     booking = advanceBookings[0];
// //                     tableName = 'advance_bookings';
// //                     break;

// //                 case 'function':
// //                     const [functionBookings] = await pool.execute(`
// //             SELECT
// //               fb.*,
// //               fr.room_number,
// //               fr.name as room_name
// //             FROM function_bookings fb
// //             LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
// //             WHERE fb.id = ? AND fb.hotel_id = ?
// //           `, [id, hotelId]);
// //                     booking = functionBookings[0];
// //                     tableName = 'function_bookings';
// //                     break;

// //                 default:
// //                     return res.status(400).json({
// //                         success: false,
// //                         error: 'INVALID_TYPE',
// //                         message: 'Invalid booking type'
// //                     });
// //             }

// //             if (!booking) {
// //                 return res.status(404).json({
// //                     success: false,
// //                     error: 'BOOKING_NOT_FOUND',
// //                     message: 'Booking not found'
// //                 });
// //             }

// //             // Get existing refunds for this booking
// //             const [refunds] = await pool.execute(`
// //         SELECT * FROM booking_refunds
// //         WHERE booking_id = ? AND booking_type = ? AND hotel_id = ?
// //         ORDER BY created_at DESC
// //       `, [id, type, hotelId]);

// //             // Calculate cancellation eligibility
// //             const now = new Date();
// //             const checkInDate = new Date(booking.from_date || booking.booking_date);
// //             const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));

// //             let cancellationFee = 0;
// //             let refundPercentage = 100;

// //             // Simple cancellation policy (can be customized per hotel)
// //             if (daysUntilCheckIn >= 7) {
// //                 refundPercentage = 100;
// //                 cancellationFee = 0;
// //             } else if (daysUntilCheckIn >= 3) {
// //                 refundPercentage = 50;
// //                 cancellationFee = 50;
// //             } else if (daysUntilCheckIn >= 1) {
// //                 refundPercentage = 25;
// //                 cancellationFee = 75;
// //             } else {
// //                 refundPercentage = 0;
// //                 cancellationFee = 100;
// //             }

// //             const totalPaid = parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
// //                 parseFloat(booking.total || 0);
// //             const maxRefund = totalPaid;
// //             const recommendedRefund = (totalPaid * refundPercentage) / 100;

// //             res.json({
// //                 success: true,
// //                 data: {
// //                     booking,
// //                     existing_refunds: refunds,
// //                     cancellation_policy: {
// //                         days_until_checkin: daysUntilCheckIn,
// //                         refund_percentage: refundPercentage,
// //                         cancellation_fee_percentage: cancellationFee,
// //                         max_refund: maxRefund,
// //                         recommended_refund: recommendedRefund
// //                     }
// //                 }
// //             });

// //         } catch (error) {
// //             console.error('❌ Get cancellation details error:', error);
// //             res.status(500).json({
// //                 success: false,
// //                 error: 'SERVER_ERROR',
// //                 message: error.message
// //             });
// //         }
// //     }

// //     // Process cancellation and refund
// //     async processCancellation(req, res) {
// //         try {
// //             const { id } = req.params;
// //             const {
// //                 type,
// //                 cancellation_reason,
// //                 process_refund,
// //                 refund_amount,
// //                 refund_method,
// //                 refund_type,
// //                 deduction_reason,
// //                 deduction_amount,
// //                 refund_notes
// //             } = req.body;

// //             const hotelId = req.user.hotel_id;
// //             const userId = req.user.userId;

// //             // Start transaction
// //             const connection = await pool.getConnection();
// //             await connection.beginTransaction();

// //             try {
// //                 let booking = null;
// //                 let updateQuery = '';
// //                 let updateParams = [];

// //                 // Get booking and prepare update based on type
// //                 switch (type) {
// //                     case 'room':
// //                         const [roomBookings] = await connection.execute(
// //                             'SELECT * FROM bookings WHERE id = ? AND hotel_id = ?',
// //                             [id, hotelId]
// //                         );
// //                         booking = roomBookings[0];

// //                         updateQuery = `
// //               UPDATE bookings
// //               SET status = 'cancelled',
// //                   cancellation_reason = ?,
// //                   updated_at = NOW()
// //               WHERE id = ? AND hotel_id = ?
// //             `;
// //                         updateParams = [cancellation_reason, id, hotelId];
// //                         break;

// //                     case 'advance':
// //                         const [advanceBookings] = await connection.execute(
// //                             'SELECT * FROM advance_bookings WHERE id = ? AND hotel_id = ?',
// //                             [id, hotelId]
// //                         );
// //                         booking = advanceBookings[0];

// //                         updateQuery = `
// //               UPDATE advance_bookings
// //               SET status = 'cancelled',
// //                   cancellation_reason = ?,
// //                   updated_at = NOW()
// //               WHERE id = ? AND hotel_id = ?
// //             `;
// //                         updateParams = [cancellation_reason, id, hotelId];
// //                         break;

// //                     case 'function':
// //                         const [functionBookings] = await connection.execute(
// //                             'SELECT * FROM function_bookings WHERE id = ? AND hotel_id = ?',
// //                             [id, hotelId]
// //                         );
// //                         booking = functionBookings[0];

// //                         updateQuery = `
// //               UPDATE function_bookings
// //               SET status = 'cancelled',
// //                   cancellation_reason = ?,
// //                   updated_at = NOW()
// //               WHERE id = ? AND hotel_id = ?
// //             `;
// //                         updateParams = [cancellation_reason, id, hotelId];
// //                         break;

// //                     default:
// //                         throw new Error('Invalid booking type');
// //                 }

// //                 if (!booking) {
// //                     throw new Error('Booking not found');
// //                 }

// //                 // Update booking status
// //                 await connection.execute(updateQuery, updateParams);

// //                 // Update room status if applicable
// //                 if (type === 'room' && booking.room_id) {
// //                     await connection.execute(
// //                         'UPDATE rooms SET status = ? WHERE id = ? AND hotel_id = ?',
// //                         ['available', booking.room_id, hotelId]
// //                     );
// //                 } else if (type === 'function' && booking.function_room_id) {
// //                     await connection.execute(
// //                         'UPDATE function_rooms SET status = ? WHERE id = ? AND hotel_id = ?',
// //                         ['available', booking.function_room_id, hotelId]
// //                     );
// //                 }

// //                 // Process refund if requested
// //                 let refundRecord = null;
// //                 if (process_refund && refund_amount > 0) {
// //                     const refundTransactionId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// //                     const [refundResult] = await connection.execute(`
// //             INSERT INTO booking_refunds (
// //               hotel_id, booking_id, booking_type, refund_amount, refund_method,
// //               refund_status, transaction_id, refund_reason, processed_by,
// //               processed_at, refund_type, deduction_amount, deduction_reason,
// //               notes, original_amount
// //             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
// //           `, [
// //                         hotelId, id, type, refund_amount, refund_method,
// //                         'pending', refundTransactionId, cancellation_reason, userId,
// //                         refund_type || 'partial',
// //                         deduction_amount || 0, deduction_reason || null,
// //                         refund_notes || null,
// //                         parseFloat(booking.advance_paid || booking.advance_amount || 0) ||
// //                         parseFloat(booking.total || 0)
// //                     ]);

// //                     const [refundDetails] = await connection.execute(
// //                         'SELECT * FROM booking_refunds WHERE id = ?',
// //                         [refundResult.insertId]
// //                     );
// //                     refundRecord = refundDetails[0];

// //                     // If refund method is cash, mark as completed immediately
// //                     if (refund_method === 'cash') {
// //                         await connection.execute(`
// //               UPDATE booking_refunds
// //               SET refund_status = 'completed', processed_at = NOW()
// //               WHERE id = ?
// //             `, [refundResult.insertId]);
// //                         refundRecord.refund_status = 'completed';
// //                     }

// //                     console.log('💰 Refund record created:', {
// //                         refund_id: refundResult.insertId,
// //                         amount: refund_amount,
// //                         type: type,
// //                         method: refund_method
// //                     });
// //                 }

// //                 // Send cancellation notification
// //                 await this.sendCancellationNotification(booking, type, cancellation_reason, refund_record);

// //                 await connection.commit();

// //                 res.json({
// //                     success: true,
// //                     message: 'Booking cancelled successfully',
// //                     data: {
// //                         booking_id: id,
// //                         booking_type: type,
// //                         refund: refundRecord,
// //                         cancellation_reason
// //                     }
// //                 });

// //             } catch (error) {
// //                 await connection.rollback();
// //                 throw error;
// //             } finally {
// //                 connection.release();
// //             }

// //         } catch (error) {
// //             console.error('❌ Process cancellation error:', error);
// //             res.status(500).json({
// //                 success: false,
// //                 error: 'SERVER_ERROR',
// //                 message: error.message
// //             });
// //         }
// //     }

// //     // Get refund history


// //     async getRefundHistory(req, res) {
// //         try {
// //             const hotelId = req.user.hotel_id;
// //             const { booking_id, booking_type, from_date, to_date, status } = req.query;

// //             let query = `
// //             SELECT r.*,
// //                    CASE
// //                      WHEN r.booking_type = 'room' THEN b.invoice_number
// //                      WHEN r.booking_type = 'advance' THEN ab.invoice_number
// //                      WHEN r.booking_type = 'function' THEN fb.booking_reference
// //                    END as invoice_number,
// //                    CASE
// //                      WHEN r.booking_type = 'room' THEN c.name
// //                      WHEN r.booking_type = 'advance' THEN cust.name
// //                      WHEN r.booking_type = 'function' THEN fb.customer_name
// //                    END as customer_name,
// //                    u.name as processed_by_name
// //             FROM booking_refunds r
// //             LEFT JOIN bookings b ON r.booking_id = b.id AND r.booking_type = 'room'
// //             LEFT JOIN customers c ON b.customer_id = c.id
// //             LEFT JOIN advance_bookings ab ON r.booking_id = ab.id AND r.booking_type = 'advance'
// //             LEFT JOIN customers cust ON ab.customer_id = cust.id
// //             LEFT JOIN function_bookings fb ON r.booking_id = fb.id AND r.booking_type = 'function'
// //             LEFT JOIN users u ON r.processed_by = u.id
// //             WHERE r.hotel_id = ?
// //         `;

// //             const params = [hotelId];

// //             if (booking_id) {
// //                 query += ` AND r.booking_id = ?`;
// //                 params.push(booking_id);
// //             }

// //             if (booking_type) {
// //                 query += ` AND r.booking_type = ?`;
// //                 params.push(booking_type);
// //             }

// //             if (status && status !== 'all') {
// //                 query += ` AND r.refund_status = ?`;
// //                 params.push(status);
// //             }

// //             if (from_date && to_date) {
// //                 query += ` AND DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?`;
// //                 params.push(from_date, to_date);
// //             }

// //             query += ` ORDER BY r.created_at DESC`;

// //             const [refunds] = await pool.execute(query, params);

// //             res.json({
// //                 success: true,
// //                 data: refunds,
// //                 count: refunds.length
// //             });

// //         } catch (error) {
// //             console.error('❌ Get refund history error:', error);
// //             res.status(500).json({
// //                 success: false,
// //                 error: 'SERVER_ERROR',
// //                 message: error.message
// //             });
// //         }
// //     }

// //     // Update refund status
// //     async updateRefundStatus(req, res) {
// //         try {
// //             const { refundId } = req.params;
// //             const { refund_status, transaction_id, notes } = req.body;
// //             const hotelId = req.user.hotel_id;

// //             const [result] = await pool.execute(`
// //         UPDATE booking_refunds
// //         SET refund_status = ?,
// //             transaction_id = COALESCE(?, transaction_id),
// //             notes = CONCAT(notes, '\n', ?),
// //             processed_at = NOW()
// //         WHERE id = ? AND hotel_id = ?
// //       `, [refund_status, transaction_id, notes || '', refundId, hotelId]);

// //             if (result.affectedRows === 0) {
// //                 return res.status(404).json({
// //                     success: false,
// //                     error: 'REFUND_NOT_FOUND',
// //                     message: 'Refund record not found'
// //                 });
// //             }

// //             const [updatedRefund] = await pool.execute(
// //                 'SELECT * FROM booking_refunds WHERE id = ?',
// //                 [refundId]
// //             );

// //             res.json({
// //                 success: true,
// //                 message: 'Refund status updated successfully',
// //                 data: updatedRefund[0]
// //             });

// //         } catch (error) {
// //             console.error('❌ Update refund status error:', error);
// //             res.status(500).json({
// //                 success: false,
// //                 error: 'SERVER_ERROR',
// //                 message: error.message
// //             });
// //         }
// //     }

// //     // Helper: Send cancellation notification
// //     async sendCancellationNotification(booking, type, reason, refund = null) {
// //         try {
// //             const hotelId = booking.hotel_id;

// //             // Get hotel details
// //             const [hotelRows] = await pool.execute(`
// //         SELECT h.*, u.email as hotel_email, u.phone as hotel_phone, u.name as hotel_admin_name
// //         FROM hotels h
// //         LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
// //         WHERE h.id = ?
// //       `, [hotelId]);

// //             const hotel = hotelRows[0] || {};

// //             const notificationData = {
// //                 booking_type: type,
// //                 booking_id: booking.id,
// //                 booking_reference: booking.booking_reference || booking.invoice_number,
// //                 customer_name: booking.customer_name,
// //                 customer_email: booking.customer_email,
// //                 customer_phone: booking.customer_phone,
// //                 room_number: booking.room_number,
// //                 from_date: booking.from_date || booking.booking_date,
// //                 to_date: booking.to_date || booking.end_date,
// //                 total_amount: booking.total || booking.total_amount,
// //                 advance_paid: booking.advance_paid || booking.advance_amount || 0,
// //                 cancellation_reason: reason,
// //                 refund: refund ? {
// //                     amount: refund.refund_amount,
// //                     method: refund.refund_method,
// //                     status: refund.refund_status
// //                 } : null
// //             };

// //             // Send email if customer email exists
// //             if (notificationData.customer_email) {
// //                 await EmailService.sendCancellationConfirmation(notificationData, hotel);
// //                 console.log(`✅ Cancellation email sent to: ${notificationData.customer_email}`);
// //             }

// //             // Send WhatsApp if customer phone exists
// //             if (notificationData.customer_phone) {
// //                 try {
// //                     await WhatsAppService.sendCancellationNotification(notificationData, hotel);
// //                     console.log(`📱 Cancellation WhatsApp sent to: ${notificationData.customer_phone}`);
// //                 } catch (whatsappError) {
// //                     console.error('WhatsApp error:', whatsappError.message);
// //                 }
// //             }

// //         } catch (error) {
// //             console.error('❌ Error sending cancellation notification:', error);
// //         }
// //     }
// // }

// // module.exports = new RefundController();