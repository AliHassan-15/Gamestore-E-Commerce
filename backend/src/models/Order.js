const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_method_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'payment_methods',
      key: 'id'
    }
  },
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_address_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'addresses',
      key: 'id'
    }
  },
  billing_address_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'addresses',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipping_method: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_carrier: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['order_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (order) => {
      if (!order.order_number) {
        order.order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }
    }
  }
});

// Instance methods
Order.prototype.calculateTotals = function() {
  this.subtotal = this.subtotal || 0;
  this.tax_amount = this.tax_amount || 0;
  this.shipping_amount = this.shipping_amount || 0;
  this.discount_amount = this.discount_amount || 0;
  
  this.total_amount = this.subtotal + this.tax_amount + this.shipping_amount - this.discount_amount;
  return this.total_amount;
};

Order.prototype.markAsShipped = async function(trackingNumber = null) {
  this.status = 'shipped';
  this.shipped_at = new Date();
  if (trackingNumber) {
    this.tracking_number = trackingNumber;
  }
  await this.save();
};

Order.prototype.markAsDelivered = async function() {
  this.status = 'delivered';
  this.delivered_at = new Date();
  await this.save();
};

Order.prototype.cancel = async function(reason = null) {
  this.status = 'cancelled';
  if (reason) {
    this.notes = reason;
  }
  await this.save();
};

Order.prototype.refund = async function(amount, reason = null) {
  this.status = 'refunded';
  this.payment_status = 'refunded';
  this.refund_amount = amount;
  this.refund_reason = reason;
  this.refunded_at = new Date();
  await this.save();
};

Order.prototype.isCancellable = function() {
  return ['pending', 'processing'].includes(this.status);
};

Order.prototype.isRefundable = function() {
  return this.payment_status === 'paid' && ['shipped', 'delivered'].includes(this.status);
};

// Class methods
Order.generateOrderNumber = function() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

Order.findByOrderNumber = function(orderNumber) {
  return this.findOne({
    where: { order_number: orderNumber },
    include: [
      { model: require('./User'), as: 'user' },
      { model: require('./OrderItem'), as: 'items' },
      { model: require('./Address'), as: 'shippingAddress' },
      { model: require('./Address'), as: 'billingAddress' },
      { model: require('./PaymentMethod'), as: 'paymentMethod' }
    ]
  });
};

Order.getUserOrders = function(userId, options = {}) {
  return this.findAll({
    where: { user_id: userId },
    include: [
      { model: require('./OrderItem'), as: 'items' }
    ],
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset
  });
};

Order.getOrdersByStatus = function(status, options = {}) {
  return this.findAll({
    where: { status },
    include: [
      { model: require('./User'), as: 'user' },
      { model: require('./OrderItem'), as: 'items' }
    ],
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset
  });
};

module.exports = Order; 