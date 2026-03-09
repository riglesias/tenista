'use client'

import { BackButton } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { router, useLocalSearchParams } from 'expo-router'
import { ShieldCheck } from 'lucide-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

export default function EmailConfirmation() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const insets = useSafeAreaInsets()
  const { verifySignUpOtp, resendSignUpOtp } = useAuth()
  const { t } = useTranslation('auth')

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleVerify = useCallback(async (code: string) => {
    if (!email || code.length !== OTP_LENGTH) return

    setIsVerifying(true)
    setError(null)

    const { error: verifyError } = await verifySignUpOtp(email, code)

    if (verifyError) {
      setIsVerifying(false)
      const msg = verifyError.message?.toLowerCase() || ''
      if (msg.includes('expired') || msg.includes('token has expired')) {
        setError(t('emailConfirmation.errors.expired'))
      } else if (msg.includes('invalid') || msg.includes('otp')) {
        setError(t('emailConfirmation.errors.invalid'))
      } else {
        setError(t('emailConfirmation.errors.generic'))
      }
      return
    }

    // Success — onAuthStateChange fires SIGNED_IN, AuthGuard handles redirect
  }, [email, verifySignUpOtp, t])

  const handleDigitChange = useCallback((index: number, value: string) => {
    // Handle paste of full code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      if (pasted.length > 0) {
        const newDigits = Array(OTP_LENGTH).fill('')
        for (let i = 0; i < pasted.length; i++) {
          newDigits[i] = pasted[i]
        }
        setDigits(newDigits)
        setError(null)

        if (pasted.length === OTP_LENGTH) {
          // Blur all inputs and verify
          inputRefs.current[OTP_LENGTH - 1]?.blur()
          handleVerify(pasted)
        } else {
          // Focus next empty input
          inputRefs.current[pasted.length]?.focus()
        }
        return
      }
    }

    // Single digit entry
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError(null)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits filled
    if (digit && index === OTP_LENGTH - 1) {
      const code = newDigits.join('')
      if (code.length === OTP_LENGTH) {
        inputRefs.current[index]?.blur()
        handleVerify(code)
      }
    }
  }, [digits, handleVerify])

  const handleKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
      inputRefs.current[index - 1]?.focus()
    }
  }, [digits])

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return

    setError(null)
    const { error: resendError } = await resendSignUpOtp(email)

    if (resendError) {
      setError(t('emailConfirmation.errors.resendFailed'))
      return
    }

    setCooldown(RESEND_COOLDOWN_SECONDS)
    // Clear inputs for fresh entry
    setDigits(Array(OTP_LENGTH).fill(''))
    inputRefs.current[0]?.focus()
  }, [email, cooldown, resendSignUpOtp, t])

  const handleBackToSignIn = () => {
    router.replace('/(auth)/sign-in')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackButton variant="section" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <ShieldCheck size={32} color={colors.primaryForeground} />
            </View>

            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
              color: colors.foreground
            }}>
              {t('emailConfirmation.title')}
            </Text>

            <Text style={{
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
              color: colors.mutedForeground
            }}>
              {t('emailConfirmation.subtitle')}
            </Text>

            <Text style={{
              fontSize: 16,
              textAlign: 'center',
              fontWeight: '600',
              color: colors.foreground,
              marginTop: 4
            }}>
              {email || ''}
            </Text>
          </View>

          {/* OTP Inputs */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16
          }}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref }}
                value={digit}
                onChangeText={value => handleDigitChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                textContentType="oneTimeCode"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                editable={!isVerifying}
                autoFocus={index === 0}
                selectTextOnFocus
                style={{
                  width: 48,
                  height: 56,
                  borderWidth: 2,
                  borderColor: error ? '#ef4444' : digit ? colors.primary : colors.border,
                  borderRadius: 12,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
              />
            ))}
          </View>

          {/* Error message */}
          {error && (
            <Text style={{
              color: '#ef4444',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 16
            }}>
              {error}
            </Text>
          )}

          {/* Loading indicator */}
          {isVerifying && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* Resend button */}
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldown > 0 || !email || isVerifying}
            >
              <Text style={{
                color: cooldown > 0 ? colors.mutedForeground : colors.primary,
                fontSize: 14,
                fontWeight: '600',
              }}>
                {cooldown > 0
                  ? t('emailConfirmation.resendCooldown', { seconds: cooldown })
                  : t('emailConfirmation.resendCode')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Back to Sign In - Fixed at bottom */}
      <View style={{
        padding: 20,
        paddingBottom: Math.max(insets.bottom, 20),
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            width: '100%'
          }}
          onPress={handleBackToSignIn}
        >
          <Text style={{
            color: colors.foreground,
            fontSize: 16,
            fontWeight: '600'
          }}>
            {t('emailConfirmation.backToSignIn')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
