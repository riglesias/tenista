import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import React from 'react'
import { View, ViewStyle } from 'react-native'
import { Skeleton } from '@/components/ui/LoadingSpinner'
import { createOnboardingStyles } from './onboarding-styles'

interface ProfileFormSkeletonProps {
  style?: ViewStyle
}

export function ProfileFormSkeleton({ style }: ProfileFormSkeletonProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const onboardingStyles = createOnboardingStyles(isDark)

  return (
    <View style={style}>
      {/* Avatar Skeleton */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Skeleton width={120} height={120} borderRadius={60} />
        <View style={{ 
          position: 'absolute', 
          bottom: 0, 
          right: '50%',
          marginRight: -60,
          backgroundColor: colors.background,
          borderRadius: 15,
          padding: 2
        }}>
          <Skeleton width={30} height={30} borderRadius={15} />
        </View>
      </View>

      {/* First Name Field Skeleton */}
      <View style={onboardingStyles.fieldContainer}>
        <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={48} borderRadius={8} />
      </View>

      {/* Last Name Field Skeleton */}
      <View style={onboardingStyles.fieldContainer}>
        <Skeleton width={75} height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={48} borderRadius={8} />
      </View>

      {/* Gender Field Skeleton */}
      <View style={onboardingStyles.fieldContainer}>
        <Skeleton width={50} height={16} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', gap: 32, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <Skeleton width={35} height={16} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <Skeleton width={50} height={16} />
          </View>
        </View>
        <Skeleton width={180} height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  )
}