const { Product, Category, Subcategory, Review, ProductImage, StockLog, WishlistItem } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

const productController = {
  // Get all products with pagination and filtering
  getAllProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        category_id,
        subcategory_id,
        min_price,
        max_price,
        sort_by = 'created_at',
        sort_order = 'DESC',
        search,
        is_featured,
        is_bestseller
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { is_active: true };

      // Apply filters
      if (category_id) where.category_id = category_id;
      if (subcategory_id) where.subcategory_id = subcategory_id;
      if (is_featured) where.is_featured = is_featured === 'true';
      if (is_bestseller) where.is_bestseller = is_bestseller === 'true';

      // Price range filter
      if (min_price || max_price) {
        where.price = {};
        if (min_price) where.price[Op.gte] = parseFloat(min_price);
        if (max_price) where.price[Op.lte] = parseFloat(max_price);
      }

      // Search filter
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { tags: { [Op.overlap]: [search] } }
        ];
      }

      // Validate sort parameters
      const allowedSortFields = ['name', 'price', 'created_at', 'rating_average', 'stock_quantity'];
      const allowedSortOrders = ['ASC', 'DESC'];
      
      const finalSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
      const finalSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
          { model: Subcategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
          { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
        ],
        order: [[finalSortBy, finalSortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  },

  // Search products
  searchProducts: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const products = await Product.search(q, { limit: parseInt(limit) });

      res.status(200).json({
        success: true,
        data: { products }
      });
    } catch (error) {
      logger.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error.message
      });
    }
  },

  // Get featured products
  getFeaturedProducts: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const products = await Product.getFeatured(parseInt(limit));

      res.status(200).json({
        success: true,
        data: { products }
      });
    } catch (error) {
      logger.error('Get featured products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured products',
        error: error.message
      });
    }
  },

  // Get bestseller products
  getBestsellerProducts: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const products = await Product.getBestsellers(parseInt(limit));

      res.status(200).json({
        success: true,
        data: { products }
      });
    } catch (error) {
      logger.error('Get bestseller products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bestseller products',
        error: error.message
      });
    }
  },

  // Get products by category
  getProductsByCategory: async (req, res) => {
    try {
      const { categorySlug } = req.params;
      const { page = 1, limit = 12 } = req.query;

      const category = await Category.findBySlug(categorySlug);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows: products } = await Product.findAndCountAll({
        where: { category_id: category.id, is_active: true },
        include: [
          { model: Subcategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
          { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          category,
          products,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get products by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category products',
        error: error.message
      });
    }
  },

  // Get products by subcategory
  getProductsBySubcategory: async (req, res) => {
    try {
      const { subcategorySlug } = req.params;
      const { page = 1, limit = 12 } = req.query;

      const subcategory = await Subcategory.findBySlug(subcategorySlug);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows: products } = await Product.findAndCountAll({
        where: { subcategory_id: subcategory.id, is_active: true },
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
          { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          subcategory,
          products,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get products by subcategory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subcategory products',
        error: error.message
      });
    }
  },

  // Get product by slug
  getProductBySlug: async (req, res) => {
    try {
      const { slug } = req.params;

      const product = await Product.findBySlug(slug);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Increment view count (you might want to track this)
      await product.increment('view_count', { by: 1 });

      res.status(200).json({
        success: true,
        data: { product }
      });
    } catch (error) {
      logger.error('Get product by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  },

  // Get product reviews
  getProductReviews: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { product_id: id, is_approved: true },
        include: [
          { model: require('../models/User'), as: 'user', attributes: ['id', 'first_name', 'last_name'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          reviews,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get product reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product reviews',
        error: error.message
      });
    }
  },

  // Add product review
  addProductReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, title, comment } = req.body;
      const userId = req.user.id;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        where: { user_id: userId, product_id: id }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // Create review
      const review = await Review.create({
        user_id: userId,
        product_id: id,
        rating,
        title,
        comment,
        is_verified_purchase: true // You might want to check if user purchased this product
      });

      // Update product rating
      await product.updateRating();

      logger.info(`Review added for product ${id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: { review }
      });
    } catch (error) {
      logger.error('Add product review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add review',
        error: error.message
      });
    }
  },

  // Update product review
  updateProductReview: async (req, res) => {
    try {
      const { id, reviewId } = req.params;
      const { rating, title, comment } = req.body;
      const userId = req.user.id;

      const review = await Review.findOne({
        where: { id: reviewId, user_id: userId, product_id: id }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Update review
      await review.update({ rating, title, comment });

      // Update product rating
      const product = await Product.findByPk(id);
      if (product) {
        await product.updateRating();
      }

      logger.info(`Review updated for product ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: { review }
      });
    } catch (error) {
      logger.error('Update product review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review',
        error: error.message
      });
    }
  },

  // Delete product review
  deleteProductReview: async (req, res) => {
    try {
      const { id, reviewId } = req.params;
      const userId = req.user.id;

      const review = await Review.findOne({
        where: { id: reviewId, user_id: userId, product_id: id }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.destroy();

      // Update product rating
      const product = await Product.findByPk(id);
      if (product) {
        await product.updateRating();
      }

      logger.info(`Review deleted for product ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      logger.error('Delete product review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error.message
      });
    }
  },

  // Add to wishlist
  addToWishlist: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const [wishlistItem, created] = await WishlistItem.findOrCreate({
        where: { user_id: userId, product_id: id }
      });

      if (!created) {
        return res.status(400).json({
          success: false,
          message: 'Product is already in your wishlist'
        });
      }

      logger.info(`Product ${id} added to wishlist by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Product added to wishlist successfully'
      });
    } catch (error) {
      logger.error('Add to wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add to wishlist',
        error: error.message
      });
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const wishlistItem = await WishlistItem.findOne({
        where: { user_id: userId, product_id: id }
      });

      if (!wishlistItem) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in wishlist'
        });
      }

      await wishlistItem.destroy();

      logger.info(`Product ${id} removed from wishlist by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Product removed from wishlist successfully'
      });
    } catch (error) {
      logger.error('Remove from wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove from wishlist',
        error: error.message
      });
    }
  },

  // Create new product (Admin only)
  createProduct: async (req, res) => {
    try {
      const productData = req.body;

      // Check if SKU already exists
      const existingProduct = await Product.findOne({
        where: { sku: productData.sku }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      const product = await Product.create(productData);

      logger.info(`Product created: ${product.name} by admin ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });
    } catch (error) {
      logger.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  },

  // Update product (Admin only)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if SKU is being changed and if it already exists
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await Product.findOne({
          where: { sku: updateData.sku }
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this SKU already exists'
          });
        }
      }

      await product.update(updateData);

      logger.info(`Product updated: ${product.name} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: { product }
      });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  },

  // Delete product (Admin only)
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.destroy();

      logger.info(`Product deleted: ${product.name} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  },

  // Upload product images (Admin only)
  uploadProductImages: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // This will be handled by the upload middleware
      // The images will be available in req.files
      res.status(200).json({
        success: true,
        message: 'Product images uploaded successfully'
      });
    } catch (error) {
      logger.error('Upload product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload product images',
        error: error.message
      });
    }
  },

  // Delete product image (Admin only)
  deleteProductImage: async (req, res) => {
    try {
      const { id, imageId } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const image = await ProductImage.findOne({
        where: { id: imageId, product_id: id }
      });

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Product image not found'
        });
      }

      await image.destroy();

      logger.info(`Product image deleted: ${imageId} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Product image deleted successfully'
      });
    } catch (error) {
      logger.error('Delete product image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product image',
        error: error.message
      });
    }
  },

  // Update product stock (Admin only)
  updateProductStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, reason = 'manual' } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const previousQuantity = product.stock_quantity;
      const newQuantity = parseInt(quantity);
      const quantityChange = newQuantity - previousQuantity;

      // Update product stock
      await product.update({ stock_quantity: newQuantity });

      // Log stock change
      await StockLog.create({
        product_id: id,
        user_id: req.user.id,
        change_type: quantityChange > 0 ? 'added' : 'adjusted',
        quantity_change: Math.abs(quantityChange),
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason,
        reference_type: 'manual'
      });

      logger.info(`Product stock updated: ${product.name} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Product stock updated successfully',
        data: { product }
      });
    } catch (error) {
      logger.error('Update product stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product stock',
        error: error.message
      });
    }
  },

  // Get product stock logs (Admin only)
  getProductStockLogs: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows: stockLogs } = await StockLog.findAndCountAll({
        where: { product_id: id },
        include: [
          { model: require('../models/User'), as: 'user', attributes: ['id', 'first_name', 'last_name'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          stockLogs,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get product stock logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock logs',
        error: error.message
      });
    }
  },

  // Bulk import products (Admin only)
  bulkImportProducts: async (req, res) => {
    try {
      // This will be implemented with Excel import functionality
      res.status(200).json({
        success: true,
        message: 'Bulk import functionality will be implemented'
      });
    } catch (error) {
      logger.error('Bulk import products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import products',
        error: error.message
      });
    }
  },

  // Bulk export products (Admin only)
  bulkExportProducts: async (req, res) => {
    try {
      // This will be implemented with Excel export functionality
      res.status(200).json({
        success: true,
        message: 'Bulk export functionality will be implemented'
      });
    } catch (error) {
      logger.error('Bulk export products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export products',
        error: error.message
      });
    }
  },

  // Toggle featured status (Admin only)
  toggleFeatured: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({ is_featured: !product.is_featured });

      logger.info(`Product featured status toggled: ${product.name} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Product featured status updated successfully',
        data: { product }
      });
    } catch (error) {
      logger.error('Toggle featured error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update featured status',
        error: error.message
      });
    }
  },

  // Toggle bestseller status (Admin only)
  toggleBestseller: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({ is_bestseller: !product.is_bestseller });

      logger.info(`Product bestseller status toggled: ${product.name} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Product bestseller status updated successfully',
        data: { product }
      });
    } catch (error) {
      logger.error('Toggle bestseller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update bestseller status',
        error: error.message
      });
    }
  }
};

module.exports = { productController }; 