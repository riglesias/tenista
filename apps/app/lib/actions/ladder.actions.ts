import { supabase } from '@/lib/supabase';
import { ApiResponse, reportError } from '@/lib/utils/errors';
import {
  ChallengeValidationResult,
  LadderChallenge,
  LadderChallengeSchema,
  LadderChallengeWithPlayers,
  LadderChallengesWithPlayersSchema,
  LadderPositionHistory,
  LadderPositionHistoriesSchema,
  LadderRanking,
  LadderRankingSchema,
  LadderRankingWithPlayer,
  LadderRankingsWithPlayerSchema,
  calculateAcceptanceDeadline,
  calculateMatchDeadline,
} from '@/lib/validation/ladder.validation';
import { DEFAULT_LADDER_CONFIG, LadderConfig } from '@/lib/validation/leagues.validation';
import * as Sentry from '@sentry/react-native';

/**
 * Get ladder rankings for a league
 * Includes both active and retired players (is_active field indicates status)
 * Uses denormalized wins/losses columns for performance (updated by database trigger)
 */
export async function getLadderRankings(
  leagueId: string
): Promise<ApiResponse<LadderRankingWithPlayer[]>> {
  try {
    // Fetch all rankings with denormalized wins/losses (both active and retired)
    // Retired players have is_active = false but are still shown in standings
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('ladder_rankings')
      .select(`
        *,
        player:players!player_id(
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        ),
        doubles_team:doubles_teams!doubles_team_id(
          team_name,
          combined_rating,
          player1:players!player1_id(first_name, last_name),
          player2:players!player2_id(first_name, last_name)
        )
      `)
      .eq('league_id', leagueId)
      .order('is_active', { ascending: false }) // Active players first
      .order('position', { ascending: true });

    if (rankingsError) throw rankingsError;

    // W/L stats are now stored directly on ladder_rankings table
    // No need for separate query or client-side computation
    const rankings = LadderRankingsWithPlayerSchema.parse(rankingsData || []);
    return { data: rankings, error: null };
  } catch (error) {
    const appError = reportError(error, 'getLadderRankings');
    return { data: null, error: appError };
  }
}

/**
 * Get a player's current position in a ladder
 */
export async function getPlayerLadderPosition(
  leagueId: string,
  playerId: string
): Promise<ApiResponse<number | null>> {
  try {
    const { data, error } = await supabase
      .from('ladder_rankings')
      .select('position')
      .eq('league_id', leagueId)
      .eq('player_id', playerId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    return { data: data?.position || null, error: null };
  } catch (error) {
    const appError = reportError(error, 'getPlayerLadderPosition');
    return { data: null, error: appError };
  }
}

/**
 * Check if a player can challenge a specific position
 * Uses database RPC function to validate in a single round-trip (instead of 7+ queries)
 */
export async function canChallengePosition(
  leagueId: string,
  playerId: string,
  challengedPosition: number
): Promise<ApiResponse<ChallengeValidationResult>> {
  try {
    // Call the database RPC function that performs all validations in one query
    const { data, error } = await supabase.rpc('validate_challenge', {
      p_league_id: leagueId,
      p_player_id: playerId,
      p_target_position: challengedPosition,
    });

    if (error) throw error;

    // The RPC returns a JSONB object with valid, reason, challenger_position, etc.
    const result = data as ChallengeValidationResult;

    return { data: result, error: null };
  } catch (error) {
    const appError = reportError(error, 'canChallengePosition');
    return { data: null, error: appError };
  }
}

/**
 * Create a new ladder challenge
 */
export async function createChallenge(
  leagueId: string,
  challengedPosition: number
): Promise<ApiResponse<LadderChallenge>> {
  try {
    Sentry.addBreadcrumb({
      category: 'ladder',
      message: 'Creating ladder challenge',
      data: { leagueId, challengedPosition },
      level: 'info',
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get player ID
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!player) {
      throw new Error('Player not found');
    }

    // Validate the challenge
    const validationResult = await canChallengePosition(leagueId, player.id, challengedPosition);
    if (validationResult.error) throw validationResult.error;
    if (!validationResult.data?.valid) {
      throw new Error(validationResult.data?.reason || 'Challenge not allowed');
    }

    // Get league config for deadlines
    const { data: league } = await supabase
      .from('leagues')
      .select('ladder_config')
      .eq('id', leagueId)
      .single();

    const config: LadderConfig = league?.ladder_config || DEFAULT_LADDER_CONFIG;

    // Get challenger's position
    const { data: challengerRanking } = await supabase
      .from('ladder_rankings')
      .select('position')
      .eq('league_id', leagueId)
      .eq('player_id', player.id)
      .single();

    // Get challenged player
    const { data: challengedRanking } = await supabase
      .from('ladder_rankings')
      .select('player_id')
      .eq('league_id', leagueId)
      .eq('position', challengedPosition)
      .single();

    if (!challengedRanking) {
      throw new Error('No player found at the challenged position');
    }

    // Create the challenge
    const acceptanceDeadline = calculateAcceptanceDeadline(config.challenge_acceptance_deadline_days);

    const { data: challenge, error } = await supabase
      .from('ladder_challenges')
      .insert({
        league_id: leagueId,
        challenger_player_id: player.id,
        challenger_position: challengerRanking!.position,
        challenged_player_id: challengedRanking.player_id,
        challenged_position: challengedPosition,
        status: 'pending',
        acceptance_deadline: acceptanceDeadline.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const validatedChallenge = LadderChallengeSchema.parse(challenge);

    Sentry.captureMessage('Ladder challenge created', 'info');
    return { data: validatedChallenge, error: null };
  } catch (error) {
    Sentry.captureException(error);
    const appError = reportError(error, 'createChallenge');
    return { data: null, error: appError };
  }
}

/**
 * Accept a ladder challenge
 */
export async function acceptChallenge(
  challengeId: string
): Promise<ApiResponse<LadderChallenge>> {
  try {
    Sentry.addBreadcrumb({
      category: 'ladder',
      message: 'Accepting ladder challenge',
      data: { challengeId },
      level: 'info',
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get player ID
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!player) {
      throw new Error('Player not found');
    }

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*, league:leagues!league_id(ladder_config)')
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    // Verify user is the challenged player
    if (challenge.challenged_player_id !== player.id) {
      throw new Error('You can only accept challenges sent to you');
    }

    // Verify challenge is pending
    if (challenge.status !== 'pending') {
      throw new Error('This challenge is no longer pending');
    }

    // Check if acceptance deadline has passed
    if (new Date(challenge.acceptance_deadline) < new Date()) {
      throw new Error('The acceptance deadline has passed');
    }

    // Calculate match deadline
    const config: LadderConfig = challenge.league?.ladder_config || DEFAULT_LADDER_CONFIG;
    const matchDeadline = calculateMatchDeadline(config.match_completion_deadline_days);

    // Update the challenge
    const { data: updatedChallenge, error } = await supabase
      .from('ladder_challenges')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        match_deadline: matchDeadline.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw error;

    const validatedChallenge = LadderChallengeSchema.parse(updatedChallenge);

    Sentry.captureMessage('Ladder challenge accepted', 'info');
    return { data: validatedChallenge, error: null };
  } catch (error) {
    Sentry.captureException(error);
    const appError = reportError(error, 'acceptChallenge');
    return { data: null, error: appError };
  }
}

/**
 * Decline a ladder challenge
 */
export async function declineChallenge(
  challengeId: string
): Promise<ApiResponse<LadderChallenge>> {
  try {
    Sentry.addBreadcrumb({
      category: 'ladder',
      message: 'Declining ladder challenge',
      data: { challengeId },
      level: 'info',
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get player ID
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!player) {
      throw new Error('Player not found');
    }

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    // Verify user is the challenged player
    if (challenge.challenged_player_id !== player.id) {
      throw new Error('You can only decline challenges sent to you');
    }

    // Verify challenge is pending
    if (challenge.status !== 'pending') {
      throw new Error('This challenge is no longer pending');
    }

    // Update the challenge
    const { data: updatedChallenge, error } = await supabase
      .from('ladder_challenges')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw error;

    const validatedChallenge = LadderChallengeSchema.parse(updatedChallenge);

    Sentry.captureMessage('Ladder challenge declined', 'info');
    return { data: validatedChallenge, error: null };
  } catch (error) {
    Sentry.captureException(error);
    const appError = reportError(error, 'declineChallenge');
    return { data: null, error: appError };
  }
}

/**
 * Cancel a ladder challenge (only by the challenger, only if pending)
 */
export async function cancelChallenge(
  challengeId: string
): Promise<ApiResponse<LadderChallenge>> {
  try {
    Sentry.addBreadcrumb({
      category: 'ladder',
      message: 'Cancelling ladder challenge',
      data: { challengeId },
      level: 'info',
    });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get player ID
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!player) {
      throw new Error('Player not found');
    }

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    // Verify user is the challenger
    if (challenge.challenger_player_id !== player.id) {
      throw new Error('You can only cancel challenges you created');
    }

    // Verify challenge is pending (can only cancel before it's accepted)
    if (challenge.status !== 'pending') {
      throw new Error('You can only cancel pending challenges');
    }

    // Update the challenge
    const { data: updatedChallenge, error } = await supabase
      .from('ladder_challenges')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw error;

    const validatedChallenge = LadderChallengeSchema.parse(updatedChallenge);

    Sentry.captureMessage('Ladder challenge cancelled', 'info');
    return { data: validatedChallenge, error: null };
  } catch (error) {
    Sentry.captureException(error);
    const appError = reportError(error, 'cancelChallenge');
    return { data: null, error: appError };
  }
}

/**
 * Complete a ladder challenge with match result
 */
export async function completeChallenge(
  challengeId: string,
  matchId: string,
  winnerId: string
): Promise<ApiResponse<LadderChallenge>> {
  try {
    Sentry.addBreadcrumb({
      category: 'ladder',
      message: 'Completing ladder challenge',
      data: { challengeId, matchId, winnerId },
      level: 'info',
    });

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    // Verify challenge is accepted
    if (challenge.status !== 'accepted') {
      throw new Error('This challenge must be accepted before completing');
    }

    // Verify winner is one of the participants
    if (winnerId !== challenge.challenger_player_id && winnerId !== challenge.challenged_player_id) {
      throw new Error('Winner must be one of the challenge participants');
    }

    const challengerWon = winnerId === challenge.challenger_player_id;

    // If challenger won, swap positions using the database function
    if (challengerWon) {
      const { error: swapError } = await supabase.rpc('swap_ladder_positions', {
        p_league_id: challenge.league_id,
        p_winner_player_id: challenge.challenger_player_id,
        p_winner_old_position: challenge.challenger_position,
        p_loser_player_id: challenge.challenged_player_id,
        p_loser_old_position: challenge.challenged_position,
        p_challenge_id: challengeId,
      });

      if (swapError) throw swapError;
    } else {
      // Defender won - just record history, no position change
      await supabase.from('ladder_position_history').insert([
        {
          league_id: challenge.league_id,
          player_id: challenge.challenger_player_id,
          old_position: challenge.challenger_position,
          new_position: challenge.challenger_position,
          change_reason: 'match_loss',
          challenge_id: challengeId,
        },
        {
          league_id: challenge.league_id,
          player_id: challenge.challenged_player_id,
          old_position: challenge.challenged_position,
          new_position: challenge.challenged_position,
          change_reason: 'match_win',
          challenge_id: challengeId,
        },
      ]);
    }

    // Update the challenge
    const { data: updatedChallenge, error } = await supabase
      .from('ladder_challenges')
      .update({
        status: 'completed',
        player_match_id: matchId,
        winner_player_id: winnerId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        new_challenger_position: challengerWon ? challenge.challenged_position : challenge.challenger_position,
        new_challenged_position: challengerWon ? challenge.challenger_position : challenge.challenged_position,
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw error;

    // Update last_match_date for both players in ladder_rankings
    await supabase
      .from('ladder_rankings')
      .update({ last_match_date: new Date().toISOString() })
      .eq('league_id', challenge.league_id)
      .in('player_id', [challenge.challenger_player_id, challenge.challenged_player_id]);

    const validatedChallenge = LadderChallengeSchema.parse(updatedChallenge);

    Sentry.captureMessage('Ladder challenge completed', 'info');
    return { data: validatedChallenge, error: null };
  } catch (error) {
    Sentry.captureException(error);
    const appError = reportError(error, 'completeChallenge');
    return { data: null, error: appError };
  }
}

/**
 * Edit a completed ladder match result.
 * Only the original submitter can edit, and only once (edit_count must be 0).
 * If the winner changes, ladder positions are automatically re-swapped.
 */
export async function editLadderMatchResult(
  matchId: string,
  challengeId: string,
  newScores: { player1: number; player2: number }[],
  newWinnerId: string
): Promise<ApiResponse<boolean>> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get player profile
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    if (!player) throw new Error('Player not found');

    // Fetch the match
    const { data: match, error: fetchError } = await supabase
      .from('player_matches')
      .select('*')
      .eq('id', matchId)
      .single();
    if (fetchError || !match) throw new Error('Match not found');

    // Verify caller is the original submitter
    if (match.submitted_by !== player.id) {
      throw new Error('Only the original submitter can edit this result');
    }

    // Check edit count
    if (match.edit_count >= 1) {
      throw new Error('This result has already been edited');
    }

    const oldWinnerId = match.winner_id;
    const winnerChanged = newWinnerId !== oldWinnerId;

    // If winner changed, re-swap ladder positions
    if (winnerChanged && challengeId) {
      const { data: reswapResult, error: reswapError } = await supabase.rpc(
        'reverse_and_reswap_ladder_positions',
        {
          p_challenge_id: challengeId,
          p_old_winner_id: oldWinnerId,
          p_new_winner_id: newWinnerId,
        }
      );

      if (reswapError) throw reswapError;
      if (!reswapResult?.success) {
        throw new Error(reswapResult?.error || 'Failed to update ladder positions');
      }
    }

    // Update the match
    const { error: updateError } = await supabase
      .from('player_matches')
      .update({
        scores: newScores,
        winner_id: newWinnerId,
        edit_count: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) throw updateError;

    return { data: true, error: null };
  } catch (error) {
    const appError = reportError(error, 'editLadderMatchResult');
    return { data: null, error: appError };
  }
}

/**
 * Get active challenge for a player (either as challenger or challenged)
 */
export async function getActiveChallenge(
  leagueId: string,
  playerId: string
): Promise<ApiResponse<LadderChallengeWithPlayers | null>> {
  try {
    const { data, error } = await supabase
      .from('ladder_challenges')
      .select(`
        *,
        challenger_player:players!challenger_player_id(
          first_name,
          last_name,
          rating,
          avatar_url
        ),
        challenged_player:players!challenged_player_id(
          first_name,
          last_name,
          rating,
          avatar_url
        )
      `)
      .eq('league_id', leagueId)
      .or(`challenger_player_id.eq.${playerId},challenged_player_id.eq.${playerId}`)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { data: null, error: null };
    }

    const challenges = LadderChallengesWithPlayersSchema.parse([data]);
    return { data: challenges[0], error: null };
  } catch (error) {
    const appError = reportError(error, 'getActiveChallenge');
    return { data: null, error: appError };
  }
}

/**
 * Get pending challenges for a player (incoming)
 */
export async function getPendingChallengesForPlayer(
  playerId: string
): Promise<ApiResponse<LadderChallengeWithPlayers[]>> {
  try {
    const { data, error } = await supabase
      .from('ladder_challenges')
      .select(`
        *,
        challenger_player:players!challenger_player_id(
          first_name,
          last_name,
          rating,
          avatar_url
        ),
        challenged_player:players!challenged_player_id(
          first_name,
          last_name,
          rating,
          avatar_url
        )
      `)
      .eq('challenged_player_id', playerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const challenges = LadderChallengesWithPlayersSchema.parse(data || []);
    return { data: challenges, error: null };
  } catch (error) {
    const appError = reportError(error, 'getPendingChallengesForPlayer');
    return { data: null, error: appError };
  }
}

/**
 * Get challenge history for a league
 */
export async function getChallengeHistory(
  leagueId: string,
  playerId?: string,
  limit: number = 20
): Promise<ApiResponse<LadderChallengeWithPlayers[]>> {
  try {
    let query = supabase
      .from('ladder_challenges')
      .select(`
        *,
        challenger_player:players!challenger_player_id(
          first_name,
          last_name,
          rating,
          avatar_url
        ),
        challenged_player:players!challenged_player_id(
          first_name,
          last_name,
          rating,
          avatar_url
        ),
        player_match:player_matches!player_match_id(
          submitted_by,
          edit_count
        )
      `)
      .eq('league_id', leagueId)
      .in('status', ['completed', 'declined', 'expired', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (playerId) {
      query = query.or(`challenger_player_id.eq.${playerId},challenged_player_id.eq.${playerId}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const challenges = LadderChallengesWithPlayersSchema.parse(data || []);
    return { data: challenges, error: null };
  } catch (error) {
    const appError = reportError(error, 'getChallengeHistory');
    return { data: null, error: appError };
  }
}

/**
 * Get position history for a player
 */
export async function getPositionHistory(
  leagueId: string,
  playerId: string,
  limit: number = 20
): Promise<ApiResponse<LadderPositionHistory[]>> {
  try {
    const { data, error } = await supabase
      .from('ladder_position_history')
      .select('*')
      .eq('league_id', leagueId)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const history = LadderPositionHistoriesSchema.parse(data || []);
    return { data: history, error: null };
  } catch (error) {
    const appError = reportError(error, 'getPositionHistory');
    return { data: null, error: appError };
  }
}

/**
 * Process expired challenges (sets status to 'expired' and awards walkover)
 * This should be called by a scheduled job
 */
export async function processExpiredChallenges(): Promise<ApiResponse<number>> {
  try {
    const now = new Date().toISOString();

    // Find pending challenges past acceptance deadline
    const { data: expiredPending, error: fetchError } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('status', 'pending')
      .lt('acceptance_deadline', now);

    if (fetchError) throw fetchError;

    let processedCount = 0;

    for (const challenge of expiredPending || []) {
      // Award walkover to challenger (they move up)
      const { error: swapError } = await supabase.rpc('swap_ladder_positions', {
        p_league_id: challenge.league_id,
        p_winner_player_id: challenge.challenger_player_id,
        p_winner_old_position: challenge.challenger_position,
        p_loser_player_id: challenge.challenged_player_id,
        p_loser_old_position: challenge.challenged_position,
        p_challenge_id: challenge.id,
      });

      if (!swapError) {
        // Update challenge status
        await supabase
          .from('ladder_challenges')
          .update({
            status: 'expired',
            winner_player_id: challenge.challenger_player_id,
            completed_at: now,
            updated_at: now,
            new_challenger_position: challenge.challenged_position,
            new_challenged_position: challenge.challenger_position,
          })
          .eq('id', challenge.id);

        // Record walkover in history
        await supabase.from('ladder_position_history').insert({
          league_id: challenge.league_id,
          player_id: challenge.challenged_player_id,
          old_position: challenge.challenged_position,
          new_position: challenge.challenger_position,
          change_reason: 'opponent_walkover',
          challenge_id: challenge.id,
        });

        processedCount++;
      }
    }

    // Find accepted challenges past match deadline
    const { data: expiredAccepted } = await supabase
      .from('ladder_challenges')
      .select('*')
      .eq('status', 'accepted')
      .not('match_deadline', 'is', null)
      .lt('match_deadline', now);

    for (const challenge of expiredAccepted || []) {
      // Mark as expired (no position change since both failed to complete)
      await supabase
        .from('ladder_challenges')
        .update({
          status: 'expired',
          completed_at: now,
          updated_at: now,
        })
        .eq('id', challenge.id);

      processedCount++;
    }

    return { data: processedCount, error: null };
  } catch (error) {
    const appError = reportError(error, 'processExpiredChallenges');
    return { data: null, error: appError };
  }
}

/**
 * Apply inactivity penalties for a league
 * This should be called by a scheduled job
 */
export async function applyInactivityPenalties(
  leagueId: string
): Promise<ApiResponse<number>> {
  try {
    // Get league config
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('ladder_config')
      .eq('id', leagueId)
      .single();

    if (leagueError) throw leagueError;

    const config: LadderConfig = league.ladder_config || DEFAULT_LADDER_CONFIG;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - config.inactivity_threshold_days);

    // Find inactive players
    const { data: inactivePlayers, error: fetchError } = await supabase
      .from('ladder_rankings')
      .select('player_id, position')
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .or(`last_match_date.is.null,last_match_date.lt.${thresholdDate.toISOString()}`)
      .lt('last_activity_check', thresholdDate.toISOString());

    if (fetchError) throw fetchError;

    let penalizedCount = 0;

    for (const player of inactivePlayers || []) {
      const { error: penaltyError } = await supabase.rpc('apply_inactivity_penalty', {
        p_league_id: leagueId,
        p_player_id: player.player_id,
        p_positions_to_drop: config.inactivity_position_drop,
      });

      if (!penaltyError) {
        penalizedCount++;
      }
    }

    return { data: penalizedCount, error: null };
  } catch (error) {
    const appError = reportError(error, 'applyInactivityPenalties');
    return { data: null, error: appError };
  }
}

/**
 * Admin: Manually adjust a player's position
 */
export async function adjustPosition(
  leagueId: string,
  playerId: string,
  newPosition: number,
  reason: string = 'admin_adjustment'
): Promise<ApiResponse<LadderRanking>> {
  try {
    Sentry.addBreadcrumb({
      category: 'ladder',
      message: 'Admin adjusting ladder position',
      data: { leagueId, playerId, newPosition, reason },
      level: 'info',
    });

    // Get current position
    const { data: currentRanking, error: fetchError } = await supabase
      .from('ladder_rankings')
      .select('*')
      .eq('league_id', leagueId)
      .eq('player_id', playerId)
      .single();

    if (fetchError) throw fetchError;

    const oldPosition = currentRanking.position;

    if (oldPosition === newPosition) {
      return { data: currentRanking as LadderRanking, error: null };
    }

    // Shift other players as needed
    if (newPosition < oldPosition) {
      // Moving up - shift others down
      await supabase
        .from('ladder_rankings')
        .update({ position: supabase.rpc('position + 1') })
        .eq('league_id', leagueId)
        .gte('position', newPosition)
        .lt('position', oldPosition);
    } else {
      // Moving down - shift others up
      await supabase
        .from('ladder_rankings')
        .update({ position: supabase.rpc('position - 1') })
        .eq('league_id', leagueId)
        .gt('position', oldPosition)
        .lte('position', newPosition);
    }

    // Update player's position
    const { data: updatedRanking, error: updateError } = await supabase
      .from('ladder_rankings')
      .update({
        position: newPosition,
        previous_position: oldPosition,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRanking.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record history
    await supabase.from('ladder_position_history').insert({
      league_id: leagueId,
      player_id: playerId,
      old_position: oldPosition,
      new_position: newPosition,
      change_reason: reason,
    });

    const validatedRanking = LadderRankingSchema.parse(updatedRanking);

    Sentry.captureMessage('Admin adjusted ladder position', 'info');
    return { data: validatedRanking, error: null };
  } catch (error) {
    Sentry.captureException(error);
    const appError = reportError(error, 'adjustPosition');
    return { data: null, error: appError };
  }
}

/**
 * Join a ladder league (adds player to rankings)
 */
export async function joinLadder(
  leagueId: string,
  playerId: string
): Promise<ApiResponse<LadderRanking>> {
  try {
    // Get the next available position
    const { data: maxPosition } = await supabase
      .from('ladder_rankings')
      .select('position')
      .eq('league_id', leagueId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPosition?.position || 0) + 1;

    // Create the ranking entry
    const { data: ranking, error } = await supabase
      .from('ladder_rankings')
      .insert({
        league_id: leagueId,
        player_id: playerId,
        position: newPosition,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Record initial placement
    await supabase.from('ladder_position_history').insert({
      league_id: leagueId,
      player_id: playerId,
      old_position: newPosition,
      new_position: newPosition,
      change_reason: 'initial_placement',
    });

    const validatedRanking = LadderRankingSchema.parse(ranking);
    return { data: validatedRanking, error: null };
  } catch (error) {
    const appError = reportError(error, 'joinLadder');
    return { data: null, error: appError };
  }
}
