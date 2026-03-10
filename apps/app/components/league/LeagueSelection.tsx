'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { joinLeague } from '@/lib/actions/leagues.actions'
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
import { useAppToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Building2, MapPin, Trophy } from 'lucide-react-native'
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
  onJoin,
}: {
  league: LeagueWithStats
  currentPlayer: LeagueSelectionProps['currentPlayer']
  onJoin: (leagueId: string) => void
}) {
  const { theme } = useTheme()
  const { t } = useTranslation('league')
  const divisionInfo = league.division ? getDivisionInfo(league.division) : null
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
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.cardHeader}>
        {league.image_url ? (
          <Image
            source={{ uri: league.image_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.muted }]}>
            <Trophy size={24} color={theme.mutedForeground} />
          </View>
        )}
        <View style={styles.cardHeaderContent}>
          <Text style={[styles.leagueName, { color: theme.foreground }]}>
            {league.name}
          </Text>
          <View
            style={[
              styles.priceBadge,
              { backgroundColor: league.is_free ? '#22c55e' : theme.primary },
            ]}
          >
            <Text style={styles.priceBadgeText}>
              {league.is_free ? t('selection.free') : `$${((league.price_cents || 0) / 100).toFixed(0)}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View>
          <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>
            {t('selection.players')}
          </Text>
          <Text style={[styles.detailValue, { color: theme.foreground }]}>
            {league.player_count}/{league.max_players || 50}
          </Text>
        </View>
        {divisionInfo && (
          <View>
            <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>
              {t('selection.ratingRange')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.foreground }]}>
              {divisionInfo.range}
            </Text>
          </View>
        )}
      </View>

      {league.location && (
        <View style={styles.venueRow}>
          <MapPin size={14} color={theme.mutedForeground} />
          <Text style={[styles.venueText, { color: theme.mutedForeground }]} numberOfLines={1}>
            {league.location}
          </Text>
        </View>
      )}

      {league.organization_id && (
        <View style={styles.venueRow}>
          <Building2 size={14} color={theme.primary} />
          <Text style={[styles.venueText, { color: theme.primary, fontWeight: '500' }]} numberOfLines={1}>
            {(league as any).organization_name || t('selection.clubOnly', { defaultValue: 'Club' })}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => (canJoin ? onJoin(league.id) : null)}
        disabled={!canJoin}
        style={[
          styles.joinButton,
          { backgroundColor: canJoin ? theme.primary : theme.muted },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Join league ${league.name}`}
        accessibilityHint={!canJoin ? buttonText : undefined}
      >
        <Text
          style={[
            styles.joinButtonText,
            {
              color: canJoin
                ? theme.primaryForeground
                : theme.mutedForeground,
            },
          ]}
        >
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
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
  const { showToast } = useAppToast()
  const { confirm } = useConfirmDialog()

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

  const handleJoinLeague = useCallback(async (leagueId: string) => {
    if (!currentPlayer) return

    confirm({
      title: t('alerts.joinLeague'),
      message: t('alerts.confirmJoin'),
      confirmText: t('alerts.join'),
      cancelText: t('alerts.cancel'),
      destructive: false,
      onConfirm: async () => {
        const { error } = await joinLeague(leagueId, currentPlayer.id)
        if (error) {
          showToast((error as any)?.message || t('alerts.failedToJoin'), { type: 'error' })
        } else {
          showToast(t('alerts.joinedLeague'), { type: 'success' })
          onLeagueJoined()
        }
      },
    })
  }, [currentPlayer, onLeagueJoined, t, confirm, showToast])

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
        onJoin={handleJoinLeague}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
  },
  noAvailableText: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  venueText: {
    fontSize: 13,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
  },
  joinButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}) 