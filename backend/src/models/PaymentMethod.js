const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const PaymentMethod = sequelize.define('PaymentMethod', {
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
  payment_type: {
    type: DataTypes.ENUM('card', 'paypal'),
    defaultValue: 'card',
    allowNull: false
  },
  card_last_four: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  card_brand: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  stripe_payment_method_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'payment_methods',
  timestamps: true,
  underscored: true
});

module.exports = PaymentMethod; 