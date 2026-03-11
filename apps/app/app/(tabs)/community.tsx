'use client'

import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { DaySelector, FilterBottomSheet } from '@/components/community'
import CommunityHeader from '@/components/community/CommunityHeader'
import CitySelector from '@/components/community/CitySelector'
import PlayerList from '@/components/community/PlayerList'
import PlayNowModal from '@/components/community/PlayNowModal'
import CityRecentMatches from '@/components/community/CityRecentMatches'
import { EmptyState } from '@/components/ui/ErrorMessage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

import { useAsyncOperation } from '@/hooks/useLoadingState'
import { usePlayerFiltering } from '@/hooks/usePlayerFiltering'
import { useAvailabilityRealtime } from '@/hooks/useAvailabilityRealtime'
import { getAllAvailablePlayersInCity } from '@/lib/actions/availability.actions'
import { trackCommunityFilterUsed } from '@/lib/analytics/events'
import { getPlayerDailyAvailability, updateDailyAvailability } from '@/lib/actions/daily-availability.actions'
import { getPlayerProfile } from '@/lib/actions/player.actions'

import { AvailabilityData } from '@/lib/database.types'

type Player = {
  id: string
  first_name: string | null
  last_name: string | null
  rating: number | null
  avatar_url: string | null
  homecourt_name: string | null
  city_name: string | null
  state_province: string | null
  availability: AvailabilityData | null
  country_code: string | null // Location country
  nationality_code: string | null // Flag nationality
  available_today: boolean | null
  available_today_updated_at: string | null
}

export default function CommunityScreen() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('community')
  const { t: tErrors } = useTranslation('errors')
  
  // Data state
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [isPlayNowModalVisible, setIsPlayNowModalVisible] = useState(false)
  const [isAvailableToday, setIsAvailableToday] = useState(false)
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
  const [needsRefreshOnFocus, setNeedsRefreshOnFocus] = useState(false)
  
  // Custom hooks
  const { execute, isLoading } = useAsyncOperation()
  const {
    selectedDay,
    ratingRange,
    setSelectedDay,
    setRatingRange,
    filteredPlayers,
    dayOptions,
    getPlayerAvailability,
    clearFilters,
  } = usePlayerFiltering(allPlayers)

  const handleRatingRangeChange = useCallback((range: [number, number]) => {
    trackCommunityFilterUsed({ ratingMin: range[0], ratingMax: range[1] });
    setRatingRange(range);
  }, [setRatingRange])

  // Real-time availability updates from other players
  const handleAvailabilityChange = useCallback(async () => {
    if (!user || !userProfile?.city_id) return
    const { data: players } = await getAllAvailablePlayersInCity(
      user.id,
      userProfile.city_id
    )
    if (players) {
      setAllPlayers(players)
    }
  }, [user, userProfile?.city_id])

  useAvailabilityRealtime(
    userProfile?.city_id ?? null,
    user?.id ?? null,
    handleAvailabilityChange
  )

  const loading = isLoading('loadPlayers')
  const refreshing = isLoading('refreshPlayers')

  useEffect(() => {
    if (user) {
      loadAvailablePlayers()
      checkDailyAvailability()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Refresh data when screen comes into focus, but only if needed
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // Check if we have loaded user profile (indicates initial load completed)
        const hasLoadedInitially = userProfile !== null
        
        // Only refresh if:
        // 1. We haven't loaded initially yet (userProfile is null), OR
        // 2. We explicitly need to refresh (e.g., coming back from edit-location)
        if (!hasLoadedInitially || needsRefreshOnFocus) {
          // Use a small delay to prevent layout conflicts during navigation
          const timeoutId = setTimeout(() => {
            loadAvailablePlayers(true)
            setNeedsRefreshOnFocus(false) // Reset the flag
          }, 100)
          
          return () => clearTimeout(timeoutId)
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userProfile, needsRefreshOnFocus])
  )

  const loadAvailablePlayers = async (isRefresh = false) => {
    if (!user) return

    const { error } = await execute(
      isRefresh ? 'refreshPlayers' : 'loadPlayers',
      async () => {
        // Get current user's profile
        const { data: profile } = await getPlayerProfile(user.id)
        if (!profile) {
          throw new Error('Could not load user profile')
        }
        setUserProfile(profile)
        
        if (profile.city_id) {
          const { data: players } = await getAllAvailablePlayersInCity(
            user.id,
            profile.city_id
          )
          setAllPlayers(players || [])
        } else {
          setAllPlayers([])
        }
        
      },
      {
        onError: (error) => {
          console.error('Error loading available players:', error)
        }
      }
    )

    if (error && !isRefresh) {
      Alert.alert(tErrors('generic.somethingWentWrong'), t('errors.loadPlayers'))
    }
  }

  const handleRefresh = () => {
    loadAvailablePlayers(true)
  }

  const handleLocationPress = () => {
    setNeedsRefreshOnFocus(true) // Set flag to refresh when we return
    router.push('/edit-location')
  }

  const handleAvailabilityToggle = async () => {
    if (!user) return
    
    // If user is not available today, show the Play Now modal
    if (!isAvailableToday) {
      setIsPlayNowModalVisible(true)
      return
    }
    
    // If user is already available, directly toggle off
    await updateAvailability(false)
  }

  const updateAvailability = async (newAvailability: boolean) => {
    if (!user) return
    
    setIsUpdatingAvailability(true)
    
    // Optimistically update the UI
    setIsAvailableToday(newAvailability)
    
    try {
      const { error } = await updateDailyAvailability(user.id, newAvailability)
      
      if (error) {
        // Revert optimistic update on error
        setIsAvailableToday(!newAvailability)
        Alert.alert(tErrors('generic.somethingWentWrong'), t('errors.updateAvailability'))
      } else {
        // Silently refresh player list in background without triggering loading state
        if (user && userProfile?.city_id) {
          const { data: players } = await getAllAvailablePlayersInCity(
            user.id,
            userProfile.city_id
          )
          if (players) {
            setAllPlayers(players)
          }
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsAvailableToday(!newAvailability)
      Alert.alert(tErrors('generic.somethingWentWrong'), t('errors.unexpected'))
      console.error('Availability toggle error:', error)
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  const handlePlayNowConfirm = async () => {
    setIsPlayNowModalVisible(false)
    await updateAvailability(true)
  }

  const handlePlayNowCancel = () => {
    setIsPlayNowModalVisible(false)
  }

  const handleFilterPress = () => {
    setIsFilterVisible(true)
  }

  const checkDailyAvailability = async () => {
    if (!user) return
    
    const { available } = await getPlayerDailyAvailability(user.id)
    setIsAvailableToday(available)
  }

  const handleCloseFilter = () => {
    setIsFilterVisible(false)
  }

  const handleApplyFilters = () => {
    // Filters are applied automatically through the hook
    handleCloseFilter()
  }

  const handleClearFilters = () => {
    clearFilters()
    handleCloseFilter()
  }

  // Loading state
  if (loading) {
    return (
      <LoadingSpinner
        text={t('loading')}
        variant="overlay"
      />
    )
  }

  // Check if user has availability set
  const hasNoAvailability = !userProfile?.availability || 
    Object.keys(userProfile.availability).length === 0 ||
    Object.values(userProfile.availability).every((slots: any) => !slots || slots.length === 0)

  if (hasNoAvailability) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <CommunityHeader
          onAvailabilityToggle={handleAvailabilityToggle}
          isAvailableToday={isAvailableToday}
          isUpdatingAvailability={isUpdatingAvailability}
          cityName={userProfile?.city_name}
          onLocationPress={handleLocationPress}
        />
        <EmptyState
          title={t('emptyState.setAvailability')}
          message={t('emptyState.setAvailabilityMessage')}
          action={{
            label: t('emptyState.editAvailability'),
            onPress: () => router.push('/edit-availability')
          }}
        />

        <PlayNowModal
          visible={isPlayNowModalVisible}
          onClose={handlePlayNowCancel}
          onConfirm={handlePlayNowConfirm}
          isLoading={isUpdatingAvailability}
        />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CommunityHeader
        onAvailabilityToggle={handleAvailabilityToggle}
        isAvailableToday={isAvailableToday}
        isUpdatingAvailability={isUpdatingAvailability}
        cityName={userProfile?.city_name}
        onLocationPress={handleLocationPress}
      />

      <CityRecentMatches 
        cityId={userProfile?.city_id}
        cityName={userProfile?.city_name}
      />

      <CitySelector
        onFilterPress={handleFilterPress}
      />

      <DaySelector 
        selectedDay={selectedDay}
        onDaySelect={setSelectedDay}
        dayOptions={dayOptions}
      />

      <PlayerList
        players={filteredPlayers}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        getPlayerAvailability={getPlayerAvailability}
      />

      <FilterBottomSheet
        isVisible={isFilterVisible}
        onClose={handleCloseFilter}
        ratingRange={ratingRange}
        onRatingRangeChange={handleRatingRangeChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      <PlayNowModal
        visible={isPlayNowModalVisible}
        onClose={handlePlayNowCancel}
        onConfirm={handlePlayNowConfirm}
        isLoading={isUpdatingAvailability}
      />
    </View>
  )
}