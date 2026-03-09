'use client'

import React from 'react'
import { ScrollView, Text, View, RefreshControl } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { LadderRankingWithPlayer } from '@/lib/validation/ladder.validation'
import LadderRankingRow from './LadderRankingRow'

const TableHeader = React.memo(function TableHeader() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <View
      style={{
        backgroundColor: colors.muted,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: colors.mutedForeground,
          width: 44,
        }}
      >
        #
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: colors.mutedForeground,
          flex: 1,
        }}
      >
        PLAYER
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: colors.mutedForeground,
          width: 30,
          textAlign: 'center',
        }}
      >
        W
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: colors.mutedForeground,
          width: 30,
          textAlign: 'center',
        }}
      >
        L
      </Text>
      <View style={{ width: 32 }} />
    </View>
  )
})

interface LadderRankingsTableProps {
  rankings: LadderRankingWithPlayer[]
  currentPlayerId: string | null
  refreshing: boolean
  onRefresh: () => void
  onPlayerPress?: (playerId: string) => void
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null | undefined
  isDoublesLeague?: boolean
}

const LadderRankingsTable = React.memo(function LadderRankingsTable({
  rankings,
  currentPlayerId,
  refreshing,
  onRefresh,
  onPlayerPress,
  ListHeaderComponent,
  isDoublesLeague = false,
}: LadderRankingsTableProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {ListHeaderComponent}
      <View
        style={{
          marginHorizontal: 24,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <TableHeader />
        {rankings.map((item, index) => {
          const isLast = index === rankings.length - 1
          const isCurrentPlayer = item.player_id === currentPlayerId

          return (
            <LadderRankingRow
              key={item.id}
              ranking={item}
              isCurrentPlayer={isCurrentPlayer}
              onPress={() => item.player_id && onPlayerPress?.(item.player_id)}
              isLast={isLast}
              isDoublesLeague={isDoublesLeague}
            />
          )
        })}
      </View>
    </ScrollView>
  )
})

export default LadderRankingsTable
