import { supabase } from '@/lib/supabase'
import { 
  PlayoffMatch, 
  SubmitPlayoffMatchResult,
  validatePlayoffMatchSubmission 
} from '@/lib/validation/playoffs.validation'
import { TournamentService } from './tournamentService'

export interface PlayoffMatchSubmission {
  playoff_match_id: string
  match_date: string
  number_of_sets: number
  game_type: 'competitive' | 'practice'
  match_type: 'singles' | 'doubles'
  scores: any[] // Match the existing player_matches scores format
  submitted_by: string
  winner_id: string
}

export interface PlayoffMatchResult {
  success: boolean
  message: string
  player_match_id?: string
  playoff_match_id?: string
  tournament_advanced?: boolean
}

/**
 * Service to integrate playoff matches with the existing match system
 */
export class PlayoffMatchIntegrationService {
  private client = supabase
  private tournamentService = new TournamentService()

  /**
   * Submit a playoff match result and create corresponding player_match record
   */
  async submitPlayoffMatch(submission: PlayoffMatchSubmission): Promise<PlayoffMatchResult> {
    try {
      // Get playoff match details
      const playoffMatch = await this.getPlayoffMatch(submission.playoff_match_id)
      if (!playoffMatch) {
        return { success: false, message: 'Playoff match not found' }
      }

      // Validate submission
      const validationError = await this.validatePlayoffSubmission(playoffMatch, submission)
      if (validationError) {
        return { success: false, message: validationError }
      }

      // Create player_match record first
      const playerMatchResult = await this.createPlayerMatchRecord(submission, playoffMatch)
      if (!playerMatchResult.success) {
        return playerMatchResult
      }

      // Update playoff match with result
      const updateResult = await this.updatePlayoffMatchResult({
        playoff_match_id: submission.playoff_match_id,
        winner_id: submission.winner_id,
        player_match_id: playerMatchResult.player_match_id!
      })

      if (!updateResult.success) {
        // Rollback player_match if playoff update fails
        await this.rollbackPlayerMatch(playerMatchResult.player_match_id!)
        return updateResult
      }

      // Process tournament advancement
      const advancementResult = await this.tournamentService.processMatchCompletion(
        submission.playoff_match_id,
        submission.winner_id,
        playerMatchResult.player_match_id!
      )

      return {
        success: true,
        message: 'Playoff match submitted successfully',
        player_match_id: playerMatchResult.player_match_id,
        playoff_match_id: submission.playoff_match_id,
        tournament_advanced: advancementResult.advancedToNextRound
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to submit playoff match: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get playoff match details with league context
   */
  async getPlayoffMatchWithContext(playoffMatchId: string): Promise<{
    playoffMatch: PlayoffMatch
    leagueId: string
    tournamentId: string
    roundName: string
    opponent?: any
  } | null> {
    try {
      const { data, error } = await this.client
        .from('playoff_matches')
        .select(`
          *,
          playoff_round:playoff_rounds(
            round_name,
            playoff_tournament:playoff_tournaments(
              id,
              league_id
            )
          ),
          player1:players!playoff_matches_player1_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          ),
          player2:players!playoff_matches_player2_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          )
        `)
        .eq('id', playoffMatchId)
        .single()

      if (error) return null

      // Determine opponent based on current user
      const { data: { user } } = await this.client.auth.getUser()
      if (!user) return null

      const { data: currentPlayer } = await this.client
        .from('players')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      let opponent = null
      if (currentPlayer) {
        if (data.player1?.id === currentPlayer.id) {
          opponent = data.player2
        } else if (data.player2?.id === currentPlayer.id) {
          opponent = data.player1
        }
      }

      return {
        playoffMatch: data as PlayoffMatch,
        leagueId: data.playoff_round.playoff_tournament.league_id,
        tournamentId: data.playoff_round.playoff_tournament.id,
        roundName: data.playoff_round.round_name,
        opponent
      }

    } catch (error) {
      return null
    }
  }

  /**
   * Get all pending playoff matches for a user
   */
  async getUserPendingPlayoffMatches(userId: string): Promise<any[]> {
    try {
      const { data: player } = await this.client
        .from('players')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      if (!player) return []

      const { data, error } = await this.client
        .from('playoff_matches')
        .select(`
          *,
          playoff_round:playoff_rounds(
            round_name,
            playoff_tournament:playoff_tournaments(
              id,
              league_id,
              league:leagues(name)
            )
          ),
          player1:players!playoff_matches_player1_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          ),
          player2:players!playoff_matches_player2_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          )
        `)
        .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
        .eq('status', 'pending')
        .eq('is_bye', false)

      if (error) return []

      return data.map((match: any) => ({
        ...match,
        opponent: match.player1?.id === player.id ? match.player2 : match.player1,
        league_name: match.playoff_round.playoff_tournament.league.name
      }))

    } catch (error) {
      return []
    }
  }

  /**
   * Dispute a playoff match result
   */
  async disputePlayoffMatch(
    playoffMatchId: string, 
    reason: string, 
    disputingPlayerId: string
  ): Promise<PlayoffMatchResult> {
    try {
      // Get match details
      const playoffMatch = await this.getPlayoffMatch(playoffMatchId)
      if (!playoffMatch) {
        return { success: false, message: 'Playoff match not found' }
      }

      if (playoffMatch.status !== 'completed') {
        return { success: false, message: 'Can only dispute completed matches' }
      }

      if (playoffMatch.player1_id !== disputingPlayerId && playoffMatch.player2_id !== disputingPlayerId) {
        return { success: false, message: 'Only match participants can dispute results' }
      }

      // Create dispute record (you might want to add a disputes table)
      // For now, we'll mark the match as disputed by updating status
      // and adding a note to the player_match record

      if (playoffMatch.player_match_id) {
        const { error } = await this.client
          .from('player_matches')
          .update({
            is_verified: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', playoffMatch.player_match_id)

        if (error) {
          return { success: false, message: 'Failed to mark match as disputed' }
        }
      }

      return {
        success: true,
        message: 'Match dispute submitted successfully. Organizer will review.',
        playoff_match_id: playoffMatchId
      }

    } catch (error) {
      return {
        success: false,
        message: `Failed to dispute match: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get match history for playoff tournament
   */
  async getPlayoffMatchHistory(tournamentId: string): Promise<any[]> {
    try {
      const { data, error } = await this.client
        .from('playoff_matches')
        .select(`
          *,
          playoff_round:playoff_rounds!inner(
            round_name,
            round_number
          ),
          player1:players!playoff_matches_player1_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          ),
          player2:players!playoff_matches_player2_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          ),
          winner:players!playoff_matches_winner_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            country_code
          ),
          player_match:player_matches(
            match_date,
            scores,
            number_of_sets
          )
        `)
        .eq('playoff_round.playoff_tournament_id', tournamentId)
        .eq('status', 'completed')
        .order('playoff_round.round_number')
        .order('match_number')

      if (error) return []

      return data

    } catch (error) {
      return []
    }
  }

  // Private helper methods

  private async getPlayoffMatch(playoffMatchId: string): Promise<PlayoffMatch | null> {
    const { data, error } = await this.client
      .from('playoff_matches')
      .select('*')
      .eq('id', playoffMatchId)
      .single()

    if (error) return null
    return data as PlayoffMatch
  }

  private async validatePlayoffSubmission(
    playoffMatch: PlayoffMatch, 
    submission: PlayoffMatchSubmission
  ): Promise<string | null> {
    // Use existing validation
    const { data: { user } } = await this.client.auth.getUser()
    if (!user) return 'User not authenticated'

    const { data: player } = await this.client
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!player) return 'Player not found'

    const validationError = validatePlayoffMatchSubmission(playoffMatch, player.id)
    if (validationError) return validationError

    // Additional validations
    if (submission.winner_id !== playoffMatch.player1_id && submission.winner_id !== playoffMatch.player2_id) {
      return 'Winner must be one of the match participants'
    }

    if (!submission.scores || submission.scores.length === 0) {
      return 'Match scores are required'
    }

    return null
  }

  private async createPlayerMatchRecord(
    submission: PlayoffMatchSubmission, 
    playoffMatch: PlayoffMatch
  ): Promise<{ success: boolean; message: string; player_match_id?: string }> {
    try {
      // Get league context for the match
      const { data: tournamentData, error: tournamentError } = await this.client
        .from('playoff_rounds')
        .select('playoff_tournament:playoff_tournaments(league_id)')
        .eq('id', playoffMatch.playoff_round_id)
        .single()

      if (tournamentError) {
        return { success: false, message: 'Failed to get tournament context' }
      }

      // Create player_match record
      const { data: playerMatch, error: matchError } = await this.client
        .from('player_matches')
        .insert({
          player1_id: playoffMatch.player1_id,
          player2_id: playoffMatch.player2_id,
          winner_id: submission.winner_id,
          match_date: submission.match_date,
          number_of_sets: submission.number_of_sets,
          game_type: submission.game_type,
          match_type: submission.match_type,
          league_id: tournamentData.playoff_tournament.league_id,
          scores: submission.scores,
          is_verified: true, // Playoff matches are auto-verified
          submitted_by: submission.submitted_by
        })
        .select()
        .single()

      if (matchError) {
        return { success: false, message: `Failed to create match record: ${matchError.message}` }
      }

      return { 
        success: true, 
        message: 'Match record created successfully',
        player_match_id: playerMatch.id
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create match record: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  private async updatePlayoffMatchResult(data: SubmitPlayoffMatchResult): Promise<PlayoffMatchResult> {
    try {
      const { error } = await this.client
        .from('playoff_matches')
        .update({
          winner_id: data.winner_id,
          player_match_id: data.player_match_id,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.playoff_match_id)

      if (error) {
        return { success: false, message: `Failed to update playoff match: ${error.message}` }
      }

      return { success: true, message: 'Playoff match updated successfully' }

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to update playoff match: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  private async rollbackPlayerMatch(playerMatchId: string): Promise<void> {
    try {
      await this.client
        .from('player_matches')
        .delete()
        .eq('id', playerMatchId)
    } catch (error) {
      // Log error but don't throw - this is cleanup
      console.error('Failed to rollback player match:', error)
    }
  }

  /**
   * Get comprehensive match statistics for playoffs
   */
  async getPlayoffMatchStatistics(tournamentId: string): Promise<{
    totalMatches: number
    completedMatches: number
    pendingMatches: number
    byeMatches: number
    averageMatchDuration: number
    upsetCount: number
  }> {
    try {
      const { data: matches, error } = await this.client
        .from('playoff_matches')
        .select(`
          *,
          playoff_round:playoff_rounds!inner(
            playoff_tournament_id
          )
        `)
        .eq('playoff_round.playoff_tournament_id', tournamentId)

      if (error || !matches) {
        return {
          totalMatches: 0,
          completedMatches: 0,
          pendingMatches: 0,
          byeMatches: 0,
          averageMatchDuration: 0,
          upsetCount: 0
        }
      }

      const totalMatches = matches.length
      const completedMatches = matches.filter((m: { status: string }) => m.status === 'completed').length
      const pendingMatches = matches.filter((m: { status: string }) => m.status === 'pending').length
      const byeMatches = matches.filter((m: { is_bye: boolean | null }) => m.is_bye).length
      
      // Calculate upset count (would need seed data)
      const upsetCount = 0 // Placeholder

      return {
        totalMatches,
        completedMatches,
        pendingMatches,
        byeMatches,
        averageMatchDuration: 0, // Would need match duration data
        upsetCount
      }

    } catch (error) {
      return {
        totalMatches: 0,
        completedMatches: 0,
        pendingMatches: 0,
        byeMatches: 0,
        averageMatchDuration: 0,
        upsetCount: 0
      }
    }
  }
}