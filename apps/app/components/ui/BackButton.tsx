'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface BackButtonProps {
  /** Custom back action - defaults to router.back() */
  onPress?: () => void
  /** Custom text label - defaults to 'Back' */
  text?: string
  /** Layout variant - 'inline' for absolute positioning, 'section' for full-width container */
  variant?: 'inline' | 'section'
  /** Show/hide text label - defaults to true */
  showText?: boolean
  /** Custom button styling */
  style?: ViewStyle
  /** Custom container styling (only applies to 'section' variant) */
  containerStyle?: ViewStyle
  /** Test ID for automated testing */
  testID?: string
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress = () => router.back(),
  text = 'Back',
  variant = 'inline',
  showText = true,
  style,
  containerStyle,
  testID = 'back-button',
}) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const insets = useSafeAreaInsets()

  const buttonContent = (
    <>
      <ArrowLeft size={20} color={colors.foreground} />
      {showText && (
        <Text style={{
          marginLeft: 8,
          fontSize: 16,
          color: colors.foreground,
          fontWeight: '500',
        }}>
          {text}
        </Text>
      )}
    </>
  )

  const buttonStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
  }

  if (variant === 'section') {
    return (
      <View 
        style={[
          {
            paddingTop: insets.top + 8,
            paddingBottom: 8,
            paddingHorizontal: 20,
            backgroundColor: colors.background,
          },
          containerStyle
        ]}
      >
        <TouchableOpacity
          style={[buttonStyle, style]}
          onPress={onPress}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={`${text} button`}
          accessibilityHint="Navigate back to previous screen"
        >
          {buttonContent}
        </TouchableOpacity>
      </View>
    )
  }

  // 'inline' variant - absolute positioning
  return (
    <TouchableOpacity
      style={[
        {
          position: 'absolute',
          top: insets.top + 16,
          left: 20,
          zIndex: 10,
          ...buttonStyle,
        },
        style
      ]}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${text} button`}
      accessibilityHint="Navigate back to previous screen"
    >
      {buttonContent}
    </TouchableOpacity>
  )
}

export default BackButton