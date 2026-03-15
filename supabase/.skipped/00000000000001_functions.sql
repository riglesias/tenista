-- ============================================================
-- Functions (reference tables — must come after table creation)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.players (auth_user_id)
  VALUES (NEW.id)
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_org
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_inactivity_penalty(p_league_id uuid, p_player_id uuid, p_positions_to_drop integer)
 RETURNS void
 LANGUAGE plpgsql
AS $$
DECLARE
  v_current_position INTEGER;
  v_new_position INTEGER;
  v_max_position INTEGER;
  v_affected_player RECORD;
BEGIN
  -- Get current position
  SELECT position INTO v_current_position
  FROM ladder_rankings
  WHERE league_id = p_league_id AND player_id = p_player_id;
  
  IF v_current_position IS NULL THEN
    RETURN;
  END IF;
  
  -- Get max position in ladder
  SELECT MAX(position) INTO v_max_position
  FROM ladder_rankings
  WHERE league_id = p_league_id;
  
  -- Calculate new position (can't go below max)
  v_new_position := LEAST(v_current_position + p_positions_to_drop, v_max_position);
  
  IF v_new_position = v_current_position THEN
    RETURN; -- No change needed
  END IF;
  
  -- Move all players between current and new position up by 1
  FOR v_affected_player IN 
    SELECT player_id, position 
    FROM ladder_rankings 
    WHERE league_id = p_league_id 
      AND position > v_current_position 
      AND position <= v_new_position
    ORDER BY position
  LOOP
    UPDATE ladder_rankings 
    SET position = v_affected_player.position - 1,
        previous_position = v_affected_player.position,
        updated_at = now()
    WHERE league_id = p_league_id AND player_id = v_affected_player.player_id;
  END LOOP;
  
  -- Update the penalized player's position
  UPDATE ladder_rankings 
  SET position = v_new_position,
      previous_position = v_current_position,
      last_activity_check = now(),
      updated_at = now()
  WHERE league_id = p_league_id AND player_id = p_player_id;
  
  -- Record history
  INSERT INTO ladder_position_history (league_id, player_id, old_position, new_position, change_reason)
  VALUES (p_league_id, p_player_id, v_current_position, v_new_position, 'inactivity_penalty');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_organization(p_name text)
 RETURNS organizations
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
declare
  new_organization organizations;
begin
  insert into public.organizations(name, created_by)
  values (p_name, auth.uid())
  returning * into new_organization;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization.id, auth.uid(), 'admin');

  return new_organization;
end;
$$;

CREATE OR REPLACE FUNCTION public.delete_match_atomic(p_match_id uuid, p_requesting_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $$
DECLARE
  v_match RECORD;
  v_loser_id UUID;
  v_points_win INTEGER;
  v_points_loss INTEGER;
  v_result JSONB;
BEGIN
  -- Get match details and verify authorization
  SELECT 
    player1_id,
    player2_id,
    winner_id,
    league_id,
    submitted_by
  INTO v_match
  FROM player_matches 
  WHERE id = p_match_id;
  
  -- Check if match exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Match not found'
    );
  END IF;
  
  -- Check authorization
  IF p_requesting_player_id NOT IN (v_match.player1_id, v_match.player2_id, v_match.submitted_by) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authorized to delete this match'
    );
  END IF;
  
  -- If this is a league match, reverse the league statistics atomically
  IF v_match.league_id IS NOT NULL AND v_match.winner_id IS NOT NULL THEN
    -- Determine loser
    v_loser_id := CASE 
      WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id 
      ELSE v_match.player1_id 
    END;
    
    -- Get league point settings
    SELECT 
      COALESCE(default_points_win, 3),
      COALESCE(default_points_loss, 0)
    INTO v_points_win, v_points_loss
    FROM leagues 
    WHERE id = v_match.league_id;
    
    -- Reverse winner's stats (only if they have sufficient stats to reverse)
    UPDATE league_players 
    SET 
      points = points - v_points_win,
      matches_played = matches_played - 1,
      wins = wins - 1
    WHERE league_id = v_match.league_id 
      AND player_id = v_match.winner_id
      AND points >= v_points_win 
      AND wins >= 1 
      AND matches_played >= 1;
    
    -- Reverse loser's stats (only if they have sufficient stats to reverse)
    UPDATE league_players 
    SET 
      points = points - v_points_loss,
      matches_played = matches_played - 1,
      losses = losses - 1
    WHERE league_id = v_match.league_id 
      AND player_id = v_loser_id
      AND points >= v_points_loss 
      AND losses >= 1 
      AND matches_played >= 1;
  END IF;
  
  -- Delete the match
  DELETE FROM player_matches WHERE id = p_match_id;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Match deleted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result (transaction will be rolled back automatically)
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to delete match'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.fix_league_integrity(p_league_id uuid, p_dry_run boolean DEFAULT true)
 RETURNS TABLE(action_taken text, player_name text, old_values jsonb, new_values jsonb)
 LANGUAGE plpgsql
AS $$
DECLARE
  v_record RECORD;
  v_expected_points INTEGER;
  v_expected_matches INTEGER;
BEGIN
  FOR v_record IN 
    SELECT 
      lp.league_id,
      lp.player_id,
      p.first_name || ' ' || p.last_name as player_name,
      lp.points,
      lp.wins,
      lp.losses,
      lp.matches_played,
      l.default_points_win,
      l.default_points_loss
    FROM league_players lp
    JOIN players p ON p.id = lp.player_id
    JOIN leagues l ON l.id = lp.league_id
    WHERE lp.league_id = p_league_id
      AND (lp.wins + lp.losses != lp.matches_played 
           OR lp.points != (lp.wins * COALESCE(l.default_points_win, 3) + lp.losses * COALESCE(l.default_points_loss, 0)))
  LOOP
    v_expected_matches := v_record.wins + v_record.losses;
    v_expected_points := v_record.wins * COALESCE(v_record.default_points_win, 3) + 
                        v_record.losses * COALESCE(v_record.default_points_loss, 0);
    
    IF NOT p_dry_run THEN
      UPDATE league_players 
      SET 
        matches_played = v_expected_matches,
        points = v_expected_points
      WHERE league_id = v_record.league_id 
        AND player_id = v_record.player_id;
    END IF;
    
    RETURN QUERY SELECT 
      CASE WHEN p_dry_run THEN 'DRY RUN - Would fix' ELSE 'Fixed' END as action_taken,
      v_record.player_name,
      jsonb_build_object(
        'points', v_record.points,
        'matches_played', v_record.matches_played
      ) as old_values,
      jsonb_build_object(
        'points', v_expected_points,
        'matches_played', v_expected_matches
      ) as new_values;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_available_players_today(p_city_id uuid DEFAULT NULL::uuid, p_exclude_player_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, first_name text, last_name text, rating numeric, avatar_url text, available_today boolean, availability jsonb, homecourt_name text)
 LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.rating,
    p.avatar_url,
    p.available_today,
    p.availability,
    c.name as homecourt_name
  FROM public.players p
  LEFT JOIN public.courts c ON p.homecourt_id = c.id
  WHERE 
    (p_city_id IS NULL OR p.city_id = p_city_id)
    AND (p_exclude_player_id IS NULL OR p.id != p_exclude_player_id)
    AND (
      p.available_today = true 
      OR (p.availability IS NOT NULL AND p.availability != '{}'::jsonb)
    )
  ORDER BY 
    p.available_today DESC NULLS LAST,
    p.rating DESC NULLS LAST,
    p.first_name ASC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integrity_history(p_limit integer DEFAULT 10)
 RETURNS TABLE(check_time timestamp with time zone, status text, total_players integer, issues_found integer, critical_issues integer)
 LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    icl.check_time,
    icl.status,
    icl.total_players,
    icl.issues_found,
    icl.critical_issues
  FROM integrity_check_log icl
  ORDER BY icl.check_time DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integrity_summary()
 RETURNS TABLE(total_leagues integer, total_players integer, players_with_issues integer, critical_issues integer, last_check_time timestamp with time zone)
 LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT league_id) FROM league_players)::INTEGER as total_leagues,
    (SELECT COUNT(*) FROM league_players)::INTEGER as total_players,
    (SELECT COUNT(*) FROM validate_league_integrity())::INTEGER as players_with_issues,
    (SELECT COUNT(*) FROM validate_league_integrity() WHERE severity = 'CRITICAL')::INTEGER as critical_issues,
    NOW() as last_check_time;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_players_with_email()
 RETURNS TABLE(id uuid, first_name text, last_name text, rating numeric, created_at timestamp with time zone, status text, auth_user_id uuid, gender text, avatar_url text, onboarding_completed boolean, updated_at timestamp with time zone, country_code character varying, country_name text, phone_country_code character varying, phone_number character varying, city_id uuid, city_name text, state_province text, availability jsonb, nationality_code character varying, homecourt_id uuid, available_today boolean, available_today_updated_at timestamp with time zone, is_active boolean, nationality_name text, email character varying, phone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
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
    au.email::varchar(255) as email,
    CASE 
      WHEN p.phone_country_code IS NOT NULL AND p.phone_number IS NOT NULL 
      THEN CONCAT(p.phone_country_code, ' ', p.phone_number)
      ELSE NULL
    END::text as phone
  FROM players p
  LEFT JOIN auth.users au ON p.auth_user_id = au.id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_league_player_stat(p_league_id uuid, p_player_id uuid, p_points_to_add integer, p_wins_to_add integer, p_losses_to_add integer, p_matches_played_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
AS $$
    BEGIN
        UPDATE public.league_players
        SET 
            points = points + p_points_to_add,
            wins = wins + p_wins_to_add,
            losses = losses + p_losses_to_add,
            matches_played = matches_played + p_matches_played_to_add
        WHERE league_id = p_league_id AND player_id = p_player_id;
    END;
    $$;

CREATE OR REPLACE FUNCTION public.is_valid_ladder_challenge(p_league_id uuid, p_challenger_player_id uuid, p_challenged_position integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $$
DECLARE
  v_challenger_position INTEGER;
  v_max_challenge_positions INTEGER;
  v_ladder_config JSONB;
  v_has_active_outgoing BOOLEAN;
  v_has_active_incoming BOOLEAN;
  v_max_outgoing INTEGER;
BEGIN
  -- Get league ladder config
  SELECT ladder_config INTO v_ladder_config
  FROM leagues
  WHERE id = p_league_id;
  
  -- Get config values with defaults
  v_max_challenge_positions := COALESCE((v_ladder_config->>'max_challenge_positions')::INTEGER, 4);
  v_max_outgoing := COALESCE((v_ladder_config->>'max_active_outgoing_challenges')::INTEGER, 1);
  
  -- Get challenger's current position
  SELECT position INTO v_challenger_position
  FROM ladder_rankings
  WHERE league_id = p_league_id AND player_id = p_challenger_player_id;
  
  IF v_challenger_position IS NULL THEN
    RETURN FALSE; -- Challenger not in ladder
  END IF;
  
  -- Check position range
  IF v_challenged_position >= v_challenger_position THEN
    RETURN FALSE; -- Can only challenge upward
  END IF;
  
  IF (v_challenger_position - v_challenged_position) > v_max_challenge_positions THEN
    RETURN FALSE; -- Too far up the ladder
  END IF;
  
  -- Check for active outgoing challenges
  SELECT EXISTS(
    SELECT 1 FROM ladder_challenges
    WHERE league_id = p_league_id
      AND challenger_player_id = p_challenger_player_id
      AND status IN ('pending', 'accepted')
  ) INTO v_has_active_outgoing;
  
  IF v_has_active_outgoing THEN
    RETURN FALSE; -- Already has active outgoing challenge
  END IF;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_all_player_stats_for_league(p_league_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $$
DECLARE
    match_record RECORD;
    v_points_winner INTEGER;
    v_points_loser INTEGER;
BEGIN
    -- Reset stats for all players in the league
    UPDATE public.league_players
    SET points = 0, wins = 0, losses = 0, matches_played = 0
    WHERE league_id = p_league_id;

    -- Loop through all completed matches in the league
    FOR match_record IN 
        SELECT id, player1_id, player2_id, winner_id, points_winner, points_loser 
        FROM public.league_matches
        WHERE league_id = p_league_id AND status = 'completed' AND winner_id IS NOT NULL
    LOOP
        -- Ensure points_winner and points_loser from the match record are not null
        -- If they were, we might fall back to league defaults or a predefined value,
        -- but our previous step should have updated them. For safety, coalesce to 0.
        v_points_winner := COALESCE(match_record.points_winner, 0);
        v_points_loser := COALESCE(match_record.points_loser, 0);

        -- Update winner's stats
        UPDATE public.league_players
        SET 
            points = points + v_points_winner,
            wins = wins + 1,
            matches_played = matches_played + 1
        WHERE league_id = p_league_id AND player_id = match_record.winner_id;

        -- Determine loser and update their stats
        IF match_record.winner_id = match_record.player1_id THEN
            UPDATE public.league_players
            SET 
                points = points + v_points_loser,
                losses = losses + 1,
                matches_played = matches_played + 1
            WHERE league_id = p_league_id AND player_id = match_record.player2_id;
        ELSE
            UPDATE public.league_players
            SET 
                points = points + v_points_loser,
                losses = losses + 1,
                matches_played = matches_played + 1
            WHERE league_id = p_league_id AND player_id = match_record.player1_id;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_daily_availability()
 RETURNS void
 LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset available_today to false for players whose timestamp is from previous day
  UPDATE public.players 
  SET 
    available_today = false,
    available_today_updated_at = NULL
  WHERE 
    available_today = true 
    AND (
      available_today_updated_at IS NULL 
      OR DATE(available_today_updated_at AT TIME ZONE 'UTC') < CURRENT_DATE
    );
    
  RAISE NOTICE 'Daily availability reset completed at %', NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_and_reswap_ladder_positions(p_challenge_id uuid, p_old_winner_id uuid, p_new_winner_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_old_challenger_won BOOLEAN;
  v_new_challenger_won BOOLEAN;
  v_challenger_current_pos INTEGER;
  v_challenged_current_pos INTEGER;
BEGIN
  -- Fetch challenge
  SELECT * INTO v_challenge FROM ladder_challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  v_old_challenger_won := (p_old_winner_id = v_challenge.challenger_player_id);
  v_new_challenger_won := (p_new_winner_id = v_challenge.challenger_player_id);

  -- If swap state hasn't changed (both challenger won, or both defender won), no position change
  IF v_old_challenger_won = v_new_challenger_won THEN
    -- Just update winner on challenge
    UPDATE ladder_challenges SET
      winner_player_id = p_new_winner_id,
      updated_at = NOW()
    WHERE id = p_challenge_id;
    RETURN jsonb_build_object('success', true, 'positions_changed', false);
  END IF;

  -- Get current positions from ladder_rankings (may have shifted since original match)
  SELECT position INTO v_challenger_current_pos
  FROM ladder_rankings
  WHERE league_id = v_challenge.league_id AND player_id = v_challenge.challenger_player_id;

  SELECT position INTO v_challenged_current_pos
  FROM ladder_rankings
  WHERE league_id = v_challenge.league_id AND player_id = v_challenge.challenged_player_id;

  -- Swap positions: the two players trade places regardless of direction
  -- This works for both "reverse a swap" and "apply a new swap" since they just trade
  PERFORM swap_ladder_positions(
    v_challenge.league_id,
    CASE WHEN v_new_challenger_won
      THEN v_challenge.challenger_player_id  -- new winner
      ELSE v_challenge.challenged_player_id  -- new winner
    END,
    CASE WHEN v_new_challenger_won
      THEN v_challenger_current_pos
      ELSE v_challenged_current_pos
    END,
    CASE WHEN v_new_challenger_won
      THEN v_challenge.challenged_player_id  -- new loser
      ELSE v_challenge.challenger_player_id  -- new loser
    END,
    CASE WHEN v_new_challenger_won
      THEN v_challenged_current_pos
      ELSE v_challenger_current_pos
    END,
    p_challenge_id
  );

  -- Update challenge record with new winner and positions
  UPDATE ladder_challenges SET
    winner_player_id = p_new_winner_id,
    new_challenger_position = CASE WHEN v_new_challenger_won
      THEN v_challenged_current_pos  -- challenger moved to challenged's position
      ELSE v_challenger_current_pos  -- challenger stays
    END,
    new_challenged_position = CASE WHEN v_new_challenger_won
      THEN v_challenger_current_pos  -- challenged moved to challenger's position
      ELSE v_challenged_current_pos  -- challenged stays
    END,
    updated_at = NOW()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('success', true, 'positions_changed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.run_integrity_check()
 RETURNS jsonb
 LANGUAGE plpgsql
AS $$
DECLARE
  v_summary RECORD;
  v_issues JSONB;
  v_status TEXT;
  v_log_id UUID;
BEGIN
  -- Get integrity summary
  SELECT * INTO v_summary FROM get_integrity_summary();
  
  -- Get detailed issues
  SELECT jsonb_agg(
    jsonb_build_object(
      'league', league_name,
      'player', player_name,
      'issue', issue_type,
      'severity', severity,
      'current', current_values,
      'expected', expected_values
    )
  ) INTO v_issues
  FROM validate_league_integrity();
  
  -- Determine status
  IF v_summary.critical_issues > 0 THEN
    v_status := 'CRITICAL';
  ELSIF v_summary.players_with_issues > 0 THEN
    v_status := 'ISSUES_FOUND';
  ELSE
    v_status := 'HEALTHY';
  END IF;
  
  -- Log the check
  INSERT INTO integrity_check_log (
    total_leagues,
    total_players,
    issues_found,
    critical_issues,
    issues_detail,
    status
  ) VALUES (
    v_summary.total_leagues,
    v_summary.total_players,
    v_summary.players_with_issues,
    v_summary.critical_issues,
    v_issues,
    v_status
  ) RETURNING id INTO v_log_id;
  
  -- Return comprehensive result
  RETURN jsonb_build_object(
    'check_id', v_log_id,
    'timestamp', NOW(),
    'status', v_status,
    'summary', jsonb_build_object(
      'total_leagues', v_summary.total_leagues,
      'total_players', v_summary.total_players,
      'issues_found', v_summary.players_with_issues,
      'critical_issues', v_summary.critical_issues
    ),
    'issues', COALESCE(v_issues, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_match_atomic(p_player1_id uuid, p_player2_id uuid, p_winner_id uuid, p_match_date timestamp without time zone, p_number_of_sets integer, p_game_type text, p_match_type text, p_scores jsonb, p_submitted_by uuid, p_league_id uuid, p_competition_type text DEFAULT NULL::text, p_playoff_tournament_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $$
DECLARE
  v_match_id UUID;
  v_loser_id UUID;
  v_points_win INTEGER;
  v_points_loss INTEGER;
  v_result JSONB;
  v_playoff_match_id UUID;
BEGIN
  -- Generate match ID
  v_match_id := gen_random_uuid();
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN p_winner_id = p_player1_id THEN p_player2_id 
    ELSE p_player1_id 
  END;
  
  -- Insert match record with competition info
  INSERT INTO player_matches (
    id,
    player1_id,
    player2_id,
    winner_id,
    match_date,
    number_of_sets,
    game_type,
    match_type,
    scores,
    submitted_by,
    league_id,
    competition_type,
    playoff_tournament_id,
    created_at
  ) VALUES (
    v_match_id,
    p_player1_id,
    p_player2_id,
    p_winner_id,
    p_match_date,
    p_number_of_sets,
    p_game_type,
    p_match_type,
    p_scores,
    p_submitted_by,
    p_league_id,
    p_competition_type,
    p_playoff_tournament_id,
    NOW()
  );
  
  -- Handle playoff matches
  IF p_competition_type = 'playoff' AND p_playoff_tournament_id IS NOT NULL THEN
    -- Find and update the corresponding playoff match
    UPDATE playoff_matches pm
    SET 
      winner_id = p_winner_id,
      player_match_id = v_match_id,
      status = 'completed',
      updated_at = NOW()
    WHERE pm.playoff_round_id IN (
      SELECT pr.id 
      FROM playoff_rounds pr 
      WHERE pr.playoff_tournament_id = p_playoff_tournament_id
    )
    AND (
      (pm.player1_id = p_player1_id AND pm.player2_id = p_player2_id) OR
      (pm.player1_id = p_player2_id AND pm.player2_id = p_player1_id)
    )
    AND pm.status = 'pending'
    RETURNING pm.id INTO v_playoff_match_id;
    
    -- If no playoff match was found, return error
    IF v_playoff_match_id IS NULL THEN
      v_result := jsonb_build_object(
        'success', false,
        'error', 'No pending playoff match found between these players',
        'message', 'Invalid playoff match submission'
      );
      RAISE EXCEPTION 'No pending playoff match found';
    END IF;
  END IF;
  
  -- If this is a league match, update league statistics atomically
  IF p_league_id IS NOT NULL AND p_competition_type = 'league' THEN
    -- Get league point settings
    SELECT 
      COALESCE(default_points_win, 3),
      COALESCE(default_points_loss, 0)
    INTO v_points_win, v_points_loss
    FROM leagues 
    WHERE id = p_league_id;
    
    -- Update winner's league stats (atomic upsert)
    INSERT INTO league_players (
      league_id, 
      player_id, 
      points, 
      matches_played, 
      wins, 
      losses
    )
    VALUES (
      p_league_id, 
      p_winner_id, 
      v_points_win, 
      1, 
      1, 
      0
    )
    ON CONFLICT (league_id, player_id) 
    DO UPDATE SET 
      points = league_players.points + v_points_win,
      matches_played = league_players.matches_played + 1,
      wins = league_players.wins + 1;
    
    -- Update loser's league stats (atomic upsert)
    INSERT INTO league_players (
      league_id, 
      player_id, 
      points, 
      matches_played, 
      wins, 
      losses
    )
    VALUES (
      p_league_id, 
      v_loser_id, 
      v_points_loss, 
      1, 
      0, 
      1
    )
    ON CONFLICT (league_id, player_id)
    DO UPDATE SET 
      points = league_players.points + v_points_loss,
      matches_played = league_players.matches_played + 1,
      losses = league_players.losses + 1;
  END IF;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'match_id', v_match_id,
    'playoff_match_id', v_playoff_match_id,
    'message', 'Match submitted successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result (transaction will be rolled back automatically)
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to submit match'
    );
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_match_atomic(p_player1_id uuid, p_player2_id uuid, p_winner_id uuid, p_match_date timestamp with time zone, p_number_of_sets integer, p_game_type text, p_match_type text, p_scores jsonb, p_submitted_by uuid, p_league_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $$
DECLARE
  v_match_id UUID;
  v_loser_id UUID;
  v_points_win INTEGER;
  v_points_loss INTEGER;
  v_result JSONB;
BEGIN
  -- Generate match ID
  v_match_id := gen_random_uuid();
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN p_winner_id = p_player1_id THEN p_player2_id 
    ELSE p_player1_id 
  END;
  
  -- Insert match record
  INSERT INTO player_matches (
    id,
    player1_id,
    player2_id,
    winner_id,
    match_date,
    number_of_sets,
    game_type,
    match_type,
    scores,
    submitted_by,
    league_id,
    created_at
  ) VALUES (
    v_match_id,
    p_player1_id,
    p_player2_id,
    p_winner_id,
    p_match_date,
    p_number_of_sets,
    p_game_type,
    p_match_type,
    p_scores,
    p_submitted_by,
    p_league_id,
    NOW()
  );
  
  -- If this is a league match, update league statistics atomically
  IF p_league_id IS NOT NULL THEN
    -- Get league point settings
    SELECT 
      COALESCE(default_points_win, 3),
      COALESCE(default_points_loss, 0)
    INTO v_points_win, v_points_loss
    FROM leagues 
    WHERE id = p_league_id;
    
    -- Update winner's league stats (atomic upsert)
    INSERT INTO league_players (
      league_id, 
      player_id, 
      points, 
      matches_played, 
      wins, 
      losses
    )
    VALUES (
      p_league_id, 
      p_winner_id, 
      v_points_win, 
      1, 
      1, 
      0
    )
    ON CONFLICT (league_id, player_id) 
    DO UPDATE SET 
      points = league_players.points + v_points_win,
      matches_played = league_players.matches_played + 1,
      wins = league_players.wins + 1;
    
    -- Update loser's league stats (atomic upsert)
    INSERT INTO league_players (
      league_id, 
      player_id, 
      points, 
      matches_played, 
      wins, 
      losses
    )
    VALUES (
      p_league_id, 
      v_loser_id, 
      v_points_loss, 
      1, 
      0, 
      1
    )
    ON CONFLICT (league_id, player_id)
    DO UPDATE SET 
      points = league_players.points + v_points_loss,
      matches_played = league_players.matches_played + 1,
      losses = league_players.losses + 1;
  END IF;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'match_id', v_match_id,
    'message', 'Match submitted successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result (transaction will be rolled back automatically)
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to submit match'
    );
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.swap_ladder_positions(p_league_id uuid, p_winner_player_id uuid, p_winner_old_position integer, p_loser_player_id uuid, p_loser_old_position integer, p_challenge_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_winner_new_position INTEGER;
  v_loser_new_position INTEGER;
BEGIN
  -- Winner takes loser's position (moves up)
  v_winner_new_position := p_loser_old_position;
  -- Loser takes winner's position (moves down)
  v_loser_new_position := p_winner_old_position;

  -- Constraint is DEFERRABLE INITIALLY DEFERRED, so direct swap works
  -- Update winner position
  UPDATE ladder_rankings
  SET position = v_winner_new_position,
      previous_position = p_winner_old_position,
      last_match_date = now(),
      updated_at = now()
  WHERE league_id = p_league_id AND player_id = p_winner_player_id;

  -- Update loser position
  UPDATE ladder_rankings
  SET position = v_loser_new_position,
      previous_position = p_loser_old_position,
      updated_at = now()
  WHERE league_id = p_league_id AND player_id = p_loser_player_id;

  -- Record history for winner
  INSERT INTO ladder_position_history (league_id, player_id, old_position, new_position, change_reason, challenge_id)
  VALUES (p_league_id, p_winner_player_id, p_winner_old_position, v_winner_new_position, 'match_win', p_challenge_id);

  -- Record history for loser
  INSERT INTO ladder_position_history (league_id, player_id, old_position, new_position, change_reason, challenge_id)
  VALUES (p_league_id, p_loser_player_id, p_loser_old_position, v_loser_new_position, 'match_loss', p_challenge_id);

  -- Update challenge with new positions
  UPDATE ladder_challenges
  SET new_challenger_position = CASE 
      WHEN challenger_player_id = p_winner_player_id THEN v_winner_new_position
      ELSE v_loser_new_position
    END,
    new_challenged_position = CASE 
      WHEN challenged_player_id = p_winner_player_id THEN v_winner_new_position
      ELSE v_loser_new_position
    END,
    updated_at = now()
  WHERE id = p_challenge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_city_player_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
  -- Update old city count if changing cities
  IF OLD.city_id IS NOT NULL AND OLD.city_id != NEW.city_id THEN
    UPDATE public.cities 
    SET player_count = GREATEST(0, player_count - 1),
        updated_at = NOW()
    WHERE id = OLD.city_id;
  END IF;
  
  -- Update new city count
  IF NEW.city_id IS NOT NULL THEN
    UPDATE public.cities 
    SET player_count = player_count + 1,
        updated_at = NOW()
    WHERE id = NEW.city_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ladder_wl_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
DECLARE
  loser_player_id UUID;
  loser_team_id UUID;
BEGIN
  -- Only trigger when status changes to 'completed' from another status
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Handle singles (player-based)
    IF NEW.winner_player_id IS NOT NULL THEN
      -- Determine loser
      loser_player_id := CASE
        WHEN NEW.winner_player_id = NEW.challenger_player_id THEN NEW.challenged_player_id
        ELSE NEW.challenger_player_id
      END;
      
      -- Update winner's wins
      UPDATE ladder_rankings
      SET wins = wins + 1, updated_at = now()
      WHERE league_id = NEW.league_id
        AND player_id = NEW.winner_player_id;
      
      -- Update loser's losses
      IF loser_player_id IS NOT NULL THEN
        UPDATE ladder_rankings
        SET losses = losses + 1, updated_at = now()
        WHERE league_id = NEW.league_id
          AND player_id = loser_player_id;
      END IF;
    END IF;
    
    -- Handle doubles (team-based)
    IF NEW.winner_team_id IS NOT NULL THEN
      loser_team_id := CASE
        WHEN NEW.winner_team_id = NEW.challenger_team_id THEN NEW.challenged_team_id
        ELSE NEW.challenger_team_id
      END;
      
      -- Update winner team's wins
      UPDATE ladder_rankings
      SET wins = wins + 1, updated_at = now()
      WHERE league_id = NEW.league_id
        AND doubles_team_id = NEW.winner_team_id;
      
      -- Update loser team's losses
      IF loser_team_id IS NOT NULL THEN
        UPDATE ladder_rankings
        SET losses = losses + 1, updated_at = now()
        WHERE league_id = NEW.league_id
          AND doubles_team_id = loser_team_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_league_player_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
  -- On INSERT or UPDATE, update the count for the new league
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE leagues SET active_player_count = (
      SELECT COUNT(*) FROM league_players
      WHERE league_id = NEW.league_id AND status = 'active'
    ) WHERE id = NEW.league_id;
  END IF;
  
  -- On DELETE or UPDATE (old row), update the count for the old league
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.league_id IS DISTINCT FROM NEW.league_id) THEN
    UPDATE leagues SET active_player_count = (
      SELECT COUNT(*) FROM league_players
      WHERE league_id = OLD.league_id AND status = 'active'
    ) WHERE id = OLD.league_id;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_league_player_stats(p_league_id uuid, p_player_id uuid, p_points_delta integer, p_matches_delta integer, p_wins_delta integer, p_losses_delta integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  -- Try to update existing record
  UPDATE public.league_players
  SET
    points = COALESCE(points, 0) + p_points_delta,
    matches_played = COALESCE(matches_played, 0) + p_matches_delta,
    wins = COALESCE(wins, 0) + p_wins_delta,
    losses = COALESCE(losses, 0) + p_losses_delta
  WHERE league_id = p_league_id AND player_id = p_player_id;
  
  -- If no record was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.league_players (
      league_id,
      player_id,
      points,
      matches_played,
      wins,
      losses
    ) VALUES (
      p_league_id,
      p_player_id,
      p_points_delta,
      p_matches_delta,
      p_wins_delta,
      p_losses_delta
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_player_country_from_city()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    -- When city_id is updated, automatically set the country fields from the cities table
    IF NEW.city_id IS NOT NULL THEN
        UPDATE players 
        SET 
            country_code = cities.country_code,
            country_name = cities.country_name
        FROM cities 
        WHERE cities.id = NEW.city_id 
        AND players.id = NEW.id;
    ELSE
        -- If city_id is cleared, clear country fields too
        NEW.country_code = NULL;
        NEW.country_name = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_player_country_from_city_before()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
BEGIN
    -- When city_id is updated, automatically set the country fields from the cities table
    IF NEW.city_id IS NOT NULL AND (OLD.city_id IS NULL OR OLD.city_id != NEW.city_id) THEN
        SELECT country_code, country_name
        INTO NEW.country_code, NEW.country_name
        FROM cities 
        WHERE id = NEW.city_id;
    ELSIF NEW.city_id IS NULL THEN
        -- If city_id is cleared, clear country fields too
        NEW.country_code = NULL;
        NEW.country_name = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_challenge(p_league_id uuid, p_player_id uuid, p_target_position integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_league RECORD;
  v_config JSONB;
  v_challenger_position INT;
  v_target_player_id UUID;
  v_target_is_active BOOLEAN;
  v_active_outgoing INT;
  v_active_incoming INT;
  v_target_active_incoming INT;
  v_recent_rechallenge INT;
  v_max_challenge_positions INT;
  v_max_active_outgoing INT;
  v_rechallenge_cooldown_days INT;
  v_cooldown_date TIMESTAMP;
BEGIN
  -- Get league config
  SELECT ladder_config, competition_type INTO v_league
  FROM leagues WHERE id = p_league_id;
  
  IF v_league IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'League not found');
  END IF;
  
  IF v_league.competition_type != 'ladder' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'This league is not a ladder competition');
  END IF;
  
  -- Parse config with defaults
  v_config := COALESCE(v_league.ladder_config, '{}'::jsonb);
  v_max_challenge_positions := COALESCE((v_config->>'max_challenge_positions')::int, 3);
  v_max_active_outgoing := COALESCE((v_config->>'max_active_outgoing_challenges')::int, 1);
  v_rechallenge_cooldown_days := COALESCE((v_config->>'rechallenge_cooldown_days')::int, 7);
  
  -- Get challenger's current position
  SELECT position INTO v_challenger_position
  FROM ladder_rankings
  WHERE league_id = p_league_id AND player_id = p_player_id AND is_active = true;
  
  IF v_challenger_position IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'You are not in this ladder');
  END IF;
  
  -- Check if trying to challenge someone below
  IF p_target_position >= v_challenger_position THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'reason', 'You can only challenge players ranked above you',
      'challenger_position', v_challenger_position
    );
  END IF;
  
  -- Check position range
  IF (v_challenger_position - p_target_position) > v_max_challenge_positions THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', format('You can only challenge up to %s positions above your current rank', v_max_challenge_positions),
      'challenger_position', v_challenger_position,
      'max_challenge_positions', v_max_challenge_positions
    );
  END IF;
  
  -- Get target player info
  SELECT player_id, is_active INTO v_target_player_id, v_target_is_active
  FROM ladder_rankings
  WHERE league_id = p_league_id AND position = p_target_position;
  
  IF v_target_player_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'No player found at that position',
      'challenger_position', v_challenger_position
    );
  END IF;
  
  -- Check if target is retired
  IF v_target_is_active = false THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'This player has retired from the ladder and cannot be challenged',
      'challenger_position', v_challenger_position
    );
  END IF;
  
  -- Count active outgoing challenges (exclude expired pending ones)
  SELECT COUNT(*) INTO v_active_outgoing
  FROM ladder_challenges
  WHERE league_id = p_league_id 
    AND challenger_player_id = p_player_id 
    AND status IN ('pending', 'accepted')
    AND (status != 'pending' OR acceptance_deadline > NOW());
  
  IF v_active_outgoing >= v_max_active_outgoing THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'You already have an active challenge',
      'challenger_position', v_challenger_position
    );
  END IF;
  
  -- Count active incoming challenges for challenger (exclude expired pending ones)
  SELECT COUNT(*) INTO v_active_incoming
  FROM ladder_challenges
  WHERE league_id = p_league_id 
    AND challenged_player_id = p_player_id 
    AND status IN ('pending', 'accepted')
    AND (status != 'pending' OR acceptance_deadline > NOW());
  
  IF v_active_incoming > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'You must respond to your pending challenge before issuing a new one',
      'challenger_position', v_challenger_position
    );
  END IF;
  
  -- Count active incoming challenges for target (exclude expired pending ones)
  SELECT COUNT(*) INTO v_target_active_incoming
  FROM ladder_challenges
  WHERE league_id = p_league_id 
    AND challenged_player_id = v_target_player_id 
    AND status IN ('pending', 'accepted')
    AND (status != 'pending' OR acceptance_deadline > NOW());
  
  IF v_target_active_incoming > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'This player already has an active challenge',
      'challenger_position', v_challenger_position
    );
  END IF;
  
  -- Check rechallenge cooldown
  IF v_rechallenge_cooldown_days > 0 THEN
    v_cooldown_date := NOW() - (v_rechallenge_cooldown_days || ' days')::interval;
    
    SELECT COUNT(*) INTO v_recent_rechallenge
    FROM ladder_challenges
    WHERE league_id = p_league_id
      AND challenger_player_id = p_player_id
      AND challenged_player_id = v_target_player_id
      AND created_at >= v_cooldown_date;
    
    IF v_recent_rechallenge > 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', format('You must wait %s days before challenging this player again', v_rechallenge_cooldown_days),
        'challenger_position', v_challenger_position
      );
    END IF;
  END IF;
  
  -- All validations passed
  RETURN jsonb_build_object(
    'valid', true,
    'challenger_position', v_challenger_position,
    'max_challenge_positions', v_max_challenge_positions
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_league_integrity(p_league_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(league_name text, player_name text, issue_type text, current_values jsonb, expected_values jsonb, severity text)
 LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH league_validation AS (
    SELECT 
      l.name as league_name,
      p.first_name || ' ' || p.last_name as player_name,
      
      -- Check stats consistency
      CASE 
        WHEN lp.wins + lp.losses != lp.matches_played THEN 'Stats Inconsistency'
        ELSE NULL
      END as stats_issue,
      
      -- Check points calculation
      CASE 
        WHEN lp.points != (lp.wins * COALESCE(l.default_points_win, 3) + lp.losses * COALESCE(l.default_points_loss, 0)) 
        THEN 'Points Calculation Error'
        ELSE NULL
      END as points_issue,
      
      -- Current values
      jsonb_build_object(
        'points', lp.points,
        'wins', lp.wins,
        'losses', lp.losses,
        'matches_played', lp.matches_played
      ) as current_vals,
      
      -- Expected values
      jsonb_build_object(
        'expected_matches', lp.wins + lp.losses,
        'expected_points', lp.wins * COALESCE(l.default_points_win, 3) + lp.losses * COALESCE(l.default_points_loss, 0)
      ) as expected_vals
      
    FROM league_players lp
    JOIN leagues l ON l.id = lp.league_id
    JOIN players p ON p.id = lp.player_id
    WHERE (p_league_id IS NULL OR lp.league_id = p_league_id)
  )
  
  -- Return stats inconsistencies
  SELECT 
    v.league_name,
    v.player_name,
    v.stats_issue as issue_type,
    v.current_vals as current_values,
    v.expected_vals as expected_values,
    'HIGH' as severity
  FROM league_validation v
  WHERE v.stats_issue IS NOT NULL
  
  UNION ALL
  
  -- Return points calculation errors
  SELECT 
    v.league_name,
    v.player_name,
    v.points_issue as issue_type,
    v.current_vals as current_values,
    v.expected_vals as expected_values,
    'CRITICAL' as severity
  FROM league_validation v
  WHERE v.points_issue IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_league_points()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
DECLARE
    v_points_win INTEGER;
    v_points_loss INTEGER;
    v_expected_min_points INTEGER;
    v_expected_max_points INTEGER;
BEGIN
    -- Get league point settings
    SELECT 
        COALESCE(default_points_win, 3),
        COALESCE(default_points_loss, 0)
    INTO v_points_win, v_points_loss
    FROM leagues 
    WHERE id = NEW.league_id;
    
    -- Calculate expected point range
    v_expected_min_points := (NEW.wins * v_points_win) + (NEW.losses * v_points_loss);
    v_expected_max_points := v_expected_min_points; -- For now, points should be exact
    
    -- Validate points are within expected range
    IF NEW.points < v_expected_min_points OR NEW.points > v_expected_max_points THEN
        RAISE EXCEPTION 'Invalid points: Expected % points for % wins and % losses in this league, but got %',
            v_expected_min_points, NEW.wins, NEW.losses, NEW.points;
    END IF;
    
    RETURN NEW;
END;
$$;

