'use client'

import { useAppToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { router } from 'expo-router'
import React, { useState } from 'react'
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tErrors } = useTranslation('errors')
  const { showToast } = useAppToast()

  const validateForm = () => {
    if (!email.trim()) {
      return tErrors('validation.required')
    }

    if (!email.includes('@') || !email.includes('.')) {
      return tErrors('validation.invalidEmail')
    }

    return null
  }

  const handleResetPassword = async () => {
    const validationError = validateForm()
    if (validationError) {
      showToast(validationError, { type: 'error' })
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email.trim().toLowerCase())

      if (error) {
        let errorMessage = tErrors('generic.somethingWentWrong')

        // Handle common Supabase errors
        if (error.message?.includes('User not found')) {
          errorMessage = tErrors('auth.userNotFound')
        } else if (error.message?.includes('invalid email')) {
          errorMessage = tErrors('validation.invalidEmail')
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = tErrors('network.timeout')
        } else if (error.message) {
          errorMessage = error.message
        }

        showToast(errorMessage, { type: 'error' })
      } else {
        const successMessage = t('forgotPassword.successMessage')

        showToast(successMessage, { type: 'success' })
        router.back()
      }
    } catch (err) {
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

          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'left',
            marginBottom: 8,
            color: colors.foreground
          }}>
            {t('forgotPassword.title')}
          </Text>
          <Text style={{
            fontSize: 16,
            textAlign: 'left',
            marginBottom: 32,
            color: colors.mutedForeground,
            lineHeight: 24
          }}>
            {t('forgotPassword.subtitle')}
          </Text>

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
              placeholder={t('forgotPassword.emailPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
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
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={{
              color: loading ? colors.mutedForeground : colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600'
            }}>
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
            </Text>
          </TouchableOpacity>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 24
          }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: '600'
              }}>
                {t('forgotPassword.backToSignIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
