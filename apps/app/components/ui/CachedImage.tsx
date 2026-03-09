import React, { useState, useEffect, useCallback } from 'react'
import { View, ViewStyle, ActivityIndicator } from 'react-native'
import { Image, ImageProps } from 'expo-image'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { imageCache } from '@/lib/utils/imageCache'

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source: string | null | undefined
  fallback?: React.ReactNode
  showLoading?: boolean
  loadingSize?: 'small' | 'large'
  preload?: boolean
  priority?: 'low' | 'normal' | 'high'
  style?: ViewStyle
}

const CachedImage = React.memo(function CachedImage({
  source,
  fallback,
  showLoading = true,
  loadingSize = 'small',
  preload = true,
  priority = 'normal',
  style,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}: CachedImageProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Preload image when component mounts
  useEffect(() => {
    if (source && preload) {
      imageCache.preloadImage(source)
    }
  }, [source, preload])

  const handleLoadStart = useCallback(() => {
    setIsLoading(true)
    setHasError(false)
    onLoadStart?.()
  }, [onLoadStart])

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false)
    onLoadEnd?.()
  }, [onLoadEnd])

  const handleError = useCallback((error: any) => {
    setIsLoading(false)
    setHasError(true)
    onError?.(error)
  }, [onError])

  // If no source or error, show fallback
  if (!source || hasError) {
    return <>{fallback}</>
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={style}
        cachePolicy="memory-disk"
        priority={priority}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        transition={200}
        contentFit="cover"
        recyclingKey={source}
        {...props}
      />
      
      {/* Loading overlay */}
      {showLoading && isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            ...(style as any),
          }}
        >
          <ActivityIndicator 
            size={loadingSize} 
            color={colors.primary}
          />
        </View>
      )}
    </View>
  )
})

export default CachedImage