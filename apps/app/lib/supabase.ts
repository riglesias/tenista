import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Production build debugging
console.log('[Supabase Init] Environment check:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
  nodeEnv: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_'))
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Supabase configuration missing: URL=${supabaseUrl ? 'set' : 'missing'}, KEY=${supabaseAnonKey ? 'set' : 'missing'}`)
}

// Add validation for environment variables
// console.log('Supabase Config:', {
//   url: supabaseUrl ? 'Set' : 'Missing',
//   key: supabaseAnonKey ? 'Set' : 'Missing',
//   isPlaceholder: supabaseUrl?.includes('your_supabase') || supabaseAnonKey?.includes('your_supabase')
// })

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('MISSING SUPABASE ENV VARS! Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file')
}

if (supabaseUrl?.includes('your_supabase') || supabaseAnonKey?.includes('your_supabase')) {
  console.warn('Using placeholder Supabase credentials! Authentication and database operations may not work correctly. Please update your .env file.')
}

// Define a storage adapter that uses localStorage for web and AsyncStorage for native
const getStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // console.log('Using localStorage for Supabase on web')
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    } else {
      // console.warn('localStorage is not available on web. Supabase sessions may not persist.')
      // Fallback to an in-memory storage if localStorage is not available (e.g., SSR or secure contexts)
      let memoryStorage: { [key: string]: string } = {}
      return {
        getItem: (key: string) => Promise.resolve(memoryStorage[key] || null),
        setItem: (key: string, value: string) => {
          memoryStorage[key] = value
          return Promise.resolve()
        },
        removeItem: (key: string) => {
          delete memoryStorage[key]
          return Promise.resolve()
        },
      }
    }
  }
  // console.log('Using AsyncStorage for Supabase on native')
  return AsyncStorage
}

export const storageAdapter = getStorageAdapter()

let supabase: any

try {
  console.log('[Supabase] Creating client with storage adapter:', storageAdapter ? 'available' : 'missing')
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Important for React Native
    },
  })
  
  console.log('[Supabase] Client created successfully')
} catch (error) {
  console.error('[Supabase] Failed to create client:', error)
  throw new Error(`Supabase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
}

export { supabase }

// Helper to manually clear session from storage
export const clearSessionFromStorage = async () => {
  try {
    // Get the project reference from the URL
    const projectRef = supabaseUrl.split('//')[1].split('.')[0]
    
    // List of possible keys Supabase might use
    const keys = [
      'supabase.auth.token',
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
      `supabase-auth-token`,
      // Legacy keys
      'supabase.auth.refreshToken',
      'supabase.auth.currentSession',
    ]
    
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      // For web, also clear any keys that start with sb-
      const allKeys = Object.keys(window.localStorage)
      const supabaseKeys = allKeys.filter(key => 
        key.startsWith('sb-') || 
        key.startsWith('supabase') ||
        key.includes('auth')
      )
      keys.push(...supabaseKeys)
    }
    
    // Remove all keys
    for (const key of keys) {
      try {
        if ('removeItem' in storageAdapter && typeof storageAdapter.removeItem === 'function') {
          await storageAdapter.removeItem(key)
        } else if ('removeItem' in storageAdapter) {
          // For web localStorage
          storageAdapter.removeItem(key)
        }
      } catch (e) {
        // Ignore individual key errors
      }
    }
    
    console.log('Cleared session keys from storage')
  } catch (error) {
    console.error('Error clearing session from storage:', error)
  }
} 