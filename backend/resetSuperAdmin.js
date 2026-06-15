const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetSuperAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_management'
  });

  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('New hash generated:', hashedPassword);
    
    // Update the super admin
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE username = ? AND role = ?',
      [hashedPassword, 'superadmin', 'super_admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Super admin password updated successfully');
      console.log('Username: superadmin');
      console.log('Password: admin123');
      
      // Verify the new password works
      const isValid = await bcrypt.compare(password, hashedPassword);
      console.log('Password verification test:', isValid ? '✅ PASSED' : '❌ FAILED');
    } else {
      console.log('❌ Super admin not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

resetSuperAdmin();