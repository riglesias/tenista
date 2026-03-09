const https = require('https')
const http = require('http')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'

async function diagnoseSupabaseInstance() {
  console.log('🔍 Diagnosing Supabase Instance...\n')
  console.log('URL:', supabaseUrl)
  console.log('Reference:', 'zktbpqsqocblwjhcezum')
  
  // Test different endpoints
  const endpoints = [
    '/rest/v1/',
    '/auth/v1/',
    '/storage/v1/',
    '/realtime/v1/'
  ]
  
  console.log('\n📡 Testing Supabase endpoints:')
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${supabaseUrl}${endpoint}`)
      console.log(`  ${endpoint}: ${response.status} ${response.statusText}`)
      
      if (response.status === 401 || response.status === 200) {
        console.log(`    ✅ Service is active`)
      }
      
      // Try to get some info from headers
      const headers = Object.fromEntries(response.headers.entries())
      if (headers['server']) {
        console.log(`    Server: ${headers['server']}`)
      }
      if (headers['x-supabase-version']) {
        console.log(`    Supabase Version: ${headers['x-supabase-version']}`)
      }
    } catch (err) {
      console.log(`  ${endpoint}: ❌ ${err.message}`)
    }
  }
  
  console.log('\n🔑 Key Format Analysis:')
  const providedKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'
  console.log('Provided key format:', providedKey)
  console.log('Length:', providedKey.length)
  console.log('Starts with:', providedKey.substring(0, 15))
  console.log('')
  
  console.log('Expected Supabase anon key format:')
  console.log('- Should start with "eyJ" (JWT header)')
  console.log('- Should be ~100-200+ characters long')
  console.log('- Should be a valid JWT token')
  console.log('')
  
  console.log('The provided key appears to be a "publishable" key which might be:')
  console.log('- A dashboard/project API key')
  console.log('- A service key in non-standard format')
  console.log('- A custom key format')
  
  // Try to test connection with a mock JWT format to see error difference
  console.log('\n🧪 Testing with mock JWT format to compare errors:')
  try {
    const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdGJwcXNxb2NibHdqaGNlenVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzMwNzU3NTAsImV4cCI6MTk0ODY1MTc1MH0.mock_signature'
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${mockJWT}`,
        'apikey': mockJWT
      }
    })
    console.log(`Mock JWT test: ${response.status} ${response.statusText}`)
  } catch (err) {
    console.log('Mock JWT test failed:', err.message)
  }
  
  console.log('\n💡 Next Steps:')
  console.log('1. Check if this is the correct anon key from Supabase dashboard')
  console.log('2. Verify the project reference matches: zktbpqsqocblwjhcezum')
  console.log('3. Look for the actual JWT anon key in Supabase project settings')
  console.log('4. Check if RLS policies are blocking access')
  console.log('5. Verify this is the same Supabase instance as the main Tenista app')
}

diagnoseSupabaseInstance().catch(console.error)