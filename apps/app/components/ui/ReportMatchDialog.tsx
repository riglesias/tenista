'use client'

import React, { useState } from 'react'
import { Modal, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Flag, X } from 'lucide-react-native'

const REPORT_REASONS = ['incorrectResult', 'neverPlayed'] as const
type ReportReason = typeof REPORT_REASONS[number]

interface ReportMatchDialogProps {
  visible: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  loading?: boolean
}

export default function ReportMatchDialog({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: ReportMatchDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('match')

  const handleClose = () => {
    setSelectedReason(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedReason) return
    await onSubmit(t(`report.${selectedReason}`))
    setSelectedReason(null)
  }

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
                {t('report.title')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading} style={{ padding: 4 }}>
              <X size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Reason prompt */}
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginBottom: 16,
            }}
          >
            {t('report.selectReason')}
          </Text>

          {/* Reason options */}
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason
            return (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                disabled={loading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.destructive : colors.border,
                  backgroundColor: isSelected ? `${colors.destructive}10` : colors.card,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.destructive : colors.mutedForeground,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.destructive,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: colors.foreground,
                  }}
                >
                  {t(`report.${reason}`)}
                </Text>
              </TouchableOpacity>
            )
          })}

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
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
                backgroundColor: selectedReason && !loading ? colors.destructive : colors.muted,
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={handleSubmit}
              disabled={!selectedReason || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={{
                    color: selectedReason ? '#fff' : colors.mutedForeground,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {t('report.submit')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
