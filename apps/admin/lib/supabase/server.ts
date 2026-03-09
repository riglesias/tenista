import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getServerUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    
    return { user, error }
  } catch (error) {
    return { user: null, error }
  }
}

export async function getServerAdmin() {
  const { user, error } = await getServerUser()
  
  if (!user || error) {
    return { admin: null, user: null, error: error || 'No user' }
  }
  
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return { admin, user, error: adminError }
  } catch (error) {
    return { admin: null, user, error }
  }
}