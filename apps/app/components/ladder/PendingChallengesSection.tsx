'use client'

import React from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { LadderChallengeWithPlayers, isChallengeExpired } from '@/lib/validation/ladder.validation'
import ChallengeCard from './ChallengeCard'

interface PendingChallengesSectionProps {
  incomingChallenges: LadderChallengeWithPlayers[]
  outgoingChallenge: LadderChallengeWithPlayers | null
  acceptedIncomingChallenge?: LadderChallengeWithPlayers | null
  currentPlayerId: string | null
  onAccept: (challengeId: string) => void
  onDecline: (challengeId: string) => void
  onCancel: (challengeId: string) => void
  onRecordMatch: (challengeId: string) => void
  onMessage: (playerId: string) => void
}

export default function PendingChallengesSection({
  incomingChallenges,
  outgoingChallenge,
  acceptedIncomingChallenge,
  currentPlayerId,
  onAccept,
  onDecline,
  onCancel,
  onRecordMatch,
  onMessage,
}: PendingChallengesSectionProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  // Combine all challenges into a flat list
  const allChallenges: LadderChallengeWithPlayers[] = [
    ...(acceptedIncomingChallenge ? [acceptedIncomingChallenge] : []),
    ...incomingChallenges,
    ...(outgoingChallenge ? [outgoingChallenge] : []),
  ]

  if (allChallenges.length === 0) {
    return null
  }

  // Split into active and inactive
  const activeChallenges = allChallenges.filter((c) => !isChallengeExpired(c))
  const inactiveChallenges = allChallenges.filter((c) => isChallengeExpired(c))

  const renderCard = (challenge: LadderChallengeWithPlayers) => {
    const isChallenger = challenge.challenger_player_id === currentPlayerId
    return (
      <ChallengeCard
        key={challenge.id}
        challenge={challenge}
        currentPlayerId={currentPlayerId}
        onAccept={!isChallenger ? () => onAccept(challenge.id) : undefined}
        onDecline={!isChallenger ? () => onDecline(challenge.id) : undefined}
        onCancel={isChallenger ? () => onCancel(challenge.id) : undefined}
        onRecordMatch={() => onRecordMatch(challenge.id)}
        onMessage={() =>
          onMessage(
            isChallenger
              ? challenge.challenged_player_id!
              : challenge.challenger_player_id!
          )
        }
      />
    )
  }

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <View style={{ marginBottom: inactiveChallenges.length > 0 ? 16 : 0 }}>
          <Text
            className="text-xl font-bold mb-4"
            style={{ color: colors.foreground }}
          >
            {t('detail.activeChallenges')}
          </Text>
          {activeChallenges.map(renderCard)}
        </View>
      )}

      {/* Inactive challenges */}
      {inactiveChallenges.length > 0 && (
        <View>
          <Text
            className="text-xl font-bold mb-4"
            style={{ color: colors.foreground }}
          >
            {t('detail.inactiveChallenges')}
          </Text>
          {inactiveChallenges.map(renderCard)}
        </View>
      )}
    </View>
  )
}
