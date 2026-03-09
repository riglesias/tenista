import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import React from 'react'
import { ActivityIndicator, Text, View, ViewStyle } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  text?: string
  color?: string
  style?: ViewStyle
  variant?: 'default' | 'overlay' | 'inline'
}

export default function LoadingSpinner({
  size = 'large',
  text,
  color,
  style,
  variant = 'default',
}: LoadingSpinnerProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const spinnerColor = color || colors.primary

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      justifyContent: 'center',
      alignItems: 'center',
    }

    switch (variant) {
      case 'overlay':
        return {
          ...baseStyle,
          flex: 1,
          backgroundColor: colors.background,
        }
      case 'inline':
        return {
          ...baseStyle,
          paddingVertical: 16,
        }
      default:
        return {
          ...baseStyle,
          flex: 1,
          padding: 16,
        }
    }
  }

  return (
    <View style={[getContainerStyle(), style]}>
      <ActivityIndicator 
        size={size} 
        color={spinnerColor}
      />
      {text && (
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          {text}
        </Text>
      )}
    </View>
  )
}

// Skeleton component for advanced loading states
interface SkeletonProps {
  width: number | string
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        style,
      ]}
    />
  )
}