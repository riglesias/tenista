import {
  QualifiedPlayer,
  BracketSection,
  SectionBracketData,
  FeedInBracketData,
  LoserRoutingRule,
  PlayoffMatchStatusEnum,
  calculateBracketSize,
  calculateTotalRounds,
} from '@/lib/validation/playoffs.validation'

export interface FeedInBracketGenerationOptions {
  players: QualifiedPlayer[]
  seedingMethod?: 'standard' | 'random' | 'snake'
  guaranteedMatches?: number
}

export interface LoserRoutingResult {
  targetSection: BracketSection
  targetRound: number
  targetMatchNumber: number
  targetPosition: 'player1' | 'player2'
}

interface SectionMatch {
  matchNumber: number
  player1: QualifiedPlayer | null
  player2: QualifiedPlayer | null
  winner: QualifiedPlayer | null
  isBye: boolean
  status: 'pending' | 'completed' | 'bye'
  bracketSection: BracketSection
  sourceMatchId: string | null
}

interface SectionRound {
  roundNumber: number
  roundName: string
  bracketSection: BracketSection
  matches: SectionMatch[]
}

/**
 * Feed-In Consolation Bracket Service
 *
 * Generates and manages feed-in consolation brackets where ALL losers
 * are routed to consolation to guarantee 3 matches per player.
 *
 * Tournament Structure (8 players example):
 *
 * MAIN BRACKET                         CONSOLATION + BACKDRAW
 * ═══════════════════════════════════════════════════════════════════
 *
 * Round 1 (4 matches)
 *   M1: Seed1 vs Seed8  ─┐
 *   M2: Seed4 vs Seed5  ─┴─ R2-M1    │
 *   M3: Seed2 vs Seed7  ─┐           │ Losers
 *   M4: Seed3 vs Seed6  ─┴─ R2-M2    ↓
 *
 * Round 2 (2 matches)                 Consolation R1 (2 matches)
 *   R2-M1: W(M1) vs W(M2) ─┐         C1: L(M1) vs L(M2)  ─┐
 *   R2-M2: W(M3) vs W(M4) ─┴─ Final  C2: L(M3) vs L(M4)  ─┴─ Feed-in
 *         │                                   │
 *         │ Losers                            │ Winners
 *         ↓                                   ↓
 *
 * Final (1 match)                     Feed-in R1 (2 matches)
 *   F: W(R2-M1) vs W(R2-M2)           FI1: L(R2-M1) vs W(C1)
 *      │                              FI2: L(R2-M2) vs W(C2)
 *      Winner = Champion                     │ Losers
 *                                            ↓
 *
 *                                     Backdraw (1 match)
 *                                     BD: L(C1) vs L(C2)
 */
export class FeedInBracketService {
  /**
   * Generate complete feed-in consolation bracket structure
   */
  static generateFeedInBracket(options: FeedInBracketGenerationOptions): FeedInBracketData {
    const { players, seedingMethod = 'standard', guaranteedMatches = 3 } = options

    if (players.length < 4) {
      throw new Error('Feed-in consolation requires at least 4 players')
    }

    if (players.length > 32) {
      throw new Error('Feed-in consolation supports up to 32 players')
    }

    const bracketSize = calculateBracketSize(players.length)
    const mainRounds = calculateTotalRounds(bracketSize)
    const firstRoundMatches = bracketSize / 2

    // Apply seeding strategy
    const seededPlayers = this.applySeedingStrategy(players, seedingMethod)

    // Generate all bracket sections
    const mainBracket = this.generateMainSection(seededPlayers, mainRounds)
    const consolationBracket = this.generateConsolationSection(firstRoundMatches, mainRounds)
    const feedInBracket = this.generateFeedInSection(firstRoundMatches, mainRounds)
    const backdrawBracket = this.generateBackdrawSection(firstRoundMatches)

    // Generate routing rules
    const routingRules = this.generateRoutingRules(mainRounds, firstRoundMatches)

    return {
      bracketType: 'feed_in_consolation',
      sections: {
        main: mainBracket,
        consolation: consolationBracket,
        feedIn: feedInBracket,
        backdraw: backdrawBracket,
      },
      playerMatchCount: this.initializePlayerMatchCount(players),
      routingRules,
      participantCount: players.length,
      guaranteedMatches,
    }
  }

  /**
   * Generate the main bracket section
   */
  private static generateMainSection(
    players: QualifiedPlayer[],
    totalRounds: number
  ): SectionBracketData {
    const bracketSize = Math.pow(2, totalRounds)
    const byeCount = bracketSize - players.length
    const rounds: SectionRound[] = []

    // Generate first round with players
    const firstRoundMatches = this.generateFirstRoundMatches(players, bracketSize, byeCount)
    rounds.push({
      roundNumber: 1,
      roundName: this.getMainRoundName(1, totalRounds),
      bracketSection: 'main',
      matches: firstRoundMatches,
    })

    // Generate subsequent rounds (empty, to be filled as winners advance)
    let matchCount = firstRoundMatches.length / 2
    for (let round = 2; round <= totalRounds; round++) {
      const matches: SectionMatch[] = []
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          matchNumber: i + 1,
          player1: null,
          player2: null,
          winner: null,
          isBye: false,
          status: 'pending',
          bracketSection: 'main',
          sourceMatchId: null,
        })
      }
      rounds.push({
        roundNumber: round,
        roundName: this.getMainRoundName(round, totalRounds),
        bracketSection: 'main',
        matches,
      })
      matchCount = matchCount / 2
    }

    return {
      rounds,
      totalRounds,
    }
  }

  /**
   * Generate first round matches with bye handling
   */
  private static generateFirstRoundMatches(
    players: QualifiedPlayer[],
    bracketSize: number,
    byeCount: number
  ): SectionMatch[] {
    const matches: SectionMatch[] = []
    const matchCount = bracketSize / 2

    // Create standard bracket seeding positions
    // For 8 players: 1v8, 4v5, 2v7, 3v6
    const positions = this.getStandardBracketPositions(bracketSize)

    for (let i = 0; i < matchCount; i++) {
      const pos1 = positions[i * 2]
      const pos2 = positions[i * 2 + 1]

      const player1 = pos1 <= players.length ? players[pos1 - 1] : null
      const player2 = pos2 <= players.length ? players[pos2 - 1] : null

      const isBye = !player1 || !player2
      const winner = isBye ? (player1 || player2) : null

      matches.push({
        matchNumber: i + 1,
        player1,
        player2,
        winner,
        isBye,
        status: isBye ? 'bye' : 'pending',
        bracketSection: 'main',
        sourceMatchId: null,
      })
    }

    return matches
  }

  /**
   * Generate standard bracket seeding positions
   * For 8 players: [1,8,4,5,2,7,3,6] so matches are 1v8, 4v5, 2v7, 3v6
   */
  private static getStandardBracketPositions(bracketSize: number): number[] {
    if (bracketSize === 2) return [1, 2]
    if (bracketSize === 4) return [1, 4, 2, 3]
    if (bracketSize === 8) return [1, 8, 4, 5, 2, 7, 3, 6]
    if (bracketSize === 16) return [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]
    if (bracketSize === 32) {
      return [
        1, 32, 16, 17, 8, 25, 9, 24,
        4, 29, 13, 20, 5, 28, 12, 21,
        2, 31, 15, 18, 7, 26, 10, 23,
        3, 30, 14, 19, 6, 27, 11, 22
      ]
    }
    throw new Error(`Unsupported bracket size: ${bracketSize}`)
  }

  /**
   * Generate consolation section (for main R1 losers)
   */
  private static generateConsolationSection(
    firstRoundMatches: number,
    mainRounds: number
  ): SectionBracketData {
    const rounds: SectionRound[] = []

    // Consolation has fewer rounds than main bracket
    // For 8 players: 1 consolation round (pairs R1 losers)
    // For 16 players: 2 consolation rounds
    const consolationRounds = Math.max(1, mainRounds - 2)

    let matchCount = firstRoundMatches / 2

    for (let round = 1; round <= consolationRounds; round++) {
      const matches: SectionMatch[] = []
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          matchNumber: i + 1,
          player1: null, // Filled when losers come from main
          player2: null,
          winner: null,
          isBye: false,
          status: 'pending',
          bracketSection: 'consolation',
          sourceMatchId: null,
        })
      }
      rounds.push({
        roundNumber: round,
        roundName: `Consolation R${round}`,
        bracketSection: 'consolation',
        matches,
      })
      matchCount = Math.max(1, matchCount / 2)
    }

    return {
      rounds,
      totalRounds: consolationRounds,
    }
  }

  /**
   * Generate feed-in section (main R2+ losers vs consolation winners)
   */
  private static generateFeedInSection(
    firstRoundMatches: number,
    mainRounds: number
  ): SectionBracketData {
    const rounds: SectionRound[] = []

    // Feed-in rounds: one fewer than main rounds - 1
    // For 8 players: 1 feed-in round
    // For 16 players: 2 feed-in rounds
    const feedInRounds = Math.max(1, mainRounds - 2)

    let matchCount = firstRoundMatches / 2

    for (let round = 1; round <= feedInRounds; round++) {
      const matches: SectionMatch[] = []
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          matchNumber: i + 1,
          player1: null, // Filled by main R2+ loser
          player2: null, // Filled by consolation winner
          winner: null,
          isBye: false,
          status: 'pending',
          bracketSection: 'feed_in',
          sourceMatchId: null,
        })
      }
      rounds.push({
        roundNumber: round,
        roundName: `Feed-in R${round}`,
        bracketSection: 'feed_in',
        matches,
      })
      matchCount = Math.max(1, matchCount / 2)
    }

    return {
      rounds,
      totalRounds: feedInRounds,
    }
  }

  /**
   * Generate backdraw section (for consolation R1 losers)
   */
  private static generateBackdrawSection(firstRoundMatches: number): SectionBracketData {
    // Backdraw gives consolation R1 losers their 3rd match
    // For 8 players: 1 backdraw match (2 consolation losers)
    // For 16 players: 2 backdraw matches initially
    const backdrawMatchCount = Math.max(1, firstRoundMatches / 4)

    const rounds: SectionRound[] = [{
      roundNumber: 1,
      roundName: 'Backdraw',
      bracketSection: 'backdraw',
      matches: Array.from({ length: backdrawMatchCount }, (_, i) => ({
        matchNumber: i + 1,
        player1: null,
        player2: null,
        winner: null,
        isBye: false,
        status: 'pending',
        bracketSection: 'backdraw' as BracketSection,
        sourceMatchId: null,
      })),
    }]

    return {
      rounds,
      totalRounds: 1,
    }
  }

  /**
   * Generate routing rules for losers
   */
  static generateRoutingRules(mainRounds: number, firstRoundMatches: number): LoserRoutingRule[] {
    const rules: LoserRoutingRule[] = []

    // Main R1 losers -> Consolation R1
    rules.push({
      fromSection: 'main',
      fromRound: 1,
      toSection: 'consolation',
      toRound: 1,
    })

    // Main R2+ losers -> Feed-in (paired with consolation winners)
    for (let round = 2; round < mainRounds; round++) {
      rules.push({
        fromSection: 'main',
        fromRound: round,
        toSection: 'feed_in',
        toRound: round - 1, // Feed-in R1 gets Main R2 losers
        targetPosition: 'player1',
      })
    }

    // Consolation winners -> Feed-in (to face main bracket losers)
    const consolationRounds = Math.max(1, mainRounds - 2)
    for (let round = 1; round <= consolationRounds; round++) {
      rules.push({
        fromSection: 'consolation',
        fromRound: round,
        toSection: 'feed_in',
        toRound: round,
        targetPosition: 'player2',
      })
    }

    // Consolation R1 losers -> Backdraw
    rules.push({
      fromSection: 'consolation',
      fromRound: 1,
      toSection: 'backdraw',
      toRound: 1,
    })

    return rules
  }

  /**
   * Route a loser to the appropriate bracket section
   */
  static routeLoser(
    bracket: FeedInBracketData,
    sourceSection: BracketSection,
    sourceRound: number,
    sourceMatchNumber: number,
    loserId: string
  ): LoserRoutingResult | null {
    // Check if player already has 3 matches (complete)
    const matchCount = bracket.playerMatchCount[loserId] || 0
    if (matchCount >= bracket.guaranteedMatches) {
      return null // Player is done
    }

    // Find applicable routing rule
    const rule = bracket.routingRules.find(
      r => r.fromSection === sourceSection && r.fromRound === sourceRound
    )

    if (!rule) {
      return null // No routing defined
    }

    // Calculate target match number based on source match
    const targetMatchNumber = Math.ceil(sourceMatchNumber / 2)

    // Determine position in target match
    let targetPosition: 'player1' | 'player2'
    if (rule.targetPosition) {
      targetPosition = rule.targetPosition
    } else {
      // Default: odd source matches go to player1, even to player2
      targetPosition = sourceMatchNumber % 2 === 1 ? 'player1' : 'player2'
    }

    return {
      targetSection: rule.toSection,
      targetRound: rule.toRound,
      targetMatchNumber,
      targetPosition,
    }
  }

  /**
   * Calculate how many total matches the tournament will have
   */
  static calculateTotalMatches(playerCount: number): number {
    // In feed-in consolation, each player plays exactly 3 matches
    // Total matches = (playerCount * 3) / 2 (since each match involves 2 players)
    return (playerCount * 3) / 2
  }

  /**
   * Get section-specific round name
   */
  private static getMainRoundName(round: number, totalRounds: number): string {
    if (round === totalRounds) return 'Final'
    if (round === totalRounds - 1) return 'Semifinal'
    if (round === totalRounds - 2) return 'Quarterfinal'
    return `Round ${round}`
  }

  /**
   * Apply seeding strategy
   */
  private static applySeedingStrategy(
    players: QualifiedPlayer[],
    method: string
  ): QualifiedPlayer[] {
    switch (method) {
      case 'random':
        return this.shuffleArray([...players])
      case 'snake':
        return this.applySnakeSeeding(players)
      case 'standard':
      default:
        return [...players]
    }
  }

  /**
   * Snake seeding
   */
  private static applySnakeSeeding(players: QualifiedPlayer[]): QualifiedPlayer[] {
    const result: QualifiedPlayer[] = []
    const groups: QualifiedPlayer[][] = []

    for (let i = 0; i < players.length; i += 4) {
      groups.push(players.slice(i, i + 4))
    }

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
   * Shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Initialize player match count map
   */
  private static initializePlayerMatchCount(
    players: QualifiedPlayer[]
  ): Record<string, number> {
    const map: Record<string, number> = {}
    players.forEach(player => {
      map[player.id] = 0
    })
    return map
  }

  /**
   * Validate bracket integrity for feed-in consolation
   */
  static validateFeedInBracket(bracket: FeedInBracketData): string[] {
    const errors: string[] = []

    // Check all sections exist
    const sections: BracketSection[] = ['main', 'consolation', 'feed_in', 'backdraw']
    sections.forEach(section => {
      if (!bracket.sections[section === 'feed_in' ? 'feedIn' : section]) {
        errors.push(`Missing section: ${section}`)
      }
    })

    // Verify main bracket has correct structure
    const mainSection = bracket.sections.main
    if (mainSection) {
      const expectedMainMatches = bracket.participantCount / 2
      if (mainSection.rounds[0]?.matches.length !== expectedMainMatches) {
        errors.push(`Main bracket R1 should have ${expectedMainMatches} matches`)
      }
    }

    // Verify player match counts initialized
    if (Object.keys(bracket.playerMatchCount).length !== bracket.participantCount) {
      errors.push('Player match count not initialized for all participants')
    }

    return errors
  }

  /**
   * Get bracket statistics
   */
  static getBracketStats(bracket: FeedInBracketData): {
    totalMatches: number
    matchesPerSection: Record<string, number>
    expectedMatchesPerPlayer: number
  } {
    const matchesPerSection: Record<string, number> = {}

    // Count matches in each section
    Object.entries(bracket.sections).forEach(([key, section]) => {
      const count = section.rounds.reduce(
        (sum, round) => sum + round.matches.length,
        0
      )
      matchesPerSection[key] = count
    })

    const totalMatches = Object.values(matchesPerSection).reduce((a, b) => a + b, 0)

    return {
      totalMatches,
      matchesPerSection,
      expectedMatchesPerPlayer: bracket.guaranteedMatches,
    }
  }
}
