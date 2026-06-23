const { pool } = require('../config/database');
const { serializeGuestsForDb } = require('../utils/guestUtils');

class AdvanceBooking {
    // Create a new advance booking
    // static async create(data) {
    //     const {
    //         hotel_id,
    //         customer_id,
    //         room_id,
    //         from_date,
    //         to_date,
    //         from_time = '14:00',
    //         to_time = '12:00',
    //         guests = 1,
    //         amount = 0,
    //         advance_amount = 0,
    //         remaining_amount = 0,
    //         service = 0,
    //         cgst = 0,
    //         sgst = 0,
    //         igst = 0,
    //         total = 0,
    //         payment_method = 'cash',
    //         payment_status = 'pending',
    //         transaction_id = null,
    //         status = 'pending',
    //         expiry_days = 30,
    //         special_requests = '',
    //         id_type = 'aadhaar',
    //         id_number = '',
    //         id_image = null,
    //         id_image2 = null,
    //         referral_by = '',
    //         referral_amount = 0,
    //         address = '',
    //         city = '',
    //         state = '',
    //         pincode = '',
    //         customer_gst_no = '',
    //         purpose_of_visit = '',
    //         other_expenses = 0,
    //         expense_description = '',
    //         created_by = null,
    //         notes = ''
    //     } = data;

    //     // Calculate expiry date
    //     const advance_expiry_date = new Date();
    //     advance_expiry_date.setDate(advance_expiry_date.getDate() + expiry_days);

    //     // Generate invoice number
    //     const invoice_number = await this.getNextInvoiceNumber(hotel_id);

    //     const [result] = await pool.execute(
    //         `INSERT INTO advance_bookings (
    //             hotel_id, customer_id, room_id, from_date, to_date, from_time, to_time,
    //             guests, amount, advance_amount, remaining_amount, service, cgst, sgst, igst, total,
    //             payment_method, payment_status, transaction_id, invoice_number, status,
    //             advance_expiry_date, expiry_days, special_requests, id_type, id_number,
    //             id_image, id_image2, referral_by, referral_amount, address, city, state,
    //             pincode, customer_gst_no, purpose_of_visit, other_expenses, expense_description,
    //             created_by, notes
    //         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    //         [
    //             hotel_id, customer_id, room_id, from_date, to_date, from_time, to_time,
    //             guests, amount, advance_amount, remaining_amount, service, cgst, sgst, igst, total,
    //             payment_method, payment_status, transaction_id, invoice_number, status,
    //             advance_expiry_date, expiry_days, special_requests, id_type, id_number,
    //             id_image, id_image2, referral_by, referral_amount, address, city, state,
    //             pincode, customer_gst_no, purpose_of_visit, other_expenses, expense_description,
    //             created_by, notes
    //         ]
    //     );

    //     return result.insertId;
    // }
    static async create(data) {
    const {
        hotel_id,
        customer_id,
        room_id,
        group_booking_id,
        from_date,
        to_date,
        from_time = '14:00',
        to_time = '12:00',
        guests = 1,
        amount = 0,
        advance_amount = 0,
        remaining_amount = 0,
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
        address = '',
        city = '',
        state = '',
        pincode = '',
        customer_gst_no = '',
        purpose_of_visit = '',
        other_expenses = 0,
        expense_description = '',
        created_by = null,
        notes = ''
    } = data;

    const advance_expiry_date = new Date();
    advance_expiry_date.setDate(advance_expiry_date.getDate() + expiry_days);
    const invoice_number = await this.getNextInvoiceNumber(hotel_id);
    const guestsStored = serializeGuestsForDb(data);

    const [result] = await pool.execute(
        `INSERT INTO advance_bookings (
            hotel_id, customer_id, room_id, group_booking_id, from_date, to_date, from_time, to_time,
            guests, amount, advance_amount, remaining_amount, service, cgst, sgst, igst, total,
            payment_method, payment_status, transaction_id, invoice_number, status,
            advance_expiry_date, expiry_days, special_requests, id_type, id_number,
            id_image, id_image2, referral_by, referral_amount, address, city, state,
            pincode, customer_gst_no, purpose_of_visit, other_expenses, expense_description,
            created_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            hotel_id, customer_id, room_id, group_booking_id, from_date, to_date, from_time, to_time,
            guestsStored, amount, advance_amount, remaining_amount, service, cgst, sgst, igst, total,
            payment_method, payment_status, transaction_id, invoice_number, status,
            advance_expiry_date, expiry_days, special_requests, id_type, id_number,
            id_image, id_image2, referral_by, referral_amount, address, city, state,
            pincode, customer_gst_no, purpose_of_visit, other_expenses, expense_description,
            created_by, notes
        ]
    );

    return result.insertId;
}

    // Get next invoice number
    static async getNextInvoiceNumber(hotelId) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as count FROM advance_bookings 
             WHERE hotel_id = ? AND DATE(created_at) = CURDATE()`,
            [hotelId]
        );

        const count = rows[0].count + 1;
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return `ADV-${year}${month}${day}-${count.toString().padStart(4, '0')}`;
    }

    // Find advance booking by ID
    // Find advance booking by ID - FIXED VERSION
    static async findById(id, hotelId) {
        const [rows] = await pool.execute(
            `SELECT ab.*, 
                r.room_number, r.type as room_type,
                c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
                u.name as created_by_name
         FROM advance_bookings ab
         LEFT JOIN rooms r ON ab.room_id = r.id
         LEFT JOIN customers c ON ab.customer_id = c.id
         LEFT JOIN users u ON ab.created_by = u.id
         WHERE ab.id = ? AND ab.hotel_id = ?`,
            [id, hotelId]
        );

        if (rows[0]) {
            const booking = rows[0];

            // Format dates for frontend (YYYY-MM-DD format)
            const formatDateForFrontend = (dateStr) => {
                if (!dateStr) return null;
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Return dates in YYYY-MM-DD format
            return {
                ...booking,
                from_date: formatDateForFrontend(booking.from_date),
                to_date: formatDateForFrontend(booking.to_date),
                advance_expiry_date: formatDateForFrontend(booking.advance_expiry_date),
                created_at: booking.created_at, // Keep original for timestamps
                updated_at: booking.updated_at
            };
        }
        return null;
    }

    // Get all advance bookings for hotel
    // Get all advance bookings for hotel - FIXED VERSION
    // static async findByHotel(hotelId, filters = {}) {
    //     let query = `
    //     SELECT ab.*, 
    //            r.room_number, r.type as room_type,
    //            c.name as customer_name, c.phone as customer_phone
    //     FROM advance_bookings ab
    //     LEFT JOIN rooms r ON ab.room_id = r.id
    //     LEFT JOIN customers c ON ab.customer_id = c.id
    //     WHERE ab.hotel_id = ?
    // `;
    //     const params = [hotelId];

    //     if (filters.status) {
    //         query += ` AND ab.status = ?`;
    //         params.push(filters.status);
    //     }

    //     if (filters.payment_status) {
    //         query += ` AND ab.payment_status = ?`;
    //         params.push(filters.payment_status);
    //     }

    //     if (filters.from_date && filters.to_date) {
    //         query += ` AND ab.from_date >= ? AND ab.to_date <= ?`;
    //         params.push(filters.from_date, filters.to_date);
    //     }

    //     query += ` ORDER BY ab.created_at DESC`;

    //     const [rows] = await pool.execute(query, params);

    //     // Format dates for each booking
    //     const formatDateForFrontend = (dateStr) => {
    //         if (!dateStr) return null;
    //         const date = new Date(dateStr);
    //         const year = date.getFullYear();
    //         const month = String(date.getMonth() + 1).padStart(2, '0');
    //         const day = String(date.getDate()).padStart(2, '0');
    //         return `${year}-${month}-${day}`;
    //     };

    //     return rows.map(booking => ({
    //         ...booking,
    //         from_date: formatDateForFrontend(booking.from_date),
    //         to_date: formatDateForFrontend(booking.to_date),
    //         advance_expiry_date: formatDateForFrontend(booking.advance_expiry_date)
    //     }));
    // }

    // Get all advance bookings for hotel
    // static async findByHotel(hotelId, filters = {}) {
    //     let query = `
    //     SELECT ab.*, 
    //            r.room_number, r.type as room_type,
    //            c.name as customer_name, c.phone as customer_phone
    //     FROM advance_bookings ab
    //     LEFT JOIN rooms r ON ab.room_id = r.id
    //     LEFT JOIN customers c ON ab.customer_id = c.id
    //     WHERE ab.hotel_id = ?
    //     `;
    //     const params = [hotelId];

    //     if (filters.status) {
    //         query += ` AND ab.status = ?`;
    //         params.push(filters.status);
    //     }

    //     if (filters.payment_status) {
    //         query += ` AND ab.payment_status = ?`;
    //         params.push(filters.payment_status);
    //     }

    //     if (filters.from_date && filters.to_date) {
    //         query += ` AND DATE(ab.from_date) >= ? AND DATE(ab.to_date) <= ?`;
    //         params.push(filters.from_date, filters.to_date);
    //     }

    //     query += ` ORDER BY ab.created_at DESC`;

    //     const [rows] = await pool.execute(query, params);

    //     return rows;
    // }

    // Get all advance bookings for hotel
    static async findByHotel(hotelId, filters = {}) {
        let query = `
    SELECT ab.*, 
           r.room_number, r.type as room_type,
           c.name as customer_name, c.phone as customer_phone
    FROM advance_bookings ab
    LEFT JOIN rooms r ON ab.room_id = r.id
    LEFT JOIN customers c ON ab.customer_id = c.id
    WHERE ab.hotel_id = ?
    `;
        const params = [hotelId];

        if (filters.status) {
            query += ` AND ab.status = ?`;
            params.push(filters.status);
        }

        if (filters.payment_status) {
            query += ` AND ab.payment_status = ?`;
            params.push(filters.payment_status);
        }

        if (filters.from_date && filters.to_date) {
            query += ` AND DATE(ab.from_date) >= ? AND DATE(ab.to_date) <= ?`;
            params.push(filters.from_date, filters.to_date);
        }

        query += ` ORDER BY ab.created_at DESC`;

        const [rows] = await pool.execute(query, params);

        // Add a flag to indicate if checkout was auto-generated
        // This checks if notes contain the auto-generation message
        return rows.map(booking => ({
            ...booking,
            is_checkout_auto_generated: booking.notes ?
                booking.notes.includes('[System] Checkout date was auto-generated') : false
        }));
    }

    // Update advance booking
    static async update(id, hotelId, data) {
        const fields = [];
        const values = [];

        const allowedFields = [
            'customer_id', 'room_id', 'from_date', 'to_date', 'from_time', 'to_time',
            'guests', 'amount', 'advance_amount', 'remaining_amount', 'service',
            'cgst', 'sgst', 'igst', 'total', 'payment_method', 'payment_status',
            'transaction_id', 'status', 'special_requests', 'id_type', 'id_number',
            'id_image', 'id_image2', 'referral_by', 'referral_amount', 'address',
            'city', 'state', 'pincode', 'customer_gst_no', 'purpose_of_visit',
            'other_expenses', 'expense_description', 'notes'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return true;

        values.push(id, hotelId);
        const [result] = await pool.execute(
            `UPDATE advance_bookings SET ${fields.join(', ')} WHERE id = ? AND hotel_id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Update payment status
    static async updatePaymentStatus(id, hotelId, payment_status, transaction_id = null) {
        let query = `UPDATE advance_bookings SET payment_status = ?`;
        const params = [payment_status];

        if (transaction_id) {
            query += `, transaction_id = ?`;
            params.push(transaction_id);
        }

        query += ` WHERE id = ? AND hotel_id = ?`;
        params.push(id, hotelId);

        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    // Update advance amount (for partial payments)
    static async updateAdvanceAmount(id, hotelId, advance_amount, transaction_id = null) {
        const [booking] = await pool.execute(
            `SELECT amount, total FROM advance_bookings WHERE id = ? AND hotel_id = ?`,
            [id, hotelId]
        );

        if (!booking[0]) return false;

        const total = booking[0].total || booking[0].amount;
        const remaining_amount = total - advance_amount;
        const payment_status = remaining_amount <= 0 ? 'completed' : 'partial';

        let query = `UPDATE advance_bookings SET advance_amount = ?, remaining_amount = ?, payment_status = ?`;
        const params = [advance_amount, remaining_amount, payment_status];

        if (transaction_id) {
            query += `, transaction_id = ?`;
            params.push(transaction_id);
        }

        query += ` WHERE id = ? AND hotel_id = ?`;
        params.push(id, hotelId);

        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }


    // static async convertToBooking(advanceBookingId, hotelId, bookingId, convertedBy) {
    //     const [result] = await pool.execute(
    //         `UPDATE advance_bookings 
    //      SET status = 'converted', 
    //          booking_id = ?, 
    //          converted_by = ?, 
    //          converted_at = NOW(),
    //          updated_at = NOW()
    //      WHERE id = ? AND hotel_id = ?`,
    //         [bookingId, convertedBy, advanceBookingId, hotelId]
    //     );
    //     return result.affectedRows > 0;
    // }

    // Cancel advance booking


    // models/AdvanceBooking.js - Update convertToBooking method
    static async convertToBooking(advanceBookingId, hotelId, bookingId, convertedBy) {
        const [result] = await pool.execute(
            `UPDATE advance_bookings 
         SET status = 'converted', 
             payment_status = 'completed',  
             remaining_amount = 0,           
             booking_id = ?, 
             converted_by = ?, 
             converted_at = NOW(),
             updated_at = NOW()
         WHERE id = ? AND hotel_id = ?`,
            [bookingId, convertedBy, advanceBookingId, hotelId]
        );
        return result.affectedRows > 0;
    }

    static async cancel(id, hotelId, reason = '') {
        const [result] = await pool.execute(
            `UPDATE advance_bookings 
             SET status = 'cancelled', notes = CONCAT(notes, '\nCancelled: ', ?)
             WHERE id = ? AND hotel_id = ?`,
            [reason, id, hotelId]
        );
        return result.affectedRows > 0;
    }

    // Check for expired advance bookings
    static async checkExpired(hotelId) {
        const [rows] = await pool.execute(
            `UPDATE advance_bookings 
             SET status = 'expired' 
             WHERE hotel_id = ? AND status = 'pending' 
             AND advance_expiry_date < NOW()`,
            [hotelId]
        );
        return rows.affectedRows;
    }

    // Get stats for advance bookings
    // static async getStats(hotelId) {
    //     const [rows] = await pool.execute(`
    //         SELECT 
    //             COUNT(*) as total,
    //             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    //             SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
    //             SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    //             SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
    //             SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
    //             SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as payment_pending,
    //             SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as payment_partial,
    //             SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as payment_completed,
    //             COALESCE(SUM(advance_amount), 0) as total_advance_collected,
    //             COALESCE(SUM(total), 0) as total_booking_value
    //         FROM advance_bookings 
    //         WHERE hotel_id = ?
    //     `, [hotelId]);

    //     return rows[0];
    // }

    // Get stats for advance bookings
    static async getStats(hotelId) {
        // Get current date in IST
        const now = new Date();
        const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const todayStr = istNow.toISOString().split('T')[0];

        const [rows] = await pool.execute(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
            SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as payment_pending,
            SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as payment_partial,
            SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as payment_completed,
            COALESCE(SUM(advance_amount), 0) as total_advance_collected,
            COALESCE(SUM(total), 0) as total_booking_value
        FROM advance_bookings 
        WHERE hotel_id = ?
        AND DATE(created_at) = ?
    `, [hotelId, todayStr]);  // Only get today's stats

        return rows[0];
    }

    // models/AdvanceBooking.js - Add these methods

    // Create advance booking with group ID
    static async createWithGroup(data) {
        const {
            hotel_id,
            customer_id,
            room_id,
            group_booking_id,  // 👈 NEW
            from_date,
            to_date,
            from_time = '14:00',
            to_time = '12:00',
            guests = 1,
            amount = 0,
            advance_amount = 0,
            remaining_amount = 0,
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
            address = '',
            city = '',
            state = '',
            pincode = '',
            customer_gst_no = '',
            purpose_of_visit = '',
            other_expenses = 0,
            expense_description = '',
            created_by = null,
            notes = ''
        } = data;

        const advance_expiry_date = new Date();
        advance_expiry_date.setDate(advance_expiry_date.getDate() + expiry_days);
        const invoice_number = await this.getNextInvoiceNumber(hotel_id);

        const [result] = await pool.execute(
            `INSERT INTO advance_bookings (
            hotel_id, customer_id, room_id, group_booking_id, from_date, to_date, 
            from_time, to_time, guests, amount, advance_amount, remaining_amount, 
            service, cgst, sgst, igst, total, payment_method, payment_status, 
            transaction_id, invoice_number, status, advance_expiry_date, expiry_days, 
            special_requests, id_type, id_number, id_image, id_image2, referral_by, 
            referral_amount, address, city, state, pincode, customer_gst_no, 
            purpose_of_visit, other_expenses, expense_description, created_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hotel_id, customer_id, room_id, group_booking_id, from_date, to_date,
                from_time, to_time, guests, amount, advance_amount, remaining_amount,
                service, cgst, sgst, igst, total, payment_method, payment_status,
                transaction_id, invoice_number, status, advance_expiry_date, expiry_days,
                special_requests, id_type, id_number, id_image, id_image2, referral_by,
                referral_amount, address, city, state, pincode, customer_gst_no,
                purpose_of_visit, other_expenses, expense_description, created_by, notes
            ]
        );

        return result.insertId;
    }

    // Find all bookings in a group
    static async findByGroupId(groupId, hotelId) {
        const [rows] = await pool.execute(
            `SELECT ab.*, 
            r.room_number, r.type as room_type,
            c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
            u.name as created_by_name
         FROM advance_bookings ab
         LEFT JOIN rooms r ON ab.room_id = r.id
         LEFT JOIN customers c ON ab.customer_id = c.id
         LEFT JOIN users u ON ab.created_by = u.id
         WHERE ab.group_booking_id = ? AND ab.hotel_id = ?
         ORDER BY ab.id`,
            [groupId, hotelId]
        );

        return rows.map(booking => ({
            ...booking,
            from_date: booking.from_date ? new Date(booking.from_date).toISOString().split('T')[0] : null,
            to_date: booking.to_date ? new Date(booking.to_date).toISOString().split('T')[0] : null,
            advance_expiry_date: booking.advance_expiry_date ? new Date(booking.advance_expiry_date).toISOString().split('T')[0] : null
        }));
    }

    // Generate unique group ID
    static generateGroupId() {
        return `ADV-GRP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    // Add to models/AdvanceBooking.js
static async delete(id, hotelId) {
    // First check if booking exists
    const [booking] = await pool.execute(
        'SELECT * FROM advance_bookings WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
    );
    
    if (!booking[0]) return false;
    
    // Check if booking can be deleted (only pending or expired)
    const deletableStatuses = ['pending', 'expired'];
    if (!deletableStatuses.includes(booking[0].status)) {
        throw new Error(`Cannot delete advance booking with status: ${booking[0].status}`);
    }
    
    // Delete the booking
    const [result] = await pool.execute(
        'DELETE FROM advance_bookings WHERE id = ? AND hotel_id = ?',
        [id, hotelId]
    );
    
    return result.affectedRows > 0;
}
}

module.exports = AdvanceBooking;