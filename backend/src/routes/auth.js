const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');
const { validateRegistration, validateLogin } = require('../middleware/validation/validationMiddleware');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);

// Admin only routes
router.get('/sessions', adminMiddleware, authController.getActiveSessions);
router.post('/force-logout', adminMiddleware, authController.forceLogout);

module.exports = router; 