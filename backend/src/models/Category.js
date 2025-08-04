const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (category) => {
      if (!category.slug) {
        category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    },
    beforeUpdate: (category) => {
      if (category.changed('name') && !category.changed('slug')) {
        category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
  }
});

// Instance methods
Category.prototype.getProductCount = async function() {
  const { Product } = require('./index');
  return await Product.count({ where: { category_id: this.id, is_active: true } });
};

// Class methods
Category.findBySlug = function(slug) {
  return this.findOne({ where: { slug, is_active: true } });
};

Category.getActiveCategories = function() {
  return this.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

module.exports = Category; 