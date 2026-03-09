import { 
  QualifiedPlayer, 
  BracketData, 
  BracketRound, 
  BracketMatch,
  calculateBracketSize,
  calculateTotalRounds,
  calculateByeCount,
  getRoundName
} from '@/lib/validation/playoffs.validation'

export interface BracketGenerationOptions {
  players: QualifiedPlayer[]
  seedingMethod?: 'standard' | 'random' | 'snake'
  byeDistribution?: 'top' | 'bottom' | 'balanced'
}

export interface AdvancementResult {
  winnerId: string
  nextRoundMatch: number
  nextRoundPosition: 'player1' | 'player2'
}

/**
 * Advanced bracket generation service with multiple seeding strategies
 */
export class BracketService {
  /**
   * Generate tournament bracket with advanced seeding options
   */
  static generateBracket(options: BracketGenerationOptions): BracketData {
    const { players, seedingMethod = 'standard', byeDistribution = 'balanced' } = options
    
    if (players.length < 2) {
      throw new Error('At least 2 players are required for bracket generation')
    }

    const bracketSize = calculateBracketSize(players.length)
    const totalRounds = calculateTotalRounds(bracketSize)
    const byeCount = calculateByeCount(players.length)
    
    // Apply seeding strategy
    const seededPlayers = this.applySeedingStrategy(players, seedingMethod)
    
    // Generate first round with bye distribution
    const firstRoundMatches = this.generateFirstRound(seededPlayers, bracketSize, byeDistribution)
    
    // Create all rounds structure
    const rounds = this.generateAllRounds(firstRoundMatches, totalRounds)
    
    return {
      rounds,
      totalRounds,
      participantCount: players.length
    }
  }

  /**
   * Apply different seeding strategies
   */
  private static applySeedingStrategy(players: QualifiedPlayer[], method: string): QualifiedPlayer[] {
    switch (method) {
      case 'random':
        return this.shuffleArray([...players])
      case 'snake':
        return this.applySnakeSeeding(players)
      case 'standard':
      default:
        // Players are already sorted by league position (best to worst)
        return [...players]
    }
  }

  /**
   * Snake seeding: 1,4,5,8,9,12,13,16 vs 2,3,6,7,10,11,14,15
   */
  private static applySnakeSeeding(players: QualifiedPlayer[]): QualifiedPlayer[] {
    const result: QualifiedPlayer[] = []
    const groups: QualifiedPlayer[][] = []
    
    // Create groups of 4
    for (let i = 0; i < players.length; i += 4) {
      groups.push(players.slice(i, i + 4))
    }
    
    // Apply snake pattern within each group
    groups.forEach(group => {
      if (group.length >= 4) {
        result.push(group[0], group[3], group[1], group[2])
      } else {
        result.push(...group)
      }
    })
    
    return result
  }

  /**
   * Generate first round matches with proper bye distribution
   */
  private static generateFirstRound(
    players: QualifiedPlayer[],
    bracketSize: number,
    byeDistribution: string
  ): BracketMatch[] {
    const matches: BracketMatch[] = []
    const matchCount = bracketSize / 2
    const byeCount = bracketSize - players.length

    // Traditional distribution: top seeds get byes, then top vs bottom pairing
    // This matches the preview bracket algorithm
    if (byeDistribution === 'traditional') {
      for (let i = 0; i < matchCount; i++) {
        let match: BracketMatch

        if (i < byeCount) {
          // Top seeds get byes
          match = {
            matchNumber: i + 1,
            player1: players[i],
            player2: null,
            winner: players[i], // Bye winner advances automatically
            isBye: true,
            status: 'bye'
          }
        } else {
          // Pair highest remaining seed with lowest remaining seed
          const adjustedIndex = i - byeCount
          const topSeedIndex = byeCount + adjustedIndex
          const bottomSeedIndex = players.length - 1 - adjustedIndex

          match = {
            matchNumber: i + 1,
            player1: players[topSeedIndex],
            player2: players[bottomSeedIndex],
            winner: null,
            isBye: false,
            status: 'pending'
          }
        }

        matches.push(match)
      }

      return matches
    }

    // For other distributions, use position-based approach
    const positions = this.createMatchupPositions(players, bracketSize, byeDistribution)

    for (let i = 0; i < matchCount; i++) {
      const player1Position = i * 2
      const player2Position = i * 2 + 1

      const player1 = positions[player1Position]
      const player2 = positions[player2Position]

      const isBye = !player1 || !player2
      const winner = isBye ? (player1 || player2) : null

      matches.push({
        matchNumber: i + 1,
        player1,
        player2,
        winner,
        isBye,
        status: isBye ? 'bye' : 'pending'
      })
    }

    return matches
  }

  /**
   * Create matchup positions with bye distribution
   */
  private static createMatchupPositions(
    players: QualifiedPlayer[], 
    bracketSize: number, 
    byeDistribution: string
  ): (QualifiedPlayer | null)[] {
    const positions: (QualifiedPlayer | null)[] = new Array(bracketSize).fill(null)
    const byeCount = bracketSize - players.length

    switch (byeDistribution) {
      case 'top':
        // Place all byes at the top
        for (let i = 0; i < players.length; i++) {
          positions[byeCount + i] = players[i]
        }
        break
        
      case 'bottom':
        // Place all byes at the bottom
        for (let i = 0; i < players.length; i++) {
          positions[i] = players[i]
        }
        break
        
      case 'balanced':
      default:
        // Distribute byes evenly throughout bracket
        const byePositions = this.calculateBalancedByePositions(bracketSize, byeCount)
        let playerIndex = 0
        
        for (let i = 0; i < bracketSize; i++) {
          if (!byePositions.includes(i)) {
            positions[i] = players[playerIndex++]
          }
        }
        break
    }
    
    return positions
  }

  /**
   * Calculate balanced bye positions to spread them evenly
   */
  private static calculateBalancedByePositions(bracketSize: number, byeCount: number): number[] {
    if (byeCount === 0) return []
    
    const positions: number[] = []
    const interval = bracketSize / byeCount
    
    for (let i = 0; i < byeCount; i++) {
      const position = Math.floor(i * interval)
      positions.push(position)
    }
    
    return positions
  }

  /**
   * Generate all tournament rounds
   */
  private static generateAllRounds(firstRoundMatches: BracketMatch[], totalRounds: number): BracketRound[] {
    const rounds: BracketRound[] = []
    let currentMatches = firstRoundMatches
    
    for (let round = 1; round <= totalRounds; round++) {
      rounds.push({
        roundNumber: round,
        roundName: getRoundName(round, totalRounds),
        matches: [...currentMatches]
      })
      
      // Generate next round matches (empty for now)
      if (round < totalRounds) {
        const nextRoundMatches: BracketMatch[] = []
        for (let i = 0; i < currentMatches.length / 2; i++) {
          nextRoundMatches.push({
            matchNumber: i + 1,
            player1: null,
            player2: null,
            winner: null,
            isBye: false,
            status: 'pending'
          })
        }
        currentMatches = nextRoundMatches
      }
    }
    
    return rounds
  }

  /**
   * Calculate advancement for a completed match
   */
  static calculateAdvancement(
    matchNumber: number, 
    roundNumber: number, 
    totalRounds: number
  ): AdvancementResult | null {
    if (roundNumber >= totalRounds) {
      return null // Final round, no advancement
    }
    
    const nextRoundMatch = Math.ceil(matchNumber / 2)
    const nextRoundPosition = matchNumber % 2 === 1 ? 'player1' : 'player2'
    
    return {
      winnerId: '', // Will be filled by caller
      nextRoundMatch,
      nextRoundPosition
    }
  }

  /**
   * Advance winner to next round
   */
  static advanceWinner(
    bracket: BracketData, 
    completedMatchRound: number, 
    completedMatchNumber: number, 
    winnerId: string
  ): BracketData {
    const advancement = this.calculateAdvancement(
      completedMatchNumber, 
      completedMatchRound, 
      bracket.totalRounds
    )
    
    if (!advancement) {
      return bracket // No advancement needed (final match)
    }
    
    // Find winner player data
    const currentRound = bracket.rounds[completedMatchRound - 1]
    const currentMatch = currentRound.matches[completedMatchNumber - 1]
    const winner = currentMatch.player1?.id === winnerId ? currentMatch.player1 : currentMatch.player2
    
    if (!winner) {
      throw new Error('Winner not found in match')
    }
    
    // Update next round
    const nextRound = bracket.rounds[completedMatchRound]
    const nextMatch = nextRound.matches[advancement.nextRoundMatch - 1]
    
    if (advancement.nextRoundPosition === 'player1') {
      nextMatch.player1 = winner
    } else {
      nextMatch.player2 = winner
    }
    
    // Check if both players are now set for the next match
    if (nextMatch.player1 && nextMatch.player2) {
      nextMatch.status = 'pending'
    }
    
    return bracket
  }

  /**
   * Check if a round is complete
   */
  static isRoundComplete(round: BracketRound): boolean {
    return round.matches.every(match => 
      match.status === 'completed' || match.status === 'bye'
    )
  }

  /**
   * Check if tournament is complete
   */
  static isTournamentComplete(bracket: BracketData): boolean {
    const finalRound = bracket.rounds[bracket.totalRounds - 1]
    return this.isRoundComplete(finalRound)
  }

  /**
   * Get tournament champion
   */
  static getTournamentChampion(bracket: BracketData): QualifiedPlayer | null {
    if (!this.isTournamentComplete(bracket)) {
      return null
    }
    
    const finalRound = bracket.rounds[bracket.totalRounds - 1]
    const finalMatch = finalRound.matches[0]
    
    return finalMatch.winner
  }

  /**
   * Validate bracket integrity
   */
  static validateBracket(bracket: BracketData): string[] {
    const errors: string[] = []
    
    // Check round count
    if (bracket.rounds.length !== bracket.totalRounds) {
      errors.push(`Round count mismatch: expected ${bracket.totalRounds}, got ${bracket.rounds.length}`)
    }
    
    // Check each round
    bracket.rounds.forEach((round, roundIndex) => {
      const expectedMatches = Math.pow(2, bracket.totalRounds - round.roundNumber)
      
      if (round.matches.length !== expectedMatches) {
        errors.push(`Round ${round.roundNumber}: expected ${expectedMatches} matches, got ${round.matches.length}`)
      }
      
      // Check match numbering
      round.matches.forEach((match, matchIndex) => {
        if (match.matchNumber !== matchIndex + 1) {
          errors.push(`Round ${round.roundNumber}, match ${matchIndex + 1}: incorrect match number ${match.matchNumber}`)
        }
      })
    })
    
    return errors
  }

  /**
   * Shuffle array utility
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Get all possible matchups in first round
   */
  static getFirstRoundMatchups(players: QualifiedPlayer[]): Array<[QualifiedPlayer, QualifiedPlayer | null]> {
    const bracketSize = calculateBracketSize(players.length)
    const matchCount = bracketSize / 2
    const matchups: Array<[QualifiedPlayer, QualifiedPlayer | null]> = []
    
    for (let i = 0; i < matchCount; i++) {
      const player1Index = i
      const player2Index = players.length - 1 - i
      
      const player1 = player1Index < players.length ? players[player1Index] : null
      const player2 = player2Index >= 0 && player2Index < players.length && player2Index !== player1Index 
        ? players[player2Index] 
        : null
      
      if (player1) {
        matchups.push([player1, player2])
      }
    }
    
    return matchups
  }

  /**
   * Calculate match difficulty based on seed positions
   */
  static calculateMatchDifficulty(player1: QualifiedPlayer, player2: QualifiedPlayer | null): number {
    if (!player2) return 0 // Bye match
    
    const seedDifference = Math.abs(player1.seedPosition - player2.seedPosition)
    return 1 / (1 + seedDifference) // Closer seeds = higher difficulty
  }
}