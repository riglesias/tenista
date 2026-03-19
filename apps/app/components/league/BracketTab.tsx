'use client'

import React, { useState } from 'react'
import { View, Text, ActivityIndicator, ScrollView } from 'react-native'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Trophy } from 'lucide-react-native'
import {
  usePlayoffTournament,
  usePlayoffTournamentWithFullData,
  useCanManagePlayoffs,
  useStandaloneQualifyingPlayers
} from '@/hooks/usePlayoffs'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { UserLeague } from '@/lib/validation/leagues.validation'
import QualifyingPlayersCard from './playoffs/QualifyingPlayersCard'
import PlayoffBracketPreview from './playoffs/PlayoffBracketPreview'
import PlayoffControls from './playoffs/PlayoffControls'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { router } from 'expo-router'

interface BracketTabProps {
  selectedLeague: UserLeague
  currentPlayerId: string | null
  onRefresh: () => void
  refreshing: boolean
  isReadOnly?: boolean
}

export default function BracketTab({
  selectedLeague,
  currentPlayerId,
  onRefresh,
  refreshing,
  isReadOnly
}: BracketTabProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const leagueId = selectedLeague.league.id
  const isPlayoffsOnly = selectedLeague.league.competition_type === 'playoffs_only'

  // Data hooks
  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = usePlayoffTournament(leagueId)
  const { data: tournamentFullData, isLoading: tournamentFullLoading } = usePlayoffTournamentWithFullData(leagueId)
  const { data: canManage, isLoading: canManageLoading } = useCanManagePlayoffs(leagueId)

  // State for qualification count (default to 8 players)
  const [qualifyingCount, setQualifyingCount] = useState(8)

  // For playoffs_only leagues, get participant IDs from league_players
  const { data: participantIds = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['league-participant-ids', leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_players')
        .select('player_id')
        .eq('league_id', leagueId)
        .eq('status', 'active')
      if (error) throw error
      return (data || []).map((p: { player_id: string }) => p.player_id)
    },
    enabled: isPlayoffsOnly,
    staleTime: 2 * 60 * 1000,
  })

  // Use different hooks based on competition type
  // Only fetch league qualifying data for non-playoffs_only leagues
  const { data: leagueQualifyingData, isLoading: leagueQualifyingLoading } = useQuery({
    queryKey: ['qualifying-players', leagueId, qualifyingCount],
    queryFn: () => import('@/lib/services/qualificationService').then(m =>
      new m.QualificationService().getQualifiedPlayers({
        leagueId,
        qualifyingCount,
        excludeInactivePlayers: true
      })
    ),
    enabled: !isPlayoffsOnly,
    staleTime: 2 * 60 * 1000,
  })

  const { data: standaloneQualifyingData, isLoading: standaloneQualifyingLoading } = useStandaloneQualifyingPlayers(
    participantIds,
    { enabled: isPlayoffsOnly && participantIds.length > 0 }
  )

  // Choose the right data based on league type
  const qualifyingData = isPlayoffsOnly ? standaloneQualifyingData : leagueQualifyingData
  const qualifyingLoading = isPlayoffsOnly
    ? (participantsLoading || standaloneQualifyingLoading)
    : leagueQualifyingLoading

  // Loading state
  const isLoading = tournamentLoading || canManageLoading || qualifyingLoading

  // Error handling
  if (tournamentError) {
    return (
      <View style={{ padding: 24 }}>
        <ErrorMessage
          title="Error loading bracket"
          message="There was a problem loading the tournament bracket. Please try again."
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

  const renderContent = () => {
    // Always use PlayoffBracketPreview, with different props based on tournament state
    if (tournamentStarted && tournamentFullData) {
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
          {qualifyingData && (
            <PlayoffBracketPreview
              qualifyingData={qualifyingData}
              qualifyingCount={isPlayoffsOnly ? qualifyingData.qualifiedPlayers.length : qualifyingCount}
              tournamentData={{
                rounds: tournamentFullData.rounds,
                participants: tournamentFullData.participants,
                status: tournamentFullData.status
              }}
              currentPlayerId={currentPlayerId}
              canManage={isReadOnly ? false : (canManage || false)}
              onEnterResult={isReadOnly ? undefined : handleEnterResult}
            />
          )}
        </>
      )
    } else {
      // No tournament or not started - show bracket preview and creation option
      return (
        <>
          {qualifyingData && (
            <>
              <PlayoffBracketPreview
                qualifyingData={qualifyingData}
                qualifyingCount={isPlayoffsOnly ? qualifyingData.qualifiedPlayers.length : qualifyingCount}
              />

              {isPlayoffsOnly && standaloneQualifyingData ? (
                <QualifyingPlayersCard
                  mode="standalone"
                  standaloneData={standaloneQualifyingData}
                  qualifyingCount={standaloneQualifyingData.qualifiedPlayers.length}
                  onQualifyingCountChange={setQualifyingCount}
                  canManage={canManage || false}
                  leagueId={leagueId}
                  leagueEndDate={selectedLeague.league.end_date}
                  onTournamentCreated={onRefresh}
                />
              ) : leagueQualifyingData && (
                <QualifyingPlayersCard
                  mode="league"
                  qualifyingData={leagueQualifyingData}
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

          {!qualifyingData && (
            <View style={{ padding: 24 }}>
              <View style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center'
              }}>
                <Trophy size={40} color={colors.mutedForeground} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.foreground,
                  textAlign: 'center',
                  marginTop: 16,
                  marginBottom: 8
                }}>
                  Tournament Bracket
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  lineHeight: 20
                }}>
                  The tournament bracket will be displayed here once players have been seeded.
                </Text>
              </View>
            </View>
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
          Tournament Bracket
        </Text>
        {tournament && (
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 4
          }}>
            {tournament.status === 'not_started' && 'Tournament not started'}
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
