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

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubles_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ladder_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ladder_position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ladder_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoff_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoff_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoff_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoff_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

CREATE POLICY "Allow all operations on audit log"
  ON public.admin_audit_log
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert admin_users"
  ON public.admin_users
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read admin_users"
  ON public.admin_users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update admin_users"
  ON public.admin_users
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow organizers to manage bracket_seeds for their tournaments"
  ON public.bracket_seeds
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = bracket_seeds.tournament_id) AND (t.organizer_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = bracket_seeds.tournament_id) AND (t.organizer_id = auth.uid())))));

CREATE POLICY "Allow read access to bracket_seeds for users who can read the t"
  ON public.bracket_seeds
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE (t.id = bracket_seeds.tournament_id))));

CREATE POLICY "Active cities are viewable by all authenticated users"
  ON public.cities
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((auth.role() = 'authenticated'::text) AND (is_active = true)));

CREATE POLICY "Admin panel users can manage cities"
  ON public.cities
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.id = auth.uid()))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.id = auth.uid()))));

CREATE POLICY "Admins can manage cities"
  ON public.cities
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.role = 'admin'::text))))));

CREATE POLICY "Public can view cities"
  ON public.cities
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage all courts"
  ON public.courts
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow read access to courts"
  ON public.courts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view active courts"
  ON public.courts
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((is_active = true) AND (deleted_at IS NULL)));

CREATE POLICY "Team members can update their doubles team"
  ON public.doubles_teams
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM players p
  WHERE ((p.auth_user_id = auth.uid()) AND ((p.id = doubles_teams.player1_id) OR (p.id = doubles_teams.player2_id))))));

CREATE POLICY "Users can create doubles teams in leagues they belong to"
  ON public.doubles_teams
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (league_players lp
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((lp.league_id = doubles_teams.league_id) AND (p.auth_user_id = auth.uid()) AND ((p.id = doubles_teams.player1_id) OR (p.id = doubles_teams.player2_id))))));

CREATE POLICY "Users can view doubles teams in their leagues"
  ON public.doubles_teams
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (league_players lp
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((lp.league_id = doubles_teams.league_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Challenged users can update challenge status"
  ON public.ladder_challenges
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM players p
  WHERE ((p.auth_user_id = auth.uid()) AND ((p.id = ladder_challenges.challenged_player_id) OR (p.id = ladder_challenges.challenger_player_id) OR (EXISTS ( SELECT 1
           FROM doubles_teams dt
          WHERE (((dt.id = ladder_challenges.challenged_team_id) OR (dt.id = ladder_challenges.challenger_team_id)) AND ((dt.player1_id = p.id) OR (dt.player2_id = p.id))))))))));

CREATE POLICY "Users can create challenges"
  ON public.ladder_challenges
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM players p
  WHERE ((p.auth_user_id = auth.uid()) AND ((p.id = ladder_challenges.challenger_player_id) OR (EXISTS ( SELECT 1
           FROM doubles_teams dt
          WHERE ((dt.id = ladder_challenges.challenger_team_id) AND ((dt.player1_id = p.id) OR (dt.player2_id = p.id))))))))));

CREATE POLICY "Users can view challenges in their leagues"
  ON public.ladder_challenges
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (league_players lp
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((lp.league_id = ladder_challenges.league_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Anyone can view position history"
  ON public.ladder_position_history
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view ladder rankings"
  ON public.ladder_rankings
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can manage ladder rankings"
  ON public.ladder_rankings
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM players p
  WHERE ((p.auth_user_id = auth.uid()) AND ((p.id = ladder_rankings.player_id) OR (EXISTS ( SELECT 1
           FROM doubles_teams dt
          WHERE ((dt.id = ladder_rankings.doubles_team_id) AND ((dt.player1_id = p.id) OR (dt.player2_id = p.id))))))))));

CREATE POLICY "Players can report their own matches"
  ON public.match_reports
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (((reported_by IN ( SELECT p.id
   FROM players p
  WHERE (p.auth_user_id = auth.uid()))) AND (player_match_id IN ( SELECT pm.id
   FROM player_matches pm
  WHERE ((pm.player1_id = match_reports.reported_by) OR (pm.player2_id = match_reports.reported_by))))));

CREATE POLICY "Players can view their own reports"
  ON public.match_reports
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((reported_by IN ( SELECT p.id
   FROM players p
  WHERE (p.auth_user_id = auth.uid()))));

CREATE POLICY "Allow organizers to manage matches for their tournaments"
  ON public.matches
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = matches.tournament_id) AND (t.organizer_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = matches.tournament_id) AND (t.organizer_id = auth.uid())))));

CREATE POLICY "Allow read access to matches for users who can read the tournam"
  ON public.matches
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE (t.id = matches.tournament_id))));

CREATE POLICY "Users can view their own notification history"
  ON public.notification_history
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = recipient_user_id));

CREATE POLICY "Users can view and update their own preferences"
  ON public.notification_preferences
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can manage their own notification tokens"
  ON public.notification_tokens
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Admins manage roster - delete"
  ON public.organization_members
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_org_admin(organization_id));

CREATE POLICY "Admins manage roster - insert"
  ON public.organization_members
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Admins manage roster - update"
  ON public.organization_members
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (is_org_admin(organization_id));

CREATE POLICY "Members can view their own membership"
  ON public.organization_members
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Admins can link players"
  ON public.organization_players
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Admins can unlink players"
  ON public.organization_players
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_org_admin(organization_id));

CREATE POLICY "Authenticated users can delete organization_players"
  ON public.organization_players
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert organization_players"
  ON public.organization_players
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read organization_players"
  ON public.organization_players
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can view their players"
  ON public.organization_players
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = auth.uid()))));

CREATE POLICY "Admins can delete their org"
  ON public.organizations
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_org_admin(id));

CREATE POLICY "Admins can update their org"
  ON public.organizations
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (is_org_admin(id));

CREATE POLICY "Authenticated users can delete organizations"
  ON public.organizations
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert organizations"
  ON public.organizations
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read organizations"
  ON public.organizations
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update organizations"
  ON public.organizations
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Org members can select org"
  ON public.organizations
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = organizations.id) AND (organization_members.user_id = auth.uid())))));

CREATE POLICY "Admins can delete player matches"
  ON public.player_matches
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_admin());

CREATE POLICY "Admins can insert player matches"
  ON public.player_matches
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all player matches"
  ON public.player_matches
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view all player matches"
  ON public.player_matches
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (is_admin());

CREATE POLICY "Players can delete matches they participate in"
  ON public.player_matches
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() IN ( SELECT players.auth_user_id
   FROM players
  WHERE (players.id = ANY (ARRAY[player_matches.player1_id, player_matches.player2_id, player_matches.submitted_by])))));

CREATE POLICY "Players can insert matches they participate in"
  ON public.player_matches
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() IN ( SELECT players.auth_user_id
   FROM players
  WHERE (players.id = ANY (ARRAY[player_matches.player1_id, player_matches.player2_id, player_matches.submitted_by])))));

CREATE POLICY "Players can view matches in their city"
  ON public.player_matches
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM players viewer
  WHERE ((viewer.auth_user_id = auth.uid()) AND (viewer.city_id IS NOT NULL) AND (viewer.city_id IN ( SELECT p.city_id
           FROM players p
          WHERE (p.id = ANY (ARRAY[player_matches.player1_id, player_matches.player2_id]))))))));

CREATE POLICY "Players can view their own matches"
  ON public.player_matches
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() IN ( SELECT players.auth_user_id
   FROM players
  WHERE (players.id = ANY (ARRAY[player_matches.player1_id, player_matches.player2_id])))));

CREATE POLICY "Allow authenticated users to insert players"
  ON public.players
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update players"
  ON public.players
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to players"
  ON public.players
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.players
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = auth_user_id));

CREATE POLICY "Users can update their own profile"
  ON public.players
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = auth_user_id));

CREATE POLICY "Users can view their own profile"
  ON public.players
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = auth_user_id));

CREATE POLICY "League organizers can manage playoff matches"
  ON public.playoff_matches
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((playoff_rounds pr
     JOIN playoff_tournaments pt ON ((pt.id = pr.playoff_tournament_id)))
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN players p ON ((p.id = l.organizer_id)))
  WHERE ((pr.id = playoff_matches.playoff_round_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can create standalone tournament matches"
  ON public.playoff_matches
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((((playoff_rounds pr
     JOIN playoff_tournaments pt ON ((pt.id = pr.playoff_tournament_id)))
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pr.id = playoff_matches.playoff_round_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can delete standalone tournament matches"
  ON public.playoff_matches
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((((playoff_rounds pr
     JOIN playoff_tournaments pt ON ((pt.id = pr.playoff_tournament_id)))
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pr.id = playoff_matches.playoff_round_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can update standalone tournament matches"
  ON public.playoff_matches
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((((playoff_rounds pr
     JOIN playoff_tournaments pt ON ((pt.id = pr.playoff_tournament_id)))
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pr.id = playoff_matches.playoff_round_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((((playoff_rounds pr
     JOIN playoff_tournaments pt ON ((pt.id = pr.playoff_tournament_id)))
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pr.id = playoff_matches.playoff_round_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Players can update their playoff match results"
  ON public.playoff_matches
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM players p
  WHERE ((p.auth_user_id = auth.uid()) AND ((p.id = playoff_matches.player1_id) OR (p.id = playoff_matches.player2_id))))));

CREATE POLICY "Users can view playoff matches for their leagues"
  ON public.playoff_matches
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((((playoff_rounds pr
     JOIN playoff_tournaments pt ON ((pt.id = pr.playoff_tournament_id)))
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pr.id = playoff_matches.playoff_round_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "League organizers can manage playoff participants"
  ON public.playoff_participants
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN players p ON ((p.id = l.organizer_id)))
  WHERE ((pt.id = playoff_participants.playoff_tournament_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can create standalone tournament participants"
  ON public.playoff_participants
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_participants.playoff_tournament_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can delete standalone tournament participants"
  ON public.playoff_participants
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_participants.playoff_tournament_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Users can view playoff participants for their leagues"
  ON public.playoff_participants
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_participants.playoff_tournament_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "League organizers can manage playoff rounds"
  ON public.playoff_rounds
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN players p ON ((p.id = l.organizer_id)))
  WHERE ((pt.id = playoff_rounds.playoff_tournament_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can create standalone tournament rounds"
  ON public.playoff_rounds
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_rounds.playoff_tournament_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can delete standalone tournament rounds"
  ON public.playoff_rounds
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_rounds.playoff_tournament_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can update standalone tournament rounds"
  ON public.playoff_rounds
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_rounds.playoff_tournament_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_rounds.playoff_tournament_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Users can view playoff rounds for their leagues"
  ON public.playoff_rounds
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((playoff_tournaments pt
     JOIN leagues l ON ((l.id = pt.league_id)))
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((pt.id = playoff_rounds.playoff_tournament_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "League organizers can manage playoff tournaments"
  ON public.playoff_tournaments
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (leagues l
     JOIN players p ON ((p.id = l.organizer_id)))
  WHERE ((l.id = playoff_tournaments.league_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can create standalone tournaments"
  ON public.playoff_tournaments
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((leagues l
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((l.id = playoff_tournaments.league_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can delete standalone tournaments"
  ON public.playoff_tournaments
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((leagues l
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((l.id = playoff_tournaments.league_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Participants can update standalone tournaments"
  ON public.playoff_tournaments
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((leagues l
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((l.id = playoff_tournaments.league_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((leagues l
     JOIN league_players lp ON ((lp.league_id = l.id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((l.id = playoff_tournaments.league_id) AND (l.competition_type = 'playoffs_only'::text) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Users can view playoff tournaments for their leagues"
  ON public.playoff_tournaments
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((league_players lp
     JOIN leagues l ON ((l.id = lp.league_id)))
     JOIN players p ON ((p.id = lp.player_id)))
  WHERE ((l.id = playoff_tournaments.league_id) AND (p.auth_user_id = auth.uid())))));

CREATE POLICY "Users can insert their own rating change requests"
  ON public.rating_change_requests
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((player_id = auth.uid()));

CREATE POLICY "Users can view their own rating change requests"
  ON public.rating_change_requests
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((player_id = auth.uid()));

CREATE POLICY "admin_select_rating_change_requests"
  ON public.rating_change_requests
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.id = auth.uid()))));

CREATE POLICY "admin_update_rating_change_requests"
  ON public.rating_change_requests
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.id = auth.uid()))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.id = auth.uid()))));

CREATE POLICY "Allow authenticated users to insert their own tournaments"
  ON public.tournaments
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = organizer_id));

CREATE POLICY "Allow organizers to delete their own tournaments"
  ON public.tournaments
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = organizer_id));

CREATE POLICY "Allow organizers to update their own tournaments"
  ON public.tournaments
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = organizer_id))
  WITH CHECK ((auth.uid() = organizer_id));

CREATE POLICY "Allow public read access to tournaments"
  ON public.tournaments
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER on_bracket_seeds_updated_at
  BEFORE UPDATE ON public.bracket_seeds
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_ladder_wl_update
  AFTER UPDATE ON public.ladder_challenges
  FOR EACH ROW EXECUTE FUNCTION update_ladder_wl_stats();

CREATE TRIGGER trg_league_player_count
  AFTER INSERT OR UPDATE OR DELETE ON public.league_players
  FOR EACH ROW EXECUTE FUNCTION update_league_player_count();

CREATE TRIGGER trigger_validate_league_points
  BEFORE INSERT OR UPDATE ON public.league_players
  FOR EACH ROW EXECUTE FUNCTION validate_league_points();

CREATE TRIGGER on_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_tokens_updated_at
  BEFORE UPDATE ON public.notification_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_player_matches_updated_at
  BEFORE UPDATE ON public.player_matches
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_city_player_count_trigger
  AFTER INSERT OR UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_city_player_count();

CREATE TRIGGER update_country_from_city_trigger
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_player_country_from_city_before();

CREATE TRIGGER update_rating_change_requests_updated_at
  BEFORE UPDATE ON public.rating_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auth trigger (creates player profile on signup)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Views
-- ============================================================

CREATE OR REPLACE VIEW public.v_current_integrity_status AS
 SELECT l.name AS league_name,
    count(lp.player_id) AS total_players,
    COALESCE(sum(lp.matches_played), (0)::bigint) AS total_matches,
    COALESCE(sum(lp.wins), (0)::bigint) AS total_wins,
    COALESCE(sum(lp.losses), (0)::bigint) AS total_losses,
    COALESCE(sum(lp.points), (0)::bigint) AS total_points,
        CASE
            WHEN (count(lp.player_id) = 0) THEN 'EMPTY_LEAGUE'::text
            WHEN ((COALESCE(sum(lp.wins), (0)::bigint) + COALESCE(sum(lp.losses), (0)::bigint)) = COALESCE(sum(lp.matches_played), (0)::bigint)) THEN 'CONSISTENT'::text
            ELSE 'INCONSISTENT'::text
        END AS stats_status,
    now() AS last_updated
   FROM (leagues l
     LEFT JOIN league_players lp ON ((l.id = lp.league_id)))
  GROUP BY l.id, l.name
  ORDER BY l.name;

-- Note: players_with_email view references auth.users and is handled by
-- the get_players_with_email() SECURITY DEFINER function instead.
-- The view is kept for backward compatibility but requires admin access.
CREATE OR REPLACE VIEW public.players_with_email AS
 SELECT p.id,
    p.first_name,
    p.last_name,
    p.rating,
    p.created_at,
    p.status,
    p.auth_user_id,
    p.gender,
    p.avatar_url,
    p.onboarding_completed,
    p.updated_at,
    p.country_code,
    p.country_name,
    p.phone_country_code,
    p.phone_number,
    p.city_id,
    p.city_name,
    p.state_province,
    p.availability,
    p.nationality_code,
    p.homecourt_id,
    p.available_today,
    p.available_today_updated_at,
    p.is_active,
    p.nationality_name,
    au.email,
        CASE
            WHEN ((p.phone_country_code IS NOT NULL) AND (p.phone_number IS NOT NULL)) THEN concat(p.phone_country_code, ' ', p.phone_number)
            ELSE NULL::text
        END AS phone
   FROM (players p
     LEFT JOIN auth.users au ON ((p.auth_user_id = au.id)));
