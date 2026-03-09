import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { ApiResponse, reportError } from '@/lib/utils/errors';
import {
    LeagueStanding,
    LeagueStandingsSchema,
    RawMultipleLeagueStandingsSchema,
    RawUserLeaguesSchema,
    UserLeague,
    UserLeaguesSchema,
    LeaguePlayer
} from '@/lib/validation/leagues.validation';

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
          nationality_code
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
      const firstName = item.player.first_name || ''
      const lastName = item.player.last_name || ''
      const playerName = firstName && lastName 
        ? `${firstName} ${lastName.charAt(0)}.`
        : `${firstName} ${lastName}`.trim()
      
      standingsByLeague[leagueId].push({
        player_id: item.player_id!,
        player_name: playerName,
        player_rating: item.player.rating,
        nationality_code: item.player.nationality_code,
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

// Optimized getUserLeagues that uses batch fetching
export async function getUserLeaguesOptimized(
  playerId: string
): Promise<ApiResponse<UserLeague[]>> {
  try {
    // First, get the user's league memberships
    const { data, error } = await supabase
      .from('league_players')
      .select(
        `
        *,
        league:leagues!league_id(*)
      `
      )
      .eq('player_id', playerId)
      .eq('league.is_active', true)

    if (error) throw error

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    const rawUserLeagues = RawUserLeaguesSchema.parse(data)

    // Extract all league IDs for batch fetching
    const leagueIds = rawUserLeagues.map(league => league.league_id)

    // Fetch all standings in a single batch operation
    const { data: standingsByLeague, error: standingsError } = await getMultipleLeagueStandings(leagueIds)

    if (standingsError) {
      throw new Error(standingsError.message)
    }

    // Build the user leagues data with standings information
    const userLeaguesData: UserLeague[] = rawUserLeagues.map(rawLeague => {
      const standings = standingsByLeague?.[rawLeague.league_id] || []
      const userPosition = standings.findIndex((s) => s.player_id === playerId) + 1
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
    const appError = reportError(error, 'getUserLeaguesOptimized')
    return { data: null, error: appError }
  }
}

// Batch operation for getting league summary data
export async function getLeagueSummaries(
  leagueIds: string[]
): Promise<ApiResponse<Array<{ league_id: string; player_count: number; top_players: LeagueStanding[] }>>> {
  try {
    if (leagueIds.length === 0) {
      return { data: [], error: null }
    }

    // Get all standings for multiple leagues
    const { data: standingsByLeague, error } = await getMultipleLeagueStandings(leagueIds)

    if (error) throw error

    // Create summaries for each league
    const summaries = leagueIds.map(leagueId => {
      const standings = standingsByLeague?.[leagueId] || []
      return {
        league_id: leagueId,
        player_count: standings.length,
        top_players: standings.slice(0, 3), // Top 3 players
      }
    })

    return { data: summaries, error: null }
  } catch (error) {
    const appError = reportError(error, 'getLeagueSummaries')
    return { data: null, error: appError }
  }
}