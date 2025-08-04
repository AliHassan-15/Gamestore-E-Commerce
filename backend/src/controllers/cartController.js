const { CartItem, Product, User } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

const cartController = {
  // Get user's cart
  getUserCart: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'sku', 'stock_quantity', 'images'],
            include: [
              {
                model: require('../models/Category'),
                as: 'category',
                attributes: ['id', 'name', 'slug']
              },
              {
                model: require('../models/Subcategory'),
                as: 'subcategory',
                attributes: ['id', 'name', 'slug']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Calculate totals
      let subtotal = 0;
      let totalItems = 0;
      
      cartItems.forEach(item => {
        subtotal += item.quantity * item.product.price;
        totalItems += item.quantity;
      });

      const cart = {
        items: cartItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems,
        total: parseFloat(subtotal.toFixed(2)) // Add tax/shipping later
      };

      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error getting user cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart'
      });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { product_id, quantity = 1 } = req.body;

      // Validate product exists and has stock
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (!product.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Product is not available'
        });
      }

      if (product.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock_quantity} items available in stock`
        });
      }

      // Check if item already exists in cart
      let cartItem = await CartItem.findOne({
        where: { user_id: userId, product_id }
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + quantity;
        if (newQuantity > product.stock_quantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot add more items. Only ${product.stock_quantity} available in stock`
          });
        }

        cartItem.quantity = newQuantity;
        await cartItem.save();
      } else {
        // Create new cart item
        cartItem = await CartItem.create({
          user_id: userId,
          product_id,
          quantity
        });
      }

      // Get updated cart
      const updatedCart = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'sku', 'stock_quantity', 'images']
          }
        ]
      });

      let subtotal = 0;
      let totalItems = 0;
      
      updatedCart.forEach(item => {
        subtotal += item.quantity * item.product.price;
        totalItems += item.quantity;
      });

      res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: {
          cartItem,
          cart: {
            items: updatedCart,
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalItems,
            total: parseFloat(subtotal.toFixed(2))
          }
        }
      });
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart'
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const userId = req.user.id;
      const { cart_item_id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      const cartItem = await CartItem.findOne({
        where: { id: cart_item_id, user_id: userId },
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      // Check stock availability
      if (quantity > cartItem.product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${cartItem.product.stock_quantity} items available in stock`
        });
      }

      cartItem.quantity = quantity;
      await cartItem.save();

      // Get updated cart
      const updatedCart = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'sku', 'stock_quantity', 'images']
          }
        ]
      });

      let subtotal = 0;
      let totalItems = 0;
      
      updatedCart.forEach(item => {
        subtotal += item.quantity * item.product.price;
        totalItems += item.quantity;
      });

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: {
          cartItem,
          cart: {
            items: updatedCart,
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalItems,
            total: parseFloat(subtotal.toFixed(2))
          }
        }
      });
    } catch (error) {
      logger.error('Error updating cart item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item'
      });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const userId = req.user.id;
      const { cart_item_id } = req.params;

      const cartItem = await CartItem.findOne({
        where: { id: cart_item_id, user_id: userId }
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      await cartItem.destroy();

      // Get updated cart
      const updatedCart = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'sku', 'stock_quantity', 'images']
          }
        ]
      });

      let subtotal = 0;
      let totalItems = 0;
      
      updatedCart.forEach(item => {
        subtotal += item.quantity * item.product.price;
        totalItems += item.quantity;
      });

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: {
          cart: {
            items: updatedCart,
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalItems,
            total: parseFloat(subtotal.toFixed(2))
          }
        }
      });
    } catch (error) {
      logger.error('Error removing item from cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart'
      });
    }
  },

  // Clear cart
  clearCart: async (req, res) => {
    try {
      const userId = req.user.id;

      await CartItem.destroy({
        where: { user_id: userId }
      });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: {
          cart: {
            items: [],
            subtotal: 0,
            totalItems: 0,
            total: 0
          }
        }
      });
    } catch (error) {
      logger.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart'
      });
    }
  },

  // Get cart summary (for checkout)
  getCartSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'sku', 'stock_quantity', 'images']
          }
        ]
      });

      let subtotal = 0;
      let totalItems = 0;
      let shipping = 0;
      let tax = 0;
      
      cartItems.forEach(item => {
        subtotal += item.quantity * item.product.price;
        totalItems += item.quantity;
      });

      // Calculate shipping (free over $50, otherwise $5)
      shipping = subtotal >= 50 ? 0 : 5;
      
      // Calculate tax (8.5%)
      tax = subtotal * 0.085;
      
      const total = subtotal + shipping + tax;

      const summary = {
        items: cartItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        totalItems
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting cart summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart summary'
      });
    }
  },

  // Apply coupon code
  applyCoupon: async (req, res) => {
    try {
      const { coupon_code } = req.body;
      
      // This is a placeholder - implement actual coupon logic
      const validCoupons = {
        'WELCOME10': { discount: 10, type: 'percentage' },
        'SAVE20': { discount: 20, type: 'percentage' },
        'FREESHIP': { discount: 5, type: 'fixed' }
      };

      if (!validCoupons[coupon_code]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      const coupon = validCoupons[coupon_code];
      
      // Get cart summary
      const userId = req.user.id;
      const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'sku', 'stock_quantity', 'images']
          }
        ]
      });

      let subtotal = 0;
      cartItems.forEach(item => {
        subtotal += item.quantity * item.product.price;
      });

      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = subtotal * (coupon.discount / 100);
      } else {
        discount = coupon.discount;
      }

      const total = subtotal - discount;

      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          coupon: {
            code: coupon_code,
            discount: parseFloat(discount.toFixed(2)),
            type: coupon.type
          },
          cart: {
            items: cartItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            total: parseFloat(total.toFixed(2))
          }
        }
      });
    } catch (error) {
      logger.error('Error applying coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply coupon'
      });
    }
  }
};

module.exports = { cartController }; 