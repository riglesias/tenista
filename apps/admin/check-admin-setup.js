const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminSetup() {
  console.log('🔍 Checking admin setup...\n')
  
  try {
    // Check if admin_users table exists
    console.log('1. Checking if admin_users table exists...')
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1)
    
    if (adminError) {
      if (adminError.code === '42P01') {
        console.log('❌ admin_users table does not exist')
        console.log('   You need to run the SQL script in Supabase dashboard')
        return
      } else {
        console.log('⚠️  Error accessing admin_users table:', adminError.message)
      }
    } else {
      console.log('✅ admin_users table exists')
    }
    
    // Check all admin users
    console.log('\n2. Checking all admin users...')
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admin_users')
      .select('*')
    
    if (allAdminsError) {
      console.log('❌ Error fetching admin users:', allAdminsError.message)
    } else {
      console.log(`Found ${allAdmins?.length || 0} admin users:`)
      if (allAdmins && allAdmins.length > 0) {
        allAdmins.forEach(admin => {
          console.log(`   - ID: ${admin.id}`)
          console.log(`     Role: ${admin.role}`)
          console.log(`     Created: ${admin.created_at}`)
        })
      } else {
        console.log('   No admin users found')
      }
    }
    
    // Check if Roberto's user ID exists in admin_users
    console.log('\n3. Checking for Roberto\'s admin record...')
    const robertoUserId = '340902e2-f532-48ee-93d2-74aeb9ea7e16'
    const { data: robertoAdmin, error: robertoError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', robertoUserId)
      .maybeSingle()
    
    if (robertoError) {
      console.log('❌ Error checking Roberto\'s admin record:', robertoError.message)
    } else if (robertoAdmin) {
      console.log('✅ Roberto is in admin_users table:')
      console.log(`   Role: ${robertoAdmin.role}`)
      console.log(`   Permissions: ${JSON.stringify(robertoAdmin.permissions)}`)
    } else {
      console.log('❌ Roberto is NOT in admin_users table')
      console.log('   This explains why login failed')
      
      // Try to add him manually
      console.log('\n4. Attempting to add Roberto as admin...')
      const { data: insertData, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: robertoUserId,
          role: 'super_admin',
          permissions: {}
        })
        .select()
      
      if (insertError) {
        console.log('❌ Failed to add Roberto as admin:', insertError.message)
        console.log('   Error details:', insertError)
      } else {
        console.log('✅ Successfully added Roberto as super_admin!')
        console.log('   You should now be able to login')
      }
    }
    
    // Check if auth user exists
    console.log('\n5. Checking auth system...')
    console.log('Note: Cannot check auth.users table with anon key')
    console.log('But the player record exists with auth_user_id:', robertoUserId)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkAdminSetup()