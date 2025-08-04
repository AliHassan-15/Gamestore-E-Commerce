const express = require('express');
const router = express.Router();
const { cartController } = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth/authMiddleware');
const { validateCartItem } = require('../middleware/validation/validationMiddleware');

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get('/', cartController.getUserCart);

// Add item to cart
router.post('/items', validateCartItem, cartController.addToCart);

// Update cart item quantity
router.put('/items/:id', validateCartItem, cartController.updateCartItem);

// Remove item from cart
router.delete('/items/:id', cartController.removeFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

// Get cart summary (for checkout)
router.get('/summary', cartController.getCartSummary);

// Apply coupon code
router.post('/coupon', cartController.applyCoupon);

module.exports = router; 