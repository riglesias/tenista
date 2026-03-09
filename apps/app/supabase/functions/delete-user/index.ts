import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  userId: string
}

interface DeleteUserResponse {
  success: boolean
  message?: string
  error?: string
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
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
    let requestData: DeleteUserRequest
    try {
      requestData = await req.json()
    } catch {
      throw new Error('Invalid JSON body')
    }

    const { userId } = requestData
    
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required and must be a string')
    }

    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format')
    }

    console.log(`🗑️ Processing deletion request for user: ${userId}`)

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

    // Step 1: Unlink player from auth and change name (preserve everything else)
    console.log(`🔗 Unlinking player from auth and changing name for user: ${userId}`)
    const { error: unlinkError } = await supabase
      .from('players')
      .update({
        auth_user_id: null,
        first_name: 'Deleted',
        last_name: 'User',
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
    
    if (unlinkError) {
      console.error(`❌ Failed to unlink player: ${unlinkError.message}`)
      throw new Error(`Failed to unlink player: ${unlinkError.message}`)
    }
    
    console.log(`✅ Player unlinked and renamed to "Deleted User"`)

    // Step 2: Delete the auth user
    console.log(`🔥 Deleting auth user: ${userId}`)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error(`❌ Failed to delete auth user: ${deleteError.message}`)
      throw new Error(`Failed to delete auth user: ${deleteError.message}`)
    }

    console.log(`✅ Successfully deleted auth user: ${userId}`)

    const response: DeleteUserResponse = { 
      success: true, 
      message: 'User successfully deleted from auth' 
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
    console.error('Delete user function error:', errorMessage)
    
    const response: DeleteUserResponse = { 
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