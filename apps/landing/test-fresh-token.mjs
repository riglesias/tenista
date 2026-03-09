#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const TEST_EMAIL = process.argv[2];

if (!TEST_EMAIL) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node test-fresh-token.mjs your-email@example.com');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔄 Creating Fresh Password Reset Token');
console.log('=====================================\n');

async function createFreshToken() {
  try {
    console.log('📧 Sending to:', TEST_EMAIL);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // For production deployment
    const prodUrl = 'https://www.tenista.app/auth/confirm';
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: 'https://www.tenista.app/reset-password',
    });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Email sent successfully!\n');
    console.log('📋 Next Steps:');
    console.log('1. Check your email IMMEDIATELY (token expires in 1 hour)');
    console.log('2. Look for the reset password email from Supabase');
    console.log('3. In the email, find the link that looks like:');
    console.log('   https://[your-project].supabase.co/auth/v1/verify?token=...&type=recovery');
    console.log('4. Extract the token parameter (NOT token_hash)');
    console.log('5. The token is the long string after "token="');
    console.log('\n⚠️  IMPORTANT:');
    console.log('- Use the token immediately (expires in 1 hour)');
    console.log('- Each token can only be used ONCE');
    console.log('- If you click the link in the email, the token is consumed');
    console.log('\n🔍 To test the token:');
    console.log('1. Visit: http://localhost:3002/debug-token');
    console.log('2. Paste the token value (not the full URL)');
    console.log('3. Click Verify to test it');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createFreshToken();