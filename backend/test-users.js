const { sequelize } = require('./src/config/database/config');
const User = require('./src/models/User');

async function testUsers() {
  try {
    console.log('🔍 Testing database users...\n');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'is_active', 'email_verified', 'created_at']
    });

    console.log(`📊 Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    // Test specific users
    console.log('🔍 Testing specific user lookups:\n');

    const adminUser = await User.findByEmail('admin@gamestore.com');
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.is_active}\n`);
    } else {
      console.log('❌ Admin user not found\n');
    }

    const regularUser = await User.findByEmail('user@example.com');
    if (regularUser) {
      console.log('✅ Regular user found:');
      console.log(`   ID: ${regularUser.id}`);
      console.log(`   Email: ${regularUser.email}`);
      console.log(`   Role: ${regularUser.role}`);
      console.log(`   Active: ${regularUser.is_active}\n`);
    } else {
      console.log('❌ Regular user not found\n');
    }

  } catch (error) {
    console.error('❌ Error testing users:', error);
  } finally {
    await sequelize.close();
  }
}

testUsers(); 