'use client'

import MatchCard from '@/components/ui/MatchCard'
import ReportMatchDialog from '@/components/ui/ReportMatchDialog'
import { useAppToast } from '@/components/ui/Toast'
import CompletedLeagueCard from '@/components/league/CompletedLeagueCard'
import { useTheme } from '@/contexts/ThemeContext'
import { reportMatchResult } from '@/lib/actions/matches.actions'
import { getPlayerStats, MatchData, PlayerStatsData } from '@/lib/actions/player-stats.actions'
import { getPlayerProfile } from '@/lib/actions/player.actions'
import { getCompletedUserLeagues } from '@/lib/actions/leagues.actions'
import { UserLeague } from '@/lib/validation/leagues.validation'
import { getThemeColors } from '@/lib/utils/theme'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import ResultsLoading from '@/components/results/ResultsLoading'
import React, { useCallback, useRef, useState } from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: string
}

function StatsCard({ title, value, icon }: StatsCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <View
      className="flex-1 items-center rounded-lg border p-4"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={20}
          color={colors.mutedForeground}
          className="mb-2"
        />
      )}
      <Text
        className="text-2xl font-bold mb-1"
        style={{ color: colors.foreground }}
      >
        {value}
      </Text>
      <Text
        className="text-xs text-center"
        style={{ color: colors.mutedForeground }}
      >
        {title}
      </Text>
    </View>
  )
}

export default function ResultsScreen() {
  const { isDark, theme } = useTheme()
  const colors = getThemeColors(isDark)
  const insets = useSafeAreaInsets()
  const { t } = useTranslation('match')
  const { t: tErrors } = useTranslation('errors')
  const { showToast } = useAppToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [stats, setStats] = useState<PlayerStatsData | null>(null)
  const [matches, setMatches] = useState<MatchData[]>([])
  const [completedLeagues, setCompletedLeagues] = useState<UserLeague[]>([])

  const fetchData = async () => {
    try {
      // Get current player
      const { data: player } = await getPlayerProfile()
      if (!player) {
        return
      }

      setCurrentPlayerId(player.id)

      // Get stats, matches, and completed leagues
      const [statsResult, completedResult] = await Promise.all([
        getPlayerStats(player.id),
        getCompletedUserLeagues(player.id),
      ])

      setStats(statsResult.stats)
      setMatches(statsResult.recentMatches)
      setCompletedLeagues(completedResult.data || [])
    } catch (error) {
      // silently handled
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const [reportDialogVisible, setReportDialogVisible] = useState(false)
  const [reportingMatchId, setReportingMatchId] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const handleEditMatch = (matchId: string) => {
    router.push({
      pathname: '/submit-result',
      params: { editMatchId: matchId, editMode: 'true' }
    })
  }

  const handleReportMatch = (matchId: string) => {
    setReportingMatchId(matchId)
    setReportDialogVisible(true)
  }

  const handleSubmitReport = async (reason: string) => {
    if (!reportingMatchId) return

    setReportLoading(true)
    try {
      const { data, error } = await reportMatchResult(reportingMatchId, reason)

      if (error) {
        const message = error.message?.includes('already have a pending report')
          ? t('report.alreadyReported')
          : t('report.error')
        showToast(message, { type: 'error' })
      } else {
        showToast(t('report.success'), { type: 'success' })
        setReportDialogVisible(false)
      }
    } catch (error) {
      showToast(t('report.error'), { type: 'error' })
    } finally {
      setReportLoading(false)
    }
  }

  const hasLoadedRef = useRef(false)

  // Single fetch effect: initial load on first focus, refresh on subsequent focuses
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true
        fetchData()
      } else if (currentPlayerId) {
        fetchData()
      }
    }, [currentPlayerId])
  )

  if (loading && !refreshing) {
    return <ResultsLoading />
  }

  return (
    <View 
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 100
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-16 pb-4">
          <Text
            style={[theme.typography.h2, { color: colors.foreground }]}
          >
            {t('results.title')}
          </Text>
        </View>

        {/* League Ranking Card */}
        {stats && (
          <View className="px-6 mb-6" style={{ marginTop: 16 }}>
            <View
              className="rounded-xl border p-5 items-center"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              {stats.currentLeague ? (
                <>
                  <Text
                    className="text-sm mb-1"
                    style={{ color: colors.mutedForeground }}
                  >
                    {stats.currentLeague.name}
                  </Text>
                  <Text
                    className="text-xs mb-2 capitalize"
                    style={{ color: colors.mutedForeground }}
                  >
                    {stats.currentLeague.division.replace('_', ' ')} • {stats.currentLeague.points} {t('results.stats.points')}
                  </Text>
                  <Text
                    className="text-5xl font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {stats.leagueRanking ? `${stats.leagueRanking}°` : '-'}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    className="text-sm mb-2"
                    style={{ color: colors.mutedForeground }}
                  >
                    {t('results.leagueRanking')}
                  </Text>
                  <Text
                    className="text-base text-center"
                    style={{ color: colors.mutedForeground }}
                  >
                    {t('results.notInLeague')}
                  </Text>
                  <Text
                    className="text-sm text-center mt-1"
                    style={{ color: colors.mutedForeground }}
                  >
                    {t('results.joinLeagueMessage')}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Stats Row */}
        {stats && (
          <View className="px-6 mb-8">
            <View className="flex-row gap-3">
              <StatsCard
                title={t('results.stats.played')}
                value={stats.matchesPlayed}
                icon="tennisball-outline"
              />
              <StatsCard
                title={t('results.stats.won')}
                value={stats.wins}
                icon="trophy-outline"
              />
              <StatsCard
                title={t('results.stats.lost')}
                value={stats.losses}
                icon="sad-outline"
              />
            </View>
          </View>
        )}

        {/* Completed Competitions */}
        {completedLeagues.length > 0 && (
          <View className="px-6 mb-8">
            <Text
              className="text-xl font-bold mb-4"
              style={{ color: colors.foreground }}
            >
              {t('results.completedCompetitions')}
            </Text>
            {completedLeagues.map((league) => (
              <CompletedLeagueCard
                key={league.league.id}
                userLeague={league}
                onPress={(id) => router.push(`/league-detail?leagueId=${id}`)}
              />
            ))}
          </View>
        )}

        {/* Past Matches Section */}
        <View className="px-6">
          <Text
            className="text-xl font-bold mb-4"
            style={{ color: colors.foreground }}
          >
            {t('results.pastMatches')}
          </Text>

          {matches.length > 0 ? (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onEdit={handleEditMatch}
                onReport={handleReportMatch}
              />
            ))
          ) : (
            <View
              className="rounded-xl border p-10 items-center"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <Text
                className="text-base text-center"
                style={{ color: colors.mutedForeground }}
              >
                {t('results.noMatchesFound')}
              </Text>
              <Text
                className="text-sm text-center mt-1"
                style={{ color: colors.mutedForeground }}
              >
                {t('results.submitFirstMatch')}
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      <ReportMatchDialog
        visible={reportDialogVisible}
        onClose={() => setReportDialogVisible(false)}
        onSubmit={handleSubmitReport}
        loading={reportLoading}
      />
    </View>
  )
} 