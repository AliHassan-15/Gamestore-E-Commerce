const { User, UserProfile, Address, PaymentMethod } = require('../models');
const { generateToken } = require('../middleware/auth/authMiddleware');
const { logger } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { email, password, first_name, last_name, role = 'buyer' } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
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

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
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

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked. Please try again later.'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
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

      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
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
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message
      logger.info(`User logged out: ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
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
      const user = await User.findByPk(req.user.id, {
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Address, as: 'addresses' },
          { model: PaymentMethod, as: 'paymentMethods' }
        ],
        attributes: { exclude: ['password'] }
      });

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user data',
        error: error.message
      });
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user'
        });
      }

      const token = generateToken(user.id);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      const resetToken = uuidv4();
      user.password_reset_token = resetToken;
      user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // In a real application, send email with reset link
      logger.info(`Password reset requested for: ${email}`);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: error.message
      });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        where: {
          password_reset_token: token,
          password_reset_expires: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password
      user.password = newPassword;
      user.password_reset_token = null;
      user.password_reset_expires = null;
      await user.save();

      logger.info(`Password reset successful for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: error.message
      });
    }
  },

  // Verify email
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        where: { email_verification_token: token }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }

      user.email_verified = true;
      user.email_verification_token = null;
      await user.save();

      logger.info(`Email verified for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  },

  // Resend verification email
  resendVerification: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);

      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate new verification token
      user.email_verification_token = uuidv4();
      await user.save();

      // In a real application, send verification email
      logger.info(`Verification email resent for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend verification email',
        error: error.message
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password change failed',
        error: error.message
      });
    }
  },

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const { first_name, last_name, phone, date_of_birth, bio } = req.body;

      const user = await User.findByPk(req.user.id);
      
      // Update user fields
      if (first_name) user.first_name = first_name;
      if (last_name) user.last_name = last_name;
      await user.save();

      // Update or create profile
      const [profile] = await UserProfile.findOrCreate({
        where: { user_id: user.id },
        defaults: { user_id: user.id }
      });

      if (phone) profile.phone = phone;
      if (date_of_birth) profile.date_of_birth = date_of_birth;
      if (bio) profile.bio = bio;
      await profile.save();

      logger.info(`Profile updated for: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile update failed',
        error: error.message
      });
    }
  },

  // Google OAuth callback
  googleAuthCallback: async (req, res) => {
    try {
      // This will be implemented when we set up Passport Google OAuth
      res.status(200).json({
        success: true,
        message: 'Google authentication successful'
      });
    } catch (error) {
      logger.error('Google auth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Google authentication failed',
        error: error.message
      });
    }
  },

  // Google OAuth success
  googleAuthSuccess: async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Google authentication successful'
    });
  },

  // Google OAuth failure
  googleAuthFailure: async (req, res) => {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

module.exports = { authController }; 