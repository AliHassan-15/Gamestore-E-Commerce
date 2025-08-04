const { Order, OrderItem, Product, User, Address, PaymentMethod, CartItem } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

const orderController = {
  // Create new order (checkout)
  createOrder: async (req, res) => {
    try {
      const { items, shipping_address_id, billing_address_id, payment_method_id, notes } = req.body;
      const userId = req.user.id;

      // Validate items
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order must contain at least one item'
        });
      }

      // Check if all products exist and have sufficient stock
      const productIds = items.map(item => item.product_id);
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } }
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more products not found'
        });
      }

      // Check stock availability
      for (const item of items) {
        const product = products.find(p => p.id === item.product_id);
        if (product.stock_quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
          });
        }
      }

      // Calculate order total
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = products.find(p => p.id === item.product_id);
        const itemTotal = product.sale_price || product.price;
        subtotal += itemTotal * item.quantity;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: itemTotal,
          total_price: itemTotal * item.quantity
        });
      }

      const tax = subtotal * 0.1; // 10% tax
      const shipping = 0; // Free shipping for now
      const total = subtotal + tax + shipping;

      // Create order
      const order = await Order.create({
        user_id: userId,
        order_number: await Order.generateOrderNumber(),
        status: 'pending',
        subtotal,
        tax,
        shipping,
        total,
        shipping_address_id,
        billing_address_id,
        payment_method_id,
        notes
      });

      // Create order items
      await OrderItem.bulkCreate(
        orderItems.map(item => ({
          ...item,
          order_id: order.id
        }))
      );

      // Update product stock
      for (const item of items) {
        const product = products.find(p => p.id === item.product_id);
        await product.update({
          stock_quantity: product.stock_quantity - item.quantity
        });
      }

      // Clear user's cart
      await CartItem.destroy({
        where: { user_id: userId }
      });

      logger.info(`Order created: ${order.order_number} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order }
      });
    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message
      });
    }
  },

  // Get user orders
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const offset = (page - 1) * limit;
      const where = { user_id: userId };

      if (status) {
        where.status = status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Address, as: 'shippingAddress' },
          { model: Address, as: 'billingAddress' }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          orders,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  },

  // Get order by ID
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, user_id: userId },
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Address, as: 'shippingAddress' },
          { model: Address, as: 'billingAddress' },
          { model: PaymentMethod, as: 'paymentMethod' }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { order }
      });
    } catch (error) {
      logger.error('Get order by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message
      });
    }
  },

  // Cancel order
  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, user_id: userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled at this stage'
        });
      }

      // Update order status
      await order.update({ status: 'cancelled' });

      // Restore product stock
      const orderItems = await OrderItem.findAll({
        where: { order_id: id },
        include: [{ model: Product, as: 'product' }]
      });

      for (const item of orderItems) {
        await item.product.update({
          stock_quantity: item.product.stock_quantity + item.quantity
        });
      }

      logger.info(`Order cancelled: ${order.order_number} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: error.message
      });
    }
  },

  // Get all orders (Admin only)
  getAllOrders: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        start_date,
        end_date,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (status) where.status = status;
      if (start_date && end_date) {
        where.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }
      if (search) {
        where[Op.or] = [
          { order_number: { [Op.iLike]: `%${search}%` } },
          { '$user.email$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] },
          { model: OrderItem, as: 'items' },
          { model: Address, as: 'shippingAddress' },
          { model: Address, as: 'billingAddress' }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          orders,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  },

  // Get order details (Admin only)
  getOrderDetails: async (req, res) => {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } },
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Address, as: 'shippingAddress' },
          { model: Address, as: 'billingAddress' },
          { model: PaymentMethod, as: 'paymentMethod' }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { order }
      });
    } catch (error) {
      logger.error('Get order details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order details',
        error: error.message
      });
    }
  },

  // Update order status (Admin only)
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, tracking_number, notes } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const previousStatus = order.status;

      // Update order
      await order.update({
        status,
        tracking_number,
        notes: notes || order.notes
      });

      logger.info(`Order status updated: ${order.order_number} from ${previousStatus} to ${status} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: { order }
      });
    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error.message
      });
    }
  },

  // Process refund (Admin only)
  processRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const { refund_amount, reason } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Order must be delivered to process refund'
        });
      }

      if (refund_amount > order.total) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount cannot exceed order total'
        });
      }

      // Update order
      await order.update({
        status: 'refunded',
        refund_amount,
        refund_reason: reason,
        refund_date: new Date()
      });

      logger.info(`Refund processed: ${order.order_number} by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: { order }
      });
    } catch (error) {
      logger.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error.message
      });
    }
  },

  // Get order statistics (Admin only)
  getOrderStats: async (req, res) => {
    try {
      const { period = '30' } = req.query; // days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Total orders
      const totalOrders = await Order.count({
        where: {
          created_at: { [Op.gte]: startDate }
        }
      });

      // Total revenue
      const totalRevenue = await Order.sum('total', {
        where: {
          created_at: { [Op.gte]: startDate },
          status: { [Op.in]: ['delivered', 'shipped'] }
        }
      });

      // Orders by status
      const ordersByStatus = await Order.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: ['status']
      });

      // Daily orders for chart
      const dailyOrders = await Order.findAll({
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: {
          totalOrders,
          totalRevenue: totalRevenue || 0,
          ordersByStatus,
          dailyOrders
        }
      });
    } catch (error) {
      logger.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order statistics',
        error: error.message
      });
    }
  },

  // Export orders (Admin only)
  exportOrders: async (req, res) => {
    try {
      const { start_date, end_date, status } = req.query;

      const where = {};
      if (start_date && end_date) {
        where.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }
      if (status) where.status = status;

      const orders = await Order.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['email', 'first_name', 'last_name'] },
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
        ],
        order: [['created_at', 'DESC']]
      });

      // This would typically generate an Excel file
      // For now, we'll return the data
      res.status(200).json({
        success: true,
        message: 'Export functionality will be implemented',
        data: { orders }
      });
    } catch (error) {
      logger.error('Export orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export orders',
        error: error.message
      });
    }
  }
};

module.exports = { orderController }; 