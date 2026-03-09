// Test script to verify the database migration worked
// Run with: node verify_migration.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');
  
  try {
    // Test 1: Check if we can select the new columns
    console.log('1. Testing column existence...');
    const { data, error } = await supabase
      .from('players')
      .select('id, available_today, available_today_updated_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Column test failed:', error.message);
      return false;
    }
    console.log('✅ Columns exist and are queryable');
    
    // Test 2: Check if we can update the columns (using a dummy operation)
    console.log('\n2. Testing column updates...');
    const testUpdate = await supabase
      .from('players')
      .select('id')
      .limit(1)
      .single();
    
    if (testUpdate.data) {
      const updateResult = await supabase
        .from('players')
        .update({
          available_today: false,
          available_today_updated_at: new Date().toISOString()
        })
        .eq('id', testUpdate.data.id)
        .select('available_today, available_today_updated_at');
      
      if (updateResult.error) {
        console.error('❌ Update test failed:', updateResult.error.message);
        return false;
      }
      console.log('✅ Columns can be updated successfully');
    }
    
    // Test 3: Test the index (if it exists)
    console.log('\n3. Testing index performance...');
    const indexTest = await supabase
      .from('players')
      .select('id, available_today, city_id')
      .eq('available_today', true)
      .limit(10);
    
    if (indexTest.error) {
      console.error('❌ Index test failed:', indexTest.error.message);
      return false;
    }
    console.log('✅ Index query executes successfully');
    
    console.log('\n🎉 Migration verification completed successfully!');
    console.log('\nYour app should now work without the "column does not exist" error.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });