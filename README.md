# GameStore E-commerce Application

A comprehensive e-commerce platform for gaming products built with Express.js, PostgreSQL, Sequelize, React, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Passport.js (Local + Google OAuth)
- **Payment**: Stripe Integration
- **File Upload**: Multer + Sharp
- **Validation**: Joi + Express-validator
- **Logging**: Winston
- **Sessions**: Express-session with PostgreSQL store

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Payment**: Stripe React Components

## 📁 Project Structure

```
GameStore/
├── backend/                          # Express.js Backend
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── database/            # Database config
│   │   │   └── passport/            # Passport auth config
│   │   ├── controllers/             # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   └── orderController.js
│   │   ├── middleware/              # Custom middleware
│   │   │   ├── auth/               # Authentication middleware
│   │   │   └── validation/         # Validation middleware
│   │   ├── models/                 # Sequelize models
│   │   │   ├── index.js
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   └── Order.js
│   │   ├── routes/                 # API routes
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   └── orders.js
│   │   ├── services/               # Business logic services
│   │   │   ├── payment/           # Stripe payment service
│   │   │   ├── email/             # Email service
│   │   │   └── excel/             # Excel import/export service
│   │   ├── utils/                 # Utility functions
│   │   │   ├── helpers/
│   │   │   └── constants/
│   │   ├── logs/                  # Log files
│   │   └── server.js              # Main server file
│   ├── package.json
│   └── env.example
├── frontend/                        # React Frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── ui/               # Shadcn UI components
│   │   │   ├── forms/            # Form components
│   │   │   ├── layout/           # Layout components
│   │   │   ├── product/          # Product-related components
│   │   │   ├── cart/             # Cart components
│   │   │   ├── admin/            # Admin components
│   │   │   └── common/           # Common components
│   │   ├── pages/                # Page components
│   │   │   ├── auth/             # Authentication pages
│   │   │   ├── products/         # Product pages
│   │   │   ├── cart/             # Cart pages
│   │   │   ├── admin/            # Admin pages
│   │   │   └── dashboard/        # Dashboard pages
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API services
│   │   │   ├── api/              # API client
│   │   │   └── auth/             # Auth service
│   │   ├── utils/                # Utility functions
│   │   │   ├── helpers/
│   │   │   └── constants/
│   │   ├── types/                # TypeScript types
│   │   │   ├── api/
│   │   │   └── components/
│   │   ├── store/                # Redux store
│   │   │   ├── slices/
│   │   │   └── store.ts
│   │   ├── assets/               # Static assets
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                   # Public assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── database_schema.sql            # Complete database schema
└── README.md
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts with roles (admin/buyer)
- **user_profiles** - Additional user information
- **addresses** - Billing and shipping addresses
- **payment_methods** - Stored payment methods
- **categories** - Product categories
- **subcategories** - Product subcategories
- **products** - Product information and inventory
- **product_images** - Multiple images per product
- **stock_logs** - Stock change tracking
- **cart_items** - Shopping cart
- **orders** - Order information
- **order_items** - Individual items in orders
- **reviews** - Product reviews and ratings
- **wishlist_items** - User wishlists
- **activity_logs** - System activity tracking
- **sessions** - User sessions

### Key Features
- **Primary Keys**: All tables use SERIAL auto-incrementing IDs
- **Foreign Keys**: Proper relationships with CASCADE/SET NULL options
- **Indexes**: Optimized for common queries
- **Triggers**: Automatic timestamp updates
- **Constraints**: Data integrity checks
- **Enums**: Status and type fields with predefined values

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Configure environment variables in `.env`

5. Create PostgreSQL database and run schema:
   ```bash
   psql -U postgres -d gamestore_db -f ../database_schema.sql
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamestore_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
SESSION_SECRET=your_session_secret
```

## 🚀 Features

### Authentication & Authorization
- User registration with optional payment details
- Local authentication with email/password
- Google OAuth integration
- Role-based access control (Admin/Buyer)
- Session management with cookies

### Product Management
- CRUD operations for products
- Category and subcategory management
- Excel import/export for categories
- Image upload and management
- Stock quantity tracking
- Product search and filtering

### Shopping Experience
- Shopping cart functionality
- Wishlist management
- Product reviews and ratings
- Advanced search with filters
- Price range filtering
- Category-based browsing

### Order Management
- Complete checkout process
- Stripe payment integration
- Order tracking
- Order history
- Invoice generation

### Admin Dashboard
- Product analytics
- Stock management
- Order management
- User management
- Sales reports
- Activity logs

### Additional Features
- Real-time stock updates
- Email notifications
- Activity logging
- Responsive design
- SEO optimization
- Performance optimization

## 📝 API Endpoints (To be implemented)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository. 