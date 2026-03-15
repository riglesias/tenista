import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { ApiResponse, reportError } from '@/lib/utils/errors';
import {
    League,
    LeaguePlayer,
    LeagueStanding,
    LeagueStandingsSchema,
    LeaguesWithStatsSchema,
    LeagueWithStats,
    RawLeagueStandingsSchema,
    RawMultipleLeagueStandingsSchema,
    RawUserLeagueSchema,
    RawUserLeaguesSchema,
    UserLeague,
    UserLeagueSchema,
    UserLeaguesSchema
} from '@/lib/validation/leagues.validation';
import { getTournamentResultForPlayer, PlayoffMatchRow } from '@/lib/validation/playoffs.validation';

type LeagueInsert = Database['public']['Tables']['leagues']['Insert']
type LeaguePlayerInsert =
  Database['public']['Tables']['league_players']['Insert']

// Get available leagues in user's city
export async function getAvailableLeagues(cityId: string, playerOrganizationId?: string | null): Promise<ApiResponse<LeagueWithStats[]>> {
  try {
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('*, organizations(name)')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (error) throw error

    const {
      data: { user },
    } = await supabase.auth.getUser()
    let userActiveLeagues: string[] = []
    let userRetiredLeagues: string[] = []

    if (user) {
      const { data: userMemberships } = await supabase
        .from('league_players')
        .select('league_id, status')
        .eq('player_id', user.id)

      userActiveLeagues = userMemberships
        ?.filter((m: { league_id: string | null; status: string | null }) => m.status === 'active')
        .map((m: { league_id: string | null }) => m.league_id) || []

      userRetiredLeagues = userMemberships
        ?.filter((m: { league_id: string | null; status: string | null }) => m.status === 'retired')
        .map((m: { league_id: string | null }) => m.league_id) || []
    }

    // Use denormalized active_player_count column to avoid N+1 queries
    const leaguesWithStatsData = (leagues || []).map(league => ({
      ...league,
      player_count: (league as any).active_player_count || 0,
      user_is_member: userActiveLeagues.includes(league.id),
      user_is_retired: userRetiredLeagues.includes(league.id),
      organization_name: (league as any).organizations?.name || null,
    }))

    const validatedLeagues = LeaguesWithStatsSchema.parse(leaguesWithStatsData)

    // Filter out club-only leagues that the player doesn't belong to
    const visibleLeagues = validatedLeagues.filter(league => {
      if (!league.organization_id) return true
      return playerOrganizationId && league.organization_id === playerOrganizationId
    })

    return { data: visibleLeagues, error: null }
  } catch (error) {
    const appError = reportError(error, 'getAvailableLeagues')
    return { data: null, error: appError }
  }
}

// Join a league
export async function joinLeague(leagueId: string, playerId: string) {
  try {
    // Check for any existing membership (active or retired)
    const { data: existingMembership } = await supabase
      .from('league_players')
      .select('id, status')
      .eq('league_id', leagueId)
      .eq('player_id', playerId)
      .single()

    if (existingMembership) {
      // Check if player has retired from this league
      if (existingMembership.status === 'retired') {
        const error = new Error('You have already retired from this league and cannot rejoin');
        return { data: null, error }
      }
      // Already an active member
      const error = new Error('Already a member of this league');
      return { data: null, error }
    }

    const { data: league } = await supabase
      .from('leagues')
      .select('max_players, competition_type, participant_type, start_date')
      .eq('id', leagueId)
      .single()

    if (league) {
      // Check if registration is closed (league has already started)
      if (league.start_date) {
        const startDate = new Date(league.start_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Compare dates only, not times
        if (today >= startDate) {
          const error = new Error('Registration is closed. This league has already started.');
          return { data: null, error }
        }
      }

      const { count } = await supabase
        .from('league_players')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)

      if (league.max_players && count && count >= league.max_players) {
        const error = new Error('League is full');
        return { data: null, error }
      }

      // Check if this is a doubles league - require team registration separately
      if (league.participant_type === 'doubles') {
        const error = new Error('This is a doubles league. Please register with a partner.');
        return { data: null, error }
      }
    }

    const membershipData: LeaguePlayerInsert = {
      league_id: leagueId,
      player_id: playerId,
      points: 0,
      matches_played: 0,
      wins: 0,
      losses: 0,
    }

    const { data, error } = await supabase
      .from('league_players')
      .insert(membershipData)
      .select()
      .single()

    if (error) {
      throw error;
    }

    // If this is a ladder league, also add to ladder_rankings
    if (league?.competition_type === 'ladder') {
      // Get the next available position
      const { data: maxPosition } = await supabase
        .from('ladder_rankings')
        .select('position')
        .eq('league_id', leagueId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPosition?.position || 0) + 1;

      // Add to ladder rankings
      await supabase
        .from('ladder_rankings')
        .insert({
          league_id: leagueId,
          player_id: playerId,
          position: newPosition,
          is_active: true,
        });

      // Update the league_player with ladder_position
      await supabase
        .from('league_players')
        .update({ ladder_position: newPosition })
        .eq('id', data.id);

      // Record initial placement in history
      await supabase
        .from('ladder_position_history')
        .insert({
          league_id: leagueId,
          player_id: playerId,
          old_position: newPosition,
          new_position: newPosition,
          change_reason: 'initial_placement',
        });
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get league standings/rankings
export async function getLeagueStandings(
  leagueId: string
): Promise<{ data: LeagueStanding[] | null; error: any }> {
  try {
    // First check the competition type
    const { data: league } = await supabase
      .from('leagues')
      .select('competition_type')
      .eq('id', leagueId)
      .single();

    // For ladder leagues, order by ladder_position instead of points
    const orderColumn = league?.competition_type === 'ladder' ? 'ladder_position' : 'points';
    const orderAscending = league?.competition_type === 'ladder'; // Ladder: position 1 is best

    const { data, error } = await supabase
      .from('league_players')
      .select(
        `
        player_id,
        points,
        matches_played,
        wins,
        losses,
        ladder_position,
        player:players!player_id(
          first_name,
          last_name,
          rating,
          nationality_code,
          is_active
        )
      `
      )
      .eq('league_id', leagueId)
      .order(orderColumn, { ascending: orderAscending, nullsFirst: false })
      .order('wins', { ascending: false })

    if (error) throw error

    const rawStandings = RawLeagueStandingsSchema.parse(data)

    // Filter out inactive players
    const activeStandings = rawStandings.filter(item =>
      item.player && (item.player as any).is_active !== false
    )

    const standings = activeStandings.map((item, index) => {
      // Format name like "Roberto I." (full first name + last initial)
      const firstName = item.player?.first_name || ''
      const lastName = item.player?.last_name || ''
      const playerName = firstName && lastName
        ? `${firstName} ${lastName.charAt(0)}.`
        : `${firstName} ${lastName}`.trim()

      // For ladder leagues, use the ladder_position; otherwise calculate from index
      const position = league?.competition_type === 'ladder'
        ? ((item as any).ladder_position || index + 1)
        : index + 1;

      return {
        player_id: item.player_id!,
        player_name: playerName,
        player_rating: item.player?.rating,
        nationality_code: item.player?.nationality_code,
        points: item.points || 0,
        matches_played: item.matches_played || 0,
        wins: item.wins || 0,
        losses: item.losses || 0,
        position,
      }
    })

    const validatedStandings = LeagueStandingsSchema.parse(standings)

    return { data: validatedStandings, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

// Join a doubles league with a partner
export async function joinDoublesLeague(
  leagueId: string,
  player1Id: string,
  player2Id: string,
  teamName?: string
): Promise<{ data: any; error: any }> {
  try {
    // Import doubles actions dynamically to avoid circular dependencies
    const { createDoublesTeam } = await import('./doubles.actions');
    const { orderPlayerIds } = await import('@/lib/validation/doubles.validation');

    // Verify this is a doubles league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('participant_type, competition_type, max_players')
      .eq('id', leagueId)
      .single();

    if (leagueError) throw leagueError;

    if (league.participant_type !== 'doubles') {
      throw new Error('This league is for singles players only');
    }

    // Check if either player is already in the league
    const { data: existingMemberships } = await supabase
      .from('league_players')
      .select('player_id')
      .eq('league_id', leagueId)
      .in('player_id', [player1Id, player2Id]);

    if (existingMemberships && existingMemberships.length > 0) {
      throw new Error('One or both players are already in this league');
    }

    // Check if league is full (counting teams, not individuals)
    const { count: teamCount } = await supabase
      .from('doubles_teams')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('is_active', true);

    if (league.max_players && teamCount && teamCount >= league.max_players) {
      throw new Error('League is full');
    }

    // Create the doubles team
    const teamResult = await createDoublesTeam(leagueId, player1Id, player2Id, teamName);
    if (teamResult.error) throw teamResult.error;

    const team = teamResult.data!;

    // Add both players to league_players
    const { player1_id, player2_id } = orderPlayerIds(player1Id, player2Id);

    const membershipData: LeaguePlayerInsert[] = [
      {
        league_id: leagueId,
        player_id: player1_id,
        doubles_team_id: team.id,
        points: 0,
        matches_played: 0,
        wins: 0,
        losses: 0,
      },
      {
        league_id: leagueId,
        player_id: player2_id,
        doubles_team_id: team.id,
        points: 0,
        matches_played: 0,
        wins: 0,
        losses: 0,
      },
    ];

    const { data: memberships, error: membershipError } = await supabase
      .from('league_players')
      .insert(membershipData)
      .select();

    if (membershipError) throw membershipError;

    // If this is a ladder league, add team to ladder_rankings
    if (league.competition_type === 'ladder') {
      const { data: maxPosition } = await supabase
        .from('ladder_rankings')
        .select('position')
        .eq('league_id', leagueId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPosition?.position || 0) + 1;

      await supabase
        .from('ladder_rankings')
        .insert({
          league_id: leagueId,
          doubles_team_id: team.id,
          position: newPosition,
          is_active: true,
        });

      // Update ladder_position for both players
      await supabase
        .from('league_players')
        .update({ ladder_position: newPosition })
        .eq('league_id', leagueId)
        .eq('doubles_team_id', team.id);

      // Record initial placement
      await supabase
        .from('ladder_position_history')
        .insert({
          league_id: leagueId,
          doubles_team_id: team.id,
          old_position: newPosition,
          new_position: newPosition,
          change_reason: 'initial_placement',
        });
    }

    return { data: { team, memberships }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Get user's current leagues (optimized version)
export async function getUserLeagues(
  playerId: string
): Promise<ApiResponse<UserLeague[]>> {
  try {
    // First, get the user's league memberships
    const { data, error } = await supabase
      .from('league_players')
      .select(
        `
        id,
        league_id,
        player_id,
        points,
        matches_played,
        wins,
        losses,
        league:leagues!league_id(
          id,
          created_at,
          name,
          city_id,
          start_date,
          end_date,
          max_players,
          min_rating,
          max_rating,
          is_active,
          is_free,
          default_points_win,
          default_points_loss,
          division,
          price_cents,
          organizer_id,
          location,
          is_private,
          updated_at,
          category,
          has_playoffs,
          image_url,
          competition_type,
          participant_type,
          ladder_config,
          elimination_format,
          match_format
        )
      `
      )
      .eq('player_id', playerId)
      .eq('status', 'active')
      .eq('league.is_active', true)
      .gte('league.end_date', new Date().toISOString().split('T')[0])

    if (error) throw error

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    // Filter out rows where the joined league is null (filtered out by join conditions)
    const filteredData = data.filter((row: any) => row.league !== null)

    if (filteredData.length === 0) {
      return { data: [], error: null }
    }

    const rawUserLeagues = RawUserLeaguesSchema.parse(filteredData)

    // Extract all league IDs for batch fetching
    const leagueIds = rawUserLeagues.map(item => item.league_id).filter((id): id is string => id !== null)

    // Fetch all standings in a single batch operation
    const { data: standingsByLeague, error: standingsError } = await getMultipleLeagueStandings(leagueIds)

    if (standingsError) {
      throw new Error(standingsError.message)
    }

    // Build the user leagues data with standings information
    const userLeaguesData: UserLeague[] = rawUserLeagues.map(rawLeague => {
      const leagueId = rawLeague.league_id
      const standings = leagueId ? (standingsByLeague?.[leagueId] || []) : []
      const userPosition = standings.findIndex((s: LeagueStanding) => s.player_id === playerId) + 1
      const totalPlayers = standings.length

      const { league, ...membershipData } = rawLeague

      return {
        league: league,
        membership: membershipData as LeaguePlayer,
        user_position: userPosition || 0,
        total_players: totalPlayers,
      }
    })

    const validatedUserLeagues = UserLeaguesSchema.parse(userLeaguesData)

    return { data: validatedUserLeagues, error: null }
  } catch (error) {
    const appError = reportError(error, 'getUserLeagues')
    return { data: null, error: appError }
  }
}

// Optimized function to get multiple league standings in a single query
export async function getMultipleLeagueStandings(
  leagueIds: string[]
): Promise<ApiResponse<Record<string, LeagueStanding[]>>> {
  try {
    if (leagueIds.length === 0) {
      return { data: {}, error: null }
    }

    const { data, error } = await supabase
      .from('league_players')
      .select(
        `
        league_id,
        player_id,
        points,
        matches_played,
        wins,
        losses,
        player:players!player_id(
          first_name,
          last_name,
          rating,
          nationality_code,
          is_active
        )
      `
      )
      .in('league_id', leagueIds)
      .order('league_id')
      .order('points', { ascending: false })
      .order('wins', { ascending: false })

    if (error) throw error

    const rawStandings = RawMultipleLeagueStandingsSchema.parse(data)

    // Filter out inactive players
    const activeStandings = rawStandings.filter(item => 
      item.player && item.player.is_active !== false
    )

    // Group standings by league_id
    const standingsByLeague: Record<string, LeagueStanding[]> = {}

    activeStandings.forEach((item) => {
      const leagueId = item.league_id!
      if (!standingsByLeague[leagueId]) {
        standingsByLeague[leagueId] = []
      }

      // Format name like "Roberto I." (full first name + last initial)
      const firstName = item.player?.first_name || ''
      const lastName = item.player?.last_name || ''
      const playerName = firstName && lastName 
        ? `${firstName} ${lastName.charAt(0)}.`
        : `${firstName} ${lastName}`.trim()
      
      standingsByLeague[leagueId].push({
        player_id: item.player_id!,
        player_name: playerName,
        player_rating: item.player?.rating ?? null,
        nationality_code: item.player?.nationality_code ?? null,
        points: item.points || 0,
        matches_played: item.matches_played || 0,
        wins: item.wins || 0,
        losses: item.losses || 0,
        position: 0, // Will be set below
      })
    })

    // Set positions within each league
    Object.keys(standingsByLeague).forEach((leagueId) => {
      standingsByLeague[leagueId] = standingsByLeague[leagueId].map((standing, index) => ({
        ...standing,
        position: index + 1,
      }))
    })

    // Validate all standings
    const validatedStandings: Record<string, LeagueStanding[]> = {}
    Object.keys(standingsByLeague).forEach((leagueId) => {
      validatedStandings[leagueId] = LeagueStandingsSchema.parse(standingsByLeague[leagueId])
    })

    return { data: validatedStandings, error: null }
  } catch (error) {
    const appError = reportError(error, 'getMultipleLeagueStandings')
    return { data: null, error: appError }
  }
}

// Retire from a league (soft delete - keeps player visible but marked as retired)
export async function retireFromLeague(leagueId: string, playerId: string) {
  try {
    // Check if this is a ladder league
    const { data: league } = await supabase
      .from('leagues')
      .select('competition_type')
      .eq('id', leagueId)
      .single();

    // For ladder leagues, handle active challenges first
    if (league?.competition_type === 'ladder') {
      // Find any active challenges where player is involved
      const { data: activeChallenges } = await supabase
        .from('ladder_challenges')
        .select('*')
        .eq('league_id', leagueId)
        .or(`challenger_player_id.eq.${playerId},challenged_player_id.eq.${playerId}`)
        .in('status', ['pending', 'accepted']);

      // Process each active challenge - award walkover to opponent
      for (const challenge of activeChallenges || []) {
        const retiringPlayerIsChallenger = challenge.challenger_player_id === playerId;
        const winnerId = retiringPlayerIsChallenger
          ? challenge.challenged_player_id
          : challenge.challenger_player_id;

        // If the retiring player was the challenger, opponent wins by walkover (no position change)
        // If the retiring player was the challenged, challenger wins by walkover (position swap)
        if (!retiringPlayerIsChallenger && winnerId) {
          // Challenger wins - swap positions
          const { error: swapError } = await supabase.rpc('swap_ladder_positions', {
            p_league_id: leagueId,
            p_winner_player_id: challenge.challenger_player_id,
            p_winner_old_position: challenge.challenger_position,
            p_loser_player_id: challenge.challenged_player_id,
            p_loser_old_position: challenge.challenged_position,
            p_challenge_id: challenge.id,
          });

          if (swapError) {
            // silently handled
          }
        }

        // Update the challenge status
        await supabase
          .from('ladder_challenges')
          .update({
            status: 'completed',
            winner_player_id: winnerId,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', challenge.id);
      }

      // Set ladder_rankings.is_active = false (keeps player visible but marked retired)
      const { data: ranking } = await supabase
        .from('ladder_rankings')
        .select('position')
        .eq('league_id', leagueId)
        .eq('player_id', playerId)
        .single();

      if (ranking) {
        await supabase
          .from('ladder_rankings')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('league_id', leagueId)
          .eq('player_id', playerId);

        // Record retirement in history
        await supabase
          .from('ladder_position_history')
          .insert({
            league_id: leagueId,
            player_id: playerId,
            old_position: ranking.position,
            new_position: ranking.position,
            change_reason: 'player_retired',
          });
      }
    }

    // Update league_players status to 'retired' (soft delete)
    const { error } = await supabase
      .from('league_players')
      .update({ status: 'retired' })
      .eq('league_id', leagueId)
      .eq('player_id', playerId)

    if (error) {
      throw error
    }

    return { data: true, error: null }
  } catch (error) {
    return { data: false, error }
  }
}

// Leave a league (alias for retireFromLeague for backward compatibility)
export async function leaveLeague(leagueId: string, playerId: string) {
  return retireFromLeague(leagueId, playerId);
}

// Create a new league (for admin functionality)
export async function createLeague(leagueData: LeagueInsert) {
  try {
    const { data, error } = await supabase
      .from('leagues')
      .insert(leagueData)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

// Get user's completed leagues (ended or retired from)
export async function getCompletedUserLeagues(
  playerId: string
): Promise<ApiResponse<UserLeague[]>> {
  try {
    const { data, error } = await supabase
      .from('league_players')
      .select(
        `
        id,
        league_id,
        player_id,
        points,
        matches_played,
        wins,
        losses,
        status,
        league:leagues!league_id(
          id,
          created_at,
          name,
          city_id,
          start_date,
          end_date,
          max_players,
          min_rating,
          max_rating,
          is_active,
          is_free,
          default_points_win,
          default_points_loss,
          division,
          price_cents,
          organizer_id,
          location,
          is_private,
          updated_at,
          category,
          has_playoffs,
          image_url,
          competition_type,
          participant_type,
          ladder_config,
          elimination_format,
          match_format
        )
      `
      )
      .eq('player_id', playerId)

    if (error) throw error

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    const rawUserLeagues = RawUserLeaguesSchema.parse(data)

    const today = new Date().toISOString().split('T')[0]

    // Filter: ended leagues OR retired from
    const completedLeagues = rawUserLeagues.filter(item => {
      const league = item.league
      const isEnded = league.end_date < today
      const isRetired = item.status === 'retired'
      return isEnded || isRetired
    })

    if (completedLeagues.length === 0) {
      return { data: [], error: null }
    }

    // Sort by end_date descending (most recent first)
    completedLeagues.sort((a, b) =>
      b.league.end_date.localeCompare(a.league.end_date)
    )

    const leagueIds = completedLeagues
      .map(item => item.league_id)
      .filter((id): id is string => id !== null)

    const { data: standingsByLeague, error: standingsError } =
      await getMultipleLeagueStandings(leagueIds)

    if (standingsError) {
      throw new Error(standingsError.message)
    }

    // Fetch tournament results from playoff_matches for tournament-type leagues
    const tournamentLeagueIds = completedLeagues
      .filter(item => item.league.competition_type === 'playoffs_only' || item.league.competition_type === 'elimination')
      .map(item => item.league_id)
      .filter((id): id is string => id !== null)

    // Maps: leagueId → { tournamentId, totalRounds }, tournamentId → leagueId
    let tournamentByLeagueId: Record<string, { tournamentId: string; totalRounds: number }> = {}
    let matchesByLeagueId: Record<string, PlayoffMatchRow[]> = {}

    if (tournamentLeagueIds.length > 0) {
      try {
        // 1) Get playoff_tournaments for these leagues
        const { data: playoffRows } = await supabase
          .from('playoff_tournaments')
          .select('id, league_id, total_rounds')
          .in('league_id', tournamentLeagueIds)

        if (playoffRows && playoffRows.length > 0) {
          const tournamentIdToLeagueId: Record<string, string> = {}
          for (const row of playoffRows) {
            tournamentByLeagueId[row.league_id] = {
              tournamentId: row.id,
              totalRounds: row.total_rounds,
            }
            tournamentIdToLeagueId[row.id] = row.league_id
          }

          const tournamentIds = playoffRows.map(r => r.id)

          // 2) Get playoff_matches joined with playoff_rounds for the current player
          const { data: matchRows } = await supabase
            .from('playoff_matches')
            .select('winner_id, player1_id, player2_id, status, playoff_rounds!inner(round_number, round_name, playoff_tournament_id)')
            .in('playoff_rounds.playoff_tournament_id', tournamentIds)
            .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)

          if (matchRows) {
            for (const row of matchRows as any[]) {
              const round = row.playoff_rounds
              const tournamentId = round.playoff_tournament_id
              const leagueId = tournamentIdToLeagueId[tournamentId]
              if (!leagueId) continue

              if (!matchesByLeagueId[leagueId]) {
                matchesByLeagueId[leagueId] = []
              }
              matchesByLeagueId[leagueId].push({
                winner_id: row.winner_id,
                player1_id: row.player1_id,
                player2_id: row.player2_id,
                status: row.status,
                round_number: round.round_number,
                round_name: round.round_name,
              })
            }
          }
        }
      } catch {
        // Graceful fallback: tournament_result stays null
      }
    }

    const userLeaguesData: UserLeague[] = completedLeagues.map(rawLeague => {
      const leagueId = rawLeague.league_id
      const standings = leagueId ? (standingsByLeague?.[leagueId] || []) : []
      const userPosition =
        standings.findIndex((s: LeagueStanding) => s.player_id === playerId) + 1
      const totalPlayers = standings.length

      const { league, ...membershipData } = rawLeague

      // Determine tournament result from playoff_matches
      let tournament_result = null
      if (leagueId && tournamentByLeagueId[leagueId] && matchesByLeagueId[leagueId]) {
        const { totalRounds } = tournamentByLeagueId[leagueId]
        const result = getTournamentResultForPlayer(matchesByLeagueId[leagueId], playerId, totalRounds)
        if (result) {
          tournament_result = result
        }
      }

      return {
        league: league,
        membership: membershipData as LeaguePlayer,
        user_position: userPosition || 0,
        total_players: totalPlayers,
        tournament_result,
      }
    })

    const validatedUserLeagues = UserLeaguesSchema.parse(userLeaguesData)

    return { data: validatedUserLeagues, error: null }
  } catch (error) {
    const appError = reportError(error, 'getCompletedUserLeagues')
    return { data: null, error: appError }
  }
}

// Get a single league detail for a player
export async function getLeagueDetail(
  leagueId: string,
  playerId: string
): Promise<ApiResponse<UserLeague>> {
  try {
    const { data, error } = await supabase
      .from('league_players')
      .select(
        `
        id,
        league_id,
        player_id,
        points,
        matches_played,
        wins,
        losses,
        status,
        league:leagues!league_id(
          id,
          created_at,
          name,
          city_id,
          start_date,
          end_date,
          max_players,
          min_rating,
          max_rating,
          is_active,
          is_free,
          default_points_win,
          default_points_loss,
          division,
          price_cents,
          organizer_id,
          location,
          is_private,
          updated_at,
          category,
          has_playoffs,
          image_url,
          competition_type,
          participant_type,
          ladder_config,
          elimination_format,
          match_format
        )
      `
      )
      .eq('league_id', leagueId)
      .eq('player_id', playerId)
      .single()

    if (error) throw error
    if (!data) throw new Error('League membership not found')

    const rawUserLeague = RawUserLeagueSchema.parse(data)

    const { data: standings, error: standingsError } =
      await getLeagueStandings(leagueId)

    if (standingsError) {
      throw new Error(standingsError)
    }

    const userPosition =
      (standings || []).findIndex(
        (s: LeagueStanding) => s.player_id === playerId
      ) + 1
    const totalPlayers = (standings || []).length

    const { league, ...membershipData } = rawUserLeague

    const userLeague: UserLeague = {
      league: league,
      membership: membershipData as LeaguePlayer,
      user_position: userPosition || 0,
      total_players: totalPlayers,
    }

    return { data: UserLeagueSchema.parse(userLeague), error: null }
  } catch (error) {
    const appError = reportError(error, 'getLeagueDetail')
    return { data: null, error: appError }
  }
}

// Sync league standings from match results
export async function syncLeagueStandings(leagueId: string) {
  try {
    // Get all league matches
    const { data: matches, error: matchesError } = await supabase
      .from('player_matches')
      .select('*')
      .eq('league_id', leagueId)
      .not('winner_id', 'is', null)

    if (matchesError) throw matchesError

    // Get league point settings
    const { data: league } = await supabase
      .from('leagues')
      .select('default_points_win, default_points_loss')
      .eq('id', leagueId)
      .single()

    const pointsForWin = league?.default_points_win || 3
    const pointsForLoss = league?.default_points_loss || 0

    // Reset all league player stats for this league
    await supabase
      .from('league_players')
      .update({
        points: 0,
        matches_played: 0,
        wins: 0,
        losses: 0
      })
      .eq('league_id', leagueId)

    // Process each match
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const winnerId = match.winner_id!
        const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id

        // Update winner stats
        await supabase.rpc('update_league_player_stats', {
          p_league_id: leagueId,
          p_player_id: winnerId,
          p_points_delta: pointsForWin,
          p_matches_delta: 1,
          p_wins_delta: 1,
          p_losses_delta: 0
        })

        // Update loser stats  
        await supabase.rpc('update_league_player_stats', {
          p_league_id: leagueId,
          p_player_id: loserId,
          p_points_delta: pointsForLoss,
          p_matches_delta: 1,
          p_wins_delta: 0,
          p_losses_delta: 1
        })
      }
    }

    return { success: true, error: null }
  } catch (error) {
    // silently handled
    return { success: false, error }
  }
} 