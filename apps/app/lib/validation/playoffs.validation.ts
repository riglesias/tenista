import { z } from 'zod';

// Status enums
export const PlayoffTournamentStatusEnum = z.enum(['not_started', 'in_progress', 'completed', 'suspended']);
export const PlayoffRoundStatusEnum = z.enum(['not_started', 'in_progress', 'completed']);
export const PlayoffMatchStatusEnum = z.enum(['pending', 'completed', 'bye']);

// Bracket type enums for feed-in consolation support
export const BracketTypeEnum = z.enum(['main', 'feed_in_consolation']);
export type BracketType = z.infer<typeof BracketTypeEnum>;

export const BracketSectionEnum = z.enum(['main', 'consolation', 'feed_in', 'backdraw']);
export type BracketSection = z.infer<typeof BracketSectionEnum>;

export const ParticipantSectionEnum = z.enum(['main', 'consolation', 'feed_in', 'backdraw', 'complete']);
export type ParticipantSection = z.infer<typeof ParticipantSectionEnum>;

// Base schema for the 'playoff_tournaments' table
export const PlayoffTournamentSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  status: PlayoffTournamentStatusEnum,
  total_rounds: z.number().int().positive(),
  qualifying_players_count: z.number().int().positive(),
  start_date: z.string(),
  bracket_type: BracketTypeEnum.default('main'),
  bracket_data: z.object({
    rounds: z.array(z.object({
      roundNumber: z.number().int().positive(),
      roundName: z.string(),
      matches: z.array(z.object({
        matchNumber: z.number().int().positive(),
        player1: z.object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          seedPosition: z.number().int().positive(),
          leaguePosition: z.number().int().positive(),
          leaguePoints: z.number().int().min(0),
          rating: z.number().nullable(),
          country_code: z.string().nullable(),
        }).nullable(),
        player2: z.object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          seedPosition: z.number().int().positive(),
          leaguePosition: z.number().int().positive(),
          leaguePoints: z.number().int().min(0),
          rating: z.number().nullable(),
          country_code: z.string().nullable(),
        }).nullable(),
        winner: z.object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          seedPosition: z.number().int().positive(),
          leaguePosition: z.number().int().positive(),
          leaguePoints: z.number().int().min(0),
          rating: z.number().nullable(),
          country_code: z.string().nullable(),
        }).nullable(),
        isBye: z.boolean(),
        status: PlayoffMatchStatusEnum,
      })),
    })),
    totalRounds: z.number().int().positive(),
    participantCount: z.number().int().positive(),
  }).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type PlayoffTournament = z.infer<typeof PlayoffTournamentSchema>;

// Schema for the 'playoff_participants' table
export const PlayoffParticipantSchema = z.object({
  id: z.string().uuid(),
  playoff_tournament_id: z.string().uuid(),
  player_id: z.string().uuid(),
  seed_position: z.number().int().positive(),
  league_position: z.number().int().positive(),
  league_points: z.number().int().min(0),
  matches_played: z.number().int().min(0).default(0),
  current_section: ParticipantSectionEnum.default('main'),
  created_at: z.string().nullable(),
});
export type PlayoffParticipant = z.infer<typeof PlayoffParticipantSchema>;

// Schema for the 'playoff_rounds' table
export const PlayoffRoundSchema = z.object({
  id: z.string().uuid(),
  playoff_tournament_id: z.string().uuid(),
  round_number: z.number().int().positive(),
  round_name: z.string(),
  bracket_section: BracketSectionEnum.default('main'),
  status: PlayoffRoundStatusEnum,
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type PlayoffRound = z.infer<typeof PlayoffRoundSchema>;

// Schema for the 'playoff_matches' table
export const PlayoffMatchSchema = z.object({
  id: z.string().uuid(),
  playoff_round_id: z.string().uuid(),
  match_number: z.number().int().positive(),
  player1_id: z.string().uuid().nullable(),
  player2_id: z.string().uuid().nullable(),
  winner_id: z.string().uuid().nullable(),
  player_match_id: z.string().uuid().nullable(),
  is_bye: z.boolean().nullable(),
  bracket_section: BracketSectionEnum.default('main'),
  source_match_id: z.string().uuid().nullable(),
  status: PlayoffMatchStatusEnum,
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type PlayoffMatch = z.infer<typeof PlayoffMatchSchema>;

// Schema for qualified player data (league mode)
export const QualifiedPlayerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  seedPosition: z.number().int().positive(),
  leaguePosition: z.number().int().positive(),
  leaguePoints: z.number().int().min(0),
  rating: z.number().nullable(),
  country_code: z.string().nullable(),
});
export type QualifiedPlayer = z.infer<typeof QualifiedPlayerSchema>;

// Schema for standalone tournament qualified player (seeded by yearly W-L record)
export const StandaloneQualifiedPlayerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  seedPosition: z.number().int().positive(),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  winPercentage: z.number().min(0).max(100),
  rating: z.number().nullable(),
  nationality_code: z.string().nullable(),
});
export type StandaloneQualifiedPlayer = z.infer<typeof StandaloneQualifiedPlayerSchema>;

// Schema for standalone qualification result
export const StandaloneQualificationResultSchema = z.object({
  qualifiedPlayers: z.array(StandaloneQualifiedPlayerSchema),
  seedingCriteriaApplied: z.array(z.string()),
});
export type StandaloneQualificationResult = z.infer<typeof StandaloneQualificationResultSchema>;

// Schema for bracket data structure
export const BracketDataSchema = z.object({
  rounds: z.array(z.object({
    roundNumber: z.number().int().positive(),
    roundName: z.string(),
    matches: z.array(z.object({
      matchNumber: z.number().int().positive(),
      player1: QualifiedPlayerSchema.nullable(),
      player2: QualifiedPlayerSchema.nullable(),
      winner: QualifiedPlayerSchema.nullable(),
      isBye: z.boolean(),
      status: PlayoffMatchStatusEnum,
    })),
  })),
  totalRounds: z.number().int().positive(),
  participantCount: z.number().int().positive(),
});
export type BracketData = z.infer<typeof BracketDataSchema>;

// Schema for section-specific bracket data (used in feed-in consolation)
export const SectionBracketDataSchema = z.object({
  rounds: z.array(z.object({
    roundNumber: z.number().int().positive(),
    roundName: z.string(),
    bracketSection: BracketSectionEnum,
    matches: z.array(z.object({
      matchNumber: z.number().int().positive(),
      player1: QualifiedPlayerSchema.nullable(),
      player2: QualifiedPlayerSchema.nullable(),
      winner: QualifiedPlayerSchema.nullable(),
      isBye: z.boolean(),
      status: PlayoffMatchStatusEnum,
      bracketSection: BracketSectionEnum,
      sourceMatchId: z.string().uuid().nullable(),
    })),
  })),
  totalRounds: z.number().int().positive(),
});
export type SectionBracketData = z.infer<typeof SectionBracketDataSchema>;

// Schema for loser routing rules
export const LoserRoutingRuleSchema = z.object({
  fromSection: BracketSectionEnum,
  fromRound: z.number().int().positive(),
  toSection: BracketSectionEnum,
  toRound: z.number().int().positive(),
  // Position in the target match (which slot)
  targetPosition: z.enum(['player1', 'player2']).optional(),
});
export type LoserRoutingRule = z.infer<typeof LoserRoutingRuleSchema>;

// Schema for feed-in consolation bracket data
export const FeedInBracketDataSchema = z.object({
  bracketType: z.literal('feed_in_consolation'),
  sections: z.object({
    main: SectionBracketDataSchema,
    consolation: SectionBracketDataSchema,
    feedIn: SectionBracketDataSchema,
    backdraw: SectionBracketDataSchema,
  }),
  // Track matches played per player ID
  playerMatchCount: z.record(z.string(), z.number()),
  // Routing rules for losers
  routingRules: z.array(LoserRoutingRuleSchema),
  participantCount: z.number().int().positive(),
  guaranteedMatches: z.number().int().positive().default(3),
});
export type FeedInBracketData = z.infer<typeof FeedInBracketDataSchema>;

// Union type for bracket data (standard or feed-in)
export const TournamentBracketDataSchema = z.union([
  BracketDataSchema,
  FeedInBracketDataSchema,
]);
export type TournamentBracketData = z.infer<typeof TournamentBracketDataSchema>;

// Schema for bracket round
export const BracketRoundSchema = z.object({
  roundNumber: z.number().int().positive(),
  roundName: z.string(),
  matches: z.array(z.object({
    matchNumber: z.number().int().positive(),
    player1: QualifiedPlayerSchema.nullable(),
    player2: QualifiedPlayerSchema.nullable(),
    winner: QualifiedPlayerSchema.nullable(),
    isBye: z.boolean(),
    status: PlayoffMatchStatusEnum,
  })),
});
export type BracketRound = z.infer<typeof BracketRoundSchema>;

// Schema for bracket match
export const BracketMatchSchema = z.object({
  matchNumber: z.number().int().positive(),
  player1: QualifiedPlayerSchema.nullable(),
  player2: QualifiedPlayerSchema.nullable(),
  winner: QualifiedPlayerSchema.nullable(),
  isBye: z.boolean(),
  status: PlayoffMatchStatusEnum,
});
export type BracketMatch = z.infer<typeof BracketMatchSchema>;

// Schema for creating a playoff tournament
export const CreatePlayoffTournamentSchema = z.object({
  league_id: z.string().uuid(),
  qualifying_players_count: z.number().int().positive(),
  bracket_type: BracketTypeEnum.optional(),
  start_date: z.string().optional(),
});
export type CreatePlayoffTournament = z.infer<typeof CreatePlayoffTournamentSchema>;

// Schema for updating playoff tournament status
export const UpdatePlayoffTournamentStatusSchema = z.object({
  tournament_id: z.string().uuid(),
  status: PlayoffTournamentStatusEnum,
});
export type UpdatePlayoffTournamentStatus = z.infer<typeof UpdatePlayoffTournamentStatusSchema>;

// Schema for submitting playoff match result
export const SubmitPlayoffMatchResultSchema = z.object({
  playoff_match_id: z.string().uuid(),
  winner_id: z.string().uuid(),
  player_match_id: z.string().uuid(),
});
export type SubmitPlayoffMatchResult = z.infer<typeof SubmitPlayoffMatchResultSchema>;

// Schema for playoff tournament with participants
export const PlayoffTournamentWithParticipantsSchema = PlayoffTournamentSchema.extend({
  participants: z.array(PlayoffParticipantSchema.extend({
    player: z.object({
      id: z.string().uuid(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      rating: z.number().nullable(),
      country_code: z.string().nullable(),
    }),
  })),
});
export type PlayoffTournamentWithParticipants = z.infer<typeof PlayoffTournamentWithParticipantsSchema>;

// Schema for playoff tournament with full data
export const PlayoffTournamentWithFullDataSchema = PlayoffTournamentSchema.extend({
  participants: z.array(PlayoffParticipantSchema.extend({
    player: z.object({
      id: z.string().uuid(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      rating: z.number().nullable(),
      country_code: z.string().nullable(),
    }),
  })),
  rounds: z.array(PlayoffRoundSchema.extend({
    matches: z.array(PlayoffMatchSchema.extend({
      player1: z.object({
        id: z.string().uuid(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        rating: z.number().nullable(),
        country_code: z.string().nullable(),
      }).nullable(),
      player2: z.object({
        id: z.string().uuid(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        rating: z.number().nullable(),
        country_code: z.string().nullable(),
      }).nullable(),
      winner: z.object({
        id: z.string().uuid(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        rating: z.number().nullable(),
        country_code: z.string().nullable(),
      }).nullable(),
    })),
  })),
});
export type PlayoffTournamentWithFullData = z.infer<typeof PlayoffTournamentWithFullDataSchema>;

// Arrays
export const PlayoffTournamentsSchema = z.array(PlayoffTournamentSchema);
export const PlayoffParticipantsSchema = z.array(PlayoffParticipantSchema);
export const PlayoffRoundsSchema = z.array(PlayoffRoundSchema);
export const PlayoffMatchesSchema = z.array(PlayoffMatchSchema);
export const QualifiedPlayersSchema = z.array(QualifiedPlayerSchema);

// Helper function to get round name based on round number and total rounds
export function getRoundName(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) {
    return 'Final';
  }
  if (roundNumber === totalRounds - 1) {
    return 'Semifinal';
  }
  if (roundNumber === totalRounds - 2) {
    return 'Quarterfinal';
  }
  return `Round ${roundNumber}`;
}

// Helper function to calculate bracket size (next power of 2)
export function calculateBracketSize(playerCount: number): number {
  return Math.pow(2, Math.ceil(Math.log2(playerCount)));
}

// Helper function to calculate total rounds
export function calculateTotalRounds(bracketSize: number): number {
  return Math.log2(bracketSize);
}

// Helper function to calculate bye count
export function calculateByeCount(playerCount: number): number {
  const bracketSize = calculateBracketSize(playerCount);
  return bracketSize - playerCount;
}

// Helper function to validate playoff creation
export function validatePlayoffCreation(league: { end_date: string; has_playoffs: boolean | null }, playerCount: number): string | null {
  if (!league.has_playoffs) {
    return 'League does not have playoffs enabled';
  }
  
  if (playerCount < 2) {
    return 'At least 2 players are required for playoffs';
  }
  
  const today = new Date();
  const leagueEndDate = new Date(league.end_date);
  
  if (leagueEndDate > today) {
    return 'Playoffs cannot start before the league end date';
  }
  
  return null;
}

// Helper type for playoff match rows used by getTournamentResultForPlayer
export interface PlayoffMatchRow {
  winner_id: string | null;
  player1_id: string | null;
  player2_id: string | null;
  status: string;
  round_number: number;
  round_name: string;
}

// Helper function to determine a player's tournament result from playoff_matches rows
// Uses actual completed match data instead of the static bracket_data snapshot
export function getTournamentResultForPlayer(
  playerMatches: PlayoffMatchRow[],
  playerId: string,
  totalRounds: number
): { type: 'champion' | 'finalist' | 'semifinalist' | 'quarterfinalist' | 'round'; roundNumber?: number } | null {
  if (!playerMatches || playerMatches.length === 0) return null;

  // Filter to matches where this player participated (excluding byes)
  const myMatches = playerMatches.filter(
    m => m.player1_id === playerId || m.player2_id === playerId
  );

  if (myMatches.length === 0) return null;

  // Find the highest round the player participated in
  const highestRoundMatch = myMatches.reduce((best, m) =>
    m.round_number > best.round_number ? m : best
  , myMatches[0]);

  // If the match isn't completed yet, bracket is still in progress
  if (highestRoundMatch.status !== 'completed') return null;

  const roundNum = highestRoundMatch.round_number;
  const won = highestRoundMatch.winner_id === playerId;

  if (won && roundNum === totalRounds) return { type: 'champion' };
  if (!won && roundNum === totalRounds) return { type: 'finalist' };

  // Player lost before the final
  if (!won) {
    const roundsFromFinal = totalRounds - roundNum;
    if (roundsFromFinal === 1) return { type: 'semifinalist' };
    if (roundsFromFinal === 2) return { type: 'quarterfinalist' };
    return { type: 'round', roundNumber: roundNum };
  }

  // Player won their last match but it's not the final — bracket still in progress
  return null;
}

// Helper function to validate playoff match submission
export function validatePlayoffMatchSubmission(match: PlayoffMatch, submittingPlayerId: string): string | null {
  if (match.status !== 'pending') {
    return 'Match is not in pending status';
  }
  
  if (match.is_bye) {
    return 'Cannot submit result for bye match';
  }
  
  if (match.player1_id !== submittingPlayerId && match.player2_id !== submittingPlayerId) {
    return 'Only participating players can submit match results';
  }
  
  return null;
}