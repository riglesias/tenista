'use client'

import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { UserLeague } from '@/lib/validation/leagues.validation'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Trophy } from 'lucide-react-native'

interface CompletedLeagueCardProps {
  userLeague: UserLeague
  onPress: (leagueId: string) => void
}

export default function CompletedLeagueCard({ userLeague, onPress }: CompletedLeagueCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t, i18n } = useTranslation('match')

  const { league, membership, user_position, total_players, tournament_result } = userLeague

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

  const competitionTypeLabel = (() => {
    switch (league.competition_type) {
      case 'round_robin': return 'Round Robin'
      case 'ladder': return 'Ladder'
      case 'playoffs_only': return 'Tournament'
      case 'elimination': return 'Elimination'
      default: return 'League'
    }
  })()

  const competitionTypeColor = (() => {
    switch (league.competition_type) {
      case 'round_robin': return '#3B82F6'
      case 'ladder': return '#8B5CF6'
      case 'playoffs_only': return '#EF4444'
      case 'elimination': return '#F59E0B'
      default: return colors.mutedForeground
    }
  })()

  const hasImage = !!league.image_url
  const wins = membership.wins || 0
  const losses = membership.losses || 0

  const isTournamentType = league.competition_type === 'playoffs_only' || league.competition_type === 'elimination'

  const tournamentResultLabel = (() => {
    if (!tournament_result) return ''
    switch (tournament_result.type) {
      case 'champion': return t('results.tournamentResult.champion')
      case 'finalist': return t('results.tournamentResult.finalist')
      case 'semifinalist': return t('results.tournamentResult.semifinalist')
      case 'quarterfinalist': return t('results.tournamentResult.quarterfinalist')
      case 'round': return t('results.tournamentResult.roundX', { round: tournament_result.roundNumber })
      default: return ''
    }
  })()

  return (
    <TouchableOpacity
      onPress={() => onPress(league.id)}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Image / Trophy placeholder */}
      {hasImage ? (
        <Image
          source={{ uri: league.image_url! }}
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

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}
          numberOfLines={1}
        >
          {league.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '600',
            color: competitionTypeColor,
          }}>
            {competitionTypeLabel}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {' '}- {formatDate(league.end_date)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          {isTournamentType ? (
            <>
              {tournament_result?.type === 'champion' && (
                <Trophy size={13} color="#EAB308" style={{ marginRight: 4 }} />
              )}
              {tournamentResultLabel ? (
                <Text style={{
                  fontSize: 12,
                  color: tournament_result?.type === 'champion' ? '#EAB308' : colors.mutedForeground,
                  fontWeight: tournament_result?.type === 'champion' ? '600' : '400',
                }}>
                  {tournamentResultLabel}
                </Text>
              ) : null}
              {tournamentResultLabel && (wins > 0 || losses > 0) && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}> · </Text>
              )}
              {(wins > 0 || losses > 0) && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {wins}W-{losses}L
                </Text>
              )}
            </>
          ) : (
            <>
              {user_position > 0 && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  Final: {t('results.finalPosition', {
                    position: `${user_position}${getOrdinalSuffix(user_position, i18n.language)}`,
                    total: total_players
                  })}
                </Text>
              )}
              {user_position > 0 && (wins > 0 || losses > 0) && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}> · </Text>
              )}
              {(wins > 0 || losses > 0) && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {wins}W-{losses}L
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Chevron */}
      <ChevronRight size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  )
}

function getOrdinalSuffix(n: number, language: string): string {
  if (language === 'es') return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
