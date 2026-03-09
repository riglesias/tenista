const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Try a simple auth check first
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Auth check might fail but that's OK for anon access
    if (error && error.message !== 'Invalid token') {
      console.log(`⚠️  Auth check: ${error.message}`)
    }
    
    console.log(`✅ Successfully connected to Supabase`)
    return { success: true, error: null, client: supabase }
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`)
    return { success: false, error: err, client: null }
  }
}

async function queryTables() {
  try {
    // Try to query tables directly using a raw query
    const { data, error } = await supabase.rpc('get_tables')
    
    if (error) {
      console.log('RPC error:', error)
      // Fallback: try direct table queries for common tables
      await tryCommonTables()
    } else {
      console.log('Tables found:', data)
    }
  } catch (err) {
    console.log('Error querying tables:', err.message)
    // Fallback: try direct table queries for common tables
    await tryCommonTables()
  }
}

async function tryCommonTables(supabase) {
  const commonTables = [
    'admin_users',
    'admin_audit_log', 
    'league_matches',
    'courts',
    'players',
    'users',
    'profiles',
    'matches',
    'tournaments',
    'clubs',
    'leagues',
    'cities'
  ]
  
  console.log('Checking for common tables:')
  
  for (const tableName of commonTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`  ❌ ${tableName}: Table does not exist`)
        } else if (error.code === '42501') {
          console.log(`  🔒 ${tableName}: Table exists but access denied (${error.message})`)
        } else {
          console.log(`  ⚠️  ${tableName}: ${error.message}`)
        }
      } else {
        console.log(`  ✅ ${tableName}: Found (${count || '?'} rows)`)
        
        // Get schema info for existing tables
        try {
          const { data: schemaData, error: schemaError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
            
          if (!schemaError && schemaData && schemaData.length > 0) {
            console.log(`      Columns: ${Object.keys(schemaData[0]).join(', ')}`)
          } else if (!schemaError && schemaData?.length === 0) {
            console.log(`      Table exists but is empty`)
          }
        } catch (schemaErr) {
          console.log(`      Could not get schema: ${schemaErr.message}`)
        }
      }
    } catch (err) {
      console.log(`  ❓ ${tableName}: Error checking table - ${err.message}`)
    }
  }
}

async function checkAuth(supabase) {
  console.log('Checking authentication:')
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('  No authenticated user (this is expected for anonymous access)')
    } else if (user) {
      console.log('  Authenticated user:', user.email || user.id)
    } else {
      console.log('  No authenticated user')
    }
  } catch (err) {
    console.log('  Auth check failed:', err.message)
  }
}

async function exploreDatabase() {
  console.log('🔍 Exploring Supabase database for tenista-admin...\n')
  console.log('Database URL:', supabaseUrl)
  console.log('Testing connection...\n')

  const result = await testConnection()
  
  if (!result.success) {
    console.log('\n❌ Could not establish connection')
    console.log('\n🔍 Attempting to diagnose the issue...')
    
    // Try to check if it's a URL issue or a key issue
    console.log('\n📋 Checking if the Supabase URL is accessible...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`)
      console.log(`Status: ${response.status}`)
      if (response.status === 200) {
        console.log('✅ URL is accessible - the issue is likely with the API key format')
      } else if (response.status === 401) {
        console.log('⚠️  URL accessible but authentication failed - need correct anon key')
      } else {
        console.log('❌ URL may not be accessible or there\'s another issue')
      }
    } catch (err) {
      console.log('❌ Could not reach the Supabase URL:', err.message)
    }
    
    return
  }
  
  const workingClient = result.client

  console.log('\n🔐 Checking authentication status...')
  await checkAuth(workingClient)

  console.log('\n📋 Checking for existing tables...')
  await tryCommonTables(workingClient)
  
  console.log('\n🏁 Database exploration complete!')
}

// Run the exploration
exploreDatabase().catch(console.error)