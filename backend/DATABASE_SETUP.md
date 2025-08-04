# GameStore Database Setup Guide

## 🗄️ **PostgreSQL Database Setup**

This guide will help you set up the PostgreSQL database for the GameStore backend.

## 📋 **Prerequisites**

- PostgreSQL installed and running
- Node.js and npm installed
- GameStore backend code

## 🔧 **Step 1: Verify PostgreSQL Installation**

```bash
# Check if PostgreSQL is installed
which psql

# Check if PostgreSQL service is running
brew services list | grep postgresql
```

## 🚀 **Step 2: Start PostgreSQL (if not running)**

```bash
# Start PostgreSQL service
brew services start postgresql@14

# Or start manually
pg_ctl -D /usr/local/var/postgresql@14 start
```

## 👤 **Step 3: Set Up Database User**

You need to set a password for your PostgreSQL user. Run these commands:

```bash
# Connect to PostgreSQL as your user
psql postgres

# Set a password for your user (replace 'qbatch' with your username)
ALTER USER qbatch PASSWORD 'password';

# Exit PostgreSQL
\q
```

**Alternative method if the above doesn't work:**

```bash
# Try connecting as postgres superuser
sudo -u postgres psql

# Create a new user with password
CREATE USER qbatch WITH PASSWORD 'password' SUPERUSER;

# Exit PostgreSQL
\q
```

## 🗃️ **Step 4: Create Database**

```bash
# Create the database
createdb gamestore_db

# Verify database was created
psql -l | grep gamestore_db
```

## ⚙️ **Step 5: Configure Environment Variables**

Create a `.env` file in the backend directory:

```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your database configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamestore_db
DB_USER=qbatch
DB_PASSWORD=password
DB_DIALECT=postgres

# Other configurations...
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
```

## 🔄 **Step 6: Run Database Setup**

```bash
# Install dependencies (if not already done)
npm install

# Run the database setup script
npm run setup-db
```

## ✅ **Step 7: Verify Setup**

After running the setup script, you should see:

```
🎉 Database setup completed successfully!

📊 Database Summary:
   Database: gamestore_db
   Host: localhost:5432
   Admin User: admin@gamestore.com / admin123

🚀 You can now start the server with: npm run dev
```

## 🚀 **Step 8: Start the Server**

```bash
# Start the development server
npm run dev
```

## 🧪 **Step 9: Test the API**

Once the server is running, test the health endpoint:

```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "message": "GameStore API is running",
  "timestamp": "2025-08-04T..."
}
```

## 🔍 **Troubleshooting**

### **Connection Issues**

If you get connection errors:

1. **Check if PostgreSQL is running:**
   ```bash
   brew services list | grep postgresql
   ```

2. **Check if you can connect manually:**
   ```bash
   psql -d gamestore_db -U qbatch
   ```

3. **Reset PostgreSQL service:**
   ```bash
   brew services stop postgresql@14
   brew services start postgresql@14
   ```

### **Authentication Issues**

If you get authentication errors:

1. **Reset user password:**
   ```bash
   psql postgres
   ALTER USER qbatch PASSWORD 'password';
   \q
   ```

2. **Create new user:**
   ```bash
   createuser -s qbatch
   psql postgres
   ALTER USER qbatch PASSWORD 'password';
   \q
   ```

### **Database Creation Issues**

If you can't create the database:

1. **Check permissions:**
   ```bash
   psql postgres -c "SELECT rolname, rolsuper FROM pg_roles WHERE rolname = 'qbatch';"
   ```

2. **Grant permissions:**
   ```bash
   psql postgres
   ALTER USER qbatch CREATEDB;
   \q
   ```

## 📊 **Database Schema**

After successful setup, you'll have these tables:

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

## 🎯 **Sample Data**

The setup script creates:

- **Admin User:** admin@gamestore.com / admin123
- **Categories:** Action Games, RPG Games, Strategy Games
- **Subcategories:** First-Person Shooters, Open World RPG
- **Sample Products:** Sample Action Game, Sample RPG Game

## 🚀 **Next Steps**

After successful database setup:

1. **Start the server:** `npm run dev`
2. **Test API endpoints** using tools like Postman or curl
3. **Begin frontend development**
4. **Add more sample data** as needed

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Verify PostgreSQL is running and accessible
3. Ensure your user has proper permissions
4. Check the console output for specific error messages

---

**🎉 Congratulations! Your GameStore database is now set up and ready to use!** 