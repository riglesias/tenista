'use client'

import { BackButton } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { router, useLocalSearchParams } from 'expo-router'
import { KeyRound } from 'lucide-react-native'
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
import { useAppToast } from '@/components/ui/Toast'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

export default function ResetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const insets = useSafeAreaInsets()
  const { verifyPasswordResetOtp, updatePassword, resetPassword } = useAuth()
  const { t } = useTranslation('auth')
  const { t: tErrors } = useTranslation('errors')
  const { showToast } = useAppToast()

  // Step 1: OTP verification, Step 2: New password
  const [step, setStep] = useState<'otp' | 'password'>('otp')

  // OTP state
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef<(TextInput | null)[]>([])

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (!email || code.length !== OTP_LENGTH) return

    setIsVerifying(true)
    setError(null)

    const { error: verifyError } = await verifyPasswordResetOtp(email, code)

    if (verifyError) {
      setIsVerifying(false)
      const msg = verifyError.message?.toLowerCase() || ''
      if (msg.includes('expired') || msg.includes('token has expired')) {
        setError(t('resetPassword.errors.expired'))
      } else if (msg.includes('invalid') || msg.includes('otp')) {
        setError(t('resetPassword.errors.invalidCode'))
      } else {
        setError(t('resetPassword.errors.generic'))
      }
      return
    }

    setIsVerifying(false)
    setStep('password')
  }, [email, verifyPasswordResetOtp, t])

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
          inputRefs.current[OTP_LENGTH - 1]?.blur()
          handleVerifyOtp(pasted)
        } else {
          inputRefs.current[pasted.length]?.focus()
        }
        return
      }
    }

    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError(null)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (digit && index === OTP_LENGTH - 1) {
      const code = newDigits.join('')
      if (code.length === OTP_LENGTH) {
        inputRefs.current[index]?.blur()
        handleVerifyOtp(code)
      }
    }
  }, [digits, handleVerifyOtp])

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
    const { error: resendError } = await resetPassword(email)

    if (resendError) {
      setError(t('resetPassword.errors.resendFailed'))
      return
    }

    setCooldown(RESEND_COOLDOWN_SECONDS)
    setDigits(Array(OTP_LENGTH).fill(''))
    inputRefs.current[0]?.focus()
  }, [email, cooldown, resetPassword, t])

  const handleSetNewPassword = useCallback(async () => {
    if (newPassword.length < 6) {
      setError(t('resetPassword.errors.passwordTooShort'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.errors.passwordMismatch'))
      return
    }

    setIsSaving(true)
    setError(null)

    const { error: updateError } = await updatePassword(newPassword)

    if (updateError) {
      setIsSaving(false)
      setError(t('resetPassword.errors.updateFailed'))
      return
    }

    setIsSaving(false)
    showToast(t('resetPassword.successMessage'), { type: 'success' })
    router.replace('/(auth)/email-sign-in')
  }, [newPassword, confirmPassword, updatePassword, t, showToast])

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
              <KeyRound size={32} color={colors.primaryForeground} />
            </View>

            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 12,
              color: colors.foreground
            }}>
              {step === 'otp'
                ? t('resetPassword.title')
                : t('resetPassword.newPasswordTitle')}
            </Text>

            <Text style={{
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
              color: colors.mutedForeground
            }}>
              {step === 'otp'
                ? t('resetPassword.subtitle')
                : t('resetPassword.newPasswordSubtitle')}
            </Text>

            {step === 'otp' && (
              <Text style={{
                fontSize: 16,
                textAlign: 'center',
                fontWeight: '600',
                color: colors.foreground,
                marginTop: 4
              }}>
                {email || ''}
              </Text>
            )}
          </View>

          {step === 'otp' ? (
            <>
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
                      ? t('resetPassword.resendCooldown', { seconds: cooldown })
                      : t('resetPassword.resendCode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* New Password Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  color: colors.foreground
                }}>
                  {t('resetPassword.newPassword')}
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
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              {/* Confirm Password Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  color: colors.foreground
                }}>
                  {t('resetPassword.confirmPassword')}
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
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
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

              {/* Save Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: isSaving ? colors.muted : colors.primary,
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                  marginTop: 8,
                }}
                onPress={handleSetNewPassword}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Text style={{
                    color: colors.primaryForeground,
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {t('resetPassword.saveButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
            {t('resetPassword.backToSignIn')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
