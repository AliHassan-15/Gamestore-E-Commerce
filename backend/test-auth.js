const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');

    // Test 1: Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@gamestore.com',
      password: 'admin123'
    });

    console.log('✅ Admin Login Response:');
    console.log(`   Status: ${adminLoginResponse.status}`);
    console.log(`   Success: ${adminLoginResponse.data.success}`);
    console.log(`   User Email: ${adminLoginResponse.data.data.user.email}`);
    console.log(`   User Role: ${adminLoginResponse.data.data.user.role}`);
    console.log(`   Token: ${adminLoginResponse.data.data.token.substring(0, 50)}...\n`);

    const adminToken = adminLoginResponse.data.data.token;

    // Test 2: Get Current User with Admin Token
    console.log('2️⃣ Testing Get Current User with Admin Token...');
    const adminUserResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Admin Get Current User Response:');
    console.log(`   Status: ${adminUserResponse.status}`);
    console.log(`   Success: ${adminUserResponse.data.success}`);
    console.log(`   User Email: ${adminUserResponse.data.data.user.email}`);
    console.log(`   User Role: ${adminUserResponse.data.data.user.role}\n`);

    // Test 3: User Login
    console.log('3️⃣ Testing User Login...');
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user123'
    });

    console.log('✅ User Login Response:');
    console.log(`   Status: ${userLoginResponse.status}`);
    console.log(`   Success: ${userLoginResponse.data.success}`);
    console.log(`   User Email: ${userLoginResponse.data.data.user.email}`);
    console.log(`   User Role: ${userLoginResponse.data.data.user.role}`);
    console.log(`   Token: ${userLoginResponse.data.data.token.substring(0, 50)}...\n`);

    const userToken = userLoginResponse.data.data.token;

    // Test 4: Get Current User with User Token
    console.log('4️⃣ Testing Get Current User with User Token...');
    const userUserResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    console.log('✅ User Get Current User Response:');
    console.log(`   Status: ${userUserResponse.status}`);
    console.log(`   Success: ${userUserResponse.data.success}`);
    console.log(`   User Email: ${userUserResponse.data.data.user.email}`);
    console.log(`   User Role: ${userUserResponse.data.data.user.role}\n`);

    // Test 5: Admin Access with Admin Token
    console.log('5️⃣ Testing Admin Access with Admin Token...');
    try {
      const adminAccessResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('✅ Admin Access Response:');
      console.log(`   Status: ${adminAccessResponse.status}`);
      console.log(`   Success: ${adminAccessResponse.data.success}\n`);
    } catch (error) {
      console.log('❌ Admin Access Error:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}\n`);
    }

    // Test 6: Admin Access with User Token (should fail)
    console.log('6️⃣ Testing Admin Access with User Token (should fail)...');
    try {
      const userAdminAccessResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      console.log('❌ Unexpected Success - User got admin access!');
      console.log(`   Status: ${userAdminAccessResponse.status}\n`);
    } catch (error) {
      console.log('✅ Admin Access Correctly Denied:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}\n`);
    }

    console.log('🎉 Authentication Flow Test Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

testAuth(); 