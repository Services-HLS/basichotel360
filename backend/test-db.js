const { pool } = require('./config/database');

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Got connection from pool');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM salaries');
    console.log('✅ Query executed:', rows);
    
    connection.release();
    console.log('✅ Connection released');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testConnection();