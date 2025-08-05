const { User, UserProfile, Address, PaymentMethod } = require('../models');
const { generateToken } = require('../middleware/auth/authMiddleware');
const { logger } = require('../utils/logger');
const sessionManager = require('../utils/sessionManager');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { email, password, first_name, last_name, role = 'buyer' } = req.body;

      console.log(`📝 Registration attempt for: ${email}`);

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log(`❌ User already exists: ${email}`);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user
      const user = await User.create({
        email,
        password,
        first_name,
        last_name,
        role,
        email_verification_token: uuidv4()
      });

      // Create user profile
      await UserProfile.create({
        user_id: user.id
      });

      // Generate JWT token
      const token = generateToken(user.id);

      // Create session
      const newSessionId = uuidv4();
      sessionManager.addSession(newSessionId, {
        userId: user.id,
        email: user.email,
        role: user.role,
        token: token,
        createdAt: new Date()
      });

      // Set HTTP-only cookie
      res.cookie('sessionId', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Remove password from response
      const userResponse = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at
      };

      console.log(`✅ User registered successfully: ${user.email} (${user.role})`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token,
          sessionId: newSessionId
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log(`🔐 Login attempt for: ${email}`);

      // Check if user is already logged in via session
      const sessionId = req.cookies.sessionId;
      if (sessionId && sessionManager.hasSession(sessionId)) {
        const existingSession = sessionManager.getSession(sessionId);
        console.log(`⚠️ User already logged in: ${existingSession.email}`);
        
        return res.status(400).json({
          success: false,
          message: `User ${existingSession.email} is already logged in. Please logout first.`
        });
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log(`✅ User found: ${user.email}, Role: ${user.role}, ID: ${user.id}`);

      // Check if account is active
      if (!user.is_active) {
        console.log(`❌ Account deactivated: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        console.log(`❌ Account locked: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked. Please try again later.'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        console.log(`❌ Invalid password for: ${email}`);
        await user.incrementLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate JWT token
      const token = generateToken(user.id);
      console.log(`🎫 Token generated for user ID: ${user.id}, Role: ${user.role}`);

      // Create new session
      const newSessionId = uuidv4();
      sessionManager.addSession(newSessionId, {
        userId: user.id,
        email: user.email,
        role: user.role,
        token: token,
        createdAt: new Date()
      });

      // Set HTTP-only cookie
      res.cookie('sessionId', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Remove password from response
      const userResponse = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
        email_verified: user.email_verified,
        last_login: user.last_login
      };

      console.log(`✅ Login successful for: ${user.email} (${user.role})`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          sessionId: newSessionId
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  },

  // User logout
  logout: async (req, res) => {
    try {
      console.log(`🚪 Logout attempt for user: ${req.user?.email} (${req.user?.role})`);
      
      // Get session ID from cookie
      const sessionId = req.cookies.sessionId;
      
      if (sessionId && sessionManager.hasSession(sessionId)) {
        // Remove session
        sessionManager.removeSession(sessionId);
        console.log(`🔒 Session removed for: ${req.user?.email}`);
      }

      // Clear the cookie
      res.clearCookie('sessionId');

      console.log(`✅ User logged out successfully: ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      console.log(`👤 Getting current user for ID: ${req.user.id}, Email: ${req.user.email}, Role: ${req.user.role}`);
      
      const user = await User.findByPk(req.user.id, {
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Address, as: 'addresses' },
          { model: PaymentMethod, as: 'paymentMethods' }
        ],
        attributes: { exclude: ['password'] }
      });

      console.log(`✅ Current user retrieved: ${user.email} (${user.role})`);

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('❌ Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user data',
        error: error.message
      });
    }
  },

  // Get active sessions (admin only)
  getActiveSessions: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const sessions = sessionManager.getAllSessions();

      res.status(200).json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      console.error('❌ Get active sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active sessions',
        error: error.message
      });
    }
  },

  // Force logout user (admin only)
  forceLogout: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { sessionId } = req.body;
      
      if (sessionManager.hasSession(sessionId)) {
        const session = sessionManager.getSession(sessionId);
        sessionManager.removeSession(sessionId);
        
        console.log(`🔒 Admin forced logout for: ${session.email}`);
        
        res.status(200).json({
          success: true,
          message: `User ${session.email} has been logged out`
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
    } catch (error) {
      console.error('❌ Force logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to force logout',
        error: error.message
      });
    }
  }
};

module.exports = authController;