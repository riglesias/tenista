'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import React, { useEffect } from 'react'
import { Platform, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useAppToast } from '@/components/ui/Toast'

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: '251208589749-gctj4up1ce36inf0l7cr99702hc8un3b.apps.googleusercontent.com',
  webClientId: '251208589749-revsauposkj7bqt2ofu27b4k1cf9i3a1.apps.googleusercontent.com', // Required for Android
  offlineAccess: false,
})

export default function GoogleSignInButton({ disabled = false, onError }: { disabled?: boolean, onError?: (error: string) => void }) {
  const { signInWithIdToken } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { showToast } = useAppToast()

  useEffect(() => {
    // Check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
        .catch(() => {
          // silently handled
        })
    }
  }, [])

  const handleError = (errorMessage: string) => {
    if (onError) {
      onError(errorMessage)
    } else {
      showToast(errorMessage, { type: 'error' })
    }
  }

  const handlePress = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      
      // Sign in with Google
      await GoogleSignin.signIn()

      // Get the ID token
      const tokens = await GoogleSignin.getTokens()
      
      if (tokens.idToken) {
        // Sign in with Supabase using the ID token
        await signInWithIdToken(tokens.idToken)
      } else {
        handleError('Failed to get ID token from Google.')
      }
    } catch (error: any) {
      if (error.code === '-5') {
        // User cancelled the sign-in flow
        return
      }
      
      handleError(error.message || 'Failed to sign in with Google')
    }
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? colors.muted : colors.background,
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.border,
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
      }}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={{ marginRight: 12 }}>
        <GoogleIcon color={disabled ? colors.mutedForeground : colors.foreground} />
      </View>
      <Text style={{
        color: disabled ? colors.mutedForeground : colors.foreground,
        fontSize: 16,
        fontWeight: '600'
      }}>
        Continue with Google
      </Text>
    </TouchableOpacity>
  )
}

function GoogleIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width="20" height="20" viewBox="0 0 24 24">
        <Path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <Path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <Path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <Path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </Svg>
    </View>
  )
}