import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import React from 'react'
import { ActivityIndicator, Text, View, ViewStyle } from 'react-native'
import { Skeleton } from './LoadingSpinner'

interface LoadingStateProps {
  loading: boolean
  error?: Error | null
  data?: any
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  emptyWhen?: (data: any) => boolean
  style?: ViewStyle
}

export function LoadingState({
  loading,
  error,
  data,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyWhen,
  style,
}: LoadingStateProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  if (loading) {
    return (
      <View style={[{ flex: 1 }, style]}>
        {loadingComponent || (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    )
  }

  if (error) {
    return (
      <View style={[{ flex: 1 }, style]}>
        {errorComponent || (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.destructive, textAlign: 'center', marginBottom: 8 }}>
              Something went wrong
            </Text>
            <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
              {error.message}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const isEmpty = emptyWhen ? emptyWhen(data) : 
    data === null || data === undefined || 
    (Array.isArray(data) && data.length === 0)

  if (isEmpty) {
    return (
      <View style={[{ flex: 1 }, style]}>
        {emptyComponent || (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
              No data available
            </Text>
          </View>
        )}
      </View>
    )
  }

  return <View style={style}>{children}</View>
}

// Specialized loading states for different scenarios
interface ListLoadingProps {
  itemCount?: number
  itemHeight?: number
  showHeader?: boolean
  style?: ViewStyle
}

export function ListLoadingSkeleton({ 
  itemCount = 5, 
  itemHeight = 60,
  showHeader = false,
  style 
}: ListLoadingProps) {
  useTheme()

  return (
    <View style={[{ padding: 16 }, style]}>
      {showHeader && (
        <Skeleton 
          width="60%" 
          height={24} 
          style={{ marginBottom: 16 }}
        />
      )}
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
              <Skeleton width="50%" height={14} />
            </View>
            <Skeleton width={60} height={20} borderRadius={10} />
          </View>
        </View>
      ))}
    </View>
  )
}

interface CardLoadingProps {
  cardCount?: number
  showTitle?: boolean
  style?: ViewStyle
}

export function CardLoadingSkeleton({ 
  cardCount = 3, 
  showTitle = true,
  style 
}: CardLoadingProps) {
  return (
    <View style={[{ padding: 16 }, style]}>
      {showTitle && (
        <Skeleton 
          width="40%" 
          height={28} 
          style={{ marginBottom: 20 }}
        />
      )}
      {Array.from({ length: cardCount }).map((_, index) => (
        <View key={index} style={{ 
          marginBottom: 16, 
          padding: 16, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <Skeleton width="80%" height={20} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={16} />
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <Skeleton width={80} height={24} borderRadius={12} />
            <Skeleton width={60} height={24} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  )
}

// Profile loading skeleton
export function ProfileLoadingSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ padding: 20 }, style]}>
      {/* Avatar and name */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
        <Skeleton width={120} height={20} style={{ marginBottom: 6 }} />
        <Skeleton width={80} height={16} />
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 8 }}>
            <Skeleton width={30} height={24} style={{ marginBottom: 6 }} />
            <Skeleton width={50} height={14} />
          </View>
        ))}
      </View>

      {/* Info sections */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ marginBottom: 16 }}>
          <Skeleton width="30%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={14} />
        </View>
      ))}
    </View>
  )
}

// Table loading skeleton
export function TableLoadingSkeleton({ 
  rowCount = 5, 
  columnCount = 4,
  showHeader = true,
  style 
}: { 
  rowCount?: number
  columnCount?: number
  showHeader?: boolean
  style?: ViewStyle 
}) {
  return (
    <View style={[{ padding: 16 }, style]}>
      {showHeader && (
        <View style={{ flexDirection: 'row', marginBottom: 12, paddingVertical: 8 }}>
          {Array.from({ length: columnCount }).map((_, index) => (
            <View key={index} style={{ flex: 1, marginRight: index < columnCount - 1 ? 8 : 0 }}>
              <Skeleton width="80%" height={14} />
            </View>
          ))}
        </View>
      )}
      
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <View key={rowIndex} style={{ 
          flexDirection: 'row', 
          marginBottom: 8, 
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6'
        }}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <View key={colIndex} style={{ flex: 1, marginRight: colIndex < columnCount - 1 ? 8 : 0 }}>
              <Skeleton 
                width={colIndex === 0 ? "60%" : "100%"} 
                height={16} 
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}