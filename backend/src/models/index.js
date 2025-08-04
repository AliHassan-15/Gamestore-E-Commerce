const { sequelize } = require('../config/database/config');

// Import models (they are already defined with sequelize.define)
const User = require('./User');
const UserProfile = require('./UserProfile');
const Address = require('./Address');
const PaymentMethod = require('./PaymentMethod');
const Category = require('./Category');
const Subcategory = require('./Subcategory');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const StockLog = require('./StockLog');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const WishlistItem = require('./WishlistItem');
const ActivityLog = require('./ActivityLog');

// Define associations

// User associations
User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PaymentMethod, { foreignKey: 'user_id', as: 'paymentMethods' });
PaymentMethod.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(WishlistItem, { foreignKey: 'user_id', as: 'wishlistItems' });
WishlistItem.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

// Category associations
Category.hasMany(Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
Subcategory.belongsTo(Category, { foreignKey: 'category_id' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Subcategory associations
Subcategory.hasMany(Product, { foreignKey: 'subcategory_id', as: 'products' });
Product.belongsTo(Subcategory, { foreignKey: 'subcategory_id' });

// Product associations
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'productImages' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(StockLog, { foreignKey: 'product_id', as: 'stockLogs' });
StockLog.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cartItems' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(WishlistItem, { foreignKey: 'product_id', as: 'wishlistItems' });
WishlistItem.belongsTo(Product, { foreignKey: 'product_id' });

// Order associations
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Order.belongsTo(Address, { foreignKey: 'shipping_address_id', as: 'shippingAddress' });
Order.belongsTo(Address, { foreignKey: 'billing_address_id', as: 'billingAddress' });
Order.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id', as: 'paymentMethod' });

// Review associations
Review.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// StockLog associations
StockLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  UserProfile,
  Address,
  PaymentMethod,
  Category,
  Subcategory,
  Product,
  ProductImage,
  StockLog,
  CartItem,
  Order,
  OrderItem,
  Review,
  WishlistItem,
  ActivityLog
}; 