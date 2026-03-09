'use client'

import React, { useState } from 'react'
import { Modal, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Flag, X } from 'lucide-react-native'

interface ReportResultDialogProps {
  visible: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  loading?: boolean
}

export default function ReportResultDialog({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: ReportResultDialogProps) {
  const [reason, setReason] = useState('')
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return
    await onSubmit(reason.trim())
    setReason('')
  }

  const isValid = reason.trim().length >= 10

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Flag size={20} color={colors.destructive} style={{ marginRight: 10 }} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: colors.foreground,
                }}
              >
                {t('detail.reportResult')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading} style={{ padding: 4 }}>
              <X size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Reason input */}
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginBottom: 12,
            }}
          >
            {t('detail.reportReason')}
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              backgroundColor: colors.input,
              color: colors.foreground,
              marginBottom: 20,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder={t('detail.reportReason')}
            placeholderTextColor={colors.mutedForeground}
            value={reason}
            onChangeText={setReason}
            multiline
            editable={!loading}
          />

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.muted,
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
              }}
              onPress={handleClose}
              disabled={loading}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                {t('alerts.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: isValid && !loading ? colors.destructive : colors.muted,
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={{
                    color: isValid ? '#fff' : colors.mutedForeground,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {t('detail.reportResult')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
