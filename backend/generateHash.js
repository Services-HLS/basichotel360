const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Also verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid ? '✅ Works' : '❌ Failed');
}

generateHash();