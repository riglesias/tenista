'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { AlertTriangle, X } from 'lucide-react-native'
import React, { useState } from 'react'
import {
  Alert,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface DeleteAccountModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading?: boolean
}

export default function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  loading = false
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning')
  const [confirmationText, setConfirmationText] = useState('')
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const handleClose = () => {
    setStep('warning')
    setConfirmationText('')
    onClose()
  }

  const handleContinue = () => {
    setStep('confirmation')
  }

  const handleConfirmDeletion = async () => {
    if (confirmationText !== 'DELETE') {
      if (Platform.OS === 'web') {
        window.alert('You must type "DELETE" exactly to confirm')
      } else {
        Alert.alert('Invalid Confirmation', 'You must type "DELETE" exactly to confirm')
      }
      return
    }

    try {
      await onConfirm()
      handleClose()
    } catch {
      // Error handling is done in the parent component
    }
  }

  const isConfirmationValid = confirmationText === 'DELETE'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <AlertTriangle size={24} color="#ef4444" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.foreground,
              }}>
                Delete Account
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={{
                padding: 4,
              }}
            >
              <X size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {step === 'warning' && (
            <>
              <Text style={{
                fontSize: 16,
                color: colors.foreground,
                marginBottom: 16,
                lineHeight: 24,
              }}>
                This action will permanently delete your account and all associated data, including:
              </Text>

              <View style={{ marginBottom: 20 }}>
                {[
                  'Your profile and personal information',
                  'Your tennis rating and match history',
                  'Your league memberships and standings',
                  'Your tournament participations',
                  'All uploaded photos and documents'
                ].map((item, index) => (
                  <Text key={index} style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    marginBottom: 8,
                    paddingLeft: 16,
                  }}>
                    • {item}
                  </Text>
                ))}
              </View>

              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ef4444',
                marginBottom: 24,
                textAlign: 'center',
              }}>
                This action cannot be undone.
              </Text>

              <View style={{
                flexDirection: 'row',
                gap: 12,
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.secondary,
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                  }}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={{
                    color: colors.secondaryForeground,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                  }}
                  onPress={handleContinue}
                  disabled={loading}
                >
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'confirmation' && (
            <>
              <Text style={{
                fontSize: 16,
                color: colors.foreground,
                marginBottom: 20,
                lineHeight: 24,
              }}>
                To confirm account deletion, please type{' '}
                <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>DELETE</Text>
                {' '}in the field below:
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
                  marginBottom: 24,
                }}
                placeholder="Type DELETE to confirm"
                placeholderTextColor={colors.mutedForeground}
                value={confirmationText}
                onChangeText={setConfirmationText}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />

              <View style={{
                flexDirection: 'row',
                gap: 12,
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.secondary,
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                  }}
                  onPress={() => setStep('warning')}
                  disabled={loading}
                >
                  <Text style={{
                    color: colors.secondaryForeground,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Back
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: isConfirmationValid && !loading ? '#ef4444' : colors.muted,
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                  }}
                  onPress={handleConfirmDeletion}
                  disabled={!isConfirmationValid || loading}
                >
                  <Text style={{
                    color: isConfirmationValid && !loading ? '#ffffff' : colors.mutedForeground,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    {loading ? 'Deleting...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}