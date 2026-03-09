"use server"

import { createServerSupabaseClient, getServerAdmin } from "@/lib/supabase/server"
import { LadderRanking, LadderChallenge, LadderPositionHistory, ChallengeStatus } from "@/types/database.types"

export interface LadderRankingWithPlayer extends LadderRanking {
  player: {
    id: string
    first_name: string
    last_name: string
    rating: number
    avatar_url?: string
    nationality_code?: string
  } | null
}

export interface LadderChallengeWithPlayers extends LadderChallenge {
  challenger_player: {
    id: string
    first_name: string
    last_name: string
    rating: number
    avatar_url?: string
  } | null
  challenged_player: {
    id: string
    first_name: string
    last_name: string
    rating: number
    avatar_url?: string
  } | null
}

export interface ActionResult<T> {
  data: T | null
  error: string | null
}

/**
 * Get ladder rankings for a league with player details
 */
export async function getLadderRankings(leagueId: string): Promise<ActionResult<LadderRankingWithPlayer[]>> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('ladder_rankings')
      .select(`
        *,
        player:players!player_id(
          id,
          first_name,
          last_name,
          rating,
          avatar_url,
          nationality_code
        )
      `)
      .eq('league_id', leagueId)
      .order('position', { ascending: true })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching ladder rankings:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch rankings' }
  }
}

/**
 * Get ladder challenges for a league with player details
 */
export async function getLadderChallenges(
  leagueId: string,
  statusFilter?: ChallengeStatus[]
): Promise<ActionResult<LadderChallengeWithPlayers[]>> {
  try {
    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('ladder_challenges')
      .select(`
        *,
        challenger_player:players!challenger_player_id(
          id,
          first_name,
          last_name,
          rating,
          avatar_url
        ),
        challenged_player:players!challenged_player_id(
          id,
          first_name,
          last_name,
          rating,
          avatar_url
        )
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    const { data, error } = await query

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching ladder challenges:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch challenges' }
  }
}

/**
 * Get position history for a league
 */
export async function getLadderPositionHistory(
  leagueId: string,
  limit: number = 50
): Promise<ActionResult<LadderPositionHistory[]>> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('ladder_position_history')
      .select(`
        *,
        player:players!player_id(
          id,
          first_name,
          last_name
        )
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching position history:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch history' }
  }
}

/**
 * Admin: Cancel a challenge
 */
export async function adminCancelChallenge(challengeId: string): Promise<ActionResult<boolean>> {
  try {
    const { admin, error: authError } = await getServerAdmin()
    if (authError || !admin) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()

    // Get the challenge first to verify it exists and can be cancelled
    const { data: challenge, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (fetchError || !challenge) {
      return { data: null, error: 'Challenge not found' }
    }

    if (challenge.status !== 'pending' && challenge.status !== 'accepted') {
      return { data: null, error: 'Can only cancel pending or accepted challenges' }
    }

    // Update challenge status
    const { error: updateError } = await supabase
      .from('ladder_challenges')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId)

    if (updateError) throw updateError

    // Log the admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'cancel_challenge',
      entity_type: 'ladder_challenge',
      entity_id: challengeId,
      changes: { old_status: challenge.status, new_status: 'cancelled' }
    })

    return { data: true, error: null }
  } catch (error) {
    console.error('Error cancelling challenge:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to cancel challenge' }
  }
}

/**
 * Admin: Force a walkover (complete challenge with a winner without match)
 */
export async function adminForceWalkover(
  challengeId: string,
  winnerId: string
): Promise<ActionResult<boolean>> {
  try {
    const { admin, error: authError } = await getServerAdmin()
    if (authError || !admin) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (fetchError || !challenge) {
      return { data: null, error: 'Challenge not found' }
    }

    if (challenge.status !== 'pending' && challenge.status !== 'accepted') {
      return { data: null, error: 'Can only force walkover for pending or accepted challenges' }
    }

    // Verify winner is one of the participants
    if (winnerId !== challenge.challenger_player_id && winnerId !== challenge.challenged_player_id) {
      return { data: null, error: 'Winner must be one of the challenge participants' }
    }

    const challengerWon = winnerId === challenge.challenger_player_id

    // If challenger won, swap positions
    if (challengerWon) {
      const { error: swapError } = await supabase.rpc('swap_ladder_positions', {
        p_league_id: challenge.league_id,
        p_winner_player_id: challenge.challenger_player_id,
        p_winner_old_position: challenge.challenger_position,
        p_loser_player_id: challenge.challenged_player_id,
        p_loser_old_position: challenge.challenged_position,
        p_challenge_id: challengeId
      })

      if (swapError) throw swapError
    }

    // Update challenge
    const { error: updateError } = await supabase
      .from('ladder_challenges')
      .update({
        status: 'completed',
        winner_player_id: winnerId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        new_challenger_position: challengerWon ? challenge.challenged_position : challenge.challenger_position,
        new_challenged_position: challengerWon ? challenge.challenger_position : challenge.challenged_position
      })
      .eq('id', challengeId)

    if (updateError) throw updateError

    // Record position history for the loser (walkover)
    const loserId = challengerWon ? challenge.challenged_player_id : challenge.challenger_player_id
    await supabase.from('ladder_position_history').insert({
      league_id: challenge.league_id,
      player_id: loserId,
      old_position: challengerWon ? challenge.challenged_position : challenge.challenger_position,
      new_position: challengerWon ? challenge.challenger_position : challenge.challenged_position,
      change_reason: 'opponent_walkover',
      challenge_id: challengeId
    })

    // Log the admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'force_walkover',
      entity_type: 'ladder_challenge',
      entity_id: challengeId,
      changes: {
        winner_id: winnerId,
        old_status: challenge.status,
        new_status: 'completed',
        positions_swapped: challengerWon
      }
    })

    return { data: true, error: null }
  } catch (error) {
    console.error('Error forcing walkover:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to force walkover' }
  }
}

/**
 * Admin: Adjust a player's position manually
 */
export async function adminAdjustPosition(
  leagueId: string,
  playerId: string,
  newPosition: number,
  reason: string = 'Admin adjustment'
): Promise<ActionResult<boolean>> {
  try {
    const { admin, error: authError } = await getServerAdmin()
    if (authError || !admin) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()

    // Get current ranking
    const { data: currentRanking, error: fetchError } = await supabase
      .from('ladder_rankings')
      .select('*')
      .eq('league_id', leagueId)
      .eq('player_id', playerId)
      .single()

    if (fetchError || !currentRanking) {
      return { data: null, error: 'Player ranking not found' }
    }

    const oldPosition = currentRanking.position

    if (oldPosition === newPosition) {
      return { data: true, error: null } // No change needed
    }

    // Validate new position is within range
    const { count: totalRankings } = await supabase
      .from('ladder_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('is_active', true)

    if (newPosition < 1 || newPosition > (totalRankings || 1)) {
      return { data: null, error: `Position must be between 1 and ${totalRankings}` }
    }

    // Shift other players
    if (newPosition < oldPosition) {
      // Moving up - shift others down
      await supabase.rpc('shift_ladder_positions_down', {
        p_league_id: leagueId,
        p_start_position: newPosition,
        p_end_position: oldPosition - 1
      })
    } else {
      // Moving down - shift others up
      await supabase.rpc('shift_ladder_positions_up', {
        p_league_id: leagueId,
        p_start_position: oldPosition + 1,
        p_end_position: newPosition
      })
    }

    // Update the player's position
    const { error: updateError } = await supabase
      .from('ladder_rankings')
      .update({
        position: newPosition,
        previous_position: oldPosition,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentRanking.id)

    if (updateError) throw updateError

    // Record position history
    await supabase.from('ladder_position_history').insert({
      league_id: leagueId,
      player_id: playerId,
      old_position: oldPosition,
      new_position: newPosition,
      change_reason: 'admin_adjustment'
    })

    // Log the admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'adjust_position',
      entity_type: 'ladder_ranking',
      entity_id: currentRanking.id,
      changes: {
        player_id: playerId,
        old_position: oldPosition,
        new_position: newPosition,
        reason
      }
    })

    return { data: true, error: null }
  } catch (error) {
    console.error('Error adjusting position:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to adjust position' }
  }
}

/**
 * Admin: Edit a match result with ladder-aware position re-swapping.
 * If the match has a ladder_challenge_id and the winner changes,
 * positions are automatically re-swapped via the RPC.
 */
export async function adminEditMatchResult(
  matchId: string,
  updates: {
    scores: { player1: number; player2: number }[]
    winnerId: string | null
    matchDate?: string
    isVerified?: boolean
    gameType?: string
    matchType?: string
    numberOfSets?: number
  }
): Promise<ActionResult<boolean>> {
  try {
    const { admin, error: authError } = await getServerAdmin()
    if (authError || !admin) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()

    // Fetch the current match
    const { data: match, error: fetchError } = await supabase
      .from('player_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (fetchError || !match) {
      return { data: null, error: 'Match not found' }
    }

    const oldWinnerId = match.winner_id
    const winnerChanged = updates.winnerId !== oldWinnerId && oldWinnerId && updates.winnerId

    // If this is a ladder match and the winner changed, re-swap positions
    if (winnerChanged && match.ladder_challenge_id) {
      const { data: reswapResult, error: reswapError } = await supabase.rpc(
        'reverse_and_reswap_ladder_positions',
        {
          p_challenge_id: match.ladder_challenge_id,
          p_old_winner_id: oldWinnerId,
          p_new_winner_id: updates.winnerId,
        }
      )

      if (reswapError) throw reswapError

      if (!reswapResult?.success) {
        return { data: null, error: reswapResult?.error || 'Failed to update ladder positions' }
      }
    }

    // Update the match
    const updateData: Record<string, unknown> = {
      scores: updates.scores,
      winner_id: updates.winnerId || null,
      updated_at: new Date().toISOString(),
    }
    if (updates.matchDate !== undefined) updateData.match_date = updates.matchDate
    if (updates.isVerified !== undefined) updateData.is_verified = updates.isVerified
    if (updates.gameType !== undefined) updateData.game_type = updates.gameType
    if (updates.matchType !== undefined) updateData.match_type = updates.matchType
    if (updates.numberOfSets !== undefined) updateData.number_of_sets = updates.numberOfSets

    const { error: updateError } = await supabase
      .from('player_matches')
      .update(updateData)
      .eq('id', matchId)

    if (updateError) throw updateError

    // Log the admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'edit_match_result',
      entity_type: 'player_match',
      entity_id: matchId,
      changes: {
        old_winner_id: oldWinnerId,
        new_winner_id: updates.winnerId,
        ladder_challenge_id: match.ladder_challenge_id,
        positions_changed: winnerChanged && match.ladder_challenge_id ? true : false,
      }
    })

    return { data: true, error: null }
  } catch (error) {
    console.error('Error editing match result:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to edit match result' }
  }
}

/**
 * Get ladder stats for a league
 */
export async function getLadderStats(leagueId: string): Promise<ActionResult<{
  totalPlayers: number
  activePlayers: number
  pendingChallenges: number
  acceptedChallenges: number
  completedChallenges: number
  recentMatches: number
}>> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get total and active players
    const { count: totalPlayers } = await supabase
      .from('ladder_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)

    const { count: activePlayers } = await supabase
      .from('ladder_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('is_active', true)

    // Get challenge counts by status
    const { count: pendingChallenges } = await supabase
      .from('ladder_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('status', 'pending')

    const { count: acceptedChallenges } = await supabase
      .from('ladder_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('status', 'accepted')

    const { count: completedChallenges } = await supabase
      .from('ladder_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('status', 'completed')

    // Get recent matches (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: recentMatches } = await supabase
      .from('ladder_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString())

    return {
      data: {
        totalPlayers: totalPlayers || 0,
        activePlayers: activePlayers || 0,
        pendingChallenges: pendingChallenges || 0,
        acceptedChallenges: acceptedChallenges || 0,
        completedChallenges: completedChallenges || 0,
        recentMatches: recentMatches || 0
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching ladder stats:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch stats' }
  }
}
