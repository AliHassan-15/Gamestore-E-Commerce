const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const Address = sequelize.define('Address', {
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
  address_type: {
    type: DataTypes.ENUM('billing', 'shipping'),
    defaultValue: 'shipping',
    allowNull: false
  },
  street_address: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  label: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'addresses',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['address_type']
    }
  ]
});

// Instance methods
Address.prototype.getFullAddress = function() {
  return `${this.street_address}, ${this.city}, ${this.state} ${this.postal_code}, ${this.country}`;
};

// Class methods
Address.getUserAddresses = function(userId, type = null) {
  const where = { user_id: userId };
  if (type) {
    where.address_type = type;
  }
  return this.findAll({
    where,
    order: [['is_default', 'DESC'], ['created_at', 'ASC']]
  });
};

Address.getDefaultAddress = function(userId, type) {
  return this.findOne({
    where: { user_id: userId, address_type: type, is_default: true }
  });
};

module.exports = Address; 