import { z } from 'zod';

// Competition type enums
export const CompetitionTypeEnum = z.enum(['round_robin', 'playoffs_only', 'ladder', 'elimination']);
export type CompetitionType = z.infer<typeof CompetitionTypeEnum>;

export const ParticipantTypeEnum = z.enum(['singles', 'doubles']);
export type ParticipantType = z.infer<typeof ParticipantTypeEnum>;

// Match format type enum for ladder competitions
export const MatchFormatTypeEnum = z.enum(['standard', 'short_sets', 'super_tiebreak_only']);
export type MatchFormatType = z.infer<typeof MatchFormatTypeEnum>;

// Match format configuration for ladder competitions
export const LadderMatchFormatSchema = z.object({
  type: MatchFormatTypeEnum.default('standard'),
  number_of_sets: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  games_per_set: z.union([z.literal(4), z.literal(6)]).default(4), // 4 for short sets, 6 for standard
  final_set_tiebreak: z.boolean().default(true), // Super tiebreak as deciding set
  super_tiebreak_points: z.union([z.literal(7), z.literal(10)]).default(10), // 10 for super tiebreak, 7 for standard
  tiebreak_at_games: z.union([z.literal(3), z.literal(6)]).optional(), // 3 for short sets (3-3), 6 for standard (6-6)
});
export type LadderMatchFormat = z.infer<typeof LadderMatchFormatSchema>;

// Default match format for Escalerilla (PWCC rules: 2 short sets + super tiebreak)
export const DEFAULT_LADDER_MATCH_FORMAT: LadderMatchFormat = {
  type: 'short_sets',
  number_of_sets: 2,
  games_per_set: 4,
  final_set_tiebreak: true,
  super_tiebreak_points: 10,
  tiebreak_at_games: 3,
};

// Standard match format (traditional tennis)
export const STANDARD_MATCH_FORMAT: LadderMatchFormat = {
  type: 'standard',
  number_of_sets: 3,
  games_per_set: 6,
  final_set_tiebreak: true,
  super_tiebreak_points: 10,
  tiebreak_at_games: 6,
};

// Ladder configuration schema
export const LadderConfigSchema = z.object({
  max_challenge_positions: z.number().int().min(1).max(10).default(4),
  max_active_outgoing_challenges: z.number().int().min(1).max(5).default(1),
  rechallenge_cooldown_days: z.number().int().min(0).max(30).default(7),
  challenge_acceptance_deadline_days: z.number().int().min(1).max(14).default(2),
  match_completion_deadline_days: z.number().int().min(1).max(30).default(5),
  inactivity_threshold_days: z.number().int().min(1).max(60).default(7),
  inactivity_position_drop: z.number().int().min(1).max(10).default(2),
  // Match format configuration
  match_format: LadderMatchFormatSchema.optional(),
});
export type LadderConfig = z.infer<typeof LadderConfigSchema>;

// Default ladder configuration
export const DEFAULT_LADDER_CONFIG: LadderConfig = {
  max_challenge_positions: 4,
  max_active_outgoing_challenges: 1,
  rechallenge_cooldown_days: 7,
  challenge_acceptance_deadline_days: 2,
  match_completion_deadline_days: 5,
  inactivity_threshold_days: 7,
  inactivity_position_drop: 2,
  match_format: DEFAULT_LADDER_MATCH_FORMAT,
};

// Match format configuration for all league types (not just ladder)
export const MatchFormatSchema = z.object({
  number_of_sets: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5)]).default(3),
  final_set_tiebreak: z.boolean().optional(), // For 2-set format: super tiebreak decider
});
export type MatchFormat = z.infer<typeof MatchFormatSchema>;

// Default match format for leagues
export const DEFAULT_MATCH_FORMAT: MatchFormat = {
  number_of_sets: 3,
};

// Tournament result types for completed competition cards
export const TournamentResultTypeEnum = z.enum(['champion', 'finalist', 'semifinalist', 'quarterfinalist', 'round']);
export type TournamentResultType = z.infer<typeof TournamentResultTypeEnum>;

export const TournamentResultSchema = z.object({
  type: TournamentResultTypeEnum,
  roundNumber: z.number().int().positive().optional(),
});
export type TournamentResult = z.infer<typeof TournamentResultSchema>;

// Base schema for the 'leagues' table
export const LeagueSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  name: z.string(),
  city_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  max_players: z.number().int().nullable(),
  min_rating: z.number().nullable(),
  max_rating: z.number().nullable(),
  is_active: z.boolean().nullable(),
  is_free: z.boolean().nullable(),
  default_points_win: z.number().int().nullable(),
  default_points_loss: z.number().int().nullable(),
  division: z.string().nullable(),
  price_cents: z.number().nullable(),
  organizer_id: z.string().uuid().nullable(),
  location: z.string().nullable(),
  is_private: z.boolean().nullable(),
  updated_at: z.string().nullable(),
  category: z.string().nullable(),
  has_playoffs: z.boolean().nullable(),
  image_url: z.string().nullable(),
  // New competition type fields
  competition_type: CompetitionTypeEnum.nullable().default('round_robin'),
  participant_type: ParticipantTypeEnum.nullable().default('singles'),
  ladder_config: LadderConfigSchema.nullable(),
  elimination_format: z.enum(['single', 'feed_in_consolation']).nullable().optional(),
  // Match format settings for all league types
  match_format: MatchFormatSchema.nullable().default(DEFAULT_MATCH_FORMAT),
  // Club linkage
  organization_id: z.string().uuid().nullable().optional(),
});
export type League = z.infer<typeof LeagueSchema>;


// League player status enum
export const LeaguePlayerStatusEnum = z.enum(['active', 'retired']);
export type LeaguePlayerStatus = z.infer<typeof LeaguePlayerStatusEnum>;

// Base schema for the 'league_players' table
export const LeaguePlayerSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid().nullable(),
  player_id: z.string().uuid().nullable(),
  points: z.number().int().nullable(),
  matches_played: z.number().int().nullable(),
  wins: z.number().int().nullable(),
  losses: z.number().int().nullable(),
  // New doubles/ladder fields
  doubles_team_id: z.string().uuid().nullable().optional(),
  ladder_position: z.number().int().nullable().optional(),
  last_match_date: z.string().nullable().optional(),
  // Status field for retirement
  status: LeaguePlayerStatusEnum.default('active').optional(),
});
export type LeaguePlayer = z.infer<typeof LeaguePlayerSchema>;

// Schema for a league with additional stats
export const LeagueWithStatsSchema = LeagueSchema.extend({
  player_count: z.number().int(),
  user_is_member: z.boolean(),
  user_is_retired: z.boolean().optional(),
  organization_name: z.string().nullable().optional(),
});
export const LeaguesWithStatsSchema = z.array(LeagueWithStatsSchema);
export type LeagueWithStats = z.infer<typeof LeagueWithStatsSchema>;


// Schema for the player data nested in standings
const StandingPlayerSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  rating: z.number().nullable(),
  nationality_code: z.string().nullable(),
  is_active: z.boolean().nullable(),
});

// Schema for league standings
export const LeagueStandingSchema = z.object({
  player_id: z.string().uuid(),
  player_name: z.string(),
  player_rating: z.number().nullable(),
  nationality_code: z.string().nullable(),
  points: z.number().int(),
  matches_played: z.number().int(),
  wins: z.number().int(),
  losses: z.number().int(),
  position: z.number().int(),
});
export const LeagueStandingsSchema = z.array(LeagueStandingSchema);
export type LeagueStanding = z.infer<typeof LeagueStandingSchema>;


// Schema for the raw data from getLeagueStandings query (single league)
export const RawLeagueStandingSchema = z.object({
  player_id: z.string().uuid().nullable(),
  points: z.number().int().nullable(),
  matches_played: z.number().int().nullable(),
  wins: z.number().int().nullable(),
  losses: z.number().int().nullable(),
  player: StandingPlayerSchema.nullable(),
});

// Schema for the raw data from getMultipleLeagueStandings query
export const RawMultipleLeagueStandingSchema = RawLeagueStandingSchema.extend({
  league_id: z.string().uuid().nullable(),
});

export const RawLeagueStandingsSchema = z.array(RawLeagueStandingSchema);
export const RawMultipleLeagueStandingsSchema = z.array(RawMultipleLeagueStandingSchema);


// Schema for a user's specific league details
export const UserLeagueSchema = z.object({
  league: LeagueSchema,
  membership: LeaguePlayerSchema,
  user_position: z.number().int(),
  total_players: z.number().int(),
  tournament_result: TournamentResultSchema.nullable().optional(),
});
export const UserLeaguesSchema = z.array(UserLeagueSchema);
export type UserLeague = z.infer<typeof UserLeagueSchema>;


// Schema for raw data from getUserLeagues query
export const RawUserLeagueSchema = LeaguePlayerSchema.extend({
  league: LeagueSchema,
});
export const RawUserLeaguesSchema = z.array(RawUserLeagueSchema);


// Helper function to determine division based on rating
export function getDivisionFromRating(rating: number): string {
  if (rating >= 5.0) return 'division_1'
  if (rating >= 4.0) return 'division_2'
  if (rating >= 3.0) return 'division_3'
  return 'division_4'
}

// Helper function to get division display info
export function getDivisionInfo(division: string) {
  const divisions = {
    division_1: { name: 'Division 1', range: 'NTRP 5.0+', color: '#EF4444' },
    division_2: { name: 'Division 2', range: 'NTRP 4.0-4.5', color: '#8B5CF6' },
    division_3: { name: 'Division 3', range: 'NTRP 3.0-3.5', color: '#3B82F6' },
    division_4: { name: 'Division 4', range: 'NTRP 1.0-2.5', color: '#10B981' }
  }
  return divisions[division as keyof typeof divisions] || divisions.division_4
}

// Convert a league's general MatchFormat into a LadderMatchFormat
// Priority: ladder_config.match_format > league.match_format (via this fn) > DEFAULT_LADDER_MATCH_FORMAT
export function matchFormatToLadderFormat(format: MatchFormat): LadderMatchFormat {
  const sets = format.number_of_sets

  if (sets === 1) {
    return {
      type: 'standard',
      number_of_sets: 1,
      games_per_set: 6,
      final_set_tiebreak: false,
      super_tiebreak_points: 10,
      tiebreak_at_games: 6,
    }
  }

  if (sets === 2) {
    return {
      type: 'standard',
      number_of_sets: 2,
      games_per_set: 6,
      final_set_tiebreak: true,
      super_tiebreak_points: 10,
      tiebreak_at_games: 6,
    }
  }

  // 3 or 5 sets → best of 3 standard
  return {
    type: 'standard',
    number_of_sets: 3,
    games_per_set: 6,
    final_set_tiebreak: false,
    super_tiebreak_points: 10,
    tiebreak_at_games: 6,
  }
}

// Helper function to check if player qualifies for a league based on rating
export function isPlayerEligibleForLeague(playerRating: number, league: League): boolean {
  if (!league.min_rating) return true
  
  const minRating = parseFloat(league.min_rating.toString())
  const maxRating = league.max_rating ? parseFloat(league.max_rating.toString()) : Infinity
  
  return playerRating >= minRating && playerRating <= maxRating
} 