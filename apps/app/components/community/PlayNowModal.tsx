import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react-native'
import BottomSheet from '@/components/ui/BottomSheet'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { getThemeColors } from '@/lib/utils/theme'

interface PlayNowModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export default function PlayNowModal({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}: PlayNowModalProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('community')
  const { enableNotifications } = useNotifications()

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.58]}>
      <View style={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 50,
              marginBottom: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Zap size={32} color={colors.primaryForeground} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 6
            }}
          >
            {t('playNow.modal.title')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.mutedForeground,
              textAlign: 'center',
              paddingHorizontal: 20
            }}
          >
            {t('playNow.modal.subtitle')}
          </Text>
        </View>

        {/* Features List */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  marginTop: 6,
                  marginRight: 16
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.foreground,
                    marginBottom: 2
                  }}
                >
                  {t('playNow.modal.priorityTitle')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    lineHeight: 20
                  }}
                >
                  {t('playNow.modal.priorityDescription')}
                </Text>
              </View>
            </View>
          </View>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  marginTop: 6,
                  marginRight: 16
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.foreground,
                    marginBottom: 2
                  }}
                >
                  {t('playNow.modal.notificationsTitle')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    lineHeight: 20
                  }}
                >
                  {t('playNow.modal.notificationsDescription')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
            }}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground
              }}
            >
              {t('playNow.modal.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              opacity: isLoading ? 0.7 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={async () => {
              // Request notification permission and register token
              // Proceed with Play Now regardless of permission result
              try {
                await enableNotifications()
              } catch {
                // Permission denied or unavailable — still proceed
              }
              onConfirm()
            }}
            disabled={isLoading}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.primaryForeground
              }}
            >
              {isLoading ? t('playNow.modal.enabling') : t('playNow.modal.enable')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  )
}