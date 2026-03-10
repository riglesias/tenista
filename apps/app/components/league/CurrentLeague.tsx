'use client'

import { AsyncErrorBoundary } from '@/components/ErrorBoundary'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { getLeagueStandings } from '@/lib/actions/leagues.actions'
import { UserLeague, DEFAULT_LADDER_CONFIG } from '@/lib/validation/leagues.validation'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
    ActivityIndicator,
    Image,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAppToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { HelpCircle, Play, Trophy } from 'lucide-react-native'
import { useCreatePlayoffTournament, useStartPlayoffTournament, usePlayoffTournament } from '@/hooks/usePlayoffs'
import StandingsTable from './StandingsTable'
import PlayoffsTab from './PlayoffsTab'
import BracketTab from './BracketTab'
import LadderTab from '../ladder/LadderTab'
import LadderRulesSheet from '../ladder/LadderRulesSheet'
import TournamentRulesSheet from './playoffs/TournamentRulesSheet'

interface CurrentLeagueProps {
  selectedLeague: UserLeague
  currentPlayerId: string | null
  ListHeaderComponent: React.ComponentType<any> | React.ReactElement | null | undefined
  onRefresh: () => void
  refreshing: boolean
  isReadOnly?: boolean
}

// Tab type that includes ladder and bracket
type LeagueTab = 'standings' | 'ladder' | 'playoffs' | 'bracket'

interface LeagueInfoCardProps {
  selectedLeague: UserLeague
  onShowRules?: () => void
  onShowTournamentRules?: () => void
  onStartTournament?: () => void
  isStartingTournament?: boolean
  tournamentStarted?: boolean // true if tournament exists AND status !== 'not_started'
}

const LeagueInfoCard = React.memo(function LeagueInfoCard({ selectedLeague, onShowRules, onShowTournamentRules, onStartTournament, isStartingTournament, tournamentStarted }: LeagueInfoCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t, i18n } = useTranslation('league')

  // Format date for display (e.g., "15 Feb, 2025")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const year = date.getFullYear()
    const monthNames = i18n.language === 'es'
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[date.getMonth()]
    return `${day} ${month}, ${year}`
  }

  // Format registration deadline (1 day before start date)
  const formatRegistrationDeadline = (startDateString: string) => {
    const startDate = new Date(startDateString)
    // Registration deadline is 1 day before start
    startDate.setDate(startDate.getDate() - 1)
    return formatDate(startDate.toISOString())
  }

  const hasImage = !!selectedLeague.league.image_url
  const isLadder = selectedLeague.league.competition_type === 'ladder'
  const isPlayoffsOnly = selectedLeague.league.competition_type === 'playoffs_only'
  const hasPosition = selectedLeague.user_position !== null && selectedLeague.user_position !== undefined

  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* League Thumbnail Image or Placeholder */}
        {hasImage ? (
          <Image
            source={{ uri: selectedLeague.league.image_url! }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              marginRight: 12,
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            marginRight: 12,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={28} color={colors.mutedForeground} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, flex: 1 }}>
              {selectedLeague.league.name}
            </Text>
            {/* Rules button for ladder leagues */}
            {isLadder && onShowRules && (
              <TouchableOpacity
                onPress={onShowRules}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.muted,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel={t('detail.rules')}
              >
                <HelpCircle size={14} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginLeft: 4,
                  }}
                >
                  {t('detail.rules')}
                </Text>
              </TouchableOpacity>
            )}
            {/* Rules button for tournament (playoffs_only) leagues */}
            {isPlayoffsOnly && onShowTournamentRules && (
              <TouchableOpacity
                onPress={onShowTournamentRules}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.muted,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel={t('detail.rules')}
              >
                <HelpCircle size={14} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginLeft: 4,
                  }}
                >
                  {t('detail.rules')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* For playoffs_only: show start date and registration deadline */}
          {isPlayoffsOnly && selectedLeague.league.start_date && (
            <>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
                {t('detail.starts', { date: formatDate(selectedLeague.league.start_date) })}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                {t('detail.registrationDeadline', { date: formatRegistrationDeadline(selectedLeague.league.start_date) })}
              </Text>
            </>
          )}
          {/* For other types: show end date */}
          {!isPlayoffsOnly && selectedLeague.league.end_date && (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
              {t('detail.ends', { date: formatDate(selectedLeague.league.end_date) })}
            </Text>
          )}
          {/* Position for ladder leagues */}
          {isLadder && hasPosition && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                Your Ranking:{' '}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                {selectedLeague.user_position}
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                {' '}of {selectedLeague.total_players}
              </Text>
            </View>
          )}

          {/* Player count for playoffs_only (standalone tournaments) */}
          {isPlayoffsOnly && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                {selectedLeague.total_players}
                {selectedLeague.league.max_players ? `/${selectedLeague.league.max_players}` : ''}
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                {' '}players registered.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Start Tournament Button for playoffs_only (temporary for testing) */}
      {isPlayoffsOnly && onStartTournament && !tournamentStarted && (
        <TouchableOpacity
          onPress={onStartTournament}
          disabled={isStartingTournament}
          style={{
            backgroundColor: isStartingTournament ? colors.muted : colors.primary,
            borderRadius: 8,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16
          }}
        >
          <Play size={18} color={colors.primaryForeground} />
          <Text style={{
            color: colors.primaryForeground,
            fontSize: 15,
            fontWeight: '600',
            marginLeft: 8
          }}>
            {isStartingTournament ? 'Starting...' : 'Start Tournament'}
          </Text>
        </TouchableOpacity>
      )}

    </View>
  )
})

function CurrentLeagueComponent({
  selectedLeague,
  currentPlayerId,
  ListHeaderComponent,
  onRefresh,
  refreshing,
  isReadOnly,
}: CurrentLeagueProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')
  const { showToast } = useAppToast()
  const { confirm } = useConfirmDialog()

  // Determine competition type
  const isLadderLeague = selectedLeague.league.competition_type === 'ladder'
  const isPlayoffsOnlyLeague = selectedLeague.league.competition_type === 'playoffs_only'
  const hasPlayoffs = selectedLeague.league.has_playoffs

  // Tournament hooks for playoffs_only leagues
  const { data: tournament } = usePlayoffTournament(isPlayoffsOnlyLeague ? selectedLeague.league.id : '')
  const createTournamentMutation = useCreatePlayoffTournament()
  const startTournamentMutation = useStartPlayoffTournament()

  // Handler for starting tournament
  const handleStartTournament = useCallback(() => {
    const qualifyingCount = selectedLeague.total_players

    // Check if tournament already exists but is in 'not_started' status (after reset)
    const existingNotStarted = tournament && tournament.status === 'not_started'

    confirm({
      title: 'Start Tournament',
      message: `Are you sure you want to start the tournament with ${qualifyingCount} players? This action cannot be undone.`,
      confirmText: 'Start',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: () => {
        if (existingNotStarted) {
          // Tournament exists but was reset - just update status to in_progress
          startTournamentMutation.mutate(
            {
              tournamentId: tournament.id,
              leagueId: selectedLeague.league.id,
            },
            {
              onSuccess: () => {
                showToast('Tournament started successfully!', { type: 'success' })
                onRefresh()
              },
              onError: (error) => {
                showToast(`Failed to start tournament: ${error.message}`, { type: 'error' })
              },
            }
          )
        } else {
          // No tournament exists - create new one
          createTournamentMutation.mutate(
            {
              league_id: selectedLeague.league.id,
              qualifying_players_count: qualifyingCount,
            },
            {
              onSuccess: () => {
                showToast('Tournament started successfully!', { type: 'success' })
                onRefresh()
              },
              onError: (error) => {
                showToast(`Failed to start tournament: ${error.message}`, { type: 'error' })
              },
            }
          )
        }
      },
    })
  }, [selectedLeague.league.id, selectedLeague.total_players, tournament, createTournamentMutation, startTournamentMutation, onRefresh, confirm, showToast])

  // Determine initial tab based on competition type
  const getInitialTab = useCallback((): LeagueTab => {
    if (isLadderLeague) return 'ladder'
    if (isPlayoffsOnlyLeague) return 'bracket' // Bracket is primary for playoffs_only
    return 'standings'
  }, [isLadderLeague, isPlayoffsOnlyLeague])

  const [activeTab, setActiveTab] = useState<LeagueTab>(getInitialTab)

  // Reset activeTab when league changes
  useEffect(() => {
    setActiveTab(getInitialTab())
  }, [selectedLeague.league.id, getInitialTab])
  const [showRulesSheet, setShowRulesSheet] = useState(false)
  const [showTournamentRulesSheet, setShowTournamentRulesSheet] = useState(false)

  // Ladder config for rules sheet
  const ladderConfig = selectedLeague.league.ladder_config || DEFAULT_LADDER_CONFIG

  // Use TanStack Query for standings data (only for round_robin leagues)
  const { data: standings = [], isLoading: loading } = useQuery({
    queryKey: ['league-standings', selectedLeague.league.id],
    queryFn: async () => {
      const { data } = await getLeagueStandings(selectedLeague.league.id)
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Don't fetch standings for ladder leagues (use ladder rankings) or playoffs_only leagues (use bracket)
    enabled: !isLadderLeague && !isPlayoffsOnlyLeague,
  })

  const handlePlayerPress = useCallback((playerId: string) => {
    router.push(`/player-profile?playerId=${playerId}`)
  }, [])

  // Determine which tabs to show
  const availableTabs = useMemo(() => {
    const tabs: { key: LeagueTab; label: string }[] = []

    if (isLadderLeague) {
      tabs.push({ key: 'ladder', label: t('tabs.ladder') })
    } else if (isPlayoffsOnlyLeague) {
      // For playoffs_only leagues, bracket is the only tab
      tabs.push({ key: 'bracket', label: t('tabs.bracket') })
    } else {
      tabs.push({ key: 'standings', label: t('tabs.standings') })
      if (hasPlayoffs) {
        tabs.push({ key: 'playoffs', label: t('tabs.playoffs') })
      }
    }

    return tabs
  }, [isLadderLeague, isPlayoffsOnlyLeague, hasPlayoffs, t])

  const showTabs = availableTabs.length > 1

  const renderTabButton = useCallback((tab: LeagueTab, label: string) => {
    const isActive = activeTab === tab
    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setActiveTab(tab)}
        style={{
          flex: 1,
          backgroundColor: isActive ? colors.primary : colors.card,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : colors.border,
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="tab"
        accessibilityLabel={`Switch to ${label} tab`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: isActive ? colors.primaryForeground : colors.foreground,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    )
  }, [activeTab, colors])

  const memoizedListHeader = useMemo(() => {
    const tabs = showTabs ? (
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {availableTabs.map(({ key, label }) => renderTabButton(key, label))}
        </View>
      </View>
    ) : null

    return (
      <>
        {ListHeaderComponent}
        <LeagueInfoCard
          selectedLeague={selectedLeague}
          onShowRules={isReadOnly ? undefined : (isLadderLeague ? () => setShowRulesSheet(true) : undefined)}
          onShowTournamentRules={isReadOnly ? undefined : (isPlayoffsOnlyLeague ? () => setShowTournamentRulesSheet(true) : undefined)}
          onStartTournament={isReadOnly ? undefined : (isPlayoffsOnlyLeague ? handleStartTournament : undefined)}
          isStartingTournament={createTournamentMutation.isPending}
          tournamentStarted={!!tournament && tournament.status !== 'not_started'}
        />
        {tabs}
        {/* Only show title for standings view without tabs (not for ladder or playoffs_only) */}
        {!showTabs && !isLadderLeague && !isPlayoffsOnlyLeague && (
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
              {t('detail.leagueStandings', { name: selectedLeague.league.name })}
            </Text>
          </View>
        )}
      </>
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ListHeaderComponent, selectedLeague, showTabs, isLadderLeague, isPlayoffsOnlyLeague, colors, renderTabButton, availableTabs, handleStartTournament, createTournamentMutation.isPending, tournament])

  // Loading state (only for non-ladder and non-playoffs_only leagues that need standings)
  if (!isLadderLeague && !isPlayoffsOnlyLeague && loading) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // Render ladder tab
  if (activeTab === 'ladder') {
    return (
      <View style={{ flex: 1 }}>
        {memoizedListHeader}
        <LadderTab
          selectedLeague={selectedLeague}
          currentPlayerId={currentPlayerId}
          onRefresh={onRefresh}
          refreshing={refreshing}
          isReadOnly={isReadOnly}
        />
        {/* Rules sheet for ladder */}
        <LadderRulesSheet
          visible={showRulesSheet}
          onClose={() => setShowRulesSheet(false)}
          ladderConfig={ladderConfig}
        />
      </View>
    )
  }

  // Render playoffs tab
  if (activeTab === 'playoffs') {
    return (
      <View style={{ flex: 1 }}>
        {memoizedListHeader}
        <PlayoffsTab
          selectedLeague={selectedLeague}
          currentPlayerId={currentPlayerId}
          onRefresh={onRefresh}
          refreshing={refreshing}
          isReadOnly={isReadOnly}
        />
      </View>
    )
  }

  // Render bracket tab (for playoffs_only leagues)
  if (activeTab === 'bracket') {
    return (
      <View style={{ flex: 1 }}>
        {memoizedListHeader}
        <BracketTab
          selectedLeague={selectedLeague}
          currentPlayerId={currentPlayerId}
          onRefresh={onRefresh}
          refreshing={refreshing}
          isReadOnly={isReadOnly}
        />
        {/* Rules sheet for tournament */}
        <TournamentRulesSheet
          visible={showTournamentRulesSheet}
          onClose={() => setShowTournamentRulesSheet(false)}
        />
      </View>
    )
  }

  // Default to standings view
  return (
    <StandingsTable
      standings={standings}
      currentPlayerId={currentPlayerId}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={memoizedListHeader}
      onPlayerPress={handlePlayerPress}
    />
  )
}

// Wrapped component with error boundary
export default function CurrentLeague(props: CurrentLeagueProps) {
  return (
    <AsyncErrorBoundary
      onRetry={props.onRefresh}
      onError={() => {
        // silently handled
      }}
    >
      <CurrentLeagueComponent {...props} />
    </AsyncErrorBoundary>
  )
}
