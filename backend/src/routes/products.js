const express = require('express');
const { productController } = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');
const { validateProduct } = require('../middleware/validation/validationMiddleware');

const router = express.Router();

// Public routes
// GET /products - Get all products with pagination and filtering
router.get('/', productController.getAllProducts);

// GET /products/search - Search products
router.get('/search', productController.searchProducts);

// GET /products/featured - Get featured products
router.get('/featured', productController.getFeaturedProducts);

// GET /products/bestsellers - Get bestseller products
router.get('/bestsellers', productController.getBestsellerProducts);

// GET /products/category/:categorySlug - Get products by category
router.get('/category/:categorySlug', productController.getProductsByCategory);

// GET /products/subcategory/:subcategorySlug - Get products by subcategory
router.get('/subcategory/:subcategorySlug', productController.getProductsBySubcategory);

// GET /products/:slug - Get product by slug
router.get('/:slug', productController.getProductBySlug);

// GET /products/:id/reviews - Get product reviews
router.get('/:id/reviews', productController.getProductReviews);

// Protected routes (require authentication)
router.use(authMiddleware);

// POST /products/:id/reviews - Add product review
router.post('/:id/reviews', productController.addProductReview);

// PUT /products/:id/reviews/:reviewId - Update product review
router.put('/:id/reviews/:reviewId', productController.updateProductReview);

// DELETE /products/:id/reviews/:reviewId - Delete product review
router.delete('/:id/reviews/:reviewId', productController.deleteProductReview);

// POST /products/:id/wishlist - Add to wishlist
router.post('/:id/wishlist', productController.addToWishlist);

// DELETE /products/:id/wishlist - Remove from wishlist
router.delete('/:id/wishlist', productController.removeFromWishlist);

// Admin routes (require admin role)
router.use(adminMiddleware);

// POST /products - Create new product
router.post('/', validateProduct, productController.createProduct);

// PUT /products/:id - Update product
router.put('/:id', validateProduct, productController.updateProduct);

// DELETE /products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

// POST /products/:id/images - Upload product images (Admin only)
router.post('/:id/images', productController.uploadProductImages);

// DELETE /products/:id/images/:imageId - Delete product image (Admin only)
router.delete('/:id/images/:imageId', productController.deleteProductImage);

// PUT /products/:id/stock - Update product stock
router.put('/:id/stock', productController.updateProductStock);

// GET /products/:id/stock-logs - Get product stock logs
router.get('/:id/stock-logs', productController.getProductStockLogs);

// POST /products/bulk-import - Bulk import products
router.post('/bulk-import', productController.bulkImportProducts);

// POST /products/bulk-export - Bulk export products
router.post('/bulk-export', productController.bulkExportProducts);

// PUT /products/:id/feature - Toggle product featured status
router.put('/:id/feature', productController.toggleFeatured);

// PUT /products/:id/bestseller - Toggle product bestseller status
router.put('/:id/bestseller', productController.toggleBestseller);

module.exports = router; 