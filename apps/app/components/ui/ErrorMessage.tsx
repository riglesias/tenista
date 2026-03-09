import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { AlertCircle, RefreshCw } from 'lucide-react-native'
import React from 'react'
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  retryText?: string
  icon?: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'card' | 'inline'
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  icon,
  style,
  variant = 'default',
}: ErrorMessageProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }

    switch (variant) {
      case 'card':
        return {
          ...baseStyle,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          margin: 16,
        }
      case 'inline':
        return {
          ...baseStyle,
          padding: 16,
        }
      default:
        return {
          ...baseStyle,
          flex: 1,
          backgroundColor: colors.background,
        }
    }
  }

  const defaultIcon = (
    <AlertCircle 
      size={48} 
      color={colors.destructive}
    />
  )

  return (
    <View style={[getContainerStyle(), style]}>
      {/* Icon */}
      <View style={{ marginBottom: 16 }}>
        {icon || defaultIcon}
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {/* Message */}
      <Text
        style={{
          fontSize: 16,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginBottom: onRetry ? 24 : 0,
          lineHeight: 22,
        }}
      >
        {message}
      </Text>

      {/* Retry Button */}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={retryText}
        >
          <RefreshCw 
            size={16} 
            color={colors.primaryForeground}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {retryText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// Specialized error components for common use cases
interface EmptyStateProps {
  title: string
  message: string
  icon?: React.ReactNode
  action?: {
    label: string
    onPress: () => void
  }
  style?: ViewStyle
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  style,
}: EmptyStateProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        },
        style,
      ]}
    >
      {icon && (
        <View style={{ marginBottom: 16 }}>
          {icon}
        </View>
      )}

      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginBottom: action ? 24 : 0,
          lineHeight: 22,
        }}
      >
        {message}
      </Text>

      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}