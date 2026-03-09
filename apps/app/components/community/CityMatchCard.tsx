'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import React from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Badge from '../ui/Badge'
import CountryFlag from '../ui/CountryFlag'

// Helper function to format player name with last name initial
function formatPlayerName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) {
    return parts[0]
  }
  const firstName = parts[0]
  const lastNameInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastNameInitial}.`
}

interface PlayerInfo {
  id: string
  name: string
  countryCode: string
  rating?: number
  isWinner: boolean
}

interface CityMatchData {
  id: string
  date: string
  gameType: string
  scores: { player1: number; player2: number }[]
  player1: PlayerInfo
  player2: PlayerInfo
  league?: {
    id: string
    name: string
    division: string
  }
}

interface CityMatchCardProps {
  match: CityMatchData
}

export default function CityMatchCard({ match }: CityMatchCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t, i18n } = useTranslation('community')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return t('recentActivity.today')
    }

    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return t('recentActivity.yesterday')
    }

    // Otherwise show date with locale
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US'
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  }

  const ScoreBox = ({ score }: { score: number }) => (
    <View
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 3,
        minWidth: 28,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.foreground,
        }}
      >
        {score}
      </Text>
    </View>
  )

  const PlayerRow = ({ 
    player, 
    scores,
    opponentScores
  }: { 
    player: PlayerInfo
    scores: number[]
    opponentScores: number[]
  }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      {/* Player info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <CountryFlag
          countryCode={player.countryCode}
          size="sm"
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            fontSize: 13,
            color: colors.foreground,
            fontWeight: player.isWinner ? '600' : '500',
            marginRight: 6,
          }}
          numberOfLines={1}
        >
          {formatPlayerName(player.name)}
        </Text>
        {player.rating && (
          <Text
            style={{
              fontSize: 11,
              color: colors.mutedForeground,
            }}
          >
            ({player.rating.toFixed(1)})
          </Text>
        )}
      </View>

      {/* Score boxes */}
      <View style={{ flexDirection: 'row' }}>
        {scores.map((score, index) => (
          <ScoreBox 
            key={index} 
            score={score}
          />
        ))}
      </View>
    </View>
  )

  // Parse scores to get individual set scores for each player
  const getPlayerScores = () => {
    if (!match.scores || !Array.isArray(match.scores)) {
      return {
        player1Scores: [],
        player2Scores: []
      }
    }

    // Filter out unplayed sets (sets where both players have 0 points)
    const playedSets = match.scores.filter(set => set.player1 > 0 || set.player2 > 0)

    const player1Scores = playedSets.map(set => set.player1)
    const player2Scores = playedSets.map(set => set.player2)

    return {
      player1Scores,
      player2Scores
    }
  }

  const { player1Scores, player2Scores } = getPlayerScores()

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 12,
        width: 280, // Fixed width for horizontal scrolling
        marginRight: 12,
      }}
    >
      {/* Header with date and game type */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
        <Badge variant="info" size="sm">
          {formatDate(match.date)}
        </Badge>
        <Badge variant={match.gameType === 'competitive' ? 'warning' : 'success'} size="sm">
          {match.gameType === 'competitive'
            ? (match.league
              ? (match.league.name.length > 18 ? match.league.name.substring(0, 18) + '…' : match.league.name)
              : t('recentActivity.competitive'))
            : t('recentActivity.practice')}
        </Badge>
      </View>

      {/* Players with Scores */}
      <View>
        <PlayerRow 
          player={match.player1} 
          scores={player1Scores}
          opponentScores={player2Scores}
        />
        <PlayerRow 
          player={match.player2} 
          scores={player2Scores}
          opponentScores={player1Scores}
        />
      </View>
    </View>
  )
}