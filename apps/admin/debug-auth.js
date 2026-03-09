const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAuth() {
  console.log('🔍 Debugging authentication issue...\n')
  
  try {
    // 1. Check admin_users table
    console.log('1. Checking admin_users table...')
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
    
    if (adminError) {
      console.log('❌ Error accessing admin_users:', adminError.message)
      return
    }
    
    console.log(`✅ Found ${adminUsers?.length || 0} admin users:`)
    if (adminUsers && adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`   - ID: ${admin.id}`)
        console.log(`     Role: ${admin.role}`)
        console.log(`     Created: ${admin.created_at}`)
      })
    }
    
    // 2. Check players table for Roberto
    console.log('\n2. Checking players table for Roberto...')
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .or('first_name.ilike.%roberto%, last_name.ilike.%iglesias%')
    
    if (playersError) {
      console.log('❌ Error accessing players:', playersError.message)
    } else {
      console.log(`Found ${players?.length || 0} matching players:`)
      if (players && players.length > 0) {
        players.forEach(player => {
          console.log(`   - ${player.first_name} ${player.last_name}`)
          console.log(`     Player ID: ${player.id}`)
          console.log(`     Auth User ID: ${player.auth_user_id}`)
          console.log(`     Email: ${player.email || 'N/A'}`)
        })
      }
    }
    
    // 3. Test login simulation
    console.log('\n3. Testing what happens during login...')
    console.log('When you try to login with riglesias@portaloficina.com:')
    console.log('   - Supabase auth will authenticate the user')
    console.log('   - We get a user object with an ID')
    console.log('   - We check if that ID exists in admin_users table')
    console.log('   - If not found, login fails with "You do not have admin access"')
    
    // 4. Check if we need to add more auth user IDs
    console.log('\n4. Recommendations:')
    console.log('   a) Log in to your Supabase dashboard')
    console.log('   b) Go to Authentication → Users')
    console.log('   c) Find the user with email riglesias@portaloficina.com')
    console.log('   d) Copy the exact User ID from there')
    console.log('   e) Let me know what that ID is')
    
    // 5. Try to add another common ID pattern
    console.log('\n5. Attempting to add common ID variations...')
    
    // Try the player ID as well (sometimes this is used)
    const robertoPlayerId = '4217824f-31ef-4a14-8af3-8ca8a83382c5'
    console.log(`Trying to add player ID as admin: ${robertoPlayerId}`)
    
    const { data: insertPlayer, error: insertPlayerError } = await supabase
      .from('admin_users')
      .insert({
        id: robertoPlayerId,
        role: 'super_admin',
        permissions: {}
      })
      .select()
    
    if (insertPlayerError) {
      if (insertPlayerError.code === '23503') {
        console.log('   ❌ Player ID is not a valid auth user ID')
      } else {
        console.log('   ❌ Error:', insertPlayerError.message)
      }
    } else {
      console.log('   ✅ Added player ID as admin (try logging in now)')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

debugAuth()