# GameStore API - Postman Testing Guide

## 🚀 **Setup Instructions**

### **1. Import Postman Collection and Environment**

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `GameStore_API.postman_collection.json`
   - The collection will be imported with all API endpoints

2. **Import Environment:**
   - Click "Import" button again
   - Select `GameStore_API.postman_environment.json`
   - Select the "GameStore API Environment" from the environment dropdown

### **2. Start the Backend Server**

```bash
cd backend
npm run setup-db  # First time setup
npm run dev       # Start the server
```

The server will run on `http://localhost:5000`

## 🔐 **Authentication Testing**

### **Session-Based Authentication (Passport Local)**

1. **Register a New User:**
   - Use the "Register User" request
   - This creates a new user account
   - The response will include user details

2. **Login with Local Strategy:**
   - Use the "Login User (Local)" request
   - This will:
     - Authenticate the user
     - Create a session
     - Set session cookies automatically
     - Return a JWT token

3. **Test Session Persistence:**
   - After login, the session cookie is automatically included in subsequent requests
   - Test with "Get Current User" request
   - The session should persist across requests

### **JWT Token Authentication**

1. **Get JWT Token:**
   - After login, the JWT token is stored in the environment variable `auth_token`
   - This token is automatically included in requests that require authentication

2. **Test JWT Authentication:**
   - Use any authenticated endpoint (e.g., "Get User Cart")
   - The token is automatically sent in the Authorization header

### **Google OAuth Testing**

1. **Initiate Google OAuth:**
   - Use "Google OAuth - Initiate" request
   - This redirects to Google's OAuth consent screen

2. **Handle OAuth Callback:**
   - After Google authentication, use "Google OAuth - Callback"
   - This completes the OAuth flow and creates a user session

**Note:** Google OAuth requires proper Google OAuth credentials to be configured in the backend.

## 📋 **Testing Flow**

### **Phase 1: Basic Setup**

1. **Health Check:**
   ```
   GET /health
   ```
   - Should return server status

2. **Register User:**
   ```
   POST /api/auth/register
   ```
   - Creates a new user account
   - Use the provided user credentials

3. **Login User:**
   ```
   POST /api/auth/login
   ```
   - Authenticates the user
   - Sets session cookies and JWT token

### **Phase 2: Product Management**

1. **Get All Products:**
   ```
   GET /api/products
   ```
   - Lists all available products
   - Test pagination and filtering

2. **Search Products:**
   ```
   GET /api/products/search?q=action
   ```
   - Search products by keyword
   - Test various search parameters

3. **Get Product Details:**
   ```
   GET /api/products/slug/sample-action-game
   ```
   - Get specific product information

### **Phase 3: Shopping Cart**

1. **Add Item to Cart:**
   ```
   POST /api/cart/items
   ```
   - Add products to shopping cart
   - Test with different quantities

2. **Get Cart:**
   ```
   GET /api/cart
   ```
   - View current cart contents
   - Verify items were added correctly

3. **Update Cart Item:**
   ```
   PUT /api/cart/items/{id}
   ```
   - Modify item quantities
   - Test stock validation

4. **Apply Coupon:**
   ```
   POST /api/cart/coupon
   ```
   - Test coupon codes: `WELCOME10`, `SAVE20`, `FREESHIP`

### **Phase 4: Reviews and Ratings**

1. **Create Review:**
   ```
   POST /api/reviews/product/{product_id}
   ```
   - Add a product review
   - Test rating validation (1-5 stars)

2. **Get Product Reviews:**
   ```
   GET /api/reviews/product/{product_id}
   ```
   - View all reviews for a product
   - Test sorting and pagination

3. **Update Review:**
   ```
   PUT /api/reviews/{review_id}
   ```
   - Modify existing review
   - Test user ownership validation

### **Phase 5: Order Management**

1. **Create Order:**
   ```
   POST /api/orders
   ```
   - Place an order with cart items
   - Include shipping and billing addresses
   - Test payment method validation

2. **Get User Orders:**
   ```
   GET /api/orders
   ```
   - View order history
   - Test order status tracking

3. **Cancel Order:**
   ```
   POST /api/orders/{order_id}/cancel
   ```
   - Cancel an existing order
   - Test cancellation rules

### **Phase 6: Admin Functions**

1. **Login as Admin:**
   ```
   POST /api/auth/login
   ```
   - Use admin credentials: `admin@gamestore.com` / `admin123`

2. **Get Dashboard Stats:**
   ```
   GET /api/admin/dashboard
   ```
   - View admin dashboard statistics

3. **Manage Categories:**
   ```
   POST /api/categories
   PUT /api/categories/{id}
   DELETE /api/categories/{id}
   ```
   - Create, update, and delete categories

4. **Moderate Reviews:**
   ```
   PUT /api/reviews/admin/{review_id}/moderate
   ```
   - Approve or reject user reviews

5. **Manage Orders:**
   ```
   GET /api/admin/orders
   PUT /api/admin/orders/{id}/status
   ```
   - View all orders and update status

## 🔧 **Environment Variables**

The Postman environment includes these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:5000` |
| `auth_token` | JWT token for user | Auto-set after login |
| `admin_token` | JWT token for admin | Auto-set after admin login |
| `session_cookie` | Session cookie | Auto-set after login |
| `user_id` | Current user ID | Auto-set after login |
| `product_id` | Product ID for testing | `1` |
| `category_id` | Category ID for testing | `1` |

## 🧪 **Test Scripts**

### **Login Test Script**

The login requests include test scripts that automatically:
- Store the JWT token in `auth_token`
- Store the session cookie in `session_cookie`
- Store user ID in `user_id`

### **Response Validation**

Each request includes basic response validation:
- Status code checks
- Success property validation
- Data structure validation

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Authentication Errors:**
   - Ensure the server is running
   - Check that JWT tokens are valid
   - Verify session cookies are set

2. **Database Connection:**
   - Run `npm run setup-db` to initialize the database
   - Check PostgreSQL is running
   - Verify database credentials

3. **CORS Issues:**
   - Ensure the frontend URL is configured correctly
   - Check CORS settings in the backend

4. **File Upload Issues:**
   - Ensure the uploads directory exists
   - Check file size limits
   - Verify file type restrictions

### **Debug Steps**

1. **Check Server Logs:**
   ```bash
   npm run dev
   ```
   - Monitor console output for errors

2. **Test Database Connection:**
   ```bash
   npm run setup-db
   ```
   - Verify database is accessible

3. **Check Environment Variables:**
   - Ensure `.env` file is configured
   - Verify all required variables are set

## 📊 **Expected Responses**

### **Success Response Format**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### **Error Response Format**
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

## 🎯 **Testing Checklist**

- [ ] Health check endpoint responds
- [ ] User registration works
- [ ] User login creates session and JWT
- [ ] JWT authentication works for protected routes
- [ ] Session cookies persist across requests
- [ ] Product listing and search work
- [ ] Shopping cart functionality works
- [ ] Review system works
- [ ] Order creation and management work
- [ ] Admin functions require admin role
- [ ] File uploads work
- [ ] Error handling works correctly
- [ ] Rate limiting is enforced
- [ ] CORS is configured correctly

## 🚀 **Next Steps**

After successful API testing:

1. **Frontend Development:**
   - Use the tested API endpoints in your React frontend
   - Implement proper error handling
   - Add loading states

2. **Production Deployment:**
   - Configure production environment variables
   - Set up proper SSL certificates
   - Configure production database

3. **Monitoring:**
   - Set up API monitoring
   - Configure logging
   - Set up error tracking

---

**🎉 Your GameStore API is now fully tested and ready for frontend development!** 