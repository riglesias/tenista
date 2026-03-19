'use client'

import React, { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import {
  getLeaguePreview,
  getLeagueStandings,
  joinLeague,
} from '@/lib/actions/leagues.actions'
import { getPlayerProfile } from '@/lib/actions/player.actions'
import {
  getDivisionInfo,
  isPlayerEligibleForLeague,
  LeagueStanding,
  LeagueWithStats,
} from '@/lib/validation/leagues.validation'
import ScreenHeader from '@/components/ui/ScreenHeader'
import LeaguePreviewHeader from '@/components/league/LeaguePreviewHeader'
import CountryFlag from '@/components/ui/CountryFlag'
import { ChevronRight } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'
import { useAppToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useQueryClient } from '@tanstack/react-query'

export default function LeaguePreviewScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')
  const { showToast } = useAppToast()
  const { confirm } = useConfirmDialog()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(true)
  const [league, setLeague] = useState<LeagueWithStats | null>(null)
  const [standings, setStandings] = useState<LeagueStanding[]>([])
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerRating, setPlayerRating] = useState<number | null>(null)
  const [joining, setJoining] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      if (!leagueId) return

      const [profileResult, previewResult, standingsResult] = await Promise.all([
        getPlayerProfile(),
        getLeaguePreview(leagueId),
        getLeagueStandings(leagueId),
      ])

      if (profileResult.data) {
        setPlayerId(profileResult.data.id)
        setPlayerRating(profileResult.data.rating ?? null)
      }
      if (previewResult.data) {
        setLeague(previewResult.data)
      }
      if (standingsResult.data) {
        setStandings(standingsResult.data)
      }
    } catch {
      // silently handled
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleJoin = useCallback(() => {
    if (!playerId || !league) return

    confirm({
      title: t('alerts.joinLeague'),
      message: t('alerts.confirmJoin'),
      confirmText: t('alerts.join'),
      cancelText: t('alerts.cancel'),
      destructive: false,
      onConfirm: async () => {
        setJoining(true)
        const { error } = await joinLeague(league.id, playerId)
        setJoining(false)

        if (error) {
          showToast((error as any)?.message || t('alerts.failedToJoin'), { type: 'error' })
        } else {
          showToast(t('alerts.joinedLeague'), { type: 'success' })
          queryClient.invalidateQueries({ queryKey: ['leagues'] })
          queryClient.invalidateQueries({ queryKey: ['userLeagues'] })
          router.back()
        }
      },
    })
  }, [playerId, league, t, confirm, showToast, queryClient])

  // Determine button state
  const getButtonState = () => {
    if (!league) return { text: '', canJoin: false }

    const rating = playerRating || 0
    const isEligible = isPlayerEligibleForLeague(rating, league)
    const isLeagueFull = league.player_count >= (league.max_players || 50)
    const isRetired = league.user_is_retired === true
    const divisionInfo = league.division
      ? getDivisionInfo(league.division, league.min_rating, league.max_rating)
      : null

    if (league.user_is_member) return { text: t('list.alreadyJoined'), canJoin: false }
    if (isRetired) return { text: t('list.youRetired'), canJoin: false }
    if (isLeagueFull) return { text: t('list.leagueFull'), canJoin: false }
    if (!isEligible) return { text: t('list.ratingRequired', { range: divisionInfo?.range || '' }), canJoin: false }

    const joinText = league.is_free
      ? t('preview.joinLeague')
      : t('preview.joinLeaguePaid', {
          price: new Intl.NumberFormat(i18n.language).format((league.price_cents || 0) / 100),
        })

    return { text: joinText, canJoin: true }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScreenHeader title="" onBack={() => router.back()} />
          <LoadingSpinner variant="overlay" />
        </SafeAreaView>
      </>
    )
  }

  if (!league) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScreenHeader title="" onBack={() => router.back()} />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
            <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: 'center' }}>
              League not found
            </Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  const { text: buttonText, canJoin } = getButtonState()

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={league.name} onBack={() => router.back()} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <LeaguePreviewHeader league={league} />

          {/* Standings Section */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 12 }}>
              {t('preview.standings')}
            </Text>

            {standings.length > 0 ? (
              <View style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {/* Table Header */}
                <View style={{
                  backgroundColor: colors.muted,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 30 }}>#</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, flex: 1 }}>{t('standings.playerHeader')}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 30, textAlign: 'center' }}>{t('standings.wins')}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 30, textAlign: 'center' }}>{t('standings.losses')}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 40, textAlign: 'center' }}>{t('standings.ptsHeader')}</Text>
                </View>

                {/* Table Rows */}
                {standings.map((standing, index) => (
                  <View
                    key={standing.player_id}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderBottomWidth: index === standings.length - 1 ? 0 : 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, width: 30 }}>
                      {standing.position}
                    </Text>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <CountryFlag countryCode={standing.nationality_code} size="sm" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, flex: 1 }} numberOfLines={1}>
                        {standing.player_name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, width: 30, textAlign: 'center' }}>
                      {standing.wins}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, width: 30, textAlign: 'center' }}>
                      {standing.losses}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, width: 40, textAlign: 'center' }}>
                      {standing.points}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                  {t('preview.noStandings')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky bottom button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 34,
          paddingTop: 16,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <TouchableOpacity
            onPress={canJoin ? handleJoin : undefined}
            disabled={!canJoin || joining}
            style={{
              backgroundColor: canJoin ? colors.primary : colors.muted,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: joining ? 0.7 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={buttonText}
          >
            {joining ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: canJoin ? colors.primaryForeground : colors.mutedForeground,
              }}>
                {buttonText}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  )
}
