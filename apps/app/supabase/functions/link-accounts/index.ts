import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LinkAccountsRequest {
  userId: string
  email: string
  provider: string
  userMetadata?: Record<string, any>
}

interface LinkAccountsResponse {
  success: boolean
  linkedUserId?: string
  isNewUser?: boolean
  message?: string
  error?: string
}

Deno.serve(async (req): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header')
    }

    // Parse request body
    let requestData: LinkAccountsRequest
    try {
      requestData = await req.json()
    } catch {
      throw new Error('Invalid JSON body')
    }

    const { userId, email, provider, userMetadata } = requestData
    
    // Validate required fields
    if (!userId || !email || !provider) {
      throw new Error('userId, email, and provider are required')
    }

    console.log(`🔗 Processing account linking for: ${email} (${provider})`)

    // Create admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Step 1: Check if another user exists with the same email (but different auth provider)
    const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers()
    
    if (searchError) {
      throw new Error(`Failed to search existing users: ${searchError.message}`)
    }

    // Find users with same email but different ID
    const sameEmailUsers = existingUsers.users.filter(user => 
      user.email === email && user.id !== userId
    )

    if (sameEmailUsers.length === 0) {
      // No existing user with same email - this is a new user
      console.log(`✅ New user confirmed: ${email}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          linkedUserId: userId,
          isNewUser: true,
          message: 'New user - no linking needed' 
        } as LinkAccountsResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Step 2: Found existing user(s) with same email - need to link accounts
    const primaryUser = sameEmailUsers[0] // Use first found user as primary
    console.log(`🔗 Linking ${userId} to existing user ${primaryUser.id}`)

    // Step 3: Check if primary user has an active player profile
    const { data: primaryProfile } = await supabase
      .from('players')
      .select('*')
      .eq('auth_user_id', primaryUser.id)
      .eq('is_active', true)
      .single()

    // Step 4: Check if current user has an active player profile
    const { data: currentProfile } = await supabase
      .from('players')
      .select('*')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .single()

    // Step 5: Handle profile merging logic
    if (primaryProfile && currentProfile) {
      // Both users have profiles - merge data (keep primary, update with any missing info)
      const mergedData = {
        ...primaryProfile,
        // Update with any newer/missing information from current profile
        ...(currentProfile.avatar_url && !primaryProfile.avatar_url && { avatar_url: currentProfile.avatar_url }),
        ...(currentProfile.phone_number && !primaryProfile.phone_number && { 
          phone_number: currentProfile.phone_number,
          phone_country_code: currentProfile.phone_country_code 
        }),
        ...(currentProfile.first_name && !primaryProfile.first_name && { first_name: currentProfile.first_name }),
        ...(currentProfile.last_name && !primaryProfile.last_name && { last_name: currentProfile.last_name }),
        updated_at: new Date().toISOString()
      }

      await supabase
        .from('players')
        .update(mergedData)
        .eq('auth_user_id', primaryUser.id)

      // Delete the duplicate profile
      await supabase
        .from('players')
        .delete()
        .eq('auth_user_id', userId)

      console.log(`🔄 Merged profiles: ${userId} -> ${primaryUser.id}`)
    } else if (currentProfile && !primaryProfile) {
      // Current user has profile, primary doesn't - transfer the profile
      await supabase
        .from('players')
        .update({ auth_user_id: primaryUser.id })
        .eq('auth_user_id', userId)

      console.log(`📦 Transferred profile: ${userId} -> ${primaryUser.id}`)
    } else if (!primaryProfile && !currentProfile && userMetadata?.full_name) {
      // Neither user has a profile but we have Apple Sign-In data - create profile for primary user
      const nameParts = userMetadata.full_name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      if (firstName || lastName) {
        await supabase
          .from('players')
          .insert({
            auth_user_id: primaryUser.id,
            first_name: firstName,
            last_name: lastName,
            is_active: true
          })
        
        console.log(`🆕 Created profile for primary user with Apple Sign-In data: ${primaryUser.id}`)
      }
    }
    // If primaryProfile exists and currentProfile doesn't, no action needed

    // Step 6: Update auth user metadata to link accounts
    const updatedMetadata = {
      ...primaryUser.user_metadata,
      ...userMetadata,
      linked_accounts: [
        ...(primaryUser.user_metadata?.linked_accounts || []),
        {
          provider,
          user_id: userId,
          linked_at: new Date().toISOString()
        }
      ]
    }

    await supabase.auth.admin.updateUserById(primaryUser.id, {
      user_metadata: updatedMetadata
    })

    // Step 7: Delete the duplicate auth user
    await supabase.auth.admin.deleteUser(userId)

    console.log(`✅ Successfully linked accounts: ${userId} -> ${primaryUser.id}`)

    const response: LinkAccountsResponse = { 
      success: true, 
      linkedUserId: primaryUser.id,
      isNewUser: false,
      message: `Account linked successfully to existing user ${primaryUser.id}`
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Account linking error:', errorMessage)
    
    const response: LinkAccountsResponse = { 
      success: false, 
      error: errorMessage 
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})