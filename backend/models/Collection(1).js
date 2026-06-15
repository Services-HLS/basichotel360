// // // const { pool } = require('../config/database');

// // // class Collection {
// // //   // Get collections with filters - FIXED JOIN
// // //   static async getCollections(hotelId, filters = {}) {
// // //     const {
// // //       startDate,
// // //       endDate,
// // //       paymentMode = 'all',
// // //       handoverStatus = 'all',
// // //       limit = 100,
// // //       offset = 0
// // //     } = filters;

// // //     let query = `
// // //       SELECT
// // //         c.*,
// // //         b.id as booking_id,
// // //         b.transaction_id as booking_transaction_id,
// // //         b.payment_method as booking_payment_method,
// // //         b.payment_status as booking_payment_status,
// // //         b.total as booking_total,
// // //         cust.name as guest_name,
// // //         r.room_number,
// // //         u.name as collected_by_name
// // //       FROM collections c
// // //       LEFT JOIN bookings b ON c.booking_id = b.id
// // //       LEFT JOIN customers cust ON b.customer_id = cust.id
// // //       LEFT JOIN rooms r ON b.room_id = r.id
// // //       LEFT JOIN users u ON c.collected_by = u.id
// // //       WHERE c.hotel_id = ?
// // //     `;

// // //     const params = [hotelId];

// // //     // Add date filter
// // //     if (startDate && endDate) {
// // //       query += ` AND DATE(c.collection_date) BETWEEN ? AND ?`;
// // //       params.push(startDate, endDate);
// // //     }

// // //     // Add payment mode filter
// // //     if (paymentMode !== 'all') {
// // //       query += ` AND c.payment_mode = ?`;
// // //       params.push(paymentMode);
// // //     }

// // //     // Add handover status filter
// // //     if (handoverStatus !== 'all') {
// // //       query += ` AND c.handover_status = ?`;
// // //       params.push(handoverStatus);
// // //     }

// // //     query += ` ORDER BY c.collection_date DESC, c.created_at DESC`;

// // //     // Add pagination
// // //     query += ` LIMIT ? OFFSET ?`;
// // //     params.push(parseInt(limit), parseInt(offset));

// // //     console.log('Collections query:', query, params); // Debug

// // //     const [rows] = await pool.execute(query, params);
// // //     return rows;
// // //   }

// // //   // Get collection summary (total cash, online, etc.)
// // //   static async getCollectionSummary(hotelId, startDate, endDate) {
// // //     let query = `
// // //       SELECT
// // //         SUM(CASE WHEN payment_mode = 'cash' THEN amount ELSE 0 END) as total_cash,
// // //         SUM(CASE WHEN payment_mode IN ('online', 'card', 'upi') THEN amount ELSE 0 END) as total_online,
// // //         SUM(amount) as total_amount,
// // //         SUM(CASE WHEN payment_mode = 'cash' AND handover_status = 'handed_over' THEN amount ELSE 0 END) as handed_over_cash,
// // //         SUM(CASE WHEN payment_mode = 'cash' AND handover_status IN ('pending', 'partially_handed_over') THEN amount ELSE 0 END) as pending_handover
// // //       FROM collections
// // //       WHERE hotel_id = ?
// // //     `;

// // //     const params = [hotelId];

// // //     if (startDate && endDate) {
// // //       query += ` AND DATE(collection_date) BETWEEN ? AND ?`;
// // //       params.push(startDate, endDate);
// // //     }

// // //     const [rows] = await pool.execute(query, params);

// // //     const summary = rows[0] || {
// // //       total_cash: 0,
// // //       total_online: 0,
// // //       total_amount: 0,
// // //       handed_over_cash: 0,
// // //       pending_handover: 0
// // //     };

// // //     // Calculate percentages
// // //     const totalAmount = parseFloat(summary.total_amount) || 0;
// // //     const cashAmount = parseFloat(summary.total_cash) || 0;
// // //     const onlineAmount = parseFloat(summary.total_online) || 0;

// // //     const cashPercentage = totalAmount > 0 ? (cashAmount / totalAmount * 100) : 0;
// // //     const onlinePercentage = totalAmount > 0 ? (onlineAmount / totalAmount * 100) : 0;

// // //     return {
// // //       total_cash: cashAmount,
// // //       total_online: onlineAmount,
// // //       total_amount: totalAmount,
// // //       handed_over_cash: parseFloat(summary.handed_over_cash) || 0,
// // //       pending_handover: parseFloat(summary.pending_handover) || 0,
// // //       cash_percentage: cashPercentage,
// // //       online_percentage: onlinePercentage
// // //     };
// // //   }

// // //   // Get collection by ID
// // //   static async getById(collectionId, hotelId) {
// // //     const query = `
// // //       SELECT
// // //         c.*,
// // //         b.id as booking_id,
// // //         b.transaction_id as booking_transaction_id,
// // //         b.payment_method as booking_payment_method,
// // //         b.payment_status as booking_payment_status,
// // //         b.total as booking_total,
// // //         cust.name as guest_name,
// // //         r.room_number,
// // //         u.name as collected_by_name
// // //       FROM collections c
// // //       LEFT JOIN bookings b ON c.booking_id = b.id
// // //       LEFT JOIN customers cust ON b.customer_id = cust.id
// // //       LEFT JOIN rooms r ON b.room_id = r.id
// // //       LEFT JOIN users u ON c.collected_by = u.id
// // //       WHERE c.id = ? AND c.hotel_id = ?
// // //     `;

// // //     const [rows] = await pool.execute(query, [collectionId, hotelId]);
// // //     return rows[0] || null;
// // //   }

// // //   // Create new collection record - UPDATED to auto-capture from booking
// // //   static async create(collectionData) {
// // //     let guestName = collectionData.guest_name;
// // //     let roomNumber = collectionData.room_number;
// // //     let collectedByName = collectionData.collected_by_name;

// // //     // If booking_id is provided, fetch guest and room details
// // //     if (collectionData.booking_id) {
// // //       try {
// // //         const [bookingDetails] = await pool.execute(`
// // //           SELECT
// // //             b.total,
// // //             b.payment_method,
// // //             b.payment_status,
// // //             c.name as guest_name,
// // //             r.room_number
// // //           FROM bookings b
// // //           LEFT JOIN customers c ON b.customer_id = c.id
// // //           LEFT JOIN rooms r ON b.room_id = r.id
// // //           WHERE b.id = ? AND b.hotel_id = ?
// // //         `, [collectionData.booking_id, collectionData.hotel_id]);

// // //         if (bookingDetails.length > 0) {
// // //           guestName = bookingDetails[0].guest_name || guestName;
// // //           roomNumber = bookingDetails[0].room_number || roomNumber;

// // //           // If this is a cash payment for a booking, update booking payment status
// // //           if (collectionData.payment_mode === 'cash' && collectionData.amount >= bookingDetails[0].total) {
// // //             await pool.execute(
// // //               'UPDATE bookings SET payment_status = ? WHERE id = ? AND hotel_id = ?',
// // //               ['completed', collectionData.booking_id, collectionData.hotel_id]
// // //             );
// // //           }
// // //         }
// // //       } catch (error) {
// // //         console.error('Error fetching booking details:', error);
// // //         // Continue without booking details
// // //       }
// // //     }

// // //     // Get collected by name
// // //     if (collectionData.collected_by) {
// // //       try {
// // //         const [userDetails] = await pool.execute(
// // //           'SELECT name FROM users WHERE id = ?',
// // //           [collectionData.collected_by]
// // //         );
// // //         if (userDetails.length > 0) {
// // //           collectedByName = userDetails[0].name;
// // //         }
// // //       } catch (error) {
// // //         console.error('Error fetching user details:', error);
// // //       }
// // //     }

// // //     const query = `
// // //       INSERT INTO collections (
// // //         hotel_id, booking_id, collection_date, payment_mode,
// // //         amount, transaction_id, remarks, collected_by,
// // //         collected_by_name, guest_name, room_number,
// // //         handover_status, created_by
// // //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// // //     `;

// // //     const params = [
// // //       collectionData.hotel_id,
// // //       collectionData.booking_id || null,
// // //       collectionData.collection_date || new Date().toISOString().split('T')[0],
// // //       collectionData.payment_mode,
// // //       collectionData.amount,
// // //       collectionData.transaction_id || null,
// // //       collectionData.remarks || '',
// // //       collectionData.collected_by,
// // //       collectedByName || 'Staff',
// // //       guestName || 'Walk-in',
// // //       roomNumber || null,
// // //       collectionData.payment_mode === 'cash' ? 'pending' : 'not_applicable',
// // //       collectionData.created_by
// // //     ];

// // //     console.log('Creating collection with params:', params); // Debug

// // //     const [result] = await pool.execute(query, params);
// // //     return result.insertId;
// // //   }

// // //   // Update handover status
// // //   static async updateHandover(collectionId, hotelId, handoverData) {
// // //     const query = `
// // //       UPDATE collections
// // //       SET
// // //         handover_status = ?,
// // //         handover_amount = ?,
// // //         handover_date = ?,
// // //         handover_to = ?,
// // //         handover_remarks = ?,
// // //         updated_at = CURRENT_TIMESTAMP
// // //       WHERE id = ? AND hotel_id = ?
// // //     `;

// // //     const params = [
// // //       handoverData.status,
// // //       handoverData.amount,
// // //       handoverData.handover_date || new Date().toISOString().split('T')[0],
// // //       handoverData.handover_to,
// // //       handoverData.remarks || '',
// // //       collectionId,
// // //       hotelId
// // //     ];

// // //     const [result] = await pool.execute(query, params);
// // //     return result.affectedRows > 0;
// // //   }

// // //   // Get collections by booking ID
// // //   static async getByBooking(bookingId, hotelId) {
// // //     const query = `
// // //       SELECT * FROM collections
// // //       WHERE booking_id = ? AND hotel_id = ?
// // //       ORDER BY collection_date DESC
// // //     `;

// // //     const [rows] = await pool.execute(query, [bookingId, hotelId]);
// // //     return rows;
// // //   }

// // //   // Get cash collections from bookings (where payment_method = 'cash' in bookings)
// // //   static async getCashFromBookings(hotelId, startDate, endDate) {
// // //     const query = `
// // //       SELECT
// // //         b.id as booking_id,
// // //         b.created_at as booking_date,
// // //         b.total as booking_amount,
// // //         b.payment_method,
// // //         b.payment_status,
// // //         c.name as guest_name,
// // //         r.room_number,
// // //         cust.id as customer_id,
// // //         IFNULL(SUM(col.amount), 0) as collected_amount,
// // //         (b.total - IFNULL(SUM(col.amount), 0)) as pending_amount
// // //       FROM bookings b
// // //       LEFT JOIN customers c ON b.customer_id = c.id
// // //       LEFT JOIN rooms r ON b.room_id = r.id
// // //       LEFT JOIN collections col ON b.id = col.booking_id
// // //       WHERE b.hotel_id = ?
// // //         AND b.payment_method = 'cash'
// // //         AND b.status = 'booked'
// // //         AND b.total > 0
// // //       GROUP BY b.id
// // //       HAVING pending_amount > 0
// // //       ORDER BY b.created_at DESC
// // //     `;

// // //     const [rows] = await pool.execute(query, [hotelId]);
// // //     return rows;
// // //   }

// // //   // Auto-create collection when booking is made with cash payment
// // //   static async createFromCashBooking(bookingId, hotelId, userId) {
// // //     try {
// // //       // Get booking details
// // //       const [bookingDetails] = await pool.execute(`
// // //         SELECT
// // //           b.total,
// // //           b.payment_method,
// // //           b.payment_status,
// // //           c.name as guest_name,
// // //           r.room_number,
// // //           u.name as collected_by_name
// // //         FROM bookings b
// // //         LEFT JOIN customers c ON b.customer_id = c.id
// // //         LEFT JOIN rooms r ON b.room_id = r.id
// // //         LEFT JOIN users u ON ? = u.id
// // //         WHERE b.id = ? AND b.hotel_id = ?
// // //       `, [userId, bookingId, hotelId]);

// // //       if (bookingDetails.length === 0) {
// // //         console.log('Booking not found for auto-collection');
// // //         return null;
// // //       }

// // //       const booking = bookingDetails[0];

// // //       // Only create collection for cash payments
// // //       if (booking.payment_method === 'cash' && booking.total > 0) {
// // //         const collectionId = await this.create({
// // //           hotel_id: hotelId,
// // //           booking_id: bookingId,
// // //           collection_date: new Date().toISOString().split('T')[0],
// // //           payment_mode: 'cash',
// // //           amount: booking.total,
// // //           transaction_id: null,
// // //           remarks: 'Auto-created from cash booking',
// // //           collected_by: userId,
// // //           guest_name: booking.guest_name,
// // //           room_number: booking.room_number,
// // //           collected_by_name: booking.collected_by_name || 'System',
// // //           created_by: userId
// // //         });

// // //         console.log('Auto-created collection for cash booking:', collectionId);
// // //         return collectionId;
// // //       }

// // //       return null;
// // //     } catch (error) {
// // //       console.error('Error creating auto-collection:', error);
// // //       return null;
// // //     }
// // //   }

// // //   // Get daily collection summary
// // //   static async getDailySummary(hotelId, date = null) {
// // //     const targetDate = date || new Date().toISOString().split('T')[0];

// // //     const query = `
// // //       SELECT
// // //         DATE(collection_date) as date,
// // //         SUM(CASE WHEN payment_mode = 'cash' THEN amount ELSE 0 END) as cash_amount,
// // //         SUM(CASE WHEN payment_mode IN ('online', 'card', 'upi') THEN amount ELSE 0 END) as online_amount,
// // //         SUM(amount) as total_amount,
// // //         COUNT(*) as collection_count
// // //       FROM collections
// // //       WHERE hotel_id = ? AND DATE(collection_date) = ?
// // //       GROUP BY DATE(collection_date)
// // //     `;

// // //     const [rows] = await pool.execute(query, [hotelId, targetDate]);
// // //     return rows[0] || {
// // //       date: targetDate,
// // //       cash_amount: 0,
// // //       online_amount: 0,
// // //       total_amount: 0,
// // //       collection_count: 0
// // //     };
// // //   }

// // //   // Get export data
// // //   static async getExportData(hotelId, filters = {}) {
// // //     const collections = await this.getCollections(hotelId, {
// // //       ...filters,
// // //       limit: 1000
// // //     });

// // //     // Transform data for Excel
// // //     return collections.map(collection => ({
// // //       'Collection ID': collection.id,
// // //       'Date': collection.collection_date,
// // //       'Booking ID': collection.booking_id || 'N/A',
// // //       'Guest Name': collection.guest_name || 'Walk-in',
// // //       'Room Number': collection.room_number || 'N/A',
// // //       'Payment Mode': collection.payment_mode.toUpperCase(),
// // //       'Amount': collection.amount,
// // //       'Transaction ID': collection.transaction_id || 'N/A',
// // //       'Collected By': collection.collected_by_name || collection.collected_by,
// // //       'Handover Status': collection.handover_status.replace(/_/g, ' ').toUpperCase(),
// // //       'Handover Amount': collection.handover_amount || 0,
// // //       'Handover Date': collection.handover_date || 'N/A',
// // //       'Handover To': collection.handover_to || 'N/A',
// // //       'Remarks': collection.remarks || ''
// // //     }));
// // //   }
// // // }

// // // module.exports = Collection;

// // const { pool } = require('../config/database');

// // class Collection {
// //   // Get collections with filters - FINAL WORKING VERSION
// //   static async getCollections(hotelId, filters = {}) {
// //     const {
// //       startDate,
// //       endDate,
// //       paymentMode = 'all',
// //       handoverStatus = 'all',
// //       limit = 100,
// //       offset = 0
// //     } = filters;

// //     console.log('📊 [Collections] hotelId:', hotelId, 'filters:', filters);

// //     // SIMPLE QUERY with proper joins
// //     let query = `
// //       SELECT
// //         c.*,
// //         b.id as booking_id,
// //         b.total as booking_total,
// //         b.payment_method as booking_payment_method,
// //         b.payment_status as booking_payment_status,
// //         cust.name as customer_name,
// //         cust.phone as customer_phone,
// //         r.room_number,
// //         u.name as collected_by_user_name
// //       FROM collections c
// //       LEFT JOIN bookings b ON c.booking_id = b.id
// //       LEFT JOIN customers cust ON b.customer_id = cust.id
// //       LEFT JOIN rooms r ON b.room_id = r.id
// //       LEFT JOIN users u ON c.collected_by = u.id
// //       WHERE c.hotel_id = ?
// //     `;

// //     const params = [hotelId];

// //     // Add date filter
// //     if (startDate && endDate && startDate.trim() !== '' && endDate.trim() !== '') {
// //       query += ` AND c.collection_date BETWEEN ? AND ?`;
// //       params.push(startDate, endDate);
// //     }

// //     // Add payment mode filter
// //     if (paymentMode && paymentMode !== 'all') {
// //       query += ` AND c.payment_mode = ?`;
// //       params.push(paymentMode);
// //     }

// //     // Add handover status filter
// //     if (handoverStatus && handoverStatus !== 'all') {
// //       query += ` AND c.handover_status = ?`;
// //       params.push(handoverStatus);
// //     }

// //     query += ` ORDER BY c.collection_date DESC, c.created_at DESC`;

// //     // Add pagination
// //     const pageLimit = parseInt(limit) || 100;
// //     const pageOffset = parseInt(offset) || 0;
// //     query += ` LIMIT ? OFFSET ?`;
// //     params.push(pageLimit, pageOffset);

// //     console.log('📊 [Collections] Query:', query);
// //     console.log('📊 [Collections] Params:', params);

// //     try {
// //       const [rows] = await pool.execute(query, params);
// //       console.log('✅ [Collections] Success! Found:', rows.length, 'records');

// //       // Format the data for frontend
// //       const formattedCollections = rows.map(row => ({
// //         id: row.id,
// //         booking_id: row.booking_id || null,
// //         guest_name: row.customer_name || 'Walk-in Customer',
// //         room_number: row.room_number || 'N/A',
// //         collection_date: row.collection_date,
// //         payment_mode: row.payment_mode,
// //         amount: parseFloat(row.amount) || 0,
// //         transaction_id: row.transaction_id || null,
// //         remarks: row.remarks || '',
// //         collected_by: row.collected_by,
// //         collected_by_name: row.collected_by_user_name || 'Staff',
// //         handover_status: row.handover_status,
// //         handover_amount: parseFloat(row.handover_amount) || 0,
// //         handover_date: row.handover_date || null,
// //         handover_to: row.handover_to || null,
// //         handover_remarks: row.handover_remarks || '',
// //         created_at: row.created_at,
// //         // Additional booking info
// //         booking_total: parseFloat(row.booking_total) || 0,
// //         booking_payment_method: row.booking_payment_method || 'cash',
// //         booking_payment_status: row.booking_payment_status || 'pending'
// //       }));

// //       return formattedCollections;
// //     } catch (error) {
// //       console.error('❌ [Collections] SQL Error:', error.message);
// //       console.error('❌ [Collections] Failed SQL:', error.sql);
// //       console.error('❌ [Collections] Failed params:', params);
// //       throw error;
// //     }
// //   }

// //   // Get collection summary - WORKING VERSION
// //   static async getCollectionSummary(hotelId, startDate, endDate) {
// //     console.log('📊 [Summary] hotelId:', hotelId, 'dates:', { startDate, endDate });

// //     let query = `
// //       SELECT
// //         COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN amount ELSE 0 END), 0) as total_cash,
// //         COALESCE(SUM(CASE WHEN payment_mode IN ('online', 'card', 'upi') THEN amount ELSE 0 END), 0) as total_online,
// //         COALESCE(SUM(amount), 0) as total_amount,
// //         COALESCE(SUM(CASE WHEN payment_mode = 'cash' AND handover_status = 'handed_over' THEN amount ELSE 0 END), 0) as handed_over_cash,
// //         COALESCE(SUM(CASE WHEN payment_mode = 'cash' AND handover_status IN ('pending', 'partially_handed_over') THEN amount ELSE 0 END), 0) as pending_handover
// //       FROM collections
// //       WHERE hotel_id = ?
// //     `;

// //     const params = [hotelId];

// //     // Add date filter
// //     if (startDate && endDate && startDate.trim() !== '' && endDate.trim() !== '') {
// //       query += ` AND collection_date BETWEEN ? AND ?`;
// //       params.push(startDate, endDate);
// //     }

// //     console.log('📊 [Summary] Query:', query);
// //     console.log('📊 [Summary] Params:', params);

// //     try {
// //       const [rows] = await pool.execute(query, params);
// //       console.log('✅ [Summary] Result:', rows[0]);

// //       const summary = rows[0] || {
// //         total_cash: 0,
// //         total_online: 0,
// //         total_amount: 0,
// //         handed_over_cash: 0,
// //         pending_handover: 0
// //       };

// //       // Calculate percentages
// //       const totalAmount = parseFloat(summary.total_amount) || 0;
// //       const cashAmount = parseFloat(summary.total_cash) || 0;
// //       const onlineAmount = parseFloat(summary.total_online) || 0;

// //       const cashPercentage = totalAmount > 0 ? (cashAmount / totalAmount * 100) : 0;
// //       const onlinePercentage = totalAmount > 0 ? (onlineAmount / totalAmount * 100) : 0;

// //       return {
// //         total_cash: cashAmount,
// //         total_online: onlineAmount,
// //         total_amount: totalAmount,
// //         handed_over_cash: parseFloat(summary.handed_over_cash) || 0,
// //         pending_handover: parseFloat(summary.pending_handover) || 0,
// //         cash_percentage: cashPercentage,
// //         online_percentage: onlinePercentage
// //       };
// //     } catch (error) {
// //       console.error('❌ [Summary] SQL Error:', error.message);
// //       return {
// //         total_cash: 0,
// //         total_online: 0,
// //         total_amount: 0,
// //         handed_over_cash: 0,
// //         pending_handover: 0,
// //         cash_percentage: 0,
// //         online_percentage: 0
// //       };
// //     }
// //   }

// //   // Create collection - WORKING VERSION
// //   static async create(collectionData) {
// //     console.log('📝 [Create Collection] Data:', collectionData);

// //     // Simple insert without the missing columns
// //     const query = `
// //       INSERT INTO collections (
// //         hotel_id, booking_id, collection_date, payment_mode,
// //         amount, transaction_id, remarks, collected_by,
// //         handover_status, created_by
// //       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// //     `;

// //     const params = [
// //       collectionData.hotel_id,
// //       collectionData.booking_id || null,
// //       collectionData.collection_date || new Date().toISOString().split('T')[0],
// //       collectionData.payment_mode,
// //       collectionData.amount,
// //       collectionData.transaction_id || null,
// //       collectionData.remarks || '',
// //       collectionData.collected_by,
// //       collectionData.payment_mode === 'cash' ? 'pending' : 'not_applicable',
// //       collectionData.created_by
// //     ];

// //     console.log('📝 [Create Collection] Params:', params);

// //     try {
// //       const [result] = await pool.execute(query, params);
// //       console.log('✅ [Create Collection] Success! ID:', result.insertId);
// //       return result.insertId;
// //     } catch (error) {
// //       console.error('❌ [Create Collection] Error:', error.message);
// //       throw error;
// //     }
// //   }

// //   // Auto-create collection for cash booking - WORKING VERSION
// //   static async createFromCashBooking(bookingId, hotelId, userId) {
// //     console.log('💰 [Auto-Collection] Booking:', bookingId, 'Hotel:', hotelId, 'User:', userId);

// //     try {
// //       // Get booking details
// //       const [bookingRows] = await pool.execute(`
// //         SELECT
// //           b.total,
// //           b.payment_method,
// //           b.payment_status,
// //           c.name as customer_name
// //         FROM bookings b
// //         LEFT JOIN customers c ON b.customer_id = c.id
// //         WHERE b.id = ? AND b.hotel_id = ?
// //       `, [bookingId, hotelId]);

// //       if (bookingRows.length === 0) {
// //         console.log('❌ [Auto-Collection] Booking not found');
// //         return null;
// //       }

// //       const booking = bookingRows[0];
// //       console.log('💰 [Auto-Collection] Booking details:', booking);

// //       // Create collection
// //       const insertQuery = `
// //         INSERT INTO collections (
// //           hotel_id, booking_id, collection_date, payment_mode,
// //           amount, remarks, collected_by,
// //           handover_status, created_by
// //         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
// //       `;

// //       const insertParams = [
// //         hotelId,
// //         bookingId,
// //         new Date().toISOString().split('T')[0],
// //         'cash',
// //         booking.total,
// //         `Auto-collection for booking #${bookingId} - ${booking.customer_name || 'Guest'}`,
// //         userId,
// //         'pending',
// //         userId
// //       ];

// //       console.log('💰 [Auto-Collection] Insert params:', insertParams);
// //       const [result] = await pool.execute(insertQuery, insertParams);
// //       console.log('✅ [Auto-Collection] Created! ID:', result.insertId);

// //       return result.insertId;

// //     } catch (error) {
// //       console.error('❌ [Auto-Collection] Error:', error.message);
// //       return null;
// //     }
// //   }

// //   // Get cash bookings (for cash bookings tab) - WORKING VERSION
// //   static async getCashBookings(hotelId, startDate, endDate) {
// //     console.log('💵 [Cash Bookings] Hotel:', hotelId);

// //     let query = `
// //       SELECT
// //         b.id as booking_id,
// //         DATE(b.created_at) as booking_date,
// //         b.total as booking_amount,
// //         b.payment_method,
// //         b.payment_status,
// //         c.name as guest_name,
// //         r.room_number,
// //         COALESCE(SUM(col.amount), 0) as collected_amount,
// //         (b.total - COALESCE(SUM(col.amount), 0)) as pending_amount
// //       FROM bookings b
// //       LEFT JOIN customers c ON b.customer_id = c.id
// //       LEFT JOIN rooms r ON b.room_id = r.id
// //       LEFT JOIN collections col ON b.id = col.booking_id AND col.payment_mode = 'cash'
// //       WHERE b.hotel_id = ?
// //         AND b.payment_method = 'cash'
// //         AND b.status = 'booked'
// //         AND b.total > 0
// //     `;

// //     const params = [hotelId];

// //     if (startDate && endDate && startDate.trim() !== '' && endDate.trim() !== '') {
// //       query += ` AND DATE(b.created_at) BETWEEN ? AND ?`;
// //       params.push(startDate, endDate);
// //     }

// //     query += ` GROUP BY b.id HAVING pending_amount > 0 ORDER BY b.created_at DESC`;

// //     console.log('💵 [Cash Bookings] Query:', query.substring(0, 200) + '...');
// //     console.log('💵 [Cash Bookings] Params:', params);

// //     try {
// //       const [rows] = await pool.execute(query, params);
// //       console.log('✅ [Cash Bookings] Found:', rows.length);
// //       return rows;
// //     } catch (error) {
// //       console.error('❌ [Cash Bookings] Error:', error.message);
// //       return [];
// //     }
// //   }

// //   // Update handover status - WORKING VERSION
// //   static async updateHandover(collectionId, hotelId, handoverData) {
// //     console.log('🔄 [Handover] Collection:', collectionId, 'Data:', handoverData);

// //     const query = `
// //       UPDATE collections
// //       SET
// //         handover_status = ?,
// //         handover_amount = ?,
// //         handover_date = ?,
// //         handover_to = ?,
// //         handover_remarks = ?
// //       WHERE id = ? AND hotel_id = ?
// //     `;

// //     const params = [
// //       handoverData.status,
// //       handoverData.amount,
// //       handoverData.handover_date || new Date().toISOString().split('T')[0],
// //       handoverData.handover_to,
// //       handoverData.remarks || '',
// //       collectionId,
// //       hotelId
// //     ];

// //     console.log('🔄 [Handover] Update params:', params);

// //     try {
// //       const [result] = await pool.execute(query, params);
// //       console.log('✅ [Handover] Updated, affected rows:', result.affectedRows);
// //       return result.affectedRows > 0;
// //     } catch (error) {
// //       console.error('❌ [Handover] Error:', error.message);
// //       throw error;
// //     }
// //   }

// //   // Add this method to Collection class if you need it
// // static async getById(collectionId, hotelId) {
// //   try {
// //     console.log('🔍 [GetById] Collection:', collectionId, 'Hotel:', hotelId);

// //     const query = `
// //       SELECT c.*
// //       FROM collections c
// //       WHERE c.id = ? AND c.hotel_id = ?
// //     `;

// //     const [rows] = await pool.execute(query, [collectionId, hotelId]);

// //     if (rows.length === 0) {
// //       console.log('❌ [GetById] Collection not found');
// //       return null;
// //     }

// //     console.log('✅ [GetById] Collection found');
// //     return rows[0];

// //   } catch (error) {
// //     console.error('❌ [GetById] Error:', error.message);
// //     return null;
// //   }
// // }
// // }

// // module.exports = Collection;

// const { pool } = require("../config/database");

// class Collection {
//   // Get collections with filters
//   // SOURCE OF TRUTH:
//   //   - collections table  = all manually-recorded payments (cash, online, upi, card entered by staff)
//   //   - transactions table = gateway-processed online payments (never go into collections table)
//   // We show ALL from both sources combined.
//   static async getCollections(hotelId, filters = {}) {
//     const {
//       startDate,
//       endDate,
//       paymentMode = "all",
//       handoverStatus = "all",
//       limit = 100,
//       offset = 0,
//       search = "",
//     } = filters;

//     console.log("📊 [Collections] hotelId:", hotelId, "filters:", filters);

//     try {
//       const results = [];
//       const searchTerm = search ? `%${search}%` : null;

//       // ── PART 1: ALL entries from collections table ───────────────────────
//       {
//         let cashQuery = `
//           SELECT 
//             c.id,
//             c.booking_id,
//             c.collection_date,
//             c.payment_mode,
//             c.amount,
//             c.transaction_id,
//             c.remarks,
//             c.collected_by,
//             c.handover_status,
//             c.handover_amount,
//             c.handover_date,
//             c.handover_to,
//             c.handover_remarks,
//             c.created_at,
//             COALESCE(cust.name, 'Walk-in Customer') as customer_name,
//             cust.phone as customer_phone,
//             r.room_number,
//             u.name as collected_by_user_name,
//             b.total as booking_total,
//             b.payment_method as booking_payment_method,
//             b.payment_status as booking_payment_status,
//             'collections' as source
//           FROM collections c
//           LEFT JOIN bookings b ON c.booking_id = b.id AND b.hotel_id = c.hotel_id
//           LEFT JOIN customers cust ON b.customer_id = cust.id
//           LEFT JOIN rooms r ON b.room_id = r.id
//           LEFT JOIN users u ON c.collected_by = u.id
//           WHERE c.hotel_id = ?
//         `;
//         const cashParams = [hotelId];

//         if (
//           startDate &&
//           endDate &&
//           startDate.trim() !== "" &&
//           endDate.trim() !== ""
//         ) {
//           cashQuery += ` AND c.collection_date BETWEEN ? AND ?`;
//           cashParams.push(startDate, endDate);
//         }

//         if (paymentMode && paymentMode !== "all" && paymentMode !== "online") {
//           cashQuery += ` AND c.payment_mode = ?`;
//           cashParams.push(paymentMode);
//         } else if (paymentMode === "online") {
//           cashQuery += ` AND c.payment_mode IN ('online', 'upi', 'card')`;
//         }

//         if (handoverStatus && handoverStatus !== "all") {
//           cashQuery += ` AND c.handover_status = ?`;
//           cashParams.push(handoverStatus);
//         }

//         if (searchTerm) {
//           cashQuery += ` AND (cust.name LIKE ? OR r.room_number LIKE ? OR c.transaction_id LIKE ?)`;
//           cashParams.push(searchTerm, searchTerm, searchTerm);
//         }

//         cashQuery += ` ORDER BY c.collection_date DESC, c.created_at DESC`;

//         const [cashRows] = await pool.execute(cashQuery, cashParams);
//         results.push(...cashRows);
//       }

//       // ── PART 2: Gateway ONLINE from transactions table ───────────────────
//       if (paymentMode === "all" || paymentMode === "online") {
//         let onlineQuery = `
//           SELECT 
//             t.id,
//             t.booking_id,
//             DATE(t.created_at) as collection_date,
//             t.payment_method as payment_mode,
//             t.amount,
//             t.transaction_id,
//             CONCAT('Online payment - TXN: ', COALESCE(t.transaction_id, t.id)) as remarks,
//             NULL as collected_by,
//             'not_applicable' as handover_status,
//             0 as handover_amount,
//             NULL as handover_date,
//             NULL as handover_to,
//             '' as handover_remarks,
//             t.created_at,
//             COALESCE(c.name, 'Online Customer') as customer_name,
//             c.phone as customer_phone,
//             r.room_number,
//             'System (Online)' as collected_by_user_name,
//             b.total as booking_total,
//             b.payment_method as booking_payment_method,
//             b.payment_status as booking_payment_status,
//             'transactions' as source
//           FROM transactions t
//           LEFT JOIN bookings b ON t.booking_id = b.id
//           LEFT JOIN customers c ON t.customer_id = c.id
//           LEFT JOIN rooms r ON b.room_id = r.id
//           WHERE t.hotel_id = ?
//             AND t.status = 'success'
//             AND t.booking_id IS NOT NULL
//         `;
//         const onlineParams = [hotelId];

//         if (
//           startDate &&
//           endDate &&
//           startDate.trim() !== "" &&
//           endDate.trim() !== ""
//         ) {
//           onlineQuery += ` AND DATE(t.created_at) BETWEEN ? AND ?`;
//           onlineParams.push(startDate, endDate);
//         }

//         if (searchTerm) {
//           onlineQuery += ` AND (c.name LIKE ? OR r.room_number LIKE ? OR t.transaction_id LIKE ?)`;
//           onlineParams.push(searchTerm, searchTerm, searchTerm);
//         }

//         onlineQuery += ` ORDER BY t.created_at DESC`;

//         const [onlineRows] = await pool.execute(onlineQuery, onlineParams);
//         results.push(...onlineRows);
//       }

//       // ── PART 3: Function Bookings ──────────────────────────────────────────
//       {
//         let functionQuery = `
//           SELECT 
//             fb.id as function_booking_id,
//             fb.id as booking_id,
//             DATE(fb.created_at) as collection_date,
//             CASE WHEN fb.payment_method = 'cash' THEN 'cash' ELSE 'online' END as payment_mode,
//             fb.advance_paid as amount,
//             fb.transaction_id,
//             CONCAT('Function Hall: ', fb.event_name) as remarks,
//             fb.created_by as collected_by,
//             'not_applicable' as handover_status,
//             0 as handover_amount,
//             NULL as handover_date,
//             NULL as handover_to,
//             '' as handover_remarks,
//             fb.created_at,
//             fb.customer_name as customer_name,
//             fb.customer_phone as customer_phone,
//             r.room_number,
//             u.name as collected_by_user_name,
//             fb.total_amount as booking_total,
//             fb.payment_method as booking_payment_method,
//             fb.payment_status as booking_payment_status,
//             'function_bookings' as source
//           FROM function_bookings fb
//           LEFT JOIN function_rooms r ON fb.function_room_id = r.id
//           LEFT JOIN users u ON fb.created_by = u.id
//           WHERE fb.hotel_id = ?
//             AND fb.advance_paid > 0
//         `;
//         const functionParams = [hotelId];

//         if (
//           startDate &&
//           endDate &&
//           startDate.trim() !== "" &&
//           endDate.trim() !== ""
//         ) {
//           functionQuery += ` AND DATE(fb.created_at) BETWEEN ? AND ?`;
//           functionParams.push(startDate, endDate);
//         }

//         if (paymentMode && paymentMode !== "all") {
//           if (paymentMode === "online") {
//             functionQuery += ` AND fb.payment_method != 'cash'`;
//           } else {
//             functionQuery += ` AND fb.payment_method = ?`;
//             functionParams.push(paymentMode);
//           }
//         }

//         if (searchTerm) {
//           functionQuery += ` AND (fb.customer_name LIKE ? OR r.room_number LIKE ? OR fb.transaction_id LIKE ?)`;
//           functionParams.push(searchTerm, searchTerm, searchTerm);
//         }

//         functionQuery += ` ORDER BY fb.created_at DESC`;

//         const [functionRows] = await pool.execute(
//           functionQuery,
//           functionParams,
//         );
//         // Transform the ids to ensure no conflict, we use a string id if needed, but here we can just map it.
//         const mappedFunctionRows = functionRows.map((row) => ({
//           ...row,
//           id: "fb_" + row.function_booking_id,
//         }));
//         results.push(...mappedFunctionRows);
//         console.log(
//           "✅ [Collections] Function bookings rows found:",
//           functionRows.length,
//         );
//       }

//       // Sort combined results by created_at DESC
//       results.sort((a, b) => {
//         const dateA = new Date(a.created_at || a.collection_date);
//         const dateB = new Date(b.created_at || b.collection_date);
//         return dateB - dateA;
//       });

//       // Apply pagination manually on combined result
//       const pageLimit = parseInt(limit) || 100;
//       const pageOffset = parseInt(offset) || 0;
//       const paginated = results.slice(pageOffset, pageOffset + pageLimit);

//       // Format for frontend
//       const formattedCollections = paginated.map((row) => ({
//         id: row.id,
//         booking_id: row.booking_id || null,
//         guest_name: row.customer_name || "Walk-in Customer",
//         room_number: row.room_number || "N/A",
//         collection_date: row.collection_date,
//         payment_mode: row.payment_mode,
//         amount: parseFloat(row.amount) || 0,
//         transaction_id: row.transaction_id || null,
//         remarks: row.remarks || "",
//         collected_by: row.collected_by,
//         collected_by_name: row.collected_by_user_name || "Staff",
//         handover_status: row.handover_status || "not_applicable",
//         handover_amount: parseFloat(row.handover_amount) || 0,
//         handover_date: row.handover_date || null,
//         handover_to: row.handover_to || null,
//         handover_remarks: row.handover_remarks || "",
//         created_at: row.created_at,
//         booking_total: parseFloat(row.booking_total) || 0,
//         booking_payment_method: row.booking_payment_method || "cash",
//         booking_payment_status: row.booking_payment_status || "pending",
//         source: row.source || "collections", // 'collections' or 'transactions'
//       }));

//       return {
//         collections: formattedCollections,
//         total: results.length,
//       };
//     } catch (error) {
//       console.error("❌ [Collections] Error:", error.message);
//       throw error;
//     }
//   }

//   // Static method for alternative query approach
//   static async getCollectionsAlternative(hotelId, filters) {
//     const {
//       startDate,
//       endDate,
//       paymentMode = "all",
//       handoverStatus = "all",
//       limit = 100,
//       offset = 0,
//     } = filters;

//     // Build base query without pagination first
//     let query = `
//             SELECT 
//                 c.*,
//                 b.id as booking_id,
//                 b.total as booking_total,
//                 b.payment_method as booking_payment_method,
//                 b.payment_status as booking_payment_status,
//                 cust.name as customer_name,
//                 cust.phone as customer_phone,
//                 r.room_number,
//                 u.name as collected_by_user_name
//             FROM collections c
//             LEFT JOIN bookings b ON c.booking_id = b.id
//             LEFT JOIN customers cust ON b.customer_id = cust.id
//             LEFT JOIN rooms r ON b.room_id = r.id
//             LEFT JOIN users u ON c.collected_by = u.id
//             WHERE c.hotel_id = ?
//         `;

//     const params = [hotelId];

//     if (
//       startDate &&
//       endDate &&
//       startDate.trim() !== "" &&
//       endDate.trim() !== ""
//     ) {
//       query += ` AND c.collection_date BETWEEN ? AND ?`;
//       params.push(startDate, endDate);
//     }

//     if (paymentMode && paymentMode !== "all") {
//       query += ` AND c.payment_mode = ?`;
//       params.push(paymentMode);
//     }

//     if (handoverStatus && handoverStatus !== "all") {
//       query += ` AND c.handover_status = ?`;
//       params.push(handoverStatus);
//     }

//     query += ` ORDER BY c.collection_date DESC, c.created_at DESC`;

//     console.log(
//       "🔄 [Collections Alternative] Query without pagination:",
//       query,
//     );
//     console.log("🔄 [Collections Alternative] Params:", params);

//     try {
//       // Get all results first
//       const [allRows] = await pool.execute(query, params);
//       console.log(
//         "🔄 [Collections Alternative] Total rows found:",
//         allRows.length,
//       );

//       // Apply pagination manually
//       const pageLimit = parseInt(limit) || 100;
//       const pageOffset = parseInt(offset) || 0;
//       const paginatedRows = allRows.slice(pageOffset, pageOffset + pageLimit);

//       console.log(
//         "🔄 [Collections Alternative] After pagination:",
//         paginatedRows.length,
//         "rows",
//       );

//       // Format results
//       const formattedCollections = paginatedRows.map((row) => ({
//         id: row.id,
//         booking_id: row.booking_id || null,
//         guest_name: row.customer_name || "Walk-in Customer",
//         room_number: row.room_number || "N/A",
//         collection_date: row.collection_date,
//         payment_mode: row.payment_mode,
//         amount: parseFloat(row.amount) || 0,
//         transaction_id: row.transaction_id || null,
//         remarks: row.remarks || "",
//         collected_by: row.collected_by,
//         collected_by_name: row.collected_by_user_name || "Staff",
//         handover_status: row.handover_status,
//         handover_amount: parseFloat(row.handover_amount) || 0,
//         handover_date: row.handover_date || null,
//         handover_to: row.handover_to || null,
//         handover_remarks: row.handover_remarks || "",
//         created_at: row.created_at,
//         booking_total: parseFloat(row.booking_total) || 0,
//         booking_payment_method: row.booking_payment_method || "cash",
//         booking_payment_status: row.booking_payment_status || "pending",
//       }));

//       return formattedCollections;
//     } catch (error) {
//       console.error("❌ [Collections Alternative] Error:", error.message);
//       return [];
//     }
//   }

//   // Get collection summary
//   // SOURCE OF TRUTH for cash  = collections table (actual collected money)
//   // SOURCE OF TRUTH for online = transactions table (status='success')
//   static async getCollectionSummary(hotelId, startDate, endDate) {
//     console.log("📊 [Summary] hotelId:", hotelId, "dates:", {
//       startDate,
//       endDate,
//     });

//     try {
//       // ── ALL cash from collections table (includes partial payments too) ──
//       let cashQuery = `
//         SELECT 
//           COALESCE(SUM(amount), 0) as total_cash,
//           COALESCE(SUM(CASE
//             WHEN handover_status IN ('handed_over', 'partially_handed_over')
//             THEN handover_amount ELSE 0
//           END), 0) as handed_over_cash
//         FROM collections
//         WHERE hotel_id = ?
//           AND payment_mode = 'cash'
//       `;
//       const cashParams = [hotelId];
//       if (
//         startDate &&
//         endDate &&
//         startDate.trim() !== "" &&
//         endDate.trim() !== ""
//       ) {
//         cashQuery += ` AND collection_date BETWEEN ? AND ?`;
//         cashParams.push(startDate, endDate);
//       }

//       // ── Any non-cash manually recorded in collections table (upi/card/online) ──
//       let manualOnlineQuery = `
//         SELECT COALESCE(SUM(amount), 0) as total_manual_online
//         FROM collections
//         WHERE hotel_id = ?
//           AND payment_mode IN ('online', 'upi', 'card')
//       `;
//       const manualOnlineParams = [hotelId];
//       if (
//         startDate &&
//         endDate &&
//         startDate.trim() !== "" &&
//         endDate.trim() !== ""
//       ) {
//         manualOnlineQuery += ` AND collection_date BETWEEN ? AND ?`;
//         manualOnlineParams.push(startDate, endDate);
//       }

//       // ── Gateway ONLINE from transactions table ─────────────────────────────
//       // Online payments processed via payment gateway
//       let gatewayOnlineQuery = `
//         SELECT COALESCE(SUM(amount), 0) as total_gateway_online
//         FROM transactions
//         WHERE hotel_id = ?
//           AND status = 'success'
//           AND booking_id IS NOT NULL
//       `;
//       const gatewayOnlineParams = [hotelId];
//       if (
//         startDate &&
//         endDate &&
//         startDate.trim() !== "" &&
//         endDate.trim() !== ""
//       ) {
//         gatewayOnlineQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
//         gatewayOnlineParams.push(startDate, endDate);
//       }

//       // ── Function Hall Cash from function_bookings table ─────────────────────
//       let functionCashQuery = `
//         SELECT COALESCE(SUM(advance_paid), 0) as total_function_cash
//         FROM function_bookings
//         WHERE hotel_id = ?
//           AND advance_paid > 0
//           AND payment_method = 'cash'
//       `;
//       const functionCashParams = [hotelId];
//       if (
//         startDate &&
//         endDate &&
//         startDate.trim() !== "" &&
//         endDate.trim() !== ""
//       ) {
//         functionCashQuery += ` AND DATE(booking_date) BETWEEN ? AND ?`;
//         functionCashParams.push(startDate, endDate);
//       }

//       // ── Function Hall Online from function_bookings table ───────────────────
//       let functionOnlineQuery = `
//         SELECT COALESCE(SUM(advance_paid), 0) as total_function_online
//         FROM function_bookings
//         WHERE hotel_id = ?
//           AND advance_paid > 0
//           AND payment_method != 'cash'
//       `;
//       const functionOnlineParams = [hotelId];
//       if (
//         startDate &&
//         endDate &&
//         startDate.trim() !== "" &&
//         endDate.trim() !== ""
//       ) {
//         functionOnlineQuery += ` AND DATE(booking_date) BETWEEN ? AND ?`;
//         functionOnlineParams.push(startDate, endDate);
//       }

//       const [
//         [cashRows],
//         [manualOnlineRows],
//         [gatewayOnlineRows],
//         [functionCashRows],
//         [functionOnlineRows],
//       ] = await Promise.all([
//         pool.execute(cashQuery, cashParams),
//         pool.execute(manualOnlineQuery, manualOnlineParams),
//         pool.execute(gatewayOnlineQuery, gatewayOnlineParams),
//         pool.execute(functionCashQuery, functionCashParams),
//         pool.execute(functionOnlineQuery, functionOnlineParams),
//       ]);

//       const cashAmountColl = parseFloat(cashRows[0]?.total_cash) || 0;
//       const functionCash =
//         parseFloat(functionCashRows[0]?.total_function_cash) || 0;
//       const cashAmount = cashAmountColl + functionCash;

//       const handedOverCash = parseFloat(cashRows[0]?.handed_over_cash) || 0;
//       const pendingHandover = cashAmount - handedOverCash;

//       const manualOnline =
//         parseFloat(manualOnlineRows[0]?.total_manual_online) || 0;
//       const gatewayOnline =
//         parseFloat(gatewayOnlineRows[0]?.total_gateway_online) || 0;
//       const functionOnline =
//         parseFloat(functionOnlineRows[0]?.total_function_online) || 0;

//       const onlineAmount = manualOnline + gatewayOnline + functionOnline;
//       const totalAmount = cashAmount + onlineAmount;

//       const cashPercentage =
//         totalAmount > 0 ? (cashAmount / totalAmount) * 100 : 0;
//       const onlinePercentage =
//         totalAmount > 0 ? (onlineAmount / totalAmount) * 100 : 0;

//       console.log(
//         "✅ [Summary] Cash:",
//         cashAmount,
//         "| Manual Online:",
//         manualOnline,
//         "| Gateway Online:",
//         gatewayOnline,
//         "| Total:",
//         totalAmount,
//       );

//       return {
//         total_cash: cashAmount,
//         total_online: onlineAmount,
//         total_amount: totalAmount,
//         handed_over_cash: handedOverCash,
//         pending_handover: pendingHandover,
//         cash_percentage: cashPercentage,
//         online_percentage: onlinePercentage,
//       };
//     } catch (error) {
//       console.error("❌ [Summary] SQL Error:", error.message);
//       return {
//         total_cash: 0,
//         total_online: 0,
//         total_amount: 0,
//         handed_over_cash: 0,
//         pending_handover: 0,
//         cash_percentage: 0,
//         online_percentage: 0,
//       };
//     }
//   }

//   // Create collection - WORKING VERSION
//   static async create(collectionData) {
//     console.log("📝 [Create Collection] Data:", collectionData);

//     // Simple insert without the missing columns
//     const query = `
//             INSERT INTO collections (
//                 hotel_id, booking_id, collection_date, payment_mode,
//                 amount, transaction_id, remarks, collected_by,
//                 handover_status, created_by
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//     const params = [
//       collectionData.hotel_id,
//       collectionData.booking_id || null,
//       collectionData.collection_date || new Date().toISOString().split("T")[0],
//       collectionData.payment_mode,
//       collectionData.amount,
//       collectionData.transaction_id || null,
//       collectionData.remarks || "",
//       collectionData.collected_by,
//       collectionData.payment_mode === "cash" ? "pending" : "not_applicable",
//       collectionData.created_by,
//     ];

//     console.log("📝 [Create Collection] Params:", params);

//     try {
//       const [result] = await pool.execute(query, params);
//       console.log("✅ [Create Collection] Success! ID:", result.insertId);
//       return result.insertId;
//     } catch (error) {
//       console.error("❌ [Create Collection] Error:", error.message);
//       throw error;
//     }
//   }

//   // Auto-create collection for cash booking - WORKING VERSION
//   static async createFromCashBooking(bookingId, hotelId, userId) {
//     console.log(
//       "💰 [Auto-Collection] Booking:",
//       bookingId,
//       "Hotel:",
//       hotelId,
//       "User:",
//       userId,
//     );

//     try {
//       // Get booking details
//       const [bookingRows] = await pool.execute(
//         `
//                 SELECT 
//                     b.total,
//                     b.payment_method,
//                     b.payment_status,
//                     c.name as customer_name
//                 FROM bookings b
//                 LEFT JOIN customers c ON b.customer_id = c.id
//                 WHERE b.id = ? AND b.hotel_id = ?
//             `,
//         [bookingId, hotelId],
//       );

//       if (bookingRows.length === 0) {
//         console.log("❌ [Auto-Collection] Booking not found");
//         return null;
//       }

//       const booking = bookingRows[0];
//       console.log("💰 [Auto-Collection] Booking details:", booking);

//       // Create collection
//       const insertQuery = `
//                 INSERT INTO collections (
//                     hotel_id, booking_id, collection_date, payment_mode,
//                     amount, remarks, collected_by,
//                     handover_status, created_by
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `;

//       const insertParams = [
//         hotelId,
//         bookingId,
//         new Date().toISOString().split("T")[0],
//         "cash",
//         booking.total,
//         `Auto-collection for booking #${bookingId} - ${booking.customer_name || "Guest"}`,
//         userId,
//         "pending",
//         userId,
//       ];

//       console.log("💰 [Auto-Collection] Insert params:", insertParams);
//       const [result] = await pool.execute(insertQuery, insertParams);
//       console.log("✅ [Auto-Collection] Created! ID:", result.insertId);

//       return result.insertId;
//     } catch (error) {
//       console.error("❌ [Auto-Collection] Error:", error.message);
//       return null;
//     }
//   }

//   // Get cash bookings (for cash bookings tab) - WORKING VERSION
//   static async getCashBookings(hotelId, startDate, endDate) {
//     console.log("💵 [Cash Bookings] Hotel:", hotelId);

//     let query = `
//             SELECT 
//                 b.id as booking_id,
//                 DATE(b.created_at) as booking_date,
//                 b.total as booking_amount,
//                 b.payment_method,
//                 b.payment_status,
//                 c.name as guest_name,
//                 r.room_number,
//                 COALESCE(SUM(col.amount), 0) as collected_amount,
//                 (b.total - COALESCE(SUM(col.amount), 0)) as pending_amount
//             FROM bookings b
//             LEFT JOIN customers c ON b.customer_id = c.id
//             LEFT JOIN rooms r ON b.room_id = r.id
//             LEFT JOIN collections col ON b.id = col.booking_id AND col.payment_mode = 'cash'
//             WHERE b.hotel_id = ?
//                 AND b.payment_method = 'cash'
//                 AND b.status = 'booked'
//                 AND b.total > 0
//         `;

//     const params = [hotelId];

//     if (
//       startDate &&
//       endDate &&
//       startDate.trim() !== "" &&
//       endDate.trim() !== ""
//     ) {
//       query += ` AND DATE(b.created_at) BETWEEN ? AND ?`;
//       params.push(startDate, endDate);
//     }

//     query += ` GROUP BY b.id HAVING pending_amount > 0 ORDER BY b.created_at DESC`;

//     console.log("💵 [Cash Bookings] Query:", query.substring(0, 200) + "...");
//     console.log("💵 [Cash Bookings] Params:", params);

//     try {
//       const [rows] = await pool.execute(query, params);
//       console.log("✅ [Cash Bookings] Found:", rows.length);
//       return rows;
//     } catch (error) {
//       console.error("❌ [Cash Bookings] Error:", error.message);
//       return [];
//     }
//   }

//   // Update handover status - WORKING VERSION
//   static async updateHandover(collectionId, hotelId, handoverData) {
//     console.log(
//       "🔄 [Handover] Collection:",
//       collectionId,
//       "Data:",
//       handoverData,
//     );

//     const query = `
//             UPDATE collections 
//             SET 
//                 handover_status = ?,
//                 handover_amount = ?,
//                 handover_date = ?,
//                 handover_to = ?,
//                 handover_remarks = ?
//             WHERE id = ? AND hotel_id = ?
//         `;

//     const params = [
//       handoverData.status,
//       handoverData.amount,
//       handoverData.handover_date || new Date().toISOString().split("T")[0],
//       handoverData.handover_to,
//       handoverData.remarks || "",
//       collectionId,
//       hotelId,
//     ];

//     console.log("🔄 [Handover] Update params:", params);

//     try {
//       const [result] = await pool.execute(query, params);
//       console.log("✅ [Handover] Updated, affected rows:", result.affectedRows);
//       return result.affectedRows > 0;
//     } catch (error) {
//       console.error("❌ [Handover] Error:", error.message);
//       throw error;
//     }
//   }

//   // Get collection by ID
//   static async getById(collectionId, hotelId) {
//     try {
//       console.log("🔍 [GetById] Collection:", collectionId, "Hotel:", hotelId);

//       const query = `
//                 SELECT c.*
//                 FROM collections c
//                 WHERE c.id = ? AND c.hotel_id = ?
//             `;

//       const [rows] = await pool.execute(query, [collectionId, hotelId]);

//       if (rows.length === 0) {
//         console.log("❌ [GetById] Collection not found");
//         return null;
//       }

//       console.log("✅ [GetById] Collection found");
//       return rows[0];
//     } catch (error) {
//       console.error("❌ [GetById] Error:", error.message);
//       return null;
//     }
//   }
// }

// module.exports = Collection;


const { pool } = require("../config/database");

class Collection {
  // Get collections with filters
  static async getCollections(hotelId, filters = {}) {
    const {
      startDate,
      endDate,
      paymentMode = "all",
      handoverStatus = "all",
      limit = 100,
      offset = 0,
      search = "",
    } = filters;

    console.log("📊 [Collections] hotelId:", hotelId, "filters:", filters);

    try {
      const results = [];
      const searchTerm = search ? `%${search}%` : null;

      // ── PART 1: ALL entries from collections table ───────────────────────
      {
        let cashQuery = `
          SELECT 
            c.id,
            c.booking_id,
            c.collection_date,
            c.payment_mode,
            c.amount,
            c.transaction_id,
            c.remarks,
            c.collected_by,
            c.handover_status,
            c.handover_amount,
            c.handover_date,
            c.handover_to,
            c.handover_remarks,
            c.created_at,
            COALESCE(cust.name, 'Walk-in Customer') as customer_name,
            cust.phone as customer_phone,
            r.room_number,
            u.name as collected_by_user_name,
            b.total as booking_total,
            b.payment_method as booking_payment_method,
            b.payment_status as booking_payment_status,
            'collections' as source
          FROM collections c
          LEFT JOIN bookings b ON c.booking_id = b.id AND b.hotel_id = c.hotel_id
          LEFT JOIN customers cust ON b.customer_id = cust.id
          LEFT JOIN rooms r ON b.room_id = r.id
          LEFT JOIN users u ON c.collected_by = u.id
          WHERE c.hotel_id = ?
        `;
        const cashParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          cashQuery += ` AND c.collection_date BETWEEN ? AND ?`;
          cashParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all" && paymentMode !== "online") {
          cashQuery += ` AND c.payment_mode = ?`;
          cashParams.push(paymentMode);
        } else if (paymentMode === "online") {
          cashQuery += ` AND c.payment_mode IN ('online', 'upi', 'card')`;
        }

        if (handoverStatus && handoverStatus !== "all") {
          cashQuery += ` AND c.handover_status = ?`;
          cashParams.push(handoverStatus);
        }

        if (searchTerm) {
          cashQuery += ` AND (cust.name LIKE ? OR r.room_number LIKE ? OR c.transaction_id LIKE ?)`;
          cashParams.push(searchTerm, searchTerm, searchTerm);
        }

        cashQuery += ` ORDER BY c.collection_date DESC, c.created_at DESC`;

        const [cashRows] = await pool.execute(cashQuery, cashParams);
        results.push(...cashRows);
      }

      // ── PART 2: Gateway ONLINE from transactions table ───────────────────
      if (paymentMode === "all" || paymentMode === "online") {
        let onlineQuery = `
          SELECT 
            t.id,
            t.booking_id,
            DATE(t.created_at) as collection_date,
            t.payment_method as payment_mode,
            t.amount,
            t.transaction_id,
            CONCAT('Online payment - TXN: ', COALESCE(t.transaction_id, t.id)) as remarks,
            NULL as collected_by,
            'not_applicable' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            t.created_at,
            COALESCE(c.name, 'Online Customer') as customer_name,
            c.phone as customer_phone,
            r.room_number,
            'System (Online)' as collected_by_user_name,
            b.total as booking_total,
            b.payment_method as booking_payment_method,
            b.payment_status as booking_payment_status,
            'transactions' as source
          FROM transactions t
          LEFT JOIN bookings b ON t.booking_id = b.id
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN rooms r ON b.room_id = r.id
          WHERE t.hotel_id = ?
            AND t.status = 'success'
            AND t.booking_id IS NOT NULL
        `;
        const onlineParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          onlineQuery += ` AND DATE(t.created_at) BETWEEN ? AND ?`;
          onlineParams.push(startDate, endDate);
        }

        if (searchTerm) {
          onlineQuery += ` AND (c.name LIKE ? OR r.room_number LIKE ? OR t.transaction_id LIKE ?)`;
          onlineParams.push(searchTerm, searchTerm, searchTerm);
        }

        onlineQuery += ` ORDER BY t.created_at DESC`;

        const [onlineRows] = await pool.execute(onlineQuery, onlineParams);
        results.push(...onlineRows);
      }

      // ── PART 3: Advance Bookings (NEW) ─────────────────────────────────────
      {
        let advanceQuery = `
          SELECT 
            CONCAT('ADV-', ab.id) as id,
            ab.id as advance_booking_id,
            ab.booking_id,
            DATE(ab.created_at) as collection_date,
            ab.payment_method as payment_mode,
            ab.advance_amount as amount,
            ab.transaction_id,
            CONCAT('Advance booking for ', COALESCE(ab.purpose_of_visit, 'Room Booking')) as remarks,
            ab.created_by as collected_by,
            'not_applicable' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            ab.created_at,
            COALESCE(c.name, 'Advance Customer') as customer_name,
            c.phone as customer_phone,
            r.room_number,
            u.name as collected_by_user_name,
            ab.total as booking_total,
            ab.payment_method as booking_payment_method,
            ab.payment_status as booking_payment_status,
            'advance_bookings' as source
          FROM advance_bookings ab
          LEFT JOIN customers c ON ab.customer_id = c.id
          LEFT JOIN rooms r ON ab.room_id = r.id
          LEFT JOIN users u ON ab.created_by = u.id
          WHERE ab.hotel_id = ?
            AND ab.advance_amount > 0
            AND ab.status IN ('confirmed', 'pending')
        `;
        const advanceParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          advanceQuery += ` AND DATE(ab.created_at) BETWEEN ? AND ?`;
          advanceParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all") {
          if (paymentMode === "online") {
            advanceQuery += ` AND ab.payment_method IN ('online', 'card', 'bank_transfer')`;
          } else {
            advanceQuery += ` AND ab.payment_method = ?`;
            advanceParams.push(paymentMode);
          }
        }

        if (searchTerm) {
          advanceQuery += ` AND (c.name LIKE ? OR r.room_number LIKE ? OR ab.transaction_id LIKE ?)`;
          advanceParams.push(searchTerm, searchTerm, searchTerm);
        }

        advanceQuery += ` ORDER BY ab.created_at DESC`;

        const [advanceRows] = await pool.execute(advanceQuery, advanceParams);
        
        // Format the IDs properly
        const mappedAdvanceRows = advanceRows.map((row) => ({
          ...row,
          id: "adv_" + row.advance_booking_id,
        }));
        
        results.push(...mappedAdvanceRows);
        console.log("✅ [Collections] Advance bookings rows found:", advanceRows.length);
      }

      // ── PART 4: Function Booking Amounts (NEW - replaces old function bookings) ───
      {
        let functionAmountQuery = `
          SELECT 
            CONCAT('FBA-', fba.id) as id,
            fba.function_booking_id as booking_id,
            DATE(fba.created_at) as collection_date,
            fba.payment_method as payment_mode,
            fba.transaction_amount as amount,
            fba.transaction_reference as transaction_id,
            fba.description as remarks,
            fba.created_by as collected_by,
            'not_applicable' as handover_status,
            0 as handover_amount,
            NULL as handover_date,
            NULL as handover_to,
            '' as handover_remarks,
            fba.created_at,
            COALESCE(fb.customer_name, 'Function Customer') as customer_name,
            fb.customer_phone,
            fr.room_number,
            u.name as collected_by_user_name,
            fb.total_amount as booking_total,
            fb.payment_method as booking_payment_method,
            fb.payment_status as booking_payment_status,
            'function_booking_amounts' as source
          FROM function_booking_amounts fba
          LEFT JOIN function_bookings fb ON fba.function_booking_id = fb.id
          LEFT JOIN function_rooms fr ON fb.function_room_id = fr.id
          LEFT JOIN users u ON fba.created_by = u.id
          WHERE fba.hotel_id = ?
            AND fba.transaction_type IN ('advance', 'payment')
        `;
        const functionAmountParams = [hotelId];

        if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
          functionAmountQuery += ` AND DATE(fba.created_at) BETWEEN ? AND ?`;
          functionAmountParams.push(startDate, endDate);
        }

        if (paymentMode && paymentMode !== "all") {
          if (paymentMode === "online") {
            functionAmountQuery += ` AND fba.payment_method IN ('online', 'card', 'bank_transfer', 'cheque')`;
          } else {
            functionAmountQuery += ` AND fba.payment_method = ?`;
            functionAmountParams.push(paymentMode);
          }
        }

        if (searchTerm) {
          functionAmountQuery += ` AND (fb.customer_name LIKE ? OR fr.room_number LIKE ? OR fba.transaction_reference LIKE ?)`;
          functionAmountParams.push(searchTerm, searchTerm, searchTerm);
        }

        functionAmountQuery += ` ORDER BY fba.created_at DESC`;

        const [functionAmountRows] = await pool.execute(functionAmountQuery, functionAmountParams);
        
        // Format the IDs properly
        const mappedFunctionAmountRows = functionAmountRows.map((row) => {
          // Extract the numeric ID from the CONCAT('FBA-', fba.id)
          const numericId = row.id.split('-')[1];
          return {
            ...row,
            id: "fba_" + numericId,
          };
        });
        
        results.push(...mappedFunctionAmountRows);
        console.log("✅ [Collections] Function booking amount rows found:", functionAmountRows.length);
      }

      // Sort combined results by created_at DESC
      results.sort((a, b) => {
        const dateA = new Date(a.created_at || a.collection_date);
        const dateB = new Date(b.created_at || b.collection_date);
        return dateB - dateA;
      });

      // Apply pagination manually on combined result
      const pageLimit = parseInt(limit) || 100;
      const pageOffset = parseInt(offset) || 0;
      const paginated = results.slice(pageOffset, pageOffset + pageLimit);

      // Format for frontend
      const formattedCollections = paginated.map((row) => ({
        id: row.id,
        booking_id: row.booking_id || null,
        guest_name: row.customer_name || "Walk-in Customer",
        room_number: row.room_number || "N/A",
        collection_date: row.collection_date,
        payment_mode: row.payment_mode,
        amount: parseFloat(row.amount) || 0,
        transaction_id: row.transaction_id || null,
        remarks: row.remarks || "",
        collected_by: row.collected_by,
        collected_by_name: row.collected_by_user_name || "Staff",
        handover_status: row.handover_status || "not_applicable",
        handover_amount: parseFloat(row.handover_amount) || 0,
        handover_date: row.handover_date || null,
        handover_to: row.handover_to || null,
        handover_remarks: row.handover_remarks || "",
        created_at: row.created_at,
        booking_total: parseFloat(row.booking_total) || 0,
        booking_payment_method: row.booking_payment_method || "cash",
        booking_payment_status: row.booking_payment_status || "pending",
        source: row.source || "collections",
      }));

      return {
        collections: formattedCollections,
        total: results.length,
      };
    } catch (error) {
      console.error("❌ [Collections] Error:", error.message);
      throw error;
    }
  }

  // Get collection summary for the 4 cards - UPDATED with advance bookings and function amounts
  static async getCollectionSummary(hotelId, startDate, endDate) {
    console.log("📊 [Summary] hotelId:", hotelId, "dates:", {
      startDate,
      endDate,
    });

    try {
      // ── 1. Cash from collections table ──────────────────────────────
      let cashQuery = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_cash,
          COALESCE(SUM(CASE
            WHEN handover_status IN ('handed_over', 'partially_handed_over')
            THEN handover_amount ELSE 0
          END), 0) as handed_over_cash
        FROM collections
        WHERE hotel_id = ?
          AND payment_mode = 'cash'
      `;
      const cashParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        cashQuery += ` AND collection_date BETWEEN ? AND ?`;
        cashParams.push(startDate, endDate);
      }

      // ── 2. Manual online from collections table ────────────────────
      let manualOnlineQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_manual_online
        FROM collections
        WHERE hotel_id = ?
          AND payment_mode IN ('online', 'upi', 'card')
      `;
      const manualOnlineParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        manualOnlineQuery += ` AND collection_date BETWEEN ? AND ?`;
        manualOnlineParams.push(startDate, endDate);
      }

      // ── 3. Gateway ONLINE from transactions table ──────────────────
      let gatewayOnlineQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_gateway_online
        FROM transactions
        WHERE hotel_id = ?
          AND status = 'success'
          AND booking_id IS NOT NULL
      `;
      const gatewayOnlineParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        gatewayOnlineQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
        gatewayOnlineParams.push(startDate, endDate);
      }

      // ── 4. ADVANCE BOOKINGS - Cash (NEW) ───────────────────────────
      let advanceCashQuery = `
        SELECT COALESCE(SUM(advance_amount), 0) as total_advance_cash
        FROM advance_bookings
        WHERE hotel_id = ?
          AND advance_amount > 0
          AND payment_method = 'cash'
          AND status IN ('confirmed', 'pending')
      `;
      const advanceCashParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        advanceCashQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
        advanceCashParams.push(startDate, endDate);
      }

      // ── 5. ADVANCE BOOKINGS - Online (NEW) ─────────────────────────
      let advanceOnlineQuery = `
        SELECT COALESCE(SUM(advance_amount), 0) as total_advance_online
        FROM advance_bookings
        WHERE hotel_id = ?
          AND advance_amount > 0
          AND payment_method IN ('online', 'card', 'bank_transfer')
          AND status IN ('confirmed', 'pending')
      `;
      const advanceOnlineParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        advanceOnlineQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
        advanceOnlineParams.push(startDate, endDate);
      }

      // ── 6. FUNCTION BOOKING AMOUNTS - Cash (NEW) ───────────────────
      let functionCashQuery = `
        SELECT COALESCE(SUM(transaction_amount), 0) as total_function_cash
        FROM function_booking_amounts
        WHERE hotel_id = ?
          AND payment_method = 'cash'
          AND transaction_type IN ('advance', 'payment')
      `;
      const functionCashParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        functionCashQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
        functionCashParams.push(startDate, endDate);
      }

      // ── 7. FUNCTION BOOKING AMOUNTS - Online (NEW) ─────────────────
      let functionOnlineQuery = `
        SELECT COALESCE(SUM(transaction_amount), 0) as total_function_online
        FROM function_booking_amounts
        WHERE hotel_id = ?
          AND payment_method IN ('online', 'card', 'bank_transfer', 'cheque')
          AND transaction_type IN ('advance', 'payment')
      `;
      const functionOnlineParams = [hotelId];
      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        functionOnlineQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
        functionOnlineParams.push(startDate, endDate);
      }

      // Execute all queries in parallel
      const [
        [cashRows],
        [manualOnlineRows],
        [gatewayOnlineRows],
        [advanceCashRows],
        [advanceOnlineRows],
        [functionCashRows],
        [functionOnlineRows],
      ] = await Promise.all([
        pool.execute(cashQuery, cashParams),
        pool.execute(manualOnlineQuery, manualOnlineParams),
        pool.execute(gatewayOnlineQuery, gatewayOnlineParams),
        pool.execute(advanceCashQuery, advanceCashParams),
        pool.execute(advanceOnlineQuery, advanceOnlineParams),
        pool.execute(functionCashQuery, functionCashParams),
        pool.execute(functionOnlineQuery, functionOnlineParams),
      ]);

      // Calculate all totals
      const cashFromCollections = parseFloat(cashRows[0]?.total_cash) || 0;
      const cashFromAdvance = parseFloat(advanceCashRows[0]?.total_advance_cash) || 0;
      const cashFromFunction = parseFloat(functionCashRows[0]?.total_function_cash) || 0;
      
      // TOTAL CASH AMOUNT (First Card)
      const cashAmount = cashFromCollections + cashFromAdvance + cashFromFunction;

      // Handover calculations
      const handedOverCash = parseFloat(cashRows[0]?.handed_over_cash) || 0;
      const pendingHandover = cashAmount - handedOverCash;

      // Online calculations
      const manualOnline = parseFloat(manualOnlineRows[0]?.total_manual_online) || 0;
      const gatewayOnline = parseFloat(gatewayOnlineRows[0]?.total_gateway_online) || 0;
      const advanceOnline = parseFloat(advanceOnlineRows[0]?.total_advance_online) || 0;
      const functionOnline = parseFloat(functionOnlineRows[0]?.total_function_online) || 0;

      // TOTAL ONLINE AMOUNT (Second Card)
      const onlineAmount = manualOnline + gatewayOnline + advanceOnline + functionOnline;

      // TOTAL AMOUNT (Third Card)
      const totalAmount = cashAmount + onlineAmount;

      // Percentages
      const cashPercentage = totalAmount > 0 ? (cashAmount / totalAmount) * 100 : 0;
      const onlinePercentage = totalAmount > 0 ? (onlineAmount / totalAmount) * 100 : 0;

      console.log("✅ [Summary] Results:", {
        cashFromCollections,
        cashFromAdvance,
        cashFromFunction,
        cashAmount,
        manualOnline,
        gatewayOnline,
        advanceOnline,
        functionOnline,
        onlineAmount,
        totalAmount,
        handedOverCash,
        pendingHandover
      });

      return {
        total_cash: cashAmount,
        total_online: onlineAmount,
        total_amount: totalAmount,
        handed_over_cash: handedOverCash,
        pending_handover: pendingHandover,
        cash_percentage: cashPercentage,
        online_percentage: onlinePercentage,
      };
    } catch (error) {
      console.error("❌ [Summary] SQL Error:", error.message);
      return {
        total_cash: 0,
        total_online: 0,
        total_amount: 0,
        handed_over_cash: 0,
        pending_handover: 0,
        cash_percentage: 0,
        online_percentage: 0,
      };
    }
  }

  // Get cash bookings (for cash bookings tab) - UPDATED with advance bookings
  static async getCashBookings(hotelId, startDate, endDate) {
    console.log("💵 [Cash Bookings] Hotel:", hotelId);

    try {
      // We need to use UNION to combine regular bookings and advance bookings
      let query = `
        -- Regular bookings with pending cash
        SELECT 
          b.id as booking_id,
          DATE(b.created_at) as booking_date,
          b.total as booking_amount,
          b.payment_method,
          b.payment_status,
          COALESCE(c.name, 'Guest') as guest_name,
          r.room_number,
          COALESCE(SUM(col.amount), 0) as collected_amount,
          (b.total - COALESCE(SUM(col.amount), 0)) as pending_amount,
          'booking' as source_type
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN rooms r ON b.room_id = r.id
        LEFT JOIN collections col ON b.id = col.booking_id AND col.payment_mode = 'cash'
        WHERE b.hotel_id = ?
          AND b.payment_method = 'cash'
          AND b.status = 'booked'
          AND b.total > 0
      `;

      const params = [hotelId];

      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        query += ` AND DATE(b.created_at) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      query += ` GROUP BY b.id HAVING pending_amount > 0`;

      query += `
        UNION ALL
        
        -- Advance bookings with pending cash
        SELECT 
          ab.id as booking_id,
          DATE(ab.created_at) as booking_date,
          ab.total as booking_amount,
          ab.payment_method,
          ab.payment_status,
          COALESCE(c.name, 'Advance Guest') as guest_name,
          r.room_number,
          ab.advance_amount as collected_amount,
          (ab.total - ab.advance_amount) as pending_amount,
          'advance' as source_type
        FROM advance_bookings ab
        LEFT JOIN customers c ON ab.customer_id = c.id
        LEFT JOIN rooms r ON ab.room_id = r.id
        WHERE ab.hotel_id = ?
          AND ab.payment_method = 'cash'
          AND ab.status IN ('confirmed', 'pending')
          AND ab.advance_amount > 0
          AND ab.total > ab.advance_amount
      `;

      params.push(hotelId);

      if (startDate && endDate && startDate.trim() !== "" && endDate.trim() !== "") {
        query += ` AND DATE(ab.created_at) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      query += ` ORDER BY booking_date DESC`;

      console.log("💵 [Cash Bookings] Query:", query);
      console.log("💵 [Cash Bookings] Params:", params);

      const [rows] = await pool.execute(query, params);
      
      // Format the results
      const formattedRows = rows.map(row => ({
        ...row,
        booking_amount: parseFloat(row.booking_amount) || 0,
        collected_amount: parseFloat(row.collected_amount) || 0,
        pending_amount: parseFloat(row.pending_amount) || 0
      }));

      console.log("✅ [Cash Bookings] Found:", formattedRows.length);
      return formattedRows;
    } catch (error) {
      console.error("❌ [Cash Bookings] Error:", error.message);
      return [];
    }
  }

  // Create collection - (Keep as is, working version)
  static async create(collectionData) {
    console.log("📝 [Create Collection] Data:", collectionData);

    const query = `
      INSERT INTO collections (
        hotel_id, booking_id, collection_date, payment_mode,
        amount, transaction_id, remarks, collected_by,
        handover_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      collectionData.hotel_id,
      collectionData.booking_id || null,
      collectionData.collection_date || new Date().toISOString().split("T")[0],
      collectionData.payment_mode,
      collectionData.amount,
      collectionData.transaction_id || null,
      collectionData.remarks || "",
      collectionData.collected_by,
      collectionData.payment_mode === "cash" ? "pending" : "not_applicable",
      collectionData.created_by,
    ];

    try {
      const [result] = await pool.execute(query, params);
      console.log("✅ [Create Collection] Success! ID:", result.insertId);
      return result.insertId;
    } catch (error) {
      console.error("❌ [Create Collection] Error:", error.message);
      throw error;
    }
  }

  // Create collection from cash booking - (Keep as is)
  static async createFromCashBooking(bookingId, hotelId, userId) {
    console.log("💰 [Auto-Collection] Booking:", bookingId, "Hotel:", hotelId, "User:", userId);

    try {
      const [bookingRows] = await pool.execute(
        `
        SELECT 
          b.total,
          b.payment_method,
          b.payment_status,
          c.name as customer_name
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.id = ? AND b.hotel_id = ?
        `,
        [bookingId, hotelId],
      );

      if (bookingRows.length === 0) {
        console.log("❌ [Auto-Collection] Booking not found");
        return null;
      }

      const booking = bookingRows[0];

      const insertQuery = `
        INSERT INTO collections (
          hotel_id, booking_id, collection_date, payment_mode,
          amount, remarks, collected_by, handover_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        hotelId,
        bookingId,
        new Date().toISOString().split("T")[0],
        "cash",
        booking.total,
        `Auto-collection for booking #${bookingId} - ${booking.customer_name || "Guest"}`,
        userId,
        "pending",
        userId,
      ];

      const [result] = await pool.execute(insertQuery, insertParams);
      console.log("✅ [Auto-Collection] Created! ID:", result.insertId);
      return result.insertId;
    } catch (error) {
      console.error("❌ [Auto-Collection] Error:", error.message);
      return null;
    }
  }

  // Update handover status - (Keep as is)
  static async updateHandover(collectionId, hotelId, handoverData) {
    console.log("🔄 [Handover] Collection:", collectionId, "Data:", handoverData);

    const query = `
      UPDATE collections 
      SET 
        handover_status = ?,
        handover_amount = ?,
        handover_date = ?,
        handover_to = ?,
        handover_remarks = ?
      WHERE id = ? AND hotel_id = ?
    `;

    const params = [
      handoverData.status,
      handoverData.amount,
      handoverData.handover_date || new Date().toISOString().split("T")[0],
      handoverData.handover_to,
      handoverData.remarks || "",
      collectionId,
      hotelId,
    ];

    try {
      const [result] = await pool.execute(query, params);
      console.log("✅ [Handover] Updated, affected rows:", result.affectedRows);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("❌ [Handover] Error:", error.message);
      throw error;
    }
  }

  // Get collection by ID - (Keep as is)
  static async getById(collectionId, hotelId) {
    try {
      console.log("🔍 [GetById] Collection:", collectionId, "Hotel:", hotelId);

      const query = `
        SELECT c.*
        FROM collections c
        WHERE c.id = ? AND c.hotel_id = ?
      `;

      const [rows] = await pool.execute(query, [collectionId, hotelId]);

      if (rows.length === 0) {
        console.log("❌ [GetById] Collection not found");
        return null;
      }

      console.log("✅ [GetById] Collection found");
      return rows[0];
    } catch (error) {
      console.error("❌ [GetById] Error:", error.message);
      return null;
    }
  }
}

module.exports = Collection;