'use client'

import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { LadderRankingWithPlayer, formatLadderPlayerName, formatLadderTeamName } from '@/lib/validation/ladder.validation'
import { ChevronRight, ArrowUp, ArrowDown, Minus } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import CountryFlag from '@/components/ui/CountryFlag'

interface LadderRankingRowProps {
  ranking: LadderRankingWithPlayer
  isCurrentPlayer: boolean
  onPress?: () => void
  isLast?: boolean
  isDoublesLeague?: boolean
}

const LadderRankingRow = React.memo(function LadderRankingRow({
  ranking,
  isCurrentPlayer,
  onPress,
  isLast = false,
  isDoublesLeague = false,
}: LadderRankingRowProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  // Check if player is retired (is_active = false)
  const isRetired = ranking.is_active === false

  // Calculate position change
  const positionChange = ranking.previous_position
    ? ranking.previous_position - ranking.position
    : 0

  // Get display name
  const displayName = isDoublesLeague && ranking.doubles_team
    ? formatLadderTeamName(
        ranking.doubles_team.team_name,
        ranking.doubles_team.player1?.first_name || null,
        ranking.doubles_team.player1?.last_name || null,
        ranking.doubles_team.player2?.first_name || null,
        ranking.doubles_team.player2?.last_name || null
      )
    : formatLadderPlayerName(
        ranking.player?.first_name || null,
        ranking.player?.last_name || null
      )

  // Get nationality (for singles only)
  const nationalityCode = !isDoublesLeague ? ranking.player?.nationality_code : null

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isRetired}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isCurrentPlayer ? colors.accent : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
        opacity: isRetired ? 0.5 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, position ${ranking.position}${isRetired ? ', retired' : ''}`}
    >
      {/* Position with change indicator */}
      <View style={{ width: 44, flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.mutedForeground,
            width: 24,
          }}
        >
          {ranking.position}
        </Text>
        {positionChange > 0 && (
          <ArrowUp size={12} color={colors.success} style={{ marginLeft: 2 }} />
        )}
        {positionChange < 0 && (
          <ArrowDown size={12} color={colors.destructive} style={{ marginLeft: 2 }} />
        )}
        {positionChange === 0 && ranking.previous_position !== null && (
          <Minus size={10} color={colors.mutedForeground} style={{ marginLeft: 2 }} />
        )}
      </View>

      {/* Player/Team name with flag */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <CountryFlag
          countryCode={nationalityCode}
          size="sm"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            fontSize: 15,
            fontWeight: '500',
            color: isRetired ? colors.mutedForeground : colors.foreground,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {displayName}
          {isRetired && (
            <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.mutedForeground }}>
              {' '}({t('standings.retired')})
            </Text>
          )}
        </Text>
      </View>

      {/* W/L columns */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.foreground,
          width: 30,
          textAlign: 'center',
        }}
      >
        {ranking.wins}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.foreground,
          width: 30,
          textAlign: 'center',
        }}
      >
        {ranking.losses}
      </Text>

      {/* Chevron for navigation to profile */}
      <View style={{ width: 32, alignItems: 'flex-end' }}>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  )
})

export default LadderRankingRow
