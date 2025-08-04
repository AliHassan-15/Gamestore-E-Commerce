const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const CartItem = sequelize.define('CartItem', {
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
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price_at_time: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id']
    }
  ]
});

// Instance methods
CartItem.prototype.getTotalPrice = function() {
  return this.price_at_time * this.quantity;
};

// Class methods
CartItem.getUserCart = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    include: [
      { model: require('./Product'), as: 'product' }
    ],
    order: [['created_at', 'ASC']]
  });
};

CartItem.getCartItem = function(userId, productId) {
  return this.findOne({
    where: { user_id: userId, product_id: productId },
    include: [
      { model: require('./Product'), as: 'product' }
    ]
  });
};

CartItem.getCartTotal = async function(userId) {
  const cartItems = await this.getUserCart(userId);
  return cartItems.reduce((total, item) => {
    return total + (item.price_at_time * item.quantity);
  }, 0);
};

module.exports = CartItem; 