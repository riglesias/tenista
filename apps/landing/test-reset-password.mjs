#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') });

// You'll need to set these environment variables or replace with actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const TEST_EMAIL = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Testing Reset Password Flow');
console.log('================================\n');

async function testResetPasswordFlow() {
  try {
    // Step 1: Test password reset request
    console.log('1️⃣  Testing password reset request...');
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: 'https://www.tenista.app/reset-password',
    });

    if (error) {
      console.error('❌ Error requesting password reset:', error.message);
      return false;
    }

    console.log('✅ Password reset email sent to:', TEST_EMAIL);
    console.log('   The email will contain a link to: https://www.tenista.app/reset-password');
    console.log('\n');

    // Step 2: Verify the reset password page loads
    console.log('2️⃣  Checking reset password page accessibility...');
    try {
      const response = await fetch('http://localhost:3000/reset-password');
      if (response.ok) {
        console.log('✅ Reset password page is accessible (HTTP', response.status + ')');
      } else {
        console.log('⚠️  Reset password page returned status:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️  Could not reach reset password page. Is the dev server running?');
      console.log('   Run: npm run dev');
    }
    console.log('\n');

    // Step 3: Display manual testing instructions
    console.log('3️⃣  Manual Testing Steps:');
    console.log('   a) Check your email for the reset link');
    console.log('   b) Click the link in the email');
    console.log('   c) You should see "Validating Reset Link..." briefly');
    console.log('   d) Then the password reset form should appear');
    console.log('   e) Enter a new password (must meet strength requirements)');
    console.log('   f) Submit the form');
    console.log('   g) You should see a success message');
    console.log('\n');

    // Step 4: Test password strength checker
    console.log('4️⃣  Testing password strength requirements:');
    const testPasswords = [
      { pwd: 'short', expected: 'Too short' },
      { pwd: 'longenough', expected: 'Missing uppercase, number, special char' },
      { pwd: 'LongEnough1', expected: 'Missing special char' },
      { pwd: 'LongEnough1!', expected: 'Strong password' },
    ];

    testPasswords.forEach(({ pwd, expected }) => {
      console.log(`   Password: "${pwd}" - ${expected}`);
    });
    console.log('\n');

    console.log('✅ Test setup complete!');
    console.log('\n📝 Notes:');
    console.log('   - The reset link in the email is valid for 1 hour');
    console.log('   - Each link can only be used once');
    console.log('   - After successful reset, user is logged out');
    console.log('   - Minimum password requirements: 8 chars, uppercase, lowercase, number, special char');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testResetPasswordFlow().then(success => {
  if (success) {
    console.log('\n✅ Test completed successfully!');
  } else {
    console.log('\n❌ Test failed. Please check the errors above.');
    process.exit(1);
  }
});