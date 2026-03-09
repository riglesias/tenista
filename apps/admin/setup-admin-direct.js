const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zktbpqsqocblwjhcezum.supabase.co'
const supabaseKey = 'sb_publishable_31DDkgzj9Ph25AVb6Q4NIA_2pyT2uLk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminDirect() {
  const authUserId = '340902e2-f532-48ee-93d2-74aeb9ea7e16' // Your auth user ID
  
  console.log('🔧 Setting up admin user directly...')
  console.log('Auth User ID:', authUserId)
  
  try {
    // First check if user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing admin:', checkError)
      return
    }
    
    if (existingAdmin) {
      console.log('✅ User is already an admin with role:', existingAdmin.role)
      return
    }
    
    // Try to insert the admin user
    console.log('Adding user to admin_users table...')
    
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          id: authUserId,
          role: 'super_admin',
          permissions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (error) {
      console.error('❌ Error details:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Try without select to see if it's a permission issue
      const { error: insertOnlyError } = await supabase
        .from('admin_users')
        .insert({
          id: authUserId,
          role: 'super_admin'
        })
      
      if (insertOnlyError) {
        console.error('❌ Insert-only error:', insertOnlyError.message)
      } else {
        console.log('✅ Insert succeeded (without returning data)')
        
        // Try to verify the insert
        const { data: verifyData, error: verifyError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', authUserId)
          .maybeSingle()
        
        if (verifyData) {
          console.log('✅ Verified: User is now an admin!')
        } else if (verifyError) {
          console.log('⚠️  Could not verify, but insert may have succeeded')
        }
      }
    } else {
      console.log('✅ Successfully added as super_admin!')
      console.log('Admin user:', data)
    }
    
    // List all admin users
    console.log('\n📋 All admin users:')
    const { data: allAdmins } = await supabase
      .from('admin_users')
      .select('*')
    
    if (allAdmins && allAdmins.length > 0) {
      allAdmins.forEach(admin => {
        console.log(`  - ID: ${admin.id}`)
        console.log(`    Role: ${admin.role}`)
        console.log(`    Created: ${admin.created_at}`)
      })
    } else {
      console.log('  No admin users found (may be a permission issue)')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

setupAdminDirect()