const express = require('express');
const router = express.Router();
const { orderController } = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');
const { validateOrder } = require('../middleware/validation/validationMiddleware');

// All order routes require authentication
router.use(authMiddleware);

// User routes
router.post('/', validateOrder, orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/cancel', orderController.cancelOrder);

// Admin routes
router.use(adminMiddleware);

router.get('/admin/all', orderController.getAllOrders);
router.get('/admin/:id', orderController.getOrderDetails);
router.put('/admin/:id/status', orderController.updateOrderStatus);
router.put('/admin/:id/refund', orderController.processRefund);
router.get('/admin/stats', orderController.getOrderStats);
router.get('/admin/export', orderController.exportOrders);

module.exports = router; 