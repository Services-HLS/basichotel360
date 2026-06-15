const jwt = require('jsonwebtoken');

const authenticateSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is super_admin (either by role or hotel_id = 0)
    if (decoded.role !== 'super_admin' && decoded.hotel_id !== 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    req.superAdmin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateSuperAdmin };