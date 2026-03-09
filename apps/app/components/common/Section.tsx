import React from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

interface SectionProps {
  title?: string
  children: React.ReactNode
  style?: ViewStyle
  contentStyle?: ViewStyle
  spacing?: 'none' | 'small' | 'medium' | 'large'
  showDivider?: boolean
}

const Section = React.memo(function Section({
  title,
  children,
  style,
  contentStyle,
  spacing = 'medium',
  showDivider = false,
}: SectionProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getSpacing = () => {
    switch (spacing) {
      case 'none':
        return 0
      case 'small':
        return 8
      case 'large':
        return 32
      default:
        return 16
    }
  }

  const spacingValue = getSpacing()

  return (
    <View style={[{ marginVertical: spacingValue }, style]}>
      {title && (
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.foreground,
          marginBottom: 12,
          paddingHorizontal: 16,
        }}>
          {title}
        </Text>
      )}
      
      <View style={contentStyle}>
        {children}
      </View>
      
      {showDivider && (
        <View style={{
          height: 1,
          backgroundColor: colors.border,
          marginTop: spacingValue,
          marginHorizontal: 16,
        }} />
      )}
    </View>
  )
})

export default Section