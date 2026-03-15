'use client'

import { Session, User } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppToast } from '@/components/ui/Toast'
import { deleteUserData } from '../lib/actions/account.actions'
import { clearSessionFromStorage, supabase } from '../lib/supabase'

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession()

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithIdToken: (idToken: string) => Promise<{ error: any }>
  signInWithApple: (identityToken: string, user: string, userInfo: { fullName: any, email: string | null }) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  verifyPasswordResetOtp: (email: string, token: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  deleteAccount: () => Promise<{ success: boolean; error: string | null }>
  verifySignUpOtp: (email: string, token: string) => Promise<{ error: any }>
  resendSignUpOtp: (email: string) => Promise<{ error: any }>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRefreshKey, setUserRefreshKey] = useState(0)
  const { showToast } = useAppToast()
  const { t } = useTranslation('auth')

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false)
    }, 15000) // 15 second timeout - safety net only

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // Background session check - no user feedback needed
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(loadingTimeout)
      })
      .catch(() => {
        // Background session check failure - app will proceed as unauthenticated
        setLoading(false)
        clearTimeout(loadingTimeout)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear everything on sign out
        setSession(null)
        setUser(null)
        await clearSessionFromStorage()
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Check if user is marked as deleted
        if (session?.user?.raw_user_meta_data?.deleted) {
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          await clearSessionFromStorage()
        } else {
          // Attempt account linking for SIGNED_IN events (not TOKEN_REFRESHED or USER_UPDATED)
          if (event === 'SIGNED_IN' && session?.user && session.user.email) {
            const provider = session.user.app_metadata?.provider || 'unknown'
            await attemptAccountLinking(session.user, session, provider, session.user.user_metadata)
          }

          setSession(session)
          setUser(session?.user ?? null)
        }
      }

      setLoading(false)
      clearTimeout(loadingTimeout)
    })

    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Helper function to attempt account linking
  const attemptAccountLinking = useCallback(async (
    user: User,
    session: Session,
    provider: string,
    userMetadata?: Record<string, any>
  ) => {
    if (!user.email) {
      return
    }

    try {
      // Set a timeout for the account linking request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/link-accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          provider: provider,
          userMetadata: userMetadata
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return
      }

      const result = await response.json()

      if (result.success) {
        if (result.linkedUserId !== user.id) {
          // Force a session refresh to get the updated user data
          await supabase.auth.refreshSession()
        }
      }
    } catch (error) {
      // Don't throw - allow sign-in to continue even if linking fails
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      // Supabase returns no error for existing users (to prevent email enumeration)
      // but the returned user has an empty identities array
      if (!error && data?.user?.identities?.length === 0) {
        return { error: { message: 'already registered' } }
      }
      return { error }
    } catch (error) {
      return { error }
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Account linking is handled centrally by onAuthStateChange listener
      return { error }
    } catch (error) {
      return { error }
    }
  }, [attemptAccountLinking])

  const signInWithIdToken = useCallback(async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })

    // Error returned to caller for UI handling
    return { error }
  }, [attemptAccountLinking])

  const signInWithApple = useCallback(async (identityToken: string, user: string, userInfo: { fullName: any, email: string | null }) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        options: {
          // Pass additional user info for profile creation
          data: {
            full_name: userInfo.fullName ? `${userInfo.fullName.givenName || ''} ${userInfo.fullName.familyName || ''}`.trim() : null,
            email: userInfo.email,
          }
        }
      })

      if (error) {
        return { error }
      }

      // If successful, save the Apple Sign-In data to the database immediately
      if (data?.user && data?.session && userInfo.fullName) {
        // Import the player actions dynamically to avoid circular dependencies
        const { createOrUpdatePlayerProfile } = await import('@/lib/actions/player.actions')

        // Extract first and last name from Apple Sign-In data
        const firstName = userInfo.fullName.givenName || ''
        const lastName = userInfo.fullName.familyName || ''

        if (firstName || lastName) {
          try {
            await createOrUpdatePlayerProfile(data.user.id, {
              first_name: firstName,
              last_name: lastName,
            })
          } catch (error) {
            // silently handled
          }
        }
      }

      // Account linking is handled centrally by onAuthStateChange listener
      return { error: null }
    } catch (error) {
      return { error }
    }
  }, [attemptAccountLinking])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()

      // If we get a session missing error, that's actually fine - we're already signed out
      if (error && error.message !== 'Auth session missing!') {
        showToast(t('alerts.signOutFailed'), { type: 'error' })

        // Try to clear session from storage as fallback
        await clearSessionFromStorage()

        // Clear local state
        setUser(null)
        setSession(null)

        return { error }
      }

      // Clear local state regardless of API response
      setUser(null)
      setSession(null)

      return { error: null }
    } catch (error: any) {
      // Even if the API call fails, clear local state
      // This handles cases where the session is already invalid
      await clearSessionFromStorage()
      setUser(null)
      setSession(null)

      // Only return error if it's not the "session missing" error
      if (error?.message === 'Auth session missing!') {
        return { error: null }
      }

      showToast(t('alerts.signOutFailed'), { type: 'error' })
      return { error }
    }
  }, [showToast, t])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      return { error }
    }
  }, [])

  const verifyPasswordResetOtp = useCallback(async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error }
    } catch (error) {
      return { error }
    }
  }, [])

  // Helper function to delete auth user via edge function
  const deleteAuthUser = useCallback(async (userId: string, accessToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        return false
      }

      const result = await response.json()
      if (!result.success) {
        return false
      }

      return true

    } catch (error) {
      return false
    }
  }, [])

  // Helper function to clear local state
  const clearLocalState = useCallback(async (): Promise<void> => {
    setUser(null)
    setSession(null)
    await clearSessionFromStorage()
  }, [])

  const deleteAccount = useCallback(async () => {
    if (!user || !session) {
      return { success: false, error: 'No authenticated user to delete' }
    }

    try {
      // Step 1: Clean up user data in database
      const dataResult = await deleteUserData(user.id)
      if (!dataResult.success) {
        return dataResult
      }

      // Step 2: Delete auth user record via edge function
      const authDeleted = await deleteAuthUser(user.id, session.access_token)

      if (!authDeleted) {
        return {
          success: false,
          error: 'Failed to delete user account. Please try again or contact support.'
        }
      }

      // Step 3: Clear local state only after successful deletion
      await clearLocalState()

      return { success: true, error: null }

    } catch (error: any) {
      // Emergency cleanup - ensure user is signed out even if deletion fails
      try {
        await supabase.auth.signOut()
        await clearLocalState()
      } catch (cleanupError) {
        // silently handled
      }

      return {
        success: false,
        error: error.message || 'Account deletion failed'
      }
    }
  }, [user, session, deleteAuthUser, clearLocalState])

  const verifySignUpOtp = useCallback(async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }, [])

  const resendSignUpOtp = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }, [])

  const refreshUser = useCallback(() => {
    // Increment the refresh key to trigger re-renders in components watching the user
    setUserRefreshKey(prev => prev + 1)
  }, [])

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithIdToken,
    signInWithApple,
    signOut,
    resetPassword,
    verifyPasswordResetOtp,
    updatePassword,
    deleteAccount,
    verifySignUpOtp,
    resendSignUpOtp,
    refreshUser,
  }), [user, session, loading, signUp, signIn, signInWithIdToken, signInWithApple, signOut, resetPassword, verifyPasswordResetOtp, updatePassword, deleteAccount, verifySignUpOtp, resendSignUpOtp, refreshUser, attemptAccountLinking])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}