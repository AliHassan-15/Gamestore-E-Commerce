const { Review, Product, User, UserProfile } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

const reviewController = {
  // Get reviews for a product
  getProductReviews: async (req, res) => {
    try {
      const { product_id: productId } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;

      const offset = (page - 1) * limit;

      // Validate product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Build sort options
      let order = [['created_at', 'DESC']];
      if (sort === 'oldest') {
        order = [['created_at', 'ASC']];
      } else if (sort === 'rating_high') {
        order = [['rating', 'DESC'], ['created_at', 'DESC']];
      } else if (sort === 'rating_low') {
        order = [['rating', 'ASC'], ['created_at', 'DESC']];
      }

      const reviews = await Review.findAndCountAll({
        where: { 
          product_id: productId,
          is_approved: true,
          is_active: true
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['avatar_url']
              }
            ]
          }
        ],
        order,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate average rating
      const avgRating = await Review.findOne({
        where: { 
          product_id: productId,
          is_approved: true,
          is_active: true
        },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'average_rating'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total_reviews']
        ]
      });

      const totalPages = Math.ceil(reviews.count / limit);

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_reviews: reviews.count,
            limit: parseInt(limit)
          },
          summary: {
            average_rating: parseFloat(avgRating?.dataValues?.average_rating || 0).toFixed(1),
            total_reviews: parseInt(avgRating?.dataValues?.total_reviews || 0)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting product reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product reviews'
      });
    }
  },

  // Get user's reviews
  getUserReviews: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const reviews = await Review.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'images']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(reviews.count / limit);

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_reviews: reviews.count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting user reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user reviews'
      });
    }
  },

  // Create review
  createReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const { product_id, rating, title, comment } = req.body;

      // Validate product exists
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({
        where: { user_id: userId, product_id }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // Verify user has purchased and received the product
      const { Order, OrderItem } = require('../../models');
      const userOrder = await Order.findOne({
        where: {
          user_id: userId,
          status: 'delivered'
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
            where: { product_id }
          }
        ]
      });

      if (!userOrder) {
        return res.status(403).json({
          success: false,
          message: 'You can only review products you have purchased and received'
        });
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const review = await Review.create({
        user_id: userId,
        product_id,
        rating,
        title,
        comment,
        order_id: userOrder.id, // Link to the order
        is_approved: true, // Auto-approve for now
        is_active: true
      });

      // Get the created review with user info
      const createdReview = await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['avatar_url']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: createdReview
      });
    } catch (error) {
      logger.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create review'
      });
    }
  },

  // Update review
  updateReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const { review_id } = req.params;
      const { rating, title, comment } = req.body;

      const review = await Review.findOne({
        where: { id: review_id, user_id: userId }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Validate rating
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      await review.update({
        rating: rating || review.rating,
        title: title || review.title,
        comment: comment || review.comment,
        updated_at: new Date()
      });

      // Get updated review with user info
      const updatedReview = await Review.findByPk(review_id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['avatar_url']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });
    } catch (error) {
      logger.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review'
      });
    }
  },

  // Delete review
  deleteReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const { review_id } = req.params;

      const review = await Review.findOne({
        where: { id: review_id, user_id: userId }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.destroy();

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review'
      });
    }
  },

  // Like/Unlike review
  toggleReviewLike: async (req, res) => {
    try {
      const userId = req.user.id;
      const { review_id } = req.params;

      const review = await Review.findByPk(review_id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // This is a placeholder - implement actual like functionality
      // You would need a ReviewLike model to track likes
      
      res.json({
        success: true,
        message: 'Review like toggled successfully',
        data: {
          review_id,
          liked: true // Placeholder
        }
      });
    } catch (error) {
      logger.error('Error toggling review like:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle review like'
      });
    }
  },

  // Admin: Get all reviews (for moderation)
  getAllReviews: async (req, res) => {
    try {
      const { page = 1, limit = 20, status = 'all', product_id } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (status === 'pending') {
        whereClause.is_approved = false;
      } else if (status === 'approved') {
        whereClause.is_approved = true;
      }

      if (product_id) {
        whereClause.product_id = product_id;
      }

      const reviews = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(reviews.count / limit);

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_reviews: reviews.count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting all reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reviews'
      });
    }
  },

  // Admin: Approve/Reject review
  moderateReview: async (req, res) => {
    try {
      const { review_id } = req.params;
      const { action, reason } = req.body; // action: 'approve' or 'reject'

      const review = await Review.findByPk(review_id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      if (action === 'approve') {
        await review.update({
          is_approved: true,
          moderation_notes: reason || 'Approved by admin'
        });
      } else if (action === 'reject') {
        await review.update({
          is_approved: false,
          is_active: false,
          moderation_notes: reason || 'Rejected by admin'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "approve" or "reject"'
        });
      }

      res.json({
        success: true,
        message: `Review ${action}d successfully`,
        data: review
      });
    } catch (error) {
      logger.error('Error moderating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to moderate review'
      });
    }
  },

  // Get review statistics
  getReviewStats: async (req, res) => {
    try {
      const { product_id } = req.params;

      const stats = await Review.findOne({
        where: { 
          product_id,
          is_approved: true,
          is_active: true
        },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'average_rating'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total_reviews'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 5 THEN 1 END')), 'five_star'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 4 THEN 1 END')), 'four_star'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 3 THEN 1 END')), 'three_star'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 2 THEN 1 END')), 'two_star'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 1 THEN 1 END')), 'one_star']
        ]
      });

      const data = stats?.dataValues || {};
      const totalReviews = parseInt(data.total_reviews || 0);

      const ratingDistribution = {
        five_star: {
          count: parseInt(data.five_star || 0),
          percentage: totalReviews > 0 ? Math.round((parseInt(data.five_star || 0) / totalReviews) * 100) : 0
        },
        four_star: {
          count: parseInt(data.four_star || 0),
          percentage: totalReviews > 0 ? Math.round((parseInt(data.four_star || 0) / totalReviews) * 100) : 0
        },
        three_star: {
          count: parseInt(data.three_star || 0),
          percentage: totalReviews > 0 ? Math.round((parseInt(data.three_star || 0) / totalReviews) * 100) : 0
        },
        two_star: {
          count: parseInt(data.two_star || 0),
          percentage: totalReviews > 0 ? Math.round((parseInt(data.two_star || 0) / totalReviews) * 100) : 0
        },
        one_star: {
          count: parseInt(data.one_star || 0),
          percentage: totalReviews > 0 ? Math.round((parseInt(data.one_star || 0) / totalReviews) * 100) : 0
        }
      };

      res.json({
        success: true,
        data: {
          average_rating: parseFloat(data.average_rating || 0).toFixed(1),
          total_reviews,
          rating_distribution: ratingDistribution
        }
      });
    } catch (error) {
      logger.error('Error getting review stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get review statistics'
      });
    }
  }
};

module.exports = { reviewController }; 