import { supabase } from '@/lib/supabase'
import {
  PlayoffTournament,
  PlayoffRound,
  PlayoffMatch,
  QualifiedPlayer,
  BracketData,
  BracketSection,
  FeedInBracketData,
  PlayoffTournamentStatusEnum,
  PlayoffRoundStatusEnum,
  PlayoffMatchStatusEnum
} from '@/lib/validation/playoffs.validation'
import { BracketService } from './bracketService'
import { FeedInBracketService, LoserRoutingResult } from './feedInBracketService'
import { Database } from '@/lib/database.types'

type PlayoffRoundStatus = 'not_started' | 'in_progress' | 'completed'
type PlayoffTournamentStatus = 'not_started' | 'in_progress' | 'completed'

export interface TournamentProgressionResult {
  success: boolean
  message: string
  nextRound?: PlayoffRound
  tournamentComplete?: boolean
  champion?: QualifiedPlayer
}

export interface MatchCompletionResult {
  success: boolean
  message: string
  advancedToNextRound?: boolean
  nextRoundMatch?: PlayoffMatch
  roundComplete?: boolean
  tournamentComplete?: boolean
  loserRouted?: boolean
  loserRoutedTo?: {
    section: BracketSection
    round: number
    matchNumber: number
  }
}

export interface TournamentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Tournament progression and management service
 */
export class TournamentService {
  private client = supabase

  /**
   * Process match completion and advance tournament
   */
  async processMatchCompletion(
    matchId: string,
    winnerId: string,
    playerMatchId: string
  ): Promise<MatchCompletionResult> {
    try {
      // Get match details with related data
      const match = await this.getMatchWithDetails(matchId)
      if (!match) {
        return { success: false, message: 'Match not found' }
      }

      // Validate match can be completed
      const validation = this.validateMatchCompletion(match, winnerId)
      if (!validation.isValid) {
        return { success: false, message: validation.errors[0] }
      }

      // Get tournament to check bracket type
      const tournament = await this.getTournamentWithFullData((match as any).playoff_round?.playoff_tournament_id)
      if (!tournament) {
        return { success: false, message: 'Tournament not found' }
      }

      // Check if this is a feed-in consolation bracket
      if (tournament.bracket_type === 'feed_in_consolation') {
        return this.processFeedInMatchCompletion(match, winnerId, playerMatchId, tournament)
      }

      // Standard bracket processing
      // Update match result
      await this.updateMatchResult(matchId, winnerId, playerMatchId)

      // Check if this completes the round
      const roundComplete = await this.checkRoundCompletion(match.playoff_round_id)

      // Advance winner to next round if needed
      let advancedToNextRound = false
      let nextRoundMatch: PlayoffMatch | undefined

      if (!match.is_bye) {
        const advancement = await this.advanceWinnerToNextRound(match, winnerId)
        advancedToNextRound = advancement.advanced
        nextRoundMatch = advancement.nextMatch
      }

      // Update round status if complete
      if (roundComplete) {
        await this.updateRoundStatus(match.playoff_round_id, 'completed')
      }

      // Check tournament completion
      const tournamentComplete = await this.checkTournamentCompletion((match as any).playoff_round?.playoff_tournament_id)

      if (tournamentComplete) {
        await this.updateTournamentStatus((match as any).playoff_round?.playoff_tournament_id, 'completed')
      }

      return {
        success: true,
        message: 'Match completed successfully',
        advancedToNextRound,
        nextRoundMatch,
        roundComplete,
        tournamentComplete
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to process match completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Process match completion for feed-in consolation brackets
   */
  private async processFeedInMatchCompletion(
    match: PlayoffMatch,
    winnerId: string,
    playerMatchId: string,
    tournament: any
  ): Promise<MatchCompletionResult> {
    try {
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id
      const bracketSection = (match as any).bracket_section as BracketSection || 'main'
      const roundNumber = (match as any).playoff_round?.round_number || 1

      // 1. Update match result
      await this.updateMatchResult(match.id, winnerId, playerMatchId)

      // 2. Increment match count for both players
      await this.incrementParticipantMatchCount(tournament.id, match.player1_id!)
      await this.incrementParticipantMatchCount(tournament.id, match.player2_id!)

      // 3. Advance winner within their section
      const advancement = await this.advanceWinnerInSection(
        match,
        winnerId,
        bracketSection,
        roundNumber,
        tournament
      )

      // 4. Route loser to appropriate section (if they need more matches)
      let loserRouted = false
      let loserRoutedTo: { section: BracketSection; round: number; matchNumber: number } | undefined

      if (loserId) {
        const routing = await this.routeLoserToNextSection(
          tournament,
          bracketSection,
          roundNumber,
          match.match_number,
          loserId
        )

        if (routing) {
          loserRouted = true
          loserRoutedTo = {
            section: routing.targetSection,
            round: routing.targetRound,
            matchNumber: routing.targetMatchNumber
          }
        }
      }

      // 5. Check if round is complete
      const roundComplete = await this.checkRoundCompletion(match.playoff_round_id)
      if (roundComplete) {
        await this.updateRoundStatus(match.playoff_round_id, 'completed')
      }

      // 6. Check if entire feed-in tournament is complete
      const tournamentComplete = await this.checkFeedInTournamentCompletion(tournament.id)
      if (tournamentComplete) {
        await this.updateTournamentStatus(tournament.id, 'completed')
      }

      return {
        success: true,
        message: 'Match completed successfully',
        advancedToNextRound: advancement.advanced,
        nextRoundMatch: advancement.nextMatch,
        roundComplete,
        tournamentComplete,
        loserRouted,
        loserRoutedTo
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to process feed-in match completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Route loser to next appropriate section in feed-in consolation
   */
  private async routeLoserToNextSection(
    tournament: any,
    sourceSection: BracketSection,
    sourceRound: number,
    sourceMatchNumber: number,
    loserId: string
  ): Promise<LoserRoutingResult | null> {
    // Get participant's current match count
    const participant = await this.getParticipant(tournament.id, loserId)
    if (!participant) return null

    // If player already has 3 matches, they're done
    if (participant.matches_played >= 3) {
      await this.updateParticipantSection(tournament.id, loserId, 'complete')
      return null
    }

    // Get bracket data for routing rules
    const bracketData = tournament.bracket_data as FeedInBracketData
    if (!bracketData || bracketData.bracketType !== 'feed_in_consolation') {
      return null
    }

    // Calculate routing
    const routing = FeedInBracketService.routeLoser(
      bracketData,
      sourceSection,
      sourceRound,
      sourceMatchNumber,
      loserId
    )

    if (!routing) {
      // Player is done (has 3 matches or no routing available)
      await this.updateParticipantSection(tournament.id, loserId, 'complete')
      return null
    }

    // Find or create the target match and assign player
    await this.assignPlayerToTargetMatch(
      tournament.id,
      routing.targetSection,
      routing.targetRound,
      routing.targetMatchNumber,
      routing.targetPosition,
      loserId
    )

    // Update participant's current section
    await this.updateParticipantSection(tournament.id, loserId, routing.targetSection)

    return routing
  }

  /**
   * Advance winner within their current bracket section
   */
  private async advanceWinnerInSection(
    match: PlayoffMatch,
    winnerId: string,
    bracketSection: BracketSection,
    roundNumber: number,
    tournament: any
  ): Promise<{ advanced: boolean; nextMatch?: PlayoffMatch }> {
    // Get round info to determine if there's a next round in this section
    const sectionRounds = tournament.rounds.filter(
      (r: any) => r.bracket_section === bracketSection
    )

    const currentRoundIndex = sectionRounds.findIndex(
      (r: any) => r.round_number === roundNumber && r.bracket_section === bracketSection
    )

    // Check if this is the final round in the section
    const isLastRoundInSection = currentRoundIndex === sectionRounds.length - 1

    if (isLastRoundInSection) {
      // For consolation winners, they need to go to feed-in section
      if (bracketSection === 'consolation') {
        // Route winner to feed-in section
        await this.routeConsolationWinnerToFeedIn(
          tournament.id,
          roundNumber,
          match.match_number,
          winnerId
        )
        return { advanced: true }
      }
      return { advanced: false }
    }

    // Calculate next round match position
    const nextMatchNumber = Math.ceil(match.match_number / 2)
    const nextPosition = match.match_number % 2 === 1 ? 'player1' : 'player2'

    // Find the next round
    const nextRound = sectionRounds[currentRoundIndex + 1]
    if (!nextRound) return { advanced: false }

    // Find the next match
    const { data: nextMatch } = await this.client
      .from('playoff_matches')
      .select('*')
      .eq('playoff_round_id', nextRound.id)
      .eq('match_number', nextMatchNumber)
      .eq('bracket_section', bracketSection)
      .single()

    if (!nextMatch) return { advanced: false }

    // Assign winner to next match
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    updateData[`${nextPosition}_id`] = winnerId

    await this.client
      .from('playoff_matches')
      .update(updateData)
      .eq('id', nextMatch.id)

    return { advanced: true, nextMatch: nextMatch as PlayoffMatch }
  }

  /**
   * Route consolation winner to feed-in section
   */
  private async routeConsolationWinnerToFeedIn(
    tournamentId: string,
    sourceRound: number,
    sourceMatchNumber: number,
    winnerId: string
  ): Promise<void> {
    // Find the corresponding feed-in match
    // Consolation R1 winners go to Feed-in R1, etc.
    const { data: feedInRound } = await this.client
      .from('playoff_rounds')
      .select('id')
      .eq('playoff_tournament_id', tournamentId)
      .eq('bracket_section', 'feed_in')
      .eq('round_number', sourceRound)
      .single()

    if (!feedInRound) return

    // Find the target match
    const targetMatchNumber = Math.ceil(sourceMatchNumber / 2)

    await this.client
      .from('playoff_matches')
      .update({
        player2_id: winnerId, // Consolation winners go to player2 slot
        updated_at: new Date().toISOString()
      })
      .eq('playoff_round_id', feedInRound.id)
      .eq('match_number', targetMatchNumber)

    // Update participant section
    await this.updateParticipantSection(tournamentId, winnerId, 'feed_in')
  }

  /**
   * Assign player to a specific match position
   */
  private async assignPlayerToTargetMatch(
    tournamentId: string,
    targetSection: BracketSection,
    targetRound: number,
    targetMatchNumber: number,
    targetPosition: 'player1' | 'player2',
    playerId: string
  ): Promise<void> {
    // Find the target round
    const { data: round } = await this.client
      .from('playoff_rounds')
      .select('id')
      .eq('playoff_tournament_id', tournamentId)
      .eq('bracket_section', targetSection)
      .eq('round_number', targetRound)
      .single()

    if (!round) return

    // Find or update the target match
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    updateData[`${targetPosition}_id`] = playerId

    await this.client
      .from('playoff_matches')
      .update(updateData)
      .eq('playoff_round_id', round.id)
      .eq('match_number', targetMatchNumber)
  }

  /**
   * Check if feed-in tournament is fully complete
   */
  private async checkFeedInTournamentCompletion(tournamentId: string): Promise<boolean> {
    // All sections must be complete for feed-in tournament to be complete
    const { data: rounds } = await this.client
      .from('playoff_rounds')
      .select('status, bracket_section')
      .eq('playoff_tournament_id', tournamentId)

    if (!rounds || rounds.length === 0) return false

    // Check that all rounds are completed
    return rounds.every((round: { status: string; bracket_section: string | null }) => round.status === 'completed')
  }

  /**
   * Increment participant's match count
   */
  private async incrementParticipantMatchCount(
    tournamentId: string,
    playerId: string
  ): Promise<void> {
    const { data: participant } = await this.client
      .from('playoff_participants')
      .select('matches_played')
      .eq('playoff_tournament_id', tournamentId)
      .eq('player_id', playerId)
      .single()

    if (!participant) return

    await this.client
      .from('playoff_participants')
      .update({
        matches_played: (participant.matches_played || 0) + 1
      })
      .eq('playoff_tournament_id', tournamentId)
      .eq('player_id', playerId)
  }

  /**
   * Get participant data
   */
  private async getParticipant(tournamentId: string, playerId: string): Promise<any> {
    const { data } = await this.client
      .from('playoff_participants')
      .select('*')
      .eq('playoff_tournament_id', tournamentId)
      .eq('player_id', playerId)
      .single()

    return data
  }

  /**
   * Update participant's current section
   */
  private async updateParticipantSection(
    tournamentId: string,
    playerId: string,
    section: BracketSection | 'complete'
  ): Promise<void> {
    await this.client
      .from('playoff_participants')
      .update({ current_section: section })
      .eq('playoff_tournament_id', tournamentId)
      .eq('player_id', playerId)
  }

  /**
   * Start next round of tournament
   */
  async startNextRound(tournamentId: string): Promise<TournamentProgressionResult> {
    try {
      // Get current tournament state
      const tournament = await this.getTournamentWithRounds(tournamentId)
      if (!tournament) {
        return { success: false, message: 'Tournament not found' }
      }

      // Find next round to start
      const nextRound = tournament.rounds.find((round: PlayoffRound) => round.status === 'not_started')
      if (!nextRound) {
        return { success: false, message: 'No pending rounds found' }
      }

      // Validate previous round is complete
      const previousRoundNumber = nextRound.round_number - 1
      if (previousRoundNumber > 0) {
        const previousRound = tournament.rounds.find((r: PlayoffRound) => r.round_number === previousRoundNumber)
        if (previousRound && previousRound.status !== 'completed') {
          return { success: false, message: 'Previous round is not complete' }
        }
      }

      // Update round status
      await this.updateRoundStatus(nextRound.id, 'in_progress')

      // Update tournament status if this is the first round
      if (nextRound.round_number === 1 && tournament.status === 'not_started') {
        await this.updateTournamentStatus(tournamentId, 'in_progress')
      }

      return {
        success: true,
        message: `${nextRound.round_name} started successfully`,
        nextRound
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to start next round: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Validate tournament integrity and rules
   */
  async validateTournament(tournamentId: string): Promise<TournamentValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const tournament = await this.getTournamentWithFullData(tournamentId)
      if (!tournament) {
        errors.push('Tournament not found')
        return { isValid: false, errors, warnings }
      }

      // Validate participant count
      if (tournament.participants.length < 2) {
        errors.push('Tournament must have at least 2 participants')
      }

      if (tournament.participants.length !== tournament.qualifying_players_count) {
        warnings.push(`Participant count (${tournament.participants.length}) does not match qualifying count (${tournament.qualifying_players_count})`)
      }

      // Validate bracket structure
      if (tournament.bracket_data) {
        const bracketErrors = BracketService.validateBracket(tournament.bracket_data)
        errors.push(...bracketErrors)
      }

      // Validate round structure
      const expectedRounds = tournament.total_rounds
      if (tournament.rounds.length !== expectedRounds) {
        errors.push(`Expected ${expectedRounds} rounds, found ${tournament.rounds.length}`)
      }

      // Validate round numbering
      for (let i = 1; i <= expectedRounds; i++) {
        const round = tournament.rounds.find((r: PlayoffRound) => r.round_number === i)
        if (!round) {
          errors.push(`Round ${i} is missing`)
        }
      }

      // Validate match structure per round
      tournament.rounds.forEach((round: PlayoffRound & { matches: PlayoffMatch[] }) => {
        const expectedMatches = Math.pow(2, expectedRounds - round.round_number)
        if (round.matches.length !== expectedMatches) {
          errors.push(`Round ${round.round_number}: expected ${expectedMatches} matches, found ${round.matches.length}`)
        }

        // Check for orphaned matches (no players)
        round.matches.forEach((match: PlayoffMatch, index: number) => {
          if (!match.is_bye && !match.player1_id && !match.player2_id) {
            warnings.push(`Round ${round.round_number}, Match ${index + 1}: no players assigned`)
          }
        })
      })

      // Validate tournament progression
      if (tournament.status === 'in_progress') {
        const hasActiveRound = tournament.rounds.some((r: PlayoffRound) => r.status === 'in_progress')
        if (!hasActiveRound) {
          warnings.push('Tournament is in progress but no round is active')
        }
      }

    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Handle player withdrawal from tournament
   */
  async handlePlayerWithdrawal(
    tournamentId: string, 
    playerId: string, 
    reason: string = 'Player withdrawal'
  ): Promise<TournamentProgressionResult> {
    try {
      // Get tournament data
      const tournament = await this.getTournamentWithFullData(tournamentId)
      if (!tournament) {
        return { success: false, message: 'Tournament not found' }
      }

      // Find player's current matches
      const activeMatches = this.findPlayerActiveMatches(tournament, playerId)
      
      // Process each active match
      for (const match of activeMatches) {
        const opponentId = match.player1_id === playerId ? match.player2_id : match.player1_id
        
        if (opponentId && match.status === 'pending') {
          // Opponent wins by forfeit
          await this.updateMatchResult(match.id, opponentId, null, 'forfeit')
          await this.advanceWinnerToNextRound(match, opponentId)
        }
      }

      // Check if this affects tournament progression
      const roundsAffected = this.getRoundsAffectedByWithdrawal(tournament, playerId)
      
      return {
        success: true,
        message: `Player withdrawal processed. ${roundsAffected.length} rounds affected.`
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to handle withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  /**
   * Reset tournament to a specific round
   */
  async resetTournamentToRound(
    tournamentId: string, 
    targetRound: number
  ): Promise<TournamentProgressionResult> {
    try {
      const tournament = await this.getTournamentWithRounds(tournamentId)
      if (!tournament) {
        return { success: false, message: 'Tournament not found' }
      }

      if (targetRound < 1 || targetRound > tournament.total_rounds) {
        return { success: false, message: 'Invalid target round' }
      }

      // Reset all rounds after target round
      for (const round of tournament.rounds) {
        if (round.round_number > targetRound) {
          await this.resetRound(round.id)
        } else if (round.round_number === targetRound) {
          await this.updateRoundStatus(round.id, 'in_progress')
        }
      }

      // Update tournament status
      await this.updateTournamentStatus(tournamentId, 'in_progress')

      return {
        success: true,
        message: `Tournament reset to round ${targetRound}`
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to reset tournament: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  // Private helper methods

  private async getMatchWithDetails(matchId: string): Promise<PlayoffMatch | null> {
    const { data, error } = await this.client
      .from('playoff_matches')
      .select(`
        *,
        playoff_round:playoff_rounds(
          *,
          playoff_tournament:playoff_tournaments(*)
        )
      `)
      .eq('id', matchId)
      .single()

    if (error) return null
    return data as PlayoffMatch
  }

  private validateMatchCompletion(match: PlayoffMatch, winnerId: string): TournamentValidationResult {
    const errors: string[] = []

    if (match.status !== 'pending') {
      errors.push('Match is not in pending status')
    }

    if (match.is_bye) {
      errors.push('Cannot complete a bye match')
    }

    if (match.player1_id !== winnerId && match.player2_id !== winnerId) {
      errors.push('Winner must be one of the match participants')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private async updateMatchResult(
    matchId: string, 
    winnerId: string, 
    playerMatchId: string | null, 
    resultType: string = 'normal'
  ): Promise<void> {
    const { error } = await this.client
      .from('playoff_matches')
      .update({
        winner_id: winnerId,
        player_match_id: playerMatchId,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)

    if (error) {
      throw new Error(`Failed to update match result: ${error.message}`)
    }
  }

  private async checkRoundCompletion(roundId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('playoff_matches')
      .select('status')
      .eq('playoff_round_id', roundId)

    if (error) return false

    return data.every((match: { status: string }) => match.status === 'completed' || match.status === 'bye')
  }

  private async advanceWinnerToNextRound(
    match: PlayoffMatch, 
    winnerId: string
  ): Promise<{ advanced: boolean; nextMatch?: PlayoffMatch }> {
    // Implementation would depend on the specific bracket structure
    // This is a simplified version
    return { advanced: false }
  }

  private async updateRoundStatus(roundId: string, status: PlayoffRoundStatus): Promise<void> {
    const { error } = await this.client
      .from('playoff_rounds')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', roundId)

    if (error) {
      throw new Error(`Failed to update round status: ${error.message}`)
    }
  }

  private async checkTournamentCompletion(tournamentId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('playoff_rounds')
      .select('status, round_number')
      .eq('playoff_tournament_id', tournamentId)
      .order('round_number', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return false

    return data[0].status === 'completed'
  }

  private async updateTournamentStatus(
    tournamentId: string, 
    status: PlayoffTournamentStatus
  ): Promise<void> {
    const { error } = await this.client
      .from('playoff_tournaments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)

    if (error) {
      throw new Error(`Failed to update tournament status: ${error.message}`)
    }
  }

  private async getTournamentWithRounds(tournamentId: string): Promise<any> {
    const { data, error } = await this.client
      .from('playoff_tournaments')
      .select(`
        *,
        rounds:playoff_rounds(*)
      `)
      .eq('id', tournamentId)
      .single()

    if (error) return null
    return data
  }

  private async getTournamentWithFullData(tournamentId: string): Promise<any> {
    const { data, error } = await this.client
      .from('playoff_tournaments')
      .select(`
        *,
        participants:playoff_participants(*),
        rounds:playoff_rounds(
          *,
          matches:playoff_matches(*)
        )
      `)
      .eq('id', tournamentId)
      .single()

    if (error) return null
    return data
  }

  private findPlayerActiveMatches(tournament: any, playerId: string): PlayoffMatch[] {
    const activeMatches: PlayoffMatch[] = []

    tournament.rounds.forEach((round: any) => {
      round.matches.forEach((match: PlayoffMatch) => {
        if (
          (match.player1_id === playerId || match.player2_id === playerId) &&
          match.status === 'pending'
        ) {
          activeMatches.push(match)
        }
      })
    })

    return activeMatches
  }

  private getRoundsAffectedByWithdrawal(tournament: any, playerId: string): any[] {
    return tournament.rounds.filter((round: any) =>
      round.matches.some((match: PlayoffMatch) =>
        match.player1_id === playerId || match.player2_id === playerId
      )
    )
  }

  private async resetRound(roundId: string): Promise<void> {
    // Reset all matches in the round
    const { error: matchError } = await this.client
      .from('playoff_matches')
      .update({
        winner_id: null,
        player_match_id: null,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('playoff_round_id', roundId)
      .neq('is_bye', true)

    if (matchError) {
      throw new Error(`Failed to reset round matches: ${matchError.message}`)
    }

    // Reset round status
    await this.updateRoundStatus(roundId, 'not_started')
  }
}