'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getPlayerProfile } from '@/lib/actions/player.actions'
import { router, useSegments } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const segments = useSegments()
  const [isInitializing, setIsInitializing] = useState(true)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const primaryColor = useThemeColor({}, 'primary')

  // Add minimum loading display time to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 400)
    return () => clearTimeout(timer)
  }, [])

  // Re-show loading when user state changes (e.g., after sign-in)
  // This prevents the brief flash of the sign-in screen before navigation
  useEffect(() => {
    if (user && !authLoading) {
      setIsInitializing(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const checkUserStatus = async () => {
      // Skip if still loading auth
      if (authLoading) {
        return
      }

      const inAuthGroup = segments[0] === '(auth)'
      const inOnboardingGroup = segments[0] === 'onboarding'

      // No user - redirect to auth unless already there
      if (!user) {
        if (!inAuthGroup) {
          router.replace('/(auth)/sign-in')
        }
        setIsInitializing(false)
        return
      }

      // User exists - check onboarding status
      try {
        const { data: profile } = await getPlayerProfile(user.id)
        const completed = profile?.onboarding_completed === true

        // Handle routing based on onboarding status
        if (!completed && !inOnboardingGroup) {
          // Need onboarding
          router.replace('/onboarding/profile')
        } else if (completed && (inAuthGroup || inOnboardingGroup)) {
          // Completed onboarding but still in auth/onboarding
          router.replace('/(tabs)/community')
        }
        // Otherwise, user is in the right place
      } catch {
        // On error, assume onboarding needed
        if (!inOnboardingGroup) {
          router.replace('/onboarding/profile')
        }
      }

      setIsInitializing(false)
    }

    checkUserStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  // Show loading while initializing (with minimum display time to prevent flash)
  if (authLoading || isInitializing || !minTimeElapsed) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    )
  }

  return <>{children}</>
} 