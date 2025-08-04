const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const StockLog = sequelize.define('StockLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  change_type: {
    type: DataTypes.ENUM('added', 'sold', 'returned', 'damaged', 'adjusted'),
    allowNull: false
  },
  quantity_change: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previous_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  new_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'stock_logs',
  timestamps: true,
  underscored: true
});

module.exports = StockLog; 