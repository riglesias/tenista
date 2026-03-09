// Competition type enums
export type CompetitionType = 'round_robin' | 'playoffs_only' | 'ladder' | 'elimination' | 'swiss';
export type ParticipantType = 'singles' | 'doubles';
export type EliminationFormat = 'single' | 'double' | 'consolation' | 'feed_in_consolation';
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed' | 'cancelled';
export type PositionChangeReason = 'match_win' | 'match_loss' | 'inactivity_penalty' | 'opponent_walkover' | 'admin_adjustment' | 'initial_placement';

// Match format type for ladder competitions
export type MatchFormatType = 'standard' | 'short_sets' | 'super_tiebreak_only';

// Match format configuration for ladder competitions
export interface LadderMatchFormat {
  type: MatchFormatType;
  number_of_sets: 1 | 2 | 3;
  games_per_set: 4 | 6;
  final_set_tiebreak: boolean;
  super_tiebreak_points: 7 | 10;
  tiebreak_at_games?: 3 | 6;
}

// Default match format for Escalerilla (PWCC rules: 2 short sets + super tiebreak)
export const DEFAULT_LADDER_MATCH_FORMAT: LadderMatchFormat = {
  type: 'short_sets',
  number_of_sets: 2,
  games_per_set: 4,
  final_set_tiebreak: true,
  super_tiebreak_points: 10,
  tiebreak_at_games: 3,
};

// Ladder configuration interface
export interface LadderConfig {
  max_challenge_positions: number;
  max_active_outgoing_challenges: number;
  rechallenge_cooldown_days: number;
  challenge_acceptance_deadline_days: number;
  match_completion_deadline_days: number;
  inactivity_threshold_days: number;
  inactivity_position_drop: number;
  match_format?: LadderMatchFormat;
}

// Default ladder configuration
export const DEFAULT_LADDER_CONFIG: LadderConfig = {
  max_challenge_positions: 4,
  max_active_outgoing_challenges: 1,
  rechallenge_cooldown_days: 7,
  challenge_acceptance_deadline_days: 2,
  match_completion_deadline_days: 5,
  inactivity_threshold_days: 7,
  inactivity_position_drop: 2,
};

// Match format configuration for all league types (not just ladder)
export interface MatchFormat {
  number_of_sets: 1 | 2 | 3 | 5;
  final_set_tiebreak?: boolean; // For 2-set format: super tiebreak decider
}

// Default match format for leagues
export const DEFAULT_MATCH_FORMAT: MatchFormat = {
  number_of_sets: 3,
};

export interface Match {
  id: string
  tournament_id: string
  round_number: number
  match_number_in_round: number
  player_a_id: string
  player_b_id: string
  winner_id: string | null
  scores: any // JSON object containing set-by-set scores
  is_auto_advanced: boolean
  status: 'pending' | 'completed' | 'cancelled' | 'forfeit'
  created_at: string
  updated_at: string
}

export interface PlayerMatch {
  id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  match_date: string
  number_of_sets: number
  game_type: 'practice' | 'competitive'
  match_type: 'singles' | 'doubles'
  league_id: string | null
  scores: any // JSON array of sets like [{"player1": 6, "player2": 2}]
  is_verified: boolean
  submitted_by: string
  created_at: string
  updated_at: string
  competition_type: string | null
  playoff_tournament_id: string | null
  edit_count: number
  // New doubles/ladder fields
  team1_id: string | null
  team2_id: string | null
  winner_team_id: string | null
  ladder_challenge_id: string | null
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  rating: number
  created_at: string
  status: string
  auth_user_id: string
  gender: string
  avatar_url?: string
  onboarding_completed: boolean
  updated_at: string
  country_code?: string
  country_name?: string
  phone_country_code?: string
  phone_number?: string
  city_id?: string
  city_name?: string
  state_province?: string
  availability?: any
  nationality_code?: string
  homecourt_id?: string
  available_today?: boolean
  available_today_updated_at?: string
  is_active: boolean
  nationality_name?: string
}

export interface Tournament {
  id: string
  name: string
  start_date: string
  location: string
  draw_size: number
  status: string
  organizer_id: string
  created_at: string
  updated_at: string
}

export interface League {
  id: string
  name: string
  organizer_id: string
  start_date: string
  end_date: string
  max_players: number
  location: string
  is_private: boolean
  category: string
  created_at: string
  updated_at: string
  default_points_win: number
  default_points_loss: number
  city_id: string
  division: string
  min_rating: number
  max_rating: number
  is_active: boolean
  is_free: boolean
  price_cents: number
  has_playoffs: boolean
  image_url: string | null
  organization_id: string | null
  // New competition type fields
  competition_type: CompetitionType
  participant_type: ParticipantType
  ladder_config: LadderConfig | null
  elimination_format: EliminationFormat | null
  // Match format settings for all league types
  match_format: MatchFormat | null
}

export interface LeaguePlayer {
  id: string
  league_id: string
  player_id: string
  points: number
  matches_played: number
  wins: number
  losses: number
  // New doubles/ladder fields
  doubles_team_id: string | null
  ladder_position: number | null
  last_match_date: string | null
}

export interface City {
  id: string
  name: string
  state_province?: string
  country_code: string
  country_name: string
  latitude?: number
  longitude?: number
  is_active?: boolean
  player_count?: number
  created_at: string
  updated_at: string
}

export interface Court {
  id: string
  name: string
  city?: string
  address?: string
  type?: 'indoor' | 'outdoor' | 'covered'
  surface?: 'clay' | 'hard' | 'grass' | 'artificial'
  number_of_courts?: number
  has_lights?: boolean
  is_public?: boolean
  phone?: string
  email?: string
  website?: string
  amenities?: string[]
  created_at: string
  updated_at: string
}

// New tables for competition types

export interface DoublesTeam {
  id: string
  league_id: string
  player1_id: string
  player2_id: string
  team_name: string | null
  combined_rating: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Expanded fields for display
  player1?: Player
  player2?: Player
}

export interface LadderRanking {
  id: string
  league_id: string
  player_id: string | null
  doubles_team_id: string | null
  position: number
  previous_position: number | null
  last_match_date: string | null
  last_activity_check: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Expanded fields for display
  player?: Player
  doubles_team?: DoublesTeam
}

export interface LadderChallenge {
  id: string
  league_id: string
  challenger_player_id: string | null
  challenger_team_id: string | null
  challenger_position: number
  challenged_player_id: string | null
  challenged_team_id: string | null
  challenged_position: number
  status: ChallengeStatus
  acceptance_deadline: string
  match_deadline: string | null
  player_match_id: string | null
  winner_player_id: string | null
  winner_team_id: string | null
  new_challenger_position: number | null
  new_challenged_position: number | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  updated_at: string
  // Expanded fields for display
  challenger_player?: Player
  challenged_player?: Player
  challenger_team?: DoublesTeam
  challenged_team?: DoublesTeam
}

export interface LadderPositionHistory {
  id: string
  league_id: string
  player_id: string | null
  doubles_team_id: string | null
  old_position: number
  new_position: number
  change_reason: PositionChangeReason
  challenge_id: string | null
  created_at: string
  // Expanded fields for display
  player?: Player
  doubles_team?: DoublesTeam
}

export interface Organization {
  id: string
  name: string
  created_by: string | null
  join_code: string | null
  image_url: string | null
  court_id: string | null
  created_at: string
}

export interface OrganizationPlayer {
  organization_id: string
  player_id: string
  added_at: string
  // Expanded fields for display
  player?: Player
}

export interface MatchReport {
  id: string
  player_match_id: string
  reported_by: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  admin_notes: string | null
  reviewed_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface RatingChangeRequest {
  id: string
  player_id: string
  current_rating: number
  requested_rating: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}
