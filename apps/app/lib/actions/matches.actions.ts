import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { ApiResponse, reportError } from '@/lib/utils/errors'

type MatchInsert = Database['public']['Tables']['player_matches']['Insert']

export interface MatchScores {
  player1: number
  player2: number
}

export interface SubmitMatchData {
  player1Id: string
  player2Id: string
  matchDate: string
  numberOfSets: 1 | 3 | 5
  gameType: 'practice' | 'competitive'
  matchType: 'singles' | 'doubles'
  scores: MatchScores[]
  leagueId?: string
  competitionType?: 'league' | 'playoff' | 'championship'
  playoffTournamentId?: string
}

export async function submitMatchResult(data: SubmitMatchData, submittedBy: string) {
  try {
    // Validate league if provided
    if (data.leagueId) {
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('name, is_active, start_date, end_date')
        .eq('id', data.leagueId)
        .single()

      if (leagueError || !league) {
        throw new Error('Invalid league selected')
      }

      if (!league.is_active) {
        throw new Error(`League "${league.name}" is not active`)
      }

      // Check if match date falls within league period (skip for playoff matches)
      // Playoff matches can occur outside the regular league season
      if (data.competitionType !== 'playoff') {
        const matchDate = new Date(data.matchDate)
        const startDate = new Date(league.start_date)
        const endDate = new Date(league.end_date)

        if (matchDate < startDate || matchDate > endDate) {
          throw new Error(`Match date must be between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()} for league "${league.name}"`)
        }
      }
    }

    // Calculate winner based on sets won
    const setsWonByPlayer1 = data.scores.filter(set => set.player1 > set.player2).length
    const setsWonByPlayer2 = data.scores.filter(set => set.player2 > set.player1).length
    
    const winnerId = setsWonByPlayer1 > setsWonByPlayer2 ? data.player1Id : data.player2Id

    // Use atomic database function for match submission and league stats update
    const { data: result, error } = await supabase.rpc('submit_match_atomic', {
      p_player1_id: data.player1Id,
      p_player2_id: data.player2Id,
      p_winner_id: winnerId,
      p_match_date: data.matchDate,
      p_number_of_sets: data.numberOfSets,
      p_game_type: data.gameType,
      p_match_type: data.matchType,
      p_scores: data.scores,
      p_submitted_by: submittedBy,
      p_league_id: data.leagueId || null,
      p_competition_type: data.competitionType || null,
      p_playoff_tournament_id: data.playoffTournamentId || null
    })

    if (error) throw error

    // Check if the atomic function succeeded
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to submit match')
    }

    // Trigger notification for the opponent
    try {
      // Get submitter details
      const { data: submitter } = await supabase
        .from('players')
        .select('first_name, last_name, rating')
        .eq('id', submittedBy)
        .single()

      // Get league name if applicable
      let leagueName = null
      if (data.leagueId) {
        const { data: league } = await supabase
          .from('leagues')
          .select('name')
          .eq('id', data.leagueId)
          .single()
        leagueName = league?.name
      }

      // Determine opponent (the player who didn't submit)
      const opponentId = submittedBy === data.player1Id ? data.player2Id : data.player1Id

      // Format scores for display
      const scoresText = data.scores
        .map(set => `${set.player1}-${set.player2}`)
        .join(', ')

      // Send notification to opponent
      const { error: notificationError } = await supabase.functions.invoke(
        'send-match-result-notification',
        {
          body: {
            opponentId,
            submitterName: `${submitter?.first_name} ${submitter?.last_name}`,
            submitterRating: submitter?.rating,
            winnerId,
            scores: scoresText,
            matchType: data.matchType,
            leagueName
          },
          headers: {
            'X-Submitter-Id': submittedBy
          }
        }
      )

      if (notificationError) {
        console.error('Failed to send match result notification:', notificationError)
        // Don't fail the match submission if notification fails
      }
    } catch (notifError) {
      console.error('Error sending match notification:', notifError)
      // Don't fail the match submission if notification fails
    }

    return { 
      data: { 
        id: result.match_id,
        success: true 
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error submitting match result:', error)
    return { data: null, error }
  }
}

export async function getPlayerMatches(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('player_matches')
      .select(`
        *,
        player1:players!player_matches_player1_id_fkey(
          id,
          first_name,
          last_name,
          country_code,
          rating
        ),
        player2:players!player_matches_player2_id_fkey(
          id,
          first_name,
          last_name,
          country_code,
          rating
        ),
        league:leagues(
          id,
          name,
          division
        )
      `)
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .order('match_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching player matches:', error)
    return { data: null, error }
  }
}

export async function getRecentMatchesInCity(cityId: string, limit: number = 3) {
  try {
    // First get all player IDs from the city
    const { data: cityPlayers, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('city_id', cityId)
    
    if (playersError) throw playersError
    
    if (!cityPlayers || cityPlayers.length === 0) {
      return { data: [], error: null }
    }
    
    const playerIds = cityPlayers.map(p => p.id)
    
    // Then get matches where either player is from this city
    const { data, error } = await supabase
      .from('player_matches')
      .select(`
        id,
        match_date,
        winner_id,
        scores,
        game_type,
        league:leagues(
          id,
          name,
          division
        ),
        player1:players!player_matches_player1_id_fkey(
          id,
          first_name,
          last_name,
          nationality_code,
          rating,
          city_id
        ),
        player2:players!player_matches_player2_id_fkey(
          id,
          first_name,
          last_name,
          nationality_code,
          rating,
          city_id
        )
      `)
      .or(`player1_id.in.(${playerIds.join(',')}),player2_id.in.(${playerIds.join(',')})`)
      .order('match_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    // Transform the data to match the expected format
    const transformedData = data?.map(match => ({
      id: match.id,
      date: match.match_date,
      gameType: match.game_type,
      scores: match.scores || [],
      player1: {
        id: match.player1.id,
        name: `${match.player1.first_name} ${match.player1.last_name}`,
        countryCode: match.player1.nationality_code || 'US',
        rating: match.player1.rating,
        isWinner: match.winner_id === match.player1.id
      },
      player2: {
        id: match.player2.id,
        name: `${match.player2.first_name} ${match.player2.last_name}`,
        countryCode: match.player2.nationality_code || 'US',
        rating: match.player2.rating,
        isWinner: match.winner_id === match.player2.id
      },
      league: match.league || undefined
    }))
    
    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching recent city matches:', error)
    return { data: null, error }
  }
}

export async function getPlayerLeagues(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('league_players')
      .select(`
        league:leagues(
          id,
          name,
          division,
          city_id,
          is_active,
          start_date,
          end_date
        )
      `)
      .eq('player_id', playerId)

    if (error) throw error
    return { data: data?.map(item => item.league).filter(Boolean) || [], error: null }
  } catch (error) {
    console.error('Error fetching player leagues:', error)
    return { data: [], error }
  }
}

/**
 * Report a match result for admin review.
 */
export async function reportMatchResult(
  playerMatchId: string,
  reason: string
): Promise<ApiResponse<{ id: string }>> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get player profile
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    if (!player) throw new Error('Player not found');

    // Verify player is a participant in this match
    const { data: match } = await supabase
      .from('player_matches')
      .select('player1_id, player2_id')
      .eq('id', playerMatchId)
      .single();
    if (!match) throw new Error('Match not found');

    if (match.player1_id !== player.id && match.player2_id !== player.id) {
      throw new Error('You are not a participant in this match');
    }

    // Check for existing pending report from this player
    const { data: existingReport } = await supabase
      .from('match_reports')
      .select('id')
      .eq('player_match_id', playerMatchId)
      .eq('reported_by', player.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingReport) {
      throw new Error('You already have a pending report for this match');
    }

    // Insert report
    const { data: report, error } = await supabase
      .from('match_reports')
      .insert({
        player_match_id: playerMatchId,
        reported_by: player.id,
        reason,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { data: { id: report.id }, error: null };
  } catch (error) {
    const appError = reportError(error, 'reportMatchResult');
    return { data: null, error: appError };
  }
}