const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth/authMiddleware');

// All payment routes require authentication
router.use(authMiddleware);

// Get user's payment methods
router.get('/methods', paymentController.getUserPaymentMethods);

// Create new payment method
router.post('/methods', paymentController.createPaymentMethod);

// Update payment method
router.put('/methods/:id', paymentController.updatePaymentMethod);

// Delete payment method
router.delete('/methods/:id', paymentController.deletePaymentMethod);

module.exports = router; 