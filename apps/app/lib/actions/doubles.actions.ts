import { supabase } from '@/lib/supabase';
import { ApiResponse, reportError } from '@/lib/utils/errors';
import {
  DoublesTeam,
  DoublesTeamSchema,
  DoublesTeamWithPlayers,
  DoublesTeamsWithPlayersSchema,
  calculateCombinedRating,
  orderPlayerIds,
} from '@/lib/validation/doubles.validation';

/**
 * Create a doubles team for a league
 */
export async function createDoublesTeam(
  leagueId: string,
  player1Id: string,
  player2Id: string,
  teamName?: string
): Promise<ApiResponse<DoublesTeam>> {
  try {
    // Ensure player IDs are ordered correctly (constraint requires player1_id < player2_id)
    const { player1_id, player2_id } = orderPlayerIds(player1Id, player2Id);

    // Check if either player is already on a team in this league
    const { data: existingTeams, error: checkError } = await supabase
      .from('doubles_teams')
      .select('id, player1_id, player2_id')
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .or(`player1_id.eq.${player1_id},player2_id.eq.${player2_id},player1_id.eq.${player2_id},player2_id.eq.${player1_id}`);

    if (checkError) throw checkError;

    if (existingTeams && existingTeams.length > 0) {
      throw new Error('One or both players are already on a team in this league');
    }

    // Get player ratings for combined rating calculation
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, rating')
      .in('id', [player1_id, player2_id]);

    if (playersError) throw playersError;

    const player1Rating = players?.find((p: { id: string; rating: number | null }) => p.id === player1_id)?.rating || null;
    const player2Rating = players?.find((p: { id: string; rating: number | null }) => p.id === player2_id)?.rating || null;
    const combinedRating = calculateCombinedRating(player1Rating, player2Rating);

    // Create the team
    const { data: team, error } = await supabase
      .from('doubles_teams')
      .insert({
        league_id: leagueId,
        player1_id,
        player2_id,
        team_name: teamName || null,
        combined_rating: combinedRating,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    const validatedTeam = DoublesTeamSchema.parse(team);

    return { data: validatedTeam, error: null };
  } catch (error) {
    const appError = reportError(error, 'createDoublesTeam');
    return { data: null, error: appError };
  }
}

/**
 * Get a doubles team by ID
 */
export async function getDoublesTeam(
  teamId: string
): Promise<ApiResponse<DoublesTeamWithPlayers | null>> {
  try {
    const { data, error } = await supabase
      .from('doubles_teams')
      .select(`
        *,
        player1:players!player1_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        ),
        player2:players!player2_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        )
      `)
      .eq('id', teamId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return { data: null, error: null };
    }

    const teams = DoublesTeamsWithPlayersSchema.parse([data]);
    return { data: teams[0], error: null };
  } catch (error) {
    const appError = reportError(error, 'getDoublesTeam');
    return { data: null, error: appError };
  }
}

/**
 * Get all doubles teams for a player
 */
export async function getMyDoublesTeams(
  playerId: string
): Promise<ApiResponse<DoublesTeamWithPlayers[]>> {
  try {
    const { data, error } = await supabase
      .from('doubles_teams')
      .select(`
        *,
        player1:players!player1_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        ),
        player2:players!player2_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        )
      `)
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const teams = DoublesTeamsWithPlayersSchema.parse(data || []);
    return { data: teams, error: null };
  } catch (error) {
    const appError = reportError(error, 'getMyDoublesTeams');
    return { data: null, error: appError };
  }
}

/**
 * Get all doubles teams in a league
 */
export async function getLeagueDoublesTeams(
  leagueId: string
): Promise<ApiResponse<DoublesTeamWithPlayers[]>> {
  try {
    const { data, error } = await supabase
      .from('doubles_teams')
      .select(`
        *,
        player1:players!player1_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        ),
        player2:players!player2_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        )
      `)
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .order('combined_rating', { ascending: false, nullsFirst: false });

    if (error) throw error;

    const teams = DoublesTeamsWithPlayersSchema.parse(data || []);
    return { data: teams, error: null };
  } catch (error) {
    const appError = reportError(error, 'getLeagueDoublesTeams');
    return { data: null, error: appError };
  }
}

/**
 * Update a doubles team
 */
export async function updateDoublesTeam(
  teamId: string,
  updates: { team_name?: string }
): Promise<ApiResponse<DoublesTeam>> {
  try {
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

    // Verify user is on the team
    const { data: team, error: fetchError } = await supabase
      .from('doubles_teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (fetchError) throw fetchError;

    if (team.player1_id !== player.id && team.player2_id !== player.id) {
      throw new Error('You can only update teams you are a member of');
    }

    // Update the team
    const { data: updatedTeam, error } = await supabase
      .from('doubles_teams')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    const validatedTeam = DoublesTeamSchema.parse(updatedTeam);

    return { data: validatedTeam, error: null };
  } catch (error) {
    const appError = reportError(error, 'updateDoublesTeam');
    return { data: null, error: appError };
  }
}

/**
 * Disband (deactivate) a doubles team
 */
export async function disbandDoublesTeam(
  teamId: string
): Promise<ApiResponse<boolean>> {
  try {
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

    // Verify user is on the team
    const { data: team, error: fetchError } = await supabase
      .from('doubles_teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (fetchError) throw fetchError;

    if (team.player1_id !== player.id && team.player2_id !== player.id) {
      throw new Error('You can only disband teams you are a member of');
    }

    // Check for active challenges involving this team
    const { count: activeChallenges } = await supabase
      .from('ladder_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', team.league_id)
      .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
      .in('status', ['pending', 'accepted']);

    if (activeChallenges && activeChallenges > 0) {
      throw new Error('Cannot disband team with active challenges');
    }

    // Deactivate the team
    const { error } = await supabase
      .from('doubles_teams')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId);

    if (error) throw error;

    // Also deactivate any ladder ranking for this team
    await supabase
      .from('ladder_rankings')
      .update({ is_active: false })
      .eq('doubles_team_id', teamId);

    return { data: true, error: null };
  } catch (error) {
    const appError = reportError(error, 'disbandDoublesTeam');
    return { data: null, error: appError };
  }
}

/**
 * Get partner for creating a doubles team (players in the league without a team)
 */
export async function getAvailablePartners(
  leagueId: string,
  excludePlayerId: string
): Promise<ApiResponse<Array<{
  id: string;
  first_name: string | null;
  last_name: string | null;
  rating: number | null;
  avatar_url: string | null;
}>>> {
  try {
    // Get all players in the league
    const { data: leaguePlayers, error: lpError } = await supabase
      .from('league_players')
      .select('player_id')
      .eq('league_id', leagueId)
      .neq('player_id', excludePlayerId);

    if (lpError) throw lpError;

    if (!leaguePlayers || leaguePlayers.length === 0) {
      return { data: [], error: null };
    }

    const playerIds = leaguePlayers.map((lp: { player_id: string | null }) => lp.player_id).filter(Boolean);

    // Get players already on a team
    const { data: existingTeams, error: teamsError } = await supabase
      .from('doubles_teams')
      .select('player1_id, player2_id')
      .eq('league_id', leagueId)
      .eq('is_active', true);

    if (teamsError) throw teamsError;

    const playersOnTeams = new Set<string>();
    existingTeams?.forEach((team: { player1_id: string | null; player2_id: string | null }) => {
      if (team.player1_id) playersOnTeams.add(team.player1_id);
      if (team.player2_id) playersOnTeams.add(team.player2_id);
    });

    // Filter to available players
    const availablePlayerIds = playerIds.filter((id: string | null): id is string => id !== null && !playersOnTeams.has(id));

    if (availablePlayerIds.length === 0) {
      return { data: [], error: null };
    }

    // Get player details
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, first_name, last_name, rating, avatar_url')
      .in('id', availablePlayerIds)
      .eq('is_active', true)
      .order('rating', { ascending: false, nullsFirst: false });

    if (playersError) throw playersError;

    return { data: players || [], error: null };
  } catch (error) {
    const appError = reportError(error, 'getAvailablePartners');
    return { data: null, error: appError };
  }
}

/**
 * Check if a player has a team in a specific league
 */
export async function getPlayerTeamInLeague(
  leagueId: string,
  playerId: string
): Promise<ApiResponse<DoublesTeamWithPlayers | null>> {
  try {
    const { data, error } = await supabase
      .from('doubles_teams')
      .select(`
        *,
        player1:players!player1_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        ),
        player2:players!player2_id(
          id,
          first_name,
          last_name,
          rating,
          nationality_code,
          avatar_url
        )
      `)
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { data: null, error: null };
    }

    const teams = DoublesTeamsWithPlayersSchema.parse([data]);
    return { data: teams[0], error: null };
  } catch (error) {
    const appError = reportError(error, 'getPlayerTeamInLeague');
    return { data: null, error: appError };
  }
}
