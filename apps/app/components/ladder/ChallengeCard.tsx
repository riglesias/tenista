'use client'

import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { LadderChallengeWithPlayers, formatLadderPlayerName, isChallengeExpired } from '@/lib/validation/ladder.validation'
import { Clock, ArrowRight } from 'lucide-react-native'

interface ChallengeCardProps {
  challenge: LadderChallengeWithPlayers
  currentPlayerId: string | null
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
  onRecordMatch?: () => void
  onMessage?: () => void
  onEditResult?: () => void
  onReportResult?: () => void
}

function ChallengeCard({
  challenge,
  currentPlayerId,
  onAccept,
  onDecline,
  onCancel,
  onRecordMatch,
  onMessage,
  onEditResult,
  onReportResult,
}: ChallengeCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  const isChallenger = challenge.challenger_player_id === currentPlayerId
  const isChallenged = challenge.challenged_player_id === currentPlayerId

  // Format player names
  const challengerName = formatLadderPlayerName(
    challenge.challenger_player?.first_name || null,
    challenge.challenger_player?.last_name || null
  )
  const challengedName = formatLadderPlayerName(
    challenge.challenged_player?.first_name || null,
    challenge.challenged_player?.last_name || null
  )

  // Calculate deadline info
  const getDeadlineInfo = () => {
    const deadline =
      challenge.status === 'pending'
        ? new Date(challenge.acceptance_deadline)
        : challenge.match_deadline
        ? new Date(challenge.match_deadline)
        : null

    if (!deadline) return null

    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffMs < 0) {
      return { text: t('detail.expired'), isExpired: true }
    }

    if (diffDays > 0) {
      return { text: t('detail.timeLeft', { time: `${diffDays}d ${diffHours % 24}h` }), isExpired: false }
    }

    if (diffHours > 0) {
      return { text: t('detail.timeLeft', { time: `${diffHours}h` }), isExpired: false }
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return { text: t('detail.timeLeft', { time: `${diffMinutes}m` }), isExpired: false }
  }

  const deadlineInfo = getDeadlineInfo()
  const isExpired = isChallengeExpired(challenge)

  // Get status label
  const getStatusLabel = () => {
    switch (challenge.status) {
      case 'pending':
        return isChallenger ? t('detail.awaitingResponse') : t('detail.challengeReceived')
      case 'accepted':
        return t('detail.matchScheduled')
      case 'declined':
        return t('detail.declined')
      case 'completed':
        return t('detail.completed')
      case 'expired':
        return t('detail.expired')
      case 'cancelled':
        return t('detail.cancelled')
      default:
        return challenge.status
    }
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        opacity: isExpired ? 0.5 : 1,
      }}
    >
      {/* Header with status */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
          }}
        >
          {getStatusLabel()}
        </Text>
        {deadlineInfo && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: deadlineInfo.isExpired ? colors.destructive : colors.muted,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Clock
              size={12}
              color={deadlineInfo.isExpired ? '#fff' : colors.mutedForeground}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color: deadlineInfo.isExpired ? '#fff' : colors.mutedForeground,
                marginLeft: 4,
              }}
            >
              {deadlineInfo.text}
            </Text>
          </View>
        )}
      </View>

      {/* Players */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 8,
        }}
      >
        {/* Challenger */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: colors.mutedForeground,
              marginBottom: 4,
            }}
          >
            {t('detail.challenger')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: isChallenger ? colors.primary : colors.foreground,
            }}
          >
            {challengerName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
          >
            #{challenge.challenger_position}
          </Text>
        </View>

        {/* VS */}
        <View style={{ paddingHorizontal: 12 }}>
          <ArrowRight size={20} color={colors.mutedForeground} />
        </View>

        {/* Challenged */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: colors.mutedForeground,
              marginBottom: 4,
            }}
          >
            {t('detail.defending')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: isChallenged ? colors.primary : colors.foreground,
            }}
          >
            {challengedName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
          >
            #{challenge.challenged_position}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      {challenge.status === 'pending' && isChallenged && !isExpired && (
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={onDecline}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Decline challenge"
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.destructive,
              }}
            >
              {t('detail.decline')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAccept}
            style={{
              flex: 1,
              backgroundColor: colors.success,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Accept challenge"
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#fff',
              }}
            >
              {t('detail.accept')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {challenge.status === 'pending' && isChallenger && !isExpired && onCancel && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={onMessage}
              style={{
                flex: 1,
                backgroundColor: colors.muted,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Message player"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
              >
                {t('detail.messagePlayer')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                backgroundColor: colors.muted,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel challenge"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.destructive,
                }}
              >
                {t('detail.cancelChallenge')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {challenge.status === 'accepted' && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={onMessage}
              style={{
                flex: 1,
                backgroundColor: colors.muted,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Message player"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
              >
                {t('detail.messagePlayer')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRecordMatch}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Record match result"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.primaryForeground,
                }}
              >
                {t('detail.recordMatchResult')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Completed challenge: edit/report buttons */}
      {challenge.status === 'completed' && (onEditResult || onReportResult) && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {onEditResult && (
              <TouchableOpacity
                onPress={onEditResult}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted,
                  paddingVertical: 10,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit result"
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.foreground,
                  }}
                >
                  {t('detail.editResult')}
                </Text>
              </TouchableOpacity>
            )}
            {onReportResult && (
              <TouchableOpacity
                onPress={onReportResult}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted,
                  paddingVertical: 10,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Report result"
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.destructive,
                  }}
                >
                  {t('detail.reportResult')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default React.memo(ChallengeCard)
