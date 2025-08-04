const express = require('express');
const router = express.Router();
const { reviewController } = require('../controllers/reviewController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth/authMiddleware');
const { validateReview } = require('../middleware/validation/validationMiddleware');

// Public routes
router.get('/product/:product_id', reviewController.getProductReviews);
router.get('/product/:product_id/stats', reviewController.getReviewStats);

// Authenticated user routes
router.use(authMiddleware);

// Add review
router.post('/product/:product_id', validateReview, reviewController.createReview);

// Update review
router.put('/:review_id', validateReview, reviewController.updateReview);

// Delete review
router.delete('/:review_id', reviewController.deleteReview);

// Like/Unlike review
router.post('/:review_id/like', reviewController.toggleReviewLike);

// Admin routes
router.use(adminMiddleware);

// Get all reviews (admin)
router.get('/admin', reviewController.getAllReviews);

// Approve/Reject review
router.put('/admin/:review_id/moderate', reviewController.moderateReview);

module.exports = router; 