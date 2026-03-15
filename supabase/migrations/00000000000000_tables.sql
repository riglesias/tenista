-- Tenista: Initial Schema Migration
-- Generated from production Supabase database
-- Project ID: zktbpqsqocblwjhcezum

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================
-- Helper Functions (no table references)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_province text,
  country_code varchar NOT NULL,
  country_name text NOT NULL,
  latitude numeric,
  longitude numeric,
  is_active boolean DEFAULT true,
  player_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cities_pkey PRIMARY KEY (id),
  CONSTRAINT cities_unique_name_country_state UNIQUE (state_province, name, country_code)
);

CREATE TABLE public.courts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid NOT NULL,
  address text,
  court_type text DEFAULT 'outdoor'::text,
  surface_type text DEFAULT 'hard'::text,
  number_of_courts integer DEFAULT 1,
  has_lights boolean DEFAULT false,
  is_public boolean DEFAULT true,
  contact_info jsonb DEFAULT '{}'::jsonb,
  amenities text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  operating_hours jsonb DEFAULT '{}'::jsonb,
  pricing jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  CONSTRAINT courts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name text,
  last_name text,
  rating numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text,
  auth_user_id uuid,
  gender text,
  avatar_url text,
  onboarding_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  country_code varchar,
  country_name text,
  phone_country_code varchar,
  phone_number varchar,
  city_id uuid,
  city_name text,
  state_province text,
  availability jsonb DEFAULT '{}'::jsonb,
  nationality_code varchar,
  homecourt_id uuid,
  available_today boolean DEFAULT false,
  available_today_updated_at timestamptz,
  is_active boolean DEFAULT true,
  nationality_name text,
  play_now_notifications_enabled boolean DEFAULT false,
  match_result_notifications_enabled boolean DEFAULT true,
  CONSTRAINT players_pkey PRIMARY KEY (id),
  CONSTRAINT players_auth_user_id_unique UNIQUE (auth_user_id),
  CONSTRAINT players_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, NULL::text])))
);

CREATE TABLE public.admin_users (
  id uuid NOT NULL,
  role text NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'league_admin'::text, 'support'::text])))
);

CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
);

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  join_code text,
  image_url text,
  court_id uuid,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.organization_members (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_pkey PRIMARY KEY (organization_id, user_id),
  CONSTRAINT organization_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);

CREATE TABLE public.organization_players (
  organization_id uuid NOT NULL,
  player_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_players_pkey PRIMARY KEY (player_id, organization_id)
);

CREATE TABLE public.leagues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organizer_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  max_players integer NOT NULL,
  location text,
  is_private boolean DEFAULT false,
  category jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  default_points_win integer DEFAULT 1,
  default_points_loss integer DEFAULT 0,
  city_id uuid,
  division text,
  min_rating numeric,
  max_rating numeric,
  is_active boolean DEFAULT true,
  is_free boolean DEFAULT true,
  price_cents integer DEFAULT 0,
  has_playoffs boolean DEFAULT false,
  competition_type text DEFAULT 'round_robin'::text,
  participant_type text DEFAULT 'singles'::text,
  ladder_config jsonb,
  image_url text,
  elimination_format text DEFAULT 'single'::text,
  active_player_count integer DEFAULT 0,
  match_format jsonb DEFAULT '{"number_of_sets": 3}'::jsonb,
  organization_id uuid,
  CONSTRAINT leagues_pkey PRIMARY KEY (id),
  CONSTRAINT leagues_competition_type_check CHECK ((competition_type = ANY (ARRAY['round_robin'::text, 'playoffs_only'::text, 'ladder'::text, 'elimination'::text, 'swiss'::text]))),
  CONSTRAINT leagues_division_check CHECK ((division = ANY (ARRAY['division_1'::text, 'division_2'::text, 'division_3'::text, 'division_4'::text, 'open'::text, 'beginner'::text, 'intermediate'::text, 'advanced'::text]))),
  CONSTRAINT leagues_elimination_format_check CHECK ((elimination_format = ANY (ARRAY['single'::text, 'double'::text, 'consolation'::text, 'feed_in_consolation'::text]))),
  CONSTRAINT leagues_participant_type_check CHECK ((participant_type = ANY (ARRAY['singles'::text, 'doubles'::text])))
);

CREATE TABLE public.league_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid,
  player_id uuid,
  points integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  doubles_team_id uuid,
  ladder_position integer,
  last_match_date timestamptz,
  status text DEFAULT 'active'::text,
  CONSTRAINT league_players_pkey PRIMARY KEY (id),
  CONSTRAINT unique_league_player UNIQUE (league_id, player_id),
  CONSTRAINT check_non_negative_losses CHECK ((losses >= 0)),
  CONSTRAINT check_non_negative_matches CHECK ((matches_played >= 0)),
  CONSTRAINT check_non_negative_points CHECK ((points >= 0)),
  CONSTRAINT check_non_negative_wins CHECK ((wins >= 0)),
  CONSTRAINT check_reasonable_losses CHECK ((losses <= matches_played)),
  CONSTRAINT check_reasonable_matches CHECK ((matches_played <= 1000)),
  CONSTRAINT check_reasonable_wins CHECK ((wins <= matches_played)),
  CONSTRAINT check_stats_consistency CHECK (((wins + losses) = matches_played)),
  CONSTRAINT league_players_status_check CHECK ((status = ANY (ARRAY['active'::text, 'retired'::text])))
);

CREATE TABLE public.league_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid,
  player1_id uuid NOT NULL,
  player2_id uuid NOT NULL,
  winner_id uuid,
  score jsonb,
  status text DEFAULT 'scheduled'::text,
  played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  match_type text,
  game_type text,
  number_of_sets integer,
  points_winner integer,
  points_loser integer,
  CONSTRAINT league_matches_pkey PRIMARY KEY (id),
  CONSTRAINT league_matches_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text])))
);

CREATE TABLE public.tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  location text,
  draw_size integer NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  organizer_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  bracket_type text NOT NULL DEFAULT 'main'::text,
  CONSTRAINT tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT tournaments_bracket_type_check CHECK ((bracket_type = ANY (ARRAY['main'::text, 'feed_in_consolation'::text])))
);

CREATE TABLE public.tournament_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  player_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'active'::text,
  CONSTRAINT tournament_participants_pkey PRIMARY KEY (id)
);

CREATE TABLE public.bracket_seeds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  player_id uuid,
  seed_number integer NOT NULL,
  is_bye boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT bracket_seeds_pkey PRIMARY KEY (id),
  CONSTRAINT unique_tournament_seed_number UNIQUE (tournament_id, seed_number)
);

CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  round_number integer NOT NULL,
  match_number_in_round integer NOT NULL,
  player_a_id uuid,
  player_b_id uuid,
  winner_id uuid,
  scores text,
  is_auto_advanced boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_scheduling'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  bracket_section text NOT NULL DEFAULT 'main'::text,
  source_match_id uuid,
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT unique_tournament_match_identifier UNIQUE (round_number, match_number_in_round, tournament_id),
  CONSTRAINT matches_bracket_section_check CHECK ((bracket_section = ANY (ARRAY['main'::text, 'consolation'::text, 'feed_in'::text, 'backdraw'::text])))
);

CREATE TABLE public.doubles_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL,
  player1_id uuid NOT NULL,
  player2_id uuid NOT NULL,
  team_name text,
  combined_rating numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT doubles_teams_pkey PRIMARY KEY (id),
  CONSTRAINT doubles_teams_player1_unique UNIQUE (player1_id, league_id),
  CONSTRAINT doubles_teams_player2_unique UNIQUE (league_id, player2_id),
  CONSTRAINT doubles_teams_player_order CHECK ((player1_id < player2_id))
);

CREATE TABLE public.ladder_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL,
  player_id uuid,
  doubles_team_id uuid,
  position integer NOT NULL,
  previous_position integer,
  last_match_date timestamptz,
  last_activity_check timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  CONSTRAINT ladder_rankings_pkey PRIMARY KEY (id),
  CONSTRAINT unique_league_player_ranking UNIQUE (league_id, player_id),
  CONSTRAINT ladder_rankings_participant_check CHECK ((((player_id IS NOT NULL) AND (doubles_team_id IS NULL)) OR ((player_id IS NULL) AND (doubles_team_id IS NOT NULL)))),
  CONSTRAINT ladder_rankings_position_check CHECK (("position" > 0))
);

CREATE TABLE public.ladder_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL,
  challenger_player_id uuid,
  challenger_team_id uuid,
  challenger_position integer NOT NULL,
  challenged_player_id uuid,
  challenged_team_id uuid,
  challenged_position integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  acceptance_deadline timestamptz NOT NULL,
  match_deadline timestamptz,
  player_match_id uuid,
  winner_player_id uuid,
  winner_team_id uuid,
  new_challenger_position integer,
  new_challenged_position integer,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT ladder_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT ladder_challenges_challenged_check CHECK ((((challenged_player_id IS NOT NULL) AND (challenged_team_id IS NULL)) OR ((challenged_player_id IS NULL) AND (challenged_team_id IS NOT NULL)))),
  CONSTRAINT ladder_challenges_challenger_check CHECK ((((challenger_player_id IS NOT NULL) AND (challenger_team_id IS NULL)) OR ((challenger_player_id IS NULL) AND (challenger_team_id IS NOT NULL)))),
  CONSTRAINT ladder_challenges_position_order CHECK ((challenger_position > challenged_position)),
  CONSTRAINT ladder_challenges_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'expired'::text, 'completed'::text, 'cancelled'::text])))
);

CREATE TABLE public.ladder_position_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL,
  player_id uuid,
  doubles_team_id uuid,
  old_position integer NOT NULL,
  new_position integer NOT NULL,
  change_reason text NOT NULL,
  challenge_id uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT ladder_position_history_pkey PRIMARY KEY (id),
  CONSTRAINT ladder_position_history_change_reason_check CHECK ((change_reason = ANY (ARRAY['match_win'::text, 'match_loss'::text, 'inactivity_penalty'::text, 'opponent_walkover'::text, 'admin_adjustment'::text, 'initial_placement'::text]))),
  CONSTRAINT ladder_position_history_participant_check CHECK ((((player_id IS NOT NULL) AND (doubles_team_id IS NULL)) OR ((player_id IS NULL) AND (doubles_team_id IS NOT NULL))))
);

CREATE TABLE public.player_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player1_id uuid,
  player2_id uuid,
  winner_id uuid,
  match_date timestamptz NOT NULL,
  number_of_sets integer,
  game_type text NOT NULL,
  match_type text DEFAULT 'singles'::text,
  league_id uuid,
  scores jsonb NOT NULL,
  is_verified boolean DEFAULT false,
  submitted_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  competition_type text,
  playoff_tournament_id uuid,
  team1_id uuid,
  team2_id uuid,
  winner_team_id uuid,
  ladder_challenge_id uuid,
  edit_count integer NOT NULL DEFAULT 0,
  CONSTRAINT player_matches_pkey PRIMARY KEY (id),
  CONSTRAINT check_different_players CHECK ((player1_id <> player2_id)),
  CONSTRAINT check_game_type CHECK ((game_type = ANY (ARRAY['competitive'::text, 'practice'::text]))),
  CONSTRAINT check_match_date_reasonable CHECK (((match_date >= '2020-01-01'::date) AND (match_date <= (CURRENT_DATE + '1 day'::interval)))),
  CONSTRAINT check_match_type CHECK ((match_type = ANY (ARRAY['singles'::text, 'doubles'::text]))),
  CONSTRAINT check_positive_sets CHECK (((number_of_sets > 0) AND (number_of_sets <= 5))),
  CONSTRAINT check_winner_is_player CHECK (((winner_id = player1_id) OR (winner_id = player2_id))),
  CONSTRAINT different_players CHECK ((player1_id <> player2_id)),
  CONSTRAINT player_matches_competition_type_check CHECK ((competition_type = ANY (ARRAY['league'::text, 'playoff'::text, 'championship'::text]))),
  CONSTRAINT player_matches_game_type_check CHECK ((game_type = ANY (ARRAY['practice'::text, 'competitive'::text]))),
  CONSTRAINT player_matches_match_type_check CHECK ((match_type = ANY (ARRAY['singles'::text, 'doubles'::text]))),
  CONSTRAINT player_matches_number_of_sets_check CHECK ((number_of_sets = ANY (ARRAY[1, 3, 5]))),
  CONSTRAINT valid_scores CHECK ((jsonb_typeof(scores) = 'array'::text)),
  CONSTRAINT valid_winner CHECK ((((winner_id = player1_id) OR (winner_id = player2_id)) OR (winner_id IS NULL)))
);

CREATE TABLE public.playoff_tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_started'::text,
  total_rounds integer NOT NULL,
  qualifying_players_count integer NOT NULL,
  bracket_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  bracket_type text NOT NULL DEFAULT 'main'::text,
  start_date date NOT NULL,
  CONSTRAINT playoff_tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT playoff_tournaments_league_id_key UNIQUE (league_id),
  CONSTRAINT playoff_tournaments_bracket_type_check CHECK ((bracket_type = ANY (ARRAY['main'::text, 'feed_in_consolation'::text]))),
  CONSTRAINT playoff_tournaments_qualifying_players_count_check CHECK ((qualifying_players_count > 0)),
  CONSTRAINT playoff_tournaments_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text]))),
  CONSTRAINT playoff_tournaments_total_rounds_check CHECK ((total_rounds > 0))
);

CREATE TABLE public.playoff_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playoff_tournament_id uuid NOT NULL,
  player_id uuid NOT NULL,
  seed_position integer NOT NULL,
  league_position integer NOT NULL,
  league_points integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  matches_played integer NOT NULL DEFAULT 0,
  current_section text DEFAULT 'main'::text,
  CONSTRAINT playoff_participants_pkey PRIMARY KEY (id),
  CONSTRAINT playoff_participants_playoff_tournament_id_player_id_key UNIQUE (playoff_tournament_id, player_id),
  CONSTRAINT playoff_participants_playoff_tournament_id_seed_position_key UNIQUE (playoff_tournament_id, seed_position),
  CONSTRAINT playoff_participants_current_section_check CHECK ((current_section = ANY (ARRAY['main'::text, 'consolation'::text, 'feed_in'::text, 'backdraw'::text, 'complete'::text]))),
  CONSTRAINT playoff_participants_league_points_check CHECK ((league_points >= 0)),
  CONSTRAINT playoff_participants_league_position_check CHECK ((league_position > 0)),
  CONSTRAINT playoff_participants_seed_position_check CHECK ((seed_position > 0))
);

CREATE TABLE public.playoff_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playoff_tournament_id uuid NOT NULL,
  round_number integer NOT NULL,
  round_name text NOT NULL,
  status text NOT NULL DEFAULT 'not_started'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  bracket_section text NOT NULL DEFAULT 'main'::text,
  CONSTRAINT playoff_rounds_pkey PRIMARY KEY (id),
  CONSTRAINT playoff_rounds_playoff_tournament_id_round_number_key UNIQUE (round_number, playoff_tournament_id),
  CONSTRAINT playoff_rounds_bracket_section_check CHECK ((bracket_section = ANY (ARRAY['main'::text, 'consolation'::text, 'feed_in'::text, 'backdraw'::text]))),
  CONSTRAINT playoff_rounds_round_number_check CHECK ((round_number > 0)),
  CONSTRAINT playoff_rounds_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);

CREATE TABLE public.playoff_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playoff_round_id uuid NOT NULL,
  match_number integer NOT NULL,
  player1_id uuid,
  player2_id uuid,
  winner_id uuid,
  player_match_id uuid,
  is_bye boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  bracket_section text NOT NULL DEFAULT 'main'::text,
  source_match_id uuid,
  CONSTRAINT playoff_matches_pkey PRIMARY KEY (id),
  CONSTRAINT playoff_matches_playoff_round_id_match_number_key UNIQUE (match_number, playoff_round_id),
  CONSTRAINT playoff_matches_bracket_section_check CHECK ((bracket_section = ANY (ARRAY['main'::text, 'consolation'::text, 'feed_in'::text, 'backdraw'::text]))),
  CONSTRAINT playoff_matches_check CHECK ((((is_bye = true) AND (player2_id IS NULL) AND (winner_id = player1_id)) OR ((is_bye = false) AND (player1_id IS NOT NULL) AND (player2_id IS NOT NULL)) OR ((is_bye = false) AND (player1_id IS NULL) AND (player2_id IS NULL) AND (status = 'pending'::text)))),
  CONSTRAINT playoff_matches_match_number_check CHECK ((match_number > 0)),
  CONSTRAINT playoff_matches_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'bye'::text])))
);

CREATE TABLE public.match_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_match_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_notes text,
  reviewed_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_reports_pkey PRIMARY KEY (id),
  CONSTRAINT match_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'dismissed'::text])))
);

CREATE TABLE public.notification_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL,
  device_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT notification_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT notification_tokens_user_id_token_key UNIQUE (token, user_id),
  CONSTRAINT notification_tokens_platform_check CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text])))
);

CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  play_now_notifications boolean DEFAULT true,
  notification_radius_km integer DEFAULT 10,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  match_result_notifications boolean DEFAULT true,
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.notification_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recipient_user_id uuid NOT NULL,
  sender_user_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  status text NOT NULL,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notification_history_pkey PRIMARY KEY (id),
  CONSTRAINT notification_history_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'pending'::text])))
);

CREATE TABLE public.rating_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  current_rating numeric NOT NULL,
  requested_rating numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  admin_notes text,
  reviewed_by uuid,
  CONSTRAINT rating_change_requests_pkey PRIMARY KEY (id),
  CONSTRAINT rating_change_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);

CREATE TABLE public.integrity_check_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  check_time timestamptz DEFAULT now(),
  total_leagues integer,
  total_players integer,
  issues_found integer,
  critical_issues integer,
  issues_detail jsonb,
  status text,
  CONSTRAINT integrity_check_log_pkey PRIMARY KEY (id),
  CONSTRAINT integrity_check_log_status_check CHECK ((status = ANY (ARRAY['HEALTHY'::text, 'ISSUES_FOUND'::text, 'CRITICAL'::text])))
);

-- ============================================================
-- Foreign Keys
-- ============================================================

ALTER TABLE public.courts ADD CONSTRAINT courts_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id);
ALTER TABLE public.players ADD CONSTRAINT players_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);
ALTER TABLE public.players ADD CONSTRAINT players_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id);
ALTER TABLE public.players ADD CONSTRAINT players_homecourt_id_fkey FOREIGN KEY (homecourt_id) REFERENCES courts(id);
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_court_id_fkey FOREIGN KEY (court_id) REFERENCES courts(id);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES players(id);
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES players(id);
ALTER TABLE public.organization_players ADD CONSTRAINT organization_players_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE public.organization_players ADD CONSTRAINT organization_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.leagues ADD CONSTRAINT leagues_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id);
ALTER TABLE public.leagues ADD CONSTRAINT leagues_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE public.league_players ADD CONSTRAINT league_players_doubles_team_id_fkey FOREIGN KEY (doubles_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.league_players ADD CONSTRAINT league_players_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.league_players ADD CONSTRAINT league_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.league_matches ADD CONSTRAINT league_matches_created_by_fkey FOREIGN KEY (created_by) REFERENCES players(id);
ALTER TABLE public.league_matches ADD CONSTRAINT league_matches_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.league_matches ADD CONSTRAINT league_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES players(id);
ALTER TABLE public.league_matches ADD CONSTRAINT league_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES players(id);
ALTER TABLE public.league_matches ADD CONSTRAINT league_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES players(id);
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES players(id);
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
ALTER TABLE public.bracket_seeds ADD CONSTRAINT bracket_seeds_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.bracket_seeds ADD CONSTRAINT bracket_seeds_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
ALTER TABLE public.matches ADD CONSTRAINT matches_player_a_id_fkey FOREIGN KEY (player_a_id) REFERENCES players(id);
ALTER TABLE public.matches ADD CONSTRAINT matches_player_b_id_fkey FOREIGN KEY (player_b_id) REFERENCES players(id);
ALTER TABLE public.matches ADD CONSTRAINT matches_source_match_id_fkey FOREIGN KEY (source_match_id) REFERENCES matches(id);
ALTER TABLE public.matches ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id);
ALTER TABLE public.matches ADD CONSTRAINT matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES players(id);
ALTER TABLE public.doubles_teams ADD CONSTRAINT doubles_teams_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.doubles_teams ADD CONSTRAINT doubles_teams_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES players(id);
ALTER TABLE public.doubles_teams ADD CONSTRAINT doubles_teams_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES players(id);
ALTER TABLE public.ladder_rankings ADD CONSTRAINT ladder_rankings_doubles_team_id_fkey FOREIGN KEY (doubles_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.ladder_rankings ADD CONSTRAINT ladder_rankings_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.ladder_rankings ADD CONSTRAINT ladder_rankings_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_challenged_player_id_fkey FOREIGN KEY (challenged_player_id) REFERENCES players(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_challenged_team_id_fkey FOREIGN KEY (challenged_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_challenger_player_id_fkey FOREIGN KEY (challenger_player_id) REFERENCES players(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_challenger_team_id_fkey FOREIGN KEY (challenger_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_player_match_id_fkey FOREIGN KEY (player_match_id) REFERENCES player_matches(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_winner_player_id_fkey FOREIGN KEY (winner_player_id) REFERENCES players(id);
ALTER TABLE public.ladder_challenges ADD CONSTRAINT ladder_challenges_winner_team_id_fkey FOREIGN KEY (winner_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.ladder_position_history ADD CONSTRAINT ladder_position_history_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES ladder_challenges(id);
ALTER TABLE public.ladder_position_history ADD CONSTRAINT ladder_position_history_doubles_team_id_fkey FOREIGN KEY (doubles_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.ladder_position_history ADD CONSTRAINT ladder_position_history_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.ladder_position_history ADD CONSTRAINT ladder_position_history_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_ladder_challenge_id_fkey FOREIGN KEY (ladder_challenge_id) REFERENCES ladder_challenges(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES players(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES players(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_playoff_tournament_id_fkey FOREIGN KEY (playoff_tournament_id) REFERENCES playoff_tournaments(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES players(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_team1_id_fkey FOREIGN KEY (team1_id) REFERENCES doubles_teams(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_team2_id_fkey FOREIGN KEY (team2_id) REFERENCES doubles_teams(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES players(id);
ALTER TABLE public.player_matches ADD CONSTRAINT player_matches_winner_team_id_fkey FOREIGN KEY (winner_team_id) REFERENCES doubles_teams(id);
ALTER TABLE public.playoff_tournaments ADD CONSTRAINT playoff_tournaments_league_id_fkey FOREIGN KEY (league_id) REFERENCES leagues(id);
ALTER TABLE public.playoff_participants ADD CONSTRAINT playoff_participants_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.playoff_participants ADD CONSTRAINT playoff_participants_playoff_tournament_id_fkey FOREIGN KEY (playoff_tournament_id) REFERENCES playoff_tournaments(id);
ALTER TABLE public.playoff_rounds ADD CONSTRAINT playoff_rounds_playoff_tournament_id_fkey FOREIGN KEY (playoff_tournament_id) REFERENCES playoff_tournaments(id);
ALTER TABLE public.playoff_matches ADD CONSTRAINT playoff_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES players(id);
ALTER TABLE public.playoff_matches ADD CONSTRAINT playoff_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES players(id);
ALTER TABLE public.playoff_matches ADD CONSTRAINT playoff_matches_player_match_id_fkey FOREIGN KEY (player_match_id) REFERENCES player_matches(id);
ALTER TABLE public.playoff_matches ADD CONSTRAINT playoff_matches_playoff_round_id_fkey FOREIGN KEY (playoff_round_id) REFERENCES playoff_rounds(id);
ALTER TABLE public.playoff_matches ADD CONSTRAINT playoff_matches_source_match_id_fkey FOREIGN KEY (source_match_id) REFERENCES playoff_matches(id);
ALTER TABLE public.playoff_matches ADD CONSTRAINT playoff_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES players(id);
ALTER TABLE public.match_reports ADD CONSTRAINT match_reports_player_match_id_fkey FOREIGN KEY (player_match_id) REFERENCES player_matches(id);
ALTER TABLE public.match_reports ADD CONSTRAINT match_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES players(id);
ALTER TABLE public.match_reports ADD CONSTRAINT match_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public.notification_tokens ADD CONSTRAINT notification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.notification_history ADD CONSTRAINT notification_history_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id);
ALTER TABLE public.notification_history ADD CONSTRAINT notification_history_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES auth.users(id);
ALTER TABLE public.rating_change_requests ADD CONSTRAINT rating_change_requests_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
ALTER TABLE public.rating_change_requests ADD CONSTRAINT rating_change_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

-- ============================================================
-- Deferrable Constraints
-- ============================================================

ALTER TABLE public.ladder_rankings ADD CONSTRAINT ladder_rankings_position_unique UNIQUE (league_id, position) DEFERRABLE INITIALLY DEFERRED;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_cities_country_code ON public.cities USING btree (country_code);
CREATE INDEX idx_courts_city_id ON public.courts USING btree (city_id);
CREATE INDEX idx_courts_deleted_at ON public.courts USING btree (deleted_at);
CREATE INDEX idx_courts_is_active ON public.courts USING btree (is_active);
CREATE INDEX idx_doubles_teams_league_id ON public.doubles_teams USING btree (league_id);
CREATE INDEX idx_doubles_teams_player1_id ON public.doubles_teams USING btree (player1_id);
CREATE INDEX idx_doubles_teams_player2_id ON public.doubles_teams USING btree (player2_id);
CREATE INDEX idx_ladder_challenges_acceptance_deadline ON public.ladder_challenges USING btree (acceptance_deadline);
CREATE INDEX idx_ladder_challenges_challenged_player_id ON public.ladder_challenges USING btree (challenged_player_id);
CREATE INDEX idx_ladder_challenges_challenger_player_id ON public.ladder_challenges USING btree (challenger_player_id);
CREATE INDEX idx_ladder_challenges_league_id ON public.ladder_challenges USING btree (league_id);
CREATE INDEX idx_ladder_challenges_league_status ON public.ladder_challenges USING btree (league_id, status);
CREATE INDEX idx_ladder_challenges_status ON public.ladder_challenges USING btree (status);
CREATE INDEX idx_ladder_position_history_created_at ON public.ladder_position_history USING btree (created_at);
CREATE INDEX idx_ladder_position_history_league_id ON public.ladder_position_history USING btree (league_id);
CREATE INDEX idx_ladder_position_history_player_id ON public.ladder_position_history USING btree (player_id);
CREATE INDEX idx_ladder_rankings_doubles_team_id ON public.ladder_rankings USING btree (doubles_team_id);
CREATE INDEX idx_ladder_rankings_league_active ON public.ladder_rankings USING btree (league_id, is_active, "position");
CREATE INDEX idx_ladder_rankings_league_id ON public.ladder_rankings USING btree (league_id);
CREATE INDEX idx_ladder_rankings_player_id ON public.ladder_rankings USING btree (player_id);
CREATE INDEX idx_ladder_rankings_position ON public.ladder_rankings USING btree (league_id, "position");
CREATE INDEX idx_league_players_ladder_position ON public.league_players USING btree (league_id, ladder_position);
CREATE INDEX idx_league_players_league_status ON public.league_players USING btree (league_id, status);
CREATE UNIQUE INDEX unique_active_league_player ON public.league_players USING btree (league_id, player_id) WHERE (status = 'active'::text);
CREATE INDEX idx_leagues_active ON public.leagues USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_leagues_city_active ON public.leagues USING btree (city_id, is_active) WHERE (is_active = true);
CREATE INDEX idx_leagues_city_division ON public.leagues USING btree (city_id, division);
CREATE INDEX idx_leagues_organization_id ON public.leagues USING btree (organization_id);
CREATE INDEX idx_match_reports_player_match ON public.match_reports USING btree (player_match_id);
CREATE INDEX idx_match_reports_status ON public.match_reports USING btree (status);
CREATE INDEX idx_matches_bracket_section ON public.matches USING btree (tournament_id, bracket_section);
CREATE INDEX idx_notification_history_recipient ON public.notification_history USING btree (recipient_user_id);
CREATE INDEX idx_notification_history_sent_at ON public.notification_history USING btree (sent_at);
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);
CREATE INDEX idx_notification_tokens_user_id ON public.notification_tokens USING btree (user_id);
CREATE INDEX idx_organizations_court_id ON public.organizations USING btree (court_id);
CREATE UNIQUE INDEX idx_organizations_join_code ON public.organizations USING btree (upper(join_code));
CREATE INDEX idx_player_matches_competition_type ON public.player_matches USING btree (competition_type);
CREATE INDEX idx_player_matches_date ON public.player_matches USING btree (match_date);
CREATE INDEX idx_player_matches_ladder_challenge_id ON public.player_matches USING btree (ladder_challenge_id);
CREATE INDEX idx_player_matches_league ON public.player_matches USING btree (league_id) WHERE (league_id IS NOT NULL);
CREATE INDEX idx_player_matches_player1 ON public.player_matches USING btree (player1_id);
CREATE INDEX idx_player_matches_player2 ON public.player_matches USING btree (player2_id);
CREATE INDEX idx_player_matches_playoff_tournament_id ON public.player_matches USING btree (playoff_tournament_id);
CREATE INDEX idx_player_matches_team1_id ON public.player_matches USING btree (team1_id);
CREATE INDEX idx_player_matches_team2_id ON public.player_matches USING btree (team2_id);
CREATE INDEX idx_players_availability ON public.players USING gin (availability);
CREATE INDEX idx_players_available_today ON public.players USING btree (available_today, city_id) WHERE (available_today = true);
CREATE INDEX idx_players_city_id ON public.players USING btree (city_id);
CREATE INDEX idx_players_homecourt_id ON public.players USING btree (homecourt_id);
CREATE INDEX idx_players_is_active ON public.players USING btree (is_active);
CREATE INDEX idx_playoff_matches_bracket_section ON public.playoff_matches USING btree (playoff_round_id, bracket_section);
CREATE INDEX idx_playoff_matches_player1_id ON public.playoff_matches USING btree (player1_id);
CREATE INDEX idx_playoff_matches_player2_id ON public.playoff_matches USING btree (player2_id);
CREATE INDEX idx_playoff_matches_player_match_id ON public.playoff_matches USING btree (player_match_id);
CREATE INDEX idx_playoff_matches_round_id ON public.playoff_matches USING btree (playoff_round_id);
CREATE INDEX idx_playoff_matches_status ON public.playoff_matches USING btree (status);
CREATE INDEX idx_playoff_matches_winner_id ON public.playoff_matches USING btree (winner_id);
CREATE INDEX idx_playoff_participants_player_id ON public.playoff_participants USING btree (player_id);
CREATE INDEX idx_playoff_participants_seed_position ON public.playoff_participants USING btree (playoff_tournament_id, seed_position);
CREATE INDEX idx_playoff_participants_tournament_id ON public.playoff_participants USING btree (playoff_tournament_id);
CREATE INDEX idx_playoff_rounds_bracket_section ON public.playoff_rounds USING btree (playoff_tournament_id, bracket_section);
CREATE INDEX idx_playoff_rounds_round_number ON public.playoff_rounds USING btree (playoff_tournament_id, round_number);
CREATE INDEX idx_playoff_rounds_tournament_id ON public.playoff_rounds USING btree (playoff_tournament_id);
CREATE INDEX idx_playoff_tournaments_league_id ON public.playoff_tournaments USING btree (league_id);
CREATE INDEX idx_playoff_tournaments_status ON public.playoff_tournaments USING btree (status);
CREATE INDEX idx_rating_change_requests_created_at ON public.rating_change_requests USING btree (created_at);
CREATE INDEX idx_rating_change_requests_player_id ON public.rating_change_requests USING btree (player_id);
CREATE INDEX idx_rating_change_requests_status ON public.rating_change_requests USING btree (status);
CREATE UNIQUE INDEX unique_tournament_player ON public.tournament_participants USING btree (tournament_id, player_id);
