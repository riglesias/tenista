import { supabase } from '@/lib/supabase'
import { 
  PlayoffTournament, 
  PlayoffMatch, 
  QualifiedPlayer,
  BracketData 
} from '@/lib/validation/playoffs.validation'
import { TournamentService } from './tournamentService'
import { BracketService } from './bracketService'

export interface WithdrawalRequest {
  tournament_id: string
  player_id: string
  reason: string
  withdrawal_date: string
}

export interface DisputeResolution {
  match_id: string
  resolution: 'rematch' | 'forfeit_player1' | 'forfeit_player2' | 'no_contest'
  resolved_by: string
  resolution_notes: string
}

export interface TieScenario {
  players: QualifiedPlayer[]
  tie_type: 'qualification' | 'seeding' | 'advancement'
  tie_breaking_method: string
}

export interface EdgeCaseResult {
  success: boolean
  message: string
  affected_matches?: string[]
  bracket_regenerated?: boolean
  tournament_status_changed?: boolean
}

/**
 * Service to handle edge cases in playoff tournaments
 */
export class PlayoffEdgeCaseService {
  private client = supabase
  private tournamentService = new TournamentService()

  /**
   * Handle player withdrawal from tournament
   */
  async handlePlayerWithdrawal(request: WithdrawalRequest): Promise<EdgeCaseResult> {
    try {
      // Validate withdrawal request
      const validation = await this.validateWithdrawal(request)
      if (!validation.isValid) {
        return { success: false, message: validation.reason }
      }

      // Get tournament state
      const tournament = await this.getTournamentWithMatches(request.tournament_id)
      if (!tournament) {
        return { success: false, message: 'Tournament not found' }
      }

      // Find all matches involving the withdrawing player
      const playerMatches = this.findPlayerMatches(tournament, request.player_id)
      const affectedMatches: string[] = []

      // Process withdrawal based on tournament phase
      if (tournament.status === 'not_started') {
        // Before tournament starts - remove player and regenerate bracket
        const result = await this.handlePreTournamentWithdrawal(request, tournament)
        return result
      } else {
        // During tournament - forfeit matches and advance opponents
        const result = await this.handleMidTournamentWithdrawal(request, playerMatches)
        return result
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to handle withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Resolve match dispute
   */
  async resolveMatchDispute(resolution: DisputeResolution): Promise<EdgeCaseResult> {
    try {
      // Get match details
      const match = await this.getMatchWithContext(resolution.match_id)
      if (!match) {
        return { success: false, message: 'Match not found' }
      }

      switch (resolution.resolution) {
        case 'rematch':
          return await this.handleRematch(match, resolution)
        case 'forfeit_player1':
          return await this.handleForfeit(match, match.player2_id!, resolution)
        case 'forfeit_player2':
          return await this.handleForfeit(match, match.player1_id!, resolution)
        case 'no_contest':
          return await this.handleNoContest(match, resolution)
        default:
          return { success: false, message: 'Invalid resolution type' }
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to resolve dispute: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Handle qualification ties
   */
  async resolveQualificationTie(scenario: TieScenario): Promise<EdgeCaseResult> {
    try {
      switch (scenario.tie_breaking_method) {
        case 'head_to_head':
          return await this.resolveByHeadToHead(scenario)
        case 'mini_tournament':
          return await this.createMiniTournament(scenario)
        case 'coin_flip':
          return await this.resolveByCoinFlip(scenario)
        case 'rating':
          return await this.resolveByRating(scenario)
        default:
          return { success: false, message: 'Invalid tie-breaking method' }
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to resolve tie: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Handle emergency tournament suspension
   */
  async suspendTournament(
    tournamentId: string, 
    reason: string, 
    suspendedBy: string
  ): Promise<EdgeCaseResult> {
    try {
      // Update tournament status
      const { error } = await this.client
        .from('playoff_tournaments')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId)

      if (error) {
        return { success: false, message: 'Failed to suspend tournament' }
      }

      // Log suspension reason
      await this.logTournamentEvent(tournamentId, 'suspension', {
        reason,
        suspended_by: suspendedBy,
        suspended_at: new Date().toISOString()
      })

      return {
        success: true,
        message: 'Tournament suspended successfully',
        tournament_status_changed: true
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to suspend tournament: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Resume suspended tournament
   */
  async resumeTournament(
    tournamentId: string, 
    resumedBy: string
  ): Promise<EdgeCaseResult> {
    try {
      // Validate tournament can be resumed
      const validation = await this.validateTournamentResumption(tournamentId)
      if (!validation.canResume) {
        return { success: false, message: validation.reason }
      }

      // Update tournament status
      const { error } = await this.client
        .from('playoff_tournaments')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId)

      if (error) {
        return { success: false, message: 'Failed to resume tournament' }
      }

      // Log resumption
      await this.logTournamentEvent(tournamentId, 'resumption', {
        resumed_by: resumedBy,
        resumed_at: new Date().toISOString()
      })

      return {
        success: true,
        message: 'Tournament resumed successfully',
        tournament_status_changed: true
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to resume tournament: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Handle bracket corruption recovery
   */
  async recoverCorruptedBracket(tournamentId: string): Promise<EdgeCaseResult> {
    try {
      // Get tournament and participants
      const tournament = await this.getTournamentWithParticipants(tournamentId)
      if (!tournament) {
        return { success: false, message: 'Tournament not found' }
      }

      // Regenerate bracket from current state
      const participants = tournament.participants.map((p: any) => ({
        id: p.player_id,
        firstName: p.player.first_name,
        lastName: p.player.last_name,
        seedPosition: p.seed_position,
        leaguePosition: p.league_position,
        leaguePoints: p.league_points,
        rating: p.player.rating
      }))

      const newBracket = BracketService.generateBracket({ players: participants })

      // Update tournament with new bracket
      const { error } = await this.client
        .from('playoff_tournaments')
        .update({
          bracket_data: newBracket,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId)

      if (error) {
        return { success: false, message: 'Failed to recover bracket' }
      }

      // Log recovery
      await this.logTournamentEvent(tournamentId, 'bracket_recovery', {
        recovered_at: new Date().toISOString(),
        participant_count: participants.length
      })

      return {
        success: true,
        message: 'Bracket recovered successfully',
        bracket_regenerated: true
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to recover bracket: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Private helper methods

  private async validateWithdrawal(request: WithdrawalRequest): Promise<{ isValid: boolean; reason: string }> {
    // Check if player is in tournament
    const { data: participant, error } = await this.client
      .from('playoff_participants')
      .select('*')
      .eq('playoff_tournament_id', request.tournament_id)
      .eq('player_id', request.player_id)
      .single()

    if (error || !participant) {
      return { isValid: false, reason: 'Player not found in tournament' }
    }

    return { isValid: true, reason: '' }
  }

  private async handlePreTournamentWithdrawal(
    request: WithdrawalRequest, 
    tournament: any
  ): Promise<EdgeCaseResult> {
    // Remove participant
    const { error: removeError } = await this.client
      .from('playoff_participants')
      .delete()
      .eq('playoff_tournament_id', request.tournament_id)
      .eq('player_id', request.player_id)

    if (removeError) {
      return { success: false, message: 'Failed to remove participant' }
    }

    // Get remaining participants
    const { data: remainingParticipants } = await this.client
      .from('playoff_participants')
      .select(`
        *,
        player:players(first_name, last_name, rating)
      `)
      .eq('playoff_tournament_id', request.tournament_id)
      .order('seed_position')

    if (!remainingParticipants || remainingParticipants.length < 2) {
      // Cancel tournament if too few players
      await this.client
        .from('playoff_tournaments')
        .update({ status: 'cancelled' })
        .eq('id', request.tournament_id)

      return {
        success: true,
        message: 'Tournament cancelled due to insufficient participants',
        tournament_status_changed: true
      }
    }

    // Regenerate bracket with remaining players
    const players = remainingParticipants.map((p: any, index: number) => ({
      id: p.player_id,
      firstName: p.player.first_name,
      lastName: p.player.last_name,
      seedPosition: index + 1,
      leaguePosition: p.league_position,
      leaguePoints: p.league_points,
      rating: p.player.rating
    }))

    const newBracket = BracketService.generateBracket({ players })

    // Update tournament
    await this.client
      .from('playoff_tournaments')
      .update({
        qualifying_players_count: remainingParticipants.length,
        bracket_data: newBracket
      })
      .eq('id', request.tournament_id)

    return {
      success: true,
      message: 'Player withdrawn and bracket regenerated',
      bracket_regenerated: true
    }
  }

  private async handleMidTournamentWithdrawal(
    request: WithdrawalRequest, 
    playerMatches: PlayoffMatch[]
  ): Promise<EdgeCaseResult> {
    const affectedMatches: string[] = []

    for (const match of playerMatches) {
      if (match.status === 'pending') {
        const opponentId = match.player1_id === request.player_id ? 
          match.player2_id : match.player1_id

        if (opponentId) {
          // Forfeit match to opponent
          await this.client
            .from('playoff_matches')
            .update({
              winner_id: opponentId,
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', match.id)

          affectedMatches.push(match.id)
        }
      }
    }

    return {
      success: true,
      message: `Player withdrawn. ${affectedMatches.length} matches forfeited.`,
      affected_matches: affectedMatches
    }
  }

  private async handleRematch(match: PlayoffMatch, resolution: DisputeResolution): Promise<EdgeCaseResult> {
    // Reset match to pending status
    const { error } = await this.client
      .from('playoff_matches')
      .update({
        winner_id: null,
        player_match_id: null,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', resolution.match_id)

    if (error) {
      return { success: false, message: 'Failed to reset match for rematch' }
    }

    return {
      success: true,
      message: 'Match reset for rematch',
      affected_matches: [resolution.match_id]
    }
  }

  private async handleForfeit(
    match: PlayoffMatch, 
    winnerId: string, 
    resolution: DisputeResolution
  ): Promise<EdgeCaseResult> {
    // Update match with forfeit result
    const { error } = await this.client
      .from('playoff_matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', resolution.match_id)

    if (error) {
      return { success: false, message: 'Failed to process forfeit' }
    }

    return {
      success: true,
      message: 'Forfeit processed successfully',
      affected_matches: [resolution.match_id]
    }
  }

  private async handleNoContest(match: PlayoffMatch, resolution: DisputeResolution): Promise<EdgeCaseResult> {
    // Mark match as no contest - both players advance or neither advance
    // This would require special handling in the bracket logic
    return {
      success: true,
      message: 'No contest resolution not yet implemented',
      affected_matches: [resolution.match_id]
    }
  }

  private async resolveByHeadToHead(scenario: TieScenario): Promise<EdgeCaseResult> {
    // Implement head-to-head tie breaking logic
    return {
      success: true,
      message: 'Head-to-head tie resolution not yet implemented'
    }
  }

  private async createMiniTournament(scenario: TieScenario): Promise<EdgeCaseResult> {
    // Create a mini-tournament for tied players
    return {
      success: true,
      message: 'Mini-tournament creation not yet implemented'
    }
  }

  private async resolveByCoinFlip(scenario: TieScenario): Promise<EdgeCaseResult> {
    // Random resolution for ties
    const randomIndex = Math.floor(Math.random() * scenario.players.length)
    const winner = scenario.players[randomIndex]

    return {
      success: true,
      message: `Tie resolved by coin flip. Winner: ${winner.firstName} ${winner.lastName}`
    }
  }

  private async resolveByRating(scenario: TieScenario): Promise<EdgeCaseResult> {
    // Resolve tie by player rating
    const sortedByRating = scenario.players.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const winner = sortedByRating[0]

    return {
      success: true,
      message: `Tie resolved by rating. Winner: ${winner.firstName} ${winner.lastName}`
    }
  }

  private async validateTournamentResumption(tournamentId: string): Promise<{ canResume: boolean; reason: string }> {
    const { data: tournament, error } = await this.client
      .from('playoff_tournaments')
      .select('status')
      .eq('id', tournamentId)
      .single()

    if (error || !tournament) {
      return { canResume: false, reason: 'Tournament not found' }
    }

    if (tournament.status !== 'suspended') {
      return { canResume: false, reason: 'Tournament is not suspended' }
    }

    return { canResume: true, reason: '' }
  }

  private async getTournamentWithMatches(tournamentId: string): Promise<any> {
    const { data, error } = await this.client
      .from('playoff_tournaments')
      .select(`
        *,
        rounds:playoff_rounds(
          *,
          matches:playoff_matches(*)
        )
      `)
      .eq('id', tournamentId)
      .single()

    return error ? null : data
  }

  private async getTournamentWithParticipants(tournamentId: string): Promise<any> {
    const { data, error } = await this.client
      .from('playoff_tournaments')
      .select(`
        *,
        participants:playoff_participants(
          *,
          player:players(first_name, last_name, rating)
        )
      `)
      .eq('id', tournamentId)
      .single()

    return error ? null : data
  }

  private async getMatchWithContext(matchId: string): Promise<PlayoffMatch | null> {
    const { data, error } = await this.client
      .from('playoff_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    return error ? null : data as PlayoffMatch
  }

  private findPlayerMatches(tournament: any, playerId: string): PlayoffMatch[] {
    const matches: PlayoffMatch[] = []

    tournament.rounds?.forEach((round: any) => {
      round.matches?.forEach((match: PlayoffMatch) => {
        if (match.player1_id === playerId || match.player2_id === playerId) {
          matches.push(match)
        }
      })
    })

    return matches
  }

  private async logTournamentEvent(
    tournamentId: string, 
    eventType: string, 
    eventData: any
  ): Promise<void> {
    // This could be implemented with a tournament_events table
    // For now, we'll just log to console
    console.log(`Tournament ${tournamentId} - ${eventType}:`, eventData)
  }
}