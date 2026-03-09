'use client'

import React from 'react'
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import BottomSheet from '@/components/ui/BottomSheet'
import { LadderRankingWithPlayer, formatLadderPlayerName, formatLadderTeamName } from '@/lib/validation/ladder.validation'
import { LadderConfig, DEFAULT_LADDER_CONFIG } from '@/lib/validation/leagues.validation'
import { Swords, Clock, AlertCircle, User } from 'lucide-react-native'

interface ChallengeConfirmationSheetProps {
  visible: boolean
  onClose: () => void
  opponent: LadderRankingWithPlayer | null
  currentPlayerPosition: number | null
  ladderConfig: LadderConfig | null
  onConfirm: () => void
  isLoading?: boolean
  isDoublesLeague?: boolean
}

export default function ChallengeConfirmationSheet({
  visible,
  onClose,
  opponent,
  currentPlayerPosition,
  ladderConfig,
  onConfirm,
  isLoading = false,
  isDoublesLeague = false,
}: ChallengeConfirmationSheetProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  const config = ladderConfig || DEFAULT_LADDER_CONFIG

  if (!opponent) return null

  // Get opponent display name
  const opponentName = isDoublesLeague && opponent.doubles_team
    ? formatLadderTeamName(
        opponent.doubles_team.team_name,
        opponent.doubles_team.player1?.first_name || null,
        opponent.doubles_team.player1?.last_name || null,
        opponent.doubles_team.player2?.first_name || null,
        opponent.doubles_team.player2?.last_name || null
      )
    : formatLadderPlayerName(
        opponent.player?.first_name || null,
        opponent.player?.last_name || null
      )

  // Get rating
  const opponentRating = isDoublesLeague && opponent.doubles_team
    ? opponent.doubles_team.combined_rating
    : opponent.player?.rating

  // Calculate acceptance deadline
  const acceptanceDeadline = new Date()
  acceptanceDeadline.setDate(acceptanceDeadline.getDate() + config.challenge_acceptance_deadline_days)

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.6]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Swords size={28} color={colors.primaryForeground} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.foreground,
            }}
          >
            {t('detail.challengePlayer')}
          </Text>
        </View>

        {/* Opponent card */}
        <View
          style={{
            backgroundColor: colors.muted,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <User size={24} color={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
              >
                {opponentName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                  }}
                >
                  {t('detail.position', { position: opponent.position })}
                </Text>
                {opponentRating !== null && opponentRating !== undefined && (
                  <>
                    <Text style={{ color: colors.mutedForeground, marginHorizontal: 6 }}>•</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedForeground,
                      }}
                    >
                      {t('detail.rating', { rating: opponentRating.toFixed(1) })}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Position change info */}
        {currentPlayerPosition && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.muted,
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={18} color={colors.info} />
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginLeft: 10,
                flex: 1,
              }}
            >
              {t('detail.ifYouWin', { from: currentPlayerPosition, to: opponent.position })}
            </Text>
          </View>
        )}

        {/* Deadline info */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.muted,
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
          }}
        >
          <Clock size={18} color={colors.warning} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                color: colors.foreground,
                fontWeight: '500',
              }}
            >
              {t('detail.responseDeadlineDays', { days: config.challenge_acceptance_deadline_days })}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              {t('detail.matchDeadlineDays', { days: config.match_completion_deadline_days })}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
              }}
            >
              {t('alerts.cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel={t('detail.challenge')}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Swords size={18} color={colors.primaryForeground} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.primaryForeground,
                    marginLeft: 8,
                  }}
                >
                  {t('detail.challenge')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  )
}
