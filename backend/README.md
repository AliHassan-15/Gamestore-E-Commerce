# GameStore Backend API

A comprehensive e-commerce backend API for a gaming store built with Express.js, PostgreSQL, and Sequelize.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth integration
  - Role-based access control (Admin/Buyer)
  - Password reset and email verification

- **Product Management**
  - CRUD operations for products
  - Category and subcategory management
  - Product images upload
  - Stock management with logs
  - Search and filtering capabilities

- **Order Management**
  - Shopping cart functionality
  - Order processing and tracking
  - Payment integration with Stripe
  - Order status management

- **User Management**
  - User registration and profiles
  - Address and payment method management
  - Wishlist functionality

- **Reviews & Ratings**
  - Product reviews and ratings
  - Review moderation (admin)

- **Admin Dashboard**
  - Comprehensive admin panel
  - Analytics and reporting
  - Bulk import/export functionality
  - Activity logging

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: Passport.js (Local + Google OAuth)
- **Payment**: Stripe
- **File Upload**: Multer
- **Validation**: Joi
- **Logging**: Winston
- **Email**: Nodemailer
- **Excel Processing**: XLSX

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameStore/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gamestore_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Stripe
   STRIPE_SECRET_KEY=your-stripe-secret-key
   
   # Email
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE gamestore_db;
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

7. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database/
│   │   │   └── config.js
│   │   └── passport/
│   │       └── index.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   ├── auth/
│   │   │   └── authMiddleware.js
│   │   ├── validation/
│   │   │   └── validationMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── ... (other models)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── reviews.js
│   │   ├── admin.js
│   │   └── upload.js
│   ├── services/
│   │   ├── payment/
│   │   │   └── stripeService.js
│   │   ├── email/
│   │   │   └── emailService.js
│   │   └── excel/
│   │       └── excelService.js
│   ├── utils/
│   │   └── logger.js
│   └── server.js
├── uploads/
│   └── products/
├── logs/
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/google` - Google OAuth login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/search` - Search products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/bestsellers` - Get bestseller products
- `GET /api/products/:slug` - Get product by slug
- `GET /api/products/:id/reviews` - Get product reviews
- `POST /api/products/:id/reviews` - Add product review
- `POST /api/products/:id/wishlist` - Add to wishlist

### Admin Products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/images` - Upload product images (Admin)
- `PUT /api/products/:id/stock` - Update product stock (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order

### Admin Orders
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PUT /api/orders/admin/:id/status` - Update order status (Admin)
- `PUT /api/orders/admin/:id/refund` - Process refund (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews/product/:productId` - Add review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics/sales` - Get sales analytics
- `GET /api/admin/export/orders` - Export orders
- `POST /api/admin/import/categories` - Import categories

### File Upload
- `POST /api/upload/product-images` - Upload product images (Admin)
- `DELETE /api/upload/product-image/:filename` - Delete product image (Admin)

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

The application includes 16 main tables:
- `users` - User accounts and authentication
- `user_profiles` - Extended user information
- `categories` - Product categories
- `subcategories` - Product subcategories
- `products` - Product information
- `product_images` - Product images
- `orders` - Order information
- `order_items` - Items within orders
- `cart_items` - Shopping cart items
- `reviews` - Product reviews and ratings
- `addresses` - User addresses
- `payment_methods` - User payment methods
- `wishlist_items` - User wishlist
- `stock_logs` - Stock change tracking
- `activity_logs` - System activity logging

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
SMTP_USER=your-email
SMTP_PASS=your-email-password
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start src/server.js --name gamestore-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

The application uses Winston for logging. Logs are stored in the `logs/` directory:
- `app.log` - General application logs
- `error.log` - Error logs
- `combined.log` - Combined logs

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run migrate     # Run database migrations
npm run migrate:undo # Undo last migration
npm run seed        # Seed database
npm run seed:undo   # Undo seeding
```

### Code Style

The project uses ESLint for code linting. Run:

```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@gamestore.com or create an issue in the repository. 