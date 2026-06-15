const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const superAdminController = {

    // Super Admin Login
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            console.log("🔐 Super Admin login attempt for:", username);

            // Find user with super_admin role OR hotel_id = 0
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE username = ? AND (role = ? OR hotel_id = 0)',
                [username, 'super_admin']
            );

            if (users.length === 0) {
                console.log("❌ Super Admin not found:", username);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const admin = users[0];
            console.log("✅ Super Admin found:", admin.username);

            // Verify password
            const isValid = await bcrypt.compare(password, admin.password);
            if (!isValid) {
                console.log("❌ Invalid password for super admin:", username);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            console.log("✅ Password verified for super admin:", username);

            // Generate token
            const token = jwt.sign(
                {
                    userId: admin.id,
                    username: admin.username,
                    role: 'super_admin',
                    hotel_id: 0,
                    isSuperAdmin: true
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Remove password from response
            const { password: _, ...adminWithoutPassword } = admin;

            res.json({
                success: true,
                token,
                user: {
                    ...adminWithoutPassword,
                    hotel_id: 0,
                    role: 'super_admin',
                    isSuperAdmin: true
                }
            });

        } catch (error) {
            console.error('❌ Super admin login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error: ' + error.message
            });
        }
    },


    // Dashboard Stats
    // getDashboardStats: async (req, res) => {
    //   try {
    //     // Get all stats in one query - REMOVED the status column reference
    //     const [stats] = await pool.execute(`
    //       SELECT 
    //         (SELECT COUNT(*) FROM hotels) as total_hotels,
    //         (SELECT COUNT(*) FROM hotels WHERE plan = 'pro') as pro_hotels,
    //         (SELECT COUNT(*) FROM hotels WHERE plan = 'base') as basic_hotels,
    //         (SELECT COUNT(*) FROM hotels WHERE plan = 'pro_plus') as pro_plus_hotels,
    //         (SELECT COUNT(*) FROM rooms) as total_rooms,
    //         (SELECT COUNT(*) FROM function_rooms) as total_function_rooms,
    //         (SELECT COUNT(*) FROM users WHERE hotel_id != 0 AND role != 'super_admin') as total_users,
    //         (SELECT COUNT(*) FROM bookings) as total_bookings,
    //         (SELECT COALESCE(SUM(total), 0) FROM bookings WHERE status = 'booked') as total_revenue,

    //         -- Trial statistics
    //         (SELECT COUNT(*) FROM hotels h 
    //          WHERE h.plan = 'pro' 
    //          AND h.trial_expiry_date IS NOT NULL 
    //          AND DATEDIFF(h.trial_expiry_date, NOW()) <= 2
    //          AND DATEDIFF(h.trial_expiry_date, NOW()) > 0) as expiring_trials,

    //         (SELECT COUNT(*) FROM hotels h 
    //          WHERE h.plan = 'pro' 
    //          AND h.trial_expiry_date IS NOT NULL 
    //          AND DATEDIFF(h.trial_expiry_date, NOW()) <= 0) as expired_trials,

    //         (SELECT COUNT(*) FROM hotels h 
    //          WHERE h.plan = 'pro' 
    //          AND h.trial_expiry_date IS NOT NULL 
    //          AND DATEDIFF(h.trial_expiry_date, NOW()) > 2) as active_trials
    //     `);

    //     // Get recent hotels (last 5) - REMOVED status reference
    //     const [recentHotels] = await pool.execute(`
    //       SELECT 
    //         h.id,
    //         h.name,
    //         h.plan,
    //         h.trial_expiry_date,
    //         h.created_at,
    //         h.address,
    //         u.email as admin_email,
    //         u.name as admin_name,
    //         u.phone as admin_phone,
    //         DATEDIFF(h.trial_expiry_date, NOW()) as days_left
    //       FROM hotels h
    //       LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
    //       ORDER BY h.created_at DESC
    //       LIMIT 5
    //     `);

    //     // Get revenue by month (last 6 months)
    //     const [monthlyRevenue] = await pool.execute(`
    //       SELECT 
    //         DATE_FORMAT(created_at, '%Y-%m') as month,
    //         SUM(total) as revenue
    //       FROM bookings
    //       WHERE status = 'booked'
    //       AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    //       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    //       ORDER BY month DESC
    //     `);

    //     // Calculate active hotels based on user status instead
    //     const [activeHotelsCount] = await pool.execute(`
    //       SELECT COUNT(DISTINCT hotel_id) as count
    //       FROM users 
    //       WHERE status = 'active' AND hotel_id != 0 AND role != 'super_admin'
    //     `);

    //     res.json({
    //       success: true,
    //       data: {
    //         ...stats[0],
    //         active_hotels: activeHotelsCount[0].count,
    //         recentHotels,
    //         monthlyRevenue
    //       }
    //     });

    //   } catch (error) {
    //     console.error('Error getting dashboard stats:', error);
    //     res.status(500).json({
    //       success: false,
    //       message: 'Failed to get dashboard stats: ' + error.message
    //     });
    //   }
    // },

    // Dashboard Stats
    getDashboardStats: async (req, res) => {
        try {
            console.log("📊 Fetching super admin dashboard stats...");

            // Test database connection first
            try {
                await pool.execute('SELECT 1');
                console.log("✅ Database connection successful");
            } catch (dbError) {
                console.error("❌ Database connection failed:", dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Database connection failed'
                });
            }

            // Get all stats with error handling for each query
            let stats = {};

            try {
                // Total hotels
                const [totalHotelsResult] = await pool.execute('SELECT COUNT(*) as count FROM hotels');
                stats.totalHotels = totalHotelsResult[0].count;
                console.log("📊 Total hotels:", stats.totalHotels);

                // Hotels by plan
                const [proHotelsResult] = await pool.execute("SELECT COUNT(*) as count FROM hotels WHERE plan = 'pro'");
                stats.proHotels = proHotelsResult[0].count;
                console.log("📊 PRO hotels:", stats.proHotels);

                const [basicHotelsResult] = await pool.execute("SELECT COUNT(*) as count FROM hotels WHERE plan = 'base'");
                stats.basicHotels = basicHotelsResult[0].count;
                console.log("📊 Basic hotels:", stats.basicHotels);

                const [proPlusHotelsResult] = await pool.execute("SELECT COUNT(*) as count FROM hotels WHERE plan = 'pro_plus'");
                stats.proPlusHotels = proPlusHotelsResult[0].count;

                // Total rooms
                const [totalRoomsResult] = await pool.execute('SELECT COUNT(*) as count FROM rooms');
                stats.totalRooms = totalRoomsResult[0].count;
                console.log("📊 Total rooms:", stats.totalRooms);

                // Total function rooms
                const [totalFunctionRoomsResult] = await pool.execute('SELECT COUNT(*) as count FROM function_rooms');
                stats.totalFunctionRooms = totalFunctionRoomsResult[0].count;
                console.log("📊 Total function rooms:", stats.totalFunctionRooms);

                // Total users (excluding super_admin)
                const [totalUsersResult] = await pool.execute(
                    "SELECT COUNT(*) as count FROM users WHERE role != 'super_admin' AND hotel_id != 0"
                );
                stats.totalUsers = totalUsersResult[0].count;
                console.log("📊 Total users:", stats.totalUsers);

                // Total bookings
                const [totalBookingsResult] = await pool.execute('SELECT COUNT(*) as count FROM bookings');
                stats.totalBookings = totalBookingsResult[0].count;
                console.log("📊 Total bookings:", stats.totalBookings);

                // Total revenue
                const [totalRevenueResult] = await pool.execute(
                    "SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE status = 'booked'"
                );
                stats.totalRevenue = totalRevenueResult[0].total;
                console.log("📊 Total revenue:", stats.totalRevenue);

                // Active hotels (based on users with active status)
                const [activeHotelsResult] = await pool.execute(`
        SELECT COUNT(DISTINCT hotel_id) as count
        FROM users 
        WHERE status = 'active' AND hotel_id != 0 AND role != 'super_admin'
      `);
                stats.activeHotels = activeHotelsResult[0].count;
                console.log("📊 Active hotels:", stats.activeHotels);

                // Trial statistics
                const [expiringTrialsResult] = await pool.execute(`
        SELECT COUNT(*) as count 
        FROM hotels h 
        WHERE h.plan = 'pro' 
        AND h.trial_expiry_date IS NOT NULL 
        AND DATEDIFF(h.trial_expiry_date, NOW()) <= 2
        AND DATEDIFF(h.trial_expiry_date, NOW()) > 0
      `);
                stats.expiringTrials = expiringTrialsResult[0].count;
                console.log("📊 Expiring trials:", stats.expiringTrials);

                const [expiredTrialsResult] = await pool.execute(`
        SELECT COUNT(*) as count 
        FROM hotels h 
        WHERE h.plan = 'pro' 
        AND h.trial_expiry_date IS NOT NULL 
        AND DATEDIFF(h.trial_expiry_date, NOW()) <= 0
      `);
                stats.expiredTrials = expiredTrialsResult[0].count;
                console.log("📊 Expired trials:", stats.expiredTrials);

                const [activeTrialsResult] = await pool.execute(`
        SELECT COUNT(*) as count 
        FROM hotels h 
        WHERE h.plan = 'pro' 
        AND h.trial_expiry_date IS NOT NULL 
        AND DATEDIFF(h.trial_expiry_date, NOW()) > 2
      `);
                stats.activeTrials = activeTrialsResult[0].count;

            } catch (queryError) {
                console.error("❌ Error executing queries:", queryError);
                throw queryError;
            }

            // Get recent hotels
            const [recentHotels] = await pool.execute(`
      SELECT 
        h.id,
        h.name,
        h.plan,
        h.trial_expiry_date,
        h.created_at,
        h.address,
        u.email as admin_email,
        u.name as admin_name,
        u.phone as admin_phone,
        DATEDIFF(h.trial_expiry_date, NOW()) as days_left
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
        WHERE h.id != 0
      ORDER BY h.created_at DESC
      LIMIT 5
    `);
            console.log("📊 Recent hotels count:", recentHotels.length);

            // Get revenue by month
            const [monthlyRevenue] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total) as revenue
      FROM bookings
      WHERE status = 'booked'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);
            console.log("📊 Monthly revenue count:", monthlyRevenue.length);

            const responseData = {
                ...stats,
                recentHotels,
                monthlyRevenue
            };

            console.log("✅ Dashboard stats prepared:", {
                totalHotels: stats.totalHotels,
                totalRooms: stats.totalRooms,
                totalRevenue: stats.totalRevenue
            });

            res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard stats: ' + error.message
            });
        }
    },

    // Get all hotels with details
    getAllHotels: async (req, res) => {
        try {
            const { plan, status, search } = req.query;

            let query = `
      SELECT 
        h.*,
        u.name as admin_name,
        u.email as admin_email,
        u.phone as admin_phone,
        u.status as admin_status,
        (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id) as total_rooms,
        (SELECT COUNT(*) FROM function_rooms WHERE hotel_id = h.id) as total_function_rooms,
        (SELECT COUNT(*) FROM users WHERE hotel_id = h.id AND role != 'super_admin') as total_users,
        (SELECT COUNT(*) FROM bookings WHERE hotel_id = h.id AND status = 'booked') as active_bookings,
        (SELECT COALESCE(SUM(total), 0) FROM bookings WHERE hotel_id = h.id AND status = 'booked') as total_revenue,
        DATEDIFF(h.trial_expiry_date, NOW()) as days_left
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
      WHERE h.id != 0  -- 👈 EXCLUDE THE SYSTEM HOTEL (ID = 0)
    `;

            const params = [];

            if (plan && plan !== 'all') {
                query += ` AND h.plan = ?`;
                params.push(plan);
            }

            // Fix: Filter by user status instead of hotel status
            if (status === 'active') {
                query += ` AND u.status = 'active'`;
            } else if (status === 'pending') {
                query += ` AND u.status = 'pending'`;
            } else if (status === 'suspended') {
                query += ` AND u.status = 'suspended'`;
            }

            if (search) {
                query += ` AND (h.name LIKE ? OR u.email LIKE ? OR u.name LIKE ?)`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY h.created_at DESC`;

            const [hotels] = await pool.execute(query, params);

            // Add status label
            const hotelsWithStatus = hotels.map(h => ({
                ...h,
                trial_status: h.days_left <= 0 ? 'expired' :
                    h.days_left <= 2 ? 'warning' :
                        h.days_left > 0 ? 'active' : 'no_trial'
            }));

            res.json({
                success: true,
                data: hotelsWithStatus
            });

        } catch (error) {
            console.error('Error getting hotels:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get hotels: ' + error.message
            });
        }
    },

    // Get single hotel details
    getHotelDetails: async (req, res) => {
        try {
            const { id } = req.params;

            // Don't allow access to system hotel
            if (id === '0' || id === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Hotel not found'
                });
            }

            const [hotels] = await pool.execute(`
      SELECT 
        h.*,
        u.id as admin_id,
        u.name as admin_name,
        u.email as admin_email,
        u.phone as admin_phone,
        u.username as admin_username,
        u.status as admin_status,
        u.created_at as admin_created_at
      FROM hotels h
      LEFT JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
      WHERE h.id = ?
    `, [id]);

            if (hotels.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Hotel not found'
                });
            }


            const hotel = hotels[0];

            // Get detailed stats
            const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM rooms WHERE hotel_id = ?) as total_rooms,
          (SELECT COUNT(*) FROM rooms WHERE hotel_id = ? AND status = 'available') as available_rooms,
          (SELECT COUNT(*) FROM rooms WHERE hotel_id = ? AND status = 'booked') as booked_rooms,
          (SELECT COUNT(*) FROM rooms WHERE hotel_id = ? AND status = 'maintenance') as maintenance_rooms,
          (SELECT COUNT(*) FROM rooms WHERE hotel_id = ? AND status = 'blocked') as blocked_rooms,
          
          (SELECT COUNT(*) FROM function_rooms WHERE hotel_id = ?) as total_function_rooms,
          (SELECT COUNT(*) FROM function_rooms WHERE hotel_id = ? AND status = 'available') as available_function_rooms,
          (SELECT COUNT(*) FROM function_rooms WHERE hotel_id = ? AND status = 'booked') as booked_function_rooms,
          
          (SELECT COUNT(*) FROM users WHERE hotel_id = ? AND role != 'super_admin') as total_users,
          (SELECT COUNT(*) FROM users WHERE hotel_id = ? AND role = 'admin') as admin_count,
          (SELECT COUNT(*) FROM users WHERE hotel_id = ? AND role = 'staff') as staff_count,
          
          (SELECT COUNT(*) FROM bookings WHERE hotel_id = ?) as total_bookings,
          (SELECT COUNT(*) FROM bookings WHERE hotel_id = ? AND status = 'booked') as active_bookings,
          (SELECT COUNT(*) FROM bookings WHERE hotel_id = ? AND DATE(created_at) = CURDATE()) as today_bookings,
          
          (SELECT COUNT(*) FROM function_bookings WHERE hotel_id = ?) as total_function_bookings,
          (SELECT COUNT(*) FROM function_bookings WHERE hotel_id = ? AND status = 'confirmed') as active_function_bookings,
          
          (SELECT COALESCE(SUM(total), 0) FROM bookings WHERE hotel_id = ? AND status = 'booked') as total_revenue,
          (SELECT COALESCE(SUM(total_amount), 0) FROM function_bookings WHERE hotel_id = ? AND status = 'completed') as function_revenue,
          
          DATEDIFF(h.trial_expiry_date, NOW()) as days_left
        FROM hotels h
        WHERE h.id = ?
      `, [
                id, id, id, id, id,  // rooms
                id, id, id,           // function rooms
                id, id, id,           // users
                id, id, id,           // bookings
                id, id,               // function bookings
                id, id,               // revenue
                id                    // for days_left
            ]);

            // Get recent bookings
            const [recentBookings] = await pool.execute(`
        SELECT 
          b.*,
          r.room_number,
          c.name as customer_name
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.hotel_id = ?
        ORDER BY b.created_at DESC
        LIMIT 10
      `, [id]);

            // Get all users
            const [users] = await pool.execute(`
        SELECT id, username, name, email, phone, role, status, created_at
        FROM users
        WHERE hotel_id = ? AND role != 'super_admin'
        ORDER BY created_at DESC
      `, [id]);

            res.json({
                success: true,
                data: {
                    ...hotel,
                    stats: stats[0],
                    recentBookings,
                    users
                }
            });

        } catch (error) {
            console.error('Error getting hotel details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get hotel details'
            });
        }
    },

    // Update hotel
    // updateHotel: async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const { name, address, gst_number, plan, trial_expiry_date } = req.body;

    //         const [result] = await pool.execute(
    //             `UPDATE hotels 
    //      SET name = ?, address = ?, gst_number = ?, plan = ?, trial_expiry_date = ?
    //      WHERE id = ?`,
    //             [name, address, gst_number, plan, trial_expiry_date || null, id]
    //         );

    //         if (result.affectedRows === 0) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Hotel not found'
    //             });
    //         }

    //         res.json({
    //             success: true,
    //             message: 'Hotel updated successfully'
    //         });

    //     } catch (error) {
    //         console.error('Error updating hotel:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Failed to update hotel'
    //         });
    //     }
    // },
    // Update hotel
    updateHotel: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, address, gst_number, plan, trial_expiry_date } = req.body;

            // Validate trial_expiry_date if provided
            if (trial_expiry_date) {
                const expiryDate = new Date(trial_expiry_date);
                if (isNaN(expiryDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid trial expiry date format'
                    });
                }
            }

            const [result] = await pool.execute(
                `UPDATE hotels 
             SET name = ?, address = ?, gst_number = ?, plan = ?, trial_expiry_date = ?
             WHERE id = ?`,
                [name, address, gst_number, plan, trial_expiry_date || null, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Hotel not found'
                });
            }

            // If trial expiry date is being set for PRO plan, you might want to update user status
            if (plan === 'pro' && trial_expiry_date) {
                // Optionally update admin status based on trial expiry
                const today = new Date();
                const expiry = new Date(trial_expiry_date);

                if (expiry < today) {
                    // Trial expired - you might want to set status to pending or something
                    await pool.execute(
                        'UPDATE users SET status = ? WHERE hotel_id = ? AND role = ?',
                        ['pending', id, 'admin']
                    );
                }
            }

            res.json({
                success: true,
                message: 'Hotel updated successfully'
            });

        } catch (error) {
            console.error('Error updating hotel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update hotel: ' + error.message
            });
        }
    },

    // Delete hotel and all related data
    deleteHotel: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { id } = req.params;

            await connection.beginTransaction();

            // Delete in correct order (child tables first)
            await connection.execute('DELETE FROM user_permissions WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM function_room_blocks WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM function_bookings WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM function_rooms WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM bookings WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM rooms WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM customers WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM users WHERE hotel_id = ?', [id]);
            await connection.execute('DELETE FROM hotels WHERE id = ?', [id]);

            await connection.commit();

            res.json({
                success: true,
                message: 'Hotel and all associated data deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error deleting hotel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete hotel'
            });
        } finally {
            connection.release();
        }
    },

    // Get trial management data
    getTrialHotels: async (req, res) => {
        try {
            const { type } = req.query; // 'expiring', 'expired', 'active'

            let query = `
        SELECT 
          h.id,
          h.name,
          h.plan,
          h.trial_expiry_date,
          h.created_at,
          u.name as admin_name,
          u.email as admin_email,
          u.phone as admin_phone,
          DATEDIFF(h.trial_expiry_date, NOW()) as days_left
        FROM hotels h
        JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
        WHERE h.plan = 'pro' 
        AND h.trial_expiry_date IS NOT NULL
        AND h.id != 0 
      `;

            if (type === 'expiring') {
                query += ` AND DATEDIFF(h.trial_expiry_date, NOW()) <= 2 AND DATEDIFF(h.trial_expiry_date, NOW()) > 0`;
            } else if (type === 'expired') {
                query += ` AND DATEDIFF(h.trial_expiry_date, NOW()) <= 0`;
            } else if (type === 'active') {
                query += ` AND DATEDIFF(h.trial_expiry_date, NOW()) > 2`;
            }

            query += ` ORDER BY h.trial_expiry_date ASC`;

            const [hotels] = await pool.execute(query);

            const hotelsWithStatus = hotels.map(h => ({
                ...h,
                status: h.days_left <= 0 ? 'expired' : h.days_left <= 2 ? 'warning' : 'active'
            }));

            res.json({
                success: true,
                data: hotelsWithStatus
            });

        } catch (error) {
            console.error('Error getting trial hotels:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get trial data'
            });
        }
    },

    // Extend trial
    extendTrial: async (req, res) => {
        try {
            const { id } = req.params;
            const { days = 30 } = req.body;

            const [hotels] = await pool.execute(
                'SELECT trial_expiry_date FROM hotels WHERE id = ?',
                [id]
            );

            if (hotels.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Hotel not found'
                });
            }

            let newExpiryDate;
            if (hotels[0].trial_expiry_date && new Date(hotels[0].trial_expiry_date) > new Date()) {
                // Extend from current expiry
                const currentExpiry = new Date(hotels[0].trial_expiry_date);
                currentExpiry.setDate(currentExpiry.getDate() + days);
                newExpiryDate = currentExpiry;
            } else {
                // Set new trial from today
                newExpiryDate = new Date();
                newExpiryDate.setDate(newExpiryDate.getDate() + days);
            }

            await pool.execute(
                'UPDATE hotels SET trial_expiry_date = ? WHERE id = ?',
                [newExpiryDate, id]
            );

            // Update user status to pending (reactivate trial)
            await pool.execute(
                'UPDATE users SET status = ? WHERE hotel_id = ? AND role = ?',
                ['pending', id, 'admin']
            );

            res.json({
                success: true,
                message: `Trial extended by ${days} days`,
                new_expiry_date: newExpiryDate
            });

        } catch (error) {
            console.error('Error extending trial:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to extend trial'
            });
        }
    },

    // Send reminder email
    sendReminderEmail: async (req, res) => {
        try {
            const { hotel_id } = req.body;

            const [hotels] = await pool.execute(`
        SELECT h.*, u.email as admin_email, u.name as admin_name, u.phone as admin_phone
        FROM hotels h
        JOIN users u ON h.id = u.hotel_id AND u.role = 'admin'
        WHERE h.id = ?
      `, [hotel_id]);

            if (hotels.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Hotel not found'
                });
            }

            const hotel = hotels[0];
            const daysLeft = Math.ceil((new Date(hotel.trial_expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

            // Here you would integrate with your email service
            console.log(`📧 Sending reminder email to ${hotel.admin_email}`);
            console.log(`Hotel: ${hotel.name}`);
            console.log(`Days left: ${daysLeft}`);

            // For now, just return success
            res.json({
                success: true,
                message: `Reminder sent to ${hotel.admin_email}`,
                data: {
                    hotel: hotel.name,
                    email: hotel.admin_email,
                    days_left: daysLeft
                }
            });

        } catch (error) {
            console.error('Error sending reminder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send reminder'
            });
        }
    },

    // Get all rooms for a hotel
    getHotelRooms: async (req, res) => {
        try {
            const { id } = req.params;

            const [rooms] = await pool.execute(`
        SELECT * FROM rooms 
        WHERE hotel_id = ?
        ORDER BY 
          CAST(room_number AS UNSIGNED), 
          room_number
      `, [id]);

            res.json({
                success: true,
                data: rooms
            });

        } catch (error) {
            console.error('Error getting hotel rooms:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get hotel rooms'
            });
        }
    },

    // Create room for hotel
    createRoom: async (req, res) => {
        try {
            const { id: hotelId } = req.params;
            const roomData = req.body;

            // Check if room number already exists
            const [existing] = await pool.execute(
                'SELECT id FROM rooms WHERE hotel_id = ? AND room_number = ?',
                [hotelId, roomData.room_number]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Room number already exists'
                });
            }

            const [result] = await pool.execute(
                `INSERT INTO rooms (
          hotel_id, room_number, type, floor, price, amenities, 
          status, gst_percentage, service_charge_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    hotelId,
                    roomData.room_number,
                    roomData.type,
                    roomData.floor || 1,
                    roomData.price,
                    roomData.amenities || '',
                    roomData.status || 'available',
                    roomData.gst_percentage || 12.00,
                    roomData.service_charge_percentage || 10.00
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Room created successfully',
                data: { id: result.insertId }
            });

        } catch (error) {
            console.error('Error creating room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create room'
            });
        }
    },

    // Update room
    updateRoom: async (req, res) => {
        try {
            const { hotelId, roomId } = req.params;

            const roomData = req.body;

            const [result] = await pool.execute(
                `UPDATE rooms 
         SET room_number = ?, type = ?, floor = ?, price = ?, 
             amenities = ?, status = ?, gst_percentage = ?, 
             service_charge_percentage = ?
         WHERE id = ? AND hotel_id = ?`,
                [
                    roomData.room_number,
                    roomData.type,
                    roomData.floor,
                    roomData.price,
                    roomData.amenities,
                    roomData.status,
                    roomData.gst_percentage,
                    roomData.service_charge_percentage,
                    roomId,
                    hotelId
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json({
                success: true,
                message: 'Room updated successfully'
            });

        } catch (error) {
            console.error('Error updating room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update room'
            });
        }
    },

    // Delete room
    deleteRoom: async (req, res) => {
        try {
            const { hotelId, roomId } = req.params;

            // Check if room has bookings
            const [bookings] = await pool.execute(
                'SELECT id FROM bookings WHERE room_id = ? AND hotel_id = ? AND status = "booked"',
                [roomId, hotelId]
            );

            if (bookings.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete room with active bookings'
                });
            }

            const [result] = await pool.execute(
                'DELETE FROM rooms WHERE id = ? AND hotel_id = ?',
                [roomId, hotelId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json({
                success: true,
                message: 'Room deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete room'
            });
        }
    },

    // Get all function rooms for a hotel
    getHotelFunctionRooms: async (req, res) => {
        try {
            const { id } = req.params;

            const [rooms] = await pool.execute(`
        SELECT * FROM function_rooms 
        WHERE hotel_id = ?
        ORDER BY 
          CAST(room_number AS UNSIGNED), 
          room_number
      `, [id]);

            res.json({
                success: true,
                data: rooms
            });

        } catch (error) {
            console.error('Error getting function rooms:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get function rooms'
            });
        }
    },

    // Create function room for hotel
    createFunctionRoom: async (req, res) => {
        try {
            const { id: hotelId } = req.params;
            const roomData = req.body;

            // Check if room number already exists
            const [existing] = await pool.execute(
                'SELECT id FROM function_rooms WHERE hotel_id = ? AND room_number = ?',
                [hotelId, roomData.room_number]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Function room number already exists'
                });
            }

            const [result] = await pool.execute(
                `INSERT INTO function_rooms (
          hotel_id, room_number, name, type, capacity, floor,
          base_price, half_day_price, hourly_rate, amenities,
          dimensions, area_sqft, has_ac, has_projector, has_sound_system,
          has_wifi, has_catering, has_parking, has_stage, setup_options, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    hotelId,
                    roomData.room_number,
                    roomData.name || roomData.room_number,
                    roomData.type,
                    roomData.capacity,
                    roomData.floor || 1,
                    roomData.base_price,
                    roomData.half_day_price || null,
                    roomData.hourly_rate || null,
                    roomData.amenities || null,
                    roomData.dimensions || null,
                    roomData.area_sqft || null,
                    roomData.has_ac || false,
                    roomData.has_projector || false,
                    roomData.has_sound_system || false,
                    roomData.has_wifi || false,
                    roomData.has_catering || false,
                    roomData.has_parking || false,
                    roomData.has_stage || false,
                    roomData.setup_options || null,
                    roomData.status || 'available'
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Function room created successfully',
                data: { id: result.insertId }
            });

        } catch (error) {
            console.error('Error creating function room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create function room'
            });
        }
    },

    // Update function room
    updateFunctionRoom: async (req, res) => {
        try {
            const { hotelId, roomId } = req.params;
            const roomData = req.body;

            const updates = [];
            const values = [];

            const allowedFields = [
                'room_number', 'name', 'type', 'capacity', 'floor',
                'base_price', 'half_day_price', 'hourly_rate', 'amenities',
                'dimensions', 'area_sqft', 'has_ac', 'has_projector',
                'has_sound_system', 'has_wifi', 'has_catering', 'has_parking',
                'has_stage', 'setup_options', 'status'
            ];

            allowedFields.forEach(field => {
                if (roomData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(roomData[field]);
                }
            });

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            values.push(roomId, hotelId);

            const [result] = await pool.execute(
                `UPDATE function_rooms SET ${updates.join(', ')} WHERE id = ? AND hotel_id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Function room not found'
                });
            }

            res.json({
                success: true,
                message: 'Function room updated successfully'
            });

        } catch (error) {
            console.error('Error updating function room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update function room'
            });
        }
    },

    // Delete function room
    deleteFunctionRoom: async (req, res) => {
        try {
            const { hotelId, roomId } = req.params;

            // Check if room has bookings
            const [bookings] = await pool.execute(
                'SELECT id FROM function_bookings WHERE function_room_id = ? AND hotel_id = ? AND status IN ("confirmed", "pending")',
                [roomId, hotelId]
            );

            if (bookings.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete function room with active bookings'
                });
            }

            const [result] = await pool.execute(
                'DELETE FROM function_rooms WHERE id = ? AND hotel_id = ?',
                [roomId, hotelId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Function room not found'
                });
            }

            res.json({
                success: true,
                message: 'Function room deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting function room:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete function room'
            });
        }
    },


    // Update hotel admin
    updateHotelAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, phone, username, status } = req.body;

            // First get the admin user for this hotel
            const [admins] = await pool.execute(
                'SELECT id FROM users WHERE hotel_id = ? AND role = ?',
                [id, 'admin']
            );

            if (admins.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found for this hotel'
                });
            }

            const adminId = admins[0].id;

            // Update admin user
            const [result] = await pool.execute(
                `UPDATE users 
             SET name = ?, email = ?, phone = ?, username = ?, status = ?
             WHERE id = ? AND hotel_id = ?`,
                [name, email, phone, username, status, adminId, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Failed to update admin'
                });
            }

            res.json({
                success: true,
                message: 'Admin updated successfully'
            });

        } catch (error) {
            console.error('Error updating hotel admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update admin: ' + error.message
            });
        }
    },
    // Update reactivation amount for a hotel
updateReactivationAmount: async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { amount } = req.body; // amount in rupees

    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Store the custom amount in hotel settings or a separate table
    // You can add a column to hotels table or create a settings table
    await pool.execute(
      `UPDATE hotels SET custom_reactivation_amount = ? WHERE id = ?`,
      [amount, hotelId]
    );

    res.json({
      success: true,
      message: 'Reactivation amount updated successfully',
      data: { hotelId, amount }
    });

  } catch (error) {
    console.error('Error updating reactivation amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reactivation amount'
    });
  }
},

// Get reactivation amount for a hotel
getReactivationAmount: async (req, res) => {
  try {
    const { hotelId } = req.params;

    const [result] = await pool.execute(
      `SELECT custom_reactivation_amount FROM hotels WHERE id = ?`,
      [hotelId]
    );

    const amount = result[0]?.custom_reactivation_amount || 999; // Default to 999

    res.json({
      success: true,
      data: { amount }
    });

  } catch (error) {
    console.error('Error getting reactivation amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reactivation amount'
    });
  }
},

// Get single room details
getRoomDetails: async (req, res) => {
    try {
        const { hotelId, roomId } = req.params;

        const [rooms] = await pool.execute(
            'SELECT * FROM rooms WHERE id = ? AND hotel_id = ?',
            [roomId, hotelId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: rooms[0]
        });

    } catch (error) {
        console.error('Error getting room details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get room details: ' + error.message
        });
    }
},

// Get single function room details
getFunctionRoomDetails: async (req, res) => {
    try {
        const { hotelId, roomId } = req.params;

        const [rooms] = await pool.execute(
            'SELECT * FROM function_rooms WHERE id = ? AND hotel_id = ?',
            [roomId, hotelId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Function room not found'
            });
        }

        res.json({
            success: true,
            data: rooms[0]
        });

    } catch (error) {
        console.error('Error getting function room details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get function room details: ' + error.message
        });
    }
},

// In superAdminController.js - Add these methods

// Get notification settings for a hotel
getNotificationSettings: async (req, res) => {
    try {
        const { hotelId } = req.params;

        console.log(`📋 Getting notification settings for hotel: ${hotelId}`);

        const [hotels] = await pool.execute(
            'SELECT notification_settings FROM hotels WHERE id = ?',
            [hotelId]
        );

        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Default settings (both enabled)
        let settings = {
            email: true,
            whatsapp: true
        };

        // Parse stored settings if they exist
        if (hotels[0].notification_settings) {
            try {
                // Handle both string and object cases
                let storedSettings = hotels[0].notification_settings;
                if (typeof storedSettings === 'string') {
                    storedSettings = JSON.parse(storedSettings);
                }
                settings = { ...settings, ...storedSettings };
            } catch (e) {
                console.error('Error parsing notification settings:', e);
            }
        }

        console.log(`✅ Notification settings retrieved:`, settings);

        res.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('❌ Error getting notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification settings: ' + error.message
        });
    }
},

// Update notification settings for a hotel
updateNotificationSettings: async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { email, whatsapp } = req.body;

        console.log(`📝 Updating notification settings for hotel: ${hotelId}`, { email, whatsapp });

        // Validate input
        if (email === undefined && whatsapp === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one setting (email or whatsapp) must be provided'
            });
        }

        // Get current settings first
        const [hotels] = await pool.execute(
            'SELECT notification_settings FROM hotels WHERE id = ?',
            [hotelId]
        );

        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Parse existing settings or use defaults
        let currentSettings = { email: true, whatsapp: true };
        if (hotels[0].notification_settings) {
            try {
                let storedSettings = hotels[0].notification_settings;
                if (typeof storedSettings === 'string') {
                    storedSettings = JSON.parse(storedSettings);
                }
                currentSettings = { ...currentSettings, ...storedSettings };
            } catch (e) {
                console.error('Error parsing existing settings:', e);
            }
        }

        // Update only provided fields
        const updatedSettings = {
            ...currentSettings,
            ...(email !== undefined && { email }),
            ...(whatsapp !== undefined && { whatsapp })
        };

        // Save to database
        const [result] = await pool.execute(
            'UPDATE hotels SET notification_settings = ? WHERE id = ?',
            [JSON.stringify(updatedSettings), hotelId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        console.log(`✅ Notification settings updated:`, updatedSettings);

        res.json({
            success: true,
            message: 'Notification settings updated successfully',
            data: updatedSettings
        });

    } catch (error) {
        console.error('❌ Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings: ' + error.message
        });
    }
},
};

module.exports = superAdminController;