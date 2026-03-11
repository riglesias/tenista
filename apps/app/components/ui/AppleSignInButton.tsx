'use client'

import { useAuth } from '@/contexts/AuthContext'
import { trackLogin } from '@/lib/analytics/events'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import * as AppleAuthentication from 'expo-apple-authentication'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

export default function AppleSignInButton({ disabled = false, onError }: { disabled?: boolean, onError?: (error: string) => void }) {
  const { signInWithApple } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          const isAvailable = await AppleAuthentication.isAvailableAsync()
          setIsAppleSignInAvailable(isAvailable)
        } catch (error) {
          console.log('Apple Sign-In not available:', error)
          setIsAppleSignInAvailable(false)
        }
      }
    }
    
    checkAvailability()
  }, [])

  const handleError = (errorMessage: string) => {
    if (onError) {
      onError(errorMessage)
    } else {
      if (Platform.OS === 'web') {
        window.alert(errorMessage)
      } else {
        Alert.alert('Apple Sign In Error', errorMessage)
      }
    }
  }

  const handlePress = async () => {
    // Double-check availability before attempting sign-in
    if (!isAppleSignInAvailable || isLoading) {
      if (!isAppleSignInAvailable) {
        handleError('Apple Sign-In is not available on this device')
      }
      return
    }

    try {
      setIsLoading(true)
      console.log('🍎 Starting Apple Sign-In...')
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      console.log('🍎 Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode,
        identityTokenLength: credential.identityToken?.length,
        authorizationCodeLength: credential.authorizationCode?.length,
      })

      if (credential.identityToken) {
        console.log('🍎 Got Apple ID token, signing in with Supabase...')
        const { error } = await signInWithApple(credential.identityToken, credential.user, {
          fullName: credential.fullName,
          email: credential.email,
        })
        
        if (error) {
          console.error('🍎 Supabase sign-in error:', error)
          setIsLoading(false)
          handleError(error.message || 'Failed to sign in with Supabase')
        } else {
          console.log('🍎 Successfully signed in with Supabase')
          trackLogin('apple')
          // Keep loading state - AuthContext will handle navigation
        }
      } else {
        console.error('🍎 No identity token received from Apple')
        setIsLoading(false)
        handleError('Failed to get identity token from Apple.')
      }
    } catch (error: any) {
      setIsLoading(false)
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in, don't show error
        console.log('🍎 User canceled Apple sign-in')
      } else {
        console.error('🍎 Apple sign-in error:', {
          code: error.code,
          message: error.message,
          domain: error.domain,
          userInfo: error.userInfo,
          stack: error.stack,
        })
        handleError(`Apple Sign-In failed: ${error.message || 'Unknown error'} (Code: ${error.code || 'N/A'})`)
      }
    }
  }

  // Only show on iOS and when Apple Sign-In is available
  if (Platform.OS !== 'ios' || !isAppleSignInAvailable) {
    return null
  }

  const isButtonDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isButtonDisabled ? colors.muted : '#000',
        borderWidth: 1,
        borderColor: isButtonDisabled ? colors.border : '#000',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        opacity: isLoading ? 0.8 : 1,
      }}
      onPress={handlePress}
      disabled={isButtonDisabled}
    >
      {isLoading ? (
        <>
          <ActivityIndicator 
            size="small" 
            color="#fff" 
            style={{ marginRight: 12 }}
          />
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Signing in...
          </Text>
        </>
      ) : (
        <>
          <View style={{ marginRight: 12 }}>
            <AppleIcon color={isButtonDisabled ? colors.mutedForeground : '#fff'} />
          </View>
          <Text style={{
            color: isButtonDisabled ? colors.mutedForeground : '#fff',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Continue with Apple
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

function AppleIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width="20" height="20" viewBox="0 0 24 24">
        <Path
          d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
          fill={color}
        />
      </Svg>
    </View>
  )
}