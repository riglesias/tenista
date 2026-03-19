'use client'

import { useTheme } from '@/contexts/ThemeContext'
import {
  getDivisionInfo,
  isPlayerEligibleForLeague,
  LeagueWithStats,
} from '@/lib/validation/leagues.validation'
import React, { useMemo, useCallback } from 'react'
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'
import { Building2, ChevronRight, MapPin, Trophy, Users } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import EmptyDiscoverState from './EmptyDiscoverState'

interface LeagueSelectionProps {
  availableLeagues: LeagueWithStats[]
  currentPlayer: {
    id: string
    rating: number | null
  } | null
  onLeagueJoined: () => void
  joinedLeagueIds?: string[]
}

type SectionItem = 
  | { type: 'header'; title: string; needsTopMargin?: boolean }
  | { type: 'league'; league: LeagueWithStats }
  | { type: 'noAvailable' }

const LeagueCard = React.memo(function LeagueCard({
  league,
  currentPlayer,
  onCardPress,
}: {
  league: LeagueWithStats
  currentPlayer: LeagueSelectionProps['currentPlayer']
  onCardPress: (leagueId: string) => void
}) {
  const { theme } = useTheme()
  const { t } = useTranslation('league')
  const divisionInfo = league.division ? getDivisionInfo(league.division, league.min_rating, league.max_rating) : null
  const playerRating = currentPlayer?.rating || 0
  const isEligible = isPlayerEligibleForLeague(playerRating, league)
  const isLeagueFull = league.player_count >= (league.max_players || 50)
  const isRetired = league.user_is_retired === true
  const canJoin = isEligible && !league.user_is_member && !isLeagueFull && !isRetired

  let buttonText = t('list.joinLeague')
  if (isRetired) buttonText = t('list.youRetired')
  else if (league.user_is_member) buttonText = t('list.alreadyJoined')
  else if (isLeagueFull) buttonText = t('list.leagueFull')
  else if (!isEligible)
    buttonText = t('list.ratingRequired', { range: divisionInfo?.range || '' })

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onCardPress(league.id)}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      {/* Hero image */}
      <View style={styles.heroContainer}>
        {league.image_url ? (
          <>
            {/* Blurred zoomed background */}
            <Image
              source={{ uri: league.image_url }}
              style={styles.heroBlurredBg}
              resizeMode="cover"
              blurRadius={50}
            />
            {/* Centered square image */}
            <Image
              source={{ uri: league.image_url }}
              style={styles.heroSquareImage}
              resizeMode="cover"
            />
          </>
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: theme.muted }]}>
            <Trophy size={40} color={theme.mutedForeground} />
          </View>
        )}
        {/* Price badge overlaid on image */}
        <View
          style={[
            styles.priceBadge,
            { backgroundColor: league.is_free ? '#22c55e' : theme.primary },
          ]}
        >
          <Text style={[styles.priceBadgeText, { color: league.is_free ? '#fff' : theme.primaryForeground }]}>
            {league.is_free ? t('selection.free') : `$${new Intl.NumberFormat(i18n.language).format((league.price_cents || 0) / 100)}`}
          </Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={[styles.leagueName, { color: theme.foreground }]} numberOfLines={1}>
          {league.name}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Users size={13} color={theme.mutedForeground} />
            <Text style={[styles.statText, { color: theme.mutedForeground }]}>
              {league.player_count}/{league.max_players || 50}
            </Text>
          </View>
          {divisionInfo && (
            <View style={styles.statChip}>
              <Trophy size={13} color={theme.mutedForeground} />
              <Text style={[styles.statText, { color: theme.mutedForeground }]}>
                {divisionInfo.range}
              </Text>
            </View>
          )}
          {league.location && (
            <View style={[styles.statChip, { flex: 1 }]}>
              <MapPin size={13} color={theme.mutedForeground} />
              <Text style={[styles.statText, { color: theme.mutedForeground }]} numberOfLines={1}>
                {league.location}
              </Text>
            </View>
          )}
        </View>

        {league.organization_id && (
          <View style={styles.clubRow}>
            <Building2 size={13} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.primary, fontWeight: '500' }]} numberOfLines={1}>
              {(league as any).organization_name || t('selection.clubOnly', { defaultValue: 'Club' })}
            </Text>
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation()
            onCardPress(league.id)
          }}
          style={[
            styles.actionButton,
            { backgroundColor: canJoin ? theme.primary : theme.muted },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${league.name}`}
        >
          <Text
            style={[
              styles.actionButtonText,
              {
                color: canJoin
                  ? theme.primaryForeground
                  : theme.mutedForeground,
              },
            ]}
          >
            {canJoin ? t('list.viewDetails') : buttonText}
          </Text>
          {canJoin && (
            <ChevronRight size={16} color={theme.primaryForeground} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
})

export default function LeagueSelection({
  availableLeagues,
  currentPlayer,
  onLeagueJoined,
  joinedLeagueIds,
}: LeagueSelectionProps) {
  const { theme } = useTheme()
  const { t } = useTranslation('league')
  const router = useRouter()

  // Filter out already-joined leagues when joinedLeagueIds is provided
  const filteredLeagues = React.useMemo(() => {
    if (!joinedLeagueIds || joinedLeagueIds.length === 0) {
      return availableLeagues
    }
    return availableLeagues.filter(league => !joinedLeagueIds.includes(league.id))
  }, [availableLeagues, joinedLeagueIds])

  // Separate leagues into available (can join) and other (can't join)
  const separatedLeagues = React.useMemo(() => {
    const canJoin: LeagueWithStats[] = []
    const cannotJoin: LeagueWithStats[] = []

    filteredLeagues.forEach(league => {
      const playerRating = currentPlayer?.rating || 0
      const isEligible = isPlayerEligibleForLeague(playerRating, league)
      const isLeagueFull = league.player_count >= (league.max_players || 50)
      const isRetired = league.user_is_retired === true
      const canJoinLeague = isEligible && !league.user_is_member && !isLeagueFull && !isRetired

      if (canJoinLeague) {
        canJoin.push(league)
      } else {
        cannotJoin.push(league)
      }
    })

    return { canJoin, cannotJoin }
  }, [filteredLeagues, currentPlayer])

  const handleCardPress = useCallback((leagueId: string) => {
    router.push(`/league-preview?leagueId=${leagueId}`)
  }, [router])

  // Combine both sections into a single data array for FlatList
  const sections = useMemo((): SectionItem[] => {
    const result: SectionItem[] = []

    // Add available leagues section
    if (separatedLeagues.canJoin.length > 0) {
      result.push({ type: 'header', title: t('selection.availableLeagues') })
      result.push(...separatedLeagues.canJoin.map(league => ({ type: 'league' as const, league })))
    }

    // Add other leagues section
    if (separatedLeagues.cannotJoin.length > 0) {
      result.push({
        type: 'header',
        title: t('selection.otherLeagues'),
        needsTopMargin: separatedLeagues.canJoin.length > 0
      })
      result.push(...separatedLeagues.cannotJoin.map(league => ({ type: 'league' as const, league })))
    }

    if (result.length === 0) {
      result.push({ type: 'noAvailable' })
    }

    return result
  }, [separatedLeagues, t])

  if (filteredLeagues.length === 0) {
    // Check if all leagues were filtered out (user joined them all)
    const allLeaguesJoined = availableLeagues.length > 0 && joinedLeagueIds && joinedLeagueIds.length > 0

    return (
      <EmptyDiscoverState
        variant={allLeaguesJoined ? 'all-joined' : 'no-leagues'}
      />
    )
  }

  const renderSectionItem = ({ item }: { item: SectionItem }) => {
    if (item.type === 'header') {
      return (
        <Text
          className="text-xl font-bold mb-4"
          style={{
            color: theme.foreground,
            marginTop: item.needsTopMargin ? 24 : 0
          }}
        >
          {item.title}
        </Text>
      )
    }
    
    if (item.type === 'noAvailable') {
      return (
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('selection.availableLeagues')}
          </Text>
          <Text style={[styles.noAvailableText, { color: theme.mutedForeground }]}>
            {t('selection.noLeaguesToJoin')}
          </Text>
        </View>
      )
    }
    
    return (
      <LeagueCard
        league={item.league}
        currentPlayer={currentPlayer}
        onCardPress={handleCardPress}
      />
    )
  }

  return (
    <FlatList
      data={sections}
      renderItem={renderSectionItem}
      keyExtractor={(item, index) => {
        if (item.type === 'header') return `header-${index}`
        if (item.type === 'noAvailable') return `noAvailable-${index}`
        return item.league.id
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  noAvailableText: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlurredBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 2.0 }],
  },
  heroSquareImage: {
    width: 130,
    height: 130,
    borderRadius: 12,
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
    gap: 10,
  },
  leagueName: {
    fontSize: 17,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
}) 