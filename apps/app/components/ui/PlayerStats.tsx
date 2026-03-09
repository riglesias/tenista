'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import React from 'react'
import { Text, View } from 'react-native'
import StatCard from './StatCard'

interface PlayerStatsData {
  globalRanking?: number
  leagueRanking?: number
  currentLeague?: {
    id: string
    name: string
    division: string
    points: number
    totalPlayers: number
  }
  matchesPlayed: number
  wins: number
  losses: number
}

interface PlayerStatsProps {
  stats: PlayerStatsData
}

export default function PlayerStats({ stats }: PlayerStatsProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)


  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.foreground,
          marginBottom: 16,
        }}
      >
        Stats
      </Text>

      {/* Rankings Row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <StatCard
          title="League Ranking"
          value={stats.leagueRanking && stats.currentLeague ? `${stats.leagueRanking}°` : '-'}
          subtitle={stats.currentLeague?.name}
        />
        <StatCard
          title="Global Ranking"
          value={stats.globalRanking ? `${stats.globalRanking}°` : '-'}
        />
      </View>

      {/* Match Stats Row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatCard
          title="Played"
          value={stats.matchesPlayed}
          icon="tennisball-outline"
        />
        <StatCard
          title="Won"
          value={stats.wins}
          icon="trophy-outline"
        />
        <StatCard
          title="Lost"
          value={stats.losses}
          icon="sad-outline"
        />
      </View>
    </View>
  )
} 