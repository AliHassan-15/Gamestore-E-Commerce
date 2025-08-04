const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const Subcategory = sequelize.define('Subcategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
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
  tableName: 'subcategories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['category_id', 'name']
    }
  ],
  hooks: {
    beforeCreate: (subcategory) => {
      if (!subcategory.slug) {
        subcategory.slug = subcategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    },
    beforeUpdate: (subcategory) => {
      if (subcategory.changed('name') && !subcategory.changed('slug')) {
        subcategory.slug = subcategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
  }
});

// Instance methods
Subcategory.prototype.getProductCount = async function() {
  const { Product } = require('./index');
  return await Product.count({ where: { subcategory_id: this.id, is_active: true } });
};

// Class methods
Subcategory.findBySlug = function(slug, categoryId = null) {
  const where = { slug, is_active: true };
  if (categoryId) {
    where.category_id = categoryId;
  }
  return this.findOne({ where });
};

Subcategory.getActiveSubcategories = function(categoryId = null) {
  const where = { is_active: true };
  if (categoryId) {
    where.category_id = categoryId;
  }
  return this.findAll({
    where,
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

module.exports = Subcategory; 