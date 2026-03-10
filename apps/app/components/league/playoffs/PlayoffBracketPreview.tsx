'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Eye, Trophy } from 'lucide-react-native'
import React, { useMemo, useCallback } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import CountryFlag from '@/components/ui/CountryFlag'

// Common player fields used for bracket display
interface BracketPlayer {
  id: string
  firstName: string | null
  lastName: string | null
  seedPosition: number
  nationality_code?: string | null
}

// Match data from active tournament
interface TournamentMatch {
  id: string
  match_number: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  is_bye: boolean | null
  status: 'pending' | 'completed' | 'bye'
  result_data?: {
    score?: string
    scores?: Array<{ player1: number; player2: number }>
  } | null
  player1?: {
    id: string
    first_name: string | null
    last_name: string | null
    nationality_code?: string | null
  } | null
  player2?: {
    id: string
    first_name: string | null
    last_name: string | null
    nationality_code?: string | null
  } | null
  winner?: {
    id: string
    first_name: string | null
    last_name: string | null
    nationality_code?: string | null
  } | null
}

// Round data from active tournament
interface TournamentRound {
  id: string
  round_number: number
  round_name: string
  status: 'not_started' | 'in_progress' | 'completed'
  matches: TournamentMatch[]
}

// Participant data from active tournament
interface TournamentParticipant {
  player_id: string
  seed_position: number
  player?: {
    id: string
    first_name: string | null
    last_name: string | null
    nationality_code?: string | null
  }
}

interface PlayoffBracketPreviewProps {
  qualifyingData: {
    qualifiedPlayers: BracketPlayer[]
    [key: string]: any // Allow additional fields from either format
  }
  qualifyingCount: number
  // NEW optional props for active tournaments:
  tournamentData?: {
    rounds: TournamentRound[]
    participants: TournamentParticipant[]
    status: 'not_started' | 'in_progress' | 'completed'
  }
  currentPlayerId?: string | null
  canManage?: boolean
  onEnterResult?: (matchId: string, opponentId: string) => void
}

export default function PlayoffBracketPreview({
  qualifyingData,
  qualifyingCount,
  tournamentData,
  currentPlayerId,
  canManage = false,
  onEnterResult
}: PlayoffBracketPreviewProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const isActiveTournament = !!tournamentData && tournamentData.status !== 'not_started'

  const formatPlayerName = useCallback((player: any) => {
    const firstName = player.firstName || player.first_name || ''
    const lastName = player.lastName || player.last_name || ''
    if (firstName && lastName) {
      return `${firstName} ${lastName.charAt(0)}.`
    }
    return `${firstName} ${lastName}`.trim()
  }, [])

  // Build a participant lookup map for O(1) access instead of O(n) find
  const participantMap = useMemo(() => {
    if (!tournamentData?.participants) return new Map<string, TournamentParticipant>()
    const map = new Map<string, TournamentParticipant>()
    for (const p of tournamentData.participants) {
      map.set(p.player_id, p)
    }
    return map
  }, [tournamentData?.participants])

  // Get participant data by player ID (for active tournaments)
  const getParticipantByPlayerId = useCallback((playerId: string): TournamentParticipant | undefined => {
    return participantMap.get(playerId)
  }, [participantMap])

  // Format scores for display
  const formatScores = useCallback((match: TournamentMatch): string => {
    if (match.result_data?.score) {
      return match.result_data.score
    }
    if (match.result_data?.scores && Array.isArray(match.result_data.scores)) {
      return match.result_data.scores
        .map(s => `${s.player1}-${s.player2}`)
        .join(', ')
    }
    return ''
  }, [])

  // Find champion from completed tournament
  const champion = useMemo((): { player: any; seedPosition: number } | null => {
    if (!tournamentData || tournamentData.status !== 'completed') return null

    const lastRound = tournamentData.rounds[tournamentData.rounds.length - 1]
    if (!lastRound || lastRound.round_name !== 'Final') return null

    const finalMatch = lastRound.matches[0]
    if (!finalMatch || !finalMatch.winner_id) return null

    const participant = participantMap.get(finalMatch.winner_id)
    return {
      player: finalMatch.winner,
      seedPosition: participant?.seed_position || 1
    }
  }, [tournamentData, participantMap])

  const generateBracketPreview = () => {
    // Sort players by seed position to ensure correct bracket matchups
    const players = qualifyingData.qualifiedPlayers
      .slice(0, qualifyingCount)
      .sort((a, b) => a.seedPosition - b.seedPosition)
    const rounds = []

    // Generate first round matchups
    const firstRoundMatches = []
    const totalPlayers = players.length

    // Handle byes for non-power-of-two tournaments
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalPlayers)))
    const byeCount = nextPowerOfTwo - totalPlayers


    // Actually need to handle the case where totalPlayers is 1 or 0
    if (totalPlayers <= 1) {
      return []
    }

    let matchNumber = 1

    // Create matches with proper seeding (1 vs lowest, 2 vs second lowest, etc.)
    // Higher seeds get byes first
    for (let i = 0; i < nextPowerOfTwo / 2; i++) {
      let match = {
        matchNumber,
        player1: null as any,
        player2: null as any,
        isBye: false
      }

      // Handle byes - higher seeds get byes
      if (i < byeCount) {
        match.player1 = players[i]
        match.player2 = null
        match.isBye = true
      } else {
        // For actual matches, pair highest remaining with lowest remaining
        const adjustedIndex = i - byeCount
        const topSeedIndex = byeCount + adjustedIndex
        const bottomSeedIndex = totalPlayers - 1 - adjustedIndex

        match.player1 = players[topSeedIndex]
        match.player2 = players[bottomSeedIndex]
      }

      firstRoundMatches.push(match)
      matchNumber++
    }


    rounds.push({
      roundNumber: 1,
      roundName: 'First Round',
      matches: firstRoundMatches
    })

    // Generate subsequent rounds (just structure, no players)
    let currentRoundMatches = firstRoundMatches.length
    let roundNum = 2

    while (currentRoundMatches > 1) {
      const nextRoundMatches = Math.ceil(currentRoundMatches / 2)
      const roundName = getRoundName(roundNum, Math.ceil(Math.log2(nextPowerOfTwo)))

      const matches = []
      for (let i = 0; i < nextRoundMatches; i++) {
        matches.push({
          matchNumber: matchNumber++,
          player1: null,
          player2: null,
          isBye: false,
          placeholder: true
        })
      }

      rounds.push({
        roundNumber: roundNum,
        roundName,
        matches
      })

      currentRoundMatches = nextRoundMatches
      roundNum++
    }

    return rounds
  }

  // Convert tournament data rounds to bracket format
  const convertTournamentRoundsToBracket = () => {
    if (!tournamentData) return []

    return tournamentData.rounds.map(round => ({
      roundNumber: round.round_number,
      roundName: round.round_name,
      roundStatus: round.status,
      matches: round.matches.map(match => {
        const participant1 = match.player1_id ? getParticipantByPlayerId(match.player1_id) : null
        const participant2 = match.player2_id ? getParticipantByPlayerId(match.player2_id) : null

        return {
          id: match.id,
          matchNumber: match.match_number,
          player1: match.player1 ? {
            id: match.player1.id,
            firstName: match.player1.first_name,
            lastName: match.player1.last_name,
            seedPosition: participant1?.seed_position || 0,
            nationality_code: match.player1.nationality_code
          } : null,
          player2: match.player2 ? {
            id: match.player2.id,
            firstName: match.player2.first_name,
            lastName: match.player2.last_name,
            seedPosition: participant2?.seed_position || 0,
            nationality_code: match.player2.nationality_code
          } : null,
          winnerId: match.winner_id,
          isBye: match.is_bye || false,
          status: match.status,
          resultData: match.result_data,
          rawMatch: match
        }
      })
    }))
  }

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - roundNumber + 1
    if (roundsFromEnd === 1) return 'Final'
    if (roundsFromEnd === 2) return 'Semifinal'
    if (roundsFromEnd === 3) return 'Quarterfinal'
    return `Round ${roundNumber}`
  }

  const renderCompactPlayer = (
    player: any,
    isBye: boolean = false,
    placeholder: boolean = false,
    isWinner: boolean = false,
    isCurrentPlayer: boolean = false
  ) => {
    if (placeholder) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontStyle: 'italic'
          }}>
            Winner advances
          </Text>
          <Text style={{
            fontSize: 11,
            color: colors.mutedForeground
          }}>
            -
          </Text>
        </View>
      )
    }

    if (isBye) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontStyle: 'italic'
          }}>
            Bye
          </Text>
          <Text style={{
            fontSize: 11,
            color: colors.mutedForeground
          }}>
            -
          </Text>
        </View>
      )
    }

    if (!player) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontStyle: 'italic'
          }}>
            TBD
          </Text>
          <Text style={{
            fontSize: 11,
            color: colors.mutedForeground
          }}>
            -
          </Text>
        </View>
      )
    }

    const formattedName = formatPlayerName(player)

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CountryFlag
          countryCode={player.nationality_code}
          size="sm"
          style={{ marginRight: 6 }}
        />
        <Text style={{
          fontSize: 12,
          fontWeight: isWinner ? '600' : '500',
          color: isCurrentPlayer ? colors.primary : colors.foreground
        }}>
          {formattedName}
          {player.seedPosition > 0 && (
            <Text style={{
              fontSize: 11,
              fontWeight: '500',
              color: colors.mutedForeground
            }}>
              {' '}({player.seedPosition})
            </Text>
          )}
        </Text>
        {isWinner && (
          <Trophy size={14} color="#FFD700" style={{ marginLeft: 6 }} />
        )}
      </View>
    )
  }

  const renderMatch = (match: any, roundNumber: number, matchIndex: number, isLastRound: boolean) => {
    const matchHeight = 80
    const isActiveMatch = isActiveTournament && match.id
    const matchCompleted = match.status === 'completed'
    const matchIsBye = match.isBye || match.status === 'bye'

    // Determine if current player can enter result
    const isPlayerInMatch = currentPlayerId &&
      (match.player1?.id === currentPlayerId || match.player2?.id === currentPlayerId)
    const canEnterResult = isActiveMatch &&
      (canManage || isPlayerInMatch) &&
      match.status === 'pending' &&
      !matchIsBye &&
      match.player1 &&
      match.player2

    // Get opponent ID for navigation
    const opponentId = match.player1?.id === currentPlayerId
      ? match.player2?.id
      : match.player1?.id

    // Check if players are winners
    const player1IsWinner = matchCompleted && match.winnerId === match.player1?.id
    const player2IsWinner = matchCompleted && match.winnerId === match.player2?.id

    // Check if players are current player
    const player1IsCurrentPlayer = match.player1?.id === currentPlayerId
    const player2IsCurrentPlayer = match.player2?.id === currentPlayerId

    // Get scores for display
    const scores = match.rawMatch ? formatScores(match.rawMatch) : ''

    return (
      <View style={{
        minWidth: 180,
        position: 'relative'
      }}>
        {/* Match container */}
        <View style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 6,
          overflow: 'hidden'
        }}>
          <View style={{ gap: 0 }}>
            {/* Player 1 row */}
            <View style={{
              padding: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}>
              {renderCompactPlayer(
                match.player1,
                matchIsBye && !match.player1,
                match.placeholder,
                player1IsWinner,
                player1IsCurrentPlayer
              )}
            </View>

            {/* Score display (for completed matches) */}
            {matchCompleted && scores && (
              <View style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: colors.muted,
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.mutedForeground
                }}>
                  {scores}
                </Text>
              </View>
            )}

            {/* Player 2 row */}
            <View style={{
              padding: 8
            }}>
              {renderCompactPlayer(
                match.player2,
                matchIsBye && !match.player2,
                match.placeholder,
                player2IsWinner,
                player2IsCurrentPlayer
              )}
            </View>

            {/* Enter Result button */}
            {canEnterResult && opponentId && (
              <TouchableOpacity
                onPress={() => onEnterResult?.(match.id, opponentId)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                  borderTopWidth: 1,
                  borderTopColor: colors.border
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.primaryForeground
                }}>
                  Enter Result
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderRound = (round: any, roundIndex: number, totalRounds: number) => {
    // Constants for bracket layout
    const MATCH_HEIGHT = 80
    const BASE_SPACING = 16
    const CONNECTOR_LINE_WIDTH = 2
    const HORIZONTAL_LINE_LENGTH = 20
    const ROUND_SPACING = 40

    /**
     * Calculate spacing that increases exponentially for each round
     * Round 0: 16px, Round 1: 32px, Round 2: 64px, etc.
     * This creates the classic tournament bracket spacing pattern
     */
    const matchSpacing = BASE_SPACING * Math.pow(2, roundIndex)

    /**
     * Calculate vertical offset to center matches relative to previous round
     * First round has no offset, subsequent rounds are centered between
     * the matches they connect to in the previous round
     */
    const verticalOffset = roundIndex === 0 ? 0 : (MATCH_HEIGHT + BASE_SPACING * Math.pow(2, roundIndex - 1)) / 2

    // Derived positioning values
    const matchCenterY = MATCH_HEIGHT / 2
    const horizontalLineY = matchCenterY - 1 // -1 for line thickness
    const connectorPointX = -HORIZONTAL_LINE_LENGTH // Position where lines meet
    const verticalConnectorX = connectorPointX - 1 // -1 for line thickness
    const nextRoundConnectorX = -ROUND_SPACING // Position for next round connection

    const isLastRound = roundIndex === totalRounds - 1

    return (
      <View key={round.roundNumber} style={{ marginRight: 40, position: 'relative' }}>
        <View style={{
          backgroundColor: colors.muted,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground
          }}>
            {round.roundName}
          </Text>
        </View>

        <View style={{
          gap: matchSpacing,
          marginTop: verticalOffset
        }}>
          {round.matches.map((match: any, matchIndex: number) => {
            return (
              <View key={match.matchNumber || match.id} style={{ position: 'relative' }}>
                {renderMatch(match, round.roundNumber, matchIndex, isLastRound)}

                {/* Connection lines */}
                {!isLastRound && (
                  <>
                    {/* Horizontal line from every match */}
                    <View style={{
                      position: 'absolute',
                      right: connectorPointX,
                      top: horizontalLineY,
                      width: HORIZONTAL_LINE_LENGTH,
                      height: CONNECTOR_LINE_WIDTH,
                      backgroundColor: colors.border
                    }} />

                    {/* Vertical connector for first match in pair */}
                    {matchIndex % 2 === 0 && matchIndex + 1 < round.matches.length && (
                      <>
                        {/* Vertical line - connect to next match */}
                        <View style={{
                          position: 'absolute',
                          right: verticalConnectorX,
                          top: matchCenterY,
                          width: CONNECTOR_LINE_WIDTH,
                          height: matchSpacing + MATCH_HEIGHT,
                          backgroundColor: colors.border
                        }} />

                        {/* Horizontal line to next round from midpoint */}
                        <View style={{
                          position: 'absolute',
                          right: nextRoundConnectorX,
                          top: matchCenterY + (matchSpacing + MATCH_HEIGHT) / 2 - 1,
                          width: HORIZONTAL_LINE_LENGTH,
                          height: CONNECTOR_LINE_WIDTH,
                          backgroundColor: colors.border
                        }} />
                      </>
                    )}
                  </>
                )}
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  // Render champion display for completed tournaments
  const renderChampionDisplay = () => {
    if (!champion) return null

    return (
      <View style={{
        backgroundColor: `${colors.success}15`,
        borderWidth: 2,
        borderColor: colors.success,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center'
      }}>
        <Trophy size={32} color="#FFD700" />
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.mutedForeground,
          marginTop: 8
        }}>
          Champion
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <CountryFlag
            countryCode={champion.player?.nationality_code}
            size="md"
            style={{ marginRight: 8 }}
          />
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.foreground
          }}>
            {formatPlayerName(champion.player)}
          </Text>
        </View>
        <Text style={{
          fontSize: 12,
          color: colors.mutedForeground,
          marginTop: 4
        }}>
          Seed #{champion.seedPosition}
        </Text>
      </View>
    )
  }

  // Use tournament data for active tournaments, otherwise generate preview
  const bracketRounds = useMemo(() => {
    if (qualifyingData.qualifiedPlayers.length === 0) return []
    return isActiveTournament
      ? convertTournamentRoundsToBracket()
      : generateBracketPreview()
  }, [isActiveTournament, tournamentData, qualifyingData.qualifiedPlayers, qualifyingCount, participantMap])

  if (qualifyingData.qualifiedPlayers.length === 0) {
    return (
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          alignItems: 'center'
        }}>
          <Eye size={20} color={colors.mutedForeground} />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginTop: 8,
            marginBottom: 4
          }}>
            No Qualifying Players
          </Text>
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center'
          }}>
            Play more matches to see the playoff bracket
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
      <View style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
      }}>
        {/* Champion display for completed tournaments */}
        {tournamentData?.status === 'completed' && renderChampionDisplay()}

        {/* Tournament Bracket */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {bracketRounds.map((round, roundIndex) => renderRound(round, roundIndex, bracketRounds.length))}
          </View>
        </ScrollView>

      </View>
    </View>
  )
}
