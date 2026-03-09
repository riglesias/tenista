import { supabase } from '@/lib/supabase'

type DeletionResult = {
  success: boolean
  error: string | null
  operations: string[]
  message: string
  isAuthOnly?: boolean
}


export async function deleteUserData(userId: string): Promise<DeletionResult> {
  const operationsLog: string[] = []
  
  try {
    console.log('🗑️ Starting account deletion for user:', userId)

    // Check if user exists in players table using auth_user_id
    const { error: fetchError } = await supabase
      .from('players')
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .single()

    // Handle auth-only users (no player profile)
    if (fetchError?.code === 'PGRST116') {
      console.log('⚠️ Auth-only user detected - no player data to clean up')
      operationsLog.push('Auth-only user detected')
      
      return { 
        success: true, 
        error: null,
        operations: operationsLog,
        message: 'Auth-only user - no database cleanup required',
        isAuthOnly: true
      }
    }

    // Handle other database errors
    if (fetchError) {
      console.error('Database error checking user:', fetchError)
      return { 
        success: false, 
        error: 'Failed to verify user profile',
        operations: operationsLog,
        message: 'Database verification failed'
      }
    }

    operationsLog.push('User profile verified - will be handled by Edge function')
    console.log('✅ User profile verified - Edge function will handle unlinking and anonymization')
    
    return { 
      success: true, 
      error: null,
      operations: operationsLog,
      message: 'User profile verified - ready for deletion'
    }
  } catch (error: any) {
    console.error('Unexpected error during account deletion:', error)
    operationsLog.push(`Unexpected error: ${error.message}`)
    
    return { 
      success: false, 
      error: `Account deletion failed: ${error.message}`,
      operations: operationsLog,
      message: 'Unexpected error occurred during deletion'
    }
  }
}