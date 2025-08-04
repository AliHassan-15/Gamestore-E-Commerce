const { InventoryTransaction, Product, User, Order, OrderItem } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

const inventoryController = {
  // Get inventory transactions for a product
  getProductInventoryHistory: async (req, res) => {
    try {
      const { product_id } = req.params;
      const { page = 1, limit = 20, type } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { product_id };

      if (type) {
        whereClause.transaction_type = type;
      }

      const transactions = await InventoryTransaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(transactions.count / limit);

      res.json({
        success: true,
        data: {
          transactions: transactions.rows.map(t => t.getFormattedTransaction()),
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_transactions: transactions.count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting product inventory history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory history'
      });
    }
  },

  // Get recent inventory transactions
  getRecentTransactions: async (req, res) => {
    try {
      const { page = 1, limit = 50, type } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (type) {
        whereClause.transaction_type = type;
      }

      const transactions = await InventoryTransaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(transactions.count / limit);

      res.json({
        success: true,
        data: {
          transactions: transactions.rows.map(t => ({
            ...t.getFormattedTransaction(),
            product: t.product,
            user: t.user
          })),
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_transactions: transactions.count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting recent transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent transactions'
      });
    }
  },

  // Add stock manually (admin only)
  addStock: async (req, res) => {
    try {
      const { product_id, quantity, unit_cost, notes } = req.body;
      const userId = req.user.id;

      // Validate product exists
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }

      const previousStock = product.stock_quantity;
      const newStock = previousStock + quantity;

      // Update product stock
      await product.update({
        stock_quantity: newStock
      });

      // Log inventory transaction
      const transaction = await InventoryTransaction.create({
        product_id,
        user_id: userId,
        transaction_type: 'IN',
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reference_type: 'MANUAL',
        reference_id: null,
        notes: notes || 'Manual stock addition',
        unit_cost: unit_cost || null,
        total_value: unit_cost ? unit_cost * quantity : null
      });

      res.json({
        success: true,
        message: 'Stock added successfully',
        data: {
          transaction: transaction.getFormattedTransaction(),
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            previous_stock: previousStock,
            new_stock: newStock
          }
        }
      });
    } catch (error) {
      logger.error('Error adding stock:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add stock'
      });
    }
  },

  // Adjust stock manually (admin only)
  adjustStock: async (req, res) => {
    try {
      const { product_id, quantity, reason, unit_cost } = req.body;
      const userId = req.user.id;

      // Validate product exists
      const product = await Product.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const previousStock = product.stock_quantity;
      const newStock = previousStock + quantity; // quantity can be negative

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock adjustment would result in negative inventory'
        });
      }

      // Update product stock
      await product.update({
        stock_quantity: newStock
      });

      // Log inventory transaction
      const transaction = await InventoryTransaction.create({
        product_id,
        user_id: userId,
        transaction_type: 'ADJUSTMENT',
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reference_type: 'MANUAL',
        reference_id: null,
        notes: reason || 'Manual stock adjustment',
        unit_cost: unit_cost || null,
        total_value: unit_cost ? unit_cost * Math.abs(quantity) : null
      });

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          transaction: transaction.getFormattedTransaction(),
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            previous_stock: previousStock,
            new_stock: newStock
          }
        }
      });
    } catch (error) {
      logger.error('Error adjusting stock:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to adjust stock'
      });
    }
  },

  // Process order inventory (called when order is created)
  processOrderInventory: async (orderId) => {
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

      const transactions = [];

      for (const item of order.items) {
        const product = item.product;
        const previousStock = product.stock_quantity;
        const newStock = previousStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        // Update product stock
        await product.update({
          stock_quantity: newStock
        });

        // Log inventory transaction
        const transaction = await InventoryTransaction.create({
          product_id: product.id,
          user_id: order.user_id,
          transaction_type: 'OUT',
          quantity: -item.quantity, // Negative for stock out
          previous_stock: previousStock,
          new_stock: newStock,
          reference_type: 'ORDER',
          reference_id: order.id,
          notes: `Order #${order.id} - ${item.quantity} units sold`,
          unit_cost: product.cost_price || null,
          total_value: (product.cost_price || 0) * item.quantity
        });

        transactions.push(transaction);
      }

      logger.info(`Processed inventory for order ${orderId}: ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      logger.error(`Error processing inventory for order ${orderId}:`, error);
      throw error;
    }
  },

  // Process return inventory (called when order is returned)
  processReturnInventory: async (orderId, returnItems) => {
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

      const transactions = [];

      for (const returnItem of returnItems) {
        const orderItem = order.items.find(item => item.product_id === returnItem.product_id);
        
        if (!orderItem) {
          throw new Error(`Product ${returnItem.product_id} not found in order`);
        }

        if (returnItem.quantity > orderItem.quantity) {
          throw new Error(`Return quantity exceeds order quantity for product ${returnItem.product_id}`);
        }

        const product = orderItem.product;
        const previousStock = product.stock_quantity;
        const newStock = previousStock + returnItem.quantity;

        // Update product stock
        await product.update({
          stock_quantity: newStock
        });

        // Log inventory transaction
        const transaction = await InventoryTransaction.create({
          product_id: product.id,
          user_id: order.user_id,
          transaction_type: 'RETURN',
          quantity: returnItem.quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          reference_type: 'RETURN',
          reference_id: order.id,
          notes: `Order #${order.id} return - ${returnItem.quantity} units returned`,
          unit_cost: product.cost_price || null,
          total_value: (product.cost_price || 0) * returnItem.quantity
        });

        transactions.push(transaction);
      }

      logger.info(`Processed return inventory for order ${orderId}: ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      logger.error(`Error processing return inventory for order ${orderId}:`, error);
      throw error;
    }
  },

  // Get inventory statistics
  getInventoryStats: async (req, res) => {
    try {
      const [
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue,
        recentTransactions
      ] = await Promise.all([
        Product.count(),
        Product.count({ where: { stock_quantity: { [Op.lte]: 10 } } }),
        Product.count({ where: { stock_quantity: 0 } }),
        Product.sum('stock_quantity', { 
          where: { stock_quantity: { [Op.gt]: 0 } },
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['cost_price']
            }
          ]
        }),
        InventoryTransaction.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      // Get transaction types breakdown
      const transactionTypes = await InventoryTransaction.findAll({
        attributes: [
          'transaction_type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        group: ['transaction_type']
      });

      const stats = {
        total_products: totalProducts,
        low_stock_products: lowStockProducts,
        out_of_stock_products: outOfStockProducts,
        total_inventory_value: totalValue || 0,
        recent_transactions_24h: recentTransactions,
        transaction_types: transactionTypes.reduce((acc, t) => {
          acc[t.transaction_type] = parseInt(t.dataValues.count);
          return acc;
        }, {}),
        last_updated: new Date()
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting inventory stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory statistics'
      });
    }
  },

  // Get low stock alerts
  getLowStockAlerts: async (req, res) => {
    try {
      const { threshold = 10 } = req.query;

      const lowStockProducts = await Product.findAll({
        where: {
          stock_quantity: {
            [Op.lte]: parseInt(threshold)
          },
          is_active: true
        },
        attributes: ['id', 'name', 'sku', 'stock_quantity', 'price'],
        order: [['stock_quantity', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          threshold: parseInt(threshold),
          products: lowStockProducts,
          count: lowStockProducts.length
        }
      });
    } catch (error) {
      logger.error('Error getting low stock alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock alerts'
      });
    }
  }
};

module.exports = { inventoryController }; 