'use client'

import { useAppToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useTranslation } from 'react-i18next'

export default function EmailSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tErrors } = useTranslation('errors')
  const { showToast } = useAppToast()

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

    return null
  }

  const handleSignIn = async () => {
    const validationError = validateForm()
    if (validationError) {
      showToast(validationError, { type: 'error' })
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email.trim().toLowerCase(), password)

      if (error) {
        let errorMessage = tErrors('auth.invalidCredentials')

        // Handle common Supabase authentication errors
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = tErrors('auth.invalidCredentials')
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = t('emailConfirmation.instruction')
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = tErrors('network.timeout')
        } else if (error.message?.includes('invalid email')) {
          errorMessage = tErrors('validation.invalidEmail')
        } else if (error.message?.includes('User not found')) {
          errorMessage = tErrors('auth.userNotFound')
        } else if (error.message) {
          errorMessage = error.message
        }

        showToast(errorMessage, { type: 'error' })
      } else {
        // The AuthGuard will handle the redirect automatically
      }
    } catch {
      const errorMessage = tErrors('generic.somethingWentWrong')

      showToast(errorMessage, { type: 'error' })
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

          {/* Title and Description */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{
              fontSize: 32,
              fontWeight: 'bold',
              textAlign: 'left',
              marginBottom: 8,
              color: colors.foreground
            }}>
              {t('emailSignIn.title')}
            </Text>
            <Text style={{
              fontSize: 16,
              textAlign: 'left',
              color: colors.mutedForeground,
              lineHeight: 22
            }}>
              {t('emailSignIn.subtitle')}
            </Text>
          </View>

          {/* Email Input */}
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
              placeholder={t('emailSignIn.emailPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          {/* Password Input with Forgot Password */}
          <View style={{ marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground
              }}>
                {tCommon('labels.password')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  {t('emailSignIn.forgotPassword')}
                </Text>
              </TouchableOpacity>
            </View>
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
              placeholder={t('emailSignIn.passwordPlaceholder')}
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

          {/* Sign In Button */}
          <TouchableOpacity
            style={{
              backgroundColor: loading ? colors.muted : colors.primary,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={{
              color: loading ? colors.mutedForeground : colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {loading ? t('emailSignIn.signingIn') : t('emailSignIn.signInButton')}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 24
          }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
              {t('emailSignIn.noAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: '600'
              }}>
                {t('emailSignIn.signUp')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
