const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { logger } = require('../../utils/logger');
const sessionManager = require('../../utils/sessionManager');

// Verify JWT token middleware
const authMiddleware = async (req, res, next) => {
  try {
    let user = null;
    let authMethod = '';

    // First, try to get user from session cookie
    const sessionId = req.cookies.sessionId;
    if (sessionId && sessionManager.hasSession(sessionId)) {
      const session = sessionManager.getSession(sessionId);
      console.log(`🔍 Session found: ${session.email} (${session.role})`);
      
      user = await User.findByPk(session.userId, {
        attributes: { exclude: ['password'] }
      });
      authMethod = 'session';
    }

    // If no session, try JWT token
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log(`🔍 Verifying JWT token: ${token.substring(0, 20)}...`);

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log(`✅ JWT token decoded, userId: ${decoded.userId}`);
        
        user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ['password'] }
        });
        authMethod = 'jwt';
      }
    }

    if (!user) {
      console.log('❌ No valid authentication found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid authentication found.'
      });
    }

    console.log(`✅ User authenticated via ${authMethod}: ${user.email} (${user.role})`);

    if (!user.is_active) {
      console.log(`❌ User account deactivated: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    req.authMethod = authMethod;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Admin role middleware
const adminMiddleware = (req, res, next) => {
  console.log(`🔒 Admin check for user: ${req.user?.email} (${req.user?.role})`);
  
  if (!req.user) {
    console.log('❌ No user in request for admin check');
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    console.log(`❌ Access denied: User ${req.user.email} is not admin (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  console.log(`✅ Admin access granted for: ${req.user.email}`);
  next();
};

// Optional auth middleware (for public routes that can show different content for logged users)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let user = null;

    // Try session first
    const sessionId = req.cookies.sessionId;
    if (sessionId && sessionManager.hasSession(sessionId)) {
      const session = sessionManager.getSession(sessionId);
      user = await User.findByPk(session.userId, {
        attributes: { exclude: ['password'] }
      });
    }

    // Try JWT if no session
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ['password'] }
        });
      }
    }

    if (user && user.is_active) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Continue without user if authentication fails
    next();
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
  generateToken
}; 