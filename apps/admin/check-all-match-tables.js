const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllMatchTables() {
  console.log('🔍 Checking all match-related tables...\n')
  
  const tablesToCheck = [
    'matches',
    'player_matches', 
    'league_matches',
    'tournament_matches'
  ]
  
  for (const tableName of tablesToCheck) {
    try {
      console.log(`📋 Checking ${tableName}...`)
      
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        if (countError.code === '42P01') {
          console.log(`   ❌ Table ${tableName} does not exist`)
        } else {
          console.log(`   ❌ Error: ${countError.message}`)
        }
      } else {
        console.log(`   ✅ ${tableName}: ${count} records`)
        
        if (count && count > 0) {
          // Get sample data to understand structure
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (!sampleError && sampleData && sampleData.length > 0) {
            console.log(`   📊 Columns: ${Object.keys(sampleData[0]).join(', ')}`)
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${tableName}:`, error.message)
    }
    console.log('')
  }
}

checkAllMatchTables()