import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Ionicons } from '@expo/vector-icons'

interface CitySelectorProps {
  onFilterPress: () => void
}

const CitySelector = React.memo(function CitySelector({
  onFilterPress,
}: CitySelectorProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('community')

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 16
    }}>
      <Text style={{
        fontSize: 14,
        color: colors.mutedForeground
      }}>
        {t('header.availablePlayers')}
      </Text>
      <TouchableOpacity
        style={{ padding: 4 }}
        onPress={onFilterPress}
      >
        <Ionicons
          name="options-outline"
          size={24}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
    </View>
  )
})

export default CitySelector