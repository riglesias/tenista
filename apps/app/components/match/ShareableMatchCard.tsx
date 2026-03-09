import React from 'react'
import { View, Text, StyleSheet, ImageBackground, ImageSourcePropType } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import TenistaLogo from '@/components/ui/TenistaLogo'
import CountryFlag from '@/components/ui/CountryFlag'

// Court background images
const COURT_BACKGROUNDS: Record<CourtSurface, ImageSourcePropType> = {
  hard: require('@/assets/images/courts/hard-court.jpg'),
  clay: require('@/assets/images/courts/clay-court.jpg'),
  grass: require('@/assets/images/courts/grass-court.jpg'),
}

type CourtSurface = 'hard' | 'clay' | 'grass'

interface PlayerData {
  id: string
  first_name: string | null
  last_name: string | null
  nationality_code: string | null
}

interface SetScore {
  player1: number
  player2: number
}

interface ShareableMatchCardProps {
  isWinner: boolean
  currentPlayer: PlayerData
  opponent: PlayerData
  scores: SetScore[]
  matchDate: Date
  competitionName?: string
  courtSurface?: CourtSurface
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * ShareableMatchCard - A styled card showing match results
 * Displayed in the celebration screen
 * Uses court surface backgrounds (hard, clay, grass)
 * Sized for Instagram Story (9:16 aspect ratio)
 */
export default function ShareableMatchCard({
  isWinner,
  currentPlayer,
  opponent,
  scores,
  matchDate,
  competitionName,
  courtSurface = 'hard',
}: ShareableMatchCardProps) {
  // Filter out unplayed sets (where both scores are 0)
  const playedScores = scores.filter(s => s.player1 > 0 || s.player2 > 0)

  // Determine which player won based on played sets
  const setsWonByCurrent = playedScores.filter(s => s.player1 > s.player2).length
  const setsWonByOpponent = playedScores.filter(s => s.player2 > s.player1).length
  const currentPlayerWon = setsWonByCurrent > setsWonByOpponent

  // Winner is at the top
  const winner = currentPlayerWon ? currentPlayer : opponent
  const loser = currentPlayerWon ? opponent : currentPlayer
  const winnerScores = currentPlayerWon ? playedScores.map(s => s.player1) : playedScores.map(s => s.player2)
  const loserScores = currentPlayerWon ? playedScores.map(s => s.player2) : playedScores.map(s => s.player1)

  const backgroundSource = COURT_BACKGROUNDS[courtSurface]

  // Don't show competition name if it's practice or empty
  const showCompetition = competitionName &&
    competitionName.toLowerCase() !== 'practice' &&
    competitionName.toLowerCase() !== 'práctica'

  return (
    <View style={styles.container} collapsable={false}>
      <ImageBackground
        source={backgroundSource}
        style={styles.card}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.3, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Logo above the bracket */}
        <View style={styles.logoContainer}>
          <TenistaLogo
            width={100}
            height={28}
            primaryColor="#FFFFFF"
            textColor="#FFFFFF"
          />
        </View>

        {/* Bracket section: info row + score card */}
        <View style={styles.bracketSection}>
          {/* Match info row: location (left) and date (right) */}
          <View style={styles.matchInfoRow}>
            {showCompetition ? (
              <Text style={styles.competitionText} numberOfLines={1}>
                {competitionName}
              </Text>
            ) : (
              <View />
            )}
            <Text style={styles.dateText}>
              {formatDate(matchDate)}
            </Text>
          </View>

          {/* Score Card with frosted glass effect */}
          <View style={styles.scoreCard}>
          <View style={styles.scoreCardInner}>
            {/* Winner Row */}
            <View style={styles.playerRow}>
              <View style={styles.playerInfo}>
                <CountryFlag countryCode={winner.nationality_code} size="sm" />
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerFirstName} numberOfLines={1}>
                    {winner.first_name}
                  </Text>
                  <Text style={styles.playerLastName} numberOfLines={1}>
                    {(winner.last_name || '').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.scoresRow}>
                {winnerScores.map((score, index) => (
                  <View key={index} style={[styles.scoreBox, playedScores.length >= 5 && styles.scoreBoxSmall]}>
                    <Text style={[styles.scoreText, styles.winningScore, playedScores.length >= 5 && styles.scoreTextSmall]}>{score}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Loser Row */}
            <View style={styles.playerRow}>
              <View style={styles.playerInfo}>
                <CountryFlag countryCode={loser.nationality_code} size="sm" />
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerFirstName} numberOfLines={1}>
                    {loser.first_name}
                  </Text>
                  <Text style={styles.playerLastName} numberOfLines={1}>
                    {(loser.last_name || '').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.scoresRow}>
                {loserScores.map((score, index) => (
                  <View key={index} style={[styles.scoreBox, playedScores.length >= 5 && styles.scoreBoxSmall]}>
                    <Text style={[styles.scoreText, playedScores.length >= 5 && styles.scoreTextSmall]}>{score}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
        </View>

        {/* Watermark */}
        <Text style={styles.watermark}>
          tenista.app
        </Text>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 340,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  backgroundImage: {
    borderRadius: 16,
  },
  logoContainer: {
    zIndex: 1,
  },
  bracketSection: {
    width: '100%',
    gap: 8,
    zIndex: 1,
  },
  scoreCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  scoreCardInner: {
    padding: 16,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  playerNameContainer: {
    flex: 1,
  },
  playerFirstName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  playerLastName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  scoreBox: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoxSmall: {
    width: 24,
    height: 24,
    borderRadius: 5,
  },
  scoreText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreTextSmall: {
    fontSize: 12,
  },
  winningScore: {
    color: '#84FE0C',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 4,
  },
  matchInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  competitionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  watermark: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    zIndex: 1,
  },
})
