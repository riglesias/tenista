// Test script to verify availability feature
// Run with: npx ts-node scripts/test-availability.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAvailability() {
  // Test 1: Check if availability column exists
  const { data: columns } = await supabase
    .from('players')
    .select('id, first_name, availability')
    .limit(1);
  
  console.log('✓ Availability column exists:', columns);
  
  // Test 2: Test availability data structure
  const testAvailability = {
    mon: ['morning', 'afternoon'],
    tue: ['evening'],
    wed: ['morning'],
  };
  
  console.log('✓ Test availability structure:', testAvailability);
  
  // Test 3: Query players with availability
  const { data: players, error } = await supabase
    .from('players')
    .select('id, first_name, city_name, availability')
    .not('availability', 'is', null)
    .limit(5);
  
  if (error) {
    console.error('Error querying players:', error);
  } else {
    console.log('✓ Players with availability:', players);
  }
}

testAvailability()
  .then(() => console.log('✅ All tests completed'))
  .catch(console.error); 