const jwt = require('jsonwebtoken');
const fs = require('fs');

// Your Apple Developer details
const TEAM_ID = '4N56F3GPC6';              // Your Team ID ✅
const KEY_ID = 'DJF9VQX646';               // Replace with your actual Key ID
const CLIENT_ID = 'com.tenista.app.signin';  // Your Service ID
const PRIVATE_KEY_PATH = './AuthKey_DJF9VQX646.p8'; // Path to your .p8 file

console.log('🍎 Generating Apple Sign-In JWT Token...\n');

try {
  // Check if private key file exists
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error(`Private key file not found: ${PRIVATE_KEY_PATH}`);
  }

  // Read the private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  
  // Create current timestamp and expiration (6 months from now)
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (86400 * 180); // 6 months
  
  console.log(`📅 Token valid from: ${new Date(now * 1000).toLocaleString()}`);
  console.log(`📅 Token expires: ${new Date(exp * 1000).toLocaleString()}\n`);
  
  // Create the JWT token
  const token = jwt.sign({
    iss: TEAM_ID,
    iat: now,
    exp: exp,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  }, privateKey, {
    algorithm: 'ES256',
    keyid: KEY_ID
  });
  
  console.log('✅ JWT Token Generated Successfully!\n');
  console.log('🔑 Your Apple Sign-In JWT Token:');
  console.log('─'.repeat(60));
  console.log(token);
  console.log('─'.repeat(60));
  console.log('\n📋 Next steps:');
  console.log('1. Copy the token above');
  console.log('2. Go to your Supabase dashboard');
  console.log('3. Navigate to Authentication > Providers > Apple');
  console.log('4. Paste this token in the "Secret Key" field');
  console.log(`5. Use "${CLIENT_ID}" as the Client ID`);
  
} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure you have created and downloaded your .p8 file from Apple Developer Console');
  console.log('2. Update KEY_ID with your actual 10-character Key ID');
  console.log('3. Update PRIVATE_KEY_PATH to point to your .p8 file');
  console.log('4. Run: npm install jsonwebtoken');
  
  if (error.message.includes('Private key file not found')) {
    console.log('\n📁 Expected file location:');
    console.log(`   ${PRIVATE_KEY_PATH}`);
    console.log('\n   Make sure your .p8 file is in the same directory as this script');
  }
}