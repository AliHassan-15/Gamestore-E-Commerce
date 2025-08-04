const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subcategories',
      key: 'id'
    }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  min_stock_level: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_bestseller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  rating_average: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 5
    }
  },
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 255]
    }
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  warranty_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shipping_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  return_policy: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['subcategory_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['price']
    },
    {
      fields: ['rating_average']
    }
  ],
  hooks: {
    beforeCreate: (product) => {
      if (!product.slug) {
        product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    },
    beforeUpdate: (product) => {
      if (product.changed('name') && !product.changed('slug')) {
        product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
  }
});

// Instance methods
Product.prototype.getCurrentPrice = function() {
  return this.sale_price || this.price;
};

Product.prototype.isOnSale = function() {
  return this.sale_price && this.sale_price < this.price;
};

Product.prototype.getDiscountPercentage = function() {
  if (!this.isOnSale()) return 0;
  return Math.round(((this.price - this.sale_price) / this.price) * 100);
};

Product.prototype.isInStock = function() {
  return this.stock_quantity > 0;
};

Product.prototype.isLowStock = function() {
  return this.stock_quantity <= this.min_stock_level && this.stock_quantity > 0;
};

Product.prototype.isOutOfStock = function() {
  return this.stock_quantity === 0;
};

Product.prototype.updateRating = async function() {
  const { Review } = require('./index');
  const reviews = await Review.findAll({
    where: { product_id: this.id, is_approved: true },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ]
  });

  if (reviews[0]) {
    this.rating_average = parseFloat(reviews[0].dataValues.average) || 0;
    this.rating_count = parseInt(reviews[0].dataValues.count) || 0;
    await this.save();
  }
};

// Class methods
Product.findBySlug = function(slug) {
  return this.findOne({ 
    where: { slug, is_active: true },
    include: [
      { model: require('./Category'), as: 'category' },
      { model: require('./Subcategory'), as: 'subcategory' },
      { model: require('./ProductImage'), as: 'images' }
    ]
  });
};

Product.search = function(query, options = {}) {
  const { Op } = require('sequelize');
  const where = {
    is_active: true,
    [Op.or]: [
      { name: { [Op.iLike]: `%${query}%` } },
      { description: { [Op.iLike]: `%${query}%` } },
      { tags: { [Op.overlap]: [query] } }
    ]
  };

  if (options.categoryId) {
    where.category_id = options.categoryId;
  }

  if (options.subcategoryId) {
    where.subcategory_id = options.subcategoryId;
  }

  if (options.minPrice !== undefined) {
    where.price = { [Op.gte]: options.minPrice };
  }

  if (options.maxPrice !== undefined) {
    where.price = { ...where.price, [Op.lte]: options.maxPrice };
  }

  return this.findAll({
    where,
    include: [
      { model: require('./Category'), as: 'category' },
      { model: require('./Subcategory'), as: 'subcategory' }
    ],
    order: options.order || [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset
  });
};

Product.getFeatured = function(limit = 10) {
  return this.findAll({
    where: { is_active: true, is_featured: true },
    include: [
      { model: require('./Category'), as: 'category' },
      { model: require('./Subcategory'), as: 'subcategory' }
    ],
    order: [['rating_average', 'DESC'], ['rating_count', 'DESC']],
    limit
  });
};

Product.getBestsellers = function(limit = 10) {
  return this.findAll({
    where: { is_active: true, is_bestseller: true },
    include: [
      { model: require('./Category'), as: 'category' },
      { model: require('./Subcategory'), as: 'subcategory' }
    ],
    order: [['rating_average', 'DESC'], ['rating_count', 'DESC']],
    limit
  });
};

module.exports = Product; 