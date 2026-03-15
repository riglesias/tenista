import React, { useEffect } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { PlayerCard } from '@/components/community'
import { router } from 'expo-router'
import { AvailabilityData, TimeSlot } from '@/lib/database.types'
import { EmptyState } from '@/components/ui/ErrorMessage'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { imageCache } from '@/lib/utils/imageCache'
import { Users } from 'lucide-react-native'

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
  country_code: string | null
}

interface PlayerListProps {
  players: Player[]
  refreshing: boolean
  onRefresh: () => void
  getPlayerAvailability: (availability: AvailabilityData | null) => TimeSlot[]
  onEndReached?: () => void
  isLoadingMore?: boolean
}

export default function PlayerList({
  players,
  refreshing,
  onRefresh,
  getPlayerAvailability,
  onEndReached,
  isLoadingMore = false,
}: PlayerListProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const insets = useSafeAreaInsets()
  const { t } = useTranslation('community')

  // Preload all player avatars when the list changes
  useEffect(() => {
    const avatarUrls = players
      .map(player => player.avatar_url)
      .filter((url): url is string => url !== null && url !== undefined)

    if (avatarUrls.length > 0) {
      imageCache.preloadImages(avatarUrls)
    }
  }, [players])

  const renderPlayer = ({ item }: { item: Player }) => {
    const slots = getPlayerAvailability(item.availability)

    return (
      <PlayerCard
        player={item}
        timeSlots={slots}
        onPress={() => {
          router.push(`/player-profile?playerId=${item.id}`)
        }}
      />
    )
  }

  const renderEmptyState = () => (
    <EmptyState
      title={t('players.noPlayers')}
      message={t('players.noPlayersMessage')}
      icon={<Users size={64} color={colors.mutedForeground} />}
      action={{
        label: t('players.clearFilters'),
        onPress: onRefresh
      }}
      style={{
        // Adjust for header components above
        marginTop: -120, // Approximate height of CommunityHeader + DaySelector
      }}
    />
  )

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  return (
    <FlatList
      data={players}
      renderItem={renderPlayer}
      keyExtractor={item => item.id}
      style={{
        paddingHorizontal: 24
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={
        players.length === 0
          ? { flexGrow: 1 }
          : { paddingBottom: Math.max(insets.bottom, 20) + 100 } // Tab bar height + safe area
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      // Performance optimizations
      initialNumToRender={8}
      maxToRenderPerBatch={5}
      windowSize={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
    />
  )
}