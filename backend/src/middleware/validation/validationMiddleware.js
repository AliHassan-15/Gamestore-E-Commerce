const Joi = require('joi');
const { logger } = require('../../utils/logger');

// Validation schemas
const schemas = {
  // User registration validation
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    first_name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'First name is required',
      'string.max': 'First name cannot exceed 100 characters',
      'any.required': 'First name is required'
    }),
    last_name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name cannot exceed 100 characters',
      'any.required': 'Last name is required'
    }),
    role: Joi.string().valid('admin', 'buyer').default('buyer')
  }),

  // User login validation
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // Product validation
  product: Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Product name is required',
      'string.max': 'Product name cannot exceed 255 characters',
      'any.required': 'Product name is required'
    }),
    description: Joi.string().optional(),
    short_description: Joi.string().max(500).optional(),
    price: Joi.number().positive().required().messages({
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    }),
    sale_price: Joi.number().positive().optional(),
    cost_price: Joi.number().positive().optional(),
    category_id: Joi.number().integer().positive().optional(),
    subcategory_id: Joi.number().integer().positive().optional(),
    sku: Joi.string().min(1).max(100).required().messages({
      'string.min': 'SKU is required',
      'string.max': 'SKU cannot exceed 100 characters',
      'any.required': 'SKU is required'
    }),
    stock_quantity: Joi.number().integer().min(0).default(0),
    min_stock_level: Joi.number().integer().min(0).default(5),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    is_active: Joi.boolean().default(true),
    is_featured: Joi.boolean().default(false),
    is_bestseller: Joi.boolean().default(false),
    meta_title: Joi.string().max(255).optional(),
    meta_description: Joi.string().optional(),
    specifications: Joi.object().optional(),
    warranty_info: Joi.string().optional(),
    shipping_info: Joi.string().optional(),
    return_policy: Joi.string().optional()
  }),

  // Category validation
  category: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Category name is required',
      'string.max': 'Category name cannot exceed 100 characters',
      'any.required': 'Category name is required'
    }),
    description: Joi.string().optional(),
    image_url: Joi.string().uri().optional(),
    is_active: Joi.boolean().default(true),
    sort_order: Joi.number().integer().default(0),
    meta_title: Joi.string().max(255).optional(),
    meta_description: Joi.string().optional()
  }),

  // Order validation
  order: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required()
      })
    ).min(1).required().messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'Order items are required'
    }),
    shipping_address_id: Joi.number().integer().positive().optional(),
    billing_address_id: Joi.number().integer().positive().optional(),
    payment_method_id: Joi.number().integer().positive().optional(),
    notes: Joi.string().optional()
  }),

  // Cart item validation
  cartItem: Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
      'any.required': 'Product ID is required'
    }),
    quantity: Joi.number().integer().positive().default(1).messages({
      'number.positive': 'Quantity must be positive'
    })
  }),

  // Review validation
  review: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
      'any.required': 'Rating is required'
    }),
    title: Joi.string().max(255).optional(),
    comment: Joi.string().optional()
  }),

  // Address validation
  address: Joi.object({
    address_type: Joi.string().valid('billing', 'shipping').default('shipping'),
    street_address: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Street address is required',
      'string.max': 'Street address cannot exceed 255 characters',
      'any.required': 'Street address is required'
    }),
    city: Joi.string().min(1).max(100).required().messages({
      'string.min': 'City is required',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
    state: Joi.string().min(1).max(100).required().messages({
      'string.min': 'State is required',
      'string.max': 'State cannot exceed 100 characters',
      'any.required': 'State is required'
    }),
    postal_code: Joi.string().min(1).max(20).required().messages({
      'string.min': 'Postal code is required',
      'string.max': 'Postal code cannot exceed 20 characters',
      'any.required': 'Postal code is required'
    }),
    country: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Country is required',
      'string.max': 'Country cannot exceed 100 characters',
      'any.required': 'Country is required'
    }),
    is_default: Joi.boolean().default(false),
    phone: Joi.string().max(20).optional(),
    label: Joi.string().max(50).optional()
  }),

  // Inventory validation
  inventory: Joi.object({
    product_id: Joi.number().integer().positive().required().messages({
      'any.required': 'Product ID is required',
      'number.positive': 'Product ID must be positive'
    }),
    quantity: Joi.number().integer().required().messages({
      'any.required': 'Quantity is required',
      'number.integer': 'Quantity must be an integer'
    }),
    unit_cost: Joi.number().precision(2).min(0).optional().messages({
      'number.precision': 'Unit cost must have maximum 2 decimal places',
      'number.min': 'Unit cost cannot be negative'
    }),
    notes: Joi.string().max(500).optional().messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Reason cannot exceed 500 characters'
    })
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      logger.warn(`Validation failed for ${schemaName}:`, errorMessages);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
};

// Specific validation middlewares
const validateRegistration = validate('register');
const validateLogin = validate('login');
const validateProduct = validate('product');
const validateCategory = validate('category');
const validateOrder = validate('order');
const validateCartItem = validate('cartItem');
const validateReview = validate('review');
const validateAddress = validate('address');
const validateInventory = validate('inventory');

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateProduct,
  validateCategory,
  validateOrder,
  validateCartItem,
  validateReview,
  validateAddress,
  validateInventory,
  schemas
}; 