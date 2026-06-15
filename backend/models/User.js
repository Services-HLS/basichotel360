




const { pool } = require('../config/database');
const userQueries = require('../queries/userQueries');
const bcrypt = require('bcryptjs');

class User {
  // ✅ CREATE USER (Handles 'pending' or 'active' status)
  static async create(userData, createdByAdminId = null) {
    console.log("🔐 [CREATE USER] Starting:", userData.username);

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // ✅ CRITICAL: Use the status passed from frontend (e.g., 'pending'), otherwise default to 'active'
    // const status = userData.status || 'active'; 
    const status = userData.status ?? 'pending';


    // Create user in Database
    const [result] = await pool.execute(
      userQueries.CREATE_USER,
      [
        userData.username,
        hashedPassword,
        userData.role || 'staff',
        userData.name,
        userData.email,
        userData.phone,
        userData.hotel_id,
        status // ✅ Inserts 'pending' for Pro, 'active' for Free
      ]
    );

    const userId = result.insertId;
    console.log("✅ [CREATE USER] User created with ID:", userId, "Status:", status);

    // Assign default permissions (basic/free hotels get a limited set)
    await this.assignDefaultPermissions(
      userId,
      userData.hotel_id,
      userData.role || 'staff',
      createdByAdminId,
      userData.hotel_plan
    );

    return userId;
  }

  // Find user by username
  // static async findByUsername(username) {
  //   const [rows] = await pool.execute(userQueries.FIND_USER_BY_USERNAME, [username]);
  //   return rows[0];
  // }

  // Find user by username
static async findByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  
  if (rows[0]) {
    // For super_admin, ensure hotel_id is handled properly
    if (rows[0].role === 'super_admin' || rows[0].hotel_id === 0) {
      rows[0].hotel_id = 0; // Keep as 0 for consistency
      rows[0].hotel_name = 'System Administration';
    }
  }
  
  return rows[0];
}

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.execute(userQueries.FIND_USER_BY_ID, [id]);
    return rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      if (!isValid) {
        // Fallback trim check for older passwords/copy-paste issues
        const trimmedIsValid = await bcrypt.compare(plainPassword.trim(), hashedPassword);
        return trimmedIsValid;
      }
      return isValid;
    } catch (error) {
      console.error("❌ [VERIFY PASSWORD] Error:", error);
      return false;
    }
  }

  // Find users by hotel
  static async findByHotel(hotelId) {
    const [rows] = await pool.execute(userQueries.FIND_USERS_BY_HOTEL, [hotelId]);
    return rows;
  }

  // ✅ UPDATE USER (Now safely handles status updates)
  // static async update(id, hotelId, userData) {
  //   // We need to fetch the current user first to ensure we don't overwrite missing fields with NULL
  //   const currentUser = await this.findById(id);
  //   if (!currentUser) return false;

  //   const [result] = await pool.execute(
  //     userQueries.UPDATE_USER,
  //     [
  //       userData.name || currentUser.name, 
  //       userData.email || currentUser.email, 
  //       userData.phone || currentUser.phone, 
  //       userData.role || currentUser.role, 
  //       userData.status || currentUser.status, // ✅ Only update status if provided
  //       id, 
  //       hotelId
  //     ]
  //   );
  //   return result.affectedRows > 0;
  // }
  static async update(userId, hotelId, userData) {
    const [result] = await pool.execute(
      `UPDATE users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone)
       WHERE id = ? AND hotel_id = ?`,
      [
        userData.name || null,
        userData.email || null,
        userData.phone || null,
        userId,
        hotelId
      ]
    );
    return result.affectedRows > 0;
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.execute(userQueries.UPDATE_PASSWORD, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  // Delete user
  static async delete(id, hotelId) {
    const [result] = await pool.execute(userQueries.DELETE_USER, [id, hotelId]);
    return result.affectedRows > 0;
  }

  // Check username exists
  static async checkUsernameExists(username, excludeId = null) {
    let query = userQueries.CHECK_USERNAME_EXISTS;
    const params = excludeId ? [username, excludeId] : [username, 0];
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }

  // PERMISSION METHODS
  static async getUserPermissions(userId, hotelId) {
    const [permissions] = await pool.execute(
      `SELECT permission_name FROM user_permissions WHERE user_id = ? AND hotel_id = ?`,
      [userId, hotelId]
    );
    return permissions.map(p => p.permission_name);
  }

  static async hasPermission(userId, hotelId, permissionName) {
    const [rows] = await pool.execute(
      `SELECT 1 FROM user_permissions WHERE user_id = ? AND hotel_id = ? AND permission_name = ?`,
      [userId, hotelId, permissionName]
    );
    return rows.length > 0;
  }

  static async addPermission(userId, hotelId, permissionName, grantedBy = null) {
    try {
      await pool.execute(
        `INSERT INTO user_permissions (user_id, hotel_id, permission_name, granted_by) 
         VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE granted_by = ?`,
        [userId, hotelId, permissionName, grantedBy, grantedBy]
      );
      return true;
    } catch (error) {
      console.error('Add permission error:', error);
      return false;
    }
  }

  static async assignBasicPlanPermissions(userId, hotelId, grantedBy = null) {
    const permissions = ['view_dashboard', 'view_rooms', 'view_bookings'];
    for (const permission of permissions) {
      await this.addPermission(userId, hotelId, permission, grantedBy);
    }
    return permissions;
  }

  static async assignDefaultPermissions(userId, hotelId, role, grantedBy = null, hotelPlan = null) {
    const normalized = String(hotelPlan || '').toLowerCase();
    if (normalized === 'free' || normalized === 'base' || normalized === 'basic') {
      return this.assignBasicPlanPermissions(userId, hotelId, grantedBy);
    }

    const defaultPermissions = {
      'admin': [
        'view_dashboard', 'view_rooms', 'manage_rooms',
        'view_bookings', 'create_booking', 'edit_booking', 'cancel_booking',
        'view_customers', 'manage_customers', 'view_reports',
        'manage_staff', 'manage_hotel_settings', 'view_financial', 'view_collections', 'view_expenses', 'view_salaries', 'manage_housekeeping'
      ],
      'staff': [
        'view_dashboard', 'view_rooms', 'view_bookings',
        'create_booking', 'view_customers'
      ],
      'reception': [
        // Receptionists typically handle bookings and customers
        'view_dashboard', 'view_rooms', 'view_bookings',
        'create_booking', 'edit_booking', 'cancel_booking',
        'view_customers', 'manage_customers',
        // Optional: give them limited income permissions
        'view_collections'
      ],
      'manager': [
        'view_dashboard', 'view_rooms', 'manage_rooms',
        'view_bookings', 'create_booking', 'edit_booking', 'cancel_booking',
        'view_customers', 'manage_customers', 'view_reports',
        'view_collections', 'view_expenses', 'view_salaries'
      ],
      'accountant': [
        'view_dashboard', 'view_bookings', 'view_customers',
        'view_reports', 'view_collections', 'view_expenses', 'view_salaries'
      ],
      'housekeeping': [
        'view_dashboard', 'view_rooms', 'view_bookings',
        'manage_housekeeping'
      ]
    };


    const permissions = defaultPermissions[role] || defaultPermissions['staff'];
    for (const permission of permissions) {
      await this.addPermission(userId, hotelId, permission, grantedBy);
    }
    return permissions;
  }

  // 7. Get users with their permissions
  static async getUsersWithPermissions(hotelId) {
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.name, u.email, u.role, u.created_at,
              GROUP_CONCAT(up.permission_name) as permissions
       FROM users u
       LEFT JOIN user_permissions up ON u.id = up.user_id AND up.hotel_id = ?
       WHERE u.hotel_id = ?
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [hotelId, hotelId]
    );

    // Parse permissions string to array
    return users.map(user => ({
      ...user,
      permissions: user.permissions ? user.permissions.split(',') : []
    }));
  }


// models/User.js - COMPLETE FIXED VERSION

// models/User.js - REPLACE your saveEmailOTP with this

// static async saveEmailOTP(email, otp, expiry) {
//   console.log("💾 [SAVE OTP] ========== STARTING ==========");
//   console.log("💾 [SAVE OTP] Email:", email);
//   console.log("💾 [SAVE OTP] OTP:", otp);
  
//   try {
//     // expiry is a Date object from JavaScript
//     const expiryDate = new Date(expiry);
    
//     console.log("💾 [SAVE OTP] Original expiry (local):", expiryDate.toString());
//     console.log("💾 [SAVE OTP] Original expiry (ISO):", expiryDate.toISOString());
//     console.log("💾 [SAVE OTP] Original expiry (timestamp):", expiryDate.getTime());
    
//     // ✅ FIXED: Get the UTC timestamp correctly
//     // The toISOString() already gives UTC, so we can use that directly
//     const utcIsoString = expiryDate.toISOString(); // Format: 2026-02-28T09:14:27.000Z
    
//     // Remove the 'T' and 'Z' and milliseconds for MySQL
//     const mysqlDateTime = utcIsoString.replace('T', ' ').replace('Z', '').split('.')[0];
    
//     console.log("💾 [SAVE OTP] UTC ISO string:", utcIsoString);
//     console.log("💾 [SAVE OTP] MySQL formatted expiry:", mysqlDateTime);
    
//     // Verify the conversion is correct
//     // 14:44 Indian time should be 09:14 UTC
//     const expectedUtcHour = expiryDate.getUTCHours();
//     console.log("💾 [SAVE OTP] UTC hour should be:", expectedUtcHour);
    
//     // Delete any existing OTP
//     await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
    
//     // Insert new OTP
//     const [result] = await pool.execute(
//       `INSERT INTO email_otps (email, otp, expiry_time) 
//        VALUES (?, ?, ?)`,
//       [email, otp, mysqlDateTime]
//     );
    
//     console.log("💾 [SAVE OTP] ✅ Saved successfully, ID:", result.insertId);
    
//     // Verify it was saved correctly
//     const [verifyRows] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ?`,
//       [email]
//     );
    
//     console.log("💾 [SAVE OTP] Verified saved data:", verifyRows[0]);
    
//     // Calculate and show time remaining
//     const savedExpiry = new Date(verifyRows[0].expiry_time);
//     const now = new Date();
//     const minutesLeft = Math.floor((savedExpiry.getTime() - now.getTime()) / (1000 * 60));
//     console.log(`💾 [SAVE OTP] ⏰ OTP valid for ${minutesLeft} minutes`);
    
//     return result.affectedRows > 0;
    
//   } catch (error) {
//     console.error("❌ [SAVE OTP] Error:", error);
//     return false;
//   }
// }

// static async saveEmailOTP(email, otp, expiry) {
//   console.log("💾 [SAVE OTP] ========== STARTING ==========");
//   console.log("💾 [SAVE OTP] Email:", email);
//   console.log("💾 [SAVE OTP] OTP:", otp);
  
//   try {
//     const expiryDate = new Date(expiry);
    
//     console.log("💾 [SAVE OTP] Original expiry (local):", expiryDate.toString());
//     console.log("💾 [SAVE OTP] Original expiry (IST hours):", expiryDate.getHours());
    
//     // ✅ FIXED: DON'T convert to UTC! Store the IST time directly
//     // MySQL will store it as is, and NOW() will return IST
    
//     // Format as YYYY-MM-DD HH:MM:SS in LOCAL time (IST)
//     const year = expiryDate.getFullYear();
//     const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
//     const day = String(expiryDate.getDate()).padStart(2, '0');
//     const hours = String(expiryDate.getHours()).padStart(2, '0');
//     const minutes = String(expiryDate.getMinutes()).padStart(2, '0');
//     const seconds = String(expiryDate.getSeconds()).padStart(2, '0');
    
//     const mysqlDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
//     console.log("💾 [SAVE OTP] MySQL formatted expiry (IST):", mysqlDateTime);
//     console.log("💾 [SAVE OTP] This should match the original hours:", hours);
    
//     // Delete any existing OTP
//     await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
    
//     // Insert new OTP
//     const [result] = await pool.execute(
//       `INSERT INTO email_otps (email, otp, expiry_time) 
//        VALUES (?, ?, ?)`,
//       [email, otp, mysqlDateTime]
//     );
    
//     console.log("💾 [SAVE OTP] ✅ Saved successfully, ID:", result.insertId);
    
//     // Verify it was saved correctly
//     const [verifyRows] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ?`,
//       [email]
//     );
    
//     console.log("💾 [SAVE OTP] Verified saved expiry:", verifyRows[0]?.expiry_time);
    
//     return result.affectedRows > 0;
    
//   } catch (error) {
//     console.error("❌ [SAVE OTP] Error:", error);
//     return false;
//   }
// }



/**
 * Save OTP — expiry is set by MySQL DATE_ADD(NOW(), …) so it works on AWS EB (UTC)
 * and local dev without Node/MySQL timezone mismatch.
 * @param {string} email - OTP key (email or reg_phone_username)
 * @param {string} otp
 * @param {Date|number} expiryOrMinutes - Date (minutes until expiry computed) or minutes directly (default 15)
 */
static async saveEmailOTP(email, otp, expiryOrMinutes = 15) {
  console.log("💾 [SAVE OTP] ========== STARTING ==========");
  console.log("💾 [SAVE OTP] Email:", email);
  console.log("💾 [SAVE OTP] OTP:", otp);

  try {
    let intervalMinutes = 15;
    if (typeof expiryOrMinutes === 'number' && !Number.isNaN(expiryOrMinutes)) {
      intervalMinutes = Math.max(1, Math.min(1440, Math.round(expiryOrMinutes)));
    } else if (expiryOrMinutes) {
      const expiryDate = new Date(expiryOrMinutes);
      intervalMinutes = Math.max(
        1,
        Math.min(1440, Math.ceil((expiryDate.getTime() - Date.now()) / (60 * 1000)))
      );
    }

    console.log(`💾 [SAVE OTP] Valid for ${intervalMinutes} minutes (MySQL DATE_ADD)`);

    await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);

    const [result] = await pool.execute(
      `INSERT INTO email_otps (email, otp, expiry_time)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [email, otp, intervalMinutes]
    );

    const [timeRows] = await pool.execute(
      `SELECT NOW() AS db_now, DATE_ADD(NOW(), INTERVAL ? MINUTE) AS db_expiry`,
      [intervalMinutes]
    );
    if (timeRows[0]) {
      console.log("💾 [SAVE OTP] DB NOW:", timeRows[0].db_now, "→ expiry:", timeRows[0].db_expiry);
    }

    console.log("💾 [SAVE OTP] ✅ Saved successfully, ID:", result.insertId);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("❌ [SAVE OTP] Error:", error);
    return false;
  }
}

static async verifyEmailOTP(email, otp) {
  console.log("🔐 [VERIFY OTP] ========== STARTING ==========");
  console.log("🔐 [VERIFY OTP] Email:", email);
  console.log("🔐 [VERIFY OTP] OTP provided:", otp);
  
  try {
    // ✅ SIMPLE: Let MySQL handle the comparison
    const [rows] = await pool.execute(
      `SELECT * FROM email_otps 
       WHERE email = ? AND otp = ? 
       AND expiry_time > NOW()`,
      [email, otp]
    );
    
    if (rows.length > 0) {
      console.log("✅ OTP is valid!");
      
      // Calculate hours remaining
      const expiryDate = new Date(rows[0].expiry_time);
      const now = new Date();
      const hoursLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesLeft = Math.floor(((expiryDate.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`⏰ OTP expires in ${hoursLeft} hours and ${minutesLeft} minutes`);
      
      return true;
    } else {
      const [debugRows] = await pool.execute(
        `SELECT otp, expiry_time, NOW() AS db_now,
                (expiry_time > NOW()) AS still_valid
         FROM email_otps WHERE email = ?`,
        [email]
      );
      if (debugRows.length > 0) {
        console.log("❌ OTP check failed — DB row:", debugRows[0]);
      } else {
        console.log("❌ OTP check failed — no row for key:", email);
      }
      await pool.execute(
        `DELETE FROM email_otps WHERE email = ? AND expiry_time <= NOW()`,
        [email]
      );
      return false;
    }
    
  } catch (error) {
    console.error("❌ [VERIFY OTP] Error:", error);
    return false;
  }
}

// static async verifyEmailOTP(email, otp) {
//   console.log("🔐 [VERIFY OTP] ========== STARTING ==========");
//   console.log("🔐 [VERIFY OTP] Email:", email);
//   console.log("🔐 [VERIFY OTP] OTP provided:", otp);
  
//   try {
//     // METHOD 1: Try with UTC_TIMESTAMP() first
//     let currentUtc;
//     try {
//       const [timeRows] = await pool.execute('SELECT UTC_TIMESTAMP() as current_time');
//       currentUtc = new Date(timeRows[0].current_time);
//       console.log("🔐 [VERIFY OTP] Using UTC_TIMESTAMP():", currentUtc.toISOString());
//     } catch (utcError) {
//       // METHOD 2: If UTC_TIMESTAMP() fails, use JavaScript Date
//       console.log("🔐 [VERIFY OTP] UTC_TIMESTAMP() failed, using JavaScript Date");
//       currentUtc = new Date();
//       console.log("🔐 [VERIFY OTP] Using JavaScript Date:", currentUtc.toISOString());
//     }
    
//     // Get all OTPs for this email
//     const [allOtps] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ? ORDER BY created_at DESC`,
//       [email]
//     );
    
//     console.log("🔐 [VERIFY OTP] All OTPs found:", allOtps.length);
    
//     if (allOtps.length === 0) {
//       console.log("❌ No OTPs found for this email");
//       return false;
//     }
    
//     // Find matching OTP
//     const matchingOtp = allOtps.find(record => record.otp === otp);
    
//     if (!matchingOtp) {
//       console.log("❌ No matching OTP found");
//       return false;
//     }
    
//     console.log("🔐 [VERIFY OTP] Matching OTP record:", {
//       id: matchingOtp.id,
//       expiry_time: matchingOtp.expiry_time,
//       created_at: matchingOtp.created_at
//     });
    
//     // Convert expiry_time to Date
//     const expiryDate = new Date(matchingOtp.expiry_time);
    
//     console.log("🔐 [VERIFY OTP] Expiry time:", expiryDate.toISOString());
//     console.log("🔐 [VERIFY OTP] Current time:", currentUtc.toISOString());
    
//     // Compare timestamps
//     const timeDiffMs = expiryDate.getTime() - currentUtc.getTime();
//     const minutesLeft = Math.floor(timeDiffMs / (1000 * 60));
    
//     console.log("🔐 [VERIFY OTP] Minutes left:", minutesLeft);
    
//     if (timeDiffMs > 0) {
//       console.log("✅ OTP is valid!");
      
//       // Calculate how many minutes left
//       if (minutesLeft < 5) {
//         console.log(`⚠️ OTP expires in ${minutesLeft} minutes`);
//       }
      
//       return true;
//     } else {
//       console.log(`❌ OTP expired ${Math.abs(minutesLeft)} minutes ago`);
      
//       // Clean up expired OTP
//       await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
//       console.log("🧹 Expired OTP deleted");
      
//       return false;
//     }
    
//   } catch (error) {
//     console.error("❌ [VERIFY OTP] Error:", error);
    
//     // FALLBACK: If everything fails, try a simple comparison
//     try {
//       console.log("🔐 [VERIFY OTP] Using fallback method...");
      
//       const [rows] = await pool.execute(
//         `SELECT * FROM email_otps 
//          WHERE email = ? AND otp = ? 
//          AND expiry_time > NOW()`,
//         [email, otp]
//       );
      
//       const isValid = rows.length > 0;
//       console.log("🔐 [VERIFY OTP] Fallback result:", isValid);
      
//       return isValid;
      
//     } catch (fallbackError) {
//       console.error("❌ [VERIFY OTP] Fallback also failed:", fallbackError);
//       return false;
//     }
//   }
// }











  // models/User.js - Replace your verifyEmailOTP methods with this SINGLE version

// static async verifyEmailOTP(email, otp) {
//   console.log("🔐 [VERIFY OTP] ========== STARTING ==========");
//   console.log("🔐 [VERIFY OTP] Email:", email);
//   console.log("🔐 [VERIFY OTP] OTP provided:", otp);
  
//   try {
//     // METHOD 1: Try with UTC_TIMESTAMP() first
//     let currentUtc;
//     try {
//       // IMPORTANT: Use 'current_time' as alias, NOT 'utc_time'
//       const [timeRows] = await pool.execute('SELECT UTC_TIMESTAMP() as current_time');
//       currentUtc = new Date(timeRows[0].current_time);
//       console.log("🔐 [VERIFY OTP] Using UTC_TIMESTAMP():", currentUtc.toISOString());
//     } catch (utcError) {
//       // METHOD 2: If UTC_TIMESTAMP() fails, use JavaScript Date
//       console.log("🔐 [VERIFY OTP] UTC_TIMESTAMP() failed, using JavaScript Date");
//       console.log("🔐 [VERIFY OTP] Error was:", utcError.message);
//       currentUtc = new Date();
//       console.log("🔐 [VERIFY OTP] Using JavaScript Date:", currentUtc.toISOString());
//     }
    
//     // Get all OTPs for this email
//     const [allOtps] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ? ORDER BY created_at DESC`,
//       [email]
//     );
    
//     console.log("🔐 [VERIFY OTP] All OTPs found:", allOtps.length);
    
//     if (allOtps.length === 0) {
//       console.log("❌ No OTPs found for this email");
//       return false;
//     }
    
//     // Find matching OTP
//     const matchingOtp = allOtps.find(record => record.otp === otp);
    
//     if (!matchingOtp) {
//       console.log("❌ No matching OTP found");
//       return false;
//     }
    
//     console.log("🔐 [VERIFY OTP] Matching OTP record:", {
//       id: matchingOtp.id,
//       expiry_time: matchingOtp.expiry_time,
//       created_at: matchingOtp.created_at
//     });
    
//     // Convert expiry_time to Date
//     const expiryDate = new Date(matchingOtp.expiry_time);
    
//     console.log("🔐 [VERIFY OTP] Expiry time:", expiryDate.toISOString());
//     console.log("🔐 [VERIFY OTP] Current time:", currentUtc.toISOString());
    
//     // Compare timestamps
//     const timeDiffMs = expiryDate.getTime() - currentUtc.getTime();
//     const minutesLeft = Math.floor(timeDiffMs / (1000 * 60));
    
//     console.log("🔐 [VERIFY OTP] Minutes left:", minutesLeft);
    
//     if (timeDiffMs > 0) {
//       console.log("✅ OTP is valid!");
      
//       if (minutesLeft < 5) {
//         console.log(`⚠️ OTP expires in ${minutesLeft} minutes`);
//       }
      
//       return true;
//     } else {
//       console.log(`❌ OTP expired ${Math.abs(minutesLeft)} minutes ago`);
      
//       // Clean up expired OTP
//       await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
//       console.log("🧹 Expired OTP deleted");
      
//       return false;
//     }
    
//   } catch (error) {
//     console.error("❌ [VERIFY OTP] Error:", error);
    
//     // FALLBACK: If everything fails, try a simple comparison
//     try {
//       console.log("🔐 [VERIFY OTP] Using fallback method...");
      
//       const [rows] = await pool.execute(
//         `SELECT * FROM email_otps 
//          WHERE email = ? AND otp = ? 
//          AND expiry_time > NOW()`,
//         [email, otp]
//       );
      
//       const isValid = rows.length > 0;
//       console.log("🔐 [VERIFY OTP] Fallback result:", isValid);
      
//       if (isValid) {
//         return true;
//       } else {
//         // Clean up expired OTP
//         await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
//         return false;
//       }
      
//     } catch (fallbackError) {
//       console.error("❌ [VERIFY OTP] Fallback also failed:", fallbackError);
//       return false;
//     }
//   }
// }

// static async verifyEmailOTP(email, otp) {
//   console.log("🔐 [VERIFY OTP] ========== STARTING ==========");
//   console.log("🔐 [VERIFY OTP] Email:", email);
//   console.log("🔐 [VERIFY OTP] OTP provided:", otp);
  
//   try {
//     // Get current time from MySQL (this returns IST)
//     const [timeRows] = await pool.execute('SELECT NOW() as now');
//     const currentIst = new Date(timeRows[0].now);
    
//     console.log("🔐 [VERIFY OTP] Current IST time from MySQL:", currentIst.toString());
//     console.log("🔐 [VERIFY OTP] Current IST hours:", currentIst.getHours());
    
//     // Get all OTPs for this email
//     const [allOtps] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ? ORDER BY created_at DESC`,
//       [email]
//     );
    
//     console.log("🔐 [VERIFY OTP] All OTPs found:", allOtps.length);
    
//     if (allOtps.length === 0) {
//       console.log("❌ No OTPs found for this email");
//       return false;
//     }
    
//     // Find matching OTP
//     const matchingOtp = allOtps.find(record => record.otp === otp);
    
//     if (!matchingOtp) {
//       console.log("❌ No matching OTP found");
//       return false;
//     }
    
//     console.log("🔐 [VERIFY OTP] Matching OTP record:", {
//       id: matchingOtp.id,
//       expiry_time: matchingOtp.expiry_time
//     });
    
//     // Convert expiry_time to Date (this will be in IST)
//     const expiryDate = new Date(matchingOtp.expiry_time);
    
//     console.log("🔐 [VERIFY OTP] Expiry time:", expiryDate.toString());
//     console.log("🔐 [VERIFY OTP] Expiry hours:", expiryDate.getHours());
//     console.log("🔐 [VERIFY OTP] Current time:", currentIst.toString());
//     console.log("🔐 [VERIFY OTP] Current hours:", currentIst.getHours());
    
//     // Compare timestamps (both are now in IST)
//     const timeDiffMs = expiryDate.getTime() - currentIst.getTime();
//     const minutesLeft = Math.floor(timeDiffMs / (1000 * 60));
    
//     console.log("🔐 [VERIFY OTP] Minutes left:", minutesLeft);
    
//     if (timeDiffMs > 0) {
//       console.log("✅ OTP is valid!");
//       return true;
//     } else {
//       console.log(`❌ OTP expired ${Math.abs(minutesLeft)} minutes ago`);
      
//       // Clean up expired OTP
//       await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
//       console.log("🧹 Expired OTP deleted");
      
//       return false;
//     }
    
//   } catch (error) {
//     console.error("❌ [VERIFY OTP] Error:", error);
    
//     // FALLBACK: Simple SQL comparison
//     try {
//       console.log("🔐 [VERIFY OTP] Using fallback method...");
      
//       const [rows] = await pool.execute(
//         `SELECT * FROM email_otps 
//          WHERE email = ? AND otp = ? 
//          AND expiry_time > NOW()`,
//         [email, otp]
//       );
      
//       const isValid = rows.length > 0;
//       console.log("🔐 [VERIFY OTP] Fallback result:", isValid);
      
//       if (!isValid) {
//         await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
//       }
      
//       return isValid;
      
//     } catch (fallbackError) {
//       console.error("❌ [VERIFY OTP] Fallback also failed:", fallbackError);
//       return false;
//     }
//   }
// }
//  static async saveEmailOTP(email, otp, expiry) {
//   console.log("💾 [SAVE OTP] Saving for email:", email);
//   console.log("💾 [SAVE OTP] OTP:", otp);
//   console.log("💾 [SAVE OTP] Expiry time to save:", expiry);
  
//   try {
//     // First delete any existing OTP for this email
//     await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
    
//     // Insert new OTP
//     const [result] = await pool.execute(
//       `INSERT INTO email_otps (email, otp, expiry_time) 
//        VALUES (?, ?, ?)`,
//       [email, otp, expiry]
//     );
    
//     console.log("💾 [SAVE OTP] Saved successfully, ID:", result.insertId);
    
//     // Verify it was saved
//     const [verifyRows] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ?`,
//       [email]
//     );
    
//     console.log("💾 [SAVE OTP] Verified data:", verifyRows[0]);
    
//     return result.affectedRows > 0;
    
//   } catch (error) {
//     console.error("❌ [SAVE OTP] Error:", error);
//     return false;
//   }
// }

//   // Verify email OTP
// static async verifyEmailOTP(email, otp) {
//   console.log("🔐 [VERIFY OTP] Checking OTP for:", email);
//   console.log("🔐 [VERIFY OTP] OTP provided:", otp);
  
//   try {
//     // First, let's see what's in the database
//     const [allOtps] = await pool.execute(
//       `SELECT * FROM email_otps WHERE email = ?`,
//       [email]
//     );
    
//     console.log("🔐 [VERIFY OTP] All OTPs for this email:", allOtps);
    
//     // Check if any OTP matches
//     const [rows] = await pool.execute(
//       `SELECT * FROM email_otps 
//        WHERE email = ? AND otp = ?`,
//       [email, otp]
//     );
    
//     console.log("🔐 [VERIFY OTP] Matching OTPs found:", rows.length);
    
//     if (rows.length === 0) {
//       console.log("❌ No matching OTP found");
//       return false;
//     }
    
//     const otpRecord = rows[0];
//     console.log("🔐 [VERIFY OTP] OTP expiry time:", otpRecord.expiry_time);
    
//     // Get current time from database (to avoid timezone issues)
//     const [timeRows] = await pool.execute('SELECT NOW() as current_db_time');
//     const dbCurrentTime = timeRows[0].current_db_time;
//     console.log("🔐 [VERIFY OTP] Database current time:", dbCurrentTime);
    
//     // Check if OTP is expired
//     const [expiryCheck] = await pool.execute(
//       `SELECT TIMESTAMPDIFF(SECOND, NOW(), ?) as seconds_left`,
//       [otpRecord.expiry_time]
//     );
    
//     const secondsLeft = expiryCheck[0].seconds_left;
//     console.log("🔐 [VERIFY OTP] Seconds left before expiry:", secondsLeft);
    
//     // If OTP has expired (negative seconds means expired)
//     if (secondsLeft < 0) {
//       console.log("❌ OTP expired", Math.abs(secondsLeft), "seconds ago");
//       // Clean up expired OTP
//       await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]);
//       return false;
//     }
    
//     console.log("✅ OTP is valid! (NOT deleting - will delete on registration)");
    
//     // IMPORTANT: DO NOT DELETE OTP HERE!
//     // It will be deleted during registration
//     // await pool.execute(`DELETE FROM email_otps WHERE email = ?`, [email]); // REMOVE THIS LINE
    
//     return true;
    
//   } catch (error) {
//     console.error("❌ [VERIFY OTP] Error:", error);
//     return false;
//   }
// }
// Update user status
  // static async updateStatus(userId, status) {
  //   const [result] = await pool.execute(
  //     `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
  //     [status, userId]
  //   );
  //   return result.affectedRows > 0;
  // }
  // Update user status - FIXED VERSION
static async updateStatus(userId, status) {
  try {
    console.log(`🔄 Updating user ${userId} status to: ${status}`);
    
    // Check if updated_at column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'updated_at'
    `);
    
    const hasUpdatedAtColumn = columns.length > 0;
    
    if (hasUpdatedAtColumn) {
      // If updated_at exists, use it
      const [result] = await pool.execute(
        `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, userId]
      );
      console.log(`✅ User status updated with updated_at column`);
      return result.affectedRows > 0;
    } else {
      // If updated_at doesn't exist, just update status
      const [result] = await pool.execute(
        `UPDATE users SET status = ? WHERE id = ?`,
        [status, userId]
      );
      console.log(`✅ User status updated without updated_at column`);
      return result.affectedRows > 0;
    }
  } catch (error) {
    console.error('❌ Update status error:', error);
    throw error;
  }
}

  // Get users with expired trial
  static async getExpiredTrialUsers() {
    const [rows] = await pool.execute(
      `SELECT u.*, h.name as hotel_name, h.plan as hotel_plan
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE h.plan = 'pro' 
       AND u.status = 'pending'
       AND u.trial_expiry_date < NOW()`
    );
    return rows;
  }
 

  // Add these methods to your existing User model

/**
 * Generate password reset token
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} - Token and user info or null if user not found
 */
static async generateResetToken(email) {
  try {
    console.log('🔐 [MODEL] Generating reset token for email:', email);
    
    // Find user by email with hotel information
    // We JOIN with hotels table to get hotel name for email personalization
    const [rows] = await pool.execute(
      `SELECT u.*, h.name as hotel_name, h.plan as hotel_plan 
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE u.email = ? AND u.role != 'super_admin'`, // Exclude super_admin from password reset
      [email]
    );

    const user = rows[0];
    
    // Security: Don't reveal if user exists
    if (!user) {
      console.log('⚠️ [MODEL] No user found with email:', email);
      return null;
    }

    console.log('✅ [MODEL] User found:', { 
      id: user.id, 
      name: user.name, 
      hotel: user.hotel_name 
    });

    // Generate JWT token valid for 1 hour
    // JWT contains user info but is signed so it can't be tampered with
    const resetToken = jwt.sign(
      {
        userId: user.id,           // User ID from database
        email: user.email,          // Email for verification
        hotel_id: user.hotel_id,    // Hotel ID for context
        purpose: 'password_reset'   // Purpose prevents token reuse for other actions
      },
      process.env.JWT_SECRET || 'your-secret-key', // Secret from environment
      { expiresIn: '1h' } // Token expires in 1 hour for security
    );

    console.log('✅ [MODEL] Reset token generated, expires in 1 hour');

    return {
      token: resetToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hotelName: user.hotel_name,
        hotelPlan: user.hotel_plan
      }
    };
  } catch (error) {
    console.error('❌ [MODEL] Generate reset token error:', error);
    throw error;
  }
}

/**
 * Reset password using token
 * @param {string} token - JWT reset token
 * @param {string} newPassword - New password (plain text)
 * @returns {Promise<boolean>} - Success status
 */
static async resetPassword(token, newPassword) {
  try {
    console.log('🔐 [MODEL] Attempting password reset with token');

    // Verify the JWT token
    // This automatically checks:
    // - Token signature (tampering)
    // - Token expiration (1 hour)
    // - Token format
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('✅ [MODEL] Token verified, decoded:', { 
      userId: decoded.userId, 
      email: decoded.email,
      purpose: decoded.purpose 
    });

    // Verify this is actually a password reset token
    // This prevents using login tokens or other JWT types for password reset
    if (decoded.purpose !== 'password_reset') {
      throw new Error('Invalid token purpose');
    }

    // Hash the new password using bcrypt
    // bcrypt automatically generates a salt and hashes the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    // We verify both userId AND email to ensure the token matches the user
    const [result] = await pool.execute(
      `UPDATE users SET password = ? WHERE id = ? AND email = ?`,
      [hashedPassword, decoded.userId, decoded.email]
    );

    if (result.affectedRows === 0) {
      console.error('❌ [MODEL] User not found during password update');
      throw new Error('User not found');
    }

    console.log('✅ [MODEL] Password updated successfully for user:', decoded.userId);
    return true;

  } catch (error) {
    // Handle specific JWT errors with user-friendly messages
    if (error.name === 'TokenExpiredError') {
      console.error('❌ [MODEL] Reset token expired');
      throw new Error('Reset link has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      console.error('❌ [MODEL] Invalid reset token');
      throw new Error('Invalid reset link');
    }
    console.error('❌ [MODEL] Reset password error:', error);
    throw error;
  }
}

/**
 * Find user by email (for validation before sending reset link)
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} - User object or null
 */
// models/User.js - Update findByEmail to return ALL users with that email
static async findAllByEmail(email) {
  try {
    console.log('🔍 [MODEL] Finding all users by email:', email);
    
    const [rows] = await pool.execute(
      `SELECT u.*, h.name as hotel_name, h.id as hotel_id 
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE u.email = ? AND u.role != 'super_admin'
       ORDER BY u.created_at DESC`,
      [email]
    );
    
    return rows; // Return ALL users with this email
  } catch (error) {
    console.error('❌ [MODEL] Find all by email error:', error);
    throw error;
  }
}

// Generate reset token with hotel_id
static async generateResetTokenForHotel(email, hotelId) {
  try {
    console.log('🔐 [MODEL] Generating reset token for email:', email, 'hotel:', hotelId);
    
    // Find specific user by email AND hotel_id
    const [rows] = await pool.execute(
      `SELECT u.*, h.name as hotel_name, h.plan as hotel_plan 
       FROM users u
       JOIN hotels h ON u.hotel_id = h.id
       WHERE u.email = ? AND u.hotel_id = ? AND u.role != 'super_admin'`,
      [email, hotelId]
    );

    const user = rows[0];
    
    if (!user) {
      console.log('⚠️ [MODEL] No user found with email:', email, 'and hotel:', hotelId);
      return null;
    }

    // Generate JWT token with both userId and hotelId
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        hotel_id: user.hotel_id,  // Include hotel_id in token
        purpose: 'password_reset'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    return {
      token: resetToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hotelName: user.hotel_name,
        hotelId: user.hotel_id,
        hotelPlan: user.hotel_plan
      }
    };
  } catch (error) {
    console.error('❌ [MODEL] Generate reset token error:', error);
    throw error;
  }
}
}

module.exports = User;