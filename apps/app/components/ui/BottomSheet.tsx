import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

const { height: screenHeight } = Dimensions.get('window')

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  snapPoints?: number[]
}

// Inner content component that uses safe area insets
function BottomSheetContent({
  children,
  colors,
}: {
  children: React.ReactNode
  colors: ReturnType<typeof getThemeColors>
}) {
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) }}>
      {children}
    </View>
  )
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [0.4],
}: BottomSheetProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const translateY = useRef(new Animated.Value(screenHeight)).current

  const maxSnapPoint = Math.max(...snapPoints)
  const sheetHeight = screenHeight * maxSnapPoint

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight])


  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaProvider>
        {/* Backdrop */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: sheetHeight,
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY }],
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.muted,
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 12,
              marginBottom: 20,
            }}
          />

          {/* Content */}
          <BottomSheetContent colors={colors}>
            {children}
          </BottomSheetContent>
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  )
}
