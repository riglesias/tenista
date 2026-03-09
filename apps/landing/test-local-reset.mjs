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
const TEST_EMAIL = process.argv[2] || 'test@example.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Local Reset Password Testing');
console.log('================================\n');

async function testLocalReset() {
  try {
    // Use localhost for local testing
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.tenista.app/api/auth/callback?type=recovery'
      : 'http://localhost:3000/api/auth/callback?type=recovery';

    console.log('1️⃣  Sending password reset email to:', TEST_EMAIL);
    console.log('   Redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Password reset email sent!');
    console.log('\n📧 Check your email and look for:');
    console.log('   1. The link URL in the email');
    console.log('   2. Copy the token_hash parameter from the link');
    console.log('\n🔍 To test locally:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Open the link from the email');
    console.log('   3. Check the console logs in your terminal');
    console.log('   4. Look for "Auth Confirm Debug" messages');
    console.log('\n💡 Common issues:');
    console.log('   - Token expired (tokens expire after 1 hour)');
    console.log('   - Token already used (each token works only once)');
    console.log('   - Wrong redirect URL in Supabase dashboard');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testLocalReset();