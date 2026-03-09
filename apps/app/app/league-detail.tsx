'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { getLeagueDetail } from '@/lib/actions/leagues.actions'
import { getPlayerProfile } from '@/lib/actions/player.actions'
import { UserLeague } from '@/lib/validation/leagues.validation'
import ScreenHeader from '@/components/ui/ScreenHeader'
import CurrentLeague from '@/components/league/CurrentLeague'

export default function LeagueDetailScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [loading, setLoading] = useState(true)
  const [userLeague, setUserLeague] = useState<UserLeague | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: player } = await getPlayerProfile()
      if (!player || !leagueId) return

      setPlayerId(player.id)

      const { data, error } = await getLeagueDetail(leagueId, player.id)
      if (error) {
        console.error('Error fetching league detail:', error)
        return
      }
      setUserLeague(data)
    } catch (error) {
      console.error('Error in league detail:', error)
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScreenHeader title="" onBack={() => router.back()} />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </>
    )
  }

  if (!userLeague) {
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={userLeague.league.name} onBack={() => router.back()} />
        <CurrentLeague
          selectedLeague={userLeague}
          currentPlayerId={playerId}
          ListHeaderComponent={null}
          onRefresh={handleRefresh}
          refreshing={loading}
          isReadOnly={true}
        />
      </SafeAreaView>
    </>
  )
}
