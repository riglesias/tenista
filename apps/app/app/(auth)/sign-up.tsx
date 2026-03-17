'use client'

import AppleSignInButton from '@/components/ui/AppleSignInButton'
import GoogleSignInButton from '@/components/ui/GoogleSignInButtonNative'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { trackSignUp } from '@/lib/analytics/events'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tErrors } = useTranslation('errors')

  // Reset loading state when component is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(false)
    }, [])
  )

  const validateForm = () => {
    if (!email.trim()) {
      return tErrors('validation.required')
    }

    if (!email.includes('@') || !email.includes('.')) {
      return tErrors('validation.invalidEmail')
    }

    if (!password) {
      return tErrors('validation.required')
    }

    if (password.length < 6) {
      return tCommon('validation.passwordTooShort')
    }

    return null
  }

  const handleSignUp = async () => {
    const validationError = validateForm()
    if (validationError) {
      if (Platform.OS === 'web') {
        window.alert(validationError)
      } else {
        Alert.alert(t('alerts.error'), validationError)
      }
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email.trim().toLowerCase(), password)

      if (error) {
        let errorMessage = tErrors('generic.somethingWentWrong')

        if (error.message?.includes('already registered')) {
          errorMessage = tErrors('auth.emailInUse')
        } else if (error.message?.includes('invalid email')) {
          errorMessage = tErrors('validation.invalidEmail')
        } else if (error.message?.includes('weak password')) {
          errorMessage = tErrors('auth.weakPassword')
        } else if (error.message) {
          errorMessage = error.message
        }

        if (Platform.OS === 'web') {
          window.alert(errorMessage)
        } else {
          Alert.alert(t('alerts.error'), errorMessage)
        }
      } else {
        trackSignUp('email');
        // Redirect to email confirmation page with the user's email
        router.replace(`/(auth)/email-confirmation?email=${encodeURIComponent(email.trim().toLowerCase())}`)
      }
    } catch {
      const errorMessage = tErrors('generic.somethingWentWrong')

      if (Platform.OS === 'web') {
        window.alert(errorMessage)
      } else {
        Alert.alert(t('alerts.error'), errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 120, padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'left',
            marginBottom: 8,
            color: colors.foreground
          }}>
            {t('signUp.title')}
          </Text>
          <Text style={{
            fontSize: 16,
            textAlign: 'left',
            marginBottom: 32,
            color: colors.mutedForeground
          }}>
            {t('signUp.subtitle')}
          </Text>

          {/* Apple Sign-in Button */}
          <AppleSignInButton disabled={loading} />
          {/* Google Sign-in Button */}
          <GoogleSignInButton disabled={loading} />

          {/* Divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 24
          }}>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.border
            }} />
            <Text style={{
              marginHorizontal: 16,
              color: colors.mutedForeground,
              fontSize: 14
            }}>
              {t('signIn.or')}
            </Text>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.border
            }} />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
              color: colors.foreground
            }}>
              {tCommon('labels.email')}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: colors.input,
                color: colors.foreground,
              }}
              placeholder={t('signUp.emailPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
              color: colors.foreground
            }}>
              {tCommon('labels.password')}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: colors.input,
                color: colors.foreground,
              }}
              placeholder={t('signUp.passwordPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
              passwordRules=""
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: loading ? colors.muted : colors.primary,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={{
              color: loading ? colors.mutedForeground : colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {loading ? t('signUp.creatingAccount') : t('signUp.signUpButton')}
            </Text>
          </TouchableOpacity>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 24
          }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
              {t('signUp.hasAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: '600'
              }}>
                {t('signUp.signIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
