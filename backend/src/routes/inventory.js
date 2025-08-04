const express = require('express');
const router = express.Router();
const { inventoryController } = require('../controllers/inventoryController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');
const { validateInventory } = require('../middleware/validation/validationMiddleware');

// All inventory routes require admin authentication
router.use(authMiddleware, adminMiddleware);

// Get product inventory history
router.get('/product/:product_id/history', inventoryController.getProductInventoryHistory);

// Get recent inventory transactions
router.get('/transactions', inventoryController.getRecentTransactions);

// Add stock manually
router.post('/add-stock', validateInventory, inventoryController.addStock);

// Adjust stock manually
router.post('/adjust-stock', validateInventory, inventoryController.adjustStock);

// Get inventory statistics
router.get('/stats', inventoryController.getInventoryStats);

// Get low stock alerts
router.get('/low-stock', inventoryController.getLowStockAlerts);

module.exports = router; 