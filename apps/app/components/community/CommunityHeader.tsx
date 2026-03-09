import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Zap, ChevronDown } from 'lucide-react-native'

interface CommunityHeaderProps {
  onAvailabilityToggle: () => void
  isAvailableToday: boolean
  isUpdatingAvailability?: boolean
  cityName?: string
  onLocationPress: () => void
}

const CommunityHeader = React.memo(function CommunityHeader({
  onAvailabilityToggle,
  isAvailableToday,
  isUpdatingAvailability = false,
  cityName,
  onLocationPress,
}: CommunityHeaderProps) {
  const { isDark, theme } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('community')

  return (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 24, 
      paddingTop: 64, 
      paddingBottom: 16 
    }}>
      <TouchableOpacity
        onPress={onLocationPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
        activeOpacity={0.7}
      >
        <Text style={[theme.typography.h2, { color: colors.foreground }]}>
          {cityName || t('title')}
        </Text>
        <ChevronDown
          size={24}
          color={colors.mutedForeground}
          style={{ marginTop: 2 }}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: isAvailableToday ? colors.primary : colors.muted,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          opacity: isUpdatingAvailability ? 0.6 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
        onPress={onAvailabilityToggle}
        disabled={isUpdatingAvailability}
      >
        {!isAvailableToday && (
          <Zap size={14} color={colors.mutedForeground} />
        )}
        <Text style={{
          color: isAvailableToday ? colors.primaryForeground : colors.mutedForeground,
          fontSize: 13,
          fontWeight: '600'
        }}>
          {isAvailableToday ? t('header.availableToday') : t('header.playNowMode')}
        </Text>
      </TouchableOpacity>
    </View>
  )
})

export default CommunityHeader