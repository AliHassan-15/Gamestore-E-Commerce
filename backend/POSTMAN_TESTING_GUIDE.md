# 🧪 GameStore API - Complete Testing Guide

## 📋 Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Testing Flow](#testing-flow)
3. [Authentication Testing](#authentication-testing)
4. [Core Features Testing](#core-features-testing)
5. [Advanced Features Testing](#advanced-features-testing)
6. [Background Services Testing](#background-services-testing)
7. [Redis & Caching Testing](#redis--caching-testing)
8. [Inventory Management Testing](#inventory-management-testing)
9. [Admin Dashboard Testing](#admin-dashboard-testing)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Instructions

### Prerequisites
- ✅ PostgreSQL database running
- ✅ Redis server running
- ✅ Node.js and npm installed
- ✅ Postman installed

### 1. Database Setup
```bash
# Follow the DATABASE_SETUP.md guide first
cd backend
npm install
npm run setup-db
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env with your database and Redis credentials
# Make sure to set:
# - DB_USER, DB_PASSWORD, DB_NAME
# - REDIS_HOST, REDIS_PORT
# - JWT_SECRET, SESSION_SECRET
# - STRIPE_SECRET_KEY (test mode)
```

### 3. Start the Server
```bash
npm run dev
```

### 4. Import Postman Collection
1. Open Postman
2. Click "Import" button
3. Import `GameStore_API.postman_collection.json`
4. Import `GameStore_API.postman_environment.json`
5. Select the "GameStore API Environment"

---

## 🔄 Testing Flow

### Recommended Testing Order:
1. **Health Check** - Verify server is running
2. **Authentication** - Register and login users
3. **Categories** - Create gaming categories
4. **Products** - Create gaming products
5. **Cart & Orders** - Test shopping flow
6. **Reviews** - Test review system
7. **Inventory** - Test stock management
8. **Admin Features** - Test admin dashboard
9. **Background Services** - Test automated processes
10. **Redis Features** - Test caching and rate limiting

---

## 🔐 Authentication Testing

### Step 1: Health Check
**Request:** `GET /health`
- ✅ Should return status 200
- ✅ Should show server is running
- ✅ Should show Redis and background services status

### Step 2: Register User
**Request:** `POST /api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "buyer"
}
```
**Expected Response:**
- ✅ Status 201
- ✅ User created successfully
- ✅ JWT token returned
- ✅ User ID stored in environment

### Step 3: Login User
**Request:** `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Expected Response:**
- ✅ Status 200
- ✅ JWT token returned
- ✅ Session cookie set
- ✅ Token stored in environment

### Step 4: Login Admin
**Request:** `POST /api/auth/login`
```json
{
  "email": "admin@gamestore.com",
  "password": "admin123"
}
```
**Expected Response:**
- ✅ Status 200
- ✅ Admin token returned
- ✅ Admin ID stored in environment

### Step 5: Get Current User
**Request:** `GET /api/auth/me`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ User details returned
- ✅ Role information included

---

## 🎮 Core Features Testing

### Step 6: Create Categories
**Request:** `POST /api/categories`
**Headers:** `Authorization: Bearer {{admin_token}}`
```json
{
  "name": "Gaming Accessories",
  "description": "High-quality gaming accessories and peripherals",
  "is_active": true
}
```
**Expected Response:**
- ✅ Status 201
- ✅ Category created
- ✅ Category ID stored in environment

### Step 7: Create Product
**Request:** `POST /api/products`
**Headers:** `Authorization: Bearer {{admin_token}}`
```json
{
  "name": "Gaming Mouse Pro",
  "description": "High-performance gaming mouse with RGB lighting",
  "price": 79.99,
  "category_id": 1,
  "subcategory_id": 1,
  "sku": "GM-PRO-001",
  "stock_quantity": 50,
  "is_featured": true,
  "tags": ["gaming", "mouse", "rgb"]
}
```
**Expected Response:**
- ✅ Status 201
- ✅ Product created
- ✅ Product ID and slug stored in environment

### Step 8: Get Products
**Request:** `GET /api/products`
**Expected Response:**
- ✅ Status 200
- ✅ Products list returned
- ✅ Pagination working
- ✅ Cache headers present (X-Cache: MISS first time, HIT second time)

### Step 9: Search Products
**Request:** `GET /api/products/search?q=gaming&category=1&min_price=10&max_price=100`
**Expected Response:**
- ✅ Status 200
- ✅ Filtered results returned
- ✅ Search parameters working

---

## 🛒 Shopping Cart Testing

### Step 10: Add to Cart
**Request:** `POST /api/cart/items`
**Headers:** `Authorization: Bearer {{auth_token}}`
```json
{
  "product_id": "{{product_id}}",
  "quantity": 2
}
```
**Expected Response:**
- ✅ Status 201
- ✅ Item added to cart
- ✅ Cart item ID stored in environment

### Step 11: Get Cart
**Request:** `GET /api/cart`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Cart items returned
- ✅ Product details included

### Step 12: Update Cart Item
**Request:** `PUT /api/cart/items/{{cart_item_id}}`
**Headers:** `Authorization: Bearer {{auth_token}}`
```json
{
  "quantity": 3
}
```
**Expected Response:**
- ✅ Status 200
- ✅ Quantity updated

### Step 13: Get Cart Summary
**Request:** `GET /api/cart/summary`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Total calculation correct
- ✅ Tax and shipping included

---

## 📦 Order Management Testing

### Step 14: Create Order
**Request:** `POST /api/orders`
**Headers:** `Authorization: Bearer {{auth_token}}`
```json
{
  "items": [
    {
      "product_id": "{{product_id}}",
      "quantity": 1
    }
  ],
  "shipping_address_id": 1,
  "payment_method_id": 1
}
```
**Expected Response:**
- ✅ Status 201
- ✅ Order created
- ✅ Order ID stored in environment
- ✅ Inventory automatically reduced

### Step 15: Get User Orders
**Request:** `GET /api/orders`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ User's orders returned
- ✅ Order status included

### Step 16: Get Order Details
**Request:** `GET /api/orders/{{order_id}}`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Complete order details
- ✅ Items and totals included

---

## ⭐ Review System Testing

### Step 17: Create Review (Will Fail - Purchase Required)
**Request:** `POST /api/reviews/product/{{product_id}}`
**Headers:** `Authorization: Bearer {{auth_token}}`
```json
{
  "rating": 5,
  "title": "Amazing Gaming Mouse!",
  "comment": "This mouse is perfect for gaming. Great precision and RGB lighting."
}
```
**Expected Response:**
- ✅ Status 403 (Forbidden)
- ✅ Error message about purchase requirement

### Step 18: Get Product Reviews
**Request:** `GET /api/reviews/product/{{product_id}}`
**Expected Response:**
- ✅ Status 200
- ✅ Reviews list returned
- ✅ Rating statistics included

---

## 📊 Inventory Management Testing

### Step 19: Get Product Inventory History
**Request:** `GET /api/inventory/product/{{product_id}}/history`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Transaction history returned
- ✅ Order-related transactions visible

### Step 20: Add Stock
**Request:** `POST /api/inventory/add-stock`
**Headers:** `Authorization: Bearer {{admin_token}}`
```json
{
  "product_id": "{{product_id}}",
  "quantity": 25,
  "unit_cost": 45.00,
  "notes": "Restocking from supplier"
}
```
**Expected Response:**
- ✅ Status 200
- ✅ Stock added successfully
- ✅ Transaction logged
- ✅ Product stock updated

### Step 21: Adjust Stock
**Request:** `POST /api/inventory/adjust-stock`
**Headers:** `Authorization: Bearer {{admin_token}}`
```json
{
  "product_id": "{{product_id}}",
  "quantity": -5,
  "reason": "Damaged items removed"
}
```
**Expected Response:**
- ✅ Status 200
- ✅ Stock adjusted
- ✅ Transaction logged

### Step 22: Get Inventory Statistics
**Request:** `GET /api/inventory/stats`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Statistics returned
- ✅ Total products, low stock, etc.

### Step 23: Get Low Stock Alerts
**Request:** `GET /api/inventory/low-stock?threshold=10`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Low stock products listed
- ✅ Threshold parameter working

---

## 👨‍💼 Admin Dashboard Testing

### Step 24: Get Dashboard Statistics
**Request:** `GET /api/admin/dashboard`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Dashboard stats returned
- ✅ Sales, orders, users data

### Step 25: Get All Users
**Request:** `GET /api/admin/users`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ All users returned
- ✅ Pagination working

### Step 26: Get All Orders (Admin)
**Request:** `GET /api/admin/orders`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ All orders returned
- ✅ User details included

### Step 27: Update Order Status
**Request:** `PUT /api/admin/orders/{{order_id}}/status`
**Headers:** `Authorization: Bearer {{admin_token}}`
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456789"
}
```
**Expected Response:**
- ✅ Status 200
- ✅ Order status updated
- ✅ Tracking number added

### Step 28: Get All Reviews (Moderation)
**Request:** `GET /api/admin/reviews`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ All reviews returned
- ✅ Moderation data included

---

## 🔄 Background Services Testing

### Step 29: Get Background Service Status
**Request:** `GET /api/admin/background/status`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Service status returned
- ✅ Uptime information

### Step 30: Process Order Manually
**Request:** `POST /api/admin/background/process-order/{{order_id}}`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Expected Response:**
- ✅ Status 200
- ✅ Order processing initiated
- ✅ Background job started

### Step 31: Monitor Order Status Changes
**Wait 5-10 minutes, then:**
**Request:** `GET /api/orders/{{order_id}}`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ Status should change from "pending" to "processing"
- ✅ Eventually to "shipped" and "delivered"
- ✅ Tracking number added automatically

---

## 🧠 Redis & Caching Testing

### Step 32: Test Cache Headers
**Request:** `GET /api/categories`
**Expected Response:**
- ✅ First request: `X-Cache: MISS`
- ✅ Second request: `X-Cache: HIT`
- ✅ Cache TTL headers present

### Step 33: Test Rate Limiting
**Make multiple rapid requests to:**
**Request:** `GET /api/products`
**Expected Response:**
- ✅ First 100 requests: Status 200
- ✅ After limit: Status 429 (Too Many Requests)
- ✅ Rate limit headers present

### Step 34: Test User-Specific Rate Limiting
**Make multiple rapid requests to:**
**Request:** `GET /api/cart`
**Headers:** `Authorization: Bearer {{auth_token}}`
**Expected Response:**
- ✅ User-specific rate limits applied
- ✅ Different limits for different endpoints

---

## 📁 File Upload Testing

### Step 35: Upload Product Image
**Request:** `POST /api/upload/product-image`
**Headers:** `Authorization: Bearer {{admin_token}}`
**Body:** Form-data
- `image`: [Select image file]
- `product_id`: `{{product_id}}`
**Expected Response:**
- ✅ Status 201
- ✅ Image uploaded successfully
- ✅ URL returned
- ✅ Image accessible via URL

---

## 🧪 Advanced Testing Scenarios

### Scenario 1: Complete E-commerce Flow
1. Register user
2. Browse products
3. Add items to cart
4. Create order
5. Monitor order status changes
6. Leave review (after delivery)

### Scenario 2: Admin Management Flow
1. Login as admin
2. Create categories and products
3. Manage inventory
4. Process orders
5. Moderate reviews
6. View analytics

### Scenario 3: Performance Testing
1. Test caching effectiveness
2. Monitor rate limiting
3. Check background service performance
4. Verify Redis connection

---

## 🔧 Troubleshooting

### Common Issues:

#### 1. Database Connection Error
**Error:** `password authentication failed`
**Solution:** 
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Run `npm run setup-db`

#### 2. Redis Connection Error
**Error:** `Redis connection failed`
**Solution:**
- Start Redis server: `redis-server`
- Check Redis configuration in `.env`
- Verify Redis port (default: 6379)

#### 3. JWT Token Expired
**Error:** `401 Unauthorized`
**Solution:**
- Re-login to get new token
- Check token expiration time
- Verify JWT_SECRET in `.env`

#### 4. Rate Limiting
**Error:** `429 Too Many Requests`
**Solution:**
- Wait for rate limit window to reset
- Check rate limit headers
- Reduce request frequency

#### 5. File Upload Issues
**Error:** `File upload failed`
**Solution:**
- Check upload directory permissions
- Verify file size limits
- Ensure correct content-type

### Debug Commands:

```bash
# Check server logs
npm run dev

# Check database connection
psql -U your_username -d gamestore_db

# Check Redis connection
redis-cli ping

# Check environment variables
node -e "console.log(require('dotenv').config())"
```

---

## 📊 Expected Response Formats

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Pagination Response:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "limit": 20
    }
  }
}
```

---

## ✅ Testing Checklist

### Authentication ✅
- [ ] Health check working
- [ ] User registration
- [ ] User login
- [ ] Admin login
- [ ] JWT token validation
- [ ] Session management

### Products ✅
- [ ] Create products
- [ ] List products
- [ ] Search products
- [ ] Product details
- [ ] Featured products

### Cart & Orders ✅
- [ ] Add to cart
- [ ] Update cart
- [ ] Create orders
- [ ] Order history
- [ ] Order status updates

### Reviews ✅
- [ ] Purchase verification
- [ ] Create reviews
- [ ] List reviews
- [ ] Review moderation

### Inventory ✅
- [ ] Stock management
- [ ] Inventory transactions
- [ ] Low stock alerts
- [ ] Inventory statistics

### Admin Features ✅
- [ ] Dashboard statistics
- [ ] User management
- [ ] Order management
- [ ] Review moderation

### Background Services ✅
- [ ] Order processing
- [ ] Status updates
- [ ] Service monitoring

### Redis Features ✅
- [ ] Caching
- [ ] Rate limiting
- [ ] Cache invalidation

### File Upload ✅
- [ ] Product images
- [ ] File validation
- [ ] Image processing

---

## 🎉 Success Criteria

Your GameStore API is working correctly when:

1. ✅ All authentication flows work
2. ✅ Complete e-commerce flow functions
3. ✅ Admin dashboard is accessible
4. ✅ Background services are running
5. ✅ Redis caching is working
6. ✅ Rate limiting is active
7. ✅ File uploads succeed
8. ✅ Inventory management works
9. ✅ Review system enforces purchase verification
10. ✅ All API endpoints return proper responses

**🎯 Congratulations! Your GameStore backend is fully functional and production-ready!** 