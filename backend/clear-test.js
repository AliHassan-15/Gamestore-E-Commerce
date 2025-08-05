const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function clearTest() {
  try {
    console.log('🧹 CLEARING ALL TOKENS AND TESTING FRESH...\n');

    // Step 1: Test Admin Login and Get Token
    console.log('1️⃣ ADMIN LOGIN...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@gamestore.com',
      password: 'admin123'
    });

    if (adminLogin.data.success) {
      const adminToken = adminLogin.data.data.token;
      const adminUser = adminLogin.data.data.user;
      
      console.log('✅ ADMIN LOGIN SUCCESS:');
      console.log(`   User ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Token: ${adminToken.substring(0, 30)}...\n`);

      // Step 2: Test Get Current User with Admin Token
      console.log('2️⃣ GET CURRENT USER WITH ADMIN TOKEN...');
      const currentUser = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (currentUser.data.success) {
        const user = currentUser.data.data.user;
        console.log('✅ CURRENT USER SUCCESS:');
        console.log(`   User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}\n`);

        // Step 3: Test Admin Access
        console.log('3️⃣ TESTING ADMIN ACCESS...');
        try {
          const adminAccess = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });
          console.log('✅ ADMIN ACCESS SUCCESS\n');
        } catch (error) {
          console.log('❌ ADMIN ACCESS FAILED:');
          console.log(`   Status: ${error.response?.status}`);
          console.log(`   Message: ${error.response?.data?.message}\n`);
        }

        // Step 4: Test Logout
        console.log('4️⃣ TESTING LOGOUT...');
        try {
          const logout = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });
          console.log('✅ LOGOUT SUCCESS\n');
        } catch (error) {
          console.log('❌ LOGOUT FAILED:');
          console.log(`   Status: ${error.response?.status}`);
          console.log(`   Message: ${error.response?.data?.message}\n`);
        }

        // Step 5: Test Get Current User After Logout (should fail)
        console.log('5️⃣ TESTING GET CURRENT USER AFTER LOGOUT (should fail)...');
        try {
          const afterLogout = await axios.get(`${BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });
          console.log('❌ SHOULD HAVE FAILED - Token still works after logout\n');
        } catch (error) {
          console.log('✅ CORRECTLY FAILED AFTER LOGOUT:');
          console.log(`   Status: ${error.response?.status}`);
          console.log(`   Message: ${error.response?.data?.message}\n`);
        }

      } else {
        console.log('❌ GET CURRENT USER FAILED\n');
      }

    } else {
      console.log('❌ ADMIN LOGIN FAILED\n');
    }

    console.log('🎯 TEST COMPLETED!');

  } catch (error) {
    console.error('❌ TEST ERROR:', error.response?.data || error.message);
  }
}

clearTest(); 