const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
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
  transaction_type: {
    type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'RETURN'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previous_stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  new_stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reference_type: {
    type: DataTypes.ENUM('ORDER', 'MANUAL', 'RETURN', 'SYSTEM'),
    allowNull: false
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  total_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inventory_transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['reference_type', 'reference_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
InventoryTransaction.prototype.getFormattedTransaction = function() {
  const types = {
    'IN': 'Stock Added',
    'OUT': 'Stock Sold',
    'ADJUSTMENT': 'Manual Adjustment',
    'RETURN': 'Customer Return'
  };
  
  return {
    id: this.id,
    product_id: this.product_id,
    transaction_type: this.transaction_type,
    transaction_type_label: types[this.transaction_type],
    quantity: this.quantity,
    previous_stock: this.previous_stock,
    new_stock: this.new_stock,
    reference_type: this.reference_type,
    reference_id: this.reference_id,
    notes: this.notes,
    unit_cost: this.unit_cost,
    total_value: this.total_value,
    created_at: this.created_at
  };
};

// Class methods
InventoryTransaction.logTransaction = async function(data) {
  try {
    const transaction = await this.create(data);
    return transaction;
  } catch (error) {
    throw new Error(`Failed to log inventory transaction: ${error.message}`);
  }
};

InventoryTransaction.getProductHistory = async function(productId, limit = 50) {
  try {
    const transactions = await this.findAll({
      where: { product_id: productId },
      order: [['created_at', 'DESC']],
      limit,
      include: [
        {
          model: require('./User'),
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });
    
    return transactions.map(t => t.getFormattedTransaction());
  } catch (error) {
    throw new Error(`Failed to get product inventory history: ${error.message}`);
  }
};

InventoryTransaction.getRecentTransactions = async function(limit = 100) {
  try {
    const transactions = await this.findAll({
      order: [['created_at', 'DESC']],
      limit,
      include: [
        {
          model: require('./Product'),
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: require('./User'),
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    return transactions.map(t => ({
      ...t.getFormattedTransaction(),
      product: t.product,
      user: t.user
    }));
  } catch (error) {
    throw new Error(`Failed to get recent transactions: ${error.message}`);
  }
};

module.exports = InventoryTransaction; 