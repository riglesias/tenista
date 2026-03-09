const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlayerMatches() {
  console.log('🔍 Checking player_matches table...\n')
  
  try {
    // Check if player_matches table exists and get its structure
    const { data: playerMatches, error } = await supabase
      .from('player_matches')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Error accessing player_matches:', error.message)
      console.log('Error code:', error.code)
      
      if (error.code === '42P01') {
        console.log('Table player_matches does not exist')
      }
      return
    }
    
    console.log(`✅ Found ${playerMatches?.length || 0} player_matches (showing first 5):`)
    if (playerMatches && playerMatches.length > 0) {
      playerMatches.forEach((match, index) => {
        console.log(`\n${index + 1}. Player Match:`)
        console.log(`   ID: ${match.id}`)
        Object.keys(match).forEach(key => {
          if (key !== 'id') {
            console.log(`   ${key}: ${match[key]}`)
          }
        })
      })
      
      console.log('\n📋 Table columns found:')
      console.log(Object.keys(playerMatches[0]).join(', '))
    }
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('player_matches')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`\n📊 Total player_matches: ${count}`)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkPlayerMatches()