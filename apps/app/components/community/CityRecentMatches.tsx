'use client'

import React, { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { getRecentMatchesInCity } from '@/lib/actions/matches.actions'
import CityMatchCard from './CityMatchCard'

interface CityRecentMatchesProps {
  cityId: string | null
  cityName: string | null
}

export default function CityRecentMatches({ cityId, cityName }: CityRecentMatchesProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('community')
  const scrollViewRef = useRef<ScrollView>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (cityId) {
      loadRecentMatches()
    }
  }, [cityId])

  const loadRecentMatches = async () => {
    if (!cityId) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getRecentMatchesInCity(cityId, 4)
      if (!error && data) {
        setMatches(data)
      }
    } catch (error) {
      console.error('Error loading recent matches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(contentOffsetX / 292) // 280 width + 12 margin
    setCurrentIndex(newIndex)
  }

  // Don't render if no cityId
  if (!cityId) return null

  // Loading state
  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground
          }}>
            {t('recentActivity.title')}
          </Text>
        </View>
        <View style={{ 
          height: 120, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    )
  }

  // Don't render if no matches
  if (matches.length === 0) {
    return null
  }

  return (
    <View style={{ paddingVertical: 16 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground
          }}>
            {t('recentActivity.title')}
          </Text>
          {matches.length > 1 && (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {matches.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Scrollable match cards */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={292} // Card width + margin
        decelerationRate="fast"
        contentContainerStyle={{ 
          paddingHorizontal: 24,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {matches.map((match) => (
          <CityMatchCard key={match.id} match={match} />
        ))}
      </ScrollView>
    </View>
  )
}