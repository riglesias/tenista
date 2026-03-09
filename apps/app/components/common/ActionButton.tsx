import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, ViewStyle } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

interface ActionButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

const ActionButton = React.memo(function ActionButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ActionButtonProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          color: colors.secondaryForeground,
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          color: colors.foreground,
        }
      case 'destructive':
        return {
          backgroundColor: colors.destructive,
          borderColor: colors.destructive,
          color: colors.destructiveForeground,
        }
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          color: colors.primaryForeground,
        }
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          minHeight: 36,
        }
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18,
          minHeight: 56,
        }
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          minHeight: 48,
        }
    }
  }

  const variantStyle = getVariantStyle()
  const sizeStyle = getSizeStyle()
  
  const isDisabled = disabled || loading

  const buttonStyle = {
    backgroundColor: variantStyle.backgroundColor,
    borderWidth: 1,
    borderColor: variantStyle.borderColor,
    borderRadius: 8,
    paddingVertical: sizeStyle.paddingVertical,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    minHeight: sizeStyle.minHeight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { alignSelf: 'stretch' as const }),
  }

  const textStyle = {
    color: variantStyle.color,
    fontSize: sizeStyle.fontSize,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyle.color}
          style={{ marginRight: title ? 8 : 0 }}
        />
      ) : null}
      {title && (
        <Text style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
})

export default ActionButton