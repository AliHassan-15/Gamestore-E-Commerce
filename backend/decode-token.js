const jwt = require('jsonwebtoken');

function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 TOKEN DECODED:');
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Issued At: ${new Date(decoded.iat * 1000).toISOString()}`);
    console.log(`   Expires At: ${new Date(decoded.exp * 1000).toISOString()}`);
    console.log(`   Token Type: ${decoded.typ || 'JWT'}`);
    return decoded;
  } catch (error) {
    console.log('❌ TOKEN DECODE FAILED:');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

// Test with a sample token (replace with your actual token)
const sampleToken = process.argv[2];

if (sampleToken) {
  console.log('🧪 DECODING TOKEN...\n');
  decodeToken(sampleToken);
} else {
  console.log('❌ Please provide a token as argument:');
  console.log('   node decode-token.js <your-jwt-token>');
} 