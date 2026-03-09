'use client'

import { useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { View, Text, ActivityIndicator } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AuthConfirm() {
  const { token, type } = useLocalSearchParams<{ 
    token: string; 
    type: string;
    redirect_to?: string;
  }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      if (token && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })

          if (error) {
            console.error('Email confirmation error:', error)
            router.replace('/(auth)/sign-in?error=confirmation_failed')
          } else {
            // Success! User is now confirmed
            console.log('Email confirmed successfully')
            router.replace('/(auth)/sign-in?success=email_confirmed')
          }
        } catch (error) {
          console.error('Confirmation error:', error)
          router.replace('/(auth)/sign-in?error=confirmation_failed')
        }
      } else if (token && type === 'recovery') {
        // Handle password reset confirmation
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          })

          if (error) {
            console.error('Password reset confirmation error:', error)
            router.replace('/(auth)/sign-in?error=reset_failed')
          } else {
            // Success! Redirect to password reset
            router.replace('/(auth)/reset-password?token=' + token)
          }
        } catch (error) {
          console.error('Recovery confirmation error:', error)
          router.replace('/(auth)/sign-in?error=reset_failed')
        }
      } else {
        // Invalid or missing parameters
        console.error('Invalid confirmation parameters:', { token, type })
        router.replace('/(auth)/sign-in?error=invalid_link')
      }
    }

    // Small delay to show the loading state
    const timer = setTimeout(() => {
      handleEmailConfirmation()
    }, 1000)

    return () => clearTimeout(timer)
  }, [token, type])

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: colors.background
    }}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          color: colors.foreground, 
          fontSize: 18,
          fontWeight: '600',
          marginTop: 20,
          textAlign: 'center'
        }}>
          Confirming your email...
        </Text>
        <Text style={{ 
          color: colors.mutedForeground, 
          fontSize: 14,
          marginTop: 8,
          textAlign: 'center'
        }}>
          Please wait while we verify your account
        </Text>
      </View>
    </SafeAreaView>
  )
}