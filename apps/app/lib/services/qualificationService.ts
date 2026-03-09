import { supabase } from '@/lib/supabase'
import { QualifiedPlayer, StandaloneQualifiedPlayer, StandaloneQualificationResult } from '@/lib/validation/playoffs.validation'

export interface QualificationCriteria {
  leagueId: string
  qualifyingCount: number
  minMatchesPlayed?: number
  excludeInactivePlayers?: boolean
  tieBreakingRules?: TieBreakingRule[]
}

export interface TieBreakingRule {
  type: 'head_to_head' | 'win_percentage' | 'recent_form' | 'rating' | 'matches_played'
  weight: number
  ascending?: boolean
}

export interface LeagueStanding {
  player_id: string
  player_name: string
  first_name: string | null
  last_name: string | null
  rating: number | null
  nationality_code: string | null
  is_active: boolean
  points: number
  matches_played: number
  wins: number
  losses: number
  win_percentage: number
  head_to_head_record: Record<string, { wins: number; losses: number }>
  recent_form: number // Last 5 matches win percentage
  position: number
}

export interface QualificationResult {
  qualifiedPlayers: QualifiedPlayer[]
  standings: LeagueStanding[]
  tieBreakersApplied: string[]
  eliminatedPlayers: LeagueStanding[]
}

/**
 * Advanced qualification service with tie-breaking logic
 */
export class QualificationService {
  private client = supabase

  /**
   * Get qualified players for playoffs with advanced tie-breaking
   */
  async getQualifiedPlayers(criteria: QualificationCriteria): Promise<QualificationResult> {
    try {
      // Get all league standings
      const standings = await this.getLeagueStandings(criteria.leagueId)
      
      // Apply qualification filters
      const eligibleStandings = this.applyQualificationFilters(standings, criteria)
      
      // Apply tie-breaking rules
      const { sortedStandings, tieBreakersApplied } = await this.applyTieBreaking(
        eligibleStandings, 
        criteria.tieBreakingRules || this.getDefaultTieBreakingRules()
      )
      
      // Select top N qualified players
      const qualifiedStandings = sortedStandings.slice(0, criteria.qualifyingCount)
      const eliminatedStandings = sortedStandings.slice(criteria.qualifyingCount)
      
      // Convert to QualifiedPlayer format
      const qualifiedPlayers = qualifiedStandings.map((standing, index) => ({
        id: standing.player_id,
        firstName: standing.first_name,
        lastName: standing.last_name,
        seedPosition: standing.position,  // Use actual league position as seed
        leaguePosition: standing.position,
        leaguePoints: standing.points,
        rating: standing.rating,
        nationality_code: standing.nationality_code,
      }))
      
      // Sort by seed position to ensure correct order
      qualifiedPlayers.sort((a, b) => a.seedPosition - b.seedPosition)

      return {
        qualifiedPlayers,
        standings: sortedStandings,
        tieBreakersApplied,
        eliminatedPlayers: eliminatedStandings
      }

    } catch (error) {
      throw new Error(`Failed to get qualified players: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check qualification eligibility for playoffs
   */
  async checkPlayoffEligibility(leagueId: string): Promise<{
    eligible: boolean
    reason?: string
    playerCount: number
    minRequired: number
  }> {
    try {
      const { data: league, error: leagueError } = await this.client
        .from('leagues')
        .select('has_playoffs, end_date, start_date')
        .eq('id', leagueId)
        .single()

      if (leagueError) {
        return { 
          eligible: false, 
          reason: 'League not found', 
          playerCount: 0, 
          minRequired: 2 
        }
      }

      if (!league.has_playoffs) {
        return { 
          eligible: false, 
          reason: 'League does not have playoffs enabled', 
          playerCount: 0, 
          minRequired: 2 
        }
      }

      // Check if league has ended
      const now = new Date()
      const endDate = new Date(league.end_date)
      
      if (endDate > now) {
        return { 
          eligible: false, 
          reason: 'League has not ended yet', 
          playerCount: 0, 
          minRequired: 2 
        }
      }

      // Get player count
      const { data: players, error: playersError } = await this.client
        .from('league_players')
        .select('player_id')
        .eq('league_id', leagueId)

      if (playersError) {
        return { 
          eligible: false, 
          reason: 'Failed to get player count', 
          playerCount: 0, 
          minRequired: 2 
        }
      }

      const playerCount = players.length
      const minRequired = 2

      if (playerCount < minRequired) {
        return { 
          eligible: false, 
          reason: `Not enough players (${playerCount}/${minRequired})`, 
          playerCount, 
          minRequired 
        }
      }

      return { 
        eligible: true, 
        playerCount, 
        minRequired 
      }

    } catch (error) {
      return { 
        eligible: false, 
        reason: `Error checking eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        playerCount: 0, 
        minRequired: 2 
      }
    }
  }

  /**
   * Simulate playoff bracket with current standings
   */
  async simulatePlayoffBracket(
    leagueId: string,
    qualifyingCount: number
  ): Promise<{
    qualifiedPlayers: QualifiedPlayer[]
    bracketPreview: string[]
    potentialUpsets: string[]
  }> {
    const criteria: QualificationCriteria = {
      leagueId,
      qualifyingCount
    }

    const result = await this.getQualifiedPlayers(criteria)
    const { qualifiedPlayers } = result

    // Generate bracket preview
    const bracketPreview = this.generateBracketPreview(qualifiedPlayers)

    // Identify potential upsets (high seed vs low seed in first round)
    const potentialUpsets = this.identifyPotentialUpsets(qualifiedPlayers)

    return {
      qualifiedPlayers,
      bracketPreview,
      potentialUpsets
    }
  }

  /**
   * Get qualified players for standalone tournament seeded by W-L record from the last 12 months
   * @param participantIds - Array of player IDs participating in the tournament
   */
  async getQualifiedPlayersForStandaloneTournament(
    participantIds: string[]
  ): Promise<StandaloneQualificationResult> {
    try {
      // Calculate rolling 12-month window from today
      const today = new Date()
      const endDate = today.toISOString().split('T')[0] // e.g., "2026-02-04"
      const startDate = new Date(today)
      startDate.setFullYear(startDate.getFullYear() - 1)
      const start12MonthsAgo = startDate.toISOString().split('T')[0] // e.g., "2025-02-04"

      // Fetch all matches from the last 12 months (practice and competitive)
      const { data: matches, error: matchesError } = await this.client
        .from('player_matches')
        .select('player1_id, player2_id, winner_id')
        .gte('match_date', start12MonthsAgo)
        .lte('match_date', endDate)
        .not('winner_id', 'is', null)

      if (matchesError) {
        throw new Error(`Failed to fetch matches: ${matchesError.message}`)
      }

      // Fetch player details for all participants
      const { data: players, error: playersError } = await this.client
        .from('players')
        .select('id, first_name, last_name, rating, nationality_code')
        .in('id', participantIds)

      if (playersError) {
        throw new Error(`Failed to fetch players: ${playersError.message}`)
      }

      // Calculate W-L record for each participant
      const playerStats: Map<string, { wins: number; losses: number }> = new Map()

      // Initialize stats for all participants
      for (const id of participantIds) {
        playerStats.set(id, { wins: 0, losses: 0 })
      }

      // Calculate stats from matches
      for (const match of (matches || [])) {
        const player1Id = match.player1_id as string
        const player2Id = match.player2_id as string
        const winnerId = match.winner_id as string

        // Only count matches where participant was involved
        if (playerStats.has(player1Id)) {
          if (winnerId === player1Id) {
            playerStats.get(player1Id)!.wins++
          } else {
            playerStats.get(player1Id)!.losses++
          }
        }

        if (playerStats.has(player2Id)) {
          if (winnerId === player2Id) {
            playerStats.get(player2Id)!.wins++
          } else {
            playerStats.get(player2Id)!.losses++
          }
        }
      }

      // Create player lookup map with proper typing
      type PlayerRecord = {
        id: string
        first_name: string | null
        last_name: string | null
        rating: number | null
        nationality_code: string | null
      }
      const playerMap = new Map<string, PlayerRecord>(
        (players || []).map((p: PlayerRecord) => [p.id, p])
      )

      // Build qualified players with stats
      const qualifiedPlayers: StandaloneQualifiedPlayer[] = participantIds.map(id => {
        const stats = playerStats.get(id) || { wins: 0, losses: 0 }
        const player = playerMap.get(id)
        const totalMatches = stats.wins + stats.losses
        const winPercentage = totalMatches > 0
          ? Math.round((stats.wins / totalMatches) * 100)
          : 0

        return {
          id,
          firstName: player?.first_name || null,
          lastName: player?.last_name || null,
          seedPosition: 0, // Will be assigned after sorting
          wins: stats.wins,
          losses: stats.losses,
          winPercentage,
          rating: player?.rating || null,
          nationality_code: player?.nationality_code || null,
        }
      })

      // Sort by seeding criteria:
      // 1. Win percentage (descending)
      // 2. Total matches played (descending) - more experience
      // 3. Rating (descending)
      qualifiedPlayers.sort((a, b) => {
        // Primary: Win percentage
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage
        }

        // Secondary: Total matches played (more = higher seed)
        const aTotalMatches = a.wins + a.losses
        const bTotalMatches = b.wins + b.losses
        if (bTotalMatches !== aTotalMatches) {
          return bTotalMatches - aTotalMatches
        }

        // Tertiary: Rating
        return (b.rating || 0) - (a.rating || 0)
      })

      // Assign seed positions after sorting
      qualifiedPlayers.forEach((player, index) => {
        player.seedPosition = index + 1
      })

      // Determine which seeding criteria were actually applied
      const seedingCriteriaApplied: string[] = ['Win percentage in last 12 months (primary)']

      // Check if any ties required secondary criteria
      const hasTies = qualifiedPlayers.some((player, index) => {
        if (index === 0) return false
        const prev = qualifiedPlayers[index - 1]
        return prev.winPercentage === player.winPercentage
      })

      if (hasTies) {
        seedingCriteriaApplied.push('Total matches played (tie-breaker)')
        seedingCriteriaApplied.push('Player rating (tie-breaker)')
      }

      return {
        qualifiedPlayers,
        seedingCriteriaApplied,
      }

    } catch (error) {
      throw new Error(`Failed to get qualified players for standalone tournament: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Private helper methods

  private async getLeagueStandings(leagueId: string): Promise<LeagueStanding[]> {
    const { data, error } = await this.client
      .from('league_players')
      .select(`
        player_id,
        points,
        matches_played,
        wins,
        losses,
        player:players(
          first_name,
          last_name,
          rating,
          nationality_code,
          is_active
        )
      `)
      .eq('league_id', leagueId)
      .order('points', { ascending: false })
      .order('wins', { ascending: false })
      .order('losses', { ascending: true })

    if (error) {
      throw new Error(`Failed to get league standings: ${error.message}`)
    }

    // Filter out inactive/deleted players
    const activeData = data.filter(item => item.player?.is_active !== false)

    // Calculate additional metrics
    const standings: LeagueStanding[] = activeData.map((item, index) => {
      const winPercentage = item.matches_played > 0 ? (item.wins / item.matches_played) * 100 : 0
      
      // Format name like "Roberto I." (full first name + last initial)
      const firstName = item.player.first_name || ''
      const lastName = item.player.last_name || ''
      const playerName = firstName && lastName 
        ? `${firstName} ${lastName.charAt(0)}.`
        : `${firstName} ${lastName}`.trim()
      
      return {
        player_id: item.player_id,
        player_name: playerName,
        first_name: item.player.first_name,
        last_name: item.player.last_name,
        rating: item.player.rating,
        nationality_code: item.player.nationality_code,
        is_active: item.player?.is_active !== false,
        points: item.points || 0,
        matches_played: item.matches_played || 0,
        wins: item.wins || 0,
        losses: item.losses || 0,
        win_percentage: winPercentage,
        head_to_head_record: {},
        recent_form: 0,
        position: index + 1
      }
    })

    // Calculate head-to-head records
    await this.calculateHeadToHeadRecords(standings, leagueId)
    
    // Calculate recent form
    await this.calculateRecentForm(standings, leagueId)

    return standings
  }

  private applyQualificationFilters(
    standings: LeagueStanding[], 
    criteria: QualificationCriteria
  ): LeagueStanding[] {
    let filtered = standings

    // Filter by minimum matches played
    if (criteria.minMatchesPlayed) {
      filtered = filtered.filter(s => s.matches_played >= criteria.minMatchesPlayed!)
    }

    // Filter out inactive players
    if (criteria.excludeInactivePlayers) {
      filtered = filtered.filter(s => s.is_active)
    }

    return filtered
  }

  private async applyTieBreaking(
    standings: LeagueStanding[], 
    rules: TieBreakingRule[]
  ): Promise<{ sortedStandings: LeagueStanding[]; tieBreakersApplied: string[] }> {
    const tieBreakersApplied: string[] = []
    
    // Group players by points
    const pointGroups = this.groupByPoints(standings)
    const sortedStandings: LeagueStanding[] = []

    for (const [points, playersWithSamePoints] of pointGroups) {
      if (playersWithSamePoints.length === 1) {
        // No tie to break
        sortedStandings.push(...playersWithSamePoints)
      } else {
        // Apply tie-breaking rules
        const sortedGroup = this.sortByTieBreakingRules(playersWithSamePoints, rules)
        tieBreakersApplied.push(`Points tie (${points}): Applied ${rules.map(r => r.type).join(', ')}`)
        sortedStandings.push(...sortedGroup)
      }
    }

    return { sortedStandings, tieBreakersApplied }
  }

  private groupByPoints(standings: LeagueStanding[]): Map<number, LeagueStanding[]> {
    const groups = new Map<number, LeagueStanding[]>()
    
    standings.forEach(standing => {
      const points = standing.points
      if (!groups.has(points)) {
        groups.set(points, [])
      }
      groups.get(points)!.push(standing)
    })

    // Sort by points descending
    return new Map([...groups.entries()].sort((a, b) => b[0] - a[0]))
  }

  private sortByTieBreakingRules(
    players: LeagueStanding[], 
    rules: TieBreakingRule[]
  ): LeagueStanding[] {
    return players.sort((a, b) => {
      for (const rule of rules) {
        const comparison = this.compareByRule(a, b, rule)
        if (comparison !== 0) {
          return comparison
        }
      }
      return 0 // If all tie-breakers are equal
    })
  }

  private compareByRule(a: LeagueStanding, b: LeagueStanding, rule: TieBreakingRule): number {
    let comparison = 0

    switch (rule.type) {
      case 'head_to_head':
        comparison = this.compareHeadToHead(a, b)
        break
      case 'win_percentage':
        comparison = b.win_percentage - a.win_percentage
        break
      case 'recent_form':
        comparison = b.recent_form - a.recent_form
        break
      case 'rating':
        comparison = (b.rating || 0) - (a.rating || 0)
        break
      case 'matches_played':
        comparison = rule.ascending ? 
          a.matches_played - b.matches_played : 
          b.matches_played - a.matches_played
        break
    }

    return comparison * rule.weight
  }

  private compareHeadToHead(a: LeagueStanding, b: LeagueStanding): number {
    const aRecord = a.head_to_head_record[b.player_id]
    const bRecord = b.head_to_head_record[a.player_id]

    if (!aRecord || !bRecord) return 0

    const aWinRate = aRecord.wins / (aRecord.wins + aRecord.losses)
    const bWinRate = bRecord.wins / (bRecord.wins + bRecord.losses)

    return bWinRate - aWinRate
  }

  private async calculateHeadToHeadRecords(
    standings: LeagueStanding[], 
    leagueId: string
  ): Promise<void> {
    const { data: matches, error } = await this.client
      .from('player_matches')
      .select('player1_id, player2_id, winner_id')
      .eq('league_id', leagueId)
      .not('winner_id', 'is', null)

    if (error || !matches) return

    // Initialize records
    standings.forEach(standing => {
      standing.head_to_head_record = {}
    })

    // Calculate head-to-head records
    matches.forEach(match => {
      const player1Standing = standings.find(s => s.player_id === match.player1_id)
      const player2Standing = standings.find(s => s.player_id === match.player2_id)

      if (player1Standing && player2Standing) {
        // Initialize records if they don't exist
        if (!player1Standing.head_to_head_record[match.player2_id]) {
          player1Standing.head_to_head_record[match.player2_id] = { wins: 0, losses: 0 }
        }
        if (!player2Standing.head_to_head_record[match.player1_id]) {
          player2Standing.head_to_head_record[match.player1_id] = { wins: 0, losses: 0 }
        }

        // Update records
        if (match.winner_id === match.player1_id) {
          player1Standing.head_to_head_record[match.player2_id].wins++
          player2Standing.head_to_head_record[match.player1_id].losses++
        } else if (match.winner_id === match.player2_id) {
          player2Standing.head_to_head_record[match.player1_id].wins++
          player1Standing.head_to_head_record[match.player2_id].losses++
        }
      }
    })
  }

  private async calculateRecentForm(
    standings: LeagueStanding[], 
    leagueId: string
  ): Promise<void> {
    const RECENT_MATCHES_COUNT = 5

    for (const standing of standings) {
      const { data: recentMatches, error } = await this.client
        .from('player_matches')
        .select('winner_id, player1_id, player2_id')
        .eq('league_id', leagueId)
        .or(`player1_id.eq.${standing.player_id},player2_id.eq.${standing.player_id}`)
        .not('winner_id', 'is', null)
        .order('match_date', { ascending: false })
        .limit(RECENT_MATCHES_COUNT)

      if (error || !recentMatches) {
        standing.recent_form = 0
        continue
      }

      const recentWins = recentMatches.filter(match => match.winner_id === standing.player_id).length
      standing.recent_form = recentMatches.length > 0 ? 
        (recentWins / recentMatches.length) * 100 : 0
    }
  }

  private getDefaultTieBreakingRules(): TieBreakingRule[] {
    return [
      { type: 'head_to_head', weight: 1.0 },
      { type: 'win_percentage', weight: 0.8 },
      { type: 'recent_form', weight: 0.6 },
      { type: 'rating', weight: 0.4 },
      { type: 'matches_played', weight: 0.2, ascending: false }
    ]
  }

  private generateBracketPreview(players: QualifiedPlayer[]): string[] {
    const preview: string[] = []
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(players.length)))
    const matchCount = bracketSize / 2

    preview.push('First Round Matchups:')

    for (let i = 0; i < matchCount; i++) {
      const player1Index = i
      const player2Index = players.length - 1 - i

      const player1 = player1Index < players.length ? players[player1Index] : null
      const player2 = player2Index >= 0 && player2Index < players.length && player2Index !== player1Index 
        ? players[player2Index] 
        : null

      if (player1 && player2) {
        preview.push(`  ${player1.seedPosition}. ${player1.firstName} ${player1.lastName} vs ${player2.seedPosition}. ${player2.firstName} ${player2.lastName}`)
      } else if (player1) {
        preview.push(`  ${player1.seedPosition}. ${player1.firstName} ${player1.lastName} (BYE)`)
      }
    }

    return preview
  }

  private identifyPotentialUpsets(players: QualifiedPlayer[]): string[] {
    const upsets: string[] = []
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(players.length)))
    const matchCount = bracketSize / 2

    for (let i = 0; i < matchCount; i++) {
      const player1Index = i
      const player2Index = players.length - 1 - i

      const player1 = player1Index < players.length ? players[player1Index] : null
      const player2 = player2Index >= 0 && player2Index < players.length && player2Index !== player1Index 
        ? players[player2Index] 
        : null

      if (player1 && player2) {
        const seedDifference = Math.abs(player1.seedPosition - player2.seedPosition)
        if (seedDifference >= 8) {
          upsets.push(`High upset potential: ${player1.seedPosition} vs ${player2.seedPosition}`)
        }
      }
    }

    return upsets
  }
}