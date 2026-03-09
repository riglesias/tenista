import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

// Lazy initialization to avoid SSR issues
let _supabase: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createBrowserSupabaseClient()
  }
  return _supabase
}

// For backwards compatibility - only use in client components
export const supabase = typeof window !== 'undefined' ? createBrowserSupabaseClient() : null as any