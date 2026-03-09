'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import BottomSheet from './BottomSheet'
import Badge from './Badge'
import CountryFlag from './CountryFlag'

// Helper function to format player name with last name initial
function formatPlayerName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) {
    return parts[0] // If only one name, return as is
  }
  const firstName = parts[0]
  const lastNameInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastNameInitial}.`
}

interface PlayerInfo {
  name: string
  countryCode: string
  rating?: number
}

interface MatchData {
  id: string
  date: string
  currentPlayer: PlayerInfo
  opponent: PlayerInfo
  scores: { player1: number; player2: number }[]
  isWin: boolean
  league?: {
    id: string
    name: string
    division: string
  }
  gameType: string
}

interface MatchCardProps {
  match: MatchData
  onEdit?: (matchId: string) => void
  onReport?: (matchId: string) => void
}

export default function MatchCard({ match, onEdit, onReport }: MatchCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t, i18n } = useTranslation('match')
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US'
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  }

  const getBadgeText = () => {
    if (match.gameType === 'competitive') {
      if (match.league) {
        const name = match.league.name
        return name.length > 20 ? name.substring(0, 20) + '…' : name
      }
      return t('matchCard.competitive')
    }
    return match.gameType === 'practice' ? t('matchCard.practice') : t('matchCard.match')
  }

  const handleReport = () => {
    setShowMenu(false)
    onReport?.(match.id)
  }

  const handleEdit = () => {
    setShowMenu(false)
    onEdit?.(match.id)
  }

  const ScoreBox = ({ score }: { score: number }) => (
    <View
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 4,
        minWidth: 36,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 16,
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
    isWinner, 
    scores 
  }: { 
    player: PlayerInfo
    isWinner: boolean
    scores: number[]
  }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      {/* Player info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <CountryFlag
          countryCode={player.countryCode}
          size="sm"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            fontSize: 16,
            color: colors.foreground,
            fontWeight: '500',
            marginRight: 8,
          }}
        >
          {formatPlayerName(player.name)}
        </Text>
        {player.rating && (
          <Badge variant="info" size="sm">
            {player.rating.toFixed(1)}
          </Badge>
        )}
        <View style={{ flex: 1 }} />
      </View>

      {/* Trophy icon for winner */}
      {isWinner && (
        <Ionicons
          name="trophy"
          size={16}
          color="#FFD700"
          style={{ marginRight: 8 }}
        />
      )}

      {/* Score boxes */}
      <View style={{ flexDirection: 'row' }}>
        {scores.map((score, index) => (
          <ScoreBox key={index} score={score} />
        ))}
      </View>
    </View>
  )

  // Parse scores to get individual set scores for each player
  const getPlayerScores = () => {
    if (!match.scores || !Array.isArray(match.scores)) {
      return {
        currentPlayerScores: [],
        opponentScores: []
      }
    }

    // Filter out unplayed sets (sets where both players have 0 points)
    const playedSets = match.scores.filter(set => set.player1 > 0 || set.player2 > 0)

    const currentPlayerScores = playedSets.map(set => set.player1)
    const opponentScores = playedSets.map(set => set.player2)

    return {
      currentPlayerScores,
      opponentScores
    }
  }

  const { currentPlayerScores, opponentScores } = getPlayerScores()

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Header with date, badge, and menu */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        {/* Left side - Date and badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Badge variant="info">
            {formatDate(match.date)}
          </Badge>
          <Badge variant={match.gameType === 'competitive' ? 'warning' : 'success'}>
            {getBadgeText()}
          </Badge>
        </View>

        {/* Right side - Three dots menu */}
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={{
            padding: 4,
          }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Players with Scores */}
      <View>
        <PlayerRow 
          player={match.currentPlayer} 
          isWinner={match.isWin} 
          scores={currentPlayerScores}
        />
        <PlayerRow 
          player={match.opponent} 
          isWinner={!match.isWin} 
          scores={opponentScores}
        />
      </View>

      {/* Menu Bottom Sheet */}
      <BottomSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        snapPoints={[0.30]}
      >
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            {t('matchCard.options')}
          </Text>

          <TouchableOpacity
            onPress={handleEdit}
            style={{
              paddingVertical: 18,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: colors.muted,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.foreground}
              style={{ marginRight: 16 }}
            />
            <Text
              style={{
                fontSize: 16,
                color: colors.foreground,
                fontWeight: '500',
              }}
            >
              {t('matchCard.editScore')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReport}
            style={{
              paddingVertical: 18,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: '#ef4444',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="flag-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
            <Text
              style={{
                fontSize: 16,
                color: '#ffffff',
                fontWeight: '500',
              }}
            >
              {t('matchCard.reportMatch')}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  )
} 