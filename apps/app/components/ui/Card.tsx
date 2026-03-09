import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import React from 'react'
import { TouchableOpacity, View, ViewStyle } from 'react-native'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: number
  margin?: number
  style?: ViewStyle
  disabled?: boolean
  activeOpacity?: number
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 16,
  margin = 12,
  style,
  disabled = false,
  activeOpacity = 0.7,
}: CardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding,
      marginBottom: margin,
    }

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
        }
      case 'elevated':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
      default:
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
        }
    }
  }

  const cardStyle = [getVariantStyle(), style]

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        disabled={disabled}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  )
}