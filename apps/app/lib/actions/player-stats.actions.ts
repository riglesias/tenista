import { supabase } from '@/lib/supabase'
import { getPlayerMatches } from './matches.actions'

export interface PlayerStatsData {
  leagueRanking?: number
  currentLeague?: {
    id: string
    name: string
    division: string
    points: number
    totalPlayers: number
  }
  matchesPlayed: number
  wins: number
  losses: number
}

interface PlayerInfo {
  name: string
  countryCode: string
  rating?: number
}

export interface MatchData {
  id: string
  date: string
  currentPlayer: PlayerInfo
  opponent: PlayerInfo
  scores: Array<{ player1: number; player2: number }>
  isWin: boolean
  league?: {
    id: string
    name: string
    division: string
  }
  gameType: string
}

export async function getPlayerStats(playerId: string): Promise<{ stats: PlayerStatsData; recentMatches: MatchData[] }> {
  try {
    const { data: matches } = await getPlayerMatches(playerId)
    
    if (!matches) {
      return {
        stats: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
        },
        recentMatches: [],
      }
    }

    // Calculate overall stats
    const matchesPlayed = matches.length
    const wins = matches.filter(match => match.winner_id === playerId).length
    const losses = matchesPlayed - wins

    // Get current league information
    let currentLeague: PlayerStatsData['currentLeague'] = undefined
    let leagueRanking: number | undefined = undefined

    try {
      // First, get the player's current active leagues
      const { data: leaguePlayerData } = await supabase
        .from('league_players')
        .select('league_id, points, matches_played, wins, losses')
        .eq('player_id', playerId)
        .order('points', { ascending: false })
        .limit(1)
        .single()

      if (leaguePlayerData) {
        // Get the league details
        const { data: league } = await supabase
          .from('leagues')
          .select('id, name, division, is_active')
          .eq('id', leaguePlayerData.league_id)
          .eq('is_active', true)
          .single()

        if (league) {
          // Get all players in this league to calculate ranking
          const { data: allLeaguePlayers } = await supabase
            .from('league_players')
            .select('player_id, points, wins')
            .eq('league_id', league.id)
            .order('points', { ascending: false })
            .order('wins', { ascending: false })

          if (allLeaguePlayers) {
            // Find the player's position in the league
            const playerIndex = allLeaguePlayers.findIndex((lp: { player_id: string; points: number; wins: number }) => lp.player_id === playerId)
            leagueRanking = playerIndex >= 0 ? playerIndex + 1 : undefined

            currentLeague = {
              id: league.id,
              name: league.name,
              division: league.division,
              points: leaguePlayerData.points,
              totalPlayers: allLeaguePlayers.length
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching league data:', error)
    }

    const stats: PlayerStatsData = {
      leagueRanking,
      currentLeague,
      matchesPlayed,
      wins,
      losses,
    }

    // Format recent matches (limit to 10 most recent)
    const recentMatches: MatchData[] = matches.slice(0, 10).map(match => {
      const isPlayer1 = match.player1_id === playerId
      const currentPlayer = isPlayer1 ? match.player1 : match.player2
      const opponent = isPlayer1 ? match.player2 : match.player1
      const isWin = match.winner_id === playerId
      
      // Parse scores from the match scores array
      let matchScores: Array<{ player1: number; player2: number }> = []
      if (match.scores && Array.isArray(match.scores)) {
        matchScores = match.scores as Array<{ player1: number; player2: number }>
      }

      // If we're player2, we need to swap the scores to show from current player's perspective
      let formattedScores = matchScores
      if (!isPlayer1) {
        formattedScores = matchScores.map(set => ({
          player1: set.player2, // Current player's score
          player2: set.player1  // Opponent's score
        }))
      }

      return {
        id: match.id,
        date: match.match_date,
        currentPlayer: {
          name: `${currentPlayer?.first_name || ''} ${currentPlayer?.last_name || ''}`.trim(),
          countryCode: currentPlayer?.country_code || 'US',
          rating: currentPlayer?.rating ? parseFloat(currentPlayer.rating.toString()) : undefined,
        },
        opponent: {
          name: `${opponent?.first_name || ''} ${opponent?.last_name || ''}`.trim(),
          countryCode: opponent?.country_code || 'US',
          rating: opponent?.rating ? parseFloat(opponent.rating.toString()) : undefined,
        },
        scores: formattedScores.length > 0 ? formattedScores : [{ player1: 6, player2: 4 }, { player1: 6, player2: 1 }], // Fallback scores
        isWin,
        league: match.league ? {
          id: match.league.id,
          name: match.league.name,
          division: match.league.division || ''
        } : undefined,
        gameType: match.game_type || 'practice',
      }
    })

    return {
      stats,
      recentMatches,
    }
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return {
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
      recentMatches: [],
    }
  }
} 