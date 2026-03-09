import React from 'react'
import { Text, View } from 'react-native'

export type BadgeVariant = 'info' | 'warning' | 'success' | 'destructive'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
}

const badgeColors: Record<BadgeVariant, { background: string; text: string }> = {
  info: {
    background: 'rgba(99, 102, 241, 0.2)',
    text: 'rgb(99, 102, 241)',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.2)',
    text: 'rgb(245, 158, 11)',
  },
  success: {
    background: 'rgba(34, 197, 94, 0.2)',
    text: 'rgb(34, 197, 94)',
  },
  destructive: {
    background: 'rgba(239, 68, 68, 0.2)',
    text: 'rgb(239, 68, 68)',
  },
}

export default function Badge({ children, variant = 'info', size = 'md' }: BadgeProps) {
  const colors = badgeColors[variant]
  
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, borderRadius: 6 }
      case 'lg':
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, borderRadius: 12 }
      default:
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, borderRadius: 8 }
    }
  }
  
  const sizeStyles = getSizeStyles()
  
  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
        borderRadius: sizeStyles.borderRadius,
      }}
    >
      <Text
        style={{
          fontSize: sizeStyles.fontSize,
          color: colors.text,
          fontWeight: '600',
          textTransform: 'capitalize',
        }}
      >
        {children}
      </Text>
    </View>
  )
}