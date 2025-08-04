const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  activity_type: {
    type: DataTypes.ENUM('login', 'logout', 'register', 'product_create', 'product_update', 'product_delete', 'order_create', 'order_update', 'order_cancel', 'review_create', 'review_update', 'review_delete', 'stock_update', 'category_create', 'category_update', 'category_delete', 'admin_action', 'system_event'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low'
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['activity_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['severity']
    }
  ]
});

// Instance methods
ActivityLog.prototype.getFormattedDescription = function() {
  return `${this.activity_type}: ${this.description}`;
};

// Class methods
ActivityLog.logActivity = async function(data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

ActivityLog.getUserActivity = async function(userId, limit = 50) {
  return await this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit
  });
};

ActivityLog.getSystemActivity = async function(limit = 100) {
  return await this.findAll({
    where: { user_id: null },
    order: [['created_at', 'DESC']],
    limit
  });
};

ActivityLog.getActivityByType = async function(activityType, limit = 50) {
  return await this.findAll({
    where: { activity_type: activityType },
    order: [['created_at', 'DESC']],
    limit
  });
};

ActivityLog.getActivityByDateRange = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      created_at: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['created_at', 'DESC']]
  });
};

ActivityLog.getCriticalActivity = async function(limit = 50) {
  return await this.findAll({
    where: { severity: 'critical' },
    order: [['created_at', 'DESC']],
    limit
  });
};

module.exports = ActivityLog; 