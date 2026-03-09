import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  variant?: 'default' | 'compact' | 'large' | 'horizontal'
  color?: string
  onPress?: () => void
  style?: ViewStyle
  suffix?: string
  prefix?: string
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  color,
  onPress,
  style,
  suffix,
  prefix,
}: StatCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    }

    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          padding: 8,
          minHeight: 60,
        }
      case 'large':
        return {
          ...baseStyle,
          padding: 20,
          minHeight: 120,
        }
      case 'horizontal':
        return {
          ...baseStyle,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
        }
      default:
        return {
          ...baseStyle,
          padding: 12,
          minHeight: 80,
          flex: 1,
        }
    }
  }

  const getTitleStyle = () => {
    const baseStyle = {
      color: colors.mutedForeground,
      textAlign: 'center' as const,
    }

    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          fontSize: 11,
          marginBottom: 2,
        }
      case 'large':
        return {
          ...baseStyle,
          fontSize: 14,
          marginBottom: 8,
        }
      case 'horizontal':
        return {
          ...baseStyle,
          fontSize: 14,
          textAlign: 'left' as const,
          flex: 1,
        }
      default:
        return {
          ...baseStyle,
          fontSize: 12,
          marginBottom: 4,
        }
    }
  }

  const getValueStyle = () => {
    const baseStyle = {
      color: color || colors.foreground,
      fontWeight: 'bold' as const,
    }

    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          fontSize: 16,
        }
      case 'large':
        return {
          ...baseStyle,
          fontSize: 28,
        }
      case 'horizontal':
        return {
          ...baseStyle,
          fontSize: 20,
        }
      default:
        return {
          ...baseStyle,
          fontSize: 24,
        }
    }
  }

  const formatValue = () => {
    let formattedValue = value.toString()
    if (prefix) formattedValue = `${prefix}${formattedValue}`
    if (suffix) formattedValue = `${formattedValue}${suffix}`
    return formattedValue
  }

  const renderContent = () => {
    if (variant === 'horizontal') {
      return (
        <>
          <View style={{ flex: 1 }}>
            <Text style={getTitleStyle()}>{title}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon && (
              <Ionicons
                name={icon as any}
                size={20}
                color={color || colors.mutedForeground}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={getValueStyle()}>{formatValue()}</Text>
          </View>
        </>
      )
    }

    return (
      <>
        {icon && (
          <Ionicons
            name={icon as any}
            size={variant === 'large' ? 28 : variant === 'compact' ? 16 : 20}
            color={color || colors.mutedForeground}
            style={{ 
              marginBottom: variant === 'large' ? 8 : variant === 'compact' ? 2 : 6 
            }}
          />
        )}
        <Text style={getTitleStyle()}>{title}</Text>
        <Text style={getValueStyle()}>{formatValue()}</Text>
        {subtitle && (
          <Text style={{
            fontSize: variant === 'compact' ? 10 : 11,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        )}
      </>
    )
  }

  const cardStyle = [getVariantStyle(), style]

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={cardStyle}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    )
  }

  return (
    <View style={cardStyle}>
      {renderContent()}
    </View>
  )
}

// Badge component for labels and tags
interface BadgeProps {
  label: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'small' | 'medium' | 'large'
  style?: ViewStyle
}

export function Badge({
  label,
  variant = 'primary',
  size = 'medium',
  style,
}: BadgeProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: size === 'small' ? 6 : size === 'large' ? 12 : 8,
      paddingHorizontal: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingVertical: size === 'small' ? 4 : size === 'large' ? 8 : 6,
    }

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
        }
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#10b981',
        }
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#f59e0b',
        }
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.destructive,
        }
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        }
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        }
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.secondaryForeground
      case 'success':
      case 'warning':
      case 'danger':
        return 'white'
      case 'outline':
        return colors.foreground
      default:
        return colors.primaryForeground
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12
      case 'large':
        return 16
      default:
        return 14
    }
  }

  return (
    <View style={[getVariantStyle(), style]}>
      <Text
        style={{
          color: getTextColor(),
          fontSize: getTextSize(),
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  )
}