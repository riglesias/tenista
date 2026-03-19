'use client'

import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator, ScrollView } from 'react-native'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import {
  usePlayoffTournament,
  usePlayoffTournamentWithFullData,
  usePlayoffEligibility,
  useCanManagePlayoffs,
  useCanStartPlayoffs,
  useQualifyingPlayers,
  useStartPlayoffTournament
} from '@/hooks/usePlayoffs'
import { UserLeague } from '@/lib/validation/leagues.validation'
import QualifyingPlayersCard from './playoffs/QualifyingPlayersCard'
import PlayoffBracketPreview from './playoffs/PlayoffBracketPreview'
import PlayoffControls from './playoffs/PlayoffControls'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { router } from 'expo-router'

interface PlayoffsTabProps {
  selectedLeague: UserLeague
  currentPlayerId: string | null
  onRefresh: () => void
  refreshing: boolean
  isReadOnly?: boolean
}

export default function PlayoffsTab({
  selectedLeague,
  currentPlayerId,
  onRefresh,
  refreshing,
  isReadOnly
}: PlayoffsTabProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const leagueId = selectedLeague.league.id

  // Data hooks
  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = usePlayoffTournament(leagueId)
  const { data: tournamentFullData, isLoading: tournamentFullLoading } = usePlayoffTournamentWithFullData(leagueId)
  const { isLoading: eligibilityLoading } = usePlayoffEligibility(leagueId)
  const { data: canManage, isLoading: canManageLoading } = useCanManagePlayoffs(leagueId)
  const { canStart } = useCanStartPlayoffs(leagueId)

  // State for qualification count (default to 8 players)
  const [qualifyingCount, setQualifyingCount] = useState(8)
  const { data: qualifyingData, isLoading: qualifyingLoading } = useQualifyingPlayers(leagueId, qualifyingCount)

  // Auto-start mutation
  const startMutation = useStartPlayoffTournament()

  // Auto-start: when tab loads, if tournament is not_started and start_date has passed, trigger start
  useEffect(() => {
    if (isReadOnly) return
    if (
      tournament &&
      tournament.status === 'not_started' &&
      canManage &&
      tournament.start_date &&
      new Date() >= new Date(tournament.start_date) &&
      !startMutation.isPending
    ) {
      startMutation.mutate({
        tournamentId: tournament.id,
        leagueId: tournament.league_id,
      })
    }
  }, [tournament?.id, tournament?.status, tournament?.start_date, canManage, isReadOnly])

  // Loading state
  const isLoading = tournamentLoading || eligibilityLoading || canManageLoading || qualifyingLoading

  // Error handling
  if (tournamentError) {
    return (
      <View style={{ padding: 24 }}>
        <ErrorMessage
          title="Error loading playoffs"
          message="There was a problem loading playoff data. Please try again."
          onRetry={onRefresh}
          retryText="Try Again"
          variant="default"
        />
      </View>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <LoadingSpinner variant="overlay" />
    )
  }

  // Check if league has playoffs enabled
  if (!selectedLeague.league.has_playoffs) {
    return (
      <View style={{ padding: 24 }}>
        <View style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8
          }}>
            Playoffs Not Enabled
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center',
            lineHeight: 20
          }}>
            This league does not have playoffs enabled. Contact the league organizer to enable playoffs.
          </Text>
        </View>
      </View>
    )
  }

  // Determine tournament state
  const tournamentStarted = tournament && tournament.status !== 'not_started'

  // Handle entering match result - navigate to submit result screen
  const handleEnterResult = (matchId: string, opponentId: string) => {
    router.push({
      pathname: '/submit-result',
      params: {
        opponentId,
        leagueId,
        isPlayoff: 'true',
        playoffTournamentId: tournament?.id
      }
    })
  }

  // Render content based on tournament state
  const renderContent = () => {
    if (tournamentStarted && tournamentFullData && qualifyingData) {
      // Tournament started - show bracket with real data and controls
      return (
        <>
          {!isReadOnly && canManage && (
            <PlayoffControls
              tournament={tournament}
              leagueId={leagueId}
              onRefresh={onRefresh}
            />
          )}
          <PlayoffBracketPreview
            qualifyingData={qualifyingData}
            qualifyingCount={qualifyingCount}
            tournamentData={{
              rounds: tournamentFullData.rounds,
              participants: tournamentFullData.participants,
              status: tournamentFullData.status
            }}
            currentPlayerId={currentPlayerId}
            canManage={isReadOnly ? false : (canManage || false)}
            onEnterResult={isReadOnly ? undefined : handleEnterResult}
          />
        </>
      )
    } else {
      // No tournament or not started - show eligibility, qualifying players, and creation option
      return (
        <>

          {qualifyingData && (
            <>
              <PlayoffBracketPreview
                qualifyingData={qualifyingData}
                qualifyingCount={qualifyingCount}
              />

              {canStart && (
                <QualifyingPlayersCard
                  mode="league"
                  qualifyingData={qualifyingData}
                  qualifyingCount={qualifyingCount}
                  onQualifyingCountChange={setQualifyingCount}
                  canManage={canManage || false}
                  leagueId={leagueId}
                  leagueEndDate={selectedLeague.league.end_date}
                  onTournamentCreated={onRefresh}
                />
              )}
            </>
          )}
        </>
      )
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 140 }}
      refreshControl={
        refreshing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : undefined
      }
    >
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.foreground
        }}>
          Playoffs
        </Text>
        {tournament && (
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 4
          }}>
            {tournament.status === 'not_started' && tournament.start_date
              ? `Starting ${new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : tournament.status === 'not_started' ? 'Tournament not started' : null}
            {tournament.status === 'in_progress' && 'Tournament in progress'}
            {tournament.status === 'completed' && 'Tournament completed'}
          </Text>
        )}
      </View>

      {/* Content */}
      {renderContent()}
    </ScrollView>
  )
}
