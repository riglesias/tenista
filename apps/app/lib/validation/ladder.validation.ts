import { z } from 'zod';

// Challenge status enum
export const ChallengeStatusEnum = z.enum([
  'pending',
  'accepted',
  'declined',
  'expired',
  'completed',
  'cancelled'
]);
export type ChallengeStatus = z.infer<typeof ChallengeStatusEnum>;

// Position change reason enum
export const PositionChangeReasonEnum = z.enum([
  'match_win',
  'match_loss',
  'inactivity_penalty',
  'opponent_walkover',
  'admin_adjustment',
  'initial_placement',
  'player_retired'
]);
export type PositionChangeReason = z.infer<typeof PositionChangeReasonEnum>;

// Ladder ranking schema
export const LadderRankingSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  player_id: z.string().uuid().nullable(),
  doubles_team_id: z.string().uuid().nullable(),
  position: z.number().int().positive(),
  previous_position: z.number().int().nullable(),
  last_match_date: z.string().nullable(),
  last_activity_check: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LadderRanking = z.infer<typeof LadderRankingSchema>;

// Ladder ranking with player info (for display)
export const LadderRankingWithPlayerSchema = LadderRankingSchema.extend({
  player: z.object({
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    nationality_code: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }).nullable(),
  doubles_team: z.object({
    team_name: z.string().nullable(),
    combined_rating: z.number().nullable(),
    player1: z.object({
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
    }).nullable(),
    player2: z.object({
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
    }).nullable(),
  }).nullable(),
  wins: z.number().default(0),
  losses: z.number().default(0),
});
export type LadderRankingWithPlayer = z.infer<typeof LadderRankingWithPlayerSchema>;
export const LadderRankingsWithPlayerSchema = z.array(LadderRankingWithPlayerSchema);

// Ladder challenge schema
export const LadderChallengeSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  challenger_player_id: z.string().uuid().nullable(),
  challenger_team_id: z.string().uuid().nullable(),
  challenger_position: z.number().int().positive(),
  challenged_player_id: z.string().uuid().nullable(),
  challenged_team_id: z.string().uuid().nullable(),
  challenged_position: z.number().int().positive(),
  status: ChallengeStatusEnum,
  acceptance_deadline: z.string(),
  match_deadline: z.string().nullable(),
  player_match_id: z.string().uuid().nullable(),
  winner_player_id: z.string().uuid().nullable(),
  winner_team_id: z.string().uuid().nullable(),
  new_challenger_position: z.number().int().nullable(),
  new_challenged_position: z.number().int().nullable(),
  created_at: z.string(),
  accepted_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  updated_at: z.string(),
});
export type LadderChallenge = z.infer<typeof LadderChallengeSchema>;

// Ladder challenge with player info (for display)
export const LadderChallengeWithPlayersSchema = LadderChallengeSchema.extend({
  challenger_player: z.object({
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    avatar_url: z.string().nullable(),
  }).nullable(),
  challenged_player: z.object({
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    avatar_url: z.string().nullable(),
  }).nullable(),
  // Optional: joined from player_matches for edit/report buttons
  player_match: z.object({
    submitted_by: z.string().uuid(),
    edit_count: z.number(),
  }).nullable().optional(),
});
export type LadderChallengeWithPlayers = z.infer<typeof LadderChallengeWithPlayersSchema>;
export const LadderChallengesWithPlayersSchema = z.array(LadderChallengeWithPlayersSchema);

// Ladder position history schema
export const LadderPositionHistorySchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  player_id: z.string().uuid().nullable(),
  doubles_team_id: z.string().uuid().nullable(),
  old_position: z.number().int().positive(),
  new_position: z.number().int().positive(),
  change_reason: PositionChangeReasonEnum,
  challenge_id: z.string().uuid().nullable(),
  created_at: z.string(),
});
export type LadderPositionHistory = z.infer<typeof LadderPositionHistorySchema>;
export const LadderPositionHistoriesSchema = z.array(LadderPositionHistorySchema);

// Create challenge input schema
export const CreateChallengeInputSchema = z.object({
  league_id: z.string().uuid(),
  challenged_position: z.number().int().positive(),
});
export type CreateChallengeInput = z.infer<typeof CreateChallengeInputSchema>;

// Challenge validation result
export const ChallengeValidationResultSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  challenger_position: z.number().int().optional(),
  max_challenge_positions: z.number().int().optional(),
});
export type ChallengeValidationResult = z.infer<typeof ChallengeValidationResultSchema>;

// Helper function to format player name for ladder display
export function formatLadderPlayerName(
  firstName: string | null,
  lastName: string | null
): string {
  if (!firstName && !lastName) return 'Unknown';
  if (!lastName) return firstName || 'Unknown';
  if (!firstName) return lastName;
  return `${firstName} ${lastName.charAt(0)}.`;
}

// Helper function to format team name for ladder display
export function formatLadderTeamName(
  teamName: string | null,
  player1FirstName: string | null,
  player1LastName: string | null,
  player2FirstName: string | null,
  player2LastName: string | null
): string {
  if (teamName) return teamName;
  const p1 = formatLadderPlayerName(player1FirstName, player1LastName);
  const p2 = formatLadderPlayerName(player2FirstName, player2LastName);
  return `${p1} & ${p2}`;
}

/**
 * Check if a challenge is expired based on its status and deadline.
 * - pending: expired if acceptance_deadline has passed
 * - accepted: always active (until result submitted)
 * - other statuses: not considered expired (already terminal)
 */
export function isChallengeExpired(challenge: { status: string; acceptance_deadline: string; match_deadline?: string | null }): boolean {
  if (challenge.status === 'pending') {
    return new Date(challenge.acceptance_deadline).getTime() < Date.now()
  }
  return false
}

// Helper to calculate deadline from config
export function calculateAcceptanceDeadline(deadlineDays: number): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);
  return deadline;
}

export function calculateMatchDeadline(deadlineDays: number): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);
  return deadline;
}

// ===== Match Score Validation for Ladder Competitions =====

import { LadderMatchFormat, DEFAULT_LADDER_MATCH_FORMAT } from './leagues.validation';

export interface SetScore {
  player1: number;
  player2: number;
}

export interface SuperTiebreakScore {
  player1: number;
  player2: number;
}

export interface MatchScoreValidationResult {
  valid: boolean;
  error?: string;
  winnerId?: 'player1' | 'player2';
  requiresSuperTiebreak?: boolean;
}

/**
 * Validate a short set score (first to 4 games, tiebreak at 3-3)
 * Valid scores: 4-0, 4-1, 4-2, 4-3, 3-4, 2-4, 1-4, 0-4
 */
export function validateShortSet(set: SetScore): { valid: boolean; error?: string; winner?: 'player1' | 'player2' } {
  const { player1, player2 } = set;

  // Check for valid range
  if (player1 < 0 || player2 < 0) {
    return { valid: false, error: 'Scores cannot be negative' };
  }

  // Check if someone won with 4 games
  if (player1 === 4 && player2 <= 3) {
    return { valid: true, winner: 'player1' };
  }
  if (player2 === 4 && player1 <= 3) {
    return { valid: true, winner: 'player2' };
  }

  // Tiebreak at 3-3 should result in 4-3 or 3-4
  if (player1 === 4 && player2 === 3) {
    return { valid: true, winner: 'player1' };
  }
  if (player1 === 3 && player2 === 4) {
    return { valid: true, winner: 'player2' };
  }

  // If someone has more than 4 games, invalid
  if (player1 > 4 || player2 > 4) {
    return { valid: false, error: 'Short sets cannot exceed 4 games per player' };
  }

  // Tie or incomplete set
  if (player1 === player2) {
    return { valid: false, error: 'Set cannot end in a tie' };
  }

  // Neither player has won yet
  if (player1 < 4 && player2 < 4) {
    return { valid: false, error: 'Set is incomplete - a player must reach 4 games to win' };
  }

  return { valid: false, error: 'Invalid short set score' };
}

/**
 * Validate a standard set score (first to 6 games, tiebreak at 6-6)
 * Valid scores: 6-0 through 6-4, 7-5, 7-6 (tiebreak)
 */
export function validateStandardSet(set: SetScore): { valid: boolean; error?: string; winner?: 'player1' | 'player2' } {
  const { player1, player2 } = set;

  // Check for valid range
  if (player1 < 0 || player2 < 0) {
    return { valid: false, error: 'Scores cannot be negative' };
  }

  const higherScore = Math.max(player1, player2);
  const lowerScore = Math.min(player1, player2);
  const winner = player1 > player2 ? 'player1' : 'player2';

  // Standard win at 6 games (6-0, 6-1, 6-2, 6-3, 6-4)
  if (higherScore === 6 && lowerScore <= 4) {
    return { valid: true, winner };
  }

  // Win at 7-5
  if (higherScore === 7 && lowerScore === 5) {
    return { valid: true, winner };
  }

  // Tiebreak win at 7-6
  if (higherScore === 7 && lowerScore === 6) {
    return { valid: true, winner };
  }

  // Extended games (e.g., 9-7, 10-8) - must win by 2
  if (higherScore > 7 && lowerScore >= 5 && (higherScore - lowerScore === 2)) {
    return { valid: true, winner };
  }

  // Check for invalid scores
  if (higherScore === 6 && lowerScore > 4) {
    return { valid: false, error: 'At 6-5, play continues; use 7-5 or 7-6 for tiebreak' };
  }

  // Tie check
  if (player1 === player2) {
    return { valid: false, error: 'Set cannot end in a tie' };
  }

  // Incomplete set
  if (higherScore < 6) {
    return { valid: false, error: 'Set is incomplete - a player must reach 6 games to win' };
  }

  return { valid: false, error: 'Invalid standard set score' };
}

/**
 * Validate a super tiebreak score (first to 10 points, win by 2)
 */
export function validateSuperTiebreak(
  score: SuperTiebreakScore,
  targetPoints: 10 | 7 = 10
): { valid: boolean; error?: string; winner?: 'player1' | 'player2' } {
  const { player1, player2 } = score;

  // Check for valid range
  if (player1 < 0 || player2 < 0) {
    return { valid: false, error: 'Scores cannot be negative' };
  }

  const higherScore = Math.max(player1, player2);
  const lowerScore = Math.min(player1, player2);
  const winner = player1 > player2 ? 'player1' : 'player2';

  // Check if winner reached target
  if (higherScore < targetPoints) {
    return { valid: false, error: `Super tiebreak must reach ${targetPoints} points` };
  }

  // Check win by 2
  if (higherScore - lowerScore < 2) {
    return { valid: false, error: 'Super tiebreak must be won by 2 points' };
  }

  // Standard win at target points (e.g., 10-8, 10-5, 10-0)
  if (higherScore === targetPoints && lowerScore <= targetPoints - 2) {
    return { valid: true, winner };
  }

  // Extended win (e.g., 11-9, 12-10) - must win by exactly 2
  if (higherScore > targetPoints && higherScore - lowerScore === 2 && lowerScore >= targetPoints - 1) {
    return { valid: true, winner };
  }

  // If higherScore is way above, it should have ended earlier
  if (higherScore > targetPoints && higherScore - lowerScore > 2) {
    return { valid: false, error: 'Super tiebreak should have ended earlier' };
  }

  return { valid: true, winner };
}

/**
 * Validate a complete match score based on the match format
 */
export function validateMatchScore(
  sets: SetScore[],
  format: LadderMatchFormat = DEFAULT_LADDER_MATCH_FORMAT,
  superTiebreak?: SuperTiebreakScore
): MatchScoreValidationResult {
  const isShortSets = format.type === 'short_sets' || format.games_per_set === 4;
  const validateSet = isShortSets ? validateShortSet : validateStandardSet;

  // For 2-set format with final set tiebreak
  if (format.number_of_sets === 2 && format.final_set_tiebreak) {
    // Validate we have exactly 2 sets
    if (sets.length !== 2) {
      return { valid: false, error: 'Match requires exactly 2 sets' };
    }

    let setsWonByPlayer1 = 0;
    let setsWonByPlayer2 = 0;

    // Validate each set
    for (let i = 0; i < sets.length; i++) {
      const result = validateSet(sets[i]);
      if (!result.valid) {
        return { valid: false, error: `Set ${i + 1}: ${result.error}` };
      }
      if (result.winner === 'player1') setsWonByPlayer1++;
      else if (result.winner === 'player2') setsWonByPlayer2++;
    }

    // If one player won both sets
    if (setsWonByPlayer1 === 2) {
      return { valid: true, winnerId: 'player1' };
    }
    if (setsWonByPlayer2 === 2) {
      return { valid: true, winnerId: 'player2' };
    }

    // If tied 1-1, need super tiebreak
    if (setsWonByPlayer1 === 1 && setsWonByPlayer2 === 1) {
      if (!superTiebreak) {
        return { valid: false, requiresSuperTiebreak: true, error: 'Match is tied 1-1, super tiebreak required' };
      }

      const tiebreakResult = validateSuperTiebreak(superTiebreak, format.super_tiebreak_points);
      if (!tiebreakResult.valid) {
        return { valid: false, error: `Super tiebreak: ${tiebreakResult.error}` };
      }

      return { valid: true, winnerId: tiebreakResult.winner };
    }

    return { valid: false, error: 'Invalid match result' };
  }

  // For best of 3 format
  if (format.number_of_sets === 3) {
    if (sets.length < 2 || sets.length > 3) {
      return { valid: false, error: 'Best of 3 match requires 2-3 sets' };
    }

    let setsWonByPlayer1 = 0;
    let setsWonByPlayer2 = 0;

    for (let i = 0; i < sets.length; i++) {
      // Check if this is the third set and format allows super tiebreak
      const isThirdSet = i === 2;

      if (isThirdSet && format.final_set_tiebreak && superTiebreak) {
        // Third set is replaced by super tiebreak
        const tiebreakResult = validateSuperTiebreak(superTiebreak, format.super_tiebreak_points);
        if (!tiebreakResult.valid) {
          return { valid: false, error: `Super tiebreak: ${tiebreakResult.error}` };
        }
        return { valid: true, winnerId: tiebreakResult.winner };
      }

      const result = validateSet(sets[i]);
      if (!result.valid) {
        return { valid: false, error: `Set ${i + 1}: ${result.error}` };
      }
      if (result.winner === 'player1') setsWonByPlayer1++;
      else if (result.winner === 'player2') setsWonByPlayer2++;

      // Check if match is already won
      if (setsWonByPlayer1 === 2) {
        return { valid: true, winnerId: 'player1' };
      }
      if (setsWonByPlayer2 === 2) {
        return { valid: true, winnerId: 'player2' };
      }
    }

    // Match is tied 1-1, check if we need super tiebreak
    if (setsWonByPlayer1 === 1 && setsWonByPlayer2 === 1 && format.final_set_tiebreak) {
      if (!superTiebreak) {
        return { valid: false, requiresSuperTiebreak: true, error: 'Match is tied 1-1, super tiebreak or third set required' };
      }
    }

    return { valid: false, error: 'Match is incomplete' };
  }

  // For single set format
  if (format.number_of_sets === 1) {
    if (sets.length !== 1) {
      return { valid: false, error: 'Single set match requires exactly 1 set' };
    }

    const result = validateSet(sets[0]);
    if (!result.valid) {
      return { valid: false, error: result.error };
    }

    return { valid: true, winnerId: result.winner };
  }

  return { valid: false, error: 'Unsupported match format' };
}

/**
 * Get the match format description for display
 */
export function getMatchFormatDescription(format: LadderMatchFormat): string {
  if (format.type === 'short_sets') {
    const setDesc = `${format.number_of_sets} short ${format.number_of_sets === 1 ? 'set' : 'sets'} (first to ${format.games_per_set} games)`;
    if (format.final_set_tiebreak) {
      return `${setDesc} + super tiebreak (first to ${format.super_tiebreak_points}) if tied`;
    }
    return setDesc;
  }

  if (format.type === 'standard') {
    const setDesc = `Best of ${format.number_of_sets}`;
    if (format.final_set_tiebreak) {
      return `${setDesc} (super tiebreak in final set)`;
    }
    return setDesc;
  }

  if (format.type === 'super_tiebreak_only') {
    return `Super tiebreak (first to ${format.super_tiebreak_points}, win by 2)`;
  }

  return 'Standard match';
}
