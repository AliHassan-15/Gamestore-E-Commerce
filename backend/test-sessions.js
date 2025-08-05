const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Store cookies between requests
let cookies = [];

async function testSessions() {
  try {
    console.log('🧪 TESTING NEW SESSION MANAGEMENT SYSTEM...\n');

    // Test 1: User Login
    console.log('1️⃣ USER LOGIN...');
    const userLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user123'
    }, {
      withCredentials: true
    });

    if (userLogin.data.success) {
      console.log('✅ USER LOGIN SUCCESS:');
      console.log(`   User: ${userLogin.data.data.user.email}`);
      console.log(`   Role: ${userLogin.data.data.user.role}`);
      console.log(`   Session ID: ${userLogin.data.data.sessionId}\n`);

      // Store cookies
      const setCookieHeader = userLogin.headers['set-cookie'];
      if (setCookieHeader) {
        cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        console.log('🍪 Cookies stored:', cookies);
      }

      // Test 2: Try to login as admin while user is logged in (should fail)
      console.log('2️⃣ TRYING ADMIN LOGIN WHILE USER LOGGED IN (should fail)...');
      try {
        const adminLoginWhileUserLoggedIn = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'admin@gamestore.com',
          password: 'admin123'
        }, {
          withCredentials: true,
          headers: {
            Cookie: cookies.join('; ')
          }
        });
        console.log('❌ SHOULD HAVE FAILED - Admin login succeeded while user logged in\n');
      } catch (error) {
        console.log('✅ CORRECTLY FAILED:');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message}\n`);
      }

      // Test 3: Get current user (should be user)
      console.log('3️⃣ GET CURRENT USER (should be user)...');
      const currentUser = await axios.get(`${BASE_URL}/api/auth/me`, {
        withCredentials: true,
        headers: {
          Cookie: cookies.join('; ')
        }
      });

      if (currentUser.data.success) {
        console.log('✅ CURRENT USER SUCCESS:');
        console.log(`   User: ${currentUser.data.data.user.email}`);
        console.log(`   Role: ${currentUser.data.data.user.role}\n`);
      }

      // Test 4: User Logout
      console.log('4️⃣ USER LOGOUT...');
      const userLogout = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true,
        headers: {
          Cookie: cookies.join('; ')
        }
      });

      if (userLogout.data.success) {
        console.log('✅ USER LOGOUT SUCCESS\n');
        // Clear cookies
        cookies = [];
      }

      // Test 5: Get current user after logout (should fail)
      console.log('5️⃣ GET CURRENT USER AFTER LOGOUT (should fail)...');
      try {
        const afterLogout = await axios.get(`${BASE_URL}/api/auth/me`, {
          withCredentials: true,
          headers: {
            Cookie: cookies.join('; ')
          }
        });
        console.log('❌ SHOULD HAVE FAILED - User still authenticated after logout\n');
      } catch (error) {
        console.log('✅ CORRECTLY FAILED AFTER LOGOUT:');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message}\n`);
      }

      // Test 6: Admin Login after user logout
      console.log('6️⃣ ADMIN LOGIN AFTER USER LOGOUT...');
      const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@gamestore.com',
        password: 'admin123'
      }, {
        withCredentials: true
      });

      if (adminLogin.data.success) {
        console.log('✅ ADMIN LOGIN SUCCESS:');
        console.log(`   User: ${adminLogin.data.data.user.email}`);
        console.log(`   Role: ${adminLogin.data.data.user.role}`);
        console.log(`   Session ID: ${adminLogin.data.data.sessionId}\n`);

        // Store new cookies
        const setCookieHeader = adminLogin.headers['set-cookie'];
        if (setCookieHeader) {
          cookies = setCookieHeader.map(cookie => cookie.split(';')[0]);
        }

        // Test 7: Get current user (should be admin)
        console.log('7️⃣ GET CURRENT USER (should be admin)...');
        const adminCurrentUser = await axios.get(`${BASE_URL}/api/auth/me`, {
          withCredentials: true,
          headers: {
            Cookie: cookies.join('; ')
          }
        });

        if (adminCurrentUser.data.success) {
          console.log('✅ ADMIN CURRENT USER SUCCESS:');
          console.log(`   User: ${adminCurrentUser.data.data.user.email}`);
          console.log(`   Role: ${adminCurrentUser.data.data.user.role}\n`);
        }

        // Test 8: Admin access
        console.log('8️⃣ TESTING ADMIN ACCESS...');
        try {
          const adminAccess = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
            withCredentials: true,
            headers: {
              Cookie: cookies.join('; ')
            }
          });
          console.log('✅ ADMIN ACCESS SUCCESS\n');
        } catch (error) {
          console.log('❌ ADMIN ACCESS FAILED:');
          console.log(`   Status: ${error.response?.status}`);
          console.log(`   Message: ${error.response?.data?.message}\n`);
        }

        // Test 9: Get active sessions (admin only)
        console.log('9️⃣ GETTING ACTIVE SESSIONS (admin only)...');
        try {
          const activeSessions = await axios.get(`${BASE_URL}/api/auth/sessions`, {
            withCredentials: true,
            headers: {
              Cookie: cookies.join('; ')
            }
          });
          console.log('✅ ACTIVE SESSIONS SUCCESS:');
          console.log(`   Sessions: ${activeSessions.data.data.sessions.length}\n`);
        } catch (error) {
          console.log('❌ ACTIVE SESSIONS FAILED:');
          console.log(`   Status: ${error.response?.status}`);
          console.log(`   Message: ${error.response?.data?.message}\n`);
        }

        // Test 10: Admin Logout
        console.log('🔟 ADMIN LOGOUT...');
        const adminLogout = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
          withCredentials: true,
          headers: {
            Cookie: cookies.join('; ')
          }
        });

        if (adminLogout.data.success) {
          console.log('✅ ADMIN LOGOUT SUCCESS\n');
        }
      }
    }

    console.log('🎉 SESSION MANAGEMENT TEST COMPLETED!');

  } catch (error) {
    console.error('❌ TEST ERROR:', error.response?.data || error.message);
  }
}

testSessions(); 