const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function detailedPlayerMatchesCheck() {
  console.log('🔍 Detailed check of player_matches table...\n')
  
  try {
    // Try different approaches to query the table
    console.log('1. Basic select all:')
    const { data: allMatches, error: allError } = await supabase
      .from('player_matches')
      .select('*')
    
    if (allError) {
      console.log('❌ Error:', allError.message)
      console.log('Code:', allError.code)
      console.log('Details:', allError.details)
    } else {
      console.log(`✅ Found ${allMatches?.length || 0} records`)
      if (allMatches && allMatches.length > 0) {
        console.log('Sample record:')
        console.log(JSON.stringify(allMatches[0], null, 2))
      }
    }
    
    console.log('\n2. Count query:')
    const { count, error: countError } = await supabase
      .from('player_matches')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('❌ Count error:', countError.message)
    } else {
      console.log(`✅ Count: ${count}`)
    }
    
    console.log('\n3. Try with different table names:')
    const possibleNames = ['player_matches', 'playermatches', 'player_match', 'playermatch']
    
    for (const tableName of possibleNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: ${count} records`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }
    
    // Also check the original matches table to compare
    console.log('\n4. For comparison - matches table:')
    const { count: matchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ matches table: ${matchesCount} records`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

detailedPlayerMatchesCheck()