'use client'

import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Ionicons } from '@expo/vector-icons'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: string
}

export default function StatsCard({ title, value, icon }: StatsCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <View
      className="flex-1 items-center rounded-lg border p-4"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={20}
          color={colors.mutedForeground}
          className="mb-2"
        />
      )}
      <Text
        className="text-2xl font-bold mb-1"
        style={{ color: colors.foreground }}
      >
        {value}
      </Text>
      <Text
        className="text-xs text-center"
        style={{ color: colors.mutedForeground }}
      >
        {title}
      </Text>
    </View>
  )
}
