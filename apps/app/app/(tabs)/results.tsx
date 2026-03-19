'use client'

import MatchCard from '@/components/ui/MatchCard'
import ReportMatchDialog from '@/components/ui/ReportMatchDialog'
import { useAppToast } from '@/components/ui/Toast'
import CompletedLeagueCard from '@/components/league/CompletedLeagueCard'
import StatsCard from '@/components/results/StatsCard'
import { useTheme } from '@/contexts/ThemeContext'
import { reportMatchResult } from '@/lib/actions/matches.actions'
import { getPlayerStats, MatchData, PlayerStatsData } from '@/lib/actions/player-stats.actions'
import { getPlayerProfile } from '@/lib/actions/player.actions'
import { getCompletedUserLeagues } from '@/lib/actions/leagues.actions'
import { UserLeague } from '@/lib/validation/leagues.validation'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { getThemeColors } from '@/lib/utils/theme'
import { router, useFocusEffect } from 'expo-router'
import ResultsLoading from '@/components/results/ResultsLoading'
import React, { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

const INITIAL_MATCH_LIMIT = 10
const LOAD_MORE_INCREMENT = 10

function getOrdinalSuffix(n: number, language: string): string {
  if (language === 'es') return '°'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export default function ResultsScreen() {
  const { isDark, theme } = useTheme()
  const colors = getThemeColors(isDark)
  const insets = useSafeAreaInsets()
  const { t, i18n } = useTranslation('match')
  const { t: tErrors } = useTranslation('errors')
  const { showToast } = useAppToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [stats, setStats] = useState<PlayerStatsData | null>(null)
  const [matches, setMatches] = useState<MatchData[]>([])
  const [completedLeagues, setCompletedLeagues] = useState<UserLeague[]>([])
  const [matchLimit, setMatchLimit] = useState(INITIAL_MATCH_LIMIT)
  const [hasMoreMatches, setHasMoreMatches] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [statsTabIndex, setStatsTabIndex] = useState(0) // 0 = Overall, 1 = League

  const fetchData = async (limit: number = INITIAL_MATCH_LIMIT) => {
    try {
      const { data: player } = await getPlayerProfile()
      if (!player) {
        return
      }

      setCurrentPlayerId(player.id)

      const [statsResult, completedResult] = await Promise.all([
        getPlayerStats(player.id, limit),
        getCompletedUserLeagues(player.id),
      ])

      setStats(statsResult.stats)
      setMatches(statsResult.recentMatches)
      setHasMoreMatches(statsResult.hasMore)
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
    setMatchLimit(INITIAL_MATCH_LIMIT)
    fetchData(INITIAL_MATCH_LIMIT)
  }

  const handleLoadMore = async () => {
    if (!currentPlayerId || loadingMore) return
    setLoadingMore(true)
    const newLimit = matchLimit + LOAD_MORE_INCREMENT
    try {
      const statsResult = await getPlayerStats(currentPlayerId, newLimit)
      setMatches(statsResult.recentMatches)
      setHasMoreMatches(statsResult.hasMore)
      setMatchLimit(newLimit)
    } catch (error) {
      // silently handled
    } finally {
      setLoadingMore(false)
    }
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

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true
        fetchData()
      } else if (currentPlayerId) {
        fetchData(matchLimit)
      }
    }, [currentPlayerId])
  )

  // Compute display stats based on toggle
  const showLeagueStats = statsTabIndex === 1 && !!stats?.currentLeague
  const displayStats = stats ? (
    showLeagueStats
      ? {
          played: stats.currentLeague!.matchesPlayed,
          won: stats.currentLeague!.wins,
          lost: stats.currentLeague!.losses,
        }
      : {
          played: stats.matchesPlayed,
          won: stats.wins,
          lost: stats.losses,
        }
  ) : null

  const winRate = displayStats && displayStats.played > 0
    ? Math.round((displayStats.won / displayStats.played) * 100)
    : 0

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
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: colors.primary }}
                  >
                    {t('results.currentLeague')}
                  </Text>
                  <Text
                    className="text-sm mb-1"
                    style={{ color: colors.mutedForeground }}
                  >
                    {stats.currentLeague.name}
                  </Text>
                  <Text
                    className="text-xs mb-3 capitalize"
                    style={{ color: colors.mutedForeground }}
                  >
                    {stats.currentLeague.division.replace('_', ' ')} • {stats.currentLeague.points} {t('results.stats.points')}
                  </Text>
                  <Text
                    className="text-5xl font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {stats.leagueRanking
                      ? `${stats.leagueRanking}${getOrdinalSuffix(stats.leagueRanking, i18n.language)}`
                      : '-'}
                  </Text>
                  {stats.leagueRanking && stats.currentLeague.totalPlayers > 1 && (
                    <Text
                      className="text-xs mt-1"
                      style={{ color: colors.mutedForeground }}
                    >
                      {t('results.rankingOfTotal', {
                        ranking: `${stats.leagueRanking}${getOrdinalSuffix(stats.leagueRanking, i18n.language)}`,
                        total: stats.currentLeague.totalPlayers,
                      })}
                    </Text>
                  )}
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

        {/* Stats Section */}
        {stats && displayStats && (
          <View className="px-6 mb-8">
            {/* Stats toggle (only when in a league) */}
            {stats.currentLeague && (
              <View className="mb-3">
                <SegmentedControl
                  segments={[
                    t('results.stats.overallStats'),
                    t('results.stats.leagueStats'),
                  ]}
                  selectedIndex={statsTabIndex}
                  onChange={setStatsTabIndex}
                />
              </View>
            )}

            {/* Stats row */}
            <View className="flex-row gap-3">
              <StatsCard
                title={t('results.stats.played')}
                value={displayStats.played}
                icon="tennisball-outline"
              />
              <StatsCard
                title={t('results.stats.won')}
                value={displayStats.won}
                icon="trophy-outline"
              />
              <StatsCard
                title={t('results.stats.lost')}
                value={displayStats.lost}
                icon="sad-outline"
              />
            </View>

            {/* Win Rate */}
            {displayStats.played > 0 && (
              <View
                className="mt-3 rounded-lg border p-3"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className="text-xs font-medium"
                    style={{ color: colors.mutedForeground }}
                  >
                    {t('results.stats.winRate')}
                  </Text>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {winRate}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.muted,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${winRate}%`,
                      borderRadius: 3,
                      backgroundColor: winRate >= 50 ? '#22C55E' : '#F59E0B',
                    }}
                  />
                </View>
              </View>
            )}
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
            <>
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onEdit={handleEditMatch}
                  onReport={handleReportMatch}
                />
              ))}

              {/* Load More Button */}
              {hasMoreMatches && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                      {t('results.loadMore')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
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
