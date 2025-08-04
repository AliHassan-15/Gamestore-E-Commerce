const cron = require('node-cron');
const { Order, OrderItem, Product, User } = require('../../models');
const { logger } = require('../../utils/logger');
const { redisUtils } = require('../../config/redis/config');

class OrderProcessingService {
  constructor() {
    this.isRunning = false;
  }

  // Start the background service
  start() {
    if (this.isRunning) {
      logger.warn('Order processing service is already running');
      return;
    }

    logger.info('🚀 Starting order processing background service...');

    // Schedule order status updates every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.processOrderStatusUpdates();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Schedule inventory cleanup every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanupInventoryCache();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Schedule analytics update every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.updateAnalyticsCache();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.isRunning = true;
    logger.info('✅ Order processing background service started');
  }

  // Stop the background service
  stop() {
    if (!this.isRunning) {
      logger.warn('Order processing service is not running');
      return;
    }

    logger.info('🛑 Stopping order processing background service...');
    this.isRunning = false;
    logger.info('✅ Order processing background service stopped');
  }

  // Process order status updates
  async processOrderStatusUpdates() {
    try {
      logger.info('🔄 Processing order status updates...');

      // Get orders that need status updates
      const pendingOrders = await Order.findAll({
        where: {
          status: 'pending',
          created_at: {
            [require('sequelize').Op.lte]: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
          }
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ]
      });

      logger.info(`Found ${pendingOrders.length} orders to process`);

      for (const order of pendingOrders) {
        await this.processOrder(order);
      }

      logger.info('✅ Order status updates completed');
    } catch (error) {
      logger.error('❌ Error processing order status updates:', error);
    }
  }

  // Process individual order
  async processOrder(order) {
    try {
      logger.info(`Processing order ${order.id}...`);

      // Simulate order processing time
      const processingTime = Math.random() * 5 + 5; // 5-10 minutes
      
      // Update order status based on processing time
      if (processingTime < 7) {
        // Order is ready to ship
        await order.update({
          status: 'processing',
          updated_at: new Date()
        });

        logger.info(`Order ${order.id} status updated to 'processing'`);

        // Schedule shipping status update
        setTimeout(async () => {
          await this.updateOrderToShipped(order.id);
        }, 2 * 60 * 1000); // 2 minutes later

      } else {
        // Order needs more time
        await order.update({
          status: 'confirmed',
          updated_at: new Date()
        });

        logger.info(`Order ${order.id} status updated to 'confirmed'`);
      }

      // Clear order cache
      await redisUtils.del(`order:${order.id}`);
      await redisUtils.del('orders:recent');

    } catch (error) {
      logger.error(`Error processing order ${order.id}:`, error);
    }
  }

  // Update order to shipped status
  async updateOrderToShipped(orderId) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) {
        logger.warn(`Order ${orderId} not found for shipping update`);
        return;
      }

      await order.update({
        status: 'shipped',
        shipped_at: new Date(),
        tracking_number: this.generateTrackingNumber(),
        updated_at: new Date()
      });

      logger.info(`Order ${orderId} marked as shipped`);

      // Schedule delivery status update
      setTimeout(async () => {
        await this.updateOrderToDelivered(orderId);
      }, 3 * 60 * 1000); // 3 minutes later

    } catch (error) {
      logger.error(`Error updating order ${orderId} to shipped:`, error);
    }
  }

  // Update order to delivered status
  async updateOrderToDelivered(orderId) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) {
        logger.warn(`Order ${orderId} not found for delivery update`);
        return;
      }

      await order.update({
        status: 'delivered',
        delivered_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`Order ${orderId} marked as delivered`);

      // Clear order cache
      await redisUtils.del(`order:${orderId}`);
      await redisUtils.del('orders:recent');

    } catch (error) {
      logger.error(`Error updating order ${orderId} to delivered:`, error);
    }
  }

  // Generate tracking number
  generateTrackingNumber() {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Cleanup inventory cache
  async cleanupInventoryCache() {
    try {
      logger.info('🧹 Cleaning up inventory cache...');

      // Clear product cache
      await redisUtils.del('products:all');
      await redisUtils.del('products:featured');
      await redisUtils.del('products:bestsellers');

      // Clear category cache
      await redisUtils.del('categories:all');

      logger.info('✅ Inventory cache cleanup completed');
    } catch (error) {
      logger.error('❌ Error cleaning up inventory cache:', error);
    }
  }

  // Update analytics cache
  async updateAnalyticsCache() {
    try {
      logger.info('📊 Updating analytics cache...');

      // Get dashboard statistics
      const stats = await this.getDashboardStats();
      
      // Cache analytics data
      await redisUtils.set('analytics:dashboard', stats, 3600); // 1 hour

      // Get recent orders
      const recentOrders = await Order.findAll({
        order: [['created_at', 'DESC']],
        limit: 10,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name']
          }
        ]
      });

      await redisUtils.set('analytics:recent_orders', recentOrders, 1800); // 30 minutes

      logger.info('✅ Analytics cache updated');
    } catch (error) {
      logger.error('❌ Error updating analytics cache:', error);
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const [
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts,
        lowStockProducts
      ] = await Promise.all([
        Order.count(),
        Order.count({ where: { status: 'pending' } }),
        Order.sum('total_amount', { where: { status: 'delivered' } }),
        require('../../models').Product.count(),
        require('../../models').Product.count({ where: { stock_quantity: { [require('sequelize').Op.lte]: 10 } } })
      ]);

      return {
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        total_revenue: totalRevenue || 0,
        total_products: totalProducts,
        low_stock_products: lowStockProducts,
        last_updated: new Date()
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      return {};
    }
  }

  // Manual order processing (for admin use)
  async processOrderManually(orderId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      await this.processOrder(order);
      return { success: true, message: 'Order processing initiated' };

    } catch (error) {
      logger.error(`Error manually processing order ${orderId}:`, error);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: new Date(),
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// Create singleton instance
const orderProcessingService = new OrderProcessingService();

module.exports = { orderProcessingService }; 