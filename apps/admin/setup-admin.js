const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdmin() {
  try {
    console.log('🔍 Looking for user with email: riglesias@portaloficina.com')
    
    // First, find the user in the players table (which likely has auth_user_id)
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(100)
    
    if (playersError) {
      console.error('Error fetching players:', playersError)
      return
    }
    
    console.log(`Found ${players.length} players total`)
    
    // Look for a player that might be you
    const possibleMatches = players.filter(p => 
      p.first_name?.toLowerCase().includes('iglesias') ||
      p.last_name?.toLowerCase().includes('iglesias') ||
      p.email === 'riglesias@portaloficina.com'
    )
    
    if (possibleMatches.length > 0) {
      console.log('\n📋 Possible matches found:')
      possibleMatches.forEach(p => {
        console.log(`  - ${p.first_name} ${p.last_name} (ID: ${p.id}, Auth ID: ${p.auth_user_id})`)
      })
      
      // Get the auth_user_id from the first match
      const authUserId = possibleMatches[0].auth_user_id
      
      if (authUserId) {
        console.log(`\n✅ Found auth_user_id: ${authUserId}`)
        
        // Check if already an admin
        const { data: existingAdmin, error: adminCheckError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', authUserId)
          .single()
        
        if (existingAdmin) {
          console.log('✅ User is already an admin with role:', existingAdmin.role)
          return
        }
        
        // Add to admin_users table
        const { data: newAdmin, error: insertError } = await supabase
          .from('admin_users')
          .insert({
            id: authUserId,
            role: 'super_admin',
            permissions: {}
          })
          .select()
          .single()
        
        if (insertError) {
          if (insertError.code === '23505') {
            console.log('✅ User is already an admin')
          } else {
            console.error('❌ Error adding admin user:', insertError)
          }
        } else {
          console.log('✅ Successfully added as super_admin!')
          console.log('Admin user created:', newAdmin)
        }
      } else {
        console.log('⚠️  No auth_user_id found for this player')
      }
    } else {
      console.log('❌ No player found with Iglesias in the name')
      console.log('\n📋 All players in database:')
      players.forEach(p => {
        console.log(`  - ${p.first_name} ${p.last_name} (Auth ID: ${p.auth_user_id})`)
      })
    }
    
    // Also check the admin_users table to see current admins
    console.log('\n📋 Current admin users:')
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*')
    
    if (admins && admins.length > 0) {
      admins.forEach(admin => {
        console.log(`  - ID: ${admin.id}, Role: ${admin.role}`)
      })
    } else {
      console.log('  No admin users found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

setupAdmin()