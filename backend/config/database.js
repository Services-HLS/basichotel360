// // const mysql = require('mysql2/promise');
// // require('dotenv').config();

// // const dbConfig = {
// //   host: process.env.DB_HOST || 'localhost',
// //   user: process.env.DB_USER || 'root',
// //   password: process.env.DB_PASSWORD || '',
// //   database: process.env.DB_NAME || 'hotel_management',
// //   waitForConnections: true,
// //   connectionLimit: 10,
// //   queueLimit: 0
// // };

// // const pool = mysql.createPool(dbConfig);

// // // Test database connection
// // const testConnection = async () => {
// //   try {
// //     const connection = await pool.getConnection();
// //     console.log('✅ Database connected successfully');
// //     connection.release();
// //   } catch (error) {
// //     console.error('❌ Database connection failed:', error.message);
// //     process.exit(1);
// //   }
// // };

// // module.exports = { pool, testConnection };

// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'hotel_management',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   // Force connection to use UTC
//   timezone: '+00:00',
//   dateStrings: false
// };

// const pool = mysql.createPool(dbConfig);

// // Test database connection and set timezone
// const testConnection = async () => {
//   try {
//     const connection = await pool.getConnection();
//     console.log('✅ Database connected successfully');
    
//     try {
//       // Set session timezone to UTC
//       await connection.execute("SET time_zone = '+00:00'");
//       console.log('✅ Timezone set to UTC');
      
//       // Simple query to verify - WITHOUT aliases that might cause issues
//       const [rows] = await connection.execute('SELECT @@session.time_zone as tz');
//       console.log('🕒 Database timezone:', rows[0].tz);
      
//     } catch (tzError) {
//       console.log('⚠️ Could not set timezone:', tzError.message);
//       // Continue anyway - not critical
//     }
    
//     connection.release();
//     return true;
    
//   } catch (error) {
//     console.error('❌ Database connection failed:', error.message);
//     console.error('Please check your database configuration:');
//     console.error('   Host:', process.env.DB_HOST || 'localhost');
//     console.error('   User:', process.env.DB_USER || 'root');
//     console.error('   Database:', process.env.DB_NAME || 'hotel_management');
//     process.exit(1);
//   }
// };

// // Middleware to set timezone for each request
// const setTimezoneMiddleware = async (req, res, next) => {
//   try {
//     // Don't await this - let it run in background
//     pool.execute("SET time_zone = '+00:00'").catch(err => {
//       // Silently fail - not critical
//     });
//     next();
//   } catch (error) {
//     // Just continue if timezone setting fails
//     next();
//   }
// };

// module.exports = { pool, testConnection, setTimezoneMiddleware };

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  // 👈 IMPORTANT: No timezone setting here
};

const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Simple middleware that does nothing
const setTimezoneMiddleware = async (req, res, next) => {
  next();
};

module.exports = { pool, testConnection, setTimezoneMiddleware };