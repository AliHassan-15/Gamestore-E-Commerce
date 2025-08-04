const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth/authMiddleware');
const { validateRegistration, validateLogin } = require('../middleware/validation/validationMiddleware');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// Google OAuth routes
router.get('/google', (req, res) => {
  // This will be implemented when we set up Passport Google OAuth
  res.json({ message: 'Google OAuth login - to be implemented' });
});

router.get('/google/callback', authController.googleAuthCallback);
router.get('/google/success', authController.googleAuthSuccess);
router.get('/google/failure', authController.googleAuthFailure);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.post('/resend-verification', authController.resendVerification);
router.put('/change-password', authController.changePassword);
router.put('/profile', authController.updateProfile);

module.exports = router; 