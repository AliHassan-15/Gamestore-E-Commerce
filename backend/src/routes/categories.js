const express = require('express');
const router = express.Router();
const { categoryController } = require('../controllers/categoryController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');
const { validateCategory } = require('../middleware/validation/validationMiddleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Subcategory routes
router.get('/subcategories', categoryController.getAllSubcategories);
router.get('/subcategories/:id', categoryController.getSubcategoryById);
router.get('/subcategories/slug/:slug', categoryController.getSubcategoryBySlug);

// Admin routes
router.use(authMiddleware, adminMiddleware);

router.post('/', validateCategory, categoryController.createCategory);
router.put('/:id', validateCategory, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Subcategory routes
router.post('/subcategories', validateCategory, categoryController.createSubcategory);
router.put('/subcategories/:id', validateCategory, categoryController.updateSubcategory);
router.delete('/subcategories/:id', categoryController.deleteSubcategory);

// Import/Export routes
router.post('/import', (req, res) => {
  res.json({ message: 'Import categories from Excel - to be implemented' });
});

router.get('/export', (req, res) => {
  res.json({ message: 'Export categories to Excel - to be implemented' });
});

module.exports = router; 