const { sequelize } = require('./src/config/database/config');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Subcategory = require('./src/models/Subcategory');
const Product = require('./src/models/Product');


async function setupDatabase() {
  try {
    console.log('🔄 Starting database setup...');

    // Sync database
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');

    // Create admin user
    const adminExists = await User.findOne({
      where: { email: 'admin@gamestore.com' }
    });

    if (!adminExists) {
      await User.create({
        email: 'admin@gamestore.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
        email_verified: true
      });
      console.log('✅ Admin user created: admin@gamestore.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create regular user
    const userExists = await User.findOne({
      where: { email: 'user@example.com' }
    });

    if (!userExists) {
      await User.create({
        email: 'user@example.com',
        password: 'user123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'buyer',
        is_active: true,
        email_verified: true
      });
      console.log('✅ Regular user created: user@example.com / user123');
    } else {
      console.log('ℹ️ Regular user already exists');
    }

    // Create sample categories
    const categories = [
      {
        name: 'Gaming Accessories',
        slug: 'gaming-accessories',
        description: 'High-quality gaming accessories for serious gamers',
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Gaming Consoles',
        slug: 'gaming-consoles',
        description: 'Latest gaming consoles and systems',
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Gaming Headsets',
        slug: 'gaming-headsets',
        description: 'Professional gaming headsets with superior audio',
        is_active: true,
        sort_order: 3
      }
    ];

    for (const categoryData of categories) {
      const categoryExists = await Category.findOne({
        where: { slug: categoryData.slug }
      });

      if (!categoryExists) {
        const category = await Category.create(categoryData);
        console.log(`✅ Category created: ${category.name}`);

        // Create subcategories for each category
        if (category.name === 'Gaming Accessories') {
          await Subcategory.create({
            category_id: category.id,
            name: 'Gaming Mice',
            slug: 'gaming-mice',
            description: 'High-precision gaming mice',
            is_active: true,
            sort_order: 1
          });
          await Subcategory.create({
            category_id: category.id,
            name: 'Gaming Keyboards',
            slug: 'gaming-keyboards',
            description: 'Mechanical gaming keyboards',
            is_active: true,
            sort_order: 2
          });
        }
      }
    }

    // Create sample products
    const products = [
      {
        name: 'Gaming Mouse Pro',
        slug: 'gaming-mouse-pro',
        description: 'High-precision gaming mouse with RGB lighting',
        short_description: 'Professional gaming mouse with 25K DPI sensor',
        price: 79.99,
        sku: 'GM-PRO-001',
        stock_quantity: 50,
        category_id: 1, // Gaming Accessories
        subcategory_id: 1, // Gaming Mice
        is_active: true,
        is_featured: true
      },
      {
        name: 'Mechanical Gaming Keyboard',
        slug: 'mechanical-gaming-keyboard',
        description: 'Cherry MX Blue switches with customizable RGB',
        short_description: 'Premium mechanical keyboard for gaming',
        price: 149.99,
        sku: 'MGK-001',
        stock_quantity: 30,
        category_id: 1, // Gaming Accessories
        subcategory_id: 2, // Gaming Keyboards
        is_active: true,
        is_featured: true
      },
      {
        name: 'Gaming Headset Elite',
        slug: 'gaming-headset-elite',
        description: '7.1 surround sound gaming headset with noise cancellation',
        short_description: 'Professional gaming headset with crystal clear audio',
        price: 129.99,
        sku: 'GHE-001',
        stock_quantity: 25,
        category_id: 3, // Gaming Headsets
        is_active: true,
        is_bestseller: true
      }
    ];

    for (const productData of products) {
      const productExists = await Product.findOne({
        where: { sku: productData.sku }
      });

      if (!productExists) {
        await Product.create(productData);
        console.log(`✅ Product created: ${productData.name}`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('📋 Test Credentials:');
    console.log('   Admin: admin@gamestore.com / admin123');
    console.log('   User: user@example.com / user123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase(); 