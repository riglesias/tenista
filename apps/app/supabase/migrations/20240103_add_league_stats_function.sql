-- Create function to update league player statistics
CREATE OR REPLACE FUNCTION public.update_league_player_stats(
  p_league_id UUID,
  p_player_id UUID,
  p_points_delta INTEGER,
  p_matches_delta INTEGER,
  p_wins_delta INTEGER,
  p_losses_delta INTEGER
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER; 